import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MoreVertical, Trash2, Image, RefreshCw } from 'lucide-react';

const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const lines = Math.max(1, (el.content || '').split('\n').length);
    const h = (el.fontSize || 16) * lines * (el.lineHeight || 1.5);
    return x >= el.x && x <= el.x + (el.width || 400) && y >= el.y && y <= el.y + h;
  }
  if (el.type === 'image' || el.type === 'shape') {
    return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
  }
  return false;
};

const ShapeRenderer = ({ el }) => {
  const style = {
    width: '100%', height: '100%',
    backgroundColor: el.image ? 'transparent' : el.fill,
    backgroundImage: el.image ? `url(${el.image})` : 'none',
    backgroundSize: 'cover', backgroundPosition: 'center'
  };
  const clips = {
    triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
  };
  if (el.shapeType === 'circle') return <div style={{ ...style, borderRadius: '50%' }} />;
  if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;
  return <div style={style} />;
};

const EditableText = ({ el, zoom, pageWidth, isEditing, onStartEdit, onCommit }) => {
  const ref = useRef(null);
  const maxWidth = (pageWidth - el.x - 20);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const range = window.document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  return (
    <div
      ref={ref}
      data-testid={`text-element-${el.id}`}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(el.id); }}
      onBlur={() => { if (ref.current) onCommit(el.id, ref.current.innerText); }}
      onKeyDown={isEditing ? (e) => { e.stopPropagation(); if (e.key === 'Escape') ref.current?.blur(); } : undefined}
      className={`outline-none ${isEditing ? 'ring-1 ring-blue-400/50 rounded-sm min-h-[1em]' : ''}`}
      style={{
        fontSize: (el.fontSize || 16) * zoom,
        fontFamily: el.fontFamily || 'Arial',
        color: el.color || '#000',
        fontWeight: el.bold ? 'bold' : 'normal',
        fontStyle: el.italic ? 'italic' : 'normal',
        textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
        maxWidth: maxWidth * zoom,
        minWidth: isEditing ? 60 * zoom : undefined,
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        lineHeight: el.lineHeight || 1.5,
        cursor: isEditing ? 'text' : 'default',
        caretColor: 'var(--zet-primary)',
        padding: isEditing ? '2px 4px' : 0,
      }}
    >
      {el.content || (isEditing ? '' : '\u00A0')}
    </div>
  );
};

