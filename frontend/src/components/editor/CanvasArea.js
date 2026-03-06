import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MoreVertical, Trash2, Image, RefreshCw } from 'lucide-react';

const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const lines = Math.max(1, (el.content || '').split('\n').length);
    const h = (el.fontSize || 16) * lines * (el.lineHeight || 1.5);
    return x >= el.x && x <= el.x + (el.width || 400) && y >= el.y && y <= el.y + h;
  }
  return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
};

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const ShapeRenderer = ({ el }) => {
  const style = { width: '100%', height: '100%', backgroundColor: el.image ? 'transparent' : el.fill, backgroundImage: el.image ? `url(${el.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' };
  const clips = { triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)', star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' };
  if (el.shapeType === 'circle') return <div style={{ ...style, borderRadius: '50%' }} />;
  if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;
  return <div style={style} />;
};

const EditableText = ({ el, zoom, pageWidth, isEditing, onStartEdit, onCommit }) => {
  const ref = useRef(null);
  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      const r = window.document.createRange(); const s = window.getSelection();
      r.selectNodeContents(ref.current); r.collapse(false); s.removeAllRanges(); s.addRange(r);
    }
  }, [isEditing]);
  const gradientStyle = el.gradientStart && el.gradientEnd ? {
    background: `linear-gradient(90deg, ${el.gradientStart}, ${el.gradientEnd})`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } : {};
  return (
    <div ref={ref} data-testid={`text-element-${el.id}`} contentEditable={isEditing} suppressContentEditableWarning
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(el.id); }}
      onBlur={() => { if (ref.current) onCommit(el.id, ref.current.innerText); }}
      onKeyDown={isEditing ? (e) => { e.stopPropagation(); if (e.key === 'Escape') ref.current?.blur(); } : undefined}
      className={`outline-none ${isEditing ? 'ring-1 ring-blue-400/50 rounded-sm min-h-[1em]' : ''}`}
      style={{
        fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial',
        color: (el.gradientStart && el.gradientEnd) ? undefined : (el.color || '#000'),
        fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal',
        textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
        textAlign: el.textAlign || 'left',
        maxWidth: (pageWidth - el.x - 20) * zoom, minWidth: isEditing ? 60 * zoom : undefined,
        wordWrap: 'break-word', whiteSpace: 'pre-wrap', lineHeight: el.lineHeight || 1.5,
        cursor: isEditing ? 'text' : 'default', caretColor: 'var(--zet-primary)',
        padding: isEditing ? '2px 4px' : 0, ...gradientStyle,
      }}>
      {el.content || (isEditing ? '' : '\u00A0')}
    </div>
  );
};

const ElementMenu = ({ el, onDelete, onChangeImage, onAddImageToShape, onClose }) => (
  <div data-testid={`element-menu-${el.id}`} className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[120px] shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
    {el.type === 'image' && <button data-testid={`change-image-${el.id}`} onClick={() => { onChangeImage(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><RefreshCw className="h-3 w-3" /> Change Image</button>}
    {el.type === 'shape' && <button onClick={() => { onAddImageToShape(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Image className="h-3 w-3" /> Add Image</button>}
    <button onClick={() => { onDelete(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-500/20 flex items-center gap-2" style={{ color: '#f87171' }}><Trash2 className="h-3 w-3" /> Delete</button>
  </div>
);

export const CanvasArea = ({
  document: doc, currentPage, changePage, canvasElements, setCanvasElements, drawPaths, setDrawPaths,
  pageSize, zoom, setZoom, activeTool, currentFontSize, currentFont, currentColor, currentLineHeight,
  currentTextAlign, drawSize, drawOpacity, eraserSize, markingColor, markingOpacity, markingSize,
  selectedElement, setSelectedElement, selectedElements, setSelectedElements,
  onSaveHistory, canvasContainerRef, onElementSelect, onDeleteElement, onChangeImage, onAddImageToShape,
  isBold, isItalic, isUnderline, isStrikethrough, pageBackground, gradientStart, gradientEnd,
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
  const justSelectedRef = useRef(false);

  useEffect(() => {
    const h = (e) => { if (activeTool === 'hand' && canvasContainerRef.current?.contains(e.target)) { e.preventDefault(); setZoom(p => Math.max(0.25, Math.min(3, p + (e.deltaY > 0 ? -0.05 : 0.05)))); } };
    window.addEventListener('wheel', h, { passive: false });
    return () => window.removeEventListener('wheel', h);
  }, [activeTool, canvasContainerRef, setZoom]);

  useEffect(() => {
    if (activeTool === 'cut' && selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el?.type === 'image') { setCropTarget(el.id); setCropRect({ x: el.x + 10, y: el.y + 10, w: el.width - 20, h: el.height - 20 }); return; }
    }
    if (activeTool !== 'cut') { setCropTarget(null); setCropRect(null); }
    if (activeTool !== 'text' && activeTool !== 'hand') setEditingId(null);
    if (activeTool !== 'pen') setPenPoints([]);
    setElementMenu(null);
  }, [activeTool, canvasElements, selectedElement]);

  const getCoords = useCallback((e, el) => { const r = el.getBoundingClientRect(); return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom }; }, [zoom]);

  const handleTextCommit = useCallback((id, text) => {
    if (!text.trim()) { const f = canvasElements.filter(el => el.id !== id); setCanvasElements(f); onSaveHistory(f); }
    else { const u = canvasElements.map(el => el.id === id ? { ...el, content: text } : el); setCanvasElements(u); onSaveHistory(u); }
    setEditingId(null);
  }, [canvasElements, setCanvasElements, onSaveHistory]);

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
    if (dragging || resizing) return;
    if (pageIdx !== currentPage) { changePage(pageIdx); return; }
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    const { x, y } = getCoords(e, e.currentTarget);
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    setElementMenu(null);

    if (activeTool === 'text') {
      const cl = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (cl) { setEditingId(cl.id); setSelectedElement(cl.id); return; }
      const ne = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
        x: Math.max(10, x), y: Math.max(10, y), content: '', fontSize: currentFontSize,
        fontFamily: currentFont, color: currentColor, width: pageSize.width - x - 20,
        lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
        bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
        gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
      };
      const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
    } else if (['triangle', 'square', 'circle', 'star'].includes(activeTool)) {
      const u = [...canvasElements, { id: `el_${Date.now()}`, type: 'shape', shapeType: activeTool, x: x - 40, y: y - 40, width: 80, height: 80, fill: currentColor, image: null }];
      setCanvasElements(u); onSaveHistory(u);
    } else if (activeTool === 'hand') {
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl) { setSelectedElement(cl.id); if (cl.type === 'text') setEditingId(cl.id); if (onElementSelect) onElementSelect(cl); }
      else { setSelectedElement(null); setSelectedElements([]); setEditingId(null); }
    } else if (activeTool === 'cut') {
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl?.type === 'image' && !cropTarget) { setCropTarget(cl.id); setSelectedElement(cl.id); setCropRect({ x: cl.x + 10, y: cl.y + 10, w: cl.width - 20, h: cl.height - 20 }); }
      else if (!cropTarget || (cl && cl.id !== cropTarget)) { if (cl) { const u = canvasElements.filter(el => el.id !== cl.id); setCanvasElements(u); onSaveHistory(u); setSelectedElement(null); } setCropTarget(null); setCropRect(null); }
    } else if (activeTool === 'pen') {
      // Auto-close: if near first point, close the path
      if (penPoints.length > 2 && dist({ x, y }, penPoints[0]) < 15) {
        setDrawPaths(prev => [...prev, { points: [...penPoints, penPoints[0]], size: 2, opacity: 100, color: currentColor, isPen: true }]);
        setPenPoints([]);
      } else { setPenPoints(prev => [...prev, { x, y }]); }
    } else if (activeTool === 'translate') {
      const cl = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (cl) { setSelectedElement(cl.id); if (onElementSelect) onElementSelect(cl); }
    } else if (activeTool === 'select') {
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl) setSelectedElement(cl.id); else { setSelectedElement(null); setSelectedElements([]); }
    }
  }, [activeTool, canvasElements, changePage, cropTarget, currentColor, currentFont, currentFontSize, currentLineHeight, currentPage, currentTextAlign, dragging, getCoords, gradientEnd, gradientStart, isBold, isItalic, isStrikethrough, isUnderline, onElementSelect, onSaveHistory, pageSize, penPoints, resizing, setCanvasElements, setDrawPaths, setSelectedElement, setSelectedElements]);

  const handleCanvasDoubleClick = useCallback((e, pageIdx) => {
    if (activeTool === 'pen' && penPoints.length > 1 && pageIdx === currentPage) {
      setDrawPaths(prev => [...prev, { points: penPoints, size: 2, opacity: 100, color: currentColor, isPen: true }]);
      setPenPoints([]);
    }
  }, [activeTool, currentColor, currentPage, penPoints, setDrawPaths]);

  const handleMouseDown = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    if (activeTool === 'draw' || activeTool === 'marking') { setIsDrawing(true); setCurrentPath([{ x, y }]); return; }
    if (activeTool === 'eraser') { setIsDrawing(true); setEraserTrail([{ x, y }]); return; }
    if (activeTool === 'select') { setSelectionStart({ x, y }); setSelectionRect({ x, y, w: 0, h: 0 }); return; }
    if (activeTool === 'cut' && cropTarget && cropRect) { setCropDragging(true); setCropStart({ x, y, rect: { ...cropRect } }); return; }
    if (selectedElement && (activeTool === 'hand' || activeTool === 'text')) {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el) && editingId !== el.id) { setDragging(el.id); setDragOffset({ x: x - el.x, y: y - el.y }); }
    }
  }, [activeTool, canvasElements, cropRect, cropTarget, currentPage, editingId, getCoords, selectedElement]);

  const handleMouseMove = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    if ((activeTool === 'draw' || activeTool === 'marking') && isDrawing) { setCurrentPath(p => [...p, { x, y }]); return; }
    if (activeTool === 'eraser' && isDrawing) { setEraserTrail(p => [...p, { x, y }]); return; }
    if (activeTool === 'select' && selectionStart) { setSelectionRect({ x: Math.min(selectionStart.x, x), y: Math.min(selectionStart.y, y), w: Math.abs(x - selectionStart.x), h: Math.abs(y - selectionStart.y) }); return; }
    if (cropDragging && cropStart) { setCropRect({ x: cropStart.rect.x + x - cropStart.x, y: cropStart.rect.y + y - cropStart.y, w: cropStart.rect.w, h: cropStart.rect.h }); return; }
    if (dragging) { const el = canvasElements.find(el => el.id === dragging); if (el) setCanvasElements(p => p.map(i => i.id === dragging ? { ...i, x: Math.max(0, x - dragOffset.x), y: Math.max(0, y - dragOffset.y) } : i)); }
    if (resizing) setCanvasElements(p => p.map(el => el.id === resizing.id ? { ...el, width: Math.max(30, x - resizing.startX), height: Math.max(30, y - resizing.startY) } : el));
  }, [activeTool, canvasElements, cropDragging, cropStart, currentPage, dragging, dragOffset, getCoords, isDrawing, resizing, selectionStart, setCanvasElements]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && activeTool === 'draw' && currentPath.length > 1) setDrawPaths(p => [...p, { points: currentPath, size: drawSize, opacity: drawOpacity, color: currentColor }]);
    if (isDrawing && activeTool === 'marking' && currentPath.length > 1) setDrawPaths(p => [...p, { points: currentPath, size: markingSize || 20, opacity: markingOpacity || 40, color: markingColor || '#FFFF00', isHighlight: true }]);
    // Eraser: remove paths that intersect with eraser trail
    if (isDrawing && activeTool === 'eraser' && eraserTrail.length > 0) {
      const r = eraserSize || 15;
      setDrawPaths(prev => prev.filter(path => !path.points.some(pp => eraserTrail.some(ep => dist(pp, ep) < r))));
    }
    if (activeTool === 'select' && selectionRect && selectionRect.w > 5 && selectionRect.h > 5) {
      const sr = selectionRect;
      const ids = canvasElements.filter(el => { const cx = el.x + (el.width || 50) / 2; const cy = el.y + (el.type === 'text' ? (el.fontSize || 16) / 2 : (el.height || 80) / 2); return cx >= sr.x && cx <= sr.x + sr.w && cy >= sr.y && cy <= sr.y + sr.h; }).map(el => el.id);
      if (ids.length > 0) { setSelectedElements(ids); justSelectedRef.current = true; }
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    setIsDrawing(false); setCurrentPath([]); setEraserTrail([]);
    setSelectionRect(null); setSelectionStart(null);
    setCropDragging(false); setCropStart(null); setDragging(null); setResizing(null);
  }, [activeTool, canvasElements, currentColor, currentPath, drawOpacity, drawSize, dragging, eraserSize, eraserTrail, isDrawing, markingColor, markingOpacity, markingSize, onSaveHistory, resizing, selectionRect, setDrawPaths, setSelectedElements]);

  const getCursor = () => ({ text: 'text', hand: 'grab', draw: 'crosshair', pen: 'crosshair', eraser: 'cell', cut: 'crosshair', select: 'crosshair', marking: 'crosshair', translate: 'help' }[activeTool] || 'crosshair');

  const pageBg = pageBackground || '#ffffff';

  return (
    <div ref={canvasContainerRef} data-testid="canvas-container" className="flex-1 overflow-auto p-6" style={{ background: 'var(--zet-bg-light)' }}>
      <div className="flex flex-col items-center gap-6">
        {doc.pages?.map((page, idx) => (
          <div key={page.page_id} data-testid={`canvas-page-${idx}`} ref={idx === currentPage ? canvasRef : null}
            className={`shadow-xl relative select-none ${idx === currentPage ? 'ring-2' : 'opacity-80'}`}
            style={{ width: (page.pageSize?.width || pageSize.width) * zoom, height: (page.pageSize?.height || pageSize.height) * zoom, ringColor: 'var(--zet-primary-light)', cursor: getCursor(), background: pageBg }}
            onClick={(e) => handleCanvasClick(e, idx)} onDoubleClick={(e) => handleCanvasDoubleClick(e, idx)}
            onMouseDown={(e) => handleMouseDown(e, idx)} onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => p.isHighlight).map((path, i) => <path key={`h${i}`} d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100} fill="none" strokeLinecap="butt" />)}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => !p.isHighlight).map((path, i) => <path key={`d${i}`} d={path.isPen ? `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z` : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100} fill={path.isPen ? `${path.color}20` : 'none'} strokeLinecap="round" strokeLinejoin="round" />)}
              {isDrawing && (activeTool === 'draw' || activeTool === 'marking') && currentPath.length > 1 && <path d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={activeTool === 'marking' ? (markingColor || '#FFFF00') : currentColor} strokeWidth={(activeTool === 'marking' ? (markingSize || 20) : drawSize) * zoom} strokeOpacity={activeTool === 'marking' ? (markingOpacity || 40) / 100 : drawOpacity / 100} fill="none" strokeLinecap={activeTool === 'marking' ? 'butt' : 'round'} />}
              {penPoints.length > 0 && (<><path d={`M ${penPoints.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={currentColor} strokeWidth={2 * zoom} fill="none" strokeDasharray="4,4" />{penPoints.map((p, i) => <circle key={i} cx={p.x * zoom} cy={p.y * zoom} r={4} fill={i === 0 ? '#4ca8ad' : currentColor} stroke="#fff" strokeWidth={1} />)}</>)}
              {selectionRect && selectionRect.w > 0 && <rect x={selectionRect.x * zoom} y={selectionRect.y * zoom} width={selectionRect.w * zoom} height={selectionRect.h * zoom} stroke="#4ca8ad" strokeWidth={2} strokeDasharray="6,3" fill="rgba(76,168,173,0.1)" />}
              {cropTarget && cropRect && idx === currentPage && (<><rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.3)" /><rect x={cropRect.x * zoom} y={cropRect.y * zoom} width={cropRect.w * zoom} height={cropRect.h * zoom} stroke="#4ca8ad" strokeWidth={2} fill="rgba(0,0,0,0)" strokeDasharray="6,3" /></>)}
            </svg>
            {cropTarget && cropRect && idx === currentPage && <button data-testid="crop-apply-btn" onClick={(e) => { e.stopPropagation(); applyCrop(); }} className="absolute z-20 zet-btn text-xs px-3 py-1" style={{ left: (cropRect.x + cropRect.w) * zoom + 8, top: cropRect.y * zoom }}>Apply Crop</button>}
            {(idx === currentPage ? canvasElements : page.elements || []).map(el => {
              const isSel = selectedElement === el.id || selectedElements.includes(el.id);
              return (
                <div key={el.id} data-testid={`canvas-element-${el.id}`} className={`absolute ${isSel ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ left: el.x * zoom, top: el.y * zoom, width: el.type !== 'text' ? (el.width || 80) * zoom : 'auto', height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto', cursor: activeTool === 'hand' ? 'move' : undefined }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); changePage(idx); if (onElementSelect) onElementSelect(el); }}>
                  {el.type === 'text' && <EditableText el={el} zoom={zoom} pageWidth={page.pageSize?.width || pageSize.width} isEditing={editingId === el.id && idx === currentPage} onStartEdit={id => setEditingId(id)} onCommit={handleTextCommit} />}
                  {(el.type === 'image' || el.type === 'chart') && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {isSel && (<><div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="relative w-full h-full group"><ShapeRenderer el={el} />
                      {isSel && (<><div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={onAddImageToShape} onClose={() => setElementMenu(null)} />}
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
