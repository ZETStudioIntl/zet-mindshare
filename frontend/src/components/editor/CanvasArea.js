import React, { useRef, useEffect, useCallback, useState, memo } from 'react';
import { SHAPE_LIST } from './Toolbox';
import { SCRIPT_ELEMENT_TYPES, SCRIPT_TAB_CYCLE, SCRIPT_ENTER_NEXT, SCREENPLAY_PX_PER_CM } from '../../lib/editorConstants';
import { MoreVertical, Trash2, Image, RefreshCw, Wand2, Copy, FlipHorizontal2, EyeOff, Edit2 } from 'lucide-react';

// Senaryo sahne başlığı normalizer: "int ev gece" → "INT. EV - GECE"
// Turkish-aware: 'i' → 'İ' before toUpperCase()
function normalizeSceneHeading(text) {
  const upper = text.trim().replace(/i/g, 'İ').toUpperCase();
  const KW = /^([İI][ÇC]\.?\/D[Iİ][ŞS]\.?|[İI][ÇC]|D[Iİ][ŞS]|INT\.?\/EXT\.?|I\.?\/E\.?|INT|EXT|INTERIOR|EXTERIOR|INNEN|AUSSEN|INT[ÉE]RIEUR|EXT[ÉE]RIEUR|MEKAN|SAHNE|LOKASYON)(\s|$)/;
  const m = upper.match(KW);
  if (!m) return upper;
  const kw = m[1];
  const kwDot = kw.endsWith('.') ? kw : kw + '.';
  const rest = upper.slice(kw.length).trimStart();
  if (!rest) return kwDot;
  const TIME = /\s(DAY|NIGHT|MORNING|EVENING|DUSK|DAWN|NOON|CONTINUOUS|LATER|GÜNDÜZ|GECE|SABAH|AKŞAM|ÖĞLE|ÖĞLEN|TAG|NACHT|MORGEN|ABEND|NUIT|JOUR|MATIN|SOIR|DÍA|NOCHE|GIORNO|NOTTE)$/;
  const tm = rest.match(TIME);
  if (tm && !rest.includes(' - ')) {
    const loc = rest.slice(0, rest.length - tm[0].length).trim();
    return `${kwDot} ${loc} - ${tm[1]}`;
  }
  return `${kwDot} ${rest}`;
}

// Sahne başlığı olabilecek anahtar kelimeler (çok dilli)
const SCENE_KW_RE = /^([iıİI][çÇc]\.?\s*\/\s*d[iıİI][şŞs]\.?|[iıİI][çÇc]|d[iıİI][şŞs]|int\.?\/ext\.?|i\.?\/e\.?|int|ext|interior|exterior|innen|aussen|int[eé]rieur|ext[eé]rieur|mekan|sahne|lokasyon)\b/i;

const isPointInElement = (x, y, el) => {
  if (el.type === 'text') {
    const w = el.width || 400;
    const fs = el.fontSize || 16;
    const lh = el.lineHeight || 1.5;
    const contentLines = Math.max(1, (el.content || '').split('\n').length);
    const htmlLines = el.htmlContent ? (el.htmlContent.match(/<br\s*\/?>/gi) || []).length + 1 : 1;
    const explicitLines = Math.max(contentLines, htmlLines);
    const plainText = el.htmlContent?.replace(/<[^>]*>/g, '') || el.content || '';
    const avgCharsPerLine = Math.max(1, Math.floor(w / (fs * 0.6)));
    const wrappedLines = Math.ceil((plainText.length || 1) / avgCharsPerLine);
    const lines = Math.max(explicitLines, wrappedLines);
    const h = fs * lines * lh;
    return x >= el.x && x <= el.x + w && y >= el.y && y <= el.y + h;
  }
  return x >= el.x && x <= el.x + (el.width || 80) && y >= el.y && y <= el.y + (el.height || 80);
};

const dist = (a, b) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);

// ── Knife tool geometry ───────────────────────────────────────────────────────
function _segIntersect(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y) {
  const d1x = p2x - p1x, d1y = p2y - p1y;
  const d2x = p4x - p3x, d2y = p4y - p3y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-8) return null;
  const t = ((p3x - p1x) * d2y - (p3y - p1y) * d2x) / cross;
  const u = ((p3x - p1x) * d1y - (p3y - p1y) * d1x) / cross;
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: p1x + t * d1x, y: p1y + t * d1y };
  return null;
}
function _knifeSide(kx1, ky1, kx2, ky2, px, py) {
  return (kx2 - kx1) * (py - ky1) - (ky2 - ky1) * (px - kx1);
}
function _splitByKnife(el, kx1, ky1, kx2, ky2) {
  const ex = el.x, ey = el.y, ew = el.width || 80, eh = el.height || 80;
  const edges = [[ex, ey, ex+ew, ey], [ex+ew, ey, ex+ew, ey+eh], [ex+ew, ey+eh, ex, ey+eh], [ex, ey+eh, ex, ey]];
  const hits = [];
  edges.forEach(([x1, y1, x2, y2]) => {
    const p = _segIntersect(kx1, ky1, kx2, ky2, x1, y1, x2, y2);
    if (p && !hits.some(h => Math.abs(h.x - p.x) < 1 && Math.abs(h.y - p.y) < 1)) hits.push(p);
  });
  if (hits.length < 2) return null;
  const corners = [{ x: ex, y: ey }, { x: ex+ew, y: ey }, { x: ex+ew, y: ey+eh }, { x: ex, y: ey+eh }];
  const pos = corners.filter(c => _knifeSide(kx1, ky1, kx2, ky2, c.x, c.y) >= 0);
  const neg = corners.filter(c => _knifeSide(kx1, ky1, kx2, ky2, c.x, c.y) < 0);
  if (!pos.length || !neg.length) return null;

  const makePiece = (pts, uid) => {
    const all = [...pts, ...hits];
    // Sort clockwise by angle from centroid
    const cx = all.reduce((s, p) => s + p.x, 0) / all.length;
    const cy = all.reduce((s, p) => s + p.y, 0) / all.length;
    const sorted = [...all].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    // Bounding box of this piece → becomes the new element bounds
    const minX = Math.min(...sorted.map(p => p.x));
    const minY = Math.min(...sorted.map(p => p.y));
    const maxX = Math.max(...sorted.map(p => p.x));
    const maxY = Math.max(...sorted.map(p => p.y));
    const nw = maxX - minX || 1, nh = maxY - minY || 1;
    // clip-path in % relative to this new bounding box (scales correctly with zoom)
    const clipPath = sorted.map(p =>
      `${((p.x - minX) / nw * 100).toFixed(1)}% ${((p.y - minY) / nh * 100).toFixed(1)}%`
    ).join(', ');
    return { ...el, id: `el_${Date.now()}_${uid}`, x: minX, y: minY, width: nw, height: nh, clipPath };
  };

  return [makePiece(pos, 'a'), makePiece(neg, 'b')];
}
function _extendKnifeLine(x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len, uy = dy / len;
  const ext = 10000;
  return [x1 - ux * ext, y1 - uy * ext, x2 + ux * ext, y2 + uy * ext];
}
// ─────────────────────────────────────────────────────────────────────────────

const isColorDark = (hex) => {
  const h = (hex || '#ffffff').replace('#', '').padEnd(6, '0');
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
};

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

const distToSegment = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
  return Math.sqrt((px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2);
};

// Check if point is near a pen/vector path — checks segments and filled polygon interior
const isPointNearPath = (x, y, path, threshold = 15) => {
  if (!path.points || path.points.length < 2) return false;
  const pts = path.points;
  for (let i = 0; i < pts.length - 1; i++) {
    if (distToSegment(x, y, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y) < threshold) return true;
  }
  if (path.isClosed) {
    const last = pts[pts.length - 1];
    if (distToSegment(x, y, last.x, last.y, pts[0].x, pts[0].y) < threshold) return true;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].x, yi = pts[i].y, xj = pts[j].x, yj = pts[j].y;
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    if (inside) return true;
  }
  return false;
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

const buildGradientCss = (el, defaultAngle = 135) => {
  // Multi-point radial: each stop radiates from its own x/y position like a light source
  if (el.gradientType === 'radial-multi' && el.gradientStops?.length >= 1) {
    const layers = el.gradientStops.map(s =>
      `radial-gradient(circle at ${s.stopX ?? 50}% ${s.stopY ?? 50}%, ${s.color} 0%, transparent 100%)`
    );
    const base = el.gradientStops[el.gradientStops.length - 1].color;
    return [...layers, `linear-gradient(${base}, ${base})`].join(', ');
  }
  if (el.gradientStops?.length >= 2) {
    const sorted = [...el.gradientStops].sort((a, b) => a.pos - b.pos);
    if (el.gradientType === 'radial') {
      const cx = el.gradientCenterX ?? 50;
      const cy = el.gradientCenterY ?? 50;
      return `radial-gradient(circle at ${cx}% ${cy}%, ${sorted.map(s => `${s.color} ${s.pos}%`).join(', ')})`;
    }
    return `linear-gradient(${el.gradientAngle ?? defaultAngle}deg, ${sorted.map(s => `${s.color} ${s.pos}%`).join(', ')})`;
  }
  if (el.gradientStart && el.gradientEnd) {
    return `linear-gradient(${defaultAngle}deg, ${el.gradientStart}, ${el.gradientEnd})`;
  }
  return null;
};

