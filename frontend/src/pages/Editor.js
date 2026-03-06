import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  ArrowLeft, ArrowRight, Home, Save, 
  Type, Image, Hand, 
  ChevronDown, ChevronUp, Grid, List,
  Send, X, Sparkles, Plus,
  PanelLeftClose, PanelLeftOpen,
  FileText, Upload, ZoomIn, ZoomOut
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TOOLS = [
  { id: 'text', icon: Type, nameKey: 'text' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'image', icon: Image, nameKey: 'image' },
];

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('hand');
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
  const [resizing, setResizing] = useState(null);
  
  const canvasRef = useRef(null);
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
    } else {
      setCanvasElements([]);
    }
  }, [document, currentPage]);

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
    
    // Update current page elements
    const updatedPages = [...(document.pages || [])];
    if (updatedPages[currentPage]) {
      updatedPages[currentPage] = {
        ...updatedPages[currentPage],
        elements: canvasElements
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
    const newPage = { page_id: `page_${Date.now()}`, content: {}, elements: [] };
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

  // Canvas handlers
  const handleCanvasClick = (e) => {
    if (activeTool === 'text' && !isTyping) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setTextPosition({ x, y });
      setIsTyping(true);
      setTextInput('');
      setSelectedElement(null);
    } else if (activeTool === 'image') {
      setShowImageUpload(true);
    } else if (activeTool === 'hand') {
      // Check if clicking on an element
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      const clickedElement = [...canvasElements].reverse().find(el => {
        if (el.type === 'text') {
          return x >= el.x && x <= el.x + 200 && y >= el.y - 20 && y <= el.y + 10;
        } else if (el.type === 'image') {
          return x >= el.x && x <= el.x + el.width && y >= el.y && y <= el.y + el.height;
        }
        return false;
      });
      
      setSelectedElement(clickedElement?.id || null);
    }
  };

  const handleCanvasMouseDown = (e) => {
    if (activeTool === 'hand' && !selectedElement) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
    
    if (resizing) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      
      setCanvasElements(prev => prev.map(el => {
        if (el.id === resizing.id) {
          const newWidth = Math.max(50, x - el.x);
          const newHeight = Math.max(50, y - el.y);
          return { ...el, width: newWidth, height: newHeight };
        }
        return el;
      }));
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
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
      fontSize: 16,
      color: '#000000'
    };
    
    setCanvasElements(prev => [...prev, newElement]);
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
        const maxWidth = 300;
        const ratio = maxWidth / img.width;
        const newElement = {
          id: `el_${Date.now()}`,
          type: 'image',
          x: 50,
          y: 50,
          width: maxWidth,
          height: img.height * ratio,
          src: event.target.result
        };
        setCanvasElements(prev => [...prev, newElement]);
        setShowImageUpload(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setCanvasElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
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
      console.error('ZETA error:', error);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Oops! Something went wrong. Try again!' }]);
    } finally {
      setZetaLoading(false);
    }
  };

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

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
        {/* Mobile Header */}
        <header className="p-3 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button onClick={() => navigate('/dashboard')} className="tool-btn w-10 h-10" data-testid="back-btn">
            <Home className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={document.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="bg-transparent text-center font-medium flex-1 mx-2"
            style={{ color: 'var(--zet-text)' }}
            data-testid="doc-title-input"
          />
          <button onClick={saveDocument} className="tool-btn w-10 h-10" data-testid="save-btn">
            <Save className={`h-5 w-5 ${saving ? 'animate-pulse' : ''}`} />
          </button>
        </header>

        {/* Mobile Navigation - Centered */}
        <div className="flex justify-center gap-4 p-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} className="tool-btn w-12 h-10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="flex items-center px-4 font-medium" style={{ color: 'var(--zet-text)' }}>
            {currentPage + 1} / {document.pages?.length || 1}
          </span>
          <button onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} className="tool-btn w-12 h-10">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 overflow-hidden">
          {mobilePanel === 'tools' && (
            <div className="h-full p-4 overflow-y-auto animate-fadeIn">
              <div className="grid grid-cols-3 gap-3">
                {TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveTool(tool.id); setMobilePanel('canvas'); }}
                    className={`tool-btn h-16 ${activeTool === tool.id ? 'active' : ''}`}
                    data-testid={`tool-${tool.id}`}
                  >
                    <tool.icon className="h-6 w-6" />
                  </button>
                ))}
              </div>
              
              {/* Zoom Controls */}
              <div className="mt-4 flex justify-center gap-2">
                <button onClick={() => handleZoom(-0.25)} className="tool-btn w-12 h-12">
                  <ZoomOut className="h-5 w-5" />
                </button>
                <span className="flex items-center px-4" style={{ color: 'var(--zet-text)' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button onClick={() => handleZoom(0.25)} className="tool-btn w-12 h-12">
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          {mobilePanel === 'canvas' && (
            <div className="h-full p-4 flex items-center justify-center overflow-hidden">
              <div 
                ref={canvasRef}
                className="bg-white rounded-lg shadow-lg relative overflow-hidden"
                style={{ 
                  width: '100%', 
                  maxWidth: '400px', 
                  aspectRatio: '3/4',
                  cursor: activeTool === 'hand' ? 'grab' : activeTool === 'text' ? 'text' : 'default'
                }}
                onClick={handleCanvasClick}
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
                data-testid="canvas-area"
              >
                <div style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, transformOrigin: 'top left' }}>
                  {canvasElements.map(el => (
                    <div
                      key={el.id}
                      className={`absolute ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''}`}
                      style={{
                        left: el.x,
                        top: el.y,
                        cursor: 'pointer'
                      }}
                      onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
                    >
                      {el.type === 'text' && (
                        <span style={{ fontSize: el.fontSize, color: el.color }}>{el.content}</span>
                      )}
                      {el.type === 'image' && (
                        <img src={el.src} alt="" style={{ width: el.width, height: el.height }} draggable={false} />
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <input
                      type="text"
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      onBlur={addTextElement}
                      onKeyDown={(e) => e.key === 'Enter' && addTextElement()}
                      autoFocus
                      className="absolute bg-transparent border-b-2 border-blue-500 outline-none"
                      style={{ left: textPosition.x, top: textPosition.y - 20, fontSize: 16 }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {mobilePanel === 'pages' && (
            <div className="h-full p-4 overflow-y-auto animate-fadeIn">
              {/* Pages section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</h3>
                  <button onClick={addPage} className="tool-btn w-8 h-8" data-testid="add-page-btn">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }}>
                  {stats.pageCount} {t('pages')} • {stats.charCount} {t('characters')}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {document.pages?.map((page, idx) => (
                    <div key={page.page_id} className="relative group">
                      <div
                        onClick={() => { setCurrentPage(idx); setMobilePanel('canvas'); }}
                        className={`page-thumb ${currentPage === idx ? 'active' : ''}`}
                        data-testid={`page-thumb-${idx}`}
                      />
                      {document.pages.length > 1 && (
                        <button
                          onClick={() => deletePage(idx)}
                          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ZETA Chat */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5" style={{ color: 'var(--zet-primary-light)' }} />
                  <span className="font-medium" style={{ color: 'var(--zet-text)' }}>ZETA</span>
                </div>
                <div className="zet-card p-3 h-48 overflow-y-auto mb-2" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div 
                        className={`inline-block px-3 py-2 rounded-lg max-w-[80%] text-sm ${msg.role === 'user' ? 'glow-sm' : ''}`}
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t('askZeta')}
                    value={zetaInput}
                    onChange={(e) => setZetaInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendZetaMessage()}
                    className="zet-input flex-1"
                    data-testid="zeta-input"
                  />
                  <button onClick={sendZetaMessage} className="zet-btn px-3" data-testid="zeta-send-btn">
                    <Send className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Tabs */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--zet-border)' }}>
          <div className="flex justify-around">
            <button 
              onClick={() => setMobilePanel('tools')}
              className={`flex flex-col items-center gap-1 p-2 ${mobilePanel === 'tools' ? '' : 'opacity-50'}`}
              style={{ color: 'var(--zet-text)' }}
            >
              <Hand className="h-5 w-5" />
              <span className="text-xs">{t('tools')}</span>
            </button>
            <button 
              onClick={() => setMobilePanel('canvas')}
              className={`flex flex-col items-center gap-1 p-2 ${mobilePanel === 'canvas' ? '' : 'opacity-50'}`}
              style={{ color: 'var(--zet-text)' }}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs">{t('canvas')}</span>
            </button>
            <button 
              onClick={() => setMobilePanel('pages')}
              className={`flex flex-col items-center gap-1 p-2 ${mobilePanel === 'pages' ? '' : 'opacity-50'}`}
              style={{ color: 'var(--zet-text)' }}
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">{t('pagesAI')}</span>
            </button>
          </div>
        </div>

        {/* Image Upload Modal */}
        {showImageUpload && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImageUpload(false)}>
            <div className="zet-card p-6 m-4 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="font-medium mb-4" style={{ color: 'var(--zet-text)' }}>{t('image')}</h3>
              <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="h-5 w-5" />
                <span>Upload Image</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              <button onClick={() => setShowImageUpload(false)} className="w-full mt-3 py-2 text-center" style={{ color: 'var(--zet-text-muted)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
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

        {/* Navigation - Centered */}
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} className="tool-btn">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <span className="px-4 font-medium" style={{ color: 'var(--zet-text)' }}>
            {currentPage + 1} / {document.pages?.length || 1}
          </span>
          <button onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} className="tool-btn">
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
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
          <div className="p-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
            {toolboxOpen && <span className="text-sm font-medium pl-2" style={{ color: 'var(--zet-text)' }}>{t('tools')}</span>}
            <button 
              onClick={() => setToolboxOpen(!toolboxOpen)}
              className="tool-btn w-8 h-8 ml-auto"
              data-testid="toggle-toolbox"
            >
              {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          {/* Tools */}
          {toolboxOpen && (
            <div className="p-3 flex-1">
              <div className="grid grid-cols-3 gap-2 mb-4">
                {TOOLS.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTool(tool.id);
                      if (tool.id === 'image') setShowImageUpload(true);
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
          className="flex-1 p-8 flex items-center justify-center overflow-hidden" 
          style={{ background: 'var(--zet-bg-light)' }}
        >
          <div 
            ref={canvasRef}
            className="bg-white rounded-lg shadow-2xl relative overflow-hidden"
            style={{ 
              width: '100%', 
              maxWidth: '600px', 
              aspectRatio: '3/4',
              boxShadow: '0 0 40px var(--zet-glow)',
              cursor: activeTool === 'hand' ? (isPanning ? 'grabbing' : 'grab') : activeTool === 'text' ? 'text' : 'default'
            }}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            data-testid="canvas-area"
          >
            <div 
              className="w-full h-full"
              style={{ 
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`, 
                transformOrigin: 'top left' 
              }}
            >
              {canvasElements.map(el => (
                <div
                  key={el.id}
                  className={`absolute ${selectedElement === el.id ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: el.x,
                    top: el.y,
                    cursor: 'pointer'
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); }}
                >
                  {el.type === 'text' && (
                    <span style={{ fontSize: el.fontSize, color: el.color, whiteSpace: 'nowrap' }}>{el.content}</span>
                  )}
                  {el.type === 'image' && (
                    <div className="relative">
                      <img src={el.src} alt="" style={{ width: el.width, height: el.height }} draggable={false} />
                      {selectedElement === el.id && (
                        <div 
                          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 cursor-se-resize"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id }); }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onBlur={addTextElement}
                  onKeyDown={(e) => e.key === 'Enter' && addTextElement()}
                  autoFocus
                  className="absolute bg-transparent border-b-2 border-blue-500 outline-none text-black"
                  style={{ left: textPosition.x, top: textPosition.y - 20, fontSize: 16, minWidth: 100 }}
                  placeholder="Type here..."
                />
              )}
            </div>
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
    </div>
  );
};

export default Editor;
