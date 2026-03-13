import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ZoomIn, ZoomOut, Maximize2, X, Star, Trophy, ChevronDown } from 'lucide-react';
import { generateQuestMap, CATEGORIES } from '../lib/questMapData';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_COLORS = {
  circle: { fill: '#0f2847', stroke: '#4ca8dd', glow: 'rgba(76, 168, 221, 0.5)' },
  square: { fill: '#141742', stroke: '#5b7cfa', glow: 'rgba(91, 124, 250, 0.5)' },
  triangle: { fill: '#2a1248', stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  star: { fill: '#3d2a0f', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
};
const COMPLETED = { fill: '#0a2e1a', stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' };
const LOCKED = { fill: '#111422', stroke: '#2a2e48', glow: 'none' };
const CONN_COLOR = 'rgba(41, 47, 145, 0.35)';
const CONN_ACTIVE = '#4ca8dd';
const BG = '#060a14';
const GRID = 'rgba(41, 47, 145, 0.06)';
const R = 24;

function drawNode(ctx, shape, x, y, r, c, isHover) {
  if (c.glow !== 'none') { ctx.shadowColor = c.glow; ctx.shadowBlur = isHover ? 18 : 12; }
  ctx.fillStyle = c.fill;
  ctx.strokeStyle = c.stroke;
  ctx.lineWidth = isHover ? 3 : 2;
  ctx.beginPath();
  if (shape === 'circle') {
    ctx.arc(x, y, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    const s = r * 0.78;
    const rr = 4;
    ctx.moveTo(x - s + rr, y - s); ctx.lineTo(x + s - rr, y - s);
    ctx.quadraticCurveTo(x + s, y - s, x + s, y - s + rr); ctx.lineTo(x + s, y + s - rr);
    ctx.quadraticCurveTo(x + s, y + s, x + s - rr, y + s); ctx.lineTo(x - s + rr, y + s);
    ctx.quadraticCurveTo(x - s, y + s, x - s, y + s - rr); ctx.lineTo(x - s, y - s + rr);
    ctx.quadraticCurveTo(x - s, y - s, x - s + rr, y - s);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.9, y + r * 0.65); ctx.lineTo(x - r * 0.9, y + r * 0.65);
    ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 72 - 90) * Math.PI / 180;
      const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
      else ctx.lineTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
      ctx.lineTo(x + r * 0.42 * Math.cos(a2), y + r * 0.42 * Math.sin(a2));
    }
    ctx.closePath();
  }
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
}

function drawLock(ctx, x, y) {
  ctx.strokeStyle = '#3a3e58'; ctx.fillStyle = '#3a3e58'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y - 4, 5, Math.PI, 0); ctx.stroke();
  ctx.fillRect(x - 6, y - 1, 12, 9);
  ctx.fillStyle = '#111422'; ctx.beginPath(); ctx.arc(x, y + 2, 2, 0, Math.PI * 2); ctx.fill();
}

function drawCheck(ctx, x, y) {
  ctx.strokeStyle = '#22c55e'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 6, y - 4); ctx.stroke();
  ctx.lineCap = 'butt';
}

