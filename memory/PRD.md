# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Export:** jsPDF, html2canvas

## Code Architecture
```
/app/
├── backend/server.py          # FastAPI: auth, docs, ZETA, translate, image gen
├── frontend/src/
│   ├── components/editor/
│   │   ├── CanvasArea.js      # Canvas: WYSIWYG, zoom wheel, vectors, shapes
│   │   ├── DraggablePanel.js  # Floating panel wrapper
│   │   ├── RightPanel.js      # Pages + ZETA
│   │   └── Toolbox.js         # Tool grid with search
│   ├── hooks/useCanvasHistory.js  # Undo/redo
│   ├── lib/editorConstants.js     # 29 TOOLS, FONTS, COLORS, SHORTCUTS
│   └── pages/Editor.js           # State + panels + keyboard handling
```

## All Implemented Features

### Core Editor
- [x] 3-column layout: Toolbox (w-72), Canvas, Pages+ZETA (w-72)
- [x] WYSIWYG text editing (contentEditable)
- [x] Undo/Redo (history + Ctrl+Z/Ctrl+Y)
- [x] Auto-save every 2 seconds
- [x] Multi-page support
- [x] Custom cursors per tool

### 29 Tools (Updated 2026-03-06)
- [x] **Text (T)** - Click canvas to create text
- [x] **Word Type (B)** - Bold, Italic, Underline, Strikethrough
- [x] **Text Size** - Slider 8-72pt
- [x] **Font (F)** - 20 fonts with search
- [x] **Line Spacing** - 1.0 to 3.0x
- [x] **Paragraph (A)** - Text alignment (left, center, right, justify) ✨ NEW
- [x] **Color (C)** - 18 presets + hex code input + gradient text ✨ UPDATED
- [x] **Hand (H)** - Pan/zoom + drag elements + drag vectors
- [x] **Zoom (Z)** - Magnifier tool with level & lens size ✨ NEW
- [x] **Image (I)** - Upload with context menu
- [x] **AI Image (W)** - Nano Banana with preview
- [x] **Draw (D)** - Freehand with size/opacity/color
- [x] **Pen (P)** - Vector drawing (auto-close, double-click finish)
- [x] **Eraser (E)** - Remove draw paths
- [x] **Marking (M)** - Highlighter
- [x] **Select (S)** - Rectangle multi-select
- [x] **Cut (X)** - Delete + image crop
- [x] **Translate (L)** - AI translation (12 languages)
- [x] **Graphic (G)** - Bar/Pie/Line charts with Chart.js ✨ NEW
- [x] **Page Color** - Canvas background color ✨ NEW
- [x] **Export** - PDF export with jsPDF ✨ NEW
- [x] **Add Page (N)**, **Page Size**, **Voice (V)**
- [x] **Shapes (1,2,3,4)** - Triangle, Square, Circle, Star

### Keyboard Shortcuts ✨ NEW
- [x] Header keyboard icon opens Shortcuts panel
- [x] All tools listed with customizable key assignments
- [x] Shortcuts saved to localStorage
- [x] Delete/Backspace: Delete selected element
- [x] Escape: Deselect all

### Color Picker Enhancements ✨ NEW
- [x] Hex code input with Apply button
- [x] Gradient text (Start/End color pickers)
- [x] Apply Gradient button for selected text

### Zoom Tool ✨ NEW
- [x] Zoom Level slider (1.5x - 5x)
- [x] Lens Size slider (50-200px)
- [x] Scroll wheel zooms towards cursor position
- [x] Canvas zoom In/Out buttons

### Export ✨ NEW
- [x] PDF export using jsPDF + html2canvas
- [x] Current page exported as high-quality PDF

### Graphic/Chart Tool ✨ NEW
- [x] Bar, Pie, Line chart types
- [x] Chart title, labels, values input
- [x] Chart.js rendering to canvas image
- [x] Chart added as resizable image element

### Vector Features
- [x] Pen tool auto-closes near first point
- [x] Hand tool selects and drags vectors
- [x] Vector menu: Add Image, AI Image, Delete
- [x] Images inside vectors via clipPath

### Mobile UI
- [x] Separate mobile layout
- [x] 42x42px icons, 2px gap toolbar
- [x] Floating action buttons for Pages/ZETA

### AI Integration
- [x] ZETA Chat (Gemini 3 Flash) - knows ALL features
- [x] AI Image (Nano Banana) with preview
- [x] AI Translation (12 languages)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Cloud: `/api/cloud/google-drive/*` (MOCKED)

## Testing History
- iteration_10: Backend 24/24, Frontend 20/20 (100%)
- iteration_11: Backend 24/24, Frontend 24/24 (100%) ✨ NEW

## Prioritized Backlog

### P1 (Next):
- [ ] Google Drive actual integration (playbook received)
- [ ] Real magnifier lens overlay when zoom tool active

### P2:
- [ ] Vertical multi-page scrolling (Word-like)
- [ ] Document preview thumbnails on dashboard

### P3:
- [ ] Real-time collaboration
- [ ] Template library
- [ ] In-app purchases

## MOCKED: Google Drive, iCloud integrations

## Last Updated: 2026-03-06
