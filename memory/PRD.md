# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Shadcn/UI, lucide-react, Chart.js, QRCode
- **Backend:** FastAPI, Python, MongoDB
- **AI:** Gemini 3 Flash (text/translate), Nano Banana (images) via Emergent LLM Key
- **Voice:** ElevenLabs TTS (Male/Female voices) + Browser TTS fallback
- **Export:** jsPDF, html2canvas

## Implemented Features (45+ Tools)

### Text & Formatting
- [x] Text (T), Word Type (B), Text Size, Font (F), Line Spacing
- [x] Paragraph Alignment, Color (C) with Hex + **Gradient Presets**

### Gradient Presets (NEW)
- [x] Sunset, Ocean, Purple, Green, Fire, Night presets
- [x] Custom gradient start/end color pickers
- [x] Live gradient preview

### Navigation & View
- [x] Hand (H), **Zoom (Z) - Otomatik Mouse Takipli Büyüteç**
- [x] Layers, Ruler (R), Grid

### Image & Media
- [x] Image (I), AI Image (W), QR Code (Q)

### Drawing Tools
- [x] Draw (D), Pen (P), Eraser (E) with drag mode
- [x] Marking (M), Select (S) - Lasso with vector support
- [x] Cut (X)

### Data & Charts (ENHANCED)
- [x] **Graphic (G) - Bar, Pie, Line charts**
- [x] **Her sütun için ayrı renk seçimi**
- [x] **Grafiklere Image ve AI Image ekleme**
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

### Voice & AI (ENHANCED)
- [x] Voice (V) - **ElevenLabs TTS entegrasyonu**
- [x] Male/Female voice selection (Rachel, Arnold, Bella, Antoni)
- [x] **ZETA AI - Görsel gönderme desteği**
- [x] **ZETA mesajlarını sesli dinleme (TTS ikonu)**
- [x] Document-aware chat (belge içeriği analizi)

### UI Features
- [x] Fast Select - 4 favori araç hızlı erişim
- [x] Shortcuts Panel - Klavye kısayolları özelleştirme
- [x] Tooltip - Fare imleci üzerinde araç isimleri

### Shapes
- [x] Triangle, Square, Circle, Star, Ring

## Features Added This Session
1. ✅ **Grafik Sütun Renkleri** - Her sütun için ayrı renk picker
2. ✅ **Grafik Background Image** - Image ve AI Image butonları
3. ✅ **Gradient Presets** - 6 preset (Sunset, Ocean, Purple, Green, Fire, Night)
4. ✅ **ZETA Görsel Gönderme** - Chat'e resim yükleyebilme
5. ✅ **ZETA TTS** - Mesajları sesli dinleme (Volume2 ikonu)
6. ✅ **Zoom Aracı** - Otomatik mouse takipli büyüteç (tıklama gerekmez)

## Key API Endpoints
- Auth: `/api/auth/session`, `/api/auth/me`
- Docs: `/api/documents`, `/api/documents/{id}`
- AI: `/api/zeta/chat`, `/api/zeta/generate-image`, `/api/zeta/translate`
- Voice: `/api/voice/list`, `/api/voice/tts`
- Drive: `/api/drive/status`, `/api/drive/connect`

## Testing History
- iteration_14: 100% ✅
- iteration_15: 100% ✅ (New features verified)

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
| Service | Status | Key Type |
|---------|--------|----------|
| Gemini 3 Flash | ✅ Active | Emergent LLM Key |
| Nano Banana | ✅ Active | Emergent LLM Key |
| ElevenLabs TTS | ✅ Active | User API Key |
| Google Drive | ⚠️ Mock | - |

## Credentials
- EMERGENT_LLM_KEY: sk-emergent-cEf51D588B566Dd619
- ELEVENLABS_API_KEY: sk_b80b7069181bc622e693fad24860d0a0b3d485bb99365123

## Last Updated: 2026-03-07
