import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const TEAR_THRESHOLD = 45;

const RARITY = {
  nadir:  { label: 'Nadir',  color: '#60a5fa', glow: 'rgba(96,165,250,0.6)'  },
  epik:   { label: 'Epik',   color: '#c084fc', glow: 'rgba(192,132,252,0.6)' },
  lore:   { label: 'Lore',   color: '#fbbf24', glow: 'rgba(251,191,36,0.7)'  },
  efsane: { label: 'Efsane', color: '#f43f5e', glow: 'rgba(244,63,94,0.7)'   },
};

let _actx = null;
function getCtx() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
}
// Plastik ambalaj yırtılması — yüksek frekans, kısa, sessiz
// frontend/public/sounds/pack_tear.mp3 varsa onu kullan (Epidemic Sound: Cling Film Rip)
const _TEAR_FILES = [
  '/sounds/freesound_community-tear-paper-103161.mp3',
  '/sounds/pack_tear.mp3',
];
// Modül yüklenince preload et — tıklamada gecikme olmasın
let _tearAudio = null;
(function preload() {
  let i = 0;
  const tryNext = () => {
    if (i >= _TEAR_FILES.length) return;
    const a = new Audio(_TEAR_FILES[i++]);
    a.preload = 'auto';
    a.volume = 0.55;
    a.addEventListener('canplaythrough', () => { _tearAudio = a; }, { once: true });
    a.addEventListener('error', tryNext, { once: true });
  };
  tryNext();
})();
function playTear() {
  if (_tearAudio) {
    _tearAudio.currentTime = 0;
    _tearAudio.play().catch(_playTearFallback);
  } else {
    _playTearFallback();
  }
}
function _playTearFallback() {
  try {
    const ctx = getCtx();
    const sr  = ctx.sampleRate;
    const dur = 0.32;
    const n   = Math.floor(sr * dur);
    const buf = ctx.createBuffer(1, n, sr);
    const d   = buf.getChannelData(0);
    // Kısa çatlama + uzayan yırtık sesi
    for (let i = 0; i < n; i++) {
      const t   = i / n;
      const env = t < 0.08 ? (t / 0.08) : Math.pow(1 - (t - 0.08) / 0.92, 1.2);
      d[i] = (Math.random() * 2 - 1) * env;
    }
    const src = ctx.createBufferSource();
    const hi  = ctx.createBiquadFilter(); hi.type = 'highshelf'; hi.frequency.value = 2800; hi.gain.value = 10;
    const g   = ctx.createGain();
    g.gain.setValueAtTime(0.55, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.buffer = buf; src.connect(hi); hi.connect(g); g.connect(ctx.destination); src.start();
  } catch (_) {}
}
function playReveal() {
  try {
    const ctx = getCtx();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination); o.type = 'sine'; o.frequency.value = f;
      const t = ctx.currentTime + i * 0.1;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.055, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      o.start(t); o.stop(t + 0.35);
    });
  } catch (_) {}
}

