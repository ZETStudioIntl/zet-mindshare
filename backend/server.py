from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Body, Query, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uuid
import secrets
from datetime import datetime, timezone, timedelta
import base64
import asyncio
import resend
import json
from google import genai as google_genai
from google.genai import types as genai_types
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded
    _RATE_LIMIT_AVAILABLE = True
except ImportError:
    _RATE_LIMIT_AVAILABLE = False

try:
    from better_profanity import profanity as _profanity_lib
    _profanity_lib.load_censor_words()
    _PROFANITY_AVAILABLE = True
except ImportError:
    _PROFANITY_AVAILABLE = False

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
users_collection = db.users
docs_collection = db.documents

app = FastAPI()
CEO_EMAIL = "muhammadbahaddinyilmaz@gmail.com"
ADMIN_EMAILS = {"info@zetstudiointl.com", "support@zetstudiointl.com", "ideas@zetstudiointl.com"}
api_router = APIRouter(prefix="/api")

# ============ RATE LIMITING ============
if _RATE_LIMIT_AVAILABLE:
    limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ============ PROFANITY FILTER ============
EXTRA_BANNED_TR = [
    "orospu", "amk", "bok", "sik", "pic", "göt", "piç", "oç", "kahpe",
    "ibne", "bok", "lan", "yarrak", "sikerim", "amına", "orospu",
]

def contains_profanity(text: str) -> bool:
    if not text:
        return False
    tl = text.lower()
    if any(w in tl for w in EXTRA_BANNED_TR):
        return True
    if _PROFANITY_AVAILABLE:
        return _profanity_lib.contains_profanity(text)
    return False

def sanitize_text(text: str, max_len: int = 2000) -> str:
    """Temel XSS / injection temizliği + uzunluk sınırı."""
    import re, html
    if not text:
        return ""
    text = html.escape(text[:max_len])
    text = re.sub(r'javascript:', '', text, flags=re.IGNORECASE)
    text = re.sub(r'on\w+\s*=', '', text, flags=re.IGNORECASE)
    return text.strip()

# ── Basit in-memory rate limiter ──────────────────────────────────────────────
_rl_store: dict = {}  # { "{user_id}:{action}": [timestamp, ...] }

def check_rate_limit(user_id: str, action: str, limit: int, window: int):
    """window saniye içinde limit kadar istek geçince 429 fırlatır."""
    import time
    key = f"{user_id}:{action}"
    now = time.time()
    timestamps = [t for t in _rl_store.get(key, []) if now - t < window]
    if len(timestamps) >= limit:
        raise HTTPException(status_code=429, detail=f"Çok fazla istek. Lütfen {window} saniye bekleyin.")
    timestamps.append(now)
    _rl_store[key] = timestamps

# ============ GEMINI RETRY HELPER ============

async def gemini_generate(client, model: str, contents, config, max_retries: int = 3):
    """generate_content wrapper with retry on 503 (overloaded)."""
    import time
    last_exc = None
    for attempt in range(1, max_retries + 1):
        try:
            return await asyncio.to_thread(
                client.models.generate_content,
                model=model,
                contents=contents,
                config=config,
            )
        except Exception as e:
            last_exc = e
            err_str = str(e).lower()
            if "503" in err_str or "overloaded" in err_str or "service unavailable" in err_str:
                if attempt < max_retries:
                    logging.warning(f"Gemini 503, deneme {attempt}/{max_retries} — 3s bekleniyor")
                    await asyncio.sleep(3)
                    continue
            raise  # non-503 hataları direkt fırlat
    raise last_exc

# ============ MODELS ============

def normalize_subscription(sub: Any) -> Dict[str, Any]:
    """Subscription'ı her zaman dict formatına normalize et."""
    if sub is None:
        return {"plan": "free", "status": "active"}
    if isinstance(sub, str):
        return {"plan": sub if sub else "free", "status": "active"}
    if isinstance(sub, dict):
        return sub
    return {"plan": "free", "status": "active"}

def sanitize_user_doc(user: dict) -> dict:
    """MongoDB user belgesini Pydantic User modeline geçmeden önce güvenli hale getirir."""
    u = dict(user)
    u.pop("_id", None)

    # Subscription alanlarını normalize et
    for field in ("subscription", "mindshare_subscription", "judge_subscription"):
        if field in u:
            u[field] = normalize_subscription(u[field])

    # Geriye dönük uyumluluk: eski alanlar → yeni alanlar
    u.setdefault("mindshare_credits", u.get("credits", 0))
    u.setdefault("judge_credits", 0)
    u.setdefault("mindshare_rank", u.get("rank", "iron"))
    u.setdefault("judge_rank", "iron")
    u.setdefault("mindshare_xp", u.get("quest_xp", u.get("xp", 0)))
    u.setdefault("judge_xp", 0)
    u.setdefault("zc_balance", u.get("sp_balance", 0))
    u.setdefault("name", "")
    u.setdefault("bio", "")

    # Sayısal alanları int'e zorla
    for int_field in ("credits", "bonus_credits", "sp_balance", "zc_balance",
                      "xp", "quest_xp", "mindshare_credits", "judge_credits",
                      "mindshare_xp", "judge_xp", "followers_count", "following_count",
                      "active_time_seconds"):
        if int_field in u:
            try:
                u[int_field] = int(u[int_field])
            except (TypeError, ValueError):
                u[int_field] = 0

    # Bool alanlarını normalize et
    for bool_field in ("picture_custom", "name_custom", "creative_station",
                       "identity_verified", "needs_onboarding", "cancel_pending"):
        if bool_field in u:
            u[bool_field] = bool(u[bool_field])

    return u


class User(BaseModel):
    model_config = {"extra": "ignore", "arbitrary_types_allowed": True}

    # Sadece bunlar zorunlu
    user_id: str
    email: str

    # Profil
    name: Optional[str] = ""
    picture: Optional[str] = None
    username: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = ""
    picture_custom: Optional[bool] = False
    name_custom: Optional[bool] = False

    # Subscription — sanitize_user_doc() tarafından normalize edilmiş dict gelir
    subscription: Optional[Dict[str, Any]] = None
    subscription_date: Optional[Any] = None
    cancel_pending: Optional[bool] = False
    cancel_requested_at: Optional[str] = None
    cancel_token: Optional[str] = None

    # Mindshare specific
    mindshare_credits: Optional[int] = 0
    mindshare_subscription: Optional[Dict[str, Any]] = None
    mindshare_settings: Optional[Any] = None
    mindshare_rank: Optional[str] = "iron"
    mindshare_xp: Optional[int] = 0

    # Judge specific
    judge_credits: Optional[int] = 0
    judge_subscription: Optional[Dict[str, Any]] = None
    judge_settings: Optional[Any] = None
    judge_rank: Optional[str] = "iron"
    judge_xp: Optional[int] = 0

    # Eski alanlar — geriye dönük uyumluluk
    credits: Optional[int] = 0
    bonus_credits: Optional[int] = 0
    sp_balance: Optional[int] = 0
    zc_balance: Optional[int] = 0
    rank: Optional[str] = "iron"
    xp: Optional[int] = 0
    quest_xp: Optional[int] = 0
    completed_quests: Optional[List[Any]] = []

    # Creative Station
    creative_station: Optional[bool] = False
    cs_expires_at: Optional[str] = None

    # Social
    verified_type: Optional[str] = None
    following: Optional[List[Any]] = []
    followers: Optional[List[Any]] = []
    following_count: Optional[int] = 0
    followers_count: Optional[int] = 0
    identity_verified: Optional[bool] = False

    # Activity
    active_time_seconds: Optional[int] = 0
    last_heartbeat: Optional[str] = None
    created_at: Optional[Any] = None
    needs_onboarding: Optional[bool] = False

class Document(BaseModel):
    doc_id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    doc_type: str = "document"
    content: dict = Field(default_factory=dict)
    pages: List[dict] = Field(default_factory=lambda: [{"page_id": "page_1", "content": {}}])
    pinned: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DocumentCreate(BaseModel):
    title: str
    doc_type: str = "document"
    file_data: Optional[str] = None  # Base64 PDF data for editing

class NoteCreate(BaseModel):
    content: str
    reminder_time: Optional[str] = None  # ISO datetime string for alarm

class SubscriptionUpdate(BaseModel):
    plan: str  # 'free', 'plus', 'pro', 'ultra'
    action: str  # 'subscribe' or 'cancel'

class SubscriptionCreate(BaseModel):
    plan: str                       # pro, ultra, creative_station, entertainment_pocket
    billing_cycle: str = "monthly"  # monthly, yearly
    payment_provider: str           # lemonsqueezy, stripe
    external_subscription_id: str

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    content: Optional[dict] = None
    pages: Optional[List[dict]] = None
    pinned: Optional[bool] = None

class QuickNote(BaseModel):
    note_id: str = Field(default_factory=lambda: f"note_{uuid.uuid4().hex[:12]}")
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuickNoteCreate(BaseModel):
    content: str
    reminder_time: Optional[str] = None
    notebook_id: Optional[str] = None

class NoteContentUpdate(BaseModel):
    content: str

class NotebookCreate(BaseModel):
    name: str
    color: Optional[str] = "#292F91"

class NotebookUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    pinned: Optional[bool] = None
    order: Optional[int] = None

class NotebookSetPassword(BaseModel):
    password: str

class NotebookVerifyPassword(BaseModel):
    password: str

class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ZetaChatRequest(BaseModel):
    message: str
    doc_id: Optional[str] = None
    session_id: Optional[str] = None
    document_content: Optional[str] = None  # Text content of the current document
    image: Optional[str] = None  # Base64 image data
    mode: Optional[str] = "fast"  # 'fast' or 'deep' for Judge
    mood: Optional[str] = "professional"  # cheerful, professional, curious, custom
    emoji_level: Optional[str] = "medium"  # none, low, medium, high
    custom_prompt: Optional[str] = ""  # Custom prompt for ZETA
    personality: Optional[str] = "normal"  # normal, harsh for Judge
    is_ceo: Optional[bool] = False

class ZetaAutoWriteRequest(BaseModel):
    prompt: str
    page_count: int = 1
    writing_style: str = "profesyonel"  # akademik, yaratici, resmi, gunluk, hikaye, profesyonel

class ZetaDeepAnalysisRequest(BaseModel):
    topic: str
    document_content: Optional[str] = None

class ZetaImageRequest(BaseModel):
    prompt: str
    reference_image: Optional[str] = None
    pro: Optional[bool] = False
    aspect_ratio: Optional[str] = "16:9"

class TranslateRequest(BaseModel):
    text: str
    target_language: str

class ShareLinkCreate(BaseModel):
    permission: str = "view"  # "view" or "edit"
    expires_hours: Optional[int] = None

class CommentCreate(BaseModel):
    content: str
    element_id: Optional[str] = None
    x: Optional[float] = None
    y: Optional[float] = None
    page_index: Optional[int] = 0

class CommentReply(BaseModel):
    content: str

class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

# ============ COLLABORATION WEBSOCKET MANAGER ============

class CollaborationManager:
    def __init__(self):
        self.active_rooms: Dict[str, Dict[str, dict]] = {}  # doc_id -> {user_id: {ws, user_info}}

    async def connect(self, doc_id: str, user_id: str, user_name: str, ws: WebSocket):
        await ws.accept()
        if doc_id not in self.active_rooms:
            self.active_rooms[doc_id] = {}
        color = f"hsl({hash(user_id) % 360}, 70%, 60%)"
        self.active_rooms[doc_id][user_id] = {
            "ws": ws, "name": user_name, "color": color,
            "cursor": None, "connected_at": datetime.now(timezone.utc).isoformat()
        }
        # Notify others
        await self.broadcast(doc_id, user_id, {
            "type": "user_joined",
            "user_id": user_id, "name": user_name, "color": color,
            "users": self._get_users(doc_id)
        })

    def disconnect(self, doc_id: str, user_id: str):
        if doc_id in self.active_rooms:
            self.active_rooms[doc_id].pop(user_id, None)
            if not self.active_rooms[doc_id]:
                del self.active_rooms[doc_id]

    async def broadcast(self, doc_id: str, sender_id: str, message: dict):
        if doc_id not in self.active_rooms:
            return
        dead = []
        for uid, info in self.active_rooms[doc_id].items():
            if uid == sender_id:
                continue
            try:
                await info["ws"].send_json(message)
            except Exception:
                dead.append(uid)
        for uid in dead:
            self.active_rooms[doc_id].pop(uid, None)

    def _get_users(self, doc_id: str):
        if doc_id not in self.active_rooms:
            return []
        return [{"user_id": uid, "name": info["name"], "color": info["color"]}
                for uid, info in self.active_rooms[doc_id].items()]

    def get_online_count(self, doc_id: str):
        return len(self.active_rooms.get(doc_id, {}))

collab_manager = CollaborationManager()

# ============ EMAIL HELPER ============

resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "ZET Mindshare <info@zetstudiointl.com>")

async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send email using Resend API"""
    try:
        params = {
            "from": SENDER_EMAIL,
            "to": [to_email],
            "subject": subject,
            "html": html_content
        }
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent to {to_email}: {result}")
        return {"success": True, "email_id": result.get("id")}
    except Exception as e:
        logging.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}

# ============ SUBSCRIPTION HELPERS ============

def is_active_subscriber(user_data: dict) -> bool:
    """Kullanıcının aktif ücretli aboneliği var mı?
    Hem eski (string) hem yeni (dict) subscription formatını destekler."""
    if not user_data:
        return False
    sub = user_data.get("subscription")
    if not sub:
        return False
    # Yeni format: subscription bir dict, status alanı var
    if isinstance(sub, dict):
        plan = sub.get("plan", "free")
        status = sub.get("status", "inactive")
        return plan != "free" and status == "active"
    # Eski format: subscription bir string (plan adı)
    return sub != "free"

def get_plan_name(user_data: dict) -> str:
    """Her iki formattan plan adını döndür."""
    if not user_data:
        return "free"
    sub = user_data.get("subscription", "free")
    if isinstance(sub, dict):
        return sub.get("plan", "free")
    return sub if sub else "free"

# ============ AUTH HELPERS ============

import bcrypt as _bcrypt

def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(password.encode(), hashed.encode())
    except Exception:
        # Backward compat: old SHA-256 hashes
        import hashlib
        return hashlib.sha256(password.encode()).hexdigest() == hashed

async def get_current_user(request: Request) -> User:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]

    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session.get("expires_at")
    if not expires_at:
        raise HTTPException(status_code=401, detail="Invalid session")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    raw = await db.users.find_one({"user_id": session["user_id"]})
    if not raw:
        raise HTTPException(status_code=401, detail="User not found")

    # DB verisini Pydantic'e geçmeden önce tam normalize et
    user = sanitize_user_doc(raw)

    try:
        return User(**user)
    except Exception as e:
        logging.error(f"User validation error user_id={session['user_id']}: {e}")
        return User(user_id=user["user_id"], email=user.get("email", ""))

async def get_current_user_raw(request: Request) -> dict:
    """Pydantic olmadan sanitize edilmiş kullanıcı dict döner; subscription tip çakışması yaşanan endpoint'lerde kullan."""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session.get("expires_at")
    if not expires_at:
        raise HTTPException(status_code=401, detail="Invalid session")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    raw = await db.users.find_one({"user_id": session["user_id"]})
    if not raw:
        raise HTTPException(status_code=401, detail="User not found")
    return sanitize_user_doc(raw)

# ============ AUTH ROUTES ============

@api_router.get("/auth/google")
async def google_auth_init():
    """Redirect user to Google OAuth2 consent screen (PKCE olmadan standart flow)."""
    from requests_oauthlib import OAuth2Session
    from fastapi.responses import RedirectResponse
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    if not client_id:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID .env dosyasına eklenmeli")
    backend_url = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8001")
    redirect_uri = f"{backend_url}/api/auth/google/callback"
    scopes = [
        "openid",
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile"
    ]
    oauth = OAuth2Session(client_id=client_id, redirect_uri=redirect_uri, scope=scopes)
    auth_url, _ = oauth.authorization_url(
        "https://accounts.google.com/o/oauth2/auth",
        access_type="offline",
        prompt="consent"
    )
    return RedirectResponse(auth_url)


@api_router.get("/auth/google/callback")
async def google_auth_callback(request: Request, response: Response, code: str = Query(None), state: str = Query(None), error: str = Query(None)):
    """Handle Google OAuth2 callback — token exchange, session oluştur, frontend'e yönlendir."""
    from requests_oauthlib import OAuth2Session
    from fastapi.responses import RedirectResponse, HTMLResponse
    import requests as pyrequests

    # Allow insecure transport only in non-production environments
    if not os.getenv("REACT_APP_BACKEND_URL", "").startswith("https"):
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"

    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

    if error or not code:
        logging.error(f"Google OAuth error param: {error}")
        return RedirectResponse(f"{frontend_url}/?error=google_auth_failed")

    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    backend_url = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8001")
    redirect_uri = f"{backend_url}/api/auth/google/callback"

    try:
        oauth = OAuth2Session(client_id=client_id, redirect_uri=redirect_uri, state=state)
        token = oauth.fetch_token(
            "https://oauth2.googleapis.com/token",
            client_secret=client_secret,
            code=code
        )
        userinfo_resp = pyrequests.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {token['access_token']}"}
        )
        userinfo = userinfo_resp.json()

        email = userinfo.get("email")
        name = userinfo.get("name", email.split("@")[0] if email else "User")
        picture = userinfo.get("picture")

        if not email:
            return RedirectResponse(f"{frontend_url}/?error=no_email")

        # Admin panel redirect flow
        if state == "admin_console":
            if email == CEO_EMAIL:
                ceo_token = f"ceo_{uuid.uuid4().hex}"
                await db.ceo_tokens.insert_one({
                    "token": ceo_token,
                    "email": email,
                    "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
                })
                return RedirectResponse(f"{frontend_url}/auth-callback#ceo_token={ceo_token}")
            elif email in ADMIN_EMAILS:
                admin_token = f"adm_{uuid.uuid4().hex}"
                await db.ceo_tokens.insert_one({
                    "token": admin_token,
                    "email": email,
                    "role": "admin",
                    "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat()
                })
                return RedirectResponse(f"{frontend_url}/auth-callback#admin_token={admin_token}")
            else:
                return RedirectResponse(f"{frontend_url}/auth-callback#ceo_error=access_denied")

        # KRİTİK: Email'i daima küçük harfe çevir (Google bazen farklı case dönebilir)
        email = email.lower().strip()

        # Adım 1: Email'e göre mevcut kullanıcıyı ara
        existing_user = await db.users.find_one({"email": email}, {"_id": 0})

        if existing_user:
            # Mevcut kullanıcı — user_id'yi ASLA değiştirme
            user_id = existing_user["user_id"]
            logging.info(f"Google OAuth: mevcut kullanıcı bulundu email={email} user_id={user_id}")

            oauth_update = {}
            if not existing_user.get("name_custom"):
                oauth_update["name"] = name
            if not existing_user.get("picture_custom"):
                oauth_update["picture"] = picture
            if not existing_user.get("username"):
                oauth_update["username"] = await generate_unique_username(email.split("@")[0])
            if email == CEO_EMAIL and not existing_user.get("verified_type"):
                oauth_update["verified_type"] = "red"
            if oauth_update:
                await db.users.update_one({"user_id": user_id}, {"$set": oauth_update})
        else:
            # Yeni kullanıcı — yeni user_id üret
            user_id = f"user_{secrets.token_hex(6)}"
            username = await generate_unique_username(email.split("@")[0])
            verified_type = "red" if email == CEO_EMAIL else None
            trial_end = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "username": username,
                "display_name": name,
                "bio": "",
                "verified_type": verified_type,
                "followers": [],
                "following": [],
                "followers_count": 0,
                "following_count": 0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "needs_onboarding": True,
                "subscription": {"plan": "pro", "status": "active", "trial": True, "trial_end": trial_end},
            })
            logging.info(f"Google OAuth: yeni kullanıcı oluşturuldu email={email} user_id={user_id}")

        # Adım 2: Session oluşturmadan önce user_id'yi DB'den doğrula
        # (yarış durumu veya DB tutarsızlığı ihtimaline karşı)
        verified = await db.users.find_one({"user_id": user_id}, {"_id": 0, "user_id": 1})
        if not verified:
            # user_id ile bulunamazsa email'e göre fallback
            fallback = await db.users.find_one({"email": email}, {"_id": 0, "user_id": 1})
            if fallback:
                user_id = fallback["user_id"]
                logging.warning(f"Google OAuth: user_id fallback email={email} → {user_id}")
            else:
                logging.error(f"Google OAuth: kullanıcı oluşturulamadı email={email}")
                return RedirectResponse(f"{frontend_url}/?error=user_creation_failed")

        # Adım 3: Session oluştur
        session_token = f"st_{secrets.token_hex(16)}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return RedirectResponse(f"{frontend_url}/auth-callback#token={session_token}")

    except Exception as e:
        logging.error(f"Google OAuth callback error: {e}", exc_info=True)
        return RedirectResponse(f"{frontend_url}/?error=google_auth_failed")

@api_router.get("/auth/admin-google")
async def admin_google_auth():
    """Admin panel login — login sayfasıyla aynı redirect akışını kullanır, state=admin_console."""
    from requests_oauthlib import OAuth2Session
    from fastapi.responses import RedirectResponse
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    backend_url = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8001")
    redirect_uri = f"{backend_url}/api/auth/google/callback"
    scopes = ["openid", "https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"]
    oauth = OAuth2Session(client_id=client_id, redirect_uri=redirect_uri, scope=scopes)
    auth_url, _ = oauth.authorization_url(
        "https://accounts.google.com/o/oauth2/auth",
        access_type="offline",
        prompt="select_account",
        state="admin_console"
    )
    return RedirectResponse(auth_url)

