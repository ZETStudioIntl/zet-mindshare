import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Package, Star, Zap } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const _CASE_DEFS = [
  { type: 'zp',     amount: 30,  rarity: 'common', chance: 20.0 },
  { type: 'zp',     amount: 50,  rarity: 'common', chance: 15.0 },
  { type: 'zp',     amount: 100, rarity: 'nadir',  chance: 13.0 },
  { type: 'zp',     amount: 200, rarity: 'nadir',  chance: 8.0  },
  { type: 'zp',     amount: 330, rarity: 'epik',   chance: 3.0  },
  { type: 'zp',     amount: 800, rarity: 'epik',   chance: 0.8  },
  { type: 'credit', amount: 10,  rarity: 'common', chance: 22.0 },
  { type: 'credit', amount: 20,  rarity: 'nadir',  chance: 9.0  },
  { type: 'credit', amount: 50,  rarity: 'epik',   chance: 4.0  },
  { type: 'credit', amount: 400, rarity: 'lore',   chance: 0.08 },
];
const _CASE_TOTAL = _CASE_DEFS.reduce((s, r) => s + r.chance, 0);
export const RARITY_COLORS = { common: '#888', nadir: '#60a5fa', epik: '#a78bfa', lore: '#fbbf24' };
const RARITY_LABELS = { common: '', nadir: 'Nadir', epik: 'Epik', lore: 'Lore' };
function _weightedRandom() {
  let r = Math.random() * _CASE_TOTAL;
  for (const d of _CASE_DEFS) { r -= d.chance; if (r <= 0) return d; }
  return _CASE_DEFS[0];
}

const SLOT_W = 110, SLOT_GAP = 8, SLOT_STEP = 118, SLOT_COUNT = 60, SLOT_WIN = 52;

function _playTick(pitch = 700, vol = 0.07) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'sine'; o.frequency.value = pitch;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.start(); o.stop(ctx.currentTime + 0.06);
  } catch {}
}

function _playWinSound(rarity) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const seqs = {
      common: [[523, 0.12], [659, 0.18]],
      nadir:  [[659, 0.14], [880, 0.14], [1047, 0.22]],
      epik:   [[880, 0.12], [1109, 0.12], [1319, 0.12], [1760, 0.3]],
      lore:   [[1047, 0.1], [1319, 0.1], [1568, 0.1], [2093, 0.15], [2637, 0.4]],
    };
    let t = ctx.currentTime + 0.05;
    for (const [freq, dur] of (seqs[rarity] || seqs.common)) {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'triangle'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.start(t); o.stop(t + dur); t += dur * 0.75;
    }
  } catch {}
}

