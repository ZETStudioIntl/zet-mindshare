# ZET Mindshare - PRD

## Overview
ZET Mindshare - Mobil ve PC uyumlu, profesyonel belge oluşturma ve beyin fırtınası aracı.

## SESSION - 2026-03-16

### Iteration 40 (Completed) - Word Gibi Editor Optimizasyonu
- **Direkt yazma:** Canvas'ın boş yerine tıklayınca otomatik text elementi oluşur (x:60 marjin hizalı)
- **Sabit genişlik:** Text elementleri sayfa genişliği - marjinler (120px) kadar genişlikte
- **Select/Hand mod:** Her iki modda da boş alana tıklayınca text oluşur, mevcut texte tıklayınca düzenleme
- **Paragraf hizalaması:** Text width sabit olduğu için center/left/right doğru çalışır
- **Text tool kaldırıldı:** Artık ihtiyaç yok, direkt yazma var
- **İşaretleyici/Fosforlu ikon farklılaştırıldı:** Underline vs Highlighter
- **Judge Mini fotoğraf kaldırıldı**
- **AI belge görme:** ZETA+Judge otomatik belge görüyor, siyah bant filtreleniyor
- **Derin Analiz "Belgeye Ekle":** Tek tıkla araştırma sonuçları belgeye eklenir
- **Kopyala/Yapıştır:** Native contentEditable ile Ctrl+C/V çalışır
- Test: Frontend %100 (10/10)

### Earlier Iterations
- Iteration 39: Derin Analiz kaynak linkleri, Türkçe karakter düzeltmesi
- Iteration 38: AI Chat sadeleştirme (2 sekme)
- Iteration 37: Kredi sistemi güncellemeleri
- Iteration 36: Görev Haritası, Abonelik, Otomatik Yazma, Kredi Satın Alma

## Known Issues
- ElevenLabs TTS (Blocked), Google Drive (MOCKED), Apple Sign-In (placeholder)
- Tarayıcı bildirimleri çalışmıyor

## Future Tasks
- Gerçek zamanlı ortak çalışma (P2)
- Dikey çoklu sayfa kaydırma (P2)
- server.py refactoring (router'lara bölme)

## Last Updated: 2026-03-16
