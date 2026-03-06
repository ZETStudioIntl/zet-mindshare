import {
  Type, Image, Hand, FileText, Baseline, ALargeSmall,
  Volume2, FilePlus, Triangle, Square, Circle, Star,
  Pencil, Palette, Scissors, Wand2, MousePointer2,
  Eraser, PenTool, Languages, AlignJustify, Bold, Highlighter
} from 'lucide-react';

export const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'Square', width: 600, height: 600 },
];

export const FONTS = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Trebuchet MS', 'Palatino', 'Garamond', 'Comic Sans MS',
  'Impact', 'Lucida Console', 'Monaco', 'Bookman', 'Avant Garde',
  'Brush Script MT', 'Copperplate', 'Rockwell', 'Century Gothic', 'Tahoma'
];

export const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6600', '#6600FF', '#00FF66', '#FF0066',
  '#292f91', '#4ca8ad', '#333333', '#666666', '#999999', '#CCCCCC'
];

export const TOOLS = [
  { id: 'text', icon: Type, nameKey: 'text' },
  { id: 'wordtype', icon: Bold, nameKey: 'wordType' },
  { id: 'textsize', icon: Baseline, nameKey: 'textSize' },
  { id: 'font', icon: ALargeSmall, nameKey: 'font' },
  { id: 'linespacing', icon: AlignJustify, nameKey: 'lineSpacing' },
  { id: 'color', icon: Palette, nameKey: 'colorPicker' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'image', icon: Image, nameKey: 'image' },
  { id: 'createimage', icon: Wand2, nameKey: 'aiImage' },
  { id: 'draw', icon: Pencil, nameKey: 'pencil' },
  { id: 'pen', icon: PenTool, nameKey: 'penTool' },
  { id: 'eraser', icon: Eraser, nameKey: 'eraser' },
  { id: 'marking', icon: Highlighter, nameKey: 'marking' },
  { id: 'select', icon: MousePointer2, nameKey: 'select' },
  { id: 'cut', icon: Scissors, nameKey: 'crop' },
  { id: 'translate', icon: Languages, nameKey: 'translate' },
  { id: 'addpage', icon: FilePlus, nameKey: 'addPage' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize' },
  { id: 'voice', icon: Volume2, nameKey: 'voice' },
  { id: 'triangle', icon: Triangle, nameKey: 'triangle' },
  { id: 'square', icon: Square, nameKey: 'square' },
  { id: 'circle', icon: Circle, nameKey: 'circle' },
  { id: 'star', icon: Star, nameKey: 'star' },
];

export const TRANSLATE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'tr', name: 'Türkçe' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'es', name: 'Español' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'ru', name: 'Русский' },
  { code: 'ja', name: '日本語' },
  { code: 'ko', name: '한국어' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
];

export const LINE_SPACINGS = [1.0, 1.15, 1.5, 2.0, 2.5, 3.0];

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT = 'Arial';
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_ZOOM = 0.75;
