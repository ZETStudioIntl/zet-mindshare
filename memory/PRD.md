# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge olusturma ve beyin firtinasi araci.

## Core Architecture
- **Frontend**: React (port 3000), **Backend**: FastAPI (port 8001), **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editor
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas ve element render
- `/app/frontend/src/hooks/useCanvasHistory.js` - Undo/Redo history yonetimi
- `/app/frontend/src/lib/editorConstants.js` - Arac tanimlari (bulletlist, numberedlist eklendi)
- `/app/frontend/src/lib/msFormat.js` - .ms format engine (export/import/convert)
- `/app/frontend/src/components/editor/RightPanel.js` - AI panel
- `/app/backend/server.py` - Backend API

## Completed Features

### Phase 1-2 (Onceki Oturumlar)
- Dashboard, belge yonetimi, AI entegrasyonu (ZETA, Judge Mini)
- Kredi/abonelik sistemi, Gorev Haritasi, Auth
- Word benzeri editor, Turkce karakter duzeltmeleri

### Phase 3 - Coklu Sayfa ve Export (16 Mart 2026)
- Kesintisiz coklu sayfa duzenleme, otomatik sayfa ekleme
- Tum sayfalari export (PDF, PNG, JPEG, SVG, JSON)

### Phase 3.5 - Kenar Bosluklari ve Girintiler (16 Mart 2026)
- Dinamik margin guncellmesi, margin kilavuz cizgileri
- Girinti sliderlari calisiyor

### Phase 4 - Metin Secimi ile Arac Uygulama (16 Mart 2026)
- Metin secimi ile kismi redact/highlight
- Bandi Kaldir butonu, Manuel highlighter (M) araci kaldirildi

### Phase 5 - Undo/Redo Duzeltmesi (16 Mart 2026)
- useCanvasHistory: useRef tabanli yeniden yazildi
- Ctrl+Z/Y calisiyorPhase 6 - Popover Duzeltmesi ve .ms Format (16 Mart 2026)
- Highlight/redact kaldirma popoveri duzeltildi (React state tabanli)
- .ms format destegi eklendi (export/import)
- Black Band (sifreli sansur), AES-GCM encryption altyapisi hazir

### Phase 7 - Editor Iyilestirmeleri (16 Mart 2026)
- **Otomatik Kaydetme Gostergesi**: saveStatus state (saved/saving/unsaved), header'da yesil/sari/gri gosterge
- **Madde Isaretleri / Numarali Liste**: bulletlist ve numberedlist araclari, applyListFormat fonksiyonu, secili metni ul/ol listesine donusturme
- **Metin Kutusu Boyutlandirma**: Text elementlere resize handle eklendi, sadece genislik degistirme
- **Element Gruplama**: groupElements/ungroupElements fonksiyonlari, grup halinde surukle-birak, 'G' badge gostergesi
- **Dikey Sayfa Iyilestirmesi**: gap-3 aralik, hover efekti, gecis animasyonlari

## Pending Issues
- P3: Tarayici bildirimleri calismiyorP3: ElevenLabs TTS gecersiz API anahtari

## Upcoming Tasks
- P0: Tablo hucre duzenleme (editable table cells)
- P0: Z-index surukle-birak siralama (drag-to-reorder layers)
- P1: Bul ve Degistir fonksiyonellik testi
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
