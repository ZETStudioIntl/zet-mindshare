# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

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

**Frontend:**
- Header'da kredi göstergesi (⚡ kalan kredi)
- Kilitli araçlarda kilit ikonu
- AI Image panelinde Pro toggle + boyut seçimi + kredi bilgisi
- Yetersiz kredi uyarısı + yükseltme popup
- Paket bazlı araç kilitleme

### Iteration 27-28 (Completed)
- Chart Tool güvenilirliği (SVG axis, grid, labels)
- Şekillere gradient (CSS backgroundImage fix)
- DraggablePanel performansı (ref-based DOM)
- PDF içe aktarma (pdfjs-dist)
- Highlighter aracı (sansür gibi çalışıyor)
- Sağ tık metin seçimi

### Iteration 26 (Completed)
- Templates: 20 şablon çalışır
- Redact AI gizliliği
- Rütbe & Görevler ayrımı
- Profil fotoğrafı yükleme

### Test Results
- iteration_29: Backend 100% (10/10), Frontend 100%
- iteration_28: Frontend 100% (12/12)
- iteration_26: Backend 100% (11/11), Frontend 100%

## Known Issues
- Lasso Vector Selection (P1)
- Google Drive (MOCKED)
- ElevenLabs TTS (Blocked)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, pdfjs-dist
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend

## Last Updated: 2026-03-13
