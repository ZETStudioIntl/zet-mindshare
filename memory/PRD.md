# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-14 Iteration 33

### Iteration 33 (Completed) - Apple Sign-In + Sözleşme Kabul + Ses Efekti + Paket İçerikleri
**Değişiklikler:**
1. **Apple ile Giriş:** Login sayfasına Apple Sign-In butonu eklendi (siyah stil). Backend `/api/auth/apple/init` ve `/api/auth/apple/callback` endpoint'leri hazır. Apple Developer credentials ayarlandığında tam çalışacak.
2. **Sözleşme Kabul Metni:** Kayıt formuna checkbox ile 3 link eklendi:
   - Kullanım Koşulları: zetstudiointernational.com/zet-kullanim-kosullari/
   - Ödeme ve İade Sözleşmesi: zetstudiointernational.com/odeme-ve-iade-sozlesmesi/
   - Gizlilik Politikası: zetstudiointernational.com/zet-gizlilik-sozlesmesi/
   - Checkbox kabul edilmeden kayıt butonu deaktif.
3. **Görev Tamamlama Ses Efekti:** Web Audio API ile C-major arpej (C5, E5, G5, C6) + shimmer efekti.
4. **Paket İçerikleri Güncellendi:** Kredi sistemiyle uyumlu (Free:20, Plus:100, Pro:250, Ultra:1000 kredi/gün) ve ZETA/Judge limitleri eklendi.

**Test:** Backend 100% (8/8), Frontend 100%

### Iteration 32 (Completed) - SP ile Plan Satın Alma + Minimap Silme
- Plus:10,000 SP, Pro:30,000 SP, Ultra:50,000 SP ile plan satın alma
- Minimap kaldırıldı, PLAN_LIMITS doğrulandı

### Iteration 31 (Completed) - Görev Haritası v2: Örümcek Ağı/Labirent
- 500 görev, altın açı spiral, 2234 bağlantı
- XP -> SP dönüşümü

### Earlier Iterations
- Kredi Sistemi, Chart Tool, Templates, Redact AI, Profil, Editor

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, Apple Developer credentials bekleniyor)

## Pending Tasks
1. **P2:** Apple Sign-In konfigürasyonu (Apple Developer credentials gerekli)
2. **P3:** Tarayıcı bildirimleri
3. **P3:** ElevenLabs TTS

## Future Tasks
- Gerçek zamanlı ortak çalışma
- Dikey çoklu sayfa kaydırma
- iCloud entegrasyonu
- Dashboard'da belge içeriği önizlemeleri

## Refactoring
- server.py router'lara bölünmesi
- Editor.js custom hook'lara ayrılması

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, Web Audio API, HTML5 Canvas
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth
- Auth: Google OAuth (Emergent), Apple Sign-In (hazır, konfigürasyon bekleniyor), Email/Password

## Last Updated: 2026-03-14
