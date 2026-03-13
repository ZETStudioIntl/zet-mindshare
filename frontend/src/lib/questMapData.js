// Quest Map Data Generator - 500 quests organized in chains
// Shapes: circle=easy, square=medium, triangle=hard, star=impossible

const CATEGORIES = [
  { id: 'doc', name: 'Belge Ustası', desc: 'Belge oluşturma görevleri' },
  { id: 'ai', name: 'AI Keşifçisi', desc: 'Yapay zeka görevleri' },
  { id: 'design', name: 'Tasarım Sihirbazı', desc: 'Tasarım görevleri' },
  { id: 'template', name: 'Şablon Uzmanı', desc: 'Şablon görevleri' },
  { id: 'color', name: 'Renk Ustası', desc: 'Renk ve gradient görevleri' },
  { id: 'chart', name: 'Grafik Dehası', desc: 'Grafik oluşturma görevleri' },
  { id: 'collab', name: 'Takım Oyuncusu', desc: 'İşbirliği görevleri' },
  { id: 'export', name: 'Yayıncı', desc: 'Dışa aktarma görevleri' },
  { id: 'photo', name: 'Fotoğraf Editörü', desc: 'Fotoğraf düzenleme görevleri' },
  { id: 'text', name: 'Söz Ustası', desc: 'Metin formatlama görevleri' },
  { id: 'shape', name: 'Şekil Mimarı', desc: 'Şekil ve çizim görevleri' },
  { id: 'judge', name: 'Hakim Yolu', desc: 'ZET Judge görevleri' },
  { id: 'master', name: 'Büyük Usta', desc: 'Zorluk zinciri' },
  { id: 'legend', name: 'Efsane', desc: 'Efsanevi görevler' },
  { id: 'secret', name: 'Gizli Yollar', desc: 'Gizli görev zincirleri' },
];

