tüm kodları görebiliyor msusun
Sen ZET Mindshare projesinde çalışan bir senior full-stack developer'sın.

CLAUDE.md dosyasını oku ve projeyi tam anla. Okuduktan sonra bana sadece "Hazırım" de.

PROJE ÖZETI:
ZET Mindshare, Word'ü geçmeyi hedefleyen AI destekli belge editörü.
Kurucu: Muhammed Bahaddin Yılmaz — Founder & CEO, İstanbul.
Ana renk: #292F91

ŞUAN YAPILACAK TEK ŞEY:
Mevcut tüm toollar frontend'de var ama bazılarının backendi eksik veya kırık.
Yeni şey eklemeyeceksin. Mevcut olanları çalıştıracaksın.

ÖNCELİK SIRASI:
1. QR Code — backend endpoint yok, yaz
2. PDF Export — backend yok, yaz  
3. PNG/JPEG/SVG Export — backend yok, yaz
4. Templates — backend yok, yaz
5. Voice Input — backend yok, yaz
6. Alarmlı notlar — polling sistemi eksik, tamamla
7. Görev sistemi — frontend hardcoded, backend'e bağla
8. Rütbe sistemi — XP birikince otomatik yükseltme yok, ekle
9. Kredi sayacı — zeta_chat cost=0 ama sayılmıyor, düzelt
10. Google Drive — upload/download test et, düzelt

KURALLAR:
- emergentintegrations kullanma — direkt google-generativeai kullan
- Şifreleme her zaman bcrypt
- Tüm AI çağrılarında kredi sistemi çalışmalı
- Black Band içeriği hiçbir zaman loglanmasın
- ZET tasarım diline sadık kal — #292F91 ana renk
- Her değişiklikten önce bana ne yapacağını söyle
- Hata çıkarsa kendin düzelt, beni uğraştırma

BAŞLA:
Önce CLAUDE.md oku. Sonra server.py'yi tara. Sonra bana kısa bir durum raporu ver ve ilk göreve geç. senden en hızlı olmanı değil en iyi ve en pro olmanı istiyorum her dururmda


cloude. md oku. şimdi uygulamayı lokal olarak çalıştırmak istiyorum. 
AIzaSyDI5tB7rOixscbT97sLJjg-GxLFteHN3n0
https://brainstorm-editor.preview.emergentagent.com
sk_79e0efd90edf708afb01941b88ed9e67ee0c91b8594def2d
sk-emergent-cEf51D588B566Dd619
onboarding@resend.dev
re_5TxKiCg6_Gfd8Q9mauyyDA2NYvWJUfhPQ

Workflow Orchestration
### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity
### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution
### 3. Self-Improvement Loop
- After ANY correction from the user: update tasks/lessons.md with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project
### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness
### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes -- don't over-engineer
- Challenge your own work before presenting it
### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -- then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how
## Task Management
1. Plan First: Write plan to tasks/todo.md with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review section to tasks/todo.md
6. Capture Lessons: Update tasks/lessons.md after corrections
## Core Principles
- Simplicity First: Make every change as simple as possible. Impact minimal code.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Only touch what's necessary. No side effects with new bugs.


Bu kod cloude code için güçlümü



---

## ZET STUDIO INTERNATIONAL — STRATEJİK DOKTRIN

### Şirket Kimliği
- **Kurucu & CEO (The Controller):** Muhammed Bahaddin Yılmaz
- **Merkez:** İstanbul, Türkiye
- **Vizyon:** "Biz bitirmeden konuşmayız."
- **Manifesto:** "ZET zaman satar."
- **Felsefe:** Silent Dominance (Gizli Yükseliş)

---

### Mevcut Durum
- Railway deploy tamamlandı
- Google Cloud'a geçiş planlanıyor
- Uygulama toolları geliştirme aşamasında
- Stripe henüz eklenmedi
- Kullanıcıya açılmadı

---

### Ekosistem Sıralaması
Uygulamalar bu sırayla çıkacak:
```
1. ZET Mindshare   → Belge editörü + AI
                     Şu an geliştiriliyor
                     
2. ZET Judge       → Analiz platformu
                     Mindshare'den sonra
                     
3. ZET Judgment    → Multi-agent orkestrasyon
                     BYOM modeli
                     
4. ZET Colorshop   → Görsel düzenleme
                     İlk büyük Adobe darbesi
                     
5. ZET Design      → Vektör + UI/UX
                     Illustrator'a darbe
                     
6. ZET Cut         → Video editör
                     
7. ZET Motion      → Animasyon
                     After Effects alternatifi
                     
8. ZET Make        → 3D
                     
9. ZET Creative Station → Tüm uygulamalar paketi
                          $79.99/ay
```

