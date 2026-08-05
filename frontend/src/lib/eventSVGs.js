import React from 'react';

const S = ({ size = 120, children }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none"
    strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

// ─── Ramazan ────────────────────────────────────────────────────────────────

const RamazanAy = ({ c, size }) => (
  <S size={size}>
    {/* Crescent via clip: draw full arc then cut with background arc */}
    <path d="M72 22 A38 38 0 1 0 72 98 A28 28 0 1 1 72 22 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`} />
    <polygon stroke={c} strokeWidth="1.8" fill={`${c}20`}
      points="90,18 92,25 99,25 93.5,29.5 95.5,36.5 90,32.5 84.5,36.5 86.5,29.5 81,25 88,25" />
  </S>
);

const RamazanFener = ({ c, size }) => (
  <S size={size}>
    {/* Handle */}
    <path d="M52 18 Q52 10 60 10 Q68 10 68 18" stroke={c} strokeWidth="2.5" fill="none"/>
    {/* Top cap */}
    <rect x="48" y="18" width="24" height="7" rx="2" stroke={c} strokeWidth="2.5"/>
    {/* Body */}
    <path d="M50 25 Q44 55 44 75 Q44 90 60 94 Q76 90 76 75 Q76 55 70 25"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Bottom cap */}
    <ellipse cx="60" cy="93" rx="10" ry="4" stroke={c} strokeWidth="2" fill="none"/>
    {/* Bottom tip */}
    <path d="M57 97 L60 104 L63 97" stroke={c} strokeWidth="2"/>
    {/* Horizontal bands */}
    <path d="M46 44 Q60 48 74 44" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M45 62 Q60 66 75 62" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M44 78 Q60 82 76 78" stroke={c} strokeWidth="1.5" fill="none"/>
  </S>
);

const RamazanCami = ({ c, size }) => (
  <S size={size}>
    {/* Base */}
    <rect x="22" y="70" width="76" height="38" rx="2" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Main dome */}
    <path d="M36 70 Q36 44 60 38 Q84 44 84 70" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Left minaret */}
    <rect x="24" y="34" width="9" height="38" rx="2" stroke={c} strokeWidth="2"/>
    <path d="M24 34 L28.5 24 L33 34" stroke={c} strokeWidth="2"/>
    {/* Right minaret */}
    <rect x="87" y="34" width="9" height="38" rx="2" stroke={c} strokeWidth="2"/>
    <path d="M87 34 L91.5 24 L96 34" stroke={c} strokeWidth="2"/>
    {/* Door */}
    <path d="M52 108 L52 84 Q52 76 60 76 Q68 76 68 84 L68 108" stroke={c} strokeWidth="2" fill="none"/>
    {/* Windows */}
    <path d="M34 82 Q38 78 42 82" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M78 82 Q82 78 86 82" stroke={c} strokeWidth="1.5" fill="none"/>
    {/* Star on dome */}
    <path d="M60 44 L61.2 48 L65 48 L62 50.5 L63.2 54.5 L60 52 L56.8 54.5 L58 50.5 L55 48 L58.8 48 Z"
      stroke={c} strokeWidth="1.2" fill={`${c}30`}/>
  </S>
);

const RamazanSofra = ({ c, size }) => (
  <S size={size}>
    {/* Table */}
    <ellipse cx="60" cy="80" rx="48" ry="14" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Table legs */}
    <path d="M25 90 L20 108" stroke={c} strokeWidth="2"/>
    <path d="M95 90 L100 108" stroke={c} strokeWidth="2"/>
    {/* Plate left */}
    <ellipse cx="34" cy="74" rx="14" ry="5" stroke={c} strokeWidth="2"/>
    <ellipse cx="34" cy="73" rx="8" ry="2.5" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
    {/* Plate right */}
    <ellipse cx="82" cy="74" rx="16" ry="5.5" stroke={c} strokeWidth="2"/>
    <ellipse cx="82" cy="73" rx="9" ry="3" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
    {/* Candle center */}
    <rect x="57" y="42" width="6" height="30" rx="3" stroke={c} strokeWidth="2"/>
    {/* Flame */}
    <path d="M60 42 Q56 35 60 28 Q64 35 60 42" stroke={c} strokeWidth="1.8" fill={`${c}20`}/>
    {/* Dates bowl */}
    <ellipse cx="60" cy="80" rx="6" ry="2.5" stroke={c} strokeWidth="1.5"/>
  </S>
);

const RamazanKandil = ({ c, size }) => (
  <S size={size}>
    {/* Chain */}
    <path d="M60 8 L60 22" stroke={c} strokeWidth="2.5"/>
    {/* Top */}
    <path d="M48 22 L72 22" stroke={c} strokeWidth="2.5"/>
    {/* Body — diamond lantern */}
    <path d="M60 22 L80 55 L60 88 L40 55 Z" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Bottom tip */}
    <path d="M54 88 L60 100 L66 88" stroke={c} strokeWidth="2"/>
    {/* Middle band */}
    <path d="M42 55 L78 55" stroke={c} strokeWidth="1.5"/>
    {/* Vertical lines */}
    <path d="M55 22 L47 88" stroke={c} strokeWidth="1" opacity=".5"/>
    <path d="M65 22 L73 88" stroke={c} strokeWidth="1" opacity=".5"/>
    {/* Flame */}
    <path d="M60 65 Q57 58 60 52 Q63 58 60 65" stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

// ─── Kurban ──────────────────────────────────────────────────────────────────

const KurbanKoyun = ({ c, size }) => (
  <S size={size}>
    {/* Body — woolly bumpy outline */}
    <path d="M30 72 Q24 62 28 52 Q26 42 34 40 Q38 32 46 34 Q50 28 58 30 Q66 26 72 32 Q80 30 84 38 Q92 40 92 52 Q96 62 90 72 Q82 80 60 82 Q38 80 30 72 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Wool bumps */}
    <path d="M34 50 Q30 44 36 42 M46 38 Q44 32 50 32 M62 32 Q64 26 70 30 M78 36 Q82 30 86 36"
      stroke={c} strokeWidth="1.5" fill="none"/>
    {/* Head */}
    <ellipse cx="91" cy="52" rx="14" ry="11" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Eye */}
    <circle cx="97" cy="48" r="2.5" stroke={c} strokeWidth="1.5"/>
    <circle cx="97.8" cy="47.5" r="0.8" stroke={c} strokeWidth="1" fill={c}/>
    {/* Mouth */}
    <path d="M88 57 Q92 60 96 57" stroke={c} strokeWidth="1.5" fill="none"/>
    {/* Ears */}
    <path d="M86 46 Q80 38 84 36" stroke={c} strokeWidth="2"/>
    <path d="M86 46 Q82 40 88 38" stroke={c} strokeWidth="2"/>
    {/* Legs */}
    <path d="M40 80 L38 104" stroke={c} strokeWidth="2.5"/>
    <path d="M52 82 L51 104" stroke={c} strokeWidth="2.5"/>
    <path d="M68 82 L69 104" stroke={c} strokeWidth="2.5"/>
    <path d="M80 80 L82 104" stroke={c} strokeWidth="2.5"/>
    {/* Hooves */}
    <path d="M35 102 L38 106 L41 102" stroke={c} strokeWidth="2"/>
    <path d="M48 102 L51 106 L54 102" stroke={c} strokeWidth="2"/>
    <path d="M66 102 L69 106 L72 102" stroke={c} strokeWidth="2"/>
    <path d="M79 102 L82 106 L85 102" stroke={c} strokeWidth="2"/>
  </S>
);

const KurbanKaabe = ({ c, size }) => (
  <S size={size}>
    {/* Front face */}
    <rect x="24" y="36" width="58" height="66" rx="1" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Side face (3D) */}
    <path d="M82 36 L98 24 L98 90 L82 102" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Top face */}
    <path d="M24 36 L40 24 L98 24 L82 36 Z" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    {/* Gold band horizontal */}
    <path d="M24 52 L82 52 M82 52 L98 40" stroke={c} strokeWidth="2"/>
    <path d="M24 64 L82 64 M82 64 L98 52" stroke={c} strokeWidth="2"/>
    {/* Door */}
    <path d="M44 102 L44 72 Q44 64 53 64 Q62 64 62 72 L62 102" stroke={c} strokeWidth="2" fill="none"/>
    {/* Star above */}
    <polygon stroke={c} strokeWidth="1.5" fill={`${c}20`}
      points="60,10 61.5,15 66,15 62.5,18 64,23 60,20 56,23 57.5,18 54,15 58.5,15" />
    {/* Ground line */}
    <path d="M14 102 L106 102" stroke={c} strokeWidth="2"/>
  </S>
);

const KurbanDua = ({ c, size }) => (
  <S size={size}>
    {/* Left palm */}
    <path d="M46 90 L44 60 Q44 50 50 48 L52 46 Q56 44 58 50 L58 68"
      stroke={c} strokeWidth="3" fill={`${c}10`}/>
    {/* Left fingers */}
    <path d="M50 48 L50 36 Q50 30 54 30 Q58 30 58 36 L58 48" stroke={c} strokeWidth="2.5"/>
    <path d="M44 50 Q40 44 40 38 Q40 32 44 32 Q48 32 50 38" stroke={c} strokeWidth="2.5"/>
    <path d="M44 56 Q36 52 34 46 Q32 40 36 38 Q40 36 44 42" stroke={c} strokeWidth="2.5"/>
    {/* Right palm */}
    <path d="M74 90 L76 60 Q76 50 70 48 L68 46 Q64 44 62 50 L62 68"
      stroke={c} strokeWidth="3" fill={`${c}10`}/>
    {/* Right fingers */}
    <path d="M70 48 L70 36 Q70 30 66 30 Q62 30 62 36 L62 48" stroke={c} strokeWidth="2.5"/>
    <path d="M76 50 Q80 44 80 38 Q80 32 76 32 Q72 32 70 38" stroke={c} strokeWidth="2.5"/>
    <path d="M76 56 Q84 52 86 46 Q88 40 84 38 Q80 36 76 42" stroke={c} strokeWidth="2.5"/>
    {/* Wrist join */}
    <path d="M46 90 L74 90" stroke={c} strokeWidth="3"/>
    {/* Light rays above */}
    <path d="M60 22 L60 14 M52 24 L48 18 M68 24 L72 18 M46 30 L40 26 M74 30 L80 26"
      stroke={c} strokeWidth="1.5" opacity=".6"/>
  </S>
);

