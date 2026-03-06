import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MoreVertical } from 'lucide-react';

// Check if point is inside element bounds
const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const h = (el.fontSize || 16) * Math.max(1, (el.content || '').split('\n').length) * 1.5;
    return x >= el.x && x <= el.x + (el.width || 400) && y >= el.y && y <= el.y + h;
  }
  if (el.type === 'image' || el.type === 'shape') {
    return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
  }
  return false;
};

// Render shape SVG/div
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

// Editable text element
const EditableText = ({ el, zoom, pageWidth, isEditing, onStartEdit, onCommit }) => {
  const ref = useRef(null);
  const maxWidth = (pageWidth - el.x - 20);

  useEffect(() => {
    if (isEditing && ref.current) {
      ref.current.focus();
      // Place cursor at end
      const range = window.document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(ref.current);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isEditing]);

  const handleBlur = () => {
    if (!ref.current) return;
    const text = ref.current.innerText;
    onCommit(el.id, text);
  };

  const handleKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === 'Escape') {
      ref.current?.blur();
    }
  };

  return (
    <div
      ref={ref}
      data-testid={`text-element-${el.id}`}
      contentEditable={isEditing}
      suppressContentEditableWarning
      onDoubleClick={(e) => { e.stopPropagation(); onStartEdit(el.id); }}
      onBlur={handleBlur}
      onKeyDown={isEditing ? handleKeyDown : undefined}
      className={`outline-none ${isEditing ? 'ring-1 ring-blue-400/50 rounded-sm min-h-[1em]' : ''}`}
      style={{
        fontSize: (el.fontSize || 16) * zoom,
        fontFamily: el.fontFamily || 'Arial',
        color: el.color || '#000',
        maxWidth: maxWidth * zoom,
        minWidth: isEditing ? 60 * zoom : undefined,
        wordWrap: 'break-word',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.5,
        cursor: isEditing ? 'text' : 'default',
        caretColor: 'var(--zet-primary)',
        padding: isEditing ? '2px 4px' : 0,
      }}
    >
      {el.content || (isEditing ? '' : '\u00A0')}
    </div>
  );
};

