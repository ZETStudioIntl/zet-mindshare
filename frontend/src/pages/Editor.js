import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import axios from 'axios';
import { 
  ArrowLeft, ArrowRight, Home, Save, 
  Pencil, Type, Image, Square, Circle, 
  Eraser, Pipette, Paintbrush, Move, 
  ZoomIn, ZoomOut, Undo, Redo, Layers,
  ChevronLeft, ChevronRight, Grid, List,
  Send, X, Minus, Sparkles, Plus, Trash2,
  Crop, MousePointer, Hand, Share2, Download,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic,
  PanelLeftClose, PanelLeftOpen, ChevronDown, ChevronUp,
  FileText
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const TOOLS = [
  { id: 'select', icon: MousePointer, nameKey: 'select' },
  { id: 'pencil', icon: Pencil, nameKey: 'pencil' },
  { id: 'brush', icon: Paintbrush, nameKey: 'brush' },
  { id: 'crop', icon: Crop, nameKey: 'crop' },
  { id: 'eraser', icon: Eraser, nameKey: 'eraser' },
  { id: 'circle', icon: Circle, nameKey: 'circle' },
  { id: 'square', icon: Square, nameKey: 'rectangle' },
  { id: 'image', icon: Image, nameKey: 'image' },
  { id: 'text', icon: Type, nameKey: 'text' },
  { id: 'pipette', icon: Pipette, nameKey: 'colorPicker' },
  { id: 'layers', icon: Layers, nameKey: 'layers' },
  { id: 'hand', icon: Hand, nameKey: 'pan' },
  { id: 'zoomin', icon: ZoomIn, nameKey: 'zoomIn' },
  { id: 'zoomout', icon: ZoomOut, nameKey: 'zoomOut' },
  { id: 'share', icon: Share2, nameKey: 'share' },
  { id: 'download', icon: Download, nameKey: 'download' },
  { id: 'bold', icon: Bold, nameKey: 'bold' },
  { id: 'italic', icon: Italic, nameKey: 'italic' },
  { id: 'alignleft', icon: AlignLeft, nameKey: 'alignLeft' },
  { id: 'aligncenter', icon: AlignCenter, nameKey: 'alignCenter' },
  { id: 'alignright', icon: AlignRight, nameKey: 'alignRight' },
];

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('select');
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
    try {
      await axios.put(`${API}/documents/${docId}`, {
        title: document.title,
        content: document.content,
        pages: document.pages
      }, { withCredentials: true });
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
    const newPage = { page_id: `page_${Date.now()}`, content: {} };
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
      setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setZetaLoading(false);
    }
  };

  const filteredTools = TOOLS.filter(tool => 
    t(tool.nameKey).toLowerCase().includes(toolSearch.toLowerCase())
  );

  // Calculate document stats
  const getDocumentStats = () => {
    const pageCount = document?.pages?.length || 0;
    let charCount = 0;
    // Count characters from document content and title
    if (document?.title) charCount += document.title.length;
    if (document?.content) charCount += JSON.stringify(document.content).length;
    document?.pages?.forEach(page => {
      if (page.content) charCount += JSON.stringify(page.content).length;
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
              <input
                type="text"
                placeholder={`${t('search')}...`}
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="zet-input mb-4"
              />
              <div className="grid grid-cols-3 gap-2">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => { setActiveTool(tool.id); setMobilePanel('canvas'); }}
                    className={`tool-btn flex flex-col items-center gap-1 h-auto py-3 ${activeTool === tool.id ? 'active' : ''}`}
                    data-testid={`tool-${tool.id}`}
                  >
                    <tool.icon className="h-5 w-5" />
                    <span className="text-xs truncate w-full text-center">{t(tool.nameKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {mobilePanel === 'canvas' && (
            <div className="h-full p-4 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md aspect-[3/4]" data-testid="canvas-area">
                {/* Canvas placeholder */}
              </div>
            </div>
          )}

          {mobilePanel === 'pages' && (
            <div className="h-full p-4 overflow-y-auto animate-fadeIn">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium" style={{ color: 'var(--zet-text)' }}>{t('allPages')}</h3>
                <button onClick={addPage} className="tool-btn w-8 h-8" data-testid="add-page-btn">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }}>
                {stats.pageCount} {t('pages')} • {stats.charCount} {t('characters')}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
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

              {/* ZETA Chat */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" style={{ color: 'var(--zet-primary-light)' }} />
                    <span className="font-medium" style={{ color: 'var(--zet-text)' }}>ZETA</span>
                  </div>
                </div>
                <div className="zet-card p-3 h-48 overflow-y-auto mb-2" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.map((msg, idx) => (
                    <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      <div 
                        className={`inline-block px-3 py-2 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'glow-sm' : ''}`}
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
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '0ms' }}></div>
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
              <Paintbrush className="h-5 w-5" />
              <span className="text-xs">{t('tools')}</span>
            </button>
            <button 
              onClick={() => setMobilePanel('canvas')}
              className={`flex flex-col items-center gap-1 p-2 ${mobilePanel === 'canvas' ? '' : 'opacity-50'}`}
              style={{ color: 'var(--zet-text)' }}
            >
              <Square className="h-5 w-5" />
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

        {/* Navigation - Centered without text */}
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
          {/* Logo */}
          <img 
            src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
            alt="ZET" 
            className="h-9 w-9"
          />
        </div>
      </header>

      {/* Main Content - 3 Equal Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Toolbox */}
        <div 
          className={`border-r flex flex-col transition-all duration-300 ${toolboxOpen ? 'w-72' : 'w-12'}`}
          style={{ borderColor: 'var(--zet-border)' }}
        >
          {/* Toolbox Header with Toggle */}
          <div className="p-2 flex items-center gap-2 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            {toolboxOpen && (
              <input
                type="text"
                placeholder={t('search')}
                value={toolSearch}
                onChange={(e) => setToolSearch(e.target.value)}
                className="zet-input flex-1 text-sm py-2"
                data-testid="tool-search"
              />
            )}
            <button 
              onClick={() => setToolboxOpen(!toolboxOpen)}
              className="tool-btn w-8 h-8 flex-shrink-0"
              data-testid="toggle-toolbox"
            >
              {toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>
          </div>

          {/* Tools Grid with Names */}
          {toolboxOpen && (
            <div className="p-3 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-2">
                {filteredTools.map(tool => (
                  <button
                    key={tool.id}
                    onClick={() => setActiveTool(tool.id)}
                    className={`tool-btn flex flex-col items-center gap-1 h-auto py-3 ${activeTool === tool.id ? 'active' : ''}`}
                    data-testid={`tool-${tool.id}`}
                  >
                    <tool.icon className="h-5 w-5" />
                    <span className="text-xs truncate w-full text-center">{t(tool.nameKey)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 p-8 flex items-center justify-center overflow-auto" style={{ background: 'var(--zet-bg-light)' }}>
          <div 
            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl aspect-[3/4]"
            style={{ boxShadow: '0 0 40px var(--zet-glow)' }}
            data-testid="canvas-area"
          >
            {/* Canvas content will go here */}
          </div>
        </div>

        {/* Right: Pages + ZETA - Equal Width */}
        <div 
          className="w-72 border-l flex flex-col"
          style={{ borderColor: 'var(--zet-border)' }}
        >
          {/* Pages Panel - Collapsible */}
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
                {/* Stats */}
                <div className="text-xs mb-3 flex gap-3" style={{ color: 'var(--zet-text-muted)' }}>
                  <span>{stats.pageCount} {t('pages')}</span>
                  <span>•</span>
                  <span>{stats.charCount} {t('characters')}</span>
                </div>
                
                {/* Pages Grid */}
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

          {/* ZETA AI Panel - Collapsible */}
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
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)', animationDelay: '0ms' }}></div>
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
    </div>
  );
};

export default Editor;
