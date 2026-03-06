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
    colorPicker: 'Color Picker',
    layers: 'Layers',
    pan: 'Pan',
    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    share: 'Share',
    download: 'Download',
    bold: 'Bold',
    italic: 'Italic',
    alignLeft: 'Align Left',
    alignCenter: 'Align Center',
    alignRight: 'Align Right',
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
    colorPicker: 'Renk Seçici',
    layers: 'Katmanlar',
    pan: 'Kaydır',
    zoomIn: 'Yakınlaştır',
    zoomOut: 'Uzaklaştır',
    share: 'Paylaş',
    download: 'İndir',
    bold: 'Kalın',
    italic: 'İtalik',
    alignLeft: 'Sola Hizala',
    alignCenter: 'Ortala',
    alignRight: 'Sağa Hizala',
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