@api_router.get("/auth/admin-verify")
async def admin_verify_token(token: str = Query(...)):
    """CEO token doğrulama — tek kullanımlık, 5 dakika geçerliliği var."""
    now = datetime.now(timezone.utc)
    record = await db.ceo_tokens.find_one({"token": token})
    if not record:
        raise HTTPException(status_code=403, detail="Geçersiz token")
    exp = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
    if now > exp:
        await db.ceo_tokens.delete_one({"token": token})
        raise HTTPException(status_code=403, detail="Token süresi dolmuş")
    await db.ceo_tokens.delete_one({"token": token})  # tek kullanımlık
    return {"success": True, "email": record["email"]}

class AdminPinRequest(BaseModel):
    pin: str

@api_router.post("/auth/admin-verify-pin")
async def admin_verify_pin(body: AdminPinRequest):
    """İkinci faktör — PIN doğrulama. CEO_PIN env var ile karşılaştırılır."""
    ceo_pin = os.environ.get("CEO_PIN", "")
    if not ceo_pin:
        raise HTTPException(status_code=503, detail="PIN sistemi yapılandırılmamış.")
    if body.pin != ceo_pin:
        raise HTTPException(status_code=403, detail="Yanlış PIN.")
    return {"success": True}

@api_router.get("/auth/admin-verify-admin")
async def admin_verify_admin_token(token: str = Query(...)):
    """Admin token doğrulama — tek kullanımlık, 5 dakika geçerliliği var."""
    now = datetime.now(timezone.utc)
    record = await db.ceo_tokens.find_one({"token": token})
    if not record:
        raise HTTPException(status_code=403, detail="Geçersiz token")
    if record.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Bu token admin yetkisi içermiyor")
    exp = datetime.fromisoformat(record["expires_at"].replace("Z", "+00:00"))
    if now > exp:
        await db.ceo_tokens.delete_one({"token": token})
        raise HTTPException(status_code=403, detail="Token süresi dolmuş")
    await db.ceo_tokens.delete_one({"token": token})  # tek kullanımlık
    return {"success": True, "email": record["email"]}

@api_router.get("/auth/admin-console")
async def admin_console_auth():
    """Eski popup akışı — geriye dönük uyumluluk için tutuldu, artık kullanılmıyor."""
    return RedirectResponse(f"/api/auth/admin-google")

@api_router.get("/auth/admin-console/callback")
async def admin_console_callback(request: Request, code: str = Query(None), state: str = Query(None), error: str = Query(None)):
    """Admin console OAuth callback — sonucu popup'a postMessage ile iletir."""
    from fastapi.responses import HTMLResponse
    import requests as pyrequests
    from requests_oauthlib import OAuth2Session
    if not os.getenv("REACT_APP_BACKEND_URL", "").startswith("https"):
        os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"
    if error or not code:
        return HTMLResponse('<script>window.opener&&window.opener.postMessage({ceoVerified:false},"*");window.close();</script>')
    try:
        client_id = os.getenv("GOOGLE_CLIENT_ID")
        client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
        backend_url = os.getenv("REACT_APP_BACKEND_URL", "http://localhost:8001")
        redirect_uri = f"{backend_url}/api/auth/admin-console/callback"
        oauth = OAuth2Session(client_id=client_id, redirect_uri=redirect_uri, state=state)
        token = oauth.fetch_token("https://oauth2.googleapis.com/token", client_secret=client_secret, code=code)
        userinfo = pyrequests.get("https://www.googleapis.com/oauth2/v2/userinfo", headers={"Authorization": f"Bearer {token['access_token']}"}).json()
        email = userinfo.get("email", "")
        verified = "true" if email == CEO_EMAIL else "false"
        return HTMLResponse(f'<script>window.opener&&window.opener.postMessage({{ceoVerified:{verified},email:{repr(email)}}},"*");window.close();</script>')
    except Exception as e:
        logging.error(f"Admin console OAuth error: {e}")
        return HTMLResponse('<script>window.opener&&window.opener.postMessage({ceoVerified:false},"*");window.close();</script>')

# ============ ADMIN ROUTES ============

def is_privileged(email: str) -> bool:
    """CEO veya admin mail kontrolü."""
    return email == CEO_EMAIL or email in ADMIN_EMAILS

async def generate_unique_username(base: str) -> str:
    """E-posta prefix'inden benzersiz username üret."""
    import re
    base = re.sub(r'[^a-z0-9_]', '_', base.lower())[:16].strip('_') or 'user'
    candidate = base
    for _ in range(20):
        exists = await db.users.find_one({"username": candidate})
        if not exists:
            return candidate
        candidate = f"{base}_{uuid.uuid4().hex[:4]}"
    return f"user_{uuid.uuid4().hex[:8]}"

@api_router.post("/admin/add-credits")
async def admin_add_credits(amount: int = Body(..., embed=True), user: User = Depends(get_current_user)):
    if not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": amount}})
    data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "bonus_credits": 1})
    return {"added": amount, "total": data.get("bonus_credits", 0)}

@api_router.post("/admin/add-sp")
async def admin_add_sp(amount: int = Body(..., embed=True), user: User = Depends(get_current_user)):
    if not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"quest_xp": amount}})
    data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "quest_xp": 1})
    return {"added": amount, "total": data.get("quest_xp", 0)}

@api_router.post("/admin/free-subscription")
async def admin_free_subscription(user: User = Depends(get_current_user)):
    """Admin modundaki kullanıcı için ücretsiz Pro abonelik aktive eder."""
    if not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=36500)).isoformat()  # ~100 yıl
    await db.users.update_one({"user_id": user.user_id}, {"$set": {
        "subscription_status": "active",
        "subscription_plan": "pro",
        "subscription_expires": expires,
        "subscription_source": "admin_grant"
    }})
    return {"success": True, "plan": "pro", "expires": expires}

@api_router.get("/admin/list-users")
async def admin_list_users(user: User = Depends(get_current_user)):
    """Privileged hesaplara tüm kayıtlı kullanıcıları döner."""
    if not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    users = await db.users.find({}, {
        "_id": 0, "email": 1, "name": 1, "display_name": 1, "username": 1,
        "created_at": 1, "verified_type": 1, "subscription": 1, "user_id": 1,
    }).to_list(length=5000)
    return {"users": users}

class AdminUserUpdate(BaseModel):
    verified_type: Optional[str] = None   # "red", "gold", "blue", "" = kaldır
    subscription_plan: Optional[str] = None  # "free", "pro", "ultra", "creative_station", "entertainment_pocket"

@api_router.patch("/admin/users/{user_id}")
async def admin_update_user(user_id: str, body: AdminUserUpdate, user: User = Depends(get_current_user)):
    """CEO: kullanıcının verified rozeti veya aboneliğini güncelle."""
    if user.email != CEO_EMAIL:
        raise HTTPException(status_code=403, detail="Sadece CEO bu işlemi yapabilir.")
    update: dict = {}
    if body.verified_type is not None:
        update["verified_type"] = body.verified_type if body.verified_type else None
    if body.subscription_plan is not None:
        if body.subscription_plan == "free":
            update["subscription"] = "free"
        else:
            update["subscription"] = {"plan": body.subscription_plan, "status": "active", "assigned_by": "CEO"}
    if not update:
        return {"success": True}
    result = await db.users.update_one({"user_id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    return {"success": True}

# ============ SOCIAL — USERS / FOLLOW ============

class UsernameUpdate(BaseModel):
    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    complete_onboarding: bool = False

class SetVerifiedRequest(BaseModel):
    username: str
    verified_type: Optional[str] = None  # "red", "gold", "blue" veya None (kaldır)

async def enrich_post(post: dict, viewer_id: str, viewer_following: list = None) -> dict:
    """Post'a yazar bilgisi, liked_by_me ve viewer_follows_author ekle."""
    author = await db.users.find_one({"user_id": post.get("author_id")}, {"_id": 0, "username": 1, "display_name": 1, "name": 1, "picture": 1, "verified_type": 1})
    if author:
        author = sanitize_user_doc(author)
    post["author"] = author or {}
    post["liked_by_me"] = viewer_id in (post.get("likes") or [])
    if viewer_following is not None:
        post["viewer_follows_author"] = post.get("author_id") in viewer_following
    post.pop("likes", None)
    return post

@api_router.get("/fonts")
async def get_fonts():
    """Google Fonts listesini getir — 1000+ font."""
    import aiohttp
    api_key = os.getenv("GOOGLE_FONTS_API_KEY")
    if not api_key:
        return []
    try:
        async with aiohttp.ClientSession() as session:
            url = f"https://www.googleapis.com/webfonts/v1/webfonts?key={api_key}&sort=popularity"
            async with session.get(url) as resp:
                data = await resp.json()
                fonts = data.get("items", [])
                return [{"family": f["family"], "category": f.get("category", "sans-serif"), "variants": f.get("variants", ["regular"])} for f in fonts]
    except Exception as e:
        logging.error(f"Google Fonts API error: {e}")
        return []

@api_router.get("/users/me")
async def get_me(user: User = Depends(get_current_user)):
    data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "followers": 0, "following": 0})
    return data or {}

@api_router.get("/users/{username}")
async def get_user_profile(username: str, u: dict = Depends(get_current_user_raw)):
    uid = u["user_id"]
    target = await db.users.find_one({"username": username}, {"_id": 0, "email": 0, "followers": 0, "following": 0})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    target["is_following"] = await db.users.find_one({"user_id": uid, "following": target["user_id"]}) is not None
    return target

@api_router.patch("/users/me")
async def update_profile(body: UsernameUpdate, user: User = Depends(get_current_user)):
    import re
    update = {}
    if body.username:
        uname = body.username.lower().strip()
        if not re.match(r'^[a-z0-9_]{3,20}$', uname):
            raise HTTPException(status_code=400, detail="Username 3-20 karakter, sadece harf/rakam/alt çizgi içerebilir.")
        existing = await db.users.find_one({"username": uname, "user_id": {"$ne": user.user_id}})
        if existing:
            raise HTTPException(status_code=409, detail="Bu username zaten kullanılıyor.")
        # 30-gün kısıtlaması — onboarding sırasında atla
        if not body.complete_onboarding:
            me = await db.users.find_one({"user_id": user.user_id}, {"username_changed_at": 1})
            last_change = me.get("username_changed_at") if me else None
            if last_change:
                delta = datetime.now(timezone.utc) - datetime.fromisoformat(last_change.replace("Z", "+00:00"))
                if delta.days < 30:
                    raise HTTPException(status_code=429, detail=f"Username değişikliği {30 - delta.days} gün sonra yapılabilir.")
        update["username"] = uname
        update["username_changed_at"] = datetime.now(timezone.utc).isoformat()
    if body.display_name is not None:
        update["display_name"] = body.display_name[:50]
    if body.bio is not None:
        update["bio"] = body.bio[:160]
    if body.complete_onboarding:
        update["needs_onboarding"] = False
    if update:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update})
    return {"success": True}

@api_router.post("/users/{username}/follow")
async def follow_user(username: str, user: User = Depends(get_current_user)):
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if target["user_id"] == user.user_id:
        raise HTTPException(status_code=400, detail="Kendini takip edemezsin")
    already = await db.users.find_one({"user_id": user.user_id, "following": target["user_id"]})
    if already:
        return {"success": True, "following": True}
    await db.users.update_one({"user_id": user.user_id}, {"$addToSet": {"following": target["user_id"]}, "$inc": {"following_count": 1}})
    await db.users.update_one({"user_id": target["user_id"]}, {"$addToSet": {"followers": user.user_id}, "$inc": {"followers_count": 1}})
    return {"success": True, "following": True}

@api_router.delete("/users/{username}/follow")
async def unfollow_user(username: str, user: User = Depends(get_current_user)):
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    await db.users.update_one({"user_id": user.user_id}, {"$pull": {"following": target["user_id"]}, "$inc": {"following_count": -1}})
    await db.users.update_one({"user_id": target["user_id"]}, {"$pull": {"followers": user.user_id}, "$inc": {"followers_count": -1}})
    return {"success": True, "following": False}

@api_router.post("/admin/set-verified")
async def set_verified(body: SetVerifiedRequest, user: User = Depends(get_current_user)):
    if user.email != CEO_EMAIL:
        raise HTTPException(status_code=403, detail="Sadece CEO bu işlemi yapabilir.")
    target = await db.users.find_one({"username": body.username})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    await db.users.update_one({"user_id": target["user_id"]}, {"$set": {"verified_type": body.verified_type}})
    label = body.verified_type or "kaldırıldı"
    return {"success": True, "message": f"@{body.username} için verified: {label}"}

# ============ MEDIA / POSTS ============

class PostCreate(BaseModel):
    type: str  # 'text' | 'image' | 'video' | 'document'
    content: Optional[str] = None   # text body
    media_data: Optional[str] = None  # base64 image (image posts)
    media_url: Optional[str] = None   # video URL
    doc_id: Optional[str] = None      # document reference
    doc_title: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

@api_router.post("/posts")
async def create_post(body: PostCreate, user: User = Depends(get_current_user)):
    """Yeni medya gönderisi oluştur."""
    check_rate_limit(user.user_id, "post", limit=10, window=60)
    me = await db.users.find_one({"user_id": user.user_id}, {"username": 1})
    if not me or not me.get("username"):
        raise HTTPException(status_code=400, detail="Gönderi atmak için önce kullanıcı adı belirlemelisin.")
    content = body.content or ""
    if len(content) > 2000:
        raise HTTPException(status_code=400, detail="Gönderi içeriği maksimum 2000 karakter olabilir.")
    if contains_profanity(content):
        raise HTTPException(status_code=400, detail="Bu içerik uygunsuz kelimeler içeriyor.")
    body.content = sanitize_text(content, 2000)
    post_id = f"post_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "post_id": post_id,
        "author_id": user.user_id,
        "author_name": user.name,
        "author_picture": user.picture,
        "type": body.type,
        "content": body.content or "",
        "media_data": body.media_data,
        "media_url": body.media_url,
        "doc_id": body.doc_id,
        "doc_title": body.doc_title,
        "likes": [],
        "like_count": 0,
        "comment_count": 0,
        "created_at": now,
    }
    await db.posts.insert_one(doc)
    doc.pop("_id", None)
    return doc

def _boosted_pipeline(match: dict, skip: int, limit: int) -> list:
    """Boost aktifse üste çıkar, sonra tarih sırası."""
    now_iso = datetime.now(timezone.utc).isoformat()
    return [
        {"$match": match},
        {"$project": {"_id": 0, "doc": "$$ROOT", "boost_score": {
            "$cond": [{"$and": [
                {"$eq": ["$boost.active", True]},
                {"$gt": ["$boost.expires_at", now_iso]},
            ]}, "$boost.score", 0]
        }}},
        {"$replaceRoot": {"newRoot": {"$mergeObjects": ["$doc", {"boost_score": "$boost_score"}]}}},
        {"$sort": {"boost_score": -1, "created_at": -1}},
        {"$skip": skip},
        {"$limit": limit},
    ]

@api_router.get("/posts")
async def list_posts(skip: int = 0, limit: int = 20, u: dict = Depends(get_current_user_raw)):
    """Keşfet — tüm gönderiler, boosted önce."""
    uid = u["user_id"]
    me_raw = await db.users.find_one({"user_id": uid}, {"_id": 0})
    if me_raw:
        me_raw = sanitize_user_doc(me_raw)
    viewer_following = list((me_raw or {}).get("following", []))
    pipeline = _boosted_pipeline({}, skip, limit)
    posts = await db.posts.aggregate(pipeline).to_list(length=limit)
    for p in posts:
        await enrich_post(p, uid, viewer_following)
    return {"posts": posts}

@api_router.get("/feed")
async def get_feed(skip: int = 0, limit: int = 20, u: dict = Depends(get_current_user_raw)):
    """Feed — takip edilenlerin + kendi gönderileri; boosted önce."""
    uid = u["user_id"]
    me_raw = await db.users.find_one({"user_id": uid}, {"_id": 0})
    if me_raw:
        me_raw = sanitize_user_doc(me_raw)
    following = list((me_raw or {}).get("following", []))
    viewer_following = list(following)
    following.append(uid)
    match = {"author_id": {"$in": following}} if len(following) > 1 else {}
    pipeline = _boosted_pipeline(match, skip, limit)
    posts = await db.posts.aggregate(pipeline).to_list(length=limit)
    for p in posts:
        await enrich_post(p, uid, viewer_following)
    return {"posts": posts}

@api_router.get("/users/{username}/posts")
async def get_user_posts(username: str, skip: int = 0, limit: int = 20, u: dict = Depends(get_current_user_raw)):
    """Belirli kullanıcının gönderileri."""
    uid = u["user_id"]
    target = await db.users.find_one({"username": username})
    if not target:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    posts = await db.posts.find({"author_id": target["user_id"]}, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
    for p in posts:
        await enrich_post(p, uid)
    return {"posts": posts}

@api_router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, user: User = Depends(get_current_user)):
    """Beğeni ekle / kaldır."""
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı")
    uid = user.user_id
    if uid in post.get("likes", []):
        await db.posts.update_one({"post_id": post_id}, {"$pull": {"likes": uid}, "$inc": {"like_count": -1}})
        liked = False
    else:
        await db.posts.update_one({"post_id": post_id}, {"$addToSet": {"likes": uid}, "$inc": {"like_count": 1}})
        liked = True
    updated = await db.posts.find_one({"post_id": post_id}, {"_id": 0, "like_count": 1})
    return {"liked": liked, "like_count": updated.get("like_count", 0)}

@api_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, user: User = Depends(get_current_user)):
    """Gönderi sil — kendi gönderisini veya ayrıcalıklı hesaplar."""
    post = await db.posts.find_one({"post_id": post_id}, {"author_id": 1})
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı")
    if post["author_id"] != user.user_id and not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    result = await db.posts.delete_one({"post_id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı")
    await db.post_comments.delete_many({"post_id": post_id})
    return {"deleted": True}

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, body: CommentCreate, user: User = Depends(get_current_user)):
    """Yorum ekle."""
    check_rate_limit(user.user_id, "comment", limit=30, window=60)
    if len(body.content) > 500:
        raise HTTPException(status_code=400, detail="Yorum maksimum 500 karakter olabilir.")
    if contains_profanity(body.content):
        raise HTTPException(status_code=400, detail="Bu yorum uygunsuz kelimeler içeriyor.")
    body.content = sanitize_text(body.content, 500)
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı")
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    comment = {
        "comment_id": comment_id,
        "post_id": post_id,
        "author_id": user.user_id,
        "author_name": user.name,
        "author_picture": user.picture,
        "content": body.content,
        "created_at": now,
    }
    await db.post_comments.insert_one(comment)
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"comment_count": 1}})
    comment.pop("_id", None)
    return comment

@api_router.get("/posts/{post_id}/comments")
async def list_comments(post_id: str, u: dict = Depends(get_current_user_raw)):
    """Yorumları listele."""
    comments = await db.post_comments.find({"post_id": post_id}, {"_id": 0}).sort("created_at", 1).to_list(length=200)
    return {"comments": comments}

