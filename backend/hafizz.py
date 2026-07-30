"""Hafızz — ZET Mindshare güvenlik katmanı (server-side only)."""

import hashlib
import secrets
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import HTTPException

# ═══════════════════════════════════════════════════
# POLİTİKA — hangi durum ne aksiyona yol açar
# ═══════════════════════════════════════════════════
HAFIZZ_POLICY = {
    # UYARI (notify_suspicious + +10 anomaly, hesap aktif kalır)
    "warn": {
        "anomaly_score_50_74": "Anomali skoru 50-74 aralığına ulaştı",
        "multi_country_3plus": "24 saat içinde 3+ farklı ülkeden giriş",
        "shared_device_3_4": "Aynı cihaz parmakizinde 3-4 farklı hesap",
        "heartbeat_burst_minor": "Kısa sürede çok sayıda heartbeat ihlali (küçük)",
        "fast_task_occasional": "Hız tespiti — görevler çok hızlı tamamlanıyor (hafif)",
    },
    # GEÇİCİ BAN — 7 gün (notify_ban, banned:True)
    "temp_ban_7d": {
        "anomaly_score_90_plus": "Anomali skoru 90+ — otomatik 7 günlük ban",
        "bot_heartbeat_100plus": "100+ heartbeat ihlali — bot script tespiti",
        "shared_device_5plus": "Aynı cihazdan 5+ hesap aynı anda aktif",
    },
    # KALICI BAN (notify_ban, banned:True, ban_reason'a not düş)
    "permanent_ban": {
        "payment_fraud": "Ödeme sahtekarlığı / chargeback kötüye kullanımı",
        "honeypot_confirmed": "Honeypot tetiklendi + aktif hesap eşleşmesi",
        "ceo_manual": "CEO panelinden manuel kalıcı ban",
    },
    # ANOMOLİ SKORLARI (add_anomaly_score çağrılarında kullanılan değerler)
    "score_weights": {
        "shared_device": 20,
        "multi_country": 25,
        "fast_task": 15,
        "heartbeat_violation": 5,
        "ceo_warning": 10,
    },
    # EŞİKLER
    "thresholds": {
        "warn_email": 50,       # Bu skora ulaşınca uyarı e-postası gönder
        "require_2fa": 50,      # 2FA zorunlu hale gelir
        "auto_temp_ban": 90,    # Otomatik geçici ban
        "alert_ceo": 80,        # CEO'ya güvenlik e-postası
    },
}


# ═══════════════════════════════════════════════════
# 1. IP RATE LIMITING (MongoDB-backed, multi-instance safe)
# ═══════════════════════════════════════════════════

async def check_ip_rate_limit(db, ip: str, endpoint: str, limit: int, window_seconds: int):
    """window_seconds içinde limit'i aşarsa 429 fırlatır."""
    now = datetime.now(timezone.utc)
    window_start = now - timedelta(seconds=window_seconds)
    key = f"{ip}:{endpoint}"

    count = await db.hafiz_rate_limits.count_documents({
        "key": key,
        "ts": {"$gte": window_start}
    })

    if count >= limit:
        oldest = await db.hafiz_rate_limits.find_one(
            {"key": key, "ts": {"$gte": window_start}},
            sort=[("ts", 1)]
        )
        wait = window_seconds
        if oldest:
            reset_at = oldest["ts"] + timedelta(seconds=window_seconds)
            wait = max(1, int((reset_at - now).total_seconds()))
        raise HTTPException(
            status_code=429,
            detail=f"Çok fazla istek. {wait} saniye bekleyin.",
            headers={"Retry-After": str(wait)}
        )

    await db.hafiz_rate_limits.insert_one({"key": key, "ts": now})


# ═══════════════════════════════════════════════════
# 2. DEVICE FINGERPRINTING
# ═══════════════════════════════════════════════════

