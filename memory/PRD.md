# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## Core Architecture
- **Frontend**: React (port 3000), **Backend**: FastAPI (port 8001), **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)
- **Real-time**: WebSocket at /api/ws/collab/{doc_id}

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editor
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas, element render
- `/app/frontend/src/components/editor/ShareDialog.js` - Paylasim dialog
- `/app/frontend/src/components/editor/CommentsPanel.js` - Yorum paneli
- `/app/frontend/src/components/editor/EmojiPicker.js` - Emoji secici
- `/app/frontend/src/hooks/useCollaboration.js` - WebSocket isbirligi
- `/app/frontend/src/pages/SharedView.js` - Paylasilan belge
- `/app/frontend/src/lib/msFormat.js` - .ms format engine
- `/app/frontend/src/lib/editorConstants.js` - Arac tanimlari
- `/app/backend/server.py` - Backend API

## Completed Features

### Phase 1-9 (Onceki Oturumlar)
- Dashboard, AI (ZETA, Judge Mini), Kredi/abonelik, Auth
- Coklu sayfa, export (PDF, PNG, JPEG, SVG, .ms)
- Redact/highlight, undo/redo, margins/indents
- Editable tables, drag-reorder layers, find/replace
- Auto-save indicator, bullet/numbered lists, element gruplama
- Belge paylasim, yorum sistemi, WebSocket isbirligi

### Phase 10 - Emoji Picker (17 Mart 2026)
- **Emoji Picker Araci**: Sol toolbar'da SmilePlus ikonu ile erisim
- **Kapsamli Emoji Seti**: 10 kategori (Sik Kullanilan, Yuzler, Jestler, Kalpler, Hayvanlar, Yiyecekler, Aktiviteler, Seyahat, Nesneler, Semboller, Bayraklar)
- **Arama**: Emoji arama kutusu
- **Son Kullanilan**: localStorage ile son kullanilan emojilerin saklanmasi
- **Secili Metne Ekleme**: Secili metin elementine emoji ekleme, yoksa yeni text element olusturma
- **DraggablePanel**: Suruklenebilir panel icinde acilma

## Pending Issues
- P3: Tarayici bildirimleri calismiyorP3: ElevenLabs TTS gecersiz API anahtari

## Upcoming Tasks
- P1: Stripe odeme entegrasyonu
- P1: Google Drive entegrasyonu
- P2: Degisiklik takibi (Track Changes)
- P2: Dikey coklu sayfa surekli akis
- P3: iCloud, Dashboard onizlemeleri

## Test Credentials
- Email: test2@test.com / Password: password123
