# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## SESSION - 2026-03-13 Kapsamlı Güncelleme

### Bug Fixes
1. **Dashboard Hatası** - `showNotification` initialization hatası çözüldü
2. **Free Plan Limitleri** - AI Görsel 1/gün, Judge kilitli

### New Features (iteration_23)
1. **Upgrade Modal** - Limit bitince popup abonelik ekranı
   - Crown icon ile profesyonel görünüm
   - Planlar Ultra -> Pro -> Plus sırasında
   - Judge tab'da "Planı Yükselt" butonu
   - AI Image limiti aşılınca otomatik açılıyor

2. **Chart Gradient Desteği** - Grafiklere gradient uygulanabilir
   - Bar, Pie ve Line grafiklerde gradient
   - "Gradient Kullan" checkbox'ı

3. **Dashboard Türkçeleştirme** - Abonelik planları Türkçe
   - Sınırsız Depolama, AI Görsel/gün, E-posta Desteği vb.
   - Plus'a "ZET Judge Mini (3 temel/gün)" eklendi

### Test Results
- iteration_21: Backend 100%, Frontend 100%
- iteration_22: Backend 100%, Frontend 100%
- iteration_23: Frontend 100% (Upgrade Modal, Chart Gradient, Turkish Plans)

## Subscription & Usage Limits
| Plan  | AI Görsel | Judge Temel | Judge Derin | Fast Select | Fiyat (Aylık) |
|-------|-----------|-------------|-------------|-------------|---------------|
| Free  | 1/gün     | ❌ Kilitli  | ❌ Kilitli  | 3 araç      | Ücretsiz      |
| Plus  | 5/gün     | 3/gün       | ❌          | 5 araç      | $9.99         |
| Pro   | 30/gün    | 7/gün       | 1/gün       | 8 araç      | $19.99        |
| Ultra | 50/gün    | 12/gün      | 5/gün       | 8 araç      | $39.99        |

## ZETA Bildiği Konular
- ✅ Tüm araçlar ve kısayolları
- ✅ Gradient kullanımı (metin, şekiller, grafikler)
- ✅ AI Image ve Photo Edit özellikleri
- ✅ Abonelik paketleri ve limitleri
- ✅ ZET Judge Mini hakkında yönlendirme

## API Endpoints
- `GET /api/usage` - Günlük kullanım ve limitler
- `POST /api/subscription` - Abonelik yönetimi
- `POST /api/zeta/generate-image` - AI görsel (limit kontrollü)
- `POST /api/judge/chat` - Judge chat (plan kontrollü)

## Known Issues / Pending
- **Lasso Vector Selection** - Vektör seçimi iyileştirilebilir
- **PDF Editing** - İçe aktarma özelliği
- **Google Drive** - MOCKED - credentials.json bekleniyor

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash (ZETA), Nano Banana (Image Gen), Resend (Email)
- Auth: Email/Password + Google OAuth

## Last Updated: 2026-03-13
