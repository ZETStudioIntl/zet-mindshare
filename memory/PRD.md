# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## THIS SESSION ADDITIONS (2026-03-08)

### Major Features Added
1. **10 Dil Desteği** - EN, TR, DE, FR, ES, AR, RU, JA, KO, ZH
2. **Hatırlatıcı Notlar** - Notes'a alarm kurma, bildirim izni ve bildirim gönderme
3. **Subscription Sistemi** - Mock satın alma/iptal, plan durumu Settings'de görünür
4. **Fast Select Limiti** - Free: 3, Plus: 5, Pro: 8, Ultra: 8
5. **PDF Düzenleme** - Yeni proje açarken "Edit PDF" seçeneği
6. **Dijital İmza** - Canvas üzerinde imza çizme aracı
7. **AI Chat Geçmişi** - Mesajlar projede saklanıyor, yeniden yüklenebilir
8. **ZETA & Judge Entegrasyonu** - Karşılıklı yönlendirme
9. **AI Image'a Photo Edit** - Photo edit kısayolu eklendi
10. **Zoom Tool Kaldırıldı** - Kullanılmıyordu

### Bug Fixes
- Judge: "Analiz et" demeden analiz yapmıyor
- Gradient shapes - Kontrol edilecek

## Implemented Features (65+)

### Tools
- Text, Font (51), Color, Gradient, Hand, Layers, Ruler, Grid
- Image, AI Image, **AI Photo Edit**, **Signature (NEW)**, QR Code
- Draw, Pen, Eraser, Marking, Select, Copy, Mirror
- Chart, Table, Templates, Export (PDF/PNG/JPEG/SVG/JSON)
- Voice TTS, Voice Input (STT)
- Shapes: Triangle, Square, Circle, Star, Ring

### Supported Languages (10)
| Code | Language | Flag |
|------|----------|------|
| en | English | 🇬🇧 |
| tr | Türkçe | 🇹🇷 |
| de | Deutsch | 🇩🇪 |
| fr | Français | 🇫🇷 |
| es | Español | 🇪🇸 |
| ar | العربية | 🇸🇦 |
| ru | Русский | 🇷🇺 |
| ja | 日本語 | 🇯🇵 |
| ko | 한국어 | 🇰🇷 |
| zh | 中文 | 🇨🇳 |

## Subscription Plans
| Plan | Aylık | Yıllık | Fast Select |
|------|-------|--------|-------------|
| Free | $0 | $0 | 3 tools |
| Plus | $9.99 | $99.99 | 5 tools |
| Pro | $19.99 | $199.99 | 8 tools |
| Ultra | $39.99 | $399.99 | 8 tools |

## Key API Endpoints
- `/api/subscription` - GET/POST subscription status
- `/api/notes` - Notes with reminder_time support
- `/api/notes/reminders` - Get due reminders
- `/api/chat-history/{doc_id}` - Get/Delete chat history
- `/api/zeta/photo-edit` - AI Photo editing
- `/api/judge/chat` - ZET Judge Mini

## AI Assistants
1. **ZETA** - Uygulama kullanımı, araçlar → Analiz sorusunda Judge'a yönlendiriyor
2. **ZET Judge Mini** - İş analizi, strateji → "Analiz et" demeden analiz yapmaz

## Known Issues
- **Gradient shapes** - Apply gradient fonksiyonu kontrol edilecek

## Test Results
- Subscription API: ✅ Working
- Notes Reminder API: ✅ Working
- Chat History API: ✅ Working

## Last Updated: 2026-03-08
