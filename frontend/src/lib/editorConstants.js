import {
  Type, Image, Hand, FileText, Baseline, ALargeSmall,
  Volume2, FilePlus, Triangle, Square, Circle, Star,
  Pencil, Palette, Scissors, Wand2, MousePointer2,
  Eraser, PenTool, Languages, AlignJustify, Bold, Highlighter,
  AlignLeft, BarChart3, Contrast, Layers, Ruler,
  Grid3X3, LayoutTemplate, Table, QrCode, Droplets, Hash,
  PanelTop, Search, CircleDashed, Copy, FlipHorizontal2, Mic, ImagePlus, PenLine,
  IndentIncrease, Maximize, ShieldOff, FileUp, Underline
} from 'lucide-react';

export const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'Square', width: 600, height: 600 },
];

export const FONTS = [
  // === Sans-Serif (Modern) ===
  'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Geneva', 
  'Lucida Grande', 'Lucida Sans', 'Segoe UI', 'Open Sans', 'Roboto', 
  'Lato', 'Montserrat', 'Poppins', 'Nunito', 'Ubuntu', 'Inter',
  'Source Sans Pro', 'Work Sans', 'Karla', 'Manrope', 'DM Sans',
  'Quicksand', 'Outfit', 'Figtree', 'Plus Jakarta Sans',
  // === Serif (Klasik) ===
  'Times New Roman', 'Georgia', 'Palatino', 'Garamond', 'Bookman', 
  'Cambria', 'Constantia', 'Didot', 'Baskerville', 'Bodoni', 
  'Merriweather', 'Playfair Display', 'Libre Baskerville', 'Crimson Text',
  'Lora', 'EB Garamond', 'Cormorant', 'Spectral', 'Bitter',
  // === Monospace (Kod) ===
  'Courier New', 'Lucida Console', 'Monaco', 'Consolas', 'Source Code Pro',
  'Fira Code', 'JetBrains Mono', 'IBM Plex Mono', 'Space Mono', 'Roboto Mono',
  // === Display & Decorative ===
  'Impact', 'Comic Sans MS', 'Brush Script MT', 'Copperplate', 
  'Rockwell', 'Century Gothic', 'Avant Garde', 'Futura', 'Gill Sans',
  'Optima', 'Franklin Gothic', 'Bebas Neue', 'Oswald', 'Raleway',
  // === Türkçe Uyumlu ===
  'Noto Sans', 'Noto Serif', 'PT Sans', 'PT Serif', 'Rubik', 'Exo 2',
  'Titillium Web', 'Cabin', 'Mulish', 'Barlow', 'Lexend', 'Sora',
  // === El Yazısı & Script ===
  'Dancing Script', 'Pacifico', 'Great Vibes', 'Satisfy', 'Caveat',
  'Kalam', 'Indie Flower', 'Shadows Into Light', 'Patrick Hand',
  // === Başlık Fontları ===
  'Anton', 'Archivo Black', 'Russo One', 'Righteous', 'Fredoka One',
  'Alfa Slab One', 'Lilita One', 'Passion One', 'Bangers', 'Permanent Marker'
];

export const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6600', '#6600FF', '#00FF66', '#FF0066',
  '#292f91', '#4ca8ad', '#333333', '#666666', '#999999', '#CCCCCC'
];

export const TOOLS = [
  { id: 'wordtype', icon: Bold, nameKey: 'wordType', shortcut: 'B' },
  { id: 'textsize', icon: Baseline, nameKey: 'textSize', shortcut: null },
  { id: 'font', icon: ALargeSmall, nameKey: 'font', shortcut: 'F' },
  { id: 'linespacing', icon: AlignJustify, nameKey: 'lineSpacing', shortcut: null },
  { id: 'paragraph', icon: AlignLeft, nameKey: 'paragraph', shortcut: 'A' },
  { id: 'indent', icon: IndentIncrease, nameKey: 'indent', shortcut: null },
  { id: 'margins', icon: Maximize, nameKey: 'margins', shortcut: null },
  { id: 'color', icon: Palette, nameKey: 'colorPicker', shortcut: 'C' },
  { id: 'hand', icon: Hand, nameKey: 'pan', shortcut: 'H' },
  { id: 'image', icon: Image, nameKey: 'image', shortcut: 'I' },
  { id: 'createimage', icon: Wand2, nameKey: 'aiImage', shortcut: 'W' },
  { id: 'photoedit', icon: ImagePlus, nameKey: 'photoEdit', shortcut: null },
  { id: 'signature', icon: PenLine, nameKey: 'signature', shortcut: null },
  { id: 'draw', icon: Pencil, nameKey: 'pencil', shortcut: 'D' },
  { id: 'pen', icon: PenTool, nameKey: 'penTool', shortcut: 'P' },
  { id: 'eraser', icon: Eraser, nameKey: 'eraser', shortcut: 'E' },
  { id: 'marking', icon: Underline, nameKey: 'marking', shortcut: 'M' },
  { id: 'select', icon: MousePointer2, nameKey: 'select', shortcut: 'S' },
  { id: 'copy', icon: Copy, nameKey: 'copy', shortcut: null },
  { id: 'mirror', icon: FlipHorizontal2, nameKey: 'mirror', shortcut: null },
  { id: 'cut', icon: Scissors, nameKey: 'crop', shortcut: 'X' },
  { id: 'redact', icon: ShieldOff, nameKey: 'redact', shortcut: null },
  { id: 'highlighter', icon: Highlighter, nameKey: 'highlighter', shortcut: null },
  { id: 'importpdf', icon: FileUp, nameKey: 'importPdf', shortcut: null },
  { id: 'translate', icon: Languages, nameKey: 'translate', shortcut: 'L' },
  { id: 'graphic', icon: BarChart3, nameKey: 'graphic', shortcut: 'G' },
  { id: 'table', icon: Table, nameKey: 'table', shortcut: null },
  { id: 'layers', icon: Layers, nameKey: 'layers', shortcut: null },
  { id: 'ruler', icon: Ruler, nameKey: 'ruler', shortcut: 'R' },
  { id: 'grid', icon: Grid3X3, nameKey: 'grid', shortcut: null },
  { id: 'templates', icon: LayoutTemplate, nameKey: 'templates', shortcut: null },
  { id: 'qrcode', icon: QrCode, nameKey: 'qrcode', shortcut: 'Q' },
  { id: 'watermark', icon: Droplets, nameKey: 'watermark', shortcut: null },
  { id: 'pagenumbers', icon: Hash, nameKey: 'pageNumbers', shortcut: null },
  { id: 'headerfooter', icon: PanelTop, nameKey: 'headerFooter', shortcut: null },
  { id: 'findreplace', icon: Search, nameKey: 'findReplace', shortcut: null },
  { id: 'pagecolor', icon: Contrast, nameKey: 'pageColor', shortcut: null },
  { id: 'addpage', icon: FilePlus, nameKey: 'addPage', shortcut: 'N' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize', shortcut: null },
  { id: 'voice', icon: Volume2, nameKey: 'voice', shortcut: 'V' },
  { id: 'voiceinput', icon: Mic, nameKey: 'voiceInput', shortcut: null },
  { id: 'triangle', icon: Triangle, nameKey: 'triangle', shortcut: '1' },
  { id: 'square', icon: Square, nameKey: 'square', shortcut: '2' },
  { id: 'circle', icon: Circle, nameKey: 'circle', shortcut: '3' },
  { id: 'ring', icon: CircleDashed, nameKey: 'ring', shortcut: '5' },
  { id: 'star', icon: Star, nameKey: 'star', shortcut: '4' },
];

// Default keyboard shortcuts
export const DEFAULT_SHORTCUTS = TOOLS.reduce((acc, tool) => {
  if (tool.shortcut) acc[tool.shortcut] = tool.id;
  return acc;
}, {});

export const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English' }, { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' }, { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' }, { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' }, { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' }, { code: 'ar', name: 'العربية' },
];

