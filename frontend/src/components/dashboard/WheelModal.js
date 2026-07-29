import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const WHEEL_ITEMS = [
  { type: 'zp',     amount: 10, rarity: 'nadir', label: '10 ZP'    },
  { type: 'zp',     amount: 20, rarity: 'nadir', label: '20 ZP'    },
  { type: 'credit', amount: 10, rarity: 'nadir', label: '10 Kredi' },
  { type: 'zp',     amount: 30, rarity: 'nadir', label: '30 ZP'    },
  { type: 'zp',     amount: 40, rarity: 'nadir', label: '40 ZP'    },
  { type: 'zp',     amount: 50, rarity: 'nadir', label: '50 ZP'    },
];

const SEG_COUNT = WHEEL_ITEMS.length;
const SEG_DEG   = 360 / SEG_COUNT; // 60°

const COLORS = [
  { bg: '#1e1b4b', stroke: '#6366f1', text: '#a5b4fc' },
  { bg: '#0c1a3a', stroke: '#3b82f6', text: '#93c5fd' },
  { bg: '#1a1040', stroke: '#7c3aed', text: '#c4b5fd' },
  { bg: '#0e2040', stroke: '#0891b2', text: '#67e8f9' },
  { bg: '#1e1b4b', stroke: '#4f46e5', text: '#a5b4fc' },
  { bg: '#0a1a38', stroke: '#2563eb', text: '#93c5fd' },
];

function findWinIndex(reward) {
  for (let i = 0; i < WHEEL_ITEMS.length; i++) {
    const item = WHEEL_ITEMS[i];
    if (item.type === reward.type) {
      if (item.type === 'mood_unlock') return i;
      if (item.amount === reward.amount) return i;
    }
  }
  // fallback: closest ZP value
  return WHEEL_ITEMS.findIndex(w => w.type === reward.type) ?? 0;
}

let _audioCtx = null;
function _getCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _playTick() {
  try {
    const ctx = _getCtx();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = 380 + Math.random() * 80;
    g.gain.setValueAtTime(0.04, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    o.start(); o.stop(ctx.currentTime + 0.04);
  } catch {}
}

function _playWin() {
  try {
    const ctx = _getCtx();
    const freqs = [440, 554, 659, 880];
    let t = ctx.currentTime + 0.05;
    for (const freq of freqs) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      o.start(t); o.stop(t + 0.2); t += 0.15;
    }
  } catch {}
}

