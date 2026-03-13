# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## SESSION - 2026-03-13 Kapsamlı Güncelleme

### New Features (iteration_24)
1. **Chat Ayarları Paneli** - AI asistanlarını özelleştirme
   - ZETA Mod: Neşeli, Profesyonel, Meraklı, Özel (custom prompt)
   - ZETA Emoji: Kullanma, Az, Orta, Çok
   - Judge Mod: Normal (yapıcı), Sert (esprili dalga geçme)
   
2. **Girinti Aracı** - Metin girintileme
   - Sol, Sağ, Üst, Alt padding slider'ları
   - Sıfırla butonu
   
3. **Kenar Boşlukları Aracı** - Sayfa kenar boşlukları
   - Üst, Alt, Sol, Sağ input alanları
   - Hazır ayarlar: Normal (40px), Dar (20px), Geniş (60px)
   
4. **100 Font** - Genişletilmiş font kütüphanesi
   - Sans-Serif, Serif, Monospace, Display, El Yazısı kategorileri
   - Arama özelliği

### Previous Features (iteration_23)
- Upgrade Modal (limit bitince popup)
- Chart'lara gradient desteği
- Dashboard planları Türkçe

### Test Results
- iteration_24: Frontend 100%
- iteration_23: Frontend 100%
- iteration_22: Backend 100%, Frontend 100%

## Subscription & Usage Limits
| Plan  | AI Görsel | Judge Temel | Judge Derin | Fast Select |
|-------|-----------|-------------|-------------|-------------|
| Free  | 1/gün     | ❌ Kilitli  | ❌ Kilitli  | 3 araç      |
| Plus  | 5/gün     | 3/gün       | ❌          | 5 araç      |
| Pro   | 30/gün    | 7/gün       | 1/gün       | 8 araç      |
| Ultra | 50/gün    | 12/gün      | 5/gün       | 8 araç      |

## AI Özelleştirme
### ZETA Modları
- 🎉 Neşeli: Pozitif, enerjik, motivasyonlu
- 💼 Profesyonel: İş odaklı, net cevaplar
- 🔍 Meraklı: Sorgulayıcı, ek sorular
- ✨ Özel: Kullanıcı tanımlı prompt

### Judge Modları
- ⚖️ Normal: Yapıcı, profesyonel eleştiri
- 🔥 Sert: Esprili dalga geçme, sarkastik ama yardımcı

## Known Issues / Pending
- **Lasso Vector Selection** - Vektör seçimi iyileştirilebilir
- **PDF Editing** - İçe aktarma özelliği
- **Google Drive** - MOCKED

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend

## Last Updated: 2026-03-13
