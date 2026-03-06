# ZET Mindshare - PRD (Product Requirements Document)

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Original Problem Statement
- Entegre ZETA AI ile beyin fırtınası, araştırma, analiz, görsel oluşturma
- Ana renkler: #292f91 ve #4ca8ad, koyu mat tema, minimalist stil
- 3 sütunlu editör: Toolbox, Canvas, Pages+ZETA

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Auth:** Emergent Google OAuth + JWT

## Code Architecture
```
/app/
├── backend/
│   ├── server.py          # FastAPI: auth, docs CRUD, ZETA AI, translate, image gen
│   ├── tests/test_api.py  # 24 API tests
│   └── .env
├── frontend/src/
│   ├── components/editor/
│   │   ├── CanvasArea.js      # Canvas: text editing, drawing, shapes, mass select, crop, eraser, pen
│   │   ├── DraggablePanel.js  # Floating draggable panel wrapper
│   │   ├── RightPanel.js      # Pages + ZETA AI chat (w-72)
│   │   └── Toolbox.js         # Tool grid, search, tooltips (w-72)
│   ├── contexts/ (AuthContext, LanguageContext)
│   ├── hooks/useCanvasHistory.js
│   ├── lib/editorConstants.js  # 20 TOOLS, FONTS, COLORS, PAGE_SIZES, TRANSLATE_LANGUAGES
│   └── pages/ (Dashboard, Editor, LoginPage)
└── memory/PRD.md
```

## Implemented Features (Complete)

### Core Editor
- [x] 3-column layout: Toolbox (w-72), Canvas, Pages+ZETA (w-72)
- [x] WYSIWYG text editing (contentEditable) - click to create, type, Enter for new lines
- [x] Undo/Redo with history management
- [x] Auto-save every 2 seconds
- [x] Multi-page support (add, delete, navigate)
- [x] Custom cursors per tool (text=text, hand=grab, draw=crosshair, eraser=circle)

### 20 Tools
- [x] Text, TextSize, Font, Color Picker, Hand (pan/zoom)
- [x] Image Upload, AI Image (Nano Banana with preview before adding)
- [x] Draw (pencil with size/opacity/color), Pen (vector drawing)
- [x] Eraser (removes draw paths with adjustable size)
- [x] Mass Select (rectangle-based selection)
- [x] Cut (delete elements + crop mode for images)
- [x] Translate (AI translation with 12 languages, preview + add)
- [x] Add Page, Page Size (A4/A5/Letter/Legal/Square/Custom)
- [x] Voice Reader (skip back/forward, clickable/draggable timeline)
- [x] Shapes (Triangle, Square, Circle, Star with resize + add image)

### AI Integration
- [x] ZETA Chat (Gemini 3 Flash) - multi-lingual assistant
- [x] AI Image Generation (Nano Banana) - with preview panel
- [x] AI Translation (Gemini 3 Flash) - 12 target languages

### Other
- [x] Google Auth (Emergent OAuth)
- [x] JWT session management
- [x] Dashboard with file management
- [x] Quick notes
- [x] Multi-language UI (EN/TR)
- [x] Draggable floating panels
- [x] Tooltips on all tools
- [x] Collapsible panels

## Key API Endpoints
- `POST /api/auth/session`, `GET /api/auth/me`
- `GET/POST/PUT/DELETE /api/documents`, `/api/documents/{doc_id}`
- `POST /api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`

## DB Schema
- `users`, `documents` (with pages[].elements[], drawPaths[]), `quick_notes`, `user_sessions`, `zeta_chats`

## Testing History
- iteration_7: Backend 22/22, Frontend 25/25 (100%)
- iteration_8: Backend 24/24, Frontend 25/25 (100%)

## Prioritized Backlog
### P1
- Document export (PDF/PNG)
- Vertical multi-page scrolling (like MS Word)
- Advanced typography (bold, italic, alignment)
### P2
- Google Drive/iCloud real integration (currently MOCKED)
- Subscription/payment system
- Real-time collaboration
- Template library

## MOCKED: Google Drive, iCloud integrations
