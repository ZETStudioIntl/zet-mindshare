# ZET Mindshare - PRD (Product Requirements Document)

## Overview
ZET Mindshare is a mobile and PC compatible document creation tool with integrated AI assistant (ZETA).

## Original Problem Statement
- Mobil ve PC uyumlu belge oluşturma aracı
- ZETA AI entegrasyonu (beyin fırtınası, araştırma, analiz, görsel oluşturma)
- Uygulama içi satın alma (sonra eklenecek)
- Ana renkler: #292f91 ve #4ca8ad (updated)
- Koyu mat tema, hafif glow, minimalist stil

## User Personas
1. **Content Creators** - Blog yazarları, içerik üreticileri
2. **Business Professionals** - İş planı, proje teklifi hazırlayanlar
3. **Students** - Ödev, makale, araştırma belgeleri
4. **Personal Users** - CV, mektup, günlük notlar

## Core Requirements (Static)
- [x] Google Auth ile giriş
- [x] Belge oluşturma/düzenleme
- [x] Hızlı notlar
- [x] ZETA AI chat (Gemini 3 Flash)
- [x] Multi-language support (English/Turkish)
- [x] ZETA responds in user's language
- [ ] ZETA AI görsel oluşturma (Nano Banana) - Backend ready
- [x] Mobil/PC responsive tasarım
- [x] 3 sütunlu editör (Toolbox, Canvas, Pages+ZETA)
- [x] Collapsible panels (toolbox & right panel)
- [x] 3 tools per row in toolbox
- [ ] Google Drive entegrasyonu - MOCK
- [ ] iCloud entegrasyonu - MOCK
- [ ] Uygulama içi satın alma - Sonra eklenecek
- [ ] Apple Auth - Sonra eklenecek
- [ ] Email Auth - Sonra eklenecek

## Tech Stack
- **Frontend:** React.js, TailwindCSS
- **Backend:** FastAPI, Python
- **Database:** MongoDB
- **AI:** Gemini 3 Flash (text), Nano Banana (images) via Emergent LLM Key
- **Auth:** Emergent Google OAuth

## What's Been Implemented

### Phase 1 - MVP Skeleton (March 2026)
- Login page with Google Auth
- Dashboard with document/notes listing
- Document CRUD operations
- Quick notes CRUD
- 3-column editor layout
- ZETA AI chat integration (working)
- Mobile responsive design
- Dark theme with #004e64 and #e0e5e9 colors

### Phase 2 - UI/UX Improvements (March 2026)
- New color palette: #292f91 (primary) and #4ca8ad (accent)
- Multi-language support (English default, Turkish in settings)
- ZETA responds in user's language automatically
- Toolbox: 3 tools per row with names
- Collapsible panels (toolbox & pages+ZETA)
- Gradient effects for buttons and accents

### Phase 3 - Editor Polish (March 2026)
- Separate collapse buttons for Pages and ZETA panels
- Document stats (page count + character count)
- Equal width columns (toolbox = right panel = 288px)
- Tool names translated in Turkish
- Centered navigation (removed Back/Forward labels)
- ZET Mindshare logo in header right corner

### Phase 4 - Functional Canvas (March 2026)
- Simplified to 3 tools: Text, Hand, Image
- TEXT TOOL: Click anywhere on canvas to add text
- HAND TOOL: Zoom in/out buttons, Reset View, drag to pan
- IMAGE TOOL: Upload modal, resize from corners
- Canvas elements saved per page
- ZETA AI trained on tools - fun, professional, concise responses
- Tool icons only (no text labels)

## Prioritized Backlog

### P0 (Critical)
- None

### P1 (High)
- Canvas drawing/editing functionality
- Tool implementations (pencil, brush, text, shapes)
- Document export (PDF, PNG)
- ZETA image generation UI

### P2 (Medium)
- Google Drive actual integration
- iCloud integration
- Subscription/payment system (Stripe)
- Apple/Email auth methods

### P3 (Nice to have)
- Real-time collaboration
- Template library
- Advanced typography tools

## Next Tasks
1. Implement canvas drawing functionality
2. Add tool actions (pencil, text, shapes)
3. ZETA image generation UI integration
4. Document export feature
