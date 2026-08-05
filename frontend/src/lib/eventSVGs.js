import React from 'react';

const Svg = ({ size = 120, children }) => (
  <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
    {children}
  </svg>
);

// ─── Ramazan ────────────────────────────────────────────────────────────────

const RamazanAy = ({ c, size }) => (
  <Svg size={size}>
    <path fillRule="evenodd" fill={c}
      d="M52 16 A40 40 0 1 0 52 96 A40 40 0 1 0 52 16 Z M66 24 A31 31 0 1 0 66 88 A31 31 0 1 0 66 24 Z" />
    <polygon fill={c}
      points="91,20 93.5,28.5 102.5,28.5 95.4,33.9 97.9,42.4 91,37 84.1,42.4 86.6,33.9 79.5,28.5 88.5,28.5" />
  </Svg>
);

const RamazanFener = ({ c, size }) => (
  <Svg size={size}>
    <line x1="60" y1="8" x2="60" y2="20" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
    <ellipse cx="60" cy="23" rx="10" ry="5" fill={c} opacity=".7"/>
    <path d="M50 23 Q44 60 44 80 Q44 92 60 95 Q76 92 76 80 Q76 60 70 23 Z" fill={`${c}30`} stroke={c} strokeWidth="1.5"/>
    <line x1="44" y1="48" x2="76" y2="48" stroke={c} strokeWidth="1" opacity=".5"/>
    <line x1="44" y1="64" x2="76" y2="64" stroke={c} strokeWidth="1" opacity=".5"/>
    <line x1="52" y1="28" x2="52" y2="92" stroke={c} strokeWidth="1" opacity=".3"/>
    <line x1="60" y1="24" x2="60" y2="94" stroke={c} strokeWidth="1" opacity=".3"/>
    <line x1="68" y1="28" x2="68" y2="92" stroke={c} strokeWidth="1" opacity=".3"/>
    <ellipse cx="60" cy="90" rx="10" ry="5" fill={c} opacity=".6"/>
    <ellipse cx="60" cy="50" rx="5" ry="8" fill={c} opacity=".9"/>
    <ellipse cx="60" cy="50" rx="2.5" ry="5" fill="#fff" opacity=".7"/>
  </Svg>
);

const RamazanCami = ({ c, size }) => (
  <Svg size={size}>
    <rect x="25" y="70" width="70" height="42" rx="2" fill={c} opacity=".9"/>
    <path d="M35 70 Q35 52 60 45 Q85 52 85 70" fill={c}/>
    <rect x="23" y="30" width="8" height="42" rx="3" fill={c}/>
    <rect x="89" y="30" width="8" height="42" rx="3" fill={c}/>
    <path d="M23 32 Q27 24 27 32" fill={c} opacity=".7"/>
    <path d="M89 32 Q93 24 93 32" fill={c} opacity=".7"/>
    <rect x="54" y="78" width="12" height="34" rx="2" fill={`${c}40`}/>
    <rect x="26" y="80" width="14" height="16" rx="2" fill={`${c}40`}/>
    <rect x="80" y="80" width="14" height="16" rx="2" fill={`${c}40`}/>
  </Svg>
);

const RamazanSofra = ({ c, size }) => (
  <Svg size={size}>
    <ellipse cx="60" cy="85" rx="46" ry="10" fill={c} opacity=".3"/>
    <rect x="14" y="75" width="92" height="14" rx="4" fill={c} opacity=".5"/>
    <ellipse cx="38" cy="68" rx="16" ry="6" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
    <ellipse cx="38" cy="66" rx="10" ry="4" fill={c} opacity=".7"/>
    <ellipse cx="78" cy="68" rx="18" ry="7" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
    <ellipse cx="78" cy="65" rx="10" ry="4" fill={c} opacity=".7"/>
    <rect x="58" y="40" width="4" height="30" rx="2" fill={c} opacity=".6"/>
    <path d="M60 40 Q60 20 60 18" stroke={c} strokeWidth="1.5" strokeLinecap="round"/>
    <ellipse cx="60" cy="32" rx="3" ry="8" fill="#fbbf24" opacity=".9"/>
    <ellipse cx="60" cy="25" rx="1.5" ry="3" fill="#fff" opacity=".6"/>
  </Svg>
);

