import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Login
    documentCreation: 'Document creation with AI power',
    smartDocuments: 'Smart Documents',
    zetaAI: 'ZETA AI',
    proTools: 'Pro Tools',
    cloudSync: 'Cloud Sync',
    continueWithGoogle: 'Continue with Google',
    termsAgree: 'By continuing, you agree to our Terms of Service',
    
    // Dashboard
    searchDocuments: 'Search documents...',
    newDocument: 'New Document',
    documents: 'Documents',
    notes: 'Notes',
    quickNote: 'Quick note...',
    justNow: 'Just now',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    noNotesYet: 'No notes yet. Add a quick note below!',
    
    // Editor
    back: 'Back',
    forward: 'Forward',
    save: 'Save',
    saving: 'Saving...',
    search: 'Search',
    allPages: 'All Pages',
    askZeta: 'Ask ZETA...',
    askZetaAnything: 'Ask ZETA anything!',
    brainstormResearch: 'Brainstorm, research, analyze...',
    tools: 'Tools',
    canvas: 'Canvas',
    pagesAI: 'Pages & AI',
    pages: 'pages',
    characters: 'chars',
    
    // Settings
    cloudStorage: 'Cloud Storage',
    logout: 'Logout',
    language: 'Language',
    settings: 'Settings',
    
    // Tools
    select: 'Select',
    pencil: 'Pencil',
    brush: 'Brush',
    crop: 'Crop',
    eraser: 'Eraser',
    circle: 'Circle',
    rectangle: 'Rectangle',
    image: 'Image',
    text: 'Text',
    textSize: 'Text Size',
    pageSize: 'Page Size',
    addPage: 'Add Page',
    voice: 'Voice',
    triangle: 'Triangle',
    square: 'Square',
    star: 'Star',
    font: 'Font',
    colorPicker: 'Color Picker',
    layers: 'Layers',
    pan: 'Hand',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    share: 'Share',
    download: 'Download',
    bold: 'Bold',
    italic: 'Italic',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
    aiImage: 'AI Image',
    delete: 'Delete',
    penTool: 'Pen',
    translate: 'Translate',
    lineSpacing: 'Line Spacing',
    wordType: 'Text Style',
    marking: 'Highlighter',
    paragraph: 'Paragraph',
    graphic: 'Chart',
    pageColor: 'Page Color',
    zoom: 'Zoom',
    export: 'Export',
    alignJustify: 'Justify',
    shortcuts: 'Shortcuts',
    table: 'Table',
    layers: 'Layers',
    ruler: 'Ruler',
    grid: 'Grid',
    templates: 'Templates',
    qrcode: 'QR Code',
    watermark: 'Watermark',
    pageNumbers: 'Page Numbers',
    headerFooter: 'Header/Footer',
    findReplace: 'Find & Replace',
    words: 'words',
    ring: 'Ring',
    connected: 'Connected',
    connectDrive: 'Connect Drive',
    
    // Subscription
    subscription: 'Subscription',
    choosePlan: 'Choose Your Plan',
    planDescription: 'Unlock powerful features with ZET Mindshare Premium',
    subscriptionNote: 'All plans include 7-day free trial. Cancel anytime.',
    selectPlan: 'Select Plan',
    recommended: 'RECOMMENDED',
    fastSelect: 'Fast Select',
    selected: 'selected',
  },
  tr: {
    // Login
    documentCreation: 'AI destekli belge oluşturma',
    smartDocuments: 'Akıllı Belgeler',
    zetaAI: 'ZETA AI',
    proTools: 'Pro Araçlar',
    cloudSync: 'Bulut Senkron',
    continueWithGoogle: 'Google ile Devam Et',
    termsAgree: 'Devam ederek Kullanım Şartlarını kabul etmiş olursunuz',
    
    // Dashboard
    searchDocuments: 'Belge ara...',
    newDocument: 'Yeni Belge',
    documents: 'Belgeler',
    notes: 'Notlar',
    quickNote: 'Hızlı not...',
    justNow: 'Az önce',
    hoursAgo: 's önce',
    daysAgo: 'g önce',
    noNotesYet: 'Henüz not yok. Aşağıdan hızlı not ekleyin!',
    
    // Editor
    back: 'Geri',
    forward: 'İleri',
    save: 'Kaydet',
    saving: 'Kaydediliyor...',
    search: 'Ara',
    allPages: 'Tüm Sayfalar',
    askZeta: 'ZETA\'ya sor...',
    askZetaAnything: 'ZETA\'ya her şeyi sor!',
    brainstormResearch: 'Beyin fırtınası, araştırma, analiz...',
    tools: 'Araçlar',
    canvas: 'Tuval',
    pagesAI: 'Sayfalar & AI',
    pages: 'sayfa',
    characters: 'karakter',
    
    // Settings
    cloudStorage: 'Bulut Depolama',
    logout: 'Çıkış',
    language: 'Dil',
    settings: 'Ayarlar',
    
    // Tools
    select: 'Seç',
    pencil: 'Kalem',
    brush: 'Fırça',
    crop: 'Kırp',
    eraser: 'Silgi',
    circle: 'Daire',
    rectangle: 'Dikdörtgen',
    image: 'Resim',
    text: 'Metin',
    textSize: 'Metin Boyutu',
    pageSize: 'Sayfa Boyutu',
    addPage: 'Sayfa Ekle',
    voice: 'Ses',
    triangle: 'Üçgen',
    square: 'Kare',
    star: 'Yıldız',
    font: 'Yazı Tipi',
    colorPicker: 'Renk Seçici',
    layers: 'Katmanlar',
    pan: 'El',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    share: 'Paylaş',
    download: 'İndir',
    bold: 'Kalın',
    italic: 'İtalik',
    alignLeft: 'Sola Hizala',
    alignCenter: 'Ortala',
    alignRight: 'Sağa Hizala',
    aiImage: 'AI Görsel',
    delete: 'Sil',
    penTool: 'Kalem (Vektörel)',
    translate: 'Çevir',
    lineSpacing: 'Satır Aralığı',
    wordType: 'Yazı Tipi',
    marking: 'Fosforlu Kalem',
    paragraph: 'Paragraf',
    graphic: 'Grafik',
    pageColor: 'Sayfa Rengi',
    zoom: 'Büyüteç',
    export: 'Dışa Aktar',
    alignJustify: 'İki Yana Yasla',
    shortcuts: 'Kısayollar',
    table: 'Tablo',
    layers: 'Katmanlar',
    ruler: 'Cetvel',
    grid: 'Izgara',
    templates: 'Şablonlar',
    qrcode: 'QR Kod',
    watermark: 'Filigran',
    pageNumbers: 'Sayfa Numaraları',
    headerFooter: 'Üstbilgi/Altbilgi',
    findReplace: 'Bul ve Değiştir',
    words: 'kelime',
    ring: 'Halka',
    connected: 'Bağlı',
    connectDrive: 'Drive Bağla',
    
    // Subscription
    subscription: 'Abonelik',
    choosePlan: 'Planınızı Seçin',
    planDescription: 'ZET Mindshare Premium ile güçlü özelliklerin kilidini açın',
    subscriptionNote: 'Tüm planlar 7 günlük ücretsiz deneme içerir. İstediğiniz zaman iptal edin.',
    selectPlan: 'Planı Seç',
    recommended: 'ÖNERİLEN',
    fastSelect: 'Hızlı Seçim',
    selected: 'seçildi',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('zet-language') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('zet-language', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
