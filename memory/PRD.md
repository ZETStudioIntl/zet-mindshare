# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-15 Iteration 34

### Iteration 34 (Completed) - ZETA Otomatik Yazma + Plan Düşürme Kısıtlama

**Değişiklikler:**
1. **ZETA Otomatik Yazma Modu:**
   - Yeni "Oto Yaz" sekmesi: ZETA ve Judge sekmelerinin yanında
   - Prompt girişi, sayfa sayısı (1-10), yazım stili seçimi
   - 6 yazım stili: Profesyonel, Akademik, Yaratıcı, Resmi, Günlük, Hikaye
   - Maliyet: 3 satır = 10 kredi
   - Üretilen içerik otomatik olarak belgeye ekleniyor
   - Backend: `POST /api/zeta/auto-write` (Gemini 3 Flash)
2. **Plan Düşürme Kısıtlama:**
   - Plan değiştiğinde FastSelect araçları anında kısıtlanıyor
   - Free: 3, Plus: 5, Pro: 8, Ultra: 8 araç limiti
   - localStorage da güncelleniyor

**Test:** Backend 100% (13/13), Frontend 100%

### Iteration 33 (Completed) - Apple Sign-In + Sözleşme Kabul + Ses + Paketler
### Iteration 32 (Completed) - SP ile Plan Satın Alma + Minimap Silme
### Iteration 31 (Completed) - Görev Haritası v2: Örümcek Ağı/Labirent

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, Apple Developer credentials bekleniyor)

## Pending Tasks
- P3: Tarayıcı bildirimleri, ElevenLabs TTS

## Future Tasks
- Gerçek zamanlı ortak çalışma
- Dikey çoklu sayfa kaydırma
- iCloud entegrasyonu, Dashboard belge önizlemeleri

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, Web Audio API, HTML5 Canvas
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth

## Last Updated: 2026-03-15
