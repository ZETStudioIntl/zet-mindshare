# ZET Mindshare - Product Requirements Document

## Original Problem Statement
ZET Mindshare: Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı. Oyunlaştırılmış görev haritası, abonelik ve kredi sistemine dayalı yapay zeka özellikleri (ZETA), ve gelişmiş proje editörü.

## Core Architecture
- **Frontend**: React (port 3000)
- **Backend**: FastAPI (port 8001)
- **Database**: MongoDB
- **Auth**: Cookie-based (withCredentials: true)

## Key Files
- `/app/frontend/src/pages/Editor.js` - Ana editör
- `/app/frontend/src/components/editor/CanvasArea.js` - Canvas ve element render
- `/app/frontend/src/components/editor/RightPanel.js` - AI panel (ZETA, Judge Mini)
- `/app/frontend/src/components/editor/Toolbox.js` - Araç çubuğu
- `/app/backend/server.py` - Backend API

## Completed Features

### Phase 1 - Temel Özellikler (Tamamlandı)
- Dashboard, belge yönetimi, arama
- Proje editörü (canvas-based)
- AI entegrasyonu (ZETA - Gemini, Judge Mini)
- Kredi ve abonelik sistemi
- Görev Haritası (500 görev, örümcek ağı)
- Google Auth, Apple Sign-In placeholder

### Phase 2 - AI ve UI Optimizasyonu (Tamamlandı)
- AI paneli: 4 sekmeden 2'ye (ZETA, Judge Mini)
- "Oto Yaz" ve "Derin Analiz" butonları
- Word benzeri editör deneyimi
- Türkçe karakter düzeltmeleri
- Derin Analiz kaynak URL'leri
- AI belge farkındalığı (gizli alanlar hariç)

### Phase 3 - Çoklu Sayfa ve Export (16 Mart 2026 - Tamamlandı)
- Kesintisiz çoklu sayfa düzenleme (pendingEditRef ile cross-page click)
- Sayfa ekleme sırasında mevcut sayfa elementlerinin korunması
- Otomatik sayfa ekleme (metin taşması kontrolü)
- Tüm sayfaları export (PDF, PNG, JPEG, SVG, JSON)
- addpage aracı düzeltmesi (artık diğer panelleri açmıyor)
- pdfjs-dist import düzeltmesi (Türkçe karakter bozulması)

## Pending Issues
- P3: Tarayıcı bildirimleri çalışmıyor
- P3: ElevenLabs TTS geçersiz API anahtarı

## Upcoming Tasks (Priority Order)
- P1: Stripe ödeme entegrasyonu
- P1: Google Drive entegrasyonu
- P2: Gerçek zamanlı ortak çalışma
- P2: Dikey çoklu sayfa kaydırma iyileştirmesi
- P3: iCloud entegrasyonu
- P3: Dashboard belge içeriği önizlemeleri

## Refactoring Needed
- Editor.js: State yönetimi sadeleştirme (custom hooks)
- server.py: Router'lara bölme

## 3rd Party Integrations
- Gemini 3 Flash (ZETA) - Emergent LLM Key
- Gemini Nano Banana (Image Gen) - Emergent LLM Key
- Resend - User API Key
- Google Drive - Blocked (needs OAuth credentials)
- ElevenLabs - Blocked (invalid API key)
- Emergent Google Auth - Implemented
- Apple Sign-In - Placeholder

## Test Credentials
- Email: test2@test.com / Password: password123