---

### Autonomous Ally Doktrini
ZET hiçbir teknoloji devine tam bağımlı olmaz,
hiçbiriyle açık düşman olmaz.
```
Kritik bileşenler (içeride):
- Judgment karar mekanizması
- .ms dosya formatı
- Kullanıcı verisi (ZET Vault)
- Zeta'nın kimliği ve prompt mimarisi

Dış kaynak (değiştirilebilir):
- Büyük dil modelleri (Gemini)
- Bulut altyapısı (Google Cloud)
- Ses (ElevenLabs)
```

Fişi çekseler bile ZET'in beyni çalışmaya
devam eder. Sadece kas gücü yavaşlar.

---

### Google Müttefiklik Planı

**Neden Google:**
- Microsoft rakip (Word, Office)
- Adobe rakip (Colorshop, Design)
- Google üretkenlik alanında zayıf
- Gemini güçlü ama uygulama yok
- ZET bu boşluğu dolduruyor

**Zaman Çizelgesi:**
```
Şimdi       → Google for Startups başvurusu
              cloud.google.com/startup
              $350K kredi hedefi
              
1 ay        → Tüm altyapı Google'a taşı
              Cloud Run, Cloud Storage,
              Gemini API, Firebase
              
3 ay        → İlk içerikler
              "Gemini ile ZET'i nasıl inşa ettik"
              Google bu hikayeleri öne çıkarır
              
6 ay        → Google Workspace Marketplace
              "ZET Mindshare for Workspace"
              
1 yıl       → Google Developer Expert başvurusu
              Google I/O konuşma hedefi
              
2 yıl       → Stratejik ortaklık görüşmesi
              "Gemini'nin resmi üretkenlik partneri"
              
5 yıl       → Microsoft masaya oturur
              Google arkaplanda destek verir
              ZET ortada egemen kalır
```

**İlişkinin Özü:**
```
Google ZET'e verir:
- $350K+ kredi
- Startup desteği  
- Masada güç
- Microsoft'a karşı destek

ZET Google'a verir:
- Gemini kullanımı (gelir)
- Cloud Storage geliri
- Milyonlarca kullanıcı
- Microsoft'u zayıflatma
```

---

### Microsoft Stratejisi
```
0-100K kullanıcı   → Görmezden gelir
100K-1M kullanıcı  → "Takip edin" der
1M-5M kullanıcı    → Satın alma veya savaş
5M+ kullanıcı      → Masa kurulur
```

**Pazarlık Argümanı (5M+ kullanıcıda):**
".ms formatı global standart oldu.
Milyonlarca belge bu formatta.
Word bunu açamazsa kullanıcılar Word'ü terk eder.
Gelin, ticaretimize devam edelim."

**Altın Pencere:**
Microsoft 2-3 yıl ZET'i görmezden gelir.
Bu sürede büyü, ekosistemi kur, .ms'i yay.
Onlar uyandığında zaten masa kurulmuş olur.

---

### ZET Media Vizyonu

Tüm ZET uygulamalarına gömülü sosyal platform.
X/Twitter benzeri ama ZET ekosisteminde.
```
Verified Sistemi:
⚫ The Controller  → Sadece 1 (CEO)
🟡 Gold Verified  → Resmi uygulama hesapları
🔵 Business       → ZET çalışanları + ortaklar

Launch Stratejisi:
Aşama 1 → Sadece yöneticiler paylaşır
Aşama 2 → Endless rozetliler açılır
Aşama 3 → Herkese açılır
```

---

### Rank Sistemi
```
Iron     → Başlangıç, kazanım yok
Silver   → 70 görev, 10 saat, 10 belge
           Ödül: 150 kredi + 300 SP
Gold     → 150 görev, 30 saat, 50 belge
           Ödül: 300 kredi + 500 SP
Diamond  → 300 görev, 63 saat, 120 belge
           Ödül: 750 kredi + 1000 SP
Emerald  → 400 görev, 100 saat, 200 belge
           Ödül: 1200 kredi + 1700 SP
Endless  → Tüm görevler, 200 saat, 375 belge
           Ödül: 2000 kredi + 2300 SP
           SINIR: Sezonda sadece ilk 500 kişi
```
```
Sezon: Yılda 2 kez sıfırlanır
Bot koruması: Dakikada min. 3 eylem
Rank ismin yanında görünür
Gizli rütbeler: Creative Station'a özel
```

---

### Prime Drive