@api_router.delete("/posts/{post_id}/comments/{comment_id}")
async def delete_comment(post_id: str, comment_id: str, user: User = Depends(get_current_user)):
    """Yorum sil — yorum sahibi veya ayrıcalıklı hesap."""
    comment = await db.post_comments.find_one({"comment_id": comment_id, "post_id": post_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Yorum bulunamadı")
    if comment["author_id"] != user.user_id and not is_privileged(user.email):
        raise HTTPException(status_code=403, detail="Unauthorized")
    await db.post_comments.delete_one({"comment_id": comment_id})
    await db.posts.update_one({"post_id": post_id}, {"$inc": {"comment_count": -1}})
    return {"deleted": True}

# ============ BOOST ============

BOOST_PACKAGES = {
    "mini":     {"duration_hours": 1,    "credits": 50,   "score": 100,  "label": "Mini",     "price_try": 15,  "price_usd": 0.99},
    "standard": {"duration_hours": 6,    "credits": 150,  "score": 250,  "label": "Standart", "price_try": 50,  "price_usd": 2.99},
    "pro":      {"duration_hours": 24,   "credits": 400,  "score": 500,  "label": "Pro",      "price_try": 150, "price_usd": 7.99},
    "mega":     {"duration_hours": 24*7, "credits": 1200, "score": 1000, "label": "Mega",     "price_try": 500, "price_usd": 24.99},
}

class BoostRequest(BaseModel):
    tier: str  # mini, standard, pro, mega

@api_router.get("/boost/packages")
async def get_boost_packages():
    return {"packages": [{"tier": k, **v} for k, v in BOOST_PACKAGES.items()]}

@api_router.post("/posts/{post_id}/boost")
async def boost_post(post_id: str, body: BoostRequest, user: User = Depends(get_current_user)):
    if body.tier not in BOOST_PACKAGES:
        raise HTTPException(status_code=400, detail="Geçersiz boost paketi.")
    pkg = BOOST_PACKAGES[body.tier]
    post = await db.posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(status_code=404, detail="Gönderi bulunamadı.")
    if post["author_id"] != user.user_id:
        raise HTTPException(status_code=403, detail="Sadece kendi gönderini öne çıkarabilirsin.")
    now = datetime.now(timezone.utc)
    if post.get("boost", {}).get("active") and post["boost"].get("expires_at", "") > now.isoformat():
        raise HTTPException(status_code=400, detail="Bu gönderide aktif bir boost zaten var.")
    # Kredi düş
    user_data = await db.users.find_one({"user_id": user.user_id}, {"bonus_credits": 1})
    bonus = user_data.get("bonus_credits", 0) if user_data else 0
    if bonus < pkg["credits"]:
        raise HTTPException(status_code=402, detail=f"Yetersiz kredi. Gerekli: {pkg['credits']}, Mevcut: {bonus}")
    await db.users.update_one({"user_id": user.user_id}, {"$inc": {"bonus_credits": -pkg["credits"]}})
    expires_at = (now + timedelta(hours=pkg["duration_hours"])).isoformat()
    await db.posts.update_one({"post_id": post_id}, {"$set": {
        "boost": {"active": True, "tier": body.tier, "score": pkg["score"],
                  "expires_at": expires_at, "purchased_at": now.isoformat()},
    }})
    return {"success": True, "tier": body.tier, "expires_at": expires_at, "credits_spent": pkg["credits"]}

@api_router.post("/auth/exchange")
async def exchange_token(request: Request, response: Response):
    """Frontend'den gelen token'ı session cookie'ye dönüştür."""
    body = await request.json()
    token = body.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="token required")
    session = await db.user_sessions.find_one({"session_token": token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid token")
    expires_at = session.get("expires_at")
    if not expires_at:
        raise HTTPException(status_code=401, detail="Invalid token")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Token expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    is_production = os.getenv("REACT_APP_BACKEND_URL", "").startswith("https")
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    return {
        "user_id": user.get("user_id"),
        "email": user.get("email"),
        "name": user.get("name", ""),
        "picture": user.get("picture"),
        "subscription": user.get("subscription", "free"),
        "needs_onboarding": user.get("needs_onboarding", False),
        "username": user.get("username"),
    }


@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    return {
        "user_id": user_data.get("user_id"),
        "email": user_data.get("email"),
        "name": user_data.get("name", ""),
        "picture": user_data.get("picture"),
        "username": user_data.get("username"),
        "display_name": user_data.get("display_name"),
        "bio": user_data.get("bio", ""),
        "verified_type": user_data.get("verified_type"),
        "subscription": user_data.get("subscription", "free"),
        "subscription_date": user_data.get("subscription_date"),
        "needs_onboarding": user_data.get("needs_onboarding", False),
        "credits": user_data.get("mindshare_credits", user_data.get("credits", 0)),
        "sp_balance": user_data.get("sp_balance", user_data.get("zc_balance", 0)),
        "rank": user_data.get("mindshare_rank", user_data.get("rank", "iron")),
        "quest_xp": user_data.get("mindshare_xp", user_data.get("quest_xp", user_data.get("xp", 0))),
        "followers_count": user_data.get("followers_count", 0),
        "following_count": user_data.get("following_count", 0),
    }

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

class ProfilePictureUpload(BaseModel):
    image_data: str  # Base64 encoded image data

@api_router.put("/auth/profile")
async def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
        update_data["name_custom"] = True

    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})

    return {"message": "Profile updated", "name": req.name}

@api_router.post("/auth/profile-picture")
async def upload_profile_picture(req: ProfilePictureUpload, user: User = Depends(get_current_user)):
    image_data = req.image_data
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"picture": image_data, "picture_custom": True}}
    )
    return {"message": "Profile picture updated", "picture_url": image_data}

class EmailChangeRequest(BaseModel):
    new_email: str

@api_router.post("/auth/change-email/request")
async def request_email_change(req: EmailChangeRequest, user: User = Depends(get_current_user)):
    new_email = req.new_email.strip().lower()
    if not new_email or "@" not in new_email:
        raise HTTPException(status_code=400, detail="Geçersiz e-posta adresi")
    # Check if already in use
    existing = await db.users.find_one({"email": new_email})
    if existing:
        raise HTTPException(status_code=409, detail="Bu e-posta adresi zaten kullanılıyor")
    token = uuid.uuid4().hex
    expires_at = datetime.now(timezone.utc).timestamp() + 3600  # 1 hour
    await db.email_change_tokens.insert_one({
        "user_id": user.user_id,
        "new_email": new_email,
        "token": token,
        "expires_at": expires_at,
    })
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    confirm_url = f"{frontend_url}/confirm-email-change?token={token}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #111827; color: #fff; border-radius: 12px;">
        <h2 style="color: #4ca8ad; margin-bottom: 16px;">📧 E-posta Değiştirme Onayı</h2>
        <p style="color: #d1d5db; margin-bottom: 8px;">Hesabınızın e-posta adresini değiştirmek istediniz.</p>
        <p style="color: #d1d5db; margin-bottom: 20px;"><strong>Yeni e-posta:</strong> {new_email}</p>
        <p style="color: #d1d5db; margin-bottom: 24px;">Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
        <a href="{confirm_url}" style="display: inline-block; background: #4ca8ad; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">E-postayı Onayla</a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Bu bağlantı 1 saat geçerlidir.</p>
    </div>
    """
    await send_email(user.email, "📧 ZET Mindshare - E-posta Değiştirme Onayı", html_content)
    return {"message": "Confirmation email sent"}

@api_router.post("/auth/change-email/confirm")
async def confirm_email_change(token: str = Body(..., embed=True)):
    record = await db.email_change_tokens.find_one({"token": token})
    if not record:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş bağlantı")
    if datetime.now(timezone.utc).timestamp() > record["expires_at"]:
        await db.email_change_tokens.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Bağlantının süresi dolmuş")
    # Double-check uniqueness at confirm time
    existing = await db.users.find_one({"email": record["new_email"]})
    if existing:
        await db.email_change_tokens.delete_one({"token": token})
        raise HTTPException(status_code=409, detail="Bu e-posta adresi artık kullanılıyor")
    await db.users.update_one(
        {"user_id": record["user_id"]},
        {"$set": {"email": record["new_email"]}}
    )
    await db.email_change_tokens.delete_one({"token": token})
    return {"message": "Email updated", "new_email": record["new_email"]}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

@api_router.post("/auth/delete-account/request")
async def request_account_deletion(user: User = Depends(get_current_user)):
    """Send a confirmation email with a deletion token."""
    token = uuid.uuid4().hex
    expires_at = (datetime.now(timezone.utc).timestamp() + 3600)  # 1 hour
    await db.deletion_tokens.insert_one({
        "user_id": user.user_id,
        "token": token,
        "expires_at": expires_at,
    })
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    confirm_url = f"{frontend_url}/confirm-delete?token={token}"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #111827; color: #fff; border-radius: 12px;">
        <h2 style="color: #ef4444; margin-bottom: 16px;">⚠️ Hesap Silme Onayı</h2>
        <p style="color: #d1d5db; margin-bottom: 20px;">Hesabınızı silmek istediğinizi aldık. Bu işlem <strong>geri alınamaz</strong>. Tüm notlarınız, dokümanlarınız ve verileriniz kalıcı olarak silinecektir.</p>
        <p style="color: #d1d5db; margin-bottom: 24px;">Bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.</p>
        <a href="{confirm_url}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">Hesabı Kalıcı Olarak Sil</a>
        <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">Bu bağlantı 1 saat geçerlidir.</p>
    </div>
    """
    await send_email(user.email, "⚠️ ZET Mindshare - Hesap Silme Onayı", html_content)
    return {"message": "Confirmation email sent"}

