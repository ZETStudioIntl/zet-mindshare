import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, ZoomIn, ZoomOut, Maximize2, X, Star, Trophy } from 'lucide-react';
import { generateQuestMap } from '../lib/questMapData';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SHAPE_COLORS = {
  circle: { fill: '#0c2240', stroke: '#38bdf8', glow: 'rgba(56,189,248,0.55)' },
  square: { fill: '#121545', stroke: '#818cf8', glow: 'rgba(129,140,248,0.5)' },
  triangle: { fill: '#2d1050', stroke: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
  star: { fill: '#422006', stroke: '#fbbf24', glow: 'rgba(251,191,36,0.6)' },
};
const DONE_C = { fill: '#052e16', stroke: '#4ade80', glow: 'rgba(74,222,128,0.6)' };
const PENDING_C = { fill: '#2d1f00', stroke: '#fbbf24', glow: 'rgba(251,191,36,0.75)' };
const LOCK_C = { fill: '#0f1118', stroke: '#1e2235', glow: 'none' };
const BG = '#050810';
const R = 20;

function drawBorder(ctx, md) {
  if (!md.mapMinX) return;
  const { mapMinX: x1, mapMinY: y1, mapMaxX: x2, mapMaxY: y2 } = md;
  const w = x2 - x1, h = y2 - y1;
  const STEP = 55;

  ctx.strokeStyle = 'rgba(56,189,248,0.22)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.strokeRect(x1, y1, w, h);

  const PAD = 16;
  ctx.strokeStyle = 'rgba(56,189,248,0.10)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(x1 + PAD, y1 + PAD, w - PAD * 2, h - PAD * 2);

  const drawBorderShape = (bx, by, idx) => {
    const shapes = ['circle', 'square', 'diamond', 'circle', 'square'];
    const s = shapes[idx % shapes.length];
    const r = 4;
    ctx.fillStyle = 'rgba(56,189,248,0.28)';
    ctx.strokeStyle = 'rgba(56,189,248,0.45)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    if (s === 'circle') {
      ctx.arc(bx, by, r, 0, Math.PI * 2);
    } else if (s === 'square') {
      ctx.rect(bx - r, by - r, r * 2, r * 2);
    } else {
      ctx.moveTo(bx, by - r * 1.3);
      ctx.lineTo(bx + r * 1.3, by);
      ctx.lineTo(bx, by + r * 1.3);
      ctx.lineTo(bx - r * 1.3, by);
      ctx.closePath();
    }
    ctx.fill();
    ctx.stroke();
  };

  let idx = 0;
  for (let bx = x1 + STEP; bx < x2 - STEP / 2; bx += STEP) {
    drawBorderShape(bx, y1, idx++);
    drawBorderShape(bx, y2, idx++);
  }
  for (let by = y1 + STEP; by < y2 - STEP / 2; by += STEP) {
    drawBorderShape(x1, by, idx++);
    drawBorderShape(x2, by, idx++);
  }

  const drawCornerStar = (cx, cy) => {
    const r = 10, ir = 4;
    ctx.fillStyle = 'rgba(251,191,36,0.7)';
    ctx.strokeStyle = 'rgba(251,191,36,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a1 = (i * 72 - 90) * Math.PI / 180;
      const a2 = ((i * 72) + 36 - 90) * Math.PI / 180;
      if (i === 0) ctx.moveTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
      else ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
      ctx.lineTo(cx + ir * Math.cos(a2), cy + ir * Math.sin(a2));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  };
  drawCornerStar(x1, y1);
  drawCornerStar(x2, y1);
  drawCornerStar(x1, y2);
  drawCornerStar(x2, y2);
}

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

function drawCheck(ctx, x, y) {
  ctx.strokeStyle = '#4ade80'; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 6, y - 4); ctx.stroke();
  ctx.lineCap = 'butt';
}

