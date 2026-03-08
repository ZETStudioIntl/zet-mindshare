# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## SESSION - 2026-03-08 Kapsamlı Güncelleme

### Bug Fixes
1. **Dashboard Hatası Düzeltildi** - `Cannot access 'showNotification' before initialization` hatası çözüldü
2. **Free Plan Limit Bug'ları Düzeltildi**:
   - AI Görsel üretimi artık FREE için 1/gün ile sınırlı
   - Judge artık FREE kullanıcılar için kilitli
   - Frontend'de limit kontrolü ve uyarı mesajları eklendi

### New Features
1. **Resend E-posta Entegrasyonu** - Hatırlatıcı ve abonelik bildirimleri e-posta ile gönderiliyor
2. **E-posta ile Abonelik İptali** - İptal isteği sonrası kullanıcıya e-posta gönderiliyor
3. **ZETA Kapsamlı Güncelleme** - Tüm özellikler, araçlar, abonelik paketleri öğretildi
4. **AI Image Panel Limit Gösterimi** - "Kalan AI Görsel: X/Y" bilgisi
5. **Judge Lock Mesajı** - Free kullanıcılar için "Free planda kullanılamaz" uyarısı

### Test Results
- **iteration_21**: Backend 100% (23/23), Frontend 100%
- **iteration_22**: Backend 100% (13/13), Frontend 100%
- Tüm FREE plan limit kontrolleri çalışıyor

## Subscription & Usage Limits
| Plan  | AI Görsel | Judge Temel | Judge Derin | Fast Select | Fiyat (Aylık) |
|-------|-----------|-------------|-------------|-------------|---------------|
| Free  | 1/gün     | ❌ Kilitli  | ❌ Kilitli  | 3 araç      | Ücretsiz      |
| Plus  | 5/gün     | 3/gün       | ❌          | 5 araç      | $9.99         |
| Pro   | 30/gün    | 7/gün       | 1/gün       | 8 araç      | $19.99        |
| Ultra | 50/gün    | 12/gün      | 5/gün       | 8 araç      | $39.99        |

## ZETA Bildiği Konular
- ✅ Tüm araçlar ve kısayolları (TEXT, DRAW, PEN, IMAGE, vb.)
- ✅ Gradient kullanımı (metin ve şekillere)
- ✅ AI Image ve Photo Edit özellikleri
- ✅ Abonelik paketleri ve limitleri
- ✅ ZET Judge Mini hakkında yönlendirme
- ✅ Notlar ve hatırlatıcılar
- ✅ Dışa aktarma formatları
- ✅ Klavye kısayolları
- ✅ Dil desteği

## API Endpoints
- `GET /api/usage` - Günlük kullanım ve limitler
- `POST /api/subscription` - Abonelik yönetimi (e-posta ile iptal)
- `GET /api/subscription/confirm-cancel?token=xxx` - İptal onayı
- `POST /api/zeta/generate-image` - AI görsel (limit kontrollü)
- `POST /api/judge/chat` - Judge chat (plan kontrollü)

## Known Issues / Pending
- **Gradient on Charts**: Grafiklere gradient uygulaması iyileştirilebilir
- **Lasso Vector Selection**: Vektör çizimleri seçme mantığı iyileştirilebilir
- **PDF Editing**: İçe aktarma ve düzenleme özelliği henüz tam değil
- **Google Drive**: MOCKED - credentials.json bekleniyor

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash (ZETA), Nano Banana (Image Gen), Resend (Email)
- Auth: Email/Password + Google OAuth

## Last Updated: 2026-03-08