export const CanvasArea = ({
  document: doc,
  currentPage,
  setCurrentPage,
  canvasElements,
  setCanvasElements,
  drawPaths,
  setDrawPaths,
  pageSize,
  zoom,
  setZoom,
  activeTool,
  currentFontSize,
  currentFont,
  currentColor,
  drawSize,
  drawOpacity,
  selectedElement,
  setSelectedElement,
  selectedElements,
  setSelectedElements,
  onSaveHistory,
  showShapeMenu,
  setShowShapeMenu,
  setShowImageUpload,
  setUploadForShape,
  canvasContainerRef,
}) => {
  const canvasRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionPath, setSelectionPath] = useState([]);

  // Mouse wheel zoom for hand tool
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

  // Stop editing when tool changes away from text
  useEffect(() => {
    if (activeTool !== 'text' && activeTool !== 'hand') {
      setEditingId(null);
    }
  }, [activeTool]);

  const getCanvasCoords = useCallback((e, pageRef) => {
    const rect = pageRef.getBoundingClientRect();
    return { x: (e.clientX - rect.left) / zoom, y: (e.clientY - rect.top) / zoom };
  }, [zoom]);

  // Commit edited text
  const handleTextCommit = useCallback((id, text) => {
    if (!text.trim()) {
      // Remove empty text elements
      const filtered = canvasElements.filter(el => el.id !== id);
      setCanvasElements(filtered);
      onSaveHistory(filtered);
    } else {
      const updated = canvasElements.map(el => el.id === id ? { ...el, content: text } : el);
      setCanvasElements(updated);
      onSaveHistory(updated);
    }
    setEditingId(null);
  }, [canvasElements, setCanvasElements, onSaveHistory]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e, pageIdx) => {
    if (dragging || resizing || pageIdx !== currentPage) {
      if (pageIdx !== currentPage) setCurrentPage(pageIdx);
      return;
    }
    const pageEl = e.currentTarget;
    const { x, y } = getCanvasCoords(e, pageEl);
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;

    setShowShapeMenu(null);

    if (activeTool === 'text') {
      // Check if clicked on existing text
      const clickedText = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (clickedText) {
        setEditingId(clickedText.id);
        setSelectedElement(clickedText.id);
        return;
      }
      // Create new text element at click position
      const newEl = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'text',
        x: Math.max(10, x),
        y: Math.max(10, y),
        content: '',
        fontSize: currentFontSize,
        fontFamily: currentFont,
        color: currentColor,
        width: pageSize.width - x - 20,
      };
      const updated = [...canvasElements, newEl];
      setCanvasElements(updated);
      setEditingId(newEl.id);
      setSelectedElement(newEl.id);
    } else if (activeTool === 'image') {
      setShowImageUpload(true);
    } else if (['triangle', 'square', 'circle', 'star'].includes(activeTool)) {
      const el = {
        id: `el_${Date.now()}`,
        type: 'shape', shapeType: activeTool,
        x: x - 40, y: y - 40, width: 80, height: 80,
        fill: currentColor, image: null
      };
      const updated = [...canvasElements, el];
      setCanvasElements(updated);
      onSaveHistory(updated);
    } else if (activeTool === 'hand' || activeTool === 'select') {
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (clicked) {
        setSelectedElement(clicked.id);
        if (clicked.type === 'text') setEditingId(clicked.id);
      } else {
        setSelectedElement(null);
        setSelectedElements([]);
        setEditingId(null);
      }
    } else if (activeTool === 'cut') {
      // Delete clicked element
      const clicked = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (clicked) {
        const updated = canvasElements.filter(el => el.id !== clicked.id);
        setCanvasElements(updated);
        onSaveHistory(updated);
        setSelectedElement(null);
      }
    }
  }, [activeTool, canvasElements, currentColor, currentFont, currentFontSize, currentPage, dragging, getCanvasCoords, onSaveHistory, pageSize, resizing, setCanvasElements, setCurrentPage, setSelectedElement, setSelectedElements, setShowImageUpload, setShowShapeMenu]);

  // Drawing handlers
  const handleMouseDown = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const pageEl = e.currentTarget;
    const { x, y } = getCanvasCoords(e, pageEl);

    if (activeTool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      return;
    }
    if (activeTool === 'select') {
      setIsSelecting(true);
      setSelectionPath([{ x, y }]);
      return;
    }
    if (selectedElement && (activeTool === 'hand' || activeTool === 'text')) {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el) && editingId !== el.id) {
        setDragging(el.id);
        setDragOffset({ x: x - el.x, y: y - el.y });
      }
    }
  }, [activeTool, canvasElements, currentPage, editingId, getCanvasCoords, selectedElement]);

  const handleMouseMove = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const pageEl = e.currentTarget;
    const { x, y } = getCanvasCoords(e, pageEl);

    if (activeTool === 'draw' && isDrawing) {
      setCurrentPath(prev => [...prev, { x, y }]);
      return;
    }
    if (isSelecting) {
      setSelectionPath(prev => [...prev, { x, y }]);
      return;
    }
    if (dragging) {
      const el = canvasElements.find(el => el.id === dragging);
      if (el) {
        const newX = Math.max(0, Math.min(pageSize.width - (el.width || 100), x - dragOffset.x));
        const newY = Math.max(0, Math.min(pageSize.height - (el.height || 20), y - dragOffset.y));
        setCanvasElements(prev => prev.map(item => item.id === dragging ? { ...item, x: newX, y: newY } : item));
      }
    }
    if (resizing) {
      const newWidth = Math.max(30, x - resizing.startX);
      const newHeight = Math.max(30, y - resizing.startY);
      setCanvasElements(prev => prev.map(el => el.id === resizing.id ? { ...el, width: newWidth, height: newHeight } : el));
    }
  }, [activeTool, canvasElements, currentPage, dragging, dragOffset, getCanvasCoords, isDrawing, isSelecting, pageSize, resizing, setCanvasElements]);

  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length > 1) {
      setDrawPaths(prev => [...prev, { points: currentPath, size: drawSize, opacity: drawOpacity, color: currentColor }]);
    }
    if (isSelecting && selectionPath.length > 2) {
      const selected = canvasElements.filter(el => {
        const cx = el.x + (el.width || 50) / 2;
        const cy = el.y + (el.type === 'text' ? (el.fontSize || 16) / 2 : (el.height || 80) / 2);
        return isPointInPolygon(cx, cy, selectionPath);
      });
      setSelectedElements(selected.map(el => el.id));
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    setIsDrawing(false);
    setCurrentPath([]);
    setIsSelecting(false);
    setSelectionPath([]);
    setDragging(null);
    setResizing(null);
  }, [canvasElements, currentColor, currentPath, drawOpacity, drawSize, dragging, isDrawing, isSelecting, onSaveHistory, resizing, selectionPath, setDrawPaths, setSelectedElements]);

  const isPointInPolygon = (x, y, polygon) => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x, yi = polygon[i].y;
      const xj = polygon[j].x, yj = polygon[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  };

  const getCursor = () => {
    if (activeTool === 'draw') return 'crosshair';
    if (activeTool === 'text') return 'text';
    if (activeTool === 'hand') return 'grab';
    if (activeTool === 'cut') return 'crosshair';
    if (activeTool === 'select') return 'crosshair';
    return 'default';
  };

  return (
    <div ref={canvasContainerRef} data-testid="canvas-container" className="flex-1 overflow-auto p-6" style={{ background: 'var(--zet-bg-light)' }}>
      <div className="flex flex-col items-center gap-6">
        {doc.pages?.map((page, idx) => (
          <div
            key={page.page_id}
            data-testid={`canvas-page-${idx}`}
            ref={idx === currentPage ? canvasRef : null}
            className={`bg-white shadow-xl relative select-none ${idx === currentPage ? 'ring-2' : 'opacity-80'}`}
            style={{
              width: (page.pageSize?.width || pageSize.width) * zoom,
              height: (page.pageSize?.height || pageSize.height) * zoom,
              ringColor: 'var(--zet-primary-light)',
              cursor: getCursor(),
            }}
            onClick={(e) => handleCanvasClick(e, idx)}
            onMouseDown={(e) => handleMouseDown(e, idx)}
            onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* Page label */}
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>
              Page {idx + 1}
            </div>

            {/* SVG overlay for drawing & selection */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
              {(idx === currentPage ? drawPaths : page.drawPaths || []).map((path, i) => (
                <path key={i}
                  d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                  stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100}
                  fill="none" strokeLinecap="round" strokeLinejoin="round"
                />
              ))}
              {isDrawing && currentPath.length > 1 && (
                <path
                  d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`}
                  stroke={currentColor} strokeWidth={drawSize * zoom} strokeOpacity={drawOpacity / 100}
                  fill="none" strokeLinecap="round" strokeLinejoin="round"
                />
              )}
              {isSelecting && selectionPath.length > 1 && (
                <path
                  d={`M ${selectionPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')} Z`}
                  stroke="#4ca8ad" strokeWidth={2} strokeDasharray="5,5" fill="rgba(76,168,173,0.1)"
                />
              )}
            </svg>

            {/* Canvas elements */}
            {(idx === currentPage ? canvasElements : page.elements || []).map(el => {
              const isSelected = selectedElement === el.id || selectedElements.includes(el.id);
              return (
                <div
                  key={el.id}
                  data-testid={`canvas-element-${el.id}`}
                  className={`absolute ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  style={{
                    left: el.x * zoom,
                    top: el.y * zoom,
                    width: el.type !== 'text' ? (el.width || 80) * zoom : 'auto',
                    height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto',
                    cursor: activeTool === 'hand' ? 'move' : undefined,
                  }}
                  onClick={(e) => { e.stopPropagation(); setSelectedElement(el.id); setCurrentPage(idx); }}
                >
                  {el.type === 'text' && (
                    <EditableText
                      el={el}
                      zoom={zoom}
                      pageWidth={page.pageSize?.width || pageSize.width}
                      isEditing={editingId === el.id && idx === currentPage}
                      onStartEdit={(id) => setEditingId(id)}
                      onCommit={handleTextCommit}
                    />
                  )}
                  {el.type === 'image' && (
                    <div className="relative w-full h-full">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {isSelected && (
                        <div
                          className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }}
                        />
                      )}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="relative w-full h-full">
                      <ShapeRenderer el={el} />
                      {isSelected && (
                        <>
                          <div
                            className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-sm"
                            onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }}
                          />
                          <button
                            className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--zet-bg-card)' }}
                            onClick={(e) => { e.stopPropagation(); setShowShapeMenu(el.id); }}
                          >
                            <MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} />
                          </button>
                          {showShapeMenu === el.id && (
                            <div className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[100px]">
                              <button
                                data-testid={`shape-add-image-${el.id}`}
                                className="w-full text-left px-2 py-1 text-xs rounded hover:bg-white/10"
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
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};