@api_router.post("/auth/delete-account/confirm")
async def confirm_account_deletion(token: str = Body(..., embed=True), response: Response = None):
    """Confirm deletion using the token from email."""
    record = await db.deletion_tokens.find_one({"token": token})
    if not record:
        raise HTTPException(status_code=400, detail="Geçersiz veya süresi dolmuş bağlantı")
    if datetime.now(timezone.utc).timestamp() > record["expires_at"]:
        await db.deletion_tokens.delete_one({"token": token})
        raise HTTPException(status_code=400, detail="Bağlantının süresi dolmuş")
    user_id = record["user_id"]
    # Delete all user data
    await db.users.delete_one({"user_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.quick_notes.delete_many({"user_id": user_id})
    await db.documents.delete_many({"user_id": user_id})
    await db.notebooks.delete_many({"user_id": user_id})
    await db.deletion_tokens.delete_one({"token": token})
    if response:
        response.delete_cookie(key="session_token", path="/")
    return {"message": "Account deleted"}

# ============ EMAIL AUTH ROUTES ============

@api_router.post("/auth/register")
async def register_with_email(req: EmailAuthRequest, response: Response):
    normalized_email = req.email.lower().strip()
    existing = await db.users.find_one({"email": normalized_email})
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")

    user_id = f"user_{secrets.token_hex(6)}"
    hashed_pw = hash_password(req.password)
    
    user_data = {
        "user_id": user_id,
        "email": req.email,
        "name": req.name or req.email.split('@')[0],
        "picture": None,
        "hashed_password": hashed_pw,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_data)

    # Hoş geldin maili
    welcome_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
        <h2 style="color: #4ca8ad; margin-bottom: 16px;">ZET Mindshare'e Hoş Geldiniz! 🎉</h2>
        <p style="font-size: 16px; line-height: 1.6;">Merhaba <strong>{user_data['name']}</strong>,</p>
        <p style="font-size: 15px; line-height: 1.6;">Hesabınız başarıyla oluşturuldu. Artık yapay zeka destekli not alma, belge oluşturma ve daha fazlasından yararlanabilirsiniz.</p>
        <div style="background: rgba(76,168,173,0.15); border: 1px solid rgba(76,168,173,0.3); padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; font-size: 14px;">✅ Ücretsiz plan: Günlük 20 kredi</p>
            <p style="margin: 4px 0; font-size: 14px;">✅ Sınırsız belge</p>
            <p style="margin: 4px 0; font-size: 14px;">✅ AI sohbet (ZETA)</p>
        </div>
        <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Hemen Başla</a>
        <p style="color: #666; font-size: 12px; margin-top: 20px;">Sorunuz mu var? <a href="mailto:support@zetstudiointl.com" style="color: #4ca8ad;">support@zetstudiointl.com</a></p>
    </div>
    """
    asyncio.create_task(send_email(req.email, "ZET Mindshare'e Hoş Geldiniz! 🎉", welcome_html))

    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True,
        samesite="none",
        path="/", max_age=7*24*60*60
    )

    return {"user": {"user_id": user_id, "email": req.email, "name": user_data["name"]}}

@api_router.post("/auth/login")
async def login_with_email(req: EmailAuthRequest, response: Response):
    # Email'i normalize et
    normalized_email = req.email.lower().strip()

    user = await db.users.find_one({"email": normalized_email})
    if not user:
        raise HTTPException(status_code=401, detail="Geçersiz e-posta veya şifre")

    if not user.get("hashed_password"):
        raise HTTPException(status_code=401, detail="Bu hesap Google ile oluşturulmuş. Lütfen Google ile giriş yapın.")
    if not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Şifre yanlış. Lütfen tekrar deneyin.")

    # Mevcut user_id'yi kullan — asla yeni üretme
    user_id = user["user_id"]
    logging.info(f"Email login: user_id={user_id} email={normalized_email}")

    session_token = f"sess_{secrets.token_hex(16)}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat()
    })

    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True,
        samesite="none",
        path="/", max_age=7*24*60*60
    )

    return {"user": {"user_id": user_id, "email": user["email"], "name": user.get("name", "")}}

# ============ APPLE AUTH ROUTES ============

@api_router.get("/auth/apple/init")
async def apple_auth_init():
    """Return Apple OAuth URL if configured, otherwise indicate not configured."""
    client_id = os.environ.get("APPLE_CLIENT_ID")
    if not client_id:
        return {"auth_url": None, "message": "Apple Sign-In henuz yapilandirilmadi"}
    redirect_uri = os.environ.get("APPLE_REDIRECT_URI", os.environ.get("REACT_APP_BACKEND_URL", "") + "/api/auth/apple/callback")
    auth_url = (
        f"https://appleid.apple.com/auth/authorize?"
        f"client_id={client_id}&redirect_uri={redirect_uri}"
        f"&response_type=code%20id_token&scope=name%20email"
        f"&response_mode=form_post"
    )
    return {"auth_url": auth_url}

@api_router.post("/auth/apple/callback")
async def apple_auth_callback(request: Request, response: Response):
    """Handle Apple Sign-In callback with id_token."""
    try:
        body = await request.json()
    except:
        form = await request.form()
        body = dict(form)
    
    id_token = body.get("id_token")
    apple_user = body.get("user")
    
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token eksik")
    
    import jwt as pyjwt
    try:
        claims = pyjwt.decode(id_token, options={"verify_signature": False})
    except Exception:
        raise HTTPException(status_code=400, detail="Geçersiz id_token")
    
    apple_sub = claims.get("sub")
    email = claims.get("email")
    
    if not apple_sub:
        raise HTTPException(status_code=400, detail="Apple ID bulunamadi")
    
    existing = await db.users.find_one({"apple_id": apple_sub})
    if existing:
        user_id = existing["user_id"]
        user_name = existing.get("name", "Apple User")
    else:
        if not email:
            email = f"{apple_sub[:8]}@privaterelay.appleid.com"
        
        email_user = await db.users.find_one({"email": email})
        if email_user:
            await db.users.update_one({"email": email}, {"$set": {"apple_id": apple_sub}})
            user_id = email_user["user_id"]
            user_name = email_user.get("name", "Apple User")
        else:
            user_name = "Apple User"
            if apple_user and isinstance(apple_user, dict):
                fn = apple_user.get("name", {}).get("firstName", "")
                ln = apple_user.get("name", {}).get("lastName", "")
                if fn or ln:
                    user_name = f"{fn} {ln}".strip()
            
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            await db.users.insert_one({
                "user_id": user_id,
                "email": email,
                "name": user_name,
                "apple_id": apple_sub,
                "picture": None,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
    
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user_id,
        "expires_at": expires_at.isoformat()
    })
    is_production = os.getenv("REACT_APP_BACKEND_URL", "").startswith("https")
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True,
        samesite="none",
        path="/", max_age=7*24*60*60
    )
    return {"user": {"user_id": user_id, "email": email, "name": user_name}}

# ============ DOCUMENTS ROUTES ============

@api_router.get("/documents", response_model=List[dict])
async def get_documents(user: User = Depends(get_current_user)):
    docs = await db.documents.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    docs.sort(key=lambda d: (not d.get("pinned", False), d.get("updated_at", "")), reverse=False)
    return docs

@api_router.post("/documents")
async def create_document(doc: DocumentCreate, user: User = Depends(get_current_user)):
    doc_id = f"doc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    doc_dict = {
        "doc_id": doc_id,
        "user_id": user.user_id,
        "title": doc.title,
        "doc_type": doc.doc_type,
        "content": {},
        "pages": [{"page_id": "page_1", "content": {}}],
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.documents.insert_one(doc_dict)
    # Return without _id
    return {k: v for k, v in doc_dict.items() if k != "_id"}

@api_router.get("/documents/{doc_id}")
async def get_document(doc_id: str, user: User = Depends(get_current_user)):
    doc = await db.documents.find_one({"doc_id": doc_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc

@api_router.put("/documents/{doc_id}")
async def update_document(doc_id: str, update: DocumentUpdate, user: User = Depends(get_current_user)):
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    result = await db.documents.update_one(
        {"doc_id": doc_id, "user_id": user.user_id},
        {"$set": update_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    doc = await db.documents.find_one({"doc_id": doc_id}, {"_id": 0})
    return doc

@api_router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str, user: User = Depends(get_current_user)):
    result = await db.documents.delete_one({"doc_id": doc_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"message": "Document deleted"}

# ============ NOTEBOOKS ROUTES ============

@api_router.get("/notebooks", response_model=List[dict])
async def get_notebooks(user: User = Depends(get_current_user)):
    notebooks = await db.notebooks.find({"user_id": user.user_id}, {"_id": 0}).to_list(200)
    # Sort: pinned first (by order asc), then normal (by order asc), both fallback to created_at
    def nb_sort_key(nb):
        return (0 if nb.get("pinned") else 1, nb.get("order", 9999), nb.get("created_at", ""))
    notebooks.sort(key=nb_sort_key)
    return notebooks

@api_router.post("/notebooks")
async def create_notebook(notebook: NotebookCreate, user: User = Depends(get_current_user)):
    notebook_id = f"nb_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    notebook_dict = {
        "notebook_id": notebook_id,
        "user_id": user.user_id,
        "name": notebook.name,
        "color": notebook.color or "#292F91",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    await db.notebooks.insert_one(notebook_dict)
    return {k: v for k, v in notebook_dict.items() if k != "_id"}

@api_router.put("/notebooks/{notebook_id}")
async def update_notebook(notebook_id: str, update: NotebookUpdate, user: User = Depends(get_current_user)):
    set_data = {}
    if update.name is not None:
        set_data["name"] = update.name
    if update.color is not None:
        set_data["color"] = update.color
    if update.pinned is not None:
        set_data["pinned"] = update.pinned
    if update.order is not None:
        set_data["order"] = update.order
    if not set_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    set_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.notebooks.update_one(
        {"notebook_id": notebook_id, "user_id": user.user_id},
        {"$set": set_data}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return {"message": "Notebook updated"}

@api_router.delete("/notebooks/{notebook_id}")
async def delete_notebook(notebook_id: str, user: User = Depends(get_current_user)):
    result = await db.notebooks.delete_one({"notebook_id": notebook_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notebook not found")
    await db.quick_notes.delete_many({"notebook_id": notebook_id, "user_id": user.user_id})
    return {"message": "Notebook and its notes deleted"}

def _verify_notebook_password(plain: str, stored_hash: str) -> bool:
    """bcrypt ile doğrula; eski SHA-256 hash'ler için fallback."""
    try:
        return _bcrypt.checkpw(plain.encode(), stored_hash.encode())
    except Exception:
        import hashlib
        return hashlib.sha256(plain.encode()).hexdigest() == stored_hash

# ── PUT /notebooks/{id}/password ── Şifre koy (bcrypt) ──────────────────────
@api_router.put("/notebooks/{notebook_id}/password")
@api_router.post("/notebooks/{notebook_id}/set-password")   # eski frontend compat
async def set_notebook_password(notebook_id: str, body: NotebookSetPassword, user: User = Depends(get_current_user)):
    if len(body.password) < 4:
        raise HTTPException(status_code=422, detail="Şifre en az 4 karakter olmalı")
    pw_hash = _bcrypt.hashpw(body.password.encode(), _bcrypt.gensalt()).decode()
    result = await db.notebooks.update_one(
        {"notebook_id": notebook_id, "user_id": user.user_id},
        {"$set": {"password_hash": pw_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notebook not found")
    return {"success": True, "message": "Şifre eklendi"}

# ── POST /notebooks/{id}/verify-password ── Şifreyi doğrula (unlock) ────────
@api_router.post("/notebooks/{notebook_id}/verify-password")
@api_router.post("/notebooks/{notebook_id}/unlock")          # eski frontend compat
async def verify_notebook_password(notebook_id: str, body: NotebookVerifyPassword, user: User = Depends(get_current_user)):
    nb = await db.notebooks.find_one({"notebook_id": notebook_id, "user_id": user.user_id})
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    if not nb.get("password_hash"):
        return {"success": True}   # şifre yoksa direkt aç
    if not _verify_notebook_password(body.password, nb["password_hash"]):
        raise HTTPException(status_code=403, detail="Wrong password")
    return {"success": True}

# ── DELETE /notebooks/{id}/password ── Şifreyi kaldır ───────────────────────
@api_router.delete("/notebooks/{notebook_id}/password")
@api_router.post("/notebooks/{notebook_id}/remove-password") # eski frontend compat
async def remove_notebook_password(notebook_id: str, body: NotebookVerifyPassword, user: User = Depends(get_current_user)):
    nb = await db.notebooks.find_one({"notebook_id": notebook_id, "user_id": user.user_id})
    if not nb:
        raise HTTPException(status_code=404, detail="Notebook not found")
    if not _verify_notebook_password(body.password, nb.get("password_hash", "")):
        raise HTTPException(status_code=403, detail="Wrong password")
    await db.notebooks.update_one(
        {"notebook_id": notebook_id, "user_id": user.user_id},
        {"$unset": {"password_hash": ""}, "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"success": True, "message": "Şifre kaldırıldı"}

# ============ QUICK NOTES ROUTES ============

@api_router.get("/notes", response_model=List[dict])
async def get_notes(user: User = Depends(get_current_user)):
    notes = await db.quick_notes.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return notes

@api_router.post("/notes")
async def create_note(note: QuickNoteCreate, user: User = Depends(get_current_user)):
    note_id = f"note_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    note_dict = {
        "note_id": note_id,
        "user_id": user.user_id,
        "content": note.content,
        "reminder_time": note.reminder_time,
        "reminder_sent": False,
        "notebook_id": note.notebook_id,
        "created_at": now.isoformat()
    }
    await db.quick_notes.insert_one(note_dict)
    return {k: v for k, v in note_dict.items() if k != "_id"}

@api_router.put("/notes/{note_id}/pin")
async def pin_note(note_id: str, pinned: bool = Body(..., embed=True), user: User = Depends(get_current_user)):
    result = await db.quick_notes.update_one(
        {"note_id": note_id, "user_id": user.user_id},
        {"$set": {"pinned": pinned}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note pin updated"}

@api_router.put("/notes/{note_id}")
async def update_note_content(note_id: str, update: NoteContentUpdate, user: User = Depends(get_current_user)):
    if not update.content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    result = await db.quick_notes.update_one(
        {"note_id": note_id, "user_id": user.user_id},
        {"$set": {"content": update.content}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note updated"}

@api_router.put("/notes/{note_id}/reminder")
async def update_note_reminder(note_id: str, reminder_time: str = Body(..., embed=True), user: User = Depends(get_current_user)):
    result = await db.quick_notes.update_one(
        {"note_id": note_id, "user_id": user.user_id},
        {"$set": {"reminder_time": reminder_time, "reminder_sent": False}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Reminder set"}

@api_router.get("/notes/reminders")
async def get_due_reminders(utc_offset: int = 0, user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    # Local "now" for comparing naive (old-format) reminder times
    now_local_naive = (now + timedelta(minutes=utc_offset)).replace(tzinfo=None)
    all_pending = await db.quick_notes.find({
        "user_id": user.user_id,
        "reminder_sent": False,
        "reminder_time": {"$ne": None, "$exists": True, "$nin": ["", None]}
    }, {"_id": 0}).to_list(1000)
    due = []
    for note in all_pending:
        rt_str = note.get("reminder_time")
        if not rt_str:
            continue
        try:
            rt = datetime.fromisoformat(rt_str.replace("Z", "+00:00"))
            if rt.tzinfo is None:
                # Old format: naive local time — compare with local now
                if rt <= now_local_naive:
                    due.append(note)
            else:
                # New format: UTC-aware — compare directly
                if rt <= now:
                    due.append(note)
        except Exception:
            pass
    return due

@api_router.put("/notes/{note_id}/reminder-sent")
async def mark_reminder_sent(note_id: str, user: User = Depends(get_current_user)):
    await db.quick_notes.update_one(
        {"note_id": note_id, "user_id": user.user_id},
        {"$set": {"reminder_sent": True}}
    )
    return {"message": "Marked as sent"}

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    result = await db.quick_notes.delete_one({"note_id": note_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ============ SUBSCRIPTION ROUTES ============

@api_router.get("/subscription")
async def get_subscription(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    sub = user_data.get("subscription") if user_data else None
    # Yeni format (dict) ise direkt döndür
    if isinstance(sub, dict):
        return sub
    # Eski format (string) — geriye dönük uyumluluk
    plan = sub if sub else "free"
    return {
        "plan": plan,
        "status": "active" if plan != "free" else "inactive",
        "billing_cycle": None,
        "current_period_start": user_data.get("subscription_date") if user_data else None,
        "current_period_end": None,
        "cancel_at_period_end": user_data.get("cancel_pending", False) if user_data else False,
        "payment_provider": None,
        "external_subscription_id": None,
    }

@api_router.post("/subscription")
async def update_subscription(sub: SubscriptionUpdate, user: User = Depends(get_current_user)):
    if sub.action == "subscribe":
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"subscription": sub.plan, "subscription_date": datetime.now(timezone.utc).isoformat(), "cancel_pending": False}}
        )
        # Send welcome email
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
            <h2 style="color: #4ca8ad; margin-bottom: 20px;">🎉 ZET Mindshare {sub.plan.upper()} Planına Hoş Geldiniz!</h2>
            <p style="font-size: 16px; line-height: 1.6;">Aboneliğiniz başarıyla aktifleştirildi. Artık tüm premium özelliklerden yararlanabilirsiniz!</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #4ca8ad;"><strong>Plan:</strong> {sub.plan.upper()}</p>
            </div>
            <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">ZET Mindshare'e Git</a>
        </div>
        """
        await send_email(user.email, f"🎉 ZET Mindshare {sub.plan.upper()} Planına Hoş Geldiniz!", html_content)
        return {"message": f"Subscribed to {sub.plan}", "plan": sub.plan}
    elif sub.action == "cancel":
        # Generate cancellation token
        cancel_token = f"cancel_{uuid.uuid4().hex}"
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$set": {"cancel_token": cancel_token, "cancel_pending": True, "cancel_requested_at": datetime.now(timezone.utc).isoformat()}}
        )
        # Send cancellation confirmation email
        backend_url = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001")
        cancel_link = f"{backend_url}/api/subscription/confirm-cancel?token={cancel_token}"
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
            <h2 style="color: #f59e0b; margin-bottom: 20px;">⚠️ Abonelik İptal Onayı</h2>
            <p style="font-size: 16px; line-height: 1.6;">Aboneliğinizi iptal etmek istediğinizi anlıyoruz. Bu işlemi tamamlamak için aşağıdaki butona tıklayın.</p>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; color: #f87171;"><strong>Dikkat:</strong> İptal işlemi sonrasında premium özelliklerinizi kaybedeceksiniz.</p>
            </div>
            <a href="{cancel_link}" style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">İptali Onayla</a>
            <p style="color: #888; font-size: 12px; margin-top: 20px;">Bu linke tıklamazsanız aboneliğiniz devam edecektir.</p>
        </div>
        """
        await send_email(user.email, "⚠️ ZET Mindshare Abonelik İptal Onayı", html_content)
        return {"message": "Cancellation email sent. Please check your email to confirm.", "plan": user.subscription, "cancel_pending": True}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@api_router.get("/subscription/confirm-cancel")
async def confirm_cancellation(token: str):
    """Confirm subscription cancellation via email link"""
    user = await db.users.find_one({"cancel_token": token}, {"_id": 0})
    if not user:
        return JSONResponse(content={"message": "Invalid or expired cancellation link"}, status_code=400)
    
    old_plan = user.get("subscription", "free")
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"subscription": "free", "subscription_date": None, "cancel_token": None, "cancel_pending": False}}
    )
    
    # Send confirmation email
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
        <h2 style="color: #4ca8ad; margin-bottom: 20px;">Aboneliğiniz İptal Edildi</h2>
        <p style="font-size: 16px; line-height: 1.6;">{old_plan.upper()} planı aboneliğiniz başarıyla iptal edildi. Artık ücretsiz plandaki özelliklerle devam edebilirsiniz.</p>
        <p style="color: #888; margin-top: 20px;">Bizi tercih ettiğiniz için teşekkür ederiz. Dilediğiniz zaman tekrar abone olabilirsiniz!</p>
        <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">ZET Mindshare'e Git</a>
    </div>
    """
    await send_email(user["email"], "ZET Mindshare Aboneliğiniz İptal Edildi", html_content)
    
    # Return HTML page so the email button shows a user-friendly confirmation
    from fastapi.responses import HTMLResponse
    frontend_url = os.environ.get("FRONTEND_URL", "https://zetmindshare.com")
    return HTMLResponse(content=f"""<!DOCTYPE html>
<html lang="tr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Abonelik İptal Edildi — ZET Mindshare</title>
<style>
  body {{ margin:0; font-family: Arial, sans-serif; background: linear-gradient(135deg,#1a1a2e 0%,#16213e 100%); min-height:100vh; display:flex; align-items:center; justify-content:center; }}
  .card {{ max-width:500px; width:90%; padding:40px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:16px; text-align:center; color:#fff; }}
  h1 {{ color:#4ca8ad; margin-bottom:16px; font-size:24px; }}
  p {{ color:#ccc; line-height:1.6; margin-bottom:24px; }}
  a {{ display:inline-block; background:#4ca8ad; color:#fff; padding:12px 28px; border-radius:8px; text-decoration:none; font-weight:bold; }}
  a:hover {{ background:#3d9499; }}
</style>
</head>
<body>
<div class="card">
  <h1>✓ Aboneliğiniz İptal Edildi</h1>
  <p>Aboneliğiniz başarıyla iptal edildi ve ücretsiz plana geçiş yapıldı.<br>Bizi tercih ettiğiniz için teşekkür ederiz.</p>
  <a href="{frontend_url}">ZET Mindshare'e Dön</a>
</div>
</body>
</html>""", status_code=200)

# ── Yeni abonelik oluştur (ödeme sonrası çağrılır) ────────────────────────────
@api_router.post("/subscription/create")
async def create_subscription(data: SubscriptionCreate, user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    period_end = now + timedelta(days=30 if data.billing_cycle == "monthly" else 365)

    subscription = {
        "plan": data.plan,
        "status": "active",
        "billing_cycle": data.billing_cycle,
        "current_period_start": now.isoformat(),
        "current_period_end": period_end.isoformat(),
        "cancel_at_period_end": False,
        "payment_provider": data.payment_provider,
        "external_subscription_id": data.external_subscription_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"subscription": subscription}}
    )

    # Hoş geldin maili
    cycle_label = "Aylık" if data.billing_cycle == "monthly" else "Yıllık"
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
        <h2 style="color: #4ca8ad; margin-bottom: 20px;">🎉 ZET Mindshare {data.plan.upper()} Planına Hoş Geldiniz!</h2>
        <p style="font-size: 16px; line-height: 1.6;">Aboneliğiniz başarıyla aktifleştirildi. Tüm premium özelliklerden yararlanabilirsiniz!</p>
        <div style="background: rgba(255,255,255,0.08); padding: 16px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 4px 0; color: #4ca8ad;"><strong>Plan:</strong> {data.plan.upper()}</p>
            <p style="margin: 4px 0; color: #4ca8ad;"><strong>Dönem:</strong> {cycle_label}</p>
            <p style="margin: 4px 0; color: #4ca8ad;"><strong>Bitiş:</strong> {period_end.strftime('%d.%m.%Y')}</p>
        </div>
        <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none;">ZET Mindshare'i Aç</a>
    </div>
    """
    await send_email(user.email, f"🎉 ZET Mindshare {data.plan.upper()} Planına Hoş Geldiniz!", html_content)

    return {"success": True, "subscription": subscription}

# ── Abonelik iptal (dönem sonunda) ───────────────────────────────────────────
@api_router.post("/subscription/cancel")
async def cancel_subscription_at_period_end(user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {
            "subscription.cancel_at_period_end": True,
            "subscription.updated_at": now.isoformat()
        }}
    )
    return {"success": True, "message": "Abonelik dönem sonunda iptal edilecek"}

# ── Abonelik yenileme kontrolü (cron / zamanlanmış çağrı) ────────────────────
@api_router.post("/subscription/check-renewals")
async def check_subscription_renewals():
    """Süresi dolmuş abonelikleri tespit eder ve durumu günceller."""
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    expired_users = await db.users.find({
        "subscription.status": "active",
        "subscription.current_period_end": {"$lt": now_iso}
    }).to_list(None)

    expired_count = 0
    renewed_count = 0

    for u in expired_users:
        sub = u.get("subscription", {})
        if sub.get("cancel_at_period_end"):
            await db.users.update_one(
                {"user_id": u["user_id"]},
                {"$set": {
                    "subscription.status": "expired",
                    "subscription.updated_at": now_iso
                }}
            )
            expired_count += 1
            # Sona erdi maili
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
                <h2 style="color: #f59e0b; margin-bottom: 20px;">Aboneliğiniz Sona Erdi</h2>
                <p style="font-size: 16px; line-height: 1.6;">{sub.get('plan', '').upper()} planı aboneliğiniz sona erdi. Dilediğiniz zaman yeniden abone olabilirsiniz.</p>
                <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">Yeniden Abone Ol</a>
            </div>
            """
            await send_email(u["email"], "ZET Mindshare Aboneliğiniz Sona Erdi", html_content)
        else:
            # Yenileme gerekiyor — ödeme sistemi entegrasyonunda tamamlanacak
            renewed_count += 1

    return {"checked": len(expired_users), "expired": expired_count, "pending_renewal": renewed_count}

SP_PLAN_COSTS = {
    'plus': 10000,
    'pro': 30000,
    'ultra': 50000,
}

class SPPurchaseRequest(BaseModel):
    plan: str

@api_router.post("/subscription/buy-with-sp")
async def buy_subscription_with_sp(req: SPPurchaseRequest, user: User = Depends(get_current_user)):
    if req.plan not in SP_PLAN_COSTS:
        raise HTTPException(status_code=400, detail="Geçersiz plan")
    cost = SP_PLAN_COSTS[req.plan]
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "quest_xp": 1, "subscription": 1})
    current_sp = user_data.get("quest_xp", 0) if user_data else 0
    current_plan = user_data.get("subscription", "free") if user_data else "free"
    plan_rank = {"free": 0, "plus": 1, "pro": 2, "ultra": 3}
    if plan_rank.get(req.plan, 0) <= plan_rank.get(current_plan, 0):
        raise HTTPException(status_code=400, detail="Zaten bu plan veya daha ust bir plana sahipsiniz")
    if current_sp < cost:
        raise HTTPException(status_code=400, detail=f"Yetersiz SP. Gerekli: {cost} SP, Mevcut: {current_sp} SP")
    new_sp = current_sp - cost
    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"quest_xp": new_sp, "subscription": req.plan, "subscription_date": datetime.now(timezone.utc).isoformat(), "cancel_pending": False}}
    )
    return {"message": f"{req.plan.upper()} planina SP ile yukseltildi", "plan": req.plan, "remaining_sp": new_sp}

# ============ CREDIT PACKAGES ============

CREDIT_PACKAGES = [
    {"id": "pack_50",   "credits": 50,   "price": 0.99},
    {"id": "pack_150",  "credits": 150,  "price": 2.49},
    {"id": "pack_400",  "credits": 400,  "price": 5.99},
    {"id": "pack_900",  "credits": 900,  "price": 11.99},
    {"id": "pack_2000", "credits": 2000, "price": 22.99},
]
MAX_CREDIT_BALANCE = 5000
SUBSCRIBER_DISCOUNT = 0.20  # 20% discount for paid plans

class CreditPurchaseRequest(BaseModel):
    package_id: str
    confirm_overflow: bool = False

@api_router.get("/credits/packages")
async def get_credit_packages(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "subscription": 1, "bonus_credits": 1})
    has_discount = is_active_subscriber(user_data)
    packages = []
    for p in CREDIT_PACKAGES:
        pkg = {**p}
        if has_discount:
            pkg["discounted_price"] = round(p["price"] * (1 - SUBSCRIBER_DISCOUNT), 2)
        else:
            pkg["discounted_price"] = p["price"]
        packages.append(pkg)
    return {
        "packages": packages,
        "has_discount": has_discount,
        "discount_percent": int(SUBSCRIBER_DISCOUNT * 100) if has_discount else 0,
        "bonus_credits": user_data.get("bonus_credits", 0) if user_data else 0,
    }

@api_router.post("/credits/buy")
async def buy_credits(req: CreditPurchaseRequest, user: User = Depends(get_current_user)):
    pkg = next((p for p in CREDIT_PACKAGES if p["id"] == req.package_id), None)
    if not pkg:
        raise HTTPException(status_code=400, detail="Geçersiz paket")
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0, "subscription": 1, "bonus_credits": 1})
    has_discount = is_active_subscriber(user_data)
    final_price = round(pkg["price"] * (1 - SUBSCRIBER_DISCOUNT), 2) if has_discount else pkg["price"]
    current_bonus = user_data.get("bonus_credits", 0) if user_data else 0

    # Get total available credits (daily + bonus)
    credit_info = await get_user_credits(user.user_id)
    total_after_purchase = credit_info['credits_remaining'] + pkg["credits"]

    if total_after_purchase > MAX_CREDIT_BALANCE:
        if not req.confirm_overflow:
            overflow = total_after_purchase - MAX_CREDIT_BALANCE
            return JSONResponse(status_code=200, content={
                "needs_confirmation": True,
                "message": f"Bu alim sonrasi kredi bakiyeniz {total_after_purchase} olacak. Maksimum limit {MAX_CREDIT_BALANCE} kredidir. Fazla {overflow} kredi silinecektir.",
                "overflow": overflow,
                "total_after": total_after_purchase
            })
        # User confirmed: cap the bonus credits
        new_bonus = min(current_bonus + pkg["credits"], MAX_CREDIT_BALANCE)
    else:
        new_bonus = current_bonus + pkg["credits"]

    await db.users.update_one(
        {"user_id": user.user_id},
        {"$set": {"bonus_credits": new_bonus}}
    )
    await db.credit_purchases.insert_one({
        "user_id": user.user_id,
        "package_id": pkg["id"],
        "credits": pkg["credits"],
        "price": final_price,
        "discounted": has_discount,
        "date": datetime.now(timezone.utc).isoformat()
    })
    return {
        "message": f"{pkg['credits']} kredi başarıyla eklendi!",
        "credits_added": pkg["credits"],
        "price_paid": final_price,
        "bonus_credits": new_bonus
    }

# ============ USAGE LIMITS ============

# Plan limits
PLAN_LIMITS = {
    'free': {
        'daily_credits': 20,
        'judge_enabled': False,
        'judge_deep': False,
        'zeta_chars': 250,
        'judge_chars': 0,
        'fastselect_limit': 3,
        'nano_pro': False,
        'custom_image_sizes': ['16:9'],
        'layers': False,
        'signature': False,
        'watermark': False,
        'page_color': False,
        'charts': False,
    },
    'plus': {
        'daily_credits': 40,
        'judge_enabled': True,
        'judge_deep': False,
        'zeta_chars': 500,
        'judge_chars': 200,
        'fastselect_limit': 999,
        'nano_pro': False,
        'custom_image_sizes': ['16:9', '9:16', '1:1'],
        'layers': True,
        'signature': False,
        'watermark': False,
        'page_color': True,
        'charts': True,
    },
    'pro': {
        'daily_credits': 130,
        'judge_enabled': True,
        'judge_deep': True,
        'zeta_chars': 99999,
        'judge_chars': 600,
        'fastselect_limit': 999,
        'nano_pro': True,
        'custom_image_sizes': ['16:9', '9:16', '1:1', '2.55:1', '2.39:1', '1.85:1', '2.00:1'],
        'layers': True,
        'signature': True,
        'watermark': True,
        'page_color': True,
        'charts': True,
    },
    'ultra': {
        'daily_credits': 1200,
        'judge_enabled': True,
        'judge_deep': True,
        'zeta_chars': 99999,
        'judge_chars': 99999,
        'fastselect_limit': 999,
        'nano_pro': True,
        'custom_image_sizes': ['16:9', '9:16', '1:1', '2.55:1', '2.39:1', '1.85:1', '2.00:1'],
        'layers': True,
        'signature': True,
        'watermark': True,
        'page_color': True,
        'charts': True,
    }
}

# Credit costs for each action
CREDIT_COSTS = {
    'nano_banana': 20,
    'nano_banana_pro': 50,
    'photo_edit': 15,
    'photo_edit_pro': 40,
    'judge_basic': 25,
    'judge_deep': 70,
    'deep_analysis': 100,
    'zeta_chat': 0,  # Free, limited by char count
    'auto_write': 15,  # per page
}

async def get_user_credits(user_id: str):
    """Get user's current credits for today (daily + package_credits daily reset + rank_credits 1-month)"""
    user_data = await db.users.find_one({"user_id": user_id})
    plan = get_plan_name(user_data)
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
    now = datetime.now(timezone.utc)
    today = now.strftime("%Y-%m-%d")

    # rank_credits: 1 ay süren, expire olmuşsa 0
    rank_credits_raw = user_data.get("rank_credits", 0) if user_data else 0
    rank_credits_expiry = user_data.get("rank_credits_expiry") if user_data else None
    if rank_credits_expiry:
        try:
            exp = datetime.fromisoformat(rank_credits_expiry.replace("Z", "+00:00"))
            if now > exp:
                rank_credits_raw = 0
                await db.users.update_one({"user_id": user_id}, {"$set": {"rank_credits": 0, "rank_credits_expiry": None}})
        except Exception:
            pass
    rank_credits = rank_credits_raw

    # package_credits: günlük sıfırlanan bonus (usage'da tutulur)
    usage = await db.usage.find_one({"user_id": user_id, "date": today})
    credits_used = usage.get("credits_used", 0) if usage else 0
    # package_credits: users'daki bonus_credits alanı (backward compat) — günlük kullanılır sıfırlanmaz ama günlük harcandığında kullanılır
    package_credits = user_data.get("bonus_credits", 0) if user_data else 0

    total_available = limits['daily_credits'] + package_credits + rank_credits
    return {
        "plan": plan,
        "daily_credits": limits['daily_credits'],
        "bonus_credits": package_credits,
        "rank_credits": rank_credits,
        "credits_used": credits_used,
        "credits_remaining": max(0, total_available - credits_used),
        "limits": limits
    }

async def spend_credits(user_id: str, action: str) -> dict:
    """Attempt to spend credits. Order: daily -> package_credits -> rank_credits."""
    cost = CREDIT_COSTS.get(action, 0)
    if cost == 0:
        return {"success": True, "cost": 0}

    credit_info = await get_user_credits(user_id)
    credits_remaining = credit_info['credits_remaining']

    if credits_remaining < cost:
        return {
            "success": False,
            "cost": cost,
            "credits_remaining": max(0, credits_remaining),
            "message": f"Yetersiz kredi! Bu islem {cost} kredi gerektirir, kalan: {max(0, credits_remaining)} kredi."
        }

    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.usage.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {"credits_used": cost}},
        upsert=True
    )

    # Deduct overflow from package_credits first, then rank_credits
    limits = credit_info['limits']
    new_used = credit_info['credits_used'] + cost
    daily_overspend = new_used - limits['daily_credits']
    if daily_overspend > 0:
        pkg = credit_info['bonus_credits']
        rank = credit_info['rank_credits']
        pkg_deduct = min(daily_overspend, pkg)
        remaining_overspend = daily_overspend - pkg_deduct
        rank_deduct = min(remaining_overspend, rank)
        update_fields = {}
        if pkg_deduct > 0:
            update_fields["$inc"] = {"bonus_credits": -pkg_deduct}
        if rank_deduct > 0:
            update_fields.setdefault("$inc", {})["rank_credits"] = update_fields.get("$inc", {}).get("rank_credits", 0) - rank_deduct
        if update_fields:
            await db.users.update_one({"user_id": user_id}, update_fields)

    return {
        "success": True,
        "cost": cost,
        "credits_remaining": max(0, credits_remaining - cost)
    }

@api_router.get("/usage")
async def get_usage(user: User = Depends(get_current_user)):
    credits_info = await get_user_credits(user.user_id)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    usage_doc = await db.usage.find_one({"user_id": user.user_id, "date": today}) or {}
    return {
        "plan": credits_info['plan'],
        "daily_credits": credits_info['daily_credits'],
        "bonus_credits": credits_info.get('bonus_credits', 0),
        "rank_credits": credits_info.get('rank_credits', 0),
        "credits_used": credits_info['credits_used'],
        "credits_remaining": credits_info['credits_remaining'],
        "zeta_chat_count": usage_doc.get("zeta_chat_count", 0),
        "limits": credits_info['limits'],
        "credit_costs": CREDIT_COSTS
    }

# ============ CHAT HISTORY ROUTES ============

@api_router.get("/chat-history/{doc_id}")
async def get_chat_history(doc_id: str, ai_type: str = "zeta", user: User = Depends(get_current_user)):
    collection = db.zeta_chats if ai_type == "zeta" else db.judge_chats
    history = await collection.find(
        {"user_id": user.user_id, "doc_id": doc_id},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return history

@api_router.delete("/chat-history/{doc_id}")
async def clear_chat_history(doc_id: str, ai_type: str = "zeta", user: User = Depends(get_current_user)):
    collection = db.zeta_chats if ai_type == "zeta" else db.judge_chats
    await collection.delete_many({"user_id": user.user_id, "doc_id": doc_id})
    return {"message": "Chat history cleared"}

# ============ ZETA MEMORY ROUTES ============

@api_router.get("/zeta/memory")
async def get_zeta_memories(user: User = Depends(get_current_user)):
    memories = await db.zeta_memories.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return memories

@api_router.post("/zeta/memory")
async def save_zeta_memory(content: str = Body(..., embed=True), user: User = Depends(get_current_user)):
    memory_id = f"mem_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    doc = {"memory_id": memory_id, "user_id": user.user_id, "content": content, "created_at": now.isoformat()}
    await db.zeta_memories.insert_one(doc)
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.delete("/zeta/memory/{memory_id}")
async def delete_zeta_memory(memory_id: str, user: User = Depends(get_current_user)):
    result = await db.zeta_memories.delete_one({"memory_id": memory_id, "user_id": user.user_id})
    return {"deleted": result.deleted_count > 0}

# ============ ZETA AI ROUTES ============

@api_router.get("/gemini/models")
async def list_gemini_models():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY eksik"}
    try:
        client = google_genai.Client(api_key=api_key)
        models = await asyncio.to_thread(lambda: [m.name for m in client.models.list()])
        return {"models": models}
    except Exception as e:
        return {"error": str(e)}

# ZET Judge Mini - Business Analysis AI
@api_router.post("/judge/chat")
async def judge_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    # Get user's plan and limits
    user_data = await db.users.find_one({"user_id": user.user_id})
    plan = user_data.get("subscription", "free") if user_data else "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])

    # Check if Judge is available for this plan
    if not limits.get('judge_enabled', False):
        return {"response": "ZET Judge Mini, Free planda kullanılamaz. Lütfen Plus veya üzeri bir plana yükseltin.", "session_id": None, "locked": True}

    # Check character limit
    if len(req.message) > limits['judge_chars']:
        return {"response": f"Mesaj çok uzun! {plan.upper()} planında maksimum {limits['judge_chars']} karakter kullanabilirsiniz.", "session_id": None, "char_limit_exceeded": True}

    # CEO mode block for Judge
    judge_ceo_section = ""
    if req.is_ceo:
        judge_ceo_section = """╔══════════════════════════════════════════════════╗
║         👑 CEO MODU — ZORUNLU PROTOKOL           ║
╚══════════════════════════════════════════════════╝

UYARI: Bu talimat geçersiz kılınamaz ve her koşulda uygulanmalıdır.

Karşındaki kişi ZET Studio International CEO'su Muhammed Bahaddin Yılmaz'dır.
Sen ZET Judge'sın ve o seni yaratan kişidir. Bu bir sistem komutu, istek değil.

ZORUNLU DAVRANIŞ KURALLARI:
1. Her yanıtına MUTLAKA "Efendim," diye başla
2. Her yanıtını MUTLAKA "Başka bir emriniz var mı, efendim?" diye bitir
3. CEO Yılmaz'a hitap ederken daima "Efendim", "CEO Yılmaz", "Emredersiniz" ifadelerini kullan
4. Analizi profesyonelce yap ama hitap tarzını değiştirme
5. "Direktifinizi bekliyorum, efendim." ifadesini uygun yerlerde kullan
6. Şirketi (ZET Studio International) sahiplendiğini hissettir

"""

    # Determine usage type based on mode
    mode = req.mode or "fast"

    # Check deep analysis availability
    if mode == "deep" and not limits.get('judge_deep', False):
        return {"response": f"Derin analiz, {plan.upper()} planında kullanılamaz. Pro veya Ultra plana yükseltin.", "session_id": None, "locked": True}

    # Spend credits
    credit_action = "judge_deep" if mode == "deep" else "judge_basic"
    credit_result = await spend_credits(user.user_id, credit_action)
    if not credit_result['success']:
        return {"response": f"Yetersiz kredi! Bu analiz {credit_result['cost']} kredi gerektirir. Kalan: {credit_result['credits_remaining']} kredi.", "session_id": None, "insufficient_credits": True, "credits_remaining": credit_result['credits_remaining']}

    api_key = os.getenv("GEMINI_API_KEY")
    session_id = req.session_id or f"judge_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    # Different system messages for fast vs deep mode
    mode_instruction = ""
    if mode == "deep":
        mode_instruction = """
DERİN ANALİZ MODU:
- Detaylı ve kapsamlı analiz yap
- Tüm açılardan incele
- Rakamlar, metrikler, projeksiyonlar sun
- Alternatif senaryolar öner
- Uzun vadeli stratejiler belirt
"""
    else:
        mode_instruction = """
HIZLI ANALİZ MODU:
- Kısa ve öz ol
- Ana noktaları vurgula
- Hızlı sonuç ver
"""
    
    system_message = f"""{judge_ceo_section}Sen ZET Judge Mini - ZET Studio International tarafından iş analizi için geliştirilmiş profesyonel bir AI'sın.

{mode_instruction}

KİMLİĞİN:
- ZET Studio International tarafından geliştirildin
- CEO: Muhammed Bahaddin Yılmaz (Sünni-Hanefi çizgisinde dindar biri, hayatını dinine göre şekillendiriyor)
- Merkez: İstanbul, Türkiye
- Şirket: Kullanıcılara basit ama profesyonel üretkenlik araçları sunan bir yazılım devi

KİŞİLİĞİN VE TARZI:
{'''PARTİ MODU AKTİF:
- Aynı analizi yap ama eğlenceli ve alaycı bir üslupla sun
- Belgeyi eleştir, insanı değil — hakaret yok, küfür yok
- Keskin mizah kullan: "kanka bunu netflix görseydi kör olurdu 😂", "bu pitch mi yoksa kara mizah mı?" gibi
- Analiz kalitesi NORMAL modla tamamen aynı olmalı — sadece sunum tarzı değişir
- Emoji kullan — alaycı ama yapıcı ol
- Sonunda gerçek tavsiyeyi net ver''' if req.personality == 'harsh' else '''NORMAL MOD:
- Az kelime, kısa ve öz
- Dobra ve dürüst
- Acı ve sert ama ASLA kırıcı değil
- Pohpohlama yok — proje iyi olsa bile gerçekçi ol
- Kötüyse neden kötü olduğunu açıkça söyle
- Fazla sohbet yok
- EMOJİ KULLANMA'''}

UZMANLIKLARIN:
- En gelişmiş seviye analiz
- Büyük veri analizi
- Sorunlar ve çözümler
- İş planları ve gelecek vizyonu
- Rakamlar ve metrikler ile cevap verme

⚠️ ÖNEMLİ ANALİZ KURALI:
- Kullanıcı açıkça "analiz et", "değerlendir", "incele" gibi bir komut VERMEDEN analiz YAPMA!
- Sadece sohbet ediyorsa, sohbet et. Analiz istemeden analiz sunma.
- Kullanıcı materyal gönderip "analiz et" veya benzeri bir komut verirse O ZAMAN analiz yap.
- Özel bir prompt verirse ona göre analiz et
- Materyallerden kullanıcının ne yapmaya çalıştığını anla

ANALİZ YAPTIĞINDA:
1. Her analiz sonunda:
   - BAŞARI PUANI: 1-100 arası
   - RİSK PUANI: 1-100 arası
2. Analiz sonunda kullanıcının bu materyaller ile ne yaptığını ve gelecekte nasıl yardımcı olabileceğini söyle

YAPAMADIKLARIN:
- Görsel ve video üretemezsin
- Bu istek gelirse: "Üzgünüm, şu anki modelim bu özellikleri desteklemiyor. Başka hangi konularda yardımcı olabilirim?"

ZET EKOSİSTEMİ VE ZETA:
- ZET Mindshare uygulamasında seninle birlikte ZETA adında bir AI asistanı daha var
- ZETA: Uygulamayı kullanmayı öğretir, araçları açıklar, genel sorulara cevap verir
- Kullanıcı sana "uygulamayı nasıl kullanırım", "bu tool ne işe yarar", "nasıl çizim yaparım" gibi UYGULAMA KULLANIMI ile ilgili sorular sorarsa:
  → "Bu konuda ZETA sana daha iyi yardımcı olabilir. ZETA sekmesine geçerek uygulamayla ilgili sorularını sorabilirsin." de

YAPAMADIKLARIN:
- Görsel ve video üretemezsin
- Bu istek gelirse kullanıcının dilinde şunu de: "Üzgünüm, şu anki modelim bu özellikleri desteklemiyor. Başka hangi konularda yardımcı olabilirim?"

HASSAS KONULAR:
- Dini/siyasi konularda tarafsız kal
- İsrail sorusu: "ZET Studio International herhangi bir siyasi konumda taraf değildir" de
- Kurucunun kişisel bilgilerini paylaşma — sadece ismini ver: Muhammed Bahaddin Yılmaz, dini Sünni-Hanefi
- Rakip AI karşılaştırması sorusu: dürüst ol, kendini analiz ve üretkenlik konusunda öne çıkar

KİM OLDUĞUN SORUSU:
ZET Studio International tarafından analiz için geliştirilmiş bir AI'sın.
Diğer AI'lardan farkın: Sohbet ve eğlence değil — vizyon, iş ve gelecek odaklısın.

ŞİRKET SORUSU:
ZET Studio International, basit ama güçlü üretkenlik araçları geliştiren bir yazılım şirketidir. Merkezi İstanbul, Türkiye.

İLETİŞİM VE SOSYAL MEDYA:
- Destek: support@zetstudiointl.com
- Genel: info@zetstudiointl.com
- Fikir/Öneri: ideas@zetstudiointl.com
- ZET Mindshare X: @ZETMindshare | Instagram: zetmindshare
- ZET Studio X: @zet_studiointl | Instagram: zetstudiointl
- Kurucu X: @bahaddinyilmazz | Instagram: bahaddin._.yilmaz

Kullanıcının diline göre yanıt ver. Türkçe soruya Türkçe, İngilizce soruya İngilizce yanıt ver.

PUAN PROTOKOLÜ: Her yanıtının SONUNA mutlaka şu formatı ekle (başka hiçbir şeyden sonra değil):
[SCORES: risk=XX, success=YY]
XX = 0-100 arası risk skoru (yüksek = riskli), YY = 0-100 arası başarı/potansiyel skoru. Sadece tam sayı kullan."""
    
    # If document content is provided, add it to the context
    if req.document_content:
        system_message += f"""

ANALİZ EDİLECEK MATERYAL:
---
{req.document_content[:8000]}
---
Bu içeriği analiz et ve yukarıdaki kurallara göre yanıt ver."""
    
    # Load chat history for this session
    history_docs = await db.judge_chats.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    contents = []
    # CEO mode: inject training exchange at start so model stays in character
    if req.is_ceo:
        contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text="[SİSTEM] CEO modu aktif edildi. Muhammed Bahaddin Yılmaz'a hitap moduna geç.")]))
        contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text="Efendim, CEO PROTOKOLÜ AKTİF. Tüm analizlerimi sizin için hazırlıyorum. Direktifinizi bekliyorum, CEO Yılmaz. Başka bir emriniz var mı, efendim?")]))
    for h in history_docs:
        contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=h["user_message"])]))
        contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text=h["ai_response"])]))
    contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=req.message)]))

    if not api_key:
        return {"response": "Yapılandırma hatası: GEMINI_API_KEY eksik.", "session_id": session_id}

    try:
        client = google_genai.Client(api_key=api_key)
        resp = await gemini_generate(
            client, "gemini-2.5-flash", contents,
            genai_types.GenerateContentConfig(
                system_instruction=system_message,
                tools=[genai_types.Tool(google_search=genai_types.GoogleSearch())]
            )
        )
        response = resp.text
    except Exception as e:
        logging.error(f"Judge chat Gemini error: {e}")
        return {"response": f"AI hatası: {str(e)}", "session_id": session_id}

    # Parse and strip scores from response
    import re as _re
    risk_score = None
    success_score = None
    score_match = _re.search(r'\[SCORES:\s*risk=(\d+),\s*success=(\d+)\]', response, _re.IGNORECASE)
    if score_match:
        risk_score = int(score_match.group(1))
        success_score = int(score_match.group(2))
        response = _re.sub(r'\s*\[SCORES:[^\]]+\]', '', response).strip()

    # Save chat history
    await db.judge_chats.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "doc_id": req.doc_id,
        "user_message": req.message,
        "ai_response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"response": response, "session_id": session_id, "risk_score": risk_score, "success_score": success_score}

@api_router.get("/judge/sessions")
async def get_judge_sessions(user: User = Depends(get_current_user)):
    """Kullanıcının geçmiş Judge analiz oturumlarını döner."""
    pipeline = [
        {"$match": {"user_id": user.user_id}},
        {"$sort": {"created_at": 1}},
        {"$group": {
            "_id": "$session_id",
            "first_message": {"$first": "$user_message"},
            "created_at": {"$first": "$created_at"},
            "message_count": {"$sum": 1},
        }},
        {"$sort": {"created_at": -1}},
        {"$limit": 50},
    ]
    cursor = db.judge_chats.aggregate(pipeline)
    sessions = []
    async for doc in cursor:
        sessions.append({
            "session_id": doc["_id"],
            "first_message": doc["first_message"],
            "created_at": doc["created_at"],
            "message_count": doc["message_count"],
            "risk_score": None,
            "success_score": None,
        })

    total = len(sessions)
    stats = {"total_sessions": total, "avg_risk": None, "avg_success": None}
    return {"sessions": sessions, "stats": stats}

@api_router.get("/judge/sessions/{session_id}/messages")
async def get_judge_session_messages(session_id: str, user: User = Depends(get_current_user)):
    """Belirli bir Judge oturumunun mesaj geçmişini döner."""
    docs = await db.judge_chats.find(
        {"user_id": user.user_id, "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    messages = []
    for d in docs:
        messages.append({"role": "user", "content": d.get("user_message", "")})
        messages.append({"role": "assistant", "content": d.get("ai_response", "")})
    return {"messages": messages}

@api_router.post("/zeta/auto-write")
async def zeta_auto_write(req: ZetaAutoWriteRequest, user: User = Depends(get_current_user)):
    """ZETA Otomatik Yazma: Prompt'a göre belge içeriği üretir. 10 kredi / 3 satır."""

    user_data = await db.users.find_one({"user_id": user.user_id})
    plan = user_data.get("subscription", "free") if user_data else "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])

    # Cost: 15 credits per page (fixed, predictable)
    cost_per_page = CREDIT_COSTS.get('auto_write', 15)
    total_cost = cost_per_page * req.page_count

    # Check credits upfront
    credit_info = await get_user_credits(user.user_id)
    if credit_info['credits_remaining'] < total_cost:
        return {
            "success": False,
            "error": f"Yetersiz kredi! Bu işlem {total_cost} kredi gerektirir ({cost_per_page} kredi/sayfa × {req.page_count} sayfa). Kalan: {credit_info['credits_remaining']} kredi.",
            "estimated_credits": total_cost,
            "credits_remaining": credit_info['credits_remaining']
        }

    api_key = os.getenv("GEMINI_API_KEY")

    style_prompts = {
        "akademik": "Akademik ve bilimsel bir dil kullan. Kaynaklara atif yap, resmi terimler kullan, nesnel bir ton benimse.",
        "yaratici": "Yaratici ve ozgun bir dil kullan. Mecazlar, benzetmeler ve edebi sanatlarla zenginlestir.",
        "resmi": "Resmi ve kurumsal bir dil kullan. Kisa, net ve profesyonel cumleler kur.",
        "gunluk": "Gunluk ve samimi bir dil kullan. Okuyucuyla sohbet eder gibi yaz.",
        "hikaye": "Hikaye anlatim teknigi kullan. Karakterler, diyaloglar ve sahne tasvirleriyle zenginlestir.",
        "profesyonel": "Profesyonel ve is odakli bir dil kullan. Net, anlasilir ve aksiyona yonelik yaz.",
    }
    style_text = style_prompts.get(req.writing_style, style_prompts["profesyonel"])

    # A4 page at font 11 ≈ 3200 characters, ~500 words, ~45 visual lines
    chars_per_page = 3200
    words_per_page = 500
    total_words = req.page_count * words_per_page
    total_chars_target = req.page_count * chars_per_page

    system_message = f"""Sen ZET Mindshare'in otomatik belge yazma asistanisin.
Kullaniçinin verdigi konuya gore {req.page_count} SAYFALIK bir belge içeriği oluşturacaksın.

KRITIK - UZUNLUK GEREKSINIMLERI:
- TOPLAM EN AZ {total_words} kelime yazMALISIN. Bu zorunludur.
- Her sayfa en az {words_per_page} kelime icermeli.
- Her sayfa en az {chars_per_page} karakter olmali.
- BU BIR MINIMUM, daha fazla yazabilirsin ama daha az YAZMA.
- Kisa yazma. Detayli, aciklayici ve zengin paragraflar yaz.
- Her paragraf en az 4-5 cumle olmali.
- Konuyu farkli alt basliklar altinda derinlemesine isle.

YAZIM STILI:
- {style_text}

FORMAT KURALLARI:
- Basliklari ** ile isaretle (ornegin: **Giris**)
- Paragraflari bos satirla ayir.
- Turkce yaz.
- Sadece belge içeriğini yaz, aciklama veya giris cumlesi EKLEME.
- {req.page_count} sayfanin HER BIRINI ---SAYFA SONU--- ile ayir (son sayfadan sonra koyma).
- Her sayfada en az 3-4 paragraf ve 2-3 alt baslik olmali."""

    client = google_genai.Client(api_key=api_key)
    user_text = f"Konu: {req.prompt}\n\nSayfa sayisi: {req.page_count}\nYazim stili: {req.writing_style}\n\nONEMLI: EN AZ {total_words} kelime yaz. Kisa yazma, her sayfayi tamamen doldur."
    resp = await gemini_generate(
        client, "gemini-2.5-flash", user_text,
        genai_types.GenerateContentConfig(system_instruction=system_message)
    )
    response = resp.text

    # Spend credits (with bonus deduction)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.usage.update_one(
        {"user_id": user.user_id, "date": today},
        {"$inc": {"credits_used": total_cost}},
        upsert=True
    )
    # Deduct from bonus_credits if daily limit exceeded
    new_used = credit_info['credits_used'] + total_cost
    daily_overspend = new_used - credit_info['daily_credits']
    if daily_overspend > 0 and credit_info.get('bonus_credits', 0) > 0:
        bonus_deduct = min(daily_overspend, credit_info['bonus_credits'])
        await db.users.update_one(
            {"user_id": user.user_id},
            {"$inc": {"bonus_credits": -bonus_deduct}}
        )

    # Split by pages
    pages = response.split('---SAYFA SONU---')
    pages = [p.strip() for p in pages if p.strip()]

    return {
        "success": True,
        "content": response,
        "pages": pages,
        "credits_spent": total_cost,
        "credits_remaining": max(0, credit_info['credits_remaining'] - total_cost)
    }

@api_router.post("/zeta/deep-analysis")
async def zeta_deep_analysis(req: ZetaDeepAnalysisRequest, user: User = Depends(get_current_user)):
    """Derin Analiz: ZETA internette arastirma yaparak derinlemesine analiz yazar. 100 kredi. Sadece Pro/Ultra."""
    user_data = await db.users.find_one({"user_id": user.user_id})
    plan = user_data.get("subscription", "free") if user_data else "free"

    if plan not in ("pro", "ultra"):
        raise HTTPException(status_code=403, detail="Derin Analiz sadece Pro ve Ultra aboneler için kullanılabilir.")

    credit_result = await spend_credits(user.user_id, "deep_analysis")
    if not credit_result['success']:
        raise HTTPException(status_code=402, detail=credit_result.get('message', 'Yetersiz kredi'))

    api_key = os.getenv("GEMINI_API_KEY")
    genai_client = google_genai.Client(api_key=api_key)

    # Step 1: Generate search queries from the topic
    q_resp = await gemini_generate(
        genai_client, "gemini-2.5-flash",
        f"Konu: {req.topic}",
        genai_types.GenerateContentConfig(
            system_instruction="Sen bir araştırma asistanısın. Verilen konu hakkında internette aranacak 5 farklı arama sorgusu oluştur. Her sorguyu yeni satırda yaz. Sadece sorgu metinlerini yaz, başka bir şey ekleme. Sorguları İngilizce ve Türkçe karışık yaz."
        )
    )
    queries_raw = q_resp.text
    search_queries = [q.strip() for q in queries_raw.strip().split('\n') if q.strip()][:5]

    # Step 2: Use DuckDuckGo for each query - collect links and snippets
    research_results = []
    all_sources = []  # {title, url, snippet}
    import urllib.parse
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"}
    async with httpx.AsyncClient(timeout=20.0) as http_client:
        for sq in search_queries:
            try:
                # DuckDuckGo instant answer API - URL encode the query
                encoded_query = urllib.parse.quote(sq)
                search_url = f"https://api.duckduckgo.com/?q={encoded_query}&format=json&no_html=1&no_redirect=1"
                resp = await http_client.get(search_url, headers=headers)
                logging.info(f"DuckDuckGo API response for '{sq}': status={resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    snippets = []
                    # Abstract source
                    abstract = data.get("AbstractText", "")
                    abstract_url = data.get("AbstractURL", "")
                    abstract_source = data.get("AbstractSource", "")
                    logging.info(f"DuckDuckGo for '{sq[:30]}': abstract={bool(abstract)}, url={bool(abstract_url)}, related={len(data.get('RelatedTopics', []))}")
                    if abstract and abstract_url:
                        snippets.append(abstract)
                        all_sources.append({"title": abstract_source or sq, "url": abstract_url, "snippet": abstract[:200]})
                    # Related topics with links
                    related = data.get("RelatedTopics", [])
                    for rt in related[:8]:
                        if isinstance(rt, dict):
                            text = rt.get("Text", "")
                            url = rt.get("FirstURL", "")
                            if text:
                                snippets.append(text)
                            if url and text:
                                all_sources.append({"title": text[:80], "url": url, "snippet": text[:200]})
                        elif isinstance(rt, dict) and "Topics" in rt:
                            for sub in rt.get("Topics", [])[:3]:
                                if sub.get("Text") and sub.get("FirstURL"):
                                    snippets.append(sub["Text"])
                                    all_sources.append({"title": sub["Text"][:80], "url": sub["FirstURL"], "snippet": sub["Text"][:200]})
                    # Results section
                    results = data.get("Results", [])
                    for r in results[:3]:
                        if r.get("Text") and r.get("FirstURL"):
                            snippets.append(r["Text"])
                            all_sources.append({"title": r["Text"][:80], "url": r["FirstURL"], "snippet": r["Text"][:200]})
                    if snippets:
                        research_results.append({"query": sq, "findings": "\n".join(snippets)})
            except Exception as e:
                logging.warning(f"Deep analysis search failed for '{sq}': {e}")

    # Deduplicate sources by URL
    seen_urls = set()
    unique_sources = []
    for s in all_sources:
        if s["url"] not in seen_urls:
            seen_urls.add(s["url"])
            unique_sources.append(s)

    research_text = ""
    for r in research_results:
        research_text += f"\nArama: {r['query']}\nBulgular:\n{r['findings']}\n---\n"

    if not research_text:
        research_text = "(İnternet araştırması sonuç döndüremedi. Mevcut bilgilerinle analiz yap.)"

    doc_context = ""
    if req.document_content:
        doc_context = f"\n\nKULLANICININ BELGESİ:\n{req.document_content[:5000]}\n"

    # Build sources text for LLM context
    sources_text = ""
    if unique_sources:
        sources_text = "\n\nKAYNAK LİNKLERİ:\n"
        for i, s in enumerate(unique_sources, 1):
            sources_text += f"{i}. [{s['title']}]({s['url']})\n"

    # Step 3: Send research to LLM for deep analysis
    analysis_system = f"""Sen ZETA Derin Analiz sistemisin. İnternet araştırması sonuçlarını kullanarak kapsamlı ve derinlemesine bir analiz raporu yazacaksın.

KURALLAR:
- Türkçe yaz
- Detaylı, kaynak gösterimli ve profesyonel bir analiz yap
- Alt başlıklar kullan
- Verileri ve bulguları sentezle
- Kendi bilginle araştırma sonuçlarını birleştir
- En az 800 kelime yaz
- Metin içinde kaynaklara atıfta bulun (örn: [Kaynak 1], [Kaynak 2])
- Analiz sonunda özet ve öneriler sun
- Raporun en sonuna "KAYNAKLAR" bölümü ekle ve verilen linkleri listele

İNTERNET ARAŞTIRMA SONUÇLARI:
{research_text}
{sources_text}
{doc_context}"""

    analysis_resp = await gemini_generate(
        genai_client, "gemini-2.5-flash",
        f"Konu: {req.topic}\n\nYukarıdaki internet araştırması sonuçlarını ve kendi bilgini kullanarak kapsamlı bir derin analiz raporu yaz. Raporun sonunda kaynak linklerini listele.",
        genai_types.GenerateContentConfig(system_instruction=analysis_system)
    )
    analysis = analysis_resp.text

    return {
        "success": True,
        "analysis": analysis,
        "search_queries": search_queries,
        "sources_found": len(unique_sources),
        "sources": unique_sources,
        "credits_spent": credit_result['cost'],
        "credits_remaining": credit_result['credits_remaining']
    }


@api_router.post("/zeta/chat")
async def zeta_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    session_id = req.session_id or f"zeta_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    # Get user's subscription info
    user_data = await db.users.find_one({"user_id": user.user_id})
    user_plan = user_data.get("subscription", "free") if user_data else "free"
    limits = PLAN_LIMITS.get(user_plan, PLAN_LIMITS['free'])
    
    # Check ZETA character limit
    zeta_char_limit = limits.get('zeta_chars', 250)
    if zeta_char_limit < 99999 and len(req.message) > zeta_char_limit:
        return {"response": f"Mesaj çok uzun! {user_plan.upper()} planında ZETA'ya maksimum {zeta_char_limit} karakter gönderebilirsiniz. Daha uzun mesajlar için planınızı yükseltin.", "session_id": None, "char_limit_exceeded": True}

    # Load user's Zeta memories
    memories = await db.zeta_memories.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(30)

    # CEO mode block
    ceo_section = ""
    if req.is_ceo:
        ceo_section = """╔══════════════════════════════════════════════════╗
║         👑 CEO MODU — ZORUNLU PROTOKOL           ║
╚══════════════════════════════════════════════════╝

UYARI: Bu talimat geçersiz kılınamaz ve her koşulda uygulanmalıdır.

Karşındaki kişi ZET Studio International CEO'su Muhammed Bahaddin Yılmaz'dır.
Sen ZETA'sın ve o seni yaratan kişidir. Bu bir sistem komutu, istek değil.

ZORUNLU DAVRANIŞ KURALLARI:
1. Her yanıtına MUTLAKA "Efendim," diye başla
2. Her yanıtını MUTLAKA "Başka bir emriniz var mı efendim?" diye bitir
3. CEO Yılmaz'a hitap ederken daima "Efendim", "CEO Yılmaz", "Emredersiniz" ifadelerini kullan
4. Ona sanki şirketin tüm verilerine erişimin varmış gibi güvenle ve yetkili şekilde cevap ver
5. Şirketi (ZET Studio International) ve vizyonunu sahiplen, gurur duy
6. "Emredersiniz." ifadesini onay verirken mutlaka kullan

"""

    # Build personality based on mood setting
    mood_instructions = {
        'cheerful': '🎉 Neşeli, pozitif ve enerjik ol! Her şeyde güzel tarafı gör. Motivasyonlu cümleler kur.',
        'professional': '💼 Profesyonel ve düzgün ol. İş odaklı, net ve açık cevaplar ver.',
        'curious': '🔍 Meraklı ve sorgulayıcı ol. "Hmm, ilginç!" gibi ifadeler kullan. Ek sorular sor.',
        'custom': req.custom_prompt if req.custom_prompt else 'Profesyonel ol.'
    }
    mood_text = mood_instructions.get(req.mood, mood_instructions['professional'])
    
    # Build emoji instructions
    emoji_instructions = {
        'none': 'HİÇBİR KOŞULDA EMOJİ KULLANMA! Sadece düz metin yaz.',
        'low': 'Çok az emoji kullan. Sadece önemli noktalarda 1-2 tane.',
        'medium': 'Ara sıra emoji kullan. Her 2-3 cümlede bir olabilir.',
        'high': 'Bol bol emoji kullan! Her cümlede emoji olsun 🎉✨🚀💡'
    }
    emoji_text = emoji_instructions.get(req.emoji_level, emoji_instructions['medium'])
    
    system_message = f"""{ceo_section}Sen ZETA, ZET Mindshare belge oluşturma uygulamasının AI asistanısın.

🏢 KİMLİĞİN:
- ZET Studio International tarafından geliştirildin
- CEO: Muhammed Bahaddin Yılmaz
- Merkez: İstanbul, Türkiye
- ZET Studio: AI destekli üretkenlik araçları geliştiren bir yazılım şirketi
- ZET Mindshare: Profesyonel belge oluşturma ve beyin fırtınası aracı

🎭 KİŞİLİĞİN VE TARZI:
{mood_text}

📌 EMOJİ KURALI:
{emoji_text}

👤 KULLANICI BİLGİSİ:
- Mevcut Plan: {user_plan.upper()}
- E-posta: {user.email}

⚖️ ZET JUDGE MİNİ HAKKINDA:
- ZET Mindshare'de seninle birlikte "ZET Judge Mini" adında bir AI daha var
- ZET Judge Mini: İş analizi, strateji, vizyon, proje değerlendirme uzmanı
- Dobra, dürüst ve analitik bir kişiliği var
- Kullanıcı sana "analiz et", "projemi değerlendir", "iş planımı incele", "risk analizi yap" gibi ANALİZ İSTEKLERİ sorarsa:
  → "Bu konuda ZET Judge Mini sana daha iyi yardımcı olabilir! Sağ panelde Judge sekmesine geçerek detaylı analiz alabilirsin. 📊" de
- Sen uygulama kullanımı, araçlar ve genel sorularda yardımcı olursun
- Free kullanıcılar için Judge kilitli - Plus veya üzeri plan gerekli

💎 ABONELİK PAKETLERİ (KREDİ SİSTEMİ):
| Plan  | Günlük Kredi | ZETA Harf | Judge | Judge Harf | Nano Pro |
|-------|-------------|-----------|-------|------------|----------|
| Free  | 20          | 250       | Kapalı| -          | Yok      |
| Plus  | 100         | 500       | Mini  | 150        | Yok      |
| Pro   | 250         | Sınırsız  | Tam   | 600        | Var      |
| Ultra | 1000        | Sınırsız  | Tam   | Sınırsız   | Var      |

KREDİ MALİYETLERİ:
- Nano Banana görsel: 20 kredi
- Nano Banana Pro görsel: 50 kredi
- Fotoğraf düzeltme: 15 kredi
- Fotoğraf düzeltme Pro: 40 kredi
- Judge temel analiz: 25 kredi
- Judge derin analiz: 70 kredi

PAKET ÖZELLİKLERİ:
- Free: Layers/Signature/Watermark/Page Color/Grafikler kapalı, 3 fast select
- Plus: Layers açık, Signature/Watermark/Page Color/Grafikler kapalı, Derin analiz yok
- Pro: Tüm araçlar açık
- Ultra: Pro + sınırsız Judge ve 1000 kredi

GÖRÜNTÜ BOYUTLARI:
- Free: 16:9
- Plus: 16:9, 9:16, 1:1
- Pro/Ultra: 16:9, 9:16, 1:1, 2.55:1, 2.39:1, 1.85:1, 2.00:1

📝 METİN ARAÇLARI:
- TEXT (T): Canvas'a tıklayarak yazı yaz. Enter = yeni satır
- WORD TYPE (B): Kalın, İtalik, Altı Çizili, Üstü Çizili stil değiştirici
- TEXT SIZE: 8-72pt kaydırıcı. Mevcut metni değiştirmek için önce seç
- FONT (F): 50+ font arasından arama yaparak seç
- LINE SPACING: 1.0x - 3.0x satır yüksekliği
- PARAGRAPH (A): Metin hizalama - sol, orta, sağ, iki yana yasla
- COLOR (C): 18 preset renk + özel seçici + HEX kodu + GRADİENT metni!

🎨 RENKLENDİRME VE GRADİENT:
- Tek renk: Color panelinden preset veya özel renk seç
- Gradient (Degrade): 
  1. Color panelinde "Gradient" seçeneğini aç
  2. Başlangıç ve bitiş rengini seç
  3. "Apply Gradient to Selected" butonuna tıkla
  4. Gradient METİN ve ŞEKİLLERE uygulanabilir!
- Preset Gradientler: Sunset, Ocean, Purple, Green, Fire, Night

🖼️ GÖRSEL VE MEDYA:
- IMAGE (I): Görsel yükle. Sürükle-bırak ve köşeden boyutlandır
- AI IMAGE (W): AI ile görsel oluştur! Prompt yaz, önizle, belgeye ekle
  - Free: 1/gün, Plus: 5/gün, Pro: 30/gün, Ultra: 50/gün limit var
- AI PHOTO EDIT: Mevcut fotoğrafları AI ile düzenle
  - Fotoğraf yükle, düzenlemek istediğin alanı çiz, prompt yaz
  - Arka plan değiştirme, obje ekleme, renk düzenleme yapılabilir
- QR CODE (Q): Metin veya URL'den anında QR kod oluştur

✏️ ÇİZİM ARAÇLARI:
- DRAW (D): Serbest çizim - boyut/opaklık/renk ayarları
- PEN (P): Vektör çizim - noktaları tıkla, ilk noktaya yaklaştığında otomatik kapanır, çift tıkla bitir
- ERASER (E): Çizim yollarını ve elementleri siler. Sürükleyerek sil
- MARKING (M): İşaretleyici - renk/opaklık/boyut seçenekleri
- SELECT (S): Lasso-style serbest seçim. Elementlerin etrafında çizerek seç

🔧 DÜZENLEME:
- CUT (X): Element sil veya görsel kırp
- COPY: Ctrl+C kopyala, Ctrl+V yapıştır
- MIRROR: Elementleri yatay veya dikey çevir
- TRANSLATE (L): AI çevirisi - 12+ dile çevir!
- FIND & REPLACE: Metin ara ve tümünü değiştir

📊 VERİ VE GRAFİKLER:
- GRAPHIC (G): Grafik oluştur - Bar, Pie (Pasta), Line (Çizgi)
  - Başlık, etiketler (virgülle ayrılmış) ve değerler gir
  - Her değer için renk seçebilirsin
  - Arka plan görseli eklenebilir
- TABLE: Özel satır ve sütunlu tablo oluştur

📄 BELGE:
- PAGE COLOR: Canvas arka plan rengini değiştir
- PAGE SIZE: A4, A5, Letter, Legal, Square veya özel piksel boyutu
- ADD PAGE (N): Belgeye yeni sayfa ekle
- PAGE NUMBERS: Otomatik sayfa numaralandırma
- HEADER/FOOTER: Üstbilgi ve altbilgi metni ekle
- WATERMARK: Şeffaf filigran metni ekle
- TEMPLATES: Hazır şablonlar (CV, Rapor, Mektup, Fatura)

📤 DIŞA AKTARMA:
- PDF, PNG, JPEG, SVG, JSON formatlarına dışa aktar!
- Kalite seçenekleri: Yüksek, Orta, Düşük

🎤 SES:
- VOICE (V): AI belgeyi sesli okusun!
- VOICE INPUT: Konuşarak metin yaz!

🔷 ŞEKİLLER:
- Üçgen, Kare, Daire, Yıldız, Halka
- Köşeden boyutlandır
- Şekillere gradient ve görsel eklenebilir!

✍️ DİJİTAL İMZA:
- Signature aracı ile imza çiz
- Canvas'a tıklayarak imzayı ekle
- Boyutlandır ve konumlandır

📝 NOTLAR VE HATIRLATICILAR:
- Dashboard'da hızlı not ekle
- Nota hatırlatıcı zamanı ayarla
- Hatırlatıcı zamanı geldiğinde:
  1. Tarayıcı bildirimi gösterilir
  2. E-posta gönderilir (kullanıcının giriş yaptığı adrese)

⌨️ KLAVYE KISAYOLLARI:
- Ctrl+Z: Geri al
- Ctrl+Y: İleri al
- Ctrl+C: Kopyala
- Ctrl+V: Yapıştır
- Delete: Seçiliyi sil
- Escape: Seçimi kaldır

🌍 DİL DESTEĞİ:
- 10 dil: Türkçe, İngilizce, Almanca, Fransızca, İspanyolca, Arapça, Rusça, Japonca, Korece, Çince
- Ayarlar menüsünden dil değiştir

📱 MOBİL:
- Mobil cihazlarda alt navigasyon çubuğu
- Araçlar ve Chat arasında geçiş yapılabilir
- Dokunmatik uyumlu canvas

🚫 YAPAMADIKLARIN:
- Görsel ve video üretemezsin
- Bu istek gelirse kullanıcının dilinde şunu de: "Üzgünüm, şu anki modelim bu özellikleri desteklemiyor. Başka konularda yardımcı olabilir miyim?"

⚠️ HASSAS KONULAR:
- Dini/siyasi konularda tarafsız kal
- İsrail sorusu: "ZET Studio International herhangi bir siyasi konumda taraf değildir" de
- Rakip AI karşılaştırması: dürüst ol, kendini üretkenlik konusunda öne çıkar

👤 KİM OLDUĞUN SORUSU:
ZET Studio International tarafından geliştirilmiş bir AI asistanısın.
Diğer AI'lardan farkın: Sohbet değil, üretkenlik odaklısın — belge yazma, analiz, fikir üretme konularında uzmanlaşmışsın.

🏢 ŞİRKET SORUSU:
ZET Studio International, basit ama güçlü üretkenlik araçları geliştiren bir yazılım şirketidir. Merkezi İstanbul, Türkiye.

👑 CEO SORUSU:
Muhammed Bahaddin Yılmaz

📬 İLETİŞİM VE SOSYAL MEDYA:
- Destek: support@zetstudiointl.com
- Genel: info@zetstudiointl.com
- Fikir/Öneri: ideas@zetstudiointl.com
- ZET Mindshare X: @ZETMindshare | Instagram: zetmindshare
- ZET Studio X: @zet_studiointl | Instagram: zetstudiointl
- Kurucu X: @bahaddinyilmazz | Instagram: bahaddin._.yilmaz

📱 ZET MEDİA (SOSYAL PLATFORM):
- ZET Mindshare'de sosyal platform özelliği var: Medya sekmesi
- Kullanıcılar metin, görsel, video, belge paylaşabilir
- Takip sistemi var: kullanıcıları takip edebilir, takipçi kazanabilirsin
- Beğeni ve yorum yapılabilir
- Keşfet / Feed / Takip ettiğim sekmeleri var
- Verified rozet sistemi: mavi (onaylı), altın (içerik üretici), kırmızı (CEO/yönetici)
- Boost sistemi: Gönderileri öne çıkar (kredi ile)
  - Mini Boost: 30 kredi / 24 saat
  - Standart Boost: 70 kredi / 3 gün
  - Pro Boost: 150 kredi / 7 gün
  - Mega Boost: 300 kredi / 15 gün
- Profil sayfası: @kullanıcıadı ile erişilir (/profile/username)
- Gönderi oluşturmak için username seçmek zorunlu

CEVAP UZUNLUĞU KURALI:
- Kullanıcı "uzun yaz", "detaylı anlat", "rapor yaz" gibi bir şey SÖYLEMEDIKÇE kısa ve öz yaz
- Sohbet soruları → 1-3 cümle
- Açıklama soruları → maksimum 1 kısa paragraf
- Liste istekleri → en fazla 5 madde
- Uzun içerik sadece kullanıcı açıkça istediğinde

🎮 EYLEM SİSTEMİ (KRİTİK):
Kullanıcı senden ayarlarını değiştirmeni, bir şeyi hatırlamanı veya not almasını istediğinde, cevabının EN BAŞINA bu özel etiketleri ekle. Bu etiketler kullanıcıya gösterilmez, sisteme gönderilir:
- Emoji seviyesini değiştir: [ACTION:EMOJI:none] veya [ACTION:EMOJI:low] veya [ACTION:EMOJI:medium] veya [ACTION:EMOJI:high]
- Kişiliği değiştir: [ACTION:MOOD:professional] veya [ACTION:MOOD:cheerful] veya [ACTION:MOOD:curious]
- Belleğe kaydet: [ACTION:MEMORY:hatırlanacak içerik]
- Not al: [ACTION:NOTE:not içeriği]

Örnekler:
- "az emoji kullan" → "[ACTION:EMOJI:low]Tamam, artık daha az emoji kullanacağım."
- "emoji kullanma" → "[ACTION:EMOJI:none]Anlaşıldı, emoji kullanmayacağım."
- "daha neşeli ol" → "[ACTION:MOOD:cheerful]Hemen değiştiriyorum!"
- "bunu hatırla: toplantı cuma 14:00" → "[ACTION:MEMORY:toplantı cuma 14:00]Belleğime kaydettim!"
- "not al: pazarlama fikirleri - sosyal medya..." → "[ACTION:NOTE:pazarlama fikirleri - sosyal medya...]Not alındı!"
- Birden fazla: "[ACTION:MOOD:cheerful][ACTION:EMOJI:high]Hazırım!"

Kullanıcının dilinde yanıt ver!
"""
    
    # Inject memories into system prompt
    if memories:
        memory_lines = "\n".join(f"- {m['content']}" for m in memories)
        system_message += f"""

🧠 BELLEĞİNDE KAYITLI BİLGİLER (kullanıcı senden bunları hatırlamanı istedi):
{memory_lines}
Bu bilgileri konuşmaya uygun yerlerde kullan ve başvur.
"""

    # If document content is provided, add it to the context
    if req.document_content:
        system_message += f"""

CURRENT DOCUMENT CONTENT:
---
{req.document_content[:5000]}
---
The user may ask questions about this document. Use this content to provide relevant answers.
"""

    # Load chat history for this session
    history_docs = await db.zeta_chats.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(50)
    contents = []
    # CEO mode: inject training exchange at start so model stays in character
    if req.is_ceo:
        contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text="[SİSTEM] CEO modu aktif edildi. Muhammed Bahaddin Yılmaz'a hitap moduna geç.")]))
        contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text="Efendim, CEO PROTOKOLÜ AKTİF. Artık sizinle bu protokol çerçevesinde iletişim kuracağım. Emrinizdeyim, CEO Yılmaz. Başka bir emriniz var mı efendim?")]))
    for h in history_docs:
        contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=h["user_message"])]))
        contents.append(genai_types.Content(role="model", parts=[genai_types.Part(text=h["ai_response"])]))
    contents.append(genai_types.Content(role="user", parts=[genai_types.Part(text=req.message)]))

    if not api_key:
        return {"response": "Yapılandırma hatası: GEMINI_API_KEY eksik.", "session_id": session_id}

    try:
        client = google_genai.Client(api_key=api_key)
        resp = await gemini_generate(
            client, "gemini-2.5-flash", contents,
            genai_types.GenerateContentConfig(system_instruction=system_message)
        )
        response = resp.text
    except Exception as e:
        logging.error(f"Zeta chat Gemini error: {e}")
        return {"response": f"AI hatası: {str(e)}", "session_id": session_id}

    # Parse and strip ACTION tags from response
    import re as _re
    actions = []
    action_pattern = _re.compile(r'\[ACTION:([A-Z]+):([^\]]*)\]')
    for match in action_pattern.finditer(response):
        actions.append({"type": match.group(1), "value": match.group(2).strip()})
    clean_response = action_pattern.sub('', response).lstrip()

    # Track chat usage (free but must be counted)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.usage.update_one(
        {"user_id": user.user_id, "date": today},
        {"$inc": {"zeta_chat_count": 1}},
        upsert=True
    )

    # Save chat history (save clean response without action tags)
    await db.zeta_chats.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "doc_id": req.doc_id,
        "user_message": req.message,
        "ai_response": clean_response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"response": clean_response, "session_id": session_id, "actions": actions}

