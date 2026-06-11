"""
ZET Media — /api/media/* backend router
Tüm sosyal medya, mesajlaşma ve keşif endpoint'leri burada.
Bağımsız koleksiyonlar: media_profiles, media_posts, media_stories,
media_conversations, media_messages, media_notifications, media_comments, media_bookmarks
"""

from fastapi import APIRouter, HTTPException, Depends, Request, WebSocket, WebSocketDisconnect, Body, Query, UploadFile, File
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid, asyncio, json, os, logging, re

logger = logging.getLogger(__name__)

# ─── Router ────────────────────────────────────────────────────────────────────
media_router = APIRouter(prefix="/api/media", tags=["media"])

# ─── DB ref (server.py'den enjekte edilir) ─────────────────────────────────────
_db: AsyncIOMotorDatabase = None

def set_media_db(database: AsyncIOMotorDatabase):
    global _db
    _db = database

def get_db():
    if _db is None:
        raise RuntimeError("Media DB not initialized")
    return _db

# ─── Auth helper ────────────────────────────────────────────────────────────────
async def _get_user_id(request: Request) -> str:
    """session_token → user_id döner, 401 fırlatır."""
    db = get_db()
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(401, "Giriş yapılmadı")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(401, "Geçersiz oturum")
    expires_at = session.get("expires_at")
    if expires_at:
        if isinstance(expires_at, str):
            expires_at = datetime.fromisoformat(expires_at)
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Oturum süresi doldu")
    return session["user_id"]