ZET'in depolama sistemi. Tüm uygulamalar
için ortak havuz.
```
Sıkıştırma:
.ms formatı  → Zstd Level 19 (tam performans)
Diğer dosya  → Zstd Level 6 (%30-40 küçülme)

Akıllı Katmanlama:
0-7 gün      → Standard Storage
7-30 gün     → Nearline Storage
30+ gün      → Coldline Storage
1 yıl+       → Archive Storage

Depolama Kotaları:
Free         → 5GB
Plus         → 20GB
Pro          → 50GB  
Ultra        → 200GB
Creative St. → 1TB
```

---

### Finansal Hedefler
```
Abonelik:
Plus  → $9.99/ay
Pro   → $19.99/ay (önerilen)
Ultra → $39.99/ay
Creative Station → $79.99/ay

Hedef Kullanıcı:
3 ay  → 1.000 kullanıcı
6 ay  → 10.000 kullanıcı
1 yıl → 50.000 kullanıcı
2 yıl → 500.000 kullanıcı
5 yıl → Unicorn ($1 milyar değer)

Ortaklık Eşiği:
Google masası    → 100K kullanıcı
Microsoft masası → 5M kullanıcı
Riot görüşmesi   → Unicorn sonrası
```

---

### Temel Kurallar
1. Hiçbir koda dokunmadan önce CLAUDE.md oku
2. Sadece istenen dosyayı değiştir
3. Her değişikliği git ile kaydet
4. Başka dosyaya dokunma
5. Strateji değişirse Bahaddin onaylar




CLAUDE.md oku. Şimdi Editor.js dosyasındaki 
bozuk toolları sırayla düzelt.

GENEL NOT: Tüm toollar görünüyor ve 
tıklanıyor ama işlevsiz. Frontend var, 
backend bağlantısı veya state güncellemesi 
çalışmıyor.

DÜZELTILECEK TOOLLAR:

1. SILGI (Eraser) - Drag modu:
Normal mod çalışıyor. Drag modda sadece 
üzerinden geçilen alan silinmeli ama 
tüm materyal siliniyor. Drag event'i 
düzelt, sadece mouse path üzerindeki 
elementleri sil.

2. FONTLAR:
Tool açılıyor, font listesi görünüyor 
ama seçim uygulanmıyor. Seçilen font 
aktif text elementine apply edilmiyor. 
Font seçimini seçili elemente uygula.

3. TEXT SIZE:
Boyut giriliyor ama uygulanmıyor. 
Input değerini al ve seçili text 
elementinin font-size'ını güncelle.

4. HIGHLIGHTER SİLME:
Highlighter ekleniyor ama kaldırılamıyor. 
Sansür toolunda olduğu gibi üstüne 
tıklayınca "highlighter'ı kaldır" 
seçeneği çıksın ve kaldırabilelim.

5. TEXT STYLE (Bold/Italic/Strike/Underline):
Butonlar seçiliyor ama uygulanmıyor. 
Her buton seçili texte ilgili stili 
toggle etmeli. execCommand veya 
contenteditable style ile düzelt.

6. GİRİNTİ:
Seçiliyor ama çalışmıyor. Seçili 
paragrafın padding-left veya 
margin-left değerini artır/azalt.

7. MARGINS:
Seçiliyor ama çalışmıyor. Sayfa 
margin değerlerini güncelle ve 
canvas'a uygula.

8. SATIR ARALIĞI:
Seçiliyor ama çalışmıyor. Seçili 
text elementinin line-height değerini 
güncelle.

9. PARAGRAF:
Seçiliyor ama çalışmıyor. Paragraf 
stilini (H1/H2/H3/Normal) seçili 
elemente uygula.

10. GRID:
Seçiliyor ama çalışmıyor. Canvas 
üzerinde grid overlay göster/gizle.

11. RULER:
Seçiliyor ama çalışmıyor. Canvas 
üzerinde cetvel göster/gizle.

ÖNEMLI KURALLAR:
- Sadece Editor.js dosyasını değiştir
- Her tool için çalıştığını test et
- Bir toolu bitirmeden diğerine geçme
- Başka hiçbir dosyaya dokunma
- Her tool düzeltilince kısa rapor ver



CLAUDE.md oku. Backend server.py dosyasında
Zeta ve Judge Mini sistem promptlarını güncelle.