const RamazanKandil = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 10 L68 22 H52 Z" fill={c}/>
    <rect x="52" y="22" width="16" height="6" rx="1" fill={c} opacity=".7"/>
    <path d="M46 28 H74 L70 80 H50 Z" fill={`${c}30`} stroke={c} strokeWidth="1.5"/>
    <path d="M50 80 H70 L66 94 H54 Z" fill={c} opacity=".7"/>
    <line x1="46" y1="44" x2="74" y2="44" stroke={c} strokeWidth="1" opacity=".5"/>
    <line x1="47" y1="58" x2="73" y2="58" stroke={c} strokeWidth="1" opacity=".5"/>
    <line x1="49" y1="72" x2="71" y2="72" stroke={c} strokeWidth="1" opacity=".5"/>
    <ellipse cx="60" cy="55" rx="4" ry="6" fill="#fbbf24" opacity=".9"/>
    <ellipse cx="60" cy="52" rx="2" ry="3" fill="#fff" opacity=".7"/>
    <line x1="54" y1="28" x2="50" y2="80" stroke={c} strokeWidth="1" opacity=".4"/>
    <line x1="60" y1="28" x2="60" y2="80" stroke={c} strokeWidth="1" opacity=".4"/>
    <line x1="66" y1="28" x2="70" y2="80" stroke={c} strokeWidth="1" opacity=".4"/>
  </Svg>
);

// ─── Kurban Bayramı ──────────────────────────────────────────────────────────

const KurbanKoyun = ({ c, size }) => (
  <Svg size={size}>
    <ellipse cx="55" cy="62" rx="30" ry="24" fill={c} opacity=".85"/>
    {[
      [36,48],[44,42],[54,40],[64,42],[72,48],[75,56],[72,64],
      [64,70],[54,73],[44,70],[36,64],[33,55]
    ].map(([x,y],i) => <circle key={i} cx={x} cy={y} r="7" fill={c} opacity=".7"/>)}
    <ellipse cx="82" cy="56" rx="14" ry="11" fill={c} opacity=".9"/>
    <circle cx="87" cy="51" r="4" fill={`${c}40`}/>
    <ellipse cx="88" cy="52" rx="2" ry="2.5" fill="rgba(0,0,0,0.5)"/>
    <circle cx="89" cy="51.5" r="0.6" fill="#fff"/>
    <path d="M86 62 Q90 65 94 61" stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    <rect x="38" y="82" width="6" height="18" rx="3" fill={c} opacity=".7"/>
    <rect x="50" y="84" width="6" height="16" rx="3" fill={c} opacity=".7"/>
    <rect x="62" y="84" width="6" height="16" rx="3" fill={c} opacity=".7"/>
    <rect x="74" y="82" width="6" height="18" rx="3" fill={c} opacity=".7"/>
    <path d="M80 52 Q86 44 90 44" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
    <path d="M80 52 Q82 42 85 42" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none"/>
  </Svg>
);

const KurbanKaabe = ({ c, size }) => (
  <Svg size={size}>
    <rect x="22" y="35" width="56" height="60" fill={c} opacity=".85"/>
    <rect x="22" y="35" width="56" height="12" fill={c} opacity=".5"/>
    <rect x="22" y="83" width="56" height="12" fill={c} opacity=".5"/>
    <rect x="42" y="68" width="16" height="27" rx="2" fill={`${c}30`}/>
    <path d="M22 35 L8 55 L8 95 L22 95" fill={c} opacity=".6"/>
    <path d="M8 55 L22 47" stroke={c} strokeWidth="1" opacity=".4"/>
    <rect x="8" y="55" width="14" height="8" fill={c} opacity=".3"/>
    <rect x="8" y="63" width="14" height="8" fill={c} opacity=".2"/>
    <rect x="8" y="71" width="14" height="8" fill={c} opacity=".2"/>
    <line x1="8" y1="95" x2="98" y2="95" stroke={c} strokeWidth="3" strokeLinecap="round" opacity=".5"/>
    <polygon fill="#fbbf24" opacity=".9"
      points="60,12 62,18.5 69,18.5 63.5,22.5 65.5,29 60,25 54.5,29 56.5,22.5 51,18.5 58,18.5"/>
  </Svg>
);