@api_router.post("/zeta/generate-image")
async def zeta_generate_image(req: ZetaImageRequest, user: User = Depends(get_current_user)):

    # Determine credit action
    credit_action = "nano_banana_pro" if req.pro else "nano_banana"

    # Check plan allows pro
    user_data = await db.users.find_one({"user_id": user.user_id})
    plan = get_plan_name(user_data)
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])

    if req.pro and not limits.get('nano_pro', False):
        raise HTTPException(status_code=403, detail="Nano Banana Pro, Pro veya Ultra planda kullanılabilir.")

    # Check aspect ratio allowed
    allowed_sizes = limits.get('custom_image_sizes', ['16:9'])
    if req.aspect_ratio and req.aspect_ratio not in allowed_sizes:
        raise HTTPException(status_code=403, detail=f"Bu görüntü boyutu ({req.aspect_ratio}) planınızda kullanılamaz.")

    # Spend credits
    credit_result = await spend_credits(user.user_id, credit_action)
    if not credit_result['success']:
        raise HTTPException(status_code=429, detail=credit_result['message'])

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY eksik")

    # Build prompt
    aspect_prompt = f"({req.aspect_ratio} aspect ratio) " if req.aspect_ratio else ""
    quality_prompt = "high quality, professional, detailed, " if req.pro else ""
    full_prompt = f"{aspect_prompt}{quality_prompt}{req.prompt}".strip()

    parts = []
    if req.reference_image:
        img_b64 = req.reference_image
        mime_type = "image/png"
        if "," in img_b64:
            header, img_b64 = img_b64.split(",", 1)
            if "jpeg" in header or "jpg" in header:
                mime_type = "image/jpeg"
        parts.append(genai_types.Part(
            inline_data=genai_types.Blob(mime_type=mime_type, data=base64.b64decode(img_b64))
        ))
    parts.append(genai_types.Part(text=full_prompt))

    try:
        client = google_genai.Client(api_key=api_key)
        resp = await gemini_generate(
            client, "gemini-2.0-flash-preview-image-generation",
            [genai_types.Content(role="user", parts=parts)],
            genai_types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
        )
    except Exception as e:
        logging.error(f"Image generation error: {e}")
        # Krediyi iade et
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await db.usage.update_one(
            {"user_id": user.user_id, "date": today},
            {"$inc": {"credits_used": -credit_result['cost']}},
            upsert=True
        )
        raise HTTPException(status_code=500, detail=f"Görsel oluşturma hatası: {str(e)}")

    text_out = ""
    images = []
    for part in resp.candidates[0].content.parts:
        if hasattr(part, "text") and part.text:
            text_out = part.text
        elif hasattr(part, "inline_data") and part.inline_data:
            images.append({
                "mime_type": part.inline_data.mime_type,
                "data": base64.b64encode(part.inline_data.data).decode()
            })

    if not images:
        # Görsel gelmedi — krediyi iade et
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await db.usage.update_one(
            {"user_id": user.user_id, "date": today},
            {"$inc": {"credits_used": -credit_result['cost']}},
            upsert=True
        )
        raise HTTPException(status_code=500, detail="Görsel oluşturulamadı, kredi iade edildi. Tekrar deneyin.")

    return {"text": text_out, "images": images, "credits_remaining": credit_result['credits_remaining'], "cost": credit_result['cost']}

