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
  Star, MoreVertical, ALargeSmall,
  Pencil, Palette, Scissors, Wand2, MousePointer2,
  GripVertical, Loader2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PAGE_SIZES = [
  { name: 'A4', width: 595, height: 842 },
  { name: 'A5', width: 420, height: 595 },
  { name: 'Letter', width: 612, height: 792 },
];

const FONTS = [
  'Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana',
  'Helvetica', 'Trebuchet MS', 'Palatino', 'Garamond', 'Comic Sans MS',
  'Impact', 'Lucida Console', 'Monaco', 'Bookman', 'Avant Garde',
  'Brush Script MT', 'Copperplate', 'Rockwell', 'Century Gothic', 'Tahoma'
];

const PRESET_COLORS = [
  '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00',
  '#FF00FF', '#00FFFF', '#FF6600', '#6600FF', '#00FF66', '#FF0066',
  '#292f91', '#4ca8ad', '#333333', '#666666', '#999999', '#CCCCCC'
];

const TOOLS = [
  { id: 'text', icon: Type, name: 'Text Tool' },
  { id: 'textsize', icon: Baseline, name: 'Text Size' },
  { id: 'font', icon: ALargeSmall, name: 'Font' },
  { id: 'color', icon: Palette, name: 'Color' },
  { id: 'hand', icon: Hand, name: 'Hand Tool' },
  { id: 'image', icon: Image, name: 'Image' },
  { id: 'createimage', icon: Wand2, name: 'AI Image' },
  { id: 'draw', icon: Pencil, name: 'Draw' },
  { id: 'select', icon: MousePointer2, name: 'Mass Select' },
  { id: 'cut', icon: Scissors, name: 'Cut/Crop' },
  { id: 'addpage', icon: FilePlus, name: 'Add Page' },
  { id: 'pagesize', icon: FileText, name: 'Page Size' },
  { id: 'voice', icon: Volume2, name: 'Voice' },
  { id: 'triangle', icon: Triangle, name: 'Triangle' },
  { id: 'square', icon: Square, name: 'Square' },
  { id: 'circle', icon: Circle, name: 'Circle' },
  { id: 'star', icon: Star, name: 'Star' },
];