// SVG wheel path for one segment
function segPath(cx, cy, r, startDeg, endDeg) {
  const toRad = d => (d - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(toRad(startDeg));
  const y1 = cy + r * Math.sin(toRad(startDeg));
  const x2 = cx + r * Math.cos(toRad(endDeg));
  const y2 = cy + r * Math.sin(toRad(endDeg));
  return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
}

const WheelModal = ({ caseId, onClose, onReward, showToast: toast }) => {
  const [phase, setPhase] = useState('ready'); // ready | spinning | done
  const [rotation, setRotation] = useState(0);
  const [reward, setReward]   = useState(null);
  const wheelRef  = useRef(null);
  const ticksRef  = useRef([]);

  const cx = 180, cy = 180, r = 162, SIZE = 360;

  const scheduleTicks = (totalMs) => {
    // Ticks that slow down over time, like a real ratchet wheel
    const times = [];
    let t = 0;
    let interval = 60;
    while (t < totalMs - 300) {
      times.push(t);
      t += interval;
      interval = Math.min(interval * 1.045, 600);
    }
    ticksRef.current = times.map(delay =>
      setTimeout(_playTick, delay)
    );
  };

  const clearTicks = () => {
    ticksRef.current.forEach(clearTimeout);
    ticksRef.current = [];
  };

  useEffect(() => () => clearTicks(), []);

  const handleSpin = async () => {
    if (phase !== 'ready') return;
    setPhase('spinning');
    try { _getCtx(); } catch (_) {} // iOS: await öncesinde AudioContext unlock
    try {
      const res = await axios.post(`${API}/inventory/open-wheel`, { case_id: caseId }, { withCredentials: true });
      const rw = res.data.reward;
      setReward(rw);

      const winIdx   = findWinIndex(rw);
      // Center of winning segment (degrees from top, clockwise)
      const segCenter = winIdx * SEG_DEG + SEG_DEG / 2;
      // Rotate wheel so that segCenter aligns with needle at top
      // Wheel rotates clockwise; to bring segCenter to top: add (360 - segCenter) to make segment reach top
      const spinRounds = 6;
      const target = spinRounds * 360 + (360 - segCenter) + (Math.random() - 0.5) * (SEG_DEG * 0.6);
      const spinMs = 4800;

      scheduleTicks(spinMs);

      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
        wheelRef.current.style.transform  = `rotate(${rotation}deg)`;
        void wheelRef.current.offsetWidth;
        wheelRef.current.style.transition = `transform ${spinMs}ms cubic-bezier(0.08, 0.82, 0.17, 1.0)`;
        wheelRef.current.style.transform  = `rotate(${rotation + target}deg)`;
      }
      setRotation(prev => prev + target);

      setTimeout(() => {
        clearTicks();
        setPhase('done');
        onReward(rw);
        _playWin();
      }, spinMs + 100);
    } catch {
      clearTicks();
      setPhase('ready');
      if (toast) toast('Çark döndürülemedi', 'error');
    }
  };

  const winItem = reward ? WHEEL_ITEMS.find(w =>
    w.type === reward.type && (reward.type === 'mood_unlock' || w.amount === reward.amount)
  ) || WHEEL_ITEMS[0] : null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'linear-gradient(160deg,#0a0a1e 0%,#060612 100%)', border: '1px solid #1e1e3a', borderRadius: 20, padding: '28px 24px', width: '100%', maxWidth: 440, position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9.5" stroke="#a78bfa" strokeWidth="1.5" fill="rgba(167,139,250,0.08)"/>
              <circle cx="11" cy="11" r="2"   fill="#a78bfa" />
              <path d="M11 2v3M11 17v3M2 11h3M17 11h3M4.5 4.5l2 2M15.5 15.5l2 2M4.5 17.5l2-2M15.5 6.5l2-2" stroke="#a78bfa" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Şans Çarkı</span>
          </div>
          {phase !== 'spinning' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Wheel container */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, margin: '0 auto 24px' }}>
          {/* Needle */}
          <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 0, height: 0, borderLeft: '9px solid transparent', borderRight: '9px solid transparent', borderTop: '22px solid #a78bfa', filter: 'drop-shadow(0 0 6px rgba(167,139,250,0.8))' }} />
          </div>

          {/* Outer glow ring */}
          <div style={{ position: 'absolute', inset: 4, borderRadius: '50%', boxShadow: '0 0 40px rgba(99,102,241,0.2)', pointerEvents: 'none' }} />

          {/* SVG wheel */}
          <div ref={wheelRef} style={{ width: SIZE, height: SIZE, willChange: 'transform' }}>
            <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ display: 'block' }}>
              <defs>
                <filter id="wheel-glow">
                  <feGaussianBlur stdDeviation="2" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>
              {WHEEL_ITEMS.map((item, i) => {
                const startDeg = i * SEG_DEG;
                const endDeg   = (i + 1) * SEG_DEG;
                const midRad   = ((startDeg + endDeg) / 2 - 90) * Math.PI / 180;
                const tx = cx + r * 0.62 * Math.cos(midRad);
                const ty = cy + r * 0.62 * Math.sin(midRad);
                const textRot = (startDeg + endDeg) / 2;
                const col = COLORS[i];
                return (
                  <g key={i}>
                    <path d={segPath(cx, cy, r, startDeg, endDeg)} fill={col.bg} stroke={col.stroke} strokeWidth="1.5" />
                    <g transform={`rotate(${textRot}, ${tx}, ${ty})`}>
                      <text x={tx} y={ty - 8} textAnchor="middle" dominantBaseline="middle" fill={col.text} fontSize="11" fontWeight="700" fontFamily="system-ui,sans-serif">{item.label}</text>
                      <text x={tx} y={ty + 7} textAnchor="middle" dominantBaseline="middle" fill={`${col.text}80`} fontSize="8.5" fontFamily="system-ui,sans-serif">{item.rarity === 'nadir' ? 'NADİR' : ''}</text>
                    </g>
                  </g>
                );
              })}
              {/* Center hub */}
              <circle cx={cx} cy={cy} r={22} fill="#0a0a1e" stroke="#6366f1" strokeWidth="2" />
              <circle cx={cx} cy={cy} r={10} fill="#6366f1" opacity="0.6" />
            </svg>
          </div>
        </div>

        {/* Result */}
        {phase === 'done' && winItem && (
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '14px 20px', background: 'rgba(167,139,250,0.08)', borderRadius: 12, border: '1px solid rgba(167,139,250,0.25)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, color: '#a78bfa', letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>Kazandın!</p>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#c4b5fd' }}>{winItem.label}</span>
          </div>
        )}

        {/* Action */}
        <div style={{ textAlign: 'center' }}>
          {phase === 'ready' && (
            <button onClick={handleSpin} style={{ background: 'linear-gradient(135deg, #5b21b6, #7c3aed)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 52px', cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}>
              Çevir
            </button>
          )}
          {phase === 'spinning' && (
            <p style={{ color: '#334155', fontSize: 12, margin: 0, letterSpacing: 1 }}>Ç A R K &nbsp; D Ö N Ü Y O R</p>
          )}
          {phase === 'done' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#94a3b8', fontSize: 14, fontWeight: 600, padding: '11px 40px', cursor: 'pointer' }}>
              Tamam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WheelModal;
