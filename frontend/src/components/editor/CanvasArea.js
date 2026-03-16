import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MoreVertical, Trash2, Image, RefreshCw, Wand2, Copy, FlipHorizontal2 } from 'lucide-react';

const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const lines = Math.max(1, (el.content || '').split('\n').length);
    const h = (el.fontSize || 16) * lines * (el.lineHeight || 1.5);
    return x >= el.x && x <= el.x + (el.width || 400) && y >= el.y && y <= el.y + h;
  }
  return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
};

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// Check if point is near a pen/vector path
const isPointNearPath = (x, y, path, threshold = 15) => {
  if (!path.points || path.points.length < 2) return false;
  return path.points.some(p => dist({ x, y }, p) < threshold);
};

// Get bounding box for a path
const getPathBounds = (path) => {
  if (!path.points || path.points.length === 0) return null;
  const xs = path.points.map(p => p.x);
  const ys = path.points.map(p => p.y);
  return {
    x: Math.min(...xs),
    y: Math.min(...ys),
    width: Math.max(...xs) - Math.min(...xs),
    height: Math.max(...ys) - Math.min(...ys)
  };
};

// Check if point is inside a lasso polygon
const isPointInLasso = (point, lasso) => {
  if (!lasso || lasso.length < 3) return false;
  let inside = false;
  for (let i = 0, j = lasso.length - 1; i < lasso.length; j = i++) {
    const xi = lasso[i].x, yi = lasso[i].y;
    const xj = lasso[j].x, yj = lasso[j].y;
    if (((yi > point.y) !== (yj > point.y)) && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
};

// Check if element is inside lasso
const isElementInLasso = (el, lasso) => {
  const cx = el.x + (el.width || 50) / 2;
  const cy = el.y + (el.type === 'text' ? (el.fontSize || 16) / 2 : (el.height || 80) / 2);
  return isPointInLasso({ x: cx, y: cy }, lasso);
};

// Check if vector path is inside lasso - improved version
const isVectorInLasso = (path, lasso) => {
  if (!path.points || path.points.length < 2) return false;
  const bounds = getPathBounds(path);
  if (!bounds) return false;
  
  // Check center point
  const cx = bounds.x + bounds.width / 2;
  const cy = bounds.y + bounds.height / 2;
  if (isPointInLasso({ x: cx, y: cy }, lasso)) return true;
  
  // Check if any point of the path is inside the lasso
  const anyPointInside = path.points.some(p => isPointInLasso(p, lasso));
  if (anyPointInside) return true;
  
  // Check corners of bounding box
  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: bounds.x + bounds.width, y: bounds.y },
    { x: bounds.x, y: bounds.y + bounds.height },
    { x: bounds.x + bounds.width, y: bounds.y + bounds.height }
  ];
  return corners.some(c => isPointInLasso(c, lasso));
};

const ShapeRenderer = ({ el }) => {
  const hasGradient = el.gradientStart && el.gradientEnd;
  const hasImage = !!el.image;
  
  const style = { width: '100%', height: '100%' };
  
  if (hasGradient && !hasImage) {
    style.backgroundImage = `linear-gradient(135deg, ${el.gradientStart}, ${el.gradientEnd})`;
  } else if (hasImage) {
    style.backgroundImage = `url(${el.image})`;
    style.backgroundSize = 'cover';
    style.backgroundPosition = 'center';
  } else {
    style.backgroundColor = el.fill || '#000000';
  }
  
  const clips = { triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)', star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
  
  if (el.shapeType === 'circle') return <div style={{ ...style, borderRadius: '50%' }} />;
  if (el.shapeType === 'ring') {
    if (hasGradient) {
      return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid transparent', background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${el.gradientStart}, ${el.gradientEnd}) border-box`, boxSizing: 'border-box' }} />;
    }
    return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${el.fill || '#000'}`, backgroundColor: 'transparent', backgroundImage: hasImage ? `url(${el.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', boxSizing: 'border-box' }} />;
  }
  if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;
  return <div style={style} />;
};

const EditableText = ({ el, zoom, pageWidth, pageMargins, isEditing, onStartEdit, onCommit }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const r = window.document.createRange(); const s = window.getSelection();
      r.selectNodeContents(ref.current); r.collapse(false); s.removeAllRanges(); s.addRange(r);
    }
  }, [isEditing]);
  
  // Redacted text - show as black bar
  if (el.isRedacted) {
    return (
      <div 
        data-testid={`text-element-${el.id}`}
        style={{
          width: (el.content?.length || 10) * (el.fontSize || 16) * 0.6 * zoom,
          height: (el.fontSize || 16) * 1.4 * zoom,
          background: '#000000',
          borderRadius: 2,
          cursor: 'pointer',
        }}
        title="Sansürlenmiş İçerik"
      />
    );
  }
  
  const ml = pageMargins?.left || 60;
  const mr = pageMargins?.right || 60;
  // Fixed width: entire text area between margins
  const fixedWidth = (pageWidth - ml - mr) * zoom;
  
  const gradientStyle = el.gradientStart && el.gradientEnd ? {
    background: `linear-gradient(90deg, ${el.gradientStart}, ${el.gradientEnd})`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } : {};
  return (
    <div ref={ref} data-testid={`text-element-${el.id}`} contentEditable={isEditing} suppressContentEditableWarning
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(el.id); }}
      onClick={(e) => { e.stopPropagation(); onStartEdit(el.id); }}
      onBlur={() => { if (ref.current) onCommit(el.id, ref.current.innerText); }}
      onKeyDown={isEditing ? (e) => { e.stopPropagation(); if (e.key === 'Escape') ref.current?.blur(); } : undefined}
      className={`outline-none ${isEditing ? 'min-h-[1em]' : ''}`}
      style={{
        fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial',
        color: (el.gradientStart && el.gradientEnd) ? undefined : (el.color || '#000'),
        fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal',
        textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
        textAlign: el.textAlign || 'left',
        width: fixedWidth,
        wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: el.lineHeight || 1.5,
        cursor: 'text', caretColor: 'var(--zet-primary)',
        padding: isEditing ? '2px 0' : 0,
        paddingLeft: (el.paddingLeft || 0) * zoom,
        paddingRight: (el.paddingRight || 0) * zoom,
        paddingTop: (el.paddingTop || 0) * zoom,
        paddingBottom: (el.paddingBottom || 0) * zoom,
        backgroundColor: el.highlightColor || undefined,
        ...gradientStyle,
      }}>
      {el.content || (isEditing ? '' : '\u00A0')}
    </div>
  );
};

