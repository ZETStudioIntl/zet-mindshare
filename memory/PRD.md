# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-14 Iteration 32

### Iteration 32 (Completed) - SP ile Plan Satın Alma + Minimap Silme + PLAN_LIMITS Doğrulama

**Değişiklikler:**
1. **SP ile Paket Satın Alma:** Abonelik planları artık SP ile de satın alınabiliyor.
   - Plus: 10,000 SP
   - Pro: 30,000 SP
   - Ultra: 50,000 SP
   - Backend endpoint: `POST /api/subscription/buy-with-sp`
   - Edge-case kontrolleri: yetersiz SP, aynı/üst plan kontrolü, geçersiz plan
2. **Minimap Silindi:** Görev Haritası'ndaki sağ alt köşedeki minimap tamamen kaldırıldı.
3. **PLAN_LIMITS Doğrulandı:**
   - Free: 20 kredi/gün, Judge kapalı
   - Plus: 100 kredi/gün, Judge Mini açık, derin analiz kapalı
   - Pro: 250 kredi/gün, tüm araçlar, Nano Pro
   - Ultra: 1000 kredi/gün, herşey sınırsız

**Test:** Backend 100% (13/13), Frontend 100%

### Iteration 31 (Completed) - Görev Haritası v2: Örümcek Ağı/Labirent
- Kategoriler kaldırıldı, 500 görev altın açı spiral düzeninde
- XP -> SP (Sadakat Puanı): circle=20SP, square=45SP, triangle=100SP, star=200SP
- 2234 bağlantı ile yoğun örümcek ağı yapısı
- Test: Backend 100% (11/11), Frontend 100%

### Iteration 30 (Replaced) - Görev Haritası v1
- Kategorilere ayrılmış 500 görev haritası (kullanıcı tarafından reddedildi)

### Iteration 29 (Completed) - Kredi Sistemi
- Nano Banana: 20 kredi, Pro: 50 kredi
- Fotoğraf düzeltme: 15/40 kredi, Judge: 25/70 kredi

### Earlier Iterations (Completed)
- Chart Tool, gradient şekiller, DraggablePanel, PDF içe aktarma, Highlighter
- Templates: 20 şablon, Redact AI, Profil fotoğrafı yükleme

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED - requires OAuth credentials)
- Browser notifications (partial)
- Made by Emergent watermark info

## Pending Tasks
1. **P3:** Tarayıcı bildirimleri
2. **P3:** ElevenLabs TTS (API anahtarı bekleniyor)
3. **P3:** Emergent watermark bilgisi

## Future Tasks
- Gerçek zamanlı ortak çalışma
- Dikey çoklu sayfa kaydırma
- iCloud entegrasyonu
- Dashboard'da belge içeriği önizlemeleri

## Refactoring
- server.py: Router'lara bölünmesi gerekiyor
- Editor.js: Custom hook'lara ayrılması gerekiyor

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, pdfjs-dist, HTML5 Canvas
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth

## Last Updated: 2026-03-14