// idle → dragging → snapping → gone → card-appear → ready → flipping → done
export default function PackOpenModal({ packId, onClose, onReward, onNotFound, showToast }) {
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
    console.log('[open-pack] gönderilen pack_id:', packId);
    try {
      const res = await axios.post(`${API}/inventory/open-pack`, { pack_id: packId }, { withCredentials: true });
      const rw = res.data.reward;
      // Mod kilidi açıldıysa localStorage'a yaz (Dashboard useMemo'su yeniden okusun için)
      if (rw?.mode) {
        try {
          const cur = JSON.parse(localStorage.getItem('zet_unlocked_modes') || '[]');
          if (!cur.includes(rw.mode)) {
            localStorage.setItem('zet_unlocked_modes', JSON.stringify([...cur, rw.mode]));
          }
        } catch (_) {}
      }
      setReward(rw);
      if (onReward) onReward(rw);
    } catch (err) {
      const is404 = err?.response?.status === 404;
      const detail = err?.response?.data?.detail || '';
      showToast(is404 ? `Paket bulunamadı ${detail ? `— ${detail}` : ''}` : 'Paket açılamadı — tekrar dene', 'error');
      if (is404 && onNotFound) onNotFound();
      fetched.current = false;
      setTimeout(onClose, 1800);
    }
  }, [packId, onReward, showToast]);

  const triggerTear = useCallback((dir) => {
    isDragging.current = false;
    setTearDir(dir);
    setPhase('snapping');
    playTear();
    fetchReward();
    setTimeout(() => setPhase('gone'), 430);
    setTimeout(() => setPhase('card-appear'), 490);
    setTimeout(() => setPhase('ready'), 970);
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

  // Kart 'ready' fazında ama reward 4 saniyede gelmediyse kapat (API hatası)
  useEffect(() => {
    if (phase === 'ready' && !reward) {
      const t = setTimeout(onClose, 4000);
      return () => clearTimeout(t);
    }
  }, [phase, reward, onClose]);

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

  const rc = reward ? (RARITY[reward.rarity] || RARITY.nadir) : RARITY.nadir;

  const isIdle     = phase === 'idle';
  const isDrag     = phase === 'dragging';
  const isSnap     = phase === 'snapping';
  const isGone     = phase === 'gone';
  const isAppear   = phase === 'card-appear';
  const isReady    = phase === 'ready';
  const isFlipping = phase === 'flipping';
  const isDone     = phase === 'done';
  const packGone   = isGone || isAppear || isReady || isFlipping || isDone;

  // ---------- Pack outer frame ----------
  const frameStyle = {
    position: 'absolute', inset: 0, borderRadius: 14, zIndex: 5, pointerEvents: 'none',
    border: '1.5px solid rgba(190,155,60,0.4)',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.5), 0 20px 70px rgba(0,0,0,0.85)',
    opacity: packGone ? 0 : 1,
    transition: isSnap ? 'opacity 0.38s ease' : 'none',
  };

  // ---------- Pack body (below band) ----------
  const bodyStyle = {
    position: 'absolute', top: 94, left: 0, right: 0, bottom: 0,
    background: 'linear-gradient(180deg, #0d0d11 0%, #101014 100%)',
    borderRadius: '0 0 14px 14px',
    overflow: 'hidden',
    transform: isDrag
      ? `skewX(${dragX * 0.022}deg)`
      : isSnap ? 'translateY(270px)' : 'none',
    opacity: packGone ? 0 : 1,
    transition: isSnap
      ? 'transform 0.42s cubic-bezier(0.4,0,1,0.6), opacity 0.3s 0.08s ease'
      : isDrag ? 'none' : 'all 0.18s ease',
  };

  // ---------- Top tear band ----------
  const bandStyle = {
    position: 'absolute', top: 0, left: 0, right: 0, height: 96,
    background: 'linear-gradient(135deg, #3d1c00 0%, #9c4d06 28%, #d4800c 50%, #9c4d06 72%, #3d1c00 100%)',
    borderRadius: '14px 14px 0 0',
    overflow: 'hidden',
    cursor: isIdle || isDrag ? 'grab' : 'default',
    touchAction: 'none',
    WebkitUserSelect: 'none',
    zIndex: 10,
    transform: isDrag
      ? `translateX(${dragX}px) rotate(${dragX * 0.13}deg)`
      : isSnap
        ? `translateX(${tearDir * 580}px) translateY(-95px) rotate(${tearDir * 52}deg)`
        : 'none',
    opacity: packGone ? 0 : 1,
    transition: isSnap
      ? 'transform 0.37s cubic-bezier(0.6,0,1,0.5), opacity 0.08s 0.29s'
      : isDrag ? 'none' : 'all 0.18s ease',
  };

  // ---------- Card ----------
  const cardAnimStyle = (() => {
    if (isAppear) return { transform: 'translateX(-50%) scale(1)', opacity: 1, transition: 'opacity 0.5s ease, transform 0.52s cubic-bezier(0.34,1.56,0.64,1)' };
    if (isReady || isFlipping || isDone) return { transform: 'translateX(-50%) scale(1)', opacity: 1, transition: 'all 0.25s ease' };
    return { transform: 'translateX(-50%) scale(0.62)', opacity: 0, transition: 'none' };
  })();

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.91)', backdropFilter: 'blur(14px)' }}
      onClick={isDone ? onClose : undefined}
    >
      <button
        onClick={e => { e.stopPropagation(); onClose(); }}
        style={{ position: 'absolute', top: 20, right: 20, width: 36, height: 36, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        ×
      </button>

      <div style={{ position: 'relative', width: 260, height: 400, userSelect: 'none', touchAction: 'none' }}>

        {/* Outer border frame */}
        <div style={frameStyle} />

        {/* Pack body */}
        <div style={bodyStyle}>
          {/* Vertical holographic lines */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 21px, rgba(195,160,55,0.06) 21px, rgba(195,160,55,0.06) 22.5px)', pointerEvents: 'none' }} />
          {/* Z watermark */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="110" height="110" viewBox="0 0 110 110" fill="none">
              <text x="55" y="83" textAnchor="middle" fill="rgba(195,160,55,0.07)" fontSize="96" fontWeight="900" fontFamily="DM Sans,Arial,sans-serif">Z</text>
            </svg>
          </div>
          <div style={{ position: 'absolute', bottom: 14, left: 0, right: 0, textAlign: 'center', color: 'rgba(195,160,55,0.16)', fontSize: 7, fontWeight: 800, letterSpacing: 5.5 }}>ZET PAKET</div>
        </div>

        {/* Perforated line between band and body */}
        {(isIdle || isDrag) && (
          <div style={{ position: 'absolute', top: 93, left: 0, right: 0, height: 2, zIndex: 8, backgroundImage: 'repeating-linear-gradient(90deg, rgba(215,170,55,0.55) 0px, rgba(215,170,55,0.55) 4px, transparent 4px, transparent 9px)', pointerEvents: 'none' }} />
        )}

        {/* Top tear band — the draggable part */}
        <div
          onMouseDown={e => onDragStart(e.clientX)}
          onTouchStart={e => { e.stopPropagation(); onDragStart(e.touches[0]?.clientX ?? 0); }}
          style={bandStyle}
        >
          {/* Cross-hatch texture */}
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, transparent 0px, transparent 5px, rgba(255,255,255,0.03) 5px, rgba(255,255,255,0.03) 6px)', pointerEvents: 'none' }} />
          {/* Moving sheen */}
          <div style={{ position: 'absolute', top: 0, left: '-20%', width: '45%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,225,120,0.09), transparent)', transform: 'skewX(-18deg)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
            <div style={{ color: 'rgba(255,225,95,0.82)', fontSize: 9, fontWeight: 800, letterSpacing: 2.5 }}>
              {isDrag ? '← YIRT →' : '← YIRT →'}
            </div>
          </div>
        </div>

        {/* Card — always in DOM, animated via style */}
        <div style={{ position: 'absolute', top: 0, left: '50%', bottom: 0, width: 234, zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: (isReady || isFlipping || isDone) ? 'auto' : 'none', ...cardAnimStyle }}>
          <div
            style={{ width: 234, height: 352, borderRadius: 18, cursor: isReady && reward ? 'pointer' : 'default', perspective: 1000 }}
            onClick={handleCardClick}
          >
            <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transform: cardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)' }}>

              {/* Front face */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', borderRadius: 18, background: 'linear-gradient(160deg, #0d0d10, #12121a)', border: '1.5px solid rgba(195,160,55,0.38)', boxShadow: isReady && reward ? '0 0 30px rgba(195,160,55,0.16), 0 14px 44px rgba(0,0,0,0.75)' : '0 10px 34px rgba(0,0,0,0.65)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ position: 'absolute', inset: 0, borderRadius: 14, backgroundImage: 'repeating-linear-gradient(90deg, transparent 0px, transparent 17px, rgba(195,160,55,0.04) 17px, rgba(195,160,55,0.04) 18.5px)', pointerEvents: 'none' }} />
                <svg width="56" height="56" viewBox="0 0 56 56" fill="none" style={{ position: 'relative', zIndex: 1 }}>
                  <circle cx="28" cy="28" r="23" stroke="rgba(195,160,55,0.22)" strokeWidth="1" strokeDasharray="5 4"/>
                  <text x="28" y="37" textAnchor="middle" fill="rgba(195,160,55,0.62)" fontSize="26" fontWeight="800" fontFamily="DM Sans,Arial,sans-serif">Z</text>
                </svg>
                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', minHeight: 30 }}>
                  {isReady && reward && (
                    <>
                      <div style={{ color: 'rgba(195,160,55,0.72)', fontSize: 9, fontWeight: 700, letterSpacing: 1.5 }}>AÇMAK İÇİN</div>
                      <div style={{ color: 'rgba(195,160,55,0.35)', fontSize: 8, marginTop: 4 }}>tıkla</div>
                    </>
                  )}
                  {isReady && !reward && (
                    <div style={{ color: 'rgba(195,160,55,0.32)', fontSize: 8, letterSpacing: 1 }}>yükleniyor...</div>
                  )}
                </div>
              </div>

              {/* Back face — reward */}
              <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 14, background: `linear-gradient(160deg, #070610, ${rc.color}14, #070610)`, border: `1.5px solid ${rc.color}48`, boxShadow: `0 0 55px ${rc.glow}, 0 18px 55px rgba(0,0,0,0.85)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 18 }}>
                {reward && (
                  <>
                    <div style={{ background: `${rc.color}14`, border: `1px solid ${rc.color}3a`, borderRadius: 20, padding: '3px 14px', fontSize: 9, fontWeight: 700, color: rc.color, letterSpacing: 2 }}>
                      {rc.label.toUpperCase()}
                    </div>
                    <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${rc.color}0e`, border: `1.5px solid ${rc.color}42`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="11" stroke={rc.color} strokeWidth="1.2" fill="none"/>
                        <path d="M14 4v2.5M14 21.5V24M4 14h2.5M21.5 14H24M6.9 6.9l1.8 1.8M19.3 19.3l1.8 1.8M6.9 21.1l1.8-1.8M19.3 8.7l1.8-1.8" stroke={rc.color} strokeWidth="1.2" strokeLinecap="round"/>
                      </svg>
                    </div>
                    <div style={{ color: rc.color, fontSize: 16, fontWeight: 800, textAlign: 'center', lineHeight: 1.2, textShadow: `0 0 22px ${rc.glow}` }}>
                      {reward.label || reward.mode}
                    </div>
                    <div style={{ color: 'rgba(255,255,255,0.32)', fontSize: 9, textAlign: 'center' }}>
                      Zeta modu açıldı
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>
        </div>

        {isDone && (
          <div style={{ position: 'absolute', bottom: -46, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
            Kapatmak için tıkla
          </div>
        )}
      </div>
    </div>
  );
}
