# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## Core Architecture
- **Frontend**: React (port 3000), **Backend**: FastAPI (port 8001), **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editor
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas, element render, editable table
- `/app/frontend/src/hooks/useCanvasHistory.js` - Undo/Redo
- `/app/frontend/src/lib/editorConstants.js` - Arac tanimlari
- `/app/frontend/src/lib/msFormat.js` - .ms format engine
- `/app/frontend/src/components/editor/RightPanel.js` - AI panel
- `/app/backend/server.py` - Backend API

## Completed Features

### Phase 1-2 (Onceki Oturumlar)
- Dashboard, belge yonetimi, AI (ZETA, Judge Mini)
- Kredi/abonelik, Gorev Haritasi, Auth
- Word benzeri editor

### Phase 3 - Coklu Sayfa ve Export
- Kesintisiz coklu sayfa, tum sayfalari export (PDF, PNG, JPEG, SVG)

### Phase 4 - Metin Secimi ile Arac Uygulama
- Kismi redact/highlight, Bandi Kaldir butonu

### Phase 5 - Undo/Redo Duzeltmesi
- useCanvasHistory: useRef tabanli, stale closure duzeltmesi

### Phase 6 - Popover Duzeltmesi ve .ms Format
- Highlight/redact kaldirma popoveri (React state tabanli)
- .ms format destegi (export/import), AES-GCM encryption altyapisi

### Phase 7 - Editor Iyilestirmeleri (16 Mart 2026)
- Otomatik kaydetme gostergesi (saved/saving/unsaved)
- Madde isaretleri / numarali liste (ul/ol)
- Metin kutusu boyutlandirma (resize handle)
- Element gruplama (group/ungroup, grup halinde surukle)
- Dikey sayfa iyilestirmesi (gap-3, hover efekti, animasyonlar)

### Phase 8 - Editor Pro Ozellikleri (16 Mart 2026)
- **Editable Table Cells**: Gercek HTML tablo, hucrelere yazabilme, blur ile kaydetme
- **Z-index Drag-Reorder Layers**: Layers panelinde surukle-birak ile siralama (HTML5 DnD)
- **Find & Replace Duzeltmesi**: htmlContent + tableData icinde arama, sonuc listesi, tiklama ile element secimi
- **.zet.json Kaldirildi**: Export/import'tan .zet.json secenegi silindi, sadece .ms kaldi

## Pending Issues
- P3: Tarayici bildirimleri calismiyorP3: ElevenLabs TTS gecersiz API anahtari

## Upcoming Tasks
- P1: Stripe odeme entegrasyonu
- P1: Google Drive entegrasyonu
- P2: Gercek zamanli ortak calisma
- P2: Dikey coklu sayfa kaydirma (surekli akis)
- P3: iCloud, Dashboard onizlemeleri

## 3rd Party Integrations
- Gemini 3 Flash (ZETA), Gemini Nano Banana - Emergent LLM Key
- Resend, Google Drive (blocked), ElevenLabs (blocked)
- Emergent Google Auth, Apple Sign-In (placeholder)

## Test Credentials
- Email: test2@test.com / Password: password123