// Draggable Panel Component
const DraggablePanel = ({ children, title, onClose, initialPosition = { x: 100, y: 100 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.panel-drag-handle')) {
      setDragging(true);
      setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (dragging) {
        setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
      }
    };
    const handleMouseUp = () => setDragging(false);
    
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  return (
    <div 
      className="fixed zet-card shadow-2xl z-50 min-w-[280px]"
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      <div className="panel-drag-handle p-3 border-b flex items-center justify-between cursor-move" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          <span className="font-medium" style={{ color: 'var(--zet-text)' }}>{title}</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
};

const Editor = () => {
  const { docId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [document, setDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [activeTool, setActiveTool] = useState('text');
  const [toolSearch, setToolSearch] = useState('');
  const [hoveredTool, setHoveredTool] = useState(null);
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
  const [selectedElements, setSelectedElements] = useState([]);
  const [zoom, setZoom] = useState(0.75);
  const [cursorPosition, setCursorPosition] = useState({ x: 20, y: 30 });
  const [currentText, setCurrentText] = useState('');
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [showPageSize, setShowPageSize] = useState(false);
  const [showTextSize, setShowTextSize] = useState(false);
  const [showFont, setShowFont] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showColor, setShowColor] = useState(false);
  const [showDraw, setShowDraw] = useState(false);
  const [showCreateImage, setShowCreateImage] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [uploadForShape, setUploadForShape] = useState(null);
  const [cropping, setCropping] = useState(null);
  const [cropArea, setCropArea] = useState(null);
  
  // Page & text state
  const [pageSize, setPageSize] = useState({ name: 'A4', width: 595, height: 842 });
  const [customWidth, setCustomWidth] = useState(595);
  const [customHeight, setCustomHeight] = useState(842);
  const [currentFontSize, setCurrentFontSize] = useState(16);
  const [currentFont, setCurrentFont] = useState('Arial');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [customColor, setCustomColor] = useState('#000000');
  const [fontSearch, setFontSearch] = useState('');
  
  // Draw state
  const [drawSize, setDrawSize] = useState(3);
  const [drawOpacity, setDrawOpacity] = useState(100);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  
  // Mass selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionPath, setSelectionPath] = useState([]);
  
  // AI Image state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiQuality, setAiQuality] = useState('standard');
  const [aiReference, setAiReference] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiChat, setAiChat] = useState([]);
  
  // Voice state
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceProgress, setVoiceProgress] = useState(0);
  
  // History
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const autoSaveTimerRef = useRef(null);
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const chatEndRef = useRef(null);
  const textInputRef = useRef(null);

  // Auto-save
  useEffect(() => {
    if (canvasElements.length > 0 && document) {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(() => saveDocument(true), 1500);
    }
    return () => { if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current); };
  }, [canvasElements, drawPaths]);

  useEffect(() => { fetchDocument(); }, [docId]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [zetaMessages]);

  // Load elements when page changes
  useEffect(() => {
    if (document?.pages?.[currentPage]) {
      setCanvasElements(document.pages[currentPage].elements || []);
      setDrawPaths(document.pages[currentPage].drawPaths || []);
      setHistory([document.pages[currentPage].elements || []]);
      setHistoryIndex(0);
      if (document.pages[currentPage].pageSize) {
        setPageSize(document.pages[currentPage].pageSize);
      }
    } else {
      setCanvasElements([]);
      setDrawPaths([]);
    }
    setCursorPosition({ x: 20, y: 30 });
    setCurrentText('');
  }, [document, currentPage]);

  // Mouse wheel zoom
  useEffect(() => {
    const handleWheel = (e) => {
      if (activeTool === 'hand' && canvasContainerRef.current?.contains(e.target)) {
        e.preventDefault();
        setZoom(prev => Math.max(0.25, Math.min(3, prev + (e.deltaY > 0 ? -0.1 : 0.1))));
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeTool]);

  // Focus text input when text tool active
  useEffect(() => {
    if (activeTool === 'text' && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [activeTool, cursorPosition]);

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
        title: document.title,
        content: document.content,
        pages: updatedPages
      }, { withCredentials: true });
      setDocument(prev => ({ ...prev, pages: updatedPages }));
    } catch (error) {}
    finally { if (!silent) setSaving(false); }
  };

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

  // Text handling - live typing
  const handleTextInput = (e) => {
    const value = e.target.value;
    setCurrentText(value);
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitText();
      // Move cursor to next line
      setCursorPosition(prev => ({ x: 20, y: prev.y + currentFontSize + 8 }));
    }
  };

  const commitText = () => {
    if (!currentText.trim()) return;
    const newElement = {
      id: `el_${Date.now()}`,
      type: 'text',
      x: cursorPosition.x,
      y: cursorPosition.y,
      content: currentText,
      fontSize: currentFontSize,
      fontFamily: currentFont,
      color: currentColor
    };
    const newElements = [...canvasElements, newElement];
    setCanvasElements(newElements);
    saveToHistory(newElements);
    setCurrentText('');
    setCursorPosition(prev => ({ x: 20, y: prev.y + currentFontSize + 8 }));
  };

  // Canvas click
  const handleCanvasClick = (e) => {
    if (dragging || resizing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    setShowShapeMenu(null);

    if (activeTool === 'text') {
      if (currentText.trim()) commitText();
      setCursorPosition({ x: Math.max(20, x), y: Math.max(30, y) });
      setTimeout(() => textInputRef.current?.focus(), 0);
    } else if (activeTool === 'image') {
      setShowImageUpload(true);
    } else if (['triangle', 'square', 'circle', 'star'].includes(activeTool)) {
      addShape(activeTool, x, y);
    } else if (activeTool === 'hand' || activeTool === 'select') {
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      setSelectedElement(clicked?.id || null);
      if (!clicked) setSelectedElements([]);
    }
  };

  // Right-click to select text
  const handleContextMenu = (e) => {
    e.preventDefault();
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
    if (clicked) {
      setSelectedElement(clicked.id);
      setActiveTool('hand');
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

  // Drawing handlers
  const handleDrawStart = (e) => {
    if (activeTool !== 'draw') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
  };

  const handleDrawMove = (e) => {
    if (!isDrawing || activeTool !== 'draw') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setCurrentPath(prev => [...prev, { x, y }]);
  };

  const handleDrawEnd = () => {
    if (isDrawing && currentPath.length > 1) {
      setDrawPaths(prev => [...prev, { 
        points: currentPath, 
        size: drawSize, 
        opacity: drawOpacity, 
        color: currentColor 
      }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  // Mass selection
  const handleSelectionStart = (e) => {
    if (activeTool !== 'select') return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setIsSelecting(true);
    setSelectionPath([{ x, y }]);
  };

  const handleSelectionMove = (e) => {
    if (!isSelecting) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    setSelectionPath(prev => [...prev, { x, y }]);
  };

  const handleSelectionEnd = () => {
    if (isSelecting && selectionPath.length > 2) {
      // Find elements inside selection
      const selected = canvasElements.filter(el => {
        const elX = el.x + (el.width || 50) / 2;
        const elY = el.y;
        return isPointInPolygon(elX, elY, selectionPath);
      });
      setSelectedElements(selected.map(el => el.id));
    }
    setIsSelecting(false);
    setSelectionPath([]);
  };

  const isPointInPolygon = (x, y, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Drag & resize
  const handleCanvasMouseDown = (e) => {
    if (activeTool === 'draw') { handleDrawStart(e); return; }
    if (activeTool === 'select') { handleSelectionStart(e); return; }
    
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
    if (activeTool === 'draw') { handleDrawMove(e); return; }
    if (activeTool === 'select') { handleSelectionMove(e); return; }
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoom;
    const y = (e.clientY - rect.top) / zoom;
    
    if (dragging) {
      const el = canvasElements.find(el => el.id === dragging);
      if (el) {
        const newX = Math.max(0, Math.min(pageSize.width - (el.width || 100), x - dragOffset.x));
        const newY = Math.max(20, Math.min(pageSize.height - (el.height || 20), y - dragOffset.y));
        setCanvasElements(prev => prev.map(item => item.id === dragging ? { ...item, x: newX, y: newY } : item));
      }
    }
    
    if (resizing) {
      const newWidth = Math.max(30, x - resizing.startX);
      const newHeight = Math.max(30, y - resizing.startY);
      setCanvasElements(prev => prev.map(el => el.id === resizing.id ? { ...el, width: newWidth, height: newHeight } : el));
    }
  };

  const handleCanvasMouseUp = () => {
    if (activeTool === 'draw') { handleDrawEnd(); return; }
    if (activeTool === 'select') { handleSelectionEnd(); return; }
    if (dragging || resizing) saveToHistory(canvasElements);
    setDragging(null);
    setResizing(null);
  };

  // Shape
  const addShape = (type, x, y) => {
    const el = { id: `el_${Date.now()}`, type: 'shape', shapeType: type, x: x - 40, y: y - 40, width: 80, height: 80, fill: currentColor, image: null };
    const newElements = [...canvasElements, el];
    setCanvasElements(newElements);
    saveToHistory(newElements);
  };

  // Image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        if (uploadForShape) {
          setCanvasElements(prev => prev.map(el => el.id === uploadForShape ? { ...el, image: event.target.result } : el));
          setUploadForShape(null);
        } else {
          const maxW = Math.min(300, pageSize.width - 40);
          const ratio = maxW / img.width;
          const newEl = { id: `el_${Date.now()}`, type: 'image', x: 20, y: cursorPosition.y, width: maxW, height: img.height * ratio, src: event.target.result };
          setCanvasElements(prev => [...prev, newEl]);
          saveToHistory([...canvasElements, newEl]);
        }
        setShowImageUpload(false);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // AI Image generation
  const generateAIImage = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    setAiChat(prev => [...prev, { role: 'user', content: aiPrompt }]);
    
    try {
      const res = await axios.post(`${API}/zeta/generate-image`, {
        prompt: aiPrompt,
        quality: aiQuality,
        reference_image: aiReference
      }, { withCredentials: true });
      
      if (res.data.images?.length > 0) {
        const imgData = res.data.images[0].data;
        const newEl = { id: `el_${Date.now()}`, type: 'image', x: 20, y: cursorPosition.y, width: 200, height: 200, src: `data:image/png;base64,${imgData}` };
        setCanvasElements(prev => [...prev, newEl]);
        setAiChat(prev => [...prev, { role: 'assistant', content: 'Image generated! Added to your document.' }]);
      } else {
        setAiChat(prev => [...prev, { role: 'assistant', content: res.data.text || 'Generated!' }]);
      }
    } catch (error) {
      setAiChat(prev => [...prev, { role: 'assistant', content: 'Error generating image.' }]);
    }
    setAiGenerating(false);
    setAiPrompt('');
  };

  // Delete
  const deleteSelected = () => {
    if (selectedElements.length > 0) {
      setCanvasElements(prev => prev.filter(el => !selectedElements.includes(el.id)));
      setSelectedElements([]);
    } else if (selectedElement) {
      setCanvasElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
    saveToHistory(canvasElements);
  };

  // Apply color to selected
  const applyColorToSelected = (color) => {
    setCurrentColor(color);
    if (selectedElements.length > 0) {
      setCanvasElements(prev => prev.map(el => selectedElements.includes(el.id) ? { ...el, color: color, fill: color } : el));
    } else if (selectedElement) {
      setCanvasElements(prev => prev.map(el => el.id === selectedElement ? { ...el, color: color, fill: color } : el));
    }
  };

  // Voice
  const playVoice = () => {
    const text = canvasElements.filter(el => el.type === 'text').sort((a, b) => a.y - b.y).map(el => el.content).join('. ');
    if (!text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setIsPlaying(false);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  // ZETA
  const sendZetaMessage = async () => {
    if (!zetaInput.trim() || zetaLoading) return;
    setZetaMessages(prev => [...prev, { role: 'user', content: zetaInput }]);
    setZetaLoading(true);
    const msg = zetaInput;
    setZetaInput('');
    try {
      const res = await axios.post(`${API}/zeta/chat`, { message: msg, doc_id: docId, session_id: zetaSessionId }, { withCredentials: true });
      setZetaSessionId(res.data.session_id);
      setZetaMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
    } catch { setZetaMessages(prev => [...prev, { role: 'assistant', content: 'Error!' }]); }
    setZetaLoading(false);
  };

  const filteredTools = TOOLS.filter(tool => tool.name.toLowerCase().includes(toolSearch.toLowerCase()) || tool.id.includes(toolSearch.toLowerCase()));
  const filteredFonts = FONTS.filter(f => f.toLowerCase().includes(fontSearch.toLowerCase()));
  const stats = { pageCount: document?.pages?.length || 0, charCount: canvasElements.filter(el => el.type === 'text').reduce((acc, el) => acc + el.content.length, 0) };

  // Render shape
  const renderShape = (el) => {
    const style = { width: '100%', height: '100%', backgroundColor: el.image ? 'transparent' : el.fill, backgroundImage: el.image ? `url(${el.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' };
    const clips = { triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)', star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)', circle: '' };
    if (el.shapeType === 'circle') return <div style={{ ...style, borderRadius: '50%' }} />;
    if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;
    return <div style={style} />;
  };

  if (!document) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--zet-primary)' }} /></div>;

  return (
    <div className="h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="p-2 flex items-center justify-between border-b" style={{ borderColor: 'var(--zet-border)' }}>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')} className="tool-btn"><Home className="h-5 w-5" /></button>
          <input value={document.title} onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))} className="bg-transparent font-medium px-2" style={{ color: 'var(--zet-text)' }} />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className={`tool-btn ${historyIndex <= 0 ? 'opacity-30' : ''}`}><Undo className="h-4 w-4" /></button>
          <span style={{ color: 'var(--zet-text)' }}>{currentPage + 1}/{document.pages?.length || 1}</span>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className={`tool-btn ${historyIndex >= history.length - 1 ? 'opacity-30' : ''}`}><Redo className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentPage(Math.max(0, currentPage - 1))} disabled={currentPage === 0} className={`tool-btn ${currentPage === 0 ? 'opacity-30' : ''}`}><ArrowLeft className="h-4 w-4" /></button>
          <button onClick={() => setCurrentPage(Math.min((document.pages?.length || 1) - 1, currentPage + 1))} disabled={currentPage >= (document.pages?.length || 1) - 1} className={`tool-btn ${currentPage >= (document.pages?.length || 1) - 1 ? 'opacity-30' : ''}`}><ArrowRight className="h-4 w-4" /></button>
          <button onClick={() => saveDocument()} className="zet-btn flex items-center gap-1 text-sm px-3 py-1"><Save className={`h-4 w-4 ${saving ? 'animate-pulse' : ''}`} /></button>
          <img src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" alt="ZET" className="h-8 w-8" />
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Toolbox */}
        <div className={`border-r flex flex-col transition-all ${toolboxOpen ? 'w-56' : 'w-10'}`} style={{ borderColor: 'var(--zet-border)' }}>
          <div className="p-1 flex items-center gap-1 border-b" style={{ borderColor: 'var(--zet-border)' }}>
            {toolboxOpen && (
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} />
                <input placeholder="Search" value={toolSearch} onChange={(e) => setToolSearch(e.target.value)} className="zet-input pl-7 text-xs py-1 w-full" />
              </div>
            )}
            <button onClick={() => setToolboxOpen(!toolboxOpen)} className="tool-btn w-7 h-7">{toolboxOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}</button>
          </div>
          {toolboxOpen && (
            <div className="p-1 flex-1 overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {filteredTools.map(tool => (
                  <div key={tool.id} className="relative" onMouseEnter={() => setHoveredTool(tool.id)} onMouseLeave={() => setHoveredTool(null)}>
                    <button
                      onClick={() => {
                        setActiveTool(tool.id);
                        if (tool.id === 'image') setShowImageUpload(true);
                        if (tool.id === 'pagesize') setShowPageSize(true);
                        if (tool.id === 'textsize') setShowTextSize(true);
                        if (tool.id === 'font') setShowFont(true);
                        if (tool.id === 'voice') setShowVoice(true);
                        if (tool.id === 'color') setShowColor(true);
                        if (tool.id === 'draw') setShowDraw(true);
                        if (tool.id === 'createimage') setShowCreateImage(true);
                        if (tool.id === 'addpage') addPage();
                      }}
                      className={`tool-btn h-10 w-full ${activeTool === tool.id ? 'active' : ''}`}
                    >
                      <tool.icon className="h-4 w-4" />
                    </button>
                    {hoveredTool === tool.id && (
                      <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap z-50" style={{ background: 'var(--zet-bg-card)', color: 'var(--zet-text)' }}>
                        {tool.name}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t text-center text-xs" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
                Zoom: {Math.round(zoom * 100)}%
              </div>
              {(selectedElement || selectedElements.length > 0) && (
                <button onClick={deleteSelected} className="w-full mt-2 py-1 rounded bg-red-500/20 text-red-400 text-xs">Delete</button>
              )}
            </div>
          )}
        </div>

        {/* Canvas with scroll for multiple pages */}
        <div ref={canvasContainerRef} className="flex-1 overflow-auto p-4" style={{ background: 'var(--zet-bg-light)' }}>
          <div className="flex flex-col items-center gap-4">
            {document.pages?.map((page, idx) => (
              <div
                key={page.page_id}
                ref={idx === currentPage ? canvasRef : null}
                className={`bg-white shadow-xl relative ${idx === currentPage ? 'ring-2' : ''}`}
                style={{ 
                  width: (page.pageSize?.width || pageSize.width) * zoom,
                  height: (page.pageSize?.height || pageSize.height) * zoom,
                  ringColor: 'var(--zet-primary-light)',
                  cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'text' ? 'text' : 'default'
                }}
                onClick={(e) => { if (idx !== currentPage) setCurrentPage(idx); else handleCanvasClick(e); }}
                onContextMenu={handleContextMenu}
                onMouseDown={idx === currentPage ? handleCanvasMouseDown : undefined}
                onMouseMove={idx === currentPage ? handleCanvasMouseMove : undefined}
                onMouseUp={idx === currentPage ? handleCanvasMouseUp : undefined}
                onMouseLeave={idx === currentPage ? handleCanvasMouseUp : undefined}
              >
                {/* Page number */}
                <div className="absolute -top-6 left-0 text-xs" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>
                
                {/* Draw paths */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
                  {(idx === currentPage ? drawPaths : page.drawPaths || []).map((path, i) => (
                    <path key={i} d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                      stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100}
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  {isDrawing && currentPath.length > 1 && (
                    <path d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                      stroke={currentColor} strokeWidth={drawSize * zoom} strokeOpacity={drawOpacity / 100}
                      fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                  {isSelecting && selectionPath.length > 1 && (
                    <path d={`M ${selectionPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z`}
                      stroke="#4ca8ad" strokeWidth={2} strokeDasharray="5,5" fill="rgba(76,168,173,0.1)" />
                  )}
                </svg>

                {/* Elements */}
                {(idx === currentPage ? canvasElements : page.elements || []).map(el => (
                  <div key={el.id}
                    className={`absolute ${selectedElement === el.id || selectedElements.includes(el.id) ? 'ring-2 ring-blue-500' : ''}`}
                    style={{ left: el.x * zoom, top: (el.type === 'text' ? el.y - (el.fontSize || 16) : el.y) * zoom, width: el.type !== 'text' ? (el.width || 80) * zoom : 'auto', height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto', cursor: activeTool === 'hand' ? 'move' : 'default' }}
                    onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); setCurrentPage(idx); }}
                  >
                    {el.type === 'text' && <div style={{ fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial', color: el.color || '#000', maxWidth: ((page.pageSize?.width || pageSize.width) - el.x - 20) * zoom, wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{el.content}</div>}
                    {el.type === 'image' && (
                      <div className="relative w-full h-full">
                        <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                        {selectedElement === el.id && <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />}
                      </div>
                    )}
                    {el.type === 'shape' && (
                      <div className="relative w-full h-full">
                        {renderShape(el)}
                        {selectedElement === el.id && (
                          <>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                            <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setShowShapeMenu(el.id); }}>
                              <MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />
                            </button>
                            {showShapeMenu === el.id && (
                              <div className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[100px]">
                                <button className="w-full text-left px-2 py-1 text-xs rounded hover:bg-white/10" style={{ color: 'var(--zet-text)' }} onClick={(e) => { e.stopPropagation(); setUploadForShape(el.id); setShowImageUpload(true); setShowShapeMenu(null); }}>Add Image</button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Live text input cursor */}
                {idx === currentPage && activeTool === 'text' && (
                  <div className="absolute" style={{ left: cursorPosition.x * zoom, top: (cursorPosition.y - currentFontSize) * zoom }}>
                    <input
                      ref={textInputRef}
                      value={currentText}
                      onChange={handleTextInput}
                      onKeyDown={handleTextKeyDown}
                      onBlur={() => { if (currentText.trim()) commitText(); }}
                      className="bg-transparent outline-none border-none caret-blue-500"
                      style={{ fontSize: currentFontSize * zoom, fontFamily: currentFont, color: currentColor, minWidth: 200 * zoom, caretColor: 'var(--zet-primary)' }}
                      placeholder="Start typing..."
                    />
                    <div className="absolute left-0 top-0 w-0.5 h-full animate-pulse" style={{ background: 'var(--zet-primary)', height: currentFontSize * zoom }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="w-56 border-l flex flex-col" style={{ borderColor: 'var(--zet-border)' }}>
          {/* Pages */}
          <div className="border-b" style={{ borderColor: 'var(--zet-border)' }}>
            <div className="p-2 flex items-center justify-between">
              <span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>Pages</span>
              <div className="flex gap-1">
                {pagesOpen && <button onClick={addPage} className="p-1 hover:bg-white/10 rounded"><Plus className="h-3 w-3" style={{ color: 'var(--zet-text-muted)' }} /></button>}
                <button onClick={() => setPagesOpen(!pagesOpen)} className="p-1 hover:bg-white/10 rounded">{pagesOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>
              </div>
            </div>
            {pagesOpen && (
              <div className="px-2 pb-2">
                <div className="text-xs mb-1" style={{ color: 'var(--zet-text-muted)' }}>{stats.pageCount} pages • {stats.charCount} chars</div>
                <div className="grid grid-cols-3 gap-1 max-h-24 overflow-y-auto">
                  {document.pages?.map((page, idx) => (
                    <div key={page.page_id} className="relative group">
                      <div onClick={() => { setCurrentPage(idx); canvasContainerRef.current?.scrollTo({ top: idx * (pageSize.height * zoom + 20), behavior: 'smooth' }); }}
                        className={`aspect-[3/4] rounded border-2 cursor-pointer overflow-hidden ${currentPage === idx ? 'border-blue-500' : 'border-transparent'}`}
                        style={{ background: 'white' }}
                      >
                        {/* Mini preview */}
                        <div className="w-full h-full relative" style={{ transform: 'scale(0.15)', transformOrigin: 'top left' }}>
                          {(page.elements || []).slice(0, 5).map(el => (
                            <div key={el.id} className="absolute" style={{ left: el.x, top: el.y - (el.fontSize || 16), fontSize: el.fontSize || 16, color: el.color || '#000' }}>
                              {el.type === 'text' && el.content.slice(0, 20)}
                            </div>
                          ))}
                        </div>
                      </div>
                      {document.pages.length > 1 && <button onClick={() => deletePage(idx)} className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs opacity-0 group-hover:opacity-100">×</button>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ZETA */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--zet-border)' }}>
              <div className="flex items-center gap-1"><Sparkles className="h-4 w-4" style={{ color: 'var(--zet-primary-light)' }} /><span className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>ZETA</span></div>
              <button onClick={() => setZetaOpen(!zetaOpen)} className="p-1 hover:bg-white/10 rounded">{zetaOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</button>
            </div>
            {zetaOpen && (
              <>
                <div className="flex-1 p-2 overflow-y-auto text-xs" style={{ background: 'var(--zet-bg)' }}>
                  {zetaMessages.length === 0 && <div className="text-center py-4" style={{ color: 'var(--zet-text-muted)' }}><Sparkles className="h-5 w-5 mx-auto mb-1 opacity-50" /><p>Ask anything!</p></div>}
                  {zetaMessages.map((msg, i) => <div key={i} className={`mb-2 ${msg.role === 'user' ? 'text-right' : ''}`}><div className="inline-block px-2 py-1 rounded max-w-[90%]" style={{ background: msg.role === 'user' ? 'var(--zet-primary)' : 'var(--zet-bg-card)', color: 'var(--zet-text)' }}>{msg.content}</div></div>)}
                  {zetaLoading && <div className="flex gap-1"><div className="w-2 h-2 rounded-full animate-bounce" style={{ background: 'var(--zet-primary-light)' }} /></div>}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 border-t" style={{ borderColor: 'var(--zet-border)' }}>
                  <div className="flex gap-1"><input placeholder="Ask..." value={zetaInput} onChange={e => setZetaInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendZetaMessage()} className="zet-input flex-1 text-xs py-1" /><button onClick={sendZetaMessage} className="zet-btn px-2"><Send className="h-3 w-3" /></button></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Voice Panel */}
      {showVoice && (
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t" style={{ background: 'var(--zet-bg-card)', borderColor: 'var(--zet-border)' }}>
          <div className="max-w-xl mx-auto flex items-center gap-3">
            <span className="text-sm" style={{ color: 'var(--zet-text)' }}>Voice Reader</span>
            <button className="tool-btn w-8 h-8"><SkipBack className="h-4 w-4" /></button>
            <button onClick={isPlaying ? () => { window.speechSynthesis.pause(); setIsPlaying(false); } : playVoice} className="tool-btn w-10 h-10">{isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}</button>
            <button className="tool-btn w-8 h-8"><SkipForward className="h-4 w-4" /></button>
            <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--zet-bg)' }}><div className="h-full rounded-full" style={{ width: `${voiceProgress}%`, background: 'var(--zet-primary-light)' }} /></div>
            <button onClick={() => { setShowVoice(false); window.speechSynthesis.cancel(); setIsPlaying(false); }} className="p-1"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
          </div>
        </div>
      )}

      {/* Draggable Panels */}
      {showDraw && (
        <DraggablePanel title="Draw" onClose={() => setShowDraw(false)} initialPosition={{ x: 250, y: 100 }}>
          <div className="space-y-3 w-48">
            <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Brush Size: {drawSize}px</label><input type="range" min="1" max="20" value={drawSize} onChange={e => setDrawSize(Number(e.target.value))} className="w-full" /></div>
            <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Opacity: {drawOpacity}%</label><input type="range" min="10" max="100" value={drawOpacity} onChange={e => setDrawOpacity(Number(e.target.value))} className="w-full" /></div>
            <div className="flex gap-2 flex-wrap">{PRESET_COLORS.slice(0, 8).map(c => <button key={c} onClick={() => setCurrentColor(c)} className={`w-6 h-6 rounded ${currentColor === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />)}</div>
          </div>
        </DraggablePanel>
      )}

      {showColor && (
        <DraggablePanel title="Color" onClose={() => setShowColor(false)} initialPosition={{ x: 300, y: 150 }}>
          <div className="space-y-3 w-56">
            <div className="grid grid-cols-6 gap-1">{PRESET_COLORS.map(c => <button key={c} onClick={() => applyColorToSelected(c)} className={`w-7 h-7 rounded ${currentColor === c ? 'ring-2 ring-white' : ''}`} style={{ background: c }} />)}</div>
            <div><label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Custom</label><input type="color" value={customColor} onChange={e => { setCustomColor(e.target.value); applyColorToSelected(e.target.value); }} className="w-full h-8 rounded cursor-pointer" /></div>
          </div>
        </DraggablePanel>
      )}

      {showTextSize && (
        <DraggablePanel title="Text Size" onClose={() => setShowTextSize(false)} initialPosition={{ x: 350, y: 100 }}>
          <div className="space-y-3 w-48">
            <input type="range" min="8" max="72" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="w-full" />
            <div className="flex items-center gap-2"><input type="number" min="8" max="100" value={currentFontSize} onChange={e => setCurrentFontSize(Number(e.target.value))} className="zet-input w-16 text-center" /><span style={{ color: 'var(--zet-text)' }}>pt</span></div>
            <div className="p-2 rounded" style={{ background: 'var(--zet-bg)' }}><span style={{ fontSize: Math.min(currentFontSize, 36), color: 'var(--zet-text)' }}>Aa</span></div>
          </div>
        </DraggablePanel>
      )}

      {showFont && (
        <DraggablePanel title="Font" onClose={() => setShowFont(false)} initialPosition={{ x: 400, y: 100 }}>
          <div className="w-56">
            <div className="relative mb-2"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: 'var(--zet-text-muted)' }} /><input placeholder="Search..." value={fontSearch} onChange={e => setFontSearch(e.target.value)} className="zet-input pl-7 text-xs w-full" /></div>
            <div className="max-h-48 overflow-y-auto space-y-1">{filteredFonts.map(f => <button key={f} onClick={() => { setCurrentFont(f); setShowFont(false); }} className={`w-full text-left px-2 py-1 text-sm rounded ${currentFont === f ? 'glow-sm' : ''}`} style={{ background: currentFont === f ? 'var(--zet-primary)' : 'transparent', color: 'var(--zet-text)', fontFamily: f }}>{f}</button>)}</div>
          </div>
        </DraggablePanel>
      )}

      {showPageSize && (
        <DraggablePanel title="Page Size" onClose={() => setShowPageSize(false)} initialPosition={{ x: 300, y: 200 }}>
          <div className="space-y-2 w-48">
            {PAGE_SIZES.map(s => <button key={s.name} onClick={() => { setPageSize(s); setShowPageSize(false); }} className={`w-full p-2 rounded text-left text-sm ${pageSize.name === s.name ? 'glow-sm' : ''}`} style={{ background: pageSize.name === s.name ? 'var(--zet-primary)' : 'var(--zet-bg)', color: 'var(--zet-text)' }}>{s.name} <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{s.width}×{s.height}</span></button>)}
            <div className="flex gap-1 pt-2 border-t" style={{ borderColor: 'var(--zet-border)' }}><input type="number" value={customWidth} onChange={e => setCustomWidth(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="W" /><input type="number" value={customHeight} onChange={e => setCustomHeight(Number(e.target.value))} className="zet-input flex-1 text-xs" placeholder="H" /></div>
            <button onClick={() => { setPageSize({ name: 'Custom', width: customWidth, height: customHeight }); setShowPageSize(false); }} className="zet-btn w-full text-sm">Apply</button>
          </div>
        </DraggablePanel>
      )}

      {showCreateImage && (
        <DraggablePanel title="AI Image Generator" onClose={() => setShowCreateImage(false)} initialPosition={{ x: 250, y: 80 }}>
          <div className="w-72 space-y-3">
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Quality</label><select value={aiQuality} onChange={e => setAiQuality(e.target.value)} className="zet-input text-sm w-full"><option value="standard">Standard</option><option value="high">High</option></select></div>
            <div><label className="text-xs mb-1 block" style={{ color: 'var(--zet-text-muted)' }}>Reference Image</label><label className="zet-btn text-xs w-full flex items-center justify-center gap-1 cursor-pointer py-2"><Upload className="h-3 w-3" />{aiReference ? 'Image loaded' : 'Upload'}<input type="file" accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { const r = new FileReader(); r.onload = ev => setAiReference(ev.target.result.split(',')[1]); r.readAsDataURL(f); } }} className="hidden" /></label></div>
            <div className="max-h-32 overflow-y-auto space-y-1 p-2 rounded" style={{ background: 'var(--zet-bg)' }}>{aiChat.map((m, i) => <div key={i} className={`text-xs ${m.role === 'user' ? 'text-right' : ''}`} style={{ color: 'var(--zet-text)' }}>{m.content}</div>)}</div>
            <div className="flex gap-1"><input placeholder="Describe image..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && generateAIImage()} className="zet-input flex-1 text-xs" /><button onClick={generateAIImage} disabled={aiGenerating} className="zet-btn px-2">{aiGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}</button></div>
          </div>
        </DraggablePanel>
      )}

      {/* Image Upload Modal */}
      {showImageUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}>
          <div className="zet-card p-4 w-72" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="font-medium text-sm" style={{ color: 'var(--zet-text)' }}>{uploadForShape ? 'Add to Shape' : 'Add Image'}</h3><button onClick={() => { setShowImageUpload(false); setUploadForShape(null); }}><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button></div>
            <label className="zet-btn w-full flex items-center justify-center gap-2 cursor-pointer py-3"><Upload className="h-4 w-4" /><span>Choose File</span><input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" /></label>
          </div>
        </div>
      )}
    </div>
  );
};

export default Editor;
