import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { TOOLS, PAGE_SIZES, FONTS, PRESET_COLORS, TRANSLATE_LANGUAGES, LINE_SPACINGS, DEFAULT_PAGE_SIZE, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR, DEFAULT_ZOOM } from '../lib/editorConstants';
import { Toolbox } from '../components/editor/Toolbox';
import { CanvasArea } from '../components/editor/CanvasArea';
import { RightPanel } from '../components/editor/RightPanel';
import { DraggablePanel } from '../components/editor/DraggablePanel';
import axios from 'axios';
import {
  Home, Save, Undo, Redo, ArrowLeft, ArrowRight,
  Upload, Search, Loader2, X, Wand2, Plus, Check,
  Play, Pause, SkipBack, SkipForward, Volume2, Languages,
  Bold, Italic, Underline, Strikethrough, Highlighter,
  Menu, Layers, Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
  const [uploadForShape, setUploadForShape] = useState(null);
  const [changeImageTarget, setChangeImageTarget] = useState(null);

  // History
  const history = useCanvasHistory(canvasElements);
  const autoSaveTimerRef = useRef(null);
  const canvasContainerRef = useRef(null);

  // === Ctrl+Z / Ctrl+Y ===
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target.contentEditable === 'true') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // === DATA LOADING ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocument(); }, [docId]);

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
    };
    if (panels[toolId]) panels[toolId]();
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
    setAiGenerating(true); setAiPreview(null);
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, { prompt: aiPrompt, reference_image: aiReference }, { withCredentials: true });
      if (res.data.images?.length > 0) { setAiMimeType(res.data.images[0].mime_type || 'image/png'); setAiPreview(res.data.images[0].data); }
    } catch {}
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
  const playVoiceFrom = (startFraction = 0) => {
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
  const skipVoice = (dir) => {
    const fullText = voiceTextRef.current || getDocText(); if (!fullText) return;
    const skip = Math.floor(fullText.length * 0.1);
    const newIndex = dir === 'back' ? Math.max(0, voiceCharIndexRef.current - skip) : Math.min(fullText.length, voiceCharIndexRef.current + skip);
    playVoiceFrom(newIndex / fullText.length);
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
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {eraserSize}px</label><input type="range" min="5" max="50" value={eraserSize} onChange={e => setEraserSize(Number(e.target.value))} className="w-full accent-blue-500" /></div>
        <div className="flex items-center justify-center p-3 rounded" style={{ background: 'var(--zet-bg)' }}><div className="rounded-full border-2 border-dashed" style={{ width: eraserSize * 2, height: eraserSize * 2, borderColor: 'var(--zet-primary-light)' }} /></div>
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
      <div className="space-y-3 w-56"><div className="grid grid-cols-6 gap-1.5">{PRESET_COLORS.map(c => <button key={c} onClick={() => applyColor(c)} className={`w-7 h-7 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />)}</div>
        <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Custom</label><input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColor(e.target.value); }} className="w-full h-8 rounded cursor-pointer" /></div>
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
        {aiTargetShape && <div className="text-xs px-2 py-1.5 rounded" style={{ background: 'var(--zet-primary)', color: 'var(--zet-text)' }}>Adding to: {aiTargetShape.startsWith('vector_') ? 'Vector Shape' : 'Shape'}</div>}
        <div><label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference</label><label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2"><Upload className="h-3 w-3" />{aiReference ? 'Loaded' : 'Upload'}<input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); } }} className="hidden" /></label></div>
        {aiPreview && <div className="space-y-2"><img data-testid="ai-image-preview" src={`data:${aiMimeType};base64,${aiPreview}`} alt="AI" className="w-full rounded border" style={{ borderColor: 'var(--zet-border)', maxHeight: 200, objectFit: 'contain' }} /><button data-testid="ai-image-add-btn" onClick={addAiImageToCanvas} className="zet-btn w-full flex items-center justify-center gap-1.5 text-sm py-2"><Plus className="h-4 w-4" /> {aiTargetShape ? 'Add to Shape' : 'Add to Document'}</button></div>}
        <div className="flex gap-1"><input data-testid="ai-image-prompt" placeholder="Describe image..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" /><button data-testid="ai-image-generate-btn" onClick={generateAIImage} disabled={aiGenerating} className="zet-btn px-2">{aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}</button></div>
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
  </>);

  // =============================
  // MOBILE LAYOUT
  // =============================
  if (isMobile) {
    return (
      <div data-testid="editor-page" className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
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

        {/* Mobile Canvas */}
        <CanvasArea document={document} currentPage={currentPage} changePage={changePage}
          canvasElements={canvasElements} setCanvasElements={setCanvasElements}
          drawPaths={drawPaths} setDrawPaths={setDrawPaths} pageSize={pageSize} zoom={zoom} setZoom={setZoom}
          activeTool={activeTool} currentFontSize={currentFontSize} currentFont={currentFont} currentColor={currentColor}
          currentLineHeight={currentLineHeight} drawSize={drawSize} drawOpacity={drawOpacity} eraserSize={eraserSize}
          markingColor={markingColor} markingOpacity={markingOpacity} markingSize={markingSize}
          selectedElement={selectedElement} setSelectedElement={setSelectedElement}
          selectedElements={selectedElements} setSelectedElements={setSelectedElements}
          onSaveHistory={handleSaveHistory} canvasContainerRef={canvasContainerRef}
          onElementSelect={handleElementSelect} onDeleteElement={deleteElement}
          onChangeImage={handleChangeImage} onAddImageToShape={handleAddImageToShape}
          onAddAiImageToShape={handleAddAiImageToShape}
          isBold={isBold} isItalic={isItalic} isUnderline={isUnderline} isStrikethrough={isStrikethrough} />

        {/* Mobile Bottom Toolbar */}
        <div className="border-t flex-shrink-0" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg-card)' }}>
          <div className="flex items-center overflow-x-auto px-1 py-1.5 gap-0.5 no-scrollbar mobile-toolbar">
            {TOOLS.filter(t => t.id !== 'addpage').map(tool => (
              <button key={tool.id} onClick={() => handleToolSelect(tool.id)}
                className={`tool-btn flex-shrink-0 ${activeTool === tool.id ? 'active' : ''}`}>
                <tool.icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Floating Action Buttons */}
        <div className="fixed right-3 bottom-20 flex flex-col gap-2 z-40">
          <button onClick={() => setMobilePanel(mobilePanel === 'pages' ? null : 'pages')}
            className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center ${mobilePanel === 'pages' ? 'glow-sm' : ''}`}
            style={{ background: 'var(--zet-primary)' }}><Layers className="h-4 w-4 text-white" /></button>
          <button onClick={() => setMobilePanel(mobilePanel === 'zeta' ? null : 'zeta')}
            className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center ${mobilePanel === 'zeta' ? 'glow-sm' : ''}`}
            style={{ background: 'var(--zet-primary-light)' }}><Sparkles className="h-4 w-4 text-white" /></button>
        </div>

        {/* Mobile Side Panel */}
        {mobilePanel && (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-black/40" onClick={() => setMobilePanel(null)} />
            <div className="w-72 h-full" style={{ background: 'var(--zet-bg-card)' }}>
              <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
                pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
                docId={docId} charCount={charCount} canvasContainerRef={canvasContainerRef}
                forceSection={mobilePanel} />
            </div>
          </div>
        )}

        {/* Voice bar + floating panels */}
        {showVoice && (
          <div className="p-2 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
            <div className="flex items-center gap-2">
              <button onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
              <button onClick={isPlaying ? () => { window.speechSynthesis.pause(); setIsPlaying(false); } : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-8 h-8">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <button onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
              <div className="flex-1 h-2 rounded-full cursor-pointer" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(f); }}>
                <div className="h-full rounded-full" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} />
              </div>
              <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setShowVoice(false); }} className="p-1"><X className="h-3.5 w-3.5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
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
          currentLineHeight={currentLineHeight} drawSize={drawSize} drawOpacity={drawOpacity} eraserSize={eraserSize}
          markingColor={markingColor} markingOpacity={markingOpacity} markingSize={markingSize}
          selectedElement={selectedElement} setSelectedElement={setSelectedElement}
          selectedElements={selectedElements} setSelectedElements={setSelectedElements}
          onSaveHistory={handleSaveHistory} canvasContainerRef={canvasContainerRef}
          onElementSelect={handleElementSelect} onDeleteElement={deleteElement}
          onChangeImage={handleChangeImage} onAddImageToShape={handleAddImageToShape}
          onAddAiImageToShape={handleAddAiImageToShape}
          isBold={isBold} isItalic={isItalic} isUnderline={isUnderline} isStrikethrough={isStrikethrough} />

        <RightPanel document={document} currentPage={currentPage} setCurrentPage={changePage}
          pageSize={pageSize} zoom={zoom} onAddPage={addPage} onDeletePage={deletePage}
          docId={docId} charCount={charCount} canvasContainerRef={canvasContainerRef} />
      </div>

      {showVoice && (
        <div data-testid="voice-bar" className="p-3 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <Volume2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
            <button data-testid="voice-skip-back" onClick={() => skipVoice('back')} className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
            <button data-testid="voice-play-btn" onClick={isPlaying ? () => { window.speechSynthesis.pause(); setIsPlaying(false); } : () => playVoiceFrom(voiceProgress / 100)} className="tool-btn w-9 h-9">{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
            <button data-testid="voice-skip-forward" onClick={() => skipVoice('forward')} className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
            <div data-testid="voice-timeline" className="flex-1 h-2.5 rounded-full cursor-pointer relative group" style={{ background: 'var(--zet-bg)' }} onClick={e => { const f = (e.clientX - e.currentTarget.getBoundingClientRect().left) / e.currentTarget.getBoundingClientRect().width; playVoiceFrom(Math.max(0, Math.min(1, f))); }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} /><div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" style={{ left: `calc(${voiceProgress}% - 8px)`, background: 'var(--zet-primary-light)' }} /></div>
            <button onClick={() => { window.speechSynthesis.cancel(); setIsPlaying(false); setShowVoice(false); }} className="p-1 hover:bg-white/10 rounded"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
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
