import React, { useState, useRef } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const _CASE_DEFS = [
  { type: 'zp',          amount: 10,  rarity: 'nadir', chance: 70.0 },
  { type: 'credit',      amount: 10,  rarity: 'nadir', chance: 60.0 },
  { type: 'zp',          amount: 30,  rarity: 'nadir', chance: 50.0 },
  { type: 'zp',          amount: 40,  rarity: 'nadir', chance: 45.0 },
  { type: 'mood_unlock', mode: 'robot',   label: 'Robot Zeta',   rarity: 'nadir', chance: 40.0 },
  { type: 'credit',      amount: 25,  rarity: 'nadir', chance: 35.0 },
  { type: 'zp',          amount: 120, rarity: 'epik',  chance: 30.0 },
  { type: 'mood_unlock', mode: 'yorgun',  label: 'Yorgun Zeta',  rarity: 'epik',  chance: 20.0 },
  { type: 'mood_unlock', mode: 'agresif', label: 'Agresif Zeta', rarity: 'epik',  chance: 7.0  },
  { type: 'credit',      amount: 50,  rarity: 'epik',  chance: 3.0  },
  { type: 'zp',          amount: 300, rarity: 'lore',  chance: 1.0  },
  { type: 'zp',          amount: 340, rarity: 'lore',  chance: 0.8  },
  { type: 'credit',      amount: 70,  rarity: 'lore',  chance: 0.2  },
  { type: 'credit',      amount: 200, rarity: 'lore',  chance: 0.09 },
];
const _CASE_TOTAL = _CASE_DEFS.reduce((s, r) => s + r.chance, 0);

export const RARITY_COLORS = {
  nadir: '#60a5fa',
  epik:  '#a78bfa',
  lore:  '#fbbf24',
};
const RARITY_GLOW = {
  nadir: 'rgba(96,165,250,0.25)',
  epik:  'rgba(167,139,250,0.3)',
  lore:  'rgba(251,191,36,0.35)',
};
const RARITY_LABELS = { nadir: 'Nadir', epik: 'Epik', lore: 'Lore' };

function _weightedRandom() {
  let r = Math.random() * _CASE_TOTAL;
  for (const d of _CASE_DEFS) { r -= d.chance; if (r <= 0) return d; }
  return _CASE_DEFS[0];
}

const SLOT_W = 108, SLOT_GAP = 10, SLOT_STEP = 118, SLOT_COUNT = 60, SLOT_WIN = 52;

let _audioCtx = null;
function _getCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function _playSpinAmbient() {
  try {
    const ctx = _getCtx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 6, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.015;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 5.8);
    filter.Q.value = 2;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, ctx.currentTime);
    gain.gain.setValueAtTime(0.6, ctx.currentTime + 5.0);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.8);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
    src.stop(ctx.currentTime + 6);
  } catch {}
}

function _playWinSound(rarity) {
  try {
    const ctx = _getCtx();
    const seqs = {
      nadir: [[440, 0.12], [554, 0.18]],
      epik:  [[523, 0.1], [659, 0.1], [784, 0.1], [1047, 0.28]],
      lore:  [[523, 0.09], [659, 0.09], [784, 0.09], [1047, 0.12], [1319, 0.38]],
    };
    let t = ctx.currentTime + 0.05;
    for (const [freq, dur] of (seqs[rarity] || seqs.nadir)) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.15, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur); t += dur * 0.75;
    }
  } catch {}
}

export const ZPIcon = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke={color} strokeWidth="1.5" fill={`${color}18`} />
    <path d="M5 10.5l6-5M5 5.5h6M5 10.5h6" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);
