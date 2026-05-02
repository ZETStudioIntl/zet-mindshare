import React, { useRef, useEffect, useCallback, useState } from 'react';
import { MoreVertical, Trash2, Image, RefreshCw, Wand2, Copy, FlipHorizontal2, EyeOff } from 'lucide-react';

const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const lines = Math.max(1, (el.content || '').split('\n').length);
    const h = (el.fontSize || 16) * lines * (el.lineHeight || 1.5);
    return x >= el.x && x <= el.x + (el.width || 400) && y >= el.y && y <= el.y + h;
  }
  return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
};

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

const computeBezierPath = (anchors, zoom, isClosed) => {
  if (!anchors || anchors.length < 1) return '';
  const z = zoom;
  const pts = anchors.map(a => ({ x: a.x * z, y: a.y * z, hx: (a.hx || 0) * z, hy: (a.hy || 0) * z }));
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i];
    d += ` C ${p.x + p.hx} ${p.y + p.hy} ${c.x - c.hx} ${c.y - c.hy} ${c.x} ${c.y}`;
  }
  if (isClosed) {
    const last = pts[pts.length - 1], first = pts[0];
    d += ` C ${last.x + last.hx} ${last.y + last.hy} ${first.x - first.hx} ${first.y - first.hy} ${first.x} ${first.y} Z`;
  }
  return d;
};

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
  
  const clips = {
    triangle: 'polygon(50% 0%, 0% 100%, 100% 100%)',
    star: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
    hexagon: 'polygon(25% 7%, 75% 7%, 100% 50%, 75% 93%, 25% 93%, 0% 50%)',
    diamond: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
    pentagon: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
    arrow: 'polygon(0% 30%, 60% 30%, 60% 0%, 100% 50%, 60% 100%, 60% 70%, 0% 70%)',
    parallelogram: 'polygon(20% 0%, 100% 0%, 80% 100%, 0% 100%)',
  };

  if (el.shapeType === 'circle') return <div style={{ ...style, borderRadius: '50%' }} />;
  if (el.shapeType === 'ring') {
    if (hasGradient) {
      return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid transparent', background: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${el.gradientStart}, ${el.gradientEnd}) border-box`, boxSizing: 'border-box' }} />;
    }
    return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${el.fill || '#000'}`, backgroundColor: 'transparent', backgroundImage: hasImage ? `url(${el.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', boxSizing: 'border-box' }} />;
  }
  if (el.shapeType === 'heart') {
    const fill = el.fill || '#000';
    return (
      <svg viewBox="0 0 100 90" style={{ width: '100%', height: '100%' }}>
        <path d="M50,80 L12,42 C2,28 12,10 30,14 C38,16 45,24 50,32 C55,24 62,16 70,14 C88,10 98,28 88,42 Z" fill={fill} />
      </svg>
    );
  }
  if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;

  // SVG-based shapes with gradient support
  const svgFill = hasGradient ? `url(#sg-${el.id})` : (el.fill || '#000000');
  const gradDef = hasGradient ? (
    <defs>
      <linearGradient id={`sg-${el.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={el.gradientStart} />
        <stop offset="100%" stopColor={el.gradientEnd} />
      </linearGradient>
    </defs>
  ) : null;
  const svgProps = { viewBox: '0 0 100 100', style: { width: '100%', height: '100%' } };

  const svgShapes = {
    'arrow-right': <path d="M10,35 L65,35 L65,15 L93,50 L65,85 L65,65 L10,65 Z" fill={svgFill} />,
    'arrow-left':  <path d="M90,35 L35,35 L35,15 L7,50 L35,85 L35,65 L90,65 Z" fill={svgFill} />,
    'arrow-up':    <path d="M35,90 L35,45 L15,45 L50,5 L85,45 L65,45 L65,90 Z" fill={svgFill} />,
    'arrow-down':  <path d="M35,10 L35,55 L15,55 L50,95 L85,55 L65,55 L65,10 Z" fill={svgFill} />,
    'arrow-double':<path d="M5,50 L22,20 L22,37 L78,37 L78,20 L95,50 L78,80 L78,63 L22,63 L22,80 Z" fill={svgFill} />,
    'star3':       <polygon points="50,5 61,40 97,40 68,60 79,95 50,73 21,95 32,60 3,40 39,40" fill={svgFill} />,
    'star4':       <polygon points="50,5 57,43 95,50 57,57 50,95 43,57 5,50 43,43" fill={svgFill} />,
    'star6':       <polygon points="50,3 61,28 90,22 74,46 90,70 61,64 50,90 39,64 10,70 26,46 10,22 39,28" fill={svgFill} />,
    'bubble':      <path d="M10,10 Q10,5 15,5 L85,5 Q90,5 90,10 L90,65 Q90,70 85,70 L42,70 L26,90 L31,70 L15,70 Q10,70 10,65 Z" fill={svgFill} />,
    'bubble-left': <path d="M90,10 Q90,5 85,5 L15,5 Q10,5 10,10 L10,65 Q10,70 15,70 L58,70 L74,90 L69,70 L85,70 Q90,70 90,65 Z" fill={svgFill} />,
    'diamond-flow':<polygon points="50,5 95,50 50,95 5,50" fill={svgFill} />,
    'oval':        <ellipse cx="50" cy="50" rx="48" ry="32" fill={svgFill} />,
    'cylinder':    <><ellipse cx="50" cy="18" rx="40" ry="12" fill={svgFill} /><rect x="10" y="18" width="80" height="64" fill={svgFill} /><ellipse cx="50" cy="82" rx="40" ry="12" fill={svgFill} /><ellipse cx="50" cy="18" rx="40" ry="12" fill="rgba(255,255,255,0.18)" /></>,
    'math-sum':    <text x="50" y="78" textAnchor="middle" fontSize="80" fontFamily="serif" fill={svgFill}>∑</text>,
    'math-pi':     <text x="50" y="80" textAnchor="middle" fontSize="80" fontFamily="serif" fill={svgFill}>π</text>,
    'math-sqrt':   <text x="50" y="80" textAnchor="middle" fontSize="80" fontFamily="serif" fill={svgFill}>√</text>,
    'math-inf':    <text x="50" y="70" textAnchor="middle" fontSize="72" fontFamily="serif" fill={svgFill}>∞</text>,
    'math-int':    <text x="50" y="80" textAnchor="middle" fontSize="80" fontFamily="serif" fill={svgFill}>∫</text>,
    'bracket-sq':  <><path d="M38,8 L24,8 L24,92 L38,92" fill="none" stroke={svgFill} strokeWidth="7" strokeLinecap="square" /><path d="M62,8 L76,8 L76,92 L62,92" fill="none" stroke={svgFill} strokeWidth="7" strokeLinecap="square" /></>,
    'brace-curly': <><path d="M48,8 Q34,8 34,22 L34,42 Q34,50 22,50 Q34,50 34,58 L34,78 Q34,92 48,92" fill="none" stroke={svgFill} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /><path d="M52,8 Q66,8 66,22 L66,42 Q66,50 78,50 Q66,50 66,58 L66,78 Q66,92 52,92" fill="none" stroke={svgFill} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></>,
  };

  if (svgShapes[el.shapeType]) {
    return <svg {...svgProps}>{gradDef}{svgShapes[el.shapeType]}</svg>;
  }

  return <div style={style} />;
};

const EditableText = ({ el, zoom, pageWidth, pageMargins, isEditing, onStartEdit, onCommit, pageHeight, onAutoAddPage, onFlowText, onRemoveRedact }) => {
  const ref = useRef(null);
  const prevEditingRef = useRef(false);
  const [removeTarget, setRemoveTarget] = useState(null); // 'redact' | 'highlight' | null
  
  useEffect(() => {
    if (isEditing && ref.current) {
      if (!prevEditingRef.current) {
        const html = el.htmlContent || (el.content ? el.content.replace(/\n/g, '<br>') : '');
        ref.current.innerHTML = html;
        setRemoveTarget(null);
      }
      ref.current.focus();
      const r = window.document.createRange(); const s = window.getSelection();
      r.selectNodeContents(ref.current); r.collapse(false); s.removeAllRanges(); s.addRange(r);
    }
    prevEditingRef.current = isEditing;
  }, [isEditing, el.htmlContent, el.content]);
  
  const checkOverflow = useCallback(() => {
    if (!ref.current || !pageHeight) return;
    const margins = pageMargins || {};
    const availableH = (pageHeight - el.y - (margins.bottom || 40)) * zoom;
    if (ref.current.scrollHeight <= availableH + 4) return;

    // Try to split at <br> boundaries
    const lineHeightPx = (el.fontSize || 16) * (el.lineHeight || 1.5) * zoom;
    const maxLines = Math.max(1, Math.floor(availableH / lineHeightPx));
    const html = ref.current.innerHTML;
    const parts = html.split(/<br\s*\/?>/gi);

    if (onFlowText && parts.length > maxLines) {
      const keepHtml = parts.slice(0, maxLines).join('<br>');
      const overflowHtml = parts.slice(maxLines).join('<br>');
      const overflowText = overflowHtml.replace(/<[^>]*>/g, '').trim();
      if (overflowText) {
        ref.current.innerHTML = keepHtml;
        onCommit(el.id, keepHtml, true);
        onFlowText(overflowHtml);
        return;
      }
    }
    // No clean split possible — just add a new page
    if (onAutoAddPage) onAutoAddPage();
  }, [el.id, el.y, el.fontSize, el.lineHeight, pageHeight, pageMargins, zoom, onAutoAddPage, onFlowText, onCommit]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const target = e.target.nodeType === 3 ? e.target.parentElement : e.target;
    if (!target) { onStartEdit(el.id); return; }
    
    const redactedSpan = target.closest?.('[data-redacted="true"]');
    const highlightSpan = target.closest?.('[data-highlight="true"]');
    
    if (redactedSpan) { setRemoveTarget('redact'); return; }
    if (highlightSpan) { setRemoveTarget('highlight'); return; }
    
    setRemoveTarget(null);
    onStartEdit(el.id);
  }, [el.id, onStartEdit]);

  const handleRemoveFormatting = useCallback(() => {
    let html = el.htmlContent || el.content || '';
    if (removeTarget === 'redact') {
      html = html.replace(/<span[^>]*data-redacted="true"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    } else if (removeTarget === 'highlight') {
      html = html.replace(/<span[^>]*data-highlight="true"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    }
    onCommit(el.id, html, true);
    setRemoveTarget(null);
  }, [el.id, el.htmlContent, el.content, removeTarget, onCommit]);
  
  const ml = pageMargins?.left || 60;
  const mr = pageMargins?.right || 60;
  const fixedWidth = (pageWidth - ml - mr) * zoom;
  
  const gradientStyle = el.gradientStart && el.gradientEnd ? {
    background: `linear-gradient(90deg, ${el.gradientStart}, ${el.gradientEnd})`,
    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
  } : {};

  const htmlContent = el.htmlContent || (el.content ? el.content.replace(/\n/g, '<br>') : (isEditing ? '' : '\u00A0'));

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} data-testid={`text-element-${el.id}`} contentEditable={isEditing} suppressContentEditableWarning
        onDoubleClick={(e) => { e.stopPropagation(); setRemoveTarget(null); onStartEdit(el.id); }}
        onClick={handleClick}
        onBlur={(e) => {
          const rt = e.relatedTarget;
          // Toolbar butonuna tıklanınca blur olmasın — editingId korunur
          if (isEditing && rt && (rt.tagName === 'BUTTON' || rt.tagName === 'SELECT' || rt.tagName === 'INPUT' || rt.getAttribute?.('role') === 'button')) {
            setTimeout(() => { if (ref.current) ref.current.focus(); }, 0);
            return;
          }
          if (ref.current) {
            onCommit(el.id, ref.current.innerHTML, true);
          }
        }}
        onInput={checkOverflow}
        onKeyDown={isEditing ? (e) => { e.stopPropagation(); if (e.key === 'Escape') ref.current?.blur(); } : undefined}
        className={`outline-none ${isEditing ? 'min-h-[1em]' : ''}`}
        style={{
          visibility: el.isRedacted && !isEditing ? 'hidden' : undefined,
          fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial',
          color: (el.gradientStart && el.gradientEnd) ? undefined : (el.color || '#000'),
          fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal',
          textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
          textAlign: el.textAlign || 'left',
          width: fixedWidth,
          wordWrap: 'break-word', whiteSpace: 'pre-wrap',
          lineHeight: el.lineHeight || 1.5,
          WebkitLineClamp: 'unset',
          cursor: 'text', caretColor: 'var(--zet-primary)',
          paddingLeft: (el.paddingLeft || 0) * zoom,
          paddingRight: (el.paddingRight || 0) * zoom,
          paddingTop: (el.paddingTop || 0) * zoom,
          paddingBottom: (el.paddingBottom || 0) * zoom,
          backgroundColor: el.highlightColor || undefined,
          '--lh': el.lineHeight || 1.5,
          ...gradientStyle,
        }}
        dangerouslySetInnerHTML={!isEditing ? { __html: htmlContent } : undefined}
      />
      {el.isRedacted && !isEditing && (
        <div style={{ position: 'absolute', inset: 0, background: '#111', borderRadius: 2, zIndex: 2, cursor: 'default', userSelect: 'none' }} />
      )}
      {removeTarget && (
        <div
          className="absolute z-50 flex items-center gap-1 rounded-lg text-xs font-medium shadow-xl"
          style={{ top: '100%', left: 0, marginTop: 5, background: removeTarget === 'redact' ? '#1a0000' : '#2a2000', border: `1px solid ${removeTarget === 'redact' ? '#ef4444' : '#f59e0b'}`, whiteSpace: 'nowrap', overflow: 'hidden' }}
          onMouseDown={e => e.stopPropagation()}
        >
          <span className="px-2.5 py-1.5" style={{ color: removeTarget === 'redact' ? '#fca5a5' : '#fde68a' }}>
            {removeTarget === 'redact' ? '🔲 Sansür Seçili' : '🟡 Renk Seçili'}
          </span>
          <button
            data-testid={`remove-${removeTarget}-btn`}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFormatting(); }}
            className="px-2.5 py-1.5 font-semibold transition-colors hover:opacity-80"
            style={{ background: removeTarget === 'redact' ? '#ef4444' : '#f59e0b', color: '#fff', borderLeft: '1px solid rgba(255,255,255,0.15)' }}
          >
            Kaldır ✕
          </button>
        </div>
      )}
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
const VectorMenu = ({ pathId, position, zoom, onDelete, onAddImage, onAddAiImage, onClose, path, onChangeFill }) => (
  <div data-testid={`vector-menu-${pathId}`} className="absolute zet-card p-1 z-50 min-w-[140px] shadow-xl animate-fadeIn"
    style={{ left: position.x * zoom + 20, top: position.y * zoom }} onClick={e => e.stopPropagation()}>
    {path?.isClosed && (
      <label className="w-full px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2 cursor-pointer" style={{ color: 'var(--zet-text)' }}>
        <span className="w-3 h-3 rounded-sm border border-white/30" style={{ background: path.fillColor || path.color }} />
        Fill color
        <input type="color" value={path.fillColor || path.color || '#000000'} onChange={e => onChangeFill(pathId, e.target.value)} className="sr-only" />
      </label>
    )}
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
  zoomLevel, zoomRadius, magnifierPos, setMagnifierPos,
  magnifierBorderColor, magnifierGradientStart, magnifierGradientEnd, useMagnifierGradient,
  onAddPage, onCopyElement, onMirrorElement, onFlowText,
  rulerVisible, gridVisible, gridSize, snapToGrid, pageMargins: pageMarginsProp, eraserDragMode,
  columnCount = 1, columnGap = 20,
}) => {
  const toRoman = (n) => {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let r = ''; let num = n;
    for (let i = 0; i < vals.length; i++) { while (num >= vals[i]) { r += syms[i]; num -= vals[i]; } }
    return r;
  };
  const colSnap = (clickX) => {
    if (columnCount <= 1) return { x: margins.left, width: pageSize.width - margins.left - margins.right };
    const availW = pageSize.width - margins.left - margins.right;
    const colW = (availW - (columnCount - 1) * columnGap) / columnCount;
    const col = Math.max(0, Math.min(columnCount - 1, Math.floor((clickX - margins.left) / (colW + columnGap))));
    return { x: margins.left + col * (colW + columnGap), width: colW };
  };
  const canvasRef = useRef(null);
  const margins = { top: pageMarginsProp?.top ?? 40, bottom: pageMarginsProp?.bottom ?? 40, left: pageMarginsProp?.left ?? 40, right: pageMarginsProp?.right ?? 40 };
  const [editingId, setEditingId] = useState(null);
  const pendingEditRef = useRef(null);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [penAnchors, setPenAnchors] = useState([]); // [{x,y,hx,hy}] bezier anchors
  const penDragRef = useRef(null); // tracks drag state for handle creation
  const cropWasDraggedRef = useRef(false); // tracks if a crop handle was dragged this gesture
  const [penHandlePreview, setPenHandlePreview] = useState(null); // {x,y,hx,hy}
  const [cropTarget, setCropTarget] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropHandle, setCropHandle] = useState(null); // 'n'|'s'|'e'|'w'|'nw'|'ne'|'sw'|'se'|'move'
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef(null);
  const [elementMenu, setElementMenu] = useState(null);
  const [tableMenu, setTableMenu] = useState(null); // { elId, ri, ci, x, y }
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

  // Snap indicator: shows a crosshair when element snaps to a grid line
  const [snapIndicator, setSnapIndicator] = useState(null);

  // Auto-fit zoom: fill container width on mount and container resize
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const fit = () => {
      const w = container.clientWidth;
      if (w > 0 && pageSize?.width > 0) {
        const fitZoom = Math.max(0.25, Math.min(3, (w - 32) / pageSize.width));
        setZoom(fitZoom);
      }
    };
    const t = setTimeout(fit, 100);
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    return () => { clearTimeout(t); ro.disconnect(); };
  }, [canvasContainerRef, pageSize?.width, setZoom]);

  // Zoom tool - scroll towards cursor position
  useEffect(() => {
    const h = (e) => {
      if (activeTool === 'zoom' && canvasContainerRef.current?.contains(e.target)) {
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
    if (activeTool !== 'pen') { setPenAnchors([]); setPenHandlePreview(null); }
    setElementMenu(null);
    setVectorMenu(null);
    if (activeTool !== 'hand') { setSelectedVector(null); }
    // Auto-activate magnifier when zoom tool is selected
    if (activeTool === 'zoom') { setMagnifierActive(true); }
    else { setMagnifierActive(false); }
  }, [activeTool, canvasElements, selectedElement]);

  // Process pending edit after page switch - uses element ID, not coordinates
  useEffect(() => {
    if (!pendingEditRef.current || pendingEditRef.current.pageIdx !== currentPage) return;
    const { elementId, x, y } = pendingEditRef.current;
    pendingEditRef.current = null;
    const timer = setTimeout(() => {
      setElementMenu(null);
      setVectorMenu(null);
      if (elementId) {
        setEditingId(elementId);
        setSelectedElement(elementId);
      } else {
        const ml = margins.left;
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: ml, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: pageSize.width - margins.left - margins.right,
          lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
          bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
          gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
        };
        setCanvasElements(prev => [...prev, ne]); setEditingId(ne.id); setSelectedElement(ne.id);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentPage, canvasElements]); // eslint-disable-line react-hooks/exhaustive-deps


  const getCoords = useCallback((e, el) => {
    const r = el.getBoundingClientRect();
    const src = e.touches?.[0] || e.changedTouches?.[0] || e;
    return { x: (src.clientX - r.left) / zoom, y: (src.clientY - r.top) / zoom };
  }, [zoom]);

  const handleTextCommit = useCallback((id, text, isHtml = false) => {
    // Extract plain text for empty check
    const plainText = isHtml ? text.replace(/<[^>]*>/g, '').trim() : text.trim();
    if (!plainText) { const f = canvasElements.filter(el => el.id !== id); setCanvasElements(f); onSaveHistory(f); }
    else { 
      const el = canvasElements.find(e => e.id === id);
      const update = isHtml 
        ? { htmlContent: text, content: plainText }
        : { content: text, htmlContent: text.replace(/\n/g, '<br>') };
      const u = canvasElements.map(el => el.id === id ? { ...el, ...update } : el); 
      setCanvasElements(u); 
      onSaveHistory(u);
      
      // Check if text overflows the page and auto-add new page
      if (el && onAddPage) {
        const lineCount = (plainText || '').split('\n').length;
        const fontSize = el.fontSize || 16;
        const lineHeight = el.lineHeight || 1.5;
        const textHeight = lineCount * fontSize * lineHeight;
        const bottomY = el.y + textHeight;
        const pageBottom = pageSize.height - margins.bottom;
        if (bottomY > pageBottom) {
          onAddPage();
        }
      }
    }
    setEditingId(null);
  }, [canvasElements, setCanvasElements, onSaveHistory, pageSize.height, onAddPage, margins.bottom]);

  const [hoveredElementId, setHoveredElementId] = useState(null);

  // Remove element-level redaction
  const handleRemoveRedact = useCallback((id) => {
    const u = canvasElements.map(el => el.id === id ? { ...el, isRedacted: false } : el);
    setCanvasElements(u);
    onSaveHistory(u);
  }, [canvasElements, setCanvasElements, onSaveHistory]);

  // Remove element-level highlight
  const handleRemoveHighlight = useCallback((id) => {
    const u = canvasElements.map(el => el.id === id ? { ...el, isHighlighted: false, highlightColor: undefined } : el);
    setCanvasElements(u);
    onSaveHistory(u);
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
    if (dragging || resizing || draggingVector) return;
    
    // If clicking a different page, switch to it first then process the click
    if (pageIdx !== currentPage) {
      const coords = getCoords(e, e.currentTarget);
      // Look up elements from the target page's saved data (not canvasElements which is current page)
      const pageElements = doc?.pages?.[pageIdx]?.elements || [];
      const clickedEl = [...pageElements].reverse().find(el => el.type === 'text' && isPointInElement(coords.x, coords.y, el));
      pendingEditRef.current = { elementId: clickedEl?.id || null, x: coords.x, y: coords.y, pageIdx };
      changePage(pageIdx);
      return;
    }
    
    if (justSelectedRef.current) { justSelectedRef.current = false; return; }
    const { x, y } = getCoords(e, e.currentTarget);
    if (x < 0 || y < 0 || x > pageSize.width || y > pageSize.height) return;
    processCanvasClick(x, y, e);
  }, [activeTool, canvasElements, changePage, currentPage, doc, dragging, draggingVector, getCoords, pageSize, resizing, justSelectedRef]);

  const processCanvasClick = (x, y, e) => {
    setElementMenu(null);
    setVectorMenu(null);

    if (activeTool === 'text') {
      const cl = [...canvasElements].reverse().find(el => el.type === 'text' && isPointInElement(x, y, el));
      if (cl) { setEditingId(cl.id); setSelectedElement(cl.id); return; }
      const { x: colX, width: colWidth } = colSnap(x);
      const ne = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
        x: colX, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
        fontFamily: currentFont, color: currentColor, width: colWidth,
        lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
        bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
        gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
      };
      const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
    } else if (['triangle', 'square', 'circle', 'star', 'ring', 'hexagon', 'diamond', 'pentagon', 'heart', 'arrow', 'parallelogram'].includes(activeTool)) {
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
        const { x: colX2, width: colWidth2 } = colSnap(x);
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: colX2, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: colWidth2,
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
      // Skip if this was a drag (smooth anchor already committed in mouseUp)
      if (penDragRef.current?.wasDrag) { penDragRef.current = null; return; }
      // Auto-close: if near first point, close the path
      if (penAnchors.length > 2 && dist({ x, y }, penAnchors[0]) < 15 / zoom) {
        const newPath = {
          id: `vec_${Date.now()}`,
          anchors: penAnchors,
          points: penAnchors.map(a => ({ x: a.x, y: a.y })),
          size: 2, opacity: 100, color: currentColor, isPen: true, isClosed: true,
          fillColor: currentColor, fillOpacity: 30, image: null,
        };
        setDrawPaths(prev => [...prev, newPath]);
        setPenAnchors([]);
      } else {
        const anchor = { x, y, hx: 0, hy: 0 };
        setPenAnchors(prev => [...prev, anchor]);
      }
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
        const { x: colX3, width: colWidth3 } = colSnap(x);
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: colX3, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: colWidth3,
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
  };

  const handleCanvasDoubleClick = useCallback((e, pageIdx) => {
    if (activeTool === 'pen' && penAnchors.length > 1 && pageIdx === currentPage) {
      const newPath = {
        id: `vec_${Date.now()}`,
        anchors: penAnchors,
        points: penAnchors.map(a => ({ x: a.x, y: a.y })),
        size: 2, opacity: 100, color: currentColor, isPen: true, image: null,
      };
      setDrawPaths(prev => [...prev, newPath]);
      setPenAnchors([]);
    }
  }, [activeTool, currentColor, currentPage, penAnchors, setDrawPaths]);

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
    
    if (activeTool === 'pen') {
      penDragRef.current = { startX: x, startY: y, wasDrag: false };
      setIsDrawing(true);
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
    if (activeTool === 'cut' && cropTarget && cropRect) {
      const r = cropRect;
      const hw = 10 / zoom;
      const handles = {
        nw: { x: r.x, y: r.y }, ne: { x: r.x + r.w, y: r.y },
        sw: { x: r.x, y: r.y + r.h }, se: { x: r.x + r.w, y: r.y + r.h },
        n: { x: r.x + r.w / 2, y: r.y }, s: { x: r.x + r.w / 2, y: r.y + r.h },
        w: { x: r.x, y: r.y + r.h / 2 }, e: { x: r.x + r.w, y: r.y + r.h / 2 },
      };
      for (const [name, pos] of Object.entries(handles)) {
        if (Math.abs(x - pos.x) <= hw && Math.abs(y - pos.y) <= hw) {
          setCropHandle(name);
          setCropStart({ x, y, rect: { ...cropRect } });
          return;
        }
      }
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        setCropHandle('move');
        setCropDragging(true);
        setCropStart({ x, y, rect: { ...cropRect } });
      }
      return;
    }

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
    
    if (activeTool === 'hand') {
      const hitEl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (hitEl && editingId !== hitEl.id) {
        setSelectedElement(hitEl.id);
        setSelectedElements([hitEl.id]);
        setDragging(hitEl.id);
        setDragOffset({ x: x - hitEl.x, y: y - hitEl.y });
      } else if (!hitEl) {
        setSelectedElement(null);
        setSelectedElements([]);
        // Start canvas pan
        setIsPanning(true);
        panStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          scrollLeft: canvasContainerRef.current?.scrollLeft || 0,
          scrollTop: canvasContainerRef.current?.scrollTop || 0,
        };
      }
      return;
    }
    if (activeTool === 'text') {
      const el = canvasElements.find(el => el.id === selectedElement);
      if (el && isPointInElement(x, y, el) && editingId !== el.id) { setDragging(el.id); setDragOffset({ x: x - el.x, y: y - el.y }); }
    }
  }, [activeTool, canvasElements, cropRect, cropTarget, currentPage, drawPaths, editingId, getCoords, selectedElement, selectedElements, selectedVector]);

  const handleMouseMove = useCallback((e, pageIdx) => {
    if (pageIdx !== currentPage) return;
    const { x, y } = getCoords(e, e.currentTarget);
    
    // Right-click rectangle selection
    if (isRectSelecting && rectSelectStart) {
      setRectSelectEnd({ x, y });
      return;
    }
    
    if (activeTool === 'pen' && penDragRef.current && isDrawing) {
      const dx = x - penDragRef.current.startX;
      const dy = y - penDragRef.current.startY;
      if (!penDragRef.current.wasDrag && Math.sqrt(dx * dx + dy * dy) > 4) {
        penDragRef.current.wasDrag = true;
      }
      if (penDragRef.current.wasDrag) {
        penDragRef.current.currentHx = dx;
        penDragRef.current.currentHy = dy;
        setPenHandlePreview({ x: penDragRef.current.startX, y: penDragRef.current.startY, hx: dx, hy: dy });
      }
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
    if (isPanning && panStartRef.current && canvasContainerRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      canvasContainerRef.current.scrollLeft = panStartRef.current.scrollLeft - dx;
      canvasContainerRef.current.scrollTop = panStartRef.current.scrollTop - dy;
      return;
    }
    if ((cropDragging || cropHandle) && cropStart) {
      cropWasDraggedRef.current = true;
      const dx = x - cropStart.x;
      const dy = y - cropStart.y;
      const r = cropStart.rect;
      const minSide = 20 / zoom;
      let nx = r.x, ny = r.y, nw = r.w, nh = r.h;
      if (cropHandle === 'move' || cropDragging) { nx = r.x + dx; ny = r.y + dy; }
      else {
        if (cropHandle?.includes('n')) { ny = r.y + dy; nh = Math.max(minSide, r.h - dy); }
        if (cropHandle?.includes('s')) { nh = Math.max(minSide, r.h + dy); }
        if (cropHandle?.includes('w')) { nx = r.x + dx; nw = Math.max(minSide, r.w - dx); }
        if (cropHandle?.includes('e')) { nw = Math.max(minSide, r.w + dx); }
      }
      setCropRect({ x: nx, y: ny, w: nw, h: nh });
      return;
    }
    
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
    
    if (dragging) {
      const draggedEl = canvasElements.find(el => el.id === dragging);
      if (draggedEl && draggedEl.groupId) {
        // Move all elements in the group
        const dx = (x - dragOffset.x) - draggedEl.x;
        const dy = (y - dragOffset.y) - draggedEl.y;
        setCanvasElements(p => p.map(i => i.groupId === draggedEl.groupId
          ? { ...i, x: Math.max(0, i.x + dx), y: Math.max(0, i.y + dy) }
          : i
        ));
      } else if (draggedEl) {
        const gs = gridSize || 20;
        const rawX = Math.max(0, x - dragOffset.x);
        const rawY = Math.max(0, y - dragOffset.y);
        const snapToGridVal = (v) => snapToGrid ? Math.round(v / gs) * gs : v;
        const snappedX = snapToGridVal(rawX);
        const snappedY = snapToGridVal(rawY);
        setCanvasElements(p => p.map(i => i.id === dragging ? { ...i, x: snappedX, y: snappedY } : i));
        if (snapToGrid && (Math.abs(rawX - snappedX) < 6 || Math.abs(rawY - snappedY) < 6)) {
          setSnapIndicator({ x: snappedX, y: snappedY });
        } else {
          setSnapIndicator(null);
        }
      }
    }
    if (resizing) {
      if (resizing.isText) {
        setCanvasElements(p => p.map(el => el.id === resizing.id ? { ...el, width: Math.max(60, x - resizing.startX) } : el));
      } else {
        setCanvasElements(p => p.map(el => {
          if (el.id !== resizing.id) return el;
          const newW = Math.max(30, x - resizing.startX);
          const newH = Math.max(30, y - resizing.startY);
          if (el.type === 'table' && resizing.origWidth) {
            const scale = newW / resizing.origWidth;
            const newFontSize = Math.max(8, Math.round((resizing.origFontSize || 12) * scale));
            return { ...el, width: newW, height: newH, tableFontSize: newFontSize };
          }
          return { ...el, width: newW, height: newH };
        }));
      }
    }
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
      if (eraserDragMode !== false) {
        // DRAG MODE: partial path erasing — split paths at erased points
        setDrawPaths(prev => {
          const newPaths = [];
          prev.forEach(path => {
            const isNearEraser = pt => eraserTrail.some(ep => dist(pt, ep) < r);
            let segment = [];
            path.points.forEach(pt => {
              if (isNearEraser(pt)) {
                if (segment.length > 1) newPaths.push({ ...path, points: segment });
                segment = [];
              } else {
                segment.push(pt);
              }
            });
            if (segment.length > 1) newPaths.push({ ...path, points: segment });
          });
          return newPaths;
        });
        // Silgi yolu üzerindeki elementleri bounding-box ile tespit et
        const elementsToRemove = canvasElements.filter(el => {
          if (el.locked || el.hidden) return false;
          return eraserTrail.some(ep => isPointInElement(ep.x, ep.y, el));
        });
        if (elementsToRemove.length > 0) {
          const updatedElements = canvasElements.filter(el => !elementsToRemove.includes(el));
          setCanvasElements(updatedElements);
          onSaveHistory(updatedElements);
        }
      } else {
        // CLICK MODE: remove only at the single click point
        const clickPt = eraserTrail[0];
        setDrawPaths(prev => prev.filter(path => !path.points.some(pp => dist(pp, clickPt) < r)));
        const elementsToRemove = canvasElements.filter(el => {
          if (el.locked || el.hidden) return false;
          return clickPt.x >= el.x && clickPt.x <= el.x + (el.width || 50) &&
                 clickPt.y >= el.y && clickPt.y <= el.y + (el.height || el.fontSize || 16);
        });
        if (elementsToRemove.length > 0) {
          const updatedElements = canvasElements.filter(el => !elementsToRemove.includes(el));
          setCanvasElements(updatedElements);
          onSaveHistory(updatedElements);
        }
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
    if (activeTool === 'pen' && penDragRef.current) {
      if (penDragRef.current.wasDrag) {
        const hx = penDragRef.current.currentHx || 0;
        const hy = penDragRef.current.currentHy || 0;
        const anchor = { x: penDragRef.current.startX, y: penDragRef.current.startY, hx, hy };
        setPenAnchors(prev => [...prev, anchor]);
      }
      setPenHandlePreview(null);
      penDragRef.current = penDragRef.current.wasDrag ? { wasDrag: true } : null;
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    if (draggingVector !== null) setDraggingVector(null);
    // Keep magnifier active while zoom tool is selected
    if (activeTool !== 'zoom') setMagnifierActive(false);
    setIsDrawing(false); setCurrentPath([]); setEraserTrail([]); setLassoPath([]);
    setSelectionRect(null); setSelectionStart(null);
    if (cropWasDraggedRef.current) { applyCrop(); }
    cropWasDraggedRef.current = false;
    setCropDragging(false); setCropStart(null); setCropHandle(null);
    setIsPanning(false); panStartRef.current = null;
    setDragging(null); setResizing(null);
    setSnapIndicator(null);
  }, [activeTool, applyCrop, canvasElements, currentColor, currentPath, draggingVector, drawOpacity, drawPaths, drawSize, dragging, eraserDragMode, eraserSize, eraserTrail, isDrawing, isRectSelecting, lassoPath, markingColor, markingOpacity, markingSize, onSaveHistory, rectSelectEnd, rectSelectStart, resizing, setDrawPaths, setSelectedElements]);

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

  // Change fill color of closed vector path
  const handleChangeFillColor = useCallback((idx, color) => {
    setDrawPaths(prev => prev.map((p, i) => i === idx ? { ...p, fillColor: color } : p));
  }, [setDrawPaths]);

  const getCursor = () => ({ text: 'text', hand: draggingVector !== null ? 'grabbing' : 'grab', draw: 'crosshair', pen: 'crosshair', eraser: 'cell', cut: 'crosshair', select: 'crosshair', marking: 'crosshair', translate: 'help' }[activeTool] || 'crosshair');

  const pageBg = pageBackground || '#ffffff';

  // Render vector paths with images and selection
  const renderVectorPaths = (paths, pageIdx) => {
    return paths.filter(p => !p.isHighlight).map((path, i) => {
      const isSelected = idx === currentPage && selectedVector === i && path.isPen;
      const bounds = path.isPen ? getPathBounds(path) : null;
      const pathD = path.isPen ? `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}${path.isClosed ? ' Z' : ''}` : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`;

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
            fill={path.isClosed && !path.image ? `${path.fillColor || path.color}${Math.round(((path.fillOpacity ?? 20) / 100) * 255).toString(16).padStart(2, '0')}` : path.isPen && !path.image ? `${path.color}14` : 'none'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      );
    });
  };

  return (
    <div ref={canvasContainerRef} data-testid="canvas-container" className="h-full overflow-auto py-4 px-0" style={{ background: 'var(--zet-bg)', touchAction: activeTool === 'hand' ? 'pan-x pan-y' : 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      <style>{`[contenteditable]::selection { background: rgba(76,168,173,0.35); } [contenteditable] *::selection { background: rgba(76,168,173,0.35); }`}</style>
      <div className="flex flex-col items-center gap-3">
        {doc.pages?.map((page, idx) => (
          <div key={page.page_id} data-testid={`canvas-page-${idx}`} ref={idx === currentPage ? canvasRef : null}
            className={`shadow-xl relative select-none transition-all duration-200 ${idx === currentPage ? 'ring-2' : 'opacity-70 hover:opacity-90'}`}
            style={{ width: (page.pageSize?.width || pageSize.width) * zoom, height: (page.pageSize?.height || pageSize.height) * zoom, ringColor: 'var(--zet-primary-light)', cursor: getCursor(), background: pageBg, touchAction: activeTool === 'hand' ? 'manipulation' : (['draw', 'pen', 'eraser'].includes(activeTool) ? 'none' : 'pan-y') }}
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
            onTouchStart={(e) => {
              if (['draw', 'pen', 'eraser'].includes(activeTool)) { e.stopPropagation(); handleMouseDown(e, idx); return; }
              if (activeTool === 'hand') {
                // Check if touching an element — if yes, start drag; else let container scroll
                const t = e.touches[0];
                const rect = e.currentTarget.getBoundingClientRect();
                const tx = (t.clientX - rect.left) / zoom;
                const ty = (t.clientY - rect.top) / zoom;
                const hit = [...canvasElements].reverse().find(el => isPointInElement(tx, ty, el));
                if (hit) { e.preventDefault(); handleMouseDown(e, idx); }
                return;
              }
              handleMouseDown(e, idx);
            }}
            onTouchMove={(e) => {
              if (['draw', 'pen', 'eraser'].includes(activeTool)) { e.stopPropagation(); handleMouseMove(e, idx); return; }
              if (activeTool === 'hand') {
                if (dragging || resizing) { e.preventDefault(); handleMouseMove(e, idx); }
                return;
              }
              handleMouseMove(e, idx);
            }}
            onTouchEnd={(e) => {
              if (activeTool === 'hand' && (dragging || resizing)) { handleMouseUp(e); return; }
              if (activeTool !== 'hand') handleMouseUp(e);
            }}>
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>
            
            {/* Ruler - Horizontal */}
            {rulerVisible && idx === currentPage && (
              <>
                {/* Horizontal ruler — sayfa üzerinde sabit şerit */}
                <div
                  className="absolute left-0 flex items-end pointer-events-none"
                  style={{
                    top: 0, height: 20, width: (page.pageSize?.width || pageSize.width) * zoom,
                    background: 'rgba(30,30,50,0.82)', zIndex: 10, borderBottom: '1px solid rgba(100,100,220,0.5)',
                  }}
                >
                  {Array.from({ length: Math.ceil((page.pageSize?.width || pageSize.width) / 50) + 1 }).map((_, i) => (
                    <div key={`rh${i}`} className="flex-shrink-0 relative" style={{ width: 50 * zoom }}>
                      <div style={{ position: 'absolute', left: 0, bottom: 0, height: i % 2 === 0 ? 10 : 5, width: 1, background: 'rgba(180,180,255,0.7)' }} />
                      {i > 0 && i % 2 === 0 && (
                        <span style={{ position: 'absolute', left: 2, bottom: 11, fontSize: 7, color: 'rgba(200,200,255,0.95)', userSelect: 'none', whiteSpace: 'nowrap' }}>
                          {i * 50}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Vertical ruler — sayfa solunda sabit şerit */}
                <div
                  className="absolute top-0 pointer-events-none"
                  style={{
                    left: 0, width: 20, height: (page.pageSize?.height || pageSize.height) * zoom,
                    background: 'rgba(30,30,50,0.82)', zIndex: 10, borderRight: '1px solid rgba(100,100,220,0.5)',
                  }}
                >
                  {Array.from({ length: Math.ceil((page.pageSize?.height || pageSize.height) / 50) + 1 }).map((_, i) => (
                    <div key={`rv${i}`} className="relative" style={{ position: 'absolute', top: i * 50 * zoom, left: 0, width: 20, height: 1 }}>
                      <div style={{ position: 'absolute', right: 0, top: 0, width: i % 2 === 0 ? 10 : 6, height: 1, background: 'rgba(180,180,255,0.7)' }} />
                      {i % 2 === 0 && (
                        <span style={{ position: 'absolute', left: 2, top: -5, fontSize: 8, color: 'rgba(180,180,255,0.9)', userSelect: 'none', writingMode: 'horizontal-tb' }}>{i * 50}</span>
                      )}
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
                    <path d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`} fill="none" stroke="rgba(100,100,220,0.55)" strokeWidth="0.8" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            )}
            
            {/* Margin guides */}
            {idx === currentPage && (
              <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
                <div style={{ position: 'absolute', left: margins.left * zoom, top: 0, width: 0, height: '100%', borderLeft: '1px dashed rgba(100,180,200,0.25)' }} />
                <div style={{ position: 'absolute', right: margins.right * zoom, top: 0, width: 0, height: '100%', borderRight: '1px dashed rgba(100,180,200,0.25)' }} />
                <div style={{ position: 'absolute', left: 0, top: margins.top * zoom, width: '100%', height: 0, borderTop: '1px dashed rgba(100,180,200,0.25)' }} />
                <div style={{ position: 'absolute', left: 0, bottom: margins.bottom * zoom, width: '100%', height: 0, borderBottom: '1px dashed rgba(100,180,200,0.25)' }} />
              </div>
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
                const pathD = path.isPen
                  ? (path.anchors ? computeBezierPath(path.anchors, zoom, path.isClosed) : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}${path.isClosed ? ' Z' : ''}`)
                  : `M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`;
                
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
                      fill={path.isClosed && !path.image ? `${path.fillColor || path.color}${Math.round(((path.fillOpacity ?? 20) / 100) * 255).toString(16).padStart(2, '0')}` : path.isPen && !path.image ? `${path.color}14` : 'none'}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </g>
                );
              })}
              {/* Active drawing — only on current page */}
              {idx === currentPage && isDrawing && (activeTool === 'draw' || activeTool === 'marking') && currentPath.length > 1 && <path d={`M ${currentPath.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={activeTool === 'marking' ? (markingColor || '#FFFF00') : currentColor} strokeWidth={(activeTool === 'marking' ? (markingSize || 20) : drawSize) * zoom} strokeOpacity={activeTool === 'marking' ? (markingOpacity || 40) / 100 : drawOpacity / 100} fill="none" strokeLinecap={activeTool === 'marking' ? 'butt' : 'round'} />}
              {/* Pen tool preview — bezier with control handles */}
              {idx === currentPage && penAnchors.length > 0 && (
                <>
                  <path d={computeBezierPath(penAnchors, zoom, false)} stroke={currentColor} strokeWidth={2 * zoom} fill="none" strokeDasharray="4,4" />
                  {penAnchors.map((a, i) => (
                    <g key={i}>
                      {(a.hx !== 0 || a.hy !== 0) && (<>
                        <line x1={a.x*zoom} y1={a.y*zoom} x2={(a.x+a.hx)*zoom} y2={(a.y+a.hy)*zoom} stroke="#fff" strokeWidth={1} strokeOpacity={0.7} />
                        <line x1={a.x*zoom} y1={a.y*zoom} x2={(a.x-a.hx)*zoom} y2={(a.y-a.hy)*zoom} stroke="#fff" strokeWidth={1} strokeOpacity={0.7} />
                        <circle cx={(a.x+a.hx)*zoom} cy={(a.y+a.hy)*zoom} r={3} fill="#fff" stroke={currentColor} strokeWidth={1} />
                        <circle cx={(a.x-a.hx)*zoom} cy={(a.y-a.hy)*zoom} r={3} fill="#fff" stroke={currentColor} strokeWidth={1} />
                      </>)}
                      <circle cx={a.x*zoom} cy={a.y*zoom} r={i === 0 ? 6 : 4} fill={i === 0 ? '#4ca8ad' : currentColor} stroke="#fff" strokeWidth={1.5} />
                    </g>
                  ))}
                  {penHandlePreview && (<>
                    <line x1={penHandlePreview.x*zoom} y1={penHandlePreview.y*zoom} x2={(penHandlePreview.x+penHandlePreview.hx)*zoom} y2={(penHandlePreview.y+penHandlePreview.hy)*zoom} stroke="#4ca8ad" strokeWidth={1.5} />
                    <line x1={penHandlePreview.x*zoom} y1={penHandlePreview.y*zoom} x2={(penHandlePreview.x-penHandlePreview.hx)*zoom} y2={(penHandlePreview.y-penHandlePreview.hy)*zoom} stroke="#4ca8ad" strokeWidth={1.5} />
                    <circle cx={(penHandlePreview.x+penHandlePreview.hx)*zoom} cy={(penHandlePreview.y+penHandlePreview.hy)*zoom} r={4} fill="#4ca8ad" />
                    <circle cx={(penHandlePreview.x-penHandlePreview.hx)*zoom} cy={(penHandlePreview.y-penHandlePreview.hy)*zoom} r={4} fill="#4ca8ad" />
                  </>)}
                </>
              )}
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
              {/* Snap indicator crosshair */}
              {snapIndicator && idx === currentPage && (
                <g>
                  <circle cx={snapIndicator.x * zoom} cy={snapIndicator.y * zoom} r={6} fill="none" stroke="#3b82f6" strokeWidth={1.5} />
                  <line x1={(snapIndicator.x - 8) * zoom} y1={snapIndicator.y * zoom} x2={(snapIndicator.x + 8) * zoom} y2={snapIndicator.y * zoom} stroke="#3b82f6" strokeWidth={1} />
                  <line x1={snapIndicator.x * zoom} y1={(snapIndicator.y - 8) * zoom} x2={snapIndicator.x * zoom} y2={(snapIndicator.y + 8) * zoom} stroke="#3b82f6" strokeWidth={1} />
                </g>
              )}
              {/* Crop overlay */}
              {cropTarget && cropRect && idx === currentPage && (
                <>
                  <rect x={0} y={0} width="100%" height="100%" fill="rgba(0,0,0,0.38)" />
                  {/* Transparent clear window */}
                  <rect x={cropRect.x * zoom} y={cropRect.y * zoom} width={cropRect.w * zoom} height={cropRect.h * zoom} fill="rgba(255,255,255,0.05)" stroke="#4ca8ad" strokeWidth={2} strokeDasharray="6,3" />
                  {/* Resize handles */}
                  {[
                    { id: 'nw', cx: cropRect.x, cy: cropRect.y, cur: 'nwse-resize' },
                    { id: 'ne', cx: cropRect.x + cropRect.w, cy: cropRect.y, cur: 'nesw-resize' },
                    { id: 'sw', cx: cropRect.x, cy: cropRect.y + cropRect.h, cur: 'nesw-resize' },
                    { id: 'se', cx: cropRect.x + cropRect.w, cy: cropRect.y + cropRect.h, cur: 'nwse-resize' },
                    { id: 'n', cx: cropRect.x + cropRect.w / 2, cy: cropRect.y, cur: 'ns-resize' },
                    { id: 's', cx: cropRect.x + cropRect.w / 2, cy: cropRect.y + cropRect.h, cur: 'ns-resize' },
                    { id: 'w', cx: cropRect.x, cy: cropRect.y + cropRect.h / 2, cur: 'ew-resize' },
                    { id: 'e', cx: cropRect.x + cropRect.w, cy: cropRect.y + cropRect.h / 2, cur: 'ew-resize' },
                  ].map(h => (
                    <rect key={h.id} x={h.cx * zoom - 5} y={h.cy * zoom - 5} width={10} height={10}
                      fill="white" stroke="#4ca8ad" strokeWidth={1.5} rx={2} style={{ cursor: h.cur }} />
                  ))}
                </>
              )}
            </svg>
            
            {/* Magnifier effect - real zoom */}
            {activeTool === 'zoom' && magnifierActive && idx === currentPage && (() => {
              const r = zoomRadius || 80;
              const lv = zoomLevel || 2;
              const mx = magnifierPosition.x;
              const my = magnifierPosition.y;
              const pw = (page.pageSize?.width || pageSize.width) * zoom;
              const ph = (page.pageSize?.height || pageSize.height) * zoom;
              const bw = 4;
              const borderBg = useMagnifierGradient
                ? `linear-gradient(135deg, ${magnifierGradientStart || '#60a5fa'}, ${magnifierGradientEnd || '#a855f7'})`
                : (magnifierBorderColor || '#60a5fa');
              const accentColor = magnifierBorderColor || '#60a5fa';
              return (
                <div
                  className="absolute pointer-events-none z-50"
                  style={{
                    left: mx * zoom - r - bw,
                    top: my * zoom - r - bw,
                    width: (r + bw) * 2,
                    height: (r + bw) * 2,
                    borderRadius: '50%',
                    background: borderBg,
                    padding: bw,
                    boxShadow: '0 4px 28px rgba(0,0,0,0.6)',
                  }}
                >
                  <div style={{ width: '100%', height: '100%', borderRadius: '50%', overflow: 'hidden', position: 'relative' }}>
                    {/* Page background + elements re-rendered at magnified scale */}
                    <div style={{
                      position: 'absolute',
                      width: pw,
                      height: ph,
                      background: pageBg,
                      transform: `scale(${lv})`,
                      transformOrigin: '0 0',
                      left: r - mx * zoom * lv,
                      top: r - my * zoom * lv,
                    }}>
                      {canvasElements.filter(el => !el.hidden).map(el => {
                        const base = { position: 'absolute', left: el.x * zoom, top: el.y * zoom, width: (el.width || 100) * zoom, pointerEvents: 'none' };
                        if (el.type === 'text') return (
                          <div key={el.id} style={{ ...base, height: 'auto', fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial', color: el.color || '#000', fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal', textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none', lineHeight: el.lineHeight || 1.5, textAlign: el.textAlign || 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} dangerouslySetInnerHTML={{ __html: el.htmlContent || (el.content || '').replace(/\n/g, '<br>') }} />
                        );
                        if (el.type === 'image' || el.type === 'chart') return (
                          <img key={el.id} src={el.src} alt="" style={{ ...base, height: (el.height || 100) * zoom, objectFit: 'contain' }} draggable={false} />
                        );
                        return null;
                      })}
                    </div>
                    {/* Crosshair */}
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: `${accentColor}70`, transform: 'translateY(-50%)' }} />
                    <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: `${accentColor}70`, transform: 'translateX(-50%)' }} />
                    {/* Zoom badge */}
                    <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,0.75)', color: accentColor, fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 4 }}>{lv}×</div>
                  </div>
                </div>
              );
            })()}
            
            {/* Vector menu */}
            {vectorMenu && idx === currentPage && (
              <VectorMenu
                pathId={vectorMenu.idx}
                position={vectorMenu.position}
                zoom={zoom}
                path={drawPaths[vectorMenu.idx]}
                onDelete={handleDeleteVector}
                onAddImage={handleAddImageToVector}
                onAddAiImage={handleAddAiImageToVector}
                onClose={() => setVectorMenu(null)}
                onChangeFill={handleChangeFillColor}
              />
            )}
            
            {(idx === currentPage ? canvasElements : page.elements || []).filter(el => !el.hidden).map(el => {
              const isSel = (selectedElement === el.id || selectedElements.includes(el.id)) && editingId !== el.id;
              const isLocked = el.locked;
              // Mirror transform
              const scaleX = el.scaleX || 1;
              const scaleY = el.scaleY || 1;
              const rotation = el.rotation || 0;
              const transformStyle = `scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`;
              return (
                <div key={el.id} data-testid={`canvas-element-${el.id}`} className={`absolute ${isSel ? 'ring-2 ring-blue-500' : ''} ${isLocked ? 'pointer-events-none' : ''} ${el.groupId && isSel ? 'ring-blue-400 ring-opacity-60' : ''}`}
                  style={{
                    left: el.x * zoom,
                    top: el.y * zoom,
                    width: el.type === 'text' ? (el.width ? el.width * zoom : 'auto') : (el.width || 80) * zoom,
                    height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto',
                    cursor: activeTool === 'redact' ? 'crosshair' : activeTool === 'highlighter' ? 'cell' : activeTool === 'hand' && !isLocked ? 'move' : undefined,
                    transform: transformStyle,
                    transformOrigin: 'center center'
                  }}
                  onMouseEnter={() => setHoveredElementId(el.id)}
                  onMouseLeave={() => setHoveredElementId(null)}
                  onClick={(e) => {
                    if (isLocked) return;
                    e.stopPropagation();
                    if (activeTool === 'redact') {
                      const updated = canvasElements.map(x => x.id === el.id ? { ...x, isRedacted: !x.isRedacted } : x);
                      setCanvasElements(updated); onSaveHistory(updated); return;
                    }
                    if (activeTool === 'highlighter') {
                      const alreadyHighlighted = el.isHighlighted;
                      const updated = canvasElements.map(x => x.id === el.id ? { ...x, isHighlighted: !alreadyHighlighted, highlightColor: alreadyHighlighted ? undefined : (markingColor || '#fbbf24') } : x);
                      setCanvasElements(updated); onSaveHistory(updated); return;
                    }
                    setSelectedElement(el.id); if (idx !== currentPage) changePage(idx); if (onElementSelect) onElementSelect(el);
                  }}>
                  {el.groupId && isSel && (
                    <div className="absolute -top-5 left-0 text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.8)', color: '#fff' }}>G</div>
                  )}
                  {el.type === 'text' && <><EditableText el={el} zoom={zoom} pageWidth={page.pageSize?.width || pageSize.width} pageMargins={margins} isEditing={editingId === el.id && idx === currentPage} onStartEdit={id => { if (idx !== currentPage) { pendingEditRef.current = { elementId: id, x: 0, y: 0, pageIdx: idx }; changePage(idx); } else { setEditingId(id); } }} onCommit={handleTextCommit} pageHeight={page.pageSize?.height || pageSize.height} onAutoAddPage={onAddPage} onFlowText={onFlowText ? (overflowHtml) => onFlowText({ elementId: el.id, overflowHtml, el }) : undefined} onRemoveRedact={handleRemoveRedact} />
                    {isSel && !isLocked && editingId !== el.id && (
                      <div data-testid={`text-resize-${el.id}`} className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm opacity-70 hover:opacity-100" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y, isText: true, startWidth: el.width || (page.pageSize?.width || pageSize.width) - el.x - 20 }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y, isText: true, startWidth: el.width || (page.pageSize?.width || pageSize.width) - el.x - 20 }); }} />
                    )}
                  </>}
                  {(el.type === 'image' || el.type === 'chart') && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className={`w-full h-full object-contain ${el.isRedacted ? 'invisible' : ''}`} draggable={false} />
                      {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                      {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.35, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'table' && el.tableData && (() => {
                    const tblOps = {
                      addRow: (after) => { setCanvasElements(prev => prev.map(x => { if (x.id !== el.id) return x; const cols = x.tableData[0]?.length || 1; const blank = Array(cols).fill(''); const d = [...x.tableData]; d.splice(after + 1, 0, blank); return { ...x, tableData: d, rows: d.length }; })); setTableMenu(null); },
                      delRow: (ri) => { setCanvasElements(prev => prev.map(x => { if (x.id !== el.id || x.tableData.length <= 1) return x; const d = x.tableData.filter((_, i) => i !== ri); return { ...x, tableData: d, rows: d.length }; })); setTableMenu(null); },
                      addCol: (after) => { setCanvasElements(prev => prev.map(x => { if (x.id !== el.id) return x; const d = x.tableData.map(r => { const nr = [...r]; nr.splice(after + 1, 0, ''); return nr; }); return { ...x, tableData: d, cols: d[0].length }; })); setTableMenu(null); },
                      delCol: (ci) => { setCanvasElements(prev => prev.map(x => { if (x.id !== el.id || (x.tableData[0]?.length || 0) <= 1) return x; const d = x.tableData.map(r => r.filter((_, i) => i !== ci)); return { ...x, tableData: d, cols: d[0].length }; })); setTableMenu(null); },
                      toggleHeader: () => { setCanvasElements(prev => prev.map(x => x.id === el.id ? { ...x, tableHeader: !x.tableHeader } : x)); setTableMenu(null); },
                    };
                    return (
                      <div className="relative w-full h-full group" data-testid={`editable-table-${el.id}`} onClick={() => tableMenu?.elId === el.id && setTableMenu(null)}>
                        <table style={{ width: '100%', height: '100%', borderCollapse: 'collapse', fontSize: Math.max(8, (el.tableFontSize || 12) * zoom) + 'px', tableLayout: 'fixed' }}>
                          <tbody>
                            {el.tableData.map((row, ri) => (
                              <tr key={ri}>
                                {row.map((cell, ci) => (
                                  <td key={ci} data-testid={`table-cell-${el.id}-${ri}-${ci}`}
                                    contentEditable suppressContentEditableWarning
                                    style={{ border: '1px solid rgba(150,150,150,0.6)', padding: '3px 6px', minWidth: 30, verticalAlign: 'top', outline: 'none', cursor: 'text', wordBreak: 'break-word', whiteSpace: 'pre-wrap', background: ri === 0 && el.tableHeader ? 'rgba(76,168,173,0.25)' : 'transparent', color: 'var(--zet-text)', fontWeight: ri === 0 && el.tableHeader ? 'bold' : 'normal' }}
                                    ref={(node) => { if (node && document.activeElement !== node) node.innerHTML = cell; }}
                                    onFocus={e => e.stopPropagation()}
                                    onBlur={e => { const val = e.target.innerText; setCanvasElements(prev => prev.map(x => { if (x.id !== el.id) return x; const newData = x.tableData.map((r, rri) => r.map((c, cci) => (rri === ri && cci === ci) ? val : c)); return { ...x, tableData: newData }; })); }}
                                    onMouseDown={e => e.stopPropagation()}
                                    onContextMenu={e => { e.preventDefault(); e.stopPropagation(); setTableMenu({ elId: el.id, ri, ci, x: e.clientX, y: e.clientY }); }}
                                  />
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {/* Table context menu */}
                        {tableMenu?.elId === el.id && (
                          <div className="fixed z-[9999] rounded-lg shadow-xl py-1 min-w-[160px]" style={{ left: tableMenu.x, top: tableMenu.y, background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }} onMouseDown={e => e.stopPropagation()}>
                            {[
                              { label: '+ Satır Ekle (Alta)', action: () => tblOps.addRow(tableMenu.ri) },
                              { label: '− Satırı Sil', action: () => tblOps.delRow(tableMenu.ri) },
                              { label: '+ Sütun Ekle (Sağa)', action: () => tblOps.addCol(tableMenu.ci) },
                              { label: '− Sütunu Sil', action: () => tblOps.delCol(tableMenu.ci) },
                              null,
                              { label: el.tableHeader ? '✓ Başlık Satırı Kaldır' : '☐ Başlık Satırı Yap', action: tblOps.toggleHeader },
                            ].map((item, i) => item ? (
                              <button key={i} onClick={item.action} className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/10 transition-colors" style={{ color: 'var(--zet-text)' }}>{item.label}</button>
                            ) : <div key={i} className="border-t my-1" style={{ borderColor: 'var(--zet-border)' }} />)}
                          </div>
                        )}
                        {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y, origWidth: el.width || 200, origFontSize: el.tableFontSize || 12 }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y, origWidth: el.width || 200, origFontSize: el.tableFontSize || 12 }); }} />
                          <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                          {elementMenu === el.id && <ElementMenu el={{...el, type: 'table'}} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                        </>)}
                      </div>
                    );
                  })()}
                  {el.type === 'table' && !el.tableData && el.src && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="relative w-full h-full group">
                      <ShapeRenderer el={el} />
                      {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                      {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.35, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={onAddImageToShape} onAddAiImage={onAddAiImageToShape} onCopy={onCopyElement} onMirror={onMirrorElement} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {hoveredElementId === el.id && (el.isRedacted || el.isHighlighted) && editingId !== el.id && (
                    <button
                      className="absolute z-30 rounded-full flex items-center justify-center text-xs font-bold shadow-lg"
                      style={{ top: -8, right: -8, width: 20, height: 20, background: el.isRedacted ? '#ef4444' : '#f59e0b', color: '#fff', border: '2px solid rgba(255,255,255,0.8)' }}
                      onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onClick={(e) => { e.stopPropagation(); if (el.isRedacted) handleRemoveRedact(el.id); else handleRemoveHighlight(el.id); }}
                    >✕</button>
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
            {doc.pageNumbers?.enabled && (() => {
              const pn = doc.pageNumbers;
              const start = pn.start || 1;
              const num = idx + start;
              const total = (doc.pages?.length || 1) + start - 1;
              const fmt = (n) => {
                if (pn.format === 'roman') return toRoman(n).toLowerCase();
                if (pn.format === 'ROMAN') return toRoman(n);
                if (pn.format === 'alpha') return String.fromCharCode(96 + ((n - 1) % 26) + 1);
                return String(n);
              };
              const label = pn.style === 'n/total' ? `${fmt(num)} / ${fmt(total)}`
                : pn.style === 'page-n' ? `Sayfa ${fmt(num)}`
                : pn.style === 'page-n-of-total' ? `Sayfa ${fmt(num)} / ${fmt(total)}`
                : fmt(num);
              const isTop = pn.position?.includes('top');
              const isLeft = pn.position?.includes('left');
              const isRight = pn.position?.includes('right');
              return (
                <div className={`absolute ${isTop ? 'top-2' : 'bottom-2'} ${isLeft ? 'left-4' : isRight ? 'right-4' : 'left-0 right-0 text-center'} text-sm pointer-events-none`} style={{ color: 'var(--zet-text-muted)' }}>
                  {label}
                </div>
              );
            })()}

            {/* Column guides */}
            {columnCount > 1 && (() => {
              const availW = pageSize.width - margins.left - margins.right;
              const colW = (availW - (columnCount - 1) * columnGap) / columnCount;
              return Array.from({ length: columnCount - 1 }, (_, i) => {
                const x = (margins.left + (i + 1) * colW + i * columnGap + columnGap / 2) * zoom;
                return (
                  <div key={i} className="absolute pointer-events-none" style={{
                    left: x,
                    top: margins.top * zoom,
                    height: (pageSize.height - margins.top - margins.bottom) * zoom,
                    width: 1,
                    borderLeft: '1.5px dashed rgba(76,168,173,0.45)',
                  }} />
                );
              });
            })()}
          </div>
        ))}
      </div>
    </div>
  );
};
