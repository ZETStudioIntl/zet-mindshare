# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-13 Iterations 30

### Iteration 30 (Completed) - Görev Haritası (Quest Map)
**500 görevlik tam quest map sistemi oluşturuldu:**

**Özellikler:**
- 500 görev, 21 kategori (Belge Ustasi, AI Kesficisi, Tasarim Sihirbazi, Sablon Uzmani, vb.)
- Zorluk seviyelerine göre farklı şekiller: circle=Kolay, square=Orta, triangle=Zor, star=Efsanevi
- HTML5 Canvas tabanlı yüksek performanslı render (60fps)
- Zoom/Pan (mouse wheel + drag, touch pinch gestures)
- Görev arama ve kategori filtreleme
- Minimap (sağ alt köşe)
- Görev detay paneli (tıklama ile)
- Görev tamamlama ve XP kazanma
- Kilitli/açık görev mantığı (sıralı ilerleme)
- Dashboard'dan erişim: Ayarlar > Görev Haritası

**Backend Endpoints:**
- GET /api/quests/progress - Kullanıcının tamamladığı görevler ve XP
- POST /api/quests/{quest_id}/complete - Görev tamamlama

**Test:** Backend 100% (7/7), Frontend 100%

## SESSION - 2026-03-13 Iterations 26-29

### Iteration 29 (Completed) - Kredi Sistemi
**Tam kredi sistemi ve paket bazlı kısıtlamalar uygulandı:**

**Kredi Maliyetleri:**
- Nano Banana görsel: 20 kredi
- Nano Banana Pro görsel: 50 kredi
- Fotoğraf düzeltme: 15 kredi
- Fotoğraf düzeltme Pro: 40 kredi
- ZET Judge temel analiz: 25 kredi
- Judge derin analiz: 70 kredi

**Paketler:**
- **Free:** 20 kredi/gün, Judge kapalı, 3 fastselect, ZETA 250 harf, Pro yok, boyut: 16:9, Layers/Signature/Watermark/PageColor/Grafikler kapalı
- **Plus:** 100 kredi/gün, Judge Mini 150 harf, Layers açık, ZETA 500 harf, derin analiz yok, boyut: 16:9, 9:16, 1:1
- **Pro:** 250 kredi/gün, Tüm araçlar, Nano Pro, ZETA sınırsız, Judge 600 harf, 7 boyut (16:9, 9:16, 1:1, 2.55:1, 2.39:1, 1.85:1, 2.00:1)
- **Ultra:** 1000 kredi/gün, Herşey sınırsız

### Iteration 27-28 (Completed)
- Chart Tool güvenilirliği (SVG axis, grid, labels)
- Şekillere gradient (CSS backgroundImage fix)
- DraggablePanel performansı (ref-based DOM)
- PDF içe aktarma (pdfjs-dist)
- Highlighter aracı
- Sağ tık metin seçimi

### Iteration 26 (Completed)
- Templates: 20 şablon çalışır
- Redact AI gizliliği
- Rütbe & Görevler ayrımı
- Profil fotoğrafı yükleme

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
- server.py ve Editor.js refactoring

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, pdfjs-dist, HTML5 Canvas
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend

## Last Updated: 2026-03-13