// ─── Bayram ───────────────────────────────────────────────────────────────────

const BayramBalon = ({ c, size }) => (
  <S size={size}>
    {/* Center balloon */}
    <ellipse cx="60" cy="38" rx="20" ry="25" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M60 63 L60 72" stroke={c} strokeWidth="2"/>
    <path d="M58 63 Q60 67 62 63" stroke={c} strokeWidth="1.5"/>
    {/* Left balloon */}
    <ellipse cx="32" cy="48" rx="16" ry="20" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <path d="M32 68 L32 78" stroke={c} strokeWidth="2"/>
    <path d="M30 68 Q32 72 34 68" stroke={c} strokeWidth="1.5"/>
    {/* Right balloon */}
    <ellipse cx="88" cy="46" rx="16" ry="20" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <path d="M88 66 L88 76" stroke={c} strokeWidth="2"/>
    <path d="M86 66 Q88 70 90 66" stroke={c} strokeWidth="1.5"/>
    {/* Strings together */}
    <path d="M32 78 Q46 88 60 72 Q74 88 88 76" stroke={c} strokeWidth="1.5" fill="none"/>
    {/* Shine on center */}
    <path d="M48 28 Q52 24 56 26" stroke={c} strokeWidth="1.5" opacity=".5"/>
  </S>
);

const BayramKonfeti = ({ c, size }) => (
  <S size={size}>
    {/* Various confetti shapes */}
    <rect x="18" y="14" width="8" height="5" rx="1" stroke={c} strokeWidth="1.8" transform="rotate(-20 18 14)"/>
    <circle cx="42" cy="16" r="4" stroke={c} strokeWidth="1.8"/>
    <rect x="65" y="10" width="6" height="6" rx="1" stroke={c} strokeWidth="1.8" transform="rotate(15 65 10)"/>
    <path d="M88 18 L92 12 L96 18 Z" stroke={c} strokeWidth="1.8"/>
    <rect x="14" y="46" width="7" height="4" rx="1" stroke={c} strokeWidth="1.8" transform="rotate(30 14 46)"/>
    <circle cx="96" cy="42" r="3.5" stroke={c} strokeWidth="1.8"/>
    <path d="M26 72 L30 66 L34 72 Z" stroke={c} strokeWidth="1.8"/>
    <rect x="88" y="66" width="8" height="5" rx="1" stroke={c} strokeWidth="1.8" transform="rotate(-10 88 66)"/>
    <circle cx="20" cy="88" r="4" stroke={c} strokeWidth="1.8"/>
    <rect x="52" y="84" width="6" height="6" rx="1" stroke={c} strokeWidth="1.8" transform="rotate(25 52 84)"/>
    <path d="M86 88 L90 82 L94 88 Z" stroke={c} strokeWidth="1.8"/>
    <circle cx="60" cy="54" r="3" stroke={c} strokeWidth="1.8"/>
    {/* Stars */}
    <path d="M36 34 L37 37 L40 37 L38 39 L39 42 L36 40 L33 42 L34 39 L32 37 L35 37 Z" stroke={c} strokeWidth="1.5"/>
    <path d="M74 28 L75 31 L78 31 L76 33 L77 36 L74 34 L71 36 L72 33 L70 31 L73 31 Z" stroke={c} strokeWidth="1.5"/>
    <path d="M62 68 L63 71 L66 71 L64 73 L65 76 L62 74 L59 76 L60 73 L58 71 L61 71 Z" stroke={c} strokeWidth="1.5"/>
    {/* Streamers */}
    <path d="M44 20 Q48 30 42 40 Q36 50 40 60" stroke={c} strokeWidth="1.5" fill="none" opacity=".6"/>
    <path d="M76 16 Q80 26 74 36 Q68 46 72 56" stroke={c} strokeWidth="1.5" fill="none" opacity=".6"/>
  </S>
);