const QuestMap = () => {
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const animRef = useRef(0);
  const zpBadgeRef = useRef(null);

  const [mapData, setMapData] = useState(null);
  const [pendingSet, setPendingSet] = useState(new Set());
  const [collectedSet, setCollectedSet] = useState(new Set());
  const [zp, setZp] = useState(0);
  const [vp, setVp] = useState({ x: 0, y: 0, z: 0.55 });
  const [drag, setDrag] = useState(false);
  const [dragO, setDragO] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [hovered, setHovered] = useState(null);
  const [zpFly, setZpFly] = useState(null); // { x, y, zp, key }
  const [collecting, setCollecting] = useState(false);

  const vpR = useRef(vp); vpR.current = vp;
  const mdR = useRef(mapData); mdR.current = mapData;
  const pendR = useRef(pendingSet); pendR.current = pendingSet;
  const collR = useRef(collectedSet); collR.current = collectedSet;
  const hovR = useRef(hovered); hovR.current = hovered;
  const selR = useRef(selected); selR.current = selected;
  const searchR = useRef(search); searchR.current = search;

  useEffect(() => {
    const d = generateQuestMap();
    setMapData(d);

    const initVp = () => {
      const cvs2 = canvasRef.current;
      const cw = (cvs2 && cvs2.offsetWidth > 0) ? cvs2.offsetWidth : window.innerWidth;
      const ch = (cvs2 && cvs2.offsetHeight > 0) ? cvs2.offsetHeight : window.innerHeight - 120;
      const z = Math.max(0.3, Math.min(1.2, (cw - 160) / (d.mapMaxX - d.mapMinX)));
      const x = cw / 2 - d.centerX * z;
      const y = ch / 2 - d.centerY * z;
      setVp({ z, x, y });
    };
    setTimeout(initVp, 100);

    axios.get(`${API}/quests/status`, { withCredentials: true })
      .then(r => {
        const qs = r.data.quests || [];
        const pend = new Set(qs.filter(q => q.status === 'pending').map(q => q.id));
        const coll = new Set(qs.filter(q => q.status === 'collected').map(q => q.id));
        setPendingSet(pend);
        setCollectedSet(coll);
      })
      .catch(() => {});

    axios.get(`${API}/users/me`, { withCredentials: true })
      .then(r => setZp(r.data.zp || 0))
      .catch(() => {});
  }, []);

  const isUnlocked = useCallback((qid) => {
    const q = mdR.current?.quests.find(q => q.id === qid);
    if (!q) return false;
    return q.requires.every(r => collR.current.has(r));
  }, []);

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

    const v = vpR.current, md = mdR.current;
    const pend = pendR.current, coll = collR.current;
    const hov = hovR.current, sel = selR.current;
    const sq = searchR.current.toLowerCase().trim();
    const tick = animRef.current;

    ctx.fillStyle = BG; ctx.fillRect(0, 0, w, h);

    const scx = md.centerX * v.z + v.x;
    const scy = md.centerY * v.z + v.y;
    const grad = ctx.createRadialGradient(scx, scy, 0, scx, scy, Math.max(w, h));
    grad.addColorStop(0, 'rgba(30,40,100,0.08)');
    grad.addColorStop(0.5, 'rgba(15,20,50,0.04)');
    grad.addColorStop(1, 'rgba(5,8,16,0)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, w, h);

    ctx.save(); ctx.translate(v.x, v.y); ctx.scale(v.z, v.z);

    drawBorder(ctx, md);

    // Connections
    md.connections.forEach(cn => {
      const f = md.quests[cn.from], tt = md.quests[cn.to];
      if (!f || !tt) return;
      const bothDone = coll.has(f.id) && coll.has(tt.id);
      const anyDone = coll.has(f.id) || coll.has(tt.id);

      if (bothDone) {
        ctx.strokeStyle = 'rgba(74,222,128,0.6)'; ctx.lineWidth = 2; ctx.globalAlpha = 0.85;
      } else if (anyDone) {
        ctx.strokeStyle = 'rgba(56,189,248,0.45)'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
      } else {
        ctx.strokeStyle = 'rgba(56,80,180,0.32)'; ctx.lineWidth = 1; ctx.globalAlpha = 0.6;
      }
      ctx.beginPath();
      ctx.moveTo(f.x, f.y);
      if (Math.abs(f.y - tt.y) < 4) {
        ctx.lineTo(tt.x, tt.y);
      } else {
        ctx.lineTo(tt.x, f.y); ctx.lineTo(tt.x, tt.y);
      }
      ctx.stroke(); ctx.globalAlpha = 1;
    });

    const searchSet = new Set();
    if (sq) md.quests.forEach(q => { if (q.name.toLowerCase().includes(sq) || q.desc.toLowerCase().includes(sq)) searchSet.add(q.id); });

    md.quests.forEach(q => {
      const isCollected = coll.has(q.id);
      const isPending = pend.has(q.id);
      const unlocked = isCollected || isPending || isUnlocked(q.id);
      const isHov = hov === q.id;
      const isSel = sel && sel.id === q.id;
      const isMatch = searchSet.size > 0 && searchSet.has(q.id);
      const nr = (isHov || isSel) ? R + 4 : R;

      if (searchSet.size > 0 && !isMatch) ctx.globalAlpha = 0.06;

      if (!unlocked) {
        const lockedC = { fill: '#0d1120', stroke: '#2a3050', glow: 'none' };
        drawNode(ctx, q.shape, q.x, q.y, nr, lockedC, false);
        ctx.fillStyle = '#4a5580';
        ctx.font = `bold ${Math.round(nr * 0.9)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('?', q.x, q.y); ctx.textBaseline = 'alphabetic';
        if (isHov || isSel) {
          const tip = 'Bu görev henüz açılmadı';
          ctx.font = '9px "DM Sans",sans-serif';
          const tw = ctx.measureText(tip).width + 12;
          ctx.fillStyle = 'rgba(10,14,30,0.92)'; ctx.strokeStyle = 'rgba(74,85,128,0.6)'; ctx.lineWidth = 0.8;
          const tx = q.x - tw / 2, ty = q.y - nr - 24;
          ctx.beginPath(); ctx.roundRect(tx, ty, tw, 16, 4); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#94a3b8'; ctx.textAlign = 'center'; ctx.fillText(tip, q.x, ty + 11);
        }
      } else if (isPending) {
        // Pending: amber/gold glow, pulsing
        const pulse = 0.7 + 0.3 * Math.sin(tick * 0.06);
        const pc = { ...PENDING_C, glow: `rgba(251,191,36,${0.4 + 0.35 * pulse})` };
        ctx.shadowColor = pc.glow; ctx.shadowBlur = (isHov || isSel) ? 30 : 14 + 8 * pulse;
        drawNode(ctx, q.shape, q.x, q.y, nr, pc, isHov || isSel);
        // Star icon inside
        ctx.fillStyle = '#fbbf24';
        ctx.font = `bold ${Math.round(nr * 0.75)}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('★', q.x, q.y + 1); ctx.textBaseline = 'alphabetic';
        if (v.z > 0.3) {
          ctx.font = '8px "DM Sans",sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#fbbf24';
          ctx.fillText(q.name, q.x, q.y + R + 13);
        }
        if (isHov || isSel) {
          ctx.strokeStyle = 'rgba(251,191,36,0.3)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(q.x, q.y, nr + 8, 0, Math.PI * 2); ctx.stroke();
        }
      } else if (isCollected) {
        drawNode(ctx, q.shape, q.x, q.y, nr, DONE_C, isHov || isSel);
        drawCheck(ctx, q.x, q.y - 2);
        if (v.z > 0.3) {
          ctx.font = '8px "DM Sans",sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#86efac';
          ctx.fillText(q.name, q.x, q.y + R + 13);
        }
      } else {
        const c = SHAPE_COLORS[q.shape] || SHAPE_COLORS.circle;
        drawNode(ctx, q.shape, q.x, q.y, nr, c, isHov || isSel);
        ctx.fillStyle = c.stroke; ctx.font = 'bold 8px "DM Sans",sans-serif';
        ctx.textAlign = 'center'; ctx.fillText(`${q.zp}`, q.x, q.y + 3);
        if (v.z > 0.3) {
          ctx.font = '8px "DM Sans",sans-serif'; ctx.textAlign = 'center';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(q.name, q.x, q.y + R + 13);
        }
        if (isHov || isSel) {
          ctx.strokeStyle = 'rgba(255,255,255,0.15)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(q.x, q.y, nr + 8, 0, Math.PI * 2); ctx.stroke();
        }
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
    const z = Math.max(0.3, Math.min(1.2, (cw - 160) / (mapData.mapMaxX - mapData.mapMinX)));
    setVp({ z, x: cw / 2 - mapData.centerX * z, y: ch / 2 - mapData.centerY * z });
  };

  const playCollectSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + i * 0.1 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.5);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.1); osc.stop(ctx.currentTime + i * 0.1 + 0.5);
      });
      const shimmer = ctx.createOscillator();
      const sGain = ctx.createGain();
      shimmer.type = 'triangle'; shimmer.frequency.value = 1568;
      sGain.gain.setValueAtTime(0, ctx.currentTime + 0.35);
      sGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.4);
      sGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      shimmer.connect(sGain); sGain.connect(ctx.destination);
      shimmer.start(ctx.currentTime + 0.35); shimmer.stop(ctx.currentTime + 0.9);
    } catch (_) {}
  }, []);

  const doCollect = useCallback(async (q) => {
    if (!pendingSet.has(q.id) || collecting) return;
    setCollecting(true);
    try {
      const r = await axios.post(`${API}/quests/${q.id}/collect`, {}, { withCredentials: true });
      setZp(r.data.zp_total || 0);
      setPendingSet(prev => { const n = new Set(prev); n.delete(q.id); return n; });
      setCollectedSet(prev => new Set([...prev, q.id]));
      playCollectSound();

      // ZP flying animation — from panel bottom-center to ZP badge
      const panel = document.querySelector('[data-quest-panel]');
      const badge = zpBadgeRef.current;
      if (panel && badge) {
        const pRect = panel.getBoundingClientRect();
        const bRect = badge.getBoundingClientRect();
        setZpFly({
          key: Date.now(),
          fromX: pRect.left + pRect.width / 2,
          fromY: pRect.top,
          toX: bRect.left + bRect.width / 2,
          toY: bRect.top + bRect.height / 2,
          zp: r.data.zp_earned,
        });
        setTimeout(() => setZpFly(null), 1100);
      }
      setSelected(null);
    } catch (_) {}
    setCollecting(false);
  }, [pendingSet, collecting, playCollectSound]);

  const total = mapData ? mapData.quests.length : 0;
  const done = collectedSet.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <>
    <div className="fixed inset-0 flex flex-col" style={{ background: BG }} data-testid="quest-map-page">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b" style={{ borderColor: 'rgba(40,50,120,0.25)', background: 'rgba(5,8,16,0.97)', zIndex: 20 }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-1.5 rounded-lg hover:bg-white/5 transition-colors" data-testid="quest-back-btn">
            <ArrowLeft className="h-5 w-5" style={{ color: '#38bdf8' }} />
          </button>
          <div>
            <h1 className="text-sm font-bold tracking-wide" style={{ color: '#e2e8f0' }}>Görev Haritası</h1>
            <p className="text-[10px]" style={{ color: '#64748b' }}>{done}/{total} Tamamlandı</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div ref={zpBadgeRef} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Star className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
            <span className="text-xs font-bold" style={{ color: '#fbbf24' }} data-testid="quest-sp-badge">{zp} ZP</span>
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
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Görev ara..." className="bg-transparent outline-none text-xs flex-1" style={{ color: '#e2e8f0' }} data-testid="quest-search-input" />
          {search && <button onClick={() => setSearch('')}><X className="h-3 w-3" style={{ color: '#64748b' }} /></button>}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5">
          <button onClick={zoomOut} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-out"><ZoomOut className="h-4 w-4" style={{ color: '#64748b' }} /></button>
          <span className="text-[10px] px-1 min-w-[32px] text-center" style={{ color: '#475569' }}>{Math.round(vp.z * 100)}%</span>
          <button onClick={zoomIn} className="p-1 rounded hover:bg-white/5" data-testid="quest-zoom-in"><ZoomIn className="h-4 w-4" style={{ color: '#64748b' }} /></button>
          <button onClick={resetView} className="p-1 rounded hover:bg-white/5" data-testid="quest-reset-view"><Maximize2 className="h-4 w-4" style={{ color: '#64748b' }} /></button>
        </div>
        <div className="hidden lg:flex items-center gap-3 ml-2 pl-2 border-l text-[10px]" style={{ borderColor: 'rgba(255,255,255,0.06)', color: '#475569' }}>
          <span style={{ color: '#38bdf8' }}>● Aktif</span>
          <span style={{ color: '#fbbf24' }}>★ Topla</span>
          <span style={{ color: '#4ade80' }}>✓ Tamamlandı</span>
          <span style={{ color: '#2a3050' }}>? Kilitli</span>
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
          <div data-quest-panel className="absolute bottom-3 left-3 sm:left-1/2 sm:-translate-x-1/2 rounded-xl shadow-2xl p-4 max-w-xs w-[calc(100%-1.5rem)] sm:w-auto sm:min-w-[280px]" style={{ background: 'rgba(10,14,30,0.97)', border: `1px solid ${pendingSet.has(selected.id) ? 'rgba(251,191,36,0.4)' : 'rgba(40,50,120,0.4)'}`, backdropFilter: 'blur(20px)', zIndex: 25 }} data-testid="quest-detail-panel">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: collectedSet.has(selected.id) ? 'rgba(74,222,128,0.12)' : pendingSet.has(selected.id) ? 'rgba(251,191,36,0.12)' : 'rgba(56,189,248,0.08)' }}>
                  <span className="text-sm font-bold" style={{ color: collectedSet.has(selected.id) ? '#4ade80' : pendingSet.has(selected.id) ? '#fbbf24' : '#38bdf8' }}>
                    {collectedSet.has(selected.id) ? '✓' : pendingSet.has(selected.id) ? '★' : '●'}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: '#e2e8f0' }}>{selected.name}</h3>
                  <span className="text-[10px]" style={{ color: '#64748b' }}>
                    {collectedSet.has(selected.id) ? 'Tamamlandı' : pendingSet.has(selected.id) ? 'Toplanmayı Bekliyor' : isUnlocked(selected.id) ? 'Aktif' : 'Kilitli'}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-white/10"><X className="h-4 w-4" style={{ color: '#64748b' }} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: '#94a3b8' }}>{selected.desc}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Star className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
                <span className="text-xs font-bold" style={{ color: '#fbbf24' }}>+{selected.zp} ZP</span>
              </div>
              {collectedSet.has(selected.id) ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(74,222,128,0.12)', color: '#4ade80' }}>Tamamlandı</span>
              ) : pendingSet.has(selected.id) ? (
                <button
                  onClick={() => doCollect(selected)}
                  disabled={collecting}
                  className="text-xs px-4 py-1.5 rounded-full font-bold hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #92400e, #fbbf24)', color: '#0a0f2e', opacity: collecting ? 0.6 : 1 }}
                  data-testid="quest-collect-btn"
                >
                  {collecting ? '...' : 'Topla'}
                </button>
              ) : isUnlocked(selected.id) ? (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(56,189,248,0.08)', color: '#38bdf8' }}>Devam Ediyor</span>
              ) : (
                <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.03)', color: '#2a2e42' }}>Kilitli</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>

    {/* ZP Flying Animation */}
    {zpFly && (
      <div
        key={zpFly.key}
        style={{
          position: 'fixed',
          left: zpFly.fromX,
          top: zpFly.fromY,
          transform: 'translate(-50%, -50%)',
          zIndex: 9999,
          pointerEvents: 'none',
          animation: 'zp-fly 1s cubic-bezier(0.4,0,0.2,1) forwards',
          '--tx': `${zpFly.toX - zpFly.fromX}px`,
          '--ty': `${zpFly.toY - zpFly.fromY}px`,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.8)', whiteSpace: 'nowrap' }}>
          +{zpFly.zp} ZP
        </span>
      </div>
    )}

    <style>{`
      @keyframes zp-fly {
        0%   { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        60%  { opacity: 1; }
        100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); }
      }
    `}</style>
    </>
  );
};

export default QuestMap;