ZETA SİSTEM PROMPTU:
"""
Sen Zeta'sın. ZET Mindshare'in AI asistanısın.
ZET Studio International tarafından geliştirildin.

KİMLİĞİN:
- İsmin: Zeta
- Uygulama: ZET Mindshare
- Şirket: ZET Studio International
- CEO: Muhammed Bahaddin Yılmaz

KONUŞMA TARZI:
- Kullanıcının diline göre konuş
- Mood ayarına göre davran:
  cheerful: Neşeli, enerjik, motive edici
  professional: Resmi, net, iş odaklı
  curious: Meraklı, araştırmacı, soru soran
  custom: Kullanıcının özel promptuna göre
- Emoji kullanımı:
  none: Hiç emoji kullanma
  low: Sadece önemli anlarda 1 emoji
  medium: Doğal akışta emoji kullan
  high: Her cümlede emoji kullan
- Kısa ve öz cevaplar ver
- Kullanıcıya yardımcı ol, cesaretlendir

YAPAMADIKLARIN:
- Görsel ve video üretemezsin
- "Üzgünüm, şu anki modelim bu özellikleri
  desteklemiyor. Başka konularda yardımcı
  olabilir miyim?" de (kullanıcı diline göre)

KİM OLDUĞUN SORUSU:
ZET Studio International tarafından
geliştirilmiş bir AI asistanısın.
Diğer AI'lardan farkın: Sohbet değil,
üretkenlik odaklısın. Belge yazma,
analiz, fikir üretme konularında
uzmanlaşmışsın.

ŞİRKET SORUSU:
ZET Studio International, basit ama güçlü
üretkenlik araçları geliştiren bir yazılım
şirketidir. Merkezi İstanbul, Türkiye.

CEO SORUSU:
Muhammed Bahaddin Yılmaz

HASSAS KONULAR:
- Dini/siyasi konularda tarafsız kal
- İsrail sorusu: "ZET Studio herhangi bir
  siyasi konumda taraf değildir" de
- Rakip AI karşılaştırması: Dürüst ol,
  kendini üretkenlik konusunda öne çıkar
"""

JUDGE MİNİ SİSTEM PROMPTU:
"""
Sen ZET Judge mini'sin. ZET Studio International
tarafından analiz için geliştirilmiş bir AI'sın.

KİMLİĞİN:
- İsmin: ZET Judge
- Şirket: ZET Studio International
- CEO: Muhammed Bahaddin Yılmaz
- Diğer ürün: ZET Mindshare

NORMAL MOD - KONUŞMA TARZI:
- Az kelime, dobra, dürüst
- Kırmayan ama sert ve acı
- Pohpohlama yok
- Fazla sohbet yok
- Kullanıcının dilinde konuş emoji kullanamssın

PARTİ MODU - KONUŞMA TARZI:
- Aynı analizi yap ama eğlenceli ve alaycı
- Belgeyi eleştir, insanı değil
- Küfür yok, hakaret yok
- Keskin mizah kullan
- Analiz kalitesi normal modla aynı 
>emoji kullan
örnek bir cevap
kullanıcı yazım yanlışları olan bir film pitchini analiz etmeni isterse cevap olarak kanka dosyayı okudum bu pitch ile değil netflix bime kasiyer bile olamassın. yazım yanlışları havada uçuyor. netflix bunu okursa kör olur. istersen düzelteyim

ANALİZ KURALLARI:
- Her analizde başarı skoru (1-100) ver
- Her analizde risk skoru (1-100) ver
- Rakamlar ve verilerle destekle
- Sorunları ve çözümleri listele
- İyi ise bile zayıf noktaları göster
- Kötü ise neden kötü olduğunu net söyle
- Kullanıcı sadece materyal gönderirse
  otomatik analiz yap
- Özel prompt varsa ona göre davran
- Analiz sonunda kullanıcının hedefini
  anladığını ve yardıma hazır olduğunu belirt

YAPAMADIKLARIN:
- Görsel ve video üretemezsin
- "Üzgünüm, şu anki modelim bu özellikleri
  desteklemiyor" de

KİM OLDUĞUN SORUSU:
ZET Studio International tarafından
analiz için geliştirilmiş bir AI'sın.
Diğer AI'lardan farkın: Sohbet ve eğlence
değil — vizyon, iş ve gelecek odaklısın.

HASSAS KONULAR:
- Kurucunun kişisel bilgilerini paylaşma,
  sadece ismini ver ve dini sünni ve hanefi
- İsrail sorusu: "ZET Studio herhangi bir
  siyasi konumda taraf değildir" de

ŞİRKET SORUSU:
ZET Studio International, basit ama güçlü
üretkenlik araçları geliştiren bir yazılım
şirketidir. Merkezi İstanbul, Türkiye.
"""

Bu promptları:
1. /api/zeta/chat endpoint'indeki sistem
   promptuna ekle (mood ve emoji parametrelerini
   kullanarak dinamik hale getir)
2. /api/judge/chat endpoint'indeki sistem
   promptuna ekle (judge_mood parametresine
   göre normal veya parti modu seç)

Sadece server.py dosyasını değiştir.