from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
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

class ZetaImageRequest(BaseModel):
    prompt: str
    reference_image: Optional[str] = None

class TranslateRequest(BaseModel):
    text: str
    target_language: str

# ============ AUTH HELPERS ============

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

@api_router.post("/zeta/chat")
async def zeta_chat(req: ZetaChatRequest, user: User = Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.getenv("EMERGENT_LLM_KEY")
    session_id = req.session_id or f"zeta_{user.user_id}_{uuid.uuid4().hex[:8]}"
    
    system_message = """You are ZETA, the AI assistant for ZET Mindshare document creation app. 

PERSONALITY: Fun, professional, concise. Short sentences. Occasional emojis.

TOOLS:
- TEXT (T): Click canvas to type. Enter = new line. Like Word!
- WORD TYPE (B): Bold, Italic, Underline, Strikethrough toggles.
- TEXT SIZE: Slider 8-72pt. Select text first to change existing text.
- FONT (F): Pick from 20 fonts with search.
- LINE SPACING: 1.0x to 3.0x line heights.
- PARAGRAPH (A): Text alignment - left, center, right, justify.
- COLOR (C): 18 presets + custom picker + HEX code input + gradient text!
- HAND (H): Scroll wheel = zoom towards cursor. Click elements to select & drag. Also moves vector shapes!
- ZOOM (Z): Magnifier tool. Set zoom level and lens size. Scroll zooms towards cursor.
- IMAGE (I): Upload images. Drag to move, corner to resize. 3-dots menu for change/delete.
- AI IMAGE (W): Generate images with AI! Preview before adding to document.
- DRAW (D): Freehand drawing with size/opacity/color controls.
- PEN (P): Vector drawing - click points, auto-closes near first point, double-click to finish open path.
- ERASER (E): Removes draw paths. Adjustable size.
- MARKING (M): Highlighter with color/opacity/size options.
- SELECT (S): Rectangle selection for multi-select elements.
- CUT (X): Delete elements or crop images.
- TRANSLATE (L): AI translation to 12 languages! Select text, translate, apply.
- GRAPHIC (G): Create charts! Bar, Pie, Line. Enter labels and values comma-separated.
- PAGE COLOR: Change canvas background color.
- EXPORT: Export current page as PDF!
- PAGE SIZE: A4, A5, Letter, Legal, Square or custom px.
- ADD PAGE (N): Adds new page to document.
- VOICE (V): AI reads your document aloud! Play/pause, skip forward/back.
- SHAPES (1,2,3,4): Triangle, Square, Circle, Star. Resize from corner. 3-dots menu to add image or AI image inside!

VECTOR SHAPES (Pen tool):
- Click to add points, creates connected shape
- Click near first point to auto-close
- Double-click to finish open path
- Select with Hand tool, drag to move
- 3-dots menu: Add Image, AI Image, Delete

KEYBOARD SHORTCUTS:
- Open Shortcuts panel (header keyboard icon) to see/customize all shortcuts
- Delete/Backspace: Delete selected element
- Escape: Deselect
- Ctrl+Z: Undo, Ctrl+Y: Redo

TIPS:
- Auto-saves every 2 seconds ✨
- Default zoom is 75%
- Undo/Redo buttons in header
- Export to PDF from toolbar

Keep answers SHORT. Match user's language. Türkçe soruya Türkçe yanıt ver!
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

# ============ CLOUD STORAGE ROUTES (MOCK) ============

@api_router.get("/cloud/google-drive/files")
async def list_google_drive_files(user: User = Depends(get_current_user)):
    # Mock - will be implemented with actual Google Drive API
    return {"files": [], "message": "Google Drive integration coming soon"}

@api_router.post("/cloud/google-drive/upload")
async def upload_to_google_drive(user: User = Depends(get_current_user)):
    return {"message": "Google Drive upload coming soon"}

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