const BayramHavaiFisek = ({ c, size }) => (
  <S size={size}>
    {/* Main burst center */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
      const r = deg * Math.PI / 180;
      const len = i % 2 === 0 ? 34 : 24;
      return <line key={i} x1={60} y1={44} x2={60 + Math.sin(r)*len} y2={44 - Math.cos(r)*len}
        stroke={c} strokeWidth={i % 2 === 0 ? 2 : 1.5}/>;
    })}
    <circle cx="60" cy="44" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    {/* Tip stars */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const r = deg * Math.PI / 180;
      const x = 60 + Math.sin(r) * 36; const y = 44 - Math.cos(r) * 36;
      return <circle key={i} cx={x} cy={y} r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}30`}/>;
    })}
    {/* Second burst left */}
    {[0,45,90,135,180,225,270,315].map((deg, i) => {
      const r = deg * Math.PI / 180;
      return <line key={i} x1={28} y1={82} x2={28 + Math.sin(r)*18} y2={82 - Math.cos(r)*18}
        stroke={c} strokeWidth="1.5" opacity=".7"/>;
    })}
    <circle cx="28" cy="82" r="3.5" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    {/* Third burst right */}
    {[0,60,120,180,240,300].map((deg, i) => {
      const r = deg * Math.PI / 180;
      return <line key={i} x1={92} y1={78} x2={92 + Math.sin(r)*16} y2={78 - Math.cos(r)*16}
        stroke={c} strokeWidth="1.5" opacity=".7"/>;
    })}
    <circle cx="92" cy="78" r="3" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    {/* Falling trails */}
    <path d="M28 100 Q26 108 22 112" stroke={c} strokeWidth="1.5" opacity=".4"/>
    <path d="M46 100 Q50 108 52 114" stroke={c} strokeWidth="1.5" opacity=".4"/>
    <path d="M92 94 Q96 102 94 110" stroke={c} strokeWidth="1.5" opacity=".4"/>
  </S>
);

// ─── Milli ────────────────────────────────────────────────────────────────────

const TurkBayrak = ({ c, size }) => (
  <S size={size}>
    <rect x="8" y="30" width="104" height="60" rx="3" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Crescent */}
    <path d="M46 46 A18 18 0 1 0 46 74 A13 13 0 1 1 46 46 Z"
      stroke={c} strokeWidth="2" fill={`${c}15`}/>
    {/* Star */}
    <polygon stroke={c} strokeWidth="1.8" fill={`${c}20`}
      points="73,60 74.8,65.5 80.5,65.5 75.8,69 77.6,74.5 73,71 68.4,74.5 70.2,69 65.5,65.5 71.2,65.5"/>
    {/* Flagpole */}
    <line x1="8" y1="20" x2="8" y2="100" stroke={c} strokeWidth="3"/>
  </S>
);

const Cumhuriyet = ({ c, size }) => (
  <S size={size}>
    {/* Laurel wreath left */}
    <path d="M22 60 Q18 50 22 40 Q24 34 28 30" stroke={c} strokeWidth="2" fill="none" opacity=".6"/>
    <path d="M22 60 Q16 52 18 42 Q20 36 24 32" stroke={c} strokeWidth="1.5" fill="none" opacity=".4"/>
    {/* Laurel right */}
    <path d="M98 60 Q102 50 98 40 Q96 34 92 30" stroke={c} strokeWidth="2" fill="none" opacity=".6"/>
    <path d="M98 60 Q104 52 102 42 Q100 36 96 32" stroke={c} strokeWidth="1.5" fill="none" opacity=".4"/>
    {/* Center: 100 */}
    <text x="60" y="70" textAnchor="middle" fill="none" stroke={c} strokeWidth="1.5"
      fontSize="42" fontWeight="900" fontFamily="system-ui, sans-serif">100</text>
    {/* Star on top */}
    <polygon stroke={c} strokeWidth="1.8" fill={`${c}20`}
      points="60,8 61.5,13 66,13 62.5,16.5 64,21.5 60,18 56,21.5 57.5,16.5 54,13 58.5,13"/>
    {/* Bottom ribbon */}
    <path d="M30 75 Q60 82 90 75" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

// ─── Ödül ─────────────────────────────────────────────────────────────────────

const Kupa = ({ c, size }) => (
  <S size={size}>
    {/* Cup body */}
    <path d="M28 22 H92 V58 Q92 82 60 84 Q28 82 28 58 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Handles */}
    <path d="M28 30 Q12 30 12 50 Q12 66 28 66" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M92 30 Q108 30 108 50 Q108 66 92 66" stroke={c} strokeWidth="2.5" fill="none"/>
    {/* Stem */}
    <path d="M60 84 L60 96" stroke={c} strokeWidth="3"/>
    {/* Base */}
    <path d="M40 96 L80 96" stroke={c} strokeWidth="3"/>
    <path d="M36 102 L84 102" stroke={c} strokeWidth="3"/>
    {/* Star inside */}
    <polygon stroke={c} strokeWidth="2" fill={`${c}15`}
      points="60,36 63,45 72,45 65,51 67.5,60 60,55 52.5,60 55,51 48,45 57,45"/>
    {/* Shine */}
    <path d="M36 30 Q40 26 44 28" stroke={c} strokeWidth="1.5" opacity=".5"/>
  </S>
);

const Tac = ({ c, size }) => (
  <S size={size}>
    {/* Crown base */}
    <path d="M12 90 L12 50 L36 70 L60 22 L84 70 L108 50 L108 90 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Base band */}
    <path d="M12 90 L108 90" stroke={c} strokeWidth="3"/>
    <rect x="12" y="84" width="96" height="10" rx="2" stroke={c} strokeWidth="2"/>
    {/* Gems */}
    <circle cx="60" cy="22" r="6" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="12" cy="50" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="108" cy="50" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="36" cy="70" r="4" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="84" cy="70" r="4" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    {/* Crown dots on band */}
    <circle cx="30" cy="89" r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="60" cy="89" r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="90" cy="89" r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
  </S>
);

const Elmas = ({ c, size }) => (
  <S size={size}>
    {/* Top facets */}
    <path d="M60 12 L92 44 L60 108 L28 44 Z" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Girdle (waist line) */}
    <path d="M28 44 L92 44" stroke={c} strokeWidth="2"/>
    {/* Top facet lines */}
    <path d="M60 12 L44 44 M60 12 L76 44" stroke={c} strokeWidth="1.5"/>
    <path d="M28 44 L60 28 L92 44" stroke={c} strokeWidth="1.5" fill={`${c}10`}/>
    {/* Bottom facets */}
    <path d="M44 44 L60 108 M76 44 L60 108" stroke={c} strokeWidth="1.5"/>
    <path d="M28 44 L60 72 L92 44" stroke={c} strokeWidth="1.5"/>
    {/* Shine */}
    <path d="M46 32 Q50 28 54 30" stroke={c} strokeWidth="1.5" opacity=".5"/>
  </S>
);

const Hediye = ({ c, size }) => (
  <S size={size}>
    {/* Box body */}
    <rect x="18" y="52" width="84" height="56" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Lid */}
    <rect x="14" y="38" width="92" height="16" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Ribbon vertical */}
    <path d="M52 38 L52 108 M68 38 L68 108" stroke={c} strokeWidth="2"/>
    {/* Ribbon horizontal */}
    <path d="M14 46 L106 46" stroke={c} strokeWidth="2"/>
    {/* Bow */}
    <path d="M60 38 Q48 28 44 20 Q40 14 46 12 Q52 10 60 24"
      stroke={c} strokeWidth="2" fill="none"/>
    <path d="M60 38 Q72 28 76 20 Q80 14 74 12 Q68 10 60 24"
      stroke={c} strokeWidth="2" fill="none"/>
    <circle cx="60" cy="38" r="3.5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

const YildizPatlama = ({ c, size }) => (
  <S size={size}>
    {/* Outer rays */}
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg, i) => {
      const r = deg * Math.PI / 180;
      const inner = i % 2 === 0 ? 30 : 24;
      const outer = i % 2 === 0 ? 50 : 38;
      return <line key={i} x1={60 + Math.sin(r)*inner} y1={60 - Math.cos(r)*inner}
        x2={60 + Math.sin(r)*outer} y2={60 - Math.cos(r)*outer}
        stroke={c} strokeWidth={i%2===0?2:1.5}/>;
    })}
    {/* Inner 5-point star */}
    <polygon stroke={c} strokeWidth="2.5" fill={`${c}12`}
      points="60,28 65,44 82,44 69,54 74,70 60,60 46,70 51,54 38,44 55,44"/>
    <circle cx="60" cy="60" r="6" stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

const Roket = ({ c, size }) => (
  <S size={size}>
    {/* Body */}
    <path d="M60 8 Q76 18 80 46 L80 82 Q80 90 60 102 Q40 90 40 82 L40 46 Q44 18 60 8 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Nose window */}
    <circle cx="60" cy="38" r="10" stroke={c} strokeWidth="2" fill={`${c}12`}/>
    <path d="M54 34 Q56 30 60 30" stroke={c} strokeWidth="1.5" opacity=".5"/>
    {/* Center stripe */}
    <path d="M40 60 L80 60" stroke={c} strokeWidth="1.5" opacity=".4"/>
    {/* Left wing */}
    <path d="M40 70 Q26 76 22 90 L40 86 Z" stroke={c} strokeWidth="2" fill={`${c}10`}/>
    {/* Right wing */}
    <path d="M80 70 Q94 76 98 90 L80 86 Z" stroke={c} strokeWidth="2" fill={`${c}10`}/>
    {/* Flames */}
    <path d="M50 102 Q46 110 50 116 Q54 110 50 102" stroke={c} strokeWidth="1.8" fill="none" opacity=".7"/>
    <path d="M60 102 Q56 112 60 118 Q64 112 60 102" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M70 102 Q74 110 70 116 Q66 110 70 102" stroke={c} strokeWidth="1.8" fill="none" opacity=".7"/>
  </S>
);

const Kalp = ({ c, size }) => (
  <S size={size}>
    <path d="M60 96 Q18 70 14 44 Q10 20 34 14 Q50 10 60 28 Q70 10 86 14 Q110 20 106 44 Q102 70 60 96 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Inner shine */}
    <path d="M34 26 Q38 20 44 22 Q50 24 50 32" stroke={c} strokeWidth="1.5" opacity=".5" fill="none"/>
  </S>
);

const Madalya = ({ c, size }) => (
  <S size={size}>
    {/* Ribbon */}
    <path d="M48 14 L48 44 L60 50 L72 44 L72 14 Z" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <path d="M48 14 L60 20 L72 14" stroke={c} strokeWidth="2"/>
    {/* Medal circle */}
    <circle cx="60" cy="72" r="34" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="60" cy="72" r="28" stroke={c} strokeWidth="1.5"/>
    {/* Star inside */}
    <polygon stroke={c} strokeWidth="2" fill={`${c}15`}
      points="60,52 63.5,63 75,63 66,70 69.5,81 60,74 50.5,81 54,70 45,63 56.5,63"/>
    {/* Shine */}
    <path d="M46 62 Q50 58 54 60" stroke={c} strokeWidth="1.5" opacity=".5"/>
  </S>
);

const Sandik = ({ c, size }) => (
  <S size={size}>
    {/* Base */}
    <rect x="12" y="56" width="96" height="52" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Lid */}
    <path d="M12 56 Q12 36 22 32 H98 Q108 36 108 56 Z" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Lock */}
    <rect x="48" y="50" width="24" height="14" rx="4" stroke={c} strokeWidth="2" fill={`${c}12`}/>
    <path d="M52 50 Q52 42 60 42 Q68 42 68 50" stroke={c} strokeWidth="2"/>
    <circle cx="60" cy="57" r="3" stroke={c} strokeWidth="1.8"/>
    {/* Metal strips */}
    <path d="M12 68 L108 68" stroke={c} strokeWidth="1.5"/>
    <path d="M12 82 L108 82" stroke={c} strokeWidth="1.5"/>
    {/* Corner brackets */}
    <path d="M12 56 L20 56 M12 64 L12 56 L20 56" stroke={c} strokeWidth="2"/>
    <path d="M108 56 L100 56 M108 64 L108 56 L100 56" stroke={c} strokeWidth="2"/>
    {/* Gems on base */}
    <circle cx="36" cy="90" r="4" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
    <circle cx="84" cy="90" r="4" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
  </S>
);

const Rozet = ({ c, size }) => (
  <S size={size}>
    <path d="M60 8 L66 24 L84 18 L76 34 L94 36 L80 48 L90 64 L72 60 L70 78 L58 66 L46 78 L44 60 L26 64 L36 48 L22 36 L40 34 L32 18 L50 24 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="60" cy="46" r="20" stroke={c} strokeWidth="2" fill={`${c}10`}/>
    <polygon stroke={c} strokeWidth="2" fill={`${c}15`}
      points="60,30 63,40 73,40 65.5,46.5 68.5,57 60,51 51.5,57 54.5,46.5 47,40 57,40"/>
  </S>
);

// ─── Mevsim ───────────────────────────────────────────────────────────────────

const KarTanesi = ({ c, size }) => (
  <S size={size}>
    {/* 6 main arms */}
    {[0, 60, 120].map(deg => {
      const r = deg * Math.PI / 180;
      const x2 = 60 + Math.cos(r) * 46; const y2 = 60 + Math.sin(r) * 46;
      const x3 = 60 - Math.cos(r) * 46; const y3 = 60 - Math.sin(r) * 46;
      const br = (deg + 90) * Math.PI / 180;
      // Branch points at 35% and 65%
      const pts = [0.35, 0.65, -0.35, -0.65].map(t => {
        const bx = 60 + Math.cos(r) * 46 * t;
        const by = 60 + Math.sin(r) * 46 * t;
        return { bx, by };
      });
      return (
        <g key={deg}>
          <line x1={x3} y1={y3} x2={x2} y2={y2} stroke={c} strokeWidth="3"/>
          {pts.map(({ bx, by }, i) => (
            <g key={i}>
              <line x1={bx} y1={by} x2={bx + Math.cos(br)*12} y2={by + Math.sin(br)*12} stroke={c} strokeWidth="2"/>
              <line x1={bx} y1={by} x2={bx - Math.cos(br)*12} y2={by - Math.sin(br)*12} stroke={c} strokeWidth="2"/>
            </g>
          ))}
        </g>
      );
    })}
    <circle cx="60" cy="60" r="6" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
  </S>
);

const Cicek = ({ c, size }) => (
  <S size={size}>
    {/* 6 petals */}
    {[0, 60, 120, 180, 240, 300].map((deg, i) => {
      const r = deg * Math.PI / 180;
      const cx2 = 60 + Math.cos(r) * 26; const cy2 = 60 + Math.sin(r) * 26;
      return <ellipse key={i} cx={cx2} cy={cy2} rx="13" ry="20"
        stroke={c} strokeWidth="2" fill={`${c}${i%2===0?'10':'08'}`}
        transform={`rotate(${deg},${cx2},${cy2})`}/>;
    })}
    <circle cx="60" cy="60" r="14" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <circle cx="60" cy="60" r="6" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    {/* Stem */}
    <path d="M60 74 Q58 90 54 100" stroke={c} strokeWidth="2"/>
    <path d="M56 88 Q48 86 44 80" stroke={c} strokeWidth="1.8" fill="none"/>
  </S>
);

const Yaprak = ({ c, size }) => (
  <S size={size}>
    <path d="M60 12 Q96 28 96 68 Q96 100 60 110 Q24 100 24 68 Q24 28 60 12 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Central vein */}
    <path d="M60 12 L60 110" stroke={c} strokeWidth="2"/>
    {/* Side veins */}
    <path d="M60 36 Q74 44 82 58" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M60 36 Q46 44 38 58" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M60 58 Q72 64 78 76" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M60 58 Q48 64 42 76" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M60 76 Q68 80 72 90" stroke={c} strokeWidth="1.2" fill="none" opacity=".6"/>
    <path d="M60 76 Q52 80 48 90" stroke={c} strokeWidth="1.2" fill="none" opacity=".6"/>
  </S>
);

const GunBatimi = ({ c, size }) => (
  <S size={size}>
    {/* Sun rays */}
    {[270, 225, 180, 135, 90, 315, 0, 45].map((deg, i) => {
      const r = deg * Math.PI / 180;
      if (deg > 180 && deg < 360) return null;
      const inner = 34, outer = 48;
      return <line key={i} x1={60+Math.cos(r)*inner} y1={72+Math.sin(r)*inner}
        x2={60+Math.cos(r)*outer} y2={72+Math.sin(r)*outer}
        stroke={c} strokeWidth="2"/>;
    })}
    {/* Sun semicircle */}
    <path d="M26 72 A34 34 0 0 1 94 72" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    {/* Horizon */}
    <path d="M10 72 L110 72" stroke={c} strokeWidth="2.5"/>
    {/* Sea waves */}
    <path d="M10 82 Q22 76 34 82 Q46 88 58 82 Q70 76 82 82 Q94 88 110 82" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M10 94 Q24 88 38 94 Q52 100 66 94 Q80 88 94 94 Q102 98 110 94" stroke={c} strokeWidth="1.5" fill="none" opacity=".6"/>
    {/* Reflection */}
    <path d="M56 74 L56 90 M60 74 L60 92 M64 74 L64 90" stroke={c} strokeWidth="1.2" opacity=".4"/>
  </S>
);

const YeniYil = ({ c, size }) => (
  <S size={size}>
    {/* Tree */}
    <path d="M60 14 L80 42 H66 L82 62 H70 L86 82 H34 L50 62 H38 L54 42 H40 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    {/* Trunk */}
    <rect x="54" y="82" width="12" height="20" rx="2" stroke={c} strokeWidth="2"/>
    {/* Star on top */}
    <polygon stroke={c} strokeWidth="2" fill={`${c}20`}
      points="60,6 62,12 68,12 63.5,15.5 65.5,22 60,18.5 54.5,22 56.5,15.5 52,12 58,12"/>
    {/* Ornaments */}
    <circle cx="48" cy="56" r="3.5" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="72" cy="56" r="3.5" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="44" cy="72" r="3.5" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="60" cy="68" r="3.5" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="76" cy="72" r="3.5" stroke={c} strokeWidth="1.8" fill={`${c}15`}/>
    <circle cx="58" cy="48" r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
    <circle cx="68" cy="44" r="2.5" stroke={c} strokeWidth="1.5" fill={`${c}15`}/>
    {/* Ground line */}
    <path d="M34 102 L86 102" stroke={c} strokeWidth="2"/>
  </S>
);

// ─── ZET ─────────────────────────────────────────────────────────────────────

const ZetZ = ({ c, size }) => (
  <S size={size}>
    {/* Outer circle */}
    <circle cx="60" cy="60" r="50" stroke={c} strokeWidth="2" fill={`${c}06`}/>
    {/* Bold Z */}
    <path d="M28 28 H92 L28 92 H92" stroke={c} strokeWidth="8" fill="none"/>
    {/* Z line caps (top and bottom) */}
    <path d="M28 28 H92" stroke={c} strokeWidth="8"/>
    <path d="M28 92 H92" stroke={c} strokeWidth="8"/>
    {/* Corner dots */}
    <circle cx="28" cy="28" r="4" stroke={c} strokeWidth="2" fill={`${c}30`}/>
    <circle cx="92" cy="92" r="4" stroke={c} strokeWidth="2" fill={`${c}30`}/>
  </S>
);

const ZetaOrb = ({ c, size }) => (
  <S size={size}>
    {/* Outer orbit rings */}
    <ellipse cx="60" cy="60" rx="50" ry="20" stroke={c} strokeWidth="1.5" opacity=".4"
      transform="rotate(-30 60 60)"/>
    <ellipse cx="60" cy="60" rx="50" ry="20" stroke={c} strokeWidth="1.5" opacity=".4"
      transform="rotate(30 60 60)"/>
    {/* Core circle */}
    <circle cx="60" cy="60" r="26" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    {/* Z inside */}
    <path d="M44 48 H76 L44 72 H76" stroke={c} strokeWidth="4"/>
    <path d="M44 48 H76" stroke={c} strokeWidth="4"/>
    <path d="M44 72 H76" stroke={c} strokeWidth="4"/>
    {/* Orbit dots */}
    {[0, 72, 144, 216, 288].map((deg, i) => {
      const r = deg * Math.PI / 180;
      return <circle key={i} cx={60+Math.cos(r)*50} cy={60+Math.sin(r)*50}
        r="3" stroke={c} strokeWidth="1.5" fill={`${c}30`}/>;
    })}
  </S>
);

// ─── Export ──────────────────────────────────────────────────────────────────

// ─── Eğitim & Bilim ─────────────────────────────────────────────────────────

const Kitap = ({ c, size }) => (
  <S size={size}>
    <rect x="28" y="22" width="64" height="76" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M44 22 L44 98" stroke={c} strokeWidth="2"/>
    <line x1="52" y1="40" x2="80" y2="40" stroke={c} strokeWidth="2"/>
    <line x1="52" y1="54" x2="80" y2="54" stroke={c} strokeWidth="2"/>
    <line x1="52" y1="68" x2="80" y2="68" stroke={c} strokeWidth="2"/>
    <line x1="52" y1="82" x2="70" y2="82" stroke={c} strokeWidth="2"/>
  </S>
);

const NotDefteri = ({ c, size }) => (
  <S size={size}>
    <rect x="32" y="18" width="60" height="84" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <line x1="32" y1="34" x2="92" y2="34" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="46" x2="80" y2="46" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="58" x2="80" y2="58" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="70" x2="80" y2="70" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="82" x2="66" y2="82" stroke={c} strokeWidth="1.5"/>
    <rect x="24" y="30" width="8" height="12" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="24" y="54" width="8" height="12" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="24" y="78" width="8" height="12" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

const Mezuniyet = ({ c, size }) => (
  <S size={size}>
    <polygon points="60,22 96,40 60,58 24,40" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M96 40 L96 62" stroke={c} strokeWidth="2.5"/>
    <path d="M90 66 A6 6 0 1 0 102 66" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M40 50 L40 74 Q60 84 80 74 L80 50" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
  </S>
);

const Ampul = ({ c, size }) => (
  <S size={size}>
    <path d="M60 18 A26 26 0 0 1 86 44 Q86 62 70 72 L70 84 L50 84 L50 72 Q34 62 34 44 A26 26 0 0 1 60 18 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="50" y1="90" x2="70" y2="90" stroke={c} strokeWidth="2.5"/>
    <line x1="52" y1="96" x2="68" y2="96" stroke={c} strokeWidth="2.5"/>
    <line x1="60" y1="30" x2="60" y2="50" stroke={c} strokeWidth="2"/>
    <path d="M52 50 L60 42 L68 50" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

const Beyin = ({ c, size }) => (
  <S size={size}>
    <path d="M60 88 L60 30 Q60 18 72 18 Q84 18 86 30 Q96 32 96 44 Q96 54 88 58 Q92 66 86 72 Q82 82 72 84 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M60 88 L60 30 Q60 18 48 18 Q36 18 34 30 Q24 32 24 44 Q24 54 32 58 Q28 66 34 72 Q38 82 48 84 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M60 50 Q72 46 80 52" stroke={c} strokeWidth="1.8" fill="none"/>
    <path d="M60 62 Q48 58 40 64" stroke={c} strokeWidth="1.8" fill="none"/>
  </S>
);

const Teleskop = ({ c, size }) => (
  <S size={size}>
    <path d="M20 36 L72 24 L80 52 L28 64 Z" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="54" y1="58" x2="60" y2="88" stroke={c} strokeWidth="2.5"/>
    <line x1="48" y1="88" x2="72" y2="88" stroke={c} strokeWidth="2.5"/>
    <circle cx="90" cy="26" r="6" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M86 22 L80 14 M90 20 L86 12" stroke={c} strokeWidth="1.5"/>
  </S>
);

const Pergel = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="26" r="6" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <path d="M60 32 L44 88" stroke={c} strokeWidth="2.5"/>
    <path d="M60 32 L76 88" stroke={c} strokeWidth="2.5"/>
    <path d="M46 78 Q60 70 74 78" stroke={c} strokeWidth="2" fill="none"/>
    <circle cx="44" cy="88" r="3" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <circle cx="76" cy="88" r="3" stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

const Mikroskop = ({ c, size }) => (
  <S size={size}>
    <rect x="50" y="18" width="20" height="36" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <rect x="54" y="54" width="12" height="14" rx="2" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <circle cx="60" cy="22" r="6" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M46 68 L60 68 L60 90" stroke={c} strokeWidth="2.5"/>
    <path d="M36 90 L84 90" stroke={c} strokeWidth="2.5"/>
    <path d="M36 78 Q44 72 46 68" stroke={c} strokeWidth="2" fill="none"/>
    <circle cx="60" cy="79" r="8" stroke={c} strokeWidth="1.5" fill={`${c}08`}/>
  </S>
);

const Cetvell = ({ c, size }) => (
  <S size={size}>
    <rect x="22" y="42" width="76" height="36" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}
      transform="rotate(-20 60 60)"/>
    <line x1="36" y1="48" x2="36" y2="62" stroke={c} strokeWidth="2" transform="rotate(-20 60 60)"/>
    <line x1="50" y1="48" x2="50" y2="56" stroke={c} strokeWidth="2" transform="rotate(-20 60 60)"/>
    <line x1="64" y1="48" x2="64" y2="62" stroke={c} strokeWidth="2" transform="rotate(-20 60 60)"/>
    <line x1="78" y1="48" x2="78" y2="56" stroke={c} strokeWidth="2" transform="rotate(-20 60 60)"/>
  </S>
);

const Formul = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="40" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <path d="M36 50 L44 50 L52 70 L60 40 L68 70 L76 50 L84 50" stroke={c} strokeWidth="2.5" fill="none"/>
  </S>
);

// ─── Teknoloji ───────────────────────────────────────────────────────────────

const Laptop = ({ c, size }) => (
  <S size={size}>
    <rect x="24" y="26" width="72" height="52" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="30" y="32" width="60" height="40" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}08`}/>
    <path d="M16 78 L104 78 L108 90 L12 90 Z" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <line x1="48" y1="84" x2="72" y2="84" stroke={c} strokeWidth="2"/>
  </S>
);

