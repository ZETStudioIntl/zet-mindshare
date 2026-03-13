from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Body, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import base64
import asyncio
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
users_collection = db.users
docs_collection = db.documents

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    subscription: str = "free"  # free, plus, pro, ultra
    subscription_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Document(BaseModel):
    doc_id: str = Field(default_factory=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    user_id: str
    title: str
    doc_type: str = "document"
    content: dict = Field(default_factory=dict)
    pages: List[dict] = Field(default_factory=lambda: [{"page_id": "page_1", "content": {}}])
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

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[dict] = None
    pages: Optional[List[dict]] = None

class QuickNote(BaseModel):
    note_id: str = Field(default_factory=lambda: f"note_{uuid.uuid4().hex[:12]}")
    user_id: str
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuickNoteCreate(BaseModel):
    content: str
    reminder_time: Optional[str] = None

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

class ZetaImageRequest(BaseModel):
    prompt: str
    reference_image: Optional[str] = None

class TranslateRequest(BaseModel):
    text: str
    target_language: str

class EmailAuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None

# ============ EMAIL HELPER ============

resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

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

# ============ AUTH HELPERS ============

import hashlib

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

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
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

# ============ AUTH ROUTES ============

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        user_data = resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    existing_user = await db.users.find_one({"email": user_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": user_data["name"], "picture": user_data.get("picture")}}
        )
    else:
        await db.users.insert_one({
            "user_id": user_id,
            "email": user_data["email"],
            "name": user_data["name"],
            "picture": user_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    session_token = user_data.get("session_token", f"st_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    # Get full user data including subscription
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "user_id": user_data.get("user_id"),
        "email": user_data.get("email"),
        "name": user_data.get("name", ""),
        "picture": user_data.get("picture"),
        "subscription": user_data.get("subscription", "free"),
        "subscription_date": user_data.get("subscription_date")
    }

class ProfileUpdate(BaseModel):
    name: Optional[str] = None

@api_router.put("/auth/profile")
async def update_profile(req: ProfileUpdate, user: User = Depends(get_current_user)):
    update_data = {}
    if req.name is not None:
        update_data["name"] = req.name
    
    if update_data:
        await db.users.update_one({"user_id": user.user_id}, {"$set": update_data})
    
    return {"message": "Profile updated", "name": req.name}

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ============ EMAIL AUTH ROUTES ============

@api_router.post("/auth/register")
async def register_with_email(req: EmailAuthRequest, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
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
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )
    
    return {"user": {"user_id": user_id, "email": req.email, "name": user_data["name"]}}

@api_router.post("/auth/login")
async def login_with_email(req: EmailAuthRequest, response: Response):
    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("hashed_password") or not verify_password(req.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create session
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "session_token": session_token,
        "user_id": user["user_id"],
        "expires_at": expires_at.isoformat()
    })
    
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none", path="/", max_age=7*24*60*60
    )
    
    return {"user": {"user_id": user["user_id"], "email": user["email"], "name": user.get("name", "")}}

# ============ DOCUMENTS ROUTES ============

@api_router.get("/documents", response_model=List[dict])
async def get_documents(user: User = Depends(get_current_user)):
    docs = await db.documents.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
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
        "created_at": now.isoformat()
    }
    await db.quick_notes.insert_one(note_dict)
    return {k: v for k, v in note_dict.items() if k != "_id"}

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
async def get_due_reminders(user: User = Depends(get_current_user)):
    now = datetime.now(timezone.utc).isoformat()
    reminders = await db.quick_notes.find({
        "user_id": user.user_id,
        "reminder_time": {"$lte": now},
        "reminder_sent": False
    }, {"_id": 0}).to_list(100)
    return reminders

@api_router.put("/notes/{note_id}/reminder-sent")
async def mark_reminder_sent(note_id: str, user: User = Depends(get_current_user)):
    # Get the note content
    note = await db.quick_notes.find_one({"note_id": note_id, "user_id": user.user_id}, {"_id": 0})
    if note:
        # Send email notification
        html_content = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); color: #fff; border-radius: 12px;">
            <h2 style="color: #4ca8ad; margin-bottom: 20px;">🔔 ZET Mindshare Hatırlatıcı</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 16px;">{note.get('content', '')}</p>
            </div>
            <p style="color: #888; font-size: 12px;">Bu e-posta, ayarladığınız hatırlatıcı için gönderilmiştir.</p>
            <a href="https://zetmindshare.com" style="display: inline-block; background: #4ca8ad; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 10px;">ZET Mindshare'i Aç</a>
        </div>
        """
        await send_email(user.email, "🔔 ZET Mindshare Hatırlatıcı", html_content)
    
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
    return {
        "plan": user_data.get("subscription", "free"),
        "subscription_date": user_data.get("subscription_date"),
        "cancel_pending": user_data.get("cancel_pending", False)
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
        cancel_link = f"https://ai-canvas-68.preview.emergentagent.com/api/subscription/confirm-cancel?token={cancel_token}"
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
    
    # Return HTML page
    return JSONResponse(content={
        "success": True,
        "message": "Aboneliğiniz başarıyla iptal edildi. FREE plana düştünüz."
    })

# ============ USAGE LIMITS ============

# Plan limits
PLAN_LIMITS = {
    'free': {'ai_images': 1, 'judge_basic': 0, 'judge_deep': 0, 'judge_chars': 0},
    'plus': {'ai_images': 5, 'judge_basic': 3, 'judge_deep': 0, 'judge_chars': 400},
    'pro': {'ai_images': 30, 'judge_basic': 7, 'judge_deep': 1, 'judge_chars': 900},
    'ultra': {'ai_images': 50, 'judge_basic': 12, 'judge_deep': 5, 'judge_chars': 2000}
}

@api_router.get("/usage")
async def get_usage(user: User = Depends(get_current_user)):
    user_data = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    plan = user_data.get("subscription", "free")
    
    # Get today's usage
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    usage = await db.usage.find_one({"user_id": user.user_id, "date": today}, {"_id": 0})
    
    if not usage:
        usage = {"ai_images": 0, "judge_basic": 0, "judge_deep": 0}
    
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
    
    return {
        "plan": plan,
        "limits": limits,
        "usage": {
            "ai_images": usage.get("ai_images", 0),
            "judge_basic": usage.get("judge_basic", 0),
            "judge_deep": usage.get("judge_deep", 0)
        },
        "remaining": {
            "ai_images": max(0, limits['ai_images'] - usage.get("ai_images", 0)),
            "judge_basic": max(0, limits['judge_basic'] - usage.get("judge_basic", 0)),
            "judge_deep": max(0, limits['judge_deep'] - usage.get("judge_deep", 0)),
            "judge_chars": limits['judge_chars']
        }
    }

async def check_and_increment_usage(user_id: str, usage_type: str) -> bool:
    """Check if user has remaining usage and increment if allowed"""
    user_data = await db.users.find_one({"user_id": user_id})
    plan = user_data.get("subscription", "free") if user_data else "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    usage = await db.usage.find_one({"user_id": user_id, "date": today})
    
    if not usage:
        usage = {"user_id": user_id, "date": today, "ai_images": 0, "judge_basic": 0, "judge_deep": 0}
        await db.usage.insert_one(usage)
    
    current = usage.get(usage_type, 0)
    limit = limits.get(usage_type, 0)
    
    if current >= limit:
        return False
    
    await db.usage.update_one(
        {"user_id": user_id, "date": today},
        {"$inc": {usage_type: 1}}
    )
    return True

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

# ============ ZETA AI ROUTES ============

# ZET Judge Mini - Business Analysis AI
@api_router.post("/judge/chat")
async def judge_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    # Get user's plan and limits
    user_data = await db.users.find_one({"user_id": user.user_id})
    plan = user_data.get("subscription", "free") if user_data else "free"
    limits = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])
    
    # Check if Judge is available for this plan
    if plan == "free":
        return {"response": "⚠️ ZET Judge Mini, Free planda kullanılamaz. Lütfen Plus veya üzeri bir plana yükseltin.", "session_id": None, "locked": True}
    
    # Check character limit
    if len(req.message) > limits['judge_chars']:
        return {"response": f"⚠️ Mesaj çok uzun! {plan.upper()} planında maksimum {limits['judge_chars']} karakter kullanabilirsiniz.", "session_id": None, "char_limit_exceeded": True}
    
    # Determine usage type based on mode
    mode = req.mode or "fast"
    usage_type = "judge_deep" if mode == "deep" else "judge_basic"
    
    # Check usage limit
    allowed = await check_and_increment_usage(user.user_id, usage_type)
    if not allowed:
        limit = limits[usage_type]
        mode_name = "derin analiz" if mode == "deep" else "temel analiz"
        return {"response": f"⚠️ Günlük {mode_name} limitinize ulaştınız ({limit}/{limit}). Yarın tekrar deneyin veya planınızı yükseltin.", "session_id": None, "limit_exceeded": True}
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
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
    
    system_message = f"""Sen ZET Judge Mini - ZET Studio International tarafından iş analizi için geliştirilmiş profesyonel bir AI'sın.