const CaseOpenModal = ({ caseId, onClose, onReward, showToast: toast }) => {
  const [phase, setPhase] = useState('ready');
  const [items, setItems] = useState([]);
  const [reward, setReward] = useState(null);
  const stripRef = useRef(null);
  const containerRef = useRef(null);
  const tickTimers = useRef([]);

  const scheduleTicks = () => {
    const schedule = [];
    for (let t = 0; t < 2500; t += 80)  schedule.push([t, 680 + Math.random() * 140, 0.07]);
    for (let t = 2500; t < 4000; t += 200) schedule.push([t, 580 + Math.random() * 80,  0.06]);
    for (let t = 4000; t < 5500; t += 420) schedule.push([t, 480 + Math.random() * 40,  0.05]);
    schedule.forEach(([delay, pitch, vol]) => {
      tickTimers.current.push(setTimeout(() => _playTick(pitch, vol), delay));
    });
  };

  const clearTicks = () => { tickTimers.current.forEach(clearTimeout); tickTimers.current = []; };

  const handleOpen = async () => {
    if (phase !== 'ready') return;
    setPhase('spinning');
    try {
      const res = await axios.post(`${API}/inventory/open-case`, { case_id: caseId }, { withCredentials: true });
      const rw = res.data.reward;
      setReward(rw);
      const strip = Array.from({ length: SLOT_COUNT }, (_, i) => i === SLOT_WIN ? { ...rw, isWinner: true } : _weightedRandom());
      setItems(strip);
      scheduleTicks();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (!stripRef.current) return;
        const cw = containerRef.current?.offsetWidth || (window.innerWidth - 80);
        stripRef.current.style.transition = 'none';
        stripRef.current.style.transform = 'translateX(0)';
        void stripRef.current.offsetWidth;
        const jitter = (Math.random() - 0.5) * 24;
        const finalX = -(SLOT_WIN * SLOT_STEP + SLOT_W / 2 - cw / 2 - jitter);
        stripRef.current.style.transition = 'transform 5.5s cubic-bezier(0.05, 0.75, 0.25, 1.0)';
        stripRef.current.style.transform = `translateX(${finalX}px)`;
        setTimeout(() => { clearTicks(); setPhase('done'); onReward(rw); _playWinSound(rw.rarity); }, 5600);
      }));
    } catch { clearTicks(); setPhase('ready'); if (toast) toast('Kasa açılamadı', 'error'); }
  };

  const col = reward ? RARITY_COLORS[reward.rarity] : '#4ca8ad';

  const SlotIcon = ({ item, size = 18 }) => item.type === 'zp'
    ? <Star size={size} style={{ color: RARITY_COLORS[item.rarity], flexShrink: 0 }} />
    : <Zap  size={size} style={{ color: RARITY_COLORS[item.rarity], flexShrink: 0 }} />;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(0,0,0,0.90)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#0d0d1a', border: '1px solid #252545', borderRadius: 18, padding: '28px 24px', width: '100%', maxWidth: 650, position: 'relative' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <p style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>📦 Günlük Kasa</p>
          {phase !== 'spinning' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 8, color: '#aaa', width: 32, height: 32, cursor: 'pointer', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          )}
        </div>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 2, height: '100%', background: '#fbbf24', zIndex: 5, pointerEvents: 'none', borderRadius: 2 }} />
          <div ref={containerRef} style={{ overflow: 'hidden', width: '100%', maxWidth: SLOT_W * 5 + SLOT_GAP * 4, margin: '0 auto', borderRadius: 10, border: '1px solid #252545', background: '#08080f' }}>
            {items.length === 0 ? (
              <div style={{ height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={48} style={{ color: '#333' }} />
              </div>
            ) : (
              <div ref={stripRef} style={{ display: 'flex', gap: SLOT_GAP, padding: '8px 0' }}>
                {items.map((item, i) => (
                  <div key={i} style={{
                    flexShrink: 0, width: SLOT_W, height: 88,
                    background: item.isWinner ? `${RARITY_COLORS[item.rarity]}18` : 'rgba(255,255,255,0.025)',
                    border: `1px solid ${item.isWinner ? RARITY_COLORS[item.rarity] : '#252545'}`,
                    borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                  }}>
                    <SlotIcon item={item} size={20} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: RARITY_COLORS[item.rarity] }}>{item.amount}</span>
                    <span style={{ fontSize: 10, color: '#666', fontWeight: 500 }}>{item.type === 'zp' ? 'ZP' : 'Kredi'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {phase === 'done' && reward && (
          <div style={{ textAlign: 'center', marginBottom: 20, padding: '14px 20px', background: `${col}10`, borderRadius: 12, border: `1px solid ${col}35` }}>
            {RARITY_LABELS[reward.rarity] && (
              <p style={{ margin: '0 0 4px', fontSize: 10, color: col, letterSpacing: 3, textTransform: 'uppercase', fontWeight: 700 }}>{RARITY_LABELS[reward.rarity]}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 0 }}>
              <SlotIcon item={reward} size={24} />
              <span style={{ fontSize: 24, fontWeight: 800, color: col }}>{reward.amount} {reward.type === 'zp' ? 'ZP' : 'Kredi'} Kazandın!</span>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center' }}>
          {phase === 'ready' && (
            <button onClick={handleOpen} style={{ background: 'linear-gradient(135deg, #4ca8ad, #2d7a7e)', border: 'none', borderRadius: 12, color: '#fff', fontSize: 15, fontWeight: 700, padding: '13px 52px', cursor: 'pointer', letterSpacing: 0.5 }}>
              Kasayı Aç
            </button>
          )}
          {phase === 'spinning' && <p style={{ color: '#555', fontSize: 13, margin: 0 }}>Kader döndürülüyor...</p>}
          {phase === 'done' && (
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 600, padding: '11px 40px', cursor: 'pointer' }}>
              Güzel, Tamam
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseOpenModal;