def compute_device_fingerprint(user_agent: str, language: str = "",
                                timezone_str: str = "", platform: str = "", screen: str = "") -> str:
    raw = f"{user_agent}|{language}|{timezone_str}|{platform}|{screen}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32]


async def record_device_login(db, user_id: str, fingerprint: str, ip: str):
    """Cihaz girişini kaydet. Aynı fingerprint 3+ hesapta → hepsini işaretle."""
    now = datetime.now(timezone.utc)
    await db.hafiz_devices.update_one(
        {"user_id": user_id, "fingerprint": fingerprint},
        {
            "$set": {"user_id": user_id, "fingerprint": fingerprint,
                     "last_seen": now, "last_ip": ip},
            "$inc": {"login_count": 1}
        },
        upsert=True
    )
    accounts = await db.hafiz_devices.distinct("user_id", {"fingerprint": fingerprint})
    if len(accounts) >= 3:
        for uid in accounts:
            await add_anomaly_score(db, uid, 20, f"shared_device:{fingerprint[:8]}")
        logging.warning(f"Hafızz: fingerprint {fingerprint[:8]} — {len(accounts)} hesapta")


# ═══════════════════════════════════════════════════
# 3. IP GEOLOCATION
# ═══════════════════════════════════════════════════

async def get_ip_country(ip: str, db) -> Optional[str]:
    """ip-api.com'dan ülke kodu al, 24 saat cache."""
    if not ip or ip in ("127.0.0.1", "::1", "testclient"):
        return None
    cached = await db.hafiz_ip_cache.find_one({"ip": ip})
    if cached:
        cached_at = cached.get("cached_at")
        if cached_at and (datetime.now(timezone.utc) - cached_at).total_seconds() < 86400:
            return cached.get("country")
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip}?fields=countryCode,status")
            data = resp.json()
            if data.get("status") == "success":
                country = data.get("countryCode")
                await db.hafiz_ip_cache.update_one(
                    {"ip": ip},
                    {"$set": {"ip": ip, "country": country, "cached_at": datetime.now(timezone.utc)}},
                    upsert=True
                )
                return country
    except Exception as e:
        logging.warning(f"Hafızz: IP geolocation hatası {ip}: {e}")
    return None


# ═══════════════════════════════════════════════════
# 4. ANOMALY DETECTION
# ═══════════════════════════════════════════════════

async def get_anomaly_score(db, user_id: str) -> int:
    doc = await db.hafiz_anomaly.find_one({"user_id": user_id})
    return min(100, doc.get("score", 0)) if doc else 0


async def add_anomaly_score(db, user_id: str, delta: int, reason: str) -> int:
    now = datetime.now(timezone.utc)
    result = await db.hafiz_anomaly.find_one_and_update(
        {"user_id": user_id},
        {
            "$inc": {"score": delta},
            "$push": {"log": {"$each": [{"reason": reason, "delta": delta, "ts": now}], "$slice": -50}},
            "$set": {"updated_at": now},
            "$setOnInsert": {"user_id": user_id}
        },
        upsert=True,
        return_document=True
    )
    score = min(100, (result.get("score", 0) if result else 0))
    if score >= 100:
        await db.hafiz_anomaly.update_one({"user_id": user_id}, {"$set": {"score": 100}})
    return score


async def check_task_timing(db, user_id: str, task_id: str, elapsed_seconds: float) -> bool:
    """10 saniyenin altında görev tamamlandıysa bot şüphesi."""
    if elapsed_seconds < 10:
        await add_anomaly_score(db, user_id, 15, f"fast_task:{task_id}:{elapsed_seconds:.1f}s")
        return True
    return False


