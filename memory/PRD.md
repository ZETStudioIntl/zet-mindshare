# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz

## Core Features
- Dashboard: Dosya yönetimi, arama, ayarlar, hızlı notlar, abonelik yönetimi
- Editor: 3 sütunlu yapı (Araçlar, Canvas, AI Chat)
- AI Assistants: ZETA (genel), ZET Judge (analitik)
- Subscription: Free, Plus, Pro, Ultra

## SESSION - 2026-03-13 Iterations 26-28

### Iteration 26 (Completed)
- Templates: 20 şablon tamamen çalışır durumda, kategorilere göre gruplandırma
- Redact AI gizliliği: Sansürlü içerikler AI'dan gizlendi
- Rütbe & Görevler: Ayrı modallara ayrıldı
- Rütbe rozeti: "ZET Mindshare" yanında görünüyor
- Profil fotoğrafı yükleme: Frontend + Backend tamamlandı

### Iteration 27-28 (Completed)
- **Chart Tool Güvenilirliği:** SVG tabanlı grafikler axis çizgileri, grid, etiketler, veri doğrulama ile yeniden yazıldı. Bar, Pie, Line chart hepsi çalışıyor.
- **Şekillere Gradient:** CSS `backgroundImage` ile gradient rendering düzeltildi. Square, Circle, Triangle, Star, Ring hepsi gradient destekliyor. Oluşturma sırasında gradient modu açıksa otomatik uygulanıyor.
- **DraggablePanel Performansı:** ref-based DOM manipülasyonu ile yeniden yazıldı (React state yerine). Sürükleme artık pürüzsüz.
- **PDF İçe Aktarma:** pdfjs-dist ile PDF dosyalarını sayfa görüntülerine dönüştürme. Her sayfa canvas'a image olarak ekleniyor.
- **Highlighter Aracı:** Sansür aracı gibi çalışıyor - metin seç, araç çubuğundan Highlighter'a tıkla, metin işaretleniyor. 6 renk seçeneği.
- **Sağ Tık Metin Seçimi:** Metin üzerinde sağ tık native context menu (kopyala/yapıştır). Boş alanda sağ tık rectangle selection.

### Test Results
- iteration_28: Frontend 100% (12/12 features)
- iteration_27: Frontend 100% (shape gradient bug identified)
- iteration_26: Backend 100% (11/11), Frontend 100%

## Known Issues / Remaining
- **Lasso Vector Selection:** Kement aracı vektörleri düzgün seçemiyor (P1)
- **Note Reminders (Browser):** Tarayıcı bildirimleri sorunlu olabilir (P3)
- **Google Drive:** MOCKED
- **ElevenLabs TTS:** Invalid API key (Blocked)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react, pdfjs-dist
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend

## Upcoming Tasks
- Gerçek zamanlı ortak çalışma
- Dikey çoklu sayfa kaydırma
- iCloud entegrasyonu
- Dashboard belge önizlemeleri

## Last Updated: 2026-03-13
