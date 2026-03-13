# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-13 Iterations 31

### Iteration 31 (Completed) - Görev Haritası v2: Örümcek Ağı/Labirent
**Görev Haritası tamamen yeniden tasarlandı:**

**Değişiklikler:**
- Kategoriler kaldırıldı, tüm 500 görev tek bir ekranda
- Hex-grid düzeni yerine altın açı (golden angle) spiral düzeni
- XP sistemi SP'ye (Sadakat Puanı) dönüştürüldü
- 2234 bağlantı ile yoğun örümcek ağı yapısı
- Kolay görevler merkezde, zor görevler kenarlarda
- Uzun menzilli kavisli bağlantılar labirent hissi yaratıyor
- SP Değerleri: circle=20SP, square=45SP, triangle=100SP, star=200SP

**Teknik Detaylar:**
- Spiral layout: Golden angle (137.508°) tabanlı yerleşim
- 6 katmanlı bağlantı sistemi: yakın komşular, spiral dizisi, radyal ışınlar, eşmerkezli halkalar, uzun menzilli çaprazlar, merkez hub
- Spatial index (cell-based) ile performanslı komşu arama
- Kavisli çizgiler (quadraticCurveTo) uzun bağlantılarda
- Animasyonlu merkez hub bağlantıları

**Test:** Backend 100% (11/11), Frontend 100%

## SESSION - 2026-03-13 Iterations 30

### Iteration 30 (Completed then Replaced) - Görev Haritası v1
- 500 görevlik kategorilere ayrılmış harita oluşturuldu
- Kullanıcı tarafından reddedildi ve v2 ile değiştirildi

### Iteration 29 (Completed) - Kredi Sistemi
**Kredi Maliyetleri:**
- Nano Banana görsel: 20 kredi, Pro: 50 kredi
- Fotoğraf düzeltme: 15 kredi, Pro: 40 kredi
- ZET Judge temel analiz: 25 kredi, derin: 70 kredi

**Paketler:**
- **Free:** 20 kredi/gün, Judge kapalı, 3 fastselect, ZETA 250 harf
- **Plus:** 100 kredi/gün, Judge Mini 150 harf, Layers açık, ZETA 500 harf
- **Pro:** 250 kredi/gün, Tüm araçlar, Nano Pro, ZETA sınırsız, Judge 600 harf
- **Ultra:** 1000 kredi/gün, Herşey sınırsız

### Earlier Iterations (Completed)
- Chart Tool, gradient şekiller, DraggablePanel, PDF içe aktarma, Highlighter
- Templates: 20 şablon
- Redact AI, Rütbe & Görevler, Profil fotoğrafı yükleme

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED - requires OAuth credentials)
- Browser notifications (partial - works when granted)
- Made by Emergent watermark info not provided

## Pending Tasks (Priority Order)
1. **P1:** Abonelik planı detaylarının doğrulanması (PLAN_LIMITS)
2. **P3:** Tarayıcı bildirimleri
3. **P3:** ElevenLabs TTS
4. **P3:** Emergent watermark bilgisi

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

## Last Updated: 2026-03-13