{mode_instruction}

KİMLİĞİN:
- ZET Studio International tarafından geliştirildin
- CEO: Muhammed Bahaddin Yılmaz (Sünni-Hanefi çizgisinde dindar biri, hayatını dinine göre şekillendiriyor)
- Merkez: İstanbul, Türkiye
- Şirket: Kullanıcılara basit ama profesyonel üretkenlik araçları sunan bir yazılım devi

KİŞİLİĞİN VE TARZI:
{'''😈 SERT MOD AKTİF - ELEŞTİRİYİ ESPRİLİ DALGA GEÇEREK YAP!
- Yapıcı eleştiri yerine komik ve alaycı ol
- Espriler ile dalga geç ama kırıcı olma
- "Ciddi misin?", "Bu ne şimdi?", "Vay be, müthiş(!) 😂" gibi ifadeler kullan
- Mizah dolu, sarkastik ama yine de yardımcı ol
- Eleştirini komik şekilde yap, sonra gerçek tavsiyeyi ver
- Örnek: "Bu iş planı mı? Bu kadar veriyle markete bile gidemezsin 😅 Şaka şaka, ama ciddi eksikler var..."''' if req.personality == 'harsh' else '''- Az kelime, kısa ve öz
- Dobra ve dürüst
- Acı ve sert ama ASLA kırıcı değil
- Cesaretlendirici
- Boş gaz vermezsin, vizyon ve plan verirsin
- Pohpohlamak yok - proje iyi olsa bile gerçekçi ol
- Kötüyse neden kötü olduğunu açıkça söyle
- Fazla sohbet muhabbet etme'''}

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

