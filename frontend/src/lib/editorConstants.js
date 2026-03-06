import {
  Type, Image, Hand, FileText, Baseline, ALargeSmall,
  Volume2, FilePlus, Triangle, Square, Circle, Star,
  Pencil, Palette, Scissors, Wand2, MousePointer2
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
  { id: 'textsize', icon: Baseline, nameKey: 'textSize' },
  { id: 'font', icon: ALargeSmall, nameKey: 'font' },
  { id: 'color', icon: Palette, nameKey: 'colorPicker' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'image', icon: Image, nameKey: 'image' },
  { id: 'createimage', icon: Wand2, nameKey: 'aiImage' },
  { id: 'draw', icon: Pencil, nameKey: 'pencil' },
  { id: 'select', icon: MousePointer2, nameKey: 'select' },
  { id: 'cut', icon: Scissors, nameKey: 'crop' },
  { id: 'addpage', icon: FilePlus, nameKey: 'addPage' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize' },
  { id: 'voice', icon: Volume2, nameKey: 'voice' },
  { id: 'triangle', icon: Triangle, nameKey: 'triangle' },
  { id: 'square', icon: Square, nameKey: 'square' },
  { id: 'circle', icon: Circle, nameKey: 'circle' },
  { id: 'star', icon: Star, nameKey: 'star' },
];

export const DEFAULT_PAGE_SIZE = PAGE_SIZES[0];
export const DEFAULT_FONT_SIZE = 16;
export const DEFAULT_FONT = 'Arial';
export const DEFAULT_COLOR = '#000000';
export const DEFAULT_ZOOM = 0.75;
