import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TEAR_THRESHOLD = 45;

const RARITY = {
  nadir:  { label: 'Nadir',  color: '#60a5fa', glow: 'rgba(96,165,250,0.55)'  },
  epik:   { label: 'Epik',   color: '#c084fc', glow: 'rgba(192,132,252,0.55)' },
  lore:   { label: 'Lore',   color: '#fbbf24', glow: 'rgba(251,191,36,0.65)'  },
  efsane: { label: 'Efsane', color: '#f43f5e', glow: 'rgba(244,63,94,0.65)'   },
};

let _actx = null;
function getCtx() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
}
function playTear() {
  try {
    const ctx = getCtx();
    const n = ctx.sampleRate * 0.28;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 0.6);
    const src = ctx.createBufferSource();
    const flt = ctx.createBiquadFilter(); flt.type = 'bandpass'; flt.frequency.value = 2800; flt.Q.value = 0.4;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.55, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    src.buffer = buf; src.connect(flt); flt.connect(g); g.connect(ctx.destination); src.start();
  } catch (_) {}
}
function playReveal() {
  try {
    const ctx = getCtx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.09;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.13, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.32);
      o.start(t); o.stop(t + 0.35);
    });
  } catch (_) {}
}

// Yırtık kenar için clip-path (flap alt kısmı)
const TORN_CLIP = 'polygon(0 0,100% 0,100% 72%,97% 80%,94% 71%,91% 79%,88% 70%,85% 78%,82% 71%,79% 79%,76% 70%,73% 78%,70% 70%,67% 79%,64% 70%,61% 78%,58% 71%,55% 79%,52% 70%,49% 78%,46% 71%,43% 79%,40% 70%,37% 78%,34% 71%,31% 79%,28% 70%,25% 78%,22% 71%,19% 79%,16% 70%,13% 78%,10% 71%,7% 79%,4% 71%,1% 78%,0 71%)';

