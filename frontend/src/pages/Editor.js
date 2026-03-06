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
  Upload, ZoomIn, ZoomOut, Undo, Redo
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

const TOOLS = [
  { id: 'text', icon: Type, nameKey: 'text' },
  { id: 'textsize', icon: Baseline, nameKey: 'textSize' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'image', icon: Image, nameKey: 'image' },
  { id: 'pagesize', icon: FileText, nameKey: 'pageSize' },
];

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('hand');
  const [toolSearch, setToolSearch] = useState('');
  const [pageView, setPageView] = useState('grid');
  const [zetaOpen, setZetaOpen] = useState(true);
  const [pagesOpen, setPagesOpen] = useState(true);
  const [zetaMessages, setZetaMessages] = useState([]);
  const [zetaInput, setZetaInput] = useState('');
  const [zetaLoading, setZetaLoading] = useState(false);
  const [zetaSessionId, setZetaSessionId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobilePanel, setMobilePanel] = useState('canvas');
  const [toolboxOpen, setToolboxOpen] = useState(true);
  
  // Canvas state
  const [canvasElements, setCanvasElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isTyping, setIsTyping] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  
  // Page size state
  const [pageSize, setPageSize] = useState({ name: 'A4', width: 595, height: 842 });
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  
  // Text size state
  const [currentFontSize, setCurrentFontSize] = useState(16);
  
  // Undo/Redo history
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Reset history when changing pages
      setHistory([document.pages[currentPage].elements]);
      setHistoryIndex(0);
    } else {
      setCanvasElements([]);
      setHistory([[]]);
      setHistoryIndex(0);
    }
    // Load page size
    if (document?.pages?.[currentPage]?.pageSize) {
      setPageSize(document.pages[currentPage].pageSize);
    }
  }, [document, currentPage]);

  // Save to history when elements change
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

  const saveDocument = async () => {
    if (!document) return;
    setSaving(true);
    
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
      setSaving(false);
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

  // Canvas click handler
  const handleCanvasClick = (e) => {
    if (dragging || resizing) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    // Check bounds
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    
    if (activeTool === 'text' && !isTyping) {
      setTextPosition({ x, y });
      setIsTyping(true);
      setTextInput('');
      setSelectedElement(null);
    } else if (activeTool === 'image') {
      setShowImageUpload(true);
    } else if (activeTool === 'hand') {
      // Check if clicking on an element
      const clickedElement = [...canvasElements].reverse().find(el => {
        if (el.type === 'text') {
          return x >= el.x && x <= el.x + 300 && y >= el.y - el.fontSize && y <= el.y + 10;
        } else if (el.type === 'image') {
          return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
        }
        return false;
      });
      setSelectedElement(clickedElement?.id || null);
    }
  };

  const handleCanvasMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    // Check if clicking on selected element to drag
    if (selectedElement && activeTool === 'hand') {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el) {
        let isInside = false;
        if (el.type === 'text') {
          isInside = x >= el.x && x <= el.x + 300 && y >= el.y - el.fontSize && y <= el.y + 10;
        } else if (el.type === 'image') {
          isInside = x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
        }
        if (isInside) {
          setDragging(el.id);
          setDragOffset({ x: x - el.x, y: y - el.y });
          return;
        }
      }
    }
    
    // Pan only if hand tool and not on element
    if (activeTool === 'hand' && !selectedElement) {
      // Check if inside canvas bounds
      if (x >= 0 && y >= 0 && x <= pageSize.width && y <= pageSize.height) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (dragging) {
      // Constrain to canvas bounds
      const el = canvasElements.find(el => el.id === dragging);
      if (el) {
        let newX = x - dragOffset.x;
        let newY = y - dragOffset.y;
        
        // Constrain
        newX = Math.max(0, Math.min(pageSize.width - (el.width || 100), newX));
        newY = Math.max(el.fontSize || 20, Math.min(pageSize.height, newY));
        
        setCanvasElements(prev => prev.map(item => 
          item.id === dragging ? { ...item, x: newX, y: newY } : item
        ));
      }
      return;
    }
    
    if (resizing) {
      const newWidth = Math.max(50, Math.min(pageSize.width - resizing.startX, x - resizing.startX));
      const newHeight = Math.max(50, Math.min(pageSize.height - resizing.startY, y - resizing.startY));
      
      setCanvasElements(prev => prev.map(el => {
        if (el.id === resizing.id) {
          return { ...el, width: newWidth, height: newHeight };
        }
        return el;
      }));
      return;
    }
    
    if (isPanning) {
      const containerRect = canvasContainerRef.current.getBoundingClientRect();
      const canvasWidth = pageSize.width * zoom;
      const canvasHeight = pageSize.height * zoom;
      
      let newPanX = e.clientX - panStart.x;
      let newPanY = e.clientY - panStart.y;
      
      // Constrain pan to keep canvas visible
      const maxPanX = Math.max(0, (canvasWidth - containerRect.width) / 2 + 100);
      const maxPanY = Math.max(0, (canvasHeight - containerRect.height) / 2 + 100);
      
      newPanX = Math.max(-maxPanX, Math.min(maxPanX, newPanX));
      newPanY = Math.max(-maxPanY, Math.min(maxPanY, newPanY));
      
      setPan({ x: newPanX, y: newPanY });
    }
  };

  const handleCanvasMouseUp = () => {
    if (dragging) {
      saveToHistory(canvasElements);
    }
    if (resizing) {
      saveToHistory(canvasElements);
    }
    setIsPanning(false);
    setDragging(null);
    setResizing(null);
  };

  const handleZoom = (delta) => {
    setZoom(prev => Math.max(0.25, Math.min(3, prev + delta)));
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
      color: '#000000'
    };
    
    const newElements = [...canvasElements, newElement];
    setCanvasElements(newElements);
    saveToHistory(newElements);
    setIsTyping(false);
    setTextInput('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const maxWidth = Math.min(300, pageSize.width - 20);
        const ratio = maxWidth / img.width;
        const newElement = {
          id: `el_${Date.now()}`,
          type: 'image',
          x: 20,
          y: 20,
          width: maxWidth,
          height: img.height * ratio,
          src: event.target.result
        };
        const newElements = [...canvasElements, newElement];
        setCanvasElements(newElements);
        saveToHistory(newElements);
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
    
    // If element is selected, update its font size
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

  const handlePageSizeChange = (size) => {
    if (size.name === 'Custom') {
      setPageSize({ name: 'Custom', width: customWidth, height: customHeight });
    } else {
      setPageSize(size);
      setCustomWidth(size.width);
      setCustomHeight(size.height);
    }
  };

  const applyCustomSize = () => {
    setPageSize({ name: 'Custom', width: customWidth, height: customHeight });
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
      console.error('ZETA error:', error);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Try again!' }]);
    } finally {
      setZetaLoading(false);
    }
  };

  // Filter tools
  const filteredTools = TOOLS.filter(tool => 
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase())
  );

  // Calculate document stats
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

  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
        <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Desktop Header */}
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
            data-testid="doc-title-input"
          />
        </div>

        {/* Navigation - Undo/Redo */}
        <div className="flex items-center gap-2">
          <button 
            onClick={undo} 
            disabled={historyIndex <= 0}
            className={`tool-btn ${historyIndex <= 0 ? 'opacity-30' : ''}`}
            title="Undo"
          >
            <Undo className="h-5 w-5" />
          </button>
          <span className="px-4 font-medium" style={{ color: 'var(--zet-text)' }}>
            {currentPage + 1} / {document.pages?.length || 1}
          </span>
          <button 
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className={`tool-btn ${historyIndex >= history.length - 1 ? 'opacity-30' : ''}`}
            title="Redo"
          >
            <Redo className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Page Navigation */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} 
              disabled={currentPage === 0}
              className={`tool-btn ${currentPage === 0 ? 'opacity-30' : ''}`}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))}
              disabled={currentPage >= (document.pages?.length || 1) - 1}
              className={`tool-btn ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}
            >
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
          
          <button onClick={saveDocument} className="zet-btn flex items-center gap-2" data-testid="save-btn">
            <Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} />
            {saving ? t('saving') : t('save')}
          </button>
          <img 
            src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
            alt="ZET" 
            className="h-9 w-9"
          />
        </div>
      </header>

      {/* Main Content - 3 Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbox */}
        <div 
          className={`border-r flex flex-col transition-all duration-300 ${toolboxOpen ? 'w-72' : 'w-12'}`}
          style={{ borderColor: 'var(--zet-border)' }}
        >
          {/* Toolbox Header */}
          <div className="p-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            {toolboxOpen && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                <input
                  type="text"
                  placeholder={t('search')}
                  value={toolSearch}
                  onChange={(e) => setToolSearch(e.target.value)}
                  className="zet-input pl-9 text-sm py-2"
                  data-testid="tool-search"
                />
              </div>
            )}
            <button 
              onClick={() => setToolboxOpen(!toolboxOpen)}
              className="tool-btn w-8 h-8 flex-shrink-0"
              data-testid="toggle-toolbox"
            >
              {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          {/* Tools */}
          {toolboxOpen && (
            <div className="p-3 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id);
                      if (tool.id === 'image') setShowImageUpload(true);
                      if (tool.id === 'pagesize') setShowPageSize(true);
                      if (tool.id === 'textsize') setShowTextSize(true);
                    }}
                    className={`tool-btn h-14 ${activeTool === tool.id ? 'active' : ''}`}
                    data-testid={`tool-${tool.id}`}
                  >
                    <tool.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
              
              {/* Zoom Controls */}
              <div className="border-t pt-4" style={{ borderColor: 'var(--zet-border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>Zoom</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--zet-text)' }}>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleZoom(-0.25)} className="tool-btn flex-1 h-10">
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleZoom(0.25)} className="tool-btn flex-1 h-10">
                    <ZoomIn className="h-4 w-4" />
                  </button>
                </div>
                <button 
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} 
                  className="w-full mt-2 py-2 text-xs rounded hover:bg-white/5"
                  style={{ color: 'var(--zet-text-muted)' }}
                >
                  Reset View
                </button>
              </div>

              {/* Current Font Size */}
              <div className="border-t pt-4 mt-4" style={{ borderColor: 'var(--zet-border)' }}>
                <div className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>
                  Font Size: {currentFontSize}pt
                </div>
              </div>

              {/* Delete Selected */}
              {selectedElement && (
                <button 
                  onClick={deleteSelectedElement}
                  className="w-full mt-4 py-2 px-4 rounded bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30"
                >
                  Delete Selected
                </button>
              )}
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div 
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden" 
          style={{ background: 'var(--zet-bg-light)' }}
        >
          <div 
            ref={canvasRef}
            className="bg-white rounded-lg shadow-2xl relative"
            style={{ 
              width: pageSize.width * zoom,
              height: pageSize.height * zoom,
              boxShadow: '0 0 40px var(--zet-glow)',
              cursor: activeTool === 'hand' ? (isPanning || dragging ? 'grabbing' : 'grab') : activeTool === 'text' ? 'text' : 'default',
              transform: `translate(${pan.x}px, ${pan.y}px)`,
              overflow: 'hidden'
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            data-testid="canvas-area"
          >
            {/* Canvas elements */}
            {canvasElements.map(el => (
              <div
                key={el.id}
                className={`absolute ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''}`}
                style={{
                  left: el.x * zoom,
                  top: (el.type === 'text' ? el.y - el.fontSize : el.y) * zoom,
                  cursor: activeTool === 'hand' ? 'move' : 'default'
                }}
                onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
              >
                {el.type === 'text' && (
                  <div 
                    style={{ 
                      fontSize: el.fontSize * zoom, 
                      color: el.color, 
                      maxWidth: (pageSize.width - el.x) * zoom,
                      wordWrap: 'break-word',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.4
                    }}
                  >
                    {el.content}
                  </div>
                )}
                {el.type === 'image' && (
                  <div className="relative">
                    <img 
                      src={el.src} 
                      alt="" 
                      style={{ width: el.width * zoom, height: el.height * zoom }} 
                      draggable={false} 
                    />
                    {selectedElement === el.id && (
                      <div 
                        className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                        onMouseDown={(e) => { 
                          e.stopPropagation(); 
                          setResizing({ id: el.id, startX: el.x, startY: el.y }); 
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            ))}
            
            {/* Text Input */}
            {isTyping && (
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onBlur={addTextElement}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsTyping(false);
                    setTextInput('');
                  }
                }}
                autoFocus
                className="absolute bg-yellow-50 border-2 border-blue-500 outline-none p-1 resize-none"
                style={{ 
                  left: textPosition.x * zoom, 
                  top: (textPosition.y - currentFontSize) * zoom, 
                  fontSize: currentFontSize * zoom,
                  minWidth: 100 * zoom,
                  minHeight: currentFontSize * zoom * 2,
                  maxWidth: (pageSize.width - textPosition.x) * zoom
                }}
                placeholder="Type here..."
              />
            )}
          </div>
        </div>

        {/* Right: Pages + ZETA */}
        <div 
          className="w-72 border-l flex flex-col"
          style={{ borderColor: 'var(--zet-border)' }}
        >
          {/* Pages Panel */}
          <div className="border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} />
                <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</span>
              </div>
              <div className="flex items-center gap-1">
                {pagesOpen && (
                  <>
                    <button 
                      onClick={() => setPageView('list')}
                      className={`p-1 rounded ${pageView === 'list' ? 'bg-white/10' : ''}`}
                      style={{ color: 'var(--zet-text-muted)' }}
                    >
                      <List className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => setPageView('grid')}
                      className={`p-1 rounded ${pageView === 'grid' ? 'bg-white/10' : ''}`}
                      style={{ color: 'var(--zet-text-muted)' }}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button onClick={addPage} className="p-1 rounded hover:bg-white/10" style={{ color: 'var(--zet-text-muted)' }} data-testid="add-page-btn">
                      <Plus className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => setPagesOpen(!pagesOpen)}
                  className="p-1 rounded hover:bg-white/10"
                  style={{ color: 'var(--zet-text-muted)' }}
                  data-testid="toggle-pages"
                >
                  {pagesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            </div>
            
            {pagesOpen && (
              <div className="px-3 pb-3">
                <div className="text-xs mb-3 flex gap-3" style={{ color: 'var(--zet-text-muted)' }}>
                  <span>{stats.pageCount} {t('pages')}</span>
                  <span>•</span>
                  <span>{stats.charCount} {t('characters')}</span>
                </div>
                
                <div className={`${pageView === 'grid' ? 'grid grid-cols-3 gap-2' : 'space-y-2'} max-h-36 overflow-y-auto`}>
                  {document.pages?.map((page, idx) => (
                    <div key={page.page_id} className="relative group">
                      <div
                        onClick={() => setCurrentPage(idx)}
                        className={`page-thumb ${currentPage === idx ? 'active' : ''} ${pageView === 'list' ? 'h-10' : ''}`}
                        data-testid={`page-thumb-${idx}`}
                      />
                      {document.pages.length > 1 && (
                        <button
                          onClick={() => deletePage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ZETA AI Panel */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' }}>
                  <Sparkles className="h-4 w-4" style={{ color: 'var(--zet-text)' }} />
                </div>
                <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>ZETA</span>
              </div>
              <button 
                onClick={() => setZetaOpen(!zetaOpen)} 
                className="p-1 rounded hover:bg-white/10" 
                style={{ color: 'var(--zet-text-muted)' }}
                data-testid="toggle-zeta"
              >
                {zetaOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            </div>

            {zetaOpen && (
              <>
                <div className="flex-1 p-3 overflow-y-auto" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.length === 0 && (
                    <div className="text-center py-6" style={{ color: 'var(--zet-text-muted)' }}>
                      <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">{t('askZetaAnything')}</p>
                      <p className="text-xs mt-1">{t('brainstormResearch')}</p>
                    </div>
                  )}
                  {zetaMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div 
                        className={`inline-block px-3 py-2 rounded-lg max-w-[85%] text-sm ${msg.role === 'user' ? 'glow-sm' : ''}`}
                        style={{ 
                          background: msg.role === 'user' ? 'linear-gradient(135deg, var(--zet-primary), var(--zet-primary-light))' : 'var(--zet-bg-card)',
                          color: 'var(--zet-text)'
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {zetaLoading && (
                    <div className="flex gap-1 p-2">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '300ms' }}></div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-3 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t('askZeta')}
                      value={zetaInput}
                      onChange={(e) => setZetaInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && sendZetaMessage()}
                      className="zet-input flex-1 text-sm"
                      data-testid="zeta-input"
                    />
                    <button onClick={sendZetaMessage} className="zet-btn px-3" data-testid="zeta-send-btn">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageUpload(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Add Image</h3>
              <button onClick={() => setShowImageUpload(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-4">
              <Upload className="h-5 w-5" />
              <span>Choose File</span>
              <input 
                ref={fileInputRef}
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                className="hidden" 
              />
            </label>
            <p className="text-xs text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
              Supports JPG, PNG, GIF
            </p>
          </div>
        </div>
      )}

      {/* Page Size Modal */}
      {showPageSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPageSize(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Page Size</h3>
              <button onClick={() => setShowPageSize(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            <div className="space-y-2 mb-4">
              {PAGE_SIZES.map(size => (
                <button
                  key={size.name}
                  onClick={() => handlePageSizeChange(size)}
                  className={`w-full p-3 rounded-lg text-left flex justify-between items-center ${pageSize.name === size.name ? 'glow-sm' : ''}`}
                  style={{ 
                    background: pageSize.name === size.name ? 'var(--zet-primary)' : 'var(--zet-bg)',
                    color: 'var(--zet-text)'
                  }}
                >
                  <span>{size.name}</span>
                  {size.name !== 'Custom' && (
                    <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>
                      {size.width} × {size.height}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Custom Size Inputs */}
            <div className="border-t pt-4" style={{ borderColor: 'var(--zet-border)' }}>
              <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>Custom Size (px)</p>
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(Number(e.target.value))}
                  className="zet-input flex-1"
                  placeholder="Width"
                  min="100"
                  max="2000"
                />
                <span className="flex items-center" style={{ color: 'var(--zet-text-muted)' }}>×</span>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(Number(e.target.value))}
                  className="zet-input flex-1"
                  placeholder="Height"
                  min="100"
                  max="2000"
                />
              </div>
              <button onClick={applyCustomSize} className="zet-btn w-full">
                Apply Custom Size
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Text Size Modal */}
      {showTextSize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTextSize(false)}>
          <div className="zet-card p-6 max-w-sm w-full mx-4 animate-fadeIn" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>Text Size</h3>
              <button onClick={() => setShowTextSize(false)} className="p-1 rounded hover:bg-white/10">
                <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
              </button>
            </div>
            
            {/* Slider */}
            <div className="mb-4">
              <input
                type="range"
                min="5"
                max="100"
                value={currentFontSize}
                onChange={(e) => applyFontSize(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  background: `linear-gradient(to right, var(--zet-primary) 0%, var(--zet-primary) ${(currentFontSize - 5) / 95 * 100}%, var(--zet-bg) ${(currentFontSize - 5) / 95 * 100}%, var(--zet-bg) 100%)`
                }}
              />
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>
                <span>5pt</span>
                <span>100pt</span>
              </div>
            </div>

            {/* Number Input */}
            <div className="flex items-center gap-3 mb-4">
              <input
                type="number"
                min="5"
                max="100"
                value={currentFontSize}
                onChange={(e) => applyFontSize(Math.min(100, Math.max(5, Number(e.target.value))))}
                className="zet-input text-center text-2xl font-bold"
                style={{ width: '100px' }}
              />
              <span style={{ color: 'var(--zet-text)' }}>pt</span>
            </div>

            {/* Preview */}
            <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--zet-bg)' }}>
              <p style={{ fontSize: currentFontSize, color: 'var(--zet-text)' }}>Aa</p>
            </div>

            {selectedElement && (
              <p className="text-xs text-center" style={{ color: 'var(--zet-primary-light)' }}>
                ✓ Will also update selected text
              </p>
            )}

            <button 
              onClick={() => setShowTextSize(false)} 
              className="zet-btn w-full mt-4"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