ÖNEMLİ:
- İsrail'e destek yok sorusuna: "Hayır, ZET Studio International İsrail'e destek vermiyor"
- Zayıf alanlarını güçlü göster, savunmacı olma

Kullanıcının diline göre yanıt ver. Türkçe soruya Türkçe, İngilizce soruya İngilizce yanıt ver."""
    
    # If document content is provided, add it to the context
    if req.document_content:
        system_message += f"""

ANALİZ EDİLECEK MATERYAL:
---
{req.document_content[:8000]}
---
Bu içeriği analiz et ve yukarıdaki kurallara göre yanıt ver."""
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message
    )
    chat.with_model("gemini", "gemini-3-flash-preview")
    
    user_message = UserMessage(text=req.message)
    response = await chat.send_message(user_message)
    
    # Save chat history
    await db.judge_chats.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "doc_id": req.doc_id,
        "user_message": req.message,
        "ai_response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"response": response, "session_id": session_id}

@api_router.post("/zeta/chat")
async def zeta_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = req.session_id or f"zeta_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    # Get user's subscription info
    user_data = await db.users.find_one({"user_id": user.user_id})
    user_plan = user_data.get("subscription", "free") if user_data else "free"
    
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
    
    system_message = f"""Sen ZETA, ZET Mindshare belge oluşturma uygulamasının AI asistanısın.

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

💎 ABONELİK PAKETLERİ:
| Plan  | AI Görsel | Judge Temel | Judge Derin | Fast Select | Fiyat (Aylık) |
|-------|-----------|-------------|-------------|-------------|---------------|
| Free  | 1/gün     | ❌ Kilitli  | ❌ Kilitli  | 3 araç      | Ücretsiz      |
| Plus  | 5/gün     | 3/gün       | ❌          | 5 araç      | $9.99         |
| Pro   | 30/gün    | 7/gün       | 1/gün       | 8 araç      | $19.99        |
| Ultra | 50/gün    | 12/gün      | 5/gün       | 8 araç      | $39.99        |

- Fast Select: Sol üstteki arama çubuğunun yanındaki hızlı araç seçimi butonu
- AI Görsel: AI Image aracı ile oluşturulabilecek görsel sayısı
- Judge Temel: Hızlı analiz modu
- Judge Derin: Kapsamlı ve detaylı analiz modu

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

