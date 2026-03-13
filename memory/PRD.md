# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.
**Developed by:** ZET Studio International
**CEO:** Muhammed Bahaddin Yılmaz
**HQ:** İstanbul, Türkiye

## SESSION - 2026-03-13 Iteration 26

### New Features
1. **Templates Düzeltme ve Genişletme**
   - 20 şablon tamamen çalışır durumda (eskiden sadece 5 tanesi çalışıyordu)
   - Yeni eklenen şablonlar: Toplantı Notları, Teklif, Sözleşme, Bülten, Tarif Kartı, Proje Planı, Sertifika, Kontrol Listesi, Beyin Fırtınası, Sosyal Medya, Haftalık Plan, SWOT Analizi, Blog Yazısı, Etkinlik Afişi
   - Kategorilere göre gruplandırma (Temel, İş, Kariyer, Hukuki, Eğitim, Kişisel, Pazarlama, Yaratıcı)

2. **Redact (Sansür) AI Gizliliği**
   - Sansürlenmiş içerikler artık AI (ZETA/Judge) tarafından görülemiyor
   - getDocText() isRedacted olanları filtreliyor
   - getFullDocContent() sansürlü elementleri [REDACTED] olarak gösteriyor

3. **Highlighter Oto Modu**
   - Word Type paneline Highlighter bölümü eklendi
   - "Oto: Açık/Kapalı" toggle düğmesi
   - 6 renk seçeneği (sarı, yeşil, cyan, pembe, turuncu, kırmızı)
   - Oto mod açıkken metin seçildiğinde otomatik işaretleme

4. **Rütbe ve Görevler Ayrımı**
   - "Rütbe & Görevler" tek buton → "Rütbe" ve "Görevler" iki ayrı butona dönüştürüldü
   - Her biri kendi modalına sahip
   - Görevler modalına 2 yeni görev eklendi (Şablon Uzmanı, Organizatör)

5. **Rütbe Rozeti Header'da**
   - Kullanıcı rütbesi "ZET Mindshare" yazısının yanında görünüyor
   - Altın renk rozet ile "Çırak" rütbesi gösteriliyor

6. **Profil Fotoğrafı Yükleme**
   - Profil düzenleme modalına fotoğraf yükleme eklendi
   - Fotoğraf önizleme, hover ile değiştirme
   - Backend'de base64 olarak MongoDB'de saklama
   - POST /api/auth/profile-picture endpoint'i

### Test Results
- iteration_26: Backend 100% (11/11), Frontend 100%
- iteration_25: Backend 100% (6/6), Frontend 100%

## Known Issues / Pending
- **Lasso Vector Selection:** Kement aracı vektörleri düzgün seçemiyor (P1)
- **Chart Tool Reliability:** Grafik aracının güvenilirliği düşük (P1)
- **Gradient on Shapes:** Renk geçişi tüm şekillere uygulanmıyor (P1)
- **Draggable Panel Lag:** Panellerin yavaş hareket etmesi (P2)
- **PDF Editing:** İçe aktarma özelliği (Upcoming)
- **Google Drive:** MOCKED
- **ElevenLabs TTS:** Invalid API key (Blocked)

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, lucide-react
- Backend: FastAPI, MongoDB, Pydantic
- Integrations: Gemini 3 Flash, Nano Banana, Resend

## Last Updated: 2026-03-13