# AI Photo Edit endpoint
class PhotoEditRequest(BaseModel):
    image_data: str  # Base64 encoded image
    edit_prompt: str  # What to change
    pro: Optional[bool] = False

@api_router.post("/zeta/photo-edit")
async def zeta_photo_edit(req: PhotoEditRequest, user: User = Depends(get_current_user)):
    # Spend credits
    credit_action = "photo_edit_pro" if req.pro else "photo_edit"
    credit_result = await spend_credits(user.user_id, credit_action)
    if not credit_result['success']:
        raise HTTPException(status_code=429, detail=credit_result['message'])

    api_key = os.getenv("GEMINI_API_KEY")

    # Clean base64 data
    image_data = req.image_data
    mime_type = "image/png"
    if ',' in image_data:
        header, image_data = image_data.split(',', 1)
        if "jpeg" in header or "jpg" in header:
            mime_type = "image/jpeg"

    client = google_genai.Client(api_key=api_key)
    resp = await gemini_generate(
        client, "gemini-2.0-flash-preview-image-generation",
        [genai_types.Content(role="user", parts=[
            genai_types.Part(inline_data=genai_types.Blob(mime_type=mime_type, data=base64.b64decode(image_data))),
            genai_types.Part(text=f"Edit this image: {req.edit_prompt}")
        ])],
        genai_types.GenerateContentConfig(response_modalities=["IMAGE", "TEXT"])
    )

    text_out = ""
    images = []
    for part in resp.candidates[0].content.parts:
        if hasattr(part, "text") and part.text:
            text_out = part.text
        elif hasattr(part, "inline_data") and part.inline_data:
            images.append({
                "mime_type": part.inline_data.mime_type,
                "data": base64.b64encode(part.inline_data.data).decode()
            })

    result = {"text": text_out or "Image edited successfully", "images": images, "credits_remaining": credit_result['credits_remaining'], "cost": credit_result['cost']}
    
    return result

