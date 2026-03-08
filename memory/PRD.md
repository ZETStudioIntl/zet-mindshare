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
- [x] **Subscription Modal** - 3 paket: Plus ($9.99), Pro ($19.99), Ultra ($39.99)
- [x] **Mirror Tool Fix** - scaleX/scaleY CSS transform ile yatay çevirme
- [x] **Eraser Drag Fix** - Kırmızı trail gösterimi + canvas elements silme
- [x] **Zoom Tool Fix** - Daha küçük default değerler (1.2x-4x zoom, 30-120px radius)
- [x] **Çeviri Güncellemesi** - Subscription modal için TR/EN çevirileri
- [x] **Query Import Fix** - Google Drive callback endpoint düzeltildi

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
- iteration_19: 94% backend, 100% frontend ✅
- iteration_20: Frontend only - 95% ✅ (all features working, minor translation fix applied)

## Prioritized Backlog

### P0 - Critical (Need User Action):
- [ ] Google Drive Integration - Kullanıcının credentials gerekli (aşağıya bakın)

### P1 - High Priority:
- [ ] Template içerikleri oluşturma

### P2 - Medium Priority:
- [ ] Real-time collaboration
- [ ] Vertical multi-page scrolling

### P3 - Future:
- [ ] In-app purchases
- [ ] iCloud integration

## Google Drive Key Seçimi (App Store / Play Store / Microsoft Store için)

Uygulama 3 platformda yayınlanacağı için **3 farklı OAuth credential** oluşturmanız gerekecek:

| Platform | Credential Türü | Gerekli Bilgiler |
|----------|----------------|------------------|
| **iOS** | "iOS" | Bundle ID (örn: com.zetstudio.mindshare) |
| **Android** | "Android" | Package name + SHA-1 fingerprint |
| **Web/PWA/Desktop** | "Web application" | Authorized redirect URIs |

### Adımlar:
1. Google Cloud Console > APIs & Services > Credentials
2. "Create Credentials" > "OAuth 2.0 Client IDs"
3. Her platform için ayrı credential oluşturun
4. credentials.json dosyasını bana gönderin

## MOCKED APIs
- Google Drive file operations (credentials bekleniyor)

## 3rd Party Integrations
| Service | Status |
|---------|--------|
| Gemini 3 Flash | ✅ Active |
| Nano Banana | ✅ Active |
| ElevenLabs TTS | ⚠️ Rate Limited |
| Web Speech API | ✅ Active |
| Google OAuth | ✅ Active |
| Email Auth | ✅ Active |

## Last Updated: 2026-03-08