const KurbanDua = ({ c, size }) => (
  <Svg size={size}>
    <path d="M38 85 C36 75 34 60 36 50 C38 40 44 36 48 38 C52 40 52 46 52 50 L52 68" stroke={c} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M82 85 C84 75 86 60 84 50 C82 40 76 36 72 38 C68 40 68 46 68 50 L68 68" stroke={c} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M52 68 L52 55 C52 50 58 48 60 50 C62 48 68 50 68 55 L68 68" stroke={c} strokeWidth="6" strokeLinecap="round" fill="none"/>
    <path d="M44 85 L76 85" stroke={c} strokeWidth="7" strokeLinecap="round"/>
    {[...Array(7)].map((_, i) => (
      <line key={i} x1={45+i*5} y1="24" x2={45+i*5} y2={16+i%2*6} stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" opacity=".8"/>
    ))}
    <ellipse cx="60" cy="14" rx="14" ry="4" fill="#fbbf24" opacity=".15"/>
  </Svg>
);

// ─── Bayram Genel ────────────────────────────────────────────────────────────

const BayramBalon = ({ c, size }) => (
  <Svg size={size}>
    <ellipse cx="60" cy="42" rx="18" ry="22" fill={c}/>
    <path d="M60 64 L58 72" stroke={c} strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="34" cy="52" rx="14" ry="18" fill="#f59e0b"/>
    <path d="M34 70 L33 78" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round"/>
    <ellipse cx="86" cy="50" rx="14" ry="18" fill="#a78bfa"/>
    <path d="M86 68 L87 76" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"/>
    <path d="M33 78 Q46 84 58 72 Q70 84 87 76" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
    <ellipse cx="64" cy="36" rx="5" ry="7" fill="#fff" opacity=".25"/>
    <ellipse cx="37" cy="46" rx="4" ry="6" fill="#fff" opacity=".2"/>
    <ellipse cx="89" cy="44" rx="4" ry="5" fill="#fff" opacity=".2"/>
    <path d="M42 88 Q60 94 78 88" stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" fill="none" opacity=".5"/>
  </Svg>
);

const BayramKonfeti = ({ c, size }) => (
  <Svg size={size}>
    {[
      [20,20,15,'#f59e0b'],[35,12,25,'#ef4444'],[55,18,10,'#a78bfa'],
      [72,10,20,'#4ca8ad'],[85,22,5,'#fbbf24'],[15,45,12,'#ec4899'],
      [90,38,18,'#60a5fa'],[25,65,22,'#f59e0b'],[80,55,8,'#ef4444'],
      [45,80,15,c],[70,75,25,'#a78bfa'],[10,78,18,'#4ca8ad'],
      [95,68,12,'#fbbf24'],[50,35,8,'#ec4899'],[65,50,20,'#60a5fa'],
    ].map(([x,y,rot,col],i) => (
      <g key={i} transform={`translate(${x},${y}) rotate(${rot})`}>
        {i%3===0 ? <rect width="7" height="4" rx="1" fill={col} opacity=".85"/>
         : i%3===1 ? <circle r="3.5" fill={col} opacity=".85"/>
         : <path d="M0 -4 L2 0 L0 4 L-2 0 Z" fill={col} opacity=".85"/>}
      </g>
    ))}
    <text x="60" y="64" textAnchor="middle" fontSize="38" fill={c} opacity=".3" fontWeight="900">!</text>
  </Svg>
);

const BayramHavaiFisek = ({ c, size }) => (
  <Svg size={size}>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
      const rad = deg * Math.PI / 180;
      const len = i%2===0 ? 32 : 24;
      return <line key={i}
        x1={60} y1={45}
        x2={60+Math.sin(rad)*len} y2={45-Math.cos(rad)*len}
        stroke={i%3===0?c:i%3===1?'#fbbf24':'#a78bfa'} strokeWidth={i%2===0?2.5:1.5} strokeLinecap="round" opacity=".9"/>;
    })}
    <circle cx="60" cy="45" r="6" fill={c}/>
    <circle cx="60" cy="45" r="3" fill="#fff" opacity=".7"/>
    {[0,45,90,135,180,225,270,315].map((deg,i) => {
      const rad = deg * Math.PI / 180;
      const dist = 44, r2 = 50;
      return <line key={i}
        x1={60+Math.sin(rad)*dist} y1={45-Math.cos(rad)*dist}
        x2={60+Math.sin(rad)*r2} y2={45-Math.cos(rad)*r2}
        stroke={i%2===0?'#fbbf24':c} strokeWidth="1.5" strokeLinecap="round"/>;
    })}
    <ellipse cx="30" cy="78" rx="12" ry="14" fill="#ef4444" opacity=".2"/>
    {[0,40,80,120,160,200,240,280].map((deg,i) => {
      const rad=deg*Math.PI/180;
      return <line key={i} x1={30} y1={78} x2={30+Math.sin(rad)*14} y2={78-Math.cos(rad)*14}
        stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>;
    })}
    <circle cx="30" cy="78" r="3.5" fill="#ef4444"/>
    <ellipse cx="90" cy="85" rx="10" ry="12" fill="#a78bfa" opacity=".2"/>
    {[0,60,120,180,240,300].map((deg,i) => {
      const rad=deg*Math.PI/180;
      return <line key={i} x1={90} y1={85} x2={90+Math.sin(rad)*12} y2={85-Math.cos(rad)*12}
        stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" opacity=".7"/>;
    })}
    <circle cx="90" cy="85" r="3" fill="#a78bfa"/>
  </Svg>
);