export const CreditIcon = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M9.5 2L4 9h5.5L6.5 14l6.5-7H7.5L9.5 2Z" stroke={color} strokeWidth="1.3" fill={`${color}18`} strokeLinejoin="round" strokeLinecap="round" />
  </svg>
);
const MoodIcon = ({ color, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.5" fill={`${color}15`} />
    <path d="M5.5 9.5c.5 1 2.5 1.5 3 0" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="5.8" cy="7" r="0.9" fill={color} />
    <circle cx="10.2" cy="7" r="0.9" fill={color} />
  </svg>
);

function ItemIcon({ item, size = 18 }) {
  const color = RARITY_COLORS[item.rarity] || '#60a5fa';
  if (item.type === 'zp')          return <ZPIcon     color={color} size={size} />;
  if (item.type === 'credit')      return <CreditIcon color={color} size={size} />;
  if (item.type === 'mood_unlock') return <MoodIcon   color={color} size={size} />;
  return null;
}

function itemLabel(item) {
  if (item.type === 'mood_unlock') return item.label || 'Mod';
  if (item.type === 'zp')          return `${item.amount} ZP`;
  return `${item.amount} Kredi`;
}

const CaseOpenModal = ({ caseId, onClose, onReward, showToast: toast }) => {
  const [phase, setPhase] = useState('ready');
  const [items, setItems] = useState([]);
  const [reward, setReward] = useState(null);
  const stripRef  = useRef(null);
  const containerRef = useRef(null);

  const handleOpen = async () => {
    if (phase !== 'ready') return;
    setPhase('spinning');
    try {
      const res = await axios.post(`${API}/inventory/open-case`, { case_id: caseId }, { withCredentials: true });
      const rw = res.data.reward;
      setReward(rw);
      const strip = Array.from({ length: SLOT_COUNT }, (_, i) =>
        i === SLOT_WIN ? { ...rw, isWinner: true } : _weightedRandom()
      );
      setItems(strip);
      _playSpinAmbient();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!stripRef.current) return;
        const cw = containerRef.current?.offsetWidth || (window.innerWidth - 64);
        stripRef.current.style.transition = 'none';
        stripRef.current.style.transform = 'translateX(0)';
        void stripRef.current.offsetWidth;
        const jitter = (Math.random() - 0.5) * 30;
        const finalX = -(SLOT_WIN * SLOT_STEP + SLOT_W / 2 - cw / 2 - jitter);
        stripRef.current.style.transition = 'transform 5.8s cubic-bezier(0.04, 0.8, 0.2, 1.0)';
        stripRef.current.style.transform = `translateX(${finalX}px)`;
        setTimeout(() => {
          setPhase('done');
          onReward(rw);
          _playWinSound(rw.rarity);
          if (rw.type === 'mood_unlock') {
            try {
              const cur = JSON.parse(localStorage.getItem('zet_unlocked_modes') || '[]');
              if (!cur.includes(rw.mode))
                localStorage.setItem('zet_unlocked_modes', JSON.stringify([...cur, rw.mode]));
            } catch {}
          }
        }, 5900);
      }));
    } catch { setPhase('ready'); if (toast) toast('Kasa açılamadı', 'error'); }
  };

  const col   = reward ? RARITY_COLORS[reward.rarity] : '#60a5fa';
  const glow  = reward ? RARITY_GLOW[reward.rarity]   : 'rgba(96,165,250,0.15)';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'linear-gradient(160deg,#0a0a1e 0%,#060612 100%)', border: '1px solid #1e1e3a', borderRadius: 20, padding: '28px 20px', width: '100%', maxWidth: 660, position: 'relative', boxShadow: '0 24px 64px rgba(0,0,0,0.7)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="1" y="8" width="20" height="13" rx="2" stroke="#60a5fa" strokeWidth="1.5" fill="rgba(96,165,250,0.08)"/>
              <path d="M1 11h20M8 8V6a3 3 0 016 0v2" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span style={{ color: '#e2e8f0', fontSize: 17, fontWeight: 700, letterSpacing: -0.3 }}>Günlük Kasa</span>
          </div>
          {phase !== 'spinning' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#64748b', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>✕</button>
          )}
        </div>

        {/* Slot track */}
        <div style={{ position: 'relative', marginBottom: 24 }}>
          {/* Needle */}
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: `linear-gradient(to bottom, ${col}, transparent)`, zIndex: 5, pointerEvents: 'none', borderRadius: 2 }} />
          <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: `10px solid ${col}`, zIndex: 6 }} />

          <div ref={containerRef} style={{ overflow: 'hidden', width: '100%', borderRadius: 12, border: '1px solid #1e1e3a', background: '#050510', position: 'relative' }}>
            {/* Edge fades */}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #050510 0%, transparent 18%, transparent 82%, #050510 100%)', zIndex: 4, pointerEvents: 'none' }} />
            {items.length === 0 ? (
              <div style={{ height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="40" height="40" viewBox="0 0 22 22" fill="none">
                  <rect x="1" y="8" width="20" height="13" rx="2" stroke="#1e1e3a" strokeWidth="1.5"/>
                  <path d="M1 11h20M8 8V6a3 3 0 016 0v2" stroke="#1e1e3a" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
            ) : (
              <div ref={stripRef} style={{ display: 'flex', gap: SLOT_GAP, padding: '8px 4px', willChange: 'transform' }}>
                {items.map((item, i) => {
                  const c = RARITY_COLORS[item.rarity] || '#60a5fa';
                  return (
                    <div key={i} style={{
                      flexShrink: 0, width: SLOT_W, height: 80,
                      background: (item.isWinner && phase === 'done') ? `radial-gradient(ellipse at center, ${RARITY_GLOW[item.rarity]} 0%, #050510 70%)` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${(item.isWinner && phase === 'done') ? c : '#1a1a32'}`,
                      borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
                      boxShadow: (item.isWinner && phase === 'done') ? `0 0 20px ${RARITY_GLOW[item.rarity]}` : 'none',
                    }}>
                      <ItemIcon item={item} size={20} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: c, letterSpacing: -0.2 }}>{itemLabel(item)}</span>
                      {RARITY_LABELS[item.rarity] && (
                        <span style={{ fontSize: 9, color: `${c}88`, textTransform: 'uppercase', letterSpacing: 1 }}>{RARITY_LABELS[item.rarity]}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {phase === 'done' && reward && (
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '16px 24px', background: `radial-gradient(ellipse at center, ${glow} 0%, transparent 70%)`, borderRadius: 14, border: `1px solid ${col}30` }}>
            {RARITY_LABELS[reward.rarity] && (
              <p style={{ margin: '0 0 6px', fontSize: 10, color: col, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700, opacity: 0.8 }}>{RARITY_LABELS[reward.rarity]}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <ItemIcon item={reward} size={26} />
              <span style={{ fontSize: 22, fontWeight: 800, color: col, letterSpacing: -0.5 }}>
                {reward.type === 'mood_unlock' ? `${reward.label} Kazandın!` : `${itemLabel(reward)} Kazandın!`}
              </span>
            </div>
          </div>
        )}

        {/* Action */}
        <div style={{ textAlign: 'center' }}>
          {phase === 'ready' && (
            <button onClick={handleOpen} style={{ background: 'linear-gradient(135deg, #3b4fd4, #6366f1)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 52px', cursor: 'pointer', letterSpacing: 0.3, boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }}>
              Kasayı Aç
            </button>
          )}
          {phase === 'spinning' && (
            <p style={{ color: '#334155', fontSize: 12, margin: 0, letterSpacing: 1 }}>K A D E R &nbsp; D Ö N Ü Y O R</p>
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

export default CaseOpenModal;
