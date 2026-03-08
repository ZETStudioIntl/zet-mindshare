# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## THIS SESSION - Kapsamlı Güncelleme (2026-03-08)

### Subscription & Usage Limits
| Plan | AI Görsel | Judge Temel | Judge Derin | Karakter | Fast Select |
|------|-----------|-------------|-------------|----------|-------------|
| Free | 1/gün | ❌ Kilitli | ❌ Kilitli | - | 3 |
| Plus | 5/gün | 3/gün | ❌ | 400 | 5 |
| Pro | 30/gün | 7/gün | 1/gün | 900 | 8 |
| Ultra | 50/gün | 12/gün | 5/gün | 2000 | 8 |

### Yeni Özellikler
1. **Gradient Apply Düzeltildi** - Şekillere de uygulanıyor
2. **Photo Edit Kalem Çizimi** - Düzenlemek istediğiniz alanı işaretleyin
3. **Abonelik İptali Caydırıcı** - "Bunları kaybedeceksiniz" uyarısı + çift onay
4. **ZET Judge Fast/Deep Modu** - ⚡Hızlı ve 🔬Derin analiz seçenekleri
5. **Usage Tracking** - Günlük kullanım limitleri ve sayaçlar
6. **Paket Düşürme** - Fast Select araçları otomatik azalıyor
7. **Bildirim Sistemi** - Alert fallback ile daha güvenilir
8. **10 Dil Desteği** - EN, TR, DE, FR, ES, AR, RU, JA, KO, ZH
9. **Dijital İmza** - Canvas üzerinde imza çizme
10. **PDF Düzenleme** - Yeni proje açarken "Edit PDF" seçeneği

### API Endpoints
- `GET /api/usage` - Günlük kullanım ve limitler
- `POST /api/judge/chat` - mode: "fast" veya "deep"
- `POST /api/zeta/generate-image` - Limit kontrollü
- `GET /api/notes/reminders` - Zamanı gelen hatırlatıcılar

### ZET Judge Mini Kuralları
- **Free:** Tamamen kilitli
- **Plus:** Sadece Fast mod, 400 karakter
- **Pro:** Fast + 1 Deep/gün, 900 karakter  
- **Ultra:** Fast + 5 Deep/gün, 2000 karakter

### Known Issues
- Bildirim izni mobilde farklı davranabilir (alert fallback var)

## Test Results
- Usage API: ✅ Working (Pro: 30 AI, 7 Basic, 1 Deep)
- Judge Limit: ✅ Working (1/7 kullanıldı)
- Subscription: ✅ Working

## Last Updated: 2026-03-08