const Akillitelefon = ({ c, size }) => (
  <S size={size}>
    <rect x="36" y="14" width="48" height="92" rx="8" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="42" y="24" width="36" height="64" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}08`}/>
    <circle cx="60" cy="96" r="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <line x1="52" y1="18" x2="68" y2="18" stroke={c} strokeWidth="2"/>
  </S>
);

const KodSembol = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="44" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <path d="M46 44 L28 60 L46 76" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M74 44 L92 60 L74 76" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="66" y1="38" x2="54" y2="82" stroke={c} strokeWidth="2"/>
  </S>
);

const Bulut2 = ({ c, size }) => (
  <S size={size}>
    <path d="M82 72 A22 22 0 0 0 82 28 A22 22 0 0 0 46 38 A18 18 0 0 0 30 72 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M40 80 L40 94 M52 76 L52 94 M68 76 L68 94 M80 80 L80 94"
      stroke={c} strokeWidth="2.5"/>
  </S>
);

const Wifi = ({ c, size }) => (
  <S size={size}>
    <path d="M14 44 Q60 10 106 44" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M26 58 Q60 32 94 58" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M38 72 Q60 54 82 72" stroke={c} strokeWidth="2.5" fill="none"/>
    <circle cx="60" cy="86" r="7" stroke={c} strokeWidth="2.5" fill={`${c}25`}/>
  </S>
);

const RobotYuz = ({ c, size }) => (
  <S size={size}>
    <rect x="22" y="32" width="76" height="66" rx="8" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="38" y="48" width="16" height="14" rx="3" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="66" y="48" width="16" height="14" rx="3" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M40 78 Q60 88 80 78" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="60" y1="18" x2="60" y2="32" stroke={c} strokeWidth="2.5"/>
    <circle cx="60" cy="14" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

const Ekran = ({ c, size }) => (
  <S size={size}>
    <rect x="12" y="18" width="96" height="66" rx="6" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="18" y="24" width="84" height="54" rx="3" stroke={c} strokeWidth="1.5" fill={`${c}08`}/>
    <path d="M48 84 L44 100 M72 84 L76 100" stroke={c} strokeWidth="2.5"/>
    <line x1="36" y1="100" x2="84" y2="100" stroke={c} strokeWidth="2.5"/>
  </S>
);

const GamePad = ({ c, size }) => (
  <S size={size}>
    <path d="M22 50 Q16 80 30 90 Q40 98 50 86 L60 78 L70 86 Q80 98 90 90 Q104 80 98 50 Q94 32 80 32 L40 32 Q26 32 22 50 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <line x1="44" y1="52" x2="44" y2="66" stroke={c} strokeWidth="2.5"/>
    <line x1="37" y1="59" x2="51" y2="59" stroke={c} strokeWidth="2.5"/>
    <circle cx="76" cy="54" r="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="84" cy="62" r="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

const Kamera2 = ({ c, size }) => (
  <S size={size}>
    <path d="M18 38 L38 38 L46 26 L74 26 L82 38 L102 38 L102 88 L18 88 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <circle cx="60" cy="62" r="20" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="60" cy="62" r="12" stroke={c} strokeWidth="2" fill={`${c}12`}/>
    <circle cx="68" cy="54" r="4" stroke={c} strokeWidth="1.5" fill={`${c}25`}/>
  </S>
);

const Pil = ({ c, size }) => (
  <S size={size}>
    <rect x="26" y="32" width="68" height="56" rx="6" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="94" y="46" width="10" height="28" rx="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="32" y="38" width="36" height="44" rx="3" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <line x1="48" y1="54" x2="48" y2="66" stroke={c} strokeWidth="2.5"/>
    <line x1="42" y1="60" x2="54" y2="60" stroke={c} strokeWidth="2.5"/>
  </S>
);

// ─── Spor & Sağlık ───────────────────────────────────────────────────────────

const Futbol = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="42" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <polygon points="60,30 72,46 66,64 54,64 48,46" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M60 30 L52 20 M72 46 L84 42 M66 64 L74 74 M54 64 L46 74 M48 46 L36 42"
      stroke={c} strokeWidth="1.5"/>
  </S>
);

const Kacis = ({ c, size }) => (
  <S size={size}>
    <circle cx="74" cy="22" r="9" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M74 31 L68 54 L50 68" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M68 54 L80 72 L90 86" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M50 68 L38 60 M50 68 L44 84" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M44 38 L58 32 L74 38" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

const Dumbbell = ({ c, size }) => (
  <S size={size}>
    <line x1="28" y1="60" x2="92" y2="60" stroke={c} strokeWidth="3"/>
    <rect x="16" y="44" width="16" height="32" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <rect x="22" y="38" width="10" height="44" rx="3" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <rect x="88" y="44" width="16" height="32" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <rect x="88" y="38" width="10" height="44" rx="3" stroke={c} strokeWidth="2" fill={`${c}15`}/>
  </S>
);

const Bisiklet = ({ c, size }) => (
  <S size={size}>
    <circle cx="32" cy="76" r="20" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="88" cy="76" r="20" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <path d="M32 76 L60 44 L88 76" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M60 44 L60 30 L50 22" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="50" y1="30" x2="70" y2="30" stroke={c} strokeWidth="2.5"/>
    <path d="M60 44 L72 56" stroke={c} strokeWidth="2"/>
  </S>
);

const Basketbol = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="42" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <path d="M18 60 Q40 40 60 60 Q80 80 102 60" stroke={c} strokeWidth="2" fill="none"/>
    <line x1="60" y1="18" x2="60" y2="102" stroke={c} strokeWidth="2"/>
    <path d="M60 60 Q40 80 18 60" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M60 60 Q80 40 102 60" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

const Hedef = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="44" stroke={c} strokeWidth="2" fill="none"/>
    <circle cx="60" cy="60" r="30" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <circle cx="60" cy="60" r="16" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <circle cx="60" cy="60" r="5" stroke={c} strokeWidth="2" fill={`${c}30`}/>
    <line x1="60" y1="14" x2="60" y2="22" stroke={c} strokeWidth="2.5"/>
    <line x1="60" y1="98" x2="60" y2="106" stroke={c} strokeWidth="2.5"/>
    <line x1="14" y1="60" x2="22" y2="60" stroke={c} strokeWidth="2.5"/>
    <line x1="98" y1="60" x2="106" y2="60" stroke={c} strokeWidth="2.5"/>
  </S>
);

const Kalkan = ({ c, size }) => (
  <S size={size}>
    <path d="M60 14 L90 26 L90 60 Q90 84 60 100 Q30 84 30 60 L30 26 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M48 58 L56 66 L74 46" stroke={c} strokeWidth="2.5" fill="none"/>
  </S>
);

// ─── Müzik ───────────────────────────────────────────────────────────────────

const Nota = ({ c, size }) => (
  <S size={size}>
    <ellipse cx="44" cy="82" rx="14" ry="10" stroke={c} strokeWidth="2.5" fill={`${c}20`} transform="rotate(-15 44 82)"/>
    <ellipse cx="80" cy="74" rx="14" ry="10" stroke={c} strokeWidth="2.5" fill={`${c}20`} transform="rotate(-15 80 74)"/>
    <path d="M57 76 L57 28 L93 20 L93 68" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="57" y1="28" x2="93" y2="20" stroke={c} strokeWidth="2"/>
  </S>
);

const Gitar = ({ c, size }) => (
  <S size={size}>
    <path d="M46 80 Q28 80 28 64 Q28 48 46 48 Q54 48 58 54 L72 28 Q76 18 82 22 Q88 26 84 32 L70 58 Q76 64 76 72 Q76 88 60 90 Q46 92 46 80 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <circle cx="52" cy="68" r="8" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <line x1="72" y1="28" x2="84" y2="32" stroke={c} strokeWidth="2"/>
  </S>
);

const Kulaklik = ({ c, size }) => (
  <S size={size}>
    <path d="M24 60 Q24 22 60 22 Q96 22 96 60" stroke={c} strokeWidth="2.5" fill="none"/>
    <rect x="14" y="56" width="18" height="28" rx="8" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <rect x="88" y="56" width="18" height="28" rx="8" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
  </S>
);

const Mikrofon2 = ({ c, size }) => (
  <S size={size}>
    <rect x="44" y="14" width="32" height="52" rx="16" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M28 54 Q28 84 60 84 Q92 84 92 54" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="60" y1="84" x2="60" y2="102" stroke={c} strokeWidth="2.5"/>
    <line x1="42" y1="102" x2="78" y2="102" stroke={c} strokeWidth="2.5"/>
    <line x1="52" y1="36" x2="68" y2="36" stroke={c} strokeWidth="1.5"/>
    <line x1="52" y1="46" x2="68" y2="46" stroke={c} strokeWidth="1.5"/>
  </S>
);

const PiyanoTuslari = ({ c, size }) => (
  <S size={size}>
    <rect x="12" y="30" width="96" height="60" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <line x1="12" y1="30" x2="12" y2="90" stroke={c} strokeWidth="1.5"/>
    <line x1="28" y1="30" x2="28" y2="90" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="30" x2="44" y2="90" stroke={c} strokeWidth="1.5"/>
    <line x1="60" y1="30" x2="60" y2="90" stroke={c} strokeWidth="1.5"/>
    <line x1="76" y1="30" x2="76" y2="90" stroke={c} strokeWidth="1.5"/>
    <line x1="92" y1="30" x2="92" y2="90" stroke={c} strokeWidth="1.5"/>
    <rect x="22" y="30" width="10" height="36" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}40`}/>
    <rect x="38" y="30" width="10" height="36" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}40`}/>
    <rect x="68" y="30" width="10" height="36" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}40`}/>
    <rect x="84" y="30" width="10" height="36" rx="2" stroke={c} strokeWidth="1.5" fill={`${c}40`}/>
  </S>
);