// ─── Türk Milli Bayramlar ────────────────────────────────────────────────────

const TurkBayrak = ({ c, size }) => (
  <Svg size={size}>
    <rect x="8" y="28" width="104" height="64" rx="4" fill="#e11d48"/>
    <path fillRule="evenodd" fill="#fff"
      d="M48 44 A18 18 0 1 0 48 76 A18 18 0 1 0 48 44 Z M56 50 A12 12 0 1 0 56 70 A12 12 0 1 0 56 50 Z"/>
    <polygon fill="#fff"
      points="75,60 77,66.5 84,66.5 78.5,70.5 80.5,77 75,73 69.5,77 71.5,70.5 66,66.5 73,66.5"/>
  </Svg>
);

const Cumhuriyet = ({ c, size }) => (
  <Svg size={size}>
    <text x="60" y="68" textAnchor="middle" fill={c} fontSize="52" fontWeight="900" fontFamily="serif" opacity=".9">100</text>
    <path d="M15 85 Q60 95 105 85" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <path d="M15 35 Q60 25 105 35" stroke={c} strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    <polygon fill={c} opacity=".7" points="60,8 62.5,16 70,16 64,20.5 66.5,28 60,23.5 53.5,28 56,20.5 50,16 57.5,16"/>
  </Svg>
);

// ─── Genel Ödül / Oyun ───────────────────────────────────────────────────────

const Kupa = ({ c, size }) => (
  <Svg size={size}>
    <rect x="40" y="90" width="40" height="8" rx="3" fill={c} opacity=".8"/>
    <rect x="48" y="75" width="24" height="18" rx="2" fill={c} opacity=".7"/>
    <path d="M28 22 H92 V62 Q92 82 60 82 Q28 82 28 62 Z" fill={c} opacity=".9"/>
    <path d="M28 30 Q16 30 16 50 Q16 66 28 66" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M92 30 Q104 30 104 50 Q104 66 92 66" stroke={c} strokeWidth="7" fill="none" strokeLinecap="round"/>
    <polygon fill="#fbbf24" opacity=".9"
      points="60,34 63,44 73,44 65,50 68,60 60,54 52,60 55,50 47,44 57,44"/>
    <ellipse cx="46" cy="30" rx="5" ry="7" fill="#fff" opacity=".2"/>
  </Svg>
);

const Tac = ({ c, size }) => (
  <Svg size={size}>
    <path d="M14 85 L14 45 L36 68 L60 22 L84 68 L106 45 L106 85 Z" fill={c} opacity=".9"/>
    <circle cx="60" cy="22" r="7" fill="#fbbf24"/>
    <circle cx="14" cy="45" r="5.5" fill="#ef4444"/>
    <circle cx="106" cy="45" r="5.5" fill="#ef4444"/>
    <circle cx="38" cy="70" r="4" fill="#a78bfa" opacity=".7"/>
    <circle cx="82" cy="70" r="4" fill="#a78bfa" opacity=".7"/>
    <rect x="14" y="82" width="92" height="10" rx="3" fill={c} opacity=".8"/>
    <ellipse cx="40" cy="56" rx="7" ry="10" fill="#fff" opacity=".12"/>
  </Svg>
);

