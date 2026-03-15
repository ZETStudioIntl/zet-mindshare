# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-15 Iteration 35

### Iteration 35 (Completed) - Kredi Paketleri Satın Alma
- 4 paket: 100 ($2.99), 350 ($8.99), 700 ($14.99), 1300 ($24.99)
- Plus/Pro/Ultra kullanıcılara %15 indirim
- Bonus krediler günlük limitin üzerine ekleniyor
- Bonus kredi günlük sıfırlanmıyor, kalıcı
- `POST /api/credits/buy`, `GET /api/credits/packages`
- Dashboard Settings → Kredi Al modalı
- Test: Backend 14/14, Frontend %100

### Iteration 34.1 (Bug Fix) - Otomatik Yazma Düzeltmeleri
- Metin belgeye aktarılmıyordu → setDocument üzerinden düzeltildi
- Satır hesabı karakter-bazlı (75 char = 1 satır)
- LLM prompt güçlendirildi (sayfa başı 500 kelime minimum)

### Iteration 34 - ZETA Otomatik Yazma + Plan Düşürme
### Iteration 33 - Apple Sign-In + Sözleşme Kabul + Ses + Paketler
### Iteration 32 - SP ile Plan Satın Alma + Minimap Silme
### Iteration 31 - Görev Haritası v2: Örümcek Ağı/Labirent

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)

## Pending Tasks
- P3: Tarayıcı bildirimleri, ElevenLabs TTS

## Future Tasks
- Gerçek zamanlı ortak çalışma, dikey çoklu sayfa kaydırma
- iCloud, Dashboard önizlemeler

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, Web Audio API
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth

## Last Updated: 2026-03-15
