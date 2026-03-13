import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ZoomIn, ZoomOut, Maximize2, X, Star, Trophy } from 'lucide-react';
import { generateQuestMap, SP_VALUES } from '../lib/questMapData';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_COLORS = {
  circle: { fill: '#0f2847', stroke: '#4ca8dd', glow: 'rgba(76, 168, 221, 0.5)' },
  square: { fill: '#141742', stroke: '#5b7cfa', glow: 'rgba(91, 124, 250, 0.5)' },
  triangle: { fill: '#2a1248', stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.5)' },
  star: { fill: '#3d2a0f', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)' },
};
const DONE_C = { fill: '#0a2e1a', stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' };
const LOCK_C = { fill: '#111422', stroke: '#2a2e48', glow: 'none' };
const BG = '#060a14';
const GRID = 'rgba(41, 47, 145, 0.05)';
const CONN = 'rgba(41, 47, 145, 0.2)';
const CONN_ACTIVE = 'rgba(76, 168, 221, 0.6)';
const R = 22;

function drawNode(ctx, shape, x, y, r, c, hover) {
  if (c.glow !== 'none') { ctx.shadowColor = c.glow; ctx.shadowBlur = hover ? 20 : 10; }
  ctx.fillStyle = c.fill; ctx.strokeStyle = c.stroke; ctx.lineWidth = hover ? 3 : 2;
  ctx.beginPath();
  if (shape === 'circle') { ctx.arc(x, y, r, 0, Math.PI * 2); }
  else if (shape === 'square') {
    const s = r * 0.78, rr = 4;
    ctx.moveTo(x - s + rr, y - s); ctx.lineTo(x + s - rr, y - s);
    ctx.quadraticCurveTo(x + s, y - s, x + s, y - s + rr); ctx.lineTo(x + s, y + s - rr);
    ctx.quadraticCurveTo(x + s, y + s, x + s - rr, y + s); ctx.lineTo(x - s + rr, y + s);
    ctx.quadraticCurveTo(x - s, y + s, x - s, y + s - rr); ctx.lineTo(x - s, y - s + rr);
    ctx.quadraticCurveTo(x - s, y - s, x - s + rr, y - s);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.9, y + r * 0.65); ctx.lineTo(x - r * 0.9, y + r * 0.65); ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 72 - 90) * Math.PI / 180, a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
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
  const [sp, setSp] = useState(0);
  const [vp, setVp] = useState({ x: 0, y: 0, z: 0.5 });
  const [drag, setDrag] = useState(false);
  const [dragO, setDragO] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);

  const vpR = useRef(vp); vpR.current = vp;
  const mdR = useRef(mapData); mdR.current = mapData;
  const compR = useRef(completed); compR.current = completed;
  const hovR = useRef(hovered); hovR.current = hovered;
  const selR = useRef(selected); selR.current = selected;
  const searchR = useRef(search); searchR.current = search;

  // Build adjacency for web unlock
  const adjRef = useRef(new Map());

  useEffect(() => {
    const d = generateQuestMap();
    setMapData(d);

    // Build adjacency map
    const adj = new Map();
    d.connections.forEach(c => {
      if (!adj.has(c.from)) adj.set(c.from, []);
      if (!adj.has(c.to)) adj.set(c.to, []);
      adj.get(c.from).push(c.to);
      adj.get(c.to).push(c.from);
    });
    adjRef.current = adj;

    // Center viewport on quest 0
    const q0 = d.quests[0];
    if (q0) {
      const cvs = canvasRef.current;
      const cw = cvs ? cvs.clientWidth : 960;
      const ch = cvs ? cvs.clientHeight : 500;
      setVp({ z: 0.55, x: cw / 2 - q0.x * 0.55, y: ch / 2 - q0.y * 0.55 });
    }

    axios.get(`${API}/quests/progress`, { withCredentials: true })
      .then(r => { setCompleted(new Set(r.data.completed_quests || [])); setSp(r.data.quest_xp || 0); })
      .catch(() => {});
  }, []);

  // Web unlock: quest is unlocked if ANY neighbor is completed, or it's quest 0
  const isUnlocked = useCallback((qid) => {
    if (qid === 0) return true;
    if (completed.has(qid)) return true;
    const neighbors = adjRef.current.get(qid);
    if (!neighbors) return false;
    return neighbors.some(n => completed.has(n));
  }, [completed]);

  const findAt = useCallback((sx, sy) => {
    const md = mdR.current; if (!md) return null;
    const v = vpR.current;
    const wx = (sx - v.x) / v.z, wy = (sy - v.y) / v.z;
    for (let i = md.quests.length - 1; i >= 0; i--) {
      const q = md.quests[i];
      if ((q.x - wx) ** 2 + (q.y - wy) ** 2 < (R + 10) ** 2) return q;
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
    const sq = searchR.current.toLowerCase().trim();

    // Viewport culling bounds
    const vl = -v.x / v.z - 100, vr = (-v.x + w) / v.z + 100;
    const vt = -v.y / v.z - 100, vb = (-v.y + h) / v.z + 100;

    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);
    ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.z, v.z);

    // Grid
    const gs = 80;
    const gsx = Math.floor(vl / gs) * gs, gsy = Math.floor(vt / gs) * gs;
    ctx.strokeStyle = GRID; ctx.lineWidth = 1;
    for (let gx = gsx; gx < vr; gx += gs) { ctx.beginPath(); ctx.moveTo(gx, gsy); ctx.lineTo(gx, vb); ctx.stroke(); }
    for (let gy = gsy; gy < vb; gy += gs) { ctx.beginPath(); ctx.moveTo(gsx, gy); ctx.lineTo(vr, gy); ctx.stroke(); }

    // Connections (spider web)
    md.connections.forEach(cn => {
      const f = md.quests[cn.from], t = md.quests[cn.to];
      if (!f || !t) return;
      // Cull
      if (f.x < vl && t.x < vl) return;
      if (f.x > vr && t.x > vr) return;
      if (f.y < vt && t.y < vt) return;
      if (f.y > vb && t.y > vb) return;

      const bothDone = comp.has(cn.from) && comp.has(cn.to);
      const anyDone = comp.has(cn.from) || comp.has(cn.to);
      ctx.strokeStyle = bothDone ? CONN_ACTIVE : anyDone ? 'rgba(41, 47, 145, 0.3)' : CONN;
      ctx.lineWidth = bothDone ? 2 : 1;
      ctx.globalAlpha = bothDone ? 1 : anyDone ? 0.5 : 0.25;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Search
    const searchSet = new Set();
    if (sq) md.quests.forEach(q => { if (q.name.toLowerCase().includes(sq) || q.desc.toLowerCase().includes(sq)) searchSet.add(q.id); });

    // Nodes
    md.quests.forEach(q => {
      if (q.x < vl || q.x > vr || q.y < vt || q.y > vb) return; // cull
      const isDone = comp.has(q.id);
      const unlocked = isDone || isUnlocked(q.id);
      const isHov = hov === q.id;
      const isSel = sel && sel.id === q.id;
      const isMatch = searchSet.size > 0 && searchSet.has(q.id);

      if (searchSet.size > 0 && !isMatch) ctx.globalAlpha = 0.08;

      const c = isDone ? DONE_C : !unlocked ? LOCK_C : SHAPE_COLORS[q.shape] || SHAPE_COLORS.circle;
      const r = (isHov || isSel) ? R + 4 : R;

      drawNode(ctx, q.shape, q.x, q.y, r, c, isHov || isSel);

      if (isDone) drawCheck(ctx, q.x, q.y - 2);
      else if (!unlocked) drawLock(ctx, q.x, q.y);
      else { ctx.fillStyle = c.stroke; ctx.font = 'bold 9px "DM Sans",sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`${q.sp}`, q.x, q.y + 4); }

      ctx.font = '9px "DM Sans",sans-serif'; ctx.textAlign = 'center';
      ctx.fillStyle = isDone ? '#86efac' : unlocked ? '#b8cce0' : '#2a2e48';
      ctx.fillText(q.name, q.x, q.y + R + 14);

      if (isHov || isSel) { ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, r + 7, 0, Math.PI * 2); ctx.stroke(); }
      if (isMatch) { ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([5, 3]); ctx.beginPath(); ctx.arc(q.x, q.y, r + 9, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); }
      ctx.globalAlpha = 1;
    });
    ctx.restore();

    // Minimap
    const mini = minimapRef.current;
    if (mini) {
      const mc = mini.getContext('2d');
      const mw = 200, mh = 130;
      mini.width = mw; mini.height = mh;
      mc.fillStyle = 'rgba(6,10,20,0.92)'; mc.fillRect(0, 0, mw, mh);
      mc.strokeStyle = 'rgba(41,47,145,0.3)'; mc.lineWidth = 1; mc.strokeRect(0, 0, mw, mh);
      const s = Math.min(mw / md.totalWidth, mh / md.totalHeight) * 0.92;
      const ox = (mw - md.totalWidth * s) / 2, oy = (mh - md.totalHeight * s) / 2;
      // Draw web lines on minimap
      mc.strokeStyle = 'rgba(41,47,145,0.15)'; mc.lineWidth = 0.5;
      md.connections.forEach(cn => {
        const f = md.quests[cn.from], t = md.quests[cn.to];
        if (!f || !t) return;
        mc.beginPath(); mc.moveTo(f.x * s + ox, f.y * s + oy); mc.lineTo(t.x * s + ox, t.y * s + oy); mc.stroke();
      });
      md.quests.forEach(q => {
        mc.fillStyle = comp.has(q.id) ? '#22c55e' : SHAPE_COLORS[q.shape]?.stroke || '#292f91';
        mc.beginPath(); mc.arc(q.x * s + ox, q.y * s + oy, 1.5, 0, Math.PI * 2); mc.fill();
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

  const onDown = useCallback((e) => { if (e.button === 0) { setDrag(true); setDragO({ x: e.clientX - vp.x, y: e.clientY - vp.y }); } }, [vp]);
  const onMove = useCallback((e) => {
    const cvs = canvasRef.current; if (!cvs) return;
    if (drag) { setVp(v => ({ ...v, x: e.clientX - dragO.x, y: e.clientY - dragO.y })); }
    else { const rect = cvs.getBoundingClientRect(); const q = findAt(e.clientX - rect.left, e.clientY - rect.top); setHovered(q ? q.id : null); cvs.style.cursor = q ? 'pointer' : 'grab'; }
  }, [drag, dragO, findAt]);
  const onUp = useCallback((e) => {
    if (drag) { setDrag(false); if (Math.abs(e.clientX - (dragO.x + vp.x)) < 5 && Math.abs(e.clientY - (dragO.y + vp.y)) < 5) { const cvs = canvasRef.current; if (!cvs) return; const rect = cvs.getBoundingClientRect(); setSelected(findAt(e.clientX - rect.left, e.clientY - rect.top) || null); } }
  }, [drag, dragO, vp, findAt]);
  const onWheel = useCallback((e) => {
    e.preventDefault(); const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect(); const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const f = e.deltaY < 0 ? 1.12 : 0.88;
    setVp(v => { const nz = Math.max(0.1, Math.min(3, v.z * f)); const s = nz / v.z; return { z: nz, x: mx - (mx - v.x) * s, y: my - (my - v.y) * s }; });
  }, []);
  useEffect(() => { const c = canvasRef.current; if (!c) return; c.addEventListener('wheel', onWheel, { passive: false }); return () => c.removeEventListener('wheel', onWheel); }, [onWheel]);

  // Touch
  const touchR2 = useRef({ dist: 0 });
  const onTS = useCallback((e) => {
    if (e.touches.length === 1) { setDrag(true); setDragO({ x: e.touches[0].clientX - vp.x, y: e.touches[0].clientY - vp.y }); }
    else if (e.touches.length === 2) { touchR2.current.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
  }, [vp]);
  const onTM = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag) setVp(v => ({ ...v, x: e.touches[0].clientX - dragO.x, y: e.touches[0].clientY - dragO.y }));
    else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (touchR2.current.dist > 0) { const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2, cy = (e.touches[0].clientY + e.touches[1].clientY) / 2; const f = d / touchR2.current.dist; setVp(v => { const nz = Math.max(0.1, Math.min(3, v.z * f)); const s = nz / v.z; return { z: nz, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s }; }); }
      touchR2.current.dist = d;
    }
  }, [drag, dragO]);
  const onTE = useCallback(() => { setDrag(false); touchR2.current.dist = 0; }, []);

  const zoomIn = () => setVp(v => ({ ...v, z: Math.min(3, v.z * 1.3) }));
  const zoomOut = () => setVp(v => ({ ...v, z: Math.max(0.1, v.z * 0.7) }));
  const resetView = () => {
    if (!mapData || !mapData.quests[0]) return;
    const q0 = mapData.quests[0];
    const cvs = canvasRef.current;
    const cw = cvs ? cvs.clientWidth : 960;
    const ch = cvs ? cvs.clientHeight : 500;
    setVp({ z: 0.55, x: cw / 2 - q0.x * 0.55, y: ch / 2 - q0.y * 0.55 });
  };

  const doComplete = async (q) => {
    if (completed.has(q.id) || !isUnlocked(q.id)) return;
    try {
      const r = await axios.post(`${API}/quests/${q.id}/complete`, { xp: q.sp }, { withCredentials: true });
      setCompleted(new Set(r.data.completed_quests)); setSp(r.data.quest_xp);
    } catch (e) { console.error(e); }
  };

  const total = mapData ? mapData.quests.length : 0;
  const done = completed.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const diffLabel = { circle: 'Kolay', square: 'Orta', triangle: 'Zor', star: 'Efsanevi' };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: BG }} data-testid="quest-map-page">
      <header className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: 'rgba(41,47,145,0.25)', background: 'rgba(6,10,20,0.97)', zIndex: 20 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 rounded-lg hover:bg-white/5" data-testid="quest-back-btn"><ArrowLeft className="h-5 w-5" style={{ color: '#4ca8dd' }} /></button>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#e0e5e9' }}>Gorev Haritasi</h1>
            <p className="text-[11px]" style={{ color: '#8a9cad' }}>{done}/{total} Tamamlandi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)' }}>
            <Star className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} />
            <span className="text-xs font-bold" style={{ color: '#f59e0b' }} data-testid="quest-sp-badge">{sp} SP</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Trophy className="h-3.5 w-3.5" style={{ color: '#22c55e' }} />
            <span className="text-xs font-bold" style={{ color: '#22c55e' }}>%{pct}</span>
          </div>
        </div>
      </header>

      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'rgba(41,47,145,0.15)', background: 'rgba(6,10,20,0.95)', zIndex: 20 }}>
        <div className="flex items-center gap-2 flex-1 max-w-[220px] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: '#8a9cad' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Gorev ara..." className="bg-transparent outline-none text-xs flex-1" style={{ color: '#e0e5e9' }} data-testid="quest-search-input" />
          {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: '#8a9cad' }} /></button>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-out"><ZoomOut className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
          <span className="text-[10px] px-1 min-w-[36px] text-center" style={{ color: '#666' }}>{Math.round(vp.z * 100)}%</span>
          <button onClick={zoomIn} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-in"><ZoomIn className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
          <button onClick={resetView} className="p-1 rounded hover:bg-white/5" data-testid="quest-reset-view"><Maximize2 className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
        </div>
        <div className="hidden lg:flex items-center gap-2.5 ml-2 pl-2 border-l" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          {[['circle','#4ca8dd','20 SP'],['square','#5b7cfa','45 SP'],['triangle','#a855f7','100 SP'],['star','#f59e0b','200 SP']].map(([s,c,l]) => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5" style={{ background: c, borderRadius: s === 'circle' ? '50%' : '2px', clipPath: s === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : s === 'star' ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : 'none' }} />
              <span className="text-[10px]" style={{ color: '#666' }}>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#22c55e' }} /><span className="text-[10px]" style={{ color: '#666' }}>Bitti</span></div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onMouseLeave={() => { setDrag(false); setHovered(null); }}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          data-testid="quest-map-canvas" />
        <canvas ref={minimapRef} className="absolute bottom-3 right-3 rounded-lg pointer-events-none" style={{ width: 200, height: 130, border: '1px solid rgba(41,47,145,0.3)' }} data-testid="quest-minimap" />

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
                  <span className="text-[10px]" style={{ color: '#8a9cad' }}>{diffLabel[selected.shape]}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: '#8a9cad' }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: '#8a9cad' }}>{selected.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5" style={{ color: '#f59e0b' }} /><span className="text-xs font-bold" style={{ color: '#f59e0b' }}>+{selected.sp} SP</span></div>
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
