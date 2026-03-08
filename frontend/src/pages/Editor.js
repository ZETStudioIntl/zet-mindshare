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
  ChevronUp, ChevronDown, Trash2, Table, Grid3X3, Ruler, Zap, Mic, FlipHorizontal2, ImagePlus, Pencil
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

  // === TOOL SELECT ===
  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    const panels = {
      image: () => setShowImageUpload(true), pagesize: () => setShowPageSize(true),
      textsize: () => setShowTextSize(true), font: () => setShowFont(true),
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
    };
    if (panels[toolId]) panels[toolId]();
  };

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
    setPhotoEditLoading(true);
    try {
      const res = await axios.post(`${API}/zeta/photo-edit`, {
        image_data: photoEditImage,
        edit_prompt: photoEditPrompt
      });
      if (res.data.images && res.data.images.length > 0) {
        setPhotoEditResult(`data:${res.data.images[0].mime_type};base64,${res.data.images[0].data}`);
      }
    } catch (err) {
      console.error('Photo edit failed:', err);
      alert('Photo edit failed. Please try again.');
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
    const labels = chartLabels.split(',').map(l => l.trim());
    const data = chartData.split(',').map(d => parseFloat(d.trim()) || 0);
    
    // Create SVG-based chart (more reliable than canvas)
    const width = 400, height = 300;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxValue = Math.max(...data, 1);
    
    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background:white">`;
    
    // Add background image if selected
    if (chartImage) {
      svgContent += `<image href="${chartImage}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" opacity="0.3"/>`;
    }
    
    svgContent += `<text x="${width/2}" y="20" text-anchor="middle" font-size="14" font-weight="bold">${chartTitle}</text>`;
    
    if (chartType === 'bar') {
      const barWidth = chartWidth / labels.length - 10;
      labels.forEach((label, i) => {
        const barHeight = (data[i] / maxValue) * chartHeight;
        const x = padding + i * (barWidth + 10);
        const y = padding + chartHeight - barHeight;
        svgContent += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="${chartColors[i % chartColors.length]}"/>`;
        svgContent += `<text x="${x + barWidth/2}" y="${height - 10}" text-anchor="middle" font-size="10">${label}</text>`;
        svgContent += `<text x="${x + barWidth/2}" y="${y - 5}" text-anchor="middle" font-size="10">${data[i]}</text>`;
      });
    } else if (chartType === 'pie') {
      const total = data.reduce((a, b) => a + b, 0) || 1;
      const cx = width / 2, cy = height / 2 + 10, r = 100;
      let startAngle = 0;
      labels.forEach((label, i) => {
        const angle = (data[i] / total) * Math.PI * 2;
        const endAngle = startAngle + angle;
        const x1 = cx + r * Math.cos(startAngle);
        const y1 = cy + r * Math.sin(startAngle);
        const x2 = cx + r * Math.cos(endAngle);
        const y2 = cy + r * Math.sin(endAngle);
        const largeArc = angle > Math.PI ? 1 : 0;
        svgContent += `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z" fill="${chartColors[i % chartColors.length]}"/>`;
        startAngle = endAngle;
      });
    } else if (chartType === 'line') {
      const pointSpacing = chartWidth / (labels.length - 1 || 1);
      let pathD = '';
      labels.forEach((label, i) => {
        const x = padding + i * pointSpacing;
        const y = padding + chartHeight - (data[i] / maxValue) * chartHeight;
        pathD += (i === 0 ? 'M' : 'L') + `${x},${y}`;
        svgContent += `<circle cx="${x}" cy="${y}" r="4" fill="${PRESET_COLORS[0]}"/>`;
        svgContent += `<text x="${x}" y="${height - 10}" text-anchor="middle" font-size="10">${label}</text>`;
      });
      svgContent += `<path d="${pathD}" stroke="${PRESET_COLORS[0]}" stroke-width="2" fill="none"/>`;
    }
    
    svgContent += '</svg>';
    const imgSrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgContent)));
    const updated = [...canvasElements, { id: `el_${Date.now()}`, type: 'chart', x: 50, y: 50, width, height, src: imgSrc }];
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

  // === WORD COUNT ===
  const getWordCount = () => {
    let total = 0;
    canvasElements.forEach(el => {
      if (el.type === 'text' && el.content) {
        const words = el.content.trim().split(/\s+/).filter(w => w.length > 0);
        total += words.length;
      }
    });
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
    
    // Check usage limit before making request
    if (userUsage && userUsage.remaining?.ai_images <= 0) {
      alert(`⚠️ Günlük AI görsel limitinize ulaştınız (${userUsage.limits?.ai_images || 0}/${userUsage.limits?.ai_images || 0}).\n\nYarın tekrar deneyin veya planınızı yükseltin.`);
      return;
    }
    
    setAiGenerating(true); setAiPreview(null);
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, { prompt: aiPrompt, reference_image: aiReference }, { withCredentials: true });
      if (res.data.images?.length > 0) { 
        setAiMimeType(res.data.images[0].mime_type || 'image/png'); 
        setAiPreview(res.data.images[0].data);
        // Update local usage count
        setUserUsage(prev => prev ? {
          ...prev,
          usage: { ...prev.usage, ai_images: (prev.usage?.ai_images || 0) + 1 },
          remaining: { ...prev.remaining, ai_images: Math.max(0, (prev.remaining?.ai_images || 0) - 1) }
        } : prev);
      }
    } catch (err) {
      if (err.response?.status === 429) {
        alert(err.response?.data?.detail || 'Günlük AI görsel limitinize ulaştınız.');
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
  const getDocText = () => canvasElements.filter(el => el.type === 'text').sort((a, b) => a.y - b.y).map(el => el.content).join('. ');
  
  // Get full document content for ZETA (includes all element types)
  const getFullDocContent = () => {
    const elements = canvasElements.map(el => {
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
        {/* Usage limit info */}
        {userUsage && (
          <div className="text-xs px-2 py-1.5 rounded flex items-center justify-between" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
            <span style={{ color: 'var(--zet-text-muted)' }}>Kalan AI Görsel:</span>
            <span style={{ color: userUsage.remaining?.ai_images > 0 ? '#22c55e' : '#ef4444' }}>
              {userUsage.remaining?.ai_images || 0} / {userUsage.limits?.ai_images || 0}
            </span>
          </div>
        )}
        {aiTargetShape && <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>Adding to: {aiTargetShape.startsWith('vector_') ? 'Vector Shape' : 'Shape'}</div>}
        <div><label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference</label><label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2"><Upload className="h-3 w-3" />{aiReference ? 'Loaded' : 'Upload'}<input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); } }} className="hidden" /></label></div>
        {aiPreview && <div className="space-y-2"><img data-testid="ai-image-preview" src={`data:${aiMimeType};base64,${aiPreview}`} alt="AI" className="w-full rounded border" style={{ borderColor: 'var(--zet-border)', maxHeight: 200, objectFit: 'contain' }} /><button data-testid="ai-image-add-btn" onClick={addAiImageToCanvas} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2"><Plus className="h-4 w-4" /> {aiTargetShape ? 'Add to Shape' : 'Add to Document'}</button></div>}
        <div className="flex gap-1"><input data-testid="ai-image-prompt" placeholder="Describe image..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" /><button data-testid="ai-image-generate-btn" onClick={generateAIImage} disabled={aiGenerating || (userUsage?.remaining?.ai_images === 0)} className="zet-btn px-2">{aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}</button></div>
        
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
      <div className="w-64 space-y-2">
        {TEMPLATES.map(tpl => (
          <button key={tpl.id} onClick={() => applyTemplate(tpl.id)} className="w-full p-3 rounded text-left hover:bg-white/5 transition-colors" style={{ background: 'var(--zet-bg)' }}>
            <div className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{tpl.name}</div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}>
              {tpl.id === 'cv' && 'Professional resume layout'}
              {tpl.id === 'report' && 'Annual/project report'}
              {tpl.id === 'letter' && 'Formal business letter'}
              {tpl.id === 'invoice' && 'Bill/invoice template'}
              {tpl.id === 'presentation' && 'Title slide design'}
              {tpl.id === 'blank' && 'Start from scratch'}
            </div>
          </button>
        ))}
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
            pageBackground={pageBackground} gradientStart={gradientStart} gradientEnd={gradientEnd}
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
                documentContent={getFullDocContent()} userUsage={userUsage} userPlan={userPlan} />
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
          <button data-testid="save-btn" onClick={() => saveDocument()} className="zet-btn flex items-center gap-1 text-xs px-3 py-1.5"><Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} /></button>
          <img src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" alt="ZET" className="h-7 w-7 ml-1" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <Toolbox tools={TOOLS} activeTool={activeTool} onToolSelect={handleToolSelect}
          onDeleteSelected={deleteSelected} hasSelection={!!selectedElement || selectedElements.length > 0}
          zoom={zoom} isOpen={toolboxOpen} onToggle={() => setToolboxOpen(!toolboxOpen)} />

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
          pageBackground={pageBackground} gradientStart={gradientStart} gradientEnd={gradientEnd}
          zoomLevel={zoomLevel} zoomRadius={zoomRadius} magnifierPos={magnifierPos} setMagnifierPos={setMagnifierPos}
          onAddPage={addPage} onCopyElement={copyElementById} onMirrorElement={mirrorElementById}
          rulerVisible={rulerVisible} gridVisible={gridVisible} gridSize={gridSize} />

        <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
          pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
          docId={docId} wordCount={getWordCount()} canvasContainerRef={canvasContainerRef}
          onExport={exportToPDF} exporting={exporting} documentContent={getDocText()} userUsage={userUsage} userPlan={userPlan} />
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

      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); setChangeImageTarget(null); }}>
          <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{changeImageTarget ? 'Change Image' : uploadForShape ? 'Add to Shape' : t('image')}</h3>
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
