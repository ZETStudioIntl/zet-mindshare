# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-16

### Iteration 38 (Completed) - Derin Analiz Kaynak Linkleri + Türkçe Karakter Düzeltmesi
- **Derin Analiz kaynak linkleri:** Backend artık araştırma sırasında bulunan tüm makale/kaynak URL'lerini döndürüyor. Frontend'de tıklanabilir link listesi gösteriliyor.
- **Türkçe karakter düzeltmesi:** Tüm frontend dosyalarında (questMapData, Dashboard, Editor, RightPanel, LoginPage, QuestMap) eksik Türkçe karakterler (ö,ü,ç,ş,ğ,ı,İ) düzeltildi.
  - questMapData.js: ~600+ karakter düzeltmesi (500 görev)
  - Dashboard.js, Editor.js, RightPanel.js, LoginPage.js, QuestMap.js
  - Backend server.py hata mesajları
- **Kritik bug fix:** Toplu karakter dönüşümü JavaScript değişken isimlerini bozmuştu (disabled→dışabled, section→seçtion). Testing agent tarafından tespit edilip düzeltildi.
- DuckDuckGo API basit sorgularda çalışıyor, karmaşık sorgularda sınırlı sonuç dönüyor (bilinen kısıt).
- Test: Backend %100, Frontend %100

### Iteration 37 (Completed) - AI Chat Yapısını Sadeleştirme
- 4 sekme → 2 sekme: ZETA + Judge Mini
- ZETA içinde: Chat + "Oto Yaz" ve "Derin Analiz 100kr" butonları
- Fotoğraf butonu kaldırıldı

### Iteration 36 (Completed) - Kullanıcı İstek Listesi #401
- Derin Analiz özelliği, kredi limiti 1000, paket güncelleme, sayfa limiti 7
- Kelime sayacı tüm sayfalar, kredi ikonu tıklanabilir, Türkçeleştirme

### Earlier Iterations (Completed)
- Görev Haritası v2, SP ile Abonelik, Otomatik Yazma, Kredi Satın Alma
- Apple Sign-In placeholder, Sözleşme Kabul, Ses Efekti, Plan düşürme

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)
- Tarayıcı bildirimleri çalışmıyor
- DuckDuckGo API karmaşık sorgularda sınırlı sonuç döndürüyor

## Future Tasks
- Gerçek zamanlı ortak çalışma (P2)
- Dikey çoklu sayfa kaydırma (P2)
- iCloud entegrasyonu (P3)
- Dashboard belge önizlemeleri (P3)
- server.py refactoring (router'lara bölme)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic, PyJWT
- Integrations: Gemini 3 Flash, Nano Banana, Resend, Emergent Google Auth, DuckDuckGo

## Last Updated: 2026-03-16