async def check_multi_country_login(db, user_id: str, country: str) -> bool:
    """Son 24 saatte 3+ farklı ülkeden giriş → şüpheli."""
    if not country:
        return False
    now = datetime.now(timezone.utc)
    await db.hafiz_login_locations.insert_one({"user_id": user_id, "country": country, "ts": now})
    pipeline = [
        {"$match": {"user_id": user_id, "ts": {"$gte": now - timedelta(hours=24)}}},
        {"$group": {"_id": "$country"}},
        {"$count": "total"}
    ]
    result = await db.hafiz_login_locations.aggregate(pipeline).to_list(1)
    count = result[0]["total"] if result else 1
    if count >= 3:
        await add_anomaly_score(db, user_id, 25, f"multi_country:{count}_in_24h")
        return True
    return False


# ═══════════════════════════════════════════════════
# 5. SKIN OWNERSHIP IMMUTABLE LOG
# ═══════════════════════════════════════════════════

async def log_skin_transaction(db, skin_id: str, from_user: str, to_user: str,
                                transaction_type: str, price: float = 0.0) -> str:
    log_id = f"stx_{secrets.token_hex(8)}"
    await db.hafiz_skin_log.insert_one({
        "log_id": log_id,
        "skin_id": skin_id,
        "from_user": from_user,
        "to_user": to_user,
        "transaction_type": transaction_type,
        "price": price,
        "ts": datetime.now(timezone.utc),
        "_immutable": True
    })
    return log_id


# ═══════════════════════════════════════════════════
# 6. ACCOUNT PROTECTION — FAILED LOGIN
# ═══════════════════════════════════════════════════

async def record_failed_login(db, identifier: str, ip: str) -> int:
    now = datetime.now(timezone.utc)
    await db.hafiz_failed_logins.insert_one({"identifier": identifier, "ip": ip, "ts": now})
    since = now - timedelta(minutes=15)
    return await db.hafiz_failed_logins.count_documents({"identifier": identifier, "ts": {"$gte": since}})


async def is_login_locked(db, identifier: str) -> bool:
    since = datetime.now(timezone.utc) - timedelta(minutes=15)
    count = await db.hafiz_failed_logins.count_documents({"identifier": identifier, "ts": {"$gte": since}})
    return count >= 5


async def clear_failed_logins(db, identifier: str):
    await db.hafiz_failed_logins.delete_many({"identifier": identifier})


# ═══════════════════════════════════════════════════
# 7. SECURITY EMAILS
# ═══════════════════════════════════════════════════

