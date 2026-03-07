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

## Implemented Features (55+ Tools)

### NEW TOOLS (This Session)
- [x] **Copy Tool** - Ctrl+C/V kısayolları, üç nokta menüsünde
- [x] **Mirror Tool** - Yatay/dikey ayna, rotation slider, preset butonları
- [x] **Voice Input (STT)** - Web Speech API ile sesden metne
- [x] **Email Auth** - Email/password ile kayıt ve giriş

### Text & Formatting
- [x] Text (T), Word Type (B), Text Size, Font (F), Line Spacing
- [x] Paragraph Alignment, Color (C) with Hex
- [x] Gradient Presets (Sunset, Ocean, Purple, Green, Fire, Night)
- [x] Gradient for Text AND Shapes

### Navigation & View
- [x] Hand (H), Zoom (Z) - Otomatik Mouse Takipli Büyüteç
- [x] Layers, Ruler (R), Grid

### Image & Media
- [x] Image (I), AI Image (W), QR Code (Q)

### Drawing Tools
- [x] Draw (D), Pen (P), Eraser (E) with drag mode
- [x] Marking (M), Select (S) - Lasso with vector support
- [x] Cut (X)

### Data & Charts
- [x] Graphic (G) - Bar, Pie, Line charts
- [x] Her sütun için ayrı renk seçimi
- [x] Grafiklere Image ve AI Image ekleme
- [x] Table with custom rows/columns

### Document Features
- [x] Templates, Page Color, Page Size
- [x] Add Page (N), Page Numbers
- [x] Header/Footer, Watermark
- [x] Find & Replace, Auto Page

### Export & Integration
- [x] Export PDF
- [x] Translate (L) - 12 languages
- [x] Google Drive (MOCK)

### Voice & AI
- [x] Voice (V) - ElevenLabs TTS
- [x] Voice Input (STT) - Web Speech API
- [x] ZETA AI - Tüm belge içeriğini görüyor (text, shape, image, chart, table, vector)
- [x] ZETA görsel gönderme + mesaj sesli dinleme

### UI/UX Features
- [x] Fast Select - Sayfanın üstünde 4 favori araç
- [x] Shortcuts/Fast Select arama barları
- [x] Akıcı panel sürükleme
- [x] Mobilde shortcuts gizli
- [x] Tooltip - Fare imleci üzerinde

### Auth
- [x] Google OAuth
- [x] Email/Password login & register

### Shapes (All with Gradient Support)
- [x] Triangle, Square, Circle, Star, Ring

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`, `/api/auth/register`, `/api/auth/login`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Voice: `/api/voice/list`, `/api/voice/tts`

## Testing History
- iteration_14: 100% ✅
- iteration_15: 100% ✅
- iteration_16: 100% ✅
- iteration_17: 100% ✅ (Bug fixed: language variable in Voice Input)

## Prioritized Backlog

### P1 (Next):
- [ ] Google Drive gerçek OAuth entegrasyonu
- [ ] Templates içerik oluşturma

### P2:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling

### P3:
- [ ] In-app purchases
- [ ] iCloud integration

## MOCKED
- Google Drive (mock token, file operations)
- iCloud
- Templates content

## 3rd Party Integrations
| Service | Status | Note |
|---------|--------|------|
| Gemini 3 Flash | ✅ Active | Emergent LLM Key |
| Nano Banana | ✅ Active | Emergent LLM Key |
| ElevenLabs TTS | ⚠️ Rate Limited | Needs paid plan |
| Web Speech API | ✅ Active | Browser STT |
| Google OAuth | ✅ Active | Via Emergent |
| Email Auth | ✅ Active | Custom JWT |

## Last Updated: 2026-03-07