const Davul = ({ c, size }) => (
  <S size={size}>
    <ellipse cx="60" cy="36" rx="44" ry="16" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M16 36 L16 80 Q16 96 60 96 Q104 96 104 80 L104 36" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <ellipse cx="60" cy="80" rx="44" ry="16" stroke={c} strokeWidth="2" fill={`${c}12`}/>
    <path d="M48 14 L40 34 M72 14 L80 34" stroke={c} strokeWidth="2.5"/>
    <circle cx="48" cy="12" r="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="72" cy="12" r="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

// ─── Seyahat ─────────────────────────────────────────────────────────────────

const Ucak = ({ c, size }) => (
  <S size={size}>
    <path d="M20 60 L80 28 Q96 22 96 36 Q96 50 80 50 L54 56 L72 86 L60 86 L44 60 L28 64 L30 74 L20 70 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
  </S>
);

const HaritaPin = ({ c, size }) => (
  <S size={size}>
    <path d="M60 16 Q82 16 82 40 Q82 60 60 100 Q38 60 38 40 Q38 16 60 16 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <circle cx="60" cy="40" r="12" stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

const SirtCanta = ({ c, size }) => (
  <S size={size}>
    <rect x="28" y="32" width="64" height="72" rx="10" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M42 32 Q42 18 60 18 Q78 18 78 32" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="28" y1="58" x2="92" y2="58" stroke={c} strokeWidth="2"/>
    <rect x="44" y="64" width="32" height="22" rx="4" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <line x1="60" y1="64" x2="60" y2="86" stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="75" x2="76" y2="75" stroke={c} strokeWidth="1.5"/>
  </S>
);

const Pusula = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="44" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="60" cy="60" r="6" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <polygon points="60,20 66,54 60,66 54,54" stroke={c} strokeWidth="2" fill={`${c}30`}/>
    <polygon points="60,100 66,66 60,54 54,66" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <text x="60" y="26" textAnchor="middle" fontSize="10" stroke={c} strokeWidth="1" fill={c}>N</text>
    <text x="60" y="100" textAnchor="middle" fontSize="10" stroke={c} strokeWidth="1" fill={c}>S</text>
    <text x="20" y="64" textAnchor="middle" fontSize="10" stroke={c} strokeWidth="1" fill={c}>W</text>
    <text x="100" y="64" textAnchor="middle" fontSize="10" stroke={c} strokeWidth="1" fill={c}>E</text>
  </S>
);

const Tren = ({ c, size }) => (
  <S size={size}>
    <rect x="22" y="20" width="76" height="70" rx="10" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="30" y="30" width="24" height="20" rx="3" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <rect x="66" y="30" width="24" height="20" rx="3" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <line x1="22" y1="60" x2="98" y2="60" stroke={c} strokeWidth="2"/>
    <circle cx="36" cy="84" r="10" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="84" cy="84" r="10" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <line x1="10" y1="100" x2="110" y2="100" stroke={c} strokeWidth="2.5"/>
    <line x1="36" y1="90" x2="36" y2="100" stroke={c} strokeWidth="2"/>
    <line x1="84" y1="90" x2="84" y2="100" stroke={c} strokeWidth="2"/>
  </S>
);

const Gemi = ({ c, size }) => (
  <S size={size}>
    <path d="M16 70 Q16 90 60 90 Q104 90 104 70 L96 48 L24 48 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <rect x="48" y="22" width="24" height="28" rx="2" stroke={c} strokeWidth="2" fill={`${c}10`}/>
    <line x1="60" y1="14" x2="60" y2="22" stroke={c} strokeWidth="2.5"/>
    <line x1="60" y1="14" x2="48" y2="22" stroke={c} strokeWidth="2"/>
    <line x1="10" y1="90" x2="110" y2="90" stroke={c} strokeWidth="2.5"/>
    <path d="M10 90 Q20 100 40 96 Q60 92 80 96 Q100 100 110 90" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

// ─── Doğa ────────────────────────────────────────────────────────────────────

const Gunes = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="24" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <line x1="60" y1="14" x2="60" y2="24" stroke={c} strokeWidth="2.5"/>
    <line x1="60" y1="96" x2="60" y2="106" stroke={c} strokeWidth="2.5"/>
    <line x1="14" y1="60" x2="24" y2="60" stroke={c} strokeWidth="2.5"/>
    <line x1="96" y1="60" x2="106" y2="60" stroke={c} strokeWidth="2.5"/>
    <line x1="28" y1="28" x2="35" y2="35" stroke={c} strokeWidth="2.5"/>
    <line x1="85" y1="85" x2="92" y2="92" stroke={c} strokeWidth="2.5"/>
    <line x1="92" y1="28" x2="85" y2="35" stroke={c} strokeWidth="2.5"/>
    <line x1="35" y1="85" x2="28" y2="92" stroke={c} strokeWidth="2.5"/>
  </S>
);

const BulutYagmur = ({ c, size }) => (
  <S size={size}>
    <path d="M78 62 A20 20 0 0 0 78 26 A20 20 0 0 0 46 34 A16 16 0 0 0 28 62 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="36" y1="72" x2="30" y2="90" stroke={c} strokeWidth="2.5"/>
    <line x1="50" y1="72" x2="44" y2="90" stroke={c} strokeWidth="2.5"/>
    <line x1="64" y1="72" x2="58" y2="90" stroke={c} strokeWidth="2.5"/>
    <line x1="78" y1="72" x2="72" y2="90" stroke={c} strokeWidth="2.5"/>
  </S>
);

const Agac = ({ c, size }) => (
  <S size={size}>
    <path d="M60 14 Q80 30 76 50 L88 46 Q82 66 70 64 L76 62 Q72 82 60 80 Q48 82 44 62 L50 64 Q38 66 32 46 L44 50 Q40 30 60 14 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <line x1="60" y1="80" x2="60" y2="104" stroke={c} strokeWidth="3"/>
    <line x1="44" y1="104" x2="76" y2="104" stroke={c} strokeWidth="2.5"/>
  </S>
);

const Dag = ({ c, size }) => (
  <S size={size}>
    <path d="M12 96 L46 28 L60 52 L74 38 L108 96 Z" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M40 50 L46 28 L52 40" stroke={c} strokeWidth="0" fill={`${c}25`}/>
    <path d="M38 52 L46 28 L54 42 Z" stroke="none" fill={`${c}20`}/>
    <path d="M70 44 L74 38 L78 46 Z" stroke="none" fill={`${c}20`}/>
  </S>
);

const Dalga = ({ c, size }) => (
  <S size={size}>
    <path d="M10 50 Q22 34 34 50 Q46 66 58 50 Q70 34 82 50 Q94 66 110 50"
      stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M10 66 Q22 50 34 66 Q46 82 58 66 Q70 50 82 66 Q94 82 110 66"
      stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M10 82 Q22 66 34 82 Q46 98 58 82 Q70 66 82 82 Q94 98 110 82"
      stroke={c} strokeWidth="2" fill="none" opacity="0.5"/>
    <path d="M10 66 Q34 40 58 66 Q82 40 110 66 L110 96 Q82 96 58 96 Q34 96 10 96 Z"
      stroke="none" fill={`${c}10`}/>
  </S>
);

const GokYuzu = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="44" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <polygon points="60,20 63,30 74,30 65,37 68,48 60,41 52,48 55,37 46,30 57,30"
      stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <circle cx="34" cy="50" r="4" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="86" cy="44" r="3" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="42" cy="76" r="5" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="80" cy="78" r="3" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
    <circle cx="66" cy="68" r="4" stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
  </S>
);

