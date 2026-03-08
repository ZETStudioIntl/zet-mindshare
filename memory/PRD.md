# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## SESSION - 2026-03-08 Kritik Düzeltmeler

### Bug Fixes
1. **Dashboard Hatası Düzeltildi** - `Cannot access 'showNotification' before initialization` hatası çözüldü
   - `showNotification` fonksiyonu useEffect'lerden önce tanımlandı
   - Uygulama artık hatasız açılıyor

2. **Resend E-posta Entegrasyonu** - Hatırlatıcı ve abonelik bildirimleri e-posta ile gönderiliyor
   - Hatırlatıcılar kullanıcının giriş e-postasına gönderiliyor
   - Abonelik hoş geldin e-postası
   - İptal onay e-postası (link ile onay)

### New Features
1. **E-posta ile Abonelik İptali** - İptal isteği sonrası kullanıcıya e-posta gönderiliyor
   - Kullanıcı e-postadaki linke tıklayarak iptali onaylıyor
   - Daha güvenli ve kazara iptal önleniyor

### Test Results (iteration_21)
- Backend: 100% (23/23 tests passed)
- Frontend: 100%
- Login/Register: ✅
- Dashboard: ✅ (showNotification fix confirmed)
- New Document: ✅
- Editor: ✅
- Quick Notes with Reminders: ✅
- Settings Menu: ✅
- Subscription: ✅ (email cancellation)
- ZETA AI: ✅

## Subscription & Usage Limits
| Plan | AI Görsel | Judge Temel | Judge Derin | Karakter | Fast Select |
|------|-----------|-------------|-------------|----------|-------------|
| Free | 1/gün | ❌ Kilitli | ❌ Kilitli | - | 3 |
| Plus | 5/gün | 3/gün | ❌ | 400 | 5 |
| Pro | 30/gün | 7/gün | 1/gün | 900 | 8 |
| Ultra | 50/gün | 12/gün | 5/gün | 2000 | 8 |

## API Endpoints
- `GET /api/usage` - Günlük kullanım ve limitler
- `POST /api/subscription` - Abonelik yönetimi (e-posta ile iptal)
- `GET /api/subscription/confirm-cancel?token=xxx` - İptal onayı
- `GET /api/notes/reminders` - Zamanı gelen hatırlatıcılar
- `PUT /api/notes/{id}/reminder-sent` - Hatırlatıcı e-postası gönder

## Known Issues / Pending
- **Gradient on Charts**: Grafikler SVG olarak render ediliyor, gradient uygulaması farklı çalışıyor
- **Lasso Vector Selection**: Vektör çizimleri seçme mantığı iyileştirilebilir
- **Google Drive**: MOCKED - credentials.json bekleniyor

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash (ZETA), Nano Banana (Image Gen), Resend (Email)
- Auth: Email/Password + Google OAuth

## Last Updated: 2026-03-08
