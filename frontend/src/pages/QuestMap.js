import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ZoomIn, ZoomOut, Maximize2, X, Star, Trophy } from 'lucide-react';
import { generateQuestMap, SP_VALUES } from '../lib/questMapData';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_COLORS = {
  circle: { fill: '#0c2240', stroke: '#38bdf8', glow: 'rgba(56,189,248,0.55)' },
  square: { fill: '#121545', stroke: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
  triangle: { fill: '#2d1050', stroke: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
  star: { fill: '#422006', stroke: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
};
const DONE_C = { fill: '#052e16', stroke: '#4ade80', glow: 'rgba(74,222,128,0.6)' };
const LOCK_C = { fill: '#0f1118', stroke: '#1e2235', glow: 'none' };
const BG = '#050810';
const R = 20;

function drawNode(ctx, shape, x, y, r, c, hover) {
  if (c.glow !== 'none') { ctx.shadowColor = c.glow; ctx.shadowBlur = hover ? 24 : 10; }
  ctx.fillStyle = c.fill; ctx.strokeStyle = c.stroke; ctx.lineWidth = hover ? 3 : 1.8;
  ctx.beginPath();
  if (shape === 'circle') { ctx.arc(x, y, r, 0, Math.PI * 2); }
  else if (shape === 'square') {
    const s = r * 0.75, rr = 3;
    ctx.moveTo(x - s + rr, y - s); ctx.lineTo(x + s - rr, y - s);
    ctx.quadraticCurveTo(x + s, y - s, x + s, y - s + rr); ctx.lineTo(x + s, y + s - rr);
    ctx.quadraticCurveTo(x + s, y + s, x + s - rr, y + s); ctx.lineTo(x - s + rr, y + s);
    ctx.quadraticCurveTo(x - s, y + s, x - s, y + s - rr); ctx.lineTo(x - s, y - s + rr);
    ctx.quadraticCurveTo(x - s, y - s, x - s + rr, y - s);
  } else if (shape === 'triangle') {
    ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.87, y + r * 0.6); ctx.lineTo(x - r * 0.87, y + r * 0.6); ctx.closePath();
  } else if (shape === 'star') {
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 72 - 90) * Math.PI / 180, a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
      else ctx.lineTo(x + r * Math.cos(a1), y + r * Math.sin(a1));
      ctx.lineTo(x + r * 0.4 * Math.cos(a2), y + r * 0.4 * Math.sin(a2));
    }
    ctx.closePath();
  }
  ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
}

function drawLock(ctx, x, y) {
  ctx.strokeStyle = '#2a2e42'; ctx.fillStyle = '#2a2e42'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(x, y - 3, 4, Math.PI, 0); ctx.stroke();
  ctx.fillRect(x - 5, y - 0.5, 10, 7);
  ctx.fillStyle = '#0f1118'; ctx.beginPath(); ctx.arc(x, y + 2, 1.5, 0, Math.PI * 2); ctx.fill();
}

function drawCheck(ctx, x, y) {
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 6, y - 4); ctx.stroke();
  ctx.lineCap = 'butt';
}