async def _get_or_create_profile(user_id: str) -> dict:
    """Media profili yoksa otomatik oluşturur."""
    db = get_db()
    p = await db.media_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if p:
        return p
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    handle = None
    if user:
        base = (user.get("name") or user.get("email", "user")).split("@")[0]
        base = re.sub(r"[^a-zA-Z0-9_]", "", base).lower() or "user"
        handle = base
        suffix = 1
        while await db.media_profiles.find_one({"handle": handle}):
            handle = f"{base}{suffix}"
            suffix += 1
    profile = {
        "user_id": user_id,
        "handle": handle or f"user_{user_id[:8]}",
        "display_name": user.get("name", "") if user else "",
        "bio": "",
        "phone": "",
        "profile_photo": user.get("picture", "") if user else "",
        "banner_photo": "",
        "verification": None,
        "privacy": "public",
        "following": [],
        "followers": [],
        "following_count": 0,
        "followers_count": 0,
        "post_count": 0,
        "settings": {
            "hide_likes": False,
            "hide_follower_count": False,
            "hide_online_status": False,
            "allow_dms": "everyone",
            "read_receipts": True,
        },
        "zet_pass": {},
        "rank": "iron",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media_profiles.insert_one(profile)
    return {k: v for k, v in profile.items() if k != "_id"}

# ─── WebSocket Manager ──────────────────────────────────────────────────────────
class MediaWSManager:
    def __init__(self):
        # user_id → list of WebSocket
        self.connections: Dict[str, List[WebSocket]] = {}
        # conv_id → set of user_ids currently in that conv
        self.conv_members: Dict[str, set] = {}

    async def connect(self, user_id: str, ws: WebSocket):
        await ws.accept()
        self.connections.setdefault(user_id, []).append(ws)

    def disconnect(self, user_id: str, ws: WebSocket):
        if user_id in self.connections:
            self.connections[user_id] = [w for w in self.connections[user_id] if w is not ws]
            if not self.connections[user_id]:
                del self.connections[user_id]

    async def send_to_user(self, user_id: str, data: dict):
        for ws in list(self.connections.get(user_id, [])):
            try:
                await ws.send_json(data)
            except Exception:
                pass

    async def broadcast_to_conv(self, conv_id: str, members: List[str], data: dict):
        for uid in members:
            await self.send_to_user(uid, data)

    def is_online(self, user_id: str) -> bool:
        return bool(self.connections.get(user_id))

_ws_manager = MediaWSManager()

# ─── WebSocket endpoint ─────────────────────────────────────────────────────────
@media_router.websocket("/ws/{user_id}")
async def media_ws(websocket: WebSocket, user_id: str):
    db = get_db()
    token = websocket.query_params.get("token", "")
    if not token:
        await websocket.close(code=4001)
        return
    session = await db.user_sessions.find_one({"session_token": token, "user_id": user_id})
    if not session:
        await websocket.close(code=4001)
        return

    await _ws_manager.connect(user_id, websocket)
    # Online durumunu kaydet
    await db.media_profiles.update_one({"user_id": user_id}, {"$set": {"online": True, "last_seen": datetime.now(timezone.utc).isoformat()}})
    try:
        while True:
            msg = await websocket.receive_json()
            mtype = msg.get("type")

            if mtype == "ping":
                await websocket.send_json({"type": "pong"})

            elif mtype == "typing":
                conv_id = msg.get("conv_id")
                if conv_id:
                    conv = await db.media_conversations.find_one({"conv_id": conv_id})
                    if conv:
                        for uid in conv.get("participants", []):
                            if uid != user_id:
                                await _ws_manager.send_to_user(uid, {
                                    "type": "typing",
                                    "conv_id": conv_id,
                                    "user_id": user_id,
                                    "typing": msg.get("typing", False),
                                })

            elif mtype == "mark_read":
                conv_id = msg.get("conv_id")
                msg_ids = msg.get("msg_ids", [])
                if conv_id and msg_ids:
                    await db.media_messages.update_many(
                        {"conv_id": conv_id, "msg_id": {"$in": msg_ids}},
                        {"$addToSet": {"read_by": user_id}},
                    )

    except WebSocketDisconnect:
        pass
    finally:
        _ws_manager.disconnect(user_id, websocket)
        await db.media_profiles.update_one(
            {"user_id": user_id},
            {"$set": {"online": False, "last_seen": datetime.now(timezone.utc).isoformat()}}
        )

# ═══════════════════════════════════════════════════════════════════════════════
# PROFILE ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@media_router.get("/profile/me")
async def get_my_profile(request: Request):
    user_id = await _get_user_id(request)
    profile = await _get_or_create_profile(user_id)
    return profile

@media_router.put("/profile/me")
async def update_my_profile(request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    await _get_or_create_profile(user_id)
    allowed = {"display_name", "bio", "phone", "profile_photo", "banner_photo", "privacy", "settings", "handle"}
    update = {k: v for k, v in body.items() if k in allowed}

    if "handle" in update:
        h = re.sub(r"[^a-zA-Z0-9_.]", "", update["handle"])[:30].lower()
        if len(h) < 2:
            raise HTTPException(400, "Handle en az 2 karakter olmalı")
        existing = await db.media_profiles.find_one({"handle": h, "user_id": {"$ne": user_id}})
        if existing:
            raise HTTPException(409, "Bu handle kullanılıyor")
        update["handle"] = h

    await db.media_profiles.update_one({"user_id": user_id}, {"$set": update})
    return await db.media_profiles.find_one({"user_id": user_id}, {"_id": 0})

@media_router.get("/profile/{handle}")
async def get_profile_by_handle(handle: str, request: Request):
    db = get_db()
    viewer_id = None
    try:
        viewer_id = await _get_user_id(request)
    except HTTPException:
        pass

    profile = await db.media_profiles.find_one({"handle": handle}, {"_id": 0})
    if not profile:
        raise HTTPException(404, "Profil bulunamadı")

    is_own = profile["user_id"] == viewer_id
    is_follower = viewer_id in (profile.get("followers") or []) if viewer_id else False

    if profile.get("privacy") == "private" and not is_own and not is_follower:
        return {
            "user_id": profile["user_id"],
            "handle": profile["handle"],
            "display_name": profile["display_name"],
            "profile_photo": profile["profile_photo"],
            "verification": profile.get("verification"),
            "privacy": "private",
            "followers_count": profile.get("followers_count", 0),
            "following_count": profile.get("following_count", 0),
            "post_count": profile.get("post_count", 0),
            "is_private": True,
        }

    result = dict(profile)
    result["is_following"] = viewer_id in (profile.get("followers") or []) if viewer_id else False
    result["is_own"] = is_own
    result["online"] = profile.get("settings", {}).get("hide_online_status", False) is False and _ws_manager.is_online(profile["user_id"])
    return result

@media_router.get("/profile/{handle}/followers")
async def get_followers(handle: str, request: Request):
    db = get_db()
    profile = await db.media_profiles.find_one({"handle": handle}, {"_id": 0, "followers": 1})
    if not profile:
        raise HTTPException(404, "Profil bulunamadı")
    followers = []
    for uid in (profile.get("followers") or [])[-50:]:
        p = await db.media_profiles.find_one({"user_id": uid}, {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1})
        if p:
            followers.append(p)
    return followers

@media_router.get("/profile/{handle}/following")
async def get_following(handle: str, request: Request):
    db = get_db()
    profile = await db.media_profiles.find_one({"handle": handle}, {"_id": 0, "following": 1})
    if not profile:
        raise HTTPException(404, "Profil bulunamadı")
    following = []
    for uid in (profile.get("following") or [])[-50:]:
        p = await db.media_profiles.find_one({"user_id": uid}, {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1})
        if p:
            following.append(p)
    return following

# ─── Follow / Unfollow ──────────────────────────────────────────────────────────

@media_router.post("/follow/{target_user_id}")
async def follow_user(target_user_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    if user_id == target_user_id:
        raise HTTPException(400, "Kendinizi takip edemezsiniz")

    target = await db.media_profiles.find_one({"user_id": target_user_id})
    if not target:
        raise HTTPException(404, "Kullanıcı bulunamadı")

    already = user_id in (target.get("followers") or [])
    if already:
        return {"following": True}

    await db.media_profiles.update_one(
        {"user_id": target_user_id},
        {"$addToSet": {"followers": user_id}, "$inc": {"followers_count": 1}}
    )
    await db.media_profiles.update_one(
        {"user_id": user_id},
        {"$addToSet": {"following": target_user_id}, "$inc": {"following_count": 1}}
    )
    await _create_notification(target_user_id, "follow", user_id, None)
    return {"following": True}

@media_router.delete("/follow/{target_user_id}")
async def unfollow_user(target_user_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    await db.media_profiles.update_one(
        {"user_id": target_user_id},
        {"$pull": {"followers": user_id}, "$inc": {"followers_count": -1}}
    )
    await db.media_profiles.update_one(
        {"user_id": user_id},
        {"$pull": {"following": target_user_id}, "$inc": {"following_count": -1}}
    )
    return {"following": False}

# ═══════════════════════════════════════════════════════════════════════════════
# POSTS
# ═══════════════════════════════════════════════════════════════════════════════

@media_router.post("/posts")
async def create_post(request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    profile = await _get_or_create_profile(user_id)

    ptype = body.get("type", "text")
    valid_types = {"photo", "video", "reel", "text", "document", "repost"}
    if ptype not in valid_types:
        raise HTTPException(400, f"Geçersiz içerik türü: {ptype}")

    content = (body.get("content") or "")[:2200]
    hashtags = re.findall(r"#(\w+)", content)
    mentions = re.findall(r"@(\w+)", content)

    post = {
        "post_id": str(uuid.uuid4()),
        "author_id": user_id,
        "author_handle": profile["handle"],
        "author_display_name": profile.get("display_name", ""),
        "author_photo": profile.get("profile_photo", ""),
        "author_verification": profile.get("verification"),
        "type": ptype,
        "content": content,
        "media": body.get("media", []),  # [{url, type, width, height, duration, thumbnail}]
        "hashtags": hashtags,
        "mentions": mentions,
        "likes": [],
        "like_count": 0,
        "comment_count": 0,
        "share_count": 0,
        "save_count": 0,
        "views": 0,
        "allows_download": body.get("allows_download", True),
        "paid_partnership": body.get("paid_partnership", False),
        "scheduled_at": body.get("scheduled_at"),
        "series_id": body.get("series_id"),
        "repost_of": body.get("repost_of"),
        "repost_comment": body.get("repost_comment"),
        "watermark": body.get("watermark"),  # "Made with ZET Mindshare" vb.
        "score": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": None,
    }

    # Story → 24 saat sonra sil
    if body.get("story", False):
        post["expires_at"] = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
        await db.media_stories.insert_one(dict(post))
    else:
        await db.media_posts.insert_one(post)
        await db.media_profiles.update_one({"user_id": user_id}, {"$inc": {"post_count": 1}})

    # Mention bildirimleri
    for mention_handle in mentions[:5]:
        mp = await db.media_profiles.find_one({"handle": mention_handle})
        if mp and mp["user_id"] != user_id:
            await _create_notification(mp["user_id"], "mention", user_id, post["post_id"])

    result = {k: v for k, v in post.items() if k != "_id"}
    return result

@media_router.get("/posts/{post_id}")
async def get_post(post_id: str, request: Request):
    db = get_db()
    viewer_id = None
    try:
        viewer_id = await _get_user_id(request)
    except HTTPException:
        pass

    post = await db.media_posts.find_one({"post_id": post_id}, {"_id": 0})
    if not post:
        raise HTTPException(404, "Gönderi bulunamadı")

    await db.media_posts.update_one({"post_id": post_id}, {"$inc": {"views": 1}})
    post["views"] = post.get("views", 0) + 1
    post["liked_by_me"] = viewer_id in (post.get("likes") or []) if viewer_id else False
    post["saved_by_me"] = False
    if viewer_id:
        bm = await db.media_bookmarks.find_one({"user_id": viewer_id, "post_id": post_id})
        post["saved_by_me"] = bool(bm)
    return post

@media_router.delete("/posts/{post_id}")
async def delete_post(post_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    post = await db.media_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Gönderi bulunamadı")
    if post["author_id"] != user_id:
        raise HTTPException(403, "Bu gönderiyi silemezsiniz")
    await db.media_posts.delete_one({"post_id": post_id})
    await db.media_profiles.update_one({"user_id": user_id}, {"$inc": {"post_count": -1}})
    return {"deleted": True}

# ─── Feed ───────────────────────────────────────────────────────────────────────

@media_router.get("/feed")
async def get_feed(request: Request, page: int = Query(1, ge=1), limit: int = Query(10, ge=1, le=30)):
    user_id = await _get_user_id(request)
    db = get_db()
    profile = await _get_or_create_profile(user_id)
    following = profile.get("following", []) + [user_id]

    skip = (page - 1) * limit
    cursor = db.media_posts.find(
        {"author_id": {"$in": following}, "expires_at": None},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    for p in posts:
        p["liked_by_me"] = user_id in (p.get("likes") or [])
        bm = await db.media_bookmarks.find_one({"user_id": user_id, "post_id": p["post_id"]})
        p["saved_by_me"] = bool(bm)

    return {"posts": posts, "page": page, "has_more": len(posts) == limit}

@media_router.get("/explore")
async def get_explore(
    request: Request,
    page: int = Query(1, ge=1),
    limit: int = Query(12, ge=1, le=30),
    category: Optional[str] = None,
    tab: Optional[str] = Query("trending"),
):
    db = get_db()
    viewer_id = None
    try:
        viewer_id = await _get_user_id(request)
    except HTTPException:
        pass

    skip = (page - 1) * limit
    query: dict = {"expires_at": None}
    if category:
        query["hashtags"] = {"$in": [category.lower()]}

    sort_key = "score" if tab == "trending" else "created_at"
    cursor = db.media_posts.find(query, {"_id": 0}).sort(sort_key, -1).skip(skip).limit(limit)
    posts = await cursor.to_list(length=limit)

    for p in posts:
        p["liked_by_me"] = viewer_id in (p.get("likes") or []) if viewer_id else False

    # Trending hashtags
    pipeline = [
        {"$match": {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()}}},
        {"$unwind": "$hashtags"},
        {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 15},
    ]
    trending = await db.media_posts.aggregate(pipeline).to_list(length=15)

    return {
        "posts": posts,
        "page": page,
        "has_more": len(posts) == limit,
        "trending_hashtags": [{"tag": t["_id"], "count": t["count"]} for t in trending],
    }

# Feed algoritması: skor güncelle
async def _update_post_score(post_id: str):
    db = get_db()
    post = await db.media_posts.find_one({"post_id": post_id})
    if not post:
        return
    likes = post.get("like_count", 0)
    comments = post.get("comment_count", 0)
    shares = post.get("share_count", 0)
    views = max(post.get("views", 1), 1)
    created = datetime.fromisoformat(post["created_at"].replace("Z", "+00:00")) if isinstance(post["created_at"], str) else post["created_at"]
    age_hours = max((datetime.now(timezone.utc) - created.replace(tzinfo=timezone.utc) if created.tzinfo is None else datetime.now(timezone.utc) - created).total_seconds() / 3600, 0.1)

    engagement_score = (likes * 2 + comments * 3 + shares * 4) / views
    time_decay = 1 / (1 + age_hours * 0.1)
    score = engagement_score * 0.7 * time_decay + (time_decay * 0.3)

    author = await db.media_profiles.find_one({"user_id": post["author_id"]})
    if author:
        sub_count = author.get("followers_count", 0)
        score += min(sub_count / 10000, 1.0) * 0.2
        if author.get("verification"):
            score += 0.1

    await db.media_posts.update_one({"post_id": post_id}, {"$set": {"score": round(score, 4)}})

# ─── Like / Unlike ──────────────────────────────────────────────────────────────

@media_router.post("/posts/{post_id}/like")
async def toggle_like(post_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    post = await db.media_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Gönderi bulunamadı")

    liked = user_id in (post.get("likes") or [])
    if liked:
        await db.media_posts.update_one({"post_id": post_id}, {"$pull": {"likes": user_id}, "$inc": {"like_count": -1}})
        return {"liked": False, "like_count": post["like_count"] - 1}
    else:
        await db.media_posts.update_one({"post_id": post_id}, {"$addToSet": {"likes": user_id}, "$inc": {"like_count": 1}})
        if post["author_id"] != user_id:
            await _create_notification(post["author_id"], "like", user_id, post_id)
        asyncio.create_task(_update_post_score(post_id))
        return {"liked": True, "like_count": post["like_count"] + 1}

# ─── Save / Bookmark ────────────────────────────────────────────────────────────

@media_router.post("/posts/{post_id}/save")
async def toggle_save(post_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    existing = await db.media_bookmarks.find_one({"user_id": user_id, "post_id": post_id})
    if existing:
        await db.media_bookmarks.delete_one({"user_id": user_id, "post_id": post_id})
        await db.media_posts.update_one({"post_id": post_id}, {"$inc": {"save_count": -1}})
        return {"saved": False}
    else:
        await db.media_bookmarks.insert_one({"user_id": user_id, "post_id": post_id, "saved_at": datetime.now(timezone.utc).isoformat()})
        await db.media_posts.update_one({"post_id": post_id}, {"$inc": {"save_count": 1}})
        return {"saved": True}

@media_router.get("/bookmarks")
async def get_bookmarks(request: Request, page: int = Query(1)):
    user_id = await _get_user_id(request)
    db = get_db()
    limit = 12
    skip = (page - 1) * limit
    bms = await db.media_bookmarks.find({"user_id": user_id}, {"_id": 0}).sort("saved_at", -1).skip(skip).limit(limit).to_list(limit)
    posts = []
    for bm in bms:
        p = await db.media_posts.find_one({"post_id": bm["post_id"]}, {"_id": 0})
        if p:
            p["liked_by_me"] = user_id in (p.get("likes") or [])
            p["saved_by_me"] = True
            posts.append(p)
    return {"posts": posts, "page": page, "has_more": len(posts) == limit}

# ─── Comments ───────────────────────────────────────────────────────────────────

@media_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str, request: Request, page: int = Query(1)):
    db = get_db()
    limit = 20
    skip = (page - 1) * limit
    comments = await db.media_comments.find(
        {"post_id": post_id, "parent_comment_id": None},
        {"_id": 0}
    ).sort("created_at", 1).skip(skip).limit(limit).to_list(limit)
    return {"comments": comments, "page": page, "has_more": len(comments) == limit}

@media_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    post = await db.media_posts.find_one({"post_id": post_id})
    if not post:
        raise HTTPException(404, "Gönderi bulunamadı")

    profile = await _get_or_create_profile(user_id)
    comment = {
        "comment_id": str(uuid.uuid4()),
        "post_id": post_id,
        "author_id": user_id,
        "author_handle": profile["handle"],
        "author_display_name": profile.get("display_name", ""),
        "author_photo": profile.get("profile_photo", ""),
        "author_verification": profile.get("verification"),
        "content": (body.get("content") or "")[:1000],
        "parent_comment_id": body.get("parent_comment_id"),
        "likes": [],
        "like_count": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media_comments.insert_one(comment)
    await db.media_posts.update_one({"post_id": post_id}, {"$inc": {"comment_count": 1}})
    if post["author_id"] != user_id:
        await _create_notification(post["author_id"], "comment", user_id, post_id)
    asyncio.create_task(_update_post_score(post_id))
    return {k: v for k, v in comment.items() if k != "_id"}

@media_router.delete("/comments/{comment_id}")
async def delete_comment(comment_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    comment = await db.media_comments.find_one({"comment_id": comment_id})
    if not comment:
        raise HTTPException(404, "Yorum bulunamadı")
    if comment["author_id"] != user_id:
        raise HTTPException(403, "Bu yorumu silemezsiniz")
    await db.media_comments.delete_one({"comment_id": comment_id})
    await db.media_posts.update_one({"post_id": comment["post_id"]}, {"$inc": {"comment_count": -1}})
    return {"deleted": True}

# ─── User Posts ─────────────────────────────────────────────────────────────────

@media_router.get("/profile/{handle}/posts")
async def get_user_posts(handle: str, request: Request, page: int = Query(1), tab: str = Query("posts")):
    db = get_db()
    viewer_id = None
    try:
        viewer_id = await _get_user_id(request)
    except HTTPException:
        pass

    profile = await db.media_profiles.find_one({"handle": handle}, {"_id": 0})
    if not profile:
        raise HTTPException(404, "Profil bulunamadı")

    limit = 12
    skip = (page - 1) * limit
    query: dict = {"author_id": profile["user_id"], "expires_at": None}
    if tab == "reels":
        query["type"] = {"$in": ["reel", "video"]}
    elif tab == "tagged":
        query = {"mentions": handle, "expires_at": None}
    else:
        query["type"] = {"$in": ["photo", "text", "document", "repost"]}

    posts = await db.media_posts.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    for p in posts:
        p["liked_by_me"] = viewer_id in (p.get("likes") or []) if viewer_id else False
    return {"posts": posts, "page": page, "has_more": len(posts) == limit}

# ─── Stories ────────────────────────────────────────────────────────────────────

@media_router.get("/stories")
async def get_stories(request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    profile = await _get_or_create_profile(user_id)
    following = profile.get("following", []) + [user_id]
    now = datetime.now(timezone.utc).isoformat()

    stories = await db.media_stories.find(
        {"author_id": {"$in": following}, "expires_at": {"$gt": now}},
        {"_id": 0}
    ).sort("created_at", -1).to_list(length=100)

    # Kullanıcı bazında grupla
    grouped: dict = {}
    for s in stories:
        uid = s["author_id"]
        if uid not in grouped:
            grouped[uid] = {
                "author_id": uid,
                "author_handle": s["author_handle"],
                "author_display_name": s["author_display_name"],
                "author_photo": s["author_photo"],
                "stories": [],
                "has_unseen": False,
            }
        seen = user_id in (s.get("seen_by") or [])
        if not seen:
            grouped[uid]["has_unseen"] = True
        grouped[uid]["stories"].append(s)

    return list(grouped.values())

@media_router.post("/stories/{story_id}/seen")
async def mark_story_seen(story_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    await db.media_stories.update_one({"post_id": story_id}, {"$addToSet": {"seen_by": user_id}})
    return {"ok": True}

# ═══════════════════════════════════════════════════════════════════════════════
# MESSAGING SYSTEM
# ═══════════════════════════════════════════════════════════════════════════════

@media_router.get("/conversations")
async def get_conversations(request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    convs = await db.media_conversations.find(
        {"participants": user_id},
        {"_id": 0}
    ).sort("updated_at", -1).to_list(length=50)

    result = []
    for c in convs:
        item = dict(c)
        # DM'de karşı tarafın profilini al
        if c["type"] == "dm":
            other_id = next((p for p in c["participants"] if p != user_id), None)
            if other_id:
                other = await db.media_profiles.find_one({"user_id": other_id}, {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1, "settings": 1})
                if other:
                    item["other_profile"] = other
                    item["other_online"] = (
                        not other.get("settings", {}).get("hide_online_status", False)
                        and _ws_manager.is_online(other_id)
                    )
        unread = await db.media_messages.count_documents({
            "conv_id": c["conv_id"],
            "sender_id": {"$ne": user_id},
            "read_by": {"$nin": [user_id]},
        })
        item["unread_count"] = unread
        result.append(item)
    return result

@media_router.post("/conversations")
async def create_conversation(request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    ctype = body.get("type", "dm")

    if ctype == "dm":
        other_id = body.get("other_user_id")
        if not other_id:
            raise HTTPException(400, "other_user_id gerekli")
        # Mevcut DM var mı?
        existing = await db.media_conversations.find_one({
            "type": "dm",
            "participants": {"$all": [user_id, other_id], "$size": 2},
        }, {"_id": 0})
        if existing:
            return existing
        conv = {
            "conv_id": str(uuid.uuid4()),
            "type": "dm",
            "participants": [user_id, other_id],
            "name": None,
            "photo": None,
            "description": None,
            "owner_id": None,
            "admins": [],
            "zeta_enabled": True,
            "zeta_mode": "default",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_message": None,
            "invite_link": None,
            "member_count": 2,
            "allow_comments": False,
        }
    elif ctype == "group":
        members = list(set(body.get("members", []) + [user_id]))
        if len(members) < 2:
            raise HTTPException(400, "En az 2 üye gerekli")
        if len(members) > 500:
            raise HTTPException(400, "Maksimum 500 üye")
        conv = {
            "conv_id": str(uuid.uuid4()),
            "type": "group",
            "participants": members,
            "name": body.get("name", "Yeni Grup"),
            "photo": body.get("photo"),
            "description": body.get("description", ""),
            "owner_id": user_id,
            "admins": [user_id],
            "zeta_enabled": body.get("zeta_enabled", True),
            "zeta_mode": "default",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_message": None,
            "invite_link": str(uuid.uuid4())[:8],
            "member_count": len(members),
            "allow_comments": True,
        }
    elif ctype == "channel":
        conv = {
            "conv_id": str(uuid.uuid4()),
            "type": "channel",
            "participants": [user_id],
            "name": body.get("name", "Yeni Kanal"),
            "photo": body.get("photo"),
            "description": body.get("description", ""),
            "owner_id": user_id,
            "admins": [user_id],
            "zeta_enabled": False,
            "zeta_mode": "default",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "last_message": None,
            "invite_link": str(uuid.uuid4())[:8],
            "member_count": 1,
            "allow_comments": body.get("allow_comments", False),
        }
    else:
        raise HTTPException(400, "Geçersiz konuşma türü")

    await db.media_conversations.insert_one(conv)
    return {k: v for k, v in conv.items() if k != "_id"}

@media_router.get("/conversations/{conv_id}/messages")
async def get_messages(conv_id: str, request: Request, before: Optional[str] = None, limit: int = Query(30, ge=1, le=50)):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"conv_id": conv_id})
    if not conv or user_id not in conv.get("participants", []):
        raise HTTPException(403, "Bu sohbete erişiminiz yok")

    query: dict = {"conv_id": conv_id}
    if before:
        query["created_at"] = {"$lt": before}

    msgs = await db.media_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    msgs.reverse()
    return {"messages": msgs, "conv_id": conv_id}

@media_router.post("/conversations/{conv_id}/messages")
async def send_message(conv_id: str, request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"conv_id": conv_id})
    if not conv:
        raise HTTPException(404, "Konuşma bulunamadı")

    # Kanal → sadece admin yazabilir
    if conv["type"] == "channel" and user_id not in conv.get("admins", []):
        raise HTTPException(403, "Sadece yöneticiler yayın yapabilir")

    if user_id not in conv.get("participants", []):
        # Kanal → herkes abone olabilir
        if conv["type"] == "channel":
            await db.media_conversations.update_one(
                {"conv_id": conv_id},
                {"$addToSet": {"participants": user_id}, "$inc": {"member_count": 1}}
            )
        else:
            raise HTTPException(403, "Bu sohbete erişiminiz yok")

    profile = await _get_or_create_profile(user_id)
    msg = {
        "msg_id": str(uuid.uuid4()),
        "conv_id": conv_id,
        "sender_id": user_id,
        "sender_handle": profile["handle"],
        "sender_display_name": profile.get("display_name", ""),
        "sender_photo": profile.get("profile_photo", ""),
        "sender_verification": profile.get("verification"),
        "type": body.get("type", "text"),
        "content": (body.get("content") or "")[:4000],
        "media_url": body.get("media_url"),
        "reply_to": body.get("reply_to"),
        "reactions": [],
        "read_by": [user_id],
        "forwarded_from": body.get("forwarded_from"),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "edited_at": None,
    }

    await db.media_messages.insert_one(msg)
    last_msg = {"content": msg["content"] or "[medya]", "sender_id": user_id, "sent_at": msg["created_at"]}
    await db.media_conversations.update_one(
        {"conv_id": conv_id},
        {"$set": {"last_message": last_msg, "updated_at": msg["created_at"]}}
    )

    result = {k: v for k, v in msg.items() if k != "_id"}

    # Gerçek zamanlı iletim
    members = conv.get("participants", [])
    await _ws_manager.broadcast_to_conv(conv_id, members, {
        "type": "new_message",
        "conv_id": conv_id,
        "message": result,
    })

    # Bildirim gönder (gönderici dışındakilere)
    for uid in members:
        if uid != user_id:
            await _create_notification(uid, "message", user_id, conv_id)

    # @zeta komutu kontrolü
    content = msg["content"].strip()
    if conv.get("zeta_enabled", True) and content.lower().startswith("@zeta"):
        asyncio.create_task(_handle_zeta_command(conv_id, content, user_id, members, conv.get("zeta_mode", "default")))

    return result

@media_router.delete("/messages/{msg_id}")
async def delete_message(msg_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    msg = await db.media_messages.find_one({"msg_id": msg_id})
    if not msg:
        raise HTTPException(404, "Mesaj bulunamadı")
    if msg["sender_id"] != user_id:
        raise HTTPException(403, "Bu mesajı silemezsiniz")
    # Tamamen sil — iz bırakma
    await db.media_messages.delete_one({"msg_id": msg_id})
    conv = await db.media_conversations.find_one({"conv_id": msg["conv_id"]})
    if conv:
        await _ws_manager.broadcast_to_conv(msg["conv_id"], conv.get("participants", []), {
            "type": "message_deleted",
            "conv_id": msg["conv_id"],
            "msg_id": msg_id,
        })
    return {"deleted": True}

@media_router.post("/messages/{msg_id}/react")
async def react_to_message(msg_id: str, request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    emoji = body.get("emoji", "")[:4]
    msg = await db.media_messages.find_one({"msg_id": msg_id})
    if not msg:
        raise HTTPException(404, "Mesaj bulunamadı")

    reactions = msg.get("reactions", [])
    existing = next((r for r in reactions if r["user_id"] == user_id and r["emoji"] == emoji), None)
    if existing:
        reactions = [r for r in reactions if not (r["user_id"] == user_id and r["emoji"] == emoji)]
    else:
        reactions.append({"user_id": user_id, "emoji": emoji})

    await db.media_messages.update_one({"msg_id": msg_id}, {"$set": {"reactions": reactions}})
    conv = await db.media_conversations.find_one({"conv_id": msg["conv_id"]})
    if conv:
        await _ws_manager.broadcast_to_conv(msg["conv_id"], conv.get("participants", []), {
            "type": "reaction_update",
            "conv_id": msg["conv_id"],
            "msg_id": msg_id,
            "reactions": reactions,
        })
    return {"reactions": reactions}

@media_router.put("/conversations/{conv_id}/settings")
async def update_conv_settings(conv_id: str, request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"conv_id": conv_id})
    if not conv or user_id not in conv.get("admins", []):
        raise HTTPException(403, "Yönetici yetkisi gerekli")
    allowed = {"name", "photo", "description", "zeta_enabled", "zeta_mode", "allow_comments"}
    update = {k: v for k, v in body.items() if k in allowed}
    await db.media_conversations.update_one({"conv_id": conv_id}, {"$set": update})
    return {"ok": True}

@media_router.post("/conversations/{conv_id}/members")
async def add_member(conv_id: str, request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"conv_id": conv_id})
    if not conv or user_id not in conv.get("admins", []):
        raise HTTPException(403, "Yönetici yetkisi gerekli")
    new_member = body.get("user_id")
    if not new_member:
        raise HTTPException(400, "user_id gerekli")
    await db.media_conversations.update_one(
        {"conv_id": conv_id},
        {"$addToSet": {"participants": new_member}, "$inc": {"member_count": 1}}
    )
    return {"ok": True}

@media_router.delete("/conversations/{conv_id}/members/{member_id}")
async def remove_member(conv_id: str, member_id: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"conv_id": conv_id})
    if not conv:
        raise HTTPException(404, "Konuşma bulunamadı")
    if user_id not in conv.get("admins", []) and user_id != member_id:
        raise HTTPException(403, "Yönetici yetkisi gerekli")
    await db.media_conversations.update_one(
        {"conv_id": conv_id},
        {"$pull": {"participants": member_id}, "$inc": {"member_count": -1}}
    )
    return {"ok": True}

@media_router.post("/conversations/join/{invite_link}")
async def join_by_invite(invite_link: str, request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    conv = await db.media_conversations.find_one({"invite_link": invite_link})
    if not conv:
        raise HTTPException(404, "Davet linki geçersiz")
    if user_id in conv.get("participants", []):
        return {k: v for k, v in conv.items() if k != "_id"}
    await db.media_conversations.update_one(
        {"conv_id": conv["conv_id"]},
        {"$addToSet": {"participants": user_id}, "$inc": {"member_count": 1}}
    )
    return {k: v for k, v in conv.items() if k != "_id"}

# ─── @Zeta AI Bot ────────────────────────────────────────────────────────────────

_ZETA_MODE_PROMPTS = {
    "default": "Sen ZET AI'sın — yardımsever ve samimi bir yapay zeka asistanısın. Asla Gemini veya başka bir şirketin AI'ı olduğunu söyleme. Sohbet tonuna ve diline uyum sağla.",
    "professional": "Sen ZET AI'sın — profesyonel ve resmi bir yapay zeka asistanısın. Asla Gemini değilsin. Resmi ve yapıcı yanıtlar ver.",
    "fun": "Sen ZET AI'sın — eğlenceli, espirili ve neşeli bir yapay zeka asistanısın. Asla Gemini değilsin. Samimi ve mizahi ol.",
}

async def _handle_zeta_command(conv_id: str, content: str, requester_id: str, members: List[str], mode: str):
    """@zeta komutunu işler ve konuşmaya bot yanıtı ekler."""
    try:
        db = get_db()
        cmd = content[len("@zeta"):].strip()
        gemini_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_AI_KEY")
        if not gemini_api_key:
            return

        from google import genai as google_genai
        from google.genai import types as genai_types
        client = google_genai.Client(api_key=gemini_api_key)

        system_prompt = _ZETA_MODE_PROMPTS.get(mode, _ZETA_MODE_PROMPTS["default"])
        response_text = ""

        if cmd.lower().startswith("özet"):
            # Son 50 mesajı özetle
            recent = await db.media_messages.find(
                {"conv_id": conv_id}, {"_id": 0, "content": 1, "sender_handle": 1}
            ).sort("created_at", -1).limit(50).to_list(50)
            recent.reverse()
            chat_text = "\n".join(f"{m['sender_handle']}: {m['content']}" for m in recent if m.get("content"))
            prompt = f"{system_prompt}\n\nBu sohbeti özetle (Türkçe, kısa):\n{chat_text}"
            resp = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai_types.GenerateContentConfig(max_output_tokens=300),
            )
            response_text = resp.text or "Özet oluşturulamadı."

        elif cmd.lower().startswith("çevir"):
            parts = cmd.split(None, 2)
            target_lang = parts[1] if len(parts) > 1 else "İngilizce"
            text_to_translate = parts[2] if len(parts) > 2 else ""
            if not text_to_translate:
                response_text = "Kullanım: @zeta çevir [dil] [metin]"
            else:
                prompt = f"{system_prompt}\n\nŞu metni {target_lang} diline çevir:\n{text_to_translate}"
                resp = await asyncio.to_thread(
                    client.models.generate_content,
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=genai_types.GenerateContentConfig(max_output_tokens=200),
                )
                response_text = resp.text or "Çeviri yapılamadı."

        elif cmd.lower().startswith("anket"):
            question = cmd[5:].strip()
            response_text = f"📊 **Anket:** {question}\n\n1️⃣ Evet\n2️⃣ Hayır\n3️⃣ Kararsızım\n\n_(Anket sistemi yakında aktif olacak)_"

        elif cmd.lower().startswith("hatırlat"):
            response_text = "⏰ Hatırlatıcı sistemi yakında aktif olacak."

        else:
            # Genel AI asistan
            prompt = f"{system_prompt}\n\nKullanıcı sorusu: {cmd}"
            resp = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash",
                contents=prompt,
                config=genai_types.GenerateContentConfig(max_output_tokens=500),
            )
            response_text = resp.text or "Yanıt oluşturulamadı."

        # Zeta'nın yanıtını mesaj olarak gönder
        zeta_msg = {
            "msg_id": str(uuid.uuid4()),
            "conv_id": conv_id,
            "sender_id": "zeta_bot",
            "sender_handle": "zeta",
            "sender_display_name": "Zeta AI",
            "sender_photo": "/logo-cs.svg",
            "sender_verification": {"type": "gold"},
            "type": "text",
            "content": response_text,
            "media_url": None,
            "reply_to": None,
            "reactions": [],
            "read_by": [],
            "forwarded_from": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "edited_at": None,
            "is_bot": True,
        }
        await db.media_messages.insert_one(zeta_msg)
        last = {"content": response_text[:80], "sender_id": "zeta_bot", "sent_at": zeta_msg["created_at"]}
        await db.media_conversations.update_one({"conv_id": conv_id}, {"$set": {"last_message": last, "updated_at": zeta_msg["created_at"]}})

        result = {k: v for k, v in zeta_msg.items() if k != "_id"}
        await _ws_manager.broadcast_to_conv(conv_id, members, {
            "type": "new_message",
            "conv_id": conv_id,
            "message": result,
        })
    except Exception as e:
        logger.error(f"Zeta bot hatası: {e}")

# ═══════════════════════════════════════════════════════════════════════════════
# SEARCH
# ═══════════════════════════════════════════════════════════════════════════════

@media_router.get("/search")
async def search(q: str = Query(..., min_length=1), tab: str = Query("all"), page: int = Query(1)):
    db = get_db()
    q = q.strip()[:100]
    limit = 10
    skip = (page - 1) * limit
    result: dict = {}

    if tab in ("all", "users"):
        profiles = await db.media_profiles.find(
            {"$or": [{"handle": {"$regex": q, "$options": "i"}}, {"display_name": {"$regex": q, "$options": "i"}}]},
            {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1, "followers_count": 1, "bio": 1}
        ).limit(limit).to_list(limit)
        result["users"] = profiles

    if tab in ("all", "posts"):
        posts = await db.media_posts.find(
            {"content": {"$regex": q, "$options": "i"}, "expires_at": None},
            {"_id": 0}
        ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
        result["posts"] = posts

    if tab in ("all", "hashtags"):
        pipeline = [
            {"$match": {"hashtags": {"$regex": q, "$options": "i"}}},
            {"$unwind": "$hashtags"},
            {"$match": {"hashtags": {"$regex": q, "$options": "i"}}},
            {"$group": {"_id": "$hashtags", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}},
            {"$limit": limit},
        ]
        hashtags = await db.media_posts.aggregate(pipeline).to_list(limit)
        result["hashtags"] = [{"tag": h["_id"], "count": h["count"]} for h in hashtags]

    return result

# ═══════════════════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════════════════

async def _create_notification(user_id: str, ntype: str, actor_id: str, target_id: Optional[str]):
    db = get_db()
    notif = {
        "notif_id": str(uuid.uuid4()),
        "user_id": user_id,
        "type": ntype,
        "actor_id": actor_id,
        "target_id": target_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media_notifications.insert_one(notif)
    await _ws_manager.send_to_user(user_id, {"type": "notification", "notification": {k: v for k, v in notif.items() if k != "_id"}})

@media_router.get("/notifications")
async def get_notifications(request: Request, page: int = Query(1)):
    user_id = await _get_user_id(request)
    db = get_db()
    limit = 20
    skip = (page - 1) * limit
    notifs = await db.media_notifications.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)

    # Actor profillerini zenginleştir
    for n in notifs:
        actor = await db.media_profiles.find_one({"user_id": n["actor_id"]}, {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1})
        n["actor"] = actor

    unread_count = await db.media_notifications.count_documents({"user_id": user_id, "read": False})
    return {"notifications": notifs, "unread_count": unread_count, "page": page}

@media_router.put("/notifications/read")
async def mark_notifications_read(request: Request):
    user_id = await _get_user_id(request)
    db = get_db()
    await db.media_notifications.update_many({"user_id": user_id, "read": False}, {"$set": {"read": True}})
    return {"ok": True}

# ═══════════════════════════════════════════════════════════════════════════════
# MISC
# ═══════════════════════════════════════════════════════════════════════════════

@media_router.post("/report")
async def report_content(request: Request, body: dict = Body(...)):
    user_id = await _get_user_id(request)
    db = get_db()
    report = {
        "report_id": str(uuid.uuid4()),
        "reporter_id": user_id,
        "target_type": body.get("type", "post"),
        "target_id": body.get("target_id"),
        "reason": (body.get("reason") or "")[:500],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "pending",
    }
    await db.media_reports.insert_one(report)
    return {"reported": True}

@media_router.get("/suggested-users")
async def get_suggested_users(request: Request):
    db = get_db()
    try:
        user_id = await _get_user_id(request)
        profile = await db.media_profiles.find_one({"user_id": user_id})
        exclude = set(profile.get("following", []) + [user_id]) if profile else {user_id}
    except HTTPException:
        user_id = None
        exclude = set()

    users = await db.media_profiles.find(
        {"user_id": {"$nin": list(exclude)}},
        {"_id": 0, "handle": 1, "display_name": 1, "profile_photo": 1, "verification": 1, "followers_count": 1, "bio": 1}
    ).sort("followers_count", -1).limit(10).to_list(10)
    return users

@media_router.get("/hashtag/{tag}/posts")
async def get_hashtag_posts(tag: str, page: int = Query(1)):
    db = get_db()
    limit = 12
    skip = (page - 1) * limit
    posts = await db.media_posts.find(
        {"hashtags": tag.lower(), "expires_at": None},
        {"_id": 0}
    ).sort("score", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.media_posts.count_documents({"hashtags": tag.lower(), "expires_at": None})
    return {"posts": posts, "total": total, "page": page, "has_more": len(posts) == limit}