const ShapeRenderer = ({ el }) => {
  const gradientCss = buildGradientCss(el);
  const hasGradient = !!gradientCss;
  const hasImage = !!el.image;

  const style = { width: '100%', height: '100%' };

  if (hasGradient && !hasImage) {
    style.backgroundImage = gradientCss;
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
  const svgStops = hasGradient
    ? (el.gradientStops?.length >= 2
        ? [...el.gradientStops].sort((a, b) => a.pos - b.pos).map(s => <stop key={s.pos} offset={`${s.pos}%`} stopColor={s.color} />)
        : [<stop key="0" offset="0%" stopColor={el.gradientStart} />, <stop key="1" offset="100%" stopColor={el.gradientEnd} />])
    : null;

  if (el.shapeType === 'ring') {
    if (hasGradient) {
      return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid transparent', background: `linear-gradient(white, white) padding-box, ${gradientCss} border-box`, boxSizing: 'border-box' }} />;
    }
    return <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: `4px solid ${el.fill || '#000'}`, backgroundColor: 'transparent', backgroundImage: hasImage ? `url(${el.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center', boxSizing: 'border-box' }} />;
  }
  if (el.shapeType === 'heart') {
    const heartFill = hasGradient ? `url(#sg-heart-${el.id})` : (el.fill || '#000');
    return (
      <svg viewBox="0 0 100 90" style={{ width: '100%', height: '100%' }}>
        {hasGradient && <defs><linearGradient id={`sg-heart-${el.id}`} x1="0%" y1="0%" x2="100%" y2="100%">{svgStops}</linearGradient></defs>}
        <path d="M50,80 L12,42 C2,28 12,10 30,14 C38,16 45,24 50,32 C55,24 62,16 70,14 C88,10 98,28 88,42 Z" fill={heartFill} />
      </svg>
    );
  }
  if (clips[el.shapeType]) return <div style={{ ...style, clipPath: clips[el.shapeType] }} />;

  // SVG-based shapes with gradient support
  const svgFill = hasGradient ? `url(#sg-${el.id})` : (el.fill || '#000000');
  const gradDef = hasGradient ? (
    <defs>
      <linearGradient id={`sg-${el.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
        {svgStops}
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
    'star3':       <polygon points="62,3 32,50 54,50 38,97 68,50 46,50" fill={svgFill} />,
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

const EditableText = memo(({ el, zoom, pageWidth, pageMargins, isEditing, onStartEdit, onCommit, pageHeight, onAutoAddPage, onFlowText, onRemoveRedact, spellCheck, onLinkClick, wrapElements, pageElements, pageDark = false, screenplayMode, onScriptElementChange, onScreenplayEnter }) => {
  const ref = useRef(null);
  const prevEditingRef = useRef(false);
  const pendingContentRef = useRef(null);
  const screenplayAutoDetectTimerRef = useRef(null);
  const screenplayLastNormalizedRef = useRef(null);
  const screenplayFormatBlockedRef = useRef(false);
  const [removeTarget, setRemoveTarget] = useState(null); // 'redact' | 'highlight' | null

  useEffect(() => () => { if (screenplayAutoDetectTimerRef.current) clearTimeout(screenplayAutoDetectTimerRef.current); }, []);

  // Celtx tarzı: "action" elementinde sahne anahtar kelimesi algılanınca otomatik Sahne Başlığı'na döner (çok dilli).
  const handleScreenplayAutoDetect = useCallback(() => {
    if (!screenplayMode || el.scriptElement !== 'action' || !onScriptElementChange) return;
    if (screenplayAutoDetectTimerRef.current) clearTimeout(screenplayAutoDetectTimerRef.current);
    screenplayAutoDetectTimerRef.current = setTimeout(() => {
      const text = (ref.current?.textContent || '').trimStart();
      if (SCENE_KW_RE.test(text)) onScriptElementChange(el.id, 'sceneheading');
    }, 300);
  }, [screenplayMode, el.id, el.scriptElement, onScriptElementChange]);

  // Capture typed content DURING render, before React applies dangerouslySetInnerHTML and overwrites the DOM.
  // useEffect fires after the DOM mutation, so ref.current.innerHTML would already be stale there.
  if (prevEditingRef.current && !isEditing && ref.current) {
    pendingContentRef.current = ref.current.innerHTML;
  }

  useEffect(() => {
    if (isEditing && ref.current) {
      if (!prevEditingRef.current) {
        // Entering edit mode — load content into DOM
        const html = el.htmlContent || (el.content ? el.content.replace(/\n/g, '<br>') : '');
        ref.current.innerHTML = html;
        setRemoveTarget(null);
      }
      ref.current.focus({ preventScroll: true });
      const r = window.document.createRange(); const s = window.getSelection();
      r.selectNodeContents(ref.current); r.collapse(false); s.removeAllRanges(); s.addRange(r);
    } else if (!isEditing && prevEditingRef.current) {
      // Use content captured during render phase (before dangerouslySetInnerHTML overwrote the DOM)
      const captured = pendingContentRef.current;
      pendingContentRef.current = null;
      if (captured !== null) onCommit(el.id, captured, true);
    }
    prevEditingRef.current = isEditing;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);
  
  const checkOverflow = useCallback(() => {
    if (!ref.current || !pageHeight) return;
    const margins = pageMargins || {};
    const ml = margins.left || 40;
    const mr = margins.right || 40;
    const textLeft = el.x;
    const textRight = el.x + (el.width || (pageWidth - ml - mr));

    // Find nearest vertical obstacle (non-text element below this text box that overlaps horizontally)
    let obstacleTop = pageHeight - (margins.bottom || 40);
    let obstacleBottom = obstacleTop;
    if (pageElements?.length) {
      for (const obs of pageElements) {
        if (obs.type === 'text' || obs.id === el.id) continue;
        const obsLeft = obs.x;
        const obsRight = obs.x + (obs.width || 80);
        const obsTop = obs.y;
        const obsBot = obs.y + (obs.height || 80);
        if (obsRight <= textLeft || obsLeft >= textRight) continue; // no horizontal overlap
        if (obsTop <= el.y) continue; // not below text start
        if (obsTop < obstacleTop) { obstacleTop = obsTop; obstacleBottom = obsBot; }
      }
    }

    const availableH = (obstacleTop - el.y) * zoom;
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
        // Pass obstacleBottom so flow handler can place text below the obstacle
        onFlowText(overflowHtml, obstacleBottom < pageHeight - (margins.bottom || 40) ? obstacleBottom : null, el.id, keepHtml);
        return;
      }
    }
    if (onAutoAddPage) onAutoAddPage();
  }, [el.id, el.x, el.y, el.width, el.fontSize, el.lineHeight, pageHeight, pageWidth, pageMargins, zoom, onAutoAddPage, onFlowText, onCommit, pageElements]); // eslint-disable-line

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
      // Restore original text from base64-encoded data-original attribute
      html = html.replace(/<span([^>]*)data-redacted="true"([^>]*)>([\s\S]*?)<\/span>/gi, (_match, pre, post) => {
        const attrs = pre + post;
        const m = attrs.match(/data-original="([^"]*)"/);
        if (m) { try { return decodeURIComponent(escape(atob(m[1]))); } catch { return ''; } }
        return '';
      });
    } else if (removeTarget === 'highlight') {
      html = html.replace(/<span[^>]*data-highlight="true"[^>]*>([\s\S]*?)<\/span>/gi, '$1');
    }
    // Update DOM directly so pendingContentRef captures clean HTML, not stale highlighted content
    if (ref.current) ref.current.innerHTML = html;
    pendingContentRef.current = null;
    onCommit(el.id, html, true);
    setRemoveTarget(null);
  }, [el.id, el.htmlContent, el.content, removeTarget, onCommit]);
  
  const ml = pageMargins?.left || 60;
  const mr = pageMargins?.right || 60;
  const fixedWidth = (el.width ? el.width * zoom : (pageWidth - ml - mr) * zoom);

  // Wrap padding — shift text away from overlapping elements (images with textWrap + all other non-text elements)
  let wrapPL = (el.paddingLeft || 0) * zoom;
  let wrapPR = (el.paddingRight || 0) * zoom;
  const allWrapSources = [...(wrapElements || []), ...(pageElements || []).filter(e => e.id !== el.id && e.type !== 'text' && !wrapElements?.find(w => w.id === e.id))];
  if (allWrapSources.length) {
    const tTop = el.y;
    const tBot = el.y + (el.fontSize || 16) * (el.lineHeight || 1.5) * Math.max(1, (el.content || '').split('\n').length);
    const textW = el.width || pageWidth - ml - mr;
    allWrapSources.forEach(obs => {
      const obsBot = obs.y + (obs.height || 80);
      if (obsBot < tTop || obs.y > tBot) return; // no vertical overlap
      const obsLeft = obs.x;
      const obsRight = obs.x + (obs.width || 80);
      if (obsRight <= el.x || obsLeft >= el.x + textW) return; // no horizontal overlap
      // Determine wrap direction: element on left side → push text right, on right side → push text left
      const obsCenterX = obsLeft + (obs.width || 80) / 2;
      const textCenterX = el.x + textW / 2;
      const iRight = (obsRight - el.x) * zoom + 8;
      const fromRight = (el.x + textW - obsLeft) * zoom + 8;
      if (obs.textWrap === 'left' || (obs.textWrap !== 'right' && obsCenterX < textCenterX)) {
        wrapPL = Math.max(wrapPL, iRight);
      } else {
        wrapPR = Math.max(wrapPR, Math.min(fromRight, textW * zoom - 20));
      }
    });
  }
  
  const gradientStyle = (() => {
    const gCss = buildGradientCss(el, 90);
    if (!gCss) return {};
    return { background: gCss, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' };
  })();

  const htmlContent = el.htmlContent || (el.content ? el.content.replace(/\n/g, '<br>') : (isEditing ? '' : '\u00A0'));

  return (
    <div style={{ position: 'relative' }}>
      <div ref={ref} data-testid={`text-element-${el.id}`} contentEditable={isEditing} suppressContentEditableWarning
        spellCheck={isEditing && spellCheck !== false}
        onDoubleClick={(e) => { e.stopPropagation(); setRemoveTarget(null); onStartEdit(el.id); }}
        onClick={(e) => {
          // Handle clickable links (footnotes, TOC)
          if (!isEditing && onLinkClick) {
            const fn = e.target.closest?.('[data-footnote-id]');
            if (fn) { e.stopPropagation(); onLinkClick({ type: 'footnote', id: fn.dataset.footnoteId }); return; }
            const tp = e.target.closest?.('[data-toc-page]');
            if (tp) { e.stopPropagation(); onLinkClick({ type: 'toc', page: parseInt(tp.dataset.tocPage) - 1 }); return; }
          }
          handleClick(e);
        }}
        onBlur={(e) => {
          const rt = e.relatedTarget;
          // Toolbar butonuna tıklanınca blur olmasın — editingId korunur
          if (isEditing && rt && (rt.tagName === 'BUTTON' || rt.tagName === 'SELECT' || rt.tagName === 'INPUT' || rt.getAttribute?.('role') === 'button' || rt.closest?.('button, [role="button"]'))) {
            setTimeout(() => { if (ref.current) ref.current.focus({ preventScroll: true }); }, 0);
            return;
          }
          // Senaryo Modu: sahne başlığı normalizasyonu ('. ' ve ' - ' ekle/düzelt)
          if (screenplayMode && el.scriptElement === 'sceneheading' && !screenplayFormatBlockedRef.current && ref.current && isEditing) {
            const rawText = ref.current.innerText || '';
            // Kullanıcı önceki otomatik formatı sildiyse bir daha ekleme
            if (screenplayLastNormalizedRef.current !== null && rawText !== screenplayLastNormalizedRef.current) {
              const hadDot = screenplayLastNormalizedRef.current.includes('.');
              const hadDash = screenplayLastNormalizedRef.current.includes(' - ');
              if ((hadDot && !rawText.includes('.')) || (hadDash && !rawText.includes(' - '))) {
                screenplayFormatBlockedRef.current = true;
              }
            }
            if (!screenplayFormatBlockedRef.current) {
              const normalized = normalizeSceneHeading(rawText);
              const normalizedHtml = normalized.replace(/\n/g, '<br>');
              ref.current.innerHTML = normalizedHtml;
              pendingContentRef.current = normalizedHtml;
              screenplayLastNormalizedRef.current = normalized;
            }
          }
          // React may have already applied dangerouslySetInnerHTML (overwriting typed content) before this
          // blur fires (happens when another element's editingId was set, triggering a React commit that
          // changes contentEditable false→false triggers blur). Use pendingContentRef captured during
          // the render phase (before commit) as the authoritative content if available.
          const content = pendingContentRef.current !== null ? pendingContentRef.current : (ref.current ? ref.current.innerHTML : null);
          if (content !== null) {
            onCommit(el.id, content, true);
          }
        }}
        onInput={(e) => { checkOverflow(e); handleScreenplayAutoDetect(); }}
        onKeyDown={isEditing ? (e) => {
          e.stopPropagation();
          if (e.key === 'Escape') { ref.current?.blur(); return; }
          // Senaryo: kısa ALL-CAPS "action" satırı + Enter → karakter ismi olarak işaretle
          if (screenplayMode && el.scriptElement === 'action' && e.key === 'Enter' && !e.shiftKey) {
            const rawText = (ref.current?.textContent || '').trim();
            const isAllCaps = rawText.length > 0 && rawText.split('').every(c => c === c.toUpperCase() || /[\s.'"\-()]/.test(c));
            if (rawText.length > 0 && rawText.length < 40 && isAllCaps && !/[.,:;?!]$/.test(rawText) && !SCENE_KW_RE.test(rawText)) {
              e.preventDefault();
              if (onScriptElementChange) onScriptElementChange(el.id, 'character');
              ref.current?.blur();
              setTimeout(() => { if (onScreenplayEnter) onScreenplayEnter(el.id); }, 30);
              return;
            }
          }
          if (screenplayMode && el.scriptElement) {
            if (e.key === 'Tab') {
              e.preventDefault();
              const cycle = SCRIPT_TAB_CYCLE;
              const idx = cycle.indexOf(el.scriptElement);
              const nextType = cycle[(idx + (e.shiftKey ? -1 : 1) + cycle.length) % cycle.length];
              if (onScriptElementChange) onScriptElementChange(el.id, nextType);
              return;
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ref.current?.blur();
              setTimeout(() => { if (onScreenplayEnter) onScreenplayEnter(el.id); }, 20);
              return;
            }
          }
          if (e.key === 'Tab') {
            e.preventDefault();
            const sel = window.getSelection();
            const node = sel?.focusNode;
            const li = node?.nodeType === 3 ? node.parentElement?.closest('li') : node?.closest?.('li');
            if (li) {
              window.document.execCommand(e.shiftKey ? 'outdent' : 'indent', false, null);
            } else if (!e.shiftKey) {
              window.document.execCommand('insertText', false, '    ');
            }
          }
        } : undefined}
        className={`outline-none ${isEditing ? 'min-h-[1em]' : ''}`}
        style={{
          visibility: el.isRedacted && !isEditing ? 'hidden' : undefined,
          fontSize: (el.fontSize || 16) * zoom, fontFamily: el.fontFamily || 'Arial',
          color: (el.gradientStops?.length >= 1 || (el.gradientStart && el.gradientEnd)) ? undefined : (
            el.color && el.color !== '#000000' && el.color !== '#000'
              ? el.color
              : pageDark ? '#ffffff' : '#000000'
          ),
          fontWeight: el.bold ? 'bold' : 'normal', fontStyle: el.italic ? 'italic' : 'normal',
          textDecoration: [el.underline && 'underline', el.strikethrough && 'line-through'].filter(Boolean).join(' ') || 'none',
          textAlign: el.textAlign || 'left',
          width: fixedWidth,
          wordWrap: 'break-word', whiteSpace: 'pre-wrap',
          lineHeight: el.lineHeight || 1.5,
          WebkitLineClamp: 'unset',
          cursor: 'text', caretColor: 'var(--zet-primary)',
          paddingLeft: wrapPL,
          paddingRight: wrapPR,
          paddingTop: ((el.paddingTop || 0) + (el.paragraphSpaceBefore || 0)) * zoom,
          paddingBottom: ((el.paddingBottom || 0) + (el.paragraphSpaceAfter || 0)) * zoom,
          textIndent: (el.textIndent || 0) * zoom,
          backgroundColor: el.highlightColor ? el.highlightColor + '66' : undefined,
          '--lh': el.lineHeight || 1.5,
          ...gradientStyle,
          ...(screenplayMode && el.scriptElement && SCRIPT_ELEMENT_TYPES[el.scriptElement]?.case === 'upper' ? { textTransform: 'uppercase' } : {}),
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
});

const ElementMenu = ({ el, onDelete, onChangeImage, onAddImageToShape, onAddAiImage, onCopy, onMirror, onSetTextWrap, onEditChart, onClose }) => (
  <div data-testid={`element-menu-${el.id}`} className="absolute top-5 right-0 zet-card p-1 z-50 min-w-[150px] shadow-xl animate-fadeIn" onClick={e => e.stopPropagation()}>
    {el.type === 'chart' && onEditChart && (
      <>
        <button onClick={() => { onEditChart(el); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Edit2 className="h-3 w-3" /> Düzenle</button>
        <div className="border-t my-0.5" style={{ borderColor: 'var(--zet-border)' }} />
      </>
    )}
    <button onClick={() => { if(onCopy) onCopy(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Copy className="h-3 w-3" /> Kopyala</button>
    <button onClick={() => { if(onMirror) onMirror(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><FlipHorizontal2 className="h-3 w-3" /> Ayna</button>
    {el.type === 'image' && <>
      <button data-testid={`change-image-${el.id}`} onClick={() => { onChangeImage(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><RefreshCw className="h-3 w-3" /> Resmi Değiştir</button>
      <div className="border-t my-0.5" style={{ borderColor: 'var(--zet-border)' }} />
      <div className="px-2 py-0.5 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Metin Sarma</div>
      {[['none','⬜ Yok'],['left','◧ Sola'],['right','◨ Sağa']].map(([mode, label]) => (
        <button key={mode} onClick={() => { if(onSetTextWrap) onSetTextWrap(el.id, mode); onClose(); }}
          className="w-full text-left px-2.5 py-1 text-xs rounded hover:bg-white/10 flex items-center gap-2"
          style={{ color: el.textWrap === mode ? '#4ca8ad' : 'var(--zet-text)', fontWeight: el.textWrap === mode ? 'bold' : 'normal' }}>
          {label}
        </button>
      ))}
      <div className="border-t my-0.5" style={{ borderColor: 'var(--zet-border)' }} />
    </>}
    {(el.type === 'shape' || el.type === 'vector') && (
      <>
        <button onClick={() => { onAddImageToShape(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Image className="h-3 w-3" /> Resim Ekle</button>
        <button onClick={() => { onAddAiImage(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-white/10 flex items-center gap-2" style={{ color: 'var(--zet-text)' }}><Wand2 className="h-3 w-3" /> AI Resim</button>
      </>
    )}
    <button onClick={() => { onDelete(el.id); onClose(); }} className="w-full text-left px-2.5 py-1.5 text-xs rounded hover:bg-red-500/20 flex items-center gap-2" style={{ color: '#f87171' }}><Trash2 className="h-3 w-3" /> Sil</button>
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

const OverlayRect = memo(({ overlay, zoom, onRemove }) => {
  const [hovered, setHovered] = useState(false);
  const isC = overlay.overlayType === 'redact';
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute',
        left: overlay.x * zoom, top: overlay.y * zoom,
        width: overlay.width * zoom, height: overlay.height * zoom,
        background: isC ? '#111' : (overlay.color || '#fbbf24'),
        opacity: isC ? 1 : 0.45,
        zIndex: 15, borderRadius: 2,
        pointerEvents: 'all', cursor: 'default',
      }}
    >
      {hovered && (
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(overlay.id); }}
          style={{
            position: 'absolute', top: -8, right: -8,
            width: 18, height: 18, borderRadius: '50%',
            background: '#ef4444', color: '#fff',
            border: '2px solid rgba(255,255,255,0.8)',
            fontSize: 9, fontWeight: 700, lineHeight: 1, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', zIndex: 16,
          }}
        >✕</button>
      )}
    </div>
  );
});

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
  onSetTextWrap, onLinkClick, spellCheck = true,
  userPlan = 'free', onEditChart,
  screenplayMode = false, onScriptElementChange,
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
  const lastTouchDistRef = useRef(null);
  const lastTapTimeRef = useRef(0);
  const lastTapPosRef = useRef({ x: 0, y: 0 });
  const margins = { top: pageMarginsProp?.top ?? 40, bottom: pageMarginsProp?.bottom ?? 40, left: pageMarginsProp?.left ?? 40, right: pageMarginsProp?.right ?? 40 };
  const [editingId, setEditingId] = useState(null);
  const pendingEditRef = useRef(null);
  const [imageNaturalRatios, setImageNaturalRatios] = useState({});
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [selectionRect, setSelectionRect] = useState(null);
  const [selectionStart, setSelectionStart] = useState(null);
  const [penAnchors, setPenAnchors] = useState([]); // [{x,y,hx,hy}] bezier anchors
  const penAnchorsRef = useRef([]); // stale-closure-safe mirror of penAnchors
  const zoomRef = useRef(zoom);
  const currentColorRef = useRef(currentColor);
  const penDragRef = useRef(null); // tracks drag state for handle creation
  const [penCursorPos, setPenCursorPos] = useState(null);
  const cropWasDraggedRef = useRef(false); // tracks if a crop handle was dragged this gesture
  const activeDragRef = useRef(null); // sync mirror of dragging — avoids async state race on touchmove
  const [penHandlePreview, setPenHandlePreview] = useState(null); // {x,y,hx,hy}
  const [cropTarget, setCropTarget] = useState(null);
  const [cropRect, setCropRect] = useState(null);
  const [cropRadius, setCropRadius] = useState(0);
  const [cropDragging, setCropDragging] = useState(false);
  const [cropStart, setCropStart] = useState(null);
  const [cropHandle, setCropHandle] = useState(null); // 'n'|'s'|'e'|'w'|'nw'|'ne'|'sw'|'se'|'move'|'radius'
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
  const [knifePreview, setKnifePreview] = useState(null); // {x1,y1,x2,y2} only for rendering
  const knifeStartRef = useRef(null);
  const knifeEndRef = useRef(null);

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

  useEffect(() => { penAnchorsRef.current = penAnchors; }, [penAnchors]);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { currentColorRef.current = currentColor; }, [currentColor]);

  const markingColorRef = useRef(markingColor);
  useEffect(() => { markingColorRef.current = markingColor; }, [markingColor]);

  const activeToolRef = useRef(activeTool);
  useEffect(() => { activeToolRef.current = activeTool; }, [activeTool]);

  // Highlight / Redact: mouseup anında seçim hâlâ geçerli, activeElement doğru
  useEffect(() => {
    if (activeTool !== 'highlighter' && activeTool !== 'redact') return;
    const tool = activeTool;
    const onMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
      const range = sel.getRangeAt(0);
      const pageEl = canvasRef.current;
      if (!pageEl) return;
      const pageRect = pageEl.getBoundingClientRect();
      const rects = Array.from(range.getClientRects()).filter(r => r.width > 1 && r.height > 2);
      if (rects.length === 0) return;

      // Element ID'yi activeElement'ten al, yoksa DOM walk
      let coveredElementId = null;
      const ae = document.activeElement;
      const aTid = ae?.dataset?.testid || '';
      if (aTid.startsWith('text-element-')) {
        coveredElementId = aTid.replace('text-element-', '');
      } else {
        let node = range.commonAncestorContainer;
        while (node && node !== pageEl) {
          const domEl = node.nodeType === 1 ? node : node.parentElement;
          if (!domEl) break;
          const tid = domEl.dataset?.testid || '';
          if (tid.startsWith('text-element-') || tid.startsWith('canvas-element-')) {
            coveredElementId = tid.replace('text-element-', '').replace('canvas-element-', '');
            break;
          }
          node = domEl.parentElement;
        }
      }

      const segmentId = `seg_${Date.now()}`;
      if (tool === 'redact' && coveredElementId) {
        const selectedText = range.toString();
        if (selectedText.trim()) {
          setCanvasElements(prev => prev.map(el => {
            if (String(el.id) !== String(coveredElementId)) return el;
            const origHtml = el.htmlContent || el.content || '';
            const origContent = el.content || '';
            const pos = origContent.indexOf(selectedText);
            const newContent = pos >= 0
              ? origContent.slice(0, pos) + origContent.slice(pos + selectedText.length)
              : origContent;
            let newHtml = origHtml;
            try {
              const esc = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              newHtml = origHtml.replace(new RegExp(esc), '');
            } catch { /* keep origHtml */ }
            return {
              ...el,
              content: newContent,
              htmlContent: newHtml,
              redactSegments: [
                ...(el.redactSegments || []),
                { segmentId, originalText: selectedText, originalHtml: origHtml, position: Math.max(0, pos) },
              ],
            };
          }));
        }
      }

      const newOverlays = rects.map((rect, i) => ({
        id: `overlay_${Date.now()}_${i}`,
        type: 'overlay',
        overlayType: tool === 'highlighter' ? 'highlight' : 'redact',
        x: (rect.left - pageRect.left) / zoomRef.current,
        y: (rect.top - pageRect.top) / zoomRef.current,
        width: rect.width / zoomRef.current,
        height: rect.height / zoomRef.current,
        color: markingColorRef.current || '#fbbf24',
        coveredElementId,
        segmentId: tool === 'redact' ? segmentId : null,
      }));
      setDrawPaths(prev => [...prev, ...newOverlays]);
      sel.removeAllRanges();
    };

    document.addEventListener('mouseup', onMouseUp);
    return () => document.removeEventListener('mouseup', onMouseUp);
  }, [activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  // Durum 2: metin seçiliyken araç değiştirilince → klonlanmış range + element id kullan
  const savedRangeRef = useRef(null);
  const savedCoveredIdRef = useRef(null);
  useEffect(() => {
    const onSelChange = () => {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed && sel.rangeCount > 0) {
        try {
          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
          const ae = document.activeElement;
          const tid = ae?.dataset?.testid || '';
          savedCoveredIdRef.current = tid.startsWith('text-element-') ? tid.replace('text-element-', '') : null;
        } catch { /* ignore */ }
      }
    };
    document.addEventListener('selectionchange', onSelChange);
    return () => document.removeEventListener('selectionchange', onSelChange);
  }, []);

  useEffect(() => {
    if (activeTool !== 'redact') return;
    const range = savedRangeRef.current;
    savedRangeRef.current = null;
    let coveredElementId = savedCoveredIdRef.current;
    savedCoveredIdRef.current = null;
    if (!range || range.collapsed) return;
    const selectedText = range.toString();
    if (!selectedText.trim()) return;
    const segmentId = `seg_${Date.now()}`;
    setCanvasElements(prev => {
      // ID biliniyorsa onu kullan, yoksa seçili metni içeren ilk text elementini bul
      const targetId = coveredElementId
        ? String(coveredElementId)
        : String((prev.find(el => el.type === 'text' && (el.content || '').includes(selectedText)) || {}).id || '');
      if (!targetId) return prev;
      return prev.map(el => {
        if (String(el.id) !== targetId) return el;
        const origHtml = el.htmlContent || el.content || '';
        const origContent = el.content || '';
        const pos = origContent.indexOf(selectedText);
        const newContent = pos >= 0
          ? origContent.slice(0, pos) + origContent.slice(pos + selectedText.length)
          : origContent;
        let newHtml = origHtml;
        try {
          const esc = selectedText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          newHtml = origHtml.replace(new RegExp(esc), '');
        } catch { /* keep origHtml */ }
        return {
          ...el,
          content: newContent,
          htmlContent: newHtml,
          redactSegments: [
            ...(el.redactSegments || []),
            { segmentId, originalText: selectedText, originalHtml: origHtml, position: Math.max(0, pos) },
          ],
        };
      });
    });
  }, [activeTool]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeTool === 'cut' && selectedElement) {
      const el = canvasElements.find(e => e.id === selectedElement);
      if (el?.type === 'image') { setCropTarget(el.id); setCropRect({ x: el.x + 10, y: el.y + 10, w: el.width - 20, h: el.height - 20 }); return; }
    }
    if (activeTool !== 'cut') { setCropTarget(null); setCropRect(null); }
    if (activeTool !== 'knife') { knifeStartRef.current = null; setKnifePreview(null); }
    // Formatting tools keep editingId so user can type right after adjusting style
    const formattingTools = new Set(['text','textsize','font','linespacing','wordtype','paragraph','indent','color','styles','bulletlist','numberedlist','margins','columns','punctuation']);
    if (!formattingTools.has(activeTool) && activeTool !== 'select') setEditingId(null);
    if (activeTool !== 'pen') {
      // Save in-progress path instead of discarding it
      if (penAnchorsRef.current.length > 1) {
        const savedPath = {
          id: `vec_${Date.now()}`,
          anchors: penAnchorsRef.current,
          points: penAnchorsRef.current.map(a => ({ x: a.x, y: a.y })),
          size: 2, opacity: 100, color: currentColorRef.current, isPen: true, image: null,
        };
        setDrawPaths(prev => [...prev, savedPath]);
      }
      penAnchorsRef.current = [];
      setPenAnchors([]);
      setPenHandlePreview(null);
      setPenCursorPos(null);
    }
    setElementMenu(null);
    setVectorMenu(null);
    if (activeTool !== 'hand') { setSelectedVector(null); }
    // Auto-activate magnifier when zoom tool is selected
    if (activeTool === 'zoom') { setMagnifierActive(true); }
    else { setMagnifierActive(false); }
  }, [activeTool, canvasElements, selectedElement]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process pending interaction after page switch
  useEffect(() => {
    if (!pendingEditRef.current || pendingEditRef.current.pageIdx !== currentPage) return;
    const { elementId, elementType, x, y } = pendingEditRef.current;
    pendingEditRef.current = null;
    const timer = setTimeout(() => {
      setElementMenu(null);
      setVectorMenu(null);
      if (elementId) {
        // Select the element; only enter edit mode for text elements
        setSelectedElement(elementId);
        if (elementType === 'text') setEditingId(elementId);
      } else if (activeTool === 'text') {
        // No element found + text tool → create new text element
        const ml = margins.left;
        const scrDefaults = screenplayMode ? (() => {
          const cfg = SCRIPT_ELEMENT_TYPES.action;
          const indentPx = cfg.indentCm * SCREENPLAY_PX_PER_CM;
          return { scriptElement: 'action', fontFamily: 'Courier New', fontSize: 16, lineHeight: 1, textAlign: cfg.align, x: ml + indentPx, width: pageSize.width - ml - margins.right - indentPx };
        })() : {};
        const ne = {
          id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
          x: ml, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
          fontFamily: currentFont, color: currentColor, width: pageSize.width - margins.left - margins.right,
          lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
          bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
          gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
          ...scrDefaults,
        };
        setCanvasElements(prev => [...prev, ne]); setEditingId(ne.id); setSelectedElement(ne.id);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [currentPage, canvasElements]); // eslint-disable-line react-hooks/exhaustive-deps


  // Global mouseup/mousemove so drag doesn't stop when cursor briefly leaves the page div
  const handleMouseUpRef = useRef(null);
  useEffect(() => { handleMouseUpRef.current = handleMouseUp; });
  useEffect(() => {
    if (!dragging && !resizing && draggingVector === null) return;
    const onGlobalUp = () => handleMouseUpRef.current?.();
    window.addEventListener('mouseup', onGlobalUp);
    return () => window.removeEventListener('mouseup', onGlobalUp);
  }, [dragging, resizing, draggingVector]);

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
    // Only clear editingId if it's still this element — prevents race where another element
    // already started editing before this commit fires (e.g. clicking Y while editing X).
    setEditingId(prev => prev === id ? null : prev);
  }, [canvasElements, setCanvasElements, onSaveHistory, pageSize.height, onAddPage, margins.bottom]);

  const handleScreenplayEnter = useCallback((elId) => {
    const srcEl = canvasElements.find(e => e.id === elId);
    if (!srcEl) return;
    const currentType = srcEl.scriptElement || 'action';
    const nextType = SCRIPT_ENTER_NEXT[currentType] || 'action';
    const cfg = SCRIPT_ELEMENT_TYPES[nextType];
    const indentPx = cfg.indentCm * SCREENPLAY_PX_PER_CM;
    const newX = margins.left + indentPx;
    const newWidth = cfg.widthCm ? cfg.widthCm * SCREENPLAY_PX_PER_CM : pageSize.width - margins.left - margins.right - indentPx;
    const lineH = (srcEl.fontSize || 16) * (srcEl.lineHeight || 1);
    const textLines = Math.max(1, ((srcEl.htmlContent || srcEl.content || '').split(/<br\s*\/?>/gi).length));
    const newY = srcEl.y + lineH * textLines + 4;
    const pageBottom = pageSize.height - margins.bottom - 20;
    const newEl = {
      id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'text', scriptElement: nextType,
      x: newX, y: Math.min(newY, pageBottom), width: newWidth,
      content: '', htmlContent: '',
      fontFamily: 'Courier New', fontSize: srcEl.fontSize || 16, lineHeight: 1,
      textAlign: cfg.align, color: srcEl.color || '#000000',
      bold: false, italic: false, underline: false, strikethrough: false,
    };
    if (newY >= pageBottom && onAddPage) {
      newEl.y = margins.top;
      onAddPage();
      setTimeout(() => {
        setCanvasElements(prev => {
          const updated = [...prev, newEl];
          onSaveHistory(updated);
          return updated;
        });
        setEditingId(newEl.id);
        setSelectedElement(newEl.id);
      }, 80);
    } else {
      setCanvasElements(prev => {
        const updated = [...prev, newEl];
        onSaveHistory(updated);
        return updated;
      });
      setEditingId(newEl.id);
      setSelectedElement(newEl.id);
    }
  }, [canvasElements, margins, pageSize, onAddPage, onSaveHistory, setCanvasElements, setSelectedElement]); // eslint-disable-line

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
      const sw = cropRect.w * img.naturalWidth / el.width;
      const sh = cropRect.h * img.naturalHeight / el.height;
      c.width = sw; c.height = sh;
      const ctx = c.getContext('2d');
      if (cropRadius > 0) {
        const r = cropRadius * img.naturalWidth / el.width;
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(0, 0, sw, sh, r);
        } else {
          ctx.moveTo(r, 0); ctx.lineTo(sw - r, 0); ctx.arcTo(sw, 0, sw, r, r);
          ctx.lineTo(sw, sh - r); ctx.arcTo(sw, sh, sw - r, sh, r);
          ctx.lineTo(r, sh); ctx.arcTo(0, sh, 0, sh - r, r);
          ctx.lineTo(0, r); ctx.arcTo(0, 0, r, 0, r); ctx.closePath();
        }
        ctx.clip();
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const u = canvasElements.map(e => e.id === cropTarget ? { ...e, src: c.toDataURL('image/png'), x: cropRect.x, y: cropRect.y, width: cropRect.w, height: cropRect.h } : e);
      setCanvasElements(u); onSaveHistory(u);
      setCropTarget(null); setCropRect(null); setCropRadius(0);
    };
    img.src = el.src;
  }, [canvasElements, cropRadius, cropRect, cropTarget, onSaveHistory, setCanvasElements]);

  const handleCanvasClick = useCallback((e, pageIdx) => {
    if (dragging || resizing || draggingVector) return;
    
    // If clicking a different page, switch to it first then process the click
    if (pageIdx !== currentPage) {
      const coords = getCoords(e, e.currentTarget);
      const pageElements = doc?.pages?.[pageIdx]?.elements || [];
      const clickedEl = [...pageElements].reverse().find(el => isPointInElement(coords.x, coords.y, el));
      pendingEditRef.current = { elementId: clickedEl?.id || null, elementType: clickedEl?.type || null, x: coords.x, y: coords.y, pageIdx };
      changePage(pageIdx);
      return;
    }
    
    if (justSelectedRef.current) { justSelectedRef.current = false; if (activeTool !== 'text') return; }
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
      onSaveHistory(canvasElements); // snapshot before creation — enables Ctrl+Z to remove the element
      const { x: colX, width: colWidth } = colSnap(x);
      const scrDefaults2 = screenplayMode ? (() => {
        const cfg = SCRIPT_ELEMENT_TYPES.action;
        const indentPx = cfg.indentCm * SCREENPLAY_PX_PER_CM;
        return { scriptElement: 'action', fontFamily: 'Courier New', fontSize: 16, lineHeight: 1, textAlign: cfg.align, x: margins.left + indentPx, width: pageSize.width - margins.left - margins.right - indentPx };
      })() : {};
      const ne = {
        id: `el_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, type: 'text',
        x: colX, y: Math.max(margins.top, y), content: '', fontSize: currentFontSize,
        fontFamily: currentFont, color: currentColor, width: colWidth,
        lineHeight: currentLineHeight, textAlign: currentTextAlign || 'left',
        bold: isBold, italic: isItalic, underline: isUnderline, strikethrough: isStrikethrough,
        gradientStart: gradientStart || null, gradientEnd: gradientEnd || null,
        ...scrDefaults2,
      };
      const u = [...canvasElements, ne]; setCanvasElements(u); setEditingId(ne.id); setSelectedElement(ne.id);
    } else if (SHAPE_LIST.some(s => s.id === activeTool)) {
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
      if (cl) { setSelectedElement(cl.id); setSelectedElements([cl.id]); setSelectedVector(null); if (onElementSelect) onElementSelect(cl); }
      else {
        setSelectedElement(null); setSelectedElements([]); setEditingId(null); setSelectedVector(null);
      }
    } else if (activeTool === 'cut') {
      const cl = [...canvasElements].reverse().find(el => isPointInElement(x, y, el));
      if (cl?.type === 'image' && !cropTarget) { setCropTarget(cl.id); setSelectedElement(cl.id); setCropRect({ x: cl.x + 10, y: cl.y + 10, w: cl.width - 20, h: cl.height - 20 }); }
      else if (!cropTarget || (cl && cl.id !== cropTarget)) { if (cl) { const u = canvasElements.filter(el => el.id !== cl.id); setCanvasElements(u); onSaveHistory(u); setSelectedElement(null); } setCropTarget(null); setCropRect(null); }
    } else if (activeTool === 'pen') {
      // Skip if this was a drag (smooth anchor already committed in mouseUp)
      if (penDragRef.current?.wasDrag) { penDragRef.current = null; return; }
      const currentAnchors = penAnchorsRef.current;
      // Auto-close: if near first point, close the path
      if (currentAnchors.length > 2 && dist({ x, y }, currentAnchors[0]) < 25 / zoom) {
        const newPath = {
          id: `vec_${Date.now()}`,
          anchors: currentAnchors,
          points: currentAnchors.map(a => ({ x: a.x, y: a.y })),
          size: 2, opacity: 100, color: currentColor, isPen: true, isClosed: true,
          fillColor: currentColor, fillOpacity: 30, image: null,
        };
        setDrawPaths(prev => [...prev, newPath]);
        penAnchorsRef.current = [];
        setPenAnchors([]);
      } else {
        const anchor = { x, y, hx: 0, hy: 0 };
        const newAnchors = [...currentAnchors, anchor];
        penAnchorsRef.current = newAnchors;
        setPenAnchors(newAnchors);
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
      penAnchorsRef.current = [];
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
    
    if (activeTool === 'knife') {
      knifeStartRef.current = { x, y };
      knifeEndRef.current = { x, y };
      setKnifePreview({ x1: x, y1: y, x2: x, y2: y });
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
      // Radius handle: circle on top edge, inset by current radius
      const radiusHandleX = r.x + cropRadius + 14 / zoom;
      const radiusHandleY = r.y;
      if (Math.abs(x - radiusHandleX) <= hw && Math.abs(y - radiusHandleY) <= hw) {
        setCropHandle('radius');
        setCropStart({ x, y, rect: { ...cropRect }, initRadius: cropRadius });
        return;
      }
      const handles = {
        nw: { x: r.x, y: r.y }, ne: { x: r.x + r.w, y: r.y },
        sw: { x: r.x, y: r.y + r.h }, se: { x: r.x + r.w, y: r.y + r.h },
        n: { x: r.x + r.w / 2, y: r.y }, s: { x: r.x + r.w / 2, y: r.y + r.h },
        w: { x: r.x, y: r.y + r.h / 2 }, e: { x: r.x + r.w, y: r.y + r.h / 2 },
      };
      for (const [name, pos] of Object.entries(handles)) {
        if (Math.abs(x - pos.x) <= hw && Math.abs(y - pos.y) <= hw) {
          setCropHandle(name);
          setCropStart({ x, y, rect: { ...cropRect }, initRadius: cropRadius });
          return;
        }
      }
      if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
        setCropHandle('move');
        setCropDragging(true);
        setCropStart({ x, y, rect: { ...cropRect }, initRadius: cropRadius });
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
        activeDragRef.current = hitEl.id;
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

    if (activeTool === 'knife' && knifeStartRef.current) {
      knifeEndRef.current = { x, y };
      setKnifePreview({ x1: knifeStartRef.current.x, y1: knifeStartRef.current.y, x2: x, y2: y });
      return;
    }

    if (activeTool === 'pen') {
      setPenCursorPos({ x, y });
      if (penDragRef.current && isDrawing) {
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
      if (cropHandle === 'radius') {
        const maxR = Math.min(r.w, r.h) / 2;
        setCropRadius(Math.max(0, Math.min(maxR, (cropStart.initRadius || 0) + dx)));
        return;
      }
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
        if (p.isHighlight || p.type === 'overlay' || !p.points || p.points.length === 0) return false;
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
            if (path.type === 'overlay') { newPaths.push(path); return; }
            if (!path.points) { newPaths.push(path); return; }
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
        return !p.isHighlight && p.type !== 'overlay' && isVectorInLasso(p, lassoPath);
      }).map(({ i }) => i);
      if (selectedIds.length > 0) { setSelectedElements(selectedIds); justSelectedRef.current = true; }
      if (selectedVecIdxs.length > 0) { setSelectedVectors(selectedVecIdxs); justSelectedRef.current = true; }
    }
    if (activeTool === 'pen' && penDragRef.current) {
      if (penDragRef.current.wasDrag) {
        const hx = penDragRef.current.currentHx || 0;
        const hy = penDragRef.current.currentHy || 0;
        const anchor = { x: penDragRef.current.startX, y: penDragRef.current.startY, hx, hy };
        const currentAnchors = penAnchorsRef.current;
        const newAnchors = [...currentAnchors, anchor];
        // Auto-close: drag anchor placed near first point
        if (currentAnchors.length > 1 && dist(anchor, currentAnchors[0]) < 25 / zoomRef.current) {
          const newPath = {
            id: `vec_${Date.now()}`,
            anchors: newAnchors,
            points: newAnchors.map(a => ({ x: a.x, y: a.y })),
            size: 2, opacity: 100, color: currentColorRef.current, isPen: true, isClosed: true,
            fillColor: currentColorRef.current, fillOpacity: 30, image: null,
          };
          setDrawPaths(prev => [...prev, newPath]);
          penAnchorsRef.current = [];
          setPenAnchors([]);
        } else {
          penAnchorsRef.current = newAnchors;
          setPenAnchors(newAnchors);
        }
      }
      setPenHandlePreview(null);
      penDragRef.current = penDragRef.current.wasDrag ? { wasDrag: true } : null;
    }
    if (dragging || resizing) onSaveHistory(canvasElements);
    if (draggingVector !== null) setDraggingVector(null);
    // Keep magnifier active while zoom tool is selected
    if (activeTool !== 'zoom') setMagnifierActive(false);

    // Knife tool: perform cut on mouseUp — refs only, no state timing issues
    if (activeTool === 'knife' && knifeStartRef.current && knifeEndRef.current) {
      const x1 = knifeStartRef.current.x, y1 = knifeStartRef.current.y;
      const x2 = knifeEndRef.current.x,   y2 = knifeEndRef.current.y;
      if (Math.abs(x2 - x1) > 5 || Math.abs(y2 - y1) > 5) {
        const [ex1, ey1, ex2, ey2] = _extendKnifeLine(x1, y1, x2, y2);
        const next = [];
        let didCut = false;
        canvasElements.forEach(el => {
          if (el.locked || el.hidden || el.type !== 'shape') { next.push(el); return; }
          const pieces = _splitByKnife(el, ex1, ey1, ex2, ey2);
          if (pieces) { next.push(...pieces); didCut = true; }
          else next.push(el);
        });
        if (didCut) { setCanvasElements(next); onSaveHistory(next); }
      }
      knifeStartRef.current = null;
      knifeEndRef.current = null;
      setKnifePreview(null);
    }

    setIsDrawing(false); setCurrentPath([]); setEraserTrail([]); setLassoPath([]);
    setSelectionRect(null); setSelectionStart(null);
    cropWasDraggedRef.current = false;
    setCropDragging(false); setCropStart(null); setCropHandle(null);
    setIsPanning(false); panStartRef.current = null;
    setDragging(null); activeDragRef.current = null; setResizing(null);
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

  const _pub = process.env.PUBLIC_URL || '';
  const CURSOR_ARROW  = `url("${_pub}/cursors/arrow.svg") 1 1, default`;
  const CURSOR_GRAB   = `url("${_pub}/cursors/grab.svg") 14 19, grab`;
  const CURSOR_TOUCH  = `url("${_pub}/cursors/touch.svg") 11 2, pointer`;
  const CURSOR_PEN    = `url("${_pub}/cursors/pen.svg") 1 1, crosshair`;
  const CURSOR_ERASER = `url("${_pub}/cursors/eraser.svg") 2 20, cell`;

  const getCursor = () => {
    if (activeTool === 'hand') return CURSOR_GRAB;
    if (activeTool === 'touch') return CURSOR_TOUCH;
    if (activeTool === 'pen') return CURSOR_PEN;
    if (activeTool === 'eraser') return CURSOR_ERASER;
    if (activeTool === 'select' || (!activeTool)) return CURSOR_ARROW;
    if (activeTool === 'text') return 'text';
    if (['draw', 'marking', 'cut', 'redact', 'highlighter'].includes(activeTool)) return 'crosshair';
    if (activeTool === 'zoom') return 'zoom-in';
    return CURSOR_ARROW;
  };

  const pageBg = pageBackground || '#ffffff';

  // Render vector paths with images and selection
  const renderVectorPaths = (paths, pageIdx) => {
    return paths.filter(p => !p.isHighlight).map((path, i) => {
      const isSelected = pageIdx === currentPage && selectedVector === i && path.isPen;
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
    <div ref={canvasContainerRef} data-testid="canvas-container" className="h-full overflow-auto py-4 px-0" style={{ background: 'var(--zet-bg)', touchAction: activeTool === 'hand' ? 'none' : 'pan-y', WebkitOverflowScrolling: 'touch' }}>
      <style>{`[contenteditable]::selection { background: rgba(76,168,173,0.35); } [contenteditable] *::selection { background: rgba(76,168,173,0.35); }`}</style>
      <div className="flex flex-col items-center gap-3">
        {doc.pages?.map((page, idx) => (
          <div key={page.page_id} data-testid={`canvas-page-${idx}`} ref={idx === currentPage ? canvasRef : null}
            className={`shadow-xl relative select-none transition-all duration-200 ${idx === currentPage ? 'ring-2' : 'ring-1 ring-white/20'}`}
            style={{ width: (page.pageSize?.width || pageSize.width) * zoom, height: (page.pageSize?.height || pageSize.height) * zoom, ringColor: 'var(--zet-primary-light)', cursor: getCursor(), background: pageBg, touchAction: activeTool === 'hand' ? 'none' : (['draw', 'pen', 'eraser'].includes(activeTool) ? 'none' : 'pan-y') }}
            onClick={(e) => handleCanvasClick(e, idx)} onDoubleClick={(e) => handleCanvasDoubleClick(e, idx)}
            onMouseDown={(e) => handleMouseDown(e, idx)} onMouseMove={(e) => handleMouseMove(e, idx)}
            onMouseUp={handleMouseUp} onMouseLeave={dragging || resizing || draggingVector !== null ? undefined : handleMouseUp}
            onContextMenu={(e) => {
              // Allow context menu on text elements for copy/paste
              const rect = e.currentTarget.getBoundingClientRect();
              const cx = (e.clientX - rect.left) / zoom;
              const cy = (e.clientY - rect.top) / zoom;
              const isOnText = canvasElements.some(el => el.type === 'text' && isPointInElement(cx, cy, el));
              if (!isOnText) e.preventDefault();
            }}
            onTouchStart={(e) => {
              if (e.touches.length === 2) { lastTouchDistRef.current = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); return; }
              // Double-tap = right-click on mobile
              const touch = e.touches[0];
              const now = Date.now();
              const last = lastTapTimeRef.current;
              const lastPos = lastTapPosRef.current;
              if (last && (now - last) < 300 && Math.abs(touch.clientX - lastPos.x) < 30 && Math.abs(touch.clientY - lastPos.y) < 30) {
                lastTapTimeRef.current = 0;
                e.preventDefault();
                const synth = { button: 2, clientX: touch.clientX, clientY: touch.clientY, changedTouches: [touch], touches: [], currentTarget: e.currentTarget, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation() };
                handleMouseDown(synth, idx);
                return;
              }
              lastTapTimeRef.current = now;
              lastTapPosRef.current = { x: touch.clientX, y: touch.clientY };
              if (['draw', 'pen', 'eraser'].includes(activeTool)) { e.stopPropagation(); handleMouseDown(e, idx); return; }
              if (activeTool === 'hand') { e.stopPropagation(); handleMouseDown(e, idx); return; }
              handleMouseDown(e, idx);
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && lastTouchDistRef.current) {
                e.preventDefault();
                const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
                setZoom(z => Math.max(0.25, Math.min(3, z * (d / lastTouchDistRef.current))));
                lastTouchDistRef.current = d; return;
              }
              if (['draw', 'pen', 'eraser'].includes(activeTool)) { e.stopPropagation(); handleMouseMove(e, idx); return; }
              if (activeTool === 'hand') { e.stopPropagation(); handleMouseMove(e, idx); return; }
              if (['select', 'knife'].includes(activeTool)) { e.preventDefault(); handleMouseMove(e, idx); return; }
              handleMouseMove(e, idx);
            }}
            onTouchEnd={(e) => {
              lastTouchDistRef.current = null;
              if (activeTool === 'hand') { handleMouseUp(e); return; }
              handleMouseUp(e);
            }}>
            <div className="absolute -top-7 left-0 text-xs font-medium" style={{ color: 'var(--zet-text-muted)' }}>Page {idx + 1}</div>
            
            {/* Ruler */}
            {rulerVisible && idx === currentPage && (() => {
              const pW = (page.pageSize?.width || pageSize.width);
              const pH = (page.pageSize?.height || pageSize.height);
              const PX_PER_CM = 37.8;
              const hTicks = Math.ceil(pW / PX_PER_CM * 2) + 2;
              const vTicks = Math.ceil(pH / PX_PER_CM * 2) + 2;
              const rulerBg = 'rgba(10,12,26,0.92)';
              const tickMajor = 'rgba(76,168,173,0.9)';
              const tickMinor = 'rgba(76,168,173,0.35)';
              const labelColor = 'rgba(100,200,210,0.85)';
              return (
                <>
                  {/* Horizontal ruler — above the page */}
                  <div className="absolute pointer-events-none" style={{ top: -20, left: 0, height: 20, width: pW * zoom, zIndex: 10, overflow: 'hidden' }}>
                    <svg width={pW * zoom} height={20} style={{ display: 'block' }}>
                      <rect width={pW * zoom} height={20} fill={rulerBg} />
                      <line x1={0} y1={19.5} x2={pW * zoom} y2={19.5} stroke="rgba(76,168,173,0.25)" strokeWidth={1} />
                      {Array.from({ length: hTicks }).map((_, i) => {
                        const isCm = i % 2 === 0;
                        const x = i * 0.5 * PX_PER_CM * zoom;
                        if (x > pW * zoom) return null;
                        return (
                          <g key={i}>
                            <line x1={x} y1={20 - (isCm ? 13 : 7)} x2={x} y2={20} stroke={isCm ? tickMajor : tickMinor} strokeWidth={isCm ? 1 : 0.7} />
                            {isCm && i > 0 && (
                              <text x={x + 2} y={9} fontSize={8} fill={labelColor} fontFamily="monospace">{i / 2}</text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Vertical ruler — left of the page */}
                  <div className="absolute pointer-events-none" style={{ left: -20, top: 0, width: 20, height: pH * zoom, zIndex: 10, overflow: 'hidden' }}>
                    <svg width={20} height={pH * zoom} style={{ display: 'block' }}>
                      <rect width={20} height={pH * zoom} fill={rulerBg} />
                      <line x1={19.5} y1={0} x2={19.5} y2={pH * zoom} stroke="rgba(76,168,173,0.25)" strokeWidth={1} />
                      {Array.from({ length: vTicks }).map((_, i) => {
                        const isCm = i % 2 === 0;
                        const y = i * 0.5 * PX_PER_CM * zoom;
                        if (y > pH * zoom) return null;
                        return (
                          <g key={i}>
                            <line x1={20 - (isCm ? 13 : 7)} y1={y} x2={20} y2={y} stroke={isCm ? tickMajor : tickMinor} strokeWidth={isCm ? 1 : 0.7} />
                            {isCm && i > 0 && (
                              <text x={1} y={y + 9} fontSize={8} fill={labelColor} fontFamily="monospace">{i / 2}</text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                </>
              );
            })()}
            
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
            
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible', zIndex: cropTarget && idx === currentPage ? 20 : 0 }}>
              {/* Highlight paths */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => p.isHighlight && p.type !== 'overlay').map((path, i) => (
                <path key={`h${i}`} d={`M ${path.points.map(p => `${p.x * zoom} ${p.y * zoom}`).join(' L ')}`} stroke={path.color} strokeWidth={path.size * zoom} strokeOpacity={path.opacity / 100} fill="none" strokeLinecap="butt" />
              ))}
              {/* Vector and draw paths */}
              {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => !p.isHighlight && p.type !== 'overlay').map((path, i) => {
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
                      stroke={isSelected ? '#4ca8ad' : (path.color || '#000000')}
                      strokeWidth={(isSelected ? path.size + 2 : (path.size || 2)) * zoom}
                      strokeOpacity={(path.opacity ?? 100) / 100}
                      fill={path.isClosed && !path.image ? `${path.fillColor || path.color || '#000000'}${Math.round(((path.fillOpacity ?? 20) / 100) * 255).toString(16).padStart(2, '0')}` : path.isPen && !path.image ? `${path.color || '#000000'}14` : 'none'}
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
                  {/* Pro plan: Illustrator-style distance/angle readout */}
                  {userPlan === 'pro' && penCursorPos && penAnchors.length > 0 && (() => {
                    const last = penAnchors[penAnchors.length - 1];
                    const dx = penCursorPos.x - last.x;
                    const dy = penCursorPos.y - last.y;
                    const px2mm = 210 / 794;
                    const dmm = Math.sqrt(dx * dx + dy * dy) * px2mm;
                    const angle = ((Math.atan2(-dy, dx) * 180 / Math.PI) + 360) % 360;
                    const cx = penCursorPos.x * zoom + 14;
                    const cy = penCursorPos.y * zoom - 14;
                    const label = `${dmm.toFixed(1)}mm  ${angle.toFixed(0)}°`;
                    return (
                      <g>
                        <rect x={cx - 2} y={cy - 12} width={label.length * 6 + 4} height={16} rx={3} fill="rgba(0,0,0,0.72)" />
                        <text x={cx} y={cy} fill="#fff" fontSize={11} fontFamily="monospace">{label}</text>
                      </g>
                    );
                  })()}
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
                  <rect x={cropRect.x * zoom} y={cropRect.y * zoom} width={cropRect.w * zoom} height={cropRect.h * zoom}
                    rx={cropRadius * zoom} ry={cropRadius * zoom}
                    fill="rgba(255,255,255,0.05)" stroke="#4ca8ad" strokeWidth={2} strokeDasharray="6,3" />
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
                  {/* Corner radius handle — orange circle on top edge */}
                  <circle
                    cx={(cropRect.x + cropRadius + 14 / zoom) * zoom}
                    cy={cropRect.y * zoom}
                    r={6} fill="#f59e0b" stroke="#fff" strokeWidth={1.5}
                    style={{ cursor: 'ew-resize' }}
                  />
                  {cropRadius > 0 && (
                    <text x={(cropRect.x + cropRadius + 14 / zoom) * zoom + 10} y={cropRect.y * zoom + 4}
                      fill="#f59e0b" fontSize={10} fontWeight="600">{Math.round(cropRadius)}px</text>
                  )}
                </>
              )}
            </svg>

            {/* Cut tool confirm/cancel buttons */}
            {cropTarget && cropRect && idx === currentPage && (
              <div style={{
                position: 'absolute',
                left: cropRect.x * zoom,
                top: (cropRect.y + cropRect.h) * zoom + 10,
                display: 'flex', gap: 6, zIndex: 30, pointerEvents: 'auto'
              }}>
                <button
                  onClick={(e) => { e.stopPropagation(); applyCrop(); }}
                  style={{ padding: '4px 14px', borderRadius: 6, border: 'none', background: '#4ca8ad', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                >Kırp</button>
                <button
                  onClick={(e) => { e.stopPropagation(); setCropTarget(null); setCropRect(null); setCropRadius(0); }}
                  style={{ padding: '4px 14px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 13, cursor: 'pointer' }}
                >İptal</button>
              </div>
            )}

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
            
            {/* Knife preview line */}
            {idx === currentPage && activeTool === 'knife' && knifePreview && (
              <svg style={{ position: 'absolute', inset: 0, width: pageSize.width * zoom, height: pageSize.height * zoom, pointerEvents: 'none', zIndex: 200 }}>
                <line x1={knifePreview.x1 * zoom} y1={knifePreview.y1 * zoom} x2={knifePreview.x2 * zoom} y2={knifePreview.y2 * zoom} stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3" strokeLinecap="round" />
                <circle cx={knifePreview.x1 * zoom} cy={knifePreview.y1 * zoom} r={4} fill="#ef4444" />
                <circle cx={knifePreview.x2 * zoom} cy={knifePreview.y2 * zoom} r={4} fill="#ef4444" />
              </svg>
            )}

            {(idx === currentPage ? canvasElements : page.elements || []).filter(el => !el.hidden).map(el => {
              // In text tool, text elements show no selection ring — cursor goes straight to edit
              const isSel = (selectedElement === el.id || selectedElements.includes(el.id)) && editingId !== el.id && !(activeTool === 'text' && el.type === 'text');
              const isLocked = el.locked;
              // Mirror transform
              const scaleX = el.scaleX || 1;
              const scaleY = el.scaleY || 1;
              const rotation = el.rotation || 0;
              const transformStyle = `scaleX(${scaleX}) scaleY(${scaleY}) rotate(${rotation}deg)`;
              return (
                <div key={el.id} data-testid={`canvas-element-${el.id}`} className={`absolute ${(isSel && el.type !== 'image' && el.type !== 'chart') ? 'ring-2 ring-blue-500' : ''} ${isLocked ? 'pointer-events-none' : ''} ${(el.groupId && isSel && el.type !== 'image' && el.type !== 'chart') ? 'ring-blue-400 ring-opacity-60' : ''}`}
                  style={{
                    left: el.x * zoom,
                    top: el.y * zoom,
                    width: el.type === 'text' ? (el.width ? el.width * zoom : 'auto') : (el.width || 80) * zoom,
                    height: el.type !== 'text' ? (el.height || 80) * zoom : 'auto',
                    cursor: activeTool === 'knife' ? 'crosshair' : activeTool === 'redact' ? 'crosshair' : activeTool === 'highlighter' ? 'cell' : activeTool === 'hand' && !isLocked ? CURSOR_GRAB : activeTool === 'eraser' ? CURSOR_ERASER : undefined,
                    transform: transformStyle,
                    transformOrigin: 'center center',
                    clipPath: el.clipPath ? `polygon(${el.clipPath})` : undefined,
                    ...(el.isPending ? { outline: '2px dashed #ef4444', boxShadow: '0 0 10px rgba(239,68,68,0.35)', zIndex: 50 } : {}),
                    ...(el.isPendingDelete ? { outline: '2px dashed #ef4444', opacity: 0.35, pointerEvents: 'none' } : {}),
                  }}
                  onMouseEnter={() => setHoveredElementId(el.id)}
                  onMouseLeave={() => setHoveredElementId(null)}
                  onClick={(e) => {
                    if (isLocked) return;
                    e.stopPropagation();
                    if (idx !== currentPage) {
                      pendingEditRef.current = { elementId: el.id, elementType: el.type, x: 0, y: 0, pageIdx: idx };
                      changePage(idx);
                      return;
                    }
                    setSelectedElement(el.id);
                    setSelectedElements([el.id]);
                    if (activeTool === 'text' && el.type === 'text') setEditingId(el.id);
                    if (onElementSelect) onElementSelect(el);
                  }}>
                  {el.groupId && isSel && (
                    <div className="absolute -top-5 left-0 text-[9px] px-1 py-0.5 rounded" style={{ background: 'rgba(59,130,246,0.8)', color: '#fff' }}>G</div>
                  )}
                  {el.type === 'text' && <><EditableText el={el} zoom={zoom} pageWidth={page.pageSize?.width || pageSize.width} pageMargins={margins} isEditing={editingId === el.id && idx === currentPage} onStartEdit={id => { if (idx !== currentPage) { pendingEditRef.current = { elementId: id, x: 0, y: 0, pageIdx: idx }; changePage(idx); } else { setEditingId(id); } }} onCommit={handleTextCommit} pageHeight={page.pageSize?.height || pageSize.height} onAutoAddPage={onAddPage} onFlowText={onFlowText ? (overflowHtml, obstacleBottom, elId, keepHtml) => onFlowText({ elementId: el.id, overflowHtml, el, obstacleBottom, keepHtml }) : undefined} onRemoveRedact={handleRemoveRedact} spellCheck={spellCheck} onLinkClick={onLinkClick} wrapElements={canvasElements.filter(e => e.type === 'image' && e.textWrap && e.textWrap !== 'none')} pageElements={(idx === currentPage ? canvasElements : page.elements || []).filter(e => e.id !== el.id && e.type !== 'text')} pageDark={isColorDark(pageBg)} screenplayMode={screenplayMode} onScriptElementChange={onScriptElementChange} onScreenplayEnter={handleScreenplayEnter} />
                    {isSel && !isLocked && editingId !== el.id && (
                      <div data-testid={`text-resize-${el.id}`} className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm opacity-70 hover:opacity-100" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y, isText: true, startWidth: el.width || (page.pageSize?.width || pageSize.width) - el.x - 20 }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y, isText: true, startWidth: el.width || (page.pageSize?.width || pageSize.width) - el.x - 20 }); }} />
                    )}
                  </>}
                  {el.type === 'chart' && (() => {
                    return (
                      <div className="relative w-full h-full group">
                        {el.svgContent
                          ? <div className={`w-full h-full ${el.isRedacted ? 'invisible' : ''}`} style={{ overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: el.svgContent }} />
                          : <img src={el.src} alt="" className={`w-full h-full object-contain ${el.isRedacted ? 'invisible' : ''}`} draggable={false} />}
                        {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                        {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.6, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                        {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                          <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                          {elementMenu === el.id && <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onSetTextWrap={onSetTextWrap} onEditChart={onEditChart} onClose={() => setElementMenu(null)} />}
                        </>)}
                      </div>
                    );
                  })()}
                  {el.type === 'image' && (() => {
                    const nat = imageNaturalRatios[el.id];
                    const cw = (el.width || 80) * zoom;
                    const ch = (el.height || 80) * zoom;
                    let ringStyle = null;
                    if (nat) {
                      const ca = cw / ch;
                      if (ca > nat) { const rw = ch * nat; ringStyle = { left: (cw - rw) / 2, top: 0, width: rw, height: ch }; }
                      else { const rh = cw / nat; ringStyle = { left: 0, top: (ch - rh) / 2, width: cw, height: rh }; }
                    }
                    return (
                      <div className="relative w-full h-full group">
                        <img src={el.src} alt="" className={`w-full h-full object-contain ${el.isRedacted ? 'invisible' : ''}`} draggable={false}
                          onLoad={(e) => { const { naturalWidth: nw, naturalHeight: nh } = e.target; if (nw && nh) setImageNaturalRatios(prev => ({ ...prev, [el.id]: nw / nh })); }} />
                        {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                        {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.6, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                        {isSel && ringStyle && <div className="absolute ring-2 ring-blue-500 pointer-events-none" style={ringStyle} />}
                        {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" style={ringStyle ? { left: ringStyle.left + ringStyle.width - 10, top: ringStyle.top + ringStyle.height - 10 } : {}} onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                          <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                          {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onSetTextWrap={onSetTextWrap} onClose={() => setElementMenu(null)} />}
                        </>)}
                      </div>
                    );
                  })()}
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
                                    style={{ border: `1px solid ${isColorDark(pageBg) ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'}`, padding: '3px 6px', minWidth: 30, verticalAlign: 'top', outline: 'none', cursor: 'text', wordBreak: 'break-word', whiteSpace: 'pre-wrap', background: ri === 0 && el.tableHeader ? 'rgba(76,168,173,0.25)' : 'transparent', color: isColorDark(pageBg) ? '#ffffff' : '#000000', fontWeight: ri === 0 && el.tableHeader ? 'bold' : 'normal' }}
                                    ref={(node) => { if (node && document.activeElement !== node) node.innerHTML = cell; }}
                                    onFocus={e => e.stopPropagation()}
                                    onBlur={e => { const val = e.target.innerText; setCanvasElements(prev => prev.map(x => { if (x.id !== el.id) return x; const newData = x.tableData.map((r, rri) => r.map((c, cci) => (rri === ri && cci === ci) ? val : c)); return { ...x, tableData: newData }; })); }}
                                    onMouseDown={e => { if (activeTool !== 'hand') e.stopPropagation(); }}
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
                        {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                        {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.6, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                        {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y, origWidth: el.width || 200, origFontSize: el.tableFontSize || 12 }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y, origWidth: el.width || 200, origFontSize: el.tableFontSize || 12 }); }} />
                          <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                          {elementMenu === el.id && <ElementMenu el={{...el, type: 'table'}} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onSetTextWrap={onSetTextWrap} onClose={() => setElementMenu(null)} />}
                        </>)}
                      </div>
                    );
                  })()}
                  {el.type === 'table' && !el.tableData && el.src && (
                    <div className="relative w-full h-full group">
                      <img src={el.src} alt="" className="w-full h-full object-contain" draggable={false} />
                      {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                      {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.6, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={{...el, type: 'image'}} onDelete={onDeleteElement} onChangeImage={onChangeImage} onAddImageToShape={() => {}} onAddAiImage={() => {}} onCopy={onCopyElement} onMirror={onMirrorElement} onSetTextWrap={onSetTextWrap} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'shape' && (
                    <div className="relative w-full h-full group">
                      <ShapeRenderer el={el} />
                      {el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: '#111', zIndex: 2, borderRadius: 2, pointerEvents: 'none' }} />}
                      {el.isHighlighted && !el.isRedacted && <div style={{ position: 'absolute', inset: 0, background: el.highlightColor || '#fbbf24', opacity: 0.6, zIndex: 1, borderRadius: 2, pointerEvents: 'none' }} />}
                      {isSel && !isLocked && (<><div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm" onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                        <button className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center shadow-md" style={{ background: 'var(--zet-bg-card)' }} onClick={(e) => { e.stopPropagation(); setElementMenu(elementMenu === el.id ? null : el.id); }}><MoreVertical className="h-3 w-3" style={{ color: 'var(--zet-text)' }} /></button>
                        {elementMenu === el.id && <ElementMenu el={el} onDelete={onDeleteElement} onChangeImage={() => {}} onAddImageToShape={onAddImageToShape} onAddAiImage={onAddAiImageToShape} onCopy={onCopyElement} onMirror={onMirrorElement} onSetTextWrap={onSetTextWrap} onClose={() => setElementMenu(null)} />}
                      </>)}
                    </div>
                  )}
                  {el.type === 'link' && (
                    <div className="relative w-full h-full group" style={{ display: 'flex', alignItems: 'center' }}>
                      <a
                        href={el.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => { e.stopPropagation(); if (activeTool !== 'hand') e.preventDefault(); }}
                        style={{ fontSize: (el.fontSize || 14) * zoom, color: '#4ca8ad', textDecoration: 'underline', wordBreak: 'break-word', pointerEvents: activeTool === 'hand' ? 'auto' : 'none', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {el.text || el.url}
                      </a>
                      {isSel && !isLocked && (
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 cursor-se-resize rounded-sm"
                          onMouseDown={(e) => { e.stopPropagation(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }}
                          onTouchStart={(e) => { e.stopPropagation(); e.preventDefault(); setResizing({ id: el.id, startX: el.x, startY: el.y }); }} />
                      )}
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
            
            {/* Overlay rectangles (highlight / censor) */}
            {(idx === currentPage ? drawPaths : page.drawPaths || []).filter(p => p.type === 'overlay').map(overlay => (
              <OverlayRect
                key={overlay.id}
                overlay={overlay}
                zoom={zoom}
                onRemove={(id) => {
                  const pagePaths = idx === currentPage ? drawPaths : (page.drawPaths || []);
                  const removed = pagePaths.find(p => p.id === id);
                  if (removed?.segmentId) {
                    // Aynı segmentId'ye ait tüm overlay rect'lerini kaldır
                    setDrawPaths(prev => prev.filter(p => p.segmentId !== removed.segmentId));
                    // Element içeriğini geri yükle
                    if (removed.coveredElementId) {
                      setCanvasElements(prev => prev.map(el => {
                        if (String(el.id) !== String(removed.coveredElementId)) return el;
                        const seg = (el.redactSegments || []).find(s => s.segmentId === removed.segmentId);
                        if (!seg) return el;
                        const restoredHtml = seg.originalHtml || (el.htmlContent || '') + seg.originalText;
                        return {
                          ...el,
                          content: restoredHtml.replace(/<[^>]*>/g, ''),
                          htmlContent: restoredHtml,
                          redactSegments: el.redactSegments.filter(s => s.segmentId !== removed.segmentId),
                        };
                      }));
                    }
                  } else {
                    setDrawPaths(prev => prev.filter(p => p.id !== id));
                  }
                }}
              />
            ))}
            {/* Watermark overlay */}
            {doc.watermark && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden" style={{ opacity: (doc.watermark.opacity || 20) / 100 }}>
                <span className="text-6xl font-bold rotate-[-30deg] whitespace-nowrap" style={{ color: doc.watermark.color || '#888888' }}>{doc.watermark.text}</span>
              </div>
            )}
            
            {/* Header/Footer (odd/even support) */}
            {(() => {
              const isOE = doc.headerFooterMode === 'odd-even';
              const hText = isOE ? (idx % 2 === 0 ? doc.headerOdd : doc.headerEven) : doc.header;
              const fText = isOE ? (idx % 2 === 0 ? doc.footerOdd : doc.footerEven) : doc.footer;
              return (<>
                {hText && <div className="absolute top-2 left-0 right-0 text-center text-sm pointer-events-none" style={{ color: 'var(--zet-text-muted)' }}>{hText}</div>}
                {fText && <div className="absolute bottom-2 left-0 right-0 text-center text-sm pointer-events-none" style={{ color: 'var(--zet-text-muted)' }}>{fText}</div>}
              </>);
            })()}
            
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
