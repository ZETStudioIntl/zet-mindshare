import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { TOOLS, PAGE_SIZES, FONTS, PRESET_COLORS, TRANSLATE_LANGUAGES, LINE_SPACINGS, TEXT_ALIGNMENTS, CHART_TYPES, TEMPLATES, DEFAULT_SHORTCUTS, DEFAULT_PAGE_SIZE, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR, DEFAULT_ZOOM } from '../lib/editorConstants';
import { Toolbox } from '../components/editor/Toolbox';
import { CanvasArea } from '../components/editor/CanvasArea';
import { RightPanel } from '../components/editor/RightPanel';
import { DraggablePanel } from '../components/editor/DraggablePanel';
import axios from 'axios';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import {
  Home, Save, Undo, Redo, ArrowLeft, ArrowRight,
  Upload, Search, Loader2, X, Wand2, Plus, Check,
  Play, Pause, SkipBack, SkipForward, Volume2, Languages,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  Menu, Layers, Sparkles, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ZoomIn, ZoomOut, Download, Settings, Keyboard, Eye, EyeOff, Lock, Unlock,
  ChevronUp, ChevronDown, Trash2, Table, Grid3X3, Ruler, Zap, Mic, FlipHorizontal2, ImagePlus, Pencil, Crown
} from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, PointElement, LineElement, Title, Tooltip, Legend);

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  // Mobile detection
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Mobile panels
  const [mobilePanel, setMobilePanel] = useState(null); // 'pages' | 'zeta' | null

  // Document state
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [saving, setSaving] = useState(false);

  // Tool state
  const [activeTool, setActiveTool] = useState('text');
  const [toolboxOpen, setToolboxOpen] = useState(true);

  // Canvas element state
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [selectedElements, setSelectedElements] = useState([]);
  const [drawPaths, setDrawPaths] = useState([]);

  // View state
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  // Text/style state
  const [currentFontSize, setCurrentFontSize] = useState(DEFAULT_FONT_SIZE);
  const [currentFont, setCurrentFont] = useState(DEFAULT_FONT);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [customColor, setCustomColor] = useState(DEFAULT_COLOR);
  const [fontSearch, setFontSearch] = useState('');
  const [customWidth, setCustomWidth] = useState(DEFAULT_PAGE_SIZE.width);
  const [customHeight, setCustomHeight] = useState(DEFAULT_PAGE_SIZE.height);
  const [currentLineHeight, setCurrentLineHeight] = useState(1.5);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  // Drawing state
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [eraserSize, setEraserSize] = useState(15);
  const [eraserDragMode, setEraserDragMode] = useState(true);

  // Marking state
  const [markingColor, setMarkingColor] = useState('#FFFF00');
  const [markingOpacity, setMarkingOpacity] = useState(40);
  const [markingSize, setMarkingSize] = useState(20);

  // Highlighter auto mode
  const [highlighterAuto, setHighlighterAuto] = useState(false);
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const voiceTextRef = useRef('');
  const voiceCharIndexRef = useRef(0);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('21m00Tcm4TlvDq8ikWAM'); // Rachel (female)
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [ttsAudio, setTtsAudio] = useState(null);
  const audioRef = useRef(null);

  // Panel visibility
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showCreateImage, setShowCreateImage] = useState(false);
  const [showEraser, setShowEraser] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showLineSpacing, setShowLineSpacing] = useState(false);
  const [showWordType, setShowWordType] = useState(false);
  const [showMarking, setShowMarking] = useState(false);
  const [showParagraph, setShowParagraph] = useState(false);
  const [showGraphic, setShowGraphic] = useState(false);
  const [showPageColor, setShowPageColor] = useState(false);
  const [showZoom, setShowZoom] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showPhotoEdit, setShowPhotoEdit] = useState(false);
  const [showSignature, setShowSignature] = useState(false);
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
  const [signatureData, setSignatureData] = useState(null);
  const signatureCanvasRef = useRef(null);
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [signaturePoints, setSignaturePoints] = useState([]);

  // Page background color
  const [pageBackground, setPageBackground] = useState('#ffffff');

  // Text alignment
  const [currentTextAlign, setCurrentTextAlign] = useState('left');
  
  // Gradient colors for text
  const [gradientStart, setGradientStart] = useState(null);
  const [gradientEnd, setGradientEnd] = useState(null);
  const [useGradient, setUseGradient] = useState(false);
  const [hexInput, setHexInput] = useState('#000000');

  // Zoom tool state
  const [zoomLevel, setZoomLevel] = useState(1.5);
  const [zoomRadius, setZoomRadius] = useState(50);
  const [magnifierPos, setMagnifierPos] = useState(null);

  // Graphic chart state
  const [chartType, setChartType] = useState('bar');
  const [chartLabels, setChartLabels] = useState('A,B,C,D');
  const [chartData, setChartData] = useState('10,20,30,40');
  const [chartTitle, setChartTitle] = useState('Chart');
  const [chartColors, setChartColors] = useState(['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899']);
  const [chartImage, setChartImage] = useState(null);

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
    return saved ? JSON.parse(saved) : ['text', 'hand', 'draw', 'image'];
  });

  // Usage & Subscription state
  const [userUsage, setUserUsage] = useState(null);
  const [userPlan, setUserPlan] = useState('free');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState('');
  const [creditsRemaining, setCreditsRemaining] = useState(0);
  const [dailyCredits, setDailyCredits] = useState(20);
  const [planLimits, setPlanLimits] = useState({});
  const [creditCosts, setCreditCosts] = useState({});
  const [aiImagePro, setAiImagePro] = useState(false);
  const [aiAspectRatio, setAiAspectRatio] = useState('16:9');

  // Export state
  const [exporting, setExporting] = useState(false);

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
  const [showChatSettings, setShowChatSettings] = useState(false);

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

  // Page numbers state
  const [pageNumbersEnabled, setPageNumbersEnabled] = useState(false);
  const [pageNumberPosition, setPageNumberPosition] = useState('bottom-center');

  // Export format and quality state
  const [exportFormat, setExportFormat] = useState('pdf');
  const [exportQuality, setExportQuality] = useState('high');

  // Header/Footer state
  const [headerText, setHeaderText] = useState('');
  const [footerText, setFooterText] = useState('');

  // Copy/Paste state
  const [clipboard, setClipboard] = useState(null);

  // Mirror state
  const [showMirror, setShowMirror] = useState(false);
  const [mirrorAngle, setMirrorAngle] = useState(0);

  // Voice Input (STT) state
  const [showVoiceInput, setShowVoiceInput] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const recognitionRef = useRef(null);
  // Find & Replace state
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [findResults, setFindResults] = useState([]);

  // History
  const history = useCanvasHistory(canvasElements);
  const autoSaveTimerRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // === Ctrl+Z / Ctrl+Y / Delete / Shortcuts ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const isEditing = tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true';
      
      // Always handle Ctrl+Z/Y
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); return; }
      
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
      
      // Tool shortcuts (single key)
      const key = e.key.toUpperCase();
      if (shortcuts[key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        handleToolSelect(shortcuts[key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // === DATA LOADING ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocument(); }, [docId]);

  // Fetch user usage and plan
  useEffect(() => {
    const fetchUsage = async () => {
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
    fetchUsage();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (document?.pages?.[currentPage]) {
      const page = document.pages[currentPage];
      setCanvasElements(page.elements || []);
      setDrawPaths(page.drawPaths || []);
      history.reset(page.elements || []);
      if (page.pageSize) setPageSize(page.pageSize);
    } else { setCanvasElements([]); setDrawPaths([]); }
    setSelectedElement(null); setSelectedElements([]);
  }, [document, currentPage]);

  // === AUTO-SAVE (elements + drawPaths) ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (document) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => saveDocument(true), 2000);
    }
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [canvasElements, drawPaths]);

  const fetchDocument = async () => {
    try { const res = await axios.get(`${API}/documents/${docId}`, { withCredentials: true }); setDocument(res.data); }
    catch { navigate('/dashboard'); }
  };

  const saveDocument = async (silent = false) => {
    if (!document) return;
    if (!silent) setSaving(true);
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
    }
    try {
      await axios.put(`${API}/documents/${docId}`, { title: document.title, content: document.content, pages: updatedPages }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
    } catch {} finally { if (!silent) setSaving(false); }
  };

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
    setDocument(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
    setTimeout(() => changePage(document.pages.length), 100);
  };

  const handleAutoWriteContent = (pages, pageCount) => {
    if (!pages || pages.length === 0) return;
    setDocument(prev => {
      const updatedPages = [...(prev.pages || [])];
      pages.forEach((pageContent, idx) => {
        const cleanText = pageContent.replace(/\*\*(.*?)\*\*/g, '$1').trim();
        const textEl = {
          id: `auto_${Date.now()}_${idx}`,
          type: 'text',
          x: 50,
          y: 50,
          content: cleanText,
          fontFamily: 'Open Sans',
          fontSize: 11,
          color: '#222222',
          lineHeight: 1.6,
        };
        if (idx === 0 && updatedPages[currentPage]) {
          // Add to current page's elements
          updatedPages[currentPage] = {
            ...updatedPages[currentPage],
            elements: [...(updatedPages[currentPage].elements || []), textEl],
          };
        } else {
          // Create new page
          updatedPages.push({
            page_id: `page_auto_${Date.now()}_${idx}`,
            elements: [textEl],
            drawPaths: [],
            pageSize,
          });
        }
      });
      return { ...prev, pages: updatedPages };
    });
  };

  const deletePage = (index) => {
    if (document.pages.length <= 1) return;
    setDocument(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    if (currentPage >= index && currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // === HISTORY ===
  const handleSaveHistory = useCallback((elements) => { history.push(elements); }, [history]);
  const handleUndo = () => { const prev = history.undo(); if (prev) setCanvasElements(prev); };
  const handleRedo = () => { const next = history.redo(); if (next) setCanvasElements(next); };

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
  const [aiTargetShape, setAiTargetShape] = useState(null);
  
  const handleAddAiImageToShape = useCallback((id) => {
    setAiTargetShape(id);
    setShowCreateImage(true);
  }, []);

  // === LOCKED TOOLS (based on plan) ===
  const getLockedTools = () => {
    const locked = [];
    if (!planLimits.layers) locked.push('layers');
    if (!planLimits.signature) locked.push('signature');
    if (!planLimits.watermark) locked.push('watermark');
    if (!planLimits.page_color) locked.push('pagecolor');
    if (!planLimits.charts) locked.push('graphic');
    return locked;
  };
  
  const getToolLockReason = (toolId) => {
    const names = { layers: 'Katmanlar', signature: 'Dijital İmza', watermark: 'Filigran', pagecolor: 'Sayfa Rengi', graphic: 'Grafikler' };
    return `${names[toolId] || toolId} aracı mevcut planınızda kullanılamaz. Lütfen planınızı yükseltin.`;
  };

  // === TOOL SELECT ===
  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    const panels = {
      image: () => setShowImageUpload(true), pagesize: () => setShowPageSize(true),
      textsize: () => setShowTextSize(true), font: () => { setFontSearch(''); setShowFont(true); },
      voice: () => setShowVoice(true), color: () => setShowColor(true),
      draw: () => setShowDraw(true), createimage: () => setShowCreateImage(true),
      eraser: () => setShowEraser(true), translate: () => setShowTranslate(true),
      linespacing: () => setShowLineSpacing(true), wordtype: () => setShowWordType(true),
      marking: () => setShowMarking(true), addpage: () => addPage(),
      paragraph: () => setShowParagraph(true), graphic: () => setShowGraphic(true),
      pagecolor: () => setShowPageColor(true),
      table: () => setShowTable(true), layers: () => setShowLayers(true),
      ruler: () => { setRulerVisible(!rulerVisible); setShowRuler(true); },
      grid: () => { setGridVisible(!gridVisible); setShowGrid(true); },
      templates: () => setShowTemplates(true), qrcode: () => setShowQRCode(true),
      watermark: () => setShowWatermark(true), pagenumbers: () => setShowPageNumbers(true),
      headerfooter: () => setShowHeaderFooter(true), findreplace: () => setShowFindReplace(true),
      copy: () => copyElement(), 
      mirror: () => setShowMirror(true),
      voiceinput: () => setShowVoiceInput(true),
      export: () => setShowExport(true),
      photoedit: () => setShowPhotoEdit(true),
      signature: () => setShowSignature(true),
      indent: () => setShowIndent(true),
      margins: () => setShowMargins(true),
      redact: () => applyRedaction(),
      highlighter: () => applyHighlight(),
      importpdf: () => pdfInputRef.current?.click(),
    };
    if (panels[toolId]) panels[toolId]();
  };

  // === HIGHLIGHTER Tool (like Redact - applies to selected text) ===
  const applyHighlight = useCallback(() => {
    if (!selectedElement) {
      alert('Lütfen önce işaretlemek istediğiniz metni seçin!');
      return;
    }
    const el = canvasElements.find(e => e.id === selectedElement);
    if (!el || el.type !== 'text') {
      alert('Sadece metin elementleri işaretlenebilir!');
      return;
    }
    const updated = canvasElements.map(e => 
      e.id === selectedElement 
        ? { ...e, highlightColor: highlighterColor }
        : e
    );
    setCanvasElements(updated);
    history.push(updated);
  }, [selectedElement, canvasElements, highlighterColor]);

  // === REDACT (Security) Tool ===
  const applyRedaction = useCallback(() => {
    if (!selectedElement) {
      alert('Lütfen önce sansürlemek istediğiniz metni seçin!');
      return;
    }
    const el = canvasElements.find(e => e.id === selectedElement);
    if (!el || el.type !== 'text') {
      alert('Sadece metin elementleri sansürlenebilir!');
      return;
    }
    // Apply redaction - replace with black bar
    const updated = canvasElements.map(e => 
      e.id === selectedElement 
        ? { ...e, isRedacted: true, originalContent: e.content, color: '#000000', background: '#000000' }
        : e
    );
    setCanvasElements(updated);
    history.push(updated);
  }, [canvasElements, selectedElement, history]);

  // === PHOTO EDIT ===
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
    }
    setPhotoEditLoading(false);
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
    if (selectedElement) {
      const updated = canvasElements.map(el => el.id === selectedElement ? { ...el, textAlign: align } : el);
      setCanvasElements(updated); history.push(updated);
    }
  };

  // === EXPORT PDF ===
  const exportToPDF = async () => {
    if (!canvasContainerRef.current) return;
    setExporting(true);
    try {
      const canvas = await html2canvas(canvasContainerRef.current.querySelector('[data-testid="canvas-page-0"]') || canvasContainerRef.current, { scale: 2, useCORS: true, backgroundColor: pageBackground });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: pageSize.width > pageSize.height ? 'l' : 'p', unit: 'px', format: [pageSize.width, pageSize.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, pageSize.width, pageSize.height);
      pdf.save(`${document.title || 'document'}.pdf`);
    } catch (err) { console.error('Export failed:', err); }
    setExporting(false);
    setShowExport(false);
  };

  // Export to PNG/JPEG
  const exportToImage = async (format = 'png') => {
    if (!canvasContainerRef.current) return;
    setExporting(true);
    try {
      const scale = exportQuality === 'high' ? 3 : exportQuality === 'medium' ? 2 : 1;
      const canvas = await html2canvas(canvasContainerRef.current.querySelector('[data-testid="canvas-page-0"]') || canvasContainerRef.current, { scale, useCORS: true, backgroundColor: pageBackground });
      const imgData = canvas.toDataURL(`image/${format}`, format === 'jpeg' ? 0.92 : undefined);
      const link = window.document.createElement('a');
      link.download = `${document.title || 'document'}.${format}`;
      link.href = imgData;
      link.click();
    } catch (err) { console.error('Export failed:', err); }
    setExporting(false);
    setShowExport(false);
  };

  // Export to SVG
  const exportToSVG = () => {
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${pageSize.width}" height="${pageSize.height}" viewBox="0 0 ${pageSize.width} ${pageSize.height}">
  <rect width="100%" height="100%" fill="${pageBackground}"/>
  ${canvasElements.map(el => {
    if (el.type === 'text') {
      return `<text x="${el.x}" y="${el.y + (el.fontSize || 16)}" font-family="${el.font || 'Arial'}" font-size="${el.fontSize || 16}" fill="${el.color || '#000'}" ${el.bold ? 'font-weight="bold"' : ''} ${el.italic ? 'font-style="italic"' : ''}>${el.content || ''}</text>`;
    } else if (el.type === 'shape') {
      if (el.shapeType === 'circle') return `<circle cx="${el.x + el.width/2}" cy="${el.y + el.height/2}" r="${Math.min(el.width, el.height)/2}" fill="${el.fill || '#000'}"/>`;
      if (el.shapeType === 'square') return `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" fill="${el.fill || '#000'}"/>`;
      if (el.shapeType === 'triangle') return `<polygon points="${el.x + el.width/2},${el.y} ${el.x},${el.y + el.height} ${el.x + el.width},${el.y + el.height}" fill="${el.fill || '#000'}"/>`;
    } else if (el.type === 'image' && el.src) {
      return `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}"/>`;
    }
    return '';
  }).join('\n  ')}
  ${drawPaths.map(p => {
    if (!p.points || p.points.length < 2) return '';
    const d = p.points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`).join(' ');
    return `<path d="${d}" stroke="${p.color || '#000'}" stroke-width="${p.size || 2}" fill="none" opacity="${(p.opacity || 100) / 100}"/>`;
  }).join('\n  ')}
</svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.download = `${document.title || 'document'}.svg`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
    setShowExport(false);
  };

  // Export to JSON (project file)
  const exportToJSON = () => {
    const projectData = {
      version: '1.0',
      title: document.title,
      pageSize,
      pageBackground,
      canvasElements,
      drawPaths,
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

  // === SIGNATURE ===
  const clearSignature = () => {
    setSignaturePoints([]);
    setSignatureData(null);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleSignatureMouseDown = (e) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setIsDrawingSignature(true);
    setSignaturePoints([{ x, y }]);
  };

  const handleSignatureMouseMove = (e) => {
    if (!isDrawingSignature) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newPoints = [...signaturePoints, { x, y }];
    setSignaturePoints(newPoints);
    
    // Draw on canvas
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = currentColor || '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (signaturePoints.length > 0) {
      const lastPoint = signaturePoints[signaturePoints.length - 1];
      ctx.moveTo(lastPoint.x, lastPoint.y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handleSignatureMouseUp = () => {
    setIsDrawingSignature(false);
    // Save signature as data URL
    const canvas = signatureCanvasRef.current;
    if (canvas && signaturePoints.length > 2) {
      setSignatureData(canvas.toDataURL('image/png'));
    }
  };

  const addSignatureToCanvas = () => {
    if (!signatureData) return;
    const newEl = {
      id: `el_${Date.now()}`,
      type: 'image',
      x: 100,
      y: 100,
      width: 200,
      height: 80,
      src: signatureData
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    handleSaveHistory(updated);
    setShowSignature(false);
    clearSignature();
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

  // Import PDF
  const [pdfImporting, setPdfImporting] = useState(false);
  const pdfInputRef = useRef(null);
  const importPDF = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) { alert('Lütfen bir PDF dosyası seçin'); return; }
    setPdfImporting(true);
    try {
      const pdfjsLib = await import('pdfjs-dist/build/pdf');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
      const arrayBuf = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;
      const newElements = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = window.document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport }).promise;
        const imgSrc = canvas.toDataURL('image/png');
        newElements.push({
          id: `el_pdf_${Date.now()}_${i}`,
          type: 'image',
          x: 20,
          y: 20 + (i - 1) * (pageSize.height - 40),
          width: Math.min(pageSize.width - 40, viewport.width),
          height: Math.min(pageSize.height - 40, viewport.height * ((pageSize.width - 40) / viewport.width)),
          src: imgSrc,
        });
        // Add new pages if needed
        if (i > 1 && document.pages && i > document.pages.length) {
          setDocument(prev => ({
            ...prev,
            pages: [...(prev.pages || []), { page_id: `page_${Date.now()}_${i}`, elements: [], drawPaths: [] }]
          }));
        }
      }
      const updated = [...canvasElements, ...newElements];
      setCanvasElements(updated);
      history.push(updated);
      alert(`PDF başarıyla içe aktarıldı! (${pdf.numPages} sayfa)`);
    } catch (err) {
      console.error('PDF import failed:', err);
      alert('PDF içe aktarma başarısız: ' + err.message);
    }
    setPdfImporting(false);
  };

  // Export handler
  const handleExport = (format) => {
    setExportFormat(format);
    if (format === 'pdf') exportToPDF();
    else if (format === 'png') exportToImage('png');
    else if (format === 'jpeg') exportToImage('jpeg');
    else if (format === 'svg') exportToSVG();
    else if (format === 'json') exportToJSON();
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
        svg += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${la} 1 ${x2},${y2} Z" fill="${fill(i)}" stroke="white" stroke-width="2"/>`;
        // Label on slice
        const mid = sa + angle / 2;
        const lx = cx + (r * 0.65) * Math.cos(mid);
        const ly = cy + (r * 0.65) * Math.sin(mid);
        const pct = Math.round((data[i] / total) * 100);
        if (pct >= 5) svg += `<text x="${lx}" y="${ly + 4}" text-anchor="middle" font-size="9" fill="white" font-weight="600">${pct}%</text>`;
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
      svg += `<path d="${area}" fill="${lc}" opacity="0.1"/>`;
      svg += `<path d="${line}" stroke="${lc}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      labels.forEach((label, i) => {
        const x = pad.left + i * sp;
        const y = pad.top + ch - (data[i] / maxVal) * ch;
        svg += `<circle cx="${x}" cy="${y}" r="4" fill="white" stroke="${lc}" stroke-width="2"/>`;
        svg += `<text x="${x}" y="${y - 8}" text-anchor="middle" font-size="9" fill="#374151" font-weight="500">${data[i]}</text>`;
      });
    }
    
    svg += '</svg>';
    const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svg)));
    const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'chart', x: 50, y: 50, width, height, src: imgSrc, gradientStart, gradientEnd }];
    setCanvasElements(updated); history.push(updated);
    setShowGraphic(false);
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
    localStorage.setItem('zet_shortcuts', JSON.stringify(newShortcuts));
    setEditingShortcut(null);
  };

  // === TABLE CREATION ===
  const createTable = () => {
    const cellWidth = 80;
    const cellHeight = 30;
    const tableWidth = tableCols * cellWidth;
    const tableHeight = tableRows * cellHeight;
    
    // Create table as SVG
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tableWidth}" height="${tableHeight}">`;
    for (let r = 0; r < tableRows; r++) {
      for (let c = 0; c < tableCols; c++) {
        svg += `<rect x="${c * cellWidth}" y="${r * cellHeight}" width="${cellWidth}" height="${cellHeight}" fill="white" stroke="#333" stroke-width="1"/>`;
      }
    }
    svg += '</svg>';
    
    const imgSrc = 'data:image/svg+xml;base64,' + btoa(svg);
    const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'table', x: 50, y: 50, width: tableWidth, height: tableHeight, src: imgSrc, rows: tableRows, cols: tableCols }];
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

  // === WATERMARK ===
  const applyWatermark = () => {
    if (!watermarkText.trim()) return;
    const wm = { id: `wm_${Date.now()}`, type: 'watermark', text: watermarkText, opacity: watermarkOpacity };
    setDocument(prev => ({ ...prev, watermark: wm }));
    setShowWatermark(false);
  };

  // === PAGE NUMBERS ===
  const togglePageNumbers = () => {
    setPageNumbersEnabled(!pageNumbersEnabled);
    setDocument(prev => ({ ...prev, pageNumbers: { enabled: !pageNumbersEnabled, position: pageNumberPosition } }));
  };

  // === TEMPLATES ===
  const applyTemplate = (templateId) => {
    let elements = [];
    const now = Date.now();
    
    if (templateId === 'cv') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 40, y: 40, content: 'YOUR NAME', font: 'Montserrat', fontSize: 32, color: '#1a1a2e', bold: true, textAlign: 'left' },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 85, content: 'Professional Title', font: 'Open Sans', fontSize: 16, color: '#666666', textAlign: 'left' },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 130, content: 'CONTACT', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 155, content: 'email@example.com | +90 555 000 00 00 | Istanbul, Turkey', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 200, content: 'EXPERIENCE', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 225, content: 'Job Title - Company Name', font: 'Open Sans', fontSize: 12, color: '#333333', bold: true },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 245, content: '2020 - Present', font: 'Open Sans', fontSize: 10, color: '#888888' },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 265, content: '• Responsible for key projects and deliverables\n• Led team of 5 developers\n• Increased efficiency by 30%', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 340, content: 'EDUCATION', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 365, content: 'Bachelor of Science in Computer Engineering', font: 'Open Sans', fontSize: 12, color: '#333333' },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 385, content: 'University Name - 2016-2020', font: 'Open Sans', fontSize: 10, color: '#888888' },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 420, content: 'SKILLS', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_13`, type: 'text', x: 40, y: 445, content: 'JavaScript, React, Node.js, Python, SQL, Git, Agile', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_14`, type: 'shape', x: 0, y: 0, width: 8, height: 842, shapeType: 'square', fill: '#1a1a2e' },
      ];
    } else if (templateId === 'report') {
      elements = [
        { id: `el_${now}_1`, type: 'text', x: 180, y: 100, content: 'ANNUAL REPORT', font: 'Montserrat', fontSize: 36, color: '#1a1a2e', bold: true, textAlign: 'center' },
        { id: `el_${now}_2`, type: 'text', x: 180, y: 150, content: '2024', font: 'Open Sans', fontSize: 24, color: '#666666', textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 180, y: 250, content: 'Company Name', font: 'Montserrat', fontSize: 18, color: '#333333', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'shape', x: 150, y: 200, width: 295, height: 3, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 350, content: 'Executive Summary', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 380, content: 'This report provides a comprehensive overview of our company\'s performance, achievements, and strategic initiatives throughout the fiscal year.', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 450, content: 'Key Highlights', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 480, content: '• Revenue growth of 25% year-over-year\n• Expanded to 3 new markets\n• Launched 5 innovative products\n• Employee satisfaction increased to 92%', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
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
        { id: `el_${now}_1`, type: 'text', x: 40, y: 40, content: 'INVOICE', font: 'Montserrat', fontSize: 36, color: '#1a1a2e', bold: true },
        { id: `el_${now}_2`, type: 'text', x: 400, y: 40, content: '#INV-001', font: 'Open Sans', fontSize: 14, color: '#666666' },
        { id: `el_${now}_3`, type: 'text', x: 400, y: 60, content: new Date().toLocaleDateString(), font: 'Open Sans', fontSize: 11, color: '#888888' },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 100, content: 'From:', font: 'Open Sans', fontSize: 10, color: '#888888' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 115, content: 'Your Company Name\n123 Street, City\nPhone: +90 555 000 00 00', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
        { id: `el_${now}_6`, type: 'text', x: 300, y: 100, content: 'Bill To:', font: 'Open Sans', fontSize: 10, color: '#888888' },
        { id: `el_${now}_7`, type: 'text', x: 300, y: 115, content: 'Client Name\nClient Address\nClient City', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.5 },
        { id: `el_${now}_8`, type: 'shape', x: 40, y: 200, width: 515, height: 30, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_9`, type: 'text', x: 50, y: 207, content: 'Description', font: 'Montserrat', fontSize: 11, color: '#ffffff', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 300, y: 207, content: 'Qty', font: 'Montserrat', fontSize: 11, color: '#ffffff', bold: true },
        { id: `el_${now}_11`, type: 'text', x: 380, y: 207, content: 'Price', font: 'Montserrat', fontSize: 11, color: '#ffffff', bold: true },
        { id: `el_${now}_12`, type: 'text', x: 480, y: 207, content: 'Total', font: 'Montserrat', fontSize: 11, color: '#ffffff', bold: true },
        { id: `el_${now}_13`, type: 'text', x: 50, y: 245, content: 'Service/Product 1', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_14`, type: 'text', x: 300, y: 245, content: '2', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_15`, type: 'text', x: 380, y: 245, content: '$500', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_16`, type: 'text', x: 480, y: 245, content: '$1,000', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_17`, type: 'shape', x: 40, y: 270, width: 515, height: 1, shapeType: 'square', fill: '#eeeeee' },
        { id: `el_${now}_18`, type: 'text', x: 380, y: 320, content: 'Subtotal:', font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_19`, type: 'text', x: 480, y: 320, content: '$1,000', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_20`, type: 'text', x: 380, y: 345, content: 'Tax (18%):', font: 'Open Sans', fontSize: 11, color: '#666666' },
        { id: `el_${now}_21`, type: 'text', x: 480, y: 345, content: '$180', font: 'Open Sans', fontSize: 11, color: '#444444' },
        { id: `el_${now}_22`, type: 'text', x: 380, y: 375, content: 'TOTAL:', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_23`, type: 'text', x: 480, y: 375, content: '$1,180', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
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
        { id: `el_${now}_9`, type: 'text', x: 40, y: 350, content: 'Kararlar', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 375, content: '•\n•\n•', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 440, content: 'Aksiyon Maddeleri', font: 'Montserrat', fontSize: 14, color: '#1a1a2e', bold: true },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 465, content: '| Görev | Sorumlu | Tarih |\n|-------|---------|-------|\n|       |         |       |', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
      ];
    } else if (templateId === 'proposal') {
      elements = [
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 200, shapeType: 'square', fill: '#1a1a2e' },
        { id: `el_${now}_2`, type: 'text', x: 297, y: 60, content: 'PROJE TEKLİFİ', font: 'Montserrat', fontSize: 36, color: '#ffffff', bold: true, textAlign: 'center' },
        { id: `el_${now}_3`, type: 'text', x: 297, y: 110, content: 'Şirket Adı', font: 'Open Sans', fontSize: 16, color: '#4ca8ad', textAlign: 'center' },
        { id: `el_${now}_4`, type: 'text', x: 297, y: 140, content: new Date().toLocaleDateString('tr-TR'), font: 'Open Sans', fontSize: 12, color: '#aaaaaa', textAlign: 'center' },
        { id: `el_${now}_5`, type: 'text', x: 40, y: 230, content: 'Yönetici Özeti', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 260, content: 'Bu teklif, projenin kapsamını, hedeflerini ve bütçesini özetlemektedir.', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.6 },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 310, content: 'Proje Kapsamı', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 340, content: '• Hedef 1: ...\n• Hedef 2: ...\n• Hedef 3: ...', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_9`, type: 'text', x: 40, y: 420, content: 'Zaman Çizelgesi', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_10`, type: 'text', x: 40, y: 450, content: 'Faz 1: Planlama (2 hafta)\nFaz 2: Geliştirme (6 hafta)\nFaz 3: Test & Lansman (2 hafta)', font: 'Open Sans', fontSize: 11, color: '#444444', lineHeight: 1.8 },
        { id: `el_${now}_11`, type: 'text', x: 40, y: 540, content: 'Bütçe', font: 'Montserrat', fontSize: 16, color: '#1a1a2e', bold: true },
        { id: `el_${now}_12`, type: 'text', x: 40, y: 570, content: 'Toplam Proje Maliyeti: ₺XX,XXX', font: 'Open Sans', fontSize: 14, color: '#1a1a2e', bold: true },
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
        { id: `el_${now}_12`, type: 'text', x: 40, y: 555, content: '#marka #dijitalpazarlama #sosyalmedya\n#icerikuretimi #pazarlama #girisimci', font: 'Open Sans', fontSize: 11, color: '#94a3b8', lineHeight: 1.6 },
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
    }
    
    if (elements.length > 0) {
      setCanvasElements(elements);
      history.push(elements);
    }
    setShowTemplates(false);
  };

  // === HEADER/FOOTER ===
  const applyHeaderFooter = () => {
    setDocument(prev => ({ ...prev, header: headerText, footer: footerText }));
    setShowHeaderFooter(false);
  };

  // === FIND & REPLACE ===
  const findInDocument = () => {
    if (!findText.trim()) return;
    const results = [];
    canvasElements.forEach(el => {
      if (el.type === 'text' && el.content?.toLowerCase().includes(findText.toLowerCase())) {
        results.push({ id: el.id, content: el.content });
      }
    });
    setFindResults(results);
  };

  const replaceInDocument = () => {
    if (!findText.trim()) return;
    const updated = canvasElements.map(el => {
      if (el.type === 'text' && el.content) {
        return { ...el, content: el.content.replace(new RegExp(findText, 'gi'), replaceText) };
      }
      return el;
    });
    setCanvasElements(updated); history.push(updated);
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

  // === LAYERS MANAGEMENT ===
  const moveLayerUp = (id) => {
    const idx = canvasElements.findIndex(el => el.id === id);
    if (idx < canvasElements.length - 1) {
      const updated = [...canvasElements];
      [updated[idx], updated[idx + 1]] = [updated[idx + 1], updated[idx]];
      setCanvasElements(updated); history.push(updated);
    }
  };

  const moveLayerDown = (id) => {
    const idx = canvasElements.findIndex(el => el.id === id);
    if (idx > 0) {
      const updated = [...canvasElements];
      [updated[idx], updated[idx - 1]] = [updated[idx - 1], updated[idx]];
      setCanvasElements(updated); history.push(updated);
    }
  };

  const toggleLayerVisibility = (id) => {
    const updated = canvasElements.map(el => el.id === id ? { ...el, hidden: !el.hidden } : el);
    setCanvasElements(updated);
  };

  const toggleLayerLock = (id) => {
    const updated = canvasElements.map(el => el.id === id ? { ...el, locked: !el.locked } : el);
    setCanvasElements(updated);
  };

  // === COPY / PASTE ===
  const copyElement = () => {
    if (selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el) setClipboard({ ...el, id: null }); // Remove id for new copy
    }
  };

  const pasteElement = () => {
    if (clipboard) {
      const newEl = { 
        ...clipboard, 
        id: `el_${Date.now()}`, 
        x: (clipboard.x || 0) + 20, 
        y: (clipboard.y || 0) + 20 
      };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated);
      history.push(updated);
      setSelectedElement(newEl.id);
    }
  };

  // === MIRROR ===
  const mirrorElement = (axis) => {
    if (!selectedElement) return;
    const updated = canvasElements.map(el => {
      if (el.id === selectedElement) {
        const currentScaleX = el.scaleX || 1;
        const currentScaleY = el.scaleY || 1;
        if (axis === 'horizontal') {
          return { ...el, scaleX: currentScaleX * -1 };
        } else if (axis === 'vertical') {
          return { ...el, scaleY: currentScaleY * -1 };
        }
      }
      return el;
    });
    setCanvasElements(updated);
    history.push(updated);
  };

  const rotateElement = (angle) => {
    if (!selectedElement) return;
    const updated = canvasElements.map(el => {
      if (el.id === selectedElement) {
        return { ...el, rotation: (el.rotation || 0) + angle };
      }
      return el;
    });
    setCanvasElements(updated);
    history.push(updated);
  };

  // Copy element by ID (for context menu)
  const copyElementById = (id) => {
    const el = canvasElements.find(e => e.id === id);
    if (el) {
      setClipboard({ ...el, id: null });
      // Also paste immediately
      const newEl = { ...el, id: `el_${Date.now()}`, x: (el.x || 0) + 20, y: (el.y || 0) + 20 };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated);
      history.push(updated);
      setSelectedElement(newEl.id);
    }
  };

  // Mirror element by ID (for context menu)
  const mirrorElementById = (id) => {
    setSelectedElement(id);
    setShowMirror(true);
  };

  // === VOICE INPUT (STT) ===
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Your browser does not support Speech Recognition. Please use Chrome.');
      return;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = language === 'tr' ? 'tr-TR' : 'en-US';

    recognitionRef.current.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setVoiceTranscript(transcript);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const addVoiceTextToDocument = () => {
    if (!voiceTranscript.trim()) return;
    const newEl = {
      id: `el_${Date.now()}`,
      type: 'text',
      x: 40,
      y: 40 + canvasElements.filter(e => e.type === 'text').length * 30,
      content: voiceTranscript,
      font: currentFont,
      fontSize: currentFontSize,
      color: currentColor,
      bold: false,
      italic: false,
      underline: false,
      strikethrough: false,
      textAlign: 'left',
      lineHeight: 1.5,
    };
    const updated = [...canvasElements, newEl];
    setCanvasElements(updated);
    history.push(updated);
    setVoiceTranscript('');
    setShowVoiceInput(false);
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
        // Update credits
        if (res.data.credits_remaining !== undefined) {
          setCreditsRemaining(res.data.credits_remaining);
        }
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setUpgradeReason(err.response.data?.detail || 'Yetersiz kredi!');
        setShowUpgradeModal(true);
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
    if (selectedElement) {
      const updated = canvasElements.map(el => el.id === selectedElement ? { ...el, [prop]: val } : el);
      setCanvasElements(updated); onSaveHistory(updated);
    }
  };
  const onSaveHistory = handleSaveHistory;

  // === COLOR ===
  const applyColor = (color) => {
    setCurrentColor(color);
    if (selectedElements.length > 0) setCanvasElements(prev => prev.map(el => selectedElements.includes(el.id) ? { ...el, color, fill: color } : el));
    else if (selectedElement) setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, color, fill: color } : el));
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

  // === VOICE ===
  const getDocText = () => canvasElements.filter(el => el.type === 'text' && !el.isRedacted).sort((a, b) => a.y - b.y).map(el => el.content).join('. ');
  
  // Get full document content for ZETA (includes all element types, EXCLUDES redacted content)
  const getFullDocContent = () => {
    const elements = canvasElements.map(el => {
      if (el.isRedacted) return `[REDACTED]`;
      if (el.type === 'text') return `[TEXT]: ${el.content}`;
      if (el.type === 'shape') return `[SHAPE]: ${el.shapeType} at (${Math.round(el.x)}, ${Math.round(el.y)})`;
      if (el.type === 'image') return `[IMAGE]: at (${Math.round(el.x)}, ${Math.round(el.y)}), size: ${el.width}x${el.height}`;
      if (el.type === 'chart') return `[CHART]: ${el.chartType || 'chart'} at (${Math.round(el.x)}, ${Math.round(el.y)})`;
      if (el.type === 'table') return `[TABLE]: ${el.rows}x${el.cols} at (${Math.round(el.x)}, ${Math.round(el.y)})`;
      if (el.type === 'qrcode') return `[QR CODE]: ${el.content} at (${Math.round(el.x)}, ${Math.round(el.y)})`;
      return `[${el.type?.toUpperCase() || 'ELEMENT'}]`;
    });
    const vectors = drawPaths.map((p, i) => `[VECTOR ${i + 1}]: ${p.points?.length || 0} points, color: ${p.color}`);
    return [...elements, ...vectors].join('\n');
  };
  
  // Fetch available ElevenLabs voices
  const fetchVoices = async () => {
    try {
      const res = await axios.get(`${API}/voice/list`, { withCredentials: true });
      setAvailableVoices(res.data.voices || []);
    } catch (err) {
      console.error('Failed to fetch voices:', err);
    }
  };
  
  // Generate TTS with ElevenLabs
  const generateTTS = async () => {
    const text = getDocText();
    if (!text) return;
    
    setVoiceLoading(true);
    try {
      const res = await axios.post(`${API}/voice/tts`, {
        text: text,
        voice_id: selectedVoice,
        model_id: 'eleven_multilingual_v2'
      }, { withCredentials: true });
      
      setTtsAudio(res.data.audio_url);
      
      // Play the audio
      if (audioRef.current) {
        audioRef.current.src = res.data.audio_url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error('TTS generation failed:', err);
      // Fallback to browser TTS
      playVoiceFromBrowser();
    }
    setVoiceLoading(false);
  };
  
  // Browser TTS fallback
  const playVoiceFromBrowser = (startFraction = 0) => {
    window.speechSynthesis.cancel();
    const fullText = getDocText(); if (!fullText) return;
    voiceTextRef.current = fullText;
    const startIndex = Math.floor(startFraction * fullText.length);
    const utterance = new SpeechSynthesisUtterance(fullText.substring(startIndex));
    voiceCharIndexRef.current = startIndex;
    utterance.onboundary = (ev) => { voiceCharIndexRef.current = startIndex + ev.charIndex; setVoiceProgress(((startIndex + ev.charIndex) / fullText.length) * 100); };
    utterance.onend = () => { setIsPlaying(false); setVoiceProgress(100); };
    setIsPlaying(true); window.speechSynthesis.speak(utterance);
  };
  
  const playVoiceFrom = (startFraction = 0) => {
    // If we have TTS audio from ElevenLabs, use that
    if (ttsAudio && audioRef.current) {
      audioRef.current.currentTime = audioRef.current.duration * startFraction;
      audioRef.current.play();
      setIsPlaying(true);
    } else {
      // Otherwise use browser TTS
      playVoiceFromBrowser(startFraction);
    }
  };
  
  const skipVoice = (dir) => {
    if (ttsAudio && audioRef.current) {
      const skip = audioRef.current.duration * 0.1;
      audioRef.current.currentTime = dir === 'back' 
        ? Math.max(0, audioRef.current.currentTime - skip) 
        : Math.min(audioRef.current.duration, audioRef.current.currentTime + skip);
    } else {
      const fullText = voiceTextRef.current || getDocText(); if (!fullText) return;
      const skip = Math.floor(fullText.length * 0.1);
      const newIndex = dir === 'back' ? Math.max(0, voiceCharIndexRef.current - skip) : Math.min(fullText.length, voiceCharIndexRef.current + skip);
      playVoiceFromBrowser(newIndex / fullText.length);
    }
  };
  
  const stopVoice = () => {
    window.speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setVoiceProgress(0);
  };

  // === ELEMENT SELECT ===
  const handleElementSelect = useCallback((el) => {
    if (activeTool === 'translate' && el?.type === 'text') {
      setTranslateText(el.content || ''); setTranslateElementId(el.id); setTranslateResult(''); setShowTranslate(true);
    }
  }, [activeTool]);

  // === COMPUTED ===
  const charCount = canvasElements.filter(el => el.type === 'text').reduce((acc, el) => acc + (el.content?.length || 0), 0);
  const filteredFonts = FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  if (!document) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--zet-primary)' }} /></div>;
  }

  // ============================
  // FLOATING PANELS (shared between mobile and desktop)
  // ============================
  const floatingPanels = (<>
    {showDraw && <DraggablePanel title={t('pencil')} onClose={() => setShowDraw(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="space-y-3 w-48">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {drawSize}px</label><input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {drawOpacity}%</label><input type="range" min="10" max="100" value={drawOpacity} onChange={e => setDrawOpacity(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex gap-1.5 flex-wrap">{PRESET_COLORS.slice(0, 8).map(c => <button key={c} onClick={() => setCurrentColor(c)} className={`w-6 h-6 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />)}</div>
      </div>
    </DraggablePanel>}
    {showEraser && <DraggablePanel title={t('eraser')} onClose={() => setShowEraser(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="space-y-3 w-48">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={eraserDragMode} onChange={e => setEraserDragMode(e.target.checked)} className="rounded" />
          Drag Mode (Sürükle)
        </label>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {eraserSize}px</label><input type="range" min="5" max="50" value={eraserSize} onChange={e => setEraserSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex items-center justify-center p-3 rounded" style={{ background: 'var(--zet-bg)' }}><div className="rounded-full border-2 border-dashed" style={{ width: eraserSize * 2, height: eraserSize * 2, borderColor: 'var(--zet-primary-light)' }} /></div>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{eraserDragMode ? 'Çizerek sil' : 'Tıklayarak sil'}</p>
      </div>
    </DraggablePanel>}
    {showMarking && <DraggablePanel title={t('marking')} onClose={() => setShowMarking(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="space-y-3 w-48">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {markingSize}px</label><input type="range" min="8" max="40" value={markingSize} onChange={e => setMarkingSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {markingOpacity}%</label><input type="range" min="10" max="80" value={markingOpacity} onChange={e => setMarkingOpacity(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex gap-1.5 flex-wrap">
          {['#FFFF00', '#FF6600', '#00FF66', '#FF00FF', '#00FFFF', '#FF0066'].map(c => <button key={c} onClick={() => setMarkingColor(c)} className={`w-6 h-6 rounded-md border ${markingColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />)}
        </div>
      </div>
    </DraggablePanel>}
    {showColor && <DraggablePanel title={t('colorPicker')} onClose={() => setShowColor(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 150 }}>
      <div className="space-y-3 w-64">
        <div className="grid grid-cols-6 gap-1.5">{PRESET_COLORS.map(c => <button key={c} onClick={() => { applyColor(c); setHexInput(c); }} className={`w-7 h-7 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />)}</div>
        <div className="space-y-2">
          <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Hex Code</label>
          <div className="flex gap-2">
            <input type="text" value={hexInput} onChange={e => setHexInput(e.target.value)} placeholder="#000000" className="zet-input flex-1 text-xs font-mono" maxLength={7} />
            <button onClick={() => { if (/^#[0-9A-Fa-f]{6}$/.test(hexInput)) applyColor(hexInput); }} className="zet-btn px-2 text-xs">Apply</button>
          </div>
        </div>
        
        {/* Gradient Presets */}
        <div className="space-y-2">
          <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Gradient Presets</label>
          <div className="grid grid-cols-3 gap-1">
            {GRADIENT_PRESETS.map(g => (
              <button 
                key={g.name} 
                onClick={() => { setGradientStart(g.start); setGradientEnd(g.end); setUseGradient(true); }}
                className="h-8 rounded text-xs text-white font-medium shadow-sm hover:scale-105 transition-transform"
                style={{ background: `linear-gradient(90deg, ${g.start}, ${g.end})` }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--zet-text-muted)' }}>
            <input type="checkbox" checked={useGradient} onChange={e => setUseGradient(e.target.checked)} className="rounded" />
            Gradient (Text & Shapes)
          </label>
          {useGradient && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Start</label>
                  <input type="color" value={gradientStart || '#FF0000'} onChange={e => setGradientStart(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                </div>
                <div className="flex-1">
                  <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>End</label>
                  <input type="color" value={gradientEnd || '#0000FF'} onChange={e => setGradientEnd(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
                </div>
              </div>
              {/* Preview */}
              <div className="h-6 rounded" style={{ background: `linear-gradient(90deg, ${gradientStart || '#FF0000'}, ${gradientEnd || '#0000FF'})` }} />
            </div>
          )}
          {useGradient && gradientStart && gradientEnd && (
            <button onClick={() => {
              if (selectedElement) {
                const updated = canvasElements.map(el => el.id === selectedElement ? { ...el, gradientStart, gradientEnd, color: null } : el);
                setCanvasElements(updated); 
                handleSaveHistory(updated);
              } else if (selectedElements.length > 0) {
                const updated = canvasElements.map(el => selectedElements.includes(el.id) ? { ...el, gradientStart, gradientEnd, color: null } : el);
                setCanvasElements(updated);
                handleSaveHistory(updated);
              } else {
                alert('Lütfen önce bir öğe seçin');
              }
            }} className="zet-btn w-full text-xs">Apply Gradient to Selected</button>
          )}
        </div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Custom Picker</label><input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColor(e.target.value); setHexInput(e.target.value); }} className="w-full h-8 rounded cursor-pointer" /></div>
      </div>
    </DraggablePanel>}
    {showTextSize && <DraggablePanel title={t('textSize')} onClose={() => setShowTextSize(false)} initialPosition={{ x: isMobile ? 20 : 370, y: 100 }}>
      <div className="space-y-3 w-48"><input type="range" min="8" max="72" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="w-full accent-blue-500" />
        <div className="flex items-center gap-2"><input type="number" min="8" max="100" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="zet-input w-16 text-center text-sm" /><span className="text-sm" style={{ color: 'var(--zet-text)' }}>pt</span></div>
        <div className="p-2 rounded text-center" style={{ background: 'var(--zet-bg)' }}><span style={{ fontSize: Math.min(currentFontSize, 36), color: 'var(--zet-text)', fontFamily: currentFont }}>Aa</span></div>
      </div>
    </DraggablePanel>}
    {showFont && <DraggablePanel title={t('font')} onClose={() => setShowFont(false)} initialPosition={{ x: isMobile ? 20 : 420, y: 100 }}>
      <div className="w-56"><div className="relative mb-2"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} /><input placeholder={t('search')} value={fontSearch} onChange={e => setFontSearch(e.target.value)} className="zet-input pl-7 text-xs w-full" /></div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">{filteredFonts.map(f => <button key={f} onClick={() => { setCurrentFont(f); setShowFont(false); }} className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${currentFont === f ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentFont === f ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: f }}>{f}</button>)}</div>
      </div>
    </DraggablePanel>}
    {showLineSpacing && <DraggablePanel title={t('lineSpacing')} onClose={() => setShowLineSpacing(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-2 w-48">
        {LINE_SPACINGS.map(s => <button key={s} onClick={() => { setCurrentLineHeight(s); if (selectedElement) applyTextStyle('lineHeight', s); setShowLineSpacing(false); }}
          className={`w-full p-2 rounded text-left text-sm transition-colors ${currentLineHeight === s ? 'glow-sm' : 'hover:bg-white/5'}`}
          style={{ background: currentLineHeight === s ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s}x</button>)}
      </div>
    </DraggablePanel>}
    {showWordType && <DraggablePanel title={t('wordType')} onClose={() => setShowWordType(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-2 w-52">
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="toggle-bold" onClick={() => { setIsBold(!isBold); applyTextStyle('bold', !isBold); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isBold ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isBold ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Bold className="h-4 w-4" /> Bold</button>
          <button data-testid="toggle-italic" onClick={() => { setIsItalic(!isItalic); applyTextStyle('italic', !isItalic); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isItalic ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isItalic ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Italic className="h-4 w-4" /> Italic</button>
          <button data-testid="toggle-underline" onClick={() => { setIsUnderline(!isUnderline); applyTextStyle('underline', !isUnderline); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isUnderline ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isUnderline ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Underline className="h-4 w-4" /> Underline</button>
          <button data-testid="toggle-strikethrough" onClick={() => { setIsStrikethrough(!isStrikethrough); applyTextStyle('strikethrough', !isStrikethrough); }} className={`flex items-center gap-2 p-2.5 rounded text-sm transition-colors ${isStrikethrough ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: isStrikethrough ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}><Strikethrough className="h-4 w-4" /> Strike</button>
        </div>
        {/* Highlighter Section */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <span className="text-xs font-medium flex items-center gap-1.5 mb-2" style={{ color: 'var(--zet-text)' }}><Highlighter className="h-3.5 w-3.5" /> Highlighter Rengi</span>
          <div className="flex items-center gap-1">
            {['#FFFF00', '#00FF00', '#00FFFF', '#FF69B4', '#FFA500', '#FF0000'].map(c => (
              <button key={c} onClick={() => {
                setHighlighterColor(c);
              }} className={`w-6 h-6 rounded transition-all ${highlighterColor === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ background: c }} data-testid={`highlight-color-${c}`} />
            ))}
            <button onClick={() => {
              if (selectedElement) { applyTextStyle('highlightColor', null); }
            }} className="w-6 h-6 rounded flex items-center justify-center text-xs" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }} data-testid="highlight-remove" title="Kaldır">
              <X className="h-3 w-3" />
            </button>
          </div>
          <p className="text-xs mt-1.5" style={{ color: 'var(--zet-text-muted)' }}>Metin seçin, araç çubuğundan Highlighter'a tıklayın</p>
        </div>
      </div>
    </DraggablePanel>}
    {showPageSize && <DraggablePanel title={t('pageSize')} onClose={() => setShowPageSize(false)} initialPosition={{ x: isMobile ? 20 : 320, y: 200 }}>
      <div className="space-y-2 w-48">{PAGE_SIZES.map(s => <button key={s.name} onClick={() => { setPageSize(s); setShowPageSize(false); }} className={`w-full p-2 rounded text-left text-sm transition-colors ${pageSize.name === s.name ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: pageSize.name === s.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s.name} <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.width}x{s.height}</span></button>)}
        <div className="flex gap-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}><input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="W" /><input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="H" /></div>
        <button onClick={() => { setPageSize({ name: 'Custom', width: customWidth, height: customHeight }); setShowPageSize(false); }} className="zet-btn w-full text-sm">Apply</button>
      </div>
    </DraggablePanel>}
    {showCreateImage && <DraggablePanel title={aiTargetShape ? "AI Image (Shape)" : "AI Image"} onClose={() => { setShowCreateImage(false); setAiPreview(null); setAiTargetShape(null); }} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-72 space-y-3">
        {/* Credits info */}
        <div className="text-xs px-2 py-1.5 rounded flex items-center justify-between" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
          <span style={{ color: 'var(--zet-text-muted)' }}>Kalan Kredi:</span>
          <span style={{ color: creditsRemaining > 0 ? '#22c55e' : '#ef4444' }}>{creditsRemaining} / {dailyCredits}</span>
        </div>
        {/* Pro toggle */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--zet-text)' }}>Nano Banana Pro</span>
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: aiImagePro ? '#f59e0b' : 'var(--zet-border)', color: aiImagePro ? '#fff' : 'var(--zet-text-muted)' }}>{aiImagePro ? '50 kredi' : '20 kredi'}</span>
          </div>
          <button data-testid="ai-pro-toggle" onClick={() => { if (!planLimits.nano_pro) { setUpgradeReason('Nano Banana Pro, Pro veya Ultra planda kullanılabilir.'); setShowUpgradeModal(true); } else { setAiImagePro(!aiImagePro); } }} className={`w-10 h-5 rounded-full transition-colors ${aiImagePro ? '' : ''}`} style={{ background: aiImagePro ? '#f59e0b' : 'var(--zet-border)' }}>
            <div className={`w-4 h-4 rounded-full bg-white transition-transform ${aiImagePro ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
        {/* Aspect ratio */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Boyut</label>
          <div className="flex flex-wrap gap-1">
            {(planLimits.custom_image_sizes || ['16:9']).map(ratio => (
              <button key={ratio} onClick={() => setAiAspectRatio(ratio)} className={`text-xs px-2 py-1 rounded transition-colors ${aiAspectRatio === ratio ? 'font-semibold' : ''}`} style={{ background: aiAspectRatio === ratio ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)', border: `1px solid ${aiAspectRatio === ratio ? 'var(--zet-primary)' : 'var(--zet-border)'}` }} data-testid={`ai-ratio-${ratio.replace(/[:.]/g, '-')}`}>
                {ratio}
              </button>
            ))}
          </div>
        </div>
        {aiTargetShape && <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>Adding to: {aiTargetShape.startsWith('vector_') ? 'Vector Shape' : 'Shape'}</div>}
        <div><label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference</label><label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2"><Upload className="h-3 w-3" />{aiReference ? 'Loaded' : 'Upload'}<input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); } }} className="hidden" /></label></div>
        {aiPreview && <div className="space-y-2"><img data-testid="ai-image-preview" src={`data:${aiMimeType};base64,${aiPreview}`} alt="AI" className="w-full rounded border" style={{ borderColor: 'var(--zet-border)', maxHeight: 200, objectFit: 'contain' }} /><button data-testid="ai-image-add-btn" onClick={addAiImageToCanvas} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2"><Plus className="h-4 w-4" /> {aiTargetShape ? 'Add to Shape' : 'Add to Document'}</button></div>}
        <div className="flex gap-1"><input data-testid="ai-image-prompt" placeholder="Görseli tanımlayın..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" /><button data-testid="ai-image-generate-btn" onClick={generateAIImage} disabled={aiGenerating || creditsRemaining < (aiImagePro ? 50 : 20)} className="zet-btn px-2">{aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}</button></div>
        {creditsRemaining < (aiImagePro ? 50 : 20) && <p className="text-xs text-center" style={{ color: '#ef4444' }}>Yetersiz kredi! Bu işlem {aiImagePro ? 50 : 20} kredi gerektirir.</p>}
        {/* Photo Edit Shortcut */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <button 
            onClick={() => { setShowCreateImage(false); setShowPhotoEdit(true); }}
            className="zet-btn w-full flex items-center justify-center gap-2 py-2 text-xs"
          >
            <ImagePlus className="h-4 w-4" /> {t('photoEdit') || 'Edit Existing Photo'}
          </button>
        </div>
      </div>
    </DraggablePanel>}
    {showTranslate && <DraggablePanel title={t('translate')} onClose={() => setShowTranslate(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 120 }}>
      <div className="w-72 space-y-3">
        <textarea data-testid="translate-source-text" value={translateText} onChange={e => setTranslateText(e.target.value)} rows={3} className="zet-input text-xs w-full resize-none" placeholder="Select text or type here..." />
        <select data-testid="translate-lang-select" value={translateLang} onChange={e => setTranslateLang(e.target.value)} className="zet-input text-sm w-full">{TRANSLATE_LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}</select>
        <button data-testid="translate-btn" onClick={handleTranslate} disabled={translateLoading || !translateText.trim()} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2">{translateLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />} {t('translate')}</button>
        {translateResult && <div className="space-y-2"><div className="p-2 rounded text-sm" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>{translateResult}</div>
          {translateElementId && <button data-testid="translate-apply-btn" onClick={applyTranslation} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2" style={{ background: '#4ca8ad' }}><Check className="h-4 w-4" /> Add</button>}
        </div>}
      </div>
    </DraggablePanel>}
    
    {/* Paragraph Alignment Panel */}
    {showParagraph && <DraggablePanel title="Paragraph" onClose={() => setShowParagraph(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-2 w-52">
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => applyTextAlign('left')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'left' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'left' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignLeft className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
          <button onClick={() => applyTextAlign('center')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'center' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'center' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignCenter className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
          <button onClick={() => applyTextAlign('right')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'right' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'right' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignRight className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
          <button onClick={() => applyTextAlign('justify')} className={`p-2.5 rounded flex items-center justify-center ${currentTextAlign === 'justify' ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: currentTextAlign === 'justify' ? 'var(--zet-primary)' : 'var(--zet-bg)' }}><AlignJustify className="h-4 w-4" style={{ color: 'var(--zet-text)' }} /></button>
        </div>
      </div>
    </DraggablePanel>}

    {/* Page Color Panel */}
    {showPageColor && <DraggablePanel title="Page Color" onClose={() => setShowPageColor(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-3 w-52">
        <div className="grid grid-cols-6 gap-1.5">
          {['#FFFFFF', '#F5F5DC', '#FFFAF0', '#F0FFF0', '#F0F8FF', '#FFF0F5', '#1a1a2e', '#16213e', '#0f0f0f', '#1e1e1e', '#2d2d2d', '#3d3d3d'].map(c => (
            <button key={c} onClick={() => setPageBackground(c)} className={`w-7 h-7 rounded-md border ${pageBackground === c ? 'ring-2 ring-blue-500 scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />
          ))}
        </div>
        <input type="color" value={pageBackground} onChange={e => setPageBackground(e.target.value)} className="w-full h-8 rounded cursor-pointer" />
      </div>
    </DraggablePanel>}

    {/* Export Panel */}
    {showExport && <DraggablePanel title="Export" onClose={() => setShowExport(false)} initialPosition={{ x: isMobile ? 20 : 300, y: 100 }}>
      <div className="space-y-3 w-52">
        <button onClick={exportToPDF} disabled={exporting} className="zet-btn w-full flex items-center justify-center gap-2 py-2.5">
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Export as PDF
        </button>
        <div className="text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>Current page will be exported</div>
      </div>
    </DraggablePanel>}

    {/* Photo Edit Panel */}
    {showPhotoEdit && <DraggablePanel title="AI Photo Edit" onClose={() => { setShowPhotoEdit(false); setPhotoEditImage(null); setPhotoEditResult(null); setPhotoEditDrawings([]); setPhotoEditDrawMode(false); }} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="space-y-3 w-72">
        {/* Credits info */}
        <div className="text-xs px-2 py-1.5 rounded flex items-center justify-between" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
          <span style={{ color: 'var(--zet-text-muted)' }}>Maliyet: {planLimits.nano_pro ? 'Standart 15 / Pro 40' : '15'} kredi</span>
          <span style={{ color: creditsRemaining > 0 ? '#22c55e' : '#ef4444' }}>{creditsRemaining} kalan</span>
        </div>
        {!photoEditImage ? (
          <button onClick={handlePhotoEditUpload} className="zet-btn w-full py-6 flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6" />
            <span className="text-sm">{t('selectPhoto') || 'Select Photo'}</span>
          </button>
        ) : (
          <>
            {/* Photo with drawing overlay */}
            <div className="relative">
              <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>
                {photoEditDrawMode ? '✏️ Düzenlemek istediğiniz yeri çizin' : 'Original'}
              </p>
              <div className="relative">
                <img src={photoEditImage} alt="Original" className="w-full rounded" style={{ maxHeight: 180 }} />
                {photoEditDrawMode && (
                  <canvas
                    ref={photoEditCanvasRef}
                    className="absolute inset-0 w-full h-full cursor-crosshair"
                    style={{ touchAction: 'none' }}
                    onMouseDown={(e) => {
                      const rect = e.target.getBoundingClientRect();
                      setIsDrawingOnPhoto(true);
                      setPhotoEditDrawings(prev => [...prev, [{ x: e.clientX - rect.left, y: e.clientY - rect.top }]]);
                    }}
                    onMouseMove={(e) => {
                      if (!isDrawingOnPhoto) return;
                      const rect = e.target.getBoundingClientRect();
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      setPhotoEditDrawings(prev => {
                        const newDrawings = [...prev];
                        if (newDrawings.length > 0) {
                          newDrawings[newDrawings.length - 1] = [...newDrawings[newDrawings.length - 1], { x, y }];
                        }
                        return newDrawings;
                      });
                      // Draw on canvas
                      const canvas = photoEditCanvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext('2d');
                        ctx.strokeStyle = '#ff0000';
                        ctx.lineWidth = 3;
                        ctx.lineCap = 'round';
                        const drawings = photoEditDrawings;
                        if (drawings.length > 0) {
                          const lastPath = drawings[drawings.length - 1];
                          if (lastPath.length > 1) {
                            ctx.beginPath();
                            ctx.moveTo(lastPath[lastPath.length - 2].x, lastPath[lastPath.length - 2].y);
                            ctx.lineTo(x, y);
                            ctx.stroke();
                          }
                        }
                      }
                    }}
                    onMouseUp={() => setIsDrawingOnPhoto(false)}
                    onMouseLeave={() => setIsDrawingOnPhoto(false)}
                  />
                )}
                {/* Show red circles where user drew */}
                {photoEditDrawings.length > 0 && !photoEditDrawMode && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                      {photoEditDrawings.map((path, i) => (
                        <path 
                          key={i} 
                          d={`M ${path.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                          stroke="#ff0000" 
                          strokeWidth="3" 
                          fill="none" 
                          strokeLinecap="round"
                        />
                      ))}
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            {/* Draw mode toggle */}
            <div className="flex gap-2">
              <button 
                onClick={() => {
                  setPhotoEditDrawMode(!photoEditDrawMode);
                  if (!photoEditDrawMode) {
                    // Initialize canvas when entering draw mode
                    setTimeout(() => {
                      const canvas = photoEditCanvasRef.current;
                      if (canvas) {
                        const img = canvas.parentElement.querySelector('img');
                        if (img) {
                          canvas.width = img.clientWidth;
                          canvas.height = img.clientHeight;
                        }
                      }
                    }, 100);
                  }
                }}
                className={`flex-1 py-1.5 text-xs rounded flex items-center justify-center gap-1 ${photoEditDrawMode ? 'ring-2 ring-red-500' : ''}`}
                style={{ background: photoEditDrawMode ? 'rgba(255,0,0,0.2)' : 'var(--zet-bg)', color: photoEditDrawMode ? '#ff6464' : 'var(--zet-text)' }}
              >
                <Pencil className="h-3 w-3" /> {photoEditDrawMode ? 'Çizim Modu Açık' : 'Kalemle İşaretle'}
              </button>
              {photoEditDrawings.length > 0 && (
                <button 
                  onClick={() => {
                    setPhotoEditDrawings([]);
                    const canvas = photoEditCanvasRef.current;
                    if (canvas) {
                      const ctx = canvas.getContext('2d');
                      ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                  }}
                  className="px-2 py-1.5 text-xs rounded"
                  style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)' }}
                >
                  Temizle
                </button>
              )}
            </div>
            
            {/* Result preview */}
            {photoEditResult && (
              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>Düzenlenmiş</p>
                <img src={photoEditResult} alt="Edited" className="w-full rounded" style={{ maxHeight: 120 }} />
              </div>
            )}
            
            <textarea
              placeholder={photoEditDrawings.length > 0 
                ? "Çizdiğiniz alanı nasıl değiştirelim? (örn: 'Bu alanı sil', 'Buraya çiçek ekle')" 
                : "Değişiklikleri açıklayın... (örn: 'Arka planı kaldır', 'Gün batımı yap')"}
              value={photoEditPrompt}
              onChange={e => setPhotoEditPrompt(e.target.value)}
              className="zet-input w-full text-xs h-14 resize-none"
            />
            <div className="flex gap-2">
              <button 
                onClick={executePhotoEdit} 
                disabled={photoEditLoading || !photoEditPrompt.trim()}
                className="zet-btn flex-1 py-2 flex items-center justify-center gap-2"
              >
                {photoEditLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                {t('edit') || 'Düzenle'}
              </button>
              {photoEditResult && (
                <button onClick={addEditedPhotoToCanvas} className="zet-btn flex-1 py-2 flex items-center justify-center gap-2" style={{ background: 'var(--zet-primary)' }}>
                  <Plus className="h-4 w-4" /> Ekle
                </button>
              )}
            </div>
            <button onClick={handlePhotoEditUpload} className="text-xs underline w-full text-center" style={{ color: 'var(--zet-text-muted)' }}>
              {t('selectDifferent') || 'Farklı fotoğraf seç'}
            </button>
          </>
        )}
      </div>
    </DraggablePanel>}

    {/* Signature Panel */}
    {showSignature && <DraggablePanel title="Digital Signature" onClose={() => { setShowSignature(false); clearSignature(); }} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="space-y-3 w-72">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{t('drawSignature') || 'Draw your signature below:'}</p>
        <canvas
          ref={signatureCanvasRef}
          width={256}
          height={100}
          onMouseDown={handleSignatureMouseDown}
          onMouseMove={handleSignatureMouseMove}
          onMouseUp={handleSignatureMouseUp}
          onMouseLeave={handleSignatureMouseUp}
          className="rounded border cursor-crosshair"
          style={{ background: '#fff', borderColor: 'var(--zet-border)' }}
        />
        <div className="flex gap-2">
          <button onClick={clearSignature} className="zet-btn flex-1 py-2 text-xs">{t('clear') || 'Clear'}</button>
          <button 
            onClick={addSignatureToCanvas} 
            disabled={!signatureData}
            className="zet-btn flex-1 py-2 text-xs flex items-center justify-center gap-1 disabled:opacity-50"
            style={{ background: signatureData ? 'var(--zet-primary)' : undefined }}
          >
            <Plus className="h-3 w-3" /> {t('addToDocument') || 'Add to Document'}
          </button>
        </div>
      </div>
    </DraggablePanel>}

    {/* Indent Panel */}
    {showIndent && <DraggablePanel title="Girinti" onClose={() => setShowIndent(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-64 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Seçili elementin girintisini ayarlayın</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sol</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={indentLeft} onChange={e => {
                const val = parseInt(e.target.value);
                setIndentLeft(val);
                if (selectedElement) {
                  setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, paddingLeft: val } : el));
                }
              }} className="flex-1" />
              <span className="text-xs w-8" style={{ color: 'var(--zet-text)' }}>{indentLeft}px</span>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sağ</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={indentRight} onChange={e => {
                const val = parseInt(e.target.value);
                setIndentRight(val);
                if (selectedElement) {
                  setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, paddingRight: val } : el));
                }
              }} className="flex-1" />
              <span className="text-xs w-8" style={{ color: 'var(--zet-text)' }}>{indentRight}px</span>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Üst</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={indentTop} onChange={e => {
                const val = parseInt(e.target.value);
                setIndentTop(val);
                if (selectedElement) {
                  setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, paddingTop: val } : el));
                }
              }} className="flex-1" />
              <span className="text-xs w-8" style={{ color: 'var(--zet-text)' }}>{indentTop}px</span>
            </div>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Alt</label>
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={indentBottom} onChange={e => {
                const val = parseInt(e.target.value);
                setIndentBottom(val);
                if (selectedElement) {
                  setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, paddingBottom: val } : el));
                }
              }} className="flex-1" />
              <span className="text-xs w-8" style={{ color: 'var(--zet-text)' }}>{indentBottom}px</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => {
            setIndentLeft(0); setIndentRight(0); setIndentTop(0); setIndentBottom(0);
            if (selectedElement) {
              setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, paddingLeft: 0, paddingRight: 0, paddingTop: 0, paddingBottom: 0 } : el));
            }
          }}
          className="zet-btn w-full py-2 text-xs"
        >
          Sıfırla
        </button>
      </div>
    </DraggablePanel>}

    {/* Margins Panel */}
    {showMargins && <DraggablePanel title="Kenar Boşlukları" onClose={() => setShowMargins(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-64 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Sayfa kenar boşluklarını ayarlayın</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Üst</label>
            <input type="number" min="0" max="200" value={marginTop} onChange={e => setMarginTop(parseInt(e.target.value) || 0)} className="zet-input text-xs w-full" />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Alt</label>
            <input type="number" min="0" max="200" value={marginBottom} onChange={e => setMarginBottom(parseInt(e.target.value) || 0)} className="zet-input text-xs w-full" />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sol</label>
            <input type="number" min="0" max="200" value={marginLeft} onChange={e => setMarginLeft(parseInt(e.target.value) || 0)} className="zet-input text-xs w-full" />
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Sağ</label>
            <input type="number" min="0" max="200" value={marginRight} onChange={e => setMarginRight(parseInt(e.target.value) || 0)} className="zet-input text-xs w-full" />
          </div>
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Hazır Ayarlar</label>
          <div className="grid grid-cols-3 gap-1">
            <button onClick={() => { setMarginTop(40); setMarginBottom(40); setMarginLeft(40); setMarginRight(40); }} className="zet-btn text-xs py-1.5">Normal</button>
            <button onClick={() => { setMarginTop(20); setMarginBottom(20); setMarginLeft(20); setMarginRight(20); }} className="zet-btn text-xs py-1.5">Dar</button>
            <button onClick={() => { setMarginTop(60); setMarginBottom(60); setMarginLeft(60); setMarginRight(60); }} className="zet-btn text-xs py-1.5">Geniş</button>
          </div>
        </div>
      </div>
    </DraggablePanel>}

    {/* Chat Settings Panel */}
    {showChatSettings && <DraggablePanel title="Chat Ayarları" onClose={() => setShowChatSettings(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-80 space-y-4">
        {/* ZETA Settings */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
          <h4 className="font-semibold text-sm mb-3" style={{ color: '#4ca8ad' }}>ZETA Özelleştirme</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
              <select 
                value={zetaMood} 
                onChange={e => { setZetaMood(e.target.value); localStorage.setItem('zet_zeta_mood', e.target.value); }}
                className="zet-input text-xs w-full"
              >
                <option value="cheerful">🎉 Neşeli</option>
                <option value="professional">💼 Profesyonel</option>
                <option value="curious">🔍 Meraklı</option>
                <option value="custom">✨ Özel</option>
              </select>
            </div>
            {zetaMood === 'custom' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Özel Prompt</label>
                <textarea 
                  value={zetaCustomPrompt} 
                  onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }}
                  placeholder="ZETA nasıl davransın? Örn: Kısa ve öz cevaplar ver, her cevabın sonuna bir bilgi ekle..."
                  className="zet-input text-xs w-full h-20 resize-none"
                />
              </div>
            )}
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Emoji Kullanımı</label>
              <select 
                value={zetaEmoji} 
                onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }}
                className="zet-input text-xs w-full"
              >
                <option value="none">❌ Kullanma</option>
                <option value="low">📍 Az Kullan</option>
                <option value="medium">📌 Orta</option>
                <option value="high">🎯 Çok Kullan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Judge Settings */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 0, 90, 0.1)', border: '1px solid rgba(200, 0, 90, 0.3)' }}>
          <h4 className="font-semibold text-sm mb-3" style={{ color: '#c8005a' }}>ZET Judge Mini Özelleştirme</h4>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
            <select 
              value={judgeMood} 
              onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }}
              className="zet-input text-xs w-full"
            >
              <option value="normal">⚖️ Normal (Yapıcı eleştiri)</option>
              <option value="harsh">🔥 Sert (Esprili dalga geçme)</option>
            </select>
            <p className="text-xs mt-2 opacity-70" style={{ color: 'var(--zet-text-muted)' }}>
              {judgeMood === 'harsh' ? '😈 Judge sizi esprilerle "kavuracak"!' : '🤝 Judge yapıcı ve profesyonel olacak.'}
            </p>
          </div>
        </div>
      </div>
    </DraggablePanel>}

    {/* Graphic Chart Panel */}
    {showGraphic && <DraggablePanel title="Chart" onClose={() => setShowGraphic(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-80 space-y-3 max-h-[70vh] overflow-y-auto">
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Chart Type</label>
          <div className="grid grid-cols-3 gap-1">
            {CHART_TYPES.map(ct => (
              <button key={ct.id} onClick={() => setChartType(ct.id)} className={`p-2 rounded text-xs ${chartType === ct.id ? 'glow-sm' : 'hover:bg-white/5'}`} style={{ background: chartType === ct.id ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{ct.name.split(' ')[0]}</button>
            ))}
          </div>
        </div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Title</label><input value={chartTitle} onChange={e => setChartTitle(e.target.value)} className="zet-input text-xs w-full" placeholder="Chart Title" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Labels (comma separated)</label><input value={chartLabels} onChange={e => setChartLabels(e.target.value)} className="zet-input text-xs w-full" placeholder="A,B,C,D" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Values (comma separated)</label><input value={chartData} onChange={e => setChartData(e.target.value)} className="zet-input text-xs w-full" placeholder="10,20,30,40" /></div>
        
        {/* Column Colors */}
        <div>
          <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Column Colors</label>
          <div className="flex flex-wrap gap-1">
            {chartLabels.split(',').map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{i + 1}:</span>
                <input 
                  type="color" 
                  value={chartColors[i] || '#3b82f6'} 
                  onChange={e => {
                    const newColors = [...chartColors];
                    newColors[i] = e.target.value;
                    setChartColors(newColors);
                  }} 
                  className="w-8 h-6 rounded cursor-pointer border-0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Background Image */}
        {(chartType === 'bar' || chartType === 'pie') && (
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Background Image</label>
            <div className="flex gap-1">
              <button onClick={() => {
                const input = window.document.createElement('input');
                input.type = 'file'; input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setChartImage(ev.target.result);
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }} className="zet-btn text-xs px-2 py-1 flex items-center gap-1">
                <Upload className="h-3 w-3" /> Image
              </button>
              <button onClick={async () => {
                const prompt = window.prompt('Describe the background image:');
                if (!prompt) return;
                try {
                  const res = await axios.post(`${API}/zeta/generate-image`, { prompt }, { withCredentials: true });
                  if (res.data.image_url) setChartImage(res.data.image_url);
                } catch (err) { console.error('AI Image failed:', err); }
              }} className="zet-btn text-xs px-2 py-1 flex items-center gap-1">
                <Wand2 className="h-3 w-3" /> AI Image
              </button>
              {chartImage && <button onClick={() => setChartImage(null)} className="text-xs px-2 py-1 text-red-400">Clear</button>}
            </div>
          </div>
        )}

        {/* Gradient Option for Chart */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--zet-text-muted)' }}>
            <input
              type="checkbox"
              checked={!!(gradientStart && gradientEnd)}
              onChange={(e) => {
                if (!e.target.checked) {
                  setGradientStart('');
                  setGradientEnd('');
                }
              }}
              className="rounded"
            />
            Gradient Kullan (Mevcut renk seçili)
          </label>
          {gradientStart && gradientEnd && (
            <div className="flex items-center gap-2 mt-2">
              <div className="w-full h-6 rounded" style={{ background: `linear-gradient(90deg, ${gradientStart}, ${gradientEnd})` }} />
            </div>
          )}
        </div>

        <button onClick={createChart} className="zet-btn w-full flex items-center justify-center gap-2 py-2"><Plus className="h-4 w-4" /> Create Chart</button>
      </div>
    </DraggablePanel>}

    {/* Shortcuts Panel */}
    {showShortcuts && <DraggablePanel title="Keyboard Shortcuts" onClose={() => { setShowShortcuts(false); setShortcutSearch(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-80 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
          <input
            placeholder="Search tools..."
            value={shortcutSearch}
            onChange={(e) => setShortcutSearch(e.target.value)}
            className="zet-input pl-7 text-xs w-full"
          />
        </div>
        <div className="max-h-72 overflow-y-auto space-y-1">
          {TOOLS.filter(tool => 
            !shortcutSearch || 
            tool.nameKey.toLowerCase().includes(shortcutSearch.toLowerCase()) ||
            tool.id.toLowerCase().includes(shortcutSearch.toLowerCase())
          ).map(tool => {
            const currentKey = Object.keys(shortcuts).find(k => shortcuts[k] === tool.id);
            return (
              <div key={tool.id} className="flex items-center justify-between p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                <div className="flex items-center gap-2">
                  <tool.icon className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                  <span className="text-sm" style={{ color: 'var(--zet-text)' }}>{tool.nameKey}</span>
                </div>
                {editingShortcut === tool.id ? (
                  <input autoFocus className="zet-input w-12 text-center text-xs font-mono" maxLength={1} onKeyDown={e => { if (e.key.length === 1) { updateShortcut(e.key); } else if (e.key === 'Escape') setEditingShortcut(null); }} onBlur={() => setEditingShortcut(null)} placeholder="?" />
                ) : (
                  <button onClick={() => setEditingShortcut(tool.id)} className="px-2 py-1 rounded text-xs font-mono" style={{ background: 'var(--zet-bg-card)', color: currentKey ? 'var(--zet-primary)' : 'var(--zet-text-muted)' }}>{currentKey || '—'}</button>
                )}
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Click a key to edit. Press the new key to assign.</p>
          <p className="mt-1">Delete/Backspace: Delete selected element</p>
          <p>Escape: Deselect</p>
        </div>
      </div>
    </DraggablePanel>}

    {/* Table Panel */}
    {showTable && <DraggablePanel title="Table" onClose={() => setShowTable(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-52 space-y-3">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Rows: {tableRows}</label><input type="range" min="1" max="10" value={tableRows} onChange={e => setTableRows(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Columns: {tableCols}</label><input type="range" min="1" max="10" value={tableCols} onChange={e => setTableCols(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="p-2 rounded flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
          <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${Math.min(tableCols, 5)}, 1fr)` }}>
            {Array.from({ length: Math.min(tableRows, 5) * Math.min(tableCols, 5) }).map((_, i) => (
              <div key={i} className="w-4 h-3 border" style={{ borderColor: 'var(--zet-text-muted)', background: 'var(--zet-bg-card)' }} />
            ))}
          </div>
        </div>
        <button onClick={createTable} className="zet-btn w-full flex items-center justify-center gap-2 py-2"><Table className="h-4 w-4" /> Create Table</button>
      </div>
    </DraggablePanel>}

    {/* Layers Panel */}
    {showLayers && <DraggablePanel title="Layers" onClose={() => setShowLayers(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 60 }}>
      <div className="w-64 space-y-1 max-h-80 overflow-y-auto">
        {[...canvasElements].reverse().map((el, i) => (
          <div key={el.id} className={`flex items-center justify-between p-2 rounded text-xs ${selectedElement === el.id ? 'ring-1 ring-blue-500' : ''}`} style={{ background: 'var(--zet-bg)' }} onClick={() => setSelectedElement(el.id)}>
            <div className="flex items-center gap-2 truncate flex-1">
              <span className="w-4 text-center" style={{ color: 'var(--zet-text-muted)' }}>{canvasElements.length - i}</span>
              <span className="truncate" style={{ color: el.hidden ? 'var(--zet-text-muted)' : 'var(--zet-text)' }}>{el.type === 'text' ? (el.content?.slice(0, 20) || 'Text') : el.type}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={(e) => { e.stopPropagation(); toggleLayerVisibility(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.hidden ? 'Show' : 'Hide'}>{el.hidden ? <EyeOff className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /> : <Eye className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); toggleLayerLock(el.id); }} className="p-1 rounded hover:bg-white/10" title={el.locked ? 'Unlock' : 'Lock'}>{el.locked ? <Lock className="h-3 w-3" style={{ color: 'var(--zet-primary)' }} /> : <Unlock className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} />}</button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerUp(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Up"><ChevronUp className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); moveLayerDown(el.id); }} className="p-1 rounded hover:bg-white/10" title="Move Down"><ChevronDown className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
              <button onClick={(e) => { e.stopPropagation(); deleteElement(el.id); }} className="p-1 rounded hover:bg-red-500/20" title="Delete"><Trash2 className="h-3 w-3" style={{ color: '#f87171' }} /></button>
            </div>
          </div>
        ))}
        {canvasElements.length === 0 && <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>No layers</div>}
      </div>
    </DraggablePanel>}

    {/* Grid Panel */}
    {showGrid && <DraggablePanel title="Grid" onClose={() => setShowGrid(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-52 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={gridVisible} onChange={e => setGridVisible(e.target.checked)} className="rounded" />
          Show Grid
        </label>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Grid Size: {gridSize}px</label><input type="range" min="10" max="50" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} className="rounded" />
          Snap to Grid
        </label>
      </div>
    </DraggablePanel>}

    {/* Ruler Panel */}
    {showRuler && <DraggablePanel title="Ruler" onClose={() => setShowRuler(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-48 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={rulerVisible} onChange={e => setRulerVisible(e.target.checked)} className="rounded" />
          Show Rulers
        </label>
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Rulers help align elements precisely.</p>
      </div>
    </DraggablePanel>}

    {/* Templates Panel */}
    {showTemplates && <DraggablePanel title="Templates" onClose={() => setShowTemplates(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-72 space-y-1 max-h-[60vh] overflow-y-auto">
        {['Temel', 'İş', 'Kariyer', 'Hukuki', 'Eğitim', 'Kişisel', 'Pazarlama', 'Yaratıcı'].map(cat => {
          const catTemplates = TEMPLATES.filter(t => t.category === cat);
          if (!catTemplates.length) return null;
          return (
            <div key={cat}>
              <p className="text-xs font-semibold px-2 pt-2 pb-1" style={{ color: 'var(--zet-text-muted)' }}>{cat}</p>
              {catTemplates.map(tpl => (
                <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} className="w-full p-2.5 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }} data-testid={`template-${tpl.id}`}>
                  <span className="text-lg flex-shrink-0">{tpl.icon}</span>
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate" style={{ color: 'var(--zet-text)' }}>{tpl.name}</div>
                  </div>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </DraggablePanel>}

    {/* Export Panel */}
    {showExport && <DraggablePanel title="Export Document" onClose={() => setShowExport(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-72 space-y-3">
        <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Choose export format:</p>
        
        <div className="space-y-2">
          <button onClick={() => handleExport('pdf')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#e74c3c' }}>
              <span className="text-white text-xs font-bold">PDF</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>PDF Document</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Best for printing & sharing</div>
            </div>
          </button>
          
          <button onClick={() => handleExport('png')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#3498db' }}>
              <span className="text-white text-xs font-bold">PNG</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>PNG Image</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>High quality, transparent background</div>
            </div>
          </button>
          
          <button onClick={() => handleExport('jpeg')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#27ae60' }}>
              <span className="text-white text-xs font-bold">JPG</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>JPEG Image</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Smaller file size, web optimized</div>
            </div>
          </button>
          
          <button onClick={() => handleExport('svg')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#9b59b6' }}>
              <span className="text-white text-xs font-bold">SVG</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>SVG Vector</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Scalable, editable graphics</div>
            </div>
          </button>
          
          <button onClick={() => handleExport('json')} disabled={exporting} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors flex items-center gap-3" style={{ background: 'var(--zet-bg)' }}>
            <div className="w-10 h-10 rounded flex items-center justify-center" style={{ background: '#f39c12' }}>
              <span className="text-white text-xs font-bold">ZET</span>
            </div>
            <div>
              <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>Project File (.zet.json)</div>
              <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Re-open and edit later</div>
            </div>
          </button>
        </div>

        {/* Quality selector for images */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Image Quality</label>
          <div className="grid grid-cols-3 gap-1">
            {['low', 'medium', 'high'].map(q => (
              <button key={q} onClick={() => setExportQuality(q)} className={`p-1.5 rounded text-xs capitalize ${exportQuality === q ? 'glow-sm' : ''}`} style={{ background: exportQuality === q ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{q}</button>
            ))}
          </div>
        </div>

        {/* Import Project */}
        <div className="pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <label className="text-xs block mb-2" style={{ color: 'var(--zet-text-muted)' }}>Import Project</label>
          <input 
            type="file" 
            accept=".json,.zet.json" 
            onChange={(e) => { if (e.target.files[0]) importFromJSON(e.target.files[0]); }}
            className="hidden"
            id="import-json"
          />
          <label htmlFor="import-json" className="zet-btn w-full flex items-center justify-center gap-2 py-2 cursor-pointer">
            <Upload className="h-4 w-4" /> Open .zet.json File
          </label>
        </div>

        {exporting && <div className="text-center py-2"><Loader2 className="h-5 w-5 animate-spin mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>}
      </div>
    </DraggablePanel>}

    {/* QR Code Panel */}
    {showQRCode && <DraggablePanel title="QR Code" onClose={() => setShowQRCode(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-3">
        <input type="text" value={qrText} onChange={e => setQrText(e.target.value)} placeholder="Enter text or URL" className="zet-input text-xs w-full" />
        <button onClick={createQRCode} disabled={!qrText.trim()} className="zet-btn w-full flex items-center justify-center gap-2 py-2"><Plus className="h-4 w-4" /> Generate QR</button>
      </div>
    </DraggablePanel>}

    {/* Watermark Panel */}
    {showWatermark && <DraggablePanel title="Watermark" onClose={() => setShowWatermark(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-3">
        <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Watermark text" className="zet-input text-xs w-full" />
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {watermarkOpacity}%</label><input type="range" min="5" max="50" value={watermarkOpacity} onChange={e => setWatermarkOpacity(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <button onClick={applyWatermark} className="zet-btn w-full">Apply Watermark</button>
      </div>
    </DraggablePanel>}

    {/* Page Numbers Panel */}
    {showPageNumbers && <DraggablePanel title="Page Numbers" onClose={() => setShowPageNumbers(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-52 space-y-3">
        <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--zet-text)' }}>
          <input type="checkbox" checked={pageNumbersEnabled} onChange={togglePageNumbers} className="rounded" />
          Enable Page Numbers
        </label>
        <select value={pageNumberPosition} onChange={e => setPageNumberPosition(e.target.value)} className="zet-input text-xs w-full">
          <option value="bottom-center">Bottom Center</option>
          <option value="bottom-right">Bottom Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="top-center">Top Center</option>
        </select>
      </div>
    </DraggablePanel>}

    {/* Header/Footer Panel */}
    {showHeaderFooter && <DraggablePanel title="Header & Footer" onClose={() => setShowHeaderFooter(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-3">
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Header</label><input type="text" value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Header text" className="zet-input text-xs w-full" /></div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Footer</label><input type="text" value={footerText} onChange={e => setFooterText(e.target.value)} placeholder="Footer text" className="zet-input text-xs w-full" /></div>
        <button onClick={applyHeaderFooter} className="zet-btn w-full">Apply</button>
      </div>
    </DraggablePanel>}

    {/* Find & Replace Panel */}
    {showFindReplace && <DraggablePanel title="Find & Replace" onClose={() => setShowFindReplace(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-64 space-y-3">
        <div className="flex gap-2">
          <input type="text" value={findText} onChange={e => setFindText(e.target.value)} placeholder="Find" className="zet-input text-xs flex-1" />
          <button onClick={findInDocument} className="zet-btn px-2"><Search className="h-3 w-3" /></button>
        </div>
        <input type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with" className="zet-input text-xs w-full" />
        <button onClick={replaceInDocument} disabled={!findText.trim()} className="zet-btn w-full text-xs">Replace All</button>
        {findResults.length > 0 && (
          <div className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Found {findResults.length} matches</div>
        )}
      </div>
    </DraggablePanel>}

    {/* Mirror Panel */}
    {showMirror && <DraggablePanel title="Mirror / Rotate" onClose={() => setShowMirror(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-56 space-y-3">
        {!selectedElement ? (
          <div className="text-center py-4 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Select an element first</div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Mirror</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => mirrorElement('horizontal')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↔ Horizontal
                </button>
                <button onClick={() => mirrorElement('vertical')} className="zet-btn text-xs py-2 flex items-center justify-center gap-1">
                  ↕ Vertical
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Rotate: {mirrorAngle}°</label>
              <input type="range" min="-180" max="180" value={mirrorAngle} onChange={e => setMirrorAngle(Number(e.target.value))} className="w-full accent-blue-500" />
              <div className="grid grid-cols-4 gap-1">
                <button onClick={() => rotateElement(-90)} className="zet-btn text-xs py-1">-90°</button>
                <button onClick={() => rotateElement(-45)} className="zet-btn text-xs py-1">-45°</button>
                <button onClick={() => rotateElement(45)} className="zet-btn text-xs py-1">+45°</button>
                <button onClick={() => rotateElement(90)} className="zet-btn text-xs py-1">+90°</button>
              </div>
              <button onClick={() => {
                if (selectedElement) {
                  const updated = canvasElements.map(el => el.id === selectedElement ? { ...el, rotation: mirrorAngle } : el);
                  setCanvasElements(updated); history.push(updated);
                }
              }} className="zet-btn w-full text-xs py-2">Set Rotation to {mirrorAngle}°</button>
            </div>
          </>
        )}
      </div>
    </DraggablePanel>}

    {/* Voice Input (STT) Panel */}
    {showVoiceInput && <DraggablePanel title="Voice Input" onClose={() => { setShowVoiceInput(false); stopListening(); setVoiceTranscript(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        <div className="text-center">
          <button 
            onClick={isListening ? stopListening : startListening} 
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-blue-500 hover:bg-blue-600'}`}
          >
            <Mic className="h-8 w-8 text-white" />
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--zet-text-muted)' }}>
            {isListening ? 'Listening... Click to stop' : 'Click to start speaking'}
          </p>
        </div>
        
        {voiceTranscript && (
          <div className="space-y-2">
            <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Transcript:</label>
            <div className="p-3 rounded text-sm max-h-32 overflow-y-auto" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>
              {voiceTranscript}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setVoiceTranscript('')} className="zet-btn text-xs py-2" style={{ background: 'var(--zet-bg)' }}>Clear</button>
              <button onClick={addVoiceTextToDocument} className="zet-btn text-xs py-2">Add to Document</button>
            </div>
          </div>
        )}
        
        <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Language: {language === 'tr' ? 'Türkçe' : 'English'}</p>
          <p className="mt-1">Uses your browser's speech recognition</p>
        </div>
      </div>
    </DraggablePanel>}
  </>);

  // =============================
  // MOBILE LAYOUT
  // =============================
  if (isMobile) {
    return (
      <div data-testid="editor-page" className="h-screen flex flex-col overflow-hidden" style={{ background: 'var(--zet-bg)' }}>
        {/* Mobile Header */}
        <header className="h-11 px-2 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex items-center gap-1">
            <button onClick={() => navigate('/dashboard')} className="tool-btn w-8 h-8"><Home className="h-4 w-4" /></button>
            <input value={document.title} onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))} className="bg-transparent font-medium px-1 text-sm outline-none w-24" style={{ color: 'var(--zet-text)' }} />
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleUndo} disabled={!history.canUndo} className={`tool-btn w-7 h-7 ${!history.canUndo ? 'opacity-30' : ''}`}><Undo className="h-3.5 w-3.5" /></button>
            <button onClick={handleRedo} disabled={!history.canRedo} className={`tool-btn w-7 h-7 ${!history.canRedo ? 'opacity-30' : ''}`}><Redo className="h-3.5 w-3.5" /></button>
            <button onClick={() => saveDocument()} className="zet-btn px-2 py-1 text-xs"><Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} /></button>
          </div>
        </header>

        {/* Mobile Canvas - with touch scroll fix */}
        <div className="flex-1 overflow-hidden relative" style={{ touchAction: 'pan-x pan-y' }}>
          <CanvasArea document={document} currentPage={currentPage} changePage={changePage}
            canvasElements={canvasElements} setCanvasElements={setCanvasElements}
            drawPaths={drawPaths} setDrawPaths={setDrawPaths} pageSize={pageSize} zoom={zoom} setZoom={setZoom}
            activeTool={activeTool} currentFontSize={currentFontSize} currentFont={currentFont} currentColor={currentColor}
            currentLineHeight={currentLineHeight} currentTextAlign={currentTextAlign}
            drawSize={drawSize} drawOpacity={drawOpacity} eraserSize={eraserSize}
            markingColor={markingColor} markingOpacity={markingOpacity} markingSize={markingSize}
            selectedElement={selectedElement} setSelectedElement={setSelectedElement}
            selectedElements={selectedElements} setSelectedElements={setSelectedElements}
            onSaveHistory={handleSaveHistory} canvasContainerRef={canvasContainerRef}
            onElementSelect={handleElementSelect} onDeleteElement={deleteElement}
            onChangeImage={handleChangeImage} onAddImageToShape={handleAddImageToShape}
            onAddAiImageToShape={handleAddAiImageToShape}
            isBold={isBold} isItalic={isItalic} isUnderline={isUnderline} isStrikethrough={isStrikethrough}
            pageBackground={pageBackground} gradientStart={gradientStart} gradientEnd={gradientEnd} useGradient={useGradient}
            zoomLevel={zoomLevel} zoomRadius={zoomRadius} magnifierPos={magnifierPos} setMagnifierPos={setMagnifierPos}
            onAddPage={addPage} onCopyElement={copyElementById} onMirrorElement={mirrorElementById}
            rulerVisible={rulerVisible} gridVisible={gridVisible} gridSize={gridSize} />
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="border-t flex-shrink-0 safe-area-bottom" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
          <div className="flex items-center justify-around py-2 px-2">
            {/* Toolbox Button */}
            <button 
              onClick={() => setMobilePanel(mobilePanel === 'tools' ? null : 'tools')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all ${mobilePanel === 'tools' ? 'bg-white/10' : ''}`}
            >
              <Menu className="h-5 w-5" style={{ color: mobilePanel === 'tools' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-xs" style={{ color: mobilePanel === 'tools' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>Tools</span>
            </button>
            
            {/* Pages Button */}
            <button 
              onClick={() => setMobilePanel(mobilePanel === 'pages' ? null : 'pages')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all ${mobilePanel === 'pages' ? 'bg-white/10' : ''}`}
            >
              <Layers className="h-5 w-5" style={{ color: mobilePanel === 'pages' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-xs" style={{ color: mobilePanel === 'pages' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>Pages</span>
            </button>
            
            {/* ZETA Chat Button */}
            <button 
              onClick={() => setMobilePanel(mobilePanel === 'zeta' ? null : 'zeta')}
              className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-lg transition-all ${mobilePanel === 'zeta' ? 'bg-white/10' : ''}`}
            >
              <Sparkles className="h-5 w-5" style={{ color: mobilePanel === 'zeta' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }} />
              <span className="text-xs" style={{ color: mobilePanel === 'zeta' ? 'var(--zet-primary-light)' : 'var(--zet-text-muted)' }}>AI Chat</span>
            </button>
          </div>
        </div>

        {/* Mobile Tools Panel */}
        {mobilePanel === 'tools' && (
          <div className="fixed inset-0 z-50 flex flex-col" onClick={(e) => e.target === e.currentTarget && setMobilePanel(null)}>
            <div className="flex-1" onClick={() => setMobilePanel(null)} />
            <div className="rounded-t-2xl max-h-[60vh] overflow-y-auto" style={{ background: 'var(--zet-bg-card)' }}>
              <div className="sticky top-0 p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
                <span className="font-medium" style={{ color: 'var(--zet-text)' }}>Tools</span>
                <button onClick={() => setMobilePanel(null)} className="p-1 rounded hover:bg-white/10">
                  <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2 p-3">
                {TOOLS.map(tool => (
                  <button 
                    key={tool.id} 
                    onClick={() => { handleToolSelect(tool.id); if (!['text', 'draw', 'pen', 'marking', 'eraser', 'select'].includes(tool.id)) setMobilePanel(null); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${activeTool === tool.id ? 'bg-white/10 ring-1 ring-blue-500' : 'hover:bg-white/5'}`}
                  >
                    <tool.icon className="h-5 w-5" style={{ color: activeTool === tool.id ? 'var(--zet-primary-light)' : 'var(--zet-text)' }} />
                    <span className="text-xs truncate w-full text-center" style={{ color: 'var(--zet-text-muted)' }}>{t(tool.nameKey) || tool.nameKey}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile Side Panel (Pages/ZETA) */}
        {(mobilePanel === 'pages' || mobilePanel === 'zeta') && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobilePanel(null)} />
            <div className="w-72 h-full" style={{ background: 'var(--zet-bg-card)' }}>
              <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
                pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
                docId={docId} wordCount={getWordCount()} canvasContainerRef={canvasContainerRef}
                forceSection={mobilePanel} onExport={exportToPDF} exporting={exporting} 
                documentContent={getFullDocContent()} userUsage={userUsage} userPlan={userPlan} 
                onShowUpgrade={(reason) => { setUpgradeReason(reason); setShowUpgradeModal(true); }}
                onShowChatSettings={() => setShowChatSettings(true)}
                zetaMood={zetaMood} zetaEmoji={zetaEmoji} zetaCustomPrompt={zetaCustomPrompt} judgeMood={judgeMood}
                onAutoWriteContent={handleAutoWriteContent} />
            </div>
          </div>
        )}

        {/* Voice bar + floating panels */}
        {showVoice && (
          <div className="p-2 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
            <div className="flex items-center gap-2 mb-2">
              <select 
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                onClick={() => { if (availableVoices.length === 0) fetchVoices(); }}
                className="zet-input text-xs flex-1"
              >
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</option>
                <option value="VR6AewLTigWG4xSOukaG">Arnold (Male)</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni (Male)</option>
                {availableVoices.filter(v => !['21m00Tcm4TlvDq8ikWAM', 'VR6AewLTigWG4xSOukaG', 'EXAVITQu4vr4xnSDxMaL', 'ErXwobaYiN019PkySvjV'].includes(v.voice_id)).map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name} {v.gender ? `(${v.gender})` : ''}</option>
                ))}
              </select>
              <button onClick={generateTTS} disabled={voiceLoading} className="zet-btn text-xs px-3">
                {voiceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
              <button onClick={isPlaying ? () => { stopVoice(); } : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-8 h-8">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
              <div className="flex-1 h-2 rounded-full cursor-pointer" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(f); }}>
                <div className="h-full rounded-full" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} />
              </div>
              <button onClick={() => { stopVoice(); setShowVoice(false); setTtsAudio(null); }} className="p-1"><X className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setVoiceProgress(100); }} onTimeUpdate={() => { if (audioRef.current) setVoiceProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); }} hidden />
          </div>
        )}
        {floatingPanels}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}>
            <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
              <h3 className="font-medium text-sm mb-3" style={{ color: 'var(--zet-text)' }}>{changeImageTarget ? 'Change Image' : t('image')}</h3>
              <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3"><Upload className="h-4 w-4" /><span>Choose File</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =============================
  // DESKTOP LAYOUT
  // =============================
  return (
    <div data-testid="editor-page" className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Hidden PDF input */}
      <input ref={pdfInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files[0]; if (f) importPDF(f); e.target.value = ''; }} />
      {pdfImporting && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]"><div className="zet-card p-6 text-center animate-fadeIn"><div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }} /><p style={{ color: 'var(--zet-text)' }}>PDF içe aktarılıyor...</p></div></div>}
      <header data-testid="editor-header" className="h-12 px-3 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <button data-testid="home-btn" onClick={() => navigate('/dashboard')} className="tool-btn w-8 h-8"><Home className="h-4 w-4" /></button>
          <input data-testid="doc-title-input" value={document.title} onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
            className="bg-transparent font-medium px-2 text-sm border-b border-transparent hover:border-white/20 focus:border-white/40 transition-colors outline-none" style={{ color: 'var(--zet-text)', maxWidth: 200 }} />
        </div>
        <div className="flex items-center gap-1.5">
          <button data-testid="undo-btn" onClick={handleUndo} disabled={!history.canUndo} className={`tool-btn w-8 h-8 ${!history.canUndo ? 'opacity-30' : ''}`}><Undo className="h-4 w-4" /></button>
          <span className="text-xs font-medium px-1" style={{ color: 'var(--zet-text-muted)' }}>{currentPage + 1}/{document.pages?.length || 1}</span>
          <button data-testid="redo-btn" onClick={handleRedo} disabled={!history.canRedo} className={`tool-btn w-8 h-8 ${!history.canRedo ? 'opacity-30' : ''}`}><Redo className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-1.5">
          <button data-testid="prev-page-btn" onClick={() => changePage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={`tool-btn w-8 h-8 ${currentPage === 0 ? 'opacity-30' : ''}`}><ArrowLeft className="h-4 w-4" /></button>
          <button data-testid="next-page-btn" onClick={() => changePage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} disabled={currentPage >= (document.pages?.length || 1) - 1} className={`tool-btn w-8 h-8 ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}><ArrowRight className="h-4 w-4" /></button>
          
          {/* Fast Select in Header */}
          {fastSelectTools.length > 0 && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l" style={{ borderColor: 'var(--zet-border)' }}>
              <Zap className="h-3 w-3" style={{ color: 'var(--zet-primary-light)' }} />
              {fastSelectTools.map(toolId => {
                const tool = TOOLS.find(t => t.id === toolId);
                if (!tool) return null;
                return (
                  <button
                    key={toolId}
                    data-testid={`fast-${toolId}`}
                    onClick={() => handleToolSelect(toolId)}
                    className={`tool-btn w-7 h-7 ${activeTool === toolId ? 'active' : ''}`}
                    title={t(tool.nameKey) || tool.nameKey}
                  >
                    <tool.icon className="h-4 w-4" />
                  </button>
                );
              })}
            </div>
          )}
          
          {!isMobile && <button data-testid="shortcuts-btn" onClick={() => setShowShortcuts(true)} className="tool-btn w-8 h-8" title="Keyboard Shortcuts"><Keyboard className="h-4 w-4" /></button>}
          <button data-testid="export-btn" onClick={() => setShowExport(true)} className="tool-btn w-8 h-8" title="Export"><Download className="h-4 w-4" /></button>
          {/* Credit indicator - clickable */}
          <div data-testid="credit-indicator" onClick={() => navigate('/dashboard?showCredits=true')} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs cursor-pointer hover:scale-105 transition-transform" style={{ background: creditsRemaining > 0 ? 'rgba(76, 168, 173, 0.15)' : 'rgba(239, 68, 68, 0.15)', border: `1px solid ${creditsRemaining > 0 ? 'rgba(76, 168, 173, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
            <Zap className="h-3 w-3" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }} />
            <span className="font-semibold" style={{ color: creditsRemaining > 0 ? '#4ca8ad' : '#ef4444' }}>{creditsRemaining}</span>
          </div>
          <button data-testid="save-btn" onClick={() => saveDocument()} className="zet-btn flex items-center gap-1 text-xs px-3 py-1.5"><Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} /></button>
          <img src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" alt="ZET" className="h-7 w-7 ml-1" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbox tools={TOOLS} activeTool={activeTool} onToolSelect={handleToolSelect}
          onDeleteSelected={deleteSelected} hasSelection={!!selectedElement || selectedElements.length > 0}
          zoom={zoom} isOpen={toolboxOpen} onToggle={() => setToolboxOpen(!toolboxOpen)} 
          lockedTools={getLockedTools()} onLockedClick={(toolId) => { setUpgradeReason(getToolLockReason(toolId)); setShowUpgradeModal(true); }} />

        <CanvasArea document={document} currentPage={currentPage} changePage={changePage}
          canvasElements={canvasElements} setCanvasElements={setCanvasElements}
          drawPaths={drawPaths} setDrawPaths={setDrawPaths} pageSize={pageSize} zoom={zoom} setZoom={setZoom}
          activeTool={activeTool} currentFontSize={currentFontSize} currentFont={currentFont} currentColor={currentColor}
          currentLineHeight={currentLineHeight} currentTextAlign={currentTextAlign}
          drawSize={drawSize} drawOpacity={drawOpacity} eraserSize={eraserSize}
          markingColor={markingColor} markingOpacity={markingOpacity} markingSize={markingSize}
          selectedElement={selectedElement} setSelectedElement={setSelectedElement}
          selectedElements={selectedElements} setSelectedElements={setSelectedElements}
          onSaveHistory={handleSaveHistory} canvasContainerRef={canvasContainerRef}
          onElementSelect={handleElementSelect} onDeleteElement={deleteElement}
          onChangeImage={handleChangeImage} onAddImageToShape={handleAddImageToShape}
          onAddAiImageToShape={handleAddAiImageToShape}
          isBold={isBold} isItalic={isItalic} isUnderline={isUnderline} isStrikethrough={isStrikethrough}
          pageBackground={pageBackground} gradientStart={gradientStart} gradientEnd={gradientEnd} useGradient={useGradient}
          zoomLevel={zoomLevel} zoomRadius={zoomRadius} magnifierPos={magnifierPos} setMagnifierPos={setMagnifierPos}
          onAddPage={addPage} onCopyElement={copyElementById} onMirrorElement={mirrorElementById}
          rulerVisible={rulerVisible} gridVisible={gridVisible} gridSize={gridSize} />

        <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
          pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
          docId={docId} wordCount={getWordCount()} canvasContainerRef={canvasContainerRef}
          onExport={exportToPDF} exporting={exporting} documentContent={getDocText()} userUsage={userUsage} userPlan={userPlan}
          onShowUpgrade={(reason) => { setUpgradeReason(reason); setShowUpgradeModal(true); }}
          onShowChatSettings={() => setShowChatSettings(true)}
          zetaMood={zetaMood} zetaEmoji={zetaEmoji} zetaCustomPrompt={zetaCustomPrompt} judgeMood={judgeMood}
          onAutoWriteContent={handleAutoWriteContent} />
      </div>

      {showVoice && (
        <div data-testid="voice-bar" className="p-3 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-xl mx-auto space-y-2">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
              <select 
                data-testid="voice-select"
                value={selectedVoice} 
                onChange={(e) => setSelectedVoice(e.target.value)}
                onClick={() => { if (availableVoices.length === 0) fetchVoices(); }}
                className="zet-input text-xs flex-1 max-w-xs"
              >
                <option value="21m00Tcm4TlvDq8ikWAM">Rachel (Female)</option>
                <option value="VR6AewLTigWG4xSOukaG">Arnold (Male)</option>
                <option value="EXAVITQu4vr4xnSDxMaL">Bella (Female)</option>
                <option value="ErXwobaYiN019PkySvjV">Antoni (Male)</option>
                {availableVoices.filter(v => !['21m00Tcm4TlvDq8ikWAM', 'VR6AewLTigWG4xSOukaG', 'EXAVITQu4vr4xnSDxMaL', 'ErXwobaYiN019PkySvjV'].includes(v.voice_id)).map(v => (
                  <option key={v.voice_id} value={v.voice_id}>{v.name} {v.gender ? `(${v.gender})` : ''}</option>
                ))}
              </select>
              <button data-testid="voice-generate-btn" onClick={generateTTS} disabled={voiceLoading} className="zet-btn text-xs px-4">
                {voiceLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Generate AI Voice'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button data-testid="voice-skip-back" onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
              <button data-testid="voice-play-btn" onClick={isPlaying ? stopVoice : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-9 h-9">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button data-testid="voice-skip-forward" onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
              <div data-testid="voice-timeline" className="flex-1 h-2.5 rounded-full cursor-pointer relative group" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(Math.max(0, Math.min(1, f))); }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} /><div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${voiceProgress}% - 8px)`, background: 'var(--zet-primary-light)' }} /></div>
              <button onClick={() => { stopVoice(); setShowVoice(false); setTtsAudio(null); }} className="p-1 hover:bg-white/10 rounded"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <audio ref={audioRef} onEnded={() => { setIsPlaying(false); setVoiceProgress(100); }} onTimeUpdate={() => { if (audioRef.current && audioRef.current.duration) setVoiceProgress((audioRef.current.currentTime / audioRef.current.duration) * 100); }} hidden />
          </div>
        </div>
      )}

      {floatingPanels}

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowUpgradeModal(false)}>
          <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #8b5cf6 100%)' }}>
                <Crown className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--zet-text)' }}>
                Planınızı Yükseltin
              </h2>
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>
                {upgradeReason || 'Daha fazla kredi ve özellik için planınızı yükseltin.'}
              </p>
            </div>
            
            {/* Plans with credits */}
            <div className="space-y-3 mb-6">
              {/* Ultra */}
              <div className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(245, 158, 11, 0.1)', borderColor: '#f59e0b' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold" style={{ color: '#f59e0b' }}>Ultra</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>$39.99/ay</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>1000 kredi/gün | Judge sınırsız | Tüm boyutlar</p>
              </div>
              
              {/* Pro - Recommended */}
              <div className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] relative" style={{ background: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6' }}>
                <div className="absolute -top-2 left-4 px-2 py-0.5 rounded text-xs font-bold" style={{ background: '#8b5cf6', color: 'white' }}>Önerilen</div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold" style={{ color: '#8b5cf6' }}>Pro</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>$19.99/ay</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>250 kredi/gün | Nano Pro | Tüm araçlar | 7 boyut</p>
              </div>
              
              {/* Plus */}
              <div className="p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: '#3b82f6' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold" style={{ color: '#3b82f6' }}>Plus</span>
                  <span className="text-sm font-semibold" style={{ color: 'var(--zet-text)' }}>$9.99/ay</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>100 kredi/gün | Judge Mini | 3 boyut | Layers</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 py-3 rounded-xl text-sm font-medium"
                style={{ background: 'var(--zet-bg)', color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}
              >
                Daha Sonra
              </button>
              <button 
                onClick={() => navigate('/dashboard?showCredits=true')}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ background: '#fbbf24', color: '#000' }}
              >
                Kredi Al
              </button>
              <button 
                onClick={() => navigate('/dashboard?upgrade=true')}
                className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #f59e0b 100%)' }}
              >
                Planlari Gor
              </button>
            </div>
          </div>
        </div>
      )}

      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}>
          <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{changeImageTarget ? 'Gorsel Degistir' : uploadForShape ? 'Sekle Ekle' : t('image')}</h3>
              <button onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <label data-testid="image-upload-btn" className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3"><Upload className="h-4 w-4" /><span>Choose File</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