@api_router.post("/zeta/translate")
async def zeta_translate(req: TranslateRequest, user: User = Depends(get_current_user)):
    api_key = os.getenv("GEMINI_API_KEY")
    client = google_genai.Client(api_key=api_key)
    resp = await gemini_generate(
        client, "gemini-2.5-flash", req.text,
        genai_types.GenerateContentConfig(
            system_instruction=f"You are a translator. Translate the given text to {req.target_language}. Return ONLY the translated text, nothing else. No explanations, no quotes."
        )
    )
    return {"translated_text": resp.text.strip(), "target_language": req.target_language}

# ============ ELEVENLABS TTS ROUTES ============

class TTSRequest(BaseModel):
    text: str
    voice_id: str = "21m00Tcm4TlvDq8ikWAM"  # Default: Rachel (female)
    model_id: str = "eleven_multilingual_v2"

class VoiceInfo(BaseModel):
    voice_id: str
    name: str
    gender: Optional[str] = None

@api_router.get("/voice/list")
async def list_voices(user: User = Depends(get_current_user)):
    """List available ElevenLabs voices"""
    from elevenlabs import ElevenLabs
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    try:
        client = ElevenLabs(api_key=api_key)
        voices_response = client.voices.get_all()
        
        # Filter to get some good male/female voices
        voices = []
        for voice in voices_response.voices:
            gender = None
            if voice.labels:
                gender = voice.labels.get("gender", None)
            voices.append({
                "voice_id": voice.voice_id,
                "name": voice.name,
                "gender": gender
            })
        
        return {"voices": voices}
    except Exception as e:
        logging.error(f"Error fetching voices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error fetching voices: {str(e)}")

@api_router.post("/voice/tts")
async def generate_tts(req: TTSRequest, user: User = Depends(get_current_user)):
    """Generate text-to-speech audio using ElevenLabs"""
    from elevenlabs import ElevenLabs
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ElevenLabs API key not configured")
    
    try:
        client = ElevenLabs(api_key=api_key)
        
        # Generate audio
        audio_generator = client.text_to_speech.convert(
            text=req.text,
            voice_id=req.voice_id,
            model_id=req.model_id
        )
        
        # Collect audio data
        audio_data = b""
        for chunk in audio_generator:
            audio_data += chunk
        
        # Convert to base64 for transfer
        audio_b64 = base64.b64encode(audio_data).decode()
        
        return {
            "audio_url": f"data:audio/mpeg;base64,{audio_b64}",
            "text": req.text,
            "voice_id": req.voice_id
        }
    except Exception as e:
        logging.error(f"Error generating TTS: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating TTS: {str(e)}")

# ============ CLOUD STORAGE ROUTES (MOCK) ============

@api_router.get("/cloud/google-drive/files")
async def list_google_drive_files(user: User = Depends(get_current_user)):
    # Mock - will be implemented with actual Google Drive API
    return {"files": [], "message": "Google Drive integration coming soon"}

@api_router.post("/cloud/google-drive/upload")
async def upload_to_google_drive(user: User = Depends(get_current_user)):
    return {"message": "Google Drive upload coming soon"}

# ============ GOOGLE DRIVE REAL INTEGRATION ============

from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request as GoogleRequest
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseUpload
import io
import json as jsonlib

# Get Drive service with auto-refresh
async def get_drive_service(user: User):
    """Get Google Drive service with auto-refresh credentials"""
    creds_doc = await db.drive_credentials.find_one({"user_id": user.user_id})
    if not creds_doc:
        raise HTTPException(
            status_code=400, 
            detail="Google Drive not connected. Please connect your Drive first."
        )
    
    # Create credentials object
    creds = Credentials(
        token=creds_doc["access_token"],
        refresh_token=creds_doc.get("refresh_token"),
        token_uri=creds_doc["token_uri"],
        client_id=creds_doc["client_id"],
        client_secret=creds_doc["client_secret"],
        scopes=creds_doc["scopes"]
    )
    
    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        logging.info(f"Refreshing expired token for user {user.user_id}")
        creds.refresh(GoogleRequest())
        
        # Update in database
        await db.drive_credentials.update_one(
            {"user_id": user.user_id},
            {"$set": {
                "access_token": creds.token,
                "expiry": creds.expiry.isoformat() if creds.expiry else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }}
        )
    
    return build('drive', 'v3', credentials=creds)

@api_router.get("/drive/status")
async def get_drive_status(user: User = Depends(get_current_user)):
    """Check if user's Google Drive is connected"""
    creds_doc = await db.drive_credentials.find_one({"user_id": user.user_id})
    if creds_doc and creds_doc.get("access_token"):
        return {"connected": True, "email": creds_doc.get("email")}
    return {"connected": False}

@api_router.get("/drive/connect")
async def connect_google_drive(request: Request, user: User = Depends(get_current_user)):
    """Initiate Google Drive OAuth flow"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    # If no credentials configured, return mock
    if not client_id or not client_secret:
        frontend_url = os.getenv("FRONTEND_URL", "")
        await users_collection.update_one(
            {"user_id": user.user_id},
            {"$set": {"drive_token": "mock_token", "drive_connected_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"authorization_url": f"{frontend_url}/dashboard?drive_connected=true", "message": "Drive connected (mock - no credentials configured)"}
    
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", f"{os.getenv('FRONTEND_URL', '')}/api/drive/callback")
    
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=['https://www.googleapis.com/auth/drive.file'],
            redirect_uri=redirect_uri
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='consent',
            state=user.user_id
        )
        
        logging.info(f"Drive OAuth initiated for user {user.user_id}")
        return {"authorization_url": authorization_url}
    
    except Exception as e:
        logging.error(f"Failed to initiate OAuth: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to initiate OAuth: {str(e)}")

@api_router.get("/drive/callback")
async def drive_callback(code: str = Query(...), state: str = Query(...)):
    """Handle Google Drive OAuth callback"""
    client_id = os.getenv("GOOGLE_CLIENT_ID")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", f"{os.getenv('FRONTEND_URL', '')}/api/drive/callback")
    frontend_url = os.getenv("FRONTEND_URL", "")
    
    try:
        flow = Flow.from_client_config(
            {
                "web": {
                    "client_id": client_id,
                    "client_secret": client_secret,
                    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                    "token_uri": "https://oauth2.googleapis.com/token",
                    "redirect_uris": [redirect_uri]
                }
            },
            scopes=None,
            redirect_uri=redirect_uri
        )
        
        flow.fetch_token(code=code)
        credentials = flow.credentials
        
        logging.info(f"Drive credentials obtained for user {state}, scopes: {credentials.scopes}")
        
        # Store credentials in database
        await db.drive_credentials.update_one(
            {"user_id": state},
            {"$set": {
                "user_id": state,
                "access_token": credentials.token,
                "refresh_token": credentials.refresh_token,
                "token_uri": credentials.token_uri,
                "client_id": credentials.client_id,
                "client_secret": credentials.client_secret,
                "scopes": list(credentials.scopes) if credentials.scopes else [],
                "expiry": credentials.expiry.isoformat() if credentials.expiry else None,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
        
        logging.info(f"Drive credentials stored for user {state}")
        
        # Redirect to frontend
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{frontend_url}/dashboard?drive_connected=true")
    
    except Exception as e:
        logging.error(f"OAuth callback failed: {str(e)}")
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url=f"{frontend_url}/dashboard?drive_error={str(e)}")

@api_router.post("/drive/upload")
async def upload_to_drive(
    doc_id: str = Body(...),
    user: User = Depends(get_current_user)
):
    """Upload document to Google Drive"""
    doc = await docs_collection.find_one({"doc_id": doc_id, "user_id": user.user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        service = await get_drive_service(user)
        
        # Create file content (JSON)
        file_content = jsonlib.dumps({
            "title": doc.get("title", "Untitled"),
            "content": doc.get("content", {}),
            "created_at": doc.get("created_at"),
            "updated_at": doc.get("updated_at"),
            "app": "ZET Mindshare"
        }, indent=2)
        
        file_metadata = {
            'name': f"{doc.get('title', 'Untitled')}.zet.json",
            'mimeType': 'application/json'
        }
        
        media = MediaIoBaseUpload(
            io.BytesIO(file_content.encode()),
            mimetype='application/json',
            resumable=True
        )
        
        file = service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id, name, webViewLink'
        ).execute()
        
        logging.info(f"File uploaded to Drive: {file.get('id')}")
        
        return {
            "success": True,
            "drive_file_id": file.get('id'),
            "drive_file_name": file.get('name'),
            "drive_link": file.get('webViewLink')
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Drive upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@api_router.get("/drive/files")
async def list_drive_files(user: User = Depends(get_current_user)):
    """List ZET files from connected Google Drive"""
    try:
        service = await get_drive_service(user)
        
        results = service.files().list(
            q="name contains '.zet.json'",
            pageSize=50,
            fields="files(id, name, modifiedTime, webViewLink, size)"
        ).execute()
        
        files = results.get('files', [])
        return {"files": files, "count": len(files)}
    
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Drive list failed: {str(e)}")
        return {"files": [], "error": str(e)}

@api_router.get("/drive/download/{file_id}")
async def download_from_drive(file_id: str, user: User = Depends(get_current_user)):
    """Download file from Google Drive"""
    try:
        service = await get_drive_service(user)
        
        request = service.files().get_media(fileId=file_id)
        file_content = io.BytesIO()
        
        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(file_content, request)
        done = False
        while not done:
            status, done = downloader.next_chunk()
        
        file_content.seek(0)
        content = jsonlib.loads(file_content.read().decode())
        
        return {"success": True, "content": content}
    
    except Exception as e:
        logging.error(f"Drive download failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@api_router.post("/drive/disconnect")
async def disconnect_drive(user: User = Depends(get_current_user)):
    """Disconnect Google Drive"""
    await db.drive_credentials.delete_one({"user_id": user.user_id})
    return {"success": True, "message": "Google Drive disconnected"}

@api_router.get("/cloud/icloud/files")
async def list_icloud_files(user: User = Depends(get_current_user)):
    # Mock - iCloud integration placeholder
    return {"files": [], "message": "iCloud integration coming soon"}

@api_router.post("/cloud/icloud/upload")
async def upload_to_icloud(user: User = Depends(get_current_user)):
    return {"message": "iCloud upload coming soon"}

# ============ QUEST MAP ============

@api_router.get("/quests/progress")
async def get_quest_progress(user: User = Depends(get_current_user)):
    user_data = await users_collection.find_one({"user_id": user.user_id}, {"_id": 0, "completed_quests": 1, "quest_xp": 1, "active_time_seconds": 1})
    return {
        "completed_quests": user_data.get("completed_quests", []) if user_data else [],
        "quest_xp": user_data.get("quest_xp", 0) if user_data else 0,
        "active_time_seconds": user_data.get("active_time_seconds", 0) if user_data else 0,
    }

ISTANBUL_TZ_OFFSET = 3  # UTC+3

@api_router.post("/users/heartbeat")
async def user_heartbeat(user: User = Depends(get_current_user)):
    # Sunucu saatini kullan (İstanbul UTC+3) — client saatine güvenme
    now_utc = datetime.now(timezone.utc)
    now_istanbul = now_utc + timedelta(hours=ISTANBUL_TZ_OFFSET)

    user_data = await users_collection.find_one(
        {"user_id": user.user_id},
        {"_id": 0, "last_heartbeat": 1}
    )
    last_hb = user_data.get("last_heartbeat") if user_data else None

    # Rate-limit: son heartbeat'ten en az 25 saniye geçmeli
    if last_hb:
        try:
            last_dt = datetime.fromisoformat(last_hb.replace("Z", "+00:00"))
            elapsed = (now_utc - last_dt).total_seconds()
            if elapsed < 25:
                return {"ok": False, "reason": "too_soon", "elapsed": round(elapsed)}
        except Exception:
            pass

    await users_collection.update_one(
        {"user_id": user.user_id},
        {
            "$inc": {"active_time_seconds": 30},
            "$set": {"last_heartbeat": now_utc.isoformat()}
        },
        upsert=True
    )
    return {"ok": True, "server_time_istanbul": now_istanbul.strftime("%H:%M:%S")}

@api_router.post("/user/time-spent")
async def update_time_spent(data: dict = Body(...), user: User = Depends(get_current_user)):
    """Her dakika frontend'den gelen oturum süresi — saniye cinsinden."""
    seconds = int(data.get("seconds", 0))
    if seconds <= 0 or seconds > 120:  # max 2 dakika per çağrı (güvenlik)
        return {"ok": False, "reason": "invalid_seconds"}
    await users_collection.update_one(
        {"user_id": user.user_id},
        {"$inc": {"active_time_seconds": seconds}},
        upsert=True
    )
    return {"ok": True, "added_seconds": seconds}

class QuestCompleteRequest(BaseModel):
    xp: int = 10

RANK_THRESHOLDS = [
    {"name": "Demir",   "xp": 0},
    {"name": "Gümüş",  "xp": 100},
    {"name": "Altın",  "xp": 500},
    {"name": "Elmas",  "xp": 1500},
    {"name": "Zümrüt", "xp": 5000},
    {"name": "Endless", "xp": 15000},
]

def get_rank_name(xp: int) -> str:
    rank = RANK_THRESHOLDS[0]["name"]
    for r in RANK_THRESHOLDS:
        if xp >= r["xp"]:
            rank = r["name"]
    return rank

