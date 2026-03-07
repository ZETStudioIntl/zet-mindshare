# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Export:** jsPDF, html2canvas

## All Implemented Features (38 Tools)

### Text & Formatting
- [x] **Text (T)** - WYSIWYG text editing
- [x] **Word Type (B)** - Bold, Italic, Underline, Strikethrough
- [x] **Text Size** - Slider 8-72pt
- [x] **Font (F)** - 20 fonts with search
- [x] **Line Spacing** - 1.0 to 3.0x
- [x] **Paragraph (A)** - Alignment (left, center, right, justify)
- [x] **Color (C)** - 18 presets + hex code + gradient text

### Navigation & View
- [x] **Hand (H)** - Pan/zoom + drag elements + drag vectors
- [x] **Zoom (Z)** - Magnifier with zoom level & lens size
- [x] **Layers** - Reorder, hide/show, lock/unlock elements
- [x] **Ruler (R)** - Toggle rulers for alignment
- [x] **Grid** - Toggle grid, set size, snap-to-grid

### Image & Media
- [x] **Image (I)** - Upload with context menu
- [x] **AI Image (W)** - Nano Banana with preview
- [x] **QR Code (Q)** - Generate QR from text/URL

### Drawing Tools
- [x] **Draw (D)** - Freehand with size/opacity/color
- [x] **Pen (P)** - Vector drawing (auto-close, double-click finish)
- [x] **Eraser (E)** - Remove draw paths
- [x] **Marking (M)** - Highlighter
- [x] **Select (S)** - Lasso selection (free-form, selects vectors too)
- [x] **Cut (X)** - Delete + image crop

### Data & Charts
- [x] **Graphic (G)** - Bar, Pie, Line charts with Chart.js
- [x] **Table** - Create tables with custom rows/columns

### Document
- [x] **Templates** - CV, Report, Letter, Invoice, Presentation
- [x] **Page Color** - Canvas background color
- [x] **Page Size** - A4, A5, Letter, Legal, Square, custom
- [x] **Add Page (N)** - Add new pages
- [x] **Page Numbers** - Auto numbering (top/bottom, left/center/right)
- [x] **Header/Footer** - Custom header and footer text
- [x] **Watermark** - Transparent watermark overlay
- [x] **Find & Replace** - Search and replace text

### Export & Integration
- [x] **Export PDF** - Button above pages panel (jsPDF + html2canvas)
- [x] **Translate (L)** - AI translation (12 languages)

### Voice & Shapes
- [x] **Voice (V)** - AI reads document aloud
- [x] **Shapes (1,2,3,4)** - Triangle, Square, Circle, Star with image/AI image fill

### Stats
- [x] **Word Count** - Displays "X words" (not characters)

### Keyboard
- [x] **Shortcuts Panel** - Customize all tool shortcuts
- [x] **Delete/Backspace** - Delete selected element
- [x] **Escape** - Deselect all
- [x] **Ctrl+Z/Y** - Undo/Redo

### Mobile UI
- [x] Separate mobile layout
- [x] 42x42px icons, 2px gap toolbar
- [x] Floating action buttons for Pages/ZETA

### AI Integration
- [x] ZETA Chat (Gemini 3 Flash) - knows ALL 38 tools
- [x] AI Image (Nano Banana) with preview
- [x] AI Translation (12 languages)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Notes: `/api/notes`

## Bug Fixes This Session
- [x] Dashboard quick notes text overflow (break-words, whitespace-pre-wrap)
- [x] Export button moved from toolbox to above pages panel
- [x] Character count changed to word count

## Testing History
- iteration_11: Backend 24/24, Frontend 24/24 (100%)
- iteration_12: Backend 24/24, Frontend 16/16 (100%) ✨

## Prioritized Backlog

### P1:
- [ ] Google Drive real integration
- [ ] Templates actual content (currently UI only)
- [ ] Real magnifier canvas clone effect

### P2:
- [ ] Vertical multi-page scrolling
- [ ] Real-time collaboration

### P3:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED: Google Drive, iCloud, Templates content

## Last Updated: 2026-03-07