const Elmas = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 14 L92 42 L60 106 L28 42 Z" fill={c} opacity=".9"/>
    <path d="M28 42 L92 42" stroke="#fff" strokeWidth="1" opacity=".3"/>
    <path d="M60 14 L28 42 L60 106" fill={c} opacity=".15"/>
    <path d="M60 14 L40 42 L60 106" fill="#fff" opacity=".1"/>
    <path d="M60 14 L80 42" stroke="#fff" strokeWidth="1" opacity=".4"/>
    <path d="M60 14 L40 42" stroke="#fff" strokeWidth="1" opacity=".2"/>
    <path d="M28 42 L60 14 L92 42" fill="#fff" opacity=".2"/>
    <ellipse cx="48" cy="36" rx="6" ry="4" fill="#fff" opacity=".35" transform="rotate(-20,48,36)"/>
  </Svg>
);

const Hediye = ({ c, size }) => (
  <Svg size={size}>
    <rect x="18" y="50" width="84" height="58" rx="5" fill={c} opacity=".85"/>
    <rect x="14" y="36" width="92" height="18" rx="4" fill={c}/>
    <rect x="50" y="36" width="20" height="72" rx="3" fill="#fff" opacity=".25"/>
    <rect x="14" y="36" width="92" height="4" rx="2" fill="#fff" opacity=".2"/>
    <path d="M60 36 Q48 26 44 20 Q40 14 46 12 Q52 10 60 22 Q68 10 74 12 Q80 14 76 20 Q72 26 60 36 Z" fill="#ef4444"/>
    <circle cx="60" cy="36" r="4" fill="#fff" opacity=".5"/>
    <ellipse cx="36" cy="60" rx="8" ry="12" fill="#fff" opacity=".1"/>
  </Svg>
);

const YildizPatlama = ({ c, size }) => (
  <Svg size={size}>
    {[0,20,40,60,80,100,120,140,160,180,200,220,240,260,280,300,320,340].map((deg,i) => {
      const rad=deg*Math.PI/180;
      const len=i%2===0?40:28;
      return <line key={i} x1={60} y1={60} x2={60+Math.sin(rad)*len} y2={60-Math.cos(rad)*len}
        stroke={i%3===0?c:i%3===1?'#fbbf24':'#f59e0b'} strokeWidth={i%2===0?3:1.5} strokeLinecap="round"/>;
    })}
    <polygon fill={c}
      points="60,32 64,48 80,48 68,58 72,74 60,64 48,74 52,58 40,48 56,48"/>
    <circle cx="60" cy="60" r="6" fill="#fbbf24"/>
  </Svg>
);

const Roket = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 8 Q76 20 80 48 L80 80 Q80 88 60 100 Q40 88 40 80 L40 48 Q44 20 60 8 Z" fill={c} opacity=".9"/>
    <path d="M40 72 Q28 78 24 92 L40 88 Z" fill="#f59e0b"/>
    <path d="M80 72 Q92 78 96 92 L80 88 Z" fill="#f59e0b"/>
    <ellipse cx="60" cy="38" rx="10" ry="14" fill={`${c}40`}/>
    <circle cx="60" cy="38" r="8" fill="#fff" opacity=".2"/>
    <ellipse cx="52" cy="60" rx="4" ry="6" fill="#fff" opacity=".15"/>
    <ellipse cx="60" cy="98" rx="6" ry="3" fill="#f59e0b" opacity=".6"/>
    <ellipse cx="60" cy="103" rx="4" ry="5" fill="#ef4444" opacity=".5"/>
    <ellipse cx="60" cy="108" rx="2" ry="3" fill="#fbbf24" opacity=".4"/>
  </Svg>
);

const Kalp = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 100 Q20 72 16 46 Q12 22 34 16 Q50 12 60 30 Q70 12 86 16 Q108 22 104 46 Q100 72 60 100 Z" fill={c} opacity=".9"/>
    <ellipse cx="44" cy="38" rx="9" ry="13" fill="#fff" opacity=".25" transform="rotate(-30,44,38)"/>
    <path d="M60 100 Q20 72 16 46" stroke="#fff" strokeWidth="1" opacity=".15" fill="none"/>
  </Svg>
);

const Madalya = ({ c, size }) => (
  <Svg size={size}>
    <rect x="48" y="10" width="24" height="30" rx="3" fill={c} opacity=".6"/>
    <rect x="48" y="10" width="12" height="30" rx="3" fill={c} opacity=".3"/>
    <circle cx="60" cy="72" r="34" fill={c} opacity=".9"/>
    <circle cx="60" cy="72" r="28" fill={`${c}50`} stroke={c} strokeWidth="1.5"/>
    <polygon fill="#fbbf24"
      points="60,52 63.5,63 75,63 66,70 69.5,81 60,74 50.5,81 54,70 45,63 56.5,63"/>
    <ellipse cx="50" cy="64" rx="6" ry="9" fill="#fff" opacity=".15" transform="rotate(-20,50,64)"/>
  </Svg>
);