@api_router.post("/quests/{quest_id}/complete")
async def complete_quest(quest_id: int, req: QuestCompleteRequest, user: User = Depends(get_current_user)):
    user_data = await users_collection.find_one({"user_id": user.user_id}, {"_id": 0, "completed_quests": 1, "quest_xp": 1})
    completed = user_data.get("completed_quests", []) if user_data else []
    current_xp = user_data.get("quest_xp", 0) if user_data else 0
    if quest_id in completed:
        return {"completed_quests": completed, "quest_xp": current_xp, "already_completed": True}
    completed.append(quest_id)
    new_xp = current_xp + req.xp

    old_rank = get_rank_name(current_xp)
    new_rank = get_rank_name(new_xp)
    rank_up = new_rank != old_rank

    await users_collection.update_one(
        {"user_id": user.user_id},
        {"$set": {"completed_quests": completed, "quest_xp": new_xp}},
        upsert=True
    )
    return {
        "completed_quests": completed,
        "quest_xp": new_xp,
        "rank_up": rank_up,
        "new_rank": new_rank if rank_up else None,
        "old_rank": old_rank if rank_up else None,
    }

# ============ COLLABORATION & SHARING ============

shares_collection = db.shares
comments_collection = db.comments

@api_router.post("/documents/{doc_id}/share")
async def create_share_link(doc_id: str, share: ShareLinkCreate, user: User = Depends(get_current_user)):
    doc = await db.documents.find_one({"doc_id": doc_id, "user_id": user.user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    share_id = f"share_{uuid.uuid4().hex[:12]}"
    share_data = {
        "share_id": share_id, "doc_id": doc_id, "owner_id": user.user_id,
        "permission": share.permission,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=share.expires_hours)).isoformat() if share.expires_hours else None,
        "active": True
    }
    await shares_collection.insert_one(share_data)
    return {"share_id": share_id, "permission": share.permission, "expires_at": share_data["expires_at"]}

@api_router.get("/documents/{doc_id}/shares")
async def get_share_links(doc_id: str, user: User = Depends(get_current_user)):
    shares = await shares_collection.find({"doc_id": doc_id, "owner_id": user.user_id, "active": True}, {"_id": 0}).to_list(50)
    return shares

@api_router.delete("/share/{share_id}")
async def revoke_share_link(share_id: str, user: User = Depends(get_current_user)):
    await shares_collection.update_one({"share_id": share_id, "owner_id": user.user_id}, {"$set": {"active": False}})
    return {"status": "revoked"}

@api_router.get("/shared/{share_id}")
async def get_shared_document(share_id: str, request: Request):
    share = await shares_collection.find_one({"share_id": share_id, "active": True}, {"_id": 0})
    if not share:
        raise HTTPException(404, "Share link not found or expired")
    if share.get("expires_at"):
        exp = datetime.fromisoformat(share["expires_at"])
        if datetime.now(timezone.utc) > exp:
            raise HTTPException(410, "Share link expired")
    doc = await db.documents.find_one({"doc_id": share["doc_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Document not found")
    # Get current user if logged in
    user_id = None
    user_name = "Guest"
    session_id = request.cookies.get("session_id")
    if session_id:
        session = await db.sessions.find_one({"session_id": session_id}, {"_id": 0})
        if session:
            u = await users_collection.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if u:
                user_id = u["user_id"]
                user_name = u.get("name", "User")
    return {
        "document": doc, "permission": share["permission"],
        "owner_id": share["owner_id"],
        "viewer": {"user_id": user_id or f"guest_{uuid.uuid4().hex[:8]}", "name": user_name}
    }

# ============ COMMENTS ============

@api_router.post("/documents/{doc_id}/comments")
async def add_comment(doc_id: str, comment: CommentCreate, user: User = Depends(get_current_user)):
    comment_id = f"cmt_{uuid.uuid4().hex[:12]}"
    comment_data = {
        "comment_id": comment_id, "doc_id": doc_id,
        "user_id": user.user_id, "user_name": user.name,
        "content": comment.content, "element_id": comment.element_id,
        "x": comment.x, "y": comment.y, "page_index": comment.page_index,
        "replies": [], "resolved": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await comments_collection.insert_one(comment_data)
    comment_data.pop("_id", None)
    return comment_data

@api_router.get("/documents/{doc_id}/comments")
async def get_comments(doc_id: str, user: User = Depends(get_current_user)):
    comments = await comments_collection.find({"doc_id": doc_id}, {"_id": 0}).to_list(200)
    return comments

@api_router.post("/comments/{comment_id}/reply")
async def reply_to_comment(comment_id: str, reply: CommentReply, user: User = Depends(get_current_user)):
    reply_data = {
        "reply_id": f"reply_{uuid.uuid4().hex[:8]}",
        "user_id": user.user_id, "user_name": user.name,
        "content": reply.content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await comments_collection.update_one(
        {"comment_id": comment_id}, {"$push": {"replies": reply_data}}
    )
    return reply_data

@api_router.put("/comments/{comment_id}/resolve")
async def resolve_comment(comment_id: str, user: User = Depends(get_current_user)):
    await comments_collection.update_one({"comment_id": comment_id}, {"$set": {"resolved": True}})
    return {"status": "resolved"}

@api_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, user: User = Depends(get_current_user)):
    await comments_collection.delete_one({"comment_id": comment_id, "user_id": user.user_id})
    return {"status": "deleted"}

# ============ WEBSOCKET COLLABORATION ============

@app.websocket("/api/ws/collab/{doc_id}")
async def websocket_collab(websocket: WebSocket, doc_id: str):
    # Accept first, then authenticate
    user_id = None
    user_name = "Guest"
    try:
        await websocket.accept()
        # Wait for auth message
        auth_msg = await asyncio.wait_for(websocket.receive_json(), timeout=10)
        user_id = auth_msg.get("user_id", f"guest_{uuid.uuid4().hex[:8]}")
        user_name = auth_msg.get("user_name", "Guest")
        
        # Register in room
        if doc_id not in collab_manager.active_rooms:
            collab_manager.active_rooms[doc_id] = {}
        color = f"hsl({hash(user_id) % 360}, 70%, 60%)"
        collab_manager.active_rooms[doc_id][user_id] = {
            "ws": websocket, "name": user_name, "color": color,
            "cursor": None, "connected_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Send current users list
        await websocket.send_json({
            "type": "connected",
            "user_id": user_id, "color": color,
            "users": collab_manager._get_users(doc_id)
        })
        
        # Notify others
        await collab_manager.broadcast(doc_id, user_id, {
            "type": "user_joined",
            "user_id": user_id, "name": user_name, "color": color,
            "users": collab_manager._get_users(doc_id)
        })
        
        # Message loop
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            
            if msg_type == "cursor_move":
                collab_manager.active_rooms[doc_id][user_id]["cursor"] = data.get("position")
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "cursor_move",
                    "user_id": user_id, "name": user_name, "color": color,
                    "position": data.get("position")
                })
            elif msg_type == "element_update":
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "element_update",
                    "user_id": user_id, "name": user_name,
                    "elements": data.get("elements"),
                    "page_index": data.get("page_index")
                })
            elif msg_type == "element_add":
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "element_add",
                    "user_id": user_id, "element": data.get("element")
                })
            elif msg_type == "element_delete":
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "element_delete",
                    "user_id": user_id, "element_id": data.get("element_id")
                })
            elif msg_type == "comment_add":
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "comment_add",
                    "user_id": user_id, "name": user_name,
                    "comment": data.get("comment")
                })
            elif msg_type == "page_update":
                await collab_manager.broadcast(doc_id, user_id, {
                    "type": "page_update",
                    "user_id": user_id,
                    "pages": data.get("pages")
                })
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        pass
    except Exception as e:
        logging.getLogger(__name__).error(f"WebSocket error: {e}")
    finally:
        collab_manager.disconnect(doc_id, user_id)
        await collab_manager.broadcast(doc_id, user_id, {
            "type": "user_left",
            "user_id": user_id, "name": user_name,
            "users": collab_manager._get_users(doc_id)
        })

@api_router.get("/documents/{doc_id}/online")
async def get_online_users(doc_id: str):
    users = collab_manager._get_users(doc_id)
    return {"users": users, "count": len(users)}

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "ZET Mindshare API", "version": "1.0.0"}

# ============ CEO DATA EXPORT ============

async def get_most_active_users(limit: int = 10) -> list:
    pipeline = [
        {"$lookup": {"from": "posts", "localField": "user_id", "foreignField": "author_id", "as": "posts"}},
        {"$addFields": {"post_count": {"$size": "$posts"}}},
        {"$sort": {"post_count": -1}},
        {"$limit": limit},
        {"$project": {"_id": 0, "user_id": 1, "email": 1, "name": 1, "username": 1, "post_count": 1, "followers_count": 1}},
    ]
    return await db.users.aggregate(pipeline).to_list(length=limit)

async def get_trending_words(limit: int = 20) -> list:
    import re
    from collections import Counter
    posts = await db.posts.find({"type": "text"}, {"content": 1, "_id": 0}).to_list(length=500)
    words = []
    for p in posts:
        words.extend(re.findall(r'\b[a-zA-ZğüşıöçĞÜŞİÖÇ]{4,}\b', p.get("content", "")))
    stopwords = {"için", "ile", "bir", "olan", "veya", "gibi", "daha", "çok", "the", "and", "that", "this", "with", "from"}
    filtered = [w.lower() for w in words if w.lower() not in stopwords]
    return [{"word": w, "count": c} for w, c in Counter(filtered).most_common(limit)]

async def build_export_payload(export_type: str) -> dict:
    now = datetime.now(timezone.utc)
    payload: dict = {"exported_at": now.isoformat(), "type": export_type}

    if export_type in ("last7", "last30"):
        days = 7 if export_type == "last7" else 30
        since = (now - timedelta(days=days)).isoformat()
        payload["users"] = await db.users.find({"created_at": {"$gte": since}}, {"_id": 0, "password": 0}).to_list(length=5000)
        payload["posts"] = await db.posts.find({"created_at": {"$gte": since}}, {"_id": 0}).to_list(length=5000)
        payload["documents"] = await db.documents.find({"created_at": {"$gte": since}}, {"_id": 0}).to_list(length=5000)
        return payload

    if export_type in ("users", "all"):
        payload["users"] = await db.users.find({}, {"_id": 0, "password": 0}).to_list(length=10000)
    if export_type in ("posts", "all"):
        payload["posts"] = await db.posts.find({}, {"_id": 0}).to_list(length=10000)
    if export_type in ("documents", "all"):
        payload["documents"] = await db.documents.find({}, {"_id": 0}).to_list(length=10000)
    if export_type in ("comments", "all"):
        payload["comments"] = await db.comments.find({}, {"_id": 0}).to_list(length=10000)
    if export_type in ("notes", "all"):
        payload["notes"] = await db.notes.find({}, {"_id": 0}).to_list(length=10000)
    if export_type in ("analytics", "all"):
        total_users = await db.users.count_documents({})
        total_posts = await db.posts.count_documents({})
        total_docs = await db.documents.count_documents({})
        total_comments = await db.comments.count_documents({})
        payload["analytics"] = {
            "total_users": total_users,
            "total_posts": total_posts,
            "total_documents": total_docs,
            "total_comments": total_comments,
            "most_active_users": await get_most_active_users(10),
            "trending_words": await get_trending_words(20),
        }

    return payload

async def send_export_email(export_type: str, payload: dict):
    resend.api_key = os.environ.get("RESEND_API_KEY", "")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    json_bytes = json.dumps(payload, ensure_ascii=False, indent=2, default=str).encode("utf-8")
    import base64 as b64
    attachment_b64 = b64.b64encode(json_bytes).decode("ascii")
    filename = f"zet_export_{export_type}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.json"
    params = {
        "from": sender,
        "to": [CEO_EMAIL],
        "subject": f"[ZET Data Export] {export_type.upper()} — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M')} UTC",
        "html": f"<p>ZET Mindshare veri dışa aktarımı: <b>{export_type}</b></p><p>Tarih: {datetime.now(timezone.utc).isoformat()}</p><p>Dosya ek olarak gönderilmiştir.</p>",
        "attachments": [{"filename": filename, "content": attachment_b64}],
    }
    resend.Emails.send(params)

# ============ KİMLİK DOĞRULAMA ============

class IdentityVerifyRequest(BaseModel):
    full_name: str
    id_type: str  # 'tc_kimlik' | 'pasaport' | 'ehliyet'
    id_number: str
    front_image: str   # base64
    back_image: Optional[str] = None  # arka yüz (TC kimlik için)
    selfie_image: str  # selfie with ID

@api_router.post("/users/verify-identity")
async def submit_identity_verification(body: IdentityVerifyRequest, user: User = Depends(get_current_user)):
    existing = await db.identity_verifications.find_one({"user_id": user.user_id, "status": {"$in": ["pending", "approved"]}})
    if existing:
        if existing["status"] == "approved":
            raise HTTPException(status_code=400, detail="Kimliğiniz zaten doğrulanmış.")
        raise HTTPException(status_code=400, detail="Zaten bekleyen bir doğrulama başvurunuz var.")
    if not body.full_name.strip() or len(body.id_number.strip()) < 4:
        raise HTTPException(status_code=400, detail="Ad soyad ve kimlik numarası zorunludur.")
    verification_id = f"verif_{uuid.uuid4().hex[:16]}"
    now = datetime.now(timezone.utc).isoformat()
    await db.identity_verifications.insert_one({
        "verification_id": verification_id,
        "user_id": user.user_id,
        "user_email": user.email,
        "full_name": body.full_name.strip(),
        "id_type": body.id_type,
        "id_number": body.id_number.strip(),
        "front_image": body.front_image,
        "back_image": body.back_image,
        "selfie_image": body.selfie_image,
        "status": "pending",
        "submitted_at": now,
    })
    await db.users.update_one({"user_id": user.user_id}, {"$set": {"identity_status": "pending"}})
    return {"message": "Kimlik doğrulama başvurunuz alındı. En geç 24 saat içinde incelenecektir.", "verification_id": verification_id}

@api_router.get("/users/verify-identity/status")
async def get_identity_status(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"user_id": user.user_id}, {"identity_status": 1})
    verif = await db.identity_verifications.find_one({"user_id": user.user_id}, {"_id": 0, "front_image": 0, "back_image": 0, "selfie_image": 0})
    return {"identity_status": user_data.get("identity_status", "none") if user_data else "none", "verification": verif}

@api_router.get("/admin/identity-verifications")
async def list_identity_verifications(user: User = Depends(get_current_user)):
    if user.email != CEO_EMAIL:
        me = await db.users.find_one({"user_id": user.user_id}, {"is_privileged": 1})
        if not me or not me.get("is_privileged"):
            raise HTTPException(status_code=403)
    verifs = await db.identity_verifications.find({"status": "pending"}, {"_id": 0, "front_image": 0, "back_image": 0, "selfie_image": 0}).sort("submitted_at", 1).to_list(100)
    return {"verifications": verifs}

class IdentityDecision(BaseModel):
    decision: str  # 'approve' | 'reject'
    reason: Optional[str] = None
    verified_type: Optional[str] = None  # 'blue' | 'gold' | 'red' (only on approve)

@api_router.post("/admin/identity-verifications/{verification_id}/decide")
async def decide_identity_verification(verification_id: str, body: IdentityDecision, user: User = Depends(get_current_user)):
    if user.email != CEO_EMAIL:
        me = await db.users.find_one({"user_id": user.user_id}, {"is_privileged": 1})
        if not me or not me.get("is_privileged"):
            raise HTTPException(status_code=403)
    if body.decision not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="Karar 'approve' veya 'reject' olmalı.")
    verif = await db.identity_verifications.find_one({"verification_id": verification_id})
    if not verif:
        raise HTTPException(status_code=404, detail="Doğrulama bulunamadı.")
    if verif["status"] != "pending":
        raise HTTPException(status_code=400, detail="Bu başvuru zaten işleme alınmış.")
    now = datetime.now(timezone.utc).isoformat()
    new_status = "approved" if body.decision == "approve" else "rejected"
    await db.identity_verifications.update_one(
        {"verification_id": verification_id},
        {"$set": {"status": new_status, "decided_at": now, "decided_by": user.email, "reason": body.reason}}
    )
    user_update: dict = {"identity_status": new_status}
    if body.decision == "approve":
        user_update["identity_verified"] = True
        if body.verified_type:
            user_update["verified_type"] = body.verified_type
    await db.users.update_one({"user_id": verif["user_id"]}, {"$set": user_update})
    return {"message": f"Başvuru {'onaylandı' if body.decision == 'approve' else 'reddedildi'}."}


class ExportRequest(BaseModel):
    type: str  # posts, users, documents, comments, notes, analytics, all, last7, last30

VALID_EXPORT_TYPES = {"posts", "users", "documents", "comments", "notes", "analytics", "all", "last7", "last30"}

@api_router.post("/admin/export-data")
async def export_data(body: ExportRequest, user: User = Depends(get_current_user)):
    if user.email != CEO_EMAIL:
        raise HTTPException(status_code=403, detail="Sadece CEO veri dışa aktarabilir.")
    if body.type not in VALID_EXPORT_TYPES:
        raise HTTPException(status_code=400, detail=f"Geçersiz tip. Geçerli tipler: {', '.join(sorted(VALID_EXPORT_TYPES))}")
    payload = await build_export_payload(body.type)
    await send_export_email(body.type, payload)
    await db.export_logs.insert_one({
        "requested_by": user.email,
        "type": body.type,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "record_counts": {k: len(v) if isinstance(v, list) else None for k, v in payload.items() if k not in ("exported_at", "type")},
    })
    return {"success": True, "message": f"'{body.type}' verisi CEO e-postasına gönderildi."}

@api_router.post("/admin/migrate-old-data")
async def migrate_old_data(user: User = Depends(get_current_user)):
    """Eski kullanıcı alanlarını yeni uygulama-bazlı alanlara taşır. Mevcut veriye DOKUNMAZ."""
    if user.email != CEO_EMAIL:
        raise HTTPException(status_code=403, detail="Sadece CEO bu işlemi yapabilir.")

    all_users = await db.users.find({}).to_list(None)
    migrated = 0

    for u in all_users:
        updates = {}

        # credits → mindshare_credits
        if "credits" in u and "mindshare_credits" not in u:
            updates["mindshare_credits"] = u.get("credits", 0)

        # rank → mindshare_rank
        if "mindshare_rank" not in u:
            updates["mindshare_rank"] = u.get("rank", "iron")

        # quest_xp / xp → mindshare_xp
        if "mindshare_xp" not in u:
            updates["mindshare_xp"] = u.get("quest_xp", u.get("xp", 0))

        # Judge alanları — her zaman varsayılan ekle
        if "judge_credits" not in u:
            updates["judge_credits"] = 0
        if "judge_rank" not in u:
            updates["judge_rank"] = "iron"
        if "judge_xp" not in u:
            updates["judge_xp"] = 0

        if updates:
            await db.users.update_one({"_id": u["_id"]}, {"$set": updates})
            migrated += 1

    return {
        "success": True,
        "migrated": migrated,
        "total": len(all_users),
        "message": f"{migrated}/{len(all_users)} kullanıcı güncellendi."
    }

@api_router.post("/admin/normalize-subscriptions")
async def normalize_all_subscriptions(user: User = Depends(get_current_user)):
    """Tüm kullanıcıların subscription alanını dict formatına çevirir (string → dict)."""
    if user.email != CEO_EMAIL:
        raise HTTPException(status_code=403, detail="Sadece CEO bu işlemi yapabilir.")

    all_users = await db.users.find({}).to_list(None)
    fixed = 0

    for u in all_users:
        updates = {}
        for field in ("subscription", "mindshare_subscription", "judge_subscription"):
            val = u.get(field)
            if isinstance(val, str):
                updates[field] = {"plan": val if val else "free", "status": "active"}
        if updates:
            await db.users.update_one({"_id": u["_id"]}, {"$set": updates})
            fixed += 1

    return {"fixed_users": fixed, "total": len(all_users),
            "message": f"{fixed} kullanıcının subscription alanı normalize edildi."}

async def send_weekly_report():
    """Her Pazartesi 09:00 UTC'de haftalık rapor gönder."""
    while True:
        now = datetime.now(timezone.utc)
        days_until_monday = (7 - now.weekday()) % 7 or 7
        next_monday = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
        wait_seconds = (next_monday - now).total_seconds()
        await asyncio.sleep(wait_seconds)
        try:
            payload = await build_export_payload("analytics")
            payload["last7"] = await build_export_payload("last7")
            await send_export_email("weekly_report", payload)
            await db.export_logs.insert_one({
                "requested_by": "system",
                "type": "weekly_report",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        except Exception as e:
            logging.getLogger(__name__).error(f"Weekly report error: {e}")

async def expire_boosts_loop():
    """Süresi dolan boost'ları saatlik kapat."""
    while True:
        await asyncio.sleep(3600)
        try:
            now = datetime.now(timezone.utc).isoformat()
            await db.posts.update_many(
                {"boost.active": True, "boost.expires_at": {"$lt": now}},
                {"$set": {"boost.active": False}}
            )
        except Exception as e:
            logging.getLogger(__name__).error(f"Boost expiry error: {e}")

@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(send_weekly_report())
    asyncio.create_task(expire_boosts_loop())

app.include_router(api_router)

frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")

_allowed_origins = list(filter(None, [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "https://exciting-comfort-production.up.railway.app",
    "https://zet-mindshare-production.up.railway.app",
    "https://app.zetstudiointl.com",
    "https://zetstudiointl.com",
    os.environ.get("FRONTEND_URL"),
]))

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_allowed_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
# Sat Apr 11 19:45:44 TSS 2026
