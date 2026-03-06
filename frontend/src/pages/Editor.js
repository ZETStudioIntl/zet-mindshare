import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useCanvasHistory } from '../hooks/useCanvasHistory';
import { TOOLS, PAGE_SIZES, FONTS, PRESET_COLORS, DEFAULT_PAGE_SIZE, DEFAULT_FONT_SIZE, DEFAULT_FONT, DEFAULT_COLOR, DEFAULT_ZOOM } from '../lib/editorConstants';
import { Toolbox } from '../components/editor/Toolbox';
import { CanvasArea } from '../components/editor/CanvasArea';
import { RightPanel } from '../components/editor/RightPanel';
import { DraggablePanel } from '../components/editor/DraggablePanel';
import axios from 'axios';
import {
  Home, Save, Undo, Redo, ArrowLeft, ArrowRight,
  Upload, Search, Loader2, X, Wand2,
  Play, Pause, SkipBack, SkipForward, Volume2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  // Drawing state
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(100);

  // AI Image state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuality, setAiQuality] = useState('standard');
  const [aiReference, setAiReference] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiChat, setAiChat] = useState([]);

  // Voice state
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);

  // Panel visibility
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showCreateImage, setShowCreateImage] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(null);
  const [uploadForShape, setUploadForShape] = useState(null);

  // History
  const history = useCanvasHistory(canvasElements);

  // Refs
  const autoSaveTimerRef = useRef(null);
  const canvasContainerRef = useRef(null);

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
    } else {
      setCanvasElements([]);
      setDrawPaths([]);
    }
    setSelectedElement(null);
    setSelectedElements([]);
  }, [document, currentPage]);

  // === AUTO-SAVE ===
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (canvasElements.length > 0 && document) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => saveDocument(true), 2000);
    }
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [canvasElements, drawPaths]);

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`${API}/documents/${docId}`, { withCredentials: true });
      setDocument(res.data);
    } catch {
      navigate('/dashboard');
    }
  };

  const saveDocument = async (silent = false) => {
    if (!document) return;
    if (!silent) setSaving(true);
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = {
        ...updatedPages[currentPage],
        elements: canvasElements,
        drawPaths: drawPaths,
        pageSize: pageSize
      };
    }
    try {
      await axios.put(`${API}/documents/${docId}`, {
        title: document.title, content: document.content, pages: updatedPages
      }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
    } catch {}
    finally { if (!silent) setSaving(false); }
  };

  // === PAGE MANAGEMENT ===
  const addPage = () => {
    const newPage = { page_id: `page_${Date.now()}`, elements: [], drawPaths: [], pageSize };
    setDocument(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
    setTimeout(() => setCurrentPage(document.pages.length), 100);
  };

  const deletePage = (index) => {
    if (document.pages.length <= 1) return;
    setDocument(prev => ({ ...prev, pages: prev.pages.filter((_, i) => i !== index) }));
    if (currentPage >= index && currentPage > 0) setCurrentPage(currentPage - 1);
  };

  // === HISTORY ===
  const handleSaveHistory = useCallback((elements) => {
    history.push(elements);
  }, [history]);

  const handleUndo = () => {
    const prev = history.undo();
    if (prev) setCanvasElements(prev);
  };

  const handleRedo = () => {
    const next = history.redo();
    if (next) setCanvasElements(next);
  };

  // === DELETE ===
  const deleteSelected = () => {
    let updated;
    if (selectedElements.length > 0) {
      updated = canvasElements.filter(el => !selectedElements.includes(el.id));
      setSelectedElements([]);
    } else if (selectedElement) {
      updated = canvasElements.filter(el => el.id !== selectedElement);
      setSelectedElement(null);
    } else return;
    setCanvasElements(updated);
    history.push(updated);
  };

  // === TOOL SELECT ===
  const handleToolSelect = (toolId) => {
    setActiveTool(toolId);
    if (toolId === 'image') setShowImageUpload(true);
    if (toolId === 'pagesize') setShowPageSize(true);
    if (toolId === 'textsize') setShowTextSize(true);
    if (toolId === 'font') setShowFont(true);
    if (toolId === 'voice') setShowVoice(true);
    if (toolId === 'color') setShowColor(true);
    if (toolId === 'draw') setShowDraw(true);
    if (toolId === 'createimage') setShowCreateImage(true);
    if (toolId === 'addpage') addPage();
  };

  // === IMAGE UPLOAD ===
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (uploadForShape) {
          const updated = canvasElements.map(el => el.id === uploadForShape ? { ...el, image: event.target.result } : el);
          setCanvasElements(updated);
          setUploadForShape(null);
        } else {
          const maxW = Math.min(300, pageSize.width - 40);
          const ratio = maxW / img.width;
          const newEl = { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: maxW, height: img.height * ratio, src: event.target.result };
          const updated = [...canvasElements, newEl];
          setCanvasElements(updated);
          history.push(updated);
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
    setAiGenerating(true);
    setAiChat(prev => [...prev, { role: 'user', content: aiPrompt }]);
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, {
        prompt: aiPrompt, quality: aiQuality, reference_image: aiReference
      }, { withCredentials: true });
      if (res.data.images?.length > 0) {
        const imgData = res.data.images[0].data;
        const newEl = { id: `el_${Date.now()}`, type: 'image', x: 20, y: 40, width: 200, height: 200, src: `data:image/png;base64,${imgData}` };
        const updated = [...canvasElements, newEl];
        setCanvasElements(updated);
        history.push(updated);
        setAiChat(prev => [...prev, { role: 'assistant', content: 'Image generated!' }]);
      } else {
        setAiChat(prev => [...prev, { role: 'assistant', content: res.data.text || 'Generated!' }]);
      }
    } catch {
      setAiChat(prev => [...prev, { role: 'assistant', content: 'Error generating image.' }]);
    }
    setAiGenerating(false);
    setAiPrompt('');
  };

  // === COLOR ===
  const applyColor = (color) => {
    setCurrentColor(color);
    if (selectedElements.length > 0) {
      setCanvasElements(prev => prev.map(el => selectedElements.includes(el.id) ? { ...el, color, fill: color } : el));
    } else if (selectedElement) {
      setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, color, fill: color } : el));
    }
  };

  // === VOICE ===
  const playVoice = () => {
    const text = canvasElements.filter(el => el.type === 'text').sort((a, b) => a.y - b.y).map(el => el.content).join('. ');
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // === COMPUTED ===
  const charCount = canvasElements.filter(el => el.type === 'text').reduce((acc, el) => acc + (el.content?.length || 0), 0);
  const filteredFonts = FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));

  // === LOADING ===
  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--zet-primary)' }} />
      </div>
    );
  }

  return (
    <div data-testid="editor-page" className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* === HEADER === */}
      <header data-testid="editor-header" className="h-12 px-3 flex items-center justify-between border-b flex-shrink-0" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <button data-testid="home-btn" onClick={() => navigate('/dashboard')} className="tool-btn w-8 h-8">
            <Home className="h-4 w-4" />
          </button>
          <input
            data-testid="doc-title-input"
            value={document.title}
            onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
            className="bg-transparent font-medium px-2 text-sm border-b border-transparent hover:border-white/20 focus:border-white/40 transition-colors outline-none"
            style={{ color: 'var(--zet-text)', maxWidth: 200 }}
          />
        </div>

        <div className="flex items-center gap-1.5">
          <button data-testid="undo-btn" onClick={handleUndo} disabled={!history.canUndo} className={`tool-btn w-8 h-8 ${!history.canUndo ? 'opacity-30' : ''}`}>
            <Undo className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium px-1" style={{ color: 'var(--zet-text-muted)' }}>
            {currentPage + 1}/{document.pages?.length || 1}
          </span>
          <button data-testid="redo-btn" onClick={handleRedo} disabled={!history.canRedo} className={`tool-btn w-8 h-8 ${!history.canRedo ? 'opacity-30' : ''}`}>
            <Redo className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button data-testid="prev-page-btn" onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={`tool-btn w-8 h-8 ${currentPage === 0 ? 'opacity-30' : ''}`}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button data-testid="next-page-btn" onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} disabled={currentPage >= (document.pages?.length || 1) - 1} className={`tool-btn w-8 h-8 ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}>
            <ArrowRight className="h-4 w-4" />
          </button>
          <button data-testid="save-btn" onClick={() => saveDocument()} className="zet-btn flex items-center gap-1 text-xs px-3 py-1.5">
            <Save className={`h-3.5 w-3.5 ${saving ? 'animate-pulse' : ''}`} />
          </button>
          <img src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" alt="ZET" className="h-7 w-7 ml-1" />
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 flex overflow-hidden">
        <Toolbox
          tools={TOOLS}
          activeTool={activeTool}
          onToolSelect={handleToolSelect}
          onDeleteSelected={deleteSelected}
          hasSelection={!!selectedElement || selectedElements.length > 0}
          zoom={zoom}
          isOpen={toolboxOpen}
          onToggle={() => setToolboxOpen(!toolboxOpen)}
        />

        <CanvasArea
          document={document}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          canvasElements={canvasElements}
          setCanvasElements={setCanvasElements}
          drawPaths={drawPaths}
          setDrawPaths={setDrawPaths}
          pageSize={pageSize}
          zoom={zoom}
          setZoom={setZoom}
          activeTool={activeTool}
          currentFontSize={currentFontSize}
          currentFont={currentFont}
          currentColor={currentColor}
          drawSize={drawSize}
          drawOpacity={drawOpacity}
          selectedElement={selectedElement}
          setSelectedElement={setSelectedElement}
          selectedElements={selectedElements}
          setSelectedElements={setSelectedElements}
          onSaveHistory={handleSaveHistory}
          showShapeMenu={showShapeMenu}
          setShowShapeMenu={setShowShapeMenu}
          setShowImageUpload={setShowImageUpload}
          setUploadForShape={setUploadForShape}
          canvasContainerRef={canvasContainerRef}
        />

        <RightPanel
          document={document}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pageSize={pageSize}
          zoom={zoom}
          onAddPage={addPage}
          onDeletePage={deletePage}
          docId={docId}
          charCount={charCount}
          canvasContainerRef={canvasContainerRef}
        />
      </div>

      {/* === VOICE BAR === */}
      {showVoice && (
        <div data-testid="voice-bar" className="p-3 border-t flex-shrink-0" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <Volume2 className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-primary-light)' }} />
            <button className="tool-btn w-7 h-7"><SkipBack className="h-3.5 w-3.5" /></button>
            <button onClick={isPlaying ? () => { window.speechSynthesis.pause(); setIsPlaying(false); } : playVoice} className="tool-btn w-9 h-9">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button className="tool-btn w-7 h-7"><SkipForward className="h-3.5 w-3.5" /></button>
            <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--zet-bg)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} />
            </div>
            <button onClick={() => { setShowVoice(false); window.speechSynthesis.cancel(); setIsPlaying(false); }} className="p-1 hover:bg-white/10 rounded">
              <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
            </button>
          </div>
        </div>
      )}

      {/* === FLOATING TOOL PANELS === */}
      {showDraw && (
        <DraggablePanel title={t('pencil')} onClose={() => setShowDraw(false)} initialPosition={{ x: 250, y: 100 }}>
          <div className="space-y-3 w-48">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Size: {drawSize}px</label>
              <input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {drawOpacity}%</label>
              <input type="range" min="10" max="100" value={drawOpacity} onChange={e => setDrawOpacity(Number(e.target.value))} className="w-full accent-blue-500" />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {PRESET_COLORS.slice(0, 8).map(c => (
                <button key={c} onClick={() => setCurrentColor(c)} className={`w-6 h-6 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />
              ))}
            </div>
          </div>
        </DraggablePanel>
      )}

      {showColor && (
        <DraggablePanel title={t('colorPicker')} onClose={() => setShowColor(false)} initialPosition={{ x: 300, y: 150 }}>
          <div className="space-y-3 w-56">
            <div className="grid grid-cols-6 gap-1.5">
              {PRESET_COLORS.map(c => (
                <button key={c} onClick={() => applyColor(c)} className={`w-7 h-7 rounded-md border ${currentColor === c ? 'ring-2 ring-white scale-110' : 'border-white/10'} transition-transform`} style={{ background: c }} />
              ))}
            </div>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Custom</label>
              <input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColor(e.target.value); }} className="w-full h-8 rounded cursor-pointer" />
            </div>
          </div>
        </DraggablePanel>
      )}

      {showTextSize && (
        <DraggablePanel title={t('textSize')} onClose={() => setShowTextSize(false)} initialPosition={{ x: 350, y: 100 }}>
          <div className="space-y-3 w-48">
            <input type="range" min="8" max="72" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="w-full accent-blue-500" />
            <div className="flex items-center gap-2">
              <input type="number" min="8" max="100" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="zet-input w-16 text-center text-sm" />
              <span className="text-sm" style={{ color: 'var(--zet-text)' }}>pt</span>
            </div>
            <div className="p-2 rounded text-center" style={{ background: 'var(--zet-bg)' }}>
              <span style={{ fontSize: Math.min(currentFontSize, 36), color: 'var(--zet-text)', fontFamily: currentFont }}>Aa</span>
            </div>
          </div>
        </DraggablePanel>
      )}

      {showFont && (
        <DraggablePanel title={t('font')} onClose={() => setShowFont(false)} initialPosition={{ x: 400, y: 100 }}>
          <div className="w-56">
            <div className="relative mb-2">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
              <input placeholder={t('search')} value={fontSearch} onChange={e => setFontSearch(e.target.value)} className="zet-input pl-7 text-xs w-full" />
            </div>
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {filteredFonts.map(f => (
                <button key={f} onClick={() => { setCurrentFont(f); setShowFont(false); }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors ${currentFont === f ? 'glow-sm' : 'hover:bg-white/5'}`}
                  style={{ background: currentFont === f ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: f }}
                >{f}</button>
              ))}
            </div>
          </div>
        </DraggablePanel>
      )}

      {showPageSize && (
        <DraggablePanel title={t('pageSize')} onClose={() => setShowPageSize(false)} initialPosition={{ x: 300, y: 200 }}>
          <div className="space-y-2 w-48">
            {PAGE_SIZES.map(s => (
              <button key={s.name} onClick={() => { setPageSize(s); setShowPageSize(false); }}
                className={`w-full p-2 rounded text-left text-sm transition-colors ${pageSize.name === s.name ? 'glow-sm' : 'hover:bg-white/5'}`}
                style={{ background: pageSize.name === s.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}
              >
                {s.name} <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.width}x{s.height}</span>
              </button>
            ))}
            <div className="flex gap-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
              <input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="W" />
              <input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="H" />
            </div>
            <button onClick={() => { setPageSize({ name: 'Custom', width: customWidth, height: customHeight }); setShowPageSize(false); }} className="zet-btn w-full text-sm">
              Apply
            </button>
          </div>
        </DraggablePanel>
      )}

      {showCreateImage && (
        <DraggablePanel title="AI Image" onClose={() => setShowCreateImage(false)} initialPosition={{ x: 250, y: 80 }}>
          <div className="w-72 space-y-3">
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Quality</label>
              <select value={aiQuality} onChange={e => setAiQuality(e.target.value)} className="zet-input text-sm w-full">
                <option value="standard">Standard</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference Image</label>
              <label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2">
                <Upload className="h-3 w-3" />
                {aiReference ? 'Image loaded' : 'Upload'}
                <input type="file" accept="image/*" onChange={e => {
                  const f = e.target.files[0];
                  if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); }
                }} className="hidden" />
              </label>
            </div>
            {aiChat.length > 0 && (
              <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded" style={{ background: 'var(--zet-bg)' }}>
                {aiChat.map((m, i) => (
                  <div key={i} className={`text-xs ${m.role === 'user' ? 'text-right' : ''}`} style={{ color: 'var(--zet-text)' }}>{m.content}</div>
                ))}
              </div>
            )}
            <div className="flex gap-1">
              <input data-testid="ai-image-prompt" placeholder="Describe image..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" />
              <button data-testid="ai-image-generate-btn" onClick={generateAIImage} disabled={aiGenerating} className="zet-btn px-2">
                {aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </DraggablePanel>
      )}

      {/* === IMAGE UPLOAD MODAL === */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}>
          <div className="zet-card p-5 w-72 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>
                {uploadForShape ? 'Add to Shape' : t('image')}
              </h3>
              <button onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}>
                <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            <label data-testid="image-upload-btn" className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3">
              <Upload className="h-4 w-4" />
              <span>Choose File</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
