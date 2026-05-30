import React, { useState, useEffect, useRef, useCallback } from 'react';
import { A4LoadingScreen } from '../components/LoadingScreens';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppTheme } from '../contexts/AppThemeContext';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { TOOLS, PAGE_SIZES, FONTS, PRESET_COLORS, TRANSLATE_LANGUAGES, LINE_SPACINGS, TEXT_ALIGNMENTS, CHART_TYPES, TEMPLATES, DEFAULT_SHORTCUTS, DEFAULT_PAGE_SIZE, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR, DEFAULT_ZOOM } from '../lib/editorConstants';
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
      const el = document.documentElement;
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

  // Text/style state
  const [currentFontSize, setCurrentFontSize] = useState(DEFAULT_FONT_SIZE);
  const [currentFont, setCurrentFont] = useState(DEFAULT_FONT);
  const [currentColor, setCurrentColor] = useState(DEFAULT_COLOR);
  const [customColor, setCustomColor] = useState(DEFAULT_COLOR);
  const [fontSearch, setFontSearch] = useState('');
  const [googleFonts, setGoogleFonts] = useState([]);
  const [loadedFonts, setLoadedFonts] = useState({});
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
  const [spellCheckEnabled, setSpellCheckEnabled] = useState(true);

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
  const autoSaveTimerRef = useRef(null);
  const latestSaveDataRef = useRef(null);
  const isMountedRef = useRef(true);
  const canvasContainerRef = useRef(null);
  const gradientBarRef = useRef(null);
  const activeToolRef = useRef('select');
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

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
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcuts, selectedElement, selectedElements]);

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
  const pendingPdfRef = useRef(null);
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

  // === PENDING PDF IMPORT (from Dashboard "PDF Düzenle" flow) ===
  useEffect(() => {
    if (!document || !pendingPdfRef.current) return;
    const file = pendingPdfRef.current;
    pendingPdfRef.current = null;
    importPDF(file);
  }, [document]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`${API}/documents/${docId}`, { withCredentials: true });
      if (!isMountedRef.current) return;
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
      // Pick up pending PDF passed from Dashboard via window (no localStorage size limit)
      if (window.__zetPdf?.docId === docId) {
        pendingPdfRef.current = window.__zetPdf.file;
        window.__zetPdf = null;
      }
    } catch {
      if (!isMountedRef.current) return;
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

  async function saveDocument(silent = false) {
    if (!document) return;
    if (!silent) setSaving(true);
    setSaveStatus('saving');
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = { ...updatedPages[currentPage], elements: canvasElements, drawPaths, pageSize };
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
    try {
      await axios.put(`${API}/documents/${docId}`, { title: document.title, subtitle: document.subtitle || null, content: document.content, pages: updatedPages }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
      setSaveStatus('saved');
      localStorage.removeItem(`zet_offline_doc_${docId}`);
    } catch { setSaveStatus('error'); } finally { if (!silent) setSaving(false); }
  }

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

  const handleUpdateSettings = (updates) => {
    if (updates.zetaMood !== undefined) setZetaMood(updates.zetaMood);
    if (updates.zetaEmoji !== undefined) setZetaEmoji(updates.zetaEmoji);
  };

  const handleZetaTakeNote = async (content) => {
    // Note already saved by RightPanel; this can trigger a UI refresh if needed
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
    const _html = document.documentElement;
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
    const target = selectedElement || lastSelectedRef.current;
    if (target) {
      setCanvasElements(prev => {
        const updated = prev.map(el => el.id === target ? { ...el, textAlign: align } : el);
        handleSaveHistory(updated);
        return updated;
      });
    }
  };

  // === EXPORT PDF (all pages) ===
  const exportToPDF = async () => {
    if (!canvasContainerRef.current) return;
    setExporting(true);
    try {
      const allPages = document?.pages || [{ elements: canvasElements }];
      const pageElements = canvasContainerRef.current.querySelectorAll('[data-testid^="canvas-page-"]');
      if (!pageElements.length) return;
      const firstPSize = allPages[0]?.pageSize || pageSize;
      const pdf = new jsPDF({ orientation: firstPSize.width > firstPSize.height ? 'l' : 'p', unit: 'px', format: [firstPSize.width, firstPSize.height], hotfixes: ['px_scaling'] });
      for (let i = 0; i < pageElements.length; i++) {
        const pSize = allPages[i]?.pageSize || pageSize;
        if (i > 0) pdf.addPage([pSize.width, pSize.height], pSize.width > pSize.height ? 'l' : 'p');
        const el = pageElements[i];
        // Capture scale: make captured image exactly pSize at 2x quality, regardless of current zoom
        const captureScale = (pSize.width / el.offsetWidth) * 2;
        // Temporarily clip overflow so rulers/handles outside page bounds don't bleed into capture
        const prevOverflow = el.style.overflow;
        el.style.overflow = 'hidden';
        const capturedCanvas = await html2canvas(el, {
          scale: captureScale,
          useCORS: true,
          backgroundColor: pageBackground,
          width: el.offsetWidth,
          height: el.offsetHeight,
        });
        el.style.overflow = prevOverflow;
        const imgData = capturedCanvas.toDataURL('image/jpeg', 0.92);
        pdf.addImage(imgData, 'JPEG', 0, 0, pSize.width, pSize.height);
        // Invisible text layer for searchability
        const pageEls = i === currentPage ? canvasElements : (allPages[i]?.elements || []);
        pdf.setTextColor(0, 0, 0);
        pdf.setGState(new pdf.GState({ opacity: 0 }));
        pageEls.forEach(textEl => {
          if (textEl.type === 'text' && textEl.content) {
            const fs = (textEl.fontSize || 14);
            pdf.setFontSize(fs);
            const lines = (textEl.content || '').split('\n');
            lines.forEach((line, li) => {
              pdf.text(line, textEl.x, textEl.y + fs + li * fs * (textEl.lineHeight || 1.5));
            });
          }
        });
        pdf.setGState(new pdf.GState({ opacity: 1 }));
      }
      pdf.save(`${document?.title || 'document'}.pdf`);
    } catch (err) { console.error('Export failed:', err); } finally {
      setExporting(false);
      setShowExport(false);
    }
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

  // Import .ms file
  const importFromMS = async (file) => {
    try {
      const msDoc = await importFromMSFile(file);
      const editorDoc = convertFromMSFormat(msDoc);
      if (editorDoc.title) setDocument(prev => ({ ...prev, title: editorDoc.title }));
      if (editorDoc.pages && editorDoc.pages.length > 0) {
        setDocument(prev => ({ ...prev, pages: editorDoc.pages }));
        setCurrentPage(0);
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

  // Import PDF
  const importPDF = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) { alert('Lütfen bir PDF dosyası seçin'); return; }
    setPdfImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      const res = await axios.post(`${API}/pdf/extract-text`, formData, { withCredentials: true, headers: { 'Content-Type': 'multipart/form-data' } });
      const pdfPages = res.data.pages || [];
      if (pdfPages.length === 0 || pdfPages.every(p => !p.text)) { alert('PDF içerik bulunamadı veya sadece görsel içeriyor.'); return; }

      const ml = marginLeft || 40, mr = marginRight || 40, mt = marginTop || 40;
      const textWidth = pageSize.width - ml - mr;
      const t = Date.now();

      // Map PDF font name to a web-safe font family
      const resolvePdfFont = (fontName) => {
        if (!fontName) return currentFont;
        const fn = fontName.toLowerCase();
        if (fn.includes('courier')) return 'Courier New';
        if (fn.includes('times')) return 'Times New Roman';
        if (fn.includes('helvetica') || fn.includes('arial')) return 'Arial';
        if (fn.includes('calibri')) return 'Calibri';
        if (fn.includes('georgia')) return 'Georgia';
        return currentFont;
      };

      // Detect dominant font from first non-empty page
      const firstWithFont = pdfPages.find(p => p.font_name);
      const pdfFont = resolvePdfFont(firstWithFont?.font_name);

      const makeTextEl = (pg, idx) => ({
        id: `el_pdf_${t}_${idx}`,
        type: 'text',
        x: ml, y: mt,
        content: pg.text || '',
        htmlContent: (pg.text || '').replace(/\n/g, '<br>'),
        fontSize: currentFontSize,
        fontFamily: pdfFont,
        color: currentColor,
        width: textWidth,
        lineHeight: 1.5,
        textAlign: 'left', bold: false, italic: false, underline: false,
      });

      // First PDF page → appended to current canvas page
      const firstEl = makeTextEl(pdfPages[0], 0);
      const updatedCurrentElements = [...canvasElements, firstEl];

      // Remaining PDF pages → new canvas pages inserted after current page
      const newCanvasPages = pdfPages.slice(1).map((pg, i) => ({
        page_id: `page_pdf_${t}_${i + 1}`,
        elements: [makeTextEl(pg, i + 1)],
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
  const handleExport = (format) => {
    setExportFormat(format);
    if (format === 'pdf') exportToPDF();
    else if (format === 'png') exportToImage('png');
    else if (format === 'jpeg') exportToImage('jpeg');
    else if (format === 'svg') exportToSVG();
    else if (format === 'json') exportToJSON();
    else if (format === 'ms') exportToMS();
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
        { id: `el_${now}_1`, type: 'shape', x: 0, y: 0, width: 595, height: 5, shapeType: 'square', fill: '#4ca8ad' },
        { id: `el_${now}_2`, type: 'text', x: 40, y: 30, content: 'ZET', font: 'Montserrat', fontSize: 12, color: '#4ca8ad', bold: true },
        { id: `el_${now}_3`, type: 'text', x: 40, y: 65, content: 'BUSINESS REPORT', font: 'Montserrat', fontSize: 34, color: '#0f172a', bold: true },
        { id: `el_${now}_4`, type: 'text', x: 40, y: 108, content: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long' }), font: 'Inter', fontSize: 12, color: '#64748b' },
        { id: `el_${now}_5`, type: 'shape', x: 40, y: 132, width: 515, height: 1, shapeType: 'square', fill: '#e2e8f0' },
        { id: `el_${now}_6`, type: 'text', x: 40, y: 155, content: 'EXECUTIVE SUMMARY', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_7`, type: 'text', x: 40, y: 173, content: 'This report presents a comprehensive analysis of performance, key achievements, and strategic direction. Our results demonstrate consistent growth and operational excellence across all divisions.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_8`, type: 'text', x: 40, y: 243, content: 'KEY METRICS', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_9`, type: 'shape', x: 40, y: 262, width: 115, height: 65, shapeType: 'square', fill: '#f0fdfa' },
        { id: `el_${now}_10`, type: 'text', x: 97, y: 276, content: '+28%', font: 'Montserrat', fontSize: 20, color: '#0d9488', bold: true, textAlign: 'center' },
        { id: `el_${now}_11`, type: 'text', x: 97, y: 304, content: 'Revenue', font: 'Inter', fontSize: 9, color: '#64748b', textAlign: 'center' },
        { id: `el_${now}_12`, type: 'shape', x: 165, y: 262, width: 115, height: 65, shapeType: 'square', fill: '#eff6ff' },
        { id: `el_${now}_13`, type: 'text', x: 222, y: 276, content: '94%', font: 'Montserrat', fontSize: 20, color: '#2563eb', bold: true, textAlign: 'center' },
        { id: `el_${now}_14`, type: 'text', x: 222, y: 304, content: 'Satisfaction', font: 'Inter', fontSize: 9, color: '#64748b', textAlign: 'center' },
        { id: `el_${now}_15`, type: 'shape', x: 290, y: 262, width: 115, height: 65, shapeType: 'square', fill: '#fdf4ff' },
        { id: `el_${now}_16`, type: 'text', x: 347, y: 276, content: '3 New', font: 'Montserrat', fontSize: 20, color: '#7c3aed', bold: true, textAlign: 'center' },
        { id: `el_${now}_17`, type: 'text', x: 347, y: 304, content: 'Markets', font: 'Inter', fontSize: 9, color: '#64748b', textAlign: 'center' },
        { id: `el_${now}_18`, type: 'text', x: 40, y: 352, content: 'HIGHLIGHTS', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_19`, type: 'text', x: 40, y: 370, content: '→ Revenue grew 28% YoY driven by new market expansion\n→ Launched 5 innovative products — 40k+ users in first month\n→ Achieved 94% customer satisfaction score across all segments\n→ Reduced operational costs 15% through process automation', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_20`, type: 'text', x: 40, y: 488, content: 'OUTLOOK', font: 'Montserrat', fontSize: 10, color: '#4ca8ad', bold: true },
        { id: `el_${now}_21`, type: 'text', x: 40, y: 506, content: 'We are positioned for continued growth with investment in digital transformation and talent development. Strategic roadmap targets 35% growth for the coming fiscal year.', font: 'Inter', fontSize: 11, color: '#334155', lineHeight: 1.75 },
        { id: `el_${now}_22`, type: 'shape', x: 0, y: 822, width: 595, height: 20, shapeType: 'square', fill: '#0f172a' },
        { id: `el_${now}_23`, type: 'text', x: 297, y: 828, content: 'Confidential  •  ZET Business Documents', font: 'Inter', fontSize: 8, color: '#94a3b8', textAlign: 'center' },
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
    setCurrentColor(color);
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
    planLimits, qrText, replaceInDocument, replaceText, rotateElement, rulerVisible, selectedElement,
    setActiveStopId, setActiveTool, setAiAspectRatio, setAiImagePro, setAiPreview, setAiPrompt, setAiReference, setAiTargetShape,
    setCalcCopied, setCalcExpr, setCalcResult, setCanvasElements,
    setChartColors, setChartData, setChartImage, setChartLabels, setChartTitle, setChartType,
    setColorTarget, setColumnCount, setColumnGap,
    setCurrentBulletStyle, setCurrentColor, setCurrentFont, setCurrentFontSize, setCurrentLineHeight, setCurrentNumberStyle,
    setCustomColor, setCustomHeight, setCustomWidth, setDocument, setDrawOpacity, setDrawSize,
    setEditingChartId, setEditingShortcut, setEraserDragMode, setEraserSize, setExportQuality,
    setFindScope, setFindText, setFirstLineIndent, setFontSearch,
    setFooterEven, setFooterOdd, setFooterText, setGradientAngle, setGradientEnd, setGradientStart, setGradientStops,
    setGridSize, setGridVisible, setHeaderEven, setHeaderFooterMode, setHeaderOdd, setHeaderText,
    setHexInput, setHighlighterColor,
    setIndentBottom, setIndentLeft, setIndentRight, setIndentTop,
    setIsBold, setIsDrawingOnPhoto, setIsItalic, setIsStrikethrough, setIsUnderline,
    setJudgeMood, setMagnifierBorderColor, setMagnifierGradientEnd, setMagnifierGradientStart,
    setMarginBottom, setMarginLeft, setMarginRight, setMarginTop, setMirrorAngle, setPageBackground,
    setPageNumberFormat, setPageNumberPosition, setPageNumberStart, setPageNumberStyle, setPageSize, setPageSizeScope,
    setParagraphSpaceAfter, setParagraphSpaceBefore,
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
    startElevenLabsSTT, startListening, stopElevenLabsSTT, stopListening,
    tableCols, tableRows, toggleLayerLock, toggleLayerVisibility, togglePageNumbers,
    translateElementId, translateLang, translateLoading, translateResult, translateText,
    updatePageNumberSettings, updateShortcut, useMagnifierGradient, voiceTranscript,
    watermarkColor, watermarkOpacity, watermarkText,
    zetaCustomPrompt, zetaEmoji, zetaMood, zoomLevel, zoomRadius,
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
    importPDF, isOnline, isFreeOffline, isPlaying,
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
    skipVoice, stopVoice,
    toolboxOpen, setToolboxOpen, upgradeReason, uploadForShape,
    useGradient, userPlan, userUsage, voiceLoading, voiceProgress, zoom,
    showLink, setShowLink, linkUrl, setLinkUrl, linkText, setLinkText, addLinkToCanvas,
  };
  // =============================
  if (isMobile) {
    return (
      <EditorStateContext.Provider value={providerValue}>
      <EditorMobileLayout />
      </EditorStateContext.Provider>
    );
  }

  // =============================
  // DESKTOP LAYOUT
  // =============================
  return (
    <EditorStateContext.Provider value={providerValue}>
    <EditorDesktopLayout />
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
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Editor crashed</div>
          <pre style={{ background: '#1a1a2e', color: '#fca5a5', padding: 16, borderRadius: 8, fontSize: 12, maxWidth: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{String(this.state.error)}</pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: '8px 24px', background: '#4ca8ad', color: '#fff', borderRadius: 8, border: 'none', cursor: 'pointer' }}>Reload</button>
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