async def send_security_email(to_email: str, subject: str, message: str):
    import resend as _resend
    import os
    _resend.api_key = os.environ.get("RESEND_API_KEY", "")
    sender = os.environ.get("SENDER_EMAIL", "ZET Mindshare <help@zetstudiointl.com>")
    html = f"""<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#070916;">
<table width="100%" cellspacing="0" cellpadding="0" bgcolor="#070916">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <tr><td style="background:#0a0e22;border-radius:14px 14px 0 0;padding:22px 44px;text-align:center;border-bottom:2px solid #f59e0b;">
    <span style="font-size:20px;font-weight:900;color:#ffffff;letter-spacing:2px;font-family:Helvetica,Arial,sans-serif;">ZET</span>
    <span style="font-size:10px;font-weight:700;color:#f59e0b;letter-spacing:5px;margin-left:8px;text-transform:uppercase;vertical-align:2px;font-family:Helvetica,Arial,sans-serif;">MINDSHARE</span>
  </td></tr>
  <tr><td style="background:#090c20;padding:44px 44px 40px;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);">
    <p style="margin:0 0 20px;text-align:center;">
      <span style="display:inline-block;width:52px;height:52px;border-radius:14px;background:#1a1000;border:1px solid #f59e0b40;line-height:52px;font-size:22px;text-align:center;color:#f59e0b;">&#9888;</span>
    </p>
    <p style="margin:0 0 16px;text-align:center;">
      <span style="display:inline-block;background:#1a1000;border:1px solid #f59e0b44;border-radius:20px;padding:5px 16px;font-size:11px;font-weight:700;color:#f59e0b;letter-spacing:1.5px;font-family:Helvetica,Arial,sans-serif;">GUVENLiK BiLDiRiMi</span>
    </p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#ffffff;line-height:1.35;text-align:center;font-family:Helvetica,Arial,sans-serif;">{subject}</h1>
    <p style="margin:0 0 28px;font-size:14px;color:#9ca3af;line-height:1.75;text-align:center;">{message}</p>
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-bottom:32px;">
    <tr><td style="background:#1a1000;border-radius:12px;border:1px solid #f59e0b2e;padding:14px 18px;">
      <p style="margin:0;font-size:13px;color:#f5c85a;line-height:1.65;text-align:center;">Bu islemler size ait degilse sifrenizi hemen degistirin. Yardim: <a href="mailto:help@zetstudiointl.com" style="color:#f59e0b;text-decoration:none;">help@zetstudiointl.com</a></p>
    </td></tr>
    </table>
    <table width="100%" cellspacing="0" cellpadding="0"><tr>
      <td align="center" style="padding-right:8px;">
        <a href="https://app.zetstudiointl.com/dashboard" style="display:inline-block;background:#f59e0b;color:#0a0600;padding:13px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;font-family:Helvetica,Arial,sans-serif;">Hesabima Git</a>
      </td>
      <td align="center" style="padding-left:8px;">
        <a href="mailto:help@zetstudiointl.com" style="display:inline-block;background:transparent;color:#f59e0b;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;font-weight:700;font-family:Helvetica,Arial,sans-serif;border:1px solid #f59e0b44;">Itiraz Et</a>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:#060813;border-radius:0 0 14px 14px;padding:18px 44px;border-left:1px solid rgba(255,255,255,0.04);border-right:1px solid rgba(255,255,255,0.04);border-bottom:1px solid rgba(255,255,255,0.04);">
    <p style="margin:0 0 3px;font-size:11px;color:#2d3352;text-align:center;font-weight:600;letter-spacing:1.5px;font-family:Helvetica,Arial,sans-serif;">ZET STUDIO INTERNATIONAL</p>
    <p style="margin:0;font-size:11px;color:#2d3352;text-align:center;font-family:Helvetica,Arial,sans-serif;">Bu e-posta ZET Mindshare Hafizz guvenlik sistemi tarafindan otomatik gonderilmistir.</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>"""
    try:
        _resend.Emails.send({
            "from": sender,
            "to": to_email,
            "subject": subject,
            "html": html,
        })
    except Exception as e:
        logging.warning(f"Hafızz: güvenlik e-postası gönderilemedi {to_email}: {e}")


async def notify_lockout(db, identifier: str):
    user = await db.users.find_one({"$or": [{"user_id": identifier}, {"email": identifier}]}, {"email": 1, "name": 1})
    if not user:
        return
    await send_security_email(
        user["email"],
        "ZET Hesabınız Geçici Olarak Kilitlendi",
        f"Merhaba {user.get('name', '')}, hesabınıza ardarda başarısız giriş denemeleri yapıldı. "
        "Hesabınız 15 dakika boyunca kilitlenmiştir. Bu siz değilseniz şifrenizi değiştirmenizi öneririz."
    )


async def notify_suspicious(db, user_id: str, reason: str):
    user = await db.users.find_one({"user_id": user_id}, {"email": 1, "name": 1})
    if not user:
        return
    await send_security_email(
        user["email"],
        "ZET Hesabınızda Şüpheli Aktivite Tespit Edildi",
        f"Merhaba {user.get('name', '')}, hesabınızda şüpheli aktivite tespit edildi: <b>{reason}</b>. "
        "Bu işlemler size ait değilse lütfen help@zetstudiointl.com adresine yazın."
    )


async def notify_ban(db, user_id: str, reason: str):
    user = await db.users.find_one({"user_id": user_id}, {"email": 1, "name": 1})
    if not user:
        return
    await send_security_email(
        user["email"],
        "ZET Hesabınız Askıya Alındı",
        f"Merhaba {user.get('name', '')}, hesabınız şu sebeple askıya alınmıştır: <b>{reason}</b>. "
        "İtiraz için help@zetstudiointl.com adresine yazabilirsiniz."
    )


