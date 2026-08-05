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
};

export const SVG_CATEGORIES = {
  ramazan: 'Ramazan',
  kurban:  'Kurban Bayramı',
  bayram:  'Bayram & Kutlama',
  milli:   'Milli Bayramlar',
  odul:    'Ödül & Başarı',
  mevsim:  'Mevsimler',
  zet:     'ZET',
};

export function EventSVGIcon({ svgKey, color = '#4ca8ad', size = 120 }) {
  const def = EVENT_SVGS[svgKey];
  if (!def) return null;
  const { Component } = def;
  return <Component c={color} size={size} />;
}
