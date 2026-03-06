import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  ArrowLeft, ArrowRight, Home, Save, 
  Type, Image, Hand, FileText, Baseline,
  ChevronDown, ChevronUp, Grid, List,
  Send, X, Sparkles, Plus, Search,
  PanelLeftClose, PanelLeftOpen,
  Upload, Undo, Redo, Volume2,
  Play, Pause, SkipBack, SkipForward,
  FilePlus, Triangle, Square, Circle, 
  Star, MoreVertical, ALargeSmall
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
  { name: 'Legal', width: 612, height: 1008 },
  { name: 'Square', width: 600, height: 600 },
  { name: 'Custom', width: 0, height: 0 },
];

const FONTS = [
  'New Courier', 'Garet', 'Times New Roman', 'Arial', 'Helvetica',
  'Georgia', 'Verdana', 'Trebuchet MS', 'Comic Sans MS', 'Impact',
  'Palatino', 'Garamond', 'Bookman', 'Avant Garde', 'Courier New',
  'Lucida Console', 'Monaco', 'Bradley Hand', 'Brush Script MT', 'Copperplate'
];

const TOOLS = [
  { id: 'text', icon: Type, nameKey: 'text' },
  { id: 'textsize', icon: Baseline, nameKey: 'textSize' },
  { id: 'font', icon: ALargeSmall, nameKey: 'font' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'image', icon: Image, nameKey: 'image' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize' },
  { id: 'addpage', icon: FilePlus, nameKey: 'addPage' },
  { id: 'voice', icon: Volume2, nameKey: 'voice' },
  { id: 'triangle', icon: Triangle, nameKey: 'triangle' },
  { id: 'square', icon: Square, nameKey: 'square' },
  { id: 'circle', icon: Circle, nameKey: 'circle' },
  { id: 'star', icon: Star, nameKey: 'star' },
];

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('text');
  const [toolSearch, setToolSearch] = useState('');
  const [pageView, setPageView] = useState('grid');
  const [zetaOpen, setZetaOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  const [zetaMessages, setZetaMessages] = useState([]);
  const [zetaInput, setZetaInput] = useState('');
  const [zetaLoading, setZetaLoading] = useState(false);
  const [zetaSessionId, setZetaSessionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toolboxOpen, setToolboxOpen] = useState(true);
  
  // Canvas state
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [zoom, setZoom] = useState(0.75); // Default 75%
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 20, y: 40 });
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [uploadForShape, setUploadForShape] = useState(null);
  
  // Page size state
  const [pageSize, setPageSize] = useState({ name: 'A4', width: 595, height: 842 });
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  
  // Text state
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [fontSearch, setFontSearch] = useState('');
  
  // Voice state
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const speechRef = useRef(null);
  
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Auto-save timer
  const autoSaveTimerRef = useRef(null);
  
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const chatEndRef = useRef(null);

  // Auto-save effect
  useEffect(() => {
    if (canvasElements.length > 0 && document) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => {
        saveDocument(true);
      }, 2000);
    }
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [canvasElements]);

  useEffect(() => {
    fetchDocument();
  }, [docId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [zetaMessages]);

  // Load canvas elements from document
  useEffect(() => {
    if (document?.pages?.[currentPage]?.elements) {
      setCanvasElements(document.pages[currentPage].elements);
      setHistory([document.pages[currentPage].elements]);
      setHistoryIndex(0);
    } else {
      setCanvasElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
    }
    if (document?.pages?.[currentPage]?.pageSize) {
      setPageSize(document.pages[currentPage].pageSize);
    }
  }, [document, currentPage]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (activeTool === 'hand' && canvasContainerRef.current?.contains(e.target)) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
      }
    };
    
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeTool]);

  const saveToHistory = useCallback((newElements) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCanvasElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCanvasElements([...history[historyIndex + 1]]);
    }
  };

  const fetchDocument = async () => {
    try {
      const res = await axios.get(`${API}/documents/${docId}`, { withCredentials: true });
      setDocument(res.data);
    } catch (error) {
      console.error('Error fetching document:', error);
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
        pageSize: pageSize
      };
    }
    
    try {
      await axios.put(`${API}/documents/${docId}`, {
        title: document.title,
        content: document.content,
        pages: updatedPages
      }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      if (!silent) setSaving(false);
    }
  };

  const updateTitle = (newTitle) => {
    setDocument(prev => ({ ...prev, title: newTitle }));
  };

  const addPage = () => {
    const newPage = { page_id: `page_${Date.now()}`, content: {}, elements: [], pageSize: pageSize };
    setDocument(prev => ({
      ...prev,
      pages: [...(prev.pages || []), newPage]
    }));
    // Navigate to new page
    setTimeout(() => setCurrentPage(document.pages.length), 100);
  };

  const deletePage = (index) => {
    if (document.pages.length <= 1) return;
    setDocument(prev => ({
      ...prev,
      pages: prev.pages.filter((_, i) => i !== index)
    }));
    if (currentPage >= index && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get next text Y position
  const getNextTextY = () => {
    const textElements = canvasElements.filter(el => el.type === 'text');
    if (textElements.length === 0) return 40;
    const lastText = textElements[textElements.length - 1];
    return lastText.y + lastText.fontSize + 10;
  };

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (dragging || resizing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    
    // Close shape menu if clicking elsewhere
    if (showShapeMenu && !e.target.closest('.shape-menu')) {
      setShowShapeMenu(null);
    }
    
    if (activeTool === 'text' && !isTyping) {
      // Start typing at beginning of line
      setTextPosition({ x: 20, y: getNextTextY() });
      setIsTyping(true);
      setTextInput('');
      setSelectedElement(null);
    } else if (activeTool === 'image') {
      setShowImageUpload(true);
    } else if (['triangle', 'square', 'circle', 'star'].includes(activeTool)) {
      addShape(activeTool, x, y);
    } else if (activeTool === 'hand') {
      const clickedElement = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      setSelectedElement(clickedElement?.id || null);
    }
  };

  const isPointInElement = (x, y, el) => {
    if (el.type === 'text') {
      return x >= el.x && x <= el.x + 400 && y >= el.y - el.fontSize && y <= el.y + 10;
    } else if (el.type === 'image' || el.type === 'shape') {
      return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
    }
    return false;
  };

  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (selectedElement && activeTool === 'hand') {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el)) {
        setDragging(el.id);
        setDragOffset({ x: x - el.x, y: y - el.y });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (dragging) {
      const el = canvasElements.find(el => el.id === dragging);
      if (el) {
        let newX = Math.max(0, Math.min(pageSize.width - (el.width || 100), x - dragOffset.x));
        let newY = Math.max(el.fontSize || 20, Math.min(pageSize.height - (el.height || 20), y - dragOffset.y));
        
        setCanvasElements(prev => prev.map(item => 
          item.id === dragging ? { ...item, x: newX, y: newY } : item
        ));
      }
      return;
    }
    
    if (resizing) {
      const newWidth = Math.max(30, Math.min(pageSize.width - resizing.startX, x - resizing.startX));
      const newHeight = Math.max(30, Math.min(pageSize.height - resizing.startY, y - resizing.startY));
      
      setCanvasElements(prev => prev.map(el => {
        if (el.id === resizing.id) {
          return { ...el, width: newWidth, height: newHeight };
        }
        return el;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragging || resizing) saveToHistory(canvasElements);
    setDragging(null);
    setResizing(null);
  };

  const addTextElement = () => {
    if (!textInput.trim()) {
      setIsTyping(false);
      return;
    }
    
    const newElement = {
      id: `el_${Date.now()}`,
      type: 'text',
      x: textPosition.x,
      y: textPosition.y,
      content: textInput,
      fontSize: currentFontSize,
      fontFamily: currentFont,
      color: '#000000'
    };
    
    const newElements = [...canvasElements, newElement];
    setCanvasElements(newElements);
    saveToHistory(newElements);
    setIsTyping(false);
    setTextInput('');
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTextElement();
      // Start new line
      setTimeout(() => {
        setTextPosition({ x: 20, y: getNextTextY() + currentFontSize + 10 });
        setIsTyping(true);
        setTextInput('');
      }, 50);
    } else if (e.key === 'Escape') {
      setIsTyping(false);
      setTextInput('');
    }
  };

  const addShape = (shapeType, x, y) => {
    const newElement = {
      id: `el_${Date.now()}`,
      type: 'shape',
      shapeType: shapeType,
      x: x - 40,
      y: y - 40,
      width: 80,
      height: 80,
      fill: '#4ca8ad',
      image: null
    };
    
    const newElements = [...canvasElements, newElement];
    setCanvasElements(newElements);
    saveToHistory(newElements);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (uploadForShape) {
          // Add image to shape
          setCanvasElements(prev => prev.map(el => 
            el.id === uploadForShape ? { ...el, image: event.target.result } : el
          ));
          setUploadForShape(null);
        } else {
          const maxWidth = Math.min(300, pageSize.width - 40);
          const ratio = maxWidth / img.width;
          const newElement = {
            id: `el_${Date.now()}`,
            type: 'image',
            x: 20,
            y: getNextTextY(),
            width: maxWidth,
            height: img.height * ratio,
            src: event.target.result
          };
          const newElements = [...canvasElements, newElement];
          setCanvasElements(newElements);
          saveToHistory(newElements);
        }
        setShowImageUpload(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      const newElements = canvasElements.filter(el => el.id !== selectedElement);
      setCanvasElements(newElements);
      saveToHistory(newElements);
      setSelectedElement(null);
    }
  };

  const applyFontSize = (size) => {
    setCurrentFontSize(size);
    if (selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el && el.type === 'text') {
        const newElements = canvasElements.map(item =>
          item.id === selectedElement ? { ...item, fontSize: size } : item
        );
        setCanvasElements(newElements);
        saveToHistory(newElements);
      }
    }
  };

  const applyFont = (font) => {
    setCurrentFont(font);
    if (selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el && el.type === 'text') {
        const newElements = canvasElements.map(item =>
          item.id === selectedElement ? { ...item, fontFamily: font } : item
        );
        setCanvasElements(newElements);
        saveToHistory(newElements);
      }
    }
    setShowFont(false);
  };

  const handlePageSizeChange = (size) => {
    if (size.name === 'Custom') {
      setPageSize({ name: 'Custom', width: customWidth, height: customHeight });
    } else {
      setPageSize(size);
      setCustomWidth(size.width);
      setCustomHeight(size.height);
    }
  };

  // Voice/TTS functions
  const getDocumentText = () => {
    return canvasElements
      .filter(el => el.type === 'text')
      .sort((a, b) => a.y - b.y)
      .map(el => el.content)
      .join('. ');
  };

  const playVoice = () => {
    const text = getDocumentText();
    if (!text) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.onend = () => setIsPlaying(false);
    utterance.onboundary = (e) => {
      if (e.charIndex) setVoiceProgress((e.charIndex / text.length) * 100);
    };
    
    speechRef.current = utterance;
    setVoiceDuration(text.length * 50); // Approximate duration
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const pauseVoice = () => {
    window.speechSynthesis.pause();
    setIsPlaying(false);
  };

  const resumeVoice = () => {
    window.speechSynthesis.resume();
    setIsPlaying(true);
  };

  const skipVoice = (seconds) => {
    // TTS doesn't support seeking, just restart
    if (seconds > 0) {
      window.speechSynthesis.cancel();
      setVoiceProgress(Math.min(100, voiceProgress + 10));
    } else {
      window.speechSynthesis.cancel();
      setVoiceProgress(Math.max(0, voiceProgress - 10));
    }
  };

  const sendZetaMessage = async () => {
    if (!zetaInput.trim() || zetaLoading) return;
    
    const userMessage = zetaInput;
    setZetaInput('');
    setZetaMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setZetaLoading(true);

    try {
      const res = await axios.post(`${API}/zeta/chat`, {
        message: userMessage,
        doc_id: docId,
        session_id: zetaSessionId
      }, { withCredentials: true });

      setZetaSessionId(res.data.session_id);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch (error) {
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Try again!' }]);
    } finally {
      setZetaLoading(false);
    }
  };

  // Filter tools
  const filteredTools = TOOLS.filter(tool => 
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase()) ||
    tool.id.toLowerCase().includes(toolSearch.toLowerCase())
  );

  // Filter fonts
  const filteredFonts = FONTS.filter(font =>
    font.toLowerCase().includes(fontSearch.toLowerCase())
  );

  // Document stats
  const getDocumentStats = () => {
    const pageCount = document?.pages?.length || 0;
    let charCount = 0;
    if (document?.title) charCount += document.title.length;
    canvasElements.forEach(el => {
      if (el.type === 'text') charCount += el.content.length;
    });
    return { pageCount, charCount };
  };

  const stats = document ? getDocumentStats() : { pageCount: 0, charCount: 0 };

  // Render shape
  const renderShape = (el) => {
    const shapeStyle = {
      width: '100%',
      height: '100%',
      backgroundColor: el.image ? 'transparent' : el.fill,
      backgroundImage: el.image ? `url(${el.image})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };

    switch (el.shapeType) {
      case 'triangle':
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <div style={{
              ...shapeStyle,
              clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
            }} />
          </div>
        );
      case 'circle':
        return <div style={{ ...shapeStyle, borderRadius: '50%' }} />;
      case 'star':
        return (
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
            <div style={{
              ...shapeStyle,
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
            }} />
          </div>
        );
      default: // square, rectangle
        return <div style={shapeStyle} />;
    }
  };

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="p-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="tool-btn" data-testid="back-btn">
            <Home className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={document.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent font-medium text-lg px-2 border-b border-transparent hover:border-current focus:border-current focus:outline-none"
            style={{ color: 'var(--zet-text)' }}
          />
        </div>

        {/* Undo/Redo & Page Nav */}
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className={`tool-btn ${historyIndex <= 0 ? 'opacity-30' : ''}`}>
            <Undo className="h-5 w-5" />
          </button>
          <span className="px-3 font-medium" style={{ color: 'var(--zet-text)' }}>
            {currentPage + 1} / {document.pages?.length || 1}
          </span>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`tool-btn ${historyIndex >= history.length - 1 ? 'opacity-30' : ''}`}>
            <Redo className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={`tool-btn ${currentPage === 0 ? 'opacity-30' : ''}`}>
            <ArrowLeft className="h-5 w-5" />
          </button>
          <button onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} disabled={currentPage >= (document.pages?.length || 1) - 1} className={`tool-btn ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}>
            <ArrowRight className="h-5 w-5" />
          </button>
          <button onClick={() => saveDocument()} className="zet-btn flex items-center gap-2">
            <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? '...' : t('save')}
          </button>
          <img src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" alt="ZET" className="h-9 w-9" />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbox */}
        <div className={`border-r flex flex-col transition-all duration-300 ${toolboxOpen ? 'w-64' : 'w-12'}`} style={{ borderColor: 'var(--zet-border)' }}>
          <div className="p-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            {toolboxOpen && (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="zet-input pl-8 text-sm py-2 w-full"
                />
              </div>
            )}
            <button onClick={() => setToolboxOpen(!toolboxOpen)} className="tool-btn w-8 h-8 flex-shrink-0">
              {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          {toolboxOpen && (
            <div className="p-2 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id);
                      if (tool.id === 'image') setShowImageUpload(true);
                      if (tool.id === 'pagesize') setShowPageSize(true);
                      if (tool.id === 'textsize') setShowTextSize(true);
                      if (tool.id === 'font') setShowFont(true);
                      if (tool.id === 'voice') setShowVoice(true);
                      if (tool.id === 'addpage') addPage();
                    }}
                    className={`tool-btn h-12 ${activeTool === tool.id ? 'active' : ''}`}
                  >
                    <tool.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
              
              {/* Zoom Display */}
              <div className="mt-4 pt-3 border-t text-center" style={{ borderColor: 'var(--zet-border)' }}>
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Zoom: {Math.round(zoom * 100)}%</span>
                <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>Scroll to zoom</p>
              </div>

              {selectedElement && (
                <button onClick={deleteSelectedElement} className="w-full mt-3 py-2 rounded bg-red-500/20 text-red-400 text-sm">
                  Delete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4" style={{ background: 'var(--zet-bg-light)' }}>
          <div 
            ref={canvasRef}
            className="bg-white shadow-2xl relative mx-auto"
            style={{ 
              width: pageSize.width * zoom,
              height: pageSize.height * zoom,
              boxShadow: '0 0 40px var(--zet-glow)',
              cursor: activeTool === 'hand' ? 'grab' : activeTool === 'text' ? 'text' : 'crosshair',
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {canvasElements.map(el => (
              <div
                key={el.id}
                className={`absolute ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  left: el.x * zoom,
                  top: (el.type === 'text' ? el.y - el.fontSize : el.y) * zoom,
                  width: el.type !== 'text' ? el.width * zoom : 'auto',
                  height: el.type !== 'text' ? el.height * zoom : 'auto',
                  cursor: activeTool === 'hand' ? 'move' : 'default'
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
              >
                {el.type === 'text' && (
                  <div style={{ 
                    fontSize: el.fontSize * zoom, 
                    fontFamily: el.fontFamily || 'Arial',
                    color: el.color,
                    maxWidth: (pageSize.width - el.x - 20) * zoom,
                    wordWrap: 'break-word',
                    whiteSpace: 'pre-wrap',
                    lineHeight: 1.5
                  }}>
                    {el.content}
                  </div>
                )}
                {el.type === 'image' && (
                  <div className="relative w-full h-full">
                    <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                    {selectedElement === el.id && (
                      <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                        onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                    )}
                  </div>
                )}
                {el.type === 'shape' && (
                  <div className="relative w-full h-full">
                    {renderShape(el)}
                    {selectedElement === el.id && (
                      <>
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button
                          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ background: 'var(--zet-bg-card)' }}
                          onClick={(e) => { e.stopPropagation(); setShowShapeMenu(el.id); }}
                        >
                          <MoreVertical className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                        </button>
                        {showShapeMenu === el.id && (
                          <div className="shape-menu absolute top-6 right-0 zet-card p-2 z-50 min-w-[120px]">
                            <button
                              className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/10"
                              style={{ color: 'var(--zet-text)' }}
                              onClick={(e) => { e.stopPropagation(); setUploadForShape(el.id); setShowImageUpload(true); setShowShapeMenu(null); }}
                            >
                              Add Image
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onBlur={addTextElement}
                onKeyDown={handleTextKeyDown}
                autoFocus
                className="absolute bg-yellow-50/80 border-l-2 border-blue-500 outline-none p-1 resize-none"
                style={{ 
                  left: textPosition.x * zoom, 
                  top: (textPosition.y - currentFontSize) * zoom, 
                  fontSize: currentFontSize * zoom,
                  fontFamily: currentFont,
                  minWidth: 200 * zoom,
                  minHeight: currentFontSize * zoom * 2,
                  maxWidth: (pageSize.width - textPosition.x - 20) * zoom
                }}
                placeholder="Type here... (Enter for new line)"
              />
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-64 border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
          {/* Pages */}
          <div className="border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</span>
              <div className="flex gap-1">
                {pagesOpen && <button onClick={addPage} className="p-1 hover:bg-white/10 rounded"><Plus className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>}
                <button onClick={() => setPagesOpen(!pagesOpen)} className="p-1 hover:bg-white/10 rounded">
                  {pagesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {pagesOpen && (
              <div className="px-2 pb-2">
                <div className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>{stats.pageCount} {t('pages')} • {stats.charCount} {t('characters')}</div>
                <div className="grid grid-cols-3 gap-1 max-h-28 overflow-y-auto">
                  {document.pages?.map((page, idx) => (
                    <div key={page.page_id} className="relative group">
                      <div onClick={() => setCurrentPage(idx)} className={`page-thumb cursor-pointer ${currentPage === idx ? 'active' : ''}`} />
                      {document.pages.length > 1 && (
                        <button onClick={() => deletePage(idx)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100">×</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ZETA */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>ZETA</span>
              </div>
              <button onClick={() => setZetaOpen(!zetaOpen)} className="p-1 hover:bg-white/10 rounded">
                {zetaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>
            {zetaOpen && (
              <>
                <div className="flex-1 p-2 overflow-y-auto" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.length === 0 && (
                    <div className="text-center py-4" style={{ color: 'var(--zet-text-muted)' }}>
                      <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">{t('askZetaAnything')}</p>
                    </div>
                  )}
                  {zetaMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div className={`inline-block px-2 py-1 rounded-lg max-w-[85%] text-xs`}
                        style={{ background: msg.role === 'user' ? 'var(--zet-primary)' : 'var(--zet-bg-card)', color: 'var(--zet-text)' }}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {zetaLoading && <div className="flex gap-1 p-2"><div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)' }}></div></div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                  <div className="flex gap-1">
                    <input type="text" placeholder={t('askZeta')} value={zetaInput} onChange={(e) => setZetaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendZetaMessage()} className="zet-input flex-1 text-xs py-1" />
                    <button onClick={sendZetaMessage} className="zet-btn px-2"><Send className="h-3 w-3" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Voice Panel */}
      {showVoice && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium" style={{ color: 'var(--zet-text)' }}>Voice Reader</span>
              <button onClick={() => { setShowVoice(false); window.speechSynthesis.cancel(); setIsPlaying(false); }} className="p-1 hover:bg-white/10 rounded">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => skipVoice(-10)} className="tool-btn w-10 h-10"><SkipBack className="h-4 w-4" /></button>
              <button onClick={isPlaying ? pauseVoice : playVoice} className="tool-btn w-12 h-12">
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
              <button onClick={() => skipVoice(10)} className="tool-btn w-10 h-10"><SkipForward className="h-4 w-4" /></button>
              <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--zet-bg)' }}>
                <div className="h-full transition-all" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}>
          <div className="zet-card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>{uploadForShape ? 'Add Image to Shape' : 'Add Image'}</h3>
              <button onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}><X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-4">
              <Upload className="h-5 w-5" /><span>Choose File</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>
      )}

      {showPageSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPageSize(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Page Size</h3>
              <button onClick={() => setShowPageSize(false)}><X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <div className="space-y-2 mb-4">
              {PAGE_SIZES.filter(s => s.name !== 'Custom').map(size => (
                <button key={size.name} onClick={() => handlePageSizeChange(size)}
                  className={`w-full p-3 rounded-lg text-left flex justify-between ${pageSize.name === size.name ? 'glow-sm' : ''}`}
                  style={{ background: pageSize.name === size.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>
                  <span>{size.name}</span><span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{size.width}×{size.height}</span>
                </button>
              ))}
            </div>
            <div className="border-t pt-3" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex gap-2 mb-2">
                <input type="number" value={customWidth} onChange={(e) => setCustomWidth(Number(e.target.value))} className="zet-input flex-1" placeholder="W" />
                <span style={{ color: 'var(--zet-text-muted)' }}>×</span>
                <input type="number" value={customHeight} onChange={(e) => setCustomHeight(Number(e.target.value))} className="zet-input flex-1" placeholder="H" />
              </div>
              <button onClick={() => { setPageSize({ name: 'Custom', width: customWidth, height: customHeight }); setShowPageSize(false); }} className="zet-btn w-full">Apply</button>
            </div>
          </div>
        </div>
      )}

      {showTextSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTextSize(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Text Size</h3>
              <button onClick={() => setShowTextSize(false)}><X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <input type="range" min="5" max="100" value={currentFontSize} onChange={(e) => applyFontSize(Number(e.target.value))} className="w-full mb-3" />
            <div className="flex items-center gap-2 mb-4">
              <input type="number" min="5" max="100" value={currentFontSize} onChange={(e) => applyFontSize(Math.min(100, Math.max(5, Number(e.target.value))))}
                className="zet-input text-center text-xl font-bold w-20" /><span style={{ color: 'var(--zet-text)' }}>pt</span>
            </div>
            <div className="p-3 rounded-lg mb-3" style={{ background: 'var(--zet-bg)' }}>
              <p style={{ fontSize: Math.min(currentFontSize, 48), color: 'var(--zet-text)' }}>Aa</p>
            </div>
            <button onClick={() => setShowTextSize(false)} className="zet-btn w-full">Done</button>
          </div>
        </div>
      )}

      {showFont && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFont(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Font</h3>
              <button onClick={() => setShowFont(false)}><X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} /></button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
              <input type="text" placeholder="Search fonts..." value={fontSearch} onChange={(e) => setFontSearch(e.target.value)} className="zet-input pl-8 text-sm" />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1">
              {filteredFonts.map(font => (
                <button key={font} onClick={() => applyFont(font)}
                  className={`w-full p-2 rounded text-left ${currentFont === font ? 'glow-sm' : ''}`}
                  style={{ background: currentFont === font ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: font }}>
                  {font}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
