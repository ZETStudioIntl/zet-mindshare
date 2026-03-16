# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## Core Architecture
- **Frontend**: React (port 3000), **Backend**: FastAPI (port 8001), **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editör
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas ve element render
- `/app/frontend/src/hooks/useCanvasHistory.js` - Undo/Redo history yönetimi
- `/app/frontend/src/lib/editorConstants.js` - Araç tanımları
- `/app/frontend/src/components/editor/RightPanel.js` - AI panel
- `/app/backend/server.py` - Backend API

## Completed Features

### Phase 1-2 (Önceki Oturumlar)
- Dashboard, belge yönetimi, AI entegrasyonu (ZETA, Judge Mini)
- Kredi/abonelik sistemi, Görev Haritası, Auth
- Word benzeri editör, Türkçe karakter düzeltmeleri

### Phase 3 - Çoklu Sayfa ve Export (16 Mart 2026)
- Kesintisiz çoklu sayfa düzenleme, otomatik sayfa ekleme
- Tüm sayfaları export (PDF, PNG, JPEG, SVG, JSON)

### Phase 3.5 - Kenar Boşlukları ve Girintiler (16 Mart 2026)
- Dinamik margin güncellemesi, margin kılavuz çizgileri
- Girinti slider'ları çalışıyor

### Phase 4 - Metin Seçimi ile Araç Uygulama (16 Mart 2026)
- Metin seçimi ile kısmi redact/highlight (selectionchange event + string-based wrap)
- "Bandı Kaldır" butonu ile siyah bant kaldırma
- Manuel highlighter (M) aracı kaldırıldı, HTML tabanlı içerik desteği

### Phase 5 - Undo/Redo Düzeltmesi (16 Mart 2026)
- useCanvasHistory: useRef tabanlı yeniden yazıldı (stale closure sorunu giderildi)
- JSON.parse/stringify ile deep copy, MAX_HISTORY = 50
- Ctrl+Z/Y: contentEditable içinde tarayıcı native undo, dışında canvas-level undo
- lastLoadedPageRef: auto-save sırasında history.reset engellendi, sadece sayfa değişiminde reset

## Pending Issues
- P3: Tarayıcı bildirimleri çalışmıyor
- P3: ElevenLabs TTS geçersiz API anahtarı

## Upcoming Tasks
- P1: Stripe ödeme entegrasyonu
- P1: Google Drive entegrasyonu
- P2: Gerçek zamanlı ortak çalışma
- P3: iCloud, Dashboard önizlemeleri

## 3rd Party Integrations
- Gemini 3 Flash (ZETA), Gemini Nano Banana - Emergent LLM Key
- Resend, Google Drive (blocked), ElevenLabs (blocked)
- Emergent Google Auth, Apple Sign-In (placeholder)

## Test Credentials
- Email: test2@test.com / Password: password123