// Context menu for images/shapes
const ElementMenu = ({ el, onDelete, onChangeImage, onAddImageToShape, onClose }) => (
  <div data-testid={`element-menu-${el.id}`} className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[120px] shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
    {el.type === 'image' && (
      <button data-testid={`change-image-${el.id}`} onClick={() => { onChangeImage(el.id); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
        <RefreshCw className="h-3 w-3" /> Change Image
      </button>
    )}
    {el.type === 'shape' && (
      <button data-testid={`shape-add-image-${el.id}`} onClick={() => { onAddImageToShape(el.id); onClose(); }}
        className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}>
        <Image className="h-3 w-3" /> Add Image
      </button>
    )}
    <button data-testid={`delete-element-${el.id}`} onClick={() => { onDelete(el.id); onClose(); }}
      className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-500/20 flex items-center gap-2" style={{ color: '#f87171' }}>
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  </div>
);

export const CanvasArea = ({
  document: doc, currentPage, changePage,
  canvasElements, setCanvasElements, drawPaths, setDrawPaths,
  pageSize, zoom, setZoom, activeTool,
  currentFontSize, currentFont, currentColor, currentLineHeight,
  drawSize, drawOpacity, eraserSize,
  markingColor, markingOpacity, markingSize,
  selectedElement, setSelectedElement,
  selectedElements, setSelectedElements,
  onSaveHistory, canvasContainerRef,
  onElementSelect, onDeleteElement, onChangeImage, onAddImageToShape,
  isBold, isItalic, isUnderline, isStrikethrough,
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
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const handleWheel = (e) => {
      if (activeTool === 'hand' && canvasContainerRef.current?.contains(e.target)) {
        e.preventDefault();
        setZoom(prev => Math.max(0.25, Math.min(3, prev + (e.deltaY > 0 ? -0.05 : 0.05))));
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [activeTool, canvasContainerRef, setZoom]);

  // Auto-enter crop mode when cut tool selected with image already selected
  useEffect(() => {
    if (activeTool === 'cut' && selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el?.type === 'image') {
        setCropTarget(el.id);
        setCropRect({ x: el.x + 10, y: el.y + 10, w: el.width - 20, h: el.height - 20 });
        return;
      }
    }
    if (activeTool !== 'cut') { setCropTarget(null); setCropRect(null); }
    if (activeTool !== 'text' && activeTool !== 'hand') setEditingId(null);
    if (activeTool !== 'pen') setPenPoints([]);
    setElementMenu(null);
  }, [activeTool, canvasElements, selectedElement]);

  const getCoords = useCallback((e, el) => {
    const rect = el.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  }, [zoom]);

  const handleTextCommit = useCallback((id, text) => {
    if (!text.trim()) {
      const filtered = canvasElements.filter(el => el.id !== id);
      setCanvasElements(filtered); onSaveHistory(filtered);
    } else {
      const updated = canvasElements.map(el => el.id === id ? { ...el, content: text } : el);
      setCanvasElements(updated); onSaveHistory(updated);
    }
    setEditingId(null);
  }, [canvasElements, setCanvasElements, onSaveHistory]);

  const applyCrop = useCallback(() => {
    if (!cropTarget || !cropRect) return;
    const el = canvasElements.find(e => e.id === cropTarget);
    if (!el || el.type !== 'image') return;
    const canvas = window.document.createElement('canvas');
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scaleX = img.naturalWidth / el.width;
      const scaleY = img.naturalHeight / el.height;
      const sx = Math.max(0, (cropRect.x - el.x) * scaleX);
      const sy = Math.max(0, (cropRect.y - el.y) * scaleY);
      const sw = cropRect.w * scaleX;
      const sh = cropRect.h * scaleY;
      canvas.width = sw; canvas.height = sh;
      canvas.getContext('2d').drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const updated = canvasElements.map(e =>
        e.id === cropTarget ? { ...e, src: canvas.toDataURL('image/png'), x: cropRect.x, y: cropRect.y, width: cropRect.w, height: cropRect.h } : e
      );
      setCanvasElements(updated); onSaveHistory(updated);
      setCropTarget(null); setCropRect(null);
    };
    img.src = el.src;
  }, [canvasElements, cropRect, cropTarget, onSaveHistory, setCanvasElements]);

  const handleCanvasClick = useCallback((e, pageIdx) => {
    if (dragging || resizing) return;
    if (pageIdx !== currentPage) { changePage(pageIdx); return; }
    // Skip if we just finished a rectangle selection
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }

    const { x, y } = getCoords(e, e.currentTarget);
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    setElementMenu(null);

    if (activeTool === 'text') {
      const clicked = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (clicked) { setEditingId(clicked.id); setSelectedElement(clicked.id); return; }
      const newEl = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'text', x: Math.max(10, x), y: Math.max(10, y),
        content: '', fontSize: currentFontSize, fontFamily: currentFont,
        color: currentColor, width: pageSize.width - x - 20,
        lineHeight: currentLineHeight, bold: isBold, italic: isItalic,
        underline: isUnderline, strikethrough: isStrikethrough,
      };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated); setEditingId(newEl.id); setSelectedElement(newEl.id);
    } else if (activeTool === 'image') {
      // handled by Editor.js
    } else if (['triangle', 'square', 'circle', 'star'].includes(activeTool)) {
      const el = { id: `el_${Date.now()}`, type: 'shape', shapeType: activeTool, x: x - 40, y: y - 40, width: 80, height: 80, fill: currentColor, image: null };
      const updated = [...canvasElements, el];
      setCanvasElements(updated); onSaveHistory(updated);
    } else if (activeTool === 'hand') {
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (clicked) {
        setSelectedElement(clicked.id);
        if (clicked.type === 'text') setEditingId(clicked.id);
        if (onElementSelect) onElementSelect(clicked);
      } else { setSelectedElement(null); setSelectedElements([]); setEditingId(null); }
    } else if (activeTool === 'cut') {
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (clicked?.type === 'image' && !cropTarget) {
        setCropTarget(clicked.id); setSelectedElement(clicked.id);
        setCropRect({ x: clicked.x + 10, y: clicked.y + 10, w: clicked.width - 20, h: clicked.height - 20 });
      } else if (!cropTarget || (clicked && clicked.id !== cropTarget)) {
        if (clicked) {
          const updated = canvasElements.filter(el => el.id !== clicked.id);
          setCanvasElements(updated); onSaveHistory(updated); setSelectedElement(null);
        }
        setCropTarget(null); setCropRect(null);
      }
    } else if (activeTool === 'pen') {
      setPenPoints(prev => [...prev, { x, y }]);
    } else if (activeTool === 'translate') {
      const clicked = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (clicked) { setSelectedElement(clicked.id); if (onElementSelect) onElementSelect(clicked); }
    } else if (activeTool === 'select') {
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (clicked) { setSelectedElement(clicked.id); }
      else { setSelectedElement(null); setSelectedElements([]); }
    }
  }, [activeTool, canvasElements, changePage, cropTarget, currentColor, currentFont, currentFontSize, currentLineHeight, currentPage, dragging, getCoords, isBold, isItalic, isStrikethrough, isUnderline, onElementSelect, onSaveHistory, pageSize, resizing, setCanvasElements, setSelectedElement, setSelectedElements]);

  const handleCanvasDoubleClick = useCallback((e, pageIdx) => {
    if (activeTool === 'pen' && penPoints.length > 1 && pageIdx === currentPage) {
      setDrawPaths(prev => [...prev, { points: penPoints, size: 2, opacity: 100, color: currentColor, isPen: true }]);
      setPenPoints([]);
    }
  }, [activeTool, currentColor, currentPage, penPoints, setDrawPaths]);

  const handleMouseDown = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    if (activeTool === 'draw' || activeTool === 'eraser' || activeTool === 'marking') {
      setIsDrawing(true); setCurrentPath([{ x, y }]); return;
    }
    if (activeTool === 'select') {
      setSelectionStart({ x, y }); setSelectionRect({ x, y, w: 0, h: 0 }); return;
    }
    if (activeTool === 'cut' && cropTarget && cropRect) {
      setCropDragging(true); setCropStart({ x, y, rect: { ...cropRect } }); return;
    }
    if (selectedElement && (activeTool === 'hand' || activeTool === 'text')) {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el) && editingId !== el.id) {
        setDragging(el.id); setDragOffset({ x: x - el.x, y: y - el.y });
      }
    }
  }, [activeTool, canvasElements, cropRect, cropTarget, currentPage, editingId, getCoords, selectedElement]);

  const handleMouseMove = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    if ((activeTool === 'draw' || activeTool === 'marking') && isDrawing) {
      setCurrentPath(prev => [...prev, { x, y }]); return;
    }
    if (activeTool === 'eraser' && isDrawing) {
      setCurrentPath(prev => [...prev, { x, y }]);
      const r = (eraserSize || 15);
      setDrawPaths(prev => prev.filter(path => !path.points.some(p => Math.abs(p.x - x) < r && Math.abs(p.y - y) < r)));
      return;
    }
    if (activeTool === 'select' && selectionStart) {
      setSelectionRect({ x: Math.min(selectionStart.x, x), y: Math.min(selectionStart.y, y), w: Math.abs(x - selectionStart.x), h: Math.abs(y - selectionStart.y) });
      return;
    }
    if (cropDragging && cropStart) {
      setCropRect({ x: cropStart.rect.x + x - cropStart.x, y: cropStart.rect.y + y - cropStart.y, w: cropStart.rect.w, h: cropStart.rect.h });
      return;
    }
    if (dragging) {
      const el = canvasElements.find(el => el.id === dragging);
      if (el) setCanvasElements(prev => prev.map(item => item.id === dragging ? { ...item, x: Math.max(0, x - dragOffset.x), y: Math.max(0, y - dragOffset.y) } : item));
    }
    if (resizing) {
      setCanvasElements(prev => prev.map(el => el.id === resizing.id ? { ...el, width: Math.max(30, x - resizing.startX), height: Math.max(30, y - resizing.startY) } : el));
    }
  }, [activeTool, canvasElements, cropDragging, cropStart, currentPage, dragging, dragOffset, eraserSize, getCoords, isDrawing, resizing, selectionStart, setCanvasElements, setDrawPaths]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && activeTool === 'draw' && currentPath.length > 1) {
      setDrawPaths(prev => [...prev, { points: currentPath, size: drawSize, opacity: drawOpacity, color: currentColor }]);
    }
    if (isDrawing && activeTool === 'marking' && currentPath.length > 1) {
      setDrawPaths(prev => [...prev, { points: currentPath, size: markingSize || 20, opacity: markingOpacity || 40, color: markingColor || '#FFFF00', isHighlight: true }]);
    }
    if (activeTool === 'select' && selectionRect && selectionRect.w > 5 && selectionRect.h > 5) {
      const r = selectionRect;
      const ids = canvasElements.filter(el => {
        const cx = el.x + (el.width || 50) / 2;
        const cy = el.y + (el.type === 'text' ? (el.fontSize || 16) / 2 : (el.height || 80) / 2);
        return cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h;
      }).map(el => el.id);
      if (ids.length > 0) { setSelectedElements(ids); justSelectedRef.current = true; }
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    setIsDrawing(false); setCurrentPath([]);
    setSelectionRect(null); setSelectionStart(null);
    setCropDragging(false); setCropStart(null);
    setDragging(null); setResizing(null);
  }, [activeTool, canvasElements, currentColor, currentPath, drawOpacity, drawSize, dragging, isDrawing, markingColor, markingOpacity, markingSize, onSaveHistory, resizing, selectionRect, setDrawPaths, setSelectedElements]);

  const getCursor = () => {
    const m = { text: 'text', hand: 'grab', draw: 'crosshair', pen: 'crosshair', eraser: 'cell', cut: 'crosshair', select: 'crosshair', image: 'copy', marking: 'crosshair', translate: 'help', triangle: 'crosshair', square: 'crosshair', circle: 'crosshair', star: 'crosshair' };
    return m[activeTool] || 'default';
  };

  return (
    <div ref={canvasContainerRef} data-testid="canvas-container" className="flex-1 overflow-auto p-6" style={{ background: 'var(--zet-bg-light)' }}>
      <div className="flex flex-col items-center gap-6">
        {doc.pages?.map((page, idx) => (
          <div key={page.page_id} data-testid={`canvas-page-${idx}`} ref={idx === currentPage ? canvasRef : null}
            className={`bg-white shadow-xl relative select-none ${idx === currentPage ? 'ring-2' : 'opacity-80'}`}
            style={{ width: (page.pageSize?.width || pageSize.width) * zoom, height: (page.pageSize?.height || pageSize.height) * zoom, ringColor: 'var(--zet-primary-light)', cursor: getCursor() }}
            onClick={(e) => handleCanvasClick(e, idx)} onDoubleClick={(e) => handleCanvasDoubleClick(e, idx)}
            onMouseDown={(e) => handleMouseDown(e, idx)} onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {/* Highlights first (behind everything) */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => p.isHighlight).map((path, i) => (
                <path key={`h${i}`} d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                  stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100}
                  fill="none" strokeLinecap="butt" strokeLinejoin="round" />
              ))}
              {/* Regular draw paths */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => !p.isHighlight).map((path, i) => (
                <path key={`d${i}`}
                  d={path.isPen ? `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z` : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                  stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100}
                  fill={path.isPen ? `${path.color}20` : 'none'} strokeLinecap="round" strokeLinejoin="round" />
              ))}
              {/* Live drawing preview */}
              {isDrawing && (activeTool === 'draw' || activeTool === 'marking') && currentPath.length > 1 && (
                <path d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                  stroke={activeTool === 'marking' ? (markingColor || '#FFFF00') : currentColor}
                  strokeWidth={(activeTool === 'marking' ? (markingSize || 20) : drawSize) * zoom}
                  strokeOpacity={activeTool === 'marking' ? (markingOpacity || 40) / 100 : drawOpacity / 100}
                  fill="none" strokeLinecap={activeTool === 'marking' ? 'butt' : 'round'} strokeLinejoin="round" />
              )}
              {penPoints.length > 0 && (<>
                <path d={`M ${penPoints.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={currentColor} strokeWidth={2 * zoom} fill="none" strokeDasharray="4,4" />
                {penPoints.map((p, i) => <circle key={i} cx={p.x * zoom} cy={p.y * zoom} r={4} fill={currentColor} stroke="#fff" strokeWidth={1} />)}
              </>)}
              {selectionRect && selectionRect.w > 0 && (
                <rect x={selectionRect.x * zoom} y={selectionRect.y * zoom} width={selectionRect.w * zoom} height={selectionRect.h * zoom}
                  stroke="#4ca8ad" strokeWidth={2} strokeDasharray="6,3" fill="rgba(76,168,173,0.1)" />
              )}
              {cropTarget && cropRect && idx === currentPage && (<>
                <rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.3)" />
                <rect x={cropRect.x * zoom} y={cropRect.y * zoom} width={cropRect.w * zoom} height={cropRect.h * zoom}
                  stroke="#4ca8ad" strokeWidth={2} fill="rgba(0,0,0,0)" strokeDasharray="6,3" />
              </>)}
            </svg>

            {cropTarget && cropRect && idx === currentPage && (
              <button data-testid="crop-apply-btn" onClick={(e) => { e.stopPropagation(); applyCrop(); }}
                className="absolute z-20 zet-btn text-xs px-3 py-1" style={{ left: (cropRect.x + cropRect.w) * zoom + 8, top: cropRect.y * zoom }}>
                Apply Crop
              </button>
            )}

            {/* Elements */}
            {(idx === currentPage ? canvasElements : page.elements || []).map(el => {
              const isSel = selectedElement === el.id || selectedElements.includes(el.id);
              return (
                <div key={el.id} data-testid={`canvas-element-${el.id}`}
                  className={`absolute ${isSel ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ left: el.x * zoom, top: el.y * zoom, width: el.type !== 'text' ? (el.width || 80) * zoom : 'auto', height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto', cursor: activeTool === 'hand' ? 'move' : undefined }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); changePage(idx); if (onElementSelect) onElementSelect(el); }}>

                  {el.type === 'text' && (
                    <EditableText el={el} zoom={zoom} pageWidth={page.pageSize?.width || pageSize.width}
                      isEditing={editingId === el.id && idx === currentPage}
                      onStartEdit={id => setEditingId(id)} onCommit={handleTextCommit} />
                  )}

                  {el.type === 'image' && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {isSel && (<>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: 'var(--zet-bg-card)' }}
                          onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}>
                          <MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />
                        </button>
                        {elementMenu === el.id && (
                          <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={onChangeImage}
                            onAddImageToShape={() => {}} onClose={() => setElementMenu(null)} />
                        )}
                      </>)}
                    </div>
                  )}

                  {el.type === 'shape' && (
                    <div className="relative w-full h-full group">
                      <ShapeRenderer el={el} />
                      {isSel && (<>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md"
                          style={{ background: 'var(--zet-bg-card)' }}
                          onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}>
                          <MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />
                        </button>
                        {elementMenu === el.id && (
                          <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}}
                            onAddImageToShape={onAddImageToShape} onClose={() => setElementMenu(null)} />
                        )}
                      </>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