export const LINE_SPACINGS = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

export const TEXT_ALIGNMENTS = [
  { id: 'left', nameKey: 'alignLeft' },
  { id: 'center', nameKey: 'alignCenter' },
  { id: 'right', nameKey: 'alignRight' },
  { id: 'justify', nameKey: 'alignJustify' },
];

export const CHART_TYPES = [
  { id: 'bar', name: 'Bar Chart' },
  { id: 'pie', name: 'Pie Chart' },
  { id: 'line', name: 'Line Chart' },
];

export const TEMPLATES = [
  { id: 'blank', name: 'Boş Belge', nameKey: 'templateBlank', icon: '📄', category: 'Temel' },
  { id: 'cv', name: 'CV / Özgeçmiş', nameKey: 'templateCV', icon: '👤', category: 'Kariyer' },
  { id: 'report', name: 'Rapor', nameKey: 'templateReport', icon: '📊', category: 'İş' },
  { id: 'presentation', name: 'Sunum', nameKey: 'templatePresentation', icon: '📽️', category: 'İş' },
  { id: 'letter', name: 'Mektup', nameKey: 'templateLetter', icon: '✉️', category: 'Kişisel' },
  { id: 'invoice', name: 'Fatura', nameKey: 'templateInvoice', icon: '🧾', category: 'İş' },
  { id: 'meeting', name: 'Toplantı Notları', nameKey: 'templateMeeting', icon: '📝', category: 'İş' },
  { id: 'proposal', name: 'Teklif / Proposal', nameKey: 'templateProposal', icon: '💼', category: 'İş' },
  { id: 'contract', name: 'Sözleşme', nameKey: 'templateContract', icon: '📜', category: 'Hukuki' },
  { id: 'newsletter', name: 'Bülten', nameKey: 'templateNewsletter', icon: '📰', category: 'Pazarlama' },
  { id: 'recipe', name: 'Tarif Kartı', nameKey: 'templateRecipe', icon: '🍳', category: 'Kişisel' },
  { id: 'projectplan', name: 'Proje Planı', nameKey: 'templateProject', icon: '🎯', category: 'İş' },
  { id: 'certificate', name: 'Sertifika', nameKey: 'templateCertificate', icon: '🏆', category: 'Eğitim' },
  { id: 'checklist', name: 'Kontrol Listesi', nameKey: 'templateChecklist', icon: '✅', category: 'Kişisel' },
  { id: 'brainstorm', name: 'Beyin Fırtınası', nameKey: 'templateBrainstorm', icon: '💡', category: 'Yaratıcı' },
  { id: 'socialmedia', name: 'Sosyal Medya', nameKey: 'templateSocial', icon: '📱', category: 'Pazarlama' },
  // Yeni Eklenen Şablonlar
  { id: 'weeklyplan', name: 'Haftalık Plan', nameKey: 'templateWeekly', icon: '📅', category: 'Kişisel' },
  { id: 'swot', name: 'SWOT Analizi', nameKey: 'templateSwot', icon: '🔍', category: 'İş' },
  { id: 'blogpost', name: 'Blog Yazısı', nameKey: 'templateBlog', icon: '✍️', category: 'Yaratıcı' },
  { id: 'eventflyer', name: 'Etkinlik Afişi', nameKey: 'templateEvent', icon: '🎉', category: 'Pazarlama' },
];

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT = 'Arial';
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_ZOOM = 0.75;
