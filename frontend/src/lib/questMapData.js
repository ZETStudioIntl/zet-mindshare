// Quest Map Data Generator - 500+ quests organized in chains
// Shapes: circle=easy, square=medium, triangle=hard, star=impossible

const CATEGORIES = [
  { id: 'doc', name: 'Belge Ustasi', desc: 'Belge olusturma gorevleri' },
  { id: 'ai', name: 'AI Kesficisi', desc: 'Yapay zeka gorevleri' },
  { id: 'design', name: 'Tasarim Sihirbazi', desc: 'Tasarim gorevleri' },
  { id: 'template', name: 'Sablon Uzmani', desc: 'Sablon gorevleri' },
  { id: 'color', name: 'Renk Ustasi', desc: 'Renk ve gradient gorevleri' },
  { id: 'chart', name: 'Grafik Dehasi', desc: 'Grafik olusturma gorevleri' },
  { id: 'collab', name: 'Takim Oyuncusu', desc: 'Isbirligi gorevleri' },
  { id: 'export', name: 'Yayinci', desc: 'Disa aktarma gorevleri' },
  { id: 'photo', name: 'Fotograf Editoru', desc: 'Fotograf duzenleme gorevleri' },
  { id: 'text', name: 'Soz Ustasi', desc: 'Metin formatlama gorevleri' },
  { id: 'shape', name: 'Sekil Mimari', desc: 'Sekil ve cizim gorevleri' },
  { id: 'judge', name: 'Hakim Yolu', desc: 'ZET Judge gorevleri' },
  { id: 'master', name: 'Buyuk Usta', desc: 'Zorluk zinciri' },
  { id: 'legend', name: 'Efsane', desc: 'Efsanevi gorevler' },
  { id: 'secret', name: 'Gizli Yollar', desc: 'Gizli gorev zincirleri' },
  { id: 'speed', name: 'Hiz Seytani', desc: 'Hiz ve verimlilik gorevleri' },
  { id: 'creative', name: 'Yaratici Atolye', desc: 'Yaraticilik gorevleri' },
  { id: 'productivity', name: 'Uretkenlik', desc: 'Uretkenlik ve verimlilik' },
  { id: 'social', name: 'Sosyal Ag', desc: 'Paylasim ve iletisim' },
  { id: 'daily', name: 'Gunluk Gorevler', desc: 'Her gun yapilabilecek gorevler' },
  { id: 'collection', name: 'Koleksiyoncu', desc: 'Toplama ve biriktirme gorevleri' },
];

