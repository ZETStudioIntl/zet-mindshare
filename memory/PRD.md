# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## Core Architecture
- **Frontend**: React (port 3000), **Backend**: FastAPI (port 8001), **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)
- **Real-time**: WebSocket at /api/ws/collab/{doc_id}

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editor
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas, element render, editable table
- `/app/frontend/src/components/editor/ShareDialog.js` - Paylasim dialog
- `/app/frontend/src/components/editor/CommentsPanel.js` - Yorum paneli
- `/app/frontend/src/hooks/useCollaboration.js` - WebSocket isbirligi hook
- `/app/frontend/src/hooks/useCanvasHistory.js` - Undo/Redo
- `/app/frontend/src/pages/SharedView.js` - Paylasilan belge goruntumleme
- `/app/frontend/src/lib/msFormat.js` - .ms format engine
- `/app/frontend/src/lib/editorConstants.js` - Arac tanimlari
- `/app/backend/server.py` - Backend API (share, comments, WebSocket)

## Completed Features

### Phase 1-7 (Onceki Oturumlar)
- Dashboard, AI (ZETA, Judge Mini), Kredi/abonelik, Auth
- Coklu sayfa, export (PDF, PNG, JPEG, SVG, .ms)
- Redact/highlight, undo/redo, margins/indents
- Editable tables, drag-reorder layers, find/replace
- Auto-save indicator, bullet/numbered lists, element gruplama

### Phase 9 - Isbirligi ve Paylasim (16 Mart 2026)
- **Belge Paylasim Linki**: Salt okunur veya duzenlenebilir paylasim linkleri olusturma, kopyalama, iptal etme
- **Yorum Sistemi**: Yorum ekleme, yanitlama, cozme, silme. Sayfa bazli yorumlar
- **WebSocket Isbirligi**: Gercek zamanli cursor paylasimi, element senkronizasyonu, kullanici katilma/ayrilma bildirimleri
- **Paylasilan Belge Goruntumleme**: /shared/{shareId} sayfasi, guest/authenticated erisim, izin badge'i
- **Online Kullanici Gostergesi**: Header'da cevrimici kullanicilarin avatarlari

## API Endpoints (Collaboration)
- POST /api/documents/{doc_id}/share - Paylasim linki olustur
- GET /api/documents/{doc_id}/shares - Paylasim linklerini listele
- DELETE /api/share/{share_id} - Paylasim linkini iptal et
- GET /api/shared/{share_id} - Paylasilan belgeyi getir (auth gerekmez)
- POST /api/documents/{doc_id}/comments - Yorum ekle
- GET /api/documents/{doc_id}/comments - Yorumlari listele
- POST /api/comments/{comment_id}/reply - Yanit ekle
- PUT /api/comments/{comment_id}/resolve - Yorumu coz
- DELETE /api/comments/{comment_id} - Yorumu sil
- GET /api/documents/{doc_id}/online - Cevrimici kullanicilari getir
- WS /api/ws/collab/{doc_id} - WebSocket isbirligi

## Pending Issues
- P3: Tarayici bildirimleri calismiyorP3: ElevenLabs TTS gecersiz API anahtari

## Upcoming Tasks
- P1: Stripe odeme entegrasyonu
- P1: Google Drive entegrasyonu
- P2: Degisiklik takibi (Track Changes)
- P2: Dikey coklu sayfa surekli akis
- P3: iCloud, Dashboard onizlemeleri

## 3rd Party Integrations
- Gemini 3 Flash (ZETA), Gemini Nano Banana - Emergent LLM Key
- Resend, Google Drive (blocked), ElevenLabs (blocked)
- Emergent Google Auth, Apple Sign-In (placeholder)

## Test Credentials
- Email: test2@test.com / Password: password123
- Test share_id: share_aa7ddfa2c22b