const QuestMap = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const animRef = useRef(0);

  const [mapData, setMapData] = useState(null);
  const [completed, setCompleted] = useState(new Set());
  const [sp, setSp] = useState(0);
  const [vp, setVp] = useState({ x: 0, y: 0, z: 0.35 });
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
  const adjRef = useRef(new Map());

  useEffect(() => {
    const d = generateQuestMap();
    setMapData(d);

    const adj = new Map();
    d.connections.forEach(c => {
      if (!adj.has(c.from)) adj.set(c.from, []);
      if (!adj.has(c.to)) adj.set(c.to, []);
      adj.get(c.from).push(c.to);
      adj.get(c.to).push(c.from);
    });
    adjRef.current = adj;

    const cvs = canvasRef.current;
    const cw = cvs ? cvs.clientWidth : 960;
    const ch = cvs ? cvs.clientHeight : 600;
    setVp({ z: 0.35, x: cw / 2 - d.centerX * 0.35, y: ch / 2 - d.centerY * 0.35 });

    axios.get(`${API}/quests/progress`, { withCredentials: true })
      .then(r => { setCompleted(new Set(r.data.completed_quests || [])); setSp(r.data.quest_xp || 0); })
      .catch(() => {});
  }, []);

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
      if ((q.x - wx) ** 2 + (q.y - wy) ** 2 < (R + 12) ** 2) return q;
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
    const t = animRef.current;

    const vl = -v.x / v.z - 120, vr = (-v.x + w) / v.z + 120;
    const vt = -v.y / v.z - 120, vb = (-v.y + h) / v.z + 120;

    // Background
    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    // Subtle radial gradient from center
    const scx = md.centerX * v.z + v.x;
    const scy = md.centerY * v.z + v.y;
    const grad = ctx.createRadialGradient(scx, scy, 0, scx, scy, Math.max(w, h));
    grad.addColorStop(0, 'rgba(30,40,100,0.08)');
    grad.addColorStop(0.5, 'rgba(15,20,50,0.04)');
    grad.addColorStop(1, 'rgba(5,8,16,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.z, v.z);

    // Draw connections - the spider web
    md.connections.forEach(cn => {
      const f = md.quests[cn.from], tt = md.quests[cn.to];
      if (!f || !tt) return;
      if (f.x < vl && tt.x < vl) return;
      if (f.x > vr && tt.x > vr) return;
      if (f.y < vt && tt.y < vt) return;
      if (f.y > vb && tt.y > vb) return;

      const bothDone = comp.has(cn.from) && comp.has(cn.to);
      const anyDone = comp.has(cn.from) || comp.has(cn.to);
      const dx = tt.x - f.x, dy = tt.y - f.y;
      const len = Math.hypot(dx, dy);
      const isLong = len > 250;

      if (bothDone) {
        ctx.strokeStyle = 'rgba(74,222,128,0.55)';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
      } else if (anyDone) {
        ctx.strokeStyle = 'rgba(56,189,248,0.35)';
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.5;
      } else {
        ctx.strokeStyle = isLong ? 'rgba(100,70,180,0.2)' : 'rgba(50,60,140,0.28)';
        ctx.lineWidth = isLong ? 0.5 : 0.8;
        ctx.globalAlpha = 0.55;
      }

      const mx = (f.x + tt.x) / 2;
      const my = (f.y + tt.y) / 2;
      const curveAmt = isLong ? 20 : 0;
      const cpx = mx + (dy / (len || 1)) * curveAmt;
      const cpy = my - (dx / (len || 1)) * curveAmt;

      ctx.beginPath();
      if (curveAmt > 0) {
        ctx.moveTo(f.x, f.y);
        ctx.quadraticCurveTo(cpx, cpy, tt.x, tt.y);
      } else {
        ctx.moveTo(f.x, f.y); ctx.lineTo(tt.x, tt.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Animated pulse on center hub connections
    if (v.z > 0.2) {
      ctx.globalAlpha = 0.15 + Math.sin(t * 0.03) * 0.08;
      ctx.strokeStyle = 'rgba(56,189,248,0.4)';
      ctx.lineWidth = 2;
      for (let i = 1; i <= 20 && i < md.quests.length; i++) {
        const q = md.quests[i];
        ctx.beginPath(); ctx.moveTo(md.centerX, md.centerY); ctx.lineTo(q.x, q.y); ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }

    // Search set
    const searchSet = new Set();
    if (sq) md.quests.forEach(q => { if (q.name.toLowerCase().includes(sq) || q.desc.toLowerCase().includes(sq)) searchSet.add(q.id); });

    // Nodes
    md.quests.forEach(q => {
      if (q.x < vl || q.x > vr || q.y < vt || q.y > vb) return;
      const isDone = comp.has(q.id);
      const unlocked = isDone || isUnlocked(q.id);
      const isHov = hov === q.id;
      const isSel = sel && sel.id === q.id;
      const isMatch = searchSet.size > 0 && searchSet.has(q.id);

      if (searchSet.size > 0 && !isMatch) ctx.globalAlpha = 0.06;

      const c = isDone ? DONE_C : !unlocked ? LOCK_C : SHAPE_COLORS[q.shape] || SHAPE_COLORS.circle;
      const nr = (isHov || isSel) ? R + 4 : R;

      drawNode(ctx, q.shape, q.x, q.y, nr, c, isHov || isSel);

      if (isDone) drawCheck(ctx, q.x, q.y - 2);
      else if (!unlocked) drawLock(ctx, q.x, q.y);
      else {
        ctx.fillStyle = c.stroke; ctx.font = 'bold 8px "DM Sans",sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(`${q.sp}`, q.x, q.y + 3);
      }

      // Labels only when zoomed enough
      if (v.z > 0.3) {
        ctx.font = '8px "DM Sans",sans-serif'; ctx.textAlign = 'center';
        ctx.fillStyle = isDone ? '#86efac' : unlocked ? '#94a3b8' : '#1e2235';
        ctx.fillText(q.name, q.x, q.y + R + 13);
      }

      if (isHov || isSel) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(q.x, q.y, nr + 8, 0, Math.PI * 2); ctx.stroke();
      }
      if (isMatch) {
        ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 2;
        ctx.setLineDash([4, 3]); ctx.beginPath(); ctx.arc(q.x, q.y, nr + 10, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
      }
      ctx.globalAlpha = 1;
    });

    ctx.restore();

    animRef.current++;
  }, [isUnlocked]);

  useEffect(() => {
    let af;
    const loop = () => { render(); af = requestAnimationFrame(loop); };
    af = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(af);
  }, [render]);

  // Mouse events
  const onDown = useCallback((e) => {
    if (e.button === 0) { setDrag(true); setDragO({ x: e.clientX - vpR.current.x, y: e.clientY - vpR.current.y }); }
  }, []);
  const onMove = useCallback((e) => {
    const cvs = canvasRef.current; if (!cvs) return;
    if (drag) {
      setVp(v => ({ ...v, x: e.clientX - dragO.x, y: e.clientY - dragO.y }));
    } else {
      const rect = cvs.getBoundingClientRect();
      const q = findAt(e.clientX - rect.left, e.clientY - rect.top);
      setHovered(q ? q.id : null);
      cvs.style.cursor = q ? 'pointer' : 'grab';
    }
  }, [drag, dragO, findAt]);
  const onUp = useCallback((e) => {
    if (drag) {
      setDrag(false);
      if (Math.abs(e.clientX - (dragO.x + vpR.current.x)) < 5 && Math.abs(e.clientY - (dragO.y + vpR.current.y)) < 5) {
        const cvs = canvasRef.current; if (!cvs) return;
        const rect = cvs.getBoundingClientRect();
        setSelected(findAt(e.clientX - rect.left, e.clientY - rect.top) || null);
      }
    }
  }, [drag, dragO, findAt]);
  const onWheel = useCallback((e) => {
    e.preventDefault(); const cvs = canvasRef.current; if (!cvs) return;
    const rect = cvs.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const f = e.deltaY < 0 ? 1.12 : 0.88;
    setVp(v => {
      const nz = Math.max(0.08, Math.min(3, v.z * f));
      const s = nz / v.z;
      return { z: nz, x: mx - (mx - v.x) * s, y: my - (my - v.y) * s };
    });
  }, []);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    c.addEventListener('wheel', onWheel, { passive: false });
    return () => c.removeEventListener('wheel', onWheel);
  }, [onWheel]);

  // Touch events
  const touchR2 = useRef({ dist: 0 });
  const onTS = useCallback((e) => {
    if (e.touches.length === 1) { setDrag(true); setDragO({ x: e.touches[0].clientX - vpR.current.x, y: e.touches[0].clientY - vpR.current.y }); }
    else if (e.touches.length === 2) { touchR2.current.dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }
  }, []);
  const onTM = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 1 && drag) setVp(v => ({ ...v, x: e.touches[0].clientX - dragO.x, y: e.touches[0].clientY - dragO.y }));
    else if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (touchR2.current.dist > 0) {
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const f = d / touchR2.current.dist;
        setVp(v => { const nz = Math.max(0.08, Math.min(3, v.z * f)); const s = nz / v.z; return { z: nz, x: cx - (cx - v.x) * s, y: cy - (cy - v.y) * s }; });
      }
      touchR2.current.dist = d;
    }
  }, [drag, dragO]);
  const onTE = useCallback(() => { setDrag(false); touchR2.current.dist = 0; }, []);

  const zoomIn = () => setVp(v => ({ ...v, z: Math.min(3, v.z * 1.3) }));
  const zoomOut = () => setVp(v => ({ ...v, z: Math.max(0.08, v.z * 0.7) }));
  const resetView = () => {
    if (!mapData) return;
    const cvs = canvasRef.current;
    const cw = cvs ? cvs.clientWidth : 960;
    const ch = cvs ? cvs.clientHeight : 600;
    setVp({ z: 0.35, x: cw / 2 - mapData.centerX * 0.35, y: ch / 2 - mapData.centerY * 0.35 });
  };

  // Completion sound effect using Web Audio API
  const playCompleteSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1);
        osc.stop(ctx.currentTime + i * 0.1 + 0.5);
      });
      // Shimmer
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = 'triangle';
      shimmer.frequency.value = 1568;
      sGain.gain.setValueAtTime(0, ctx.currentTime + 0.35);
      sGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.4);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      shimmer.connect(sGain);
      sGain.connect(ctx.destination);
      shimmer.start(ctx.currentTime + 0.35);
      shimmer.stop(ctx.currentTime + 0.9);
    } catch (e) { /* audio not available */ }
  }, []);

  const doComplete = async (q) => {
    if (completed.has(q.id) || !isUnlocked(q.id)) return;
    try {
      const r = await axios.post(`${API}/quests/${q.id}/complete`, { xp: q.sp }, { withCredentials: true });
      setCompleted(new Set(r.data.completed_quests)); setSp(r.data.quest_xp);
      playCompleteSound();
    } catch (e) { console.error(e); }
  };

  const total = mapData ? mapData.quests.length : 0;
  const done = completed.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const diffLabel = { circle: 'Kolay', square: 'Orta', triangle: 'Zor', star: 'Efsanevi' };

  return (
    <div className="fixed inset-0 flex flex-col" style={{ background: BG }} data-testid="quest-map-page">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'rgba(40,50,120,0.25)', background: 'rgba(5,8,16,0.97)', zIndex: 20 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" data-testid="quest-back-btn">
            <ArrowLeft className="h-5 w-5" style={{ color: '#38bdf8' }} />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-wide" style={{ color: '#e2e8f0' }}>Gorev Haritasi</h1>
            <p className="text-[10px]" style={{ color: '#64748b' }}>{done}/{total} Tamamlandi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
            <span className="text-xs font-bold" style={{ color: '#fbbf24' }} data-testid="quest-sp-badge">{sp} SP</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.15)' }}>
            <Trophy className="h-3.5 w-3.5" style={{ color: '#4ade80' }} />
            <span className="text-xs font-bold" style={{ color: '#4ade80' }}>%{pct}</span>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b" style={{ borderColor: 'rgba(40,50,120,0.15)', background: 'rgba(5,8,16,0.95)', zIndex: 20 }}>
        <div className="flex items-center gap-2 flex-1 max-w-[200px] px-2 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Search className="h-3.5 w-3.5" style={{ color: '#64748b' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Gorev ara..." className="bg-transparent outline-none text-xs flex-1" style={{ color: '#e2e8f0' }} data-testid="quest-search-input" />
          {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: '#64748b' }} /></button>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-out"><ZoomOut className="h-4 w-4" style={{ color: '#64748b' }} /></button>
          <span className="text-[10px] px-1 min-w-[32px] text-center" style={{ color: '#475569' }}>{Math.round(vp.z * 100)}%</span>
          <button onClick={zoomIn} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-in"><ZoomIn className="h-4 w-4" style={{ color: '#64748b' }} /></button>
          <button onClick={resetView} className="p-1 rounded hover:bg-white/5" data-testid="quest-reset-view"><Maximize2 className="h-4 w-4" style={{ color: '#64748b' }} /></button>
        </div>
        <div className="hidden lg:flex items-center gap-2 ml-2 pl-2 border-l" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[['circle','#38bdf8','20 SP'],['square','#818cf8','45 SP'],['triangle','#c084fc','100 SP'],['star','#fbbf24','200 SP']].map(([s,c,l]) => (
            <div key={s} className="flex items-center gap-1">
              <div className="w-2.5 h-2.5" style={{ background: c, borderRadius: s === 'circle' ? '50%' : '2px', clipPath: s === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : s === 'star' ? 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' : 'none' }} />
              <span className="text-[10px]" style={{ color: '#475569' }}>{l}</span>
            </div>
          ))}
          <div className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full" style={{ background: '#4ade80' }} /><span className="text-[10px]" style={{ color: '#475569' }}>Bitti</span></div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" style={{ touchAction: 'none' }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp}
          onMouseLeave={() => { setDrag(false); setHovered(null); }}
          onTouchStart={onTS} onTouchMove={onTM} onTouchEnd={onTE}
          data-testid="quest-map-canvas" />

        {/* Quest Detail Panel */}
        {selected && (
          <div className="absolute bottom-3 left-3 sm:left-1/2 sm:-translate-x-1/2 rounded-xl shadow-2xl p-4 max-w-xs w-[calc(100%-1.5rem)] sm:w-auto sm:min-w-[280px]" style={{ background: 'rgba(10,14,30,0.97)', border: '1px solid rgba(40,50,120,0.4)', backdropFilter: 'blur(20px)', zIndex: 25 }} data-testid="quest-detail-panel">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: completed.has(selected.id) ? 'rgba(74,222,128,0.12)' : (SHAPE_COLORS[selected.shape]?.fill || '#121545') }}>
                  <span className="text-sm font-bold" style={{ color: completed.has(selected.id) ? '#4ade80' : (SHAPE_COLORS[selected.shape]?.stroke || '#38bdf8') }}>
                    {completed.has(selected.id) ? '\u2713' : selected.shape === 'star' ? '\u2605' : selected.shape === 'triangle' ? '\u25B2' : selected.shape === 'square' ? '\u25A0' : '\u25CF'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{selected.name}</h3>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>{diffLabel[selected.shape]}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: '#64748b' }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{selected.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1"><Star className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} /><span className="text-xs font-bold" style={{ color: '#fbbf24' }}>+{selected.sp} SP</span></div>
              {completed.has(selected.id) ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>Tamamlandi</span>
              ) : isUnlocked(selected.id) ? (
                <button onClick={() => doComplete(selected)} className="text-xs px-3 py-1.5 rounded-full font-medium hover:opacity-80 transition-opacity" style={{ background: 'linear-gradient(135deg, #1e3a8a, #38bdf8)', color: 'white' }} data-testid="quest-complete-btn">Tamamla</button>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', color: '#2a2e42' }}>Kilitli</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestMap;