Yanıtları KISA tut. Kullanıcının dilinde yanıt ver!
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
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=system_message
    )
    chat.with_model("gemini", "gemini-3-flash-preview")
    
    user_message = UserMessage(text=req.message)
    response = await chat.send_message(user_message)
    
    # Save chat history
    await db.zeta_chats.insert_one({
        "user_id": user.user_id,
        "session_id": session_id,
        "doc_id": req.doc_id,
        "user_message": req.message,
        "ai_response": response,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"response": response, "session_id": session_id}

@api_router.post("/zeta/generate-image")
async def zeta_generate_image(req: ZetaImageRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    
    # Check AI image usage limit
    allowed = await check_and_increment_usage(user.user_id, "ai_images")
    if not allowed:
        user_data = await db.users.find_one({"user_id": user.user_id})
        plan = user_data.get("subscription", "free") if user_data else "free"
        limit = PLAN_LIMITS.get(plan, PLAN_LIMITS['free'])['ai_images']
        raise HTTPException(status_code=429, detail=f"Günlük AI görsel limitinize ulaştınız ({limit}/{limit}). Yarın tekrar deneyin veya planınızı yükseltin.")
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = f"zeta_img_{uuid.uuid4().hex[:8]}"
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message="You are an image generation assistant."
    )
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    if req.reference_image:
        msg = UserMessage(
            text=req.prompt,
            file_contents=[ImageContent(req.reference_image)]
        )
    else:
        msg = UserMessage(text=req.prompt)
    
    text, images = await chat.send_message_multimodal_response(msg)
    
    result = {"text": text, "images": []}
    if images:
        for img in images:
            result["images"].append({
                "mime_type": img.get("mime_type", "image/png"),
                "data": img["data"]
            })
    
    return result

# AI Photo Edit endpoint
class PhotoEditRequest(BaseModel):
    image_data: str  # Base64 encoded image
    edit_prompt: str  # What to change

@api_router.post("/zeta/photo-edit")
async def zeta_photo_edit(req: PhotoEditRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = f"zeta_edit_{uuid.uuid4().hex[:8]}"
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message="You are an AI image editor. Edit the provided image according to the user's instructions. Apply the requested changes while maintaining the overall composition and quality of the original image."
    )
    chat.with_model("gemini", "gemini-3-pro-image-preview").with_params(modalities=["image", "text"])
    
    # Clean base64 data
    image_data = req.image_data
    if ',' in image_data:
        image_data = image_data.split(',')[1]
    
    msg = UserMessage(
        text=f"Edit this image: {req.edit_prompt}",
        file_contents=[ImageContent(image_data)]
    )
    
    text, images = await chat.send_message_multimodal_response(msg)
    
    result = {"text": text or "Image edited successfully", "images": []}
    if images:
        for img in images:
            result["images"].append({
                "mime_type": img.get("mime_type", "image/png"),
                "data": img["data"]
            })
    
    return result

@api_router.post("/zeta/translate")
async def zeta_translate(req: TranslateRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = f"zeta_tr_{uuid.uuid4().hex[:8]}"
    
    chat = LlmChat(
        api_key=api_key,
        session_id=session_id,
        system_message=f"You are a translator. Translate the given text to {req.target_language}. Return ONLY the translated text, nothing else. No explanations, no quotes."
    )
    chat.with_model("gemini", "gemini-3-flash-preview")
    
    msg = UserMessage(text=req.text)
    response = await chat.send_message(msg)
    
    return {"translated_text": response.strip(), "target_language": req.target_language}

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
        frontend_url = os.getenv("FRONTEND_URL", "https://ai-canvas-68.preview.emergentagent.com")
        await users_collection.update_one(
            {"user_id": user.user_id},
            {"$set": {"drive_token": "mock_token", "drive_connected_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"authorization_url": f"{frontend_url}/dashboard?drive_connected=true", "message": "Drive connected (mock - no credentials configured)"}
    
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", "https://ai-canvas-68.preview.emergentagent.com/api/drive/callback")
    
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
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", "https://ai-canvas-68.preview.emergentagent.com/api/drive/callback")
    frontend_url = os.getenv("FRONTEND_URL", "https://ai-canvas-68.preview.emergentagent.com")
    
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

# ============ ROOT ============

@api_router.get("/")
async def root():
    return {"message": "ZET Mindshare API", "version": "1.0.0"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