const ElementMenu = ({ el, onDelete, onChangeImage, onAddImageToShape, onAddAiImage, onCopy, onMirror, onClose }) => (
  <div data-testid={`element-menu-${el.id}`} className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[140px] shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
    {/* Copy */}
    <button onClick={() => { if(onCopy) onCopy(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Copy className="h-3 w-3" /> Copy</button>
    {/* Mirror */}
    <button onClick={() => { if(onMirror) onMirror(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><FlipHorizontal2 className="h-3 w-3" /> Mirror</button>
    {el.type === 'image' && <button data-testid={`change-image-${el.id}`} onClick={() => { onChangeImage(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><RefreshCw className="h-3 w-3" /> Change Image</button>}
    {(el.type === 'shape' || el.type === 'vector') && (
      <>
        <button onClick={() => { onAddImageToShape(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Image className="h-3 w-3" /> Add Image</button>
        <button onClick={() => { onAddAiImage(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Wand2 className="h-3 w-3" /> AI Image</button>
      </>
    )}
    <button onClick={() => { onDelete(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-500/20 flex items-center gap-2" style={{ color: '#f87171' }}><Trash2 className="h-3 w-3" /> Delete</button>
  </div>
);

// Vector path menu component
const VectorMenu = ({ pathId, position, zoom, onDelete, onAddImage, onAddAiImage, onClose }) => (
  <div data-testid={`vector-menu-${pathId}`} className="absolute zet-card p-1 z-50 min-w-[140px] shadow-xl animate-fadeIn" 
    style={{ left: position.x * zoom + 20, top: position.y * zoom }} onClick={e => e.stopPropagation()}>
    <button onClick={() => { onAddImage(pathId); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Image className="h-3 w-3" /> Add Image</button>
    <button onClick={() => { onAddAiImage(pathId); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Wand2 className="h-3 w-3" /> AI Image</button>
    <button onClick={() => { onDelete(pathId); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-500/20 flex items-center gap-2" style={{ color: '#f87171' }}><Trash2 className="h-3 w-3" /> Delete</button>
  </div>
);

export const CanvasArea = ({
  document: doc, currentPage, changePage, canvasElements, setCanvasElements, drawPaths, setDrawPaths,
  pageSize, zoom, setZoom, activeTool, currentFontSize, currentFont, currentColor, currentLineHeight,
  currentTextAlign, drawSize, drawOpacity, eraserSize, markingColor, markingOpacity, markingSize,
  selectedElement, setSelectedElement, selectedElements, setSelectedElements,
  onSaveHistory, canvasContainerRef, onElementSelect, onDeleteElement, onChangeImage, onAddImageToShape,
  onAddAiImageToShape, isBold, isItalic, isUnderline, isStrikethrough, pageBackground, gradientStart, gradientEnd, useGradient,
  zoomLevel, zoomRadius, magnifierPos, setMagnifierPos, onAddPage, onCopyElement, onMirrorElement,
  rulerVisible, gridVisible, gridSize,
}) => {
  const canvasRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [penPoints, setPenPoints] = useState([]);
  const [cropTarget, setCropTarget] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [elementMenu, setElementMenu] = useState(null);
  const [eraserTrail, setEraserTrail] = useState([]);
  const [selectedVector, setSelectedVector] = useState(null);
  const [vectorMenu, setVectorMenu] = useState(null);
  const [draggingVector, setDraggingVector] = useState(null);
  const [vectorDragOffset, setVectorDragOffset] = useState({ x: 0, y: 0 });
  const [lassoPath, setLassoPath] = useState([]);
  const [selectedVectors, setSelectedVectors] = useState([]);
  const [magnifierActive, setMagnifierActive] = useState(false);
  const [magnifierPosition, setMagnifierPosition] = useState({ x: 0, y: 0 });
  const justSelectedRef = useRef(false);
  
  // Right-click rectangle selection state
  const [rectSelectStart, setRectSelectStart] = useState(null);
  const [rectSelectEnd, setRectSelectEnd] = useState(null);
  const [isRectSelecting, setIsRectSelecting] = useState(false);

  // Zoom tool - scroll towards cursor position
  useEffect(() => {
    const h = (e) => {
      if ((activeTool === 'hand' || activeTool === 'zoom') && canvasContainerRef.current?.contains(e.target)) {
        e.preventDefault();
        const container = canvasContainerRef.current;
        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const oldZoom = zoom;
        const newZoom = Math.max(0.25, Math.min(3, zoom + (e.deltaY > 0 ? -0.05 : 0.05)));
        
        // Calculate scroll to zoom towards cursor
        const scrollLeft = container.scrollLeft;
        const scrollTop = container.scrollTop;
        const dx = (mouseX + scrollLeft) * (newZoom / oldZoom) - mouseX;
        const dy = (mouseY + scrollTop) * (newZoom / oldZoom) - mouseY;
        
        setZoom(newZoom);
        container.scrollLeft = dx;
        container.scrollTop = dy;
      }
    };
    window.addEventListener('wheel', h, { passive: false });
    return () => window.removeEventListener('wheel', h);
  }, [activeTool, canvasContainerRef, setZoom, zoom]);

  useEffect(() => {
    if (activeTool === 'cut' && selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el?.type === 'image') { setCropTarget(el.id); setCropRect({ x: el.x + 10, y: el.y + 10, w: el.width - 20, h: el.height - 20 }); return; }
    }
    if (activeTool !== 'cut') { setCropTarget(null); setCropRect(null); }
    if (activeTool !== 'hand' && activeTool !== 'select') setEditingId(null);
    if (activeTool !== 'pen') setPenPoints([]);
    setElementMenu(null);
    setVectorMenu(null);
    if (activeTool !== 'hand') { setSelectedVector(null); }
    // Auto-activate magnifier when zoom tool is selected
    if (activeTool === 'zoom') { setMagnifierActive(true); }
    else { setMagnifierActive(false); }
  }, [activeTool, canvasElements, selectedElement]);

  const getCoords = useCallback((e, el) => { const r = el.getBoundingClientRect(); return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }; }, [zoom]);

  const handleTextCommit = useCallback((id, text) => {
    if (!text.trim()) { const f = canvasElements.filter(el => el.id !== id); setCanvasElements(f); onSaveHistory(f); }
    else { 
      const el = canvasElements.find(e => e.id === id);
      const u = canvasElements.map(el => el.id === id ? { ...el, content: text } : el); 
      setCanvasElements(u); 
      onSaveHistory(u);
      
      // Check if element exceeds page height - auto add new page
      if (el) {
        const lines = (text || '').split('\n').length;
        const textHeight = lines * (el.fontSize || 16) * (el.lineHeight || 1.5);
        const bottomY = el.y + textHeight;
        if (bottomY > pageSize.height - 20 && onAddPage) {
          onAddPage();
        }
      }
    }
    setEditingId(null);
  }, [canvasElements, setCanvasElements, onSaveHistory, pageSize.height, onAddPage]);

  const applyCrop = useCallback(() => {
    if (!cropTarget || !cropRect) return;
    const el = canvasElements.find(e => e.id === cropTarget);
    if (!el || el.type !== 'image') return;
    const c = window.document.createElement('canvas'); const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const sx = Math.max(0, (cropRect.x - el.x) * img.naturalWidth / el.width);
      const sy = Math.max(0, (cropRect.y - el.y) * img.naturalHeight / el.height);
      const sw = cropRect.w * img.naturalWidth / el.width; const sh = cropRect.h * img.naturalHeight / el.height;
      c.width = sw; c.height = sh; c.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const u = canvasElements.map(e => e.id === cropTarget ? { ...e, src: c.toDataURL('image/png'), x: cropRect.x, y: cropRect.y, width: cropRect.w, height: cropRect.h } : e);
      setCanvasElements(u); onSaveHistory(u); setCropTarget(null); setCropRect(null);
    };
    img.src = el.src;
  }, [canvasElements, cropRect, cropTarget, onSaveHistory, setCanvasElements]);

  const handleCanvasClick = useCallback((e, pageIdx) => {
    if (dragging || resizing || draggingVector) return;
    if (pageIdx !== currentPage) { changePage(pageIdx); return; }
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    const { x, y } = getCoords(e, e.currentTarget);
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    setElementMenu(null);
    setVectorMenu(null);

    if (activeTool === 'text') {
      const cl = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (cl) { setEditingId(cl.id); setSelectedElement(cl.id); return; }
      const ml = 60; // left margin
      const ne = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
        x: ml, y: Math.max(10, y), content: '', fontSize: currentFontSize,
        fontFamily: currentFont, color: currentColor, width: pageSize.width - 120,
        lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
        bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
        gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
      };
      const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
    } else if (['triangle', 'square', 'circle', 'star', 'ring'].includes(activeTool)) {
      const shapeEl = { id: `el_${Date.now()}`, type: 'shape', shapeType: activeTool, x: x - 40, y: y - 40, width: 80, height: 80, fill: currentColor, image: null };
      if (useGradient && gradientStart && gradientEnd) { shapeEl.gradientStart = gradientStart; shapeEl.gradientEnd = gradientEnd; }
      const u = [...canvasElements, shapeEl];
      setCanvasElements(u); onSaveHistory(u);
    } else if (activeTool === 'hand') {
      // First check if clicking on a vector path (pen drawings)
      const clickedVectorIdx = drawPaths.findIndex(path => path.isPen && isPointNearPath(x, y, path, 20));
      if (clickedVectorIdx !== -1) {
        setSelectedVector(clickedVectorIdx);
        setSelectedElement(null);
        const bounds = getPathBounds(drawPaths[clickedVectorIdx]);
        if (bounds) {
          setVectorMenu({ idx: clickedVectorIdx, position: { x: bounds.x + bounds.width, y: bounds.y } });
        }
        return;
      }
      // Then check canvas elements
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl) { setSelectedElement(cl.id); setSelectedVector(null); if (cl.type === 'text') setEditingId(cl.id); if (onElementSelect) onElementSelect(cl); }
      else {
        // Empty area clicked - create new text at cursor Y, margin-aligned X (Word-like)
        setSelectedElement(null); setSelectedElements([]); setEditingId(null); setSelectedVector(null);
        const ml = 60;
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: ml, y: Math.max(40, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: pageSize.width - 120,
          lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
          bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
          gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
        };
        const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
      }
    } else if (activeTool === 'cut') {
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl?.type === 'image' && !cropTarget) { setCropTarget(cl.id); setSelectedElement(cl.id); setCropRect({ x: cl.x + 10, y: cl.y + 10, w: cl.width - 20, h: cl.height - 20 }); }
      else if (!cropTarget || (cl && cl.id !== cropTarget)) { if (cl) { const u = canvasElements.filter(el => el.id !== cl.id); setCanvasElements(u); onSaveHistory(u); setSelectedElement(null); } setCropTarget(null); setCropRect(null); }
    } else if (activeTool === 'pen') {
      // Auto-close: if near first point, close the path
      if (penPoints.length > 2 && dist({ x, y }, penPoints[0]) < 15) {
        const newPath = { id: `vec_${Date.now()}`, points: [...penPoints, penPoints[0]], size: 2, opacity: 100, color: currentColor, isPen: true, image: null };
        setDrawPaths(prev => [...prev, newPath]);
        setPenPoints([]);
      } else { setPenPoints(prev => [...prev, { x, y }]); }
    } else if (activeTool === 'translate') {
      const cl = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (cl) { setSelectedElement(cl.id); if (onElementSelect) onElementSelect(cl); }
    } else if (activeTool === 'select') {
      // Single click to select or create text
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      const vIdx = drawPaths.findIndex(path => path.isPen && isPointNearPath(x, y, path, 20));
      if (cl) { setSelectedElement(cl.id); setSelectedElements([cl.id]); if (cl.type === 'text') setEditingId(cl.id); }
      else if (vIdx !== -1) { setSelectedVector(vIdx); setSelectedVectors([vIdx]); }
      else {
        setSelectedElement(null); setSelectedElements([]); setSelectedVector(null); setSelectedVectors([]);
        // Empty area: create new text element at cursor Y, margin-aligned (Word-like)
        const ml = 60;
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: ml, y: Math.max(40, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: pageSize.width - 120,
          lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
          bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
          gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
        };
        const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
      }
    } else if (activeTool === 'zoom') {
      // Zoom tool - just set active, mouse move handles position
      setMagnifierActive(true);
    }
  }, [activeTool, canvasElements, changePage, cropTarget, currentColor, currentFont, currentFontSize, currentLineHeight, currentPage, currentTextAlign, dragging, draggingVector, drawPaths, getCoords, gradientEnd, gradientStart, isBold, isItalic, isStrikethrough, isUnderline, onElementSelect, onSaveHistory, pageSize, penPoints, resizing, setCanvasElements, setDrawPaths, setSelectedElement, setSelectedElements, useGradient]);

  const handleCanvasDoubleClick = useCallback((e, pageIdx) => {
    if (activeTool === 'pen' && penPoints.length > 1 && pageIdx === currentPage) {
      const newPath = { id: `vec_${Date.now()}`, points: penPoints, size: 2, opacity: 100, color: currentColor, isPen: true, image: null };
      setDrawPaths(prev => [...prev, newPath]);
      setPenPoints([]);
    }
  }, [activeTool, currentColor, currentPage, penPoints, setDrawPaths]);

  const handleMouseDown = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    
    // Right-click rectangle selection (button === 2 is right click)
    if (e.button === 2) {
      // Check if right-clicking on a text element - allow native text selection
      const clickedText = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (clickedText) {
        // Allow native context menu on text elements for copy/paste
        setSelectedElement(clickedText.id);
        setEditingId(clickedText.id);
        return; // Don't prevent default - allow native text selection
      }
      e.preventDefault();
      setIsRectSelecting(true);
      setRectSelectStart({ x, y });
      setRectSelectEnd({ x, y });
      return;
    }
    
    if (activeTool === 'draw' || activeTool === 'marking') { setIsDrawing(true); setCurrentPath([{ x, y }]); return; }
    if (activeTool === 'eraser') { setIsDrawing(true); setEraserTrail([{ x, y }]); return; }
    if (activeTool === 'select') { 
      // Lasso selection - start drawing lasso path
      setIsDrawing(true);
      setLassoPath([{ x, y }]);
      return; 
    }
    if (activeTool === 'zoom') {
      // Zoom tool is automatic on hover, no click needed
      return;
    }
    if (activeTool === 'cut' && cropTarget && cropRect) { setCropDragging(true); setCropStart({ x, y, rect: { ...cropRect } }); return; }
    
    // Hand tool: check for vector dragging first
    if (activeTool === 'hand') {
      // Check if clicking on a selected vector to drag
      if (selectedVector !== null) {
        const path = drawPaths[selectedVector];
        if (path && isPointNearPath(x, y, path, 20)) {
          const bounds = getPathBounds(path);
          if (bounds) {
            setDraggingVector(selectedVector);
            setVectorDragOffset({ x: x - bounds.x, y: y - bounds.y });
            setVectorMenu(null);
            return;
          }
        }
      }
      // Check for clicking on any vector
      const clickedVectorIdx = drawPaths.findIndex(path => path.isPen && isPointNearPath(x, y, path, 20));
      if (clickedVectorIdx !== -1) {
        const path = drawPaths[clickedVectorIdx];
        const bounds = getPathBounds(path);
        if (bounds) {
          setSelectedVector(clickedVectorIdx);
          setDraggingVector(clickedVectorIdx);
          setVectorDragOffset({ x: x - bounds.x, y: y - bounds.y });
          setVectorMenu(null);
          return;
        }
      }
    }
    
    if (selectedElement && (activeTool === 'hand' || activeTool === 'text')) {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el) && editingId !== el.id) { setDragging(el.id); setDragOffset({ x: x - el.x, y: y - el.y }); }
    }
  }, [activeTool, canvasElements, cropRect, cropTarget, currentPage, drawPaths, editingId, getCoords, selectedElement, selectedVector]);

  const handleMouseMove = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    
    // Right-click rectangle selection
    if (isRectSelecting && rectSelectStart) {
      setRectSelectEnd({ x, y });
      return;
    }
    
    if ((activeTool === 'draw' || activeTool === 'marking') && isDrawing) { setCurrentPath(p => [...p, { x, y }]); return; }
    if (activeTool === 'eraser' && isDrawing) { setEraserTrail(p => [...p, { x, y }]); return; }
    if (activeTool === 'select' && isDrawing) { 
      // Lasso selection - continue drawing
      setLassoPath(p => [...p, { x, y }]); 
      return; 
    }
    if (activeTool === 'zoom') {
      // Zoom tool follows mouse automatically
      setMagnifierActive(true);
      setMagnifierPosition({ x, y });
      return;
    }
    if (cropDragging && cropStart) { setCropRect({ x: cropStart.rect.x + x - cropStart.x, y: cropStart.rect.y + y - cropStart.y, w: cropStart.rect.w, h: cropStart.rect.h }); return; }
    
    // Vector dragging
    if (draggingVector !== null && activeTool === 'hand') {
      const path = drawPaths[draggingVector];
      if (path) {
        const bounds = getPathBounds(path);
        if (bounds) {
          const dx = x - vectorDragOffset.x - bounds.x;
          const dy = y - vectorDragOffset.y - bounds.y;
          setDrawPaths(prev => prev.map((p, i) => i === draggingVector ? {
            ...p,
            points: p.points.map(pt => ({ x: pt.x + dx, y: pt.y + dy }))
          } : p));
        }
      }
      return;
    }
    
    if (dragging) { const el = canvasElements.find(el => el.id === dragging); if (el) setCanvasElements(p => p.map(i => i.id === dragging ? { ...i, x: Math.max(0, x - dragOffset.x), y: Math.max(0, y - dragOffset.y) } : i)); }
    if (resizing) setCanvasElements(p => p.map(el => el.id === resizing.id ? { ...el, width: Math.max(30, x - resizing.startX), height: Math.max(30, y - resizing.startY) } : el));
  }, [activeTool, canvasElements, cropDragging, cropStart, currentPage, dragging, draggingVector, dragOffset, drawPaths, getCoords, isDrawing, isRectSelecting, rectSelectStart, resizing, selectionStart, setCanvasElements, setDrawPaths, vectorDragOffset]);

  const handleMouseUp = useCallback(() => {
    // Right-click rectangle selection - find elements inside rectangle
    if (isRectSelecting && rectSelectStart && rectSelectEnd) {
      const minX = Math.min(rectSelectStart.x, rectSelectEnd.x);
      const maxX = Math.max(rectSelectStart.x, rectSelectEnd.x);
      const minY = Math.min(rectSelectStart.y, rectSelectEnd.y);
      const maxY = Math.max(rectSelectStart.y, rectSelectEnd.y);
      
      // Find elements in rectangle
      const selectedIds = canvasElements.filter(el => {
        if (el.hidden || el.locked) return false;
        const elX = el.x;
        const elY = el.y;
        const elW = el.width || 50;
        const elH = el.type === 'text' ? (el.fontSize || 16) : (el.height || 50);
        // Check if element intersects with selection rectangle
        return elX < maxX && elX + elW > minX && elY < maxY && elY + elH > minY;
      }).map(el => el.id);
      
      // Find vectors in rectangle
      const selectedVecIdxs = drawPaths.map((p, i) => ({ p, i })).filter(({ p }) => {
        if (p.isHighlight || !p.points || p.points.length === 0) return false;
        return p.points.some(pt => pt.x >= minX && pt.x <= maxX && pt.y >= minY && pt.y <= maxY);
      }).map(({ i }) => i);
      
      if (selectedIds.length > 0) { setSelectedElements(selectedIds); justSelectedRef.current = true; }
      if (selectedVecIdxs.length > 0) { setSelectedVectors(selectedVecIdxs); justSelectedRef.current = true; }
      
      setIsRectSelecting(false);
      setRectSelectStart(null);
      setRectSelectEnd(null);
      return;
    }
    
    if (isDrawing && activeTool === 'draw' && currentPath.length > 1) setDrawPaths(p => [...p, { points: currentPath, size: drawSize, opacity: drawOpacity, color: currentColor }]);
    if (isDrawing && activeTool === 'marking' && currentPath.length > 1) setDrawPaths(p => [...p, { points: currentPath, size: markingSize || 20, opacity: markingOpacity || 40, color: markingColor || '#FFFF00', isHighlight: true }]);
    // Eraser: remove paths and elements that intersect with eraser trail
    if (isDrawing && activeTool === 'eraser' && eraserTrail.length > 0) {
      const r = eraserSize || 15;
      // Remove draw paths
      setDrawPaths(prev => prev.filter(path => !path.points.some(pp => eraserTrail.some(ep => dist(pp, ep) < r))));
      // Remove canvas elements that intersect with eraser trail
      const elementsToRemove = canvasElements.filter(el => {
        if (el.locked || el.hidden) return false;
        const elCenterX = el.x + (el.width || 50) / 2;
        const elCenterY = el.y + (el.type === 'text' ? (el.fontSize || 16) / 2 : (el.height || 50) / 2);
        return eraserTrail.some(ep => dist({ x: elCenterX, y: elCenterY }, ep) < r + Math.max(el.width || 50, el.height || 50) / 2);
      });
      if (elementsToRemove.length > 0) {
        const updatedElements = canvasElements.filter(el => !elementsToRemove.includes(el));
        setCanvasElements(updatedElements);
        onSaveHistory(updatedElements);
      }
    }
    // Lasso selection - find elements inside the lasso path
    if (activeTool === 'select' && isDrawing && lassoPath.length > 5) {
      const selectedIds = canvasElements.filter(el => !el.hidden && !el.locked && isElementInLasso(el, lassoPath)).map(el => el.id);
      // Select all vector paths (both pen vectors and regular draw paths)
      const selectedVecIdxs = drawPaths.map((p, i) => ({ p, i })).filter(({ p }) => {
        // Include both pen vectors and regular drawings
        return !p.isHighlight && isVectorInLasso(p, lassoPath);
      }).map(({ i }) => i);
      if (selectedIds.length > 0) { setSelectedElements(selectedIds); justSelectedRef.current = true; }
      if (selectedVecIdxs.length > 0) { setSelectedVectors(selectedVecIdxs); justSelectedRef.current = true; }
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    if (draggingVector !== null) setDraggingVector(null);
    // Keep magnifier active while zoom tool is selected
    if (activeTool !== 'zoom') setMagnifierActive(false);
    setIsDrawing(false); setCurrentPath([]); setEraserTrail([]); setLassoPath([]);
    setSelectionRect(null); setSelectionStart(null);
    setCropDragging(false); setCropStart(null); setDragging(null); setResizing(null);
  }, [activeTool, canvasElements, currentColor, currentPath, draggingVector, drawOpacity, drawPaths, drawSize, dragging, eraserSize, eraserTrail, isDrawing, isRectSelecting, lassoPath, markingColor, markingOpacity, markingSize, onSaveHistory, rectSelectEnd, rectSelectStart, resizing, setDrawPaths, setSelectedElements]);

  // Delete vector path
  const handleDeleteVector = useCallback((idx) => {
    setDrawPaths(prev => prev.filter((_, i) => i !== idx));
    setSelectedVector(null);
    setVectorMenu(null);
  }, [setDrawPaths]);

  // Add image to vector path
  const handleAddImageToVector = useCallback((idx) => {
    if (onAddImageToShape) onAddImageToShape(`vector_${idx}`);
    setVectorMenu(null);
  }, [onAddImageToShape]);

  // Add AI image to vector path
  const handleAddAiImageToVector = useCallback((idx) => {
    if (onAddAiImageToShape) onAddAiImageToShape(`vector_${idx}`);
    setVectorMenu(null);
  }, [onAddAiImageToShape]);

  const getCursor = () => ({ text: 'text', hand: draggingVector !== null ? 'grabbing' : 'grab', draw: 'crosshair', pen: 'crosshair', eraser: 'cell', cut: 'crosshair', select: 'crosshair', marking: 'crosshair', translate: 'help' }[activeTool] || 'crosshair');

  const pageBg = pageBackground || '#ffffff';

  // Render vector paths with images and selection
  const renderVectorPaths = (paths, pageIdx) => {
    return paths.filter(p => !p.isHighlight).map((path, i) => {
      const isSelected = idx === currentPage && selectedVector === i && path.isPen;
      const bounds = path.isPen ? getPathBounds(path) : null;
      const pathD = path.isPen ? `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z` : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`;
      
      return (
        <g key={`d${i}`}>
          {/* Clip path for image fill */}
          {path.isPen && path.image && (
            <defs>
              <clipPath id={`clip-vector-${pageIdx}-${i}`}>
                <path d={pathD} />
              </clipPath>
            </defs>
          )}
          {/* Image inside vector */}
          {path.isPen && path.image && bounds && (
            <image
              href={path.image}
              x={bounds.x * zoom}
              y={bounds.y * zoom}
              width={bounds.width * zoom}
              height={bounds.height * zoom}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-vector-${pageIdx}-${i})`}
            />
          )}
          {/* Path stroke */}
          <path
            d={pathD}
            stroke={isSelected ? '#4ca8ad' : path.color}
            strokeWidth={(isSelected ? path.size + 2 : path.size) * zoom}
            strokeOpacity={path.opacity / 100}
            fill={path.isPen && !path.image ? `${path.color}20` : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    });
  };

  return (
    <div ref={canvasContainerRef} data-testid="canvas-container" className="flex-1 overflow-auto p-6" style={{ background: 'var(--zet-bg-light)', touchAction: activeTool === 'hand' ? 'pan-x pan-y' : 'none', WebkitOverflowScrolling: 'touch' }}>
      <div className="flex flex-col items-center gap-6">
        {doc.pages?.map((page, idx) => (
          <div key={page.page_id} data-testid={`canvas-page-${idx}`} ref={idx === currentPage ? canvasRef : null}
            className={`shadow-xl relative select-none ${idx === currentPage ? 'ring-2' : 'opacity-80'}`}
            style={{ width: (page.pageSize?.width || pageSize.width) * zoom, height: (page.pageSize?.height || pageSize.height) * zoom, ringColor: 'var(--zet-primary-light)', cursor: getCursor(), background: pageBg, touchAction: activeTool === 'hand' ? 'manipulation' : 'none' }}
            onClick={(e) => handleCanvasClick(e, idx)} onDoubleClick={(e) => handleCanvasDoubleClick(e, idx)}
            onMouseDown={(e) => handleMouseDown(e, idx)} onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
            onContextMenu={(e) => {
              // Allow context menu on text elements for copy/paste
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = (e.clientX - rect.left) / zoom;
              const cy = (e.clientY - rect.top) / zoom;
              const isOnText = canvasElements.some(el => el.type === 'text' && isPointInElement(cx, cy, el));
              if (!isOnText) e.preventDefault();
            }}
            onTouchStart={(e) => { if (activeTool !== 'hand') { e.stopPropagation(); handleMouseDown(e, idx); } }}
            onTouchMove={(e) => { if (activeTool !== 'hand') { e.stopPropagation(); handleMouseMove(e, idx); } }}
            onTouchEnd={(e) => { if (activeTool !== 'hand') { handleMouseUp(e); } }}>
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>
            
            {/* Ruler - Horizontal */}
            {rulerVisible && idx === currentPage && (
              <>
                <div className="absolute -top-6 left-0 h-5 flex items-end overflow-hidden" style={{ width: (page.pageSize?.width || pageSize.width) * zoom }}>
                  {Array.from({ length: Math.ceil((page.pageSize?.width || pageSize.width) / 50) + 1 }).map((_, i) => (
                    <div key={`rh${i}`} className="flex-shrink-0" style={{ width: 50 * zoom }}>
                      <div className="h-3 border-l" style={{ borderColor: 'var(--zet-text-muted)' }} />
                      <span className="text-[9px] ml-0.5" style={{ color: 'var(--zet-text-muted)' }}>{i * 50}</span>
                    </div>
                  ))}
                </div>
                {/* Ruler - Vertical */}
                <div className="absolute -left-6 top-0 w-5 flex flex-col items-end overflow-hidden" style={{ height: (page.pageSize?.height || pageSize.height) * zoom }}>
                  {Array.from({ length: Math.ceil((page.pageSize?.height || pageSize.height) / 50) + 1 }).map((_, i) => (
                    <div key={`rv${i}`} className="flex-shrink-0 flex items-start" style={{ height: 50 * zoom }}>
                      <span className="text-[9px] mr-0.5" style={{ color: 'var(--zet-text-muted)', writingMode: 'vertical-lr', transform: 'rotate(180deg)' }}>{i * 50}</span>
                      <div className="w-3 border-t" style={{ borderColor: 'var(--zet-text-muted)' }} />
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {/* Grid */}
            {gridVisible && idx === currentPage && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                <defs>
                  <pattern id="grid" width={gridSize * zoom} height={gridSize * zoom} patternUnits="userSpaceOnUse">
                    <path d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {/* Highlight paths */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => p.isHighlight).map((path, i) => (
                <path key={`h${i}`} d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100} fill="none" strokeLinecap="butt" />
              ))}
              {/* Vector and draw paths */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => !p.isHighlight).map((path, i) => {
                const isSelected = idx === currentPage && selectedVector === i && path.isPen;
                const bounds = path.isPen ? getPathBounds(path) : null;
                const pathD = path.isPen ? `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z` : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`;
                
                return (
                  <g key={`d${i}`}>
                    {path.isPen && path.image && bounds && (
                      <defs>
                        <clipPath id={`clip-vector-${idx}-${i}`}>
                          <path d={pathD} />
                        </clipPath>
                      </defs>
                    )}
                    {path.isPen && path.image && bounds && (
                      <image
                        href={path.image}
                        x={bounds.x * zoom}
                        y={bounds.y * zoom}
                        width={bounds.width * zoom}
                        height={bounds.height * zoom}
                        preserveAspectRatio="xMidYMid slice"
                        clipPath={`url(#clip-vector-${idx}-${i})`}
                      />
                    )}
                    <path
                      d={pathD}
                      stroke={isSelected ? '#4ca8ad' : path.color}
                      strokeWidth={(isSelected ? path.size + 2 : path.size) * zoom}
                      strokeOpacity={path.opacity / 100}
                      fill={path.isPen && !path.image ? `${path.color}20` : 'none'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
              {/* Active drawing */}
              {isDrawing && (activeTool === 'draw' || activeTool === 'marking') && currentPath.length > 1 && <path d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={activeTool === 'marking' ? (markingColor || '#FFFF00') : currentColor} strokeWidth={(activeTool === 'marking' ? (markingSize || 20) : drawSize) * zoom} strokeOpacity={activeTool === 'marking' ? (markingOpacity || 40) / 100 : drawOpacity / 100} fill="none" strokeLinecap={activeTool === 'marking' ? 'butt' : 'round'} />}
              {/* Pen tool preview */}
              {penPoints.length > 0 && (<><path d={`M ${penPoints.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={currentColor} strokeWidth={2 * zoom} fill="none" strokeDasharray="4,4" />{penPoints.map((p, i) => <circle key={i} cx={p.x * zoom} cy={p.y * zoom} r={4} fill={i === 0 ? '#4ca8ad' : currentColor} stroke="#fff" strokeWidth={1} />)}</>)}
              {/* Lasso selection path */}
              {isDrawing && activeTool === 'select' && lassoPath.length > 1 && (
                <path d={`M ${lassoPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z`} stroke="#4ca8ad" strokeWidth={2} strokeDasharray="4,4" fill="rgba(76,168,173,0.15)" />
              )}
              {/* Right-click rectangle selection */}
              {isRectSelecting && rectSelectStart && rectSelectEnd && idx === currentPage && (
                <rect 
                  x={Math.min(rectSelectStart.x, rectSelectEnd.x) * zoom}
                  y={Math.min(rectSelectStart.y, rectSelectEnd.y) * zoom}
                  width={Math.abs(rectSelectEnd.x - rectSelectStart.x) * zoom}
                  height={Math.abs(rectSelectEnd.y - rectSelectStart.y) * zoom}
                  stroke="#3b82f6" 
                  strokeWidth={2} 
                  strokeDasharray="5,5" 
                  fill="rgba(59, 130, 246, 0.15)"
                />
              )}
              {/* Eraser trail visualization */}
              {isDrawing && activeTool === 'eraser' && eraserTrail.length > 0 && (
                <>
                  {eraserTrail.map((pt, i) => (
                    <circle key={i} cx={pt.x * zoom} cy={pt.y * zoom} r={(eraserSize || 15) * zoom * 0.5} fill="rgba(255,100,100,0.3)" stroke="#ff6464" strokeWidth={1} strokeDasharray="3,3" />
                  ))}
                </>
              )}
              {/* Crop overlay */}
              {cropTarget && cropRect && idx === currentPage && (<><rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.3)" /><rect x={cropRect.x * zoom} y={cropRect.y * zoom} width={cropRect.w * zoom} height={cropRect.h * zoom} stroke="#4ca8ad" strokeWidth={2} fill="rgba(0,0,0,0)" strokeDasharray="6,3" /></>)}
            </svg>
            
            {/* Magnifier effect - real zoom */}
            {activeTool === 'zoom' && magnifierActive && idx === currentPage && (
              <div 
                className="absolute pointer-events-none rounded-full border-4 border-blue-400 shadow-2xl z-50 overflow-hidden"
                style={{
                  left: magnifierPosition.x * zoom - (zoomRadius || 50),
                  top: magnifierPosition.y * zoom - (zoomRadius || 50),
                  width: (zoomRadius || 50) * 2,
                  height: (zoomRadius || 50) * 2,
                  background: pageBg,
                }}
              >
                <div 
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: '100%',
                    height: '100%',
                    transform: `translate(-50%, -50%) scale(${zoomLevel || 2})`,
                    transformOrigin: 'center center',
                    backgroundImage: `url(${canvasContainerRef?.current?.querySelector('svg')?.outerHTML ? `data:image/svg+xml,${encodeURIComponent(canvasContainerRef?.current?.querySelector('svg')?.outerHTML || '')}` : 'none'})`,
                    backgroundPosition: `${50 - (magnifierPosition.x / (page.pageSize?.width || pageSize.width)) * 100}% ${50 - (magnifierPosition.y / (page.pageSize?.height || pageSize.height)) * 100}%`,
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-blue-400 text-xs font-bold bg-black/50 px-1 rounded">{Math.round((zoomLevel || 2) * 100)}%</span>
                </div>
              </div>
            )}
            
            {/* Vector menu */}
            {vectorMenu && idx === currentPage && (
              <VectorMenu
                pathId={vectorMenu.idx}
                position={vectorMenu.position}
                zoom={zoom}
                onDelete={handleDeleteVector}
                onAddImage={handleAddImageToVector}
                onAddAiImage={handleAddAiImageToVector}
                onClose={() => setVectorMenu(null)}
              />
            )}
            
            {cropTarget && cropRect && idx === currentPage && <button data-testid="crop-apply-btn" onClick={(e) => { e.stopPropagation(); applyCrop(); }} className="absolute z-20 zet-btn text-xs px-3 py-1" style={{ left: (cropRect.x + cropRect.w) * zoom + 8, top: cropRect.y * zoom }}>Apply Crop</button>}
            {(idx === currentPage ? canvasElements : page.elements || []).filter(el => !el.hidden).map(el => {
              const isSel = selectedElement === el.id || selectedElements.includes(el.id);
              const isLocked = el.locked;
              // Mirror transform
              const scaleX = el.scaleX || 1;
              const scaleY = el.scaleY || 1;
              const rotation = el.rotation || 0;
              const transformStyle = `scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`;
              return (
                <div key={el.id} data-testid={`canvas-element-${el.id}`} className={`absolute ${isSel ? 'ring-2 ring-blue-500' : ''} ${isLocked ? 'pointer-events-none' : ''}`}
                  style={{ 
                    left: el.x * zoom, 
                    top: el.y * zoom, 
                    width: el.type !== 'text' ? (el.width || 80) * zoom : 'auto', 
                    height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto', 
                    cursor: activeTool === 'hand' && !isLocked ? 'move' : undefined,
                    transform: transformStyle,
                    transformOrigin: 'center center'
                  }}
                  onClick={(e) => { if (isLocked) return; e.stopPropagation(); setSelectedElement(el.id); changePage(idx); if (onElementSelect) onElementSelect(el); }}>
                  {el.type === 'text' && <EditableText el={el} zoom={zoom} pageWidth={page.pageSize?.width || pageSize.width} pageMargins={{ left: 60, right: 60 }} isEditing={editingId === el.id && idx === currentPage} onStartEdit={id => setEditingId(id)} onCommit={handleTextCommit} />}
                  {(el.type === 'image' || el.type === 'chart' || el.type === 'table') && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="relative w-full h-full group"><ShapeRenderer el={el} />
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={onAddImageToShape} onAddAiImage={onAddAiImageToShape} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Watermark overlay */}
            {doc.watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ opacity: (doc.watermark.opacity || 20) / 100 }}>
                <span className="text-6xl font-bold rotate-[-30deg] whitespace-nowrap" style={{ color: 'var(--zet-text-muted)' }}>{doc.watermark.text}</span>
              </div>
            )}
            
            {/* Header */}
            {doc.header && (
              <div className="absolute top-2 left-0 right-0 text-center text-sm pointer-events-none" style={{ color: 'var(--zet-text-muted)' }}>{doc.header}</div>
            )}
            
            {/* Footer */}
            {doc.footer && (
              <div className="absolute bottom-2 left-0 right-0 text-center text-sm pointer-events-none" style={{ color: 'var(--zet-text-muted)' }}>{doc.footer}</div>
            )}
            
            {/* Page Numbers */}
            {doc.pageNumbers?.enabled && (
              <div className={`absolute ${doc.pageNumbers.position?.includes('top') ? 'top-2' : 'bottom-2'} ${doc.pageNumbers.position?.includes('left') ? 'left-4' : doc.pageNumbers.position?.includes('right') ? 'right-4' : 'left-0 right-0 text-center'} text-sm pointer-events-none`} style={{ color: 'var(--zet-text-muted)' }}>
                {idx + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
