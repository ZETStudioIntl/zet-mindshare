# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Export:** jsPDF, html2canvas

## All Implemented Features (40 Tools)

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
- [x] **Graphic (G)** - Bar, Pie, Line charts with Chart.js
- [x] **Table** - Create tables with custom rows/columns

### Document
- [x] **Templates** - CV, Report, Letter, Invoice, Presentation
- [x] **Page Color** - Canvas background color
- [x] **Page Size** - A4, A5, Letter, Legal, Square, custom
- [x] **Add Page (N)** - Add new pages
- [x] **Page Numbers** - Auto numbering (top/bottom, left/center/right)
- [x] **Header/Footer** - Custom header and footer text (renders on canvas)
- [x] **Watermark** - Transparent watermark overlay (renders on canvas)
- [x] **Find & Replace** - Search and replace text
- [x] **Auto Page** - Automatically adds new page when text exceeds page height

### Export & Integration
- [x] **Export PDF** - Button above pages panel (jsPDF + html2canvas)
- [x] **Translate (L)** - AI translation (12 languages)
- [x] **Google Drive** - Connect/disconnect (MOCK integration)

### Voice & Shapes
- [x] **Voice (V)** - AI reads document aloud
- [x] **Shapes** - Triangle (1), Square (2), Circle (3), Star (4), **Ring (5)** ✨
- [x] **Ring** - Hollow circle (border only, no fill)

### Stats
- [x] **Word Count** - Displays "X words" (not characters)

### Keyboard
- [x] **Shortcuts Panel** - Customize all tool shortcuts (in Dashboard Settings)
- [x] **Delete/Backspace** - Delete selected element
- [x] **Escape** - Deselect all
- [x] **Ctrl+Z/Y** - Undo/Redo

### Dashboard
- [x] **"ZET Mindshare"** title (not "ZET Notes")
- [x] **Settings** - Language, Google Drive, Shortcuts
- [x] **Quick Notes** - Text overflow fixed (break-words)

### Mobile UI
- [x] Separate mobile layout
- [x] 42x42px icons, 2px gap toolbar
- [x] Floating action buttons for Pages/ZETA

### AI Integration
- [x] ZETA Chat (Gemini 3 Flash) - knows ALL 40 tools
- [x] AI Image (Nano Banana) with preview
- [x] AI Translation (12 languages)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Drive: `/api/drive/status`, `/api/drive/connect`, `/api/drive/upload`
- Notes: `/api/notes`

## Bug Fixes This Session
- [x] Dashboard title: "ZET Mindshare" (was "ZET Notes")
- [x] Layers panel: Added delete button (trash icon)
- [x] Layers visibility: Hidden elements not rendered on canvas
- [x] Eraser: Added drag mode toggle
- [x] Header/Footer/Watermark: Now render on canvas
- [x] Table: Now renders as image on canvas
- [x] Ring tool: Hollow circle (içi boş daire)
- [x] Shortcuts: Moved to Dashboard Settings

## Testing History
- iteration_12: Backend 24/24, Frontend 16/16 (100%)
- iteration_13: Backend 100%, Frontend 100% ✨

## Prioritized Backlog

### P1:
- [ ] Real Google Drive OAuth integration (currently mock)
- [ ] Templates actual content generation

### P2:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling

### P3:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED: Google Drive (mock token), iCloud, Templates content

## Last Updated: 2026-03-07
