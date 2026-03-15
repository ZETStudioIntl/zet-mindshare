# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-15 Iteration 34.1 (Bug Fix)

### Bug Fix: ZETA Otomatik Yazma - İki Sorun Düzeltildi
1. **Metin belgeye aktarılmıyordu:** `font` yerine `fontFamily` kullanılarak ve element formatı canvas renderer'a uygun hale getirilerek düzeltildi.
2. **Satır hesabı yanlıştı:** LLM çıktısındaki `\n` sayısı yerine karakter-bazlı sayfa satırı hesaplaması eklendi (~75 karakter = 1 sayfa satırı). 3 sayfa satırı = 10 kredi.

**Test:** E2E screenshot ile doğrulandı - metin belgeye aktarılıyor ve kredi doğru hesaplanıyor.

### Iteration 34 (Completed) - ZETA Otomatik Yazma + Plan Düşürme
### Iteration 33 (Completed) - Apple Sign-In + Sözleşme Kabul + Ses + Paketler
### Iteration 32 (Completed) - SP ile Plan Satın Alma + Minimap Silme
### Iteration 31 (Completed) - Görev Haritası v2: Örümcek Ağı/Labirent

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)

## Pending Tasks
- P3: Tarayıcı bildirimleri, ElevenLabs TTS

## Future Tasks
- Gerçek zamanlı ortak çalışma
- Dikey çoklu sayfa kaydırma
- iCloud, Dashboard önizlemeler

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, Web Audio API, HTML5 Canvas
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth

## Last Updated: 2026-03-15
