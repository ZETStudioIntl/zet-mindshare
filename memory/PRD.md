# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (ZETA + Judge), Nano Banana (images) via Emergent LLM Key
- **Voice:** ElevenLabs TTS + Web Speech API (STT)
- **Auth:** Google OAuth + Email/Password
- **Export:** jsPDF, html2canvas

## THIS SESSION ADDITIONS (2026-03-08)

### New Features
- [x] **ZET Judge Mini** - İş analizi AI asistanı (#c8005a/#4b0c37 renk teması)
- [x] **Subscription Carousel** - Yana kaydırmalı, aylık/yıllık, büyükten küçüğe (Ultra→Pro→Plus)
- [x] **Mirror Tool Fix** - scaleX/scaleY CSS transform
- [x] **Eraser Drag Fix** - Kırmızı trail + element silme
- [x] **Zoom Tool Fix** - Daha küçük default değerler

### ZET Judge Mini Özellikleri
- İş analizi ve strateji odaklı
- Dobra, dürüst, acı ama kırıcı değil
- Başarı puanı (1-100) ve Risk puanı (1-100) veriyor
- Görsel kabul ediyor
- ZET Studio International asistanı olarak tanıtıyor

### Subscription Paketleri
| Plan | Aylık | Yıllık | Özellikler |
|------|-------|--------|------------|
| Ultra | $39.99 | $399.99 | Unlimited Storage, AI, API Access, Team, White Label, Judge Pro |
| Pro | $19.99 | $199.99 | 25GB, 200 AI/mo, All Templates, Custom Fonts, Judge Mini |
| Plus | $9.99 | $99.99 | 5GB, 50 AI/mo, Basic Templates |

## Implemented Tools (60+)
- Text, Font (51), Color, Gradient, Hand, Zoom, Layers, Ruler, Grid
- Image, AI Image, QR Code, Draw, Pen, Eraser, Marking, Select
- Chart (Bar/Pie/Line), Table, Templates, Export (PDF/PNG/JPEG/SVG/JSON)
- Copy, Mirror, Voice Input (STT), Voice Output (TTS)
- Page Color/Size, Page Numbers, Header/Footer, Watermark
- Shapes: Triangle, Square, Circle, Star, Ring

## AI Assistants
1. **ZETA** - Genel asistan, belge yardımı
2. **ZET Judge Mini** - İş analizi, strateji, vizyon

## Key API Endpoints
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/session`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/judge/chat`, `/api/zeta/generate-image`
- Voice: `/api/voice/tts`
- Drive: `/api/drive/connect`, `/api/drive/callback`

## Testing History
- iteration_20: Frontend %95 ✅

## API Key Alma Rehberi

### 1. Google Drive API
**Adımlar:**
1. [Google Cloud Console](https://console.cloud.google.com) → New Project
2. APIs & Services → Enable APIs → "Google Drive API" enable
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client IDs
4. Uygulama türü seç:
   - **iOS:** iOS seç, Bundle ID gir
   - **Android:** Android seç, Package name + SHA-1 gir
   - **Web:** Web application seç, Authorized redirect URIs gir
5. OAuth consent screen → Test users ekle
6. credentials.json dosyasını indir

### 2. ElevenLabs TTS API
**Adımlar:**
1. [ElevenLabs](https://elevenlabs.io) hesabı oluştur
2. Profile → API Keys → Create API Key
3. Key'i kopyala ve backend/.env'e ekle:
   ```
   ELEVENLABS_API_KEY=your_key_here
   ```

### 3. Stripe (Ödeme Entegrasyonu - Gelecek)
**Adımlar:**
1. [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API Keys
2. Publishable key ve Secret key al
3. Webhook endpoint oluştur
4. backend/.env'e ekle:
   ```
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

## MOCKED APIs
- Google Drive file operations (credentials.json bekleniyor)

## Known Issues
- ElevenLabs TTS: Kullanıcı API anahtarı rate-limited

## Last Updated: 2026-03-08