const QuestMap = () => {
  const canvasRef = useRef(null);
  const minimapRef = useRef(null);
  const navigate = useNavigate();

  const [mapData, setMapData] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [xp, setXp] = useState(0);
  const [vp, setVp] = useState({ x: 0, y: 0, z: 0.55 });
  const [drag, setDrag] = useState(false);
  const [dragO, setDragO] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState(null);
  const [showCats, setShowCats] = useState(false);
  const [hovered, setHovered] = useState(null);

  const vpR = useRef(vp); vpR.current = vp;
  const mdR = useRef(mapData); mdR.current = mapData;
  const compR = useRef(completed); compR.current = completed;
  const hovR = useRef(hovered); hovR.current = hovered;
  const selR = useRef(selected); selR.current = selected;
  const catR = useRef(catFilter); catR.current = catFilter;
  const searchR = useRef(search); searchR.current = search;

  useEffect(() => {
    const d = generateQuestMap();
    setMapData(d);
    setVp(v => ({ ...v, x: -50, y: -30 }));
    axios.get(`${API}/quests/progress`, { withCredentials: true })
      .then(r => { setCompleted(new Set(r.data.completed_quests || [])); setXp(r.data.quest_xp || 0); })
      .catch(() => {});
  }, []);

  const isUnlocked = useCallback((qid) => {
    if (!mapData) return false;
    const c = mapData.connections.find(cn => cn.to === qid);
    if (!c) return true;
    return completed.has(c.from);
  }, [mapData, completed]);

  const findAt = useCallback((sx, sy) => {
    const md = mdR.current; if (!md) return null;
    const v = vpR.current;
    const wx = (sx - v.x) / v.z, wy = (sy - v.y) / v.z;
    const cf = catR.current;
    for (let i = md.quests.length - 1; i >= 0; i--) {
      const q = md.quests[i];
      if (cf && q.categoryId !== cf) continue;
      const d = (q.x - wx) ** 2 + (q.y - wy) ** 2;
      if (d < (R + 10) ** 2) return q;
    }
    return null;
  }, []);

  const render = useCallback(() => {
    const cvs = canvasRef.current; if (!cvs || !mdR.current) return;
    const ctx = cvs.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const w = cvs.clientWidth, h = cvs.clientHeight;
    if (cvs.width !== w * dpr || cvs.height !== h * dpr) { cvs.width = w * dpr; cvs.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const v = vpR.current, md = mdR.current, comp = compR.current;
    const hov = hovR.current, sel = selR.current;
    const cf = catR.current, sq = searchR.current.toLowerCase().trim();

    // BG
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.z, v.z);

    // Grid
    const gs = 80;
    const sx = Math.floor(-v.x / v.z / gs) * gs - gs;
    const sy = Math.floor(-v.y / v.z / gs) * gs - gs;
    const ex = sx + w / v.z + gs * 2, ey = sy + h / v.z + gs * 2;
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    for (let gx = sx; gx < ex; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, sy); ctx.lineTo(gx, ey); ctx.stroke(); }
    for (let gy = sy; gy < ey; gy += gs) { ctx.beginPath(); ctx.moveTo(sx, gy); ctx.lineTo(ex, gy); ctx.stroke(); }

    // Category backgrounds
    md.categoryLabels.forEach(cat => {
      if (cf && !CATEGORIES.find(c => c.name === cat.name && c.id === cf)) return;
      const cqs = md.quests.filter(q => q.category === cat.name);
      if (!cqs.length) return;
      const mnY = Math.min(...cqs.map(q => q.y)), mxY = Math.max(...cqs.map(q => q.y));
      const mnX = Math.min(...cqs.map(q => q.x)), mxX = Math.max(...cqs.map(q => q.x));

      // Category panel
      ctx.fillStyle = 'rgba(16, 20, 42, 0.6)';
      ctx.beginPath(); ctx.roundRect(mnX - 40, mnY - 65, mxX - mnX + 80, mxY - mnY + 110, 16); ctx.fill();
      ctx.strokeStyle = 'rgba(41, 47, 145, 0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(mnX - 40, mnY - 65, mxX - mnX + 80, mxY - mnY + 110, 16); ctx.stroke();

      // Category title
      ctx.fillStyle = '#4ca8dd'; ctx.font = 'bold 15px "DM Sans", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText(cat.name, (mnX + mxX) / 2, mnY - 40);
      ctx.fillStyle = 'rgba(138, 156, 173, 0.7)'; ctx.font = '11px "DM Sans", sans-serif';
      ctx.fillText(cat.desc, (mnX + mxX) / 2, mnY - 24);
    });

    // Connections
    md.connections.forEach(cn => {
      const f = md.quests[cn.from], t = md.quests[cn.to];
      if (!f || !t) return;
      if (cf && (f.categoryId !== cf || t.categoryId !== cf)) return;
      const active = comp.has(cn.from);
      ctx.strokeStyle = active ? CONN_ACTIVE : CONN_COLOR;
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.globalAlpha = active ? 0.85 : 0.5;
      ctx.beginPath();
      if (Math.abs(f.x - t.x) < 10) {
        ctx.moveTo(f.x, f.y + R); ctx.lineTo(t.x, t.y - R);
      } else {
        const cpx = f.x + (t.x - f.x) * 0.5;
        ctx.moveTo(f.x + R, f.y); ctx.bezierCurveTo(cpx, f.y, cpx, t.y, t.x, t.y - R);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    });

    // Search matches
    const searchSet = new Set();
    if (sq) md.quests.forEach(q => { if (q.name.toLowerCase().includes(sq) || q.desc.toLowerCase().includes(sq)) searchSet.add(q.id); });

    // Nodes
    md.quests.forEach(q => {
      if (cf && q.categoryId !== cf) return;
      const isDone = comp.has(q.id);
      const unlocked = isDone || isUnlocked(q.id);
      const isHov = hov === q.id;
      const isSel = sel && sel.id === q.id;
      const isMatch = searchSet.size > 0 && searchSet.has(q.id);

      if (searchSet.size > 0 && !isMatch) ctx.globalAlpha = 0.12;

      const c = isDone ? COMPLETED : !unlocked ? LOCKED : SHAPE_COLORS[q.shape] || SHAPE_COLORS.circle;
      const r = (isHov || isSel) ? R + 4 : R;

      drawNode(ctx, q.shape, q.x, q.y, r, c, isHov || isSel);

      // Inner icon
      if (isDone) { drawCheck(ctx, q.x, q.y - 2); }
      else if (!unlocked) { drawLock(ctx, q.x, q.y); }
      else {
        ctx.fillStyle = c.stroke; ctx.font = 'bold 10px "DM Sans", sans-serif'; ctx.textAlign = 'center';
        ctx.fillText(`${q.xp}`, q.x, q.y + 4);
      }

      // Name
      ctx.font = '10px "DM Sans", sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = isDone ? '#86efac' : unlocked ? '#b8cce0' : '#3a3e58';
      ctx.fillText(q.name, q.x, q.y + R + 15);

      // Hover/select ring
      if (isHov || isSel) {
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, r + 7, 0, Math.PI * 2); ctx.stroke();
      }

      // Search highlight
      if (isMatch) {
        ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]);
        ctx.beginPath(); ctx.arc(q.x, q.y, r + 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    // Minimap
    const mini = minimapRef.current;
    if (mini) {
      const mc = mini.getContext('2d');
      const mw = 180, mh = 110;
      mini.width = mw; mini.height = mh;
      mc.fillStyle = 'rgba(6,10,20,0.92)'; mc.fillRect(0, 0, mw, mh);
      mc.strokeStyle = 'rgba(41,47,145,0.4)'; mc.lineWidth = 1; mc.strokeRect(0, 0, mw, mh);
      const s = Math.min(mw / md.totalWidth, mh / md.totalHeight) * 0.88;
      const ox = (mw - md.totalWidth * s) / 2, oy = (mh - md.totalHeight * s) / 2;
      md.quests.forEach(q => {
        mc.fillStyle = comp.has(q.id) ? '#22c55e' : '#292f91';
        mc.fillRect(q.x * s + ox - 1, q.y * s + oy - 1, 2, 2);
      });
      mc.strokeStyle = '#4ca8dd'; mc.lineWidth = 1.5;
      mc.strokeRect((-v.x / v.z) * s + ox, (-v.y / v.z) * s + oy, (w / v.z) * s, (h / v.z) * s);
    }
  }, [isUnlocked]);

  useEffect(() => {
    let af;
    const loop = () => { render(); af = requestAnimationFrame(loop); };
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
  }, [render]);

  // Mouse
  const onDown = useCallback((e) => {
    if (e.button === 0) { setDrag(true); setDragO({ x: e.clientX - vp.x, y: e.clientY - vp.y }); }
  }, [vp]);

  const onMove = useCallback((e) => {
    const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    if (drag) {
      setVp(v => ({ ...v, x: e.clientX - dragO.x, y: e.clientY - dragO.y }));
    } else {
      const q = findAt(e.clientX - rect.left, e.clientY - rect.top);
      setHovered(q ? q.id : null);
      cvs.style.cursor = q ? 'pointer' : drag ? 'grabbing' : 'grab';
    }
  }, [drag, dragO, findAt]);

  const onUp = useCallback((e) => {
    if (drag) {
      setDrag(false);
      if (Math.abs(e.clientX - (dragO.x + vp.x)) < 5 && Math.abs(e.clientY - (dragO.y + vp.y)) < 5) {
        const cvs = canvasRef.current; if (!cvs) return;
        const rect = cvs.getBoundingClientRect();
        const q = findAt(e.clientX - rect.left, e.clientY - rect.top);
        setSelected(q || null);
      }
    }
  }, [drag, dragO, vp, findAt]);

  const onWheel = useCallback((e) => {
    e.preventDefault();
    const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const f = e.deltaY < 0 ? 1.12 : 0.88;
    setVp(v => {
      const nz = Math.max(0.12, Math.min(3, v.z * f));
      const s = nz / v.z;
      return { z: nz, x: mx - (mx - v.x) * s, y: my - (my - v.y) * s };
    });
  }, []);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Touch
  const touchR2 = useRef({ dist: 0 });
  const onTS = useCallback((e) => {
    if (e.touches.length === 1) { setDrag(true); setDragO({ x: e.touches[0].clientX - vp.x, y: e.touches[0].clientY - vp.y }); }
    else if (e.touches.length === 2) {
      touchR2.current.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
    }
  }, [vp]);
  const onTM = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag) setVp(v => ({ ...v, x: e.touches[0].clientX - dragO.x, y: e.touches[0].clientY - dragO.y }));
    else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (touchR2.current.dist > 0) {
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const f = d / touchR2.current.dist;
        setVp(v => { const nz = Math.max(0.12, Math.min(3, v.z * f)); const s = nz / v.z; return { z: nz, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s }; });
      }
      touchR2.current.dist = d;
    }
  }, [drag, dragO]);
  const onTE = useCallback(() => { setDrag(false); touchR2.current.dist = 0; }, []);

  const zoomIn = () => setVp(v => ({ ...v, z: Math.min(3, v.z * 1.3) }));
  const zoomOut = () => setVp(v => ({ ...v, z: Math.max(0.12, v.z * 0.7) }));
  const resetView = () => setVp({ x: -50, y: -30, z: 0.55 });

  const goToCat = (id) => {
    if (!mapData) return;
    const cqs = mapData.quests.filter(q => q.categoryId === id);
    if (!cqs.length) return;
    const ax = cqs.reduce((s, q) => s + q.x, 0) / cqs.length;
    const ay = cqs.reduce((s, q) => s + q.y, 0) / cqs.length;
    const cvs = canvasRef.current; if (!cvs) return;
    setVp({ z: 0.75, x: cvs.clientWidth / 2 - ax * 0.75, y: cvs.clientHeight / 2 - ay * 0.75 });
    setCatFilter(id === catFilter ? null : id);
    setShowCats(false);
  };

  const doComplete = async (q) => {
    if (completed.has(q.id) || !isUnlocked(q.id)) return;
    try {
      const r = await axios.post(`${API}/quests/${q.id}/complete`, { xp: q.xp }, { withCredentials: true });
      setCompleted(new Set(r.data.completed_quests)); setXp(r.data.quest_xp);
    } catch (e) { console.error(e); }
  };

  const total = mapData ? mapData.quests.length : 0;
  const done = completed.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const diffLabel = { circle: 'Kolay', square: 'Orta', triangle: 'Zor', star: 'Efsanevi' };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: BG }} data-testid="quest-map-page">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(41,47,145,0.25)', background: 'rgba(6,10,20,0.97)', zIndex: 20 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/5" data-testid="quest-back-btn">
            <ArrowLeft className="h-5 w-5" style={{ color: '#4ca8dd' }} />
          </button>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#e0e5e9' }}>Gorev Haritasi</h1>
            <p className="text-[11px]" style={{ color: '#8a9cad' }}>{done}/{total} Tamamlandi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Star className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
            <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{xp} XP</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Trophy className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
            <span className="text-xs font-bold" style={{ color: '#22c55e' }}>%{pct}</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'rgba(41,47,145,0.15)', background: 'rgba(6,10,20,0.95)', zIndex: 20 }}>
        <div className="flex items-center gap-2 flex-1 max-w-[220px] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: '#8a9cad' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Gorev ara..." className="bg-transparent outline-none text-xs flex-1" style={{ color: '#e0e5e9' }} data-testid="quest-search-input" />
          {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: '#8a9cad' }} /></button>}
        </div>
        <div className="relative">
          <button onClick={() => setShowCats(!showCats)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs" style={{ background: catFilter ? 'rgba(76,168,221,0.12)' : 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: catFilter ? '#4ca8dd' : '#8a9cad' }} data-testid="quest-category-filter">
            {catFilter ? CATEGORIES.find(c => c.id === catFilter)?.name : 'Kategoriler'} <ChevronDown className="h-3 w-3" />
          </button>
          {showCats && (
            <div className="absolute top-full left-0 mt-1 rounded-lg shadow-xl py-1 min-w-[200px] max-h-[320px] overflow-y-auto" style={{ background: '#131730', border: '1px solid rgba(41,47,145,0.4)', zIndex: 30 }}>
              <button onClick={() => { setCatFilter(null); setShowCats(false); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: !catFilter ? '#4ca8dd' : '#8a9cad' }}>Tumu</button>
              {CATEGORIES.map(c => (
                <button key={c.id} onClick={() => goToCat(c.id)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-white/5" style={{ color: catFilter === c.id ? '#4ca8dd' : '#e0e5e9' }}>
                  {c.name} <span style={{ color: '#555' }}>{mapData ? mapData.quests.filter(q => q.categoryId === c.id).length : 0}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-out"><ZoomOut className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
          <span className="text-[10px] px-1 min-w-[36px] text-center" style={{ color: '#666' }}>{Math.round(vp.z * 100)}%</span>
          <button onClick={zoomIn} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-in"><ZoomIn className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
          <button onClick={resetView} className="p-1 rounded hover:bg-white/5" data-testid="quest-reset-view"><Maximize2 className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
        </div>
        <div className="hidden lg:flex items-center gap-2.5 ml-2 pl-2 border-l" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {[['circle','#4ca8dd','Kolay'],['square','#5b7cfa','Orta'],['triangle','#a855f7','Zor'],['star','#f59e0b','Efsanevi']].map(([s,c,l]) => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5" style={{ background: c, borderRadius: s === 'circle' ? '50%' : s === 'star' ? '1px' : '2px', clipPath: s === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : s === 'star' ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : 'none' }} />
              <span className="text-[10px]" style={{ color: '#666' }}>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} /><span className="text-[10px]" style={{ color: '#666' }}>Bitti</span></div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onMouseLeave={() => { setDrag(false); setHovered(null); }}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          data-testid="quest-map-canvas" />

        {/* Minimap */}
        <canvas ref={minimapRef} className="absolute bottom-3 right-3 rounded-lg pointer-events-none" style={{ width: 180, height: 110, border: '1px solid rgba(41,47,145,0.3)' }} data-testid="quest-minimap" />

        {/* Detail Panel */}
        {selected && (
          <div className="absolute bottom-3 left-3 sm:left-1/2 sm:-translate-x-1/2 rounded-xl shadow-2xl p-4 max-w-xs w-[calc(100%-1.5rem)] sm:w-auto sm:min-w-[300px]" style={{ background: 'rgba(16,20,42,0.97)', border: '1px solid rgba(41,47,145,0.4)', backdropFilter: 'blur(16px)', zIndex: 25 }} data-testid="quest-detail-panel">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: completed.has(selected.id) ? 'rgba(34,197,94,0.15)' : (SHAPE_COLORS[selected.shape]?.fill || '#141742') }}>
                  <span className="text-sm font-bold" style={{ color: completed.has(selected.id) ? '#22c55e' : (SHAPE_COLORS[selected.shape]?.stroke || '#4ca8dd') }}>
                    {completed.has(selected.id) ? '✓' : selected.shape === 'star' ? '★' : selected.shape === 'triangle' ? '▲' : selected.shape === 'square' ? '■' : '●'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#e0e5e9' }}>{selected.name}</h3>
                  <span className="text-[10px]" style={{ color: '#8a9cad' }}>{selected.category} - {diffLabel[selected.shape]}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: '#8a9cad' }}>{selected.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /><span className="text-xs font-bold" style={{ color: '#f59e0b' }}>+{selected.xp} XP</span></div>
              {completed.has(selected.id) ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>Tamamlandi</span>
              ) : isUnlocked(selected.id) ? (
                <button onClick={() => doComplete(selected)} className="text-xs px-3 py-1.5 rounded-full font-medium hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(135deg, #292f91, #4ca8dd)', color: 'white' }} data-testid="quest-complete-btn">Tamamla</button>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#3a3e58' }}>Kilitli</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestMap;
