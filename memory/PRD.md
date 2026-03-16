# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## SESSION - 2026-03-16

### Iteration 37 (Completed) - AI Chat Yapisini Sadelestirme
- **4 sekme -> 2 sekme:** ZETA, Oto Yaz, Judge, Derin -> ZETA + Judge Mini
- **ZETA icinde:** Chat alani + alt barda "Oto Yaz" ve "Derin Analiz 100kr" butonlari
- **Oto Yaz butonu:** Tiklaninca auto-write modu acilir (geri ok ile chat'e donus)
- **Derin Analiz butonu:** Tiklaninca deep analysis modu acilir (geri ok ile chat'e donus)
- **Fotograf butonu kaldirildi:** ZETA chat input'tan gorsel yukleme butonu cikarildi
- **Export butonu Turkceleştirildi:** "Export PDF" -> "PDF Aktar"
- Test: Frontend %100

### Iteration 36 (Completed) - Kullanici Istek Listesi #401
- Derin Analiz ozelligi (Pro/Ultra, 100 kredi, internet arastirmasi + LLM analizi)
- Kredi limiti 1000 + overflow uyari pop-up'i
- Kredi paketi 1300 -> 1000
- Otomatik yazma sayfa limiti 10 -> 7
- Toplam kelime sayaci tum sayfalari kapsiyor
- Kredi ikonu tiklanabilir
- Arayuz Turkcelestirme (varsayilan dil 'tr')

### Earlier Iterations (Completed)
- Gorev Haritasi v2 (Orumcek Agi), SP ile Abonelik, Otomatik Yazma, Kredi Satin Alma
- Apple Sign-In placeholder, Sozlesme Kabul, Ses Efekti
- Plan dusurme kontrolu, FastSelect

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)
- Tarayici bildirimleri calismiyor

## Future Tasks
- Gercek zamanli ortak calisma (P2)
- Dikey coklu sayfa kaydirma (P2)
- iCloud entegrasyonu (P3)
- Dashboard belge onizlemeleri (P3)
- server.py refactoring (router'lara bolme)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth, DuckDuckGo

## Last Updated: 2026-03-16