// ─── Hayvanlar ───────────────────────────────────────────────────────────────

const Kedi = ({ c, size }) => (
  <S size={size}>
    <path d="M30 90 Q30 50 60 44 Q90 50 90 90" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M30 60 Q20 44 22 28 L38 44" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M90 60 Q100 44 98 28 L82 44" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <circle cx="46" cy="64" r="6" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="74" cy="64" r="6" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M52 76 Q60 82 68 76" stroke={c} strokeWidth="2" fill="none"/>
    <line x1="60" y1="72" x2="60" y2="78" stroke={c} strokeWidth="2"/>
    <path d="M34 72 L20 68 M34 76 L18 76 M86 72 L100 68 M86 76 L102 76"
      stroke={c} strokeWidth="1.5"/>
  </S>
);

const Kartal = ({ c, size }) => (
  <S size={size}>
    <path d="M60 30 L60 80" stroke={c} strokeWidth="2.5"/>
    <path d="M60 44 Q30 34 14 50 Q22 56 30 52 Q30 68 44 68 L60 60"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M60 44 Q90 34 106 50 Q98 56 90 52 Q90 68 76 68 L60 60"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M54 80 Q58 90 60 90 Q62 90 66 80" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <circle cx="60" cy="26" r="10" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M56 24 Q60 30 64 24" stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

const Kelebek = ({ c, size }) => (
  <S size={size}>
    <path d="M60 60 Q50 30 24 22 Q18 40 30 54 Q42 62 60 60"
      stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M60 60 Q70 30 96 22 Q102 40 90 54 Q78 62 60 60"
      stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M60 60 Q46 74 38 90 Q52 90 62 76"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M60 60 Q74 74 82 90 Q68 90 58 76"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="60" y1="30" x2="60" y2="90" stroke={c} strokeWidth="2"/>
    <path d="M58 20 Q60 14 62 20" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M54 24 Q52 16 50 22" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M66 24 Q68 16 70 22" stroke={c} strokeWidth="1.5" fill="none"/>
  </S>
);

const Balik = ({ c, size }) => (
  <S size={size}>
    <path d="M80 60 Q60 36 20 44 Q14 54 14 60 Q14 66 20 76 Q60 84 80 60 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M80 60 L100 44 L106 60 L100 76 Z" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <circle cx="30" cy="54" r="5" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <path d="M46 48 Q48 60 46 72" stroke={c} strokeWidth="1.5" fill="none"/>
    <path d="M56 44 Q58 60 56 76" stroke={c} strokeWidth="1.5" fill="none"/>
  </S>
);

const Kurt = ({ c, size }) => (
  <S size={size}>
    <path d="M30 90 Q30 56 60 48 Q90 56 90 90" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M36 60 Q24 44 28 24 L44 46" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M84 60 Q96 44 92 24 L76 46" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <circle cx="46" cy="64" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="74" cy="64" r="5" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M46 78 Q52 74 60 74 Q68 74 74 78 Q68 86 60 88 Q52 86 46 78 Z"
      stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

// ─── Kariyer & İş ────────────────────────────────────────────────────────────

const GrafikYukarı = ({ c, size }) => (
  <S size={size}>
    <path d="M16 96 L16 24" stroke={c} strokeWidth="2.5"/>
    <path d="M16 96 L104 96" stroke={c} strokeWidth="2.5"/>
    <path d="M26 76 L46 54 L62 64 L88 30" stroke={c} strokeWidth="2.5" fill="none"/>
    <polygon points="88,30 80,32 86,40" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <rect x="26" y="76" width="12" height="20" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="46" y="54" width="12" height="42" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <rect x="66" y="40" width="12" height="56" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`}/>
  </S>
);

const ElSikisma = ({ c, size }) => (
  <S size={size}>
    <path d="M14 56 L38 44 L52 52 L66 44 L78 52 L84 48 L106 64 L84 68 L72 60 L58 68 L44 60 L30 72 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M78 52 L84 48 L96 60 L90 64" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M52 52 L58 48 L70 60 L64 64" stroke={c} strokeWidth="2" fill="none"/>
  </S>
);

const OfisGun = ({ c, size }) => (
  <S size={size}>
    <rect x="18" y="46" width="84" height="56" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="30" y="32" width="60" height="16" rx="2" stroke={c} strokeWidth="2" fill={`${c}12`}/>
    <rect x="44" y="20" width="32" height="14" rx="2" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <rect x="28" y="60" width="28" height="42" rx="2" stroke={c} strokeWidth="2" fill={`${c}15`}/>
    <rect x="64" y="60" width="28" height="28" rx="2" stroke={c} strokeWidth="2" fill={`${c}08`}/>
    <line x1="68" y1="68" x2="88" y2="68" stroke={c} strokeWidth="1.5"/>
    <line x1="68" y1="76" x2="88" y2="76" stroke={c} strokeWidth="1.5"/>
  </S>
);

const Evrak = ({ c, size }) => (
  <S size={size}>
    <rect x="28" y="18" width="64" height="84" rx="4" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <line x1="40" y1="38" x2="80" y2="38" stroke={c} strokeWidth="2"/>
    <line x1="40" y1="52" x2="80" y2="52" stroke={c} strokeWidth="2"/>
    <line x1="40" y1="66" x2="80" y2="66" stroke={c} strokeWidth="2"/>
    <line x1="40" y1="80" x2="64" y2="80" stroke={c} strokeWidth="2"/>
    <path d="M64 18 L64 32 L80 32 L80 18" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M64 32 L80 18" stroke={c} strokeWidth="2"/>
  </S>
);

const Canta = ({ c, size }) => (
  <S size={size}>
    <rect x="18" y="42" width="84" height="60" rx="6" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M38 42 L38 30 Q38 18 60 18 Q82 18 82 30 L82 42" stroke={c} strokeWidth="2.5" fill="none"/>
    <rect x="44" y="56" width="32" height="18" rx="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="60" cy="65" r="4" stroke={c} strokeWidth="2" fill={`${c}30`}/>
  </S>
);

// ─── Ödül Extras ─────────────────────────────────────────────────────────────

const Sampanya = ({ c, size }) => (
  <S size={size}>
    <path d="M44 90 L48 50 Q48 32 56 24 L64 24 Q72 32 72 50 L76 90 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="44" y1="90" x2="76" y2="90" stroke={c} strokeWidth="2.5"/>
    <path d="M56 60 L52 50 M64 62 L62 50" stroke={c} strokeWidth="2"/>
    <path d="M64 24 L70 16 M68 22 L76 18" stroke={c} strokeWidth="2.5"/>
    <circle cx="72" cy="14" r="3" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <circle cx="78" cy="20" r="2" stroke={c} strokeWidth="1.5" fill={`${c}25`}/>
    <circle cx="66" cy="12" r="2" stroke={c} strokeWidth="1.5" fill={`${c}25`}/>
  </S>
);

const Podyum = ({ c, size }) => (
  <S size={size}>
    <rect x="36" y="46" width="48" height="54" rx="2" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <rect x="14" y="62" width="30" height="38" rx="2" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <rect x="76" y="70" width="30" height="30" rx="2" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="60" cy="34" r="12" stroke={c} strokeWidth="2.5" fill={`${c}20`}/>
    <text x="60" y="39" textAnchor="middle" fontSize="13" stroke={c} strokeWidth="1" fill={c}>1</text>
    <text x="29" y="56" textAnchor="middle" fontSize="11" stroke={c} strokeWidth="1" fill={c}>2</text>
    <text x="91" y="64" textAnchor="middle" fontSize="11" stroke={c} strokeWidth="1" fill={c}>3</text>
  </S>
);

const Zafer = ({ c, size }) => (
  <S size={size}>
    <path d="M36 92 L28 64 L44 56 L60 72 L76 56 L92 64 L84 92" stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <path d="M44 56 Q44 28 60 22 Q76 28 76 56" stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M28 46 Q22 36 28 28 L44 40" stroke={c} strokeWidth="2" fill="none"/>
    <path d="M92 46 Q98 36 92 28 L76 40" stroke={c} strokeWidth="2" fill="none"/>
    <line x1="60" y1="88" x2="60" y2="100" stroke={c} strokeWidth="2.5"/>
    <line x1="48" y1="100" x2="72" y2="100" stroke={c} strokeWidth="2.5"/>
  </S>
);

const Konfeti2 = ({ c, size }) => (
  <S size={size}>
    <line x1="60" y1="20" x2="54" y2="40" stroke={c} strokeWidth="2.5"/>
    <line x1="80" y1="26" x2="76" y2="46" stroke={c} strokeWidth="2.5"/>
    <line x1="40" y1="26" x2="44" y2="46" stroke={c} strokeWidth="2.5"/>
    <line x1="96" y1="44" x2="78" y2="56" stroke={c} strokeWidth="2.5"/>
    <line x1="24" y1="44" x2="42" y2="56" stroke={c} strokeWidth="2.5"/>
    <circle cx="60" cy="16" r="5" stroke={c} strokeWidth="2" fill={`${c}25`}/>
    <rect x="76" y="20" width="8" height="8" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`} transform="rotate(20 80 24)"/>
    <rect x="36" y="20" width="8" height="8" rx="2" stroke={c} strokeWidth="2" fill={`${c}20`} transform="rotate(-20 40 24)"/>
    <path d="M30 70 Q60 50 90 70 Q60 90 30 70 Z" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <line x1="34" y1="80" x2="26" y2="96" stroke={c} strokeWidth="2"/>
    <line x1="60" y1="90" x2="60" y2="106" stroke={c} strokeWidth="2"/>
    <line x1="86" y1="80" x2="94" y2="96" stroke={c} strokeWidth="2"/>
  </S>
);

// ─── ZET Extras ──────────────────────────────────────────────────────────────

const ZpCoin = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="42" stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <circle cx="60" cy="60" r="34" stroke={c} strokeWidth="1.5" fill={`${c}08`}/>
    <path d="M44 42 L44 78 L52 78 L52 64 L68 78 L78 78 L78 42 L70 42 L70 56 L54 42 Z"
      stroke={c} strokeWidth="2" fill={`${c}25`}/>
  </S>
);

