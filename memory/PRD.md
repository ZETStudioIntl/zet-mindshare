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

### THIS SESSION ADDITIONS (2026-03-08)
- [x] **Subscription Button** - Ayarlar menüsüne abonelik butonu eklendi
- [x] **Query Import Fix** - Google Drive callback endpoint düzeltildi
- [x] **Duplicate Variable Fix** - showExport duplicate tanımlaması düzeltildi

### Core Tools
- [x] Copy Tool (Ctrl+C/V), Mirror Tool (rotation), Voice Input (STT)
- [x] Text, Word Type, Text Size, Font (51 fonts), Line Spacing, Paragraph, Color
- [x] Gradient Presets (6 preset), Gradient for Text & Shapes
- [x] Hand, Zoom (auto magnifier), Layers, Ruler, Grid
- [x] Image, AI Image, QR Code
- [x] Draw, Pen, Eraser (drag mode), Marking, Select (lasso), Cut
- [x] Graphic (Bar/Pie/Line charts - SVG based), Table
- [x] Templates (CV, Report, Letter, Invoice, Presentation)
- [x] Page Color, Page Size, Add Page, Page Numbers
- [x] Header/Footer, Watermark, Find & Replace, Auto Page
- [x] Export PDF/PNG/JPEG/SVG/JSON, Translate (12 languages)

### Voice & AI
- [x] Voice TTS (ElevenLabs)
- [x] Voice Input STT (Web Speech API)
- [x] ZETA AI (tüm belge içeriğini görüyor, görsel kabul ediyor)

### Auth
- [x] Google OAuth
- [x] Email/Password

### Shapes
- [x] Triangle, Square, Circle, Star, Ring (all with gradient support)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/register`, `/api/auth/login`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Voice: `/api/voice/list`, `/api/voice/tts`
- Drive: `/api/drive/status`, `/api/drive/connect`, `/api/drive/callback`

## Testing History
- iteration_14-18: 100% ✅
- iteration_19: 94% backend (LLM budget external issue), 100% frontend ✅

## Prioritized Backlog

### P0 - Critical (Need User Action):
- [ ] Google Drive Integration - Kullanıcının `credentials.json` dosyası gerekli

### P1 - High Priority:
- [ ] Gradient Rendering - Şekillerde gradient uygulaması iyileştirilebilir
- [ ] Vector Selection - Lasso aracının vektör seçimi iyileştirilebilir

### P2 - Medium Priority:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling

### P3 - Future:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED APIs
- Google Drive file operations (credentials.json bekleniyor)

## 3rd Party Integrations
| Service | Status |
|---------|--------|
| Gemini 3 Flash | ✅ Active |
| Nano Banana | ✅ Active |
| ElevenLabs TTS | ⚠️ Rate Limited (kullanıcı API key sorunu) |
| Web Speech API | ✅ Active |
| Google OAuth | ✅ Active |
| Email Auth | ✅ Active |

## Known Issues
1. **"Made by Emergent" Watermark:** Ücretli planlarda görünmemeli. Kullanıcı deploy ettikten sonra sorun devam ederse Emergent support ile iletişime geçmeli.
2. **ElevenLabs TTS:** Kullanıcının API anahtarı rate-limited. Yeni anahtar gerekli.

## Last Updated: 2026-03-08
