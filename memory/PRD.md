# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key

## Code Architecture
```
/app/
├── backend/server.py          # FastAPI: auth, docs, ZETA, translate, image gen
├── frontend/src/
│   ├── components/editor/
│   │   ├── CanvasArea.js      # Canvas: WYSIWYG text, draw, shapes, vectors, mass select, crop, eraser, pen, marking
│   │   ├── DraggablePanel.js  # Floating panel wrapper
│   │   ├── RightPanel.js      # Pages + ZETA (w-72, forceSection for mobile)
│   │   └── Toolbox.js         # Tool grid (w-72), search, tooltips
│   ├── hooks/useCanvasHistory.js  # Undo/redo
│   ├── lib/editorConstants.js     # 26 TOOLS, FONTS, COLORS, etc.
│   └── pages/Editor.js           # State orchestrator + mobile/desktop layouts
```

## All Implemented Features

### Core Editor
- [x] 3-column layout: Toolbox (w-72), Canvas, Pages+ZETA (w-72)
- [x] WYSIWYG text editing (contentEditable)
- [x] Undo/Redo (history + Ctrl+Z/Ctrl+Y shortcuts + header buttons)
- [x] Auto-save every 2 seconds
- [x] Multi-page support with persistent state on page change
- [x] Custom cursors per tool

### 26 Tools
- [x] **Text** - Click canvas to create, Enter for new lines
- [x] **Word Type** - Bold, Italic, Underline, Strikethrough toggles
- [x] **Text Size** - Slider + number input (8-72pt)
- [x] **Font** - 20 fonts with search
- [x] **Line Spacing** - 1.0, 1.15, 1.5, 2.0, 2.5, 3.0
- [x] **Paragraph** - Text alignment (left, center, right, justify) [PENDING]
- [x] **Color Picker** - 18 presets + custom color
- [x] **Hand** - Pan/zoom + drag elements + drag vectors
- [x] **Image** - Upload with context menu (Delete + Change Image)
- [x] **AI Image** - Nano Banana with preview before adding to doc
- [x] **Draw** - Pencil with size/opacity/color
- [x] **Pen** - Vector drawing (click points, auto-close, double-click finish)
- [x] **Eraser** - Removes draw paths (adjustable size)
- [x] **Marking** - Highlighter with color/opacity/size
- [x] **Select** - Rectangle selection (multi-select)
- [x] **Cut** - Delete elements + image crop mode (auto-detect)
- [x] **Translate** - AI translation (12 languages) with preview + apply
- [x] **Graphic** - Bar/Pie/Line charts [PENDING]
- [x] **Page Color** - Canvas background color [PENDING]
- [x] **Add Page**, **Page Size** (5 presets + custom)
- [x] **Voice Reader** - Skip back/forward, clickable/draggable timeline
- [x] **Shapes** - Triangle, Square, Circle, Star (resize + add image + AI image)

### Context Menus
- [x] Images: Three-dot menu → Delete, Change Image (same position)
- [x] Shapes: Three-dot menu → Delete, Add Image, AI Image
- [x] **Vectors: Three-dot menu → Delete, Add Image, AI Image** (YENİ)

### Vector Features (YENİ - 2026-03-06)
- [x] Pen tool ile vektörel çizim oluşturma
- [x] Otomatik yol kapatma (ilk noktaya yakın tıklandığında)
- [x] Hand tool ile vektörel şekillere tıklayınca üç nokta menüsü
- [x] VectorMenu: Add Image, AI Image, Delete seçenekleri
- [x] Hand tool ile vektörel şekilleri sürükleyip hareket ettirme
- [x] Vektörlerin içine resim ekleme (clipPath ile)
- [x] Seçili vektör cyan/teal renk ile vurgulanma

### Mobile UI
- [x] Separate mobile layout (doesn't touch PC version)
- [x] Full-width canvas
- [x] Horizontal scrolling bottom toolbar (42x42px icons, 2px gap)
- [x] Floating action buttons for Pages and ZETA
- [x] Slide-in panels for Pages/ZETA

### AI Integration
- [x] ZETA Chat (Gemini 3 Flash) - multi-lingual assistant
- [x] AI Image (Nano Banana) - preview panel before adding
- [x] AI Image to Shapes/Vectors - generate and add directly
- [x] AI Translation (Gemini 3 Flash) - 12 languages

### Other
- [x] Google Auth, JWT sessions, Dashboard, Quick Notes
- [x] Multi-language UI (EN/TR), Draggable panels, Tooltips

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`

## Testing History
- iteration_7: Backend 22/22, Frontend 25/25 (100%)
- iteration_8: Backend 24/24, Frontend 25/25 (100%)
- iteration_9: Backend 24/24, Frontend 39/39 (100%)
- iteration_10: Backend 24/24, Frontend 20/20 (100%) - Vector features added

## Prioritized Backlog
### P0 (Current):
- [ ] Paragraph Formatting Tool (text alignment)
- [ ] Graphic Tool (bar, pie, line charts)
- [ ] Page Color Tool
- [ ] PDF Export (jspdf, html2canvas installed)
- [ ] Google Drive Integration (playbook received)

### P1:
- [ ] Color picker enhancements (hex code input, gradient text)
- [ ] Vertical multi-page scrolling (Word-like view)

### P2:
- [ ] Google Drive real integration (MOCKED)
- [ ] Subscription/payments
- [ ] Real-time collaboration

### P3:
- [ ] Template library
- [ ] Document previews on dashboard

## MOCKED: Google Drive, iCloud integrations

## Last Updated: 2026-03-06
