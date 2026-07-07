import React, { useState, useEffect, useRef, useCallback } from 'react';
import { A4LoadingScreen } from '../components/LoadingScreens';
import QuestNotification from '../components/QuestNotification';
import * as pdfjsLib from 'pdfjs-dist';
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { TOOLS, PAGE_SIZES, FONTS, PRESET_COLORS, TRANSLATE_LANGUAGES, LINE_SPACINGS, TEXT_ALIGNMENTS, CHART_TYPES, TEMPLATES, DEFAULT_SHORTCUTS, DEFAULT_PAGE_SIZE, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR, DEFAULT_ZOOM, SCRIPT_ELEMENT_TYPES, SCREENPLAY_PX_PER_CM } from '../lib/editorConstants';
import { savePreference } from '../lib/preferences';
import { Toolbox, SHAPE_LIST, PUNCTUATION_LIST } from '../components/editor/Toolbox';
import { CanvasArea } from '../components/editor/CanvasArea';
import { RightPanel } from '../components/editor/RightPanel';
import { DraggablePanel } from '../components/editor/DraggablePanel';
import axios from 'axios';
import { startCheckout } from '../lib/lemonSqueezy';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  Home, Save, Undo, Redo, ArrowLeft, ArrowRight,
  Upload, Search, X, Wand2, Plus, Check,
  Play, Pause, SkipBack, SkipForward, Volume2, Languages,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  Menu, Layers, Sparkles, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ZoomIn, ZoomOut, Download, Settings, Keyboard, Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Trash2, Table, Grid3X3, Ruler, Zap, Mic, FlipHorizontal2, ImagePlus, Pencil, Crown,
  List, ListOrdered, Group, Ungroup, CircleCheck, Cloud, Share2, MessageSquare, Users,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  Calculator, Copy as CopyIcon
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { convertToMSFormat, convertFromMSFormat, exportToMSFile, importFromMSFile } from '../lib/msFormat';
import { Document as DocxDocument, Packer as DocxPacker, Paragraph as DocxParagraph, TextRun as DocxTextRun, ImageRun as DocxImageRun, AlignmentType as DocxAlignmentType, UnderlineType as DocxUnderlineType } from 'docx';
import JSZip from 'jszip';
import ShareDialog from '../components/editor/ShareDialog';
import CommentsPanel from '../components/editor/CommentsPanel';
import EmojiPicker from '../components/editor/EmojiPicker';
import QRCodePanel from '../components/editor/QRCodePanel';
import WatermarkPanel from '../components/editor/WatermarkPanel';
import PageNumbersPanel from '../components/editor/PageNumbersPanel';
import SignaturePanel from '../components/editor/SignaturePanel';
import AIImagePanel from '../components/editor/AIImagePanel';
import FindReplacePanel from '../components/editor/FindReplacePanel';
import TemplatesPanel from '../components/editor/TemplatesPanel';
import ExportPanel from '../components/editor/ExportPanel';
import ChartPanel from '../components/editor/ChartPanel';
import { EditorStateContext } from '../contexts/EditorStateContext';
import EditorPanels from '../components/editor/EditorPanels';
import EditorMobileLayout from '../components/editor/EditorMobileLayout';
import EditorDesktopLayout from '../components/editor/EditorDesktopLayout';
import { useCollaboration } from '../hooks/useCollaboration';
import { useSignature } from '../hooks/useSignature';
import { useLayerOps } from '../hooks/useLayerOps';
import { useVoice } from '../hooks/useVoice';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ResizableDivider = ({ onResize }) => {
  const [dragging, setDragging] = useState(false);
  const handleMouseDown = (e) => {
    e.preventDefault();
    setDragging(true);
    const startX = e.clientX;
    const handleMouseMove = (ev) => { onResize(ev.clientX - startX); };
    const handleMouseUp = () => {
      setDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  return (
    <div
      onMouseDown={handleMouseDown}
      style={{ width: 4, cursor: 'col-resize', background: 'rgba(255,255,255,0.1)', flexShrink: 0, transition: dragging ? 'none' : 'background 0.2s', zIndex: 10 }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
      onMouseLeave={e => { if (!dragging) e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
    />
  );
};

function generateChartSVG(meta) {
  const { type, labels: labelsStr, data: dataStr, title = '', colors = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'], gradientStart = null, gradientEnd = null } = meta || {};
  const labels = (labelsStr || '').split(',').map(l => l.trim()).filter(Boolean);
  const rawData = (dataStr || '').split(',').map(d => parseFloat(d.trim()));
  const data = rawData.map(d => isNaN(d) ? 0 : d);
  while (data.length < labels.length) data.push(0);
  const width = 420, height = 320;
  const pad = { top: 40, right: 20, bottom: 45, left: 50 };
  const cw = width - pad.left - pad.right, ch = height - pad.top - pad.bottom;
  const maxVal = Math.max(...data, 1);
  let defs = '<defs>';
  if (gradientStart && gradientEnd) data.forEach((_, i) => { defs += `<linearGradient id="cg${i}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${gradientStart}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient>`; });
  defs += '</defs>';
  const fill = (i) => gradientStart && gradientEnd ? `url(#cg${i})` : (colors || [])[i % (colors || ['#3b82f6']).length] || '#3b82f6';
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="font-family:Arial,sans-serif"><rect width="${width}" height="${height}" fill="white" rx="8"/>${defs}<text x="${width/2}" y="24" text-anchor="middle" font-size="14" font-weight="600" fill="#1a1a2e">${(title||'').replace(/</g,'&lt;')}</text>`;
  if (type === 'bar') {
    svg += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top+ch}" stroke="#e5e7eb" stroke-width="1"/><line x1="${pad.left}" y1="${pad.top+ch}" x2="${pad.left+cw}" y2="${pad.top+ch}" stroke="#e5e7eb" stroke-width="1"/>`;
    for (let g=0;g<=4;g++){const gy=pad.top+ch-(g/4)*ch,gv=Math.round((maxVal*g)/4);svg+=`<line x1="${pad.left}" y1="${gy}" x2="${pad.left+cw}" y2="${gy}" stroke="#f3f4f6" stroke-width="0.5"/><text x="${pad.left-6}" y="${gy+4}" text-anchor="end" font-size="9" fill="#9ca3af">${gv}</text>`;}
    const gap=8,bw=Math.max(10,(cw-gap*(labels.length+1))/labels.length);
    labels.forEach((label,i)=>{const bh=Math.max(2,(data[i]/maxVal)*ch),x=pad.left+gap+i*(bw+gap),y=pad.top+ch-bh;svg+=`<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fill(i)}" rx="3"/><text x="${x+bw/2}" y="${y-4}" text-anchor="middle" font-size="9" fill="#374151" font-weight="500">${data[i]}</text><text x="${x+bw/2}" y="${pad.top+ch+14}" text-anchor="middle" font-size="9" fill="#6b7280">${label.length>8?label.slice(0,8)+'..':label}</text>`;});
  } else if (type === 'pie') {
    const total=data.reduce((a,b)=>a+b,0)||1,cx=width/2,cy=height/2+10,r=Math.min(cw,ch)/2-20;let sa=-Math.PI/2;
    labels.forEach((label,i)=>{const angle=(data[i]/total)*Math.PI*2;if(angle<0.001){sa+=angle;return;}const ea=sa+angle,x1=cx+r*Math.cos(sa),y1=cy+r*Math.sin(sa),x2=cx+r*Math.cos(ea),y2=cy+r*Math.sin(ea),la=angle>Math.PI?1:0;svg+=`<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${la} 1 ${x2},${y2} Z" fill="${fill(i)}" stroke="white" stroke-width="2"/>`;const mid=sa+angle/2,lx=cx+(r*0.65)*Math.cos(mid),ly=cy+(r*0.65)*Math.sin(mid),pct=Math.round((data[i]/total)*100);if(pct>=5)svg+=`<text x="${lx}" y="${ly+4}" text-anchor="middle" font-size="9" fill="white" font-weight="600">${pct}%</text>`;sa=ea;});
    const lgX=10,lgY=height-18;labels.forEach((label,i)=>{const lx=lgX+i*Math.min(90,width/labels.length);svg+=`<rect x="${lx}" y="${lgY}" width="8" height="8" fill="${fill(i)}" rx="2"/><text x="${lx+12}" y="${lgY+8}" font-size="8" fill="#6b7280">${label.length>8?label.slice(0,8)+'..':label}</text>`;});
  } else if (type === 'line') {
    svg+=`<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top+ch}" stroke="#e5e7eb" stroke-width="1"/><line x1="${pad.left}" y1="${pad.top+ch}" x2="${pad.left+cw}" y2="${pad.top+ch}" stroke="#e5e7eb" stroke-width="1"/>`;
    for(let g=0;g<=4;g++){const gy=pad.top+ch-(g/4)*ch,gv=Math.round((maxVal*g)/4);svg+=`<line x1="${pad.left}" y1="${gy}" x2="${pad.left+cw}" y2="${gy}" stroke="#f3f4f6" stroke-width="0.5"/><text x="${pad.left-6}" y="${gy+4}" text-anchor="end" font-size="9" fill="#9ca3af">${gv}</text>`;}
    const sp=cw/Math.max(1,labels.length-1),lc=gradientStart||((colors||['#3b82f6'])[0]);let area=`M${pad.left},${pad.top+ch}`,line='';
    labels.forEach((label,i)=>{const x=pad.left+i*sp,y=pad.top+ch-(data[i]/maxVal)*ch;line+=(i===0?'M':'L')+`${x},${y}`;area+=`L${x},${y}`;svg+=`<text x="${x}" y="${pad.top+ch+14}" text-anchor="middle" font-size="9" fill="#6b7280">${label.length>8?label.slice(0,8)+'..':label}</text>`;});
    area+=`L${pad.left+(labels.length-1)*sp},${pad.top+ch}Z`;svg+=`<path d="${area}" fill="${lc}" opacity="0.1"/><path d="${line}" stroke="${lc}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    labels.forEach((label,i)=>{const x=pad.left+i*sp,y=pad.top+ch-(data[i]/maxVal)*ch;svg+=`<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${lc}" stroke-width="2"/><text x="${x}" y="${y-8}" text-anchor="middle" font-size="9" fill="#374151" font-weight="500">${data[i]}</text>`;});
  }
  svg += '</svg>';
  const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
  return { svg, imgSrc, width, height };
}

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user: authUser } = useAuth();
  const { switchApp } = useAppTheme();
  useEffect(() => { switchApp('mindshare'); }, []); // always enforce mindshare theme in editor

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Offline detection
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Bağlantı geri gelince pending sync varsa otomatik gönder
  useEffect(() => {
    if (!isOnline || !docId) return;
    try {
      const local = JSON.parse(localStorage.getItem(`zet_offline_doc_${docId}`) || 'null');
      if (local?.pending_sync) saveDocument(true);
    } catch {}
  }, [isOnline]); // eslint-disable-line

  // Mobile panels
  const [mobilePanel, setMobilePanel] = useState(null); // 'pages' | 'zeta' | null

  // Document state
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'

  // Presence / edit lock
  const [isReadOnly, setIsReadOnly] = useState(false);
  const sessionIdRef = useRef(`sess_${Date.now()}_${Math.random().toString(36).slice(2)}`);
  const presenceIntervalRef = useRef(null);

  // Tool state
  const [activeTool, setActiveTool] = useState('select');
  const [toolboxOpen, setToolboxOpen] = useState(true);
  const [leftWidth, setLeftWidth] = useState(180);
  const [rightWidth, setRightWidth] = useState(320);
  const [rightOpen, setRightOpen] = useState(true);

  // Canvas element state
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const lastSelectedRef = useRef(null);
  const [drawPaths, setDrawPaths] = useState([]);

  // Keep ref in sync with selectedElement
  useEffect(() => {
    if (selectedElement) lastSelectedRef.current = selectedElement;
  }, [selectedElement]);

  // Global cursor — sayfa unmount olunca classları temizle
  useEffect(() => {
    return () => {
      const el = window.document.documentElement;
      if (el) ['tool-hand','tool-pen','tool-eraser','tool-text','tool-crosshair'].forEach(c => el.classList.remove(c));
    };
  }, []);

  // Sync formatting state when a text element is selected
  useEffect(() => {
    if (selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el && el.type === 'text') {
        if (el.bold !== undefined) setIsBold(el.bold);
        if (el.italic !== undefined) setIsItalic(el.italic);
        if (el.underline !== undefined) setIsUnderline(el.underline);
        if (el.strikethrough !== undefined) setIsStrikethrough(el.strikethrough);
        if (el.fontSize) setCurrentFontSize(el.fontSize);
        if (el.fontFamily) setCurrentFont(el.fontFamily);
        if (el.lineHeight) setCurrentLineHeight(el.lineHeight);
        if (el.textAlign) setCurrentTextAlign(el.textAlign);
        if (el.color) setCurrentColor(el.color);
        setFirstLineIndent(el.textIndent || 0);
        setParagraphSpaceBefore(el.paragraphSpaceBefore || 0);
        setParagraphSpaceAfter(el.paragraphSpaceAfter || 0);
        setIndentLeft(el.paddingLeft || 0);
        setIndentRight(el.paddingRight || 0);
        setIndentTop(el.paddingTop || 0);
        setIndentBottom(el.paddingBottom || 0);
      }
    }
  }, [selectedElement]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save text selection range before it's lost on blur
  const savedSelectionRef = useRef(null);
  useEffect(() => {
    const saveSelection = () => {
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const textEl = (container.nodeType === 3 ? container.parentElement : container);
        const editableDiv = textEl?.closest?.('[data-testid^="text-element-"]');
        if (editableDiv) {
          savedSelectionRef.current = {
            elementId: editableDiv.dataset.testid?.replace('text-element-', ''),
            text: sel.toString(),
            html: editableDiv.innerHTML,
            range: range.cloneRange(),
            editableDiv,
            isCollapsed: sel.isCollapsed,
          };
        }
        // If outside a text element, keep the last saved value — don't clear
      }
    };
    window.document.addEventListener('selectionchange', saveSelection);
    return () => window.document.removeEventListener('selectionchange', saveSelection);
  }, []);

  // View state
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Zeta Edit Mode
  const [zetaEditMode, setZetaEditMode] = useState(false);
  const [zetaEditInput, setZetaEditInput] = useState('');
  const [zetaEditLoading, setZetaEditLoading] = useState(false);
  const [zetaEditExplanation, setZetaEditExplanation] = useState('');
  const [zetaEditSuggestions, setZetaEditSuggestions] = useState([]);
  const pendingOpsRef = useRef([]); // { action, elementId, originalState }

  // Text/style state — son kullanılan ayarlar tercihlerden yüklenir, belgeden çıkınca sıfırlanmaz
  const savedTextDefaults = (() => {
    try { return JSON.parse(localStorage.getItem('zet_editor_text_defaults') || '{}'); } catch { return {}; }
  })();
  const [currentFontSize, setCurrentFontSize] = useState(savedTextDefaults.fontSize || DEFAULT_FONT_SIZE);
  const [currentFont, setCurrentFont] = useState(savedTextDefaults.font || DEFAULT_FONT);
  const [currentColor, setCurrentColor] = useState(savedTextDefaults.color || DEFAULT_COLOR);
  const [customColor, setCustomColor] = useState(savedTextDefaults.customColor || DEFAULT_COLOR);
  const [fontSearch, setFontSearch] = useState('');
  const [googleFonts, setGoogleFonts] = useState([]);
  const [loadedFonts, setLoadedFonts] = useState({});
  const [customWidth, setCustomWidth] = useState(DEFAULT_PAGE_SIZE.width);
  const [customHeight, setCustomHeight] = useState(DEFAULT_PAGE_SIZE.height);
  const [currentLineHeight, setCurrentLineHeight] = useState(savedTextDefaults.lineHeight || 1.5);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Drawing state
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [eraserSize, setEraserSize] = useState(15);
  const [eraserDragMode, setEraserDragMode] = useState(true);

  // Highlighter auto mode
  const [highlighterColor, setHighlighterColor] = useState('#FFFF00');

  // AI Image state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuality, setAiQuality] = useState('standard');
  const [aiReference, setAiReference] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiMimeType, setAiMimeType] = useState('image/png');

  // Translate state
  const [translateText, setTranslateText] = useState('');
  const [translateResult, setTranslateResult] = useState('');
  const [translateLang, setTranslateLang] = useState('en');
  const [translateLoading, setTranslateLoading] = useState(false);
  const [translateElementId, setTranslateElementId] = useState(null);

  // Voice state

  // Panel visibility
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [pageSizeScope, setPageSizeScope] = useState('current'); // 'current' | 'all'
  const [showTextSize, setShowTextSize] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showCreateImage, setShowCreateImage] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [showWordType, setShowWordType] = useState(false);
  const [showParagraph, setShowParagraph] = useState(false);
  const [showGraphic, setShowGraphic] = useState(false);
  const [showPageColor, setShowPageColor] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShapes, setShowShapes] = useState(false);
  const [showPunctuation, setShowPunctuation] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPhotoEdit, setShowPhotoEdit] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [uploadForShape, setUploadForShape] = useState(null);
  const [changeImageTarget, setChangeImageTarget] = useState(null);

  // Photo Edit state
  const [photoEditImage, setPhotoEditImage] = useState(null);
  const [photoEditPrompt, setPhotoEditPrompt] = useState('');
  const [photoEditLoading, setPhotoEditLoading] = useState(false);
  const [photoEditResult, setPhotoEditResult] = useState(null);

  // Photo Edit drawing state
  const photoEditCanvasRef = useRef(null);
  const [isDrawingOnPhoto, setIsDrawingOnPhoto] = useState(false);
  const [photoEditDrawings, setPhotoEditDrawings] = useState([]);
  const [photoEditDrawMode, setPhotoEditDrawMode] = useState(false);

  // Signature state

  // Page background color
  const [pageBackground, setPageBackground] = useState('#ffffff');

  // Text alignment
  const [currentTextAlign, setCurrentTextAlign] = useState('left');

  // Paragraph formatting
  const [firstLineIndent, setFirstLineIndent] = useState(0);
  const [paragraphSpaceBefore, setParagraphSpaceBefore] = useState(0);
  const [paragraphSpaceAfter, setParagraphSpaceAfter] = useState(0);

  // Yazı tipi/boyut/renk/satır aralığı/paragraf varsayılanları — sadece kullanıcı
  // panelden bilinçli olarak değiştirdiğinde kaydedilir (eleman seçimiyle senkronizasyon
  // hariç, yoksa rastgele bir elemana tıklamak varsayılanı o elemanın stiliyle ezerdi)
  const textDefaultsRef = useRef({
    fontSize: currentFontSize, font: currentFont, color: currentColor, customColor, lineHeight: currentLineHeight,
    textAlign: currentTextAlign, firstLineIndent, paragraphSpaceBefore, paragraphSpaceAfter,
  });
  useEffect(() => {
    textDefaultsRef.current = {
      fontSize: currentFontSize, font: currentFont, color: currentColor, customColor, lineHeight: currentLineHeight,
      textAlign: currentTextAlign, firstLineIndent, paragraphSpaceBefore, paragraphSpaceAfter,
    };
  }, [currentFontSize, currentFont, currentColor, customColor, currentLineHeight, currentTextAlign, firstLineIndent, paragraphSpaceBefore, paragraphSpaceAfter]);

  const persistTextDefaults = (overrides) => {
    savePreference('zet_editor_text_defaults', JSON.stringify({ ...textDefaultsRef.current, ...overrides }));
  };
  const setCurrentFontPersisted = (val) => { setCurrentFont(val); persistTextDefaults({ font: val }); };
  const setCurrentFontSizePersisted = (val) => { setCurrentFontSize(val); persistTextDefaults({ fontSize: val }); };
  const setCurrentColorPersisted = (val) => { setCurrentColor(val); persistTextDefaults({ color: val }); };
  const setCustomColorPersisted = (val) => { setCustomColor(val); persistTextDefaults({ customColor: val }); };
  const setCurrentLineHeightPersisted = (val) => { setCurrentLineHeight(val); persistTextDefaults({ lineHeight: val }); };
  const setFirstLineIndentPersisted = (val) => { setFirstLineIndent(val); persistTextDefaults({ firstLineIndent: val }); };
  const setParagraphSpaceBeforePersisted = (val) => { setParagraphSpaceBefore(val); persistTextDefaults({ paragraphSpaceBefore: val }); };
  const setParagraphSpaceAfterPersisted = (val) => { setParagraphSpaceAfter(val); persistTextDefaults({ paragraphSpaceAfter: val }); };

  // Sunucudan geç gelen tercihler state'e işlenir
  useEffect(() => {
    const onPrefsLoaded = (e) => {
      const saved = e.detail?.['zet_editor_text_defaults'];
      if (!saved) return;
      try {
        const d = JSON.parse(saved);
        if (d.fontSize) setCurrentFontSize(d.fontSize);
        if (d.font) setCurrentFont(d.font);
        if (d.color) setCurrentColor(d.color);
        if (d.customColor) setCustomColor(d.customColor);
        if (d.lineHeight) setCurrentLineHeight(d.lineHeight);
        if (d.textAlign) setCurrentTextAlign(d.textAlign);
        if (d.firstLineIndent) setFirstLineIndent(d.firstLineIndent);
        if (d.paragraphSpaceBefore) setParagraphSpaceBefore(d.paragraphSpaceBefore);
        if (d.paragraphSpaceAfter) setParagraphSpaceAfter(d.paragraphSpaceAfter);
      } catch {}
    };
    window.addEventListener('zet:preferences-loaded', onPrefsLoaded);
    return () => window.removeEventListener('zet:preferences-loaded', onPrefsLoaded);
  }, []);

  // Kısayollar — sunucudan geç gelen tercihler senkronize edilir
  useEffect(() => {
    const onShortcutsLoaded = (e) => {
      if (e.detail?.['zet_shortcuts']) {
        try { setShortcuts(JSON.parse(e.detail['zet_shortcuts'])); } catch {}
      }
    };
    window.addEventListener('zet:preferences-loaded', onShortcutsLoaded);
    return () => window.removeEventListener('zet:preferences-loaded', onShortcutsLoaded);
  }, []);
  
  // Gradient colors for text (legacy — kept for chart generation)
  const [gradientStart, setGradientStart] = useState(null);
  const [gradientEnd, setGradientEnd] = useState(null);
  const [gradientDirection, setGradientDirection] = useState('90deg');
  const [useGradient, setUseGradient] = useState(false);
  const [hexInput, setHexInput] = useState('#000000');

  // Color panel — material selector + multi-stop gradient
  const [colorTarget, setColorTarget] = useState('text');
  const [gradientStops, setGradientStops] = useState([{ id: 'g0', pos: 0, color: '#FF6B6B' }, { id: 'g1', pos: 100, color: '#4ECDC4' }]);
  const [gradientAngle, setGradientAngle] = useState(90);
  const [activeStopId, setActiveStopId] = useState('g0');

  // Zoom tool state
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [zoomRadius, setZoomRadius] = useState(50);
  const [magnifierPos, setMagnifierPos] = useState(null);
  const [magnifierBorderColor, setMagnifierBorderColor] = useState('#60a5fa');
  const [magnifierGradientStart, setMagnifierGradientStart] = useState('#60a5fa');
  const [magnifierGradientEnd, setMagnifierGradientEnd] = useState('#a855f7');
  const [useMagnifierGradient, setUseMagnifierGradient] = useState(false);

  // Graphiç chart state
  const [chartType, setChartType] = useState('bar');
  const [chartLabels, setChartLabels] = useState('A,B,C,D');
  const [chartData, setChartData] = useState('10,20,30,40');
  const [chartTitle, setChartTitle] = useState('Chart');
  const [chartColors, setChartColors] = useState(['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']);
  const [chartImage, setChartImage] = useState(null);
  const [editingChartId, setEditingChartId] = useState(null);

  // Gradient presets
  const GRADIENT_PRESETS = [
    { name: 'Sunset', start: '#ff7e5f', end: '#feb47b' },
    { name: 'Ocean', start: '#2193b0', end: '#6dd5ed' },
    { name: 'Purple', start: '#7f00ff', end: '#e100ff' },
    { name: 'Green', start: '#11998e', end: '#38ef7d' },
    { name: 'Fire', start: '#f12711', end: '#f5af19' },
    { name: 'Night', start: '#0f0c29', end: '#302b63' },
  ];

  // Keyboard shortcuts
  const [shortcuts, setShortcuts] = useState(() => {
    const saved = localStorage.getItem('zet_shortcuts');
    return saved ? JSON.parse(saved) : DEFAULT_SHORTCUTS;
  });
  const [editingShortcut, setEditingShortcut] = useState(null);
  const [shortcutSearch, setShortcutSearch] = useState('');

  // Fast Select state
  const [fastSelectTools] = useState(() => {
    const saved = localStorage.getItem('zet_fast_select');
    return saved ? JSON.parse(saved) : ['select', 'hand', 'draw', 'image'];
  });

  // Usage & Subscription state
  const [userUsage, setUserUsage] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (!isOnline && userPlan === 'free') setRightOpen(false); }, [isOnline, userPlan]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [questNotification, setQuestNotification] = useState(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditPackages, setCreditPackages] = useState([]);
  const [buyingCredits, setBuyingCredits] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(20);
  const [planLimits, setPlanLimits] = useState({});
  const [creditCosts, setCreditCosts] = useState({});
  const [aiImagePro, setAiImagePro] = useState(false);
  const [aiAspectRatio, setAiAspectRatio] = useState('16:9');

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportCountdown, setExportCountdown] = useState(null); // { format, totalDelay, remaining }

  // Calculator state
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcExpr, setCalcExpr] = useState('');
  const [calcResult, setCalcResult] = useState('');
  const [calcCopied, setCalcCopied] = useState(false);

  // New professional tools state
  const [showTable, setShowTable] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [showRuler, setShowRuler] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showPageNumbers, setShowPageNumbers] = useState(false);
  const [showHeaderFooter, setShowHeaderFooter] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showIndent, setShowIndent] = useState(false);
  const [showMargins, setShowMargins] = useState(false);
  const [showBulletList, setShowBulletList] = useState(false);
  const [showNumberedList, setShowNumberedList] = useState(false);
  const [currentBulletStyle, setCurrentBulletStyle] = useState('disc');
  const [currentNumberStyle, setCurrentNumberStyle] = useState('decimal');
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [showFootnote, setShowFootnote] = useState(false);
  const [showTOC, setShowTOC] = useState(false);

  // Collaboration state
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [collabEnabled, setCollabEnabled] = useState(false);

  // Indent state
  const [indentLeft, setIndentLeft] = useState(0);
  const [indentRight, setIndentRight] = useState(0);
  const [indentTop, setIndentTop] = useState(0);
  const [indentBottom, setIndentBottom] = useState(0);

  // Margins state
  const [marginTop, setMarginTop] = useState(40);
  const [marginBottom, setMarginBottom] = useState(40);
  const [marginLeft, setMarginLeft] = useState(40);
  const [marginRight, setMarginRight] = useState(40);

  // Screenplay mode
  const [screenplayMode, setScreenplayMode] = useState(false);
  const [showSceneNavigator, setShowSceneNavigator] = useState(false);

  // Chat AI Settings state
  const [zetaMood, setZetaMood] = useState(() => localStorage.getItem('zet_zeta_mood') || 'professional');
  const [zetaEmoji, setZetaEmoji] = useState(() => localStorage.getItem('zet_zeta_emoji') || 'medium');
  const [zetaCustomPrompt, setZetaCustomPrompt] = useState(() => localStorage.getItem('zet_zeta_custom') || '');
  const [judgeMood, setJudgeMood] = useState(() => localStorage.getItem('zet_judge_mood') || 'normal');

  // Table state
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  // Layers state
  const [elementLayers, setElementLayers] = useState([]);

  // Ruler & Grid state
  const [rulerVisible, setRulerVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // QR Code state
  const [qrText, setQrText] = useState('');

  // Watermark state
  const [watermarkText, setWatermarkText] = useState('');
  const [watermarkOpacity, setWatermarkOpacity] = useState(20);
  const [watermarkColor, setWatermarkColor] = useState('#888888');

  // Page numbers state
  const [pageNumbersEnabled, setPageNumbersEnabled] = useState(false);
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom-center');
  const [pageNumberFormat, setPageNumberFormat] = useState('numeric'); // 'numeric'|'roman'|'ROMAN'|'alpha'
  const [pageNumberStyle, setPageNumberStyle] = useState('n'); // 'n'|'n/total'|'page-n'|'page-n-of-total'
  const [pageNumberStart, setPageNumberStart] = useState(1);

  // Column layout state
  const [columnCount, setColumnCount] = useState(1);
  const [columnGap, setColumnGap] = useState(20);
  const [showColumns, setShowColumns] = useState(false);

  // Export format and quality state
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportQuality, setExportQuality] = useState('high');

  // Header/Footer state
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');
  const [headerFooterMode, setHeaderFooterMode] = useState('all');
  const [headerOdd, setHeaderOdd] = useState('');
  const [headerEven, setHeaderEven] = useState('');
  const [footerOdd, setFooterOdd] = useState('');
  const [footerEven, setFooterEven] = useState('');

  // Paragraph styles panel
  const [showStyles, setShowStyles] = useState(false);

  // Spell check
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(false);
  const [spellErrors, setSpellErrors] = useState({});
  const [tanıList, setTanıList] = useState(() => {
    try { return JSON.parse(localStorage.getItem('zet_tani') || '{}'); } catch { return {}; }
  });
  const [spellPopup, setSpellPopup] = useState(null);

  // Copy/Paste state

  // Mirror state
  const [showMirror, setShowMirror] = useState(false);
  const [mirrorAngle, setMirrorAngle] = useState(0);

  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findResults, setFindResults] = useState([]);
  const [findScope, setFindScope] = useState('current');

  // AI shape target + PDF import (declared here to avoid TDZ in production builds)
  const [aiTargetShape, setAiTargetShape] = useState(null);
  const [pdfImporting, setPdfImporting] = useState(false);
  const pdfInputRef = useRef(null);

  // History
  const history = useCanvasHistory();
  const handleSaveHistory = useCallback((elements) => { history.push(elements); }, [history]);
  const handleUndo = () => { const prev = history.undo(); if (prev) setCanvasElements(prev); };
  const handleRedo = () => { const next = history.redo(); if (next) setCanvasElements(next); };

  // Spell check handlers
  const spellCheckTimerRef = useRef(null);

  const checkSpelling = useCallback(async (elementId, text) => {
    if (!text?.trim()) return;
    try {
      const res = await axios.post(`${API}/spell-check`, { text }, { withCredentials: true });
      if (res.data.errors?.length > 0) {
        setSpellErrors(prev => ({ ...prev, [elementId]: res.data.errors }));
      } else {
        setSpellErrors(prev => { const n = { ...prev }; delete n[elementId]; return n; });
      }
    } catch {}
  }, []);

  const addToTanı = useCallback((misspelling) => {
    setTanıList(prev => {
      const next = { ...prev, [misspelling]: true };
      localStorage.setItem('zet_tani', JSON.stringify(next));
      return next;
    });
    setSpellErrors(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = (next[id] || []).filter(e => e.word !== misspelling);
      });
      return next;
    });
    setSpellPopup(null);
  }, []);

  const applySpellCorrection = useCallback((elementId, error, correction) => {
    setCanvasElements(prev => prev.map(el => {
      if (el.id !== elementId) return el;
      const plain = el.content || el.htmlContent?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '') || '';
      const newContent = plain.slice(0, error.offset) + correction + plain.slice(error.offset + error.length);
      return { ...el, content: newContent, htmlContent: null };
    }));
    setSpellErrors(prev => ({ ...prev, [elementId]: (prev[elementId] || []).filter(e => e.offset !== error.offset) }));
    setSpellPopup(null);
  }, [setCanvasElements]);

  const handleSpellWordClick = useCallback((event, elementId, error) => {
    setSpellPopup({ x: event.clientX, y: event.clientY, elementId, error });
  }, []);

  // === CUSTOM HOOKS ===
  const { signatureData, setSignatureData, signatureCanvasRef, isDrawingSignature, setIsDrawingSignature, signaturePoints, setSignaturePoints, showSignature, setShowSignature, clearSignature, handleSignatureMouseDown, handleSignatureMouseMove, handleSignatureMouseUp, addSignatureToCanvas, handleSignaturePhotoUpload, sigPhotoRaw, sigPhotoThreshold, handleSigPhotoThresholdChange } = useSignature({ canvasElements, setCanvasElements, handleSaveHistory, currentColor });
  const { moveLayerUp, moveLayerDown, toggleLayerVisibility, toggleLayerLock, copyElement, pasteElement, alignElements, mirrorElement, rotateElement, copyElementById, mirrorElementById } = useLayerOps({ canvasElements, setCanvasElements, history, handleSaveHistory, selectedElement, selectedElements, setSelectedElement, setSelectedElements, setShowMirror });
  const { isPlaying, setIsPlaying, voiceProgress, setVoiceProgress, audioRef, availableVoices, selectedVoice, setSelectedVoice, voiceLoading, ttsAudio, setTtsAudio, showVoice, setShowVoice, showVoiceInput, setShowVoiceInput, isListening, voiceTranscript, setVoiceTranscript, isRecordingEL, elSttLoading, generateTTS, fetchVoices, playVoiceFrom, skipVoice, stopVoice, startListening, stopListening, startElevenLabsSTT, stopElevenLabsSTT, addVoiceTextToDocument } = useVoice({ canvasElements, setCanvasElements, history, document, currentPage, currentFont, currentFontSize, currentColor, language });

  // Collaboration hook
  const collab = useCollaboration(
    docId,
    authUser?.user_id || 'unknown',
    authUser?.name || 'User',
    collabEnabled
  );

  // Enable collab if URL has ?collab=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('collab') === 'true') setCollabEnabled(true);
  }, []);

  // Handle incoming collab messages
  useEffect(() => {
    if (!collab.connected) return;
    collab.onCollabMessage((data) => {
      if (data.type === 'element_update' && data.elements) {
        setCanvasElements(data.elements);
      } else if (data.type === 'element_add' && data.element) {
        setCanvasElements(prev => [...prev, data.element]);
      } else if (data.type === 'element_delete' && data.element_id) {
        setCanvasElements(prev => prev.filter(e => e.id !== data.element_id));
      }
    });
  }, [collab.connected, collab.onCollabMessage]);
  // Debounced spell check — fires 1.5s after canvas text changes
  useEffect(() => {
    if (!spellCheckEnabled) { setSpellErrors({}); return; }
    const textEls = canvasElements.filter(el => el.type === 'text');
    if (spellCheckTimerRef.current) clearTimeout(spellCheckTimerRef.current);
    spellCheckTimerRef.current = setTimeout(() => {
      textEls.forEach(el => {
        const text = el.content || el.htmlContent?.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '') || '';
        if (text.trim()) checkSpelling(el.id, text);
      });
    }, 1500);
    return () => { if (spellCheckTimerRef.current) clearTimeout(spellCheckTimerRef.current); };
  }, [canvasElements, spellCheckEnabled, checkSpelling]);

  const autoSaveTimerRef = useRef(null);
  const autoSave30Ref = useRef(null);
  const saveDocumentRef = useRef(null);
  const latestSaveDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const canvasContainerRef = useRef(null);
  const gradientBarRef = useRef(null);
  const activeToolRef = useRef('select');
  const hiddenPasteRef = useRef(null);
  const canvasElementsRef = useRef(canvasElements);
  const pasteFormatRef = useRef({});
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);
  useEffect(() => { canvasElementsRef.current = canvasElements; }, [canvasElements]);
  useEffect(() => {
    pasteFormatRef.current = { fontFamily: currentFont, fontSize: currentFontSize, color: currentColor, lineHeight: currentLineHeight, textAlign: currentTextAlign, bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough };
  }, [currentFont, currentFontSize, currentColor, currentLineHeight, currentTextAlign, isBold, isItalic, isUnderline, isStrikethrough]);

  // === Ctrl+Z / Ctrl+Y / Delete / Shortcuts ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true';
      
      // Ctrl+Z/Y: Let browser handle native undo/redo inside contentEditable/inputs
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        if (isEditing) return; // browser native undo in text fields
        e.preventDefault(); handleUndo(); return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        if (isEditing) return; // browser native redo in text fields
        e.preventDefault(); handleRedo(); return;
      }
      
      // Ctrl+C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && !isEditing) {
        e.preventDefault();
        copyElement();
        return;
      }
      
      // Ctrl+V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !isEditing) {
        e.preventDefault();
        pasteElement();
        return;
      }
      
      // Don't process shortcuts when editing text
      if (isEditing) return;
      
      // Delete key - delete selected element
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement || selectedElements.length > 0) {
          e.preventDefault();
          deleteSelected();
          return;
        }
      }
      
      // Escape - deselect
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setSelectedElements([]);
        return;
      }
      
      // Tool shortcuts (single key) — suppressed in text tool mode (keys are for typing)
      const key = e.key.toUpperCase();
      if (shortcuts[key] && !e.ctrlKey && !e.metaKey && !e.altKey && activeToolRef.current !== 'text') {
        e.preventDefault();
        handleToolSelect(shortcuts[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, selectedElement, selectedElements]);

  // === Mobile/Desktop Paste (system clipboard → canvas element) ===
  useEffect(() => {
    const handlePaste = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      // Skip native text inputs/contentEditables unless it's our hidden paste target
      if (e.target !== hiddenPasteRef.current) {
        if (tag === 'input' || tag === 'textarea') return;
        if (e.target.contentEditable === 'true') return;
      }
      const items = e.clipboardData?.items;
      if (!items) return;

      // Image takes priority
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (!blob) break;
          const reader = new FileReader();
          reader.onload = (ev) => {
            const src = ev.target.result;
            const img = new window.Image();
            img.onload = () => {
              const maxW = Math.min(300, pageSize.width - 40);
              const ratio = maxW / img.width;
              const newEl = { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: maxW, height: img.height * ratio, src };
              const updated = [...canvasElementsRef.current, newEl];
              setCanvasElements(updated);
              handleSaveHistory(updated);
            };
            img.src = src;
          };
          reader.readAsDataURL(blob);
          return;
        }
      }

      // Plain text fallback
      const text = e.clipboardData?.getData('text/plain') || '';
      const fmt = pasteFormatRef.current;
      const makeTextEl = (txt) => ({
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'text', x: 50, y: 50,
        content: txt,
        fontSize: fmt.fontSize || 14,
        fontFamily: fmt.fontFamily || 'Arial',
        color: fmt.color || '#000000',
        width: Math.min(400, pageSize.width - 60),
        lineHeight: fmt.lineHeight || 1.5,
        textAlign: fmt.textAlign || 'left',
        bold: fmt.bold || false,
        italic: fmt.italic || false,
        underline: fmt.underline || false,
        strikethrough: fmt.strikethrough || false,
        gradientStart: null, gradientEnd: null,
      });
      if (text.trim()) {
        e.preventDefault();
        const updated = [...canvasElementsRef.current, makeTextEl(text.trim())];
        setCanvasElements(updated);
        handleSaveHistory(updated);
      } else if (e.target === hiddenPasteRef.current) {
        // iOS fallback: text goes into textarea value after event fires
        e.preventDefault();
        setTimeout(() => {
          const val = (hiddenPasteRef.current?.value || '').trim();
          if (hiddenPasteRef.current) hiddenPasteRef.current.value = '';
          if (!val) return;
          const updated = [...canvasElementsRef.current, makeTextEl(val)];
          setCanvasElements(updated);
          handleSaveHistory(updated);
        }, 0);
      }
    };

    // Mobile: focus hidden input on canvas touch so the long-press "Paste" option appears
    const handleTouchStart = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true') return;
      if (hiddenPasteRef.current && window.document.activeElement !== hiddenPasteRef.current) {
        hiddenPasteRef.current.focus({ preventScroll: true });
      }
    };

    window.document.addEventListener('paste', handlePaste);
    window.document.addEventListener('touchstart', handleTouchStart, { passive: true });
    return () => {
      window.document.removeEventListener('paste', handlePaste);
      window.document.removeEventListener('touchstart', handleTouchStart);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, setCanvasElements, handleSaveHistory]);

  // === DATA LOADING ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocument(); }, [docId]);


  // === PRESENCE (edit lock) ===
  useEffect(() => {
    if (!docId) return;
    const sessionId = sessionIdRef.current;
    let active = true; // StrictMode double-invoke guard

    const ping = async () => {
      if (!active) return;
      try {
        const res = await axios.post(`${API}/documents/${docId}/presence`, { session_id: sessionId }, { withCredentials: true });
        if (!active) return;
        setIsReadOnly(!res.data.is_primary);
      } catch {}
    };

    // Önceki interval'i temizle, sonra yenisini kur
    if (presenceIntervalRef.current) clearInterval(presenceIntervalRef.current);
    ping();
    presenceIntervalRef.current = setInterval(ping, 30000);

    const clearPresence = () => {
      active = false;
      clearInterval(presenceIntervalRef.current);
      presenceIntervalRef.current = null;
      // sendBeacon — tab kapanırken bile tamamlanır (POST /clear unauthenticated endpoint)
      navigator.sendBeacon(`${API}/documents/${docId}/presence/${sessionId}/clear`);
      axios.delete(`${API}/documents/${docId}/presence/${sessionId}`, { withCredentials: true }).catch(() => {});
    };

    window.addEventListener('beforeunload', clearPresence);
    return () => {
      clearPresence();
      window.removeEventListener('beforeunload', clearPresence);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  // Primary olunca localStorage'daki bekleyen değişiklikleri server'a gönder
  useEffect(() => {
    if (isReadOnly || !docId || !document) return;
    const offline = localStorage.getItem(`zet_offline_doc_${docId}`);
    if (!offline) return;
    try {
      const local = JSON.parse(offline);
      const serverUpdatedAt = document.updated_at ? new Date(document.updated_at).getTime() : 0;
      if ((local.savedAt || 0) > serverUpdatedAt) {
        saveDocument(true);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadOnly]);

  // Fetch user usage and plan
  const refreshCredits = async () => {
    try {
      const res = await axios.get(`${API}/usage`, { withCredentials: true });
      setUserUsage(res.data);
      setUserPlan(res.data.plan || 'free');
      setCreditsRemaining(res.data.credits_remaining || 0);
      setDailyCredits(res.data.daily_credits || 20);
      setPlanLimits(res.data.limits || {});
      setCreditCosts(res.data.credit_costs || {});
    } catch (err) {
      console.log('Failed to fetch usage');
    }
  };
  useEffect(() => { refreshCredits(); }, []);

  useEffect(() => {
    const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
    fetch(`${API}/fonts`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length > 0) setGoogleFonts(data); })
      .catch(() => {});
  }, []);

  const loadGoogleFont = (family) => {
    if (loadedFonts[family]) return;
    const link = window.document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap`;
    link.rel = 'stylesheet';
    window.document.head.appendChild(link);
    setLoadedFonts(prev => ({ ...prev, [family]: true }));
  };

  // === CANVAS TIME TRACKING — sadece editörde geçen aktif süreyi say ===
  useEffect(() => {
    const dom = window.document; // 'document' React state ile çakışır, window.document kullan
    const INACTIVE_LIMIT = 5 * 60 * 1000;
    const TIME_INTERVAL = 60000;
    const lastActivityRef = { current: Date.now() };
    const lastTimeSentRef = { current: Date.now() };

    const onActivity = () => { lastActivityRef.current = Date.now(); };
    dom.addEventListener('mousemove', onActivity, { passive: true });
    dom.addEventListener('keydown', onActivity, { passive: true });
    dom.addEventListener('click', onActivity, { passive: true });

    const sendTimeSpent = () => {
      if (dom.hidden) return;
      if (Date.now() - lastActivityRef.current >= INACTIVE_LIMIT) return;
      const now = Date.now();
      const seconds = Math.round((now - lastTimeSentRef.current) / 1000);
      lastTimeSentRef.current = now;
      if (seconds > 0 && seconds <= 120) {
        axios.post(`${API}/user/time-spent`, { seconds }, { withCredentials: true }).catch(() => {});
      }
    };

    const handleUnload = () => {
      if (Date.now() - lastActivityRef.current >= INACTIVE_LIMIT) return;
      const seconds = Math.round((Date.now() - lastTimeSentRef.current) / 1000);
      if (seconds > 0 && seconds <= 120) {
        const blob = new Blob([JSON.stringify({ seconds })], { type: 'application/json' });
        navigator.sendBeacon(`${API}/user/time-spent`, blob);
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    const timerId = setInterval(sendTimeSpent, TIME_INTERVAL);

    return () => {
      clearInterval(timerId);
      window.removeEventListener('beforeunload', handleUnload);
      dom.removeEventListener('mousemove', onActivity);
      dom.removeEventListener('keydown', onActivity);
      dom.removeEventListener('click', onActivity);
      sendTimeSpent();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const lastLoadedPageRef = useRef(null);
  useEffect(() => {
    if (document?.pages?.[currentPage]) {
      const pageKey = `${currentPage}`;
      // Only reload elements and reset history when switching to a DIFFERENT page
      // Skip when document changes from save (same page, just updated data)
      if (lastLoadedPageRef.current !== pageKey) {
        const page = document.pages[currentPage];
        setCanvasElements(page.elements || []);
        setDrawPaths(page.drawPaths || []);
        history.reset(page.elements || []);
        if (page.pageSize) setPageSize(page.pageSize);
        setSelectedElement(null); setSelectedElements([]);
        lastLoadedPageRef.current = pageKey;
      }
    } else { setCanvasElements([]); setDrawPaths([]); lastLoadedPageRef.current = null; }
  }, [document, currentPage]);

  // === AUTO-SAVE (elements + drawPaths) ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!document || !docId) return;
    // Her durumda localStorage'a yaz — read-only'de de, primary olunca sync edilir
    try {
      const pages = [...(document.pages || [])];
      if (pages[currentPage]) {
        pages[currentPage] = { ...pages[currentPage], elements: canvasElements, drawPaths, pageSize };
      }
      localStorage.setItem(`zet_offline_doc_${docId}`, JSON.stringify({
        title: document.title, subtitle: document.subtitle || null, pages, savedAt: Date.now(),
      }));
    } catch {}
    if (isReadOnly) return; // Server'a gitme
    setSaveStatus('unsaved');
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => saveDocument(true), 500);
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [canvasElements, drawPaths]);

  // Ref'i her zaman güncel tut — unmount ve visibilitychange kayıtları için
  useEffect(() => {
    latestSaveDataRef.current = { canvasElements, drawPaths, currentPage, pageSize, document };
  }, [canvasElements, drawPaths, currentPage, pageSize, document]);

  // Sayfa kapanırken veya arka plana geçerken kaydet (mobil dahil)
  useEffect(() => {
    const flushSave = () => {
      const d = latestSaveDataRef.current;
      if (!d || !docId) return;
      // 1) localStorage'a senkron yaz — sekme kapansa bile tamamlanır
      try {
        const pages = d.document?.pages ? [...d.document.pages] : [];
        if (pages[d.currentPage]) {
          pages[d.currentPage] = { ...pages[d.currentPage], elements: d.canvasElements, drawPaths: d.drawPaths, pageSize: d.pageSize };
        }
        localStorage.setItem(`zet_offline_doc_${docId}`, JSON.stringify({
          title: d.document?.title || '', subtitle: d.document?.subtitle || null, pages, savedAt: Date.now(),
        }));
      } catch {}
      // 2) Ağ varsa sunucuya da gönder (fire-and-forget, tamamlanmasa sorun değil — localStorage backup var)
      if (!navigator.onLine || !d.document) return;
      const pages2 = d.document.pages ? [...d.document.pages] : [];
      if (pages2[d.currentPage]) {
        pages2[d.currentPage] = { ...pages2[d.currentPage], elements: d.canvasElements, drawPaths: d.drawPaths, pageSize: d.pageSize };
      }
      axios.put(`${API}/documents/${docId}`, {
        title: d.document.title, subtitle: d.document.subtitle || null,
        content: d.document.content, pages: pages2,
      }, { withCredentials: true }).catch(() => {});
    };
    const onVis = () => { if (window.document.visibilityState === 'hidden') flushSave(); };
    window.addEventListener('visibilitychange', onVis);
    return () => {
      isMountedRef.current = false;
      window.removeEventListener('visibilitychange', onVis);
      flushSave();
    };
  }, []); // eslint-disable-line

  const applyDocSettings = (s) => {
    if (!s) return;
    if (s.marginLeft !== undefined) setMarginLeft(Number(s.marginLeft));
    if (s.marginRight !== undefined) setMarginRight(Number(s.marginRight));
    if (s.marginTop !== undefined) setMarginTop(Number(s.marginTop));
    if (s.marginBottom !== undefined) setMarginBottom(Number(s.marginBottom));
    if (s.pageBackground !== undefined) setPageBackground(s.pageBackground);
    if (s.currentFont !== undefined) setCurrentFont(s.currentFont);
    if (s.currentFontSize !== undefined) setCurrentFontSize(Number(s.currentFontSize));
    if (s.currentColor !== undefined) setCurrentColor(s.currentColor);
    if (s.currentLineHeight !== undefined) setCurrentLineHeight(Number(s.currentLineHeight));
    if (s.currentTextAlign !== undefined) setCurrentTextAlign(s.currentTextAlign);
    if (s.firstLineIndent !== undefined) setFirstLineIndent(Number(s.firstLineIndent));
    if (s.paragraphSpaceBefore !== undefined) setParagraphSpaceBefore(Number(s.paragraphSpaceBefore));
    if (s.paragraphSpaceAfter !== undefined) setParagraphSpaceAfter(Number(s.paragraphSpaceAfter));
    if (s.indentLeft !== undefined) setIndentLeft(Number(s.indentLeft));
    if (s.indentRight !== undefined) setIndentRight(Number(s.indentRight));
    if (s.indentTop !== undefined) setIndentTop(Number(s.indentTop));
    if (s.indentBottom !== undefined) setIndentBottom(Number(s.indentBottom));
    if (s.pageSize !== undefined) setPageSize(s.pageSize);
    if (s.screenplayMode !== undefined) setScreenplayMode(Boolean(s.screenplayMode));
    if (s.rulerVisible !== undefined) setRulerVisible(Boolean(s.rulerVisible));
  };

  const fetchDocument = async () => {
    const localSettings = (() => {
      try { return JSON.parse(localStorage.getItem(`zet_doc_settings_${docId}`) || 'null'); } catch { return null; }
    })();
    try {
      const res = await axios.get(`${API}/documents/${docId}`, { withCredentials: true });
      if (!isMountedRef.current) return;
      // Önce server settings'i uygula, yoksa localStorage'dakini kullan
      applyDocSettings(res.data.settings || localSettings);
      // Local backup varsa timestamp karşılaştır — hangisi daha yeniyse onu kullan
      const offlineDoc = localStorage.getItem(`zet_offline_doc_${docId}`);
      if (offlineDoc) {
        try {
          const local = JSON.parse(offlineDoc);
          const localSavedAt = local.savedAt || 0;
          const serverUpdatedAt = res.data.updated_at ? new Date(res.data.updated_at).getTime() : 0;
          if (localSavedAt > serverUpdatedAt) {
            // Bu cihazın kaydedilmemiş değişiklikleri daha yeni → server'a push et ve göster
            const localPages = (local.pages && local.pages.length > 0) ? local.pages : res.data.pages;
            await axios.put(`${API}/documents/${docId}`, { title: local.title || res.data.title, subtitle: local.subtitle || null, content: res.data.content, pages: localPages }, { withCredentials: true });
            if (!isMountedRef.current) return;
            localStorage.removeItem(`zet_offline_doc_${docId}`);
            setDocument({ ...res.data, pages: localPages });
            return;
          }
          // Server daha yeni (başka cihazdan kayıt var) → local'i sil, server'ı kullan
          localStorage.removeItem(`zet_offline_doc_${docId}`);
        } catch {
          localStorage.removeItem(`zet_offline_doc_${docId}`);
        }
      }
      setDocument(res.data);
    } catch {
      if (!isMountedRef.current) return;
      applyDocSettings(localSettings);
      // Try loading from offline cache
      const offlineDoc = localStorage.getItem(`zet_offline_doc_${docId}`);
      if (offlineDoc) {
        try { setDocument(JSON.parse(offlineDoc)); } catch { navigate('/dashboard'); }
      } else { navigate('/dashboard'); }
    }
  };

  const fetchCreditPackages = async () => {
    try {
      const res = await axios.get(`${API}/credits/packages`, { withCredentials: true });
      setCreditPackages(res.data.packages || []);
    } catch { /* ignore */ }
  };

  const handleBuyCredits = async (packageId) => {
    const pkg = creditPackages.find(p => p.id === packageId);
    if (!pkg) return;
    if (!window.confirm(`${pkg.credits} kredi satın almak istiyor musunuz?\nFiyat: $${pkg.discounted_price}`)) return;
    setBuyingCredits(true);
    try {
      const res = await axios.post(`${API}/credits/buy`, { package_id: packageId }, { withCredentials: true });
      if (res.data.needs_confirmation) {
        if (window.confirm(`${res.data.message}\n\nDevam etmek istiyor musunuz?`)) {
          const res2 = await axios.post(`${API}/credits/buy`, { package_id: packageId, confirm_overflow: true }, { withCredentials: true });
          alert(res2.data.message);
        }
      } else {
        alert(res.data.message);
      }
      setShowCreditModal(false);
      const res3 = await axios.get(`${API}/credits/balance`, { withCredentials: true });
      if (res3.data.credits_remaining !== undefined) setCreditsRemaining(res3.data.credits_remaining);
    } catch (err) {
      alert(err.response?.data?.detail || 'Satın alma başarısız');
    }
    setBuyingCredits(false);
  };

  async function uploadImagesToR2(pages) {
    let anyUploaded = false;
    const processed = await Promise.all(pages.map(async (page) => {
      const elements = await Promise.all((page.elements || []).map(async (el) => {
        if (el.type === 'image' && typeof el.src === 'string' && el.src.startsWith('data:')) {
          try {
            const res = await axios.post(`${API}/r2/upload`, { data: el.src }, { withCredentials: true });
            anyUploaded = true;
            return { ...el, src: res.data.url };
          } catch {
            return el;
          }
        }
        return el;
      }));
      return { ...page, elements };
    }));
    return { pages: processed, anyUploaded };
  }

  async function saveDocument(silent = false) {
    if (!document) return;
    if (!silent) setSaving(true);
    setSaveStatus('saving');
    let updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
    }
    if (navigator.onLine) {
      try {
        const { pages: r2Pages, anyUploaded } = await uploadImagesToR2(updatedPages);
        if (anyUploaded) {
          updatedPages = r2Pages;
          setCanvasElements(r2Pages[currentPage]?.elements || canvasElements);
        }
      } catch {}
    }
    const pagesToCache = userPlan !== 'free'
      ? updatedPages
      : updatedPages.map(p => ({ ...p, elements: [], drawPaths: [] }));
    try {
      localStorage.setItem(`zet_offline_doc_${docId}`, JSON.stringify({
        title: document.title, subtitle: document.subtitle || null,
        pages: pagesToCache, savedAt: Date.now(), pending_sync: true
      }));
    } catch {}
    if (!navigator.onLine) {
      setSaveStatus('unsaved');
      if (!silent) setSaving(false);
      return;
    }
    const docSettings = {
      marginLeft, marginRight, marginTop, marginBottom,
      pageBackground, currentFont, currentFontSize, currentColor,
      currentLineHeight, currentTextAlign, firstLineIndent,
      paragraphSpaceBefore, paragraphSpaceAfter,
      indentLeft, indentRight, indentTop, indentBottom,
      pageSize, screenplayMode, rulerVisible,
    };
    try {
      localStorage.setItem(`zet_doc_settings_${docId}`, JSON.stringify(docSettings));
    } catch {}
    try {
      await axios.put(`${API}/documents/${docId}`, { title: document.title, subtitle: document.subtitle || null, content: document.content, pages: updatedPages, settings: docSettings }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
      setSaveStatus('saved');
      localStorage.removeItem(`zet_offline_doc_${docId}`);
    } catch { setSaveStatus('error'); } finally { if (!silent) setSaving(false); }
  }
  saveDocumentRef.current = saveDocument;

  // === 30 SANİYEDE BİR OTOMATİK KAYIT (OneDrive tarzı) ===
  useEffect(() => {
    if (!docId || isReadOnly) return;
    if (autoSave30Ref.current) clearInterval(autoSave30Ref.current);
    autoSave30Ref.current = setInterval(() => {
      if (navigator.onLine) saveDocumentRef.current?.(true);
    }, 30000);
    return () => { if (autoSave30Ref.current) clearInterval(autoSave30Ref.current); };
  }, [docId, isReadOnly]);

  // === PAGE CHANGE (saves current page first) ===
  const changePage = useCallback((newPage) => {
    if (newPage === currentPage || !document?.pages) return;
    setDocument(prev => {
      if (!prev?.pages?.[currentPage]) return prev;
      const pages = [...prev.pages];
      pages[currentPage] = { ...pages[currentPage], elements: canvasElements, drawPaths, pageSize };
      return { ...prev, pages };
    });
    setCurrentPage(newPage);
  }, [canvasElements, currentPage, document, drawPaths, pageSize]);

  const addPage = () => {
    const newPage = { page_id: `page_${Date.now()}`, elements: [], drawPaths: [], pageSize };
    setDocument(prev => {
      const pages = [...(prev.pages || [])];
      // Save current page elements before adding new page
      if (pages[currentPage]) {
        pages[currentPage] = { ...pages[currentPage], elements: canvasElements, drawPaths, pageSize };
      }
      pages.push(newPage);
      setTimeout(() => setCurrentPage(pages.length - 1), 50);
      return { ...prev, pages };
    });
  };

  // === TEXT FLOW — carries overflow content to next page (or below an obstacle on same page) ===
  const handleTextFlow = useCallback(({ elementId, overflowHtml, el: srcEl, obstacleBottom, keepHtml }) => {
    const makeOverflowEl = (y) => ({
      id: `el_${Date.now()}`,
      type: 'text',
      x: srcEl.x || marginLeft,
      y,
      content: overflowHtml.replace(/<[^>]*>/g, ''),
      htmlContent: overflowHtml,
      fontSize: srcEl.fontSize || currentFontSize,
      fontFamily: srcEl.fontFamily || currentFont,
      color: srcEl.color || currentColor,
      width: srcEl.width || (pageSize.width - marginLeft - marginRight),
      lineHeight: srcEl.lineHeight || currentLineHeight,
      textAlign: srcEl.textAlign || 'left',
      bold: srcEl.bold, italic: srcEl.italic,
    });

    // If obstacle exists on current page and there's space below it, place on same page
    if (obstacleBottom != null) {
      const belowY = obstacleBottom + 12;
      const bottomLimit = pageSize.height - (marginBottom || 40) - 40;
      if (belowY < bottomLimit) {
        const overflowEl = makeOverflowEl(belowY);
        const updated = [...canvasElements, overflowEl];
        setCanvasElements(updated);
        handleSaveHistory(updated);
        return;
      }
    }

    // Otherwise flow to next page
    const nextPageIdx = currentPage + 1;
    const overflowEl = makeOverflowEl(marginTop);
    setDocument(prev => {
      if (!prev?.pages) return prev;
      const pages = [...prev.pages];
      if (pages[currentPage]) {
        const correctedElements = keepHtml && elementId
          ? canvasElements.map(e => e.id === elementId
              ? { ...e, htmlContent: keepHtml, content: keepHtml.replace(/<[^>]*>/g, '') }
              : e)
          : canvasElements;
        pages[currentPage] = { ...pages[currentPage], elements: correctedElements, drawPaths };
      }
      if (pages[nextPageIdx]) {
        pages[nextPageIdx] = { ...pages[nextPageIdx], elements: [overflowEl, ...(pages[nextPageIdx].elements || [])] };
      } else {
        pages.push({ page_id: `page_${Date.now()}`, elements: [overflowEl], drawPaths: [], pageSize });
      }
      return { ...prev, pages };
    });
    setTimeout(() => {
      setCurrentPage(nextPageIdx);
      setCanvasElements(prev => {
        const next = document?.pages?.[nextPageIdx]?.elements || [overflowEl];
        history.reset(next);
        return next;
      });
    }, 60);
  }, [currentPage, canvasElements, drawPaths, document, marginLeft, marginTop, marginRight, marginBottom, pageSize, currentFontSize, currentFont, currentColor, currentLineHeight, history, handleSaveHistory]); // eslint-disable-line

  // Screenplay mode — load Courier Prime font and open scene navigator on activation
  useEffect(() => {
    if (screenplayMode) { loadGoogleFont('Courier Prime'); setShowSceneNavigator(true); }
    else setShowSceneNavigator(false);
  }, [screenplayMode]); // eslint-disable-line

  // === SCREENPLAY HANDLERS ===
  const handleScriptElementChange = useCallback((elId, newType) => {
    const cfg = SCRIPT_ELEMENT_TYPES[newType];
    if (!cfg) return;
    const contentWidth = pageSize.width - marginLeft - marginRight;
    const indentPx = cfg.indentCm * SCREENPLAY_PX_PER_CM;
    const newX = marginLeft + indentPx;
    const newWidth = cfg.widthCm ? cfg.widthCm * SCREENPLAY_PX_PER_CM : contentWidth - indentPx;
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (el.id !== elId) return el;
        let content = el.content || '';
        let htmlContent = el.htmlContent || '';
        if (cfg.case === 'upper') {
          content = content.toUpperCase();
          htmlContent = htmlContent.replace(/>([^<]+)</g, (_, t) => `>${t.toUpperCase()}<`);
        }
        return { ...el, scriptElement: newType, x: newX, width: newWidth, textAlign: cfg.align, content, htmlContent };
      });
      handleSaveHistory(updated);
      return updated;
    });
  }, [pageSize, marginLeft, marginRight, handleSaveHistory]); // eslint-disable-line


  const handleUpdateSettings = (updates) => {
    if (updates.zetaMood !== undefined) setZetaMood(updates.zetaMood);
    if (updates.zetaEmoji !== undefined) setZetaEmoji(updates.zetaEmoji);
  };

  const handleZetaTakeNote = async (content) => {
    // Note already saved by RightPanel; this can trigger a UI refresh if needed
  };

  const applyZetaDocEdit = async (request, imageData = null) => {
    setZetaEditLoading(true);
    setZetaEditExplanation('');
    try {
      const isCEO = localStorage.getItem('zet_ceo_mode') === 'true';
      const allPagesPayload = (document.pages || []).map((p, i) => ({
        page_index: i,
        elements: i === currentPage
          ? canvasElements.filter(el => !el.isPending && !el.isPendingDelete)
          : (p.elements || []),
      }));
      const res = await axios.post(`${API}/zeta/document-edit`, {
        user_request: request,
        page_elements: canvasElements.filter(el => !el.isPending && !el.isPendingDelete),
        page_size: { width: pageSize.width, height: pageSize.height },
        page_index: currentPage,
        doc_id: docId,
        is_ceo: isCEO,
        all_pages: allPagesPayload,
        attached_image_b64: imageData?.base64 || null,
        attached_image_mime: imageData?.mimeType || null,
        doc_settings: {
          marginLeft, marginRight, marginTop, marginBottom,
          pageBackground, currentFont, currentFontSize, currentColor,
          currentLineHeight, currentTextAlign, pageSize,
          rulerVisible, gridVisible,
        },
      }, { withCredentials: true });
      const { operations = [], explanation = '', suggestions = [] } = res.data;
      setZetaEditExplanation(explanation);
      setZetaEditSuggestions(suggestions);
      setZetaEditInput('');
      const newPendingLog = [];

      // Handle delete_page / clear_page / add_page / update_settings first (structural ops)
      for (const op of operations) {
        const tPage = op.target_page ?? currentPage;
        if (op.action === 'delete_page') {
          deletePage(tPage);
        } else if (op.action === 'add_page') {
          addPage();
        } else if (op.action === 'update_settings') {
          const s = op.settings || {};
          if (s.marginLeft !== undefined) setMarginLeft(Number(s.marginLeft));
          if (s.marginRight !== undefined) setMarginRight(Number(s.marginRight));
          if (s.marginTop !== undefined) setMarginTop(Number(s.marginTop));
          if (s.marginBottom !== undefined) setMarginBottom(Number(s.marginBottom));
          if (s.pageBackground !== undefined) setPageBackground(s.pageBackground);
          if (s.currentFont !== undefined) setCurrentFont(s.currentFont);
          if (s.currentFontSize !== undefined) setCurrentFontSize(Number(s.currentFontSize));
          if (s.currentColor !== undefined) setCurrentColor(s.currentColor);
          if (s.currentLineHeight !== undefined) setCurrentLineHeight(Number(s.currentLineHeight));
          if (s.currentTextAlign !== undefined) setCurrentTextAlign(s.currentTextAlign);
          if (s.pageSize !== undefined) setPageSize(s.pageSize);
          if (s.gridVisible !== undefined) setGridVisible(Boolean(s.gridVisible));
          if (s.rulerVisible !== undefined) setRulerVisible(Boolean(s.rulerVisible));
        } else if (op.action === 'clear_page') {
          if (tPage === currentPage) {
            setCanvasElements([]);
            history.reset([]);
          } else {
            setDocument(prev => {
              const pages = [...(prev.pages || [])];
              if (pages[tPage]) pages[tPage] = { ...pages[tPage], elements: [] };
              return { ...prev, pages };
            });
          }
        } else if (op.action === 'generate_ai_image') {
          // Fire-and-forget: call generate-image API then add to canvas
          (async () => {
            try {
              const imgRes = await axios.post(`${API}/zeta/generate-image`, {
                prompt: op.prompt,
                aspect_ratio: '1:1',
                pro: false,
              }, { withCredentials: true });
              if (imgRes.data.images?.length > 0) {
                const imgData = imgRes.data.images[0];
                const src = `data:${imgData.mime_type || 'image/png'};base64,${imgData.data}`;
                const newEl = {
                  id: `el_${Date.now()}_${Math.random().toString(36).slice(2,6)}`,
                  type: 'image',
                  x: op.x ?? 60,
                  y: op.y ?? 60,
                  width: op.width ?? 300,
                  height: op.height ?? 240,
                  src,
                };
                const targetPage = op.target_page ?? currentPage;
                if (targetPage === currentPage) {
                  setCanvasElements(prev => [...prev, newEl]);
                } else {
                  setDocument(prev => {
                    const pages = [...(prev.pages || [])];
                    if (pages[targetPage]) pages[targetPage] = { ...pages[targetPage], elements: [...(pages[targetPage].elements || []), newEl] };
                    return { ...prev, pages };
                  });
                }
              }
            } catch (_) {}
          })();
        }
      }

      // Handle add_path operations (drawPaths, not canvasElements)
      const pathOpsForCurrentPage = operations.filter(op => op.action === 'add_path' && (op.target_page == null || op.target_page === currentPage));
      if (pathOpsForCurrentPage.length > 0) {
        setDrawPaths(prev => [...prev, ...pathOpsForCurrentPage.map(op => ({ ...op.path, id: `path_${Date.now()}_${Math.random().toString(36).slice(2,6)}` }))]);
      }
      // Handle operations targeting other pages
      const skipActions = new Set(['add_path', 'delete_page', 'clear_page', 'generate_ai_image', 'add_page', 'update_settings']);
      const otherPageOps = operations.filter(op => !skipActions.has(op.action) && op.target_page != null && op.target_page !== currentPage);
      if (otherPageOps.length > 0) {
        setDocument(prev => {
          const pages = [...(prev.pages || [])];
          for (const op of otherPageOps) {
            const pi = op.target_page;
            if (!pages[pi]) continue;
            let els = [...(pages[pi].elements || [])];
            if (op.action === 'add' && op.element) {
              if (op.element.type === 'chart' && op.element.chartMeta) { const g = generateChartSVG(op.element.chartMeta); op.element.svgContent = g.svg; op.element.src = g.imgSrc; op.element.width = op.element.width || g.width; op.element.height = op.element.height || g.height; }
              els.push(op.element);
            } else if (op.action === 'modify' && op.element_id) {
              els = els.map(el => el.id === op.element_id ? { ...el, ...op.changes } : el);
            } else if (op.action === 'delete' && op.element_id) {
              els = els.filter(el => el.id !== op.element_id);
            }
            pages[pi] = { ...pages[pi], elements: els };
          }
          return { ...prev, pages };
        });
      }
      const overflowEls = [];
      setCanvasElements(prev => {
        let els = [...prev];
        for (const op of operations) {
          if (skipActions.has(op.action)) continue;
          if (op.target_page != null && op.target_page !== currentPage) continue;
          if (op.action === 'add' && op.element && op.element.type === 'chart' && op.element.chartMeta) {
            const { svg, imgSrc, width, height } = generateChartSVG(op.element.chartMeta);
            op.element.svgContent = svg;
            op.element.src = imgSrc;
            op.element.width = op.element.width || width;
            op.element.height = op.element.height || height;
          }
          if (op.action === 'add' && op.element) {
            const el = { ...op.element, isPending: true };
            const ph = pageSize.height;
            const elH = el.height || (el.fontSize || 16) * 3;
            if ((el.y || 0) + elH > ph + 20) {
              // Element sayfa dışında — yeni sayfaya taşı (fire-and-forget sonrası)
              overflowEls.push(el);
            } else {
              els.push(el);
              newPendingLog.push({ action: 'add', elementId: el.id });
            }
          } else if (op.action === 'modify' && op.element_id && op.changes) {
            els = els.map(el => {
              if (el.id !== op.element_id) return el;
              newPendingLog.push({ action: 'modify', elementId: el.id, originalState: { ...el } });
              return { ...el, ...op.changes, isPending: true };
            });
          } else if (op.action === 'delete' && op.element_id) {
            const target = els.find(el => el.id === op.element_id);
            if (target) {
              newPendingLog.push({ action: 'delete', elementId: op.element_id, originalState: { ...target } });
              els = els.map(el => el.id === op.element_id ? { ...el, isPendingDelete: true } : el);
            }
          }
        }
        pendingOpsRef.current = newPendingLog;
        return els;
      });
      // Overflow elementlerini yeni sayfaya ekle
      if (overflowEls.length > 0) {
        const firstY = marginTop || 40;
        let curY = firstY;
        const newPageEls = overflowEls.map(el => {
          const placed = { ...el, y: curY, isPending: true };
          curY += (el.height || (el.fontSize || 16) * 3) + 12;
          return placed;
        });
        setDocument(prev => {
          const pages = [...(prev.pages || [])];
          const nextIdx = currentPage + 1;
          if (pages[nextIdx]) {
            pages[nextIdx] = { ...pages[nextIdx], elements: [...(pages[nextIdx].elements || []), ...newPageEls] };
          } else {
            pages.splice(nextIdx, 0, { page_id: `page_${Date.now()}`, elements: newPageEls, drawPaths: [], pageSize });
          }
          return { ...prev, pages };
        });
      }
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Bir hata oluştu';
      setZetaEditExplanation(`Hata: ${msg}`);
    } finally {
      setZetaEditLoading(false);
    }
  };

  const approveZetaOps = () => {
    setCanvasElements(prev => {
      const kept = prev
        .filter(el => !el.isPendingDelete)
        .map(el => {
          const { isPending, _pendingOriginal, ...rest } = el;
          return rest;
        });
      handleSaveHistory(kept);
      return kept;
    });
    pendingOpsRef.current = [];
    setZetaEditExplanation('');
  };

  const rejectZetaOps = () => {
    const log = pendingOpsRef.current;
    setCanvasElements(prev => {
      let els = prev
        .filter(el => !el.isPending)
        .map(el => { const { isPendingDelete, ...rest } = el; return rest; });
      for (const entry of log) {
        if (entry.action === 'modify' && entry.originalState) {
          els = els.map(el => el.id === entry.elementId ? { ...entry.originalState } : el);
        }
      }
      return els;
    });
    pendingOpsRef.current = [];
    setZetaEditExplanation('');
  };

  const handleInsertText = (content) => {
    if (!content) return;
    const el = {
      id: `el_${Date.now()}_zeta`,
      type: 'text',
      x: marginLeft || 40,
      y: marginTop || 40,
      content: content.replace(/\*\*(.*?)\*\*/g, '$1').trim(),
      fontSize: currentFontSize || DEFAULT_FONT_SIZE,
      fontFamily: currentFont || DEFAULT_FONT,
      color: currentColor || DEFAULT_COLOR,
      width: (pageSize?.width || 794) - (marginLeft || 40) - (marginRight || 40),
      lineHeight: 1.6,
      textAlign: 'left',
    };
    const updated = [...canvasElements, el];
    setCanvasElements(updated);
    handleSaveHistory(updated);
  };

  const handleAutoWriteContent = (pages, pageCount) => {
    if (!pages || pages.length === 0) return;
    const ml = marginLeft || 40;
    const mr = marginRight || 40;
    const mt = marginTop || 40;
    const makeEl = (content, idx) => ({
      id: `auto_${Date.now()}_${idx}`,
      type: 'text',
      x: ml, y: mt,
      content: content.replace(/\*\*(.*?)\*\*/g, '$1').trim(),
      fontFamily: 'Open Sans',
      fontSize: 11,
      color: '#222222',
      lineHeight: 1.6,
      width: pageSize.width - ml - mr,
    });

    // Save current canvas then insert all pages AFTER current page
    const insertAt = currentPage + 1;
    const newPages = pages.map((pageContent, idx) => ({
      page_id: `page_auto_${Date.now()}_${idx}`,
      elements: [makeEl(pageContent, idx)],
      drawPaths: [],
      pageSize,
    }));

    setDocument(prev => {
      if (!prev?.pages) return prev;
      const updatedPages = [...prev.pages];
      // Save current canvas first
      if (updatedPages[currentPage]) {
        updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
      }
      updatedPages.splice(insertAt, 0, ...newPages);
      return { ...prev, pages: updatedPages };
    });
    // Navigate after state update
    setTimeout(() => setCurrentPage(insertAt), 50);
  };

  const deletePage = (index) => {
    if (document.pages.length <= 1) return;
    setDocument(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    if (currentPage >= index && currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // === DELETE / CHANGE IMAGE ===
  const deleteSelected = () => {
    let updated;
    if (selectedElements.length > 0) { updated = canvasElements.filter(el => !selectedElements.includes(el.id)); setSelectedElements([]); }
    else if (selectedElement) { updated = canvasElements.filter(el => el.id !== selectedElement); setSelectedElement(null); }
    else return;
    setCanvasElements(updated); history.push(updated);
  };

  const deleteElement = useCallback((id) => {
    const updated = canvasElements.filter(el => el.id !== id);
    setCanvasElements(updated); history.push(updated); setSelectedElement(null);
  }, [canvasElements, history]);

  const handleChangeImage = useCallback((id) => {
    setChangeImageTarget(id); setShowImageUpload(true);
  }, []);

  const handleAddImageToShape = useCallback((id) => {
    setUploadForShape(id); setShowImageUpload(true);
  }, []);

  // AI image to shape/vector
  const handleAddAiImageToShape = useCallback((id) => {
    setAiTargetShape(id);
    setShowCreateImage(true);
  }, []);

  // === LOCKED TOOLS (based on plan) ===
  const FREE_ALLOWED_TOOLS = new Set(['select', 'text', 'hand', 'calculator']);
  const isFreeOffline = !isOnline && userPlan === 'free';

  const getLockedTools = () => {
    if (localStorage.getItem('zet_ceo_mode') === 'true') return [];
    // Free users offline: all tools locked — they can only type in existing text elements
    if (isFreeOffline) return TOOLS.map(t => t.id);
    if (userPlan === 'free') {
      return TOOLS.map(t => t.id).filter(id => !FREE_ALLOWED_TOOLS.has(id));
    }
    const locked = [];
    if (!planLimits.layers) locked.push('layers');
    if (!planLimits.signature) locked.push('signature');
    if (!planLimits.watermark) locked.push('watermark');
    if (!planLimits.page_color) locked.push('pagecolor');
    if (!planLimits.charts) locked.push('graphic');
    return locked;
  };

  const getToolLockReason = (toolId) => {
    if (userPlan === 'free') return 'Bu araç sadece aboneler içindir. Herhangi bir planla tüm araçlara erişin.';
    const names = { layers: 'Katmanlar', signature: 'Dijital İmza', watermark: 'Filigran', pagecolor: 'Sayfa Rengi', graphic: 'Grafikler' };
    return `${names[toolId] || toolId} aracı mevcut planınızda kullanılamaz. Lütfen planınızı yükseltin.`;
  };

  // === TOOL SELECT ===
  const handleToolSelect = (toolId) => {
    // Action-only tools: don't change activeTool state
    const actionTools = ['addpage', 'copy', 'importpdf', 'calculator'];
    if (!actionTools.includes(toolId)) {
      setActiveTool(toolId);
    }
    const _html = window.document.documentElement;
    if (_html) {
      ['tool-hand','tool-pen','tool-eraser','tool-text','tool-crosshair'].forEach(c => _html.classList.remove(c));
      if (toolId === 'hand') _html.classList.add('tool-hand');
      else if (toolId === 'pen') _html.classList.add('tool-pen');
      else if (toolId === 'eraser') _html.classList.add('tool-eraser');
      else if (toolId === 'text') _html.classList.add('tool-text');
      else if (['draw','marking','cut','redact','highlighter','zoom'].includes(toolId)) _html.classList.add('tool-crosshair');
    }
    const panels = {
      image: () => setShowImageUpload(true), pagesize: () => setShowPageSize(true),
      textsize: () => setShowTextSize(true), font: () => { setFontSearch(''); setShowFont(true); },
      voice: () => setShowVoice(true), color: () => setShowColor(true),
      draw: () => setShowDraw(true), createimage: () => setShowCreateImage(true),
      eraser: () => setShowEraser(true), translate: () => setShowTranslate(true),
      linespacing: () => setShowLineSpacing(true), wordtype: () => setShowWordType(true),
      marking: () => {}, addpage: () => addPage(),
      paragraph: () => setShowParagraph(true), graphic: () => setShowGraphic(true),
      pagecolor: () => setShowPageColor(true),
      table: () => setShowTable(true), layers: () => setShowLayers(true),
      ruler: () => { setRulerVisible(!rulerVisible); setShowRuler(true); },
      grid: () => { setGridVisible(!gridVisible); setShowGrid(true); },
      templates: () => setShowTemplates(true), qrcode: () => setShowQRCode(true),
      watermark: () => setShowWatermark(true), pagenumbers: () => setShowPageNumbers(true),
      headerfooter: () => setShowHeaderFooter(true), findreplace: () => setShowFindReplace(true),
      footnote: () => setShowFootnote(true), toc: () => setShowTOC(true),
      styles: () => setShowStyles(true),
      copy: () => copyElement(), 
      mirror: () => setShowMirror(true),
      voiceinput: () => setShowVoiceInput(true),
      export: () => setShowExport(true),
      shapes: () => setShowShapes(true),
      punctuation: () => setShowPunctuation(true),
      photoedit: () => setShowPhotoEdit(true),
      signature: () => setShowSignature(true),
      indent: () => setShowIndent(true),
      margins: () => setShowMargins(true),
      columns: () => setShowColumns(true),
      calculator: () => setShowCalculator(true),
      redact: () => applyRedaction(),
      highlighter: () => applyHighlight(),
      importpdf: () => pdfInputRef.current?.click(),
      bulletlist: () => setShowBulletList(p => !p),
      numberedlist: () => setShowNumberedList(p => !p),
      emoji: () => setShowEmoji(!showEmoji),
      zoom: () => setShowZoom(true),
      link: () => setShowLink(true),
    };
    if (panels[toolId]) panels[toolId]();
  };

  // === HIGHLIGHTER Tool (like Redact - applies to selected text) ===
  // Helper: wrap selected text with styled span using DOM Range API (reliable across HTML tags)
  const wrapSelection = useCallback((styleStr, attributes = {}) => {
    if (!savedSelectionRef.current) return false;
    const { elementId, range, editableDiv, isCollapsed, text } = savedSelectionRef.current;
    if (isCollapsed || !range || !elementId || !editableDiv) return false;
    if (!text || !text.trim()) return false;

    try {
      // Restore focus + selection
      editableDiv.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);

      const span = window.document.createElement('span');
      span.setAttribute('style', styleStr);
      Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));

      try {
        // Simple case: selection inside a single node
        range.surroundContents(span);
      } catch {
        // Complex case: selection spans multiple elements — extract & rewrap
        const fragment = range.extractContents();
        span.appendChild(fragment);
        range.insertNode(span);
      }

      const newHtml = editableDiv.innerHTML;
      sel.removeAllRanges();
      savedSelectionRef.current = null;

      setCanvasElements(prev => prev.map(e =>
        e.id === elementId
          ? { ...e, htmlContent: newHtml, content: newHtml.replace(/<[^>]*>/g, '') }
          : e
      ));
      return true;
    } catch (err) {
      console.warn('wrapSelection failed:', err);
      return false;
    }
  }, [setCanvasElements]);

  const applyHighlight = useCallback(() => {
    if (wrapSelection(`background:${highlighterColor};border-radius:2px;`, { 'data-highlight': 'true' })) return;
    alert('Lütfen önce işaretlemek istediğiniz metni seçin.');
  }, [highlighterColor, wrapSelection]);

  // === REDACT (Security) Tool ===
  const applyRedaction = useCallback(() => {
    if (!savedSelectionRef.current) { alert('Lütfen önce sansürlemek istediğiniz metni seçin.'); return; }
    const { elementId, range, editableDiv, isCollapsed, text } = savedSelectionRef.current;
    if (isCollapsed || !range || !elementId || !editableDiv || !text?.trim()) {
      alert('Lütfen önce sansürlemek istediğiniz metni seçin.'); return;
    }
    try {
      editableDiv.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      // Encode original text as base64 — not visible in DOM, restorable on demand
      const encoded = btoa(unescape(encodeURIComponent(text)));
      const span = window.document.createElement('span');
      span.setAttribute('data-redacted', 'true');
      span.setAttribute('data-original', encoded);
      // Visible as black censor bar; text itself is gone from DOM
      span.setAttribute('style', 'background:#111;color:transparent;-webkit-text-fill-color:transparent;border-radius:2px;user-select:none;');
      try { range.surroundContents(span); } catch { range.deleteContents(); range.insertNode(span); }
      const newHtml = editableDiv.innerHTML;
      sel.removeAllRanges();
      savedSelectionRef.current = null;
      setCanvasElements(prev => prev.map(e =>
        e.id === elementId ? { ...e, htmlContent: newHtml, content: newHtml.replace(/<[^>]*>/g, '') } : e
      ));
    } catch (err) {
      console.warn('applyRedaction failed:', err);
      alert('Lütfen önce sansürlemek istediğiniz metni seçin.');
    }
  }, [savedSelectionRef, setCanvasElements]);

  // === PHOTO EDIT ===
  // === BULLET/NUMBERED LIST ===
  // === EMOJI INSERT ===
  const insertEmoji = useCallback((emoji) => {
    const target = selectedElement || lastSelectedRef.current;
    if (target) {
      const el = canvasElements.find(e => e.id === target);
      if (el && el.type === 'text') {
        const newContent = (el.htmlContent || el.content || '') + emoji;
        const updated = canvasElements.map(e => e.id === target
          ? { ...e, htmlContent: newContent, content: newContent.replace(/<[^>]*>/g, '') }
          : e
        );
        setCanvasElements(updated);
        handleSaveHistory(updated);
        return;
      }
    }
    // No text element selected — emoji can only be inserted into existing text
  }, [selectedElement, canvasElements, handleSaveHistory]);

  const applyListFormat = useCallback((listType, styleType = null) => {
    const target = selectedElement || lastSelectedRef.current;
    const tag = listType === 'ol' ? 'ol' : 'ul';
    const style = styleType || (listType === 'ol' ? 'decimal' : 'disc');
    const listStyle = `style="margin:0;padding-left:28px;list-style-type:${style};"` ;

    // No text element selected — create a new one with a starter list
    if (!target) {
      const pageIdx = currentPage;
      const existingCount = canvasElements.filter(e => e.type === 'text').length;
      const newEl = {
        id: `el_${Date.now()}`, type: 'text',
        x: marginLeft ?? 40,
        y: (marginTop ?? 40) + existingCount * 40,
        htmlContent: `<${tag} ${listStyle}><li>Madde 1</li><li>Madde 2</li><li>Madde 3</li></${tag}>`,
        content: 'Madde 1\nMadde 2\nMadde 3',
        fontSize: currentFontSize, fontFamily: currentFont, color: currentColor,
        width: (pageSize?.width ?? 595) - ((marginLeft ?? 40) + (marginRight ?? 40)),
        lineHeight: currentLineHeight, textAlign: 'left',
        bold: false, italic: false, underline: false, strikethrough: false,
      };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated); handleSaveHistory(updated);
      setSelectedElement(newEl.id);
      return;
    }

    const el = canvasElements.find(e => e.id === target);
    if (!el || el.type !== 'text') return;
    const content = el.htmlContent || el.content || '';
    const hasExistingList = content.includes('<ul') || content.includes('<ol');
    let newHtml;
    if (hasExistingList) {
      newHtml = content
        .replace(/<\/?[uo]l[^>]*>/gi, '')
        .replace(/<li[^>]*>/gi, '')
        .replace(/<\/li>/gi, '\n')
        .replace(/\n+/g, '\n').trim();
    } else {
      const plainText = content.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '');
      const lines = plainText.split('\n').filter(l => l.trim());
      if (lines.length === 0) lines.push('Madde 1');
      newHtml = `<${tag} ${listStyle}>${lines.map(l => `<li>${l}</li>`).join('')}</${tag}>`;
    }
    const updated = canvasElements.map(e => e.id === target
      ? { ...e, htmlContent: newHtml, content: newHtml.replace(/<[^>]*>/g, '') }
      : e
    );
    setCanvasElements(updated);
    handleSaveHistory(updated);
  }, [selectedElement, canvasElements, handleSaveHistory, currentPage, currentFontSize, currentFont, currentColor, currentLineHeight, pageSize]);

  // === GROUP / UNGROUP ===
  const groupElements = useCallback(() => {
    if (selectedElements.length < 2) return;
    const groupId = `group_${Date.now()}`;
    const updated = canvasElements.map(el => 
      selectedElements.includes(el.id) ? { ...el, groupId } : el
    );
    setCanvasElements(updated);
    handleSaveHistory(updated);
  }, [selectedElements, canvasElements, handleSaveHistory]);

  const ungroupElements = useCallback(() => {
    if (!selectedElement && selectedElements.length === 0) return;
    const target = selectedElement || selectedElements[0];
    const el = canvasElements.find(e => e.id === target);
    if (!el?.groupId) return;
    const gid = el.groupId;
    const updated = canvasElements.map(e => e.groupId === gid ? { ...e, groupId: undefined } : e);
    setCanvasElements(updated);
    handleSaveHistory(updated);
  }, [selectedElement, selectedElements, canvasElements, handleSaveHistory]);

  const handlePhotoEditUpload = () => {
    const input = window.document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setPhotoEditImage(ev.target.result);
          setPhotoEditResult(null);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const executePhotoEdit = async () => {
    if (!photoEditImage || !photoEditPrompt.trim()) return;
    const cost = 15; // Standard photo edit cost
    if (creditsRemaining < cost) {
      setUpgradeReason(`Fotoğraf düzenleme ${cost} kredi gerektirir. Kalan: ${creditsRemaining} kredi.`);
      setShowUpgradeModal(true);
      return;
    }
    setPhotoEditLoading(true);
    try {
      const res = await axios.post(`${API}/zeta/photo-edit`, {
        image_data: photoEditImage,
        edit_prompt: photoEditPrompt,
        pro: false
      }, { withCredentials: true });
      if (res.data.images && res.data.images.length > 0) {
        setPhotoEditResult(`data:${res.data.images[0].mime_type};base64,${res.data.images[0].data}`);
      }
      if (res.data.credits_remaining !== undefined) {
        setCreditsRemaining(res.data.credits_remaining);
      }
    } catch (err) {
      console.error('Photo edit failed:', err);
      if (err.response?.status === 429) {
        setUpgradeReason(err.response.data?.detail || 'Yetersiz kredi!');
        setShowUpgradeModal(true);
      } else {
        alert('Fotoğraf düzenleme başarısız. Tekrar deneyin.');
      }
    } finally {
      setPhotoEditLoading(false);
    }
  };

  const addEditedPhotoToCanvas = () => {
    if (!photoEditResult) return;
    const newEl = {
      id: `el_${Date.now()}`,
      type: 'image',
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      src: photoEditResult
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    handleSaveHistory(updated);
    setShowPhotoEdit(false);
    setPhotoEditImage(null);
    setPhotoEditPrompt('');
    setPhotoEditResult(null);
  };

  // === TEXT ALIGNMENT ===
  const applyTextAlign = (align) => {
    setCurrentTextAlign(align);
    persistTextDefaults({ textAlign: align });
    const target = selectedElement || lastSelectedRef.current;
    if (target) {
      setCanvasElements(prev => {
        const updated = prev.map(el => el.id === target ? { ...el, textAlign: align } : el);
        handleSaveHistory(updated);
        return updated;
      });
    }
  };

  // === EXPORT PDF — gizli iframe + window.print() (popup yok, library yok) ===
  const exportToPDF = () => {
    const allPages = document?.pages || [{ elements: canvasElements, drawPaths }];
    const defSize = pageSize;
    const defBg = pageBackground || '#ffffff';

    let pagesHtml = '';
    allPages.forEach((page, idx) => {
      const els = idx === currentPage ? canvasElements : (page.elements || []);
      const pSize = page.pageSize || defSize;
      const bg = page.pageBackground || defBg;
      const wMm = (pSize.width * 0.264583).toFixed(2);
      const hMm = (pSize.height * 0.264583).toFixed(2);
      let inner = '';
      for (const el of [...els].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))) {
        if (el.type === 'text' && !el.isRedacted) {
          const s = [
            `position:absolute`,
            `left:${el.x}px`, `top:${el.y}px`,
            el.width ? `width:${el.width}px` : '',
            `font-size:${el.fontSize || 14}px`,
            `font-family:${el.fontFamily || 'Arial,sans-serif'}`,
            `color:${el.color || '#000'}`,
            `font-weight:${el.bold ? 'bold' : 'normal'}`,
            `font-style:${el.italic ? 'italic' : 'normal'}`,
            `text-decoration:${[el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none'}`,
            `line-height:${el.lineHeight || 1.5}`,
            `text-align:${el.textAlign || 'left'}`,
            `white-space:pre-wrap`, `word-break:break-word`,
          ].filter(Boolean).join(';');
          inner += `<div style="${s}">${el.htmlContent || (el.content || '').replace(/\n/g, '<br>')}</div>`;
        } else if (el.type === 'text' && el.isRedacted) {
          inner += `<div style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width || 200}px;height:${(el.fontSize || 14) * (el.lineHeight || 1.5) * Math.max(1, (el.content || '').split('\n').length)}px;background:#000"></div>`;
        } else if (el.type === 'image' && el.src) {
          inner += `<img src="${el.src}" style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width || 100}px;height:${el.height || 100}px;object-fit:contain" />`;
        }
      }
      if (screenplayMode && idx > 0) {
        inner += `<div style="position:absolute;top:${marginTop || 95}px;right:${marginRight || 95}px;font-family:'Courier Prime',monospace;font-size:12pt;color:#000">${idx + 1}.</div>`;
      }
      pagesHtml += `<div style="width:${pSize.width}px;height:${pSize.height}px;position:relative;background:${bg};overflow:hidden;page-break-after:always">${inner}</div>`;
    });

    const iframe = window.document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none';
    window.document.body.appendChild(iframe);

    const firstSize = allPages[0]?.pageSize || defSize;
    const pgW = (firstSize.width * 0.264583).toFixed(2);
    const pgH = (firstSize.height * 0.264583).toFixed(2);

    if (!iframe.contentDocument) {
      try { window.document.body.removeChild(iframe); } catch {}
      return;
    }
    iframe.contentDocument.open();
    const courierFontLink = screenplayMode
      ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">`
      : '';
    iframe.contentDocument.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${courierFontLink}
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#fff}
@media print{@page{size:${pgW}mm ${pgH}mm;margin:0}body{margin:0}}
</style></head><body>${pagesHtml}</body></html>`);
    iframe.contentDocument.close();

    const waitForImages = () => {
      const doc = iframe.contentDocument;
      if (!doc) return Promise.resolve();
      const imgs = Array.from(doc.images || []);
      if (imgs.length === 0) return Promise.resolve();
      return Promise.all(imgs.map((img) => {
        if (!img || img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.addEventListener('load', resolve, { once: true });
          img.addEventListener('error', resolve, { once: true });
        });
      }));
    };

    waitForImages().then(() => {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => { try { window.document.body.removeChild(iframe); } catch {} }, 2000);
    });

    setShowExport(false);
  };

  // Export to PNG/JPEG (all pages combined vertically)
  const exportToImage = async (format = 'png') => {
    if (!canvasContainerRef.current) return;
    setExporting(true);
    try {
      const scale = exportQuality === 'high' ? 3 : exportQuality === 'medium' ? 2 : 1;
      const pageElements = canvasContainerRef.current.querySelectorAll('[data-testid^="canvas-page-"]');
      const canvases = [];
      for (let i = 0; i < pageElements.length; i++) {
        const c = await html2canvas(pageElements[i], { scale, useCORS: true, backgroundColor: pageBackground });
        canvases.push(c);
      }
      if (canvases.length === 0) { return; }
      // Combine all pages vertically
      const totalWidth = Math.max(...canvases.map(c => c.width));
      const totalHeight = canvases.reduce((sum, c) => sum + c.height, 0);
      const combined = window.document.createElement('canvas');
      combined.width = totalWidth; combined.height = totalHeight;
      const ctx = combined.getContext('2d');
      let yOffset = 0;
      for (const c of canvases) { ctx.drawImage(c, 0, yOffset); yOffset += c.height; }
      const imgData = combined.toDataURL(`image/${format}`, format === 'jpeg' ? 0.92 : undefined);
      const link = window.document.createElement('a');
      link.download = `${document.title || 'document'}.${format}`;
      link.href = imgData;
      link.click();
    } catch (err) { console.error('Export failed:', err); } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  // Export to SVG (all pages)
  const exportToSVG = () => {
    const allPages = document.pages || [{ elements: canvasElements, drawPaths }];
    const pageH = pageSize.height;
    const totalH = allPages.length * pageH;
    let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageSize.width}" height="${totalH}" viewBox="0 0 ${pageSize.width} ${totalH}">`;
    allPages.forEach((page, pIdx) => {
      const yOff = pIdx * pageH;
      const els = pIdx === currentPage ? canvasElements : (page.elements || []);
      const paths = pIdx === currentPage ? drawPaths : (page.drawPaths || []);
      svgContent += `\n  <rect x="0" y="${yOff}" width="${pageSize.width}" height="${pageH}" fill="${pageBackground}"/>`;
      els.forEach(el => {
        if (el.type === 'text') {
          svgContent += `\n  <text x="${el.x}" y="${yOff + el.y + (el.fontSize || 16)}" font-family="${el.font || 'Arial'}" font-size="${el.fontSize || 16}" fill="${el.color || '#000'}" ${el.bold ? 'font-weight="bold"' : ''} ${el.italic ? 'font-style="italic"' : ''}>${(el.content || '').replace(/</g, '&lt;')}</text>`;
        } else if (el.type === 'shape') {
          if (el.shapeType === 'circle') svgContent += `\n  <circle cx="${el.x + el.width/2}" cy="${yOff + el.y + el.height/2}" r="${Math.min(el.width, el.height)/2}" fill="${el.fill || '#000'}"/>`;
          else if (el.shapeType === 'square') svgContent += `\n  <rect x="${el.x}" y="${yOff + el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || '#000'}"/>`;
          else if (el.shapeType === 'triangle') svgContent += `\n  <polygon points="${el.x + el.width/2},${yOff + el.y} ${el.x},${yOff + el.y + el.height} ${el.x + el.width},${yOff + el.y + el.height}" fill="${el.fill || '#000'}"/>`;
        } else if (el.type === 'image' && el.src) {
          svgContent += `\n  <image href="${el.src}" x="${el.x}" y="${yOff + el.y}" width="${el.width}" height="${el.height}"/>`;
        }
      });
      paths.forEach(p => {
        if (!p.points || p.points.length < 2) return;
        const d = p.points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${yOff + pt.y}`).join(' ');
        svgContent += `\n  <path d="${d}" stroke="${p.color || '#000'}" stroke-width="${p.size || 2}" fill="none" opacity="${(p.opacity || 100) / 100}"/>`;
      });
    });
    svgContent += '\n</svg>';
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.download = `${document.title || 'document'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Export to JSON (project file - all pages)
  const exportToJSON = () => {
    // Save current page state first
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
    }
    const projectData = {
      version: '1.0',
      title: document.title,
      pageSize,
      pageBackground,
      pages: updatedPages,
      createdAt: new Date().toISOString(),
      app: 'ZET Mindshare'
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.download = `${document.title || 'document'}.zet.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Export to .ms format
  const exportToMS = () => {
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
    }
    const docWithPages = { ...document, pages: updatedPages };
    const msDoc = convertToMSFormat(docWithPages, canvasElements, drawPaths, pageSize, pageBackground, userPlan);
    exportToMSFile(msDoc, document.title);
    setShowExport(false);
  };

  // Export to plain text
  const exportToTxt = () => {
    const updatedPages = [...(document?.pages || [])];
    if (updatedPages[currentPage]) updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements };
    const allPages = updatedPages.length ? updatedPages : [{ elements: canvasElements }];
    let text = '';
    allPages.forEach((page, pi) => {
      if (pi > 0) text += '\n\n' + '─'.repeat(40) + '\n\n';
      const els = (page.elements || []).filter(el => el.type === 'text').sort((a, b) => a.y - b.y || a.x - b.x);
      els.forEach(el => {
        const raw = (el.content || '').replace(/<[^>]*>/g, '').trim();
        if (raw) text += raw + '\n\n';
      });
    });
    const blob = new Blob([text.trim()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url; a.download = `${document?.title || 'document'}.txt`; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Export to HTML
  const exportToHtml = () => {
    const updatedPages = [...(document?.pages || [])];
    if (updatedPages[currentPage]) updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements };
    const allPages = updatedPages.length ? updatedPages : [{ elements: canvasElements }];
    const pw = pageSize.width || 794;
    const ph = pageSize.height || 1123;
    let pagesHtml = '';
    allPages.forEach((page) => {
      const els = (page.elements || []).sort((a, b) => a.y - b.y || a.x - b.x);
      let inner = '';
      els.forEach(el => {
        if (el.type === 'text') {
          const content = el.htmlContent || (el.content || '').replace(/\n/g, '<br>');
          const decorations = [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ');
          const s = [
            'position:absolute', `left:${el.x}px`, `top:${el.y}px`,
            el.width ? `width:${el.width}px` : '',
            `font-size:${el.fontSize || 14}px`,
            `font-family:${(el.fontFamily || el.font || 'Arial').replace(/"/g, "'")},sans-serif`,
            `color:${el.color || '#000000'}`,
            `line-height:${el.lineHeight || 1.5}`,
            `text-align:${el.textAlign || 'left'}`,
            el.bold ? 'font-weight:bold' : 'font-weight:normal',
            el.italic ? 'font-style:italic' : '',
            decorations ? `text-decoration:${decorations}` : '',
            el.highlightColor ? `background-color:${el.highlightColor}` : '',
          ].filter(Boolean).join(';');
          inner += `<div style="${s}">${content}</div>`;
        } else if (el.type === 'image' && el.src) {
          inner += `<img src="${el.src}" style="position:absolute;left:${el.x}px;top:${el.y}px;width:${el.width}px;height:${el.height}px;" />`;
        }
      });
      pagesHtml += `<div style="position:relative;width:${pw}px;min-height:${ph}px;background:${pageBackground || '#fff'};margin:0 auto 40px;box-shadow:0 2px 8px rgba(0,0,0,.15);">${inner}</div>`;
    });
    const title = (document?.title || 'document').replace(/</g, '&lt;');
    const html = `<!DOCTYPE html>\n<html lang="tr">\n<head>\n<meta charset="UTF-8">\n<title>${title}</title>\n<style>*{box-sizing:border-box;margin:0;padding:0}body{background:#f0f0f0;padding:40px 0}</style>\n</head>\n<body>${pagesHtml}</body>\n</html>`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url; a.download = `${document?.title || 'document'}.html`; a.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Export to DOCX
  const exportToDocx = async () => {
    setExporting(true);
    try {
      const updatedPages = [...(document?.pages || [])];
      if (updatedPages[currentPage]) updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements };
      const allPages = updatedPages.length ? updatedPages : [{ elements: canvasElements }];

      // px → twips (1 cm = 37.8 px, 1 cm = 567 twips)
      const px2tw = (px) => Math.round((px || 0) / 37.8 * 567);
      const pgW = px2tw(pageSize?.width || 794);
      const pgH = px2tw(pageSize?.height || 1123);
      const mtw = px2tw(marginTop || 75);
      const mbw = px2tw(marginBottom || 75);
      const mlw = px2tw(marginLeft || 75);
      const mrw = px2tw(marginRight || 75);

      const children = [];

      allPages.forEach((page, pi) => {
        if (pi > 0) children.push(new DocxParagraph({ pageBreakBefore: true, children: [] }));
        const els = (page.elements || []).sort((a, b) => a.y - b.y || a.x - b.x);
        els.forEach(el => {
          if (el.type === 'text') {
            // Use htmlContent (rich editor) when content is absent
            const rawText = el.htmlContent
              ? el.htmlContent.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '')
              : (el.content || '');
            if (!rawText.trim()) return;
            rawText.split('\n').forEach(line => {
              children.push(new DocxParagraph({
                alignment: el.textAlign === 'center' ? DocxAlignmentType.CENTER
                  : el.textAlign === 'right' ? DocxAlignmentType.RIGHT
                  : el.textAlign === 'justify' ? DocxAlignmentType.JUSTIFIED
                  : DocxAlignmentType.LEFT,
                spacing: { line: Math.round((el.lineHeight || 1.5) * 240) },
                children: [new DocxTextRun({
                  text: line || ' ',
                  bold: !!el.bold,
                  italics: !!el.italic,
                  underline: el.underline ? { type: DocxUnderlineType.SINGLE } : undefined,
                  strike: !!el.strikethrough,
                  size: Math.round((el.fontSize || 14) * 0.75 * 2),
                  font: el.fontFamily || el.font || 'Arial',
                  color: (el.color || '#000000').replace('#', ''),
                })],
              }));
            });
          } else if (el.type === 'image' && el.src && el.src.startsWith('data:')) {
            try {
              const mimeMatch = el.src.match(/^data:([^;]+);base64,/);
              if (!mimeMatch) return;
              const mime = mimeMatch[1];
              const imgType = (mime.includes('jpeg') || mime.includes('jpg')) ? 'jpg' : 'png';
              const base64 = el.src.split(',')[1];
              const bin = atob(base64);
              const bytes = new Uint8Array(bin.length);
              for (let b = 0; b < bin.length; b++) bytes[b] = bin.charCodeAt(b);
              children.push(new DocxParagraph({
                children: [new DocxImageRun({
                  data: bytes,
                  transformation: {
                    width: Math.round(el.width || 200),
                    height: Math.round(el.height || 200),
                  },
                  type: imgType,
                })],
              }));
            } catch {}
          }
        });
      });

      const docxDoc = new DocxDocument({
        sections: [{
          properties: {
            page: {
              size: { width: pgW, height: pgH },
              margin: { top: mtw, bottom: mbw, left: mlw, right: mrw },
            },
          },
          children,
        }],
      });
      const blob = await DocxPacker.toBlob(docxDoc);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url; a.download = `${document?.title || 'document'}.docx`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('DOCX export failed:', err); } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  // Export to ODT (OpenDocument Text)
  const exportToOdt = async () => {
    setExporting(true);
    try {
      const updatedPages = [...(document?.pages || [])];
      if (updatedPages[currentPage]) updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements };
      const allPages = updatedPages.length ? updatedPages : [{ elements: canvasElements }];

      // Build automatic styles for each unique text style
      const styleMap = new Map();
      allPages.forEach(page => {
        (page.elements || []).filter(el => el.type === 'text').forEach(el => {
          const key = `${el.fontSize}|${el.fontFamily}|${el.color}|${el.textAlign}|${el.lineHeight}|${el.bold}|${el.italic}|${el.underline}`;
          if (!styleMap.has(key)) styleMap.set(key, { id: `P${styleMap.size + 1}`, el });
        });
      });

      let autoStyles = '';
      styleMap.forEach(({ id, el }) => {
        const align = el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'end' : el.textAlign === 'justify' ? 'justify' : 'start';
        autoStyles += `<style:style style:name="${id}" style:family="paragraph"><style:paragraph-properties fo:text-align="${align}" fo:line-height="${Math.round((el.lineHeight || 1.5) * 100)}%"/><style:text-properties fo:font-size="${el.fontSize || 14}pt" fo:font-family="${(el.fontFamily || el.font || 'Arial').replace(/['"]/g, '')}" fo:color="${el.color || '#000000'}" ${el.bold ? 'fo:font-weight="bold"' : ''} ${el.italic ? 'fo:font-style="italic"' : ''} ${el.underline ? 'style:text-underline-style="solid" style:text-underline-width="auto" style:text-underline-color="font-color"' : ''}/></style:style>`;
      });

      let bodyContent = '';
      allPages.forEach((page, pi) => {
        if (pi > 0) bodyContent += '<text:p/>';
        const els = (page.elements || []).sort((a, b) => a.y - b.y || a.x - b.x);
        els.forEach(el => {
          if (el.type === 'text') {
            const key = `${el.fontSize}|${el.fontFamily}|${el.color}|${el.textAlign}|${el.lineHeight}|${el.bold}|${el.italic}|${el.underline}`;
            const styleId = styleMap.get(key)?.id || 'P1';
            const text = (el.content || '').replace(/<[^>]*>/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            text.split('\n').forEach(line => {
              bodyContent += `<text:p text:style-name="${styleId}">${line}</text:p>`;
            });
          }
        });
      });

      const contentXml = `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"><office:automatic-styles>${autoStyles}</office:automatic-styles><office:body><office:text>${bodyContent}</office:text></office:body></office:document-content>`;
      const stylesXml = `<?xml version="1.0" encoding="UTF-8"?><office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"><office:styles><style:default-style style:family="paragraph"><style:text-properties fo:font-family="Arial"/></style:default-style></office:styles></office:document-styles>`;
      const manifestXml = `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"><manifest:file-entry manifest:full-path="/" manifest:media-type="application/vnd.oasis.opendocument.text"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/></manifest:manifest>`;

      const zip = new JSZip();
      zip.file('mimetype', 'application/vnd.oasis.opendocument.text', { compression: 'STORE' });
      zip.file('content.xml', contentXml);
      zip.file('styles.xml', stylesXml);
      zip.folder('META-INF').file('manifest.xml', manifestXml);

      const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.oasis.opendocument.text' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url; a.download = `${document?.title || 'document'}.odt`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { console.error('ODT export failed:', err); } finally {
      setExporting(false);
      setShowExport(false);
    }
  };

  // Import .ms file
  const importFromMS = async (file) => {
    try {
      const msDoc = await importFromMSFile(file);
      const editorDoc = convertFromMSFormat(msDoc);
      if (editorDoc.title) setDocument(prev => ({ ...prev, title: editorDoc.title }));
      if (editorDoc.pages && editorDoc.pages.length > 0) {
        setDocument(prev => ({ ...prev, pages: editorDoc.pages }));
        const firstPage = editorDoc.pages[0];
        setCurrentPage(0);
        setCanvasElements(firstPage.elements || []);
        setDrawPaths(firstPage.drawPaths || []);
        history.reset(firstPage.elements || []);
      }
      if (editorDoc.watermark) setDocument(prev => ({ ...prev, watermark: editorDoc.watermark }));
      setShowExport(false);
    } catch (err) {
      console.error('MS import failed:', err);
      alert(err.message || '.ms dosyasi iceri aktarilamadi');
    }
  };


  // Import JSON project
  const importFromJSON = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.canvasElements) setCanvasElements(data.canvasElements);
        if (data.drawPaths) setDrawPaths(data.drawPaths);
        if (data.pageBackground) setPageBackground(data.pageBackground);
        if (data.title) setDocument(prev => ({ ...prev, title: data.title }));
      } catch (err) { console.error('Import failed:', err); alert('Invalid project file'); }
    };
    reader.readAsText(file);
  };

  const PDF_PAGE_LIMITS = { free: 20, plus: 50, pro: 100, creative_station: Infinity };

  // Import PDF
  const importPDF = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) { alert('Lütfen bir PDF dosyası seçin'); return; }
    setPdfImporting(true);
    try {
      // Client-side PDF extraction via pdfjs-dist — no backend needed
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const { OPS, Util, ImageKind } = pdfjsLib;
      const MAX_IMG_DIM = 1600;
      const t = Date.now();

      const ml = marginLeft || 40, mr = marginRight || 40, mt = marginTop || 40;
      const textWidth = pageSize.width - ml - mr;

      const escapePdfHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      // Map PDF font name to a web-safe font family
      const resolvePdfFont = (fontName) => {
        if (!fontName) return 'Arial';
        const fn = fontName.toLowerCase();
        if (fn.includes('courier')) return 'Courier New';
        if (fn.includes('times')) return 'Times New Roman';
        if (fn.includes('helvetica') || fn.includes('arial')) return 'Arial';
        if (fn.includes('calibri')) return 'Calibri';
        if (fn.includes('georgia')) return 'Georgia';
        return 'Arial';
      };

      // Bir XObject resmini page.objs'tan PNG/JPEG data URL'e çevirir (boyutu sınırlar)
      const decodeImageObj = async (page, objId) => {
        const imgData = await new Promise((resolve) => {
          let settled = false;
          const timer = setTimeout(() => { if (!settled) { settled = true; resolve(null); } }, 2500);
          try {
            page.objs.get(objId, (data) => {
              if (!settled) { settled = true; clearTimeout(timer); resolve(data); }
            });
          } catch { if (!settled) { settled = true; clearTimeout(timer); resolve(null); } }
        });
        if (!imgData || !imgData.width || !imgData.height) return null;

        const srcCanvas = window.document.createElement('canvas');
        srcCanvas.width = imgData.width;
        srcCanvas.height = imgData.height;
        const sctx = srcCanvas.getContext('2d');
        if (imgData.bitmap) {
          sctx.drawImage(imgData.bitmap, 0, 0);
        } else if (imgData.data) {
          const out = sctx.createImageData(imgData.width, imgData.height);
          const src = imgData.data;
          if (imgData.kind === ImageKind.RGBA_32BPP || src.length === imgData.width * imgData.height * 4) {
            out.data.set(src);
          } else if (imgData.kind === ImageKind.RGB_24BPP || src.length === imgData.width * imgData.height * 3) {
            for (let p = 0, q = 0; p < src.length; p += 3, q += 4) {
              out.data[q] = src[p]; out.data[q + 1] = src[p + 1]; out.data[q + 2] = src[p + 2]; out.data[q + 3] = 255;
            }
          } else {
            return null;
          }
          sctx.putImageData(out, 0, 0);
        } else {
          return null;
        }

        let outW = imgData.width;
        let outH = imgData.height;
        if (outW > MAX_IMG_DIM || outH > MAX_IMG_DIM) {
          const ratio = Math.min(MAX_IMG_DIM / outW, MAX_IMG_DIM / outH);
          outW = Math.round(outW * ratio);
          outH = Math.round(outH * ratio);
        }
        const outCanvas = window.document.createElement('canvas');
        outCanvas.width = outW;
        outCanvas.height = outH;
        outCanvas.getContext('2d').drawImage(srcCanvas, 0, 0, outW, outH);
        return outCanvas.toDataURL('image/jpeg', 0.85);
      };

      const pageLimit = PDF_PAGE_LIMITS[userPlan] ?? 20;
      const numPages = Math.min(pdf.numPages, pageLimit);
      if (pdf.numPages > pageLimit) {
        const planLabel = userPlan === 'creative_station' ? 'Creative Station' : userPlan === 'pro' ? 'Pro' : userPlan === 'plus' ? 'Plus' : 'Free';
        alert(`${pdf.numPages} sayfalık PDF, ${planLabel} planı için ${pageLimit} sayfa limitini aşıyor.\nİlk ${pageLimit} sayfa aktarılacak.`);
      }

      const pdfPages = [];
      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1 });
          const renderScale = Math.min(pageSize.width / viewport.width, pageSize.height / viewport.height);
          const pageHeightPts = viewport.height;

          const content = await page.getTextContent();

          // Metni satır satır işle — her satırın font ailesi, punto boyutu ve x konumu (girinti) korunur
          const pdfLines = [];
          let curLine = null;
          for (const item of content.items) {
            if (!('str' in item)) continue;
            const x = item.transform[4];
            const y = item.transform[5];
            const sizePts = Math.hypot(item.transform[2], item.transform[3]) || 10;
            const fName = content.styles?.[item.fontName]?.fontFamily || item.fontName || null;
            if (!curLine || Math.abs(y - curLine.y) > 2) {
              curLine = { text: '', x, y, sizePts, fontName: fName };
              pdfLines.push(curLine);
            }
            curLine.text += item.str;
            if (item.hasEOL && curLine.text && !curLine.text.endsWith(' ')) curLine.text += ' ';
          }
          const nonEmptyLines = pdfLines.map(l => ({ ...l, text: l.text.trim() })).filter(l => l.text);
          const text = nonEmptyLines.map(l => l.text).join('\n');

          const fontName = nonEmptyLines[0]?.fontName || null;
          const fontSizePts = nonEmptyLines.length ? nonEmptyLines[0].sizePts : 0;

          // PDF satır aralığını hesapla: ardışık satırlar arasındaki y farkının font boyutuna oranı
          let pdfLineHeight = 1.4;
          if (nonEmptyLines.length >= 2) {
            const gaps = [];
            for (let li = 1; li < nonEmptyLines.length; li++) {
              const dy = Math.abs(nonEmptyLines[li].y - nonEmptyLines[li - 1].y);
              const sz = nonEmptyLines[li - 1].sizePts || 10;
              if (dy > 0 && dy < sz * 4) gaps.push(dy / sz);
            }
            if (gaps.length) {
              gaps.sort((a, b) => a - b);
              const mid = Math.floor(gaps.length / 2);
              pdfLineHeight = Math.max(1, Math.min(3, gaps[mid]));
            }
          }

          // Satır satır stilli HTML — font ailesi, punto, girinti (x farkı) ve paragraf boşluğu korunur
          const baseX = nonEmptyLines.length ? Math.min(...nonEmptyLines.map(l => l.x)) : 0;
          let prevLine = null;
          let richHtml = '';
          for (const line of nonEmptyLines) {
            const sizePx = Math.max(8, Math.round(line.sizePts * renderScale));
            const indentPx = Math.max(0, Math.round((line.x - baseX) * renderScale));
            const fam = resolvePdfFont(line.fontName);
            const gap = prevLine ? Math.abs(line.y - prevLine.y) : 0;
            const isNewParagraph = prevLine && gap > line.sizePts * 1.6;
            const marginTop = isNewParagraph ? Math.round(sizePx * 0.6) : 0;
            richHtml += `<div style="font-family:'${fam}';font-size:${sizePx}px;margin:${marginTop}px 0 0 ${indentPx}px">${escapePdfHtml(line.text)}</div>`;
            prevLine = line;
          }

          // Sayfadaki gömülü resimleri (XObject) konumlarıyla birlikte tespit et
          const opList = await page.getOperatorList();
          let curMatrix = [1, 0, 0, 1, 0, 0];
          const matrixStack = [];
          const foundImages = [];
          for (let k = 0; k < opList.fnArray.length; k++) {
            const fn = opList.fnArray[k];
            const args = opList.argsArray[k];
            if (fn === OPS.save) {
              matrixStack.push(curMatrix);
            } else if (fn === OPS.restore) {
              curMatrix = matrixStack.pop() || [1, 0, 0, 1, 0, 0];
            } else if (fn === OPS.transform) {
              curMatrix = Util.transform(curMatrix, args);
            } else if (fn === OPS.paintImageXObject && typeof args[0] === 'string') {
              foundImages.push({ objId: args[0], matrix: curMatrix });
            }
          }

          const images = [];
          for (let imgIdx = 0; imgIdx < foundImages.length; imgIdx++) {
            const { objId, matrix: m } = foundImages[imgIdx];
            try {
              const dataUrl = await decodeImageObj(page, objId);
              if (!dataUrl) continue;
              const corners = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([x, y]) => [
                m[0] * x + m[2] * y + m[4],
                m[1] * x + m[3] * y + m[5],
              ]);
              const xs = corners.map(c => c[0]);
              const ys = corners.map(c => c[1]);
              const minX = Math.min(...xs), maxX = Math.max(...xs);
              const minY = Math.min(...ys), maxY = Math.max(...ys);
              images.push({
                x: Math.round(minX * renderScale),
                y: Math.round((pageHeightPts - maxY) * renderScale),
                width: Math.max(1, Math.round((maxX - minX) * renderScale)),
                height: Math.max(1, Math.round((maxY - minY) * renderScale)),
                src: dataUrl,
              });
            } catch (imgErr) {
              console.warn(`PDF page ${i} image ${imgIdx} extraction failed:`, imgErr);
            }
          }

          pdfPages.push({ page_num: i, text, html: richHtml, font_name: fontName, font_size_pts: fontSizePts, line_height: pdfLineHeight, render_scale: renderScale, images });
        } catch (pageErr) {
          console.warn(`PDF page ${i} extraction failed:`, pageErr);
          pdfPages.push({ page_num: i, text: '', html: '', font_name: null, font_size_pts: 0, render_scale: 1, images: [] });
        }
      }

      if (pdfPages.length === 0 || pdfPages.every(p => !p.text && p.images.length === 0)) { alert('PDF içerik bulunamadı veya sadece görsel içeriyor.'); return; }

      const makeElements = (pg, idx) => {
        const els = pg.images.map((img, ii) => ({
          id: `el_pdf_${t}_${idx}_img${ii}`,
          type: 'image',
          x: img.x, y: img.y, width: img.width, height: img.height,
          src: img.src,
        }));
        if (pg.text) {
          const fontSize = pg.font_size_pts > 0 ? Math.max(8, Math.round(pg.font_size_pts * pg.render_scale)) : 12;
          els.push({
            id: `el_pdf_${t}_${idx}`,
            type: 'text',
            x: ml, y: mt,
            content: pg.text,
            htmlContent: pg.html || pg.text.replace(/\n/g, '<br>'),
            fontSize,
            fontFamily: resolvePdfFont(pg.font_name),
            color: '#000000',
            width: textWidth,
            lineHeight: Math.round((pg.line_height || 1.4) * 10) / 10,
            textAlign: 'left', bold: false, italic: false, underline: false,
          });
        }
        return els;
      };

      // First PDF page → appended to current canvas page
      const firstEls = makeElements(pdfPages[0], 0);
      const updatedCurrentElements = [...canvasElements, ...firstEls];

      // Remaining PDF pages → new canvas pages inserted after current page
      const newCanvasPages = pdfPages.slice(1).map((pg, i) => ({
        page_id: `page_pdf_${t}_${i + 1}`,
        elements: makeElements(pg, i + 1),
        drawPaths: [],
        pageSize,
      }));

      setDocument(prev => {
        if (!prev?.pages) return prev;
        const pages = [...prev.pages];
        pages[currentPage] = { ...pages[currentPage], elements: updatedCurrentElements, drawPaths };
        pages.splice(currentPage + 1, 0, ...newCanvasPages);
        return { ...prev, pages };
      });

      // Reset so [document, currentPage] effect re-syncs canvasElements from the updated document
      lastLoadedPageRef.current = null;
      setCanvasElements(updatedCurrentElements);
      handleSaveHistory(updatedCurrentElements);
      alert(`PDF içe aktarıldı — ${pdfPages.length} sayfa düzenlenebilir metin olarak eklendi.`);
    } catch (err) {
      console.error('PDF import failed:', err);
      alert('PDF içe aktarma başarısız: ' + (err.response?.data?.detail || err.message));
    } finally {
      setPdfImporting(false);
    }
  };

  // Export handler
  const _fireExport = (format) => {
    if (format === 'pdf') exportToPDF();
    else if (format === 'png') exportToImage('png');
    else if (format === 'jpeg') exportToImage('jpeg');
    else if (format === 'svg') exportToSVG();
    else if (format === 'json') exportToJSON();
    else if (format === 'ms') exportToMS();
    else if (format === 'txt') exportToTxt();
    else if (format === 'html') exportToHtml();
    else if (format === 'docx') exportToDocx();
    else if (format === 'odt') exportToOdt();
  };

  useEffect(() => {
    if (!exportCountdown) return;
    if (exportCountdown.remaining <= 0) {
      const fmt = exportCountdown.format;
      setExportCountdown(null);
      _fireExport(fmt);
      return;
    }
    const t = setTimeout(() => {
      setExportCountdown(prev => prev ? { ...prev, remaining: prev.remaining - 1 } : null);
    }, 1000);
    return () => clearTimeout(t);
  }, [exportCountdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = (format) => {
    setExportFormat(format);
    const delay = (userPlan === 'pro' || userPlan === 'creative_station') ? 0
                : userPlan === 'plus' ? 40
                : 60;
    if (delay === 0) {
      _fireExport(format);
    } else {
      setExportCountdown({ format, totalDelay: delay, remaining: delay });
    }
  };

  // === GRAPHIC CHART ===
  const createChart = () => {
    const labels = chartLabels.split(',').map(l => l.trim()).filter(Boolean);
    const rawData = chartData.split(',').map(d => parseFloat(d.trim()));
    const data = rawData.map(d => isNaN(d) ? 0 : d);
    
    if (labels.length === 0 || data.length === 0) { alert('Lütfen en az bir etiket ve veri girin'); return; }
    // Ensure data length matches labels
    while (data.length < labels.length) data.push(0);
    
    const width = 420, height = 320;
    const pad = { top: 40, right: 20, bottom: 45, left: 50 };
    const cw = width - pad.left - pad.right;
    const ch = height - pad.top - pad.bottom;
    const maxVal = Math.max(...data, 1);
    
    // Gradient defs
    let defs = '<defs>';
    if (gradientStart && gradientEnd) {
      data.forEach((_, i) => {
        defs += `<linearGradient id="cg${i}" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="${gradientStart}"/><stop offset="100%" stop-color="${gradientEnd}"/></linearGradient>`;
      });
    }
    defs += '</defs>';
    
    const fill = (i) => gradientStart && gradientEnd ? `url(#cg${i})` : chartColors[i % chartColors.length];
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="font-family:Arial,sans-serif">`;
    svg += `<rect width="${width}" height="${height}" fill="white" rx="8"/>`;
    svg += defs;
    if (chartImage) svg += `<image href="${chartImage}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.2"/>`;
    svg += `<text x="${width/2}" y="24" text-anchor="middle" font-size="14" font-weight="600" fill="#1a1a2e">${chartTitle.replace(/</g, '&lt;')}</text>`;
    
    if (chartType === 'bar') {
      // Y-axis
      svg += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + ch}" stroke="#e5e7eb" stroke-width="1"/>`;
      // X-axis
      svg += `<line x1="${pad.left}" y1="${pad.top + ch}" x2="${pad.left + cw}" y2="${pad.top + ch}" stroke="#e5e7eb" stroke-width="1"/>`;
      // Grid lines
      for (let g = 0; g <= 4; g++) {
        const gy = pad.top + ch - (g / 4) * ch;
        const gv = Math.round((maxVal * g) / 4);
        svg += `<line x1="${pad.left}" y1="${gy}" x2="${pad.left + cw}" y2="${gy}" stroke="#f3f4f6" stroke-width="0.5"/>`;
        svg += `<text x="${pad.left - 6}" y="${gy + 4}" text-anchor="end" font-size="9" fill="#9ca3af">${gv}</text>`;
      }
      const gap = 8;
      const bw = Math.max(10, (cw - gap * (labels.length + 1)) / labels.length);
      labels.forEach((label, i) => {
        const bh = Math.max(2, (data[i] / maxVal) * ch);
        const x = pad.left + gap + i * (bw + gap);
        const y = pad.top + ch - bh;
        svg += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${fill(i)}" rx="3"><animate attributeName="height" from="0" to="${bh}" dur="0.4s"/><animate attributeName="y" from="${pad.top + ch}" to="${y}" dur="0.4s"/></rect>`;
        svg += `<text x="${x + bw/2}" y="${y - 4}" text-anchor="middle" font-size="9" fill="#374151" font-weight="500">${data[i]}</text>`;
        svg += `<text x="${x + bw/2}" y="${pad.top + ch + 14}" text-anchor="middle" font-size="9" fill="#6b7280">${label.length > 8 ? label.slice(0, 8) + '..' : label}</text>`;
      });
    } else if (chartType === 'pie') {
      const total = data.reduce((a, b) => a + b, 0) || 1;
      const cx = width / 2, cy = height / 2 + 10, r = Math.min(cw, ch) / 2 - 20;
      let sa = -Math.PI / 2;
      labels.forEach((label, i) => {
        const angle = (data[i] / total) * Math.PI * 2;
        if (angle < 0.001) { sa += angle; return; }
        const ea = sa + angle;
        const x1 = cx + r * Math.cos(sa), y1 = cy + r * Math.sin(sa);
        const x2 = cx + r * Math.cos(ea), y2 = cy + r * Math.sin(ea);
        const la = angle > Math.PI ? 1 : 0;
        const delay = (i * 0.09).toFixed(2);
        svg += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${la} 1 ${x2},${y2} Z" fill="${fill(i)}" stroke="white" stroke-width="2" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.35s" begin="${delay}s" fill="freeze"/></path>`;
        const mid = sa + angle / 2;
        const lx = cx + (r * 0.65) * Math.cos(mid);
        const ly = cy + (r * 0.65) * Math.sin(mid);
        const pct = Math.round((data[i] / total) * 100);
        if (pct >= 5) svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="9" fill="white" font-weight="600" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.25s" begin="${(i * 0.09 + 0.3).toFixed(2)}s" fill="freeze"/></text>`;
        sa = ea;
      });
      // Legend
      const lgX = 10, lgY = height - 18;
      labels.forEach((label, i) => {
        const lx = lgX + i * Math.min(90, width / labels.length);
        svg += `<rect x="${lx}" y="${lgY}" width="8" height="8" fill="${fill(i)}" rx="2"/>`;
        svg += `<text x="${lx + 12}" y="${lgY + 8}" font-size="8" fill="#6b7280">${label.length > 8 ? label.slice(0, 8) + '..' : label}</text>`;
      });
    } else if (chartType === 'line') {
      // Axes
      svg += `<line x1="${pad.left}" y1="${pad.top}" x2="${pad.left}" y2="${pad.top + ch}" stroke="#e5e7eb" stroke-width="1"/>`;
      svg += `<line x1="${pad.left}" y1="${pad.top + ch}" x2="${pad.left + cw}" y2="${pad.top + ch}" stroke="#e5e7eb" stroke-width="1"/>`;
      // Grid
      for (let g = 0; g <= 4; g++) {
        const gy = pad.top + ch - (g / 4) * ch;
        const gv = Math.round((maxVal * g) / 4);
        svg += `<line x1="${pad.left}" y1="${gy}" x2="${pad.left + cw}" y2="${gy}" stroke="#f3f4f6" stroke-width="0.5"/>`;
        svg += `<text x="${pad.left - 6}" y="${gy + 4}" text-anchor="end" font-size="9" fill="#9ca3af">${gv}</text>`;
      }
      const sp = cw / Math.max(1, labels.length - 1);
      const lc = gradientStart || chartColors[0];
      // Area fill
      let area = `M${pad.left},${pad.top + ch}`;
      let line = '';
      labels.forEach((label, i) => {
        const x = pad.left + i * sp;
        const y = pad.top + ch - (data[i] / maxVal) * ch;
        line += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        area += `L${x},${y}`;
        svg += `<text x="${x}" y="${pad.top + ch + 14}" text-anchor="middle" font-size="9" fill="#6b7280">${label.length > 8 ? label.slice(0, 8) + '..' : label}</text>`;
      });
      area += `L${pad.left + (labels.length - 1) * sp},${pad.top + ch}Z`;
      svg += `<path d="${area}" fill="${lc}" opacity="0"><animate attributeName="opacity" from="0" to="0.1" dur="0.4s" begin="0.7s" fill="freeze"/></path>`;
      svg += `<path d="${line}" stroke="${lc}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="10000" stroke-dashoffset="10000"><animate attributeName="stroke-dashoffset" from="10000" to="0" dur="0.8s" fill="freeze"/></path>`;
      labels.forEach((label, i) => {
        const x = pad.left + i * sp;
        const y = pad.top + ch - (data[i] / maxVal) * ch;
        const delay = (0.4 + i * 0.06).toFixed(2);
        svg += `<circle cx="${x}" cy="${y}" r="0" fill="white" stroke="${lc}" stroke-width="2"><animate attributeName="r" from="0" to="4" dur="0.25s" begin="${delay}s" fill="freeze"/></circle>`;
        svg += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#374151" font-weight="500" opacity="0"><animate attributeName="opacity" from="0" to="1" dur="0.2s" begin="${delay}s" fill="freeze"/></text>`;
      });
    }
    
    svg += '</svg>';
    const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const chartMeta = { type: chartType, labels: chartLabels, data: chartData, title: chartTitle, colors: [...chartColors], gradientStart: gradientStart || null, gradientEnd: gradientEnd || null, chartImage: chartImage || null };
    if (editingChartId) {
      const updated = canvasElements.map(el => el.id === editingChartId ? { ...el, src: imgSrc, svgContent: svg, chartMeta } : el);
      setCanvasElements(updated); history.push(updated);
      setEditingChartId(null);
    } else {
      const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'chart', x: 50, y: 50, width, height, src: imgSrc, svgContent: svg, chartMeta }];
      setCanvasElements(updated); history.push(updated);
    }
    setShowGraphic(false);

    try { const a = new Audio('/sounds/chart-create.wav'); a.volume = 0.5; a.play().catch(() => {}); } catch (_) {}
  };

  // === UPDATE SHORTCUT ===
  const updateShortcut = (key) => {
    if (!editingShortcut) return;
    const newShortcuts = { ...shortcuts };
    // Remove old key for this tool
    Object.keys(newShortcuts).forEach(k => { if (newShortcuts[k] === editingShortcut) delete newShortcuts[k]; });
    // Add new key
    if (key) newShortcuts[key.toUpperCase()] = editingShortcut;
    setShortcuts(newShortcuts);
    savePreference('zet_shortcuts', JSON.stringify(newShortcuts));
    setEditingShortcut(null);
  };

  // === TABLE CREATION ===
  const createTable = () => {
    const cellWidth = 80;
    const cellHeight = 30;
    const tableWidth = tableCols * cellWidth;
    const tableHeight = tableRows * cellHeight;
    
    // Create editable table data
    const tableData = Array.from({ length: tableRows }, () => 
      Array.from({ length: tableCols }, () => '')
    );
    
    const updated = [...canvasElements, { 
      id: `el_${Date.now()}`, type: 'table', x: 50, y: 50, 
      width: tableWidth, height: tableHeight, 
      rows: tableRows, cols: tableCols, tableData,
      cellWidth, cellHeight
    }];
    setCanvasElements(updated); history.push(updated);
    setShowTable(false);
  };

  // === QR CODE GENERATION ===
  const createQRCode = async () => {
    if (!qrText.trim()) return;
    try {
      const qrDataUrl = await QRCode.toDataURL(qrText, { width: 200, margin: 2 });
      const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'image', x: 50, y: 50, width: 200, height: 200, src: qrDataUrl }];
      setCanvasElements(updated); history.push(updated);
      setShowQRCode(false);
      setQrText('');
    } catch (err) { console.error('QR generation failed:', err); }
  };

  // === LINK ===
  const addLinkToCanvas = () => {
    if (!linkUrl.trim()) return;
    const url = /^https?:\/\//i.test(linkUrl) ? linkUrl : `https://${linkUrl}`;
    const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'link', x: 60, y: 60, width: 220, height: 24, url, text: linkText.trim() || url }];
    setCanvasElements(updated);
    history.push(updated);
    setShowLink(false);
    setLinkUrl('');
    setLinkText('');
  };

  // === WATERMARK ===
  const applyWatermark = () => {
    if (!watermarkText.trim()) return;
    const wm = { id: `wm_${Date.now()}`, type: 'watermark', text: watermarkText, opacity: watermarkOpacity, color: watermarkColor };
    setDocument(prev => ({ ...prev, watermark: wm }));
    setShowWatermark(false);
  };

  // === PAGE NUMBERS ===
  const togglePageNumbers = () => {
    const newEnabled = !pageNumbersEnabled;
    setPageNumbersEnabled(newEnabled);
    setDocument(prev => ({ ...prev, pageNumbers: { enabled: newEnabled, position: pageNumberPosition, format: pageNumberFormat, style: pageNumberStyle, start: pageNumberStart } }));
  };
  const updatePageNumberSettings = useCallback((updates) => {
    setDocument(prev => ({ ...prev, pageNumbers: { enabled: pageNumbersEnabled, position: pageNumberPosition, format: pageNumberFormat, style: pageNumberStyle, start: pageNumberStart, ...updates } }));
  }, [pageNumbersEnabled, pageNumberPosition, pageNumberFormat, pageNumberStyle, pageNumberStart]);

  // === TEMPLATES ===
  const applyTemplate = (templateId) => {
    let elements = [];
    const n = Date.now();
    const W = 595, date = new Date().toLocaleDateString('tr-TR');
    const t = (id, x, y, content, opts = {}) => ({
      id: `el_${n}_${id}`, type: 'text', x, y, content, width: opts.w || (W - x - 40),
      font: opts.f || 'Inter', fontSize: opts.s || 11, color: opts.c || '#1e293b',
      bold: !!opts.bold, italic: !!opts.italic, textAlign: opts.a || 'left',
      lineHeight: opts.lh || 1.5,
    });
    const s = (id, x, y, w, h, fill, opts = {}) => ({
      id: `el_${n}_${id}`, type: 'shape', x, y, width: w, height: h,
      shapeType: opts.shape || 'square', fill: fill || 'transparent',
      stroke: opts.stroke, strokeWidth: opts.sw,
    });

    if (templateId === 'cv') {
      elements = [
        s('L', 0, 0, 165, 842, '#0f172a'),
        s('La', 0, 0, 4, 842, '#4ca8ad'),
        t('1', 12, 38, 'AD SOYAD', { f:'Montserrat', s:17, c:'#ffffff', bold:true, w:145 }),
        t('2', 12, 62, 'Yazılım Geliştirici', { f:'Inter', s:10, c:'#4ca8ad', w:145 }),
        t('3', 12, 105, 'İLETİŞİM', { f:'Montserrat', s:7, c:'#94a3b8', bold:true, w:145 }),
        t('4', 12, 120, 'email@example.com\n+90 555 000 00 00\nİstanbul, Türkiye\nlinkedin.com/in/adsoyadı', { f:'Inter', s:9, c:'#cbd5e1', w:145, lh:1.7 }),
        t('5', 12, 210, 'BECERİLER', { f:'Montserrat', s:7, c:'#94a3b8', bold:true, w:145 }),
        t('6', 12, 226, 'JavaScript / TypeScript\nReact · Vue.js · Node.js\nPython · PostgreSQL\nDocker · Kubernetes\nREST API · GraphQL', { f:'Inter', s:9, c:'#94a3b8', w:145, lh:1.75 }),
        t('7', 12, 340, 'DİLLER', { f:'Montserrat', s:7, c:'#94a3b8', bold:true, w:145 }),
        t('8', 12, 356, 'Türkçe — Anadil\nİngilizce — İleri (C1)\nAlmanca — Orta (B1)', { f:'Inter', s:9, c:'#94a3b8', w:145, lh:1.75 }),
        t('9', 12, 440, 'EĞİTİM', { f:'Montserrat', s:7, c:'#94a3b8', bold:true, w:145 }),
        t('10', 12, 456, 'Bilgisayar Müh. — BSc\nÜniversite Adı\n2015 – 2019', { f:'Inter', s:9, c:'#94a3b8', w:145, lh:1.65 }),
        t('11', 180, 38, 'DENEYİM', { f:'Montserrat', s:8, c:'#4ca8ad', bold:true, w:375 }),
        s('d1', 180, 53, 375, 1, '#e2e8f0'),
        t('12', 180, 63, 'Kıdemli Yazılım Geliştirici', { f:'Inter', s:12, c:'#1e293b', bold:true, w:260 }),
        t('13', 180, 81, 'Şirket Adı • İstanbul', { f:'Inter', s:10, c:'#475569', w:220 }),
        t('14', 400, 81, '2022 – Günümüz', { f:'Inter', s:9, c:'#94a3b8', w:155, a:'right' }),
        t('15', 180, 97, '• Mikro-servis mimarisi ile ölçeklenebilir sistemler geliştirdi\n• 8 kişilik ekibin teknik liderliğini üstlendi, sprint verimliliğini %35 artırdı\n• CI/CD pipeline kurulumunu tamamlayarak deployment süresini %60 kısalttı', { f:'Inter', s:10, c:'#475569', w:375, lh:1.65 }),
        s('d2', 180, 165, 375, 1, '#e2e8f0'),
        t('16', 180, 175, 'Yazılım Geliştirici', { f:'Inter', s:12, c:'#1e293b', bold:true, w:260 }),
        t('17', 180, 193, 'Önceki Şirket • Ankara', { f:'Inter', s:10, c:'#475569', w:220 }),
        t('18', 400, 193, '2019 – 2022', { f:'Inter', s:9, c:'#94a3b8', w:155, a:'right' }),
        t('19', 180, 209, '• Frontend ve backend geliştirme süreçlerinde aktif rol aldı\n• PostgreSQL veritabanı optimizasyonuyla sorgu sürelerini %50 azalttı', { f:'Inter', s:10, c:'#475569', w:375, lh:1.65 }),
        s('d3', 180, 257, 375, 1, '#e2e8f0'),
        t('20', 180, 267, 'PROJELER', { f:'Montserrat', s:8, c:'#4ca8ad', bold:true, w:375 }),
        t('21', 180, 283, 'Proje Adı — React, Node.js, MongoDB', { f:'Inter', s:11, c:'#1e293b', bold:true, w:375 }),
        t('22', 180, 299, 'Kısa açıklama: ne yaptı, ne başardı, teknoloji tercihleri.', { f:'Inter', s:10, c:'#475569', w:375, lh:1.6 }),
        s('d4', 180, 330, 375, 1, '#e2e8f0'),
        t('23', 180, 340, 'SERTİFİKALAR', { f:'Montserrat', s:8, c:'#4ca8ad', bold:true, w:375 }),
        t('24', 180, 356, '• AWS Certified Solutions Architect (2023)\n• Google Cloud Professional Data Engineer (2022)\n• Certified Scrum Master — Scrum Alliance (2021)', { f:'Inter', s:10, c:'#475569', w:375, lh:1.7 }),
        s('d5', 180, 415, 375, 1, '#e2e8f0'),
        t('25', 180, 425, 'REFERANSLAR', { f:'Montserrat', s:8, c:'#94a3b8', bold:true, w:375 }),
        t('26', 180, 441, 'İstek üzerine verilecektir.', { f:'Inter', s:10, c:'#94a3b8', w:375, italic:true }),
      ];
    } else if (templateId === 'cover-letter') {
      elements = [
        s('h', 0, 0, 595, 110, '#0f172a'),
        s('ha', 0, 0, 4, 110, '#4ca8ad'),
        t('1', 40, 28, 'Ad Soyad', { f:'Montserrat', s:22, c:'#ffffff', bold:true, w:350 }),
        t('2', 40, 56, 'Pozisyon • Sektör', { f:'Inter', s:11, c:'#4ca8ad', w:300 }),
        t('3', 40, 76, 'email@example.com  •  +90 555 000 00 00  •  İstanbul', { f:'Inter', s:9, c:'#94a3b8', w:450 }),
        t('4', 400, 130, date, { f:'Inter', s:10, c:'#94a3b8', w:155, a:'right' }),
        t('5', 40, 148, 'İlgili Kişi Adı\nİnsan Kaynakları Müdürü\nŞirket Adı\nŞehir, Ülke', { f:'Inter', s:10, c:'#475569', w:300, lh:1.6 }),
        s('d1', 40, 220, 515, 1, '#e2e8f0'),
        t('6', 40, 232, 'Konu: [Pozisyon Adı] Başvurusu', { f:'Inter', s:11, c:'#1e293b', bold:true, w:515 }),
        s('d2', 40, 250, 515, 1, '#e2e8f0'),
        t('7', 40, 264, 'Sayın İlgili Kişi,', { f:'Inter', s:11, c:'#1e293b', w:515 }),
        t('8', 40, 290, '[Şirket Adı] bünyesindeki [Pozisyon] fırsatını büyük bir ilgiyle inceledim. [X] yıllık deneyimim ve [anahtar beceri/teknoloji] alanındaki uzmanlığımın bu role önemli katkılar sunacağına inanıyorum.\n\nKariyerim boyunca [önemli başarı 1] ve [önemli başarı 2] gibi sonuçlar elde ettim. Özellikle [ilgili beceri], takımlarla iş birliği yapma ve sonuç odaklı çalışma konusundaki yetkinliğim, [Şirket Adı]\'nın [hedefi/misyonu] ile örtüşmektedir.\n\n[Şirket Adı]\'nın [dikkat çekici özellik — ürün, kültür, büyüme] beni bu pozisyona motive eden başlıca unsurlardandır. Katkılarımı detaylı biçimde paylaşmak için bir görüşme fırsatı talep ediyorum.', { f:'Inter', s:11, c:'#475569', w:515, lh:1.8 }),
        t('9', 40, 590, 'Saygılarımla,', { f:'Inter', s:11, c:'#1e293b', w:515 }),
        t('10', 40, 638, 'Ad Soyad\nPozisyon', { f:'Inter', s:11, c:'#475569', w:300, lh:1.6 }),
        s('sig', 40, 612, 140, 1, '#94a3b8'),
      ];
    } else if (templateId === 'report') {
      elements = [
        s('top', 0, 0, 595, 7, '#4ca8ad'),
        t('1', 40, 28, 'KURUMSAL RAPOR', { f:'Montserrat', s:30, c:'#0f172a', bold:true, w:400 }),
        t('2', 40, 70, date, { f:'Inter', s:10, c:'#64748b', w:200 }),
        t('3', 400, 30, 'ZET', { f:'Montserrat', s:12, c:'#4ca8ad', bold:true, w:155, a:'right' }),
        s('d1', 40, 90, 515, 1, '#e2e8f0'),
        t('4', 40, 106, 'YÖNETİCİ ÖZETİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('5', 40, 122, 'Bu rapor, performans göstergelerini, önemli başarıları ve stratejik yönelimi kapsamlı biçimde sunmaktadır. Tüm birimlerde tutarlı büyüme ve operasyonel mükemmellik gözlemlenmiştir.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        t('6', 40, 198, 'TEMEL METRİKLER', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        s('m1', 40, 216, 155, 70, '#f0fdfa'),
        t('m1a', 118, 230, '+28%', { f:'Montserrat', s:20, c:'#0d9488', bold:true, a:'center', w:155 }),
        t('m1b', 40, 258, 'Gelir Artışı', { f:'Inter', s:9, c:'#64748b', a:'center', w:155 }),
        s('m2', 205, 216, 155, 70, '#eff6ff'),
        t('m2a', 283, 230, '94%', { f:'Montserrat', s:20, c:'#2563eb', bold:true, a:'center', w:155 }),
        t('m2b', 205, 258, 'Müşteri Memnuniyeti', { f:'Inter', s:9, c:'#64748b', a:'center', w:155 }),
        s('m3', 370, 216, 155, 70, '#fdf4ff'),
        t('m3a', 448, 230, '3 Yeni', { f:'Montserrat', s:20, c:'#7c3aed', bold:true, a:'center', w:155 }),
        t('m3b', 370, 258, 'Pazar', { f:'Inter', s:9, c:'#64748b', a:'center', w:155 }),
        s('d2', 40, 302, 515, 1, '#e2e8f0'),
        t('7', 40, 316, 'ÖNEMLİ BULGULAR', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('8', 40, 332, '→ Gelirler yeni pazar genişlemesiyle %28 arttı\n→ 5 yenilikçi ürün piyasaya sürüldü — ilk ayda 40 bin kullanıcı\n→ Tüm segmentlerde %94 müşteri memnuniyeti skoru\n→ Süreç otomasyonuyla operasyonel maliyetler %15 düştü', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d3', 40, 438, 515, 1, '#e2e8f0'),
        t('9', 40, 452, 'GÖRÜNÜM', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('10', 40, 468, 'Dijital dönüşüm ve yetenek geliştirme yatırımlarıyla sürdürülebilir büyüme konumlandırması devam etmektedir. Stratejik yol haritası önümüzdeki mali yıl için %35 büyüme hedeflemektedir.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('ft', 0, 822, 595, 20, '#0f172a'),
        t('ft1', 297, 828, 'Gizli  •  ZET İş Belgeleri', { f:'Inter', s:8, c:'#94a3b8', a:'center' }),
      ];
    } else if (templateId === 'proposal') {
      elements = [
        s('h', 0, 0, 595, 175, '#0f172a'), s('ha', 0, 0, 6, 175, '#4ca8ad'),
        t('1', 40, 40, 'ZET', { f:'Montserrat', s:11, c:'#4ca8ad', bold:true, w:515 }),
        t('2', 40, 60, 'PROJE TEKLİFİ', { f:'Montserrat', s:34, c:'#ffffff', bold:true, w:515 }),
        t('3', 40, 105, 'Şirket / Müşteri Adı', { f:'Inter', s:14, c:'#94a3b8', w:350 }),
        t('4', 40, 127, date, { f:'Inter', s:11, c:'#64748b', w:200 }),
        t('5', 450, 127, 'Gizli', { f:'Montserrat', s:9, c:'#ef4444', bold:true, w:105, a:'right' }),
        t('6', 40, 195, 'YÖNETİCİ ÖZETİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('7', 40, 212, 'Bu teklif, projenin kapsamını, hedeflerini, zaman çizelgesini ve bütçesini detaylı olarak özetlemektedir. Müşteriye sağlanacak değer ve başarı kriterleri aşağıda belirtilmiştir.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d1', 40, 278, 515, 1, '#e2e8f0'),
        t('8', 40, 291, 'PROJE KAPSAMI', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('9', 40, 308, '→  Hedef 1: Kullanıcı deneyimini %40 iyileştirme\n→  Hedef 2: Sistem entegrasyonlarını tamamlama\n→  Hedef 3: Canlıya geçiş ve destek süreci', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d2', 40, 382, 515, 1, '#e2e8f0'),
        t('10', 40, 395, 'ZAMAN ÇİZELGESİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        s('f1', 40, 413, 80, 24, '#e0f2fe'), t('f1a', 80, 421, 'Faz 1 — 2H', { f:'Inter', s:9, c:'#0369a1', w:80, a:'center' }),
        s('f2', 130, 413, 120, 24, '#f0fdf4'), t('f2a', 190, 421, 'Faz 2 — 6H', { f:'Inter', s:9, c:'#15803d', w:120, a:'center' }),
        s('f3', 260, 413, 100, 24, '#fdf4ff'), t('f3a', 310, 421, 'Faz 3 — 2H', { f:'Inter', s:9, c:'#7c3aed', w:100, a:'center' }),
        s('d3', 40, 455, 515, 1, '#e2e8f0'),
        t('11', 40, 468, 'BÜTÇE', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('12', 40, 486, 'Planlama & Tasarım: ₺XX,XXX\nGeliştirme: ₺XX,XXX\nTest & Lansman: ₺XX,XXX', { f:'Inter', s:11, c:'#334155', lh:1.7 }),
        s('d4', 40, 550, 515, 1, '#e2e8f0'),
        t('13', 40, 563, 'TOPLAM PROJE MALİYETİ', { f:'Montserrat', s:11, c:'#0f172a', bold:true, w:300 }),
        t('14', 380, 563, '₺XX,XXX', { f:'Montserrat', s:18, c:'#4ca8ad', bold:true, w:175 }),
        s('ft', 0, 822, 595, 20, '#0f172a'),
        t('ft1', 297, 828, 'Gizli  •  ZET Documents', { f:'Inter', s:8, c:'#94a3b8', a:'center' }),
      ];
    } else if (templateId === 'invoice') {
      elements = [
        s('top', 0, 0, 595, 5, '#4ca8ad'),
        t('1', 40, 22, 'FATURA', { f:'Montserrat', s:32, c:'#0f172a', bold:true, w:250 }),
        t('2', 40, 64, 'ZET', { f:'Montserrat', s:11, c:'#4ca8ad', bold:true, w:200 }),
        t('3', 390, 22, `#FAT-${Date.now().toString().slice(-4)}`, { f:'Montserrat', s:14, c:'#4ca8ad', bold:true, w:165, a:'right' }),
        t('4', 390, 44, `Tarih: ${date}`, { f:'Inter', s:10, c:'#64748b', w:165, a:'right' }),
        t('5', 390, 58, 'Vade: 30 gün', { f:'Inter', s:10, c:'#64748b', w:165, a:'right' }),
        s('d1', 40, 84, 515, 1, '#e2e8f0'),
        t('6', 40, 97, 'KİMDEN', { f:'Montserrat', s:8, c:'#64748b', bold:true, w:240 }),
        t('7', 40, 112, 'Şirket Adınız\nAdres, İstanbul 34000\n+90 212 000 00 00', { f:'Inter', s:10, c:'#334155', lh:1.6, w:240 }),
        t('8', 310, 97, 'KİME', { f:'Montserrat', s:8, c:'#64748b', bold:true, w:245 }),
        t('9', 310, 112, 'Müşteri Adı\nMüşteri Adresi\nŞehir, Ülke', { f:'Inter', s:10, c:'#334155', lh:1.6, w:245 }),
        s('hdr', 40, 177, 515, 24, '#0f172a'),
        t('h1', 48, 185, 'HİZMET / ÜRÜN', { f:'Montserrat', s:9, c:'#e2e8f0', bold:true, w:280 }),
        t('h2', 340, 185, 'ADET', { f:'Montserrat', s:9, c:'#e2e8f0', bold:true, w:55 }),
        t('h3', 400, 185, 'BİRİM', { f:'Montserrat', s:9, c:'#e2e8f0', bold:true, w:80 }),
        t('h4', 490, 185, 'TOPLAM', { f:'Montserrat', s:9, c:'#e2e8f0', bold:true, w:65 }),
        t('r1a', 48, 214, 'Hizmet / Ürün 1', { f:'Inter', s:10, c:'#334155', w:280 }),
        t('r1b', 340, 214, '2', { f:'Inter', s:10, c:'#334155', w:55 }),
        t('r1c', 400, 214, '₺2.500', { f:'Inter', s:10, c:'#334155', w:80 }),
        t('r1d', 490, 214, '₺5.000', { f:'Inter', s:10, c:'#334155', w:65 }),
        s('dl1', 40, 230, 515, 1, '#f1f5f9'),
        t('r2a', 48, 242, 'Hizmet / Ürün 2', { f:'Inter', s:10, c:'#334155', w:280 }),
        t('r2b', 340, 242, '1', { f:'Inter', s:10, c:'#334155', w:55 }),
        t('r2c', 400, 242, '₺1.000', { f:'Inter', s:10, c:'#334155', w:80 }),
        t('r2d', 490, 242, '₺1.000', { f:'Inter', s:10, c:'#334155', w:65 }),
        s('dl2', 40, 260, 515, 1, '#e2e8f0'),
        t('sub', 400, 275, 'Ara Toplam:', { f:'Inter', s:10, c:'#64748b', w:85 }),
        t('sub2', 490, 275, '₺6.000', { f:'Inter', s:10, c:'#334155', w:65 }),
        t('vat', 400, 292, 'KDV (%20):', { f:'Inter', s:10, c:'#64748b', w:85 }),
        t('vat2', 490, 292, '₺1.200', { f:'Inter', s:10, c:'#334155', w:65 }),
        s('tot', 390, 309, 165, 28, '#0f172a'),
        t('totl', 400, 318, 'TOPLAM', { f:'Montserrat', s:9, c:'#e2e8f0', bold:true, w:85 }),
        t('totv', 490, 318, '₺7.200', { f:'Montserrat', s:11, c:'#4ca8ad', bold:true, w:65 }),
        t('pb', 40, 370, 'ÖDEME BİLGİLERİ', { f:'Montserrat', s:9, c:'#64748b', bold:true }),
        t('pb2', 40, 386, 'Banka: [Banka Adı]\nIBAN: TR00 0000 0000 0000 0000 00\nHesap Sahibi: Şirket Adı', { f:'Inter', s:10, c:'#334155', lh:1.7 }),
        s('ft', 0, 822, 595, 20, '#4ca8ad'),
        t('ft1', 297, 828, 'Teşekkür ederiz  •  ZET Documents', { f:'Inter', s:8, c:'#ffffff', a:'center' }),
      ];
    } else if (templateId === 'meeting') {
      elements = [
        s('top', 40, 65, 515, 2, '#4ca8ad'),
        t('1', 40, 30, 'TOPLANTI NOTLARI', { f:'Montserrat', s:26, c:'#1e293b', bold:true }),
        t('2', 40, 82, `Tarih: ${date}`, { f:'Inter', s:10, c:'#64748b', w:200 }),
        t('3', 300, 82, 'Saat: 14:00 – 15:30', { f:'Inter', s:10, c:'#64748b', w:255 }),
        t('4', 40, 98, 'Konum: [Oda / Online]', { f:'Inter', s:10, c:'#64748b' }),
        t('5', 40, 122, 'KATILIMCILAR', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('6', 40, 138, '• Ad Soyad — Pozisyon\n• Ad Soyad — Pozisyon\n• Ad Soyad — Pozisyon', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('d1', 40, 205, 515, 1, '#e2e8f0'),
        t('7', 40, 218, 'GÜNDEM', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('8', 40, 234, '1. Proje durumu gözden geçirme\n2. Önümüzdeki hafta hedefleri\n3. Açık konular ve sorunlar\n4. Diğer', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('d2', 40, 320, 515, 1, '#e2e8f0'),
        t('9', 40, 333, 'KARARLAR', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('10', 40, 350, '◉  \n◉  \n◉  ', { f:'Inter', s:11, c:'#334155', lh:1.9 }),
        s('d3', 40, 420, 515, 1, '#e2e8f0'),
        t('11', 40, 433, 'AKSİYON MADDELERİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        s('ah', 40, 450, 515, 22, '#f8fafc'),
        t('ah1', 42, 458, 'GÖREV', { f:'Montserrat', s:8, c:'#64748b', bold:true, w:220 }),
        t('ah2', 270, 458, 'SORUMLU', { f:'Montserrat', s:8, c:'#64748b', bold:true, w:155 }),
        t('ah3', 430, 458, 'TARİH', { f:'Montserrat', s:8, c:'#64748b', bold:true, w:125 }),
        t('12', 40, 484, '1. \n2. \n3. ', { f:'Inter', s:11, c:'#334155', lh:2.0 }),
      ];
    } else if (templateId === 'projectplan') {
      elements = [
        s('top', 0, 0, 595, 6, '#3b82f6'),
        t('1', 40, 22, 'PROJE PLANI', { f:'Montserrat', s:28, c:'#1e293b', bold:true }),
        t('2', 40, 60, 'Proje Adı: [Proje Adı]', { f:'Inter', s:13, c:'#334155' }),
        t('3', 40, 80, `Başlangıç: ${date}  |  Bitiş: [Tarih]  |  Yönetici: [İsim]`, { f:'Inter', s:10, c:'#64748b' }),
        s('d1', 40, 102, 515, 1, '#e2e8f0'),
        t('4', 40, 115, 'PROJE HEDEFLERİ', { f:'Montserrat', s:9, c:'#3b82f6', bold:true }),
        t('5', 40, 131, '1. Ana hedef...\n2. İkincil hedef...\n3. Başarı kriteri...', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        s('d2', 40, 205, 515, 1, '#e2e8f0'),
        t('6', 40, 218, 'KİLOMETRE TAŞLARI', { f:'Montserrat', s:9, c:'#3b82f6', bold:true }),
        t('7', 40, 234, '✓ Faz 1: Planlama (Hafta 1–2)\n○ Faz 2: Tasarım (Hafta 3–4)\n○ Faz 3: Geliştirme (Hafta 5–8)\n○ Faz 4: Test (Hafta 9–10)\n○ Faz 5: Lansman (Hafta 11–12)', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('d3', 40, 360, 515, 1, '#e2e8f0'),
        t('8', 40, 373, 'RİSKLER & ÇÖZÜMLER', { f:'Montserrat', s:9, c:'#3b82f6', bold:true }),
        t('9', 40, 389, '• Risk: [Tanım]  →  Çözüm: [Eylem]\n• Risk: [Tanım]  →  Çözüm: [Eylem]', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('d4', 40, 440, 515, 1, '#e2e8f0'),
        t('10', 40, 453, 'BÜTÇE & KAYNAKLAR', { f:'Montserrat', s:9, c:'#3b82f6', bold:true }),
        t('11', 40, 469, 'Toplam Bütçe: ₺XX,XXX\nEkip: [N] kişi  |  Araç/Altyapı: [Listele]', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
      ];
    } else if (templateId === 'okr') {
      elements = [
        s('top', 0, 0, 595, 7, '#6366f1'),
        t('1', 40, 28, 'OKR', { f:'Montserrat', s:34, c:'#1e293b', bold:true, w:250 }),
        t('2', 40, 72, 'Hedefler & Anahtar Sonuçlar', { f:'Inter', s:13, c:'#6366f1' }),
        t('3', 40, 92, `${date}  •  Q[ ] ${new Date().getFullYear()}`, { f:'Inter', s:10, c:'#94a3b8' }),
        s('d1', 40, 112, 515, 1, '#e2e8f0'),
        t('4', 40, 126, 'HEDEF 1', { f:'Montserrat', s:9, c:'#6366f1', bold:true }),
        t('4b', 40, 142, '[Hedefin kısa açıklaması — ilham verici ve ölçülebilir]', { f:'Inter', s:12, c:'#1e293b', bold:true }),
        t('5', 40, 166, 'KR1: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('6', 40, 184, 'KR2: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('7', 40, 202, 'KR3: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        s('d2', 40, 228, 515, 1, '#e2e8f0'),
        t('8', 40, 242, 'HEDEF 2', { f:'Montserrat', s:9, c:'#6366f1', bold:true }),
        t('8b', 40, 258, '[Hedefin kısa açıklaması — ilham verici ve ölçülebilir]', { f:'Inter', s:12, c:'#1e293b', bold:true }),
        t('9', 40, 282, 'KR1: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('10', 40, 300, 'KR2: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('11', 40, 318, 'KR3: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        s('d3', 40, 344, 515, 1, '#e2e8f0'),
        t('12', 40, 358, 'HEDEF 3', { f:'Montserrat', s:9, c:'#6366f1', bold:true }),
        t('12b', 40, 374, '[Hedefin kısa açıklaması — ilham verici ve ölçülebilir]', { f:'Inter', s:12, c:'#1e293b', bold:true }),
        t('13', 40, 398, 'KR1: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('14', 40, 416, 'KR2: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
        t('15', 40, 434, 'KR3: [Anahtar sonuç — ölçülebilir ve zamana bağlı]', { f:'Inter', s:11, c:'#475569' }),
      ];
    } else if (templateId === 'swot') {
      elements = [
        t('1', 297, 24, 'SWOT ANALİZİ', { f:'Montserrat', s:26, c:'#1e293b', bold:true, w:595, a:'center' }),
        t('1b', 297, 52, '[Şirket / Proje Adı]', { f:'Inter', s:11, c:'#64748b', a:'center', w:595 }),
        s('q1', 40, 74, 250, 290, '#dcfce7'),
        t('q1h', 165, 88, 'GÜÇLÜ YANLAR', { f:'Montserrat', s:11, c:'#16a34a', bold:true, w:250, a:'center' }),
        t('q1b', 55, 115, '•\n•\n•\n•', { f:'Inter', s:11, c:'#334155', lh:1.9, w:230 }),
        s('q2', 305, 74, 250, 290, '#fef9c3'),
        t('q2h', 430, 88, 'ZAYIF YANLAR', { f:'Montserrat', s:11, c:'#ca8a04', bold:true, w:250, a:'center' }),
        t('q2b', 320, 115, '•\n•\n•\n•', { f:'Inter', s:11, c:'#334155', lh:1.9, w:230 }),
        s('q3', 40, 378, 250, 290, '#dbeafe'),
        t('q3h', 165, 392, 'FIRSATLAR', { f:'Montserrat', s:11, c:'#2563eb', bold:true, w:250, a:'center' }),
        t('q3b', 55, 418, '•\n•\n•\n•', { f:'Inter', s:11, c:'#334155', lh:1.9, w:230 }),
        s('q4', 305, 378, 250, 290, '#fee2e2'),
        t('q4h', 430, 392, 'TEHDİTLER', { f:'Montserrat', s:11, c:'#dc2626', bold:true, w:250, a:'center' }),
        t('q4b', 320, 418, '•\n•\n•\n•', { f:'Inter', s:11, c:'#334155', lh:1.9, w:230 }),
      ];
    } else if (templateId === 'businessplan') {
      elements = [
        s('h', 0, 0, 595, 160, '#0f172a'), s('ha', 0, 0, 595, 6, '#4ca8ad'),
        t('1', 40, 28, 'İŞ PLANI', { f:'Montserrat', s:36, c:'#ffffff', bold:true, w:515 }),
        t('2', 40, 76, '[Şirket / Girişim Adı]', { f:'Inter', s:15, c:'#4ca8ad', w:400 }),
        t('3', 40, 100, `${date}  •  Gizli`, { f:'Inter', s:10, c:'#64748b', w:300 }),
        s('d1', 40, 178, 515, 1, '#e2e8f0'),
        t('4', 40, 192, 'YÖNETİCİ ÖZETİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('5', 40, 208, '[Şirket], [sektör]\'de [ürün/hizmet] sunmaktadır. Hedef pazarımız [segment] olup ana rekabet avantajımız [USP]\'dir.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d2', 40, 260, 515, 1, '#e2e8f0'),
        t('6', 40, 274, 'PAZAR ANALİZİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('7', 40, 290, 'Toplam Pazar (TAM): ₺XX Milyar\nHedef Pazar (SAM): ₺XX Milyon\nUlaşılabilir Pazar (SOM): ₺XX Milyon', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d3', 40, 360, 515, 1, '#e2e8f0'),
        t('8', 40, 374, 'ÜRÜN / HİZMET', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('9', 40, 390, '[Ürün/hizmetin kısa açıklaması, temel özellikler ve müşteriye sağlanan değer önerisi]', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d4', 40, 435, 515, 1, '#e2e8f0'),
        t('10', 40, 449, 'GELİR MODELİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('11', 40, 465, '→ Abonelik: ₺X/ay\n→ Lisans: ₺XX,XXX (tek seferlik)\n→ Servis geliri: ₺XX/saat', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d5', 40, 535, 515, 1, '#e2e8f0'),
        t('12', 40, 549, 'MALİ PROJEKSIYON', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('13', 40, 565, 'Yıl 1: ₺XX,XXX  |  Yıl 2: ₺XX,XXX  |  Yıl 3: ₺X,XXX,XXX', { f:'Inter', s:11, c:'#334155' }),
        s('ft', 0, 822, 595, 20, '#0f172a'),
        t('ft1', 297, 828, 'Gizli  •  ZET İş Planı', { f:'Inter', s:8, c:'#94a3b8', a:'center' }),
      ];
    } else if (templateId === 'contract') {
      elements = [
        t('1', 297, 38, 'SÖZLEŞME', { f:'Montserrat', s:28, c:'#1e293b', bold:true, w:595, a:'center' }),
        s('d0', 100, 76, 395, 2, '#1e293b'),
        t('2', 40, 96, `Sözleşme No: SOZ-${Date.now().toString().slice(-6)}`, { f:'Inter', s:11, c:'#64748b', w:300 }),
        t('3', 400, 96, `Tarih: ${date}`, { f:'Inter', s:11, c:'#64748b', w:155, a:'right' }),
        s('d1', 40, 116, 515, 1, '#e2e8f0'),
        t('4', 40, 130, 'MADDE 1 — TARAFLAR', { f:'Montserrat', s:12, c:'#1e293b', bold:true }),
        t('5', 40, 152, 'Bu sözleşme, aşağıda bilgileri belirtilen taraflar arasında akdedilmiştir:\n\nTaraf 1: [Şirket/Kişi Adı]\nTaraf 2: [Şirket/Kişi Adı]', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        t('6', 40, 248, 'MADDE 2 — KONU', { f:'Montserrat', s:12, c:'#1e293b', bold:true }),
        t('7', 40, 270, 'Bu sözleşmenin konusu...', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        t('8', 40, 314, 'MADDE 3 — SÜRE VE ŞARTLAR', { f:'Montserrat', s:12, c:'#1e293b', bold:true }),
        t('9', 40, 336, 'Sözleşme süresi ve genel şartlar...', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        t('10', 40, 380, 'MADDE 4 — BEDEL', { f:'Montserrat', s:12, c:'#1e293b', bold:true }),
        t('11', 40, 402, 'Hizmet bedeli ve ödeme koşulları...', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('d2', 40, 448, 515, 1, '#e2e8f0'),
        t('12', 40, 600, '___________________\nTaraf 1 İmza / Kaşe', { f:'Inter', s:11, c:'#475569', lh:1.5, w:200 }),
        t('13', 350, 600, '___________________\nTaraf 2 İmza / Kaşe', { f:'Inter', s:11, c:'#475569', lh:1.5, w:205 }),
      ];
    } else if (templateId === 'nda') {
      elements = [
        s('top', 0, 0, 595, 5, '#1e293b'),
        t('1', 297, 30, 'GİZLİLİK SÖZLEŞMESİ', { f:'Montserrat', s:22, c:'#1e293b', bold:true, w:595, a:'center' }),
        t('2', 297, 60, '(Non-Disclosure Agreement)', { f:'Inter', s:12, c:'#64748b', a:'center', w:595 }),
        s('d0', 100, 82, 395, 1, '#e2e8f0'),
        t('3', 40, 100, `Sözleşme Tarihi: ${date}`, { f:'Inter', s:10, c:'#64748b' }),
        s('d1', 40, 120, 515, 1, '#e2e8f0'),
        t('4', 40, 134, '1. TARAFLAR', { f:'Montserrat', s:11, c:'#1e293b', bold:true }),
        t('5', 40, 154, 'İşbu Gizlilik Sözleşmesi ("Sözleşme");\n\nBir tarafta: [Şirket/Kişi Adı], [adres] adresinde mukim ("Açıklayan Taraf"),\nDiğer tarafta: [Şirket/Kişi Adı], [adres] adresinde mukim ("Alıcı Taraf"),\n\narasında imzalanmıştır.', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        t('6', 40, 272, '2. GİZLİ BİLGİNİN TANIMI', { f:'Montserrat', s:11, c:'#1e293b', bold:true }),
        t('7', 40, 292, '"Gizli Bilgi"; iş planları, müşteri listeleri, teknik veriler, finansal bilgiler ve taraflar arasında paylaşılan her türlü ticari sır anlamına gelir.', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        t('8', 40, 352, '3. GİZLİLİK YÜKÜMLÜLÜĞÜ', { f:'Montserrat', s:11, c:'#1e293b', bold:true }),
        t('9', 40, 372, 'Alıcı Taraf; Gizli Bilgiyi üçüncü şahıslara açıklamamayı, yalnızca belirtilen amaçla kullanmayı ve bilgilerin gizliliğini korumak için gerekli önlemleri almayı kabul eder.', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        t('10', 40, 440, '4. SÜRE', { f:'Montserrat', s:11, c:'#1e293b', bold:true }),
        t('11', 40, 460, 'Bu Sözleşme, imza tarihinden itibaren [X] yıl süreyle geçerlidir.', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        s('d2', 40, 500, 515, 1, '#e2e8f0'),
        t('12', 40, 640, '___________________\nAçıklayan Taraf\nİmza / Tarih', { f:'Inter', s:11, c:'#475569', lh:1.5, w:200 }),
        t('13', 350, 640, '___________________\nAlıcı Taraf\nİmza / Tarih', { f:'Inter', s:11, c:'#475569', lh:1.5, w:205 }),
      ];
    } else if (templateId === 'academic') {
      elements = [
        t('1', 297, 36, 'Makale Başlığı Buraya Yazılır', { f:'Merriweather', s:18, c:'#1e293b', bold:true, a:'center', w:595 }),
        t('2', 297, 72, 'Yazar Adı¹, Yazar Adı²', { f:'Inter', s:11, c:'#64748b', a:'center', w:595 }),
        t('3', 297, 88, '¹Üniversite Adı, Bölüm  ²Üniversite Adı', { f:'Inter', s:9, c:'#94a3b8', a:'center', w:595 }),
        t('4', 297, 104, 'yazaradı@üniversite.edu', { f:'Inter', s:9, c:'#4ca8ad', a:'center', w:595 }),
        s('d0', 40, 122, 515, 1, '#334155'),
        t('5', 40, 136, 'ÖZET', { f:'Merriweather', s:10, c:'#1e293b', bold:true }),
        t('6', 40, 152, 'Bu çalışmada [konu] incelenmekte olup [yöntem] kullanılmıştır. Elde edilen bulgular, [ana bulgular] şeklinde özetlenebilir. Sonuçlar, [sonuçların önemi] açısından önemli katkılar sunmaktadır.', { f:'Inter', s:10, c:'#334155', lh:1.75 }),
        t('7', 40, 210, 'Anahtar Kelimeler: kelime1, kelime2, kelime3, kelime4', { f:'Inter', s:9, c:'#64748b', italic:true }),
        s('d1', 40, 226, 515, 1, '#e2e8f0'),
        t('8', 40, 240, '1. GİRİŞ', { f:'Merriweather', s:12, c:'#1e293b', bold:true }),
        t('9', 40, 260, 'Giriş paragrafı: Araştırmanın arka planı, amacı ve kapsamı burada açıklanır. Literatür taramasına kısa bir atıfla başlanabilir [1]. Çalışmanın önemi ve özgün katkısı vurgulanmalıdır.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        t('10', 40, 326, '2. YÖNTEM', { f:'Merriweather', s:12, c:'#1e293b', bold:true }),
        t('11', 40, 346, 'Kullanılan araştırma yöntemi, veri toplama süreci ve analiz teknikleri bu bölümde detaylı şekilde açıklanır.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        t('12', 40, 400, '3. BULGULAR', { f:'Merriweather', s:12, c:'#1e293b', bold:true }),
        t('13', 40, 420, 'Elde edilen bulgular tablolar, grafikler ve istatistiksel analizlerle desteklenerek sunulur.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        t('14', 40, 474, '4. SONUÇ', { f:'Merriweather', s:12, c:'#1e293b', bold:true }),
        t('15', 40, 494, 'Bulguların literatür bağlamında değerlendirilmesi ve gelecek araştırmalar için öneriler.', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d2', 40, 540, 515, 1, '#e2e8f0'),
        t('16', 40, 553, 'KAYNAKÇA', { f:'Merriweather', s:10, c:'#1e293b', bold:true }),
        t('17', 40, 570, '[1] Yazar, A. ve Yazar, B. (2024). Makale Başlığı. Dergi Adı, 12(3), 45–67.\n[2] Yazar, C. (2023). Kitap Adı. Yayınevi.', { f:'Inter', s:9, c:'#64748b', lh:1.7 }),
      ];
    } else if (templateId === 'certificate') {
      elements = [
        s('b1', 20, 20, 555, 802, 'transparent', { stroke:'#f59e0b', sw:3 }),
        s('b2', 30, 30, 535, 782, 'transparent', { stroke:'#f59e0b', sw:1 }),
        s('acc', 180, 82, 235, 4, '#f59e0b'),
        t('1', 297, 110, 'SERTİFİKA', { f:'Montserrat', s:42, c:'#f59e0b', bold:true, a:'center', w:595 }),
        t('2', 297, 190, 'Bu belge ile', { f:'Inter', s:14, c:'#64748b', a:'center', w:595 }),
        t('3', 297, 248, 'AD SOYAD', { f:'Montserrat', s:32, c:'#1e293b', bold:true, a:'center', w:595 }),
        s('nl', 150, 292, 295, 2, '#f59e0b'),
        t('4', 297, 318, '[Program / Kurs Adı]\nbaşarıyla tamamladığını belgeler.', { f:'Inter', s:14, c:'#475569', lh:1.65, a:'center', w:595 }),
        t('5', 297, 414, date, { f:'Inter', s:12, c:'#94a3b8', a:'center', w:595 }),
        t('6', 150, 560, '___________________\nYetkili İmza', { f:'Inter', s:11, c:'#475569', a:'center', w:200 }),
        t('7', 440, 560, '___________________\nMühür', { f:'Inter', s:11, c:'#475569', a:'center', w:200 }),
      ];
    } else if (templateId === 'lessonplan') {
      elements = [
        s('top', 0, 0, 595, 6, '#10b981'),
        t('1', 40, 24, 'DERS PLANI', { f:'Montserrat', s:26, c:'#1e293b', bold:true }),
        t('2', 40, 60, 'Ders: [Ders Adı]  •  Sınıf: [X. Sınıf]  •  Süre: 40 dk', { f:'Inter', s:11, c:'#64748b' }),
        t('3', 400, 60, date, { f:'Inter', s:10, c:'#94a3b8', w:155, a:'right' }),
        s('d1', 40, 80, 515, 1, '#e2e8f0'),
        t('4', 40, 94, 'KAZANIMLAR', { f:'Montserrat', s:9, c:'#10b981', bold:true }),
        t('5', 40, 110, '• Öğrenci [beceri/bilgi] kazanacak.\n• Öğrenci [beceri/bilgi] uygulayabilecek.\n• Öğrenci [beceri/bilgi] değerlendirecek.', { f:'Inter', s:11, c:'#475569', lh:1.7 }),
        s('d2', 40, 182, 515, 1, '#e2e8f0'),
        t('6', 40, 196, 'GEREKLİ ARAÇ & GEREÇLER', { f:'Montserrat', s:9, c:'#10b981', bold:true }),
        t('7', 40, 212, 'Ders kitabı, tahta, projeksiyon, [diğer]', { f:'Inter', s:11, c:'#475569' }),
        s('d3', 40, 236, 515, 1, '#e2e8f0'),
        t('8', 40, 250, 'DERS AKIŞI', { f:'Montserrat', s:9, c:'#10b981', bold:true }),
        s('ph1', 40, 267, 515, 22, '#f0fdf4'), t('ph1a', 48, 274, 'Giriş (5 dk)', { f:'Montserrat', s:9, c:'#064e3b', bold:true, w:515 }),
        t('9', 40, 300, 'Öğrencilerin derse hazırlanması, önceki dersin kısa tekrarı, hedeflerin paylaşılması.', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('ph2', 40, 340, 515, 22, '#f0fdf4'), t('ph2a', 48, 347, 'Geliştirme (25 dk)', { f:'Montserrat', s:9, c:'#064e3b', bold:true, w:515 }),
        t('10', 40, 372, 'Ana konunun anlatımı, örnek çözümler, soru-cevap. Öğrenci etkinlikleri ve grup çalışması.', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('ph3', 40, 424, 515, 22, '#f0fdf4'), t('ph3a', 48, 431, 'Kapanış (10 dk)', { f:'Montserrat', s:9, c:'#064e3b', bold:true, w:515 }),
        t('11', 40, 456, 'Dersin özeti, ödev verilmesi, bir sonraki derse bağlantı.', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('d4', 40, 492, 515, 1, '#e2e8f0'),
        t('12', 40, 506, 'DEĞERLENDİRME', { f:'Montserrat', s:9, c:'#10b981', bold:true }),
        t('13', 40, 522, 'Gözlem  •  Soru-Cevap  •  Ödev  •  Kısa sınav', { f:'Inter', s:11, c:'#475569' }),
      ];
    } else if (templateId === 'letter') {
      elements = [
        t('1', 40, 50, '[Şirket / Kurum Adı]', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('2', 40, 76, '[Adres, Şehir, Posta Kodu]\n+90 XXX XXX XX XX  •  info@example.com', { f:'Inter', s:10, c:'#64748b', lh:1.55 }),
        s('d1', 40, 108, 515, 1, '#e2e8f0'),
        t('3', 400, 130, date, { f:'Inter', s:10, c:'#94a3b8', w:155, a:'right' }),
        t('4', 40, 148, 'Alıcı Adı\nGörev / Şirket\nAdres Satırı 1\nŞehir, Ülke', { f:'Inter', s:11, c:'#475569', lh:1.55 }),
        s('d2', 40, 232, 515, 1, '#e2e8f0'),
        t('5', 40, 250, 'Konu: [Konunun Kısa Açıklaması]', { f:'Inter', s:11, c:'#1e293b', bold:true }),
        t('6', 40, 278, 'Sayın Alıcı Adı,', { f:'Inter', s:11, c:'#1e293b' }),
        t('7', 40, 304, '[Konu] hakkında yazmaktayım. [Ana mesaj ve gerekçe]\n\n[Detaylar, bağlam ve gerekli bilgiler. Durumu net ve saygılı biçimde açıklayın.]\n\nSorularınız için benimle iletişime geçmekten çekinmeyiniz.', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        t('8', 40, 490, 'Saygılarımla,', { f:'Inter', s:11, c:'#1e293b' }),
        s('sig', 40, 515, 140, 1, '#94a3b8'),
        t('9', 40, 525, '[Ad Soyad]\n[Unvan]', { f:'Inter', s:11, c:'#475569', lh:1.55 }),
      ];
    } else if (templateId === 'weeklyplan') {
      elements = [
        t('1', 297, 32, 'HAFTALIK PLAN', { f:'Montserrat', s:26, c:'#1e293b', bold:true, a:'center', w:595 }),
        s('acc', 200, 68, 195, 3, '#8b5cf6'),
        t('2', 297, 80, `${date}  •  Hafta Hedefi: [Hedef]`, { f:'Inter', s:10, c:'#64748b', a:'center', w:595 }),
        s('d0', 40, 100, 515, 1, '#e2e8f0'),
        t('d0', 40, 116, 'Pazartesi', { f:'Montserrat', s:11, c:'#8b5cf6', bold:true }),
        s('dl0', 40, 134, 515, 52, '#faf5ff'), t('dt0', 52, 144, '• \n•', { f:'Inter', s:11, c:'#475569', lh:1.7, w:503 }),
        t('d1', 40, 214, 'Salı', { f:'Montserrat', s:11, c:'#8b5cf6', bold:true }),
        s('dl1', 40, 232, 515, 52, '#faf5ff'), t('dt1', 52, 242, '• \n•', { f:'Inter', s:11, c:'#475569', lh:1.7, w:503 }),
        t('d2', 40, 312, 'Çarşamba', { f:'Montserrat', s:11, c:'#8b5cf6', bold:true }),
        s('dl2', 40, 330, 515, 52, '#faf5ff'), t('dt2', 52, 340, '• \n•', { f:'Inter', s:11, c:'#475569', lh:1.7, w:503 }),
        t('d3', 40, 410, 'Perşembe', { f:'Montserrat', s:11, c:'#8b5cf6', bold:true }),
        s('dl3', 40, 428, 515, 52, '#faf5ff'), t('dt3', 52, 438, '• \n•', { f:'Inter', s:11, c:'#475569', lh:1.7, w:503 }),
        t('d4', 40, 508, 'Cuma', { f:'Montserrat', s:11, c:'#8b5cf6', bold:true }),
        s('dl4', 40, 526, 515, 52, '#faf5ff'), t('dt4', 52, 536, '• \n•', { f:'Inter', s:11, c:'#475569', lh:1.7, w:503 }),
      ];
    } else if (templateId === 'checklist') {
      elements = [
        t('1', 40, 36, 'KONTROL LİSTESİ', { f:'Montserrat', s:24, c:'#1e293b', bold:true }),
        t('2', 400, 40, date, { f:'Inter', s:10, c:'#94a3b8', w:155, a:'right' }),
        s('top', 40, 72, 515, 3, '#22c55e'),
        t('3', 40, 90, 'Proje / Görev Adı', { f:'Inter', s:13, c:'#16a34a', bold:true }),
        s('d1', 40, 112, 515, 1, '#e2e8f0'),
        t('4', 40, 126, '☐  Görev 1: İlk adımın açıklaması\n☐  Görev 2: İkinci adımın açıklaması\n☐  Görev 3: Üçüncü adımın açıklaması\n☐  Görev 4: Dördüncü adımın açıklaması\n☐  Görev 5: Beşinci adımın açıklaması\n☐  Görev 6: Altıncı adımın açıklaması\n☐  Görev 7: Yedinci adımın açıklaması\n☐  Görev 8: Sekizinci adımın açıklaması', { f:'Inter', s:12, c:'#334155', lh:2.2 }),
        s('d2', 40, 392, 515, 1, '#e2e8f0'),
        t('5', 40, 406, 'NOTLAR', { f:'Montserrat', s:11, c:'#1e293b', bold:true }),
        t('6', 40, 428, '...', { f:'Inter', s:11, c:'#64748b' }),
      ];
    } else if (templateId === 'travelplan') {
      elements = [
        s('h', 0, 0, 595, 120, '#0369a1'), s('ha', 0, 0, 595, 5, '#38bdf8'),
        t('1', 40, 24, 'SEYAHAT PLANI', { f:'Montserrat', s:30, c:'#ffffff', bold:true, w:515 }),
        t('2', 40, 66, '[Destinasyon]  •  [Tarih Aralığı]', { f:'Inter', s:14, c:'#7dd3fc', w:400 }),
        t('3', 40, 90, '[N] Gece  •  [N] Kişi', { f:'Inter', s:11, c:'#bae6fd', w:300 }),
        s('d1', 40, 138, 515, 1, '#e2e8f0'),
        t('4', 40, 152, 'GÜN 1', { f:'Montserrat', s:10, c:'#0369a1', bold:true }),
        t('5', 40, 168, '09:00  Havalimanı varış / Otele yerleşme\n12:00  Öğle yemeği — [Restoran]\n14:00  [Gezilecek yer / aktivite]\n19:00  Akşam yemeği — [Restoran]', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d2', 40, 258, 515, 1, '#e2e8f0'),
        t('6', 40, 272, 'GÜN 2', { f:'Montserrat', s:10, c:'#0369a1', bold:true }),
        t('7', 40, 288, '09:00  Kahvaltı — [Mekan]\n10:30  [Gezilecek yer]\n13:00  Öğle yemeği\n15:00  [Aktivite / Tur]\n20:00  Akşam yemeği', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d3', 40, 390, 515, 1, '#e2e8f0'),
        t('8', 40, 404, 'KONAKLAMA', { f:'Montserrat', s:10, c:'#0369a1', bold:true }),
        t('9', 40, 420, '[Otel Adı]  •  [Adres]  •  Tel: [Numara]', { f:'Inter', s:11, c:'#334155' }),
        s('d4', 40, 444, 515, 1, '#e2e8f0'),
        t('10', 40, 458, 'BÜTÇE', { f:'Montserrat', s:10, c:'#0369a1', bold:true }),
        t('11', 40, 474, 'Uçak/Taşıma: ₺X,XXX  •  Konaklama: ₺X,XXX  •  Yeme/İçme: ₺XXX  •  Aktivite: ₺XXX', { f:'Inter', s:11, c:'#334155' }),
        s('d5', 40, 500, 515, 1, '#e2e8f0'),
        t('12', 40, 514, 'ÖNEMLİ BİLGİLER', { f:'Montserrat', s:10, c:'#0369a1', bold:true }),
        t('13', 40, 530, 'Pasaport geçerlilik tarihi:  •  Sigorta no:  •  Acil iletişim:', { f:'Inter', s:11, c:'#334155' }),
      ];
    } else if (templateId === 'newsletter') {
      elements = [
        s('h', 0, 0, 595, 115, '#4ca8ad'),
        t('1', 297, 28, 'HAFTALIK BÜLTEN', { f:'Montserrat', s:30, c:'#ffffff', bold:true, a:'center', w:595 }),
        t('2', 297, 76, `Sayı #1  •  ${date}`, { f:'Inter', s:12, c:'#e0f2f1', a:'center', w:595 }),
        t('3', 40, 138, 'ÖNE ÇIKAN HABER', { f:'Montserrat', s:10, c:'#4ca8ad', bold:true }),
        t('4', 40, 155, 'Ana Haber Başlığı', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('5', 40, 185, 'Burada ana haberin özeti yer alır. Okuyucunun dikkatini çekmek için güçlü bir açılış yapın ve okumaya devam etmesini sağlayın.', { f:'Inter', s:11, c:'#475569', lh:1.75 }),
        s('d1', 40, 248, 515, 1, '#e2e8f0'),
        t('6', 40, 262, 'HIZLI NOTLAR', { f:'Montserrat', s:10, c:'#4ca8ad', bold:true }),
        t('7', 40, 278, '• İlk önemli gelişme ve kısa açıklaması\n• İkinci dikkat çekici haber başlığı\n• Üçüncü bilgi notu ve detayı', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('d2', 40, 358, 515, 1, '#e2e8f0'),
        t('8', 40, 372, 'ETKİNLİKLER', { f:'Montserrat', s:10, c:'#4ca8ad', bold:true }),
        t('9', 40, 388, '15 Mart — Konferans\n22 Mart — Workshop\n30 Mart — Webinar', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('ft', 0, 822, 595, 20, '#4ca8ad'),
        t('ft1', 297, 828, 'Abonelikten çıkmak için: unsubscribe@example.com', { f:'Inter', s:8, c:'#ffffff', a:'center' }),
      ];
    } else if (templateId === 'socialmedia') {
      elements = [
        s('bg', 0, 0, 595, 842, '#0f172a'),
        t('1', 297, 50, 'SOSYAL MEDYA\nİÇERİK PLANI', { f:'Montserrat', s:26, c:'#e879f9', bold:true, a:'center', w:595 }),
        s('acc', 200, 124, 195, 3, '#e879f9'),
        t('2', 40, 144, 'Platform:', { f:'Inter', s:11, c:'#94a3b8', w:100 }),
        t('2b', 140, 144, 'Instagram  /  Twitter  /  LinkedIn', { f:'Inter', s:11, c:'#38bdf8', w:415 }),
        s('d1', 40, 168, 515, 1, '#1e293b'),
        t('3', 40, 182, 'PAZARTESİ', { f:'Montserrat', s:12, c:'#38bdf8', bold:true }),
        t('4', 40, 200, 'Konu: Motivasyon Postu  •  Format: Carousel  •  Saat: 10:00', { f:'Inter', s:11, c:'#cbd5e1' }),
        s('d2', 40, 228, 515, 1, '#1e293b'),
        t('5', 40, 242, 'ÇARŞAMBA', { f:'Montserrat', s:12, c:'#38bdf8', bold:true }),
        t('6', 40, 260, 'Konu: Ürün Tanıtımı  •  Format: Reels  •  Saat: 14:00', { f:'Inter', s:11, c:'#cbd5e1' }),
        s('d3', 40, 288, 515, 1, '#1e293b'),
        t('7', 40, 302, 'CUMA', { f:'Montserrat', s:12, c:'#38bdf8', bold:true }),
        t('8', 40, 320, 'Konu: Kullanıcı Yorumları  •  Format: Story  •  Saat: 18:00', { f:'Inter', s:11, c:'#cbd5e1' }),
        s('d4', 40, 348, 515, 1, '#1e293b'),
        t('9', 40, 362, 'HASHTAG LİSTESİ', { f:'Montserrat', s:12, c:'#e879f9', bold:true }),
        t('10', 40, 384, '#marka  #dijitalpazarlama  #sosyalmedya\n#içerikuretimi  #pazarlama  #girişimci', { f:'Inter', s:11, c:'#94a3b8', lh:1.65 }),
      ];
    } else if (templateId === 'pressrelease') {
      elements = [
        s('top', 40, 35, 515, 3, '#4ca8ad'),
        t('1', 297, 52, 'BASIN BİLDİRİSİ', { f:'Montserrat', s:11, c:'#64748b', bold:true, a:'center', w:595 }),
        t('2', 40, 78, `HABER İÇİN: ${date}`, { f:'Montserrat', s:10, c:'#4ca8ad', bold:true }),
        t('3', 40, 100, 'KONU: [Başlık — kısa ve dikkat çekici olmalı]', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('4', 40, 140, `[Şehir, ${date}] — [Şirket Adı], bugün [olay/ürün/duyuru]'yu kamuoyuyla paylaşmaktan memnuniyet duymaktadır. Bu gelişme, [önem / bağlam].`, { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d1', 40, 216, 515, 1, '#e2e8f0'),
        t('5', 40, 230, '[Konu hakkında detaylar. Kim, ne, nerede, ne zaman, nasıl ve neden sorularını yanıtlayan bilgilendirici paragraf.]', { f:'Inter', s:11, c:'#475569', lh:1.75 }),
        t('6', 40, 316, '"[Yetkiliden alıntı — güçlü ve özgün bir cümle]"\n\n— [Ad Soyad], [Unvan], [Şirket Adı]', { f:'Inter', s:11, c:'#1e293b', lh:1.65, italic:true }),
        s('d2', 40, 400, 515, 1, '#e2e8f0'),
        t('7', 40, 415, '[Ek bilgi ve bağlam. Şirketin sektördeki yeri, geçmiş başarılar, bu duyurunun stratejik önemi anlatılır.]', { f:'Inter', s:11, c:'#475569', lh:1.75 }),
        s('d3', 40, 488, 515, 1, '#e2e8f0'),
        t('8', 40, 502, 'HAKKIMIZDA', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('9', 40, 518, '[Şirket Adı], [kuruluş yılı] yılından bu yana [sektör]\'de faaliyet göstermektedir.', { f:'Inter', s:11, c:'#475569', lh:1.65 }),
        s('d4', 40, 560, 515, 1, '#e2e8f0'),
        t('10', 40, 574, 'BASIN İLETİŞİM', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('11', 40, 590, '[Ad Soyad]  •  [E-posta]  •  [Telefon]', { f:'Inter', s:11, c:'#334155' }),
        t('12', 297, 650, '– – –', { f:'Inter', s:12, c:'#94a3b8', a:'center', w:595 }),
      ];
    } else if (templateId === 'creative-brief') {
      elements = [
        s('h', 0, 0, 595, 140, '#1a1a2e'), s('ha', 0, 0, 595, 6, '#4ca8ad'),
        t('1', 40, 22, 'KREATİF BRIEF', { f:'Montserrat', s:30, c:'#ffffff', bold:true }),
        t('2', 40, 66, 'Proje / Kampanya Adı', { f:'Inter', s:15, c:'#4ca8ad' }),
        t('3', 40, 90, `${date}  •  ZET Creative`, { f:'Inter', s:10, c:'#64748b' }),
        s('d1', 40, 158, 515, 1, '#e2e8f0'),
        t('4', 40, 170, 'MARKA / MÜŞTERİ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('5', 40, 186, 'Marka adı, sektör ve temel değerler burada belirtilir.', { f:'Inter', s:11, c:'#334155', lh:1.6 }),
        s('d2', 40, 215, 515, 1, '#e2e8f0'),
        t('6', 40, 227, 'HEDEF & AMAÇ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('7', 40, 243, 'Bu kampanya ile ulaşılmak istenen temel hedef nedir?\n→ Farkındalık  →  Dönüşüm  →  Marka konumlandırma', { f:'Inter', s:11, c:'#334155', lh:1.7 }),
        s('d3', 40, 295, 515, 1, '#e2e8f0'),
        t('8', 40, 307, 'HEDEF KİTLE', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        s('k1', 40, 324, 155, 75, '#f8fafc'), t('k1a', 118, 337, 'Demografik', { f:'Montserrat', s:8, c:'#64748b', bold:true, a:'center', w:155 }), t('k1b', 118, 353, '25–40 yaş\nKentsel', { f:'Inter', s:10, c:'#334155', a:'center', lh:1.5, w:155 }),
        s('k2', 205, 324, 155, 75, '#f8fafc'), t('k2a', 283, 337, 'Psikografik', { f:'Montserrat', s:8, c:'#64748b', bold:true, a:'center', w:155 }), t('k2b', 283, 353, 'Teknoloji meraklısı\nKalite odaklı', { f:'Inter', s:10, c:'#334155', a:'center', lh:1.5, w:155 }),
        s('k3', 370, 324, 155, 75, '#f8fafc'), t('k3a', 448, 337, 'Davranışsal', { f:'Montserrat', s:8, c:'#64748b', bold:true, a:'center', w:155 }), t('k3b', 448, 353, 'Dijital aktif\nSosyal medya', { f:'Inter', s:10, c:'#334155', a:'center', lh:1.5, w:155 }),
        s('d4', 40, 415, 515, 1, '#e2e8f0'),
        t('9', 40, 427, 'TEMEL MESAJ', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('10', 40, 444, '"Tek cümlede iletmek istediğiniz mesaj nedir?"', { f:'Merriweather', s:12, c:'#1e293b', italic:true }),
        s('d5', 40, 475, 515, 1, '#e2e8f0'),
        t('11', 40, 487, 'TESLİMATLAR', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('12', 40, 504, '☐ Sosyal medya görselleri\n☐ Display banner seti\n☐ E-posta şablonu\n☐ Landing page tasarımı', { f:'Inter', s:11, c:'#334155', lh:1.75 }),
        s('d6', 40, 585, 515, 1, '#e2e8f0'),
        t('13', 40, 597, 'TERMİN & BÜTÇE', { f:'Montserrat', s:9, c:'#4ca8ad', bold:true }),
        t('14', 40, 614, `Son Teslim: ${new Date(Date.now() + 14*86400000).toLocaleDateString('tr-TR')}     Bütçe: ₺XX,XXX`, { f:'Inter', s:11, c:'#334155' }),
        s('ft', 0, 822, 595, 20, '#1a1a2e'),
        t('ft1', 297, 828, 'ZET Creative Documents  •  Gizli', { f:'Inter', s:8, c:'#64748b', a:'center' }),
      ];
    } else if (templateId === 'presentation') {
      elements = [
        s('bg', 0, 0, 595, 842, '#1e1b4b'), s('acc', 0, 0, 595, 6, '#818cf8'),
        t('1', 297, 290, 'SUNUM BAŞLIĞI', { f:'Montserrat', s:40, c:'#ffffff', bold:true, a:'center', w:595 }),
        t('2', 297, 360, 'Alt Başlık veya Konu Açıklaması', { f:'Inter', s:16, c:'#a5b4fc', a:'center', w:595 }),
        s('line', 200, 418, 195, 3, '#818cf8'),
        t('3', 297, 440, 'Sunumcu Adı', { f:'Inter', s:13, c:'#c7d2fe', a:'center', w:595 }),
        t('4', 297, 464, date, { f:'Inter', s:11, c:'#818cf8', a:'center', w:595 }),
      ];
    } else if (templateId === 'pitch') {
      elements = [
        s('bg', 0, 0, 595, 842, '#0f172a'), s('acc', 0, 0, 595, 6, '#f59e0b'),
        t('1', 40, 32, '[GİRİŞİM ADI]', { f:'Montserrat', s:36, c:'#f59e0b', bold:true, w:515 }),
        t('2', 40, 80, '[Tek satırda ne yaptığınızı anlatın]', { f:'Inter', s:16, c:'#e2e8f0', w:515 }),
        s('d1', 40, 114, 515, 1, '#1e293b'),
        t('3', 40, 128, 'SORUN', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        t('4', 40, 144, '[Hedef kitlenizin yaşadığı sorunu net biçimde tanımlayın]', { f:'Inter', s:11, c:'#94a3b8', lh:1.7 }),
        s('d2', 40, 186, 515, 1, '#1e293b'),
        t('5', 40, 200, 'ÇÖZÜM', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        t('6', 40, 216, '[Ürününüzün / hizmetinizin sorunu nasıl çözdüğünü açıklayın]', { f:'Inter', s:11, c:'#e2e8f0', lh:1.7 }),
        s('d3', 40, 258, 515, 1, '#1e293b'),
        t('7', 40, 272, 'PAZAR BÜYÜKLÜĞÜ', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        s('b1', 40, 289, 150, 65, '#1e293b'), t('b1a', 115, 303, 'TAM PAZAR\n₺XX Milyar', { f:'Montserrat', s:10, c:'#f59e0b', a:'center', w:150, bold:true, lh:1.5 }),
        s('b2', 205, 289, 150, 65, '#1e293b'), t('b2a', 280, 303, 'HEDEF PAZAR\n₺XX Milyon', { f:'Montserrat', s:10, c:'#38bdf8', a:'center', w:150, bold:true, lh:1.5 }),
        s('b3', 370, 289, 150, 65, '#1e293b'), t('b3a', 445, 303, 'HEDEFİMİZ\n₺XX Milyon', { f:'Montserrat', s:10, c:'#4ade80', a:'center', w:150, bold:true, lh:1.5 }),
        s('d4', 40, 370, 515, 1, '#1e293b'),
        t('8', 40, 384, 'İŞ MODELİ', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        t('9', 40, 400, '[Nasıl para kazanıyorsunuz? Gelir akışlarınızı açıklayın]', { f:'Inter', s:11, c:'#94a3b8', lh:1.7 }),
        s('d5', 40, 440, 515, 1, '#1e293b'),
        t('10', 40, 454, 'TAKIM', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        t('11', 40, 470, '[Kurucu Adı] — CEO  |  [Kurucu Adı] — CTO  |  [Kurucu Adı] — COO', { f:'Inter', s:11, c:'#e2e8f0' }),
        s('d6', 40, 496, 515, 1, '#1e293b'),
        t('12', 40, 510, 'FİNANSMAN TALEBİ', { f:'Montserrat', s:9, c:'#f59e0b', bold:true }),
        t('13', 40, 526, 'Talep: ₺X,XXX,XXX  •  Kullanım: %40 Ürün  •  %30 Pazarlama  •  %30 Ekip', { f:'Inter', s:11, c:'#e2e8f0' }),
        s('fft', 0, 822, 595, 20, '#f59e0b'),
        t('fft1', 297, 828, `${date}  •  Gizli`, { f:'Montserrat', s:8, c:'#0f172a', bold:true, a:'center' }),
      ];
    } else if (templateId === 'brainstorm') {
      elements = [
        s('bg', 0, 0, 595, 842, '#fef3c7'),
        t('1', 297, 36, 'BEYİN FIRTINASI', { f:'Montserrat', s:28, c:'#92400e', bold:true, a:'center', w:595 }),
        t('2', 297, 74, 'Konu: [Ana Konu]', { f:'Inter', s:14, c:'#b45309', a:'center', w:595 }),
        s('center', 220, 340, 155, 82, '#f59e0b', { shape:'circle' }),
        t('3', 297, 372, 'ANA FİKİR', { f:'Montserrat', s:14, c:'#ffffff', bold:true, a:'center', w:595 }),
        t('4', 65, 188, 'Fikir 1', { f:'Inter', s:13, c:'#92400e', bold:true, w:150 }),
        t('5', 65, 208, '- Alt fikir\n- Detay', { f:'Inter', s:11, c:'#b45309', lh:1.6, w:150 }),
        t('6', 385, 188, 'Fikir 2', { f:'Inter', s:13, c:'#92400e', bold:true, w:150 }),
        t('7', 385, 208, '- Alt fikir\n- Detay', { f:'Inter', s:11, c:'#b45309', lh:1.6, w:150 }),
        t('8', 65, 490, 'Fikir 3', { f:'Inter', s:13, c:'#92400e', bold:true, w:150 }),
        t('9', 65, 510, '- Alt fikir\n- Detay', { f:'Inter', s:11, c:'#b45309', lh:1.6, w:150 }),
        t('10', 385, 490, 'Fikir 4', { f:'Inter', s:13, c:'#92400e', bold:true, w:150 }),
        t('11', 385, 510, '- Alt fikir\n- Detay', { f:'Inter', s:11, c:'#b45309', lh:1.6, w:150 }),
      ];
    } else if (templateId === 'blogpost') {
      elements = [
        s('acc', 40, 36, 4, 60, '#4ca8ad'),
        t('1', 56, 36, 'Blog Yazısı Başlığı', { f:'Montserrat', s:28, c:'#1e293b', bold:true, w:499 }),
        t('2', 40, 102, `[Yazar Adı]  •  ${date}  •  5 dk okuma`, { f:'Inter', s:10, c:'#94a3b8' }),
        s('d1', 40, 122, 515, 1, '#e2e8f0'),
        t('3', 40, 140, 'Giriş paragrafı burada başlar. Okuyucunun dikkatini çekmek için güçlü bir açılış yapın. Bu bölümde konunun önemini ve yazının amacını belirtin.', { f:'Inter', s:12, c:'#334155', lh:1.8 }),
        t('4', 40, 240, 'Alt Başlık 1', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('5', 40, 270, 'İlk bölümün içeriği burada yer alır. Detaylı açıklamalar, örnekler ve destekleyici bilgiler ekleyin.', { f:'Inter', s:12, c:'#334155', lh:1.8 }),
        t('6', 40, 355, 'Alt Başlık 2', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('7', 40, 385, 'İkinci bölümde konuyu derinleştirin. Farklı perspektifler sunun ve okuyucuya değer katın.', { f:'Inter', s:12, c:'#334155', lh:1.8 }),
        t('8', 40, 462, 'Sonuç', { f:'Montserrat', s:18, c:'#1e293b', bold:true }),
        t('9', 40, 492, 'Yazının ana mesajını özetleyin ve okuyucuyu bir sonraki adıma yönlendirin.', { f:'Inter', s:12, c:'#334155', lh:1.8 }),
      ];
    } else if (templateId === 'storyboard') {
      elements = [
        t('1', 40, 30, 'STORYBOARD', { f:'Montserrat', s:24, c:'#1e293b', bold:true }),
        t('2', 400, 36, '[Proje Adı]', { f:'Inter', s:11, c:'#64748b', w:155, a:'right' }),
        s('d0', 40, 60, 515, 2, '#334155'),
        s('f0', 40, 76, 240, 150, '#f1f5f9'), t('fn0', 160, 143, '[Sahne 1]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc0', 40, 234, 240, 1, '#e2e8f0'), t('tx0', 40, 241, '1. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
        s('f1', 315, 76, 240, 150, '#f1f5f9'), t('fn1', 435, 143, '[Sahne 2]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc1', 315, 234, 240, 1, '#e2e8f0'), t('tx1', 315, 241, '2. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
        s('f2', 40, 306, 240, 150, '#f1f5f9'), t('fn2', 160, 373, '[Sahne 3]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc2', 40, 464, 240, 1, '#e2e8f0'), t('tx2', 40, 471, '3. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
        s('f3', 315, 306, 240, 150, '#f1f5f9'), t('fn3', 435, 373, '[Sahne 4]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc3', 315, 464, 240, 1, '#e2e8f0'), t('tx3', 315, 471, '4. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
        s('f4', 40, 536, 240, 150, '#f1f5f9'), t('fn4', 160, 603, '[Sahne 5]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc4', 40, 694, 240, 1, '#e2e8f0'), t('tx4', 40, 701, '5. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
        s('f5', 315, 536, 240, 150, '#f1f5f9'), t('fn5', 435, 603, '[Sahne 6]', { f:'Inter', s:10, c:'#94a3b8', a:'center', w:240 }), s('fc5', 315, 694, 240, 1, '#e2e8f0'), t('tx5', 315, 701, '6. [Sahne açıklaması ve diyalog notu]', { f:'Inter', s:9, c:'#475569', lh:1.5, w:240 }),
      ];
    } else if (templateId === 'memo') {
      elements = [
        s('top', 0, 0, 595, 5, '#4ca8ad'),
        t('1', 40, 30, 'MEMO', { f:'Montserrat', s:32, c:'#1e293b', bold:true, w:300 }),
        t('2', 390, 34, date, { f:'Inter', s:10, c:'#94a3b8', w:165, a:'right' }),
        s('d1', 40, 76, 515, 1, '#e2e8f0'),
        s('meta', 40, 90, 515, 80, '#f8fafc'),
        t('3', 52, 100, 'KIME:', { f:'Montserrat', s:9, c:'#64748b', bold:true, w:80 }),
        t('4', 140, 100, '[Ad Soyad / Departman]', { f:'Inter', s:11, c:'#1e293b', w:415 }),
        t('5', 52, 120, 'KİMDEN:', { f:'Montserrat', s:9, c:'#64748b', bold:true, w:80 }),
        t('6', 140, 120, '[Ad Soyad]', { f:'Inter', s:11, c:'#1e293b', w:415 }),
        t('7', 52, 140, 'KONU:', { f:'Montserrat', s:9, c:'#64748b', bold:true, w:80 }),
        t('8', 140, 140, '[Memonun konusu]', { f:'Inter', s:11, c:'#1e293b', w:415 }),
        s('d2', 40, 178, 515, 1, '#e2e8f0'),
        t('9', 40, 196, 'Bu memo, [konu] hakkında bilgilendirme amacıyla hazırlanmıştır.\n\n[Ana mesaj ve gerekli bilgiler burada yer alır. Açık, kısa ve doğrudan bir dil kullanın. Okuyucunun harekete geçmesi gerekiyorsa bunu net biçimde belirtin.]\n\n[Gerekirse ek bilgi veya referans listesi ekleyin.]', { f:'Inter', s:11, c:'#475569', lh:1.8 }),
        s('d3', 40, 420, 515, 1, '#e2e8f0'),
        t('10', 40, 434, 'Sorularınız için: [e-posta veya dahili hat]', { f:'Inter', s:10, c:'#64748b' }),
      ];
    } else if (templateId === 'letter') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 60, content: 'Your Company Name', font: 'Montserrat', fontSize: 18, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 85, content: '123 Business Street, Istanbul 34000\nPhone: +90 212 000 00 00 | Email: info@company.com', font: 'Open Sans', fontSize: 10, color: '#666666', lineHeight: 1.5 },
        { id: `el_${now}_3`, type: 'shape', x: 40, y: 125, width: 515, height: 1, shapeType: 'square', fill: '#dddddd' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 160, content: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 200, content: 'Recipient Name\nCompany Name\nAddress Line 1\nCity, Country', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 290, content: 'Dear Recipient,', font: 'Open Sans', fontSize: 11, color: '#333333' },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 330, content: 'I am writing to you regarding [subject]. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nPlease feel free to contact me if you have any questions.', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.7 },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 500, content: 'Sincerely,', font: 'Open Sans', fontSize: 11, color: '#333333' },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 550, content: 'Your Name\nYour Title', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
      ];
    } else if (templateId === 'invoice') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 5, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 28, content: 'FATURA', font: 'Montserrat', fontSize: 32, color: '#0f172a', bold: true },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 70, content: 'ZET', font: 'Montserrat', fontSize: 11, color: '#4ca8ad', bold: true },
        { id: `el_${now}_4`, type: 'text', x: 390, y: 28, content: `#FAT-${Date.now().toString().slice(-4)}`, font: 'Montserrat', fontSize: 14, color: '#4ca8ad', bold: true },
        { id: `el_${now}_5`, type: 'text', x: 390, y: 50, content: `Tarih: ${new Date().toLocaleDateString('tr-TR')}`, font: 'Inter', fontSize: 10, color: '#64748b' },
        { id: `el_${now}_6`, type: 'text', x: 390, y: 65, content: 'Vade: 30 gün', font: 'Inter', fontSize: 10, color: '#64748b' },
        { id: `el_${now}_7`, type: 'shape', x: 40, y: 92, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 105, content: 'KİMDEN', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 120, content: 'Şirket Adınız\nAdres, İstanbul 34000\n+90 212 000 00 00', font: 'Inter', fontSize: 10, color: '#334155', lineHeight: 1.6 },
        { id: `el_${now}_10`, type: 'text', x: 310, y: 105, content: 'KİME', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 310, y: 120, content: 'Müşteri Adı\nMüşteri Adresi\nŞehir, Ülke', font: 'Inter', fontSize: 10, color: '#334155', lineHeight: 1.6 },
        { id: `el_${now}_12`, type: 'shape', x: 40, y: 185, width: 515, height: 24, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_13`, type: 'text', x: 48, y: 192, content: 'HİZMET / ÜRÜN', font: 'Montserrat', fontSize: 9, color: '#e2e8f0', bold: true },
        { id: `el_${now}_14`, type: 'text', x: 340, y: 192, content: 'ADET', font: 'Montserrat', fontSize: 9, color: '#e2e8f0', bold: true },
        { id: `el_${now}_15`, type: 'text', x: 400, y: 192, content: 'BİRİM FİYAT', font: 'Montserrat', fontSize: 9, color: '#e2e8f0', bold: true },
        { id: `el_${now}_16`, type: 'text', x: 490, y: 192, content: 'TOPLAM', font: 'Montserrat', fontSize: 9, color: '#e2e8f0', bold: true },
        { id: `el_${now}_17`, type: 'text', x: 48, y: 222, content: 'Hizmet / Ürün 1', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_18`, type: 'text', x: 345, y: 222, content: '2', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_19`, type: 'text', x: 405, y: 222, content: '₺2.500', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_20`, type: 'text', x: 490, y: 222, content: '₺5.000', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_21`, type: 'shape', x: 40, y: 238, width: 515, height: 1, shapeType: 'square', fill: '#f1f5f9' },
        { id: `el_${now}_22`, type: 'text', x: 48, y: 250, content: 'Hizmet / Ürün 2', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_23`, type: 'text', x: 345, y: 250, content: '1', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_24`, type: 'text', x: 405, y: 250, content: '₺1.000', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_25`, type: 'text', x: 490, y: 250, content: '₺1.000', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_26`, type: 'shape', x: 40, y: 268, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_27`, type: 'text', x: 400, y: 283, content: 'Ara Toplam:', font: 'Inter', fontSize: 10, color: '#64748b' },
        { id: `el_${now}_28`, type: 'text', x: 490, y: 283, content: '₺6.000', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_29`, type: 'text', x: 400, y: 300, content: 'KDV (%18):', font: 'Inter', fontSize: 10, color: '#64748b' },
        { id: `el_${now}_30`, type: 'text', x: 490, y: 300, content: '₺1.080', font: 'Inter', fontSize: 10, color: '#334155' },
        { id: `el_${now}_31`, type: 'shape', x: 390, y: 317, width: 165, height: 28, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_32`, type: 'text', x: 400, y: 326, content: 'GENEL TOPLAM', font: 'Montserrat', fontSize: 9, color: '#e2e8f0', bold: true },
        { id: `el_${now}_33`, type: 'text', x: 490, y: 326, content: '₺7.080', font: 'Montserrat', fontSize: 11, color: '#4ca8ad', bold: true },
        { id: `el_${now}_34`, type: 'text', x: 40, y: 380, content: 'ÖDEME BİLGİLERİ', font: 'Montserrat', fontSize: 9, color: '#64748b', bold: true },
        { id: `el_${now}_35`, type: 'text', x: 40, y: 395, content: 'Banka: [Banka Adı]\nIBAN: TR00 0000 0000 0000 0000 00\nHesap Sahibi: Şirket Adı', font: 'Inter', fontSize: 10, color: '#334155', lineHeight: 1.7 },
        { id: `el_${now}_36`, type: 'shape', x: 0, y: 822, width: 595, height: 20, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_37`, type: 'text', x: 297, y: 828, content: 'Teşekkür ederiz  •  ZET Documents', font: 'Inter', fontSize: 8, color: '#ffffff', textAlign: 'center' },
      ];
    } else if (templateId === 'presentation') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 842, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 300, content: 'PRESENTATION TITLE', font: 'Montserrat', fontSize: 42, color: '#ffffff', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 380, content: 'Your Subtitle Goes Here', font: 'Open Sans', fontSize: 18, color: '#aaaaaa', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'shape', x: 200, y: 430, width: 195, height: 3, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_5`, type: 'text', x: 297, y: 500, content: 'Presenter Name', font: 'Open Sans', fontSize: 14, color: '#cccccc', textAlign: 'center' },
        { id: `el_${now}_6`, type: 'text', x: 297, y: 525, content: new Date().toLocaleDateString(), font: 'Open Sans', fontSize: 12, color: '#888888', textAlign: 'center' },
      ];
    } else if (templateId === 'meeting') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 40, content: 'TOPLANTI NOTLARI', font: 'Montserrat', fontSize: 28, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'shape', x: 40, y: 80, width: 515, height: 2, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 100, content: `Tarih: ${new Date().toLocaleDateString('tr-TR')}`, font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_4`, type: 'text', x: 300, y: 100, content: 'Saat: 14:00 - 15:30', font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 130, content: 'Katılımcılar:', font: 'Montserrat', fontSize: 12, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 150, content: '• Ad Soyad - Pozisyon\n• Ad Soyad - Pozisyon\n• Ad Soyad - Pozisyon', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 220, content: 'Gündem Maddeleri', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 245, content: '1. Proje durumu gözden geçirme\n2. Önümüzdeki hafta hedefleri\n3. Açık konular ve sorunlar\n4. Diğer', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_9`, type: 'shape', x: 40, y: 345, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 358, content: 'KARARLAR', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 375, content: '◉  \n◉  \n◉  ', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.9 },
        { id: `el_${now}_12`, type: 'shape', x: 40, y: 445, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_13`, type: 'text', x: 40, y: 458, content: 'AKSİYON MADDELERİ', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_14`, type: 'shape', x: 40, y: 477, width: 515, height: 22, shapeType: 'square', fill: '#f8fafc' },
        { id: `el_${now}_15`, type: 'text', x: 42, y: 483, content: 'GÖREV', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true },
        { id: `el_${now}_16`, type: 'text', x: 270, y: 483, content: 'SORUMLU', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true },
        { id: `el_${now}_17`, type: 'text', x: 430, y: 483, content: 'TARİH', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true },
        { id: `el_${now}_18`, type: 'text', x: 40, y: 510, content: '1. \n2. \n3. ', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 2.0 },
      ];
    } else if (templateId === 'proposal') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 175, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_2`, type: 'shape', x: 0, y: 0, width: 6, height: 175, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 40, content: 'ZET', font: 'Montserrat', fontSize: 11, color: '#4ca8ad', bold: true },
        { id: `el_${now}_2b`, type: 'text', x: 40, y: 65, content: 'PROJE TEKLİFİ', font: 'Montserrat', fontSize: 34, color: '#ffffff', bold: true },
        { id: `el_${now}_3b`, type: 'text', x: 40, y: 110, content: 'Şirket / Müşteri Adı', font: 'Inter', fontSize: 14, color: '#94a3b8' },
        { id: `el_${now}_3c`, type: 'text', x: 40, y: 132, content: new Date().toLocaleDateString('tr-TR'), font: 'Inter', fontSize: 11, color: '#64748b' },
        { id: `el_${now}_3d`, type: 'text', x: 450, y: 132, content: 'Gizli', font: 'Montserrat', fontSize: 9, color: '#ef4444', bold: true },
        { id: `el_${now}_p5`, type: 'text', x: 40, y: 200, content: 'YÖNETİCİ ÖZETİ', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_p6`, type: 'text', x: 40, y: 218, content: 'Bu teklif, projenin kapsamını, hedeflerini, zaman çizelgesini ve bütçesini detaylı olarak özetlemektedir. Müşteriye sağlanacak değer ve başarı kriterleri aşağıda belirtilmiştir.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_p7`, type: 'shape', x: 40, y: 285, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_p8`, type: 'text', x: 40, y: 298, content: 'PROJE KAPSAMI', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_p9`, type: 'text', x: 40, y: 316, content: '→  Hedef 1: Kullanıcı deneyimini %40 iyileştirme\n→  Hedef 2: Sistem entegrasyonlarını tamamlama\n→  Hedef 3: Canlıya geçiş ve destek süreci', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_p10`, type: 'shape', x: 40, y: 390, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_p11`, type: 'text', x: 40, y: 403, content: 'ZAMAN ÇİZELGESİ', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_p12`, type: 'shape', x: 40, y: 422, width: 80, height: 24, shapeType: 'square', fill: '#e0f2fe' },
        { id: `el_${now}_p13`, type: 'text', x: 80, y: 430, content: 'Faz 1 — 2 Hafta', font: 'Inter', fontSize: 9, color: '#0369a1', textAlign: 'center' },
        { id: `el_${now}_p14`, type: 'shape', x: 130, y: 422, width: 120, height: 24, shapeType: 'square', fill: '#f0fdf4' },
        { id: `el_${now}_p15`, type: 'text', x: 190, y: 430, content: 'Faz 2 — 6 Hafta', font: 'Inter', fontSize: 9, color: '#15803d', textAlign: 'center' },
        { id: `el_${now}_p16`, type: 'shape', x: 260, y: 422, width: 100, height: 24, shapeType: 'square', fill: '#fdf4ff' },
        { id: `el_${now}_p17`, type: 'text', x: 310, y: 430, content: 'Faz 3 — 2 Hafta', font: 'Inter', fontSize: 9, color: '#7c3aed', textAlign: 'center' },
        { id: `el_${now}_p18`, type: 'shape', x: 40, y: 468, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_p19`, type: 'text', x: 40, y: 481, content: 'BÜTÇE', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_p20`, type: 'text', x: 40, y: 500, content: 'Planlama & Tasarım: ₺XX,XXX\nGeliştirme: ₺XX,XXX\nTest & Lansman: ₺XX,XXX', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.7 },
        { id: `el_${now}_p21`, type: 'shape', x: 40, y: 563, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_p22`, type: 'text', x: 40, y: 577, content: 'TOPLAM PROJE MALİYETİ', font: 'Montserrat', fontSize: 11, color: '#0f172a', bold: true },
        { id: `el_${now}_p23`, type: 'text', x: 380, y: 577, content: '₺XX,XXX', font: 'Montserrat', fontSize: 18, color: '#4ca8ad', bold: true },
        { id: `el_${now}_p24`, type: 'shape', x: 0, y: 822, width: 595, height: 20, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_p25`, type: 'text', x: 297, y: 828, content: 'Gizli  •  ZET Documents', font: 'Inter', fontSize: 8, color: '#94a3b8', textAlign: 'center' },
      ];
    } else if (templateId === 'contract') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 297, y: 40, content: 'SÖZLEŞME', font: 'Montserrat', fontSize: 28, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'shape', x: 100, y: 80, width: 395, height: 2, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 110, content: `Sözleşme No: SOZ-${Date.now().toString().slice(-6)}`, font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_4`, type: 'text', x: 400, y: 110, content: `Tarih: ${new Date().toLocaleDateString('tr-TR')}`, font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 150, content: 'MADDE 1 - TARAFLAR', font: 'Montserrat', fontSize: 13, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 175, content: 'Bu sözleşme, aşağıda bilgileri belirtilen taraflar arasında akdedilmiştir:\n\nTaraf 1: [Şirket/Kişi Adı]\nTaraf 2: [Şirket/Kişi Adı]', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 280, content: 'MADDE 2 - KONU', font: 'Montserrat', fontSize: 13, color: '#1a1a2e', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 305, content: 'Bu sözleşmenin konusu...', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 360, content: 'MADDE 3 - SÜRE VE ŞARTLAR', font: 'Montserrat', fontSize: 13, color: '#1a1a2e', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 385, content: 'Sözleşme süresi ve genel şartlar...', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 600, content: '___________________\nTaraf 1 İmza', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
        { id: `el_${now}_12`, type: 'text', x: 350, y: 600, content: '___________________\nTaraf 2 İmza', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
      ];
    } else if (templateId === 'newsletter') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 120, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 35, content: 'HAFTALIK BÜLTEN', font: 'Montserrat', fontSize: 32, color: '#ffffff', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 80, content: `Sayı #1 • ${new Date().toLocaleDateString('tr-TR')}`, font: 'Open Sans', fontSize: 12, color: '#e0f2f1', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 150, content: 'Öne Çıkan Haber', font: 'Montserrat', fontSize: 18, color: '#1a1a2e', bold: true },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 180, content: 'Burada ana haberin başlığı ve kısa özeti yer alır. Okuyucu ilgisini çekmek için dikkat çekici bir açılış yapın.', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.7 },
        { id: `el_${now}_6`, type: 'shape', x: 40, y: 240, width: 515, height: 1, shapeType: 'square', fill: '#e0e0e0' },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 260, content: 'Hızlı Notlar', font: 'Montserrat', fontSize: 14, color: '#4ca8ad', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 285, content: '• İlk önemli gelişme\n• İkinci dikkat çekici haber\n• Üçüncü bilgi notu', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 370, content: 'Etkinlikler', font: 'Montserrat', fontSize: 14, color: '#4ca8ad', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 395, content: '15 Mart - Konferans\n22 Mart - Workshop\n30 Mart - Webinar', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
      ];
    } else if (templateId === 'recipe') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 297, y: 40, content: 'TARİF KARTI', font: 'Montserrat', fontSize: 28, color: '#e74c3c', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'shape', x: 200, y: 80, width: 195, height: 3, shapeType: 'square', fill: '#e74c3c' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 100, content: 'Yemek Adı', font: 'Montserrat', fontSize: 20, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 60, y: 140, content: '⏱ 30 dk', font: 'Open Sans', fontSize: 12, color: '#666666' },
        { id: `el_${now}_5`, type: 'text', x: 200, y: 140, content: '👥 4 Kişilik', font: 'Open Sans', fontSize: 12, color: '#666666' },
        { id: `el_${now}_6`, type: 'text', x: 360, y: 140, content: '⭐ Orta', font: 'Open Sans', fontSize: 12, color: '#666666' },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 180, content: 'Malzemeler', font: 'Montserrat', fontSize: 14, color: '#e74c3c', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 205, content: '• 2 su bardağı un\n• 1 çay bardağı şeker\n• 3 yumurta\n• 1 paket kabartma tozu\n• 200ml süt', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.7 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 340, content: 'Hazırlanışı', font: 'Montserrat', fontSize: 14, color: '#e74c3c', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 365, content: '1. Kuru malzemeleri bir kapta karıştırın\n2. Yumurtaları ve sütü ayrı bir kapta çırpın\n3. İki karışımı birleştirin\n4. Yağlanmış kalıba dökün\n5. 180°C fırında 30-35 dk pişirin', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
      ];
    } else if (templateId === 'projectplan') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 40, content: 'PROJE PLANI', font: 'Montserrat', fontSize: 28, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'shape', x: 40, y: 80, width: 515, height: 2, shapeType: 'square', fill: '#3b82f6' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 100, content: 'Proje Adı: [Proje Adı]', font: 'Open Sans', fontSize: 13, color: '#333333' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 125, content: `Başlangıç: ${new Date().toLocaleDateString('tr-TR')}  |  Bitiş: [Tarih]  |  Yönetici: [İsim]`, font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 165, content: 'Proje Hedefleri', font: 'Montserrat', fontSize: 14, color: '#3b82f6', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 190, content: '1. Ana hedef...\n2. İkincil hedef...\n3. Başarı kriteri...', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.7 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 270, content: 'Kilometre Taşları', font: 'Montserrat', fontSize: 14, color: '#3b82f6', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 295, content: '✓ Faz 1: Planlama (Hafta 1-2)\n○ Faz 2: Tasarım (Hafta 3-4)\n○ Faz 3: Geliştirme (Hafta 5-8)\n○ Faz 4: Test (Hafta 9-10)\n○ Faz 5: Lansman (Hafta 11-12)', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 420, content: 'Riskler ve Çözümler', font: 'Montserrat', fontSize: 14, color: '#3b82f6', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 445, content: '• Risk: [Tanım] → Çözüm: [Eylem]\n• Risk: [Tanım] → Çözüm: [Eylem]', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
      ];
    } else if (templateId === 'certificate') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 20, y: 20, width: 555, height: 802, shapeType: 'square', fill: 'transparent', stroke: '#f59e0b', strokeWidth: 3 },
        { id: `el_${now}_2`, type: 'shape', x: 30, y: 30, width: 535, height: 782, shapeType: 'square', fill: 'transparent', stroke: '#f59e0b', strokeWidth: 1 },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 120, content: 'SERTİFİKA', font: 'Montserrat', fontSize: 42, color: '#f59e0b', bold: true, textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 297, y: 200, content: 'Bu belge ile', font: 'Open Sans', fontSize: 14, color: '#666666', textAlign: 'center' },
        { id: `el_${now}_5`, type: 'text', x: 297, y: 260, content: 'AD SOYAD', font: 'Montserrat', fontSize: 32, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_6`, type: 'shape', x: 150, y: 300, width: 295, height: 2, shapeType: 'square', fill: '#f59e0b' },
        { id: `el_${now}_7`, type: 'text', x: 297, y: 330, content: '[Program/Kurs Adı]\nbaşarıyla tamamladığını belgeler.', font: 'Open Sans', fontSize: 14, color: '#444444', lineHeight: 1.6, textAlign: 'center' },
        { id: `el_${now}_8`, type: 'text', x: 297, y: 420, content: new Date().toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }), font: 'Open Sans', fontSize: 12, color: '#888888', textAlign: 'center' },
        { id: `el_${now}_9`, type: 'text', x: 150, y: 550, content: '___________________\nYetkili İmza', font: 'Open Sans', fontSize: 11, color: '#444444', textAlign: 'center' },
        { id: `el_${now}_10`, type: 'text', x: 440, y: 550, content: '___________________\nMühür', font: 'Open Sans', fontSize: 11, color: '#444444', textAlign: 'center' },
      ];
    } else if (templateId === 'checklist') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 40, content: 'KONTROL LİSTESİ', font: 'Montserrat', fontSize: 24, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 75, content: `Tarih: ${new Date().toLocaleDateString('tr-TR')}`, font: 'Open Sans', fontSize: 11, color: '#888888' },
        { id: `el_${now}_3`, type: 'shape', x: 40, y: 95, width: 515, height: 2, shapeType: 'square', fill: '#22c55e' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 120, content: '☐ Görev 1: İlk adım açıklaması\n☐ Görev 2: İkinci adım açıklaması\n☐ Görev 3: Üçüncü adım açıklaması\n☐ Görev 4: Dördüncü adım açıklaması\n☐ Görev 5: Beşinci adım açıklaması\n☐ Görev 6: Altıncı adım açıklaması\n☐ Görev 7: Yedinci adım açıklaması\n☐ Görev 8: Sekizinci adım açıklaması', font: 'Open Sans', fontSize: 12, color: '#333333', lineHeight: 2.2 },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 400, content: 'Notlar:', font: 'Montserrat', fontSize: 13, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 425, content: '...', font: 'Open Sans', fontSize: 11, color: '#666666' },
      ];
    } else if (templateId === 'brainstorm') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 842, shapeType: 'square', fill: '#fef3c7' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 40, content: 'BEYİN FIRTINASI', font: 'Montserrat', fontSize: 28, color: '#92400e', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 80, content: 'Konu: [Ana Konu]', font: 'Open Sans', fontSize: 16, color: '#b45309', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'shape', x: 220, y: 350, width: 155, height: 80, shapeType: 'circle', fill: '#f59e0b' },
        { id: `el_${now}_5`, type: 'text', x: 297, y: 380, content: 'ANA FİKİR', font: 'Montserrat', fontSize: 14, color: '#ffffff', bold: true, textAlign: 'center' },
        { id: `el_${now}_6`, type: 'text', x: 80, y: 200, content: 'Fikir 1', font: 'Open Sans', fontSize: 13, color: '#92400e', bold: true },
        { id: `el_${now}_7`, type: 'text', x: 80, y: 225, content: '- Alt fikir\n- Detay', font: 'Open Sans', fontSize: 11, color: '#b45309', lineHeight: 1.6 },
        { id: `el_${now}_8`, type: 'text', x: 400, y: 200, content: 'Fikir 2', font: 'Open Sans', fontSize: 13, color: '#92400e', bold: true },
        { id: `el_${now}_9`, type: 'text', x: 400, y: 225, content: '- Alt fikir\n- Detay', font: 'Open Sans', fontSize: 11, color: '#b45309', lineHeight: 1.6 },
        { id: `el_${now}_10`, type: 'text', x: 80, y: 500, content: 'Fikir 3', font: 'Open Sans', fontSize: 13, color: '#92400e', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 80, y: 525, content: '- Alt fikir\n- Detay', font: 'Open Sans', fontSize: 11, color: '#b45309', lineHeight: 1.6 },
        { id: `el_${now}_12`, type: 'text', x: 400, y: 500, content: 'Fikir 4', font: 'Open Sans', fontSize: 13, color: '#92400e', bold: true },
        { id: `el_${now}_13`, type: 'text', x: 400, y: 525, content: '- Alt fikir\n- Detay', font: 'Open Sans', fontSize: 11, color: '#b45309', lineHeight: 1.6 },
      ];
    } else if (templateId === 'socialmedia') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 842, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 60, content: 'SOSYAL MEDYA\nİÇERİK PLANI', font: 'Montserrat', fontSize: 28, color: '#e879f9', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'shape', x: 200, y: 130, width: 195, height: 3, shapeType: 'square', fill: '#e879f9' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 170, content: 'Platform: Instagram / Twitter / LinkedIn', font: 'Open Sans', fontSize: 12, color: '#94a3b8' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 210, content: 'Pazartesi', font: 'Montserrat', fontSize: 14, color: '#38bdf8', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 235, content: 'Konu: Motivasyon Postu\nFormat: Carousel\nSaat: 10:00', font: 'Open Sans', fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 310, content: 'Çarşamba', font: 'Montserrat', fontSize: 14, color: '#38bdf8', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 335, content: 'Konu: Ürün Tanıtımı\nFormat: Reels/Video\nSaat: 14:00', font: 'Open Sans', fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 410, content: 'Cuma', font: 'Montserrat', fontSize: 14, color: '#38bdf8', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 435, content: 'Konu: Kullanıcı Yorumları\nFormat: Story\nSaat: 18:00', font: 'Open Sans', fontSize: 11, color: '#cbd5e1', lineHeight: 1.6 },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 530, content: 'Hashtag Listesi', font: 'Montserrat', fontSize: 14, color: '#e879f9', bold: true },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 555, content: '#marka #dijitalpazarlama #sosyalmedya\n#içerikuretimi #pazarlama #girişimci', font: 'Open Sans', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 },
      ];
    } else if (templateId === 'weeklyplan') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 297, y: 40, content: 'HAFTALIK PLAN', font: 'Montserrat', fontSize: 26, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'shape', x: 200, y: 78, width: 195, height: 2, shapeType: 'square', fill: '#8b5cf6' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 110, content: 'Pazartesi', font: 'Montserrat', fontSize: 13, color: '#8b5cf6', bold: true },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 130, content: '•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 175, content: 'Salı', font: 'Montserrat', fontSize: 13, color: '#8b5cf6', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 195, content: '•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 240, content: 'Çarşamba', font: 'Montserrat', fontSize: 13, color: '#8b5cf6', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 260, content: '•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 305, content: 'Perşembe', font: 'Montserrat', fontSize: 13, color: '#8b5cf6', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 325, content: '•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 370, content: 'Cuma', font: 'Montserrat', fontSize: 13, color: '#8b5cf6', bold: true },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 390, content: '•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
      ];
    } else if (templateId === 'swot') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 297, y: 30, content: 'SWOT ANALİZİ', font: 'Montserrat', fontSize: 26, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'shape', x: 40, y: 80, width: 250, height: 280, shapeType: 'square', fill: '#dcfce7' },
        { id: `el_${now}_3`, type: 'text', x: 165, y: 95, content: 'GÜÇLÜ YANLAR', font: 'Montserrat', fontSize: 13, color: '#16a34a', bold: true, textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 55, y: 125, content: '•\n•\n•', font: 'Open Sans', fontSize: 11, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_5`, type: 'shape', x: 305, y: 80, width: 250, height: 280, shapeType: 'square', fill: '#fef9c3' },
        { id: `el_${now}_6`, type: 'text', x: 430, y: 95, content: 'ZAYIF YANLAR', font: 'Montserrat', fontSize: 13, color: '#ca8a04', bold: true, textAlign: 'center' },
        { id: `el_${now}_7`, type: 'text', x: 320, y: 125, content: '•\n•\n•', font: 'Open Sans', fontSize: 11, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_8`, type: 'shape', x: 40, y: 380, width: 250, height: 280, shapeType: 'square', fill: '#dbeafe' },
        { id: `el_${now}_9`, type: 'text', x: 165, y: 395, content: 'FIRSATLAR', font: 'Montserrat', fontSize: 13, color: '#2563eb', bold: true, textAlign: 'center' },
        { id: `el_${now}_10`, type: 'text', x: 55, y: 425, content: '•\n•\n•', font: 'Open Sans', fontSize: 11, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_11`, type: 'shape', x: 305, y: 380, width: 250, height: 280, shapeType: 'square', fill: '#fee2e2' },
        { id: `el_${now}_12`, type: 'text', x: 430, y: 395, content: 'TEHDİTLER', font: 'Montserrat', fontSize: 13, color: '#dc2626', bold: true, textAlign: 'center' },
        { id: `el_${now}_13`, type: 'text', x: 320, y: 425, content: '•\n•\n•', font: 'Open Sans', fontSize: 11, color: '#333333', lineHeight: 1.8 },
      ];
    } else if (templateId === 'blogpost') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 60, content: 'Blog Yazısı Başlığı', font: 'Montserrat', fontSize: 30, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 105, content: `Yazar Adı • ${new Date().toLocaleDateString('tr-TR')} • 5 dk okuma`, font: 'Open Sans', fontSize: 11, color: '#888888' },
        { id: `el_${now}_3`, type: 'shape', x: 40, y: 130, width: 515, height: 1, shapeType: 'square', fill: '#e0e0e0' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 160, content: 'Giriş paragrafı burada başlar. Okuyucunun dikkatini çekmek için güçlü bir açılış yapın. Bu bölümde konunun önemini ve yazının amacını belirtin.', font: 'Open Sans', fontSize: 12, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 260, content: 'Alt Başlık 1', font: 'Montserrat', fontSize: 18, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 290, content: 'İlk bölümün içeriği burada yer alır. Detaylı açıklamalar, örnekler ve destekleyici bilgiler ekleyin.', font: 'Open Sans', fontSize: 12, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 370, content: 'Alt Başlık 2', font: 'Montserrat', fontSize: 18, color: '#1a1a2e', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 400, content: 'İkinci bölümde konuyu derinleştirin. Farklı perspektifler sunun ve okuyucuya değer katın.', font: 'Open Sans', fontSize: 12, color: '#333333', lineHeight: 1.8 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 480, content: 'Sonuç', font: 'Montserrat', fontSize: 18, color: '#1a1a2e', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 510, content: 'Yazının ana mesajını özetleyin ve okuyucuyu bir sonraki adıma yönlendirin.', font: 'Open Sans', fontSize: 12, color: '#333333', lineHeight: 1.8 },
      ];
    } else if (templateId === 'eventflyer') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 842, shapeType: 'square', fill: '#1e1b4b' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 100, content: 'ETKİNLİK', font: 'Montserrat', fontSize: 48, color: '#c084fc', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 170, content: 'DAVET', font: 'Montserrat', fontSize: 36, color: '#e879f9', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'shape', x: 180, y: 220, width: 235, height: 2, shapeType: 'square', fill: '#c084fc' },
        { id: `el_${now}_5`, type: 'text', x: 297, y: 270, content: 'Etkinlik Adı', font: 'Montserrat', fontSize: 22, color: '#ffffff', bold: true, textAlign: 'center' },
        { id: `el_${now}_6`, type: 'text', x: 297, y: 340, content: '📅 15 Mart 2026', font: 'Open Sans', fontSize: 16, color: '#e2e8f0', textAlign: 'center' },
        { id: `el_${now}_7`, type: 'text', x: 297, y: 380, content: '🕐 19:00 - 23:00', font: 'Open Sans', fontSize: 16, color: '#e2e8f0', textAlign: 'center' },
        { id: `el_${now}_8`, type: 'text', x: 297, y: 420, content: '📍 Mekan Adı, İstanbul', font: 'Open Sans', fontSize: 16, color: '#e2e8f0', textAlign: 'center' },
        { id: `el_${now}_9`, type: 'text', x: 297, y: 520, content: 'Kayıt için: etkinlik@example.com', font: 'Open Sans', fontSize: 14, color: '#c084fc', textAlign: 'center' },
      ];
    } else if (templateId === 'academic') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 297, y: 40, content: 'Makale Başlığı Buraya Yazılır', font: 'Merriweather', fontSize: 18, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 80, content: 'Yazar Adı, Yazar Adı²', font: 'Inter', fontSize: 11, color: '#64748b', textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 96, content: '¹Üniversite Adı, Bölüm Adı  ²Üniversite Adı', font: 'Inter', fontSize: 9, color: '#94a3b8', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 297, y: 112, content: 'yazaradı@üniversite.edu', font: 'Inter', fontSize: 9, color: '#4ca8ad', textAlign: 'center' },
        { id: `el_${now}_5`, type: 'shape', x: 40, y: 132, width: 515, height: 1, shapeType: 'square', fill: '#334155' },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 148, content: 'ÖZET', font: 'Merriweather', fontSize: 10, color: '#1a1a2e', bold: true },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 165, content: 'Bu çalışmada [konu] incelenmekte olup [yöntem] kullanılmıştır. Elde edilen bulgular, [ana bulgular] şeklinde özetlenebilir. Sonuçlar, [sonuçların önemi] açısından değerlendirildiğinde önemli katkılar sunmaktadır.', font: 'Inter', fontSize: 10, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 222, content: 'Anahtar Kelimeler: kelime1, kelime2, kelime3, kelime4', font: 'Inter', fontSize: 9, color: '#64748b', italic: true },
        { id: `el_${now}_9`, type: 'shape', x: 40, y: 238, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 252, content: '1. GİRİŞ', font: 'Merriweather', fontSize: 12, color: '#1a1a2e', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 272, content: 'Giriş paragrafı: Araştırmanın arka planı, amacı ve kapsamı burada açıklanır. Literatür taramasına kısa bir atıfla başlanabilir [1]. Çalışmanın önemi ve özgün katkısı vurgulanmalıdır.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 338, content: '2. YÖNTEM', font: 'Merriweather', fontSize: 12, color: '#1a1a2e', bold: true },
        { id: `el_${now}_13`, type: 'text', x: 40, y: 358, content: 'Kullanılan araştırma yöntemi, veri toplama süreci ve analiz teknikleri bu bölümde detaylı şekilde açıklanır. Araştırmanın tekrar edilebilirliğini sağlayacak düzeyde bilgi verilmelidir.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_14`, type: 'text', x: 40, y: 424, content: '3. BULGULAR', font: 'Merriweather', fontSize: 12, color: '#1a1a2e', bold: true },
        { id: `el_${now}_15`, type: 'text', x: 40, y: 444, content: 'Elde edilen bulgular tablolar, grafikler ve istatistiksel analizlerle desteklenerek sunulur. Her bulgu açıkça ifade edilmeli ve araştırma sorusuyla ilişkilendirilmelidir.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_16`, type: 'text', x: 40, y: 510, content: '4. SONUÇ', font: 'Merriweather', fontSize: 12, color: '#1a1a2e', bold: true },
        { id: `el_${now}_17`, type: 'text', x: 40, y: 530, content: 'Bulguların literatür bağlamında değerlendirilmesi, çalışmanın sınırlılıkları ve gelecek araştırmalar için öneriler bu bölümde yer alır.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_18`, type: 'shape', x: 40, y: 590, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_19`, type: 'text', x: 40, y: 603, content: 'KAYNAKÇA', font: 'Merriweather', fontSize: 10, color: '#1a1a2e', bold: true },
        { id: `el_${now}_20`, type: 'text', x: 40, y: 620, content: '[1] Yazar, A. ve Yazar, B. (2024). Makale Başlığı. Dergi Adı, 12(3), 45–67.\n[2] Yazar, C. (2023). Kitap Adı. Yayınevi.', font: 'Inter', fontSize: 9, color: '#64748b', lineHeight: 1.7 },
      ];
    } else if (templateId === 'creative-brief') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 140, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_2`, type: 'shape', x: 0, y: 0, width: 595, height: 6, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 28, content: 'KREATİF BRIEF', font: 'Montserrat', fontSize: 30, color: '#ffffff', bold: true },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 72, content: 'Proje / Kampanya Adı', font: 'Inter', fontSize: 15, color: '#4ca8ad' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 95, content: `${new Date().toLocaleDateString('tr-TR')}  •  ZET Creative`, font: 'Inter', fontSize: 10, color: '#64748b' },
        { id: `el_${now}_6`, type: 'shape', x: 40, y: 158, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 170, content: 'MARKA / MÜŞTERİ', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 186, content: 'Marka adı, sektör ve temel değerler burada belirtilir.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.6 },
        { id: `el_${now}_9`, type: 'shape', x: 40, y: 215, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 227, content: 'HEDEF & AMAÇ', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 243, content: 'Bu kampanya ile ulaşılmak istenen temel hedef nedir? Başarı nasıl ölçülecek?\n→ Farkındalık artırmak  →  Dönüşüm sağlamak  →  Marka konumlandırma', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.7 },
        { id: `el_${now}_12`, type: 'shape', x: 40, y: 295, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_13`, type: 'text', x: 40, y: 307, content: 'HEDEF KİTLE', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_14`, type: 'shape', x: 40, y: 324, width: 155, height: 75, shapeType: 'square', fill: '#f8fafc' },
        { id: `el_${now}_15`, type: 'text', x: 118, y: 337, content: 'Demografik', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true, textAlign: 'center' },
        { id: `el_${now}_16`, type: 'text', x: 118, y: 352, content: '25–40 yaş\nKentsel', font: 'Inter', fontSize: 10, color: '#334155', textAlign: 'center', lineHeight: 1.5 },
        { id: `el_${now}_17`, type: 'shape', x: 205, y: 324, width: 155, height: 75, shapeType: 'square', fill: '#f8fafc' },
        { id: `el_${now}_18`, type: 'text', x: 283, y: 337, content: 'Psikografik', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true, textAlign: 'center' },
        { id: `el_${now}_19`, type: 'text', x: 283, y: 352, content: 'Teknoloji meraklısı\nKalite odaklı', font: 'Inter', fontSize: 10, color: '#334155', textAlign: 'center', lineHeight: 1.5 },
        { id: `el_${now}_20`, type: 'shape', x: 370, y: 324, width: 155, height: 75, shapeType: 'square', fill: '#f8fafc' },
        { id: `el_${now}_21`, type: 'text', x: 448, y: 337, content: 'Davranışsal', font: 'Montserrat', fontSize: 8, color: '#64748b', bold: true, textAlign: 'center' },
        { id: `el_${now}_22`, type: 'text', x: 448, y: 352, content: 'Dijital aktif\nSosyal medya', font: 'Inter', fontSize: 10, color: '#334155', textAlign: 'center', lineHeight: 1.5 },
        { id: `el_${now}_23`, type: 'shape', x: 40, y: 415, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_24`, type: 'text', x: 40, y: 427, content: 'TEMEL MESAJ', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_25`, type: 'text', x: 40, y: 444, content: '"Tek cümlede iletmek istediğiniz mesaj nedir?"', font: 'Merriweather', fontSize: 12, color: '#1a1a2e', italic: true },
        { id: `el_${now}_26`, type: 'shape', x: 40, y: 475, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_27`, type: 'text', x: 40, y: 487, content: 'TESLİMATLAR', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_28`, type: 'text', x: 40, y: 504, content: '☐ Sosyal medya görselleri (1080×1080, 1920×1080)\n☐ Display banner seti (5 boyut)\n☐ E-posta şablonu\n☐ Landing page tasarımı', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_29`, type: 'shape', x: 40, y: 585, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_30`, type: 'text', x: 40, y: 597, content: 'TERMİN & BÜTÇE', font: 'Montserrat', fontSize: 9, color: '#4ca8ad', bold: true },
        { id: `el_${now}_31`, type: 'text', x: 40, y: 614, content: `Son Teslim: ${new Date(Date.now() + 14*86400000).toLocaleDateString('tr-TR')}     Bütçe: ₺XX,XXX`, font: 'Inter', fontSize: 11, color: '#334155' },
        { id: `el_${now}_32`, type: 'shape', x: 0, y: 822, width: 595, height: 20, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_33`, type: 'text', x: 297, y: 828, content: 'ZET Creative Documents  •  Gizli', font: 'Inter', fontSize: 8, color: '#64748b', textAlign: 'center' },
      ];
    }

    if (elements.length > 0) {
      setCanvasElements(elements);
      history.push(elements);
    }
    setShowTemplates(false);
  };

  // === HEADER/FOOTER ===
  const applyHeaderFooter = () => {
    setDocument(prev => ({ ...prev, header: headerText, footer: footerText, headerFooterMode, headerOdd, headerEven, footerOdd, footerEven }));
    setShowHeaderFooter(false);
  };

  // === PARAGRAPH STYLES ===
  const PARA_STYLES = [
    { id: 'h1', label: 'Başlık 1', fontSize: 32, bold: true, lineHeight: 1.3 },
    { id: 'h2', label: 'Başlık 2', fontSize: 24, bold: true, lineHeight: 1.3 },
    { id: 'h3', label: 'Başlık 3', fontSize: 18, bold: true, lineHeight: 1.4 },
    { id: 'normal', label: 'Normal', fontSize: 14, bold: false, lineHeight: 1.5 },
    { id: 'small', label: 'Küçük', fontSize: 11, bold: false, lineHeight: 1.4 },
    { id: 'caption', label: 'Alt Yazı', fontSize: 10, bold: false, lineHeight: 1.3 },
    { id: 'quote', label: 'Alıntı', fontSize: 14, bold: false, lineHeight: 1.8 },
  ];

  const applyParaStyle = (style) => {
    // Word-like: apply to the block (div/p) at cursor position inside contenteditable
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node = sel.getRangeAt(0).startContainer;
      let n = node.nodeType === 3 ? node.parentElement : node;
      let block = null;
      let inCE = false;
      while (n) {
        if (n.contentEditable === 'true') { inCE = true; break; }
        if (['P','DIV','LI','H1','H2','H3','H4','H5','H6','BLOCKQUOTE'].includes(n.tagName || '')) block = n;
        n = n.parentElement;
      }
      if (inCE && block) {
        block.style.fontSize = style.fontSize + 'px';
        block.style.fontWeight = style.bold ? 'bold' : 'normal';
        block.style.lineHeight = style.lineHeight;
        const ceDiv = block.closest('[contenteditable="true"]');
        if (ceDiv) ceDiv.dispatchEvent(new Event('input', { bubbles: true }));
        return;
      }
    }
    // Fallback: apply to whole canvas element
    const target = selectedElement || lastSelectedRef?.current;
    if (!target) return;
    setCanvasElements(prev => prev.map(el => el.id === target ? { ...el, fontSize: style.fontSize, bold: style.bold, lineHeight: style.lineHeight } : el));
  };

  // === EDIT CHART ===
  const handleEditChart = (el) => {
    const m = el.chartMeta;
    if (!m) return;
    setChartType(m.type || 'bar');
    setChartLabels(m.labels || 'A,B,C,D');
    setChartData(m.data || '10,20,30,40');
    setChartTitle(m.title || 'Chart');
    setChartColors(m.colors?.length ? m.colors : ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']);
    setGradientStart(m.gradientStart || '');
    setGradientEnd(m.gradientEnd || '');
    setChartImage(m.chartImage || null);
    setEditingChartId(el.id);
    setShowGraphic(true);
  };

  // === TEXT WRAP ===
  const handleSetTextWrap = (elementId, wrap) => {
    setCanvasElements(prev => prev.map(el => el.id === elementId ? { ...el, textWrap: wrap } : el));
  };

  // === CONTENT LINK CLICK ===
  const handleLinkClick = ({ type, id, page }) => {
    if (type === 'footnote') {
      const fnEl = canvasElements.find(el => el.footnoteNum === Number(id));
      if (fnEl) {
        const pageIdx = (document?.pages || []).findIndex(p => (p.elements || []).some(e => e.id === fnEl.id));
        if (pageIdx >= 0) changePage(pageIdx);
      }
    } else if (type === 'toc') {
      if (typeof page === 'number') changePage(page);
    }
  };

  // === FIND & REPLACE ===
  const findInDocument = () => {
    if (!findText.trim()) return;
    const results = [];
    const searchElements = (elements, pageLabel) => {
      elements.forEach(el => {
        if (el.type === 'text') {
          const searchIn = el.content || (el.htmlContent ? el.htmlContent.replace(/<[^>]*>/g, '') : '');
          if (searchIn.toLowerCase().includes(findText.toLowerCase())) {
            results.push({ id: el.id, content: pageLabel ? `[${pageLabel}] ${searchIn}` : searchIn });
          }
        }
        if (el.type === 'table' && el.tableData) {
          el.tableData.forEach((row, ri) => row.forEach((cell, ci) => {
            if (cell.toLowerCase().includes(findText.toLowerCase())) {
              results.push({ id: el.id, content: `${pageLabel ? `[${pageLabel}] ` : ''}Table [${ri+1},${ci+1}]: ${cell}` });
            }
          }));
        }
      });
    };
    if (findScope === 'all' && document?.pages) {
      document.pages.forEach((pg, i) => searchElements(pg.elements || [], `S.${i + 1}`));
    } else {
      searchElements(canvasElements, null);
    }
    setFindResults(results);
  };

  const replaceInDocument = () => {
    if (!findText.trim()) return;
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const replaceInList = (elements) => elements.map(el => {
      if (el.type === 'text') {
        const newContent = el.content ? el.content.replace(regex, replaceText) : el.content;
        const newHtml = el.htmlContent ? el.htmlContent.replace(regex, replaceText) : el.htmlContent;
        return { ...el, content: newContent, htmlContent: newHtml };
      }
      if (el.type === 'table' && el.tableData) {
        const newData = el.tableData.map(row => row.map(cell => cell.replace(regex, replaceText)));
        return { ...el, tableData: newData };
      }
      return el;
    });
    if (findScope === 'all' && document?.pages) {
      setDocument(prev => ({ ...prev, pages: prev.pages.map(pg => ({ ...pg, elements: replaceInList(pg.elements || []) })) }));
    } else {
      const updated = replaceInList(canvasElements);
      setCanvasElements(updated); history.push(updated);
    }
    setFindResults([]);
  };

  // === WORD COUNT (all pages) ===
  const getWordCount = () => {
    let total = 0;
    // Count from current page's live elements
    canvasElements.forEach(el => {
      if (el.type === 'text' && el.content) {
        const words = el.content.trim().split(/\s+/).filter(w => w.length > 0);
        total += words.length;
      }
    });
    // Count from other pages stored in document
    if (document?.pages) {
      document.pages.forEach((page, idx) => {
        if (idx === currentPage) return; // already counted above
        (page.elements || []).forEach(el => {
          if (el.type === 'text' && el.content) {
            const words = el.content.trim().split(/\s+/).filter(w => w.length > 0);
            total += words.length;
          }
        });
      });
    }
    return total;
  };

  const getImageCount = () => {
    let total = canvasElements.filter(el => el.type === 'image').length;
    if (document?.pages) {
      document.pages.forEach((page, idx) => {
        if (idx === currentPage) return;
        total += (page.elements || []).filter(el => el.type === 'image').length;
      });
    }
    return total;
  };

  const getEstimatedSize = () => {
    try {
      let bytes = 0;
      const allPages = document?.pages || [];
      allPages.forEach((page, idx) => {
        bytes += 150; // sayfa yapısı: id, pageSize, background, vb.
        const els = idx === currentPage ? canvasElements : (page.elements || []);
        els.forEach(el => {
          bytes += (el.content?.length || 0) + (el.htmlContent?.length || 0)
                 + (el.src?.length || 0) + (el.svgContent?.length || 0) + 200;
        });
      });
      bytes += (document?.title?.length || 0) + 500;
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    } catch { return '—'; }
  };



  // === IMAGE UPLOAD ===
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (changeImageTarget) {
          // Replace image at same position/size
          setCanvasElements(prev => prev.map(el => el.id === changeImageTarget ? { ...el, src: event.target.result } : el));
          setChangeImageTarget(null);
        } else if (uploadForShape) {
          // Check if it's a vector path
          if (uploadForShape.startsWith('vector_')) {
            const vectorIdx = parseInt(uploadForShape.replace('vector_', ''));
            setDrawPaths(prev => prev.map((p, i) => i === vectorIdx ? { ...p, image: event.target.result } : p));
          } else {
            // Regular shape
            setCanvasElements(prev => prev.map(el => el.id === uploadForShape ? { ...el, image: event.target.result } : el));
          }
          setUploadForShape(null);
        } else {
          const maxW = Math.min(300, pageSize.width - 40);
          const ratio = maxW / img.width;
          const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: maxW, height: img.height * ratio, src: event.target.result }];
          setCanvasElements(updated); history.push(updated);
        }
        setShowImageUpload(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Quest completion listener
  useEffect(() => {
    const handler = (e) => { if (e.detail?.length > 0) setQuestNotification(e.detail[0]); };
    window.addEventListener('quest-completed', handler);
    return () => window.removeEventListener('quest-completed', handler);
  }, []);

  // === AI IMAGE ===
  const generateAIImage = async () => {
    if (!aiPrompt.trim()) return;
    
    // Check credits
    const cost = aiImagePro ? 50 : 20;
    if (creditsRemaining < cost) {
      setUpgradeReason(`Bu işlem ${cost} kredi gerektirir. Kalan: ${creditsRemaining} kredi.`);
      setShowUpgradeModal(true);
      return;
    }
    
    setAiGenerating(true); setAiPreview(null);
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, { 
        prompt: aiPrompt, 
        reference_image: aiReference,
        pro: aiImagePro,
        aspect_ratio: aiAspectRatio
      }, { withCredentials: true });
      if (res.data.images?.length > 0) {
        setAiMimeType(res.data.images[0].mime_type || 'image/png');
        setAiPreview(res.data.images[0].data);
        if (res.data.credits_remaining !== undefined) {
          setCreditsRemaining(res.data.credits_remaining);
        }
        axios.post(`${API}/quests/auto-check`, {}, { withCredentials: true }).then(r => {
          if (r.data.newly_pending?.length > 0) window.dispatchEvent(new CustomEvent('quest-completed', { detail: r.data.newly_pending }));
        }).catch(() => {});
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Görsel oluşturulamadı, tekrar deneyin.';
      if (err.response?.status === 429 || err.response?.status === 402) {
        setUpgradeReason(detail);
        setShowUpgradeModal(true);
      } else {
        alert(detail);
      }
    }
    setAiGenerating(false); setAiPrompt('');
  };

  const addAiImageToCanvas = () => {
    if (!aiPreview) return;
    const imgSrc = `data:${aiMimeType};base64,${aiPreview}`;
    
    // If adding to a shape or vector
    if (aiTargetShape) {
      if (aiTargetShape.startsWith('vector_')) {
        const vectorIdx = parseInt(aiTargetShape.replace('vector_', ''));
        setDrawPaths(prev => prev.map((p, i) => i === vectorIdx ? { ...p, image: imgSrc } : p));
      } else {
        setCanvasElements(prev => prev.map(el => el.id === aiTargetShape ? { ...el, image: imgSrc } : el));
      }
      setAiTargetShape(null);
    } else {
      // Add as new image element
      const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: 200, height: 200, src: imgSrc }];
      setCanvasElements(updated); history.push(updated);
    }
    setAiPreview(null);
    setShowCreateImage(false);
  };

  // === WORD TYPE (apply to selected or set default) ===
  const applyTextStyle = (prop, val) => {
    const target = selectedElement || lastSelectedRef.current;
    if (target) {
      setCanvasElements(prev => {
        const updated = prev.map(el => el.id === target ? { ...el, [prop]: val } : el);
        handleSaveHistory(updated);
        return updated;
      });
    }
  };

  const applyHeadingStyle = (fontSize, bold) => {
    const target = selectedElement || lastSelectedRef.current;
    if (target) {
      setCanvasElements(prev => {
        const updated = prev.map(el => el.id === target ? { ...el, fontSize, bold } : el);
        handleSaveHistory(updated);
        return updated;
      });
      setCurrentFontSize(fontSize);
      setIsBold(bold);
    }
  };
  // === INLINE STYLE — applies to selection, cursor (next chars), or whole element ===
  const applyInlineStyle = (type, value) => {
    const saved = savedSelectionRef.current;

    if (saved?.editableDiv?.isContentEditable) {
      const { editableDiv, range, isCollapsed, elementId } = saved;

      // Restore focus + caret/selection
      editableDiv.focus();
      try {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      } catch (_) {}

      if (!isCollapsed) {
        // ── Text is selected: apply to selection only ──
        const selText = window.getSelection()?.toString() || saved.text;
        // Escape HTML entities in selected text for safe insertion
        const esc = (t) => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        switch (type) {
          case 'bold':          window.document.execCommand('bold', false, null); break;
          case 'italic':        window.document.execCommand('italic', false, null); break;
          case 'underline':     window.document.execCommand('underline', false, null); break;
          case 'strikethrough': window.document.execCommand('strikeThrough', false, null); break;
          case 'fontSize':      window.document.execCommand('insertHTML', false, `<span style="font-size:${value}px">${esc(selText)}</span>`); break;
          case 'fontFamily':    window.document.execCommand('insertHTML', false, `<span style="font-family:'${value}'">${esc(selText)}</span>`); break;
          case 'lineHeight':    window.document.execCommand('insertHTML', false, `<span style="line-height:${value}">${esc(selText)}</span>`); break;
          default: break;
        }
      } else {
        // ── Cursor only: set format for next typed characters ──
        switch (type) {
          case 'bold':          window.document.execCommand('bold', false, null); break;
          case 'italic':        window.document.execCommand('italic', false, null); break;
          case 'underline':     window.document.execCommand('underline', false, null); break;
          case 'strikethrough': window.document.execCommand('strikeThrough', false, null); break;
          case 'fontFamily':    window.document.execCommand('fontName', false, value); break;
          case 'fontSize':
          case 'lineHeight': {
            const styleAttr = type === 'fontSize' ? `font-size:${value}px` : `line-height:${value}`;
            window.document.execCommand('insertHTML', false, `<span style="${styleAttr}" data-zet-anchor="1">&#8203;</span>`);
            const anchor = editableDiv.querySelector('[data-zet-anchor="1"]');
            if (anchor) {
              anchor.removeAttribute('data-zet-anchor');
              const r = window.document.createRange();
              const textNode = anchor.firstChild;
              r.setStart(textNode || anchor, textNode ? textNode.length : 0);
              r.collapse(true);
              window.getSelection().removeAllRanges();
              window.getSelection().addRange(r);
            }
            break;
          }
          default:
            applyTextStyle(type, value);
            return;
        }
      }

      // Commit DOM changes → React state
      setTimeout(() => {
        if (!editableDiv.isConnected) return;
        const newHtml = editableDiv.innerHTML;
        setCanvasElements(prev => {
          const updated = prev.map(e => e.id === elementId
            ? { ...e, htmlContent: newHtml, content: newHtml.replace(/<[^>]*>/g, '') }
            : e
          );
          handleSaveHistory(updated);
          return updated;
        });
      }, 0);
      return;
    }

    // Not in editing mode → apply to whole element
    applyTextStyle(type, value);
  };

  const onSaveHistory = handleSaveHistory;

  // === COLOR ===
  const applyColor = (color) => {
    setCurrentColorPersisted(color);
    const targets = selectedElements.length > 0 ? selectedElements : selectedElement ? [selectedElement] : [];
    if (!targets.length) return;
    const isMulti = selectedElements.length > 1;
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (!targets.includes(el.id)) return el;
        if (isMulti && el.type !== colorTarget) return el;
        return { ...el, color, fill: color, gradientStops: null, gradientStart: null, gradientEnd: null, gradientType: null };
      });
      handleSaveHistory(updated);
      return updated;
    });
  };

  const applyGradient = () => {
    const sorted = [...gradientStops].sort((a, b) => a.pos - b.pos);
    const targets = selectedElements.length > 0 ? selectedElements : selectedElement ? [selectedElement] : [];
    if (!targets.length) return;
    const isMulti = selectedElements.length > 1;
    setCanvasElements(prev => {
      const updated = prev.map(el => {
        if (!targets.includes(el.id)) return el;
        if (isMulti && el.type !== colorTarget) return el;
        return { ...el, gradientStops: sorted, gradientAngle, color: null, fill: null };
      });
      handleSaveHistory(updated);
      return updated;
    });
  };

  // === TRANSLATE ===
  const handleTranslate = async () => {
    if (!translateText.trim()) return;
    setTranslateLoading(true);
    try {
      const lang = TRANSLATE_LANGUAGES.find(l => l.code === translateLang);
      const res = await axios.post(`${API}/zeta/translate`, { text: translateText, target_language: lang?.name || translateLang }, { withCredentials: true });
      setTranslateResult(res.data.translated_text);
    } catch { setTranslateResult('Translation error.'); }
    setTranslateLoading(false);
  };

  const applyTranslation = () => {
    if (!translateResult || !translateElementId) return;
    const updated = canvasElements.map(el => el.id === translateElementId ? { ...el, content: translateResult } : el);
    setCanvasElements(updated); history.push(updated);
    setTranslateText(''); setTranslateResult(''); setTranslateElementId(null);
  };

  
  // Get full document content for AI — sansürlü metin Zeta'ya gönderilmez
  const getFullDocContent = () => {
    // redactSegments içindeki tüm orijinal metinleri content'ten çıkar (çift güvence)
    const cleanContent = (el) => {
      let txt = el.content || '';
      if (el.redactSegments && el.redactSegments.length > 0) {
        el.redactSegments.forEach(seg => {
          if (seg.originalText) txt = txt.split(seg.originalText).join('');
        });
      }
      return txt.trim();
    };
    const skip = (el) => el.isRedacted;
    let allElements = [];
    const processEl = (el) => {
      if (skip(el)) return;
      if (el.type === 'text') {
        const c = cleanContent(el);
        if (c) allElements.push(`[METİN]: ${c}`);
      } else if (el.type === 'shape') allElements.push(`[ŞEKİL]: ${el.shapeType} (${Math.round(el.x)}, ${Math.round(el.y)})`);
      else if (el.type === 'image') allElements.push(`[GÖRSEL]: (${Math.round(el.x)}, ${Math.round(el.y)}), ${el.width}x${el.height}`);
      else if (el.type === 'chart') allElements.push(`[GRAFİK]: ${el.chartType || 'grafik'}`);
      else if (el.type === 'table') allElements.push(`[TABLO]: ${el.rows}x${el.cols}`);
      else if (el.type === 'qrcode') allElements.push(`[QR KOD]: ${el.content}`);
    };
    if (document?.pages) {
      document.pages.forEach((page, idx) => {
        const elements = idx === currentPage ? canvasElements : (page.elements || []);
        allElements.push(`--- Sayfa ${idx + 1} ---`);
        elements.forEach(processEl);
      });
    } else {
      canvasElements.forEach(processEl);
    }
    return allElements.join('\n');
  };
  

  // === ELEMENT SELECT ===
  const handleElementSelect = useCallback((el) => {
    if (activeTool === 'translate' && el?.type === 'text') {
      setTranslateText(el.content || ''); setTranslateElementId(el.id); setTranslateResult(''); setShowTranslate(true);
    }
  }, [activeTool]);

  // === COMPUTED ===
  const zetaPendingCount = canvasElements.filter(el => el.isPending || el.isPendingDelete).length;
  const charCount = canvasElements.filter(el => el.type === 'text').reduce((acc, el) => acc + (el.content?.length || 0), 0);
  // Merge system fonts (FONTS) + Google Fonts, deduplicated; selected font always first
  const allFonts = (() => {
    const gf = googleFonts.length > 0 ? googleFonts.map(f => f.family) : [];
    const merged = [...new Set([...FONTS, ...gf])];
    if (currentFont && merged.includes(currentFont) && merged[0] !== currentFont) {
      return [currentFont, ...merged.filter(f => f !== currentFont)];
    }
    return merged;
  })();
  const filteredFonts = allFonts.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  // Preload visible fonts when panel opens or search changes
  useEffect(() => {
    if (showFont) filteredFonts.slice(0, 60).forEach(f => loadGoogleFont(f));
  }, [showFont, fontSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!document) return <A4LoadingScreen bg="var(--zet-bg)" />;

  // ============================
  // FLOATING PANELS (shared between mobile and desktop)
  // ============================
  const floatingPanels = <EditorPanels />;

  // =============================
  // MOBILE LAYOUT
  const providerValue = {
    activeStopId, activeTool, addAiImageToCanvas, addEditedPhotoToCanvas, addSignatureToCanvas, addVoiceTextToDocument,
    aiAspectRatio, aiGenerating, aiImagePro, aiMimeType, aiPreview, aiPrompt, aiReference, aiTargetShape,
    allFonts, applyColor, applyGradient, applyHeaderFooter, applyHeadingStyle, applyInlineStyle, applyListFormat,
    applyParaStyle, applyTemplate, applyTextAlign, applyTranslation, applyWatermark,
    calcCopied, calcExpr, calcResult, canvasElements,
    chartColors, chartData, chartImage, chartLabels, chartTitle, chartType,
    clearSignature, colorTarget, columnCount, columnGap, createChart, createQRCode, createTable, creditsRemaining,
    currentBulletStyle, currentColor, currentFont, currentFontSize, currentLineHeight, currentNumberStyle, currentPage, currentTextAlign,
    customColor, customHeight, customWidth, dailyCredits, deleteElement, deleteSelected, document, drawOpacity, drawSize,
    editingChartId, editingShortcut, elSttLoading, eraserDragMode, eraserSize,
    executePhotoEdit, exportQuality, exporting,
    findInDocument, findResults, findScope, findText, firstLineIndent, fontSearch,
    footerEven, footerOdd, footerText, generateAIImage,
    gradientAngle, gradientBarRef, gradientEnd, gradientStart, gradientStops,
    gridSize, gridVisible, handleExport, handlePhotoEditUpload, handleSaveHistory,
    handleSignatureMouseDown, handleSignatureMouseMove, handleSignatureMouseUp, handleSignaturePhotoUpload, handleTranslate,
    sigPhotoRaw, sigPhotoThreshold, handleSigPhotoThresholdChange,
    headerEven, headerFooterMode, headerOdd, headerText, hexInput, highlighterColor, history,
    importFromMS, indentBottom, indentLeft, indentRight, indentTop, insertEmoji,
    isBold, isDrawingOnPhoto, isItalic, isListening, isMobile, isRecordingEL, isStrikethrough, isUnderline,
    judgeMood, lastSelectedRef, loadGoogleFont,
    magnifierBorderColor, magnifierGradientEnd, magnifierGradientStart,
    marginBottom, marginLeft, marginRight, marginTop, mirrorAngle, mirrorElement, moveLayerDown, moveLayerUp,
    pageBackground, pageNumberFormat, pageNumberPosition, pageNumberStart, pageNumberStyle, pageNumbersEnabled,
    pageSize, pageSizeScope, paragraphSpaceAfter, paragraphSpaceBefore,
    photoEditCanvasRef, photoEditDrawMode, photoEditDrawings, photoEditImage, photoEditLoading, photoEditPrompt, photoEditResult,
    planLimits, qrText, replaceInDocument, replaceText, rotateElement, rulerVisible, selectedElement, selectedElements,
    setActiveStopId, setActiveTool, setAiAspectRatio, setAiImagePro, setAiPreview, setAiPrompt, setAiReference, setAiTargetShape,
    setCalcCopied, setCalcExpr, setCalcResult, setCanvasElements,
    setChartColors, setChartData, setChartImage, setChartLabels, setChartTitle, setChartType,
    setColorTarget, setColumnCount, setColumnGap,
    setCurrentBulletStyle, setCurrentNumberStyle,
    setCurrentColor: setCurrentColorPersisted, setCurrentFont: setCurrentFontPersisted,
    setCurrentFontSize: setCurrentFontSizePersisted, setCurrentLineHeight: setCurrentLineHeightPersisted,
    setCustomColor: setCustomColorPersisted,
    setCustomHeight, setCustomWidth, setDocument, setDrawOpacity, setDrawSize,
    setEditingChartId, setEditingShortcut, setEraserDragMode, setEraserSize, setExportQuality,
    setFindScope, setFindText, setFirstLineIndent: setFirstLineIndentPersisted, setFontSearch,
    setFooterEven, setFooterOdd, setFooterText, setGradientAngle, setGradientEnd, setGradientStart, setGradientStops,
    setGridSize, setGridVisible, setHeaderEven, setHeaderFooterMode, setHeaderOdd, setHeaderText,
    setHexInput, setHighlighterColor,
    setIndentBottom, setIndentLeft, setIndentRight, setIndentTop,
    setIsBold, setIsDrawingOnPhoto, setIsItalic, setIsStrikethrough, setIsUnderline,
    setJudgeMood, setMagnifierBorderColor, setMagnifierGradientEnd, setMagnifierGradientStart,
    screenplayMode, setScreenplayMode, handleScriptElementChange,
    showSceneNavigator, setShowSceneNavigator,
    setMarginBottom, setMarginLeft, setMarginRight, setMarginTop, setMirrorAngle, setPageBackground,
    setPageNumberFormat, setPageNumberPosition, setPageNumberStart, setPageNumberStyle, setPageSize, setPageSizeScope,
    setParagraphSpaceAfter: setParagraphSpaceAfterPersisted, setParagraphSpaceBefore: setParagraphSpaceBeforePersisted,
    setPhotoEditDrawMode, setPhotoEditDrawings, setPhotoEditImage, setPhotoEditPrompt, setPhotoEditResult,
    setQrText, setReplaceText, setRulerVisible, setSelectedElement, setShortcutSearch,
    setShowBulletList, setShowCalculator, setShowChatSettings, setShowColor, setShowColumns, setShowCreateImage,
    setShowDraw, setShowEmoji, setShowEraser, setShowExport, setShowFindReplace, setShowFont, setShowFootnote,
    setShowGraphic, setShowGrid, setShowHeaderFooter, setShowIndent, setShowLayers, setShowLineSpacing,
    setShowMargins, setShowMirror, setShowNumberedList, setShowPageColor, setShowPageNumbers, setShowPageSize,
    setShowParagraph, setShowPhotoEdit, setShowPunctuation, setShowQRCode, setShowRuler, setShowShapes,
    setShowShortcuts, setShowSignature, setShowStyles, setShowTOC, setShowTable, setShowTemplates,
    setShowTextSize, setShowTranslate, setShowUpgradeModal, setShowVoiceInput, setShowWatermark, setShowWordType, setShowZoom,
    setSnapToGrid, setSpellCheckEnabled, setTableCols, setTableRows, setTranslateLang, setTranslateText,
    setUpgradeReason, setUseMagnifierGradient, setVoiceTranscript,
    setWatermarkColor, setWatermarkOpacity, setWatermarkText, setZetaCustomPrompt, setZetaEmoji, setZetaMood,
    setZoomLevel, setZoomRadius,
    shortcutSearch, shortcuts,
    showBulletList, showCalculator, showChatSettings, showColor, showColumns, showCreateImage,
    showDraw, showEmoji, showEraser, showExport, showFindReplace, showFont, showFootnote,
    showGraphic, showGrid, showHeaderFooter, showIndent, showLayers, showLineSpacing,
    showMargins, showMirror, showNumberedList, showPageColor, showPageNumbers, showPageSize,
    showParagraph, showPhotoEdit, showPunctuation, showQRCode, showRuler, showShapes,
    showShortcuts, showSignature, showStyles, showTOC, showTable, showTemplates,
    showTextSize, showTranslate, showVoiceInput, showWatermark, showWordType, showZoom,
    signatureCanvasRef, signatureData, snapToGrid, spellCheckEnabled,
    spellErrors, tanıList, spellPopup, setSpellPopup, addToTanı, applySpellCorrection, handleSpellWordClick,
    startElevenLabsSTT, startListening, stopElevenLabsSTT, stopListening,
    tableCols, tableRows, toggleLayerLock, toggleLayerVisibility, togglePageNumbers,
    translateElementId, translateLang, translateLoading, translateResult, translateText,
    updatePageNumberSettings, updateShortcut, useMagnifierGradient, voiceTranscript,
    watermarkColor, watermarkOpacity, watermarkText,
    zetaCustomPrompt, zetaEmoji, zetaMood, zoomLevel, zoomRadius,
    zetaEditMode, setZetaEditMode, zetaEditInput, setZetaEditInput,
    zetaEditLoading, zetaEditExplanation, zetaPendingCount,
    zetaEditSuggestions, setZetaEditSuggestions,
    applyZetaDocEdit, approveZetaOps, rejectZetaOps,
    addPage, alignElements, audioRef, availableVoices,
    buyingCredits, canvasContainerRef, changePage, changeImageTarget, collab, collabEnabled, setCollabEnabled,
    copyElementById, creditPackages, deletePage, docId, drawPaths, setDrawPaths,
    exportToPDF, fastSelectTools, fetchCreditPackages, fetchVoices,
    generateTTS, getEstimatedSize, getFullDocContent, getImageCount, getLockedTools, getToolLockReason, getWordCount,
    groupElements, ungroupElements,
    handleAddAiImageToShape, handleAddImageToShape, handleAutoWriteContent, handleBuyCredits,
    handleChangeImage, handleEditChart, handleElementSelect, handleImageUpload,
    handleInsertText, handleLinkClick, handleRedo, handleSetTextWrap,
    handleTextFlow, handleToolSelect, handleUndo, handleUpdateSettings, handleZetaTakeNote,
    importPDF, importFromMS, isOnline, isFreeOffline, isPlaying,
    leftWidth, setLeftWidth, magnifierPos, setMagnifierPos,
    mirrorElementById, mobilePanel, setMobilePanel,
    navigate, pdfImporting, pdfInputRef, playVoiceFrom, refreshCredits,
    rightOpen, setRightOpen, rightWidth, setRightWidth,
    isReadOnly, saveDocument, saveStatus, saving,
    selectedElements, setSelectedElements,
    selectedVoice, setSelectedVoice,
    setChangeImageTarget, setIsPlaying, setShowCreditModal, setShowImageUpload, setShowShareDialog, setShowVoice,
    setTtsAudio, setUploadForShape, setZoom,
    showComments, setShowComments, showCreditModal, showImageUpload, showShareDialog, showUpgradeModal, showVoice,
    showVersionHistory, setShowVersionHistory,
    skipVoice, stopVoice,
    toolboxOpen, setToolboxOpen, upgradeReason, uploadForShape,
    useGradient, userPlan, userUsage, voiceLoading, voiceProgress, zoom,
    showLink, setShowLink, linkUrl, setLinkUrl, linkText, setLinkText, addLinkToCanvas,
  };
  // =============================
  // Hidden textarea — mobile long-press "Paste" focus target (inputMode="none" → no virtual keyboard)
  const hiddenPasteInput = (
    <textarea
      ref={hiddenPasteRef}
      inputMode="none"
      aria-hidden="true"
      readOnly={false}
      style={{ position: 'fixed', top: -999, left: -999, width: 1, height: 1, opacity: 0, border: 'none', resize: 'none', outline: 'none', padding: 0, margin: 0, overflow: 'hidden' }}
    />
  );

  if (isMobile) {
    return (
      <EditorStateContext.Provider value={providerValue}>
      {hiddenPasteInput}
      <EditorMobileLayout />
      <QuestNotification quest={questNotification} onClose={() => setQuestNotification(null)} />
      {exportCountdown && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', borderRadius: 16, padding: '32px 36px', width: 300, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(76,168,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3v10m0 0l-3.5-3.5M11 13l3.5-3.5M4 16v1.5A1.5 1.5 0 005.5 19h11a1.5 1.5 0 001.5-1.5V16" stroke="var(--zet-primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--zet-text)', marginBottom: 10 }}>Dışa aktarma hazırlanıyor</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--zet-primary)', lineHeight: 1, marginBottom: 2 }}>{exportCountdown.remaining}</div>
            <div style={{ fontSize: 11, color: 'var(--zet-text-muted)', marginBottom: 20 }}>saniye kaldı</div>
            <div style={{ height: 6, borderRadius: 99, background: 'var(--zet-border)', overflow: 'hidden', marginBottom: 18 }}>
              <div style={{ height: '100%', borderRadius: 99, background: 'var(--zet-primary)', width: `${((exportCountdown.totalDelay - exportCountdown.remaining) / exportCountdown.totalDelay) * 100}%`, transition: 'width 0.95s linear' }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--zet-text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
              {userPlan === 'free' ? 'Free plan · Pro\'ya geçerek anında export yapabilirsiniz' : 'Plus plan · Pro\'ya geçerek anında export yapabilirsiniz'}
            </div>
            <button onClick={() => setExportCountdown(null)} style={{ fontSize: 12, color: 'var(--zet-text-muted)', background: 'none', border: '1px solid var(--zet-border)', borderRadius: 8, padding: '6px 20px', cursor: 'pointer' }}>
              İptal
            </button>
          </div>
        </div>
      )}
      </EditorStateContext.Provider>
    );
  }

  // =============================
  // DESKTOP LAYOUT
  // =============================
  return (
    <EditorStateContext.Provider value={providerValue}>
    {hiddenPasteInput}
    <EditorDesktopLayout />
    <QuestNotification quest={questNotification} onClose={() => setQuestNotification(null)} />
    {exportCountdown && (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)', borderRadius: 16, padding: '32px 36px', width: 320, textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(76,168,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 3v10m0 0l-3.5-3.5M11 13l3.5-3.5M4 16v1.5A1.5 1.5 0 005.5 19h11a1.5 1.5 0 001.5-1.5V16" stroke="var(--zet-primary)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--zet-text)', marginBottom: 10 }}>Dışa aktarma hazırlanıyor</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--zet-primary)', lineHeight: 1, marginBottom: 2 }}>{exportCountdown.remaining}</div>
          <div style={{ fontSize: 11, color: 'var(--zet-text-muted)', marginBottom: 20 }}>saniye kaldı</div>
          <div style={{ height: 6, borderRadius: 99, background: 'var(--zet-border)', overflow: 'hidden', marginBottom: 18 }}>
            <div style={{ height: '100%', borderRadius: 99, background: 'var(--zet-primary)', width: `${((exportCountdown.totalDelay - exportCountdown.remaining) / exportCountdown.totalDelay) * 100}%`, transition: 'width 0.95s linear' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--zet-text-muted)', marginBottom: 18, lineHeight: 1.5 }}>
            {userPlan === 'free' ? 'Free plan · Pro\'ya geçerek anında export yapabilirsiniz' : 'Plus plan · Pro\'ya geçerek anında export yapabilirsiniz'}
          </div>
          <button onClick={() => setExportCountdown(null)} style={{ fontSize: 12, color: 'var(--zet-text-muted)', background: 'none', border: '1px solid var(--zet-border)', borderRadius: 8, padding: '6px 20px', cursor: 'pointer' }}>
            İptal
          </button>
        </div>
      </div>
    )}
    </EditorStateContext.Provider>
  );
};

class EditorErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  componentDidCatch(err, info) { console.error('Editor crash:', err, info); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f0f1a', color: '#ef4444', padding: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Editör çöktü</div>
          <pre style={{ background: '#1a1a2e', color: '#fca5a5', padding: 16, borderRadius: 8, fontSize: 12, maxWidth: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{String(this.state.error)}</pre>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => window.location.reload()} style={{ padding: '8px 24px', background: '#4ca8ad', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Yenile</button>
            <button onClick={() => { try { navigator.clipboard.writeText(String(this.state.error)); } catch {} }} style={{ padding: '8px 24px', background: '#374151', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Hatayı Kopyala</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const EditorWithBoundary = () => (
  <EditorErrorBoundary>
    <Editor />
  </EditorErrorBoundary>
);

export default EditorWithBoundary;
