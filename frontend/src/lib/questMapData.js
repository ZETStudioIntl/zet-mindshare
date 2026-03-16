// Quest Map Data Generator - 500 quests in a massive spider-web / labyrinth
// Shapes: circle=20SP, square=45SP, triangle=100SP, star=200SP

const SP_VALUES = { circle: 20, square: 45, triangle: 100, star: 200 };

const QUEST_CHAINS = {
  doc: [
    { name: 'İlk Adım', desc: 'İlk belgenizi oluşturun', shape: 'circle' },
    { name: 'Başlık Ekle', desc: 'Belgeye başlık yazın', shape: 'circle' },
    { name: 'Paragraf Yaz', desc: '3 paragraf metin yazın', shape: 'circle' },
    { name: 'Kaydet', desc: 'Belgenizi kaydedin', shape: 'circle' },
    { name: 'İkinci Belge', desc: '2. belgenizi oluşturun', shape: 'circle' },
    { name: 'Düzenle', desc: 'Var olan belgeyi düzenleyin', shape: 'circle' },
    { name: 'Kopyala', desc: 'Bir belgeyi kopyalayın', shape: 'circle' },
    { name: 'Sil ve Geri Al', desc: 'Bir belgeyi silip geri alın', shape: 'circle' },
    { name: 'Beş Belge', desc: '5 farklı belge oluşturun', shape: 'square' },
    { name: 'On Belge', desc: '10 belge oluşturun', shape: 'square' },
    { name: 'Yirmi Belge', desc: '20 belge oluşturun', shape: 'square' },
    { name: 'Elli Belge', desc: '50 belge oluşturun', shape: 'triangle' },
    { name: 'Yüz Belge', desc: '100 belge oluşturun', shape: 'triangle' },
    { name: 'İki Yüz Belge', desc: '200 belge oluşturun', shape: 'triangle' },
    { name: 'Belge İmparatoru', desc: '500 belge oluşturun', shape: 'star' },
    { name: 'Hızlı Not', desc: 'Bir hızlı not oluşturun', shape: 'circle' },
    { name: 'Beş Not', desc: '5 hızlı not oluşturun', shape: 'circle' },
    { name: 'Not Ustası', desc: '20 hızlı not oluşturun', shape: 'square' },
    { name: 'Hatırlatıcı Kur', desc: 'Nota hatırlatıcı ekleyin', shape: 'circle' },
    { name: 'Zamanlayıcı', desc: '5 hatırlatıcı kurun', shape: 'square' },
    { name: 'Not Efsanesi', desc: '100 not oluşturun', shape: 'triangle' },
    { name: 'Klasör Oluştur', desc: 'Belgelerinizi organize edin', shape: 'circle' },
    { name: 'Etiketle', desc: 'Belgelere etiket ekleyin', shape: 'circle' },
    { name: 'Ara ve Bul', desc: 'Arama ile belge bulun', shape: 'circle' },
    { name: 'Filtrele', desc: 'Belgeleri filtreleyin', shape: 'square' },
    { name: 'Organizator', desc: '50 belgeyi organize edin', shape: 'triangle' },
    { name: 'Arşivci', desc: '200 belgeyi organize edin', shape: 'star' },
    { name: 'İki Sayfa', desc: '2 sayfalık belge oluşturun', shape: 'circle' },
    { name: 'Beş Sayfa', desc: '5 sayfalık belge', shape: 'square' },
    { name: 'On Sayfa', desc: '10 sayfalık belge', shape: 'triangle' },
    { name: 'Yirmi Sayfa', desc: '20 sayfalık belge', shape: 'triangle' },
    { name: 'Roman Yaz', desc: '50 sayfalık belge', shape: 'star' },
  ],
  ai: [
    { name: 'ZETA Tanış', desc: 'ZETA ile ilk sohbet', shape: 'circle' },
    { name: 'Soru Sor', desc: "ZETA'ya 3 soru sorun", shape: 'circle' },
    { name: 'Belge Hakkinda', desc: 'Belge içerigi hakkında sohbet', shape: 'circle' },
    { name: 'Öneri Al', desc: "ZETA'dan metin önerisi alın", shape: 'circle' },
    { name: 'Beş Sohbet', desc: '5 sohbet oturumu yapın', shape: 'circle' },
    { name: 'On Sohbet', desc: '10 sohbet oturumu', shape: 'square' },
    { name: 'AI Görsel', desc: 'İlk AI görselini oluştur', shape: 'circle' },
    { name: 'Beş Görsel', desc: '5 AI görsel oluşturun', shape: 'square' },
    { name: 'On Görsel', desc: '10 AI görsel oluşturun', shape: 'square' },
    { name: 'Yirmi Görsel', desc: '20 AI görsel', shape: 'triangle' },
    { name: 'Elli Görsel', desc: '50 AI görsel oluşturun', shape: 'triangle' },
    { name: 'Yüz Görsel', desc: '100 AI görsel oluşturun', shape: 'triangle' },
    { name: 'AI Sanatci', desc: '200 AI görsel oluşturun', shape: 'star' },
    { name: 'Fotograf Düzenle', desc: 'İlk fotograf düzenleme', shape: 'circle' },
    { name: 'Beş Düzenleme', desc: '5 fotograf düzenleyin', shape: 'square' },
    { name: 'On Düzenleme', desc: '10 fotograf düzenleyin', shape: 'square' },
    { name: 'Düzenleme Ustası', desc: '25 fotograf düzenleyin', shape: 'triangle' },
    { name: 'Düzenleme Efsanesi', desc: '100 düzenleme yapın', shape: 'star' },
    { name: 'Pro Görsel', desc: 'Nano Banana Pro ile görsel', shape: 'square' },
    { name: 'Pro Boyut', desc: 'Ozel boyut ile görsel', shape: 'square' },
    { name: 'Pro Usta', desc: '20 Pro görsel oluşturun', shape: 'triangle' },
    { name: 'AI Tanrisi', desc: '50 Pro görsel oluşturun', shape: 'star' },
    { name: 'Elli Sohbet', desc: '50 sohbet yapın', shape: 'square' },
    { name: 'Yüz Sohbet', desc: '100 sohbet yapın', shape: 'triangle' },
    { name: 'ZETA Dostu', desc: '200 sohbet yapın', shape: 'triangle' },
    { name: 'ZETA Guru', desc: '500 sohbet yapın', shape: 'star' },
    { name: 'Portre Oluştur', desc: 'Portre tarzi görsel', shape: 'circle' },
    { name: 'Manzara Oluştur', desc: 'Manzara görsel oluştur', shape: 'circle' },
    { name: 'Soyut Sanat', desc: 'Soyut görsel oluştur', shape: 'square' },
    { name: 'Stil Ustası', desc: '10 farklı stilde görsel', shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '30 farklı stilde görsel', shape: 'star' },
  ],
  design: [
    { name: 'İlk Şekil', desc: "Canvas'a bir şekil ekleyin", shape: 'circle' },
    { name: 'Üç Şekil', desc: '3 farklı şekil turu kullanin', shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Bir sekli boyutlandirin', shape: 'circle' },
    { name: 'Tasi', desc: 'Elemanlari tasiyin', shape: 'circle' },
    { name: 'Renklendir', desc: 'Bir şekle renk verin', shape: 'circle' },
    { name: 'Gradient Uygula', desc: 'Gradient renk kullanin', shape: 'circle' },
    { name: 'Metin + Şekil', desc: 'Metin ve şekil birleştirin', shape: 'circle' },
    { name: 'Kompozisyon', desc: '10 elemanli tasarim yapın', shape: 'square' },
    { name: 'Karmasik Tasarim', desc: '25 elemanli tasarim', shape: 'square' },
    { name: 'Ileri Tasarim', desc: '50 elemanli tasarim', shape: 'triangle' },
    { name: 'Devasa Tasarim', desc: '100+ elemanli tasarim', shape: 'triangle' },
    { name: 'Tasarim Dehasi', desc: '200+ elemanli tasarim', shape: 'star' },
    { name: 'Kalem Çiz', desc: 'Kalem araci ile çizin', shape: 'circle' },
    { name: 'Vektor Çiz', desc: 'Vektor çizim yapın', shape: 'circle' },
    { name: 'Beş Çizim', desc: '5 vektor çizim yapın', shape: 'square' },
    { name: 'On Çizim', desc: '10 vektor çizim yapın', shape: 'square' },
    { name: 'Sanatci', desc: '20 vektor çizim yapın', shape: 'triangle' },
    { name: 'Çizim Efsanesi', desc: '50 vektor çizim', shape: 'star' },
    { name: 'Resim Ekle', desc: "Canvas'a resim ekleyin", shape: 'circle' },
    { name: 'Kirp', desc: 'Bir resmi kirpin', shape: 'circle' },
    { name: 'Resim Düzenle', desc: 'Resim üzerinde düzenleme', shape: 'square' },
    { name: 'Kolaj', desc: '5 resimli kolaj yapın', shape: 'square' },
    { name: 'Galeri Ustası', desc: '20 resimli tasarim', shape: 'triangle' },
    { name: 'Galeri Efsanesi', desc: '50 resimli tasarim', shape: 'star' },
  ],
  template: [
    { name: 'İlk Şablon', desc: 'Bir şablon kullanin', shape: 'circle' },
    { name: 'CV Şablonu', desc: 'CV şablonunu kullanin', shape: 'circle' },
    { name: 'Rapor Şablonu', desc: 'Rapor şablonunu kullanin', shape: 'circle' },
    { name: 'Fatura Şablonu', desc: 'Fatura oluşturun', shape: 'circle' },
    { name: 'Beş Şablon', desc: '5 farklı şablon kullanin', shape: 'circle' },
    { name: 'On Şablon', desc: '10 farklı şablon deneyin', shape: 'square' },
    { name: 'Tüm Şablonlar', desc: '20 şablonun hepsini deneyin', shape: 'square' },
    { name: 'Şablon Özelleştir', desc: 'Şablonu özelleştiriniz', shape: 'square' },
    { name: 'Şablon Ustası', desc: '50 belge şablonla oluşturun', shape: 'triangle' },
    { name: 'Şablon Efsanesi', desc: '100 belge şablonla', shape: 'star' },
    { name: 'Toplanti Notu', desc: 'Toplanti şablonu kullanin', shape: 'circle' },
    { name: 'Sozlesme Yaz', desc: 'Sozlesme şablonu', shape: 'circle' },
    { name: 'SWOT Analizi', desc: 'SWOT şablonu kullanin', shape: 'square' },
    { name: 'Sertifika Oluştur', desc: 'Sertifika şablonu', shape: 'square' },
    { name: 'Etkinlik Afisi', desc: 'Etkinlik afisi oluşturun', shape: 'square' },
    { name: 'Is Plani', desc: 'Is plani şablonu kullanin', shape: 'triangle' },
    { name: 'Sunum Oluştur', desc: 'Sunum şablonu kullanin', shape: 'square' },
  ],
  color: [
    { name: 'İlk Renk', desc: 'Bir renge tıklayin', shape: 'circle' },
    { name: 'Ozel Renk', desc: 'Ozel renk seçin', shape: 'circle' },
    { name: 'Gradient Kesfi', desc: 'İlk gradientinizi uygulayin', shape: 'circle' },
    { name: 'Beş Gradient', desc: '5 farklı gradient deneyin', shape: 'circle' },
    { name: 'Metin Rengi', desc: 'Metin rengini değiştirin', shape: 'circle' },
    { name: 'Şekil Rengi', desc: 'Şekle gradient uygulayin', shape: 'circle' },
    { name: 'Renk Paleti', desc: '10 farklı renk kullanin', shape: 'square' },
    { name: 'Renk Harmonisi', desc: 'Uyumlu renkler kullanin', shape: 'square' },
    { name: 'Gokkusagi', desc: 'Tüm renkleri kullanin', shape: 'square' },
    { name: 'Renk Ustası', desc: '100 renk değişikligi', shape: 'triangle' },
    { name: 'Renk Sihirbazi', desc: '300 renk değişikligi', shape: 'triangle' },
    { name: 'Renk Tanrisi', desc: '500 renk değişikligi', shape: 'star' },
    { name: 'İlk İşaret', desc: 'Highlighter kullanin', shape: 'circle' },
    { name: 'Beş İşaret', desc: '5 metin işaretleyin', shape: 'circle' },
    { name: 'Renkli İşaret', desc: '3 farklı renk ile işaretleyin', shape: 'square' },
    { name: 'İşaret Ustası', desc: '50 metin işaretleyin', shape: 'triangle' },
    { name: 'İşaret Efsanesi', desc: '200 metin işaretleyin', shape: 'star' },
    { name: 'Koyu Tema', desc: 'Koyu temayi deneyin', shape: 'circle' },
    { name: 'Acik Tema', desc: 'Acik temayi deneyin', shape: 'circle' },
    { name: 'Tema Değiştirici', desc: '20 kez tema değiştirin', shape: 'square' },
  ],
  chart: [
    { name: 'İlk Grafik', desc: 'Bir grafik oluşturun', shape: 'circle' },
    { name: 'Bar Grafik', desc: 'Bar grafik oluşturun', shape: 'circle' },
    { name: 'Pasta Grafik', desc: 'Pasta grafik oluşturun', shape: 'circle' },
    { name: 'Çizgi Grafik', desc: 'Çizgi grafik oluşturun', shape: 'circle' },
    { name: 'Üç Tur', desc: '3 grafik turunu deneyin', shape: 'square' },
    { name: 'Gradient Grafik', desc: 'Grafige gradient uygulayin', shape: 'square' },
    { name: 'Beş Grafik', desc: '5 grafik oluşturun', shape: 'square' },
    { name: 'On Grafik', desc: '10 grafik oluşturun', shape: 'triangle' },
    { name: 'Grafik Ustası', desc: '25 grafik oluşturun', shape: 'triangle' },
    { name: 'Veri Bilimci', desc: '50 grafik oluşturun', shape: 'star' },
    { name: 'İlk Tablo', desc: 'Bir tablo oluşturun', shape: 'circle' },
    { name: 'Beş Tablo', desc: '5 tablo oluşturun', shape: 'square' },
    { name: 'Tablo Ustası', desc: '20 tablo oluşturun', shape: 'triangle' },
    { name: 'Tablo Efsanesi', desc: '50 tablo oluşturun', shape: 'star' },
    { name: 'İlk QR', desc: 'QR kod oluşturun', shape: 'circle' },
    { name: 'Beş QR', desc: '5 QR kod oluşturun', shape: 'square' },
    { name: 'QR Ustası', desc: '20 QR kod', shape: 'triangle' },
  ],
  collab: [
    { name: 'Profil Oluştur', desc: 'Profilinizi tamamlayın', shape: 'circle' },
    { name: 'Fotograf Ekle', desc: 'Profil fotografi ekleyin', shape: 'circle' },
    { name: 'Isim Değiştir', desc: 'Profil adinizi değiştirin', shape: 'circle' },
    { name: 'İlk Paylaş', desc: 'Bir belgeyi paylaşin', shape: 'circle' },
    { name: 'Beş Paylaşim', desc: '5 belge paylaşin', shape: 'square' },
    { name: 'On Paylaşim', desc: '10 belge paylaşin', shape: 'square' },
    { name: 'Sosyal Kelebek', desc: '25 paylaşim yapın', shape: 'triangle' },
    { name: 'Iletisim Ustası', desc: '50 paylaşim yapın', shape: 'triangle' },
    { name: 'Topluluk Lideri', desc: '100 paylaşim', shape: 'star' },
    { name: 'Dil Değiştir', desc: 'Uygulama dilini değiştirin', shape: 'circle' },
    { name: 'Tema Değiştir', desc: 'Koyu/acik tema deneyin', shape: 'circle' },
    { name: 'Ayar Ustası', desc: 'Tüm ayarlari keşfedin', shape: 'square' },
    { name: 'Kısayol Kralı', desc: 'Tüm kısayolları özelleştiriniz', shape: 'triangle' },
    { name: 'Fast Select', desc: 'Fast Select kullanin', shape: 'circle' },
    { name: 'FS Özelleştir', desc: 'Fast Select araclarini değiştirin', shape: 'square' },
    { name: 'FS Ustası', desc: '100 kez Fast Select kullanin', shape: 'triangle' },
  ],
  export_chain: [
    { name: 'İlk Export', desc: 'Bir belgeyi dışa aktarin', shape: 'circle' },
    { name: 'PNG Export', desc: 'PNG olarak kaydedin', shape: 'circle' },
    { name: 'PDF Export', desc: 'PDF olarak kaydedin', shape: 'circle' },
    { name: 'JSON Export', desc: 'Proje dosyasi kaydedin', shape: 'circle' },
    { name: 'Beş Export', desc: '5 belge dışa aktarin', shape: 'square' },
    { name: 'On Export', desc: '10 belge dışa aktarin', shape: 'square' },
    { name: 'Yirmi Export', desc: '20 belge dışa aktarin', shape: 'square' },
    { name: 'Export Ustası', desc: '50 belge dışa aktarin', shape: 'triangle' },
    { name: 'Yayinci Pro', desc: '100 belge dışa aktarin', shape: 'triangle' },
    { name: 'Mega Yayinci', desc: '200 belge dışa aktarin', shape: 'star' },
    { name: 'PDF Ice Aktar', desc: 'Bir PDF dosyasi ice aktarin', shape: 'circle' },
    { name: 'Beş PDF', desc: '5 PDF ice aktarin', shape: 'square' },
    { name: 'On PDF', desc: '10 PDF ice aktarin', shape: 'square' },
    { name: 'PDF Ustası', desc: '50 PDF ice aktarin', shape: 'triangle' },
    { name: 'PDF Efsanesi', desc: '100 PDF ice aktarin', shape: 'star' },
    { name: 'Mail Gönder', desc: 'Belgeyi e-posta ile gönderin', shape: 'circle' },
    { name: 'Beş Mail', desc: '5 e-posta gönderin', shape: 'square' },
    { name: 'Mail Ustası', desc: '20 e-posta gönderin', shape: 'triangle' },
  ],
  photo: [
    { name: 'Fotograf Yükle', desc: 'Bir fotograf yükleyin', shape: 'circle' },
    { name: 'AI Düzenleme', desc: 'AI ile fotograf düzenleyin', shape: 'circle' },
    { name: 'Kirpma', desc: 'Fotografi kirpin', shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Fotografi boyutlandirin', shape: 'circle' },
    { name: 'Filtre Uygula', desc: 'AI filtre uygulayin', shape: 'circle' },
    { name: 'Beş Düzenleme', desc: '5 fotograf düzenleyin', shape: 'square' },
    { name: 'On Düzenleme', desc: '10 fotograf düzenleyin', shape: 'square' },
    { name: 'Yirmi Düzenleme', desc: '20 fotograf düzenleyin', shape: 'square' },
    { name: 'Fotograf Sanatcisi', desc: '50 düzenleme yapın', shape: 'triangle' },
    { name: 'Fotograf Ustası', desc: '100 düzenleme yapın', shape: 'triangle' },
    { name: 'Fotograf Efsanesi', desc: '200 düzenleme yapın', shape: 'star' },
    { name: 'Şekle Resim', desc: 'Şekle resim ekleyin', shape: 'circle' },
    { name: 'Beş Şekil Resim', desc: '5 şekle resim ekleyin', shape: 'square' },
    { name: 'Mozaik', desc: '10 şekle resim ekleyin', shape: 'triangle' },
    { name: 'Mozaik Ustası', desc: '25 mozaik oluşturun', shape: 'star' },
    { name: 'Pro Düzenleme', desc: 'Pro modda fotograf düzenleyin', shape: 'square' },
    { name: 'Beş Pro', desc: '5 Pro düzenleme yapın', shape: 'square' },
    { name: 'Pro Fotograf', desc: '20 Pro düzenleme', shape: 'triangle' },
    { name: 'Pro Efsane', desc: '50 Pro düzenleme', shape: 'star' },
  ],
  text: [
    { name: 'İlk Metin', desc: "Canvas'a metin ekleyin", shape: 'circle' },
    { name: 'Kalın Yazi', desc: 'Bold formatlama', shape: 'circle' },
    { name: 'Italik Yazı', desc: 'Italic formatlama', shape: 'circle' },
    { name: 'Alti Çizili', desc: 'Underline formatlama', shape: 'circle' },
    { name: 'Ustu Çizili', desc: 'Strikethrough formatlama', shape: 'circle' },
    { name: 'Font Değiştir', desc: 'Farkli font kullanin', shape: 'circle' },
    { name: 'Beş Font', desc: '5 farklı font deneyin', shape: 'circle' },
    { name: 'On Font', desc: '10 farklı font deneyin', shape: 'square' },
    { name: 'Font Ustası', desc: '30 farklı font kullanin', shape: 'square' },
    { name: 'Boyut Değiştir', desc: 'Font boyutunu değiştirin', shape: 'circle' },
    { name: 'Hizalama', desc: 'Metin hizalamasini değiştirin', shape: 'circle' },
    { name: 'Satir Araligi', desc: 'Satir araligini ayarlayin', shape: 'circle' },
    { name: 'Girinti', desc: 'Metin girintisi ekleyin', shape: 'circle' },
    { name: 'Tüm Formatlar', desc: 'Tüm format seceneklerini deneyin', shape: 'square' },
    { name: 'Tipografi Ustası', desc: '100 metin formatlamasi', shape: 'triangle' },
    { name: 'Kaligrafi Efsanesi', desc: '500 metin formatlamasi', shape: 'star' },
    { name: 'Çeviri Yap', desc: 'Bir metni çevirin', shape: 'circle' },
    { name: 'Beş Çeviri', desc: '5 metin çevirin', shape: 'square' },
    { name: 'On Çeviri', desc: '10 metin çevirin', shape: 'square' },
    { name: 'Polyglot', desc: '5 farklı dile çevirin', shape: 'triangle' },
    { name: 'Çeviri Efsanesi', desc: '10 dile çevirin', shape: 'star' },
    { name: 'Başlık Stili', desc: 'Başlık formati kullanin', shape: 'circle' },
    { name: 'Alt Başlık', desc: 'Alt başlık ekleyin', shape: 'circle' },
    { name: 'Liste Oluştur', desc: 'Maddeli liste yapın', shape: 'square' },
    { name: 'Metin Kutusu', desc: 'Ozel metin kutusu oluşturun', shape: 'square' },
  ],
  shape: [
    { name: 'Kare Çiz', desc: 'Bir kare ekleyin', shape: 'circle' },
    { name: 'Daire Çiz', desc: 'Bir daire ekleyin', shape: 'circle' },
    { name: 'Üçgen Çiz', desc: 'Bir ucgen ekleyin', shape: 'circle' },
    { name: 'Yildiz Çiz', desc: 'Bir yildiz ekleyin', shape: 'circle' },
    { name: 'Halka Çiz', desc: 'Bir halka ekleyin', shape: 'circle' },
    { name: 'Beş Şekil', desc: 'Hepsini deneyin', shape: 'circle' },
    { name: 'Renkli Şekiller', desc: 'Şekillere renk verin', shape: 'circle' },
    { name: 'Gradient Şekiller', desc: 'Gradient şekiller yapın', shape: 'square' },
    { name: 'Resimli Şekiller', desc: 'Şekillere resim koyun', shape: 'square' },
    { name: 'On Şekil Tasarim', desc: '10 şekilli tasarim', shape: 'square' },
    { name: 'Yirmi Şekil', desc: '20 şekilli tasarim', shape: 'triangle' },
    { name: 'Elli Şekil', desc: '50 şekilli tasarim', shape: 'triangle' },
    { name: 'Geometri Dehasi', desc: '100 şekilli tasarim', shape: 'triangle' },
    { name: 'Şekil Efsanesi', desc: '200 şekilli tasarim', shape: 'star' },
    { name: 'Lasso Kullan', desc: 'Lasso araçıni kullanin', shape: 'circle' },
    { name: 'Çoklu Seçim', desc: '5 eleman seçin', shape: 'square' },
    { name: 'Seçim Ustası', desc: '20 eleman seçin', shape: 'triangle' },
    { name: 'Katman Ekle', desc: 'Katman oluşturun', shape: 'circle' },
    { name: 'Beş Katman', desc: '5 katmanli tasarim', shape: 'square' },
    { name: 'Katman Ustası', desc: '10 katmanli tasarim', shape: 'triangle' },
    { name: 'Katman Efsanesi', desc: '20 katmanli tasarim', shape: 'star' },
  ],
  judge: [
    { name: 'Judge Tanış', desc: 'ZET Judge i açın', shape: 'circle' },
    { name: 'İlk Analiz', desc: 'İlk temel analizi yapın', shape: 'circle' },
    { name: 'Metin Analizi', desc: 'Bir metin analiz ettirin', shape: 'circle' },
    { name: 'Beş Analiz', desc: '5 temel analiz yapın', shape: 'square' },
    { name: 'On Analiz', desc: '10 temel analiz yapın', shape: 'square' },
    { name: 'Derin Analiz', desc: 'İlk derin analiz yapın', shape: 'square' },
    { name: 'Beş Derin', desc: '5 derin analiz yapın', shape: 'triangle' },
    { name: 'On Derin', desc: '10 derin analiz yapın', shape: 'triangle' },
    { name: 'Yirmi Analiz', desc: '20 toplam analiz', shape: 'square' },
    { name: 'Elli Analiz', desc: '50 toplam analiz', shape: 'triangle' },
    { name: 'Analiz Ustası', desc: '100 toplam analiz', shape: 'triangle' },
    { name: 'Judge Yardimcisi', desc: '200 toplam analiz', shape: 'triangle' },
    { name: 'Hakim', desc: '500 toplam analiz', shape: 'star' },
    { name: 'Sert Mod', desc: 'Sert modu deneyin', shape: 'circle' },
    { name: 'Normal Mod', desc: 'Normal modu deneyin', shape: 'circle' },
    { name: 'Mod Ustası', desc: 'Her iki modu kullanin', shape: 'square' },
    { name: 'Mod Efsanesi', desc: '50 kez mod değiştirin', shape: 'triangle' },
    { name: 'Belge Analizi', desc: 'Belge içerigini analiz ettirin', shape: 'circle' },
    { name: 'Karsilastir', desc: '2 belgeyi karsilastirin', shape: 'square' },
    { name: 'Detaylı Rapor', desc: 'Detaylı analiz raporu alın', shape: 'triangle' },
    { name: 'Analiz Kiyaslama', desc: '3 belgeyi karsilastirin', shape: 'triangle' },
    { name: 'Analiz Pro', desc: '10 detaylı rapor alın', shape: 'star' },
  ],
  master: [
    { name: 'Acemi', desc: 'İlk 10 görevi tamamla', shape: 'circle' },
    { name: 'Çırak', desc: '25 görevi tamamla', shape: 'circle' },
    { name: 'Kalfa', desc: '50 görevi tamamla', shape: 'square' },
    { name: 'Usta', desc: '100 görevi tamamla', shape: 'square' },
    { name: 'Uzman', desc: '150 görevi tamamla', shape: 'square' },
    { name: 'Bilge', desc: '200 görevi tamamla', shape: 'triangle' },
    { name: 'Maestro', desc: '300 görevi tamamla', shape: 'triangle' },
    { name: 'Büyük Usta', desc: '400 görevi tamamla', shape: 'star' },
    { name: 'Efsane', desc: '500 görevi tamamla', shape: 'star' },
    { name: '1000 SP', desc: '1000 SP kazan', shape: 'circle' },
    { name: '5000 SP', desc: '5000 SP kazan', shape: 'square' },
    { name: '10000 SP', desc: '10000 SP kazan', shape: 'triangle' },
    { name: '25000 SP', desc: '25000 SP kazan', shape: 'triangle' },
    { name: '50000 SP', desc: '50000 SP kazan', shape: 'star' },
    { name: 'Gunluk Giriş', desc: '7 gun ust uste giriş', shape: 'circle' },
    { name: 'Haftalik', desc: '30 gun giriş yapın', shape: 'square' },
    { name: 'Aylik', desc: '90 gun giriş yapın', shape: 'triangle' },
    { name: 'Yillik', desc: '365 gun giriş yapın', shape: 'star' },
    { name: 'Çok Kategorili', desc: '5 farklı alanda görev tamamla', shape: 'square' },
    { name: 'Her Alandan', desc: 'Her alandan 1 görev', shape: 'triangle' },
    { name: 'Evrensel Usta', desc: 'Her alanda 10 görev', shape: 'star' },
    { name: 'Hızlı Tamamlayıcı', desc: '1 günde 10 görev tamamla', shape: 'square' },
    { name: 'Super Tamamlayıcı', desc: '1 günde 20 görev', shape: 'triangle' },
    { name: 'Ultra Tamamlayıcı', desc: '1 günde 30 görev', shape: 'triangle' },
    { name: 'İmkansız Hiz', desc: '1 günde 50 görev', shape: 'star' },
  ],
  legend: [
    { name: 'Tüm Araclar', desc: 'Her araci en az 1 kez kullan', shape: 'triangle' },
    { name: 'Tüm Şablonlar', desc: '20 şablonun hepsini dene', shape: 'triangle' },
    { name: 'Tüm Şekiller', desc: 'Her şekil turunu kullan', shape: 'square' },
    { name: 'AI Master', desc: '100 AI işlem yap', shape: 'triangle' },
    { name: 'Kredi Canavari', desc: 'Bir günde tüm kredileri harca', shape: 'square' },
    { name: 'Gece Kusu', desc: 'Gece 3 te belge oluştur', shape: 'square' },
    { name: 'Sabahci', desc: 'Sabah 6 da belge oluştur', shape: 'square' },
    { name: 'Hiz Seytani', desc: '1 dakikada 10 eleman ekle', shape: 'triangle' },
    { name: 'Perfectionist', desc: 'Bir belgeyi 50 kez düzenle', shape: 'triangle' },
    { name: 'Çok Yönlü', desc: 'Her alandan görev tamamla', shape: 'triangle' },
    { name: 'ZET Kralı', desc: 'Her alanda usta ol', shape: 'star' },
    { name: 'İmkansız', desc: 'Tüm görevleri tamamla', shape: 'star' },
    { name: 'Ctrl+Z Ustası', desc: '100 geri alma yapın', shape: 'circle' },
    { name: 'Sansur Uzmani', desc: '20 metin sansurleyin', shape: 'square' },
    { name: 'Imza Sanatcisi', desc: '10 dijital imza ekleyin', shape: 'triangle' },
    { name: 'Filigran Ustası', desc: '20 filigran ekleyin', shape: 'triangle' },
    { name: 'Efsane Tamamlayıcı', desc: 'Tüm efsane görevleri', shape: 'star' },
    { name: 'Hafta Sonu', desc: 'Hafta sonunda çalış', shape: 'circle' },
    { name: 'Gece Vardiyasi', desc: '10 gece çalışmasi', shape: 'square' },
    { name: 'Baykus', desc: '50 gece çalışmasi', shape: 'triangle' },
    { name: 'Gece Efsanesi', desc: '200 gece çalışmasi', shape: 'star' },
    { name: 'Tüm Araclari Kullan', desc: 'Her araci en az 5 kez', shape: 'square' },
    { name: 'Arac Eksperi', desc: 'Her araci en az 20 kez', shape: 'triangle' },
    { name: 'Arac Tanrisi', desc: 'Her araci en az 100 kez', shape: 'star' },
  ],
  secret: [
    { name: 'Kesfici', desc: 'Gizli menuyu bulun', shape: 'circle' },
    { name: 'Kısayol Ustası', desc: '10 kısayol kullanin', shape: 'circle' },
    { name: 'Tüm Kısayollar', desc: 'Her kısayolu deneyin', shape: 'square' },
    { name: 'Easter Egg', desc: 'Gizli özelliği bulun', shape: 'triangle' },
    { name: 'Hacker', desc: 'Tüm gizli özellikleri keşfedin', shape: 'star' },
    { name: 'Sag Tik Ustası', desc: 'Sag tik menusunu kullanin', shape: 'circle' },
    { name: 'Zoom Ustası', desc: 'Tüm zoom seviyelerini deneyin', shape: 'circle' },
    { name: 'Katman Gizlisi', desc: 'Katmanlarla çalışin', shape: 'square' },
    { name: 'Filigran Ekle', desc: 'Filigran araçıni kullanin', shape: 'square' },
    { name: 'Ayna Kullan', desc: 'Ayna araçıni kullanin', shape: 'circle' },
    { name: 'Sesle Yaz', desc: 'Sesle yazma araçıni kullanin', shape: 'square' },
    { name: 'Gizli Usta', desc: 'Tüm gizli görevleri tamamla', shape: 'star' },
    { name: 'Kenar Bosluklari', desc: 'Kenar bosluklari ayarlayin', shape: 'circle' },
    { name: 'Sayfa Rengi', desc: 'Sayfa rengini değiştirin', shape: 'circle' },
    { name: 'Çoklu Sayfa', desc: '5 sayfalık belge oluşturun', shape: 'square' },
    { name: 'On Sayfa Gizli', desc: '10 sayfalık belge', shape: 'triangle' },
    { name: 'Yirmi Sayfa Gizli', desc: '20 sayfalık belge', shape: 'triangle' },
    { name: 'Kitap Yaz', desc: '50 sayfalık belge', shape: 'star' },
    { name: 'Gizli Kombo', desc: 'Ctrl+Shift+Z deneyin', shape: 'circle' },
    { name: 'Cift Tik', desc: 'Cift tik ile düzenleme', shape: 'circle' },
    { name: 'Surukleme', desc: 'Drag & drop kullanin', shape: 'circle' },
    { name: 'Etkilesim Ustası', desc: 'Tüm etkilesimleri öğren', shape: 'triangle' },
  ],
  speed: [
    { name: 'Hızlı Başla', desc: '30 saniyede belge oluştur', shape: 'circle' },
    { name: 'Dakika Ustası', desc: '1 dakikada 5 eleman ekle', shape: 'circle' },
    { name: 'Hızlı Yazan', desc: '1 dakikada 100 kelime yaz', shape: 'circle' },
    { name: 'Sprint', desc: '5 dakikada belge tamamla', shape: 'square' },
    { name: 'Verimli Çalışan', desc: '10 dakikada 3 belge', shape: 'square' },
    { name: 'Hiz Rekoru', desc: '1 dakikada 10 eleman', shape: 'triangle' },
    { name: 'Flash', desc: '30 saniyede 5 eleman', shape: 'triangle' },
    { name: 'Işık Hizi', desc: '10 saniyede 3 eleman', shape: 'triangle' },
    { name: 'Zamani Durduran', desc: '500 hızlı işlem yap', shape: 'star' },
    { name: 'Her Gun Çalış', desc: '3 gun ust uste çalışin', shape: 'circle' },
    { name: 'Haftalik Rutin', desc: '7 gun ust uste', shape: 'square' },
    { name: 'Aylik Rutin', desc: '30 gun ust uste', shape: 'triangle' },
    { name: 'Disiplin Ustası', desc: '90 gun ust uste', shape: 'triangle' },
    { name: 'Demir Irade', desc: '365 gun ust uste', shape: 'star' },
    { name: 'Kısayol Kullan', desc: '10 kısayol kullanin', shape: 'circle' },
    { name: 'Elli Kısayol', desc: '50 kısayol kullanin', shape: 'square' },
    { name: 'Kısayol Kralı', desc: '200 kısayol kullanin', shape: 'triangle' },
    { name: 'Verimlilik Tanrisi', desc: '1000 kısayol', shape: 'star' },
    { name: 'Çoklu Görev', desc: 'Ayni anda 3 belge ac', shape: 'circle' },
    { name: 'Beş Belge Ac', desc: '5 belge ayni anda', shape: 'square' },
    { name: 'On Belge Ac', desc: '10 belge ayni anda', shape: 'triangle' },
    { name: 'Çoklu Görev Ustası', desc: '20 belge ayni anda', shape: 'star' },
  ],
  creative: [
    { name: 'İlk Yaratim', desc: 'Ozel bir tasarim yapın', shape: 'circle' },
    { name: 'Renk Deneyimi', desc: '5 renk kombinasyonu deneyin', shape: 'circle' },
    { name: 'Karışık Medya', desc: 'Metin + şekil + resim birleştirin', shape: 'circle' },
    { name: 'Simetri', desc: 'Simetrik tasarim yapın', shape: 'square' },
    { name: 'Minimalist', desc: 'Minimalist bir tasarim', shape: 'circle' },
    { name: 'Maksimalist', desc: '30+ elemanli tasarim', shape: 'square' },
    { name: 'Poster Tasarla', desc: 'Bir poster oluşturun', shape: 'square' },
    { name: 'Logo Tasarla', desc: 'Basit bir logo oluşturun', shape: 'square' },
    { name: 'Kartvizit', desc: 'Kartvizit tasarlayin', shape: 'square' },
    { name: 'Infografik', desc: 'Bir infografik oluşturun', shape: 'triangle' },
    { name: 'Portfolyo', desc: 'Portfolyo sayfasi oluşturun', shape: 'triangle' },
    { name: 'Yaratici Deha', desc: '50 ozel tasarim yapın', shape: 'triangle' },
    { name: 'Sanat Eseri', desc: '100 ozel tasarim yapın', shape: 'star' },
    { name: 'AI + Tasarim', desc: 'AI görsel ile tasarim yapın', shape: 'circle' },
    { name: 'AI Kolaj', desc: '5 AI görsel ile kolaj', shape: 'square' },
    { name: 'AI Sergi', desc: '20 AI destekli tasarim', shape: 'triangle' },
    { name: 'AI Sanat', desc: '50 AI destekli tasarim', shape: 'star' },
    { name: 'İlk Sunum', desc: 'Sunum formatinda belge', shape: 'circle' },
    { name: 'Beş Sunum', desc: '5 sunum oluşturun', shape: 'square' },
    { name: 'Sunum Ustası', desc: '20 sunum oluşturun', shape: 'triangle' },
    { name: 'Sunum Efsanesi', desc: '50 sunum oluşturun', shape: 'star' },
    { name: 'Marka Rengi', desc: 'Tutarli renk paleti kullanin', shape: 'circle' },
    { name: 'Marka Fontu', desc: 'Tutarli font seti kullanin', shape: 'circle' },
    { name: 'Marka Kimligi', desc: 'Tam marka kimligi oluşturun', shape: 'square' },
    { name: 'Kurumsal Kimlik', desc: '5 markali belge oluşturun', shape: 'triangle' },
    { name: 'Marka Ustası', desc: '20 markali belge oluşturun', shape: 'triangle' },
    { name: 'Marka Efsanesi', desc: '50 markali belge', shape: 'star' },
    { name: 'Minimalist Stil', desc: 'Minimalist tasarim yapın', shape: 'circle' },
    { name: 'Retro Stil', desc: 'Retro tarzi tasarim', shape: 'circle' },
    { name: 'Modern Stil', desc: 'Modern tasarim yapın', shape: 'circle' },
    { name: 'Neon Stil', desc: 'Neon renkli tasarim', shape: 'square' },
    { name: 'Stil Koleksiyoncusu', desc: '5 farklı stilde tasarim', shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '10 farklı stilde tasarim', shape: 'star' },
  ],
  extra: [
    { name: 'İlk Oturum', desc: '1 saatlik çalışma oturumu', shape: 'circle' },
    { name: 'Odaklan', desc: '2 saat kesintisiz çalış', shape: 'circle' },
    { name: 'Pomodoro', desc: '4 pomodoro tamamla', shape: 'circle' },
    { name: 'Gunluk Hedef', desc: 'Gunluk hedefinizi belirleyin', shape: 'circle' },
    { name: 'Haftalik Plan', desc: 'Haftalik plan oluşturun', shape: 'circle' },
    { name: 'Beş Oturum', desc: '5 çalışma oturumu', shape: 'square' },
    { name: 'On Oturum', desc: '10 çalışma oturumu', shape: 'square' },
    { name: 'Yirmi Oturum', desc: '20 çalışma oturumu', shape: 'square' },
    { name: 'Elli Oturum', desc: '50 çalışma oturumu', shape: 'triangle' },
    { name: 'Yüz Oturum', desc: '100 çalışma oturumu', shape: 'triangle' },
    { name: 'Uretkenlik Kralı', desc: '200 çalışma oturumu', shape: 'star' },
    { name: 'İlk Paylaşim', desc: 'Bir belge paylaşin', shape: 'circle' },
    { name: 'Link Oluştur', desc: 'Paylaşim linki oluşturun', shape: 'circle' },
    { name: 'Mail ile Paylaş', desc: 'E-posta ile belge gönderin', shape: 'circle' },
    { name: 'Sosyal Efsane', desc: '200 paylaşim yapın', shape: 'star' },
    { name: 'Gunluk Giriş', desc: 'Uygulamaya giriş yapın', shape: 'circle' },
    { name: 'Gunluk Belge', desc: 'Her gun bir belge oluşturun', shape: 'circle' },
    { name: 'Gunluk AI', desc: 'Her gun AI kullanin', shape: 'circle' },
    { name: 'Yillik Seri', desc: '365 gun ust uste giriş', shape: 'star' },
    { name: 'İlk Koleksiyon', desc: 'İlk öğrenizi toplayin', shape: 'circle' },
    { name: 'Font Koleksiyonu', desc: '5 farklı font kullanin', shape: 'circle' },
    { name: 'Tam Koleksiyon', desc: 'Tüm koleksiyonlari tamamlayın', shape: 'triangle' },
    { name: 'Super Koleksiyoncu', desc: 'Her seyden 50 adet', shape: 'star' },
    { name: 'Yüzde Elli', desc: 'Görevlerin yarısı tamamla', shape: 'triangle' },
    { name: 'Tam Tamamlayıcı', desc: 'Tüm görevleri tamamla', shape: 'star' },
    { name: 'Belge Sihirbazi', desc: '10 şablon kullan', shape: 'square' },
    { name: 'Otomasyon Ustası', desc: '50 kısayol kullan', shape: 'triangle' },
    { name: 'ZET Efsanesi', desc: '300 görev tamamla', shape: 'star' },
  ],
};

// Deterministiç seeded random
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
    { name: 'Gizemli Görev', desc: 'Bu görevi keşfet', shape: 'circle' },
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

  // Place quests in concentriç spiral rings
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
