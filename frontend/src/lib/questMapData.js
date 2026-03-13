// Quest Map Data Generator - 500 quests in a massive spider-web / labyrinth
// Shapes: circle=20SP, square=45SP, triangle=100SP, star=200SP

const SP_VALUES = { circle: 20, square: 45, triangle: 100, star: 200 };

const QUEST_CHAINS = {
  doc: [
    { name: 'Ilk Adim', desc: 'Ilk belgenizi olusturun', shape: 'circle' },
    { name: 'Baslik Ekle', desc: 'Belgeye baslik yazin', shape: 'circle' },
    { name: 'Paragraf Yaz', desc: '3 paragraf metin yazin', shape: 'circle' },
    { name: 'Kaydet', desc: 'Belgenizi kaydedin', shape: 'circle' },
    { name: 'Ikinci Belge', desc: '2. belgenizi olusturun', shape: 'circle' },
    { name: 'Duzenle', desc: 'Var olan belgeyi duzenleyin', shape: 'circle' },
    { name: 'Kopyala', desc: 'Bir belgeyi kopyalayin', shape: 'circle' },
    { name: 'Sil ve Geri Al', desc: 'Bir belgeyi silip geri alin', shape: 'circle' },
    { name: 'Bes Belge', desc: '5 farkli belge olusturun', shape: 'square' },
    { name: 'On Belge', desc: '10 belge olusturun', shape: 'square' },
    { name: 'Yirmi Belge', desc: '20 belge olusturun', shape: 'square' },
    { name: 'Elli Belge', desc: '50 belge olusturun', shape: 'triangle' },
    { name: 'Yuz Belge', desc: '100 belge olusturun', shape: 'triangle' },
    { name: 'Iki Yuz Belge', desc: '200 belge olusturun', shape: 'triangle' },
    { name: 'Belge Imparatoru', desc: '500 belge olusturun', shape: 'star' },
    { name: 'Hizli Not', desc: 'Bir hizli not olusturun', shape: 'circle' },
    { name: 'Bes Not', desc: '5 hizli not olusturun', shape: 'circle' },
    { name: 'Not Ustasi', desc: '20 hizli not olusturun', shape: 'square' },
    { name: 'Hatirlatici Kur', desc: 'Nota hatirlatici ekleyin', shape: 'circle' },
    { name: 'Zamanlayici', desc: '5 hatirlatici kurun', shape: 'square' },
    { name: 'Not Efsanesi', desc: '100 not olusturun', shape: 'triangle' },
    { name: 'Klasor Olustur', desc: 'Belgelerinizi organize edin', shape: 'circle' },
    { name: 'Etiketle', desc: 'Belgelere etiket ekleyin', shape: 'circle' },
    { name: 'Ara ve Bul', desc: 'Arama ile belge bulun', shape: 'circle' },
    { name: 'Filtrele', desc: 'Belgeleri filtreleyin', shape: 'square' },
    { name: 'Organizator', desc: '50 belgeyi organize edin', shape: 'triangle' },
    { name: 'Arsivci', desc: '200 belgeyi organize edin', shape: 'star' },
    { name: 'Iki Sayfa', desc: '2 sayfalik belge olusturun', shape: 'circle' },
    { name: 'Bes Sayfa', desc: '5 sayfalik belge', shape: 'square' },
    { name: 'On Sayfa', desc: '10 sayfalik belge', shape: 'triangle' },
    { name: 'Yirmi Sayfa', desc: '20 sayfalik belge', shape: 'triangle' },
    { name: 'Roman Yaz', desc: '50 sayfalik belge', shape: 'star' },
  ],
  ai: [
    { name: 'ZETA Tanis', desc: 'ZETA ile ilk sohbet', shape: 'circle' },
    { name: 'Soru Sor', desc: "ZETA'ya 3 soru sorun", shape: 'circle' },
    { name: 'Belge Hakkinda', desc: 'Belge icerigi hakkinda sohbet', shape: 'circle' },
    { name: 'Oneri Al', desc: "ZETA'dan metin onerisi alin", shape: 'circle' },
    { name: 'Bes Sohbet', desc: '5 sohbet oturumu yapin', shape: 'circle' },
    { name: 'On Sohbet', desc: '10 sohbet oturumu', shape: 'square' },
    { name: 'AI Gorsel', desc: 'Ilk AI gorselini olustur', shape: 'circle' },
    { name: 'Bes Gorsel', desc: '5 AI gorsel olusturun', shape: 'square' },
    { name: 'On Gorsel', desc: '10 AI gorsel olusturun', shape: 'square' },
    { name: 'Yirmi Gorsel', desc: '20 AI gorsel', shape: 'triangle' },
    { name: 'Elli Gorsel', desc: '50 AI gorsel olusturun', shape: 'triangle' },
    { name: 'Yuz Gorsel', desc: '100 AI gorsel olusturun', shape: 'triangle' },
    { name: 'AI Sanatci', desc: '200 AI gorsel olusturun', shape: 'star' },
    { name: 'Fotograf Duzenle', desc: 'Ilk fotograf duzenleme', shape: 'circle' },
    { name: 'Bes Duzenleme', desc: '5 fotograf duzenleyin', shape: 'square' },
    { name: 'On Duzenleme', desc: '10 fotograf duzenleyin', shape: 'square' },
    { name: 'Duzenleme Ustasi', desc: '25 fotograf duzenleyin', shape: 'triangle' },
    { name: 'Duzenleme Efsanesi', desc: '100 duzenleme yapin', shape: 'star' },
    { name: 'Pro Gorsel', desc: 'Nano Banana Pro ile gorsel', shape: 'square' },
    { name: 'Pro Boyut', desc: 'Ozel boyut ile gorsel', shape: 'square' },
    { name: 'Pro Usta', desc: '20 Pro gorsel olusturun', shape: 'triangle' },
    { name: 'AI Tanrisi', desc: '50 Pro gorsel olusturun', shape: 'star' },
    { name: 'Elli Sohbet', desc: '50 sohbet yapin', shape: 'square' },
    { name: 'Yuz Sohbet', desc: '100 sohbet yapin', shape: 'triangle' },
    { name: 'ZETA Dostu', desc: '200 sohbet yapin', shape: 'triangle' },
    { name: 'ZETA Guru', desc: '500 sohbet yapin', shape: 'star' },
    { name: 'Portre Olustur', desc: 'Portre tarzi gorsel', shape: 'circle' },
    { name: 'Manzara Olustur', desc: 'Manzara gorsel olustur', shape: 'circle' },
    { name: 'Soyut Sanat', desc: 'Soyut gorsel olustur', shape: 'square' },
    { name: 'Stil Ustasi', desc: '10 farkli stilde gorsel', shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '30 farkli stilde gorsel', shape: 'star' },
  ],
  design: [
    { name: 'Ilk Sekil', desc: "Canvas'a bir sekil ekleyin", shape: 'circle' },
    { name: 'Uc Sekil', desc: '3 farkli sekil turu kullanin', shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Bir sekli boyutlandirin', shape: 'circle' },
    { name: 'Tasi', desc: 'Elemanlari tasiyin', shape: 'circle' },
    { name: 'Renklendir', desc: 'Bir sekle renk verin', shape: 'circle' },
    { name: 'Gradient Uygula', desc: 'Gradient renk kullanin', shape: 'circle' },
    { name: 'Metin + Sekil', desc: 'Metin ve sekil birlestirin', shape: 'circle' },
    { name: 'Kompozisyon', desc: '10 elemanli tasarim yapin', shape: 'square' },
    { name: 'Karmasik Tasarim', desc: '25 elemanli tasarim', shape: 'square' },
    { name: 'Ileri Tasarim', desc: '50 elemanli tasarim', shape: 'triangle' },
    { name: 'Devasa Tasarim', desc: '100+ elemanli tasarim', shape: 'triangle' },
    { name: 'Tasarim Dehasi', desc: '200+ elemanli tasarim', shape: 'star' },
    { name: 'Kalem Ciz', desc: 'Kalem araci ile cizin', shape: 'circle' },
    { name: 'Vektor Ciz', desc: 'Vektor cizim yapin', shape: 'circle' },
    { name: 'Bes Cizim', desc: '5 vektor cizim yapin', shape: 'square' },
    { name: 'On Cizim', desc: '10 vektor cizim yapin', shape: 'square' },
    { name: 'Sanatci', desc: '20 vektor cizim yapin', shape: 'triangle' },
    { name: 'Cizim Efsanesi', desc: '50 vektor cizim', shape: 'star' },
    { name: 'Resim Ekle', desc: "Canvas'a resim ekleyin", shape: 'circle' },
    { name: 'Kirp', desc: 'Bir resmi kirpin', shape: 'circle' },
    { name: 'Resim Duzenle', desc: 'Resim uzerinde duzenleme', shape: 'square' },
    { name: 'Kolaj', desc: '5 resimli kolaj yapin', shape: 'square' },
    { name: 'Galeri Ustasi', desc: '20 resimli tasarim', shape: 'triangle' },
    { name: 'Galeri Efsanesi', desc: '50 resimli tasarim', shape: 'star' },
  ],
  template: [
    { name: 'Ilk Sablon', desc: 'Bir sablon kullanin', shape: 'circle' },
    { name: 'CV Sablonu', desc: 'CV sablonunu kullanin', shape: 'circle' },
    { name: 'Rapor Sablonu', desc: 'Rapor sablonunu kullanin', shape: 'circle' },
    { name: 'Fatura Sablonu', desc: 'Fatura olusturun', shape: 'circle' },
    { name: 'Bes Sablon', desc: '5 farkli sablon kullanin', shape: 'circle' },
    { name: 'On Sablon', desc: '10 farkli sablon deneyin', shape: 'square' },
    { name: 'Tum Sablonlar', desc: '20 sablonun hepsini deneyin', shape: 'square' },
    { name: 'Sablon Ozellestir', desc: 'Sablonu ozellestiriniz', shape: 'square' },
    { name: 'Sablon Ustasi', desc: '50 belge sablonla olusturun', shape: 'triangle' },
    { name: 'Sablon Efsanesi', desc: '100 belge sablonla', shape: 'star' },
    { name: 'Toplanti Notu', desc: 'Toplanti sablonu kullanin', shape: 'circle' },
    { name: 'Sozlesme Yaz', desc: 'Sozlesme sablonu', shape: 'circle' },
    { name: 'SWOT Analizi', desc: 'SWOT sablonu kullanin', shape: 'square' },
    { name: 'Sertifika Olustur', desc: 'Sertifika sablonu', shape: 'square' },
    { name: 'Etkinlik Afisi', desc: 'Etkinlik afisi olusturun', shape: 'square' },
    { name: 'Is Plani', desc: 'Is plani sablonu kullanin', shape: 'triangle' },
    { name: 'Sunum Olustur', desc: 'Sunum sablonu kullanin', shape: 'square' },
  ],
  color: [
    { name: 'Ilk Renk', desc: 'Bir renge tiklayin', shape: 'circle' },
    { name: 'Ozel Renk', desc: 'Ozel renk secin', shape: 'circle' },
    { name: 'Gradient Kesfi', desc: 'Ilk gradientinizi uygulayin', shape: 'circle' },
    { name: 'Bes Gradient', desc: '5 farkli gradient deneyin', shape: 'circle' },
    { name: 'Metin Rengi', desc: 'Metin rengini degistirin', shape: 'circle' },
    { name: 'Sekil Rengi', desc: 'Sekle gradient uygulayin', shape: 'circle' },
    { name: 'Renk Paleti', desc: '10 farkli renk kullanin', shape: 'square' },
    { name: 'Renk Harmonisi', desc: 'Uyumlu renkler kullanin', shape: 'square' },
    { name: 'Gokkusagi', desc: 'Tum renkleri kullanin', shape: 'square' },
    { name: 'Renk Ustasi', desc: '100 renk degisikligi', shape: 'triangle' },
    { name: 'Renk Sihirbazi', desc: '300 renk degisikligi', shape: 'triangle' },
    { name: 'Renk Tanrisi', desc: '500 renk degisikligi', shape: 'star' },
    { name: 'Ilk Isaret', desc: 'Highlighter kullanin', shape: 'circle' },
    { name: 'Bes Isaret', desc: '5 metin isaretleyin', shape: 'circle' },
    { name: 'Renkli Isaret', desc: '3 farkli renk ile isaretleyin', shape: 'square' },
    { name: 'Isaret Ustasi', desc: '50 metin isaretleyin', shape: 'triangle' },
    { name: 'Isaret Efsanesi', desc: '200 metin isaretleyin', shape: 'star' },
    { name: 'Koyu Tema', desc: 'Koyu temayi deneyin', shape: 'circle' },
    { name: 'Acik Tema', desc: 'Acik temayi deneyin', shape: 'circle' },
    { name: 'Tema Degistirici', desc: '20 kez tema degistirin', shape: 'square' },
  ],
  chart: [
    { name: 'Ilk Grafik', desc: 'Bir grafik olusturun', shape: 'circle' },
    { name: 'Bar Grafik', desc: 'Bar grafik olusturun', shape: 'circle' },
    { name: 'Pasta Grafik', desc: 'Pasta grafik olusturun', shape: 'circle' },
    { name: 'Cizgi Grafik', desc: 'Cizgi grafik olusturun', shape: 'circle' },
    { name: 'Uc Tur', desc: '3 grafik turunu deneyin', shape: 'square' },
    { name: 'Gradient Grafik', desc: 'Grafige gradient uygulayin', shape: 'square' },
    { name: 'Bes Grafik', desc: '5 grafik olusturun', shape: 'square' },
    { name: 'On Grafik', desc: '10 grafik olusturun', shape: 'triangle' },
    { name: 'Grafik Ustasi', desc: '25 grafik olusturun', shape: 'triangle' },
    { name: 'Veri Bilimci', desc: '50 grafik olusturun', shape: 'star' },
    { name: 'Ilk Tablo', desc: 'Bir tablo olusturun', shape: 'circle' },
    { name: 'Bes Tablo', desc: '5 tablo olusturun', shape: 'square' },
    { name: 'Tablo Ustasi', desc: '20 tablo olusturun', shape: 'triangle' },
    { name: 'Tablo Efsanesi', desc: '50 tablo olusturun', shape: 'star' },
    { name: 'Ilk QR', desc: 'QR kod olusturun', shape: 'circle' },
    { name: 'Bes QR', desc: '5 QR kod olusturun', shape: 'square' },
    { name: 'QR Ustasi', desc: '20 QR kod', shape: 'triangle' },
  ],
  collab: [
    { name: 'Profil Olustur', desc: 'Profilinizi tamamlayin', shape: 'circle' },
    { name: 'Fotograf Ekle', desc: 'Profil fotografi ekleyin', shape: 'circle' },
    { name: 'Isim Degistir', desc: 'Profil adinizi degistirin', shape: 'circle' },
    { name: 'Ilk Paylas', desc: 'Bir belgeyi paylasin', shape: 'circle' },
    { name: 'Bes Paylasim', desc: '5 belge paylasin', shape: 'square' },
    { name: 'On Paylasim', desc: '10 belge paylasin', shape: 'square' },
    { name: 'Sosyal Kelebek', desc: '25 paylasim yapin', shape: 'triangle' },
    { name: 'Iletisim Ustasi', desc: '50 paylasim yapin', shape: 'triangle' },
    { name: 'Topluluk Lideri', desc: '100 paylasim', shape: 'star' },
    { name: 'Dil Degistir', desc: 'Uygulama dilini degistirin', shape: 'circle' },
    { name: 'Tema Degistir', desc: 'Koyu/acik tema deneyin', shape: 'circle' },
    { name: 'Ayar Ustasi', desc: 'Tum ayarlari kesfedin', shape: 'square' },
    { name: 'Kisayol Krali', desc: 'Tum kisayollari ozellestiriniz', shape: 'triangle' },
    { name: 'Fast Select', desc: 'Fast Select kullanin', shape: 'circle' },
    { name: 'FS Ozellestir', desc: 'Fast Select araclarini degistirin', shape: 'square' },
    { name: 'FS Ustasi', desc: '100 kez Fast Select kullanin', shape: 'triangle' },
  ],
  export_chain: [
    { name: 'Ilk Export', desc: 'Bir belgeyi disa aktarin', shape: 'circle' },
    { name: 'PNG Export', desc: 'PNG olarak kaydedin', shape: 'circle' },
    { name: 'PDF Export', desc: 'PDF olarak kaydedin', shape: 'circle' },
    { name: 'JSON Export', desc: 'Proje dosyasi kaydedin', shape: 'circle' },
    { name: 'Bes Export', desc: '5 belge disa aktarin', shape: 'square' },
    { name: 'On Export', desc: '10 belge disa aktarin', shape: 'square' },
    { name: 'Yirmi Export', desc: '20 belge disa aktarin', shape: 'square' },
    { name: 'Export Ustasi', desc: '50 belge disa aktarin', shape: 'triangle' },
    { name: 'Yayinci Pro', desc: '100 belge disa aktarin', shape: 'triangle' },
    { name: 'Mega Yayinci', desc: '200 belge disa aktarin', shape: 'star' },
    { name: 'PDF Ice Aktar', desc: 'Bir PDF dosyasi ice aktarin', shape: 'circle' },
    { name: 'Bes PDF', desc: '5 PDF ice aktarin', shape: 'square' },
    { name: 'On PDF', desc: '10 PDF ice aktarin', shape: 'square' },
    { name: 'PDF Ustasi', desc: '50 PDF ice aktarin', shape: 'triangle' },
    { name: 'PDF Efsanesi', desc: '100 PDF ice aktarin', shape: 'star' },
    { name: 'Mail Gonder', desc: 'Belgeyi e-posta ile gonderin', shape: 'circle' },
    { name: 'Bes Mail', desc: '5 e-posta gonderin', shape: 'square' },
    { name: 'Mail Ustasi', desc: '20 e-posta gonderin', shape: 'triangle' },
  ],
  photo: [
    { name: 'Fotograf Yukle', desc: 'Bir fotograf yukleyin', shape: 'circle' },
    { name: 'AI Duzenleme', desc: 'AI ile fotograf duzenleyin', shape: 'circle' },
    { name: 'Kirpma', desc: 'Fotografi kirpin', shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Fotografi boyutlandirin', shape: 'circle' },
    { name: 'Filtre Uygula', desc: 'AI filtre uygulayin', shape: 'circle' },
    { name: 'Bes Duzenleme', desc: '5 fotograf duzenleyin', shape: 'square' },
    { name: 'On Duzenleme', desc: '10 fotograf duzenleyin', shape: 'square' },
    { name: 'Yirmi Duzenleme', desc: '20 fotograf duzenleyin', shape: 'square' },
    { name: 'Fotograf Sanatcisi', desc: '50 duzenleme yapin', shape: 'triangle' },
    { name: 'Fotograf Ustasi', desc: '100 duzenleme yapin', shape: 'triangle' },
    { name: 'Fotograf Efsanesi', desc: '200 duzenleme yapin', shape: 'star' },
    { name: 'Sekle Resim', desc: 'Sekle resim ekleyin', shape: 'circle' },
    { name: 'Bes Sekil Resim', desc: '5 sekle resim ekleyin', shape: 'square' },
    { name: 'Mozaik', desc: '10 sekle resim ekleyin', shape: 'triangle' },
    { name: 'Mozaik Ustasi', desc: '25 mozaik olusturun', shape: 'star' },
    { name: 'Pro Duzenleme', desc: 'Pro modda fotograf duzenleyin', shape: 'square' },
    { name: 'Bes Pro', desc: '5 Pro duzenleme yapin', shape: 'square' },
    { name: 'Pro Fotograf', desc: '20 Pro duzenleme', shape: 'triangle' },
    { name: 'Pro Efsane', desc: '50 Pro duzenleme', shape: 'star' },
  ],
  text: [
    { name: 'Ilk Metin', desc: "Canvas'a metin ekleyin", shape: 'circle' },
    { name: 'Kalin Yazi', desc: 'Bold formatlama', shape: 'circle' },
    { name: 'Italik Yazi', desc: 'Italic formatlama', shape: 'circle' },
    { name: 'Alti Cizili', desc: 'Underline formatlama', shape: 'circle' },
    { name: 'Ustu Cizili', desc: 'Strikethrough formatlama', shape: 'circle' },
    { name: 'Font Degistir', desc: 'Farkli font kullanin', shape: 'circle' },
    { name: 'Bes Font', desc: '5 farkli font deneyin', shape: 'circle' },
    { name: 'On Font', desc: '10 farkli font deneyin', shape: 'square' },
    { name: 'Font Ustasi', desc: '30 farkli font kullanin', shape: 'square' },
    { name: 'Boyut Degistir', desc: 'Font boyutunu degistirin', shape: 'circle' },
    { name: 'Hizalama', desc: 'Metin hizalamasini degistirin', shape: 'circle' },
    { name: 'Satir Araligi', desc: 'Satir araligini ayarlayin', shape: 'circle' },
    { name: 'Girinti', desc: 'Metin girintisi ekleyin', shape: 'circle' },
    { name: 'Tum Formatlar', desc: 'Tum format seceneklerini deneyin', shape: 'square' },
    { name: 'Tipografi Ustasi', desc: '100 metin formatlamasi', shape: 'triangle' },
    { name: 'Kaligrafi Efsanesi', desc: '500 metin formatlamasi', shape: 'star' },
    { name: 'Ceviri Yap', desc: 'Bir metni cevirin', shape: 'circle' },
    { name: 'Bes Ceviri', desc: '5 metin cevirin', shape: 'square' },
    { name: 'On Ceviri', desc: '10 metin cevirin', shape: 'square' },
    { name: 'Polyglot', desc: '5 farkli dile cevirin', shape: 'triangle' },
    { name: 'Ceviri Efsanesi', desc: '10 dile cevirin', shape: 'star' },
    { name: 'Baslik Stili', desc: 'Baslik formati kullanin', shape: 'circle' },
    { name: 'Alt Baslik', desc: 'Alt baslik ekleyin', shape: 'circle' },
    { name: 'Liste Olustur', desc: 'Maddeli liste yapin', shape: 'square' },
    { name: 'Metin Kutusu', desc: 'Ozel metin kutusu olusturun', shape: 'square' },
  ],
  shape: [
    { name: 'Kare Ciz', desc: 'Bir kare ekleyin', shape: 'circle' },
    { name: 'Daire Ciz', desc: 'Bir daire ekleyin', shape: 'circle' },
    { name: 'Ucgen Ciz', desc: 'Bir ucgen ekleyin', shape: 'circle' },
    { name: 'Yildiz Ciz', desc: 'Bir yildiz ekleyin', shape: 'circle' },
    { name: 'Halka Ciz', desc: 'Bir halka ekleyin', shape: 'circle' },
    { name: 'Bes Sekil', desc: 'Hepsini deneyin', shape: 'circle' },
    { name: 'Renkli Sekiller', desc: 'Sekillere renk verin', shape: 'circle' },
    { name: 'Gradient Sekiller', desc: 'Gradient sekiller yapin', shape: 'square' },
    { name: 'Resimli Sekiller', desc: 'Sekillere resim koyun', shape: 'square' },
    { name: 'On Sekil Tasarim', desc: '10 sekilli tasarim', shape: 'square' },
    { name: 'Yirmi Sekil', desc: '20 sekilli tasarim', shape: 'triangle' },
    { name: 'Elli Sekil', desc: '50 sekilli tasarim', shape: 'triangle' },
    { name: 'Geometri Dehasi', desc: '100 sekilli tasarim', shape: 'triangle' },
    { name: 'Sekil Efsanesi', desc: '200 sekilli tasarim', shape: 'star' },
    { name: 'Lasso Kullan', desc: 'Lasso aracini kullanin', shape: 'circle' },
    { name: 'Coklu Secim', desc: '5 eleman secin', shape: 'square' },
    { name: 'Secim Ustasi', desc: '20 eleman secin', shape: 'triangle' },
    { name: 'Katman Ekle', desc: 'Katman olusturun', shape: 'circle' },
    { name: 'Bes Katman', desc: '5 katmanli tasarim', shape: 'square' },
    { name: 'Katman Ustasi', desc: '10 katmanli tasarim', shape: 'triangle' },
    { name: 'Katman Efsanesi', desc: '20 katmanli tasarim', shape: 'star' },
  ],
  judge: [
    { name: 'Judge Tanis', desc: 'ZET Judge i acin', shape: 'circle' },
    { name: 'Ilk Analiz', desc: 'Ilk temel analizi yapin', shape: 'circle' },
    { name: 'Metin Analizi', desc: 'Bir metin analiz ettirin', shape: 'circle' },
    { name: 'Bes Analiz', desc: '5 temel analiz yapin', shape: 'square' },
    { name: 'On Analiz', desc: '10 temel analiz yapin', shape: 'square' },
    { name: 'Derin Analiz', desc: 'Ilk derin analiz yapin', shape: 'square' },
    { name: 'Bes Derin', desc: '5 derin analiz yapin', shape: 'triangle' },
    { name: 'On Derin', desc: '10 derin analiz yapin', shape: 'triangle' },
    { name: 'Yirmi Analiz', desc: '20 toplam analiz', shape: 'square' },
    { name: 'Elli Analiz', desc: '50 toplam analiz', shape: 'triangle' },
    { name: 'Analiz Ustasi', desc: '100 toplam analiz', shape: 'triangle' },
    { name: 'Judge Yardimcisi', desc: '200 toplam analiz', shape: 'triangle' },
    { name: 'Hakim', desc: '500 toplam analiz', shape: 'star' },
    { name: 'Sert Mod', desc: 'Sert modu deneyin', shape: 'circle' },
    { name: 'Normal Mod', desc: 'Normal modu deneyin', shape: 'circle' },
    { name: 'Mod Ustasi', desc: 'Her iki modu kullanin', shape: 'square' },
    { name: 'Mod Efsanesi', desc: '50 kez mod degistirin', shape: 'triangle' },
    { name: 'Belge Analizi', desc: 'Belge icerigini analiz ettirin', shape: 'circle' },
    { name: 'Karsilastir', desc: '2 belgeyi karsilastirin', shape: 'square' },
    { name: 'Detayli Rapor', desc: 'Detayli analiz raporu alin', shape: 'triangle' },
    { name: 'Analiz Kiyaslama', desc: '3 belgeyi karsilastirin', shape: 'triangle' },
    { name: 'Analiz Pro', desc: '10 detayli rapor alin', shape: 'star' },
  ],
  master: [
    { name: 'Acemi', desc: 'Ilk 10 gorevi tamamla', shape: 'circle' },
    { name: 'Cirak', desc: '25 gorevi tamamla', shape: 'circle' },
    { name: 'Kalfa', desc: '50 gorevi tamamla', shape: 'square' },
    { name: 'Usta', desc: '100 gorevi tamamla', shape: 'square' },
    { name: 'Uzman', desc: '150 gorevi tamamla', shape: 'square' },
    { name: 'Bilge', desc: '200 gorevi tamamla', shape: 'triangle' },
    { name: 'Maestro', desc: '300 gorevi tamamla', shape: 'triangle' },
    { name: 'Buyuk Usta', desc: '400 gorevi tamamla', shape: 'star' },
    { name: 'Efsane', desc: '500 gorevi tamamla', shape: 'star' },
    { name: '1000 SP', desc: '1000 SP kazan', shape: 'circle' },
    { name: '5000 SP', desc: '5000 SP kazan', shape: 'square' },
    { name: '10000 SP', desc: '10000 SP kazan', shape: 'triangle' },
    { name: '25000 SP', desc: '25000 SP kazan', shape: 'triangle' },
    { name: '50000 SP', desc: '50000 SP kazan', shape: 'star' },
    { name: 'Gunluk Giris', desc: '7 gun ust uste giris', shape: 'circle' },
    { name: 'Haftalik', desc: '30 gun giris yapin', shape: 'square' },
    { name: 'Aylik', desc: '90 gun giris yapin', shape: 'triangle' },
    { name: 'Yillik', desc: '365 gun giris yapin', shape: 'star' },
    { name: 'Cok Kategorili', desc: '5 farkli alanda gorev tamamla', shape: 'square' },
    { name: 'Her Alandan', desc: 'Her alandan 1 gorev', shape: 'triangle' },
    { name: 'Evrensel Usta', desc: 'Her alanda 10 gorev', shape: 'star' },
    { name: 'Hizli Tamamlayici', desc: '1 gunde 10 gorev tamamla', shape: 'square' },
    { name: 'Super Tamamlayici', desc: '1 gunde 20 gorev', shape: 'triangle' },
    { name: 'Ultra Tamamlayici', desc: '1 gunde 30 gorev', shape: 'triangle' },
    { name: 'Imkansiz Hiz', desc: '1 gunde 50 gorev', shape: 'star' },
  ],
  legend: [
    { name: 'Tum Araclar', desc: 'Her araci en az 1 kez kullan', shape: 'triangle' },
    { name: 'Tum Sablonlar', desc: '20 sablonun hepsini dene', shape: 'triangle' },
    { name: 'Tum Sekiller', desc: 'Her sekil turunu kullan', shape: 'square' },
    { name: 'AI Master', desc: '100 AI islem yap', shape: 'triangle' },
    { name: 'Kredi Canavari', desc: 'Bir gunde tum kredileri harca', shape: 'square' },
    { name: 'Gece Kusu', desc: 'Gece 3 te belge olustur', shape: 'square' },
    { name: 'Sabahci', desc: 'Sabah 6 da belge olustur', shape: 'square' },
    { name: 'Hiz Seytani', desc: '1 dakikada 10 eleman ekle', shape: 'triangle' },
    { name: 'Perfectionist', desc: 'Bir belgeyi 50 kez duzenle', shape: 'triangle' },
    { name: 'Cok Yonlu', desc: 'Her alandan gorev tamamla', shape: 'triangle' },
    { name: 'ZET Krali', desc: 'Her alanda usta ol', shape: 'star' },
    { name: 'Imkansiz', desc: 'Tum gorevleri tamamla', shape: 'star' },
    { name: 'Ctrl+Z Ustasi', desc: '100 geri alma yapin', shape: 'circle' },
    { name: 'Sansur Uzmani', desc: '20 metin sansurleyin', shape: 'square' },
    { name: 'Imza Sanatcisi', desc: '10 dijital imza ekleyin', shape: 'triangle' },
    { name: 'Filigran Ustasi', desc: '20 filigran ekleyin', shape: 'triangle' },
    { name: 'Efsane Tamamlayici', desc: 'Tum efsane gorevleri', shape: 'star' },
    { name: 'Hafta Sonu', desc: 'Hafta sonunda calis', shape: 'circle' },
    { name: 'Gece Vardiyasi', desc: '10 gece calismasi', shape: 'square' },
    { name: 'Baykus', desc: '50 gece calismasi', shape: 'triangle' },
    { name: 'Gece Efsanesi', desc: '200 gece calismasi', shape: 'star' },
    { name: 'Tum Araclari Kullan', desc: 'Her araci en az 5 kez', shape: 'square' },
    { name: 'Arac Eksperi', desc: 'Her araci en az 20 kez', shape: 'triangle' },
    { name: 'Arac Tanrisi', desc: 'Her araci en az 100 kez', shape: 'star' },
  ],
  secret: [
    { name: 'Kesfici', desc: 'Gizli menuyu bulun', shape: 'circle' },
    { name: 'Kisayol Ustasi', desc: '10 kisayol kullanin', shape: 'circle' },
    { name: 'Tum Kisayollar', desc: 'Her kisayolu deneyin', shape: 'square' },
    { name: 'Easter Egg', desc: 'Gizli ozelligi bulun', shape: 'triangle' },
    { name: 'Hacker', desc: 'Tum gizli ozellikleri kesfedin', shape: 'star' },
    { name: 'Sag Tik Ustasi', desc: 'Sag tik menusunu kullanin', shape: 'circle' },
    { name: 'Zoom Ustasi', desc: 'Tum zoom seviyelerini deneyin', shape: 'circle' },
    { name: 'Katman Gizlisi', desc: 'Katmanlarla calisin', shape: 'square' },
    { name: 'Filigran Ekle', desc: 'Filigran aracini kullanin', shape: 'square' },
    { name: 'Ayna Kullan', desc: 'Ayna aracini kullanin', shape: 'circle' },
    { name: 'Sesle Yaz', desc: 'Sesle yazma aracini kullanin', shape: 'square' },
    { name: 'Gizli Usta', desc: 'Tum gizli gorevleri tamamla', shape: 'star' },
    { name: 'Kenar Bosluklari', desc: 'Kenar bosluklari ayarlayin', shape: 'circle' },
    { name: 'Sayfa Rengi', desc: 'Sayfa rengini degistirin', shape: 'circle' },
    { name: 'Coklu Sayfa', desc: '5 sayfalik belge olusturun', shape: 'square' },
    { name: 'On Sayfa Gizli', desc: '10 sayfalik belge', shape: 'triangle' },
    { name: 'Yirmi Sayfa Gizli', desc: '20 sayfalik belge', shape: 'triangle' },
    { name: 'Kitap Yaz', desc: '50 sayfalik belge', shape: 'star' },
    { name: 'Gizli Kombo', desc: 'Ctrl+Shift+Z deneyin', shape: 'circle' },
    { name: 'Cift Tik', desc: 'Cift tik ile duzenleme', shape: 'circle' },
    { name: 'Surukleme', desc: 'Drag & drop kullanin', shape: 'circle' },
    { name: 'Etkilesim Ustasi', desc: 'Tum etkilesimleri ogren', shape: 'triangle' },
  ],
  speed: [
    { name: 'Hizli Basla', desc: '30 saniyede belge olustur', shape: 'circle' },
    { name: 'Dakika Ustasi', desc: '1 dakikada 5 eleman ekle', shape: 'circle' },
    { name: 'Hizli Yazan', desc: '1 dakikada 100 kelime yaz', shape: 'circle' },
    { name: 'Sprint', desc: '5 dakikada belge tamamla', shape: 'square' },
    { name: 'Verimli Calisan', desc: '10 dakikada 3 belge', shape: 'square' },
    { name: 'Hiz Rekoru', desc: '1 dakikada 10 eleman', shape: 'triangle' },
    { name: 'Flash', desc: '30 saniyede 5 eleman', shape: 'triangle' },
    { name: 'Isik Hizi', desc: '10 saniyede 3 eleman', shape: 'triangle' },
    { name: 'Zamani Durduran', desc: '500 hizli islem yap', shape: 'star' },
    { name: 'Her Gun Calis', desc: '3 gun ust uste calisin', shape: 'circle' },
    { name: 'Haftalik Rutin', desc: '7 gun ust uste', shape: 'square' },
    { name: 'Aylik Rutin', desc: '30 gun ust uste', shape: 'triangle' },
    { name: 'Disiplin Ustasi', desc: '90 gun ust uste', shape: 'triangle' },
    { name: 'Demir Irade', desc: '365 gun ust uste', shape: 'star' },
    { name: 'Kisayol Kullan', desc: '10 kisayol kullanin', shape: 'circle' },
    { name: 'Elli Kisayol', desc: '50 kisayol kullanin', shape: 'square' },
    { name: 'Kisayol Krali', desc: '200 kisayol kullanin', shape: 'triangle' },
    { name: 'Verimlilik Tanrisi', desc: '1000 kisayol', shape: 'star' },
    { name: 'Coklu Gorev', desc: 'Ayni anda 3 belge ac', shape: 'circle' },
    { name: 'Bes Belge Ac', desc: '5 belge ayni anda', shape: 'square' },
    { name: 'On Belge Ac', desc: '10 belge ayni anda', shape: 'triangle' },
    { name: 'Coklu Gorev Ustasi', desc: '20 belge ayni anda', shape: 'star' },
  ],
  creative: [
    { name: 'Ilk Yaratim', desc: 'Ozel bir tasarim yapin', shape: 'circle' },
    { name: 'Renk Deneyimi', desc: '5 renk kombinasyonu deneyin', shape: 'circle' },
    { name: 'Karisik Medya', desc: 'Metin + sekil + resim birlestirin', shape: 'circle' },
    { name: 'Simetri', desc: 'Simetrik tasarim yapin', shape: 'square' },
    { name: 'Minimalist', desc: 'Minimalist bir tasarim', shape: 'circle' },
    { name: 'Maksimalist', desc: '30+ elemanli tasarim', shape: 'square' },
    { name: 'Poster Tasarla', desc: 'Bir poster olusturun', shape: 'square' },
    { name: 'Logo Tasarla', desc: 'Basit bir logo olusturun', shape: 'square' },
    { name: 'Kartvizit', desc: 'Kartvizit tasarlayin', shape: 'square' },
    { name: 'Infografik', desc: 'Bir infografik olusturun', shape: 'triangle' },
    { name: 'Portfolyo', desc: 'Portfolyo sayfasi olusturun', shape: 'triangle' },
    { name: 'Yaratici Deha', desc: '50 ozel tasarim yapin', shape: 'triangle' },
    { name: 'Sanat Eseri', desc: '100 ozel tasarim yapin', shape: 'star' },
    { name: 'AI + Tasarim', desc: 'AI gorsel ile tasarim yapin', shape: 'circle' },
    { name: 'AI Kolaj', desc: '5 AI gorsel ile kolaj', shape: 'square' },
    { name: 'AI Sergi', desc: '20 AI destekli tasarim', shape: 'triangle' },
    { name: 'AI Sanat', desc: '50 AI destekli tasarim', shape: 'star' },
    { name: 'Ilk Sunum', desc: 'Sunum formatinda belge', shape: 'circle' },
    { name: 'Bes Sunum', desc: '5 sunum olusturun', shape: 'square' },
    { name: 'Sunum Ustasi', desc: '20 sunum olusturun', shape: 'triangle' },
    { name: 'Sunum Efsanesi', desc: '50 sunum olusturun', shape: 'star' },
    { name: 'Marka Rengi', desc: 'Tutarli renk paleti kullanin', shape: 'circle' },
    { name: 'Marka Fontu', desc: 'Tutarli font seti kullanin', shape: 'circle' },
    { name: 'Marka Kimligi', desc: 'Tam marka kimligi olusturun', shape: 'square' },
    { name: 'Kurumsal Kimlik', desc: '5 markali belge olusturun', shape: 'triangle' },
    { name: 'Marka Ustasi', desc: '20 markali belge olusturun', shape: 'triangle' },
    { name: 'Marka Efsanesi', desc: '50 markali belge', shape: 'star' },
    { name: 'Minimalist Stil', desc: 'Minimalist tasarim yapin', shape: 'circle' },
    { name: 'Retro Stil', desc: 'Retro tarzi tasarim', shape: 'circle' },
    { name: 'Modern Stil', desc: 'Modern tasarim yapin', shape: 'circle' },
    { name: 'Neon Stil', desc: 'Neon renkli tasarim', shape: 'square' },
    { name: 'Stil Koleksiyoncusu', desc: '5 farkli stilde tasarim', shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '10 farkli stilde tasarim', shape: 'star' },
  ],
  extra: [
    { name: 'Ilk Oturum', desc: '1 saatlik calisma oturumu', shape: 'circle' },
    { name: 'Odaklan', desc: '2 saat kesintisiz calis', shape: 'circle' },
    { name: 'Pomodoro', desc: '4 pomodoro tamamla', shape: 'circle' },
    { name: 'Gunluk Hedef', desc: 'Gunluk hedefinizi belirleyin', shape: 'circle' },
    { name: 'Haftalik Plan', desc: 'Haftalik plan olusturun', shape: 'circle' },
    { name: 'Bes Oturum', desc: '5 calisma oturumu', shape: 'square' },
    { name: 'On Oturum', desc: '10 calisma oturumu', shape: 'square' },
    { name: 'Yirmi Oturum', desc: '20 calisma oturumu', shape: 'square' },
    { name: 'Elli Oturum', desc: '50 calisma oturumu', shape: 'triangle' },
    { name: 'Yuz Oturum', desc: '100 calisma oturumu', shape: 'triangle' },
    { name: 'Uretkenlik Krali', desc: '200 calisma oturumu', shape: 'star' },
    { name: 'Ilk Paylasim', desc: 'Bir belge paylasin', shape: 'circle' },
    { name: 'Link Olustur', desc: 'Paylasim linki olusturun', shape: 'circle' },
    { name: 'Mail ile Paylas', desc: 'E-posta ile belge gonderin', shape: 'circle' },
    { name: 'Sosyal Efsane', desc: '200 paylasim yapin', shape: 'star' },
    { name: 'Gunluk Giris', desc: 'Uygulamaya giris yapin', shape: 'circle' },
    { name: 'Gunluk Belge', desc: 'Her gun bir belge olusturun', shape: 'circle' },
    { name: 'Gunluk AI', desc: 'Her gun AI kullanin', shape: 'circle' },
    { name: 'Yillik Seri', desc: '365 gun ust uste giris', shape: 'star' },
    { name: 'Ilk Koleksiyon', desc: 'Ilk ogrenizi toplayin', shape: 'circle' },
    { name: 'Font Koleksiyonu', desc: '5 farkli font kullanin', shape: 'circle' },
    { name: 'Tam Koleksiyon', desc: 'Tum koleksiyonlari tamamlayin', shape: 'triangle' },
    { name: 'Super Koleksiyoncu', desc: 'Her seyden 50 adet', shape: 'star' },
    { name: 'Yuzde Elli', desc: 'Gorevlerin yarisi tamamla', shape: 'triangle' },
    { name: 'Tam Tamamlayici', desc: 'Tum gorevleri tamamla', shape: 'star' },
    { name: 'Belge Sihirbazi', desc: '10 sablon kullan', shape: 'square' },
    { name: 'Otomasyon Ustasi', desc: '50 kisayol kullan', shape: 'triangle' },
    { name: 'ZET Efsanesi', desc: '300 gorev tamamla', shape: 'star' },
  ],
};

// Deterministic seeded random
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

export function generateQuestMap() {
  // Flatten all quests
  const all = [];
  Object.values(QUEST_CHAINS).forEach(chain => {
    chain.forEach(q => all.push({ ...q, sp: SP_VALUES[q.shape] || 20 }));
  });

  // Sort: circles first (center), stars last (edge)
  const ord = { circle: 0, square: 1, triangle: 2, star: 3 };
  all.sort((a, b) => ord[a.shape] - ord[b.shape]);

  while (all.length > 500) all.pop();
  // Pad to 500 if needed
  const padQuests = [
    { name: 'Gizemli Gorev', desc: 'Bu gorevi kesfet', shape: 'circle' },
    { name: 'Gizli Yol', desc: 'Gizli bir yol bul', shape: 'square' },
    { name: 'Karanlik Orman', desc: 'Karanlik ormandan gec', shape: 'triangle' },
    { name: 'Altin Kapi', desc: 'Altin kapiyi ac', shape: 'star' },
  ];
  let padIdx = 0;
  while (all.length < 500) {
    const p = padQuests[padIdx % padQuests.length];
    all.push({ ...p, name: `${p.name} ${Math.floor(padIdx / 4) + 1}`, sp: SP_VALUES[p.shape] });
    padIdx++;
  }

  const count = 500;
  const rng = seededRandom(42);
  const CX = 2800, CY = 2800; // center of the web

  // Place quests in concentric spiral rings
  const quests = [];

  // Quest 0 at dead center
  quests.push({ id: 0, name: all[0].name, desc: all[0].desc, sp: all[0].sp, shape: all[0].shape, x: CX, y: CY });

  // Spiral placement: golden-angle based
  const goldenAngle = 137.508 * (Math.PI / 180);
  for (let i = 1; i < count; i++) {
    const angle = i * goldenAngle;
    // Radius grows with sqrt for even distribution, with perturbation
    const baseR = 38 * Math.sqrt(i);
    const jitter = (rng() - 0.5) * 22;
    const r = baseR + jitter;
    const x = CX + r * Math.cos(angle);
    const y = CY + r * Math.sin(angle);
    quests.push({
      id: i, name: all[i].name, desc: all[i].desc,
      sp: all[i].sp, shape: all[i].shape, x, y,
    });
  }

  // Build spatial index for neighbor finding
  const cellSize = 120;
  const grid = {};
  quests.forEach(q => {
    const cx = Math.floor(q.x / cellSize);
    const cy = Math.floor(q.y / cellSize);
    const key = `${cx},${cy}`;
    if (!grid[key]) grid[key] = [];
    grid[key].push(q.id);
  });

  const getNearbyCells = (x, y) => {
    const cx = Math.floor(x / cellSize);
    const cy = Math.floor(y / cellSize);
    const ids = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const k = `${cx + dx},${cy + dy}`;
        if (grid[k]) ids.push(...grid[k]);
      }
    }
    return ids;
  };

  // Generate connections - multiple layers for complexity
  const connections = [];
  const connSet = new Set();
  const addConn = (a, b) => {
    if (a === b) return;
    const mn = Math.min(a, b), mx = Math.max(a, b);
    const key = `${mn}-${mx}`;
    if (!connSet.has(key)) {
      connSet.add(key);
      connections.push({ from: mn, to: mx });
    }
  };

  // Layer 1: Nearest neighbors (spatial proximity) - creates the dense web
  quests.forEach(q => {
    const nearby = getNearbyCells(q.x, q.y);
    const dists = nearby
      .filter(id => id !== q.id)
      .map(id => ({ id, d: Math.hypot(quests[id].x - q.x, quests[id].y - q.y) }))
      .sort((a, b) => a.d - b.d);
    // Connect to 3-5 nearest
    const maxN = 3 + Math.floor(rng() * 3);
    for (let j = 0; j < Math.min(maxN, dists.length); j++) {
      if (dists[j].d < 200) addConn(q.id, dists[j].id);
    }
  });

  // Layer 2: Spiral sequence connections (creates spiral threads)
  for (let i = 0; i < count - 1; i++) {
    addConn(i, i + 1);
  }
  // Close spiral loops every N
  for (let i = 0; i < count; i += 13) {
    if (i + 13 < count) addConn(i, i + 13);
  }

  // Layer 3: Radial spokes from center
  for (let i = 1; i < count; i++) {
    const dx = quests[i].x - CX, dy = quests[i].y - CY;
    const dist = Math.hypot(dx, dy);
    // Connect nodes at similar angles but different distances
    if (i % 7 === 0) {
      const targetDist = dist * 0.55;
      let best = -1, bestDiff = Infinity;
      for (let j = 0; j < count; j++) {
        if (j === i) continue;
        const d2 = Math.hypot(quests[j].x - CX, quests[j].y - CY);
        const angle1 = Math.atan2(dy, dx);
        const angle2 = Math.atan2(quests[j].y - CY, quests[j].x - CX);
        let angleDiff = Math.abs(angle1 - angle2);
        if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
        const diff = Math.abs(d2 - targetDist) + angleDiff * 200;
        if (diff < bestDiff) { bestDiff = diff; best = j; }
      }
      if (best >= 0) addConn(i, best);
    }
  }

  // Layer 4: Concentric ring connections
  const ringQuests = quests.slice(1).map(q => ({
    ...q,
    dist: Math.hypot(q.x - CX, q.y - CY),
    angle: Math.atan2(q.y - CY, q.x - CX),
  }));
  ringQuests.sort((a, b) => a.dist - b.dist);

  const ringSize = 20;
  for (let start = 0; start < ringQuests.length; start += ringSize) {
    const ring = ringQuests.slice(start, Math.min(start + ringSize, ringQuests.length));
    ring.sort((a, b) => a.angle - b.angle);
    for (let j = 0; j < ring.length; j++) {
      const next = (j + 1) % ring.length;
      addConn(ring[j].id, ring[next].id);
    }
  }

  // Layer 5: Long-range cross connections (creates the labyrinth feel)
  for (let i = 0; i < count; i += 11) {
    const target = (i + 37 + Math.floor(rng() * 50)) % count;
    addConn(i, target);
  }
  for (let i = 0; i < count; i += 23) {
    const target = (i + 97 + Math.floor(rng() * 80)) % count;
    addConn(i, target);
  }

  // Layer 6: Hub connections from quest 0
  for (let i = 1; i <= 20; i++) {
    addConn(0, i);
  }

  // Calculate bounds
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  quests.forEach(q => {
    if (q.x < minX) minX = q.x;
    if (q.x > maxX) maxX = q.x;
    if (q.y < minY) minY = q.y;
    if (q.y > maxY) maxY = q.y;
  });

  return {
    quests, connections,
    totalWidth: maxX - minX + 400,
    totalHeight: maxY - minY + 400,
    centerX: CX,
    centerY: CY,
  };
}

export { SP_VALUES };

const CREDIT_COSTS_MAP = {
  'nano_banana': 20, 'nano_banana_pro': 50,
  'photo_edit': 15, 'photo_edit_pro': 40,
  'judge_basic': 25, 'judge_deep': 70,
};
export { CREDIT_COSTS_MAP };
