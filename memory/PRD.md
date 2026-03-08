# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## THIS SESSION ADDITIONS (2026-03-08)

### New Features
1. **ZET Judge Mini** - İş analizi AI asistanı (ZETA yanında tab)
   - "Analiz et" demeden analiz yapmaz
   - ZETA ile karşılıklı yönlendirme yapar
   - Başarı puanı (1-100) ve Risk puanı (1-100) verir

2. **AI Photo Edit** - Mevcut fotoğrafları AI ile düzenleme
   - Arkaplan kaldırma, renk değiştirme, efekt ekleme

3. **Yeni Diller** - 8 yeni dil eklendi:
   - Almanca (de), Fransızca (fr), İspanyolca (es)
   - Arapça (ar), Rusça (ru), Japonca (ja)
   - Korece (ko), Çince (zh)

4. **Mobil Arayüz Yenileme**
   - Alt navigasyon barı: Tools, Pages, AI Chat
   - Kağıt kayma sorunu düzeltildi (touch-action)
   - Daha iyi tool grid görünümü

5. **ZETA & Judge Entegrasyonu**
   - ZETA: Analiz sorularında Judge'a yönlendiriyor
   - Judge: Uygulama sorularında ZETA'ya yönlendiriyor

6. **Subscription Carousel** (Önceki oturum)
   - Yana kaydırmalı, aylık/yıllık seçenekler
   - Ultra ($39.99) → Pro ($19.99) → Plus ($9.99)

### Bug Fixes
- Mirror tool (scaleX/scaleY transform)
- Eraser drag mode (trail + element silme)
- Zoom tool küçültüldü

## Implemented Tools (65+)
- Text, Font (51), Color, Gradient, Hand, Zoom, Layers, Ruler, Grid
- Image, AI Image, **AI Photo Edit (NEW)**, QR Code
- Draw, Pen, Eraser, Marking, Select, Copy, Mirror
- Chart, Table, Templates, Export (PDF/PNG/JPEG/SVG/JSON)
- Voice TTS, Voice Input (STT)
- Shapes: Triangle, Square, Circle, Star, Ring

## Supported Languages (10)
| Code | Language |
|------|----------|
| en | English |
| tr | Türkçe |
| de | Deutsch |
| fr | Français |
| es | Español |
| ar | العربية |
| ru | Русский |
| ja | 日本語 |
| ko | 한국어 |
| zh | 中文 |

## AI Assistants
1. **ZETA** - Uygulama kullanımı, araçlar, genel sorular
2. **ZET Judge Mini** - İş analizi, strateji, vizyon (analiz et demeden analiz yapmaz)

## Key API Endpoints
- `/api/zeta/chat` - ZETA AI
- `/api/judge/chat` - ZET Judge Mini
- `/api/zeta/photo-edit` - AI Photo Edit (NEW)
- `/api/zeta/generate-image` - AI Image generation
- `/api/zeta/translate` - Translation

## Önerilen Yeni Tool'lar
1. **Timeline/Gantt** - Proje planlama için zaman çizelgesi
2. **Mind Map** - Beyin fırtınası için zihin haritası
3. **Flowchart** - İş akışı diyagramları
4. **Sticky Notes** - Canvas üzerine yapışkan notlar
5. **Voice Notes** - Sesli not kaydetme
6. **PDF Import** - PDF dosyalarını açma ve düzenleme
7. **Collaboration Cursor** - Gerçek zamanlı işbirliği için imleçler
8. **Version History** - Belge sürüm geçmişi
9. **Comments** - Belge üzerine yorum ekleme
10. **Signature** - Dijital imza aracı

## SHA-1 Key Alma (Android için)
```bash
# Debug key:
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

# Release key:
keytool -list -v -keystore your-release-key.keystore -alias your-alias
```

## Google Drive OAuth Setup
1. Google Cloud Console → New Project
2. Enable Google Drive API
3. Create OAuth 2.0 Client IDs:
   - iOS: Bundle ID
   - Android: Package name + SHA-1
   - Web: Redirect URIs

## Last Updated: 2026-03-08
