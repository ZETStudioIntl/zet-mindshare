# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Voice:** ElevenLabs TTS + Web Speech API (STT)
- **Auth:** Google OAuth + Email/Password
- **Export:** jsPDF, html2canvas

## Implemented Features (60+ Tools)

### THIS SESSION ADDITIONS
- [x] **Templates** - CV, Report, Letter, Invoice, Presentation (çalışan içerikler)
- [x] **51 Fonts** - Arial'dan Raleway'e kadar (Sans-Serif, Serif, Monospace, Display)
- [x] **Fast Select Header** - İleri/geri butonlarının yanında
- [x] **Ruler** - Yatay ve dikey cetvel (50px aralıklarla)
- [x] **Grid** - SVG pattern ile grid çizgileri

### Core Tools
- [x] Copy Tool (Ctrl+C/V), Mirror Tool (rotation), Voice Input (STT)
- [x] Text, Word Type, Text Size, Font, Line Spacing, Paragraph, Color
- [x] Gradient Presets (6 preset), Gradient for Text & Shapes
- [x] Hand, Zoom (auto magnifier), Layers, Ruler, Grid
- [x] Image, AI Image, QR Code
- [x] Draw, Pen, Eraser (drag mode), Marking, Select (lasso), Cut
- [x] Graphic (Bar/Pie/Line), Table
- [x] Templates, Page Color, Page Size, Add Page, Page Numbers
- [x] Header/Footer, Watermark, Find & Replace, Auto Page
- [x] Export PDF, Translate (12 languages)

### Voice & AI
- [x] Voice TTS (ElevenLabs)
- [x] Voice Input STT (Web Speech API)
- [x] ZETA AI (tüm belge içeriğini görüyor)

### Auth
- [x] Google OAuth
- [x] Email/Password

### Shapes
- [x] Triangle, Square, Circle, Star, Ring (all with gradient)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/register`, `/api/auth/login`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Voice: `/api/voice/list`, `/api/voice/tts`

## Testing History
- iteration_14-17: 100% ✅
- iteration_18: 100% ✅ (Templates, Fonts, Fast Select, Ruler, Grid)

## Prioritized Backlog

### P1:
- [ ] Google Drive gerçek OAuth entegrasyonu

### P2:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling

### P3:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED
- Google Drive (mock token, file operations)
- iCloud

## 3rd Party Integrations
| Service | Status |
|---------|--------|
| Gemini 3 Flash | ✅ Active |
| Nano Banana | ✅ Active |
| ElevenLabs TTS | ⚠️ Rate Limited |
| Web Speech API | ✅ Active |
| Google OAuth | ✅ Active |
| Email Auth | ✅ Active |

## Last Updated: 2026-03-07