# ═══════════════════════════════════════════════════
# 8. 2FA
# ═══════════════════════════════════════════════════

def generate_2fa_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"


async def store_2fa_code(db, user_id: str, code: str):
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)
    await db.hafiz_2fa.update_one(
        {"user_id": user_id},
        {"$set": {"user_id": user_id, "code": code, "expires_at": expires, "used": False}},
        upsert=True
    )


async def verify_2fa_code(db, user_id: str, code: str) -> bool:
    doc = await db.hafiz_2fa.find_one({"user_id": user_id, "used": False})
    if not doc:
        return False
    if doc.get("expires_at", datetime.min.replace(tzinfo=timezone.utc)) < datetime.now(timezone.utc):
        return False
    if doc.get("code") != code:
        return False
    await db.hafiz_2fa.update_one({"user_id": user_id}, {"$set": {"used": True}})
    return True


async def requires_2fa(db, user_id: str) -> bool:
    return await get_anomaly_score(db, user_id) >= 50


# ═══════════════════════════════════════════════════
# 9. HONEYPOT
# ═══════════════════════════════════════════════════

async def record_honeypot_hit(db, ip: str, path: str, user_agent: str = ""):
    now = datetime.now(timezone.utc)
    await db.hafiz_bans.update_one(
        {"type": "ip", "value": ip},
        {"$set": {
            "type": "ip", "value": ip, "reason": f"honeypot:{path}",
            "banned_at": now, "ban_until": now + timedelta(hours=24),
            "user_agent": user_agent[:200]
        }},
        upsert=True
    )
    logging.warning(f"Hafızz Honeypot: IP {ip} banlı — {path}")


async def is_ip_banned(db, ip: str) -> bool:
    doc = await db.hafiz_bans.find_one({
        "type": "ip", "value": ip,
        "ban_until": {"$gt": datetime.now(timezone.utc)}
    })
    return doc is not None


# ═══════════════════════════════════════════════════
# 10. MONGODB INDEXES
# ═══════════════════════════════════════════════════

async def setup_indexes(db):
    try:
        await db.hafiz_rate_limits.create_index("ts", expireAfterSeconds=3600)
        await db.hafiz_rate_limits.create_index("key")
        await db.hafiz_failed_logins.create_index("ts", expireAfterSeconds=3600)
        await db.hafiz_failed_logins.create_index("identifier")
        await db.hafiz_devices.create_index([("user_id", 1), ("fingerprint", 1)], unique=True)
        await db.hafiz_devices.create_index("fingerprint")
        await db.hafiz_ip_cache.create_index("cached_at", expireAfterSeconds=86400)
        await db.hafiz_ip_cache.create_index("ip", unique=True)
        await db.hafiz_login_locations.create_index("ts", expireAfterSeconds=172800)
        await db.hafiz_login_locations.create_index([("user_id", 1), ("ts", -1)])
        await db.hafiz_anomaly.create_index("user_id", unique=True)
        await db.hafiz_2fa.create_index("expires_at", expireAfterSeconds=600)
        await db.hafiz_2fa.create_index("user_id", unique=True)
        await db.hafiz_bans.create_index([("type", 1), ("value", 1)])
        await db.hafiz_bans.create_index("ban_until", expireAfterSeconds=0)
        await db.hafiz_skin_log.create_index("skin_id")
        await db.hafiz_skin_log.create_index([("from_user", 1), ("ts", -1)])
        await db.hafiz_skin_log.create_index([("to_user", 1), ("ts", -1)])
        # Existing collections (task spec)
        await db.user_sessions.create_index([("user_id", 1), ("last_seen", 1)])
        await db.hafiz_anomaly.create_index([("user_id", 1)])
        logging.info("Hafızz: indexler oluşturuldu")
    except Exception as e:
        logging.warning(f"Hafızz: index hatası (non-fatal): {e}")
