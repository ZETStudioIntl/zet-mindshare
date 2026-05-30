import React, { useEffect, useRef } from 'react';

function useLoadingAmbient(enabled) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (!enabled) return;
    if (localStorage.getItem('zet_sfx_enabled') === 'false') return;
    const vol = parseFloat(localStorage.getItem('zet_sfx_volume') || '0.35');
    try {
      const a = new Audio('/sounds/mixkit-futuristic-technology-workshop-ambience-2506.wav');
      a.loop = true;
      a.volume = Math.min(vol * 0.45, 0.28);
      a.play().catch(() => {});
      audioRef.current = a;
    } catch (_) {}
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

/* ─── A4 Document Loading ─────────────────────────────────────────── */

const A4_CSS = `
@keyframes a4-float {
  0%,100% { transform: translateY(0); }
  50%      { transform: translateY(-9px); }
}
@keyframes a4-glow {
  0%,100% { filter: drop-shadow(0 0 12px rgba(59,130,246,0.45)); }
  50%      { filter: drop-shadow(0 0 28px rgba(96,165,250,0.85)); }
}
@keyframes a4-line {
  from { transform: scaleX(0); }
  to   { transform: scaleX(1); }
}
@keyframes a4-dot {
  0%,80%,100% { opacity: 0; }
  40%         { opacity: 1; }
}
`;

const LINES = [
  { y: 38, w: 44, d: '0.1s'  },
  { y: 48, w: 36, d: '0.25s' },
  { y: 56, w: 46, d: '0.4s'  },
  { y: 64, w: 28, d: '0.55s' },
  { y: 72, w: 40, d: '0.7s'  },
  { y: 80, w: 22, d: '0.85s' },
];

export function A4LoadingScreen({ bg, playSound = true }) {
  useLoadingAmbient(playSound);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: bg || 'var(--zet-bg, #0d1117)', gap: 18,
    }}>
      <style>{A4_CSS}</style>

      <div style={{ animation: 'a4-float 2.8s ease-in-out infinite, a4-glow 2.8s ease-in-out infinite' }}>
        <svg width="90" height="127" viewBox="0 0 90 127" fill="none">
          <path d="M8 6 L64 6 L82 24 L82 121 L8 121 Z"
            fill="rgba(59,130,246,0.06)"
            stroke="rgba(59,130,246,0.55)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M64 6 L64 24 L82 24"
            fill="rgba(59,130,246,0.14)"
            stroke="rgba(59,130,246,0.55)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          {LINES.map((l, i) => (
            <rect
              key={i}
              x="16" y={l.y}
              width={l.w} height="4"
              rx="2"
              style={{
                fill: 'rgba(96,165,250,0.55)',
                transformBox: 'fill-box',
                transformOrigin: 'left center',
                animation: `a4-line 0.55s ${l.d} cubic-bezier(.4,0,.2,1) both`,
              }}
            />
          ))}
        </svg>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: 'rgba(96,165,250,0.4)', fontSize: 11, letterSpacing: '0.15em', fontWeight: 600 }}>
          YÜKLENİYOR
        </span>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 3, height: 3, borderRadius: '50%', display: 'inline-block',
            background: 'rgba(96,165,250,0.45)',
            animation: `a4-dot 1.4s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

/* ─── Scales (Terazi) Loading ─────────────────────────────────────── */

const SCALES_CSS = `
@keyframes beam-rock {
  0%,100% { transform: rotate(-13deg); }
  50%      { transform: rotate(13deg); }
}
@keyframes pan-a {
  0%,100% { transform: translateY(-10px); }
  50%      { transform: translateY(10px); }
}
@keyframes pan-b {
  0%,100% { transform: translateY(10px); }
  50%      { transform: translateY(-10px); }
}
@keyframes scales-glow {
  0%,100% { filter: drop-shadow(0 0 8px rgba(200,0,90,0.4)); }
  50%      { filter: drop-shadow(0 0 22px rgba(232,51,122,0.8)); }
}
@keyframes scales-dot {
  0%,80%,100% { opacity: 0; }
  40%         { opacity: 1; }
}
`;

const BEAM_EASE = 'cubic-bezier(0.45,0,0.55,1)';

function ScalesSVG() {
  return (
    <svg width="144" height="116" viewBox="0 0 144 116" fill="none" style={{ display: 'block' }}>
      {/* Base */}
      <rect x="54" y="96" width="36" height="9" rx="4.5"
        fill="rgba(200,0,90,0.22)" stroke="rgba(200,0,90,0.55)" strokeWidth="1.5" />
      {/* Pillar */}
      <rect x="68.5" y="40" width="7" height="57" rx="3.5"
        fill="rgba(200,0,90,0.38)" stroke="rgba(200,0,90,0.28)" strokeWidth="1" />

      {/* Beam — rotates around pivot (72, 40) */}
      <g style={{ transformBox: 'view-box', transformOrigin: '72px 40px', animation: `beam-rock 1.9s ${BEAM_EASE} infinite` }}>
        <line x1="16" y1="40" x2="128" y2="40"
          stroke="rgba(232,51,122,0.9)" strokeWidth="2.8" strokeLinecap="round" />
      </g>

      {/* Pivot dot */}
      <circle cx="72" cy="40" r="5.5" fill="#e8337a" />

      {/* Left pan */}
      <g style={{ animation: `pan-a 1.9s ${BEAM_EASE} infinite` }}>
        <line x1="16" y1="40" x2="16" y2="70"
          stroke="rgba(200,0,90,0.38)" strokeWidth="1.5" strokeDasharray="3,4" />
        <ellipse cx="16" cy="72" rx="15" ry="5.5"
          fill="rgba(200,0,90,0.1)" stroke="rgba(232,51,122,0.75)" strokeWidth="1.8" />
      </g>

      {/* Right pan */}
      <g style={{ animation: `pan-b 1.9s ${BEAM_EASE} infinite` }}>
        <line x1="128" y1="40" x2="128" y2="70"
          stroke="rgba(200,0,90,0.38)" strokeWidth="1.5" strokeDasharray="3,4" />
        <ellipse cx="128" cy="72" rx="15" ry="5.5"
          fill="rgba(200,0,90,0.1)" stroke="rgba(232,51,122,0.75)" strokeWidth="1.8" />
      </g>
    </svg>
  );
}

export function ScalesLoadingScreen({ fullscreen = true, playSound = true, label = 'Analizler yükleniyor' }) {
  useLoadingAmbient(playSound && fullscreen);

  const content = (
    <>
      <style>{SCALES_CSS}</style>
      <div style={{ animation: 'scales-glow 2s ease-in-out infinite' }}>
        <ScalesSVG />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ color: 'rgba(200,0,90,0.5)', fontSize: 11, letterSpacing: '0.15em', fontWeight: 600 }}>
          {label.toUpperCase()}
        </span>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 3, height: 3, borderRadius: '50%', display: 'inline-block',
            background: 'rgba(200,0,90,0.5)',
            animation: `scales-dot 1.4s ${i * 0.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>
    </>
  );

  if (!fullscreen) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: 16 }}>
        {content}
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a020a', gap: 20 }}>
      {content}
    </div>
  );
}