const Sandik = ({ c, size }) => (
  <Svg size={size}>
    <rect x="14" y="58" width="92" height="50" rx="5" fill={c} opacity=".85"/>
    <path d="M14 58 Q14 40 22 36 H98 Q106 40 106 58 Z" fill={c}/>
    <path d="M14 58 H106" stroke="#fff" strokeWidth="1.5" opacity=".3"/>
    <rect x="46" y="52" width="28" height="12" rx="4" fill="#fbbf24"/>
    <circle cx="60" cy="58" r="4" fill="#fbbf24" opacity=".8"/>
    {[0,20,40,60,80].map(i => (
      <line key={i} x1={22+i*1.5} y1="62" x2={22+i*1.5} y2="105" stroke="#fff" strokeWidth="1" opacity=".08"/>
    ))}
    <ellipse cx="38" cy="72" rx="5" ry="7" fill="#fbbf24" opacity=".5"/>
    <ellipse cx="82" cy="72" rx="5" ry="7" fill="#fbbf24" opacity=".5"/>
    <path d="M36 82 Q60 90 84 82" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".5"/>
    <line x1="8" y1="58" x2="112" y2="58" stroke={c} strokeWidth="4" strokeLinecap="round"/>
  </Svg>
);

// ─── Mevsimler ───────────────────────────────────────────────────────────────

const KarTanesi = ({ c, size }) => (
  <Svg size={size}>
    {[0,60,120].map(deg => {
      const rad = deg * Math.PI / 180;
      const x2 = 60 + Math.cos(rad) * 46;
      const y2 = 60 + Math.sin(rad) * 46;
      const x3 = 60 - Math.cos(rad) * 46;
      const y3 = 60 - Math.sin(rad) * 46;
      const branches = [
        [0.35, 14], [0.65, 14], [-0.35, 14], [-0.65, 14]
      ];
      return (
        <g key={deg}>
          <line x1={x3} y1={y3} x2={x2} y2={y2} stroke={c} strokeWidth="4" strokeLinecap="round"/>
          {branches.map(([t, len], i) => {
            const bx = 60 + Math.cos(rad) * (46 * (t > 0 ? t : -t) * Math.sign(t - 0.5 + 0.001) * (t < 0.5 ? 1 : -1));
            const by = 60 + Math.sin(rad) * (46 * (t > 0 ? t : -t) * Math.sign(t - 0.5 + 0.001) * (t < 0.5 ? 1 : -1));
            const brRad = (deg + 60) * Math.PI / 180;
            return (
              <g key={i}>
                <line x1={bx} y1={by} x2={bx + Math.cos(brRad) * 12} y2={by + Math.sin(brRad) * 12} stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
                <line x1={bx} y1={by} x2={bx - Math.cos(brRad) * 12} y2={by - Math.sin(brRad) * 12} stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
              </g>
            );
          })}
        </g>
      );
    })}
    <circle cx="60" cy="60" r="7" fill={c}/>
    <circle cx="60" cy="60" r="4" fill="#fff" opacity=".5"/>
  </Svg>
);

const Cicek = ({ c, size }) => (
  <Svg size={size}>
    {[0,60,120,180,240,300].map((deg,i) => {
      const rad = deg * Math.PI / 180;
      const cx2 = 60 + Math.cos(rad) * 28;
      const cy2 = 60 + Math.sin(rad) * 28;
      return <ellipse key={i} cx={cx2} cy={cy2} rx="14" ry="20"
        fill={i%2===0?c:'#fbbf24'} opacity=".85" transform={`rotate(${deg},${cx2},${cy2})`}/>;
    })}
    <circle cx="60" cy="60" r="16" fill="#fbbf24"/>
    <circle cx="60" cy="60" r="10" fill={c} opacity=".6"/>
    <circle cx="60" cy="60" r="5" fill="#fff" opacity=".5"/>
    <path d="M60 90 Q55 104 50 110" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" fill="none"/>
    <ellipse cx="45" cy="108" rx="8" ry="5" fill="#16a34a" transform="rotate(-30,45,108)"/>
  </Svg>
);