const QUEST_CHAINS = {
  doc: [
    { name: 'Ilk Adim', desc: 'Ilk belgenizi olusturun', xp: 5, shape: 'circle' },
    { name: 'Baslik Ekle', desc: 'Belgeye baslik yazin', xp: 5, shape: 'circle' },
    { name: 'Paragraf Yaz', desc: '3 paragraf metin yazin', xp: 10, shape: 'circle' },
    { name: 'Kaydet', desc: 'Belgenizi kaydedin', xp: 5, shape: 'circle' },
    { name: 'Ikinci Belge', desc: '2. belgenizi olusturun', xp: 10, shape: 'circle' },
    { name: 'Duzenle', desc: 'Var olan belgeyi duzenleyin', xp: 10, shape: 'circle' },
    { name: 'Kopyala', desc: 'Bir belgeyi kopyalayin', xp: 10, shape: 'circle' },
    { name: 'Sil ve Geri Al', desc: 'Bir belgeyi silip geri alin', xp: 15, shape: 'circle' },
    { name: 'Bes Belge', desc: '5 farkli belge olusturun', xp: 20, shape: 'square' },
    { name: 'On Belge', desc: '10 belge olusturun', xp: 30, shape: 'square' },
    { name: 'Yirmi Belge', desc: '20 belge olusturun', xp: 40, shape: 'square' },
    { name: 'Elli Belge', desc: '50 belge olusturun', xp: 60, shape: 'triangle' },
    { name: 'Yuz Belge', desc: '100 belge olusturun', xp: 100, shape: 'triangle' },
    { name: 'Iki Yuz Belge', desc: '200 belge olusturun', xp: 150, shape: 'triangle' },
    { name: 'Belge Imparatoru', desc: '500 belge olusturun', xp: 300, shape: 'star' },
    // Branch: Quick notes
    { name: 'Hizli Not', desc: 'Bir hizli not olusturun', xp: 5, shape: 'circle', branchFrom: 3 },
    { name: 'Bes Not', desc: '5 hizli not olusturun', xp: 15, shape: 'circle' },
    { name: 'Not Ustasi', desc: '20 hizli not olusturun', xp: 25, shape: 'square' },
    { name: 'Hatirlatici Kur', desc: 'Nota hatirlatici ekleyin', xp: 15, shape: 'circle' },
    { name: 'Zamanlayici', desc: '5 hatirlatici kurun', xp: 25, shape: 'square' },
    { name: 'Not Efsanesi', desc: '100 not olusturun', xp: 60, shape: 'triangle' },
    // Branch: Organization
    { name: 'Klasor Olustur', desc: 'Belgelerinizi organize edin', xp: 10, shape: 'circle', branchFrom: 8 },
    { name: 'Etiketle', desc: 'Belgelere etiket ekleyin', xp: 15, shape: 'circle' },
    { name: 'Ara ve Bul', desc: 'Arama ile belge bulun', xp: 10, shape: 'circle' },
    { name: 'Filtrele', desc: 'Belgeleri filtreleyin', xp: 15, shape: 'square' },
    { name: 'Organizator', desc: '50 belgeyi organize edin', xp: 50, shape: 'triangle' },
    { name: 'Arsivci', desc: '200 belgeyi organize edin', xp: 100, shape: 'star' },
    // Branch: Multi-page
    { name: 'Iki Sayfa', desc: '2 sayfalik belge olusturun', xp: 10, shape: 'circle', branchFrom: 5 },
    { name: 'Bes Sayfa', desc: '5 sayfalik belge', xp: 20, shape: 'square' },
    { name: 'On Sayfa', desc: '10 sayfalik belge', xp: 35, shape: 'triangle' },
    { name: 'Yirmi Sayfa', desc: '20 sayfalik belge', xp: 50, shape: 'triangle' },
    { name: 'Roman Yaz', desc: '50 sayfalik belge', xp: 100, shape: 'star' },
  ],
  ai: [
    { name: 'ZETA Tanis', desc: 'ZETA ile ilk sohbet', xp: 10, shape: 'circle' },
    { name: 'Soru Sor', desc: "ZETA'ya 3 soru sorun", xp: 10, shape: 'circle' },
    { name: 'Belge Hakkinda', desc: 'Belge icerigi hakkinda sohbet', xp: 15, shape: 'circle' },
    { name: 'Oneri Al', desc: "ZETA'dan metin onerisi alin", xp: 15, shape: 'circle' },
    { name: 'Bes Sohbet', desc: '5 sohbet oturumu yapin', xp: 20, shape: 'circle' },
    { name: 'On Sohbet', desc: '10 sohbet oturumu', xp: 25, shape: 'square' },
    { name: 'AI Gorsel', desc: 'Ilk AI gorselini olustur', xp: 20, shape: 'circle' },
    { name: 'Bes Gorsel', desc: '5 AI gorsel olusturun', xp: 30, shape: 'square' },
    { name: 'On Gorsel', desc: '10 AI gorsel olusturun', xp: 40, shape: 'square' },
    { name: 'Yirmi Gorsel', desc: '20 AI gorsel', xp: 50, shape: 'triangle' },
    { name: 'Elli Gorsel', desc: '50 AI gorsel olusturun', xp: 80, shape: 'triangle' },
    { name: 'Yuz Gorsel', desc: '100 AI gorsel olusturun', xp: 120, shape: 'triangle' },
    { name: 'AI Sanatci', desc: '200 AI gorsel olusturun', xp: 200, shape: 'star' },
    // Branch: Photo edit
    { name: 'Fotograf Duzenle', desc: 'Ilk fotograf duzenleme', xp: 15, shape: 'circle', branchFrom: 6 },
    { name: 'Bes Duzenleme', desc: '5 fotograf duzenleyin', xp: 25, shape: 'square' },
    { name: 'On Duzenleme', desc: '10 fotograf duzenleyin', xp: 35, shape: 'square' },
    { name: 'Duzenleme Ustasi', desc: '25 fotograf duzenleyin', xp: 60, shape: 'triangle' },
    { name: 'Duzenleme Efsanesi', desc: '100 duzenleme yapin', xp: 150, shape: 'star' },
    // Branch: Pro features
    { name: 'Pro Gorsel', desc: 'Nano Banana Pro ile gorsel', xp: 30, shape: 'square', branchFrom: 8 },
    { name: 'Pro Boyut', desc: 'Ozel boyut ile gorsel', xp: 25, shape: 'square' },
    { name: 'Pro Usta', desc: '20 Pro gorsel olusturun', xp: 70, shape: 'triangle' },
    { name: 'AI Tanrisi', desc: '50 Pro gorsel olusturun', xp: 150, shape: 'star' },
    // Branch: ZETA mastery
    { name: 'Elli Sohbet', desc: '50 sohbet yapin', xp: 40, shape: 'square', branchFrom: 5 },
    { name: 'Yuz Sohbet', desc: '100 sohbet yapin', xp: 60, shape: 'triangle' },
    { name: 'ZETA Dostu', desc: '200 sohbet yapin', xp: 100, shape: 'triangle' },
    { name: 'ZETA Guru', desc: '500 sohbet yapin', xp: 200, shape: 'star' },
    // Branch: Image styles
    { name: 'Portre Olustur', desc: 'Portre tarzi gorsel', xp: 15, shape: 'circle', branchFrom: 7 },
    { name: 'Manzara Olustur', desc: 'Manzara gorsel olustur', xp: 15, shape: 'circle' },
    { name: 'Soyut Sanat', desc: 'Soyut gorsel olustur', xp: 20, shape: 'square' },
    { name: 'Stil Ustasi', desc: '10 farkli stilde gorsel', xp: 40, shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '30 farkli stilde gorsel', xp: 80, shape: 'star' },
  ],
  design: [
    { name: 'Ilk Sekil', desc: "Canvas'a bir sekil ekleyin", xp: 5, shape: 'circle' },
    { name: 'Uc Sekil', desc: '3 farkli sekil turu kullanin', xp: 10, shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Bir sekli boyutlandirin', xp: 10, shape: 'circle' },
    { name: 'Tasi', desc: 'Elemanlari tasiyin', xp: 5, shape: 'circle' },
    { name: 'Renklendir', desc: 'Bir sekle renk verin', xp: 10, shape: 'circle' },
    { name: 'Gradient Uygula', desc: 'Gradient renk kullanin', xp: 15, shape: 'circle' },
    { name: 'Metin + Sekil', desc: 'Metin ve sekil birlestirin', xp: 15, shape: 'circle' },
    { name: 'Kompozisyon', desc: '10 elemanli tasarim yapin', xp: 25, shape: 'square' },
    { name: 'Karmasik Tasarim', desc: '25 elemanli tasarim', xp: 35, shape: 'square' },
    { name: 'Ileri Tasarim', desc: '50 elemanli tasarim', xp: 50, shape: 'triangle' },
    { name: 'Devasa Tasarim', desc: '100+ elemanli tasarim', xp: 80, shape: 'triangle' },
    { name: 'Tasarim Dehasi', desc: '200+ elemanli tasarim', xp: 150, shape: 'star' },
    // Branch: Drawing
    { name: 'Kalem Ciz', desc: 'Kalem araci ile cizin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Vektor Ciz', desc: 'Vektor cizim yapin', xp: 15, shape: 'circle' },
    { name: 'Bes Cizim', desc: '5 vektor cizim yapin', xp: 20, shape: 'square' },
    { name: 'On Cizim', desc: '10 vektor cizim yapin', xp: 30, shape: 'square' },
    { name: 'Sanatci', desc: '20 vektor cizim yapin', xp: 40, shape: 'triangle' },
    { name: 'Cizim Efsanesi', desc: '50 vektor cizim', xp: 80, shape: 'star' },
    // Branch: Images
    { name: 'Resim Ekle', desc: "Canvas'a resim ekleyin", xp: 10, shape: 'circle', branchFrom: 2 },
    { name: 'Kirp', desc: 'Bir resmi kirpin', xp: 15, shape: 'circle' },
    { name: 'Resim Duzenle', desc: 'Resim uzerinde duzenleme', xp: 20, shape: 'square' },
    { name: 'Kolaj', desc: '5 resimli kolaj yapin', xp: 30, shape: 'square' },
    { name: 'Galeri Ustasi', desc: '20 resimli tasarim', xp: 50, shape: 'triangle' },
    { name: 'Galeri Efsanesi', desc: '50 resimli tasarim', xp: 100, shape: 'star' },
  ],
  template: [
    { name: 'Ilk Sablon', desc: 'Bir sablon kullanin', xp: 10, shape: 'circle' },
    { name: 'CV Sablonu', desc: 'CV sablonunu kullanin', xp: 10, shape: 'circle' },
    { name: 'Rapor Sablonu', desc: 'Rapor sablonunu kullanin', xp: 10, shape: 'circle' },
    { name: 'Fatura Sablonu', desc: 'Fatura olusturun', xp: 15, shape: 'circle' },
    { name: 'Bes Sablon', desc: '5 farkli sablon kullanin', xp: 20, shape: 'circle' },
    { name: 'On Sablon', desc: '10 farkli sablon deneyin', xp: 25, shape: 'square' },
    { name: 'Tum Sablonlar', desc: '20 sablonun hepsini deneyin', xp: 40, shape: 'square' },
    { name: 'Sablon Ozellestir', desc: 'Sablonu ozellestiriniz', xp: 20, shape: 'square' },
    { name: 'Sablon Ustasi', desc: '50 belge sablonla olusturun', xp: 60, shape: 'triangle' },
    { name: 'Sablon Efsanesi', desc: '100 belge sablonla', xp: 100, shape: 'star' },
    // Branch: Specific templates
    { name: 'Toplanti Notu', desc: 'Toplanti sablonu kullanin', xp: 10, shape: 'circle', branchFrom: 4 },
    { name: 'Sozlesme Yaz', desc: 'Sozlesme sablonu', xp: 15, shape: 'circle' },
    { name: 'SWOT Analizi', desc: 'SWOT sablonu kullanin', xp: 15, shape: 'square' },
    { name: 'Sertifika Olustur', desc: 'Sertifika sablonu', xp: 15, shape: 'square' },
    { name: 'Etkinlik Afisi', desc: 'Etkinlik afisi olusturun', xp: 20, shape: 'square' },
    { name: 'Is Plani', desc: 'Is plani sablonu kullanin', xp: 25, shape: 'triangle' },
    { name: 'Sunum Olustur', desc: 'Sunum sablonu kullanin', xp: 20, shape: 'square' },
  ],
  color: [
    { name: 'Ilk Renk', desc: 'Bir renge tiklayin', xp: 5, shape: 'circle' },
    { name: 'Ozel Renk', desc: 'Ozel renk secin', xp: 10, shape: 'circle' },
    { name: 'Gradient Kesfi', desc: 'Ilk gradientinizi uygulayin', xp: 10, shape: 'circle' },
    { name: 'Bes Gradient', desc: '5 farkli gradient deneyin', xp: 15, shape: 'circle' },
    { name: 'Metin Rengi', desc: 'Metin rengini degistirin', xp: 10, shape: 'circle' },
    { name: 'Sekil Rengi', desc: 'Sekle gradient uygulayin', xp: 15, shape: 'circle' },
    { name: 'Renk Paleti', desc: '10 farkli renk kullanin', xp: 20, shape: 'square' },
    { name: 'Renk Harmonisi', desc: 'Uyumlu renkler kullanin', xp: 25, shape: 'square' },
    { name: 'Gokkusagi', desc: 'Tum renkleri kullanin', xp: 30, shape: 'square' },
    { name: 'Renk Ustasi', desc: '100 renk degisikligi', xp: 50, shape: 'triangle' },
    { name: 'Renk Sihirbazi', desc: '300 renk degisikligi', xp: 80, shape: 'triangle' },
    { name: 'Renk Tanrisi', desc: '500 renk degisikligi', xp: 150, shape: 'star' },
    // Branch: Highlight
    { name: 'Ilk Isaret', desc: 'Highlighter kullanin', xp: 10, shape: 'circle', branchFrom: 4 },
    { name: 'Bes Isaret', desc: '5 metin isaretleyin', xp: 15, shape: 'circle' },
    { name: 'Renkli Isaret', desc: '3 farkli renk ile isaretleyin', xp: 20, shape: 'square' },
    { name: 'Isaret Ustasi', desc: '50 metin isaretleyin', xp: 40, shape: 'triangle' },
    { name: 'Isaret Efsanesi', desc: '200 metin isaretleyin', xp: 80, shape: 'star' },
    // Branch: Theme
    { name: 'Koyu Tema', desc: 'Koyu temayi deneyin', xp: 5, shape: 'circle', branchFrom: 0 },
    { name: 'Acik Tema', desc: 'Acik temayi deneyin', xp: 5, shape: 'circle' },
    { name: 'Tema Degistirici', desc: '20 kez tema degistirin', xp: 20, shape: 'square' },
  ],
  chart: [
    { name: 'Ilk Grafik', desc: 'Bir grafik olusturun', xp: 15, shape: 'circle' },
    { name: 'Bar Grafik', desc: 'Bar grafik olusturun', xp: 15, shape: 'circle' },
    { name: 'Pasta Grafik', desc: 'Pasta grafik olusturun', xp: 15, shape: 'circle' },
    { name: 'Cizgi Grafik', desc: 'Cizgi grafik olusturun', xp: 15, shape: 'circle' },
    { name: 'Uc Tur', desc: '3 grafik turunu deneyin', xp: 20, shape: 'square' },
    { name: 'Gradient Grafik', desc: 'Grafige gradient uygulayin', xp: 20, shape: 'square' },
    { name: 'Bes Grafik', desc: '5 grafik olusturun', xp: 25, shape: 'square' },
    { name: 'On Grafik', desc: '10 grafik olusturun', xp: 35, shape: 'triangle' },
    { name: 'Grafik Ustasi', desc: '25 grafik olusturun', xp: 60, shape: 'triangle' },
    { name: 'Veri Bilimci', desc: '50 grafik olusturun', xp: 100, shape: 'star' },
    // Branch: Tables
    { name: 'Ilk Tablo', desc: 'Bir tablo olusturun', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Bes Tablo', desc: '5 tablo olusturun', xp: 20, shape: 'square' },
    { name: 'Tablo Ustasi', desc: '20 tablo olusturun', xp: 40, shape: 'triangle' },
    { name: 'Tablo Efsanesi', desc: '50 tablo olusturun', xp: 80, shape: 'star' },
    // Branch: QR
    { name: 'Ilk QR', desc: 'QR kod olusturun', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Bes QR', desc: '5 QR kod olusturun', xp: 20, shape: 'square' },
    { name: 'QR Ustasi', desc: '20 QR kod', xp: 40, shape: 'triangle' },
  ],
  collab: [
    { name: 'Profil Olustur', desc: 'Profilinizi tamamlayin', xp: 10, shape: 'circle' },
    { name: 'Fotograf Ekle', desc: 'Profil fotografi ekleyin', xp: 10, shape: 'circle' },
    { name: 'Isim Degistir', desc: 'Profil adinizi degistirin', xp: 5, shape: 'circle' },
    { name: 'Ilk Paylas', desc: 'Bir belgeyi paylasin', xp: 15, shape: 'circle' },
    { name: 'Bes Paylasim', desc: '5 belge paylasin', xp: 20, shape: 'square' },
    { name: 'On Paylasim', desc: '10 belge paylasin', xp: 30, shape: 'square' },
    { name: 'Sosyal Kelebek', desc: '25 paylasim yapin', xp: 50, shape: 'triangle' },
    { name: 'Iletisim Ustasi', desc: '50 paylasim yapin', xp: 80, shape: 'triangle' },
    { name: 'Topluluk Lideri', desc: '100 paylasim', xp: 150, shape: 'star' },
    // Branch: Settings
    { name: 'Dil Degistir', desc: 'Uygulama dilini degistirin', xp: 5, shape: 'circle', branchFrom: 0 },
    { name: 'Tema Degistir', desc: 'Koyu/acik tema deneyin', xp: 5, shape: 'circle' },
    { name: 'Ayar Ustasi', desc: 'Tum ayarlari kesfedin', xp: 20, shape: 'square' },
    { name: 'Kisayol Kralı', desc: 'Tum kisayollari ozellestiriniz', xp: 30, shape: 'triangle' },
    // Branch: Fast Select
    { name: 'Fast Select', desc: 'Fast Select kullanin', xp: 10, shape: 'circle', branchFrom: 2 },
    { name: 'FS Ozellestir', desc: 'Fast Select araclarini degistirin', xp: 15, shape: 'square' },
    { name: 'FS Ustasi', desc: '100 kez Fast Select kullanin', xp: 40, shape: 'triangle' },
  ],
  export: [
    { name: 'Ilk Export', desc: 'Bir belgeyi disa aktarin', xp: 10, shape: 'circle' },
    { name: 'PNG Export', desc: 'PNG olarak kaydedin', xp: 10, shape: 'circle' },
    { name: 'PDF Export', desc: 'PDF olarak kaydedin', xp: 10, shape: 'circle' },
    { name: 'JSON Export', desc: 'Proje dosyasi kaydedin', xp: 15, shape: 'circle' },
    { name: 'Bes Export', desc: '5 belge disa aktarin', xp: 20, shape: 'square' },
    { name: 'On Export', desc: '10 belge disa aktarin', xp: 25, shape: 'square' },
    { name: 'Yirmi Export', desc: '20 belge disa aktarin', xp: 35, shape: 'square' },
    { name: 'Export Ustasi', desc: '50 belge disa aktarin', xp: 60, shape: 'triangle' },
    { name: 'Yayinci Pro', desc: '100 belge disa aktarin', xp: 100, shape: 'triangle' },
    { name: 'Mega Yayinci', desc: '200 belge disa aktarin', xp: 180, shape: 'star' },
    // Branch: PDF import
    { name: 'PDF Ice Aktar', desc: 'Bir PDF dosyasi ice aktarin', xp: 15, shape: 'circle', branchFrom: 2 },
    { name: 'Bes PDF', desc: '5 PDF ice aktarin', xp: 25, shape: 'square' },
    { name: 'On PDF', desc: '10 PDF ice aktarin', xp: 35, shape: 'square' },
    { name: 'PDF Ustasi', desc: '50 PDF ice aktarin', xp: 80, shape: 'triangle' },
    { name: 'PDF Efsanesi', desc: '100 PDF ice aktarin', xp: 150, shape: 'star' },
    // Branch: Email
    { name: 'Mail Gonder', desc: 'Belgeyi e-posta ile gonderin', xp: 15, shape: 'circle', branchFrom: 4 },
    { name: 'Bes Mail', desc: '5 e-posta gonderin', xp: 25, shape: 'square' },
    { name: 'Mail Ustasi', desc: '20 e-posta gonderin', xp: 50, shape: 'triangle' },
  ],
  photo: [
    { name: 'Fotograf Yukle', desc: 'Bir fotograf yukleyin', xp: 5, shape: 'circle' },
    { name: 'AI Duzenleme', desc: 'AI ile fotograf duzenleyin', xp: 15, shape: 'circle' },
    { name: 'Kirpma', desc: 'Fotografi kirpin', xp: 10, shape: 'circle' },
    { name: 'Boyutlandir', desc: 'Fotografi boyutlandirin', xp: 10, shape: 'circle' },
    { name: 'Filtre Uygula', desc: 'AI filtre uygulayin', xp: 15, shape: 'circle' },
    { name: 'Bes Duzenleme', desc: '5 fotograf duzenleyin', xp: 20, shape: 'square' },
    { name: 'On Duzenleme', desc: '10 fotograf duzenleyin', xp: 30, shape: 'square' },
    { name: 'Yirmi Duzenleme', desc: '20 fotograf duzenleyin', xp: 40, shape: 'square' },
    { name: 'Fotograf Sanatcisi', desc: '50 duzenleme yapin', xp: 70, shape: 'triangle' },
    { name: 'Fotograf Ustasi', desc: '100 duzenleme yapin', xp: 120, shape: 'triangle' },
    { name: 'Fotograf Efsanesi', desc: '200 duzenleme yapin', xp: 200, shape: 'star' },
    // Branch: Shapes with images
    { name: 'Sekle Resim', desc: 'Sekle resim ekleyin', xp: 15, shape: 'circle', branchFrom: 0 },
    { name: 'Bes Sekil Resim', desc: '5 sekle resim ekleyin', xp: 25, shape: 'square' },
    { name: 'Mozaik', desc: '10 sekle resim ekleyin', xp: 40, shape: 'triangle' },
    { name: 'Mozaik Ustasi', desc: '25 mozaik olusturun', xp: 70, shape: 'star' },
    // Branch: Pro editing
    { name: 'Pro Duzenleme', desc: 'Pro modda fotograf duzenleyin', xp: 20, shape: 'square', branchFrom: 4 },
    { name: 'Bes Pro', desc: '5 Pro duzenleme yapin', xp: 35, shape: 'square' },
    { name: 'Pro Fotograf', desc: '20 Pro duzenleme', xp: 60, shape: 'triangle' },
    { name: 'Pro Efsane', desc: '50 Pro duzenleme', xp: 120, shape: 'star' },
  ],
  text: [
    { name: 'Ilk Metin', desc: "Canvas'a metin ekleyin", xp: 5, shape: 'circle' },
    { name: 'Kalin Yazi', desc: 'Bold formatlama', xp: 5, shape: 'circle' },
    { name: 'Italik Yazi', desc: 'Italic formatlama', xp: 5, shape: 'circle' },
    { name: 'Alti Cizili', desc: 'Underline formatlama', xp: 5, shape: 'circle' },
    { name: 'Ustu Cizili', desc: 'Strikethrough formatlama', xp: 5, shape: 'circle' },
    { name: 'Font Degistir', desc: 'Farkli font kullanin', xp: 10, shape: 'circle' },
    { name: 'Bes Font', desc: '5 farkli font deneyin', xp: 15, shape: 'circle' },
    { name: 'On Font', desc: '10 farkli font deneyin', xp: 20, shape: 'square' },
    { name: 'Font Ustasi', desc: '30 farkli font kullanin', xp: 35, shape: 'square' },
    { name: 'Boyut Degistir', desc: 'Font boyutunu degistirin', xp: 10, shape: 'circle' },
    { name: 'Hizalama', desc: 'Metin hizalamasini degistirin', xp: 10, shape: 'circle' },
    { name: 'Satir Araligi', desc: 'Satir araligini ayarlayin', xp: 10, shape: 'circle' },
    { name: 'Girinti', desc: 'Metin girintisi ekleyin', xp: 10, shape: 'circle' },
    { name: 'Tum Formatlar', desc: 'Tum format seceneklerini deneyin', xp: 30, shape: 'square' },
    { name: 'Tipografi Ustasi', desc: '100 metin formatlamasi', xp: 60, shape: 'triangle' },
    { name: 'Kaligrafi Efsanesi', desc: '500 metin formatlamasi', xp: 150, shape: 'star' },
    // Branch: Translation
    { name: 'Ceviri Yap', desc: 'Bir metni cevirin', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Bes Ceviri', desc: '5 metin cevirin', xp: 25, shape: 'square' },
    { name: 'On Ceviri', desc: '10 metin cevirin', xp: 35, shape: 'square' },
    { name: 'Polyglot', desc: '5 farkli dile cevirin', xp: 50, shape: 'triangle' },
    { name: 'Ceviri Efsanesi', desc: '10 dile cevirin', xp: 100, shape: 'star' },
    // Branch: Special text
    { name: 'Baslik Stili', desc: 'Baslik formati kullanin', xp: 10, shape: 'circle', branchFrom: 1 },
    { name: 'Alt Baslik', desc: 'Alt baslik ekleyin', xp: 10, shape: 'circle' },
    { name: 'Liste Olustur', desc: 'Maddeli liste yapın', xp: 15, shape: 'square' },
    { name: 'Metin Kutusu', desc: 'Ozel metin kutusu olusturun', xp: 20, shape: 'square' },
  ],
  shape: [
    { name: 'Kare Ciz', desc: 'Bir kare ekleyin', xp: 5, shape: 'circle' },
    { name: 'Daire Ciz', desc: 'Bir daire ekleyin', xp: 5, shape: 'circle' },
    { name: 'Ucgen Ciz', desc: 'Bir ucgen ekleyin', xp: 5, shape: 'circle' },
    { name: 'Yildiz Ciz', desc: 'Bir yildiz ekleyin', xp: 10, shape: 'circle' },
    { name: 'Halka Ciz', desc: 'Bir halka ekleyin', xp: 10, shape: 'circle' },
    { name: 'Bes Sekil', desc: 'Hepsini deneyin', xp: 15, shape: 'circle' },
    { name: 'Renkli Sekiller', desc: 'Sekillere renk verin', xp: 15, shape: 'circle' },
    { name: 'Gradient Sekiller', desc: 'Gradient sekiller yapin', xp: 20, shape: 'square' },
    { name: 'Resimli Sekiller', desc: 'Sekillere resim koyun', xp: 20, shape: 'square' },
    { name: 'On Sekil Tasarim', desc: '10 sekilli tasarim', xp: 25, shape: 'square' },
    { name: 'Yirmi Sekil', desc: '20 sekilli tasarim', xp: 35, shape: 'triangle' },
    { name: 'Elli Sekil', desc: '50 sekilli tasarim', xp: 50, shape: 'triangle' },
    { name: 'Geometri Dehasi', desc: '100 sekilli tasarim', xp: 80, shape: 'triangle' },
    { name: 'Sekil Efsanesi', desc: '200 sekilli tasarim', xp: 150, shape: 'star' },
    // Branch: Lasso
    { name: 'Lasso Kullan', desc: 'Lasso aracini kullanin', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Coklu Secim', desc: '5 eleman secin', xp: 20, shape: 'square' },
    { name: 'Secim Ustasi', desc: '20 eleman secin', xp: 35, shape: 'triangle' },
    // Branch: Layers
    { name: 'Katman Ekle', desc: 'Katman olusturun', xp: 15, shape: 'circle', branchFrom: 7 },
    { name: 'Bes Katman', desc: '5 katmanli tasarim', xp: 25, shape: 'square' },
    { name: 'Katman Ustasi', desc: '10 katmanli tasarim', xp: 40, shape: 'triangle' },
    { name: 'Katman Efsanesi', desc: '20 katmanli tasarim', xp: 70, shape: 'star' },
  ],
  judge: [
    { name: 'Judge Tanis', desc: 'ZET Judge i acin', xp: 15, shape: 'circle' },
    { name: 'Ilk Analiz', desc: 'Ilk temel analizi yapin', xp: 20, shape: 'circle' },
    { name: 'Metin Analizi', desc: 'Bir metin analiz ettirin', xp: 20, shape: 'circle' },
    { name: 'Bes Analiz', desc: '5 temel analiz yapin', xp: 30, shape: 'square' },
    { name: 'On Analiz', desc: '10 temel analiz yapin', xp: 40, shape: 'square' },
    { name: 'Derin Analiz', desc: 'Ilk derin analiz yapin', xp: 35, shape: 'square' },
    { name: 'Bes Derin', desc: '5 derin analiz yapin', xp: 50, shape: 'triangle' },
    { name: 'On Derin', desc: '10 derin analiz yapin', xp: 60, shape: 'triangle' },
    { name: 'Yirmi Analiz', desc: '20 toplam analiz', xp: 40, shape: 'square' },
    { name: 'Elli Analiz', desc: '50 toplam analiz', xp: 60, shape: 'triangle' },
    { name: 'Analiz Ustasi', desc: '100 toplam analiz', xp: 100, shape: 'triangle' },
    { name: 'Judge Yardimcisi', desc: '200 toplam analiz', xp: 150, shape: 'triangle' },
    { name: 'Hakim', desc: '500 toplam analiz', xp: 300, shape: 'star' },
    // Branch: Judge mood
    { name: 'Sert Mod', desc: 'Sert modu deneyin', xp: 15, shape: 'circle', branchFrom: 1 },
    { name: 'Normal Mod', desc: 'Normal modu deneyin', xp: 10, shape: 'circle' },
    { name: 'Mod Ustasi', desc: 'Her iki modu kullanin', xp: 25, shape: 'square' },
    { name: 'Mod Efsanesi', desc: '50 kez mod degistirin', xp: 50, shape: 'triangle' },
    // Branch: Document analysis
    { name: 'Belge Analizi', desc: 'Belge icerigini analiz ettirin', xp: 20, shape: 'circle', branchFrom: 3 },
    { name: 'Karsilastir', desc: '2 belgeyi karsilastirin', xp: 25, shape: 'square' },
    { name: 'Detayli Rapor', desc: 'Detayli analiz raporu alin', xp: 35, shape: 'triangle' },
    { name: 'Analiz Kiyaslama', desc: '3 belgeyi karsilastirin', xp: 40, shape: 'triangle' },
    { name: 'Analiz Pro', desc: '10 detayli rapor alin', xp: 70, shape: 'star' },
  ],
  master: [
    { name: 'Acemi', desc: 'Ilk 10 gorevi tamamla', xp: 50, shape: 'circle' },
    { name: 'Cirak', desc: '25 gorevi tamamla', xp: 80, shape: 'circle' },
    { name: 'Kalfa', desc: '50 gorevi tamamla', xp: 100, shape: 'square' },
    { name: 'Usta', desc: '100 gorevi tamamla', xp: 150, shape: 'square' },
    { name: 'Uzman', desc: '150 gorevi tamamla', xp: 200, shape: 'square' },
    { name: 'Bilge', desc: '200 gorevi tamamla', xp: 250, shape: 'triangle' },
    { name: 'Maestro', desc: '300 gorevi tamamla', xp: 350, shape: 'triangle' },
    { name: 'Buyuk Usta', desc: '400 gorevi tamamla', xp: 500, shape: 'star' },
    { name: 'Efsane', desc: '500 gorevi tamamla', xp: 1000, shape: 'star' },
    // Side chain
    { name: '1000 XP', desc: '1000 XP kazan', xp: 30, shape: 'circle', branchFrom: 0 },
    { name: '5000 XP', desc: '5000 XP kazan', xp: 50, shape: 'square' },
    { name: '10000 XP', desc: '10000 XP kazan', xp: 80, shape: 'triangle' },
    { name: '25000 XP', desc: '25000 XP kazan', xp: 120, shape: 'triangle' },
    { name: '50000 XP', desc: '50000 XP kazan', xp: 200, shape: 'star' },
    // Side chain 2
    { name: 'Gunluk Giris', desc: '7 gun ust uste giris', xp: 20, shape: 'circle', branchFrom: 1 },
    { name: 'Haftalik', desc: '30 gun giris yapin', xp: 40, shape: 'square' },
    { name: 'Aylik', desc: '90 gun giris yapin', xp: 70, shape: 'triangle' },
    { name: 'Yillik', desc: '365 gun giris yapin', xp: 200, shape: 'star' },
    // Side chain 3
    { name: 'Cok Kategorili', desc: '5 kategoriden gorev tamamla', xp: 40, shape: 'square', branchFrom: 3 },
    { name: 'Her Kategoriden', desc: 'Her kategoriden 1 gorev', xp: 60, shape: 'triangle' },
    { name: 'Evrensel Usta', desc: 'Her kategoride 10 gorev', xp: 150, shape: 'star' },
    // Side chain 4
    { name: 'Hizli Tamamlayici', desc: '1 gunde 10 gorev tamamla', xp: 30, shape: 'square', branchFrom: 4 },
    { name: 'Super Tamamlayici', desc: '1 gunde 20 gorev', xp: 50, shape: 'triangle' },
    { name: 'Ultra Tamamlayici', desc: '1 gunde 30 gorev', xp: 80, shape: 'triangle' },
    { name: 'Imkansiz Hiz', desc: '1 gunde 50 gorev', xp: 150, shape: 'star' },
  ],
  legend: [
    { name: 'Tum Araclar', desc: 'Her araci en az 1 kez kullan', xp: 100, shape: 'triangle' },
    { name: 'Tum Sablonlar', desc: '20 sablonun hepsini dene', xp: 80, shape: 'triangle' },
    { name: 'Tum Sekiller', desc: 'Her sekil turunu kullan', xp: 60, shape: 'square' },
    { name: 'AI Master', desc: '100 AI islem yap', xp: 100, shape: 'triangle' },
    { name: 'Kredi Canavari', desc: 'Bir gunde tum kredileri harca', xp: 50, shape: 'square' },
    { name: 'Gece Kusu', desc: 'Gece 3 te belge olustur', xp: 30, shape: 'square' },
    { name: 'Sabahci', desc: 'Sabah 6 da belge olustur', xp: 30, shape: 'square' },
    { name: 'Hiz Seytani', desc: '1 dakikada 10 eleman ekle', xp: 40, shape: 'triangle' },
    { name: 'Perfectionist', desc: 'Bir belgeyi 50 kez duzenle', xp: 60, shape: 'triangle' },
    { name: 'Cok Yonlu', desc: 'Tum kategorilerden gorev tamamla', xp: 80, shape: 'triangle' },
    { name: 'ZET Krali', desc: 'Tum kategorilerde usta ol', xp: 200, shape: 'star' },
    { name: 'Imkansiz', desc: 'Tum gorevleri tamamla', xp: 500, shape: 'star' },
    // Side
    { name: 'Ctrl+Z Ustasi', desc: '100 geri alma yapin', xp: 20, shape: 'circle', branchFrom: 0 },
    { name: 'Sansur Uzmani', desc: '20 metin sansurleyin', xp: 30, shape: 'square' },
    { name: 'Imza Sanatcisi', desc: '10 dijital imza ekleyin', xp: 35, shape: 'triangle' },
    { name: 'Filigran Ustasi', desc: '20 filigran ekleyin', xp: 40, shape: 'triangle' },
    { name: 'Efsane Tamamlayici', desc: 'Tum efsane gorevleri', xp: 300, shape: 'star' },
    // Side 2
    { name: 'Hafta Sonu', desc: 'Hafta sonunda calis', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Gece Vardiyasi', desc: '10 gece calismasi', xp: 25, shape: 'square' },
    { name: 'Baykus', desc: '50 gece calismasi', xp: 50, shape: 'triangle' },
    { name: 'Gece Efsanesi', desc: '200 gece calismasi', xp: 120, shape: 'star' },
    // Side 3
    { name: 'Tum Araclari Kullan', desc: 'Her araci en az 5 kez', xp: 40, shape: 'square', branchFrom: 2 },
    { name: 'Arac Eksperi', desc: 'Her araci en az 20 kez', xp: 80, shape: 'triangle' },
    { name: 'Arac Tanrisi', desc: 'Her araci en az 100 kez', xp: 200, shape: 'star' },
  ],
  secret: [
    { name: 'Kesfici', desc: 'Gizli menuyu bulun', xp: 20, shape: 'circle' },
    { name: 'Kisayol Ustasi', desc: '10 kisayol kullanin', xp: 15, shape: 'circle' },
    { name: 'Tum Kisayollar', desc: 'Her kisayolu deneyin', xp: 30, shape: 'square' },
    { name: 'Easter Egg', desc: 'Gizli ozelligi bulun', xp: 50, shape: 'triangle' },
    { name: 'Hacker', desc: 'Tum gizli ozellikleri kesfedin', xp: 80, shape: 'star' },
    { name: 'Sag Tik Ustasi', desc: 'Sag tik menusunu kullanin', xp: 10, shape: 'circle' },
    { name: 'Zoom Ustasi', desc: 'Tum zoom seviyelerini deneyin', xp: 15, shape: 'circle' },
    { name: 'Katman Ustasi', desc: 'Katmanlarla calisin', xp: 20, shape: 'square' },
    { name: 'Filigran Ekle', desc: 'Filigran aracini kullanin', xp: 20, shape: 'square' },
    { name: 'Ayna Kullan', desc: 'Ayna aracini kullanin', xp: 15, shape: 'circle' },
    { name: 'Sesle Yaz', desc: 'Sesle yazma aracini kullanin', xp: 20, shape: 'square' },
    { name: 'Gizli Usta', desc: 'Tum gizli gorevleri tamamla', xp: 100, shape: 'star' },
    // Side
    { name: 'Kenar Bosluklari', desc: 'Kenar bosluklari ayarlayin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Sayfa Rengi', desc: 'Sayfa rengini degistirin', xp: 10, shape: 'circle' },
    { name: 'Coklu Sayfa', desc: '5 sayfalik belge olusturun', xp: 25, shape: 'square' },
    { name: 'On Sayfa', desc: '10 sayfalik belge', xp: 40, shape: 'triangle' },
    { name: 'Yirmi Sayfa', desc: '20 sayfalik belge', xp: 60, shape: 'triangle' },
    { name: 'Kitap Yaz', desc: '50 sayfalik belge', xp: 120, shape: 'star' },
    // Side 2
    { name: 'Gizli Kombo', desc: 'Ctrl+Shift+Z deneyin', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Cift Tik', desc: 'Cift tik ile duzenleme', xp: 10, shape: 'circle' },
    { name: 'Surukleme', desc: 'Drag & drop kullanin', xp: 10, shape: 'circle' },
    { name: 'Etkileşim Ustasi', desc: 'Tum etkilesimleri ogren', xp: 40, shape: 'triangle' },
  ],
  speed: [
    { name: 'Hizli Basla', desc: '30 saniyede belge olustur', xp: 10, shape: 'circle' },
    { name: 'Dakika Ustasi', desc: '1 dakikada 5 eleman ekle', xp: 15, shape: 'circle' },
    { name: 'Hizli Yazan', desc: '1 dakikada 100 kelime yaz', xp: 20, shape: 'circle' },
    { name: 'Sprint', desc: '5 dakikada belge tamamla', xp: 25, shape: 'square' },
    { name: 'Verimli Calisan', desc: '10 dakikada 3 belge', xp: 30, shape: 'square' },
    { name: 'Hiz Rekoru', desc: '1 dakikada 10 eleman', xp: 40, shape: 'triangle' },
    { name: 'Flash', desc: '30 saniyede 5 eleman', xp: 50, shape: 'triangle' },
    { name: 'Isik Hizi', desc: '10 saniyede 3 eleman', xp: 60, shape: 'triangle' },
    { name: 'Zamani Durduran', desc: '500 hizli islem yap', xp: 100, shape: 'star' },
    // Branch: Consistency
    { name: 'Her Gun Calis', desc: '3 gun ust uste calisin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Haftalik Rutin', desc: '7 gun ust uste', xp: 20, shape: 'square' },
    { name: 'Aylik Rutin', desc: '30 gun ust uste', xp: 40, shape: 'triangle' },
    { name: 'Disiplin Ustasi', desc: '90 gun ust uste', xp: 80, shape: 'triangle' },
    { name: 'Demir Irade', desc: '365 gun ust uste', xp: 200, shape: 'star' },
    // Branch: Efficiency
    { name: 'Kisayol Kullan', desc: '10 kisayol kullanin', xp: 10, shape: 'circle', branchFrom: 3 },
    { name: 'Elli Kisayol', desc: '50 kisayol kullanin', xp: 25, shape: 'square' },
    { name: 'Kisayol Kralı', desc: '200 kisayol kullanin', xp: 50, shape: 'triangle' },
    { name: 'Verimlilik Tanrisi', desc: '1000 kisayol', xp: 120, shape: 'star' },
    // Branch: Multitask
    { name: 'Coklu Gorev', desc: 'Ayni anda 3 belge ac', xp: 10, shape: 'circle', branchFrom: 6 },
    { name: 'Bes Belge Ac', desc: '5 belge ayni anda', xp: 20, shape: 'square' },
    { name: 'On Belge Ac', desc: '10 belge ayni anda', xp: 35, shape: 'triangle' },
    { name: 'Coklu Gorev Ustasi', desc: '20 belge ayni anda', xp: 60, shape: 'star' },
  ],
  creative: [
    { name: 'Ilk Yaratim', desc: 'Ozel bir tasarim yapin', xp: 10, shape: 'circle' },
    { name: 'Renk Deneyimi', desc: '5 renk kombinasyonu deneyin', xp: 15, shape: 'circle' },
    { name: 'Karisik Medya', desc: 'Metin + sekil + resim birlestirin', xp: 20, shape: 'circle' },
    { name: 'Simetri', desc: 'Simetrik tasarim yapin', xp: 20, shape: 'square' },
    { name: 'Minimalist', desc: 'Minimalist bir tasarim', xp: 15, shape: 'circle' },
    { name: 'Maksimalist', desc: '30+ elemanli tasarim', xp: 30, shape: 'square' },
    { name: 'Poster Tasarla', desc: 'Bir poster olusturun', xp: 25, shape: 'square' },
    { name: 'Logo Tasarla', desc: 'Basit bir logo olusturun', xp: 30, shape: 'square' },
    { name: 'Kartvizit', desc: 'Kartvizit tasarlayin', xp: 25, shape: 'square' },
    { name: 'Infografik', desc: 'Bir infografik olusturun', xp: 40, shape: 'triangle' },
    { name: 'Portfolyo', desc: 'Portfolyo sayfasi olusturun', xp: 50, shape: 'triangle' },
    { name: 'Yaratici Deha', desc: '50 ozel tasarim yapin', xp: 80, shape: 'triangle' },
    { name: 'Sanat Eseri', desc: '100 ozel tasarim yapin', xp: 150, shape: 'star' },
    // Branch: AI Creative
    { name: 'AI + Tasarim', desc: 'AI gorsel ile tasarim yapin', xp: 20, shape: 'circle', branchFrom: 2 },
    { name: 'AI Kolaj', desc: '5 AI gorsel ile kolaj', xp: 30, shape: 'square' },
    { name: 'AI Sergi', desc: '20 AI destekli tasarim', xp: 50, shape: 'triangle' },
    { name: 'AI Sanat', desc: '50 AI destekli tasarim', xp: 100, shape: 'star' },
    // Branch: Presentations
    { name: 'Ilk Sunum', desc: 'Sunum formatinda belge', xp: 15, shape: 'circle', branchFrom: 6 },
    { name: 'Bes Sunum', desc: '5 sunum olusturun', xp: 25, shape: 'square' },
    { name: 'Sunum Ustasi', desc: '20 sunum olusturun', xp: 50, shape: 'triangle' },
    { name: 'Sunum Efsanesi', desc: '50 sunum olusturun', xp: 100, shape: 'star' },
    // Branch: Branding
    { name: 'Marka Rengi', desc: 'Tutarli renk paleti kullanin', xp: 15, shape: 'circle', branchFrom: 7 },
    { name: 'Marka Fontu', desc: 'Tutarli font seti kullanin', xp: 15, shape: 'circle' },
    { name: 'Marka Kimligi', desc: 'Tam marka kimligi olusturun', xp: 30, shape: 'square' },
    { name: 'Kurumsal Kimlik', desc: '5 markali belge olusturun', xp: 40, shape: 'triangle' },
    { name: 'Marka Ustasi', desc: '20 markali belge olusturun', xp: 70, shape: 'triangle' },
    { name: 'Marka Efsanesi', desc: '50 markali belge', xp: 120, shape: 'star' },
    // Branch: Art styles
    { name: 'Minimalist Stil', desc: 'Minimalist tasarim yapin', xp: 10, shape: 'circle', branchFrom: 4 },
    { name: 'Retro Stil', desc: 'Retro tarzi tasarim', xp: 15, shape: 'circle' },
    { name: 'Modern Stil', desc: 'Modern tasarim yapin', xp: 15, shape: 'circle' },
    { name: 'Neon Stil', desc: 'Neon renkli tasarim', xp: 20, shape: 'square' },
    { name: 'Stil Koleksiyoncusu', desc: '5 farkli stilde tasarim', xp: 40, shape: 'triangle' },
    { name: 'Stil Efsanesi', desc: '10 farkli stilde tasarim', xp: 80, shape: 'star' },
  ],
  productivity: [
    { name: 'Ilk Oturum', desc: '1 saatlik calisma oturumu', xp: 10, shape: 'circle' },
    { name: 'Odaklan', desc: '2 saat kesintisiz calis', xp: 15, shape: 'circle' },
    { name: 'Pomodoro', desc: '4 pomodoro tamamla', xp: 20, shape: 'circle' },
    { name: 'Gunluk Hedef', desc: 'Gunluk hedefinizi belirleyin', xp: 10, shape: 'circle' },
    { name: 'Haftalik Plan', desc: 'Haftalik plan olusturun', xp: 15, shape: 'circle' },
    { name: 'Beş Oturum', desc: '5 calisma oturumu', xp: 20, shape: 'square' },
    { name: 'On Oturum', desc: '10 calisma oturumu', xp: 30, shape: 'square' },
    { name: 'Yirmi Oturum', desc: '20 calisma oturumu', xp: 40, shape: 'square' },
    { name: 'Elli Oturum', desc: '50 calisma oturumu', xp: 60, shape: 'triangle' },
    { name: 'Yuz Oturum', desc: '100 calisma oturumu', xp: 100, shape: 'triangle' },
    { name: 'Uretkenlik Krali', desc: '200 calisma oturumu', xp: 200, shape: 'star' },
    // Branch: Time management
    { name: 'Sabah Rutini', desc: 'Sabah 8 den once basla', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Aksam Rutini', desc: 'Aksam oturumu tamamla', xp: 10, shape: 'circle' },
    { name: 'Cift Oturum', desc: 'Gunde 2 oturum yap', xp: 20, shape: 'square' },
    { name: 'Uc Oturum', desc: 'Gunde 3 oturum yap', xp: 30, shape: 'triangle' },
    { name: 'Maraton', desc: 'Gunde 5 oturum yap', xp: 50, shape: 'star' },
    // Branch: Goals
    { name: 'Hedef Koy', desc: '3 hedef belirleyin', xp: 10, shape: 'circle', branchFrom: 3 },
    { name: 'Hedef Tamamla', desc: 'Ilk hedefinizi tamamlayin', xp: 15, shape: 'circle' },
    { name: 'Bes Hedef', desc: '5 hedef tamamlayin', xp: 25, shape: 'square' },
    { name: 'On Hedef', desc: '10 hedef tamamlayin', xp: 40, shape: 'triangle' },
    { name: 'Hedef Makinesi', desc: '25 hedef tamamlayin', xp: 80, shape: 'star' },
    // Branch: Streak
    { name: 'Uc Gun', desc: '3 gun ust uste calis', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Bir Hafta', desc: '7 gun ust uste calis', xp: 25, shape: 'square' },
    { name: 'Iki Hafta', desc: '14 gun ust uste calis', xp: 40, shape: 'triangle' },
    { name: 'Bir Ay', desc: '30 gun ust uste calis', xp: 70, shape: 'triangle' },
    { name: 'Uc Ay', desc: '90 gun ust uste calis', xp: 150, shape: 'star' },
  ],
  social: [
    { name: 'Ilk Paylasim', desc: 'Bir belge paylasin', xp: 10, shape: 'circle' },
    { name: 'Link Olustur', desc: 'Paylasim linki olusturun', xp: 10, shape: 'circle' },
    { name: 'Mail ile Paylas', desc: 'E-posta ile belge gonderin', xp: 15, shape: 'circle' },
    { name: 'Uc Paylasim', desc: '3 belge paylasin', xp: 15, shape: 'circle' },
    { name: 'Bes Paylasim', desc: '5 belge paylasin', xp: 20, shape: 'square' },
    { name: 'On Paylasim', desc: '10 belge paylasin', xp: 30, shape: 'square' },
    { name: 'Yirmi Paylasim', desc: '20 belge paylasin', xp: 40, shape: 'square' },
    { name: 'Elli Paylasim', desc: '50 belge paylasin', xp: 60, shape: 'triangle' },
    { name: 'Yuz Paylasim', desc: '100 belge paylasin', xp: 100, shape: 'triangle' },
    { name: 'Sosyal Efsane', desc: '200 paylasim yapin', xp: 200, shape: 'star' },
    // Branch: Feedback
    { name: 'Geri Bildirim', desc: 'Geri bildirim alin', xp: 10, shape: 'circle', branchFrom: 2 },
    { name: 'Bes Yorum', desc: '5 geri bildirim alin', xp: 20, shape: 'square' },
    { name: 'Populer', desc: '20 geri bildirim alin', xp: 40, shape: 'triangle' },
    { name: 'Viral', desc: '50 geri bildirim alin', xp: 80, shape: 'star' },
    // Branch: Export sharing
    { name: 'PDF Paylas', desc: 'PDF olarak paylasin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'PNG Paylas', desc: 'PNG olarak paylasin', xp: 10, shape: 'circle' },
    { name: 'Coklu Format', desc: '3 formatta paylasin', xp: 20, shape: 'square' },
    { name: 'Format Ustasi', desc: 'Tum formatlarda paylasin', xp: 40, shape: 'triangle' },
    { name: 'Format Efsanesi', desc: '50 coklu format paylasimi', xp: 80, shape: 'star' },
    // Branch: Team
    { name: 'Takim Olustur', desc: 'Bir takim olusturun', xp: 15, shape: 'circle', branchFrom: 4 },
    { name: 'Takim Daveti', desc: '3 kisi davet edin', xp: 20, shape: 'square' },
    { name: 'Takim Projesi', desc: 'Takim ile belge olusturun', xp: 30, shape: 'square' },
    { name: 'Takim Lideri', desc: '10 takim projesi tamamlayin', xp: 60, shape: 'triangle' },
    { name: 'Takim Efsanesi', desc: '50 takim projesi', xp: 120, shape: 'star' },
  ],
  daily: [
    { name: 'Gunluk Giris', desc: 'Uygulamaya giris yapin', xp: 5, shape: 'circle' },
    { name: 'Gunluk Belge', desc: 'Her gun bir belge olusturun', xp: 10, shape: 'circle' },
    { name: 'Gunluk AI', desc: 'Her gun AI kullanin', xp: 10, shape: 'circle' },
    { name: 'Gunluk Duzenleme', desc: 'Her gun bir belge duzenleyin', xp: 10, shape: 'circle' },
    { name: 'Uc Gunluk', desc: '3 gun ust uste giris', xp: 15, shape: 'circle' },
    { name: 'Haftalik Seri', desc: '7 gun ust uste giris', xp: 25, shape: 'square' },
    { name: 'Iki Haftalik', desc: '14 gun ust uste giris', xp: 35, shape: 'square' },
    { name: 'Aylik Seri', desc: '30 gun ust uste giris', xp: 50, shape: 'triangle' },
    { name: 'Uc Aylik', desc: '90 gun ust uste giris', xp: 80, shape: 'triangle' },
    { name: 'Alti Aylik', desc: '180 gun ust uste giris', xp: 120, shape: 'triangle' },
    { name: 'Yillik Seri', desc: '365 gun ust uste giris', xp: 250, shape: 'star' },
    // Branch: Daily tasks
    { name: 'Ilk Gorev', desc: 'Ilk gunluk gorevi tamamla', xp: 5, shape: 'circle', branchFrom: 0 },
    { name: 'Uc Gorev', desc: '3 gunluk gorev tamamla', xp: 10, shape: 'circle' },
    { name: 'Bes Gorev', desc: '5 gunluk gorev tamamla', xp: 15, shape: 'square' },
    { name: 'On Gorev', desc: '10 gunluk gorev tamamla', xp: 25, shape: 'square' },
    { name: 'Gunluk Sampiyon', desc: '30 gunluk gorev', xp: 50, shape: 'triangle' },
    { name: 'Gunluk Efsane', desc: '100 gunluk gorev', xp: 120, shape: 'star' },
    // Branch: Weekly
    { name: 'Haftalik Gorev', desc: 'Haftalik gorevi tamamla', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Dort Hafta', desc: '4 haftalik gorev tamamla', xp: 30, shape: 'square' },
    { name: 'On Iki Hafta', desc: '12 haftalik gorev', xp: 50, shape: 'triangle' },
    { name: 'Elli Iki Hafta', desc: '52 haftalik gorev (1 yil)', xp: 150, shape: 'star' },
    // Branch: Multi-task
    { name: 'Coklu Gorev', desc: 'Gunde 3 farkli arac kullan', xp: 10, shape: 'circle', branchFrom: 3 },
    { name: 'Bes Arac', desc: 'Gunde 5 farkli arac kullan', xp: 20, shape: 'square' },
    { name: 'On Arac', desc: 'Gunde 10 farkli arac kullan', xp: 35, shape: 'triangle' },
    { name: 'Tum Araclar', desc: 'Gunde tum araclari kullan', xp: 60, shape: 'star' },
    // Branch: Challenges
    { name: 'Gunluk Meydan', desc: 'Gunluk challenge tamamla', xp: 15, shape: 'circle', branchFrom: 1 },
    { name: 'Uc Meydan', desc: '3 challenge tamamla', xp: 25, shape: 'square' },
    { name: 'On Meydan', desc: '10 challenge tamamla', xp: 40, shape: 'triangle' },
    { name: 'Elli Meydan', desc: '50 challenge tamamla', xp: 80, shape: 'triangle' },
    { name: 'Meydan Efsanesi', desc: '200 challenge tamamla', xp: 200, shape: 'star' },
  ],
  collection: [
    { name: 'Ilk Koleksiyon', desc: 'Ilk ogrenizi toplayin', xp: 5, shape: 'circle' },
    { name: 'Font Koleksiyonu', desc: '5 farkli font kullanin', xp: 10, shape: 'circle' },
    { name: 'Renk Koleksiyonu', desc: '10 farkli renk kullanin', xp: 15, shape: 'circle' },
    { name: 'Sekil Koleksiyonu', desc: 'Her sekil turunu kullanin', xp: 15, shape: 'circle' },
    { name: 'Arac Koleksiyonu', desc: '10 farkli arac kullanin', xp: 20, shape: 'square' },
    { name: 'Sablon Koleksiyonu', desc: '10 farkli sablon kullanin', xp: 20, shape: 'square' },
    { name: 'Grafik Koleksiyonu', desc: 'Her grafik turunu kullanin', xp: 25, shape: 'square' },
    { name: 'AI Koleksiyonu', desc: 'Tum AI ozelliklerini deneyin', xp: 30, shape: 'square' },
    { name: 'Format Koleksiyonu', desc: 'Tum export formatlarini deneyin', xp: 25, shape: 'square' },
    { name: 'Tam Koleksiyon', desc: 'Tum koleksiyonlari tamamlayin', xp: 100, shape: 'triangle' },
    { name: 'Supr Koleksiyoncu', desc: 'Her seyden 50 adet', xp: 200, shape: 'star' },
    // Branch: Badges
    { name: 'Ilk Rozet', desc: 'Ilk rozetinizi kazanin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Bes Rozet', desc: '5 rozet kazanin', xp: 20, shape: 'square' },
    { name: 'On Rozet', desc: '10 rozet kazanin', xp: 35, shape: 'square' },
    { name: 'Yirmi Rozet', desc: '20 rozet kazanin', xp: 50, shape: 'triangle' },
    { name: 'Elli Rozet', desc: '50 rozet kazanin', xp: 100, shape: 'triangle' },
    { name: 'Rozet Krali', desc: '100 rozet kazanin', xp: 200, shape: 'star' },
    // Branch: Milestones
    { name: 'Ilk Kilometre', desc: 'Ilk kilometre tasinizi gecin', xp: 15, shape: 'circle', branchFrom: 4 },
    { name: 'Bes Kilometre', desc: '5 kilometre tasi', xp: 25, shape: 'square' },
    { name: 'On Kilometre', desc: '10 kilometre tasi', xp: 40, shape: 'triangle' },
    { name: 'Yirmi Kilometre', desc: '20 kilometre tasi', xp: 70, shape: 'triangle' },
    { name: 'Elli Kilometre', desc: '50 kilometre tasi', xp: 150, shape: 'star' },
    // Branch: Rare items
    { name: 'Nadir Bulgu', desc: 'Nadir bir ozellik kesfet', xp: 20, shape: 'circle', branchFrom: 2 },
    { name: 'Epik Bulgu', desc: 'Epik bir ozellik kesfet', xp: 35, shape: 'square' },
    { name: 'Efsanevi Bulgu', desc: 'Efsanevi bir ozellik', xp: 60, shape: 'triangle' },
    { name: 'Mitik Bulgu', desc: 'Mitik bir ozellik kesfet', xp: 100, shape: 'star' },
    // Branch: Completionist
    { name: 'Yuzde On', desc: 'Gorevlerin %10 unu tamamla', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Yuzde Yirmi Bes', desc: 'Gorevlerin %25 ini tamamla', xp: 30, shape: 'square' },
    { name: 'Yuzde Elli', desc: 'Gorevlerin %50 sini tamamla', xp: 60, shape: 'triangle' },
    { name: 'Yuzde Yetmis Bes', desc: 'Gorevlerin %75 ini tamamla', xp: 100, shape: 'triangle' },
    { name: 'Yuzde Doksan', desc: 'Gorevlerin %90 ini tamamla', xp: 150, shape: 'star' },
    { name: 'Tam Tamamlayici', desc: 'Tum gorevleri tamamla', xp: 500, shape: 'star' },
  ],
};

// Build the complete quest array with positions
export function generateQuestMap() {
  const quests = [];
  const connections = [];
  let globalId = 0;

  const catKeys = Object.keys(QUEST_CHAINS);
  const colWidth = 220;
  const rowHeight = 85;
  const catSpacing = 50;

  let currentX = 80;

  catKeys.forEach((catKey) => {
    const chain = QUEST_CHAINS[catKey];
    const cat = CATEGORIES.find(c => c.id === catKey) || { name: catKey, desc: '' };

    const mainChain = [];
    const branches = {};

    chain.forEach((q, idx) => {
      if (q.branchFrom !== undefined) {
        if (!branches[q.branchFrom]) branches[q.branchFrom] = [];
        branches[q.branchFrom].push({ ...q, localIdx: idx });
      } else {
        mainChain.push({ ...q, localIdx: idx });
      }
    });

    const startX = currentX;
    const baseY = 120;

    const mainQuestIds = [];
    mainChain.forEach((q, idx) => {
      const id = globalId++;
      const x = startX;
      const y = baseY + idx * rowHeight;
      quests.push({
        id, name: q.name, desc: q.desc, xp: q.xp, shape: q.shape,
        category: cat.name, categoryId: catKey, x, y, completed: false,
      });
      mainQuestIds.push(id);
      if (idx > 0) connections.push({ from: mainQuestIds[idx - 1], to: id });
    });

    let branchOffset = 1;
    Object.keys(branches).forEach(fromLocalIdx => {
      const branchQuests = branches[fromLocalIdx];
      const parentMainIdx = parseInt(fromLocalIdx);
      const parentId = mainQuestIds[parentMainIdx];
      if (parentId === undefined) return;

      const branchX = startX + colWidth * branchOffset;
      const branchStartY = baseY + parentMainIdx * rowHeight;
      const branchIds = [];

      branchQuests.forEach((q, bIdx) => {
        const id = globalId++;
        quests.push({
          id, name: q.name, desc: q.desc, xp: q.xp, shape: q.shape,
          category: cat.name, categoryId: catKey,
          x: branchX, y: branchStartY + bIdx * rowHeight, completed: false,
        });
        branchIds.push(id);
        connections.push({ from: bIdx === 0 ? parentId : branchIds[bIdx - 1], to: id });
      });
      branchOffset++;
    });

    const numBranches = Object.keys(branches).length;
    currentX += (1 + numBranches) * colWidth + catSpacing;
  });

  const categoryLabels = [];
  let labelX = 80;
  catKeys.forEach((catKey) => {
    const cat = CATEGORIES.find(c => c.id === catKey);
    const chain = QUEST_CHAINS[catKey];
    const branches = {};
    chain.forEach((q) => { if (q.branchFrom !== undefined) { branches[q.branchFrom] = true; } });
    const numBranches = Object.keys(branches).length;
    const width = (1 + numBranches) * colWidth;
    categoryLabels.push({ name: cat.name, desc: cat.desc, x: labelX, width });
    labelX += width + catSpacing;
  });

  return {
    quests, connections, categoryLabels,
    totalWidth: currentX,
    totalHeight: Math.max(...quests.map(q => q.y)) + 200
  };
}

export { CATEGORIES };

const CREDIT_COSTS_MAP = {
  'nano_banana': 20,
  'nano_banana_pro': 50,
  'photo_edit': 15,
  'photo_edit_pro': 40,
  'judge_basic': 25,
  'judge_deep': 70,
};
export { CREDIT_COSTS_MAP };