/* ─── Mini Doc Loader (inline panels) ────────────────────────────── */

export function MiniDocLoader({ padding = '28px 0' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding, gap: 8 }}>
      <style>{A4_CSS}</style>
      <div style={{ animation: 'a4-float 2.8s ease-in-out infinite, a4-glow 2.8s ease-in-out infinite' }}>
        <svg width="46" height="65" viewBox="0 0 90 127" fill="none">
          <path d="M8 6 L64 6 L82 24 L82 121 L8 121 Z"
            fill="rgba(59,130,246,0.06)" stroke="rgba(59,130,246,0.55)" strokeWidth="1.8" strokeLinejoin="round"/>
          <path d="M64 6 L64 24 L82 24"
            fill="rgba(59,130,246,0.14)" stroke="rgba(59,130,246,0.55)" strokeWidth="1.8" strokeLinejoin="round"/>
          {LINES.map((l, i) => (
            <rect key={i} x="16" y={l.y} width={l.w} height="4" rx="2"
              style={{ fill: 'rgba(96,165,250,0.55)', transformBox: 'fill-box', transformOrigin: 'left center', animation: `a4-line 0.55s ${l.d} cubic-bezier(.4,0,.2,1) both` }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

/* ─── Rainbow Spinner (AppSelector) ──────────────────────────────── */

const RAINBOW_CSS = `
@keyframes rainbow-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
`;

export function RainbowSpinner({ size = 32, thickness = 4 }) {
  const hole = Math.round(((size - thickness * 2) / size) * 100);
  return (
    <>
      <style>{RAINBOW_CSS}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', flexShrink: 0,
        background: 'conic-gradient(from 0deg, #ff6b6b, #ffd93d, #6bcb77, #4d96ff, #c77dff, #ff9f43, #ff6b6b)',
        animation: 'rainbow-spin 0.7s linear infinite',
        WebkitMask: `radial-gradient(farthest-side, transparent ${hole}%, black ${hole + 1}%)`,
        mask: `radial-gradient(farthest-side, transparent ${hole}%, black ${hole + 1}%)`,
      }} />
    </>
  );
}