const Yaprak = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 14 Q96 30 96 70 Q96 100 60 108 Q24 100 24 70 Q24 30 60 14 Z" fill={c} opacity=".9"/>
    <path d="M60 14 L60 108" stroke="#fff" strokeWidth="2" opacity=".3"/>
    <path d="M60 40 Q78 50 85 65" stroke="#fff" strokeWidth="1.2" opacity=".25" fill="none"/>
    <path d="M60 40 Q42 50 35 65" stroke="#fff" strokeWidth="1.2" opacity=".25" fill="none"/>
    <path d="M60 62 Q74 68 80 80" stroke="#fff" strokeWidth="1" opacity=".2" fill="none"/>
    <path d="M60 62 Q46 68 40 80" stroke="#fff" strokeWidth="1" opacity=".2" fill="none"/>
    <ellipse cx="46" cy="42" rx="8" ry="12" fill="#fff" opacity=".15" transform="rotate(-20,46,42)"/>
  </Svg>
);

const GunBatimi = ({ c, size }) => (
  <Svg size={size}>
    <path d="M8 70 Q60 20 112 70" fill={c} opacity=".3"/>
    <circle cx="60" cy="70" r="32" fill="#fbbf24"/>
    <ellipse cx="60" cy="70" rx="32" ry="18" fill="#f59e0b" opacity=".5"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
      const rad=deg*Math.PI/180;
      return <line key={i} x1={60+Math.cos(rad)*34} y1={70+Math.sin(rad)*34}
        x2={60+Math.cos(rad)*44} y2={70+Math.sin(rad)*44}
        stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity=".6"/>;
    })}
    <path d="M8 80 H112" stroke={c} strokeWidth="3" strokeLinecap="round"/>
    <path d="M8 80 Q20 72 32 78 Q44 84 56 76 Q68 70 80 78 Q92 84 104 78 Q110 74 112 80" fill={`${c}40`}/>
  </Svg>
);

// ─── ZET Özel ────────────────────────────────────────────────────────────────

const ZetZ = ({ c, size }) => (
  <Svg size={size}>
    <path d="M20 20 H100 L20 100 H100" stroke={c} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    <path d="M20 20 H100 L20 100 H100" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity=".3"/>
    <line x1="20" y1="20" x2="100" y2="20" stroke={c} strokeWidth="12" strokeLinecap="round"/>
    <line x1="20" y1="100" x2="100" y2="100" stroke={c} strokeWidth="12" strokeLinecap="round"/>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
      const rad=deg*Math.PI/180;
      return <circle key={i} cx={60+Math.cos(rad)*52} cy={60+Math.sin(rad)*52} r="2" fill={c} opacity=".4"/>;
    })}
  </Svg>
);

const ZetaOrb = ({ c, size }) => (
  <Svg size={size}>
    {[0,30,60,90,120,150,180,210,240,270,300,330].map((deg,i) => {
      const rad=deg*Math.PI/180;
      return <ellipse key={i} cx={60+Math.cos(rad)*40} cy={60+Math.sin(rad)*40}
        rx="4" ry="4" fill={c} opacity={0.15 + (i%4)*0.1}/>;
    })}
    <circle cx="60" cy="60" r="36" fill={`${c}18`} stroke={c} strokeWidth="1.5" opacity=".5"/>
    <circle cx="60" cy="60" r="24" fill={`${c}30`} stroke={c} strokeWidth="1"/>
    <circle cx="60" cy="60" r="14" fill={c} opacity=".8"/>
    <text x="60" y="67" textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700" fontFamily="sans-serif">Z</text>
    <ellipse cx="50" cy="52" rx="5" ry="7" fill="#fff" opacity=".25" transform="rotate(-20,50,52)"/>
  </Svg>
);

const YeniYil = ({ c, size }) => (
  <Svg size={size}>
    <rect x="42" y="60" width="36" height="50" rx="2" fill="#16a34a"/>
    {[55,50,44,38].map((w,i) => (
      <path key={i} d={`M${60-w/2} ${62-i*14} L${60+w/2} ${62-i*14} L60 ${48-i*14} Z`} fill="#16a34a"/>
    ))}
    <rect x="56" y="50" width="8" height="14" rx="2" fill="#92400e"/>
    {[
      [38,28,'#f59e0b'],[52,18,c],[66,24,'#ef4444'],[80,30,'#a78bfa'],
      [44,42,'#fbbf24'],[70,40,'#4ca8ad']
    ].map(([bx,by,col],i) => (
      <g key={i}>
        <circle cx={bx} cy={by} r="4" fill={col}/>
        <circle cx={bx} cy={by} r="2" fill="#fff" opacity=".5"/>
      </g>
    ))}
    <polygon fill="#fbbf24" points="60,2 62.5,10 70,10 64.5,14.5 66.5,22 60,17.5 53.5,22 55.5,14.5 50,10 57.5,10"/>
  </Svg>
);

