# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-16

### Iteration 39 (Completed) - Editör İyileştirmeleri
- **Derin Analiz belgeye ekleme:** "Belgeye Ekle" butonu ile araştırma sonuçları tek tıkla belgeye aktarılır
- **Text tool kaldırıldı:** Araç çubuğundan kaldırıldı, varsayılan araç "select" oldu
- **İşaretleyici vs Fosforlu ikon değişikliği:** İşaretleyici=Underline, Fosforlu=Highlighter (artık farklı ikonlar)
- **Judge Mini fotoğraf kaldırıldı:** Chat input alanından görsel yükleme butonu çıkarıldı
- **AI belge görme:** Her iki AI (ZETA + Judge) tüm sayfaları otomatik görüyor, "Belgenizi otomatik olarak görüyorum" mesajı
- **Siyah bant gizliliği:** `isRedacted` olan elementler AI'ya kesinlikle gönderilmiyor, `getDocText()` ve `getFullDocContent()` tüm sayfalarda redacted filtreleme yapıyor
- Test: Frontend %100 (11/11)

### Iteration 38 (Completed) - Derin Analiz Kaynak Linkleri + Türkçe Karakter
- Kaynak URL'leri ile tıklanabilir link listesi
- Tüm frontend dosyalarında Türkçe karakter düzeltmesi (~800+ karakter)

### Iteration 37 (Completed) - AI Chat Sadeleştirme
- 4 sekme → 2 sekme: ZETA + Judge Mini

### Iteration 36 (Completed) - Kullanıcı İstek Listesi #401
- Derin Analiz, kredi limiti 1000, paket güncelleme, Türkçeleştirme

### Earlier Iterations
- Görev Haritası v2, SP ile Abonelik, Otomatik Yazma, Kredi Satın Alma

## Known Issues
- ElevenLabs TTS (Blocked - API key invalid)
- Google Drive (MOCKED)
- Apple Sign-In (Backend ready, credentials bekleniyor)
- Tarayıcı bildirimleri çalışmıyor

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
