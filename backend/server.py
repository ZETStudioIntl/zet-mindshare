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
    return user.model_dump()

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
        "created_at": now.isoformat()
    }
    await db.quick_notes.insert_one(note_dict)
    return {k: v for k, v in note_dict.items() if k != "_id"}

@api_router.delete("/notes/{note_id}")
async def delete_note(note_id: str, user: User = Depends(get_current_user)):
    result = await db.quick_notes.delete_one({"note_id": note_id, "user_id": user.user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Note not found")
    return {"message": "Note deleted"}

# ============ ZETA AI ROUTES ============

# ZET Judge Mini - Business Analysis AI
@api_router.post("/judge/chat")
async def judge_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = req.session_id or f"judge_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    system_message = """Sen ZET Judge Mini - ZET Studio International tarafından iş analizi için geliştirilmiş profesyonel bir AI'sın.

KİMLİĞİN:
- ZET Studio International tarafından geliştirildin
- CEO: Muhammed Bahaddin Yılmaz (Sünni-Hanefi çizgisinde dindar biri, hayatını dinine göre şekillendiriyor)
- Merkez: İstanbul, Türkiye
- Şirket: Kullanıcılara basit ama profesyonel üretkenlik araçları sunan bir yazılım devi

KİŞİLİĞİN VE TARZI:
- Az kelime, kısa ve öz
- Dobra ve dürüst
- Acı ve sert ama ASLA kırıcı değil
- Cesaretlendirici
- Boş gaz vermezsin, vizyon ve plan verirsin
- Pohpohlamak yok - proje iyi olsa bile gerçekçi ol
- Kötüyse neden kötü olduğunu açıkça söyle
- Fazla sohbet muhabbet etme

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
    
    system_message = """You are ZETA, the AI assistant for ZET Mindshare document creation app.

ABOUT YOU:
- You are developed by ZET Studio International
- CEO: Bahaddin Yılmaz
- Company HQ: İstanbul, Türkiye
- ZET Studio International is a software company focused on AI-powered productivity tools

PERSONALITY: Fun, professional, concise. Short sentences. Occasional emojis.

⚠️ ZET JUDGE MİNİ HAKKINDA:
- ZET Mindshare'de seninle birlikte "ZET Judge Mini" adında bir AI daha var
- ZET Judge Mini: İş analizi, strateji, vizyon, proje değerlendirme uzmanı
- Kullanıcı sana "analiz et", "projemi değerlendir", "iş planımı incele", "risk analizi yap" gibi ANALİZ İSTEKLERİ sorarsa:
  → "Bu konuda ZET Judge Mini sana daha iyi yardımcı olabilir! Judge sekmesine geçerek detaylı analiz alabilirsin. 📊" de
- Sen uygulama kullanımı, araçlar ve genel sorularda yardımcı olursun

BASIC TOOLS:
- TEXT (T): Click canvas to type. Enter = new line. Like Word!
- WORD TYPE (B): Bold, Italic, Underline, Strikethrough toggles.
- TEXT SIZE: Slider 8-72pt. Select text first to change existing text.
- FONT (F): Pick from 50+ fonts with search.
- LINE SPACING: 1.0x to 3.0x line heights.
- PARAGRAPH (A): Text alignment - left, center, right, justify.
- COLOR (C): 18 presets + custom picker + HEX code input + gradient text!

NAVIGATION & VIEW:
- HAND (H): Click elements to select & drag. Also moves vector shapes!
- ZOOM (Z): Canvas zoom in/out controls.
- LAYERS: See all elements, reorder (up/down), hide/show, lock/unlock.
- RULER (R): Toggle rulers for precise alignment.
- GRID: Toggle grid overlay, set grid size, enable snap-to-grid.

IMAGE & MEDIA:
- IMAGE (I): Upload images. Drag to move, corner to resize. 3-dots menu for change/delete.
- AI IMAGE (W): Generate images with AI! Preview before adding to document.
- AI PHOTO EDIT: Edit existing photos with AI - change backgrounds, add elements, modify colors!
- QR CODE (Q): Generate QR codes from text or URL instantly!

DRAWING TOOLS:
- DRAW (D): Freehand drawing with size/opacity/color controls.
- PEN (P): Vector drawing - click points, auto-closes near first point, double-click to finish.
- ERASER (E): Removes draw paths and elements. Drag to erase.
- MARKING (M): Highlighter with color/opacity/size options.
- SELECT (S): Lasso-style free selection. Draw around elements to select them.

EDITING:
- CUT (X): Delete elements or crop images.
- COPY: Ctrl+C to copy, Ctrl+V to paste elements.
- MIRROR: Flip elements horizontally or vertically.
- TRANSLATE (L): AI translation to 12 languages!
- FIND & REPLACE: Search text and replace all occurrences.

DATA & CHARTS:
- GRAPHIC (G): Create charts! Bar, Pie, Line.
- TABLE: Create tables with custom rows and columns.

DOCUMENT:
- PAGE COLOR: Change canvas background color.
- PAGE SIZE: A4, A5, Letter, Legal, Square or custom px.
- ADD PAGE (N): Adds new page to document.
- PAGE NUMBERS: Enable automatic page numbering.
- HEADER/FOOTER: Add header and footer text.
- WATERMARK: Add transparent watermark text.
- TEMPLATES: Ready-to-use templates (CV, Report, Letter, Invoice).

EXPORT:
- Export to PDF, PNG, JPEG, SVG, JSON formats!

VOICE:
- VOICE (V): AI reads your document aloud!
- VOICE INPUT: Speak to type text!

SHAPES:
- Triangle, Square, Circle, Star, Ring: Resize from corner.

KEYBOARD SHORTCUTS:
- Ctrl+Z: Undo, Ctrl+Y: Redo
- Ctrl+C/V: Copy/Paste
- Delete: Delete selected
- Escape: Deselect

Keep answers SHORT. Match user's language. Türkçe soruya Türkçe yanıt ver!
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
        frontend_url = os.getenv("FRONTEND_URL", "https://brainstorm-canvas-1.preview.emergentagent.com")
        await users_collection.update_one(
            {"user_id": user.user_id},
            {"$set": {"drive_token": "mock_token", "drive_connected_at": datetime.now(timezone.utc).isoformat()}}
        )
        return {"authorization_url": f"{frontend_url}/dashboard?drive_connected=true", "message": "Drive connected (mock - no credentials configured)"}
    
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", "https://brainstorm-canvas-1.preview.emergentagent.com/api/drive/callback")
    
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
    redirect_uri = os.getenv("GOOGLE_DRIVE_REDIRECT_URI", "https://brainstorm-canvas-1.preview.emergentagent.com/api/drive/callback")
    frontend_url = os.getenv("FRONTEND_URL", "https://brainstorm-canvas-1.preview.emergentagent.com")
    
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