const Rozet = ({ c, size }) => (
  <Svg size={size}>
    <path d="M60 10 L66 26 L84 20 L76 36 L94 38 L80 50 L90 66 L72 62 L70 80 L58 68 L46 80 L44 62 L26 66 L36 50 L22 38 L40 36 L32 20 L50 26 Z"
      fill={c} opacity=".9"/>
    <circle cx="60" cy="48" r="20" fill={`${c}30`} stroke={c} strokeWidth="2"/>
    <polygon fill="#fbbf24"
      points="60,32 63,42 73,42 65.5,48 68.5,58 60,52 51.5,58 54.5,48 47,42 57,42"/>
  </Svg>
);

// ─── Export ──────────────────────────────────────────────────────────────────

export const EVENT_SVGS = {
  ramazan_ay:       { label: 'Ramazan Hilali',      category: 'ramazan',  Component: RamazanAy },
  ramazan_fener:    { label: 'Ramazan Feneri',       category: 'ramazan',  Component: RamazanFener },
  ramazan_cami:     { label: 'Cami',                 category: 'ramazan',  Component: RamazanCami },
  ramazan_sofra:    { label: 'İftar Sofrası',        category: 'ramazan',  Component: RamazanSofra },
  ramazan_kandil:   { label: 'Kandil',               category: 'ramazan',  Component: RamazanKandil },
  kurban_koyun:     { label: 'Koyun',                category: 'kurban',   Component: KurbanKoyun },
  kurban_kaabe:     { label: 'Kabe',                 category: 'kurban',   Component: KurbanKaabe },
  kurban_dua:       { label: 'Dua',                  category: 'kurban',   Component: KurbanDua },
  bayram_balon:     { label: 'Balonlar',             category: 'bayram',   Component: BayramBalon },
  bayram_konfeti:   { label: 'Konfeti',              category: 'bayram',   Component: BayramKonfeti },
  bayram_havai:     { label: 'Havai Fişek',          category: 'bayram',   Component: BayramHavaiFisek },
  turk_bayrak:      { label: 'Türk Bayrağı',         category: 'milli',    Component: TurkBayrak },
  cumhuriyet:       { label: 'Cumhuriyet',           category: 'milli',    Component: Cumhuriyet },
  kupa:             { label: 'Kupa',                 category: 'odul',     Component: Kupa },
  tac:              { label: 'Taç',                  category: 'odul',     Component: Tac },
  elmas:            { label: 'Elmas',                category: 'odul',     Component: Elmas },
  hediye:           { label: 'Hediye',               category: 'odul',     Component: Hediye },
  yildiz_patlama:   { label: 'Yıldız Patlaması',     category: 'odul',     Component: YildizPatlama },
  roket:            { label: 'Roket',                category: 'odul',     Component: Roket },
  kalp:             { label: 'Kalp',                 category: 'odul',     Component: Kalp },
  madalya:          { label: 'Madalya',              category: 'odul',     Component: Madalya },
  sandik:           { label: 'Sandık',               category: 'odul',     Component: Sandik },
  rozet:            { label: 'Rozet',                category: 'odul',     Component: Rozet },
  kar_tanesi:       { label: 'Kar Tanesi',           category: 'mevsim',   Component: KarTanesi },
  cicek:            { label: 'Çiçek',                category: 'mevsim',   Component: Cicek },
  yaprak:           { label: 'Sonbahar Yaprağı',     category: 'mevsim',   Component: Yaprak },
  gun_batimi:       { label: 'Gün Batımı',           category: 'mevsim',   Component: GunBatimi },
  yeni_yil:         { label: 'Yeni Yıl',             category: 'bayram',   Component: YeniYil },
  zet_z:            { label: 'ZET Z',                category: 'zet',      Component: ZetZ },
  zeta_orb:         { label: 'Zeta Orb',             category: 'zet',      Component: ZetaOrb },
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
