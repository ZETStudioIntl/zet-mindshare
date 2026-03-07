# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Voice:** ElevenLabs (Male/Female TTS) + Browser TTS fallback
- **Export:** jsPDF, html2canvas

## All Implemented Features (40+ Tools)

### Text & Formatting
- [x] **Text (T)** - WYSIWYG text editing
- [x] **Word Type (B)** - Bold, Italic, Underline, Strikethrough toggles
- [x] **Text Size** - Slider 8-72pt
- [x] **Font (F)** - 20 fonts with search
- [x] **Line Spacing** - 1.0 to 3.0x
- [x] **Paragraph (A)** - Alignment (left, center, right, justify)
- [x] **Color (C)** - 18 presets + hex code + gradient text

### Navigation & View
- [x] **Hand (H)** - Pan/zoom + drag elements + drag vectors
- [x] **Zoom (Z)** - Magnifier with zoom level & lens size
- [x] **Layers** - Reorder, hide/show, lock/unlock, DELETE elements
- [x] **Ruler (R)** - Toggle rulers for alignment
- [x] **Grid** - Toggle grid, set size, snap-to-grid

### Image & Media
- [x] **Image (I)** - Upload with context menu
- [x] **AI Image (W)** - Nano Banana with preview
- [x] **QR Code (Q)** - Generate QR from text/URL

### Drawing Tools
- [x] **Draw (D)** - Freehand with size/opacity/color
- [x] **Pen (P)** - Vector drawing (auto-close, double-click finish)
- [x] **Eraser (E)** - DRAG MODE toggle for drawing-style erase
- [x] **Marking (M)** - Highlighter
- [x] **Select (S)** - Lasso selection (free-form, selects vectors too)
- [x] **Cut (X)** - Delete + image crop

### Data & Charts
- [x] **Graphic (G)** - Bar, Pie, Line charts (SVG-based)
- [x] **Table** - Create tables with custom rows/columns

### Document
- [x] **Templates** - CV, Report, Letter, Invoice, Presentation
- [x] **Page Color** - Canvas background color
- [x] **Page Size** - A4, A5, Letter, Legal, Square, custom
- [x] **Add Page (N)** - Add new pages
- [x] **Page Numbers** - Auto numbering
- [x] **Header/Footer** - Custom header and footer text
- [x] **Watermark** - Transparent watermark overlay
- [x] **Find & Replace** - Search and replace text
- [x] **Auto Page** - Automatically adds new page when text exceeds

### Export & Integration
- [x] **Export PDF** - Button above pages panel
- [x] **Translate (L)** - AI translation (12 languages)
- [x] **Google Drive** - Connect/disconnect (MOCK integration)

### Voice & AI
- [x] **Voice (V)** - ElevenLabs TTS with male/female voice selection
- [x] **ZETA AI** - Document-aware chat assistant (can read document content)

### Shapes
- [x] Triangle (1), Square (2), Circle (3), Star (4), Ring (5)

### New Features (This Session)
- [x] **Fast Select** - 4 favorite tools quick access bar in Editor
- [x] **Shortcuts Panel** - Customize all keyboard shortcuts (Dashboard Settings)
- [x] **Tooltip Fix** - Tool names appear above mouse cursor
- [x] **Vector Selection** - Lasso tool now selects vector drawings
- [x] **ElevenLabs TTS** - Male/Female AI voice options

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Voice: `/api/voice/list`, `/api/voice/tts`
- Drive: `/api/drive/status`, `/api/drive/connect`
- Notes: `/api/notes`

## Bug Fixes This Session
- [x] Tooltip positioning: Now appears above mouse cursor
- [x] Select tool: Can now select vector drawings (improved isVectorInLasso)
- [x] Shortcuts panel: Now functional in Dashboard Settings
- [x] Fast Select: Added to Dashboard and Editor

## Testing History
- iteration_14: Backend 100%, Frontend 100% ✅

## Prioritized Backlog

### P0 (Completed):
- [x] ElevenLabs voice integration
- [x] ZETA document analysis
- [x] Fast Select feature
- [x] Shortcuts panel fix

### P1:
- [ ] Real Google Drive OAuth integration (currently mock)
- [ ] Templates actual content generation

### P2:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling (Word-like)

### P3:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED: Google Drive (mock token), iCloud, Templates content

## 3rd Party Integrations
- **Gemini 3 Flash** — Emergent LLM Key (ZETA chat & Translate)
- **Gemini Nano Banana** — Emergent LLM Key (Image generation)
- **ElevenLabs** — User API Key (TTS with male/female voices)
- **Google Drive** — Mock integration (auth flow scaffolded)
- **Emergent Google Auth** — User login

## Last Updated: 2026-03-07
