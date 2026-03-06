# ZET Mindshare - PRD (Product Requirements Document)

## Overview
ZET Mindshare is a mobile and PC compatible document creation tool with integrated AI assistant (ZETA).

## Original Problem Statement
- Mobil ve PC uyumlu belge oluşturma aracı
- ZETA AI entegrasyonu (beyin fırtınası, araştırma, analiz, görsel oluşturma)
- Uygulama içi satın alma (sonra eklenecek)
- Ana renkler: #292f91 ve #4ca8ad
- Koyu mat tema, hafif glow, minimalist stil

## User Personas
1. **Content Creators** - Blog yazarları, içerik üreticileri
2. **Business Professionals** - İş planı, proje teklifi hazırlayanlar
3. **Students** - Ödev, makale, araştırma belgeleri
4. **Personal Users** - CV, mektup, günlük notlar

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **AI:** Gemini 3 Flash (text), Nano Banana (images) via Emergent LLM Key
- **Auth:** Emergent Google OAuth

## Code Architecture (Post-Refactor)
```
/app/
├── backend/
│   ├── server.py          # FastAPI: auth, documents CRUD, ZETA AI, image gen
│   ├── tests/test_api.py  # Backend API tests
│   └── .env
├── frontend/src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── CanvasArea.js      # Canvas rendering, text editing (contentEditable), drawing, shapes
│   │   │   ├── DraggablePanel.js  # Floating draggable panel wrapper
│   │   │   ├── RightPanel.js      # Pages panel + ZETA AI chat
│   │   │   └── Toolbox.js         # Tool grid, search, tooltips
│   │   └── ui/                    # Shadcn components
│   ├── contexts/
│   │   ├── AuthContext.js
│   │   └── LanguageContext.js     # EN/TR translations
│   ├── hooks/
│   │   └── useCanvasHistory.js    # Undo/redo state management
│   ├── lib/
│   │   └── editorConstants.js     # TOOLS, FONTS, COLORS, PAGE_SIZES
│   └── pages/
│       ├── Dashboard.js
│       ├── Editor.js              # State orchestrator (~560 lines)
│       └── LoginPage.js
└── memory/PRD.md
```

## Core Requirements Status
- [x] Google Auth ile giriş
- [x] Belge oluşturma/düzenleme
- [x] Hızlı notlar
- [x] ZETA AI chat (Gemini 3 Flash)
- [x] Multi-language support (English/Turkish)
- [x] ZETA responds in user's language
- [x] ZETA AI görsel oluşturma (Nano Banana) - Backend + Frontend ready
- [x] Mobil/PC responsive tasarım
- [x] 3 sütunlu editör (Toolbox, Canvas, Pages+ZETA)
- [x] Collapsible/draggable panels
- [x] 3 tools per row in toolbox with tooltips
- [x] 17 tools: Text, TextSize, Font, Color, Hand, Image, AI Image, Draw, Mass Select, Cut, AddPage, PageSize, Voice, Triangle, Square, Circle, Star
- [x] WYSIWYG text editing (contentEditable)
- [x] Undo/Redo with history management
- [x] Auto-save every 2 seconds
- [x] Toolbox search filtering
- [x] Shape tools with "Add Image" option
- [x] Drawing with brush size, opacity, color
- [ ] Google Drive entegrasyonu - MOCK
- [ ] iCloud entegrasyonu - MOCK
- [ ] Uygulama içi satın alma - Sonra eklenecek

## What's Been Implemented

### Phase 1-6: MVP through Pro Features (Previous Fork)
- Complete auth, dashboard, editor layout, ZETA AI, i18n, tools UI

### Phase 7: Major Refactor & Quality Overhaul (March 6, 2026)
- **Code Refactoring:** Monolithic Editor.js (960 lines) split into 7 modular files
- **Text Editing Fix:** Replaced input-based approach with contentEditable WYSIWYG
  - Click-to-create text blocks, multi-line support, auto-wrap, inline editing
  - Double-click to edit existing text, click elsewhere to commit
- **Backend Bug Fix:** AI image generation endpoint was truncating image data
- **Custom Hook:** useCanvasHistory for proper undo/redo state management
- **All 17 tools verified working** with testing agent (100% pass rate)
- **All draggable panels working** (Draw, Color, TextSize, Font, PageSize, AI Image)
- **Testing:** Backend 22/22 (100%), Frontend 25/25 (100%)

## Prioritized Backlog

### P1 (High)
- Document export (PDF, PNG)
- Vertical multi-page scrolling (like MS Word)
- Real Google & Apple Sign-In (currently Emergent OAuth only)

### P2 (Medium)
- Google Drive actual integration
- iCloud integration
- Subscription/payment system (Stripe)

### P3 (Nice to have)
- Real-time collaboration
- Template library
- Advanced typography tools (bold, italic, alignment)

## Key API Endpoints
- `POST /api/auth/session` - Create session from OAuth
- `GET /api/auth/me` - Get current user
- `GET /api/documents` - List documents
- `POST /api/documents` - Create document
- `GET /api/documents/{doc_id}` - Get document
- `PUT /api/documents/{doc_id}` - Update document (auto-save)
- `DELETE /api/documents/{doc_id}` - Delete document
- `POST /api/zeta/chat` - ZETA AI chat
- `POST /api/zeta/generate-image` - AI image generation

## DB Schema
- `users`: {user_id, email, name, picture, created_at}
- `documents`: {doc_id, user_id, title, doc_type, content, pages[], created_at, updated_at}
  - pages[]: {page_id, elements[], drawPaths[], pageSize}
  - elements[]: {id, type, x, y, content/src/shapeType, fontSize, fontFamily, color, width, height, fill, image}
- `quick_notes`: {note_id, user_id, content, created_at}
- `user_sessions`: {user_id, session_token, expires_at, created_at}
- `zeta_chats`: {user_id, session_id, doc_id, user_message, ai_response, created_at}

## 3rd Party Integrations
- **Gemini 3 Flash** — Emergent LLM Key (ZETA chat) ✅
- **Gemini Nano Banana** — Emergent LLM Key (Image generation) ✅
- **Emergent Google OAuth** — Auth ✅
- **Google Drive / iCloud** — MOCKED