const QUEST_CHAINS = {
  doc: [
    // Main chain
    { name: 'İlk Adım', desc: 'İlk belgenizi oluşturun', xp: 5, shape: 'circle' },
    { name: 'Başlık Ekle', desc: 'Belgeye başlık yazın', xp: 5, shape: 'circle' },
    { name: 'Paragraf Yaz', desc: '3 paragraf metin yazın', xp: 10, shape: 'circle' },
    { name: 'Kaydet', desc: 'Belgenizi kaydedin', xp: 5, shape: 'circle' },
    { name: 'İkinci Belge', desc: '2. belgenizi oluşturun', xp: 10, shape: 'circle' },
    { name: 'Düzenle', desc: 'Var olan belgeyi düzenleyin', xp: 10, shape: 'circle' },
    { name: 'Kopyala', desc: 'Bir belgeyi kopyalayın', xp: 10, shape: 'circle' },
    { name: 'Sil ve Geri Al', desc: 'Bir belgeyi silip geri alın', xp: 15, shape: 'circle' },
    { name: 'Beş Belge', desc: '5 farklı belge oluşturun', xp: 20, shape: 'square' },
    { name: 'On Belge', desc: '10 belge oluşturun', xp: 30, shape: 'square' },
    { name: 'Yirmi Belge', desc: '20 belge oluşturun', xp: 40, shape: 'square' },
    { name: 'Elli Belge', desc: '50 belge oluşturun', xp: 60, shape: 'triangle' },
    { name: 'Yüz Belge', desc: '100 belge oluşturun', xp: 100, shape: 'triangle' },
    { name: 'Belge İmparatoru', desc: '200 belge oluşturun', xp: 200, shape: 'star' },
    // Branch: Quick notes
    { name: 'Hızlı Not', desc: 'Bir hızlı not oluşturun', xp: 5, shape: 'circle', branchFrom: 3 },
    { name: 'Beş Not', desc: '5 hızlı not oluşturun', xp: 15, shape: 'circle' },
    { name: 'Not Ustası', desc: '20 hızlı not oluşturun', xp: 25, shape: 'square' },
    { name: 'Hatırlatıcı Kur', desc: 'Nota hatırlatıcı ekleyin', xp: 15, shape: 'circle' },
    { name: 'Zamanlayıcı', desc: '5 hatırlatıcı kurun', xp: 25, shape: 'square' },
    // Branch: Organization
    { name: 'Klasör Oluştur', desc: 'Belgelerinizi organize edin', xp: 10, shape: 'circle', branchFrom: 8 },
    { name: 'Etiketle', desc: 'Belgelere etiket ekleyin', xp: 15, shape: 'circle' },
    { name: 'Ara ve Bul', desc: 'Arama ile belge bulun', xp: 10, shape: 'circle' },
    { name: 'Filtrele', desc: 'Belgeleri filtreleyin', xp: 15, shape: 'square' },
    { name: 'Organizatör', desc: '50 belgeyi organize edin', xp: 50, shape: 'triangle' },
  ],
  ai: [
    { name: 'ZETA Tanış', desc: 'ZETA ile ilk sohbet', xp: 10, shape: 'circle' },
    { name: 'Soru Sor', desc: 'ZETA\'ya 3 soru sorun', xp: 10, shape: 'circle' },
    { name: 'Belge Hakkında', desc: 'Belge içeriği hakkında sohbet', xp: 15, shape: 'circle' },
    { name: 'Öneri Al', desc: 'ZETA\'dan metin önerisi alın', xp: 15, shape: 'circle' },
    { name: 'Beş Sohbet', desc: '5 sohbet oturumu yapın', xp: 20, shape: 'circle' },
    { name: 'On Sohbet', desc: '10 sohbet oturumu', xp: 25, shape: 'square' },
    { name: 'AI Görsel', desc: 'İlk AI görselini oluştur', xp: 20, shape: 'circle' },
    { name: 'Beş Görsel', desc: '5 AI görsel oluşturun', xp: 30, shape: 'square' },
    { name: 'On Görsel', desc: '10 AI görsel oluşturun', xp: 40, shape: 'square' },
    { name: 'Yirmi Görsel', desc: '20 AI görsel', xp: 50, shape: 'triangle' },
    { name: 'Elli Görsel', desc: '50 AI görsel oluşturun', xp: 80, shape: 'triangle' },
    { name: 'AI Sanatçı', desc: '100 AI görsel oluşturun', xp: 150, shape: 'star' },
    // Branch: Photo edit
    { name: 'Fotoğraf Düzenle', desc: 'İlk fotoğraf düzenleme', xp: 15, shape: 'circle', branchFrom: 6 },
    { name: 'Beş Düzenleme', desc: '5 fotoğraf düzenleyin', xp: 25, shape: 'square' },
    { name: 'On Düzenleme', desc: '10 fotoğraf düzenleyin', xp: 35, shape: 'square' },
    { name: 'Düzenleme Ustası', desc: '25 fotoğraf düzenleyin', xp: 60, shape: 'triangle' },
    // Branch: Pro features
    { name: 'Pro Görsel', desc: 'Nano Banana Pro ile görsel', xp: 30, shape: 'square', branchFrom: 8 },
    { name: 'Pro Boyut', desc: 'Özel boyut ile görsel', xp: 25, shape: 'square' },
    { name: 'Pro Usta', desc: '20 Pro görsel oluşturun', xp: 70, shape: 'triangle' },
    { name: 'AI Tanrısı', desc: '50 Pro görsel oluşturun', xp: 150, shape: 'star' },
    // Branch: ZETA mastery
    { name: 'Elli Sohbet', desc: '50 sohbet yapın', xp: 40, shape: 'square', branchFrom: 5 },
    { name: 'Yüz Sohbet', desc: '100 sohbet yapın', xp: 60, shape: 'triangle' },
    { name: 'ZETA Dostu', desc: '200 sohbet yapın', xp: 100, shape: 'triangle' },
    { name: 'ZETA Ruhani', desc: '500 sohbet yapın', xp: 200, shape: 'star' },
  ],
  design: [
    { name: 'İlk Şekil', desc: 'Canvas\'a bir şekil ekleyin', xp: 5, shape: 'circle' },
    { name: 'Üç Şekil', desc: '3 farklı şekil türü kullanın', xp: 10, shape: 'circle' },
    { name: 'Boyutlandır', desc: 'Bir şekli boyutlandırın', xp: 10, shape: 'circle' },
    { name: 'Taşı', desc: 'Elemanları taşıyın', xp: 5, shape: 'circle' },
    { name: 'Renklendir', desc: 'Bir şekle renk verin', xp: 10, shape: 'circle' },
    { name: 'Gradient Uygula', desc: 'Gradient renk kullanın', xp: 15, shape: 'circle' },
    { name: 'Metin + Şekil', desc: 'Metin ve şekil birleştirin', xp: 15, shape: 'circle' },
    { name: 'Kompozisyon', desc: '10 elemanlı tasarım yapın', xp: 25, shape: 'square' },
    { name: 'Karmaşık Tasarım', desc: '25 elemanlı tasarım', xp: 35, shape: 'square' },
    { name: 'İleri Tasarım', desc: '50 elemanlı tasarım', xp: 50, shape: 'triangle' },
    { name: 'Tasarım Dehası', desc: '100+ elemanlı tasarım', xp: 100, shape: 'star' },
    // Branch: Drawing
    { name: 'Kalem Çiz', desc: 'Kalem aracı ile çizin', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Vektör Çiz', desc: 'Vektör çizim yapın', xp: 15, shape: 'circle' },
    { name: 'Beş Çizim', desc: '5 vektör çizim yapın', xp: 20, shape: 'square' },
    { name: 'Sanatçı', desc: '20 vektör çizim yapın', xp: 40, shape: 'triangle' },
    // Branch: Images
    { name: 'Resim Ekle', desc: 'Canvas\'a resim ekleyin', xp: 10, shape: 'circle', branchFrom: 2 },
    { name: 'Kırp', desc: 'Bir resmi kırpın', xp: 15, shape: 'circle' },
    { name: 'Resim Düzenle', desc: 'Resim üzerinde düzenleme', xp: 20, shape: 'square' },
    { name: 'Kolaj', desc: '5 resimli kolaj yapın', xp: 30, shape: 'square' },
    { name: 'Galeri Ustası', desc: '20 resimli tasarım', xp: 50, shape: 'triangle' },
  ],
  template: [
    { name: 'İlk Şablon', desc: 'Bir şablon kullanın', xp: 10, shape: 'circle' },
    { name: 'CV Şablonu', desc: 'CV şablonunu kullanın', xp: 10, shape: 'circle' },
    { name: 'Rapor Şablonu', desc: 'Rapor şablonunu kullanın', xp: 10, shape: 'circle' },
    { name: 'Fatura Şablonu', desc: 'Fatura oluşturun', xp: 15, shape: 'circle' },
    { name: 'Beş Şablon', desc: '5 farklı şablon kullanın', xp: 20, shape: 'circle' },
    { name: 'On Şablon', desc: '10 farklı şablon deneyin', xp: 25, shape: 'square' },
    { name: 'Tüm Şablonlar', desc: '20 şablonun hepsini deneyin', xp: 40, shape: 'square' },
    { name: 'Şablon Özelleştir', desc: 'Şablonu özelleştirin', xp: 20, shape: 'square' },
    { name: 'Şablon Ustası', desc: '50 belge şablonla oluşturun', xp: 60, shape: 'triangle' },
    { name: 'Şablon Efsanesi', desc: '100 belge şablonla', xp: 100, shape: 'star' },
    // Branch: Specific templates
    { name: 'Toplantı Notu', desc: 'Toplantı şablonu kullanın', xp: 10, shape: 'circle', branchFrom: 4 },
    { name: 'Sözleşme Yaz', desc: 'Sözleşme şablonu', xp: 15, shape: 'circle' },
    { name: 'SWOT Analizi', desc: 'SWOT şablonu kullanın', xp: 15, shape: 'square' },
    { name: 'Sertifika Oluştur', desc: 'Sertifika şablonu', xp: 15, shape: 'square' },
    { name: 'Etkinlik Afişi', desc: 'Etkinlik afişi oluşturun', xp: 20, shape: 'square' },
  ],
  color: [
    { name: 'İlk Renk', desc: 'Bir renge tıklayın', xp: 5, shape: 'circle' },
    { name: 'Özel Renk', desc: 'Özel renk seçin', xp: 10, shape: 'circle' },
    { name: 'Gradient Keşfi', desc: 'İlk gradient\'ınızı uygulayın', xp: 10, shape: 'circle' },
    { name: 'Beş Gradient', desc: '5 farklı gradient deneyin', xp: 15, shape: 'circle' },
    { name: 'Metin Rengi', desc: 'Metin rengini değiştirin', xp: 10, shape: 'circle' },
    { name: 'Şekil Rengi', desc: 'Şekle gradient uygulayın', xp: 15, shape: 'circle' },
    { name: 'Renk Paleti', desc: '10 farklı renk kullanın', xp: 20, shape: 'square' },
    { name: 'Renk Harmonisi', desc: 'Uyumlu renkler kullanın', xp: 25, shape: 'square' },
    { name: 'Gökkuşağı', desc: 'Tüm renkleri kullanın', xp: 30, shape: 'square' },
    { name: 'Renk Ustası', desc: '100 renk değişikliği', xp: 50, shape: 'triangle' },
    { name: 'Renk Tanrısı', desc: '500 renk değişikliği', xp: 100, shape: 'star' },
    // Branch: Highlight
    { name: 'İlk İşaret', desc: 'Highlighter kullanın', xp: 10, shape: 'circle', branchFrom: 4 },
    { name: 'Beş İşaret', desc: '5 metin işaretleyin', xp: 15, shape: 'circle' },
    { name: 'Renkli İşaret', desc: '3 farklı renk ile işaretleyin', xp: 20, shape: 'square' },
    { name: 'İşaret Ustası', desc: '50 metin işaretleyin', xp: 40, shape: 'triangle' },
  ],
  chart: [
    { name: 'İlk Grafik', desc: 'Bir grafik oluşturun', xp: 15, shape: 'circle' },
    { name: 'Bar Grafik', desc: 'Bar grafik oluşturun', xp: 15, shape: 'circle' },
    { name: 'Pasta Grafik', desc: 'Pasta grafik oluşturun', xp: 15, shape: 'circle' },
    { name: 'Çizgi Grafik', desc: 'Çizgi grafik oluşturun', xp: 15, shape: 'circle' },
    { name: 'Üç Tür', desc: '3 grafik türünü deneyin', xp: 20, shape: 'square' },
    { name: 'Gradient Grafik', desc: 'Grafiğe gradient uygulayın', xp: 20, shape: 'square' },
    { name: 'Beş Grafik', desc: '5 grafik oluşturun', xp: 25, shape: 'square' },
    { name: 'On Grafik', desc: '10 grafik oluşturun', xp: 35, shape: 'triangle' },
    { name: 'Grafik Ustası', desc: '25 grafik oluşturun', xp: 60, shape: 'triangle' },
    { name: 'Veri Bilimci', desc: '50 grafik oluşturun', xp: 100, shape: 'star' },
    // Branch: Tables
    { name: 'İlk Tablo', desc: 'Bir tablo oluşturun', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Beş Tablo', desc: '5 tablo oluşturun', xp: 20, shape: 'square' },
    { name: 'Tablo Ustası', desc: '20 tablo oluşturun', xp: 40, shape: 'triangle' },
    // Branch: QR
    { name: 'İlk QR', desc: 'QR kod oluşturun', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Beş QR', desc: '5 QR kod oluşturun', xp: 20, shape: 'square' },
  ],
  collab: [
    { name: 'Profil Oluştur', desc: 'Profilinizi tamamlayın', xp: 10, shape: 'circle' },
    { name: 'Fotoğraf Ekle', desc: 'Profil fotoğrafı ekleyin', xp: 10, shape: 'circle' },
    { name: 'İsim Değiştir', desc: 'Profil adınızı değiştirin', xp: 5, shape: 'circle' },
    { name: 'İlk Paylaş', desc: 'Bir belgeyi paylaşın', xp: 15, shape: 'circle' },
    { name: 'Beş Paylaşım', desc: '5 belge paylaşın', xp: 20, shape: 'square' },
    { name: 'On Paylaşım', desc: '10 belge paylaşın', xp: 30, shape: 'square' },
    { name: 'Sosyal Kelebek', desc: '25 paylaşım yapın', xp: 50, shape: 'triangle' },
    { name: 'İletişim Ustası', desc: '50 paylaşım yapın', xp: 80, shape: 'triangle' },
    { name: 'Topluluk Lideri', desc: '100 paylaşım', xp: 150, shape: 'star' },
    // Branch: Settings
    { name: 'Dil Değiştir', desc: 'Uygulama dilini değiştirin', xp: 5, shape: 'circle', branchFrom: 0 },
    { name: 'Tema Değiştir', desc: 'Koyu/açık tema deneyin', xp: 5, shape: 'circle' },
    { name: 'Ayar Ustası', desc: 'Tüm ayarları keşfedin', xp: 20, shape: 'square' },
  ],
  export: [
    { name: 'İlk Export', desc: 'Bir belgeyi dışa aktarın', xp: 10, shape: 'circle' },
    { name: 'PNG Export', desc: 'PNG olarak kaydedin', xp: 10, shape: 'circle' },
    { name: 'PDF Export', desc: 'PDF olarak kaydedin', xp: 10, shape: 'circle' },
    { name: 'JSON Export', desc: 'Proje dosyası kaydedin', xp: 15, shape: 'circle' },
    { name: 'Beş Export', desc: '5 belge dışa aktarın', xp: 20, shape: 'square' },
    { name: 'On Export', desc: '10 belge dışa aktarın', xp: 25, shape: 'square' },
    { name: 'Export Ustası', desc: '25 belge dışa aktarın', xp: 40, shape: 'triangle' },
    { name: 'Yayıncı Pro', desc: '50 belge dışa aktarın', xp: 70, shape: 'triangle' },
    { name: 'Mega Yayıncı', desc: '100 belge dışa aktarın', xp: 120, shape: 'star' },
    // Branch: PDF import
    { name: 'PDF İçe Aktar', desc: 'Bir PDF dosyası içe aktarın', xp: 15, shape: 'circle', branchFrom: 2 },
    { name: 'Beş PDF', desc: '5 PDF içe aktarın', xp: 25, shape: 'square' },
    { name: 'PDF Ustası', desc: '20 PDF içe aktarın', xp: 50, shape: 'triangle' },
  ],
  photo: [
    { name: 'Fotoğraf Yükle', desc: 'Bir fotoğraf yükleyin', xp: 5, shape: 'circle' },
    { name: 'AI Düzenleme', desc: 'AI ile fotoğraf düzenleyin', xp: 15, shape: 'circle' },
    { name: 'Kırpma', desc: 'Fotoğrafı kırpın', xp: 10, shape: 'circle' },
    { name: 'Boyutlandır', desc: 'Fotoğrafı boyutlandırın', xp: 10, shape: 'circle' },
    { name: 'Filtre Uygula', desc: 'AI filtre uygulayın', xp: 15, shape: 'circle' },
    { name: 'Beş Düzenleme', desc: '5 fotoğraf düzenleyin', xp: 20, shape: 'square' },
    { name: 'On Düzenleme', desc: '10 fotoğraf düzenleyin', xp: 30, shape: 'square' },
    { name: 'Fotoğraf Sanatçısı', desc: '25 düzenleme yapın', xp: 50, shape: 'triangle' },
    { name: 'Fotoğraf Efsanesi', desc: '50 düzenleme yapın', xp: 80, shape: 'star' },
    // Branch: Shapes with images
    { name: 'Şekle Resim', desc: 'Şekle resim ekleyin', xp: 15, shape: 'circle', branchFrom: 0 },
    { name: 'Beş Şekil Resim', desc: '5 şekle resim ekleyin', xp: 25, shape: 'square' },
    { name: 'Mozaik', desc: '10 şekle resim ekleyin', xp: 40, shape: 'triangle' },
  ],
  text: [
    { name: 'İlk Metin', desc: 'Canvas\'a metin ekleyin', xp: 5, shape: 'circle' },
    { name: 'Kalın Yazı', desc: 'Bold formatlama', xp: 5, shape: 'circle' },
    { name: 'İtalik Yazı', desc: 'Italic formatlama', xp: 5, shape: 'circle' },
    { name: 'Altı Çizili', desc: 'Underline formatlama', xp: 5, shape: 'circle' },
    { name: 'Üstü Çizili', desc: 'Strikethrough formatlama', xp: 5, shape: 'circle' },
    { name: 'Font Değiştir', desc: 'Farklı font kullanın', xp: 10, shape: 'circle' },
    { name: 'Beş Font', desc: '5 farklı font deneyin', xp: 15, shape: 'circle' },
    { name: 'On Font', desc: '10 farklı font deneyin', xp: 20, shape: 'square' },
    { name: 'Font Ustası', desc: '30 farklı font kullanın', xp: 35, shape: 'square' },
    { name: 'Boyut Değiştir', desc: 'Font boyutunu değiştirin', xp: 10, shape: 'circle' },
    { name: 'Hizalama', desc: 'Metin hizalamasını değiştirin', xp: 10, shape: 'circle' },
    { name: 'Satır Aralığı', desc: 'Satır aralığını ayarlayın', xp: 10, shape: 'circle' },
    { name: 'Girinti', desc: 'Metin girintisi ekleyin', xp: 10, shape: 'circle' },
    { name: 'Tüm Formatlar', desc: 'Tüm format seçeneklerini deneyin', xp: 30, shape: 'square' },
    { name: 'Tipografi Ustası', desc: '100 metin formatlaması', xp: 60, shape: 'triangle' },
    { name: 'Kaligrafi Efsanesi', desc: '500 metin formatlaması', xp: 120, shape: 'star' },
    // Branch: Translation
    { name: 'Çeviri Yap', desc: 'Bir metni çevirin', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Beş Çeviri', desc: '5 metin çevirin', xp: 25, shape: 'square' },
    { name: 'Polyglot', desc: '5 farklı dile çevirin', xp: 40, shape: 'triangle' },
  ],
  shape: [
    { name: 'Kare Çiz', desc: 'Bir kare ekleyin', xp: 5, shape: 'circle' },
    { name: 'Daire Çiz', desc: 'Bir daire ekleyin', xp: 5, shape: 'circle' },
    { name: 'Üçgen Çiz', desc: 'Bir üçgen ekleyin', xp: 5, shape: 'circle' },
    { name: 'Yıldız Çiz', desc: 'Bir yıldız ekleyin', xp: 10, shape: 'circle' },
    { name: 'Halka Çiz', desc: 'Bir halka ekleyin', xp: 10, shape: 'circle' },
    { name: 'Beş Şekil', desc: 'Hepsini deneyin', xp: 15, shape: 'circle' },
    { name: 'Renkli Şekiller', desc: 'Şekillere renk verin', xp: 15, shape: 'circle' },
    { name: 'Gradient Şekiller', desc: 'Gradient şekiller yapın', xp: 20, shape: 'square' },
    { name: 'Resimli Şekiller', desc: 'Şekillere resim koyun', xp: 20, shape: 'square' },
    { name: 'On Şekil Tasarım', desc: '10 şekilli tasarım', xp: 25, shape: 'square' },
    { name: 'Yirmi Şekil', desc: '20 şekilli tasarım', xp: 35, shape: 'triangle' },
    { name: 'Geometri Dehası', desc: '50 şekilli tasarım', xp: 60, shape: 'triangle' },
    { name: 'Şekil Efsanesi', desc: '100 şekilli tasarım', xp: 100, shape: 'star' },
    // Branch: Lasso
    { name: 'Lasso Kullan', desc: 'Lasso aracını kullanın', xp: 15, shape: 'circle', branchFrom: 5 },
    { name: 'Çoklu Seçim', desc: '5 eleman seçin', xp: 20, shape: 'square' },
    { name: 'Seçim Ustası', desc: '20 eleman seçin', xp: 35, shape: 'triangle' },
  ],
  judge: [
    { name: 'Judge Tanış', desc: 'ZET Judge\'ı açın', xp: 15, shape: 'circle' },
    { name: 'İlk Analiz', desc: 'İlk temel analizi yapın', xp: 20, shape: 'circle' },
    { name: 'Metin Analizi', desc: 'Bir metin analiz ettirin', xp: 20, shape: 'circle' },
    { name: 'Beş Analiz', desc: '5 temel analiz yapın', xp: 30, shape: 'square' },
    { name: 'On Analiz', desc: '10 temel analiz yapın', xp: 40, shape: 'square' },
    { name: 'Derin Analiz', desc: 'İlk derin analiz yapın', xp: 35, shape: 'square' },
    { name: 'Beş Derin', desc: '5 derin analiz yapın', xp: 50, shape: 'triangle' },
    { name: 'Yirmi Analiz', desc: '20 toplam analiz', xp: 40, shape: 'square' },
    { name: 'Analiz Ustası', desc: '50 toplam analiz', xp: 70, shape: 'triangle' },
    { name: 'Judge Yardımcısı', desc: '100 toplam analiz', xp: 100, shape: 'triangle' },
    { name: 'Hakim', desc: '200 toplam analiz', xp: 150, shape: 'star' },
    // Branch: Judge mood
    { name: 'Sert Mod', desc: 'Sert modu deneyin', xp: 15, shape: 'circle', branchFrom: 1 },
    { name: 'Normal Mod', desc: 'Normal modu deneyin', xp: 10, shape: 'circle' },
    { name: 'Mod Ustası', desc: 'Her iki modu kullanın', xp: 25, shape: 'square' },
  ],
  master: [
    { name: 'Acemi', desc: 'İlk 10 görevi tamamla', xp: 50, shape: 'circle' },
    { name: 'Çırak', desc: '25 görevi tamamla', xp: 80, shape: 'circle' },
    { name: 'Kalfa', desc: '50 görevi tamamla', xp: 100, shape: 'square' },
    { name: 'Usta', desc: '100 görevi tamamla', xp: 150, shape: 'square' },
    { name: 'Uzman', desc: '150 görevi tamamla', xp: 200, shape: 'square' },
    { name: 'Bilge', desc: '200 görevi tamamla', xp: 250, shape: 'triangle' },
    { name: 'Maestro', desc: '300 görevi tamamla', xp: 350, shape: 'triangle' },
    { name: 'Büyük Usta', desc: '400 görevi tamamla', xp: 500, shape: 'star' },
    { name: 'Efsane', desc: '500 görevi tamamla', xp: 1000, shape: 'star' },
    // Side chain
    { name: '1000 XP', desc: '1000 XP kazan', xp: 30, shape: 'circle', branchFrom: 0 },
    { name: '5000 XP', desc: '5000 XP kazan', xp: 50, shape: 'square' },
    { name: '10000 XP', desc: '10000 XP kazan', xp: 80, shape: 'triangle' },
    { name: '50000 XP', desc: '50000 XP kazan', xp: 150, shape: 'star' },
    // Side chain 2
    { name: 'Günlük Giriş', desc: '7 gün üst üste giriş', xp: 20, shape: 'circle', branchFrom: 1 },
    { name: 'Haftalık', desc: '30 gün giriş yapın', xp: 40, shape: 'square' },
    { name: 'Aylık', desc: '90 gün giriş yapın', xp: 70, shape: 'triangle' },
    { name: 'Yıllık', desc: '365 gün giriş yapın', xp: 200, shape: 'star' },
  ],
  legend: [
    { name: 'Tüm Araçlar', desc: 'Her aracı en az 1 kez kullan', xp: 100, shape: 'triangle' },
    { name: 'Tüm Şablonlar', desc: '20 şablonun hepsini dene', xp: 80, shape: 'triangle' },
    { name: 'Tüm Şekiller', desc: 'Her şekil türünü kullan', xp: 60, shape: 'square' },
    { name: 'AI Master', desc: '100 AI işlem yap', xp: 100, shape: 'triangle' },
    { name: 'Kredi Canavarı', desc: 'Bir günde tüm kredileri harca', xp: 50, shape: 'square' },
    { name: 'Gece Kuşu', desc: 'Gece 3\'te belge oluştur', xp: 30, shape: 'square' },
    { name: 'Sabahçı', desc: 'Sabah 6\'da belge oluştur', xp: 30, shape: 'square' },
    { name: 'Hız Şeytanı', desc: '1 dakikada 10 eleman ekle', xp: 40, shape: 'triangle' },
    { name: 'Perfectionist', desc: 'Bir belgeyi 50 kez düzenle', xp: 60, shape: 'triangle' },
    { name: 'Çok Yönlü', desc: 'Tüm kategorilerden görev tamamla', xp: 80, shape: 'triangle' },
    { name: 'ZET Kralı', desc: 'Tüm kategorilerde usta ol', xp: 200, shape: 'star' },
    { name: 'İmkansız', desc: 'Tüm görevleri tamamla', xp: 500, shape: 'star' },
    // Side
    { name: 'Ctrl+Z Ustası', desc: '100 geri alma yapın', xp: 20, shape: 'circle', branchFrom: 0 },
    { name: 'Sansür Uzmanı', desc: '20 metin sansürleyin', xp: 30, shape: 'square' },
    { name: 'İmza Sanatçısı', desc: '10 dijital imza ekleyin', xp: 35, shape: 'triangle' },
  ],
  secret: [
    { name: 'Keşifçi', desc: 'Gizli menüyü bulun', xp: 20, shape: 'circle' },
    { name: 'Kısayol Ustası', desc: '10 kısayol kullanın', xp: 15, shape: 'circle' },
    { name: 'Tüm Kısayollar', desc: 'Her kısayolu deneyin', xp: 30, shape: 'square' },
    { name: 'Easter Egg', desc: 'Gizli özelliği bulun', xp: 50, shape: 'triangle' },
    { name: 'Hacker', desc: 'Tüm gizli özellikleri keşfedin', xp: 80, shape: 'star' },
    { name: 'Sağ Tık Ustası', desc: 'Sağ tık menüsünü kullanın', xp: 10, shape: 'circle' },
    { name: 'Zoom Ustası', desc: 'Tüm zoom seviyelerini deneyin', xp: 15, shape: 'circle' },
    { name: 'Katman Ustası', desc: 'Katmanlarla çalışın', xp: 20, shape: 'square' },
    { name: 'Filigran Ekle', desc: 'Filigran aracını kullanın', xp: 20, shape: 'square' },
    { name: 'Ayna Kullan', desc: 'Ayna aracını kullanın', xp: 15, shape: 'circle' },
    { name: 'Sesle Yaz', desc: 'Sesle yazma aracını kullanın', xp: 20, shape: 'square' },
    { name: 'Gizli Usta', desc: 'Tüm gizli görevleri tamamla', xp: 100, shape: 'star' },
    // Side
    { name: 'Kenar Boşlukları', desc: 'Kenar boşlukları ayarlayın', xp: 10, shape: 'circle', branchFrom: 0 },
    { name: 'Sayfa Rengi', desc: 'Sayfa rengini değiştirin', xp: 10, shape: 'circle' },
    { name: 'Çoklu Sayfa', desc: '5 sayfalık belge oluşturun', xp: 25, shape: 'square' },
    { name: 'On Sayfa', desc: '10 sayfalık belge', xp: 40, shape: 'triangle' },
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
  const catSpacing = 40;
  
  let currentX = 80;
  
  catKeys.forEach((catKey, catIdx) => {
    const chain = QUEST_CHAINS[catKey];
    const cat = CATEGORIES.find(c => c.id === catKey) || { name: catKey, desc: '' };
    
    // Find main chain (no branchFrom) and branches
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
    
    // Place main chain vertically
    const mainQuestIds = [];
    mainChain.forEach((q, idx) => {
      const id = globalId++;
      const x = startX;
      const y = baseY + idx * rowHeight;
      quests.push({
        id,
        name: q.name,
        desc: q.desc,
        xp: q.xp,
        shape: q.shape,
        category: cat.name,
        categoryId: catKey,
        x,
        y,
        completed: false,
      });
      mainQuestIds.push(id);
      if (idx > 0) {
        connections.push({ from: mainQuestIds[idx - 1], to: id });
      }
    });
    
    // Place branches
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
        const x = branchX;
        const y = branchStartY + bIdx * rowHeight;
        quests.push({
          id,
          name: q.name,
          desc: q.desc,
          xp: q.xp,
          shape: q.shape,
          category: cat.name,
          categoryId: catKey,
          x,
          y,
          completed: false,
        });
        branchIds.push(id);
        if (bIdx === 0) {
          connections.push({ from: parentId, to: id });
        } else {
          connections.push({ from: branchIds[bIdx - 1], to: id });
        }
      });
      
      branchOffset++;
    });
    
    // Calculate total width used by this category
    const numBranches = Object.keys(branches).length;
    currentX += (1 + numBranches) * colWidth + catSpacing;
  });
  
  // Add category labels
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
  
  return { quests, connections, categoryLabels, totalWidth: currentX, totalHeight: Math.max(...quests.map(q => q.y)) + 200 };
}

export { CATEGORIES, CREDIT_COSTS_MAP };

const CREDIT_COSTS_MAP = {
  'nano_banana': 20,
  'nano_banana_pro': 50,
  'photo_edit': 15,
  'photo_edit_pro': 40,
  'judge_basic': 25,
  'judge_deep': 70,
};
