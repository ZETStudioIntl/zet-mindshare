# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## SESSION - 2026-03-16 Iteration 36

### Iteration 36 (Completed) - Kullanici Istek Listesi #401
- **Derin Analiz** ozellik eklendi: Pro/Ultra aboneler icin 100 kredi, ZETA internet arastirmasi + LLM analizi
  - `POST /api/zeta/deep-analysis` endpoint
  - DuckDuckGo API ile web arastirmasi + Gemini ile analiz raporu
  - RightPanel'de "Derin" sekmesi
  - Free/Plus kullanicilar icin kilitli durum gosterimi
- **Kredi limiti**: 1000 ust sinir eklendi
  - Backend'de MAX_CREDIT_BALANCE = 1000
  - Asim durumunda `needs_confirmation` yaniti ve onay mekanizmasi
  - Frontend'de overflow uyari pop-up'i
- **Kredi paketi guncelleme**: 1300 -> 1000 kredi (pack_1300 -> pack_1000)
- **Otomatik yazma sayfa limiti**: 10'dan 7'ye dusuruldu
- **Toplam kelime sayaci**: Tum sayfalari kapsayacak sekilde guncellendi
- **Kredi ikonu tiklanabilir**: Editor'de kredi gostergesine tiklaninca Dashboard'a yonlendirme
- **Kredi satma modal'i**: Editor'daki yukseltme pop-up'ina "Kredi Al" butonu eklendi
- **Arayuz Turkcelestrme**: Varsayilan dil 'en' yerine 'tr' yapildi
  - Dashboard'daki tum fallback metinler Turkcelestirildi
  - Abonelik, ayarlar, profil, dosya islemleri metinleri
- Test: Backend 7/8, Frontend %100

### Iteration 35 (Completed) - Kredi Paketleri Satin Alma
- 4 paket: 100 ($2.99), 350 ($8.99), 700 ($14.99), 1000 ($24.99)
- Plus/Pro/Ultra kullanicilara %15 indirim
- Bonus krediler gunluk limitin uzerine ekleniyor
- `POST /api/credits/buy`, `GET /api/credits/packages`
- Dashboard Settings -> Kredi Al modali
- Test: Backend 14/14, Frontend %100

### Iteration 34.1 (Bug Fix) - Otomatik Yazma Duzeltmeleri
- Metin belgeye aktarilmiyordu -> setDocument uzerinden duzeltildi
- Satir hesabi karakter-bazli (75 char = 1 satir)
- LLM prompt guclendirildi (sayfa basi 500 kelime minimum)

### Iteration 34 - ZETA Otomatik Yazma + Plan Dusurme
### Iteration 33 - Apple Sign-In + Sozlesme Kabul + Ses + Paketler
### Iteration 32 - SP ile Plan Satin Alma + Minimap Silme
### Iteration 31 - Gorev Haritasi v2: Orumcek Agi/Labirent

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)
- Tarayici bildirimleri (browser notifications) calismiyor

## Pending Tasks
- P3: Tarayici bildirimleri, ElevenLabs TTS
- P3: "Made by Emergent" filigrani kaldirma rehberligi

## Future Tasks
- Gercek zamanli ortak calisma (P2)
- Dikey coklu sayfa kaydirma (P2)
- iCloud entegrasyonu (P3)
- Dashboard'da belge icerigi onizlemeleri (P3)

## Refactoring Needs
- server.py: Router'lara ve servislere bolunmesi gerekiyor
- Dashboard.js: Modal bilesenlerinin ayristirilmasi
- Editor.js: Custom hook'lar ile sadelestirme

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, Web Audio API
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth, DuckDuckGo (Derin Analiz)

## Key API Endpoints
- POST /api/zeta/deep-analysis (Yeni - Iteration 36)
- POST /api/zeta/auto-write
- GET /api/credits/packages
- POST /api/credits/buy (confirm_overflow parametresi eklendi)
- POST /api/subscribe/sp
- GET /api/usage

## Last Updated: 2026-03-16