export default function PackOpenModal({ packId, onClose, onReward, showToast }) {
  // idle → dragging → tearing → card-rise → ready → flipping → done
  const [phase, setPhase] = useState('idle');
  const [dragX, setDragX] = useState(0);
  const [tearDir, setTearDir] = useState(1);
  const [reward, setReward] = useState(null);
  const [cardFlipped, setCardFlipped] = useState(false);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const fetched = useRef(false);

  const fetchReward = useCallback(async () => {
    if (fetched.current) return;
    fetched.current = true;
    try {
      const res = await axios.post(`${API}/inventory/open-pack`, { pack_id: packId }, { withCredentials: true });
      setReward(res.data.reward);
      if (onReward) onReward(res.data.reward);
    } catch {
      showToast('Paket açılamadı — tekrar dene', 'error');
      fetched.current = false;
    }
  }, [packId, onClose, onReward, showToast]);

  const triggerTear = useCallback((dir) => {
    isDragging.current = false;
    setTearDir(dir);
    setPhase('tearing');
    playTear();
    fetchReward();
    setTimeout(() => setPhase('card-rise'), 320);
    setTimeout(() => setPhase('ready'), 750);
  }, [fetchReward]);

  const onMove = useCallback((e) => {
    if (!isDragging.current) return;
    if (e.cancelable) e.preventDefault();
    const cx = e.touches ? (e.touches[0]?.clientX ?? startX.current) : e.clientX;
    const dx = cx - startX.current;
    setDragX(dx);
    if (Math.abs(dx) > TEAR_THRESHOLD) triggerTear(dx > 0 ? 1 : -1);
  }, [triggerTear]);

  const onUp = useCallback(() => {
    if (isDragging.current) { isDragging.current = false; setDragX(0); setPhase('idle'); }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [onMove, onUp]);

  const onDragStart = (clientX) => {
    if (phase !== 'idle') return;
    isDragging.current = true;
    startX.current = clientX;
    setPhase('dragging');
  };

  const handleCardClick = () => {
    if (phase !== 'ready' || cardFlipped || !reward) return;
    setCardFlipped(true);
    setPhase('flipping');
    playReveal();
    setTimeout(() => setPhase('done'), 650);
  };

  // --- Computed styles ---
  const flapTf = (() => {
    if (phase === 'dragging') return { transform: `translateX(${dragX}px) rotate(${dragX * 0.1}deg)`, transition: 'none' };
    if (phase === 'tearing' || phase === 'card-rise' || phase === 'ready' || phase === 'flipping' || phase === 'done')
      return { transform: `translateX(${tearDir * 520}px) rotate(${tearDir * 38}deg)`, opacity: 0, transition: 'all 0.32s cubic-bezier(0.55,0,1,0.45)' };
    return {};
  })();

  const packBodyTf = (() => {
    if (phase === 'card-rise') return { transform: 'translateY(55px)', opacity: 0.35, transition: 'all 0.5s ease' };
    if (phase === 'ready' || phase === 'flipping' || phase === 'done') return { transform: 'translateY(80px)', opacity: 0, transition: 'all 0.4s ease', pointerEvents: 'none' };
    return { transition: 'all 0.3s ease' };
  })();

  const cardTf = (() => {
    if (phase === 'idle' || phase === 'dragging' || phase === 'tearing') return { transform: 'translateX(-50%) translateY(50px)', opacity: 0, transition: 'none' };
    if (phase === 'card-rise') return { transform: 'translateX(-50%) translateY(-20px)', opacity: 1, transition: 'all 0.48s cubic-bezier(0.34,1.56,0.64,1)' };
    return { transform: 'translateX(-50%) translateY(0)', opacity: 1, transition: 'all 0.3s ease' };
  })();

  const rc = reward ? (RARITY[reward.rarity] || RARITY.nadir) : RARITY.nadir;
  const torn = phase !== 'idle' && phase !== 'dragging';

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}
      onClick={phase === 'done' ? onClose : undefined}
    >
      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ×
      </button>

      <div style={{ position: 'relative', width: 200, userSelect: 'none', touchAction: 'none' }}>

        {/* ── CARD (behind pack, rises up) ── */}
        <div style={{ position: 'absolute', top: 0, left: '50%', zIndex: 1, ...cardTf }}>
          <div
            style={{ width: 178, height: 256, borderRadius: 16, cursor: phase === 'ready' ? 'pointer' : 'default', perspective: 700 }}
            onClick={handleCardClick}
          >
            {/* 3D flip container */}
            <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>

              {/* Front — before flip */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 16, background: 'linear-gradient(160deg, #1a0a2e, #2d1054, #1a0a2e)', border: '1px solid rgba(192,132,252,0.35)', boxShadow: phase === 'ready' ? '0 0 40px rgba(192,132,252,0.3), 0 12px 40px rgba(0,0,0,0.5)' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <svg width="52" height="52" viewBox="0 0 52 52" fill="none"><circle cx="26" cy="26" r="22" stroke="rgba(192,132,252,0.3)" strokeWidth="1" strokeDasharray="4 3"/><circle cx="26" cy="26" r="16" stroke="rgba(192,132,252,0.15)" strokeWidth="0.8"/><text x="26" y="33" textAnchor="middle" fill="#c084fc" fontSize="24" fontWeight="700" fontFamily="DM Sans,sans-serif" opacity="0.8">Z</text></svg>
                {phase === 'ready' && reward && (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#c084fc', fontSize: 10, fontWeight: 700, letterSpacing: 1.5 }}>AÇMAK İÇİN</div>
                    <div style={{ color: 'rgba(192,132,252,0.5)', fontSize: 9, marginTop: 2 }}>tıkla</div>
                  </div>
                )}
                {phase === 'ready' && !reward && (
                  <div style={{ color: 'rgba(192,132,252,0.4)', fontSize: 9, letterSpacing: 1 }}>yükleniyor...</div>
                )}
              </div>

              {/* Back — reward reveal */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 16, background: `linear-gradient(160deg, #0a0514, rgba(${rc.color === '#c084fc' ? '192,132,252' : rc.color === '#fbbf24' ? '251,191,36' : '96,165,250'},0.12), #0a0514)`, border: `1px solid ${rc.color}44`, boxShadow: `0 0 60px ${rc.glow}, 0 16px 50px rgba(0,0,0,0.6)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16 }}>
                {reward && (
                  <>
                    <div style={{ background: `${rc.color}18`, border: `1px solid ${rc.color}44`, borderRadius: 20, padding: '3px 14px', fontSize: 9, fontWeight: 700, color: rc.color, letterSpacing: 2 }}>
                      {rc.label.toUpperCase()}
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${rc.color}15`, border: `1.5px solid ${rc.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="30" height="30" viewBox="0 0 30 30" fill="none"><circle cx="15" cy="15" r="12" stroke={rc.color} strokeWidth="1.2" fill="none"/><path d="M15 5v3M15 22v3M5 15h3M22 15h3M8.2 8.2l2.1 2.1M19.7 19.7l2.1 2.1M8.2 21.8l2.1-2.1M19.7 10.3l2.1-2.1" stroke={rc.color} strokeWidth="1.2" strokeLinecap="round"/></svg>
                    </div>
                    <div style={{ color: rc.color, fontSize: 15, fontWeight: 800, textAlign: 'center', lineHeight: 1.2, textShadow: `0 0 16px ${rc.glow}` }}>
                      {reward.label || reward.mode}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: 10, textAlign: 'center', lineHeight: 1.4 }}>
                      Zeta modu açıldı
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── PACK BODY ── */}
        <div style={{ position: 'relative', zIndex: 2, ...packBodyTf }}>
          <div style={{ width: 200, height: 300, borderRadius: 14, overflow: 'hidden', background: 'linear-gradient(160deg, #1a0a2e 0%, #2d1054 50%, #1a0a2e 100%)', border: '1px solid rgba(192,132,252,0.25)', boxShadow: '0 8px 50px rgba(0,0,0,0.7), inset 0 0 60px rgba(192,132,252,0.04)', position: 'relative' }}>
            {/* Diagonal shimmer */}
            <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(108deg, transparent 0px, transparent 7px, rgba(192,132,252,0.025) 7px, rgba(192,132,252,0.025) 8px)', pointerEvents: 'none' }} />
            {/* Body content */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: '36%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="16" stroke="rgba(192,132,252,0.2)" strokeWidth="1"/><text x="20" y="27" textAnchor="middle" fill="rgba(192,132,252,0.35)" fontSize="20" fontWeight="700" fontFamily="DM Sans,sans-serif">Z</text></svg>
              <div style={{ color: 'rgba(192,132,252,0.3)', fontSize: 9, fontWeight: 700, letterSpacing: 3 }}>PAKET</div>
            </div>
          </div>

          {/* ── TOP FLAP ── */}
          <div
            onMouseDown={e => onDragStart(e.clientX)}
            onTouchStart={e => { e.stopPropagation(); onDragStart(e.touches[0]?.clientX ?? 0); }}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '37%', transformOrigin: 'center top', zIndex: 10, cursor: phase === 'idle' || phase === 'dragging' ? 'grab' : 'default', touchAction: 'none', WebkitUserSelect: 'none', ...flapTf }}
          >
            <div style={{ width: '100%', height: '100%', borderRadius: '14px 14px 0 0', background: 'linear-gradient(160deg, #240c4a 0%, #3d1878 50%, #240c4a 100%)', clipPath: torn ? 'none' : TORN_CLIP, position: 'relative', overflow: 'hidden' }}>
              {/* Gold foil lines */}
              {[7, 13, 19, 25].map(top => (
                <div key={top} style={{ position: 'absolute', left: 10, right: 10, top, height: 2, background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.45), rgba(251,191,36,0.7), rgba(251,191,36,0.45), transparent)', borderRadius: 1 }} />
              ))}
              {/* Shimmer */}
              <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(108deg, transparent 0px, transparent 7px, rgba(251,191,36,0.03) 7px, rgba(251,191,36,0.03) 8px)', pointerEvents: 'none' }} />
              {/* Drag hint */}
              {phase === 'idle' && (
                <div style={{ position: 'absolute', bottom: 22, left: 0, right: 0, textAlign: 'center', color: 'rgba(251,191,36,0.6)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>
                  ← SÜRÜKLE →
                </div>
              )}
            </div>
          </div>

          {/* Dashed perforated line */}
          {(phase === 'idle' || phase === 'dragging') && (
            <div style={{ position: 'absolute', top: 'calc(37% - 1px)', left: 0, right: 0, height: 1, background: 'repeating-linear-gradient(90deg, rgba(251,191,36,0.45) 0px, rgba(251,191,36,0.45) 5px, transparent 5px, transparent 11px)', zIndex: 11 }} />
          )}
        </div>

        {/* Done hint */}
        {phase === 'done' && (
          <div style={{ position: 'absolute', bottom: -52, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.3)', fontSize: 11, textAlign: 'center' }}>
            Kapatmak için tıkla
          </div>
        )}
      </div>
    </div>
  );
}
