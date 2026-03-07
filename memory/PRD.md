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
- **Voice:** ElevenLabs TTS (needs paid plan) + Browser TTS fallback
- **Export:** jsPDF, html2canvas

## Implemented Features (50+ Tools)

### Text & Formatting
- [x] Text (T), Word Type (B), Text Size, Font (F), Line Spacing
- [x] Paragraph Alignment, Color (C) with Hex
- [x] **Gradient Presets** - Sunset, Ocean, Purple, Green, Fire, Night
- [x] **Gradient support for Text AND Shapes**

### Navigation & View
- [x] Hand (H), **Zoom (Z) - Otomatik Mouse Takipli Büyüteç**
- [x] Layers, Ruler (R), Grid

### Image & Media
- [x] Image (I), AI Image (W), QR Code (Q)

### Drawing Tools
- [x] Draw (D), Pen (P), Eraser (E) with drag mode
- [x] Marking (M), Select (S) - Lasso with vector support
- [x] Cut (X)

### Data & Charts
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

### Voice & AI
- [x] Voice (V) - ElevenLabs TTS (rate limited)
- [x] **ZETA AI - ZET Studio International Asistanı**
- [x] **ZETA'ya görsel gönderme**
- [x] **ZETA mesajlarını sesli dinleme (TTS ikonu)**

### UI/UX Features
- [x] **Fast Select - Sayfanın ÜSTÜNDE 4 favori araç**
- [x] **Shortcuts/Fast Select arama barları**
- [x] **Akıcı panel sürükleme (requestAnimationFrame)**
- [x] **Mobilde shortcuts gizli**
- [x] Tooltip - Fare imleci üzerinde araç isimleri

### Shapes (All with Gradient Support)
- [x] Triangle, Square, Circle, Star, Ring

## Features Added This Session
1. ✅ **Fast Select üste taşındı** - top-16 pozisyonunda
2. ✅ **Panel sürükleme optimizasyonu** - transform3d + requestAnimationFrame
3. ✅ **Arama barları** - Shortcuts ve Fast Select modallarında
4. ✅ **ZETA tanıtımı** - ZET Studio International, CEO: Bahaddin Yılmaz
5. ✅ **Mobil optimizasyonu** - Shortcuts butonu gizlendi
6. ✅ **Gradient şekillerde çalışıyor** - Square, Circle, Triangle, Ring, Star

## Known Issues
- **ElevenLabs TTS:** API key "unusual activity" nedeniyle bloke edildi (rate limit). Paid plan gerekli.

## Testing History
- iteration_14: 100% ✅
- iteration_15: 100% ✅
- iteration_16: Frontend 100%, Backend 95% (ElevenLabs rate limit) ✅

## Prioritized Backlog

### P0 (Urgent):
- [ ] ElevenLabs paid plan API key ile TTS düzeltme

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
| Google Drive | ⚠️ Mock | Auth only |

## Credentials
- EMERGENT_LLM_KEY: sk-emergent-cEf51D588B566Dd619
- ELEVENLABS_API_KEY: sk_79e0efd90edf708afb01941b88ed9e67ee0c91b8594def2d (rate limited)

## Last Updated: 2026-03-07