const RankYildiz = ({ c, size }) => (
  <S size={size}>
    <polygon points="60,14 70,44 102,44 78,64 86,96 60,76 34,96 42,64 18,44 50,44"
      stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <polygon points="60,26 67,46 88,46 72,58 78,80 60,68 42,80 48,58 32,46 53,46"
      stroke={c} strokeWidth="1.5" fill={`${c}20`}/>
  </S>
);

const Sezon = ({ c, size }) => (
  <S size={size}>
    <path d="M60 16 L70 44 L100 44 L76 62 L86 90 L60 72 L34 90 L44 62 L20 44 L50 44 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <circle cx="60" cy="56" r="16" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <line x1="60" y1="90" x2="60" y2="102" stroke={c} strokeWidth="2.5"/>
    <line x1="44" y1="102" x2="76" y2="102" stroke={c} strokeWidth="2.5"/>
    <line x1="52" y1="106" x2="68" y2="106" stroke={c} strokeWidth="2"/>
  </S>
);

const Gorev = ({ c, size }) => (
  <S size={size}>
    <rect x="28" y="14" width="64" height="92" rx="6" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <rect x="42" y="10" width="36" height="14" rx="4" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <path d="M42 44 L50 52 L66 36" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="74" y1="44" x2="84" y2="44" stroke={c} strokeWidth="2"/>
    <path d="M42 64 L50 72 L66 56" stroke={c} strokeWidth="2.5" fill="none"/>
    <line x1="74" y1="64" x2="84" y2="64" stroke={c} strokeWidth="2"/>
    <line x1="42" y1="84" x2="78" y2="84" stroke={c} strokeWidth="2" opacity="0.4"/>
  </S>
);

const ZetaYuz = ({ c, size }) => (
  <S size={size}>
    <circle cx="60" cy="60" r="44" stroke={c} strokeWidth="2.5" fill={`${c}08`}/>
    <circle cx="44" cy="50" r="8" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="76" cy="50" r="8" stroke={c} strokeWidth="2" fill={`${c}20`}/>
    <circle cx="47" cy="50" r="3" fill={c}/>
    <circle cx="79" cy="50" r="3" fill={c}/>
    <path d="M38 76 Q60 90 82 76" stroke={c} strokeWidth="2.5" fill="none"/>
    <path d="M44 22 L36 14 M76 22 L84 14" stroke={c} strokeWidth="2.5"/>
  </S>
);

const KalpCift = ({ c, size }) => (
  <S size={size}>
    <path d="M36 40 Q36 26 48 26 Q56 26 60 34 Q64 26 72 26 Q84 26 84 40 Q84 54 60 72 Q36 54 36 40 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}15`}/>
    <path d="M26 60 Q26 48 36 48 Q42 48 44 54 Q46 48 52 48 Q62 48 62 60 Q62 70 44 82 Q26 70 26 60 Z"
      stroke={c} strokeWidth="2" fill={`${c}10`}/>
  </S>
);

const YildizAy = ({ c, size }) => (
  <S size={size}>
    <path d="M74 22 A38 38 0 1 0 74 98 A28 28 0 1 1 74 22 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <polygon points="86,26 88,32 94,32 89,36 91,42 86,38 81,42 83,36 78,32 84,32"
      stroke={c} strokeWidth="1.5" fill={`${c}25`}/>
  </S>
);

const KitapAcik = ({ c, size }) => (
  <S size={size}>
    <path d="M60 84 L60 24 Q60 16 44 16 Q28 16 16 24 L16 84 Q28 76 44 76 Q52 76 60 84 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}12`}/>
    <path d="M60 84 L60 24 Q60 16 76 16 Q92 16 104 24 L104 84 Q92 76 76 76 Q68 76 60 84 Z"
      stroke={c} strokeWidth="2.5" fill={`${c}10`}/>
    <line x1="26" y1="36" x2="50" y2="36" stroke={c} strokeWidth="1.5"/>
    <line x1="26" y1="48" x2="50" y2="48" stroke={c} strokeWidth="1.5"/>
    <line x1="26" y1="60" x2="50" y2="60" stroke={c} strokeWidth="1.5"/>
    <line x1="70" y1="36" x2="94" y2="36" stroke={c} strokeWidth="1.5"/>
    <line x1="70" y1="48" x2="94" y2="48" stroke={c} strokeWidth="1.5"/>
    <line x1="70" y1="60" x2="94" y2="60" stroke={c} strokeWidth="1.5"/>
  </S>
);

export const EVENT_SVGS = {
  ramazan_ay:     { label: 'Ramazan Hilali',    category: 'ramazan', Component: RamazanAy },
  ramazan_fener:  { label: 'Ramazan Feneri',     category: 'ramazan', Component: RamazanFener },
  ramazan_cami:   { label: 'Cami',               category: 'ramazan', Component: RamazanCami },
  ramazan_sofra:  { label: 'İftar Sofrası',      category: 'ramazan', Component: RamazanSofra },
  ramazan_kandil: { label: 'Kandil',             category: 'ramazan', Component: RamazanKandil },
  kurban_koyun:   { label: 'Koyun',              category: 'kurban',  Component: KurbanKoyun },
  kurban_kaabe:   { label: 'Kabe',               category: 'kurban',  Component: KurbanKaabe },
  kurban_dua:     { label: 'Dua',                category: 'kurban',  Component: KurbanDua },
  bayram_balon:   { label: 'Balonlar',           category: 'bayram',  Component: BayramBalon },
  bayram_konfeti: { label: 'Konfeti',            category: 'bayram',  Component: BayramKonfeti },
  bayram_havai:   { label: 'Havai Fişek',        category: 'bayram',  Component: BayramHavaiFisek },
  turk_bayrak:    { label: 'Türk Bayrağı',       category: 'milli',   Component: TurkBayrak },
  cumhuriyet:     { label: 'Cumhuriyet',         category: 'milli',   Component: Cumhuriyet },
  kupa:           { label: 'Kupa',               category: 'odul',    Component: Kupa },
  tac:            { label: 'Taç',                category: 'odul',    Component: Tac },
  elmas:          { label: 'Elmas',              category: 'odul',    Component: Elmas },
  hediye:         { label: 'Hediye',             category: 'odul',    Component: Hediye },
  yildiz_patlama: { label: 'Yıldız Patlaması',   category: 'odul',    Component: YildizPatlama },
  roket:          { label: 'Roket',              category: 'odul',    Component: Roket },
  kalp:           { label: 'Kalp',               category: 'odul',    Component: Kalp },
  madalya:        { label: 'Madalya',            category: 'odul',    Component: Madalya },
  sandik:         { label: 'Sandık',             category: 'odul',    Component: Sandik },
  rozet:          { label: 'Rozet',              category: 'odul',    Component: Rozet },
  kar_tanesi:     { label: 'Kar Tanesi',         category: 'mevsim',  Component: KarTanesi },
  cicek:          { label: 'Çiçek',              category: 'mevsim',  Component: Cicek },
  yaprak:         { label: 'Sonbahar Yaprağı',   category: 'mevsim',  Component: Yaprak },
  gun_batimi:     { label: 'Gün Batımı',         category: 'mevsim',  Component: GunBatimi },
  yeni_yil:       { label: 'Yeni Yıl',           category: 'bayram',  Component: YeniYil },
  zet_z:          { label: 'ZET Z',              category: 'zet',     Component: ZetZ },
  zeta_orb:       { label: 'Zeta Orb',           category: 'zet',     Component: ZetaOrb },
  // Eğitim & Bilim
  kitap:          { label: 'Kitap',              category: 'egitim',  Component: Kitap },
  not_defteri:    { label: 'Not Defteri',        category: 'egitim',  Component: NotDefteri },
  mezuniyet:      { label: 'Mezuniyet',          category: 'egitim',  Component: Mezuniyet },
  ampul:          { label: 'Fikir',              category: 'egitim',  Component: Ampul },
  beyin:          { label: 'Beyin',              category: 'egitim',  Component: Beyin },
  teleskop:       { label: 'Teleskop',           category: 'egitim',  Component: Teleskop },
  pergel:         { label: 'Pergel',             category: 'egitim',  Component: Pergel },
  mikroskop:      { label: 'Mikroskop',          category: 'egitim',  Component: Mikroskop },
  cetvel:         { label: 'Cetvel',             category: 'egitim',  Component: Cetvell },
  formul:         { label: 'Formül',             category: 'egitim',  Component: Formul },
  kitap_acik:     { label: 'Açık Kitap',         category: 'egitim',  Component: KitapAcik },
  // Teknoloji
  laptop:         { label: 'Laptop',             category: 'teknoloji', Component: Laptop },
  akilli_tel:     { label: 'Akıllı Telefon',     category: 'teknoloji', Component: Akillitelefon },
  kod:            { label: 'Kod',                category: 'teknoloji', Component: KodSembol },
  bulut_depo:     { label: 'Bulut Depo',         category: 'teknoloji', Component: Bulut2 },
  wifi:           { label: 'WiFi',               category: 'teknoloji', Component: Wifi },
  robot:          { label: 'Robot',              category: 'teknoloji', Component: RobotYuz },
  ekran:          { label: 'Ekran',              category: 'teknoloji', Component: Ekran },
  gamepad:        { label: 'Oyun Kumandası',     category: 'teknoloji', Component: GamePad },
  kamera:         { label: 'Kamera',             category: 'teknoloji', Component: Kamera2 },
  pil:            { label: 'Pil',                category: 'teknoloji', Component: Pil },
  // Spor & Sağlık
  futbol:         { label: 'Futbol',             category: 'spor',    Component: Futbol },
  kacis:          { label: 'Koşucu',             category: 'spor',    Component: Kacis },
  dumbbell:       { label: 'Dumbbell',           category: 'spor',    Component: Dumbbell },
  bisiklet:       { label: 'Bisiklet',           category: 'spor',    Component: Bisiklet },
  basketbol:      { label: 'Basketbol',          category: 'spor',    Component: Basketbol },
  hedef:          { label: 'Hedef',              category: 'spor',    Component: Hedef },
  kalkan:         { label: 'Kalkan',             category: 'spor',    Component: Kalkan },
  // Müzik
  nota:           { label: 'Müzik Notası',       category: 'muzik',   Component: Nota },
  gitar:          { label: 'Gitar',              category: 'muzik',   Component: Gitar },
  kulaklik:       { label: 'Kulaklık',           category: 'muzik',   Component: Kulaklik },
  mikrofon:       { label: 'Mikrofon',           category: 'muzik',   Component: Mikrofon2 },
  piyano:         { label: 'Piyano',             category: 'muzik',   Component: PiyanoTuslari },
  davul:          { label: 'Davul',              category: 'muzik',   Component: Davul },
  // Seyahat
  ucak:           { label: 'Uçak',               category: 'seyahat', Component: Ucak },
  harita_pin:     { label: 'Konum',              category: 'seyahat', Component: HaritaPin },
  sirt_canta:     { label: 'Sırt Çantası',       category: 'seyahat', Component: SirtCanta },
  pusula:         { label: 'Pusula',             category: 'seyahat', Component: Pusula },
  tren:           { label: 'Tren',               category: 'seyahat', Component: Tren },
  gemi:           { label: 'Gemi',               category: 'seyahat', Component: Gemi },
  // Doğa
  gunes:          { label: 'Güneş',              category: 'doga',    Component: Gunes },
  bulut_yagmur:   { label: 'Yağmur',             category: 'doga',    Component: BulutYagmur },
  agac:           { label: 'Ağaç',               category: 'doga',    Component: Agac },
  dag:            { label: 'Dağ',                category: 'doga',    Component: Dag },
  dalga:          { label: 'Dalga',              category: 'doga',    Component: Dalga },
  gok_yuzu:       { label: 'Gece Gökyüzü',       category: 'doga',    Component: GokYuzu },
  yildiz_ay:      { label: 'Ay Yıldız',          category: 'doga',    Component: YildizAy },
  // Hayvanlar
  kedi:           { label: 'Kedi',               category: 'hayvan',  Component: Kedi },
  kartal:         { label: 'Kartal',             category: 'hayvan',  Component: Kartal },
  kelebek:        { label: 'Kelebek',            category: 'hayvan',  Component: Kelebek },
  balik:          { label: 'Balık',              category: 'hayvan',  Component: Balik },
  kurt:           { label: 'Kurt',               category: 'hayvan',  Component: Kurt },
  // Kariyer & İş
  grafik_yukari:  { label: 'Büyüme',             category: 'kariyer', Component: GrafikYukarı },
  el_sikisma:     { label: 'El Sıkışma',         category: 'kariyer', Component: ElSikisma },
  ofis:           { label: 'Ofis Binası',        category: 'kariyer', Component: OfisGun },
  evrak:          { label: 'Evrak',              category: 'kariyer', Component: Evrak },
  canta:          { label: 'Çanta',              category: 'kariyer', Component: Canta },
  // Ödül Extras
  sampanya:       { label: 'Şampanya',           category: 'odul',    Component: Sampanya },
  podyum:         { label: 'Podyum',             category: 'odul',    Component: Podyum },
  zafer:          { label: 'Zafer',              category: 'odul',    Component: Zafer },
  konfeti2:       { label: 'Konfeti Patlaması',  category: 'odul',    Component: Konfeti2 },
  kalp_cift:      { label: 'Çift Kalp',          category: 'odul',    Component: KalpCift },
  // ZET Extras
  zp_coin:        { label: 'ZP Coin',            category: 'zet',     Component: ZpCoin },
  rank_yildiz:    { label: 'Rank Yıldızı',       category: 'zet',     Component: RankYildiz },
  sezon:          { label: 'Sezon Kupası',       category: 'zet',     Component: Sezon },
  gorev:          { label: 'Görev',              category: 'zet',     Component: Gorev },
  zeta_yuz:       { label: 'Zeta',               category: 'zet',     Component: ZetaYuz },
};

export const SVG_CATEGORIES = {
  ramazan:   'Ramazan',
  kurban:    'Kurban Bayramı',
  bayram:    'Bayram & Kutlama',
  milli:     'Milli Bayramlar',
  odul:      'Ödül & Başarı',
  mevsim:    'Mevsimler',
  egitim:    'Eğitim & Bilim',
  teknoloji: 'Teknoloji',
  spor:      'Spor & Sağlık',
  muzik:     'Müzik',
  seyahat:   'Seyahat',
  doga:      'Doğa',
  hayvan:    'Hayvanlar',
  kariyer:   'Kariyer & İş',
  zet:       'ZET',
};

export function EventSVGIcon({ svgKey, color = '#4ca8ad', size = 120 }) {
  const def = EVENT_SVGS[svgKey];
  if (!def) return null;
  const { Component } = def;
  return <Component c={color} size={size} />;
}
