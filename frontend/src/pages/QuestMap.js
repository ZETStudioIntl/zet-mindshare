import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Info, X, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { questService } from '../lib/questService';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// ─── Şekil meta ──────────────────────────────────────────────────────────────
const SHAPE_META = {
  circle:   { stroke: '#38bdf8', rgb: '56,189,248',  glow: 'rgba(56,189,248,0.45)',  zp: 20,  label: 'Daire'  },
  square:   { stroke: '#818cf8', rgb: '129,140,248', glow: 'rgba(129,140,248,0.45)', zp: 60,  label: 'Kare'   },
  triangle: { stroke: '#c084fc', rgb: '192,132,252', glow: 'rgba(192,132,252,0.45)', zp: 130, label: 'Üçgen'  },
  star:     { stroke: '#fbbf24', rgb: '251,191,36',  glow: 'rgba(251,191,36,0.5)',   zp: 200, label: 'Yıldız' },
};

const SHAPES  = ['circle', 'square', 'triangle', 'star'];
const WEIGHTS = [50, 40, 25, 10];
const W_TOTAL = 125;
const NORM_PCT = WEIGHTS.map(w => Math.round(w / W_TOTAL * 100));

// ─── Kategori meta ────────────────────────────────────────────────────────────
const CATEGORY_META = {
  words_typed:    { color: '#38bdf8', rgb: '56,189,248'  },
  editor_minutes: { color: '#2dd4bf', rgb: '45,212,191'  },
  notes_created:  { color: '#4ade80', rgb: '74,222,128'  },
  solo_docs:      { color: '#818cf8', rgb: '129,140,248' },
  memories_added: { color: '#fb923c', rgb: '251,146,60'  },
};

// ─── Görev havuzu ─────────────────────────────────────────────────────────────
const QUEST_POOL = [
  { id: 'q_words50',   name: '50 Kelime Yaz',       desc: 'Editörde 50 kelime yaz. Copy-paste ve spam tuş sayılmaz.',   tier: 0 },
  { id: 'q_editor10',  name: '10 Dk Editörde',      desc: 'Editörde aktif 10 dakika çalış.',                            tier: 0 },
  { id: 'q_notes10',   name: '10 Not Oluştur',      desc: 'Bugün 10 yeni belge oluştur.',                               tier: 0 },
  { id: 'q_solo1',     name: 'Kendi Başına',        desc: 'AI yardımı olmadan 1 belge oturumu tamamla.',                tier: 0 },
  { id: 'q_memory5',   name: '5 Bellek Ekle',       desc: 'Zeta hafızasına 5 yeni bilgi ekle.',                         tier: 0 },
  { id: 'q_words150',  name: '150 Kelime Yaz',      desc: 'Editörde 150 kelime yaz. Copy-paste ve spam tuş sayılmaz.',  tier: 1 },
  { id: 'q_editor25',  name: '25 Dk Editörde',      desc: 'Editörde aktif 25 dakika çalış.',                            tier: 1 },
  { id: 'q_notes25',   name: '25 Not Oluştur',      desc: 'Bugün 25 yeni belge oluştur.',                               tier: 1 },
  { id: 'q_solo3',     name: '3 Bağımsız Belge',   desc: 'AI yardımı olmadan 3 belge oturumu tamamla.',                tier: 1 },
  { id: 'q_memory15',  name: '15 Bellek Ekle',      desc: 'Zeta hafızasına 15 yeni bilgi ekle.',                        tier: 1 },
  { id: 'q_words500',  name: 'Günlük Yazar',        desc: 'Bugün 500 kelime yaz. Copy-paste ve spam tuş sayılmaz.',     tier: 2 },
  { id: 'q_editor45',  name: 'Editör Maratonu',     desc: 'Editörde aktif 45 dakika çalış.',                            tier: 2 },
  { id: 'q_notes50',   name: '50 Not Oluştur',      desc: 'Bugün 50 yeni belge oluştur.',                               tier: 2 },
  { id: 'q_solo7',     name: '7 Bağımsız Belge',   desc: 'AI yardımı olmadan 7 belge oturumu tamamla.',                tier: 2 },
  { id: 'q_memory35',  name: '35 Bellek Ekle',      desc: 'Zeta hafızasına 35 yeni bilgi ekle.',                        tier: 2 },
  { id: 'q_words1500', name: 'Kalem Ustası',        desc: 'Bugün 1500 kelime yaz. Copy-paste ve spam tuş sayılmaz.',    tier: 3 },
  { id: 'q_editor90',  name: 'Uzun Mesai',          desc: 'Editörde aktif 90 dakika çalış.',                            tier: 3 },
  { id: 'q_notes100',  name: '100 Not Oluştur',     desc: 'Bugün 100 yeni belge oluştur.',                              tier: 3 },
  { id: 'q_solo15',    name: 'Saf Üretkenlik',      desc: 'AI yardımı olmadan 15 belge oturumu tamamla.',               tier: 3 },
  { id: 'q_memory75',  name: '75 Bellek Ekle',      desc: 'Zeta hafızasına 75 yeni bilgi ekle.',                        tier: 3 },
];

// ─── Görev gereksinim eşleme ──────────────────────────────────────────────────
const QUEST_REQ = {
  q_words50:   { field: 'words_typed',    threshold: 50,   unit: 'kelime' },
  q_words150:  { field: 'words_typed',    threshold: 150,  unit: 'kelime' },
  q_words500:  { field: 'words_typed',    threshold: 500,  unit: 'kelime' },
  q_words1500: { field: 'words_typed',    threshold: 1500, unit: 'kelime' },
  q_editor10:  { field: 'editor_minutes', threshold: 10,   unit: 'dk'     },
  q_editor25:  { field: 'editor_minutes', threshold: 25,   unit: 'dk'     },
  q_editor45:  { field: 'editor_minutes', threshold: 45,   unit: 'dk'     },
  q_editor90:  { field: 'editor_minutes', threshold: 90,   unit: 'dk'     },
  q_notes10:   { field: 'notes_created',  threshold: 10,   unit: 'not'    },
  q_notes25:   { field: 'notes_created',  threshold: 25,   unit: 'not'    },
  q_notes50:   { field: 'notes_created',  threshold: 50,   unit: 'not'    },
  q_notes100:  { field: 'notes_created',  threshold: 100,  unit: 'not'    },
  q_solo1:     { field: 'solo_docs',      threshold: 1,    unit: 'belge'  },
  q_solo3:     { field: 'solo_docs',      threshold: 3,    unit: 'belge'  },
  q_solo7:     { field: 'solo_docs',      threshold: 7,    unit: 'belge'  },
  q_solo15:    { field: 'solo_docs',      threshold: 15,   unit: 'belge'  },
  q_memory5:   { field: 'memories_added', threshold: 5,    unit: 'bellek' },
  q_memory15:  { field: 'memories_added', threshold: 15,   unit: 'bellek' },
  q_memory35:  { field: 'memories_added', threshold: 35,   unit: 'bellek' },
  q_memory75:  { field: 'memories_added', threshold: 75,   unit: 'bellek' },
};

// ─── PRNG ─────────────────────────────────────────────────────────────────────
function seededRng(seed) {
  let s = seed >>> 0;
  return () => {
    s = Math.imul(1664525, s) + 1013904223 >>> 0;
    return s / 0x100000000;
  };
}
function dateSeed() {
  const d = new Date();
  return (d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()) >>> 0;
}
function rollShape(rng) {
  const roll = rng() * W_TOTAL;
  let acc = 0;
  for (let i = 0; i < WEIGHTS.length; i++) {
    acc += WEIGHTS[i];
    if (roll < acc) return SHAPES[i];
  }
  return 'circle';
}

function buildDailyQuests(rerollOffset = 0, forceFriday = false) {
  const rng       = seededRng(dateSeed() + rerollOffset * 7919);
  const isFriday  = forceFriday || new Date().getDay() === 5;
  const slotCount = isFriday ? 5 : 3;
  const used      = new Set();
  const slots     = [];
  for (let i = 0; i < slotCount; i++) {
    const shape = (isFriday && i === 0) ? 'star' : rollShape(rng);
    const specialChance = isFriday ? 0.025 : 0.009;
    const isSpecial     = rng() < specialChance;
    const specialType   = rng() < 0.5 ? 'case' : 'wheel';
    const tier   = SHAPES.indexOf(shape);
    const pool   = QUEST_POOL.filter(q => q.tier === tier && !used.has(q.id));
    const picked = pool[Math.floor(rng() * (pool.length || 1))] || QUEST_POOL.find(q => !used.has(q.id)) || QUEST_POOL[0];
    used.add(picked.id);
    slots.push({ id: `slot_${i}_${rerollOffset}`, quest: picked, shape, isSpecial, specialType });
  }
  return { slots, isFriday };
}

// ─── Şekil SVG'leri ──────────────────────────────────────────────────────────
function starPoints(cx, cy, r, ir, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a   = (i * Math.PI / n) - Math.PI / 2;
    const rad = i % 2 === 0 ? r : ir;
    pts.push(`${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`);
  }
  return pts.join(' ');
}

function ShapeIcon({ shape, size = 32, color, glow, done }) {
  const c = done ? '#4ade80' : color;
  const g = done ? 'rgba(74,222,128,0.5)' : glow;
  const f = `drop-shadow(0 0 5px ${g})`;
  if (shape === 'circle') return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="11" fill="none" stroke={c} strokeWidth="2.5" style={{ filter: f }} />
      <circle cx="16" cy="16" r="5"  fill={c} opacity="0.2" />
    </svg>
  );
  if (shape === 'square') return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect x="5" y="5" width="22" height="22" rx="3" fill="none" stroke={c} strokeWidth="2.5" style={{ filter: f }} />
      <rect x="10" y="10" width="12" height="12" rx="2" fill={c} opacity="0.2" />
    </svg>
  );
  if (shape === 'triangle') return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <polygon points="16,4 29,27 3,27" fill="none" stroke={c} strokeWidth="2.5" strokeLinejoin="round" style={{ filter: f }} />
      <polygon points="16,12 23,24 9,24" fill={c} opacity="0.2" />
    </svg>
  );
  if (shape === 'star') return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <polygon points={starPoints(16,16,13,6)} fill="none" stroke={c} strokeWidth="2" style={{ filter: `drop-shadow(0 0 8px ${g})` }} />
      <polygon points={starPoints(16,16,6,3)}  fill={c} opacity="0.35" />
    </svg>
  );
  return null;
}

// ─── Kategori ikonları ────────────────────────────────────────────────────────
function CategoryIcon({ field, size = 20, color }) {
  if (field === 'words_typed') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (field === 'editor_minutes') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8"/>
      <polyline points="12 7 12 12 15.5 15.5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (field === 'notes_created') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <polyline points="14 2 14 8 20 8" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="8" y1="17" x2="13" y2="17" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  if (field === 'solo_docs') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="7" r="4" stroke={color} strokeWidth="1.8"/>
    </svg>
  );
  if (field === 'memories_added') return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="1.8"/>
      <path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
  return null;
}

function CaseIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="7" width="20" height="14" rx="2" stroke="#fbbf24" strokeWidth="1.8"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="#fbbf24" strokeWidth="1.8"/>
      <line x1="12" y1="12" x2="12" y2="16" stroke="#fbbf24" strokeWidth="1.8"/>
      <line x1="10" y1="14" x2="14" y2="14" stroke="#fbbf24" strokeWidth="1.8"/>
    </svg>
  );
}
function WheelIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="#c084fc" strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="3" fill="#c084fc" opacity="0.4"/>
      <line x1="12" y1="3"  x2="12" y2="7"  stroke="#c084fc" strokeWidth="1.8"/>
      <line x1="12" y1="17" x2="12" y2="21" stroke="#c084fc" strokeWidth="1.8"/>
      <line x1="3"  y1="12" x2="7"  y2="12" stroke="#c084fc" strokeWidth="1.8"/>
      <line x1="17" y1="12" x2="21" y2="12" stroke="#c084fc" strokeWidth="1.8"/>
    </svg>
  );
}

// ─── Geri sayım ──────────────────────────────────────────────────────────────
function useCountdown() {
  const [timeLeft, setTimeLeft] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return timeLeft;
}

// ─── Haftanın günleri ─────────────────────────────────────────────────────────
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function WeekDots() {
  const today = new Date().getDay();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
      {DAYS.map((label, i) => {
        const isToday = i === today;
        const isPast  = i < today;
        const isFri   = i === 5;
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: isFri ? 30 : 24, height: isFri ? 30 : 24,
              borderRadius: isFri ? 7 : '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isToday ? 'rgba(251,191,36,0.15)' : isPast ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${isToday ? '#fbbf24' : isPast ? '#4ade80' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s',
            }}>
              {isPast ? (
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : isFri ? (
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <polygon points={starPoints(7,7,6,2.5)} fill={isToday ? '#fbbf24' : 'rgba(251,191,36,0.35)'}/>
                </svg>
              ) : null}
            </div>
            <span style={{ fontSize: 9, color: isToday ? '#fbbf24' : '#334155', fontWeight: isToday ? 700 : 400 }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Bilgi Paneli ─────────────────────────────────────────────────────────────
const INFO_SLIDES = [
  {
    titleKey: 'questInfoTitle1',
    content: ({ rows, t }) => (
      <div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>{t('questInfoDesc1')}</p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {rows.map(row => {
            const meta = SHAPE_META[row.shape];
            return (
              <div key={row.shape} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: `rgba(${meta.rgb},0.08)`, border: `1px solid rgba(${meta.rgb},0.18)` }}>
                <ShapeIcon shape={row.shape} size={20} color={meta.stroke} glow={meta.glow} done={false} />
                <span style={{ fontSize: 11, color: meta.stroke, fontWeight: 700 }}>+{row.zp} ZP</span>
              </div>
            );
          })}
        </div>
      </div>
    ),
  },
  {
    titleKey: 'questInfoTitle2',
    content: ({ t }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{t('questInfoWordWriting')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[50, 150, 500, 1500].map(n => (
              <span key={n} style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>{n}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{t('questInfoWordWritingDesc')}</div>
        </div>
        <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 }}>{t('questInfoEditorTime')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {[10, 25, 45, 90].map(n => (
              <span key={n} style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', borderRadius: 6, padding: '3px 8px', fontWeight: 600 }}>{n}</span>
            ))}
          </div>
          <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>{t('questInfoEditorTimeDesc')}</div>
        </div>
      </div>
    ),
  },
  {
    titleKey: 'questInfoTitle3',
    content: ({ rows, EXPECTED_PER_SLOT, t }) => (
      <div>
        <div style={{ marginBottom: 16 }}>
          {rows.map(row => {
            const meta = SHAPE_META[row.shape];
            return (
              <div key={row.shape} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <ShapeIcon shape={row.shape} size={26} color={meta.stroke} glow={meta.glow} done={false} />
                <span style={{ width: 46, fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{meta.label}</span>
                <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${row.pct * 2.5}%`, background: meta.stroke, borderRadius: 3, opacity: 0.7 }} />
                </div>
                <span style={{ width: 30, fontSize: 12, fontWeight: 700, color: meta.stroke, textAlign: 'right' }}>%{row.pct}</span>
                <span style={{ width: 52, fontSize: 11, color: '#475569', textAlign: 'right' }}>+{row.zp} ZP</span>
              </div>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { lk: 'questInfoNormalDay', val: `~${Math.round(EXPECTED_PER_SLOT * 3)} ZP` },
            { lk: 'questInfoFriday',    val: `~${Math.round(200 + EXPECTED_PER_SLOT * 4)} ZP`, gold: true },
            { lk: 'questInfoCaseChance', val: '%0.9 / slot' },
            { lk: 'questInfoFridayCase', val: '%2.5 / slot', gold: true },
          ].map(item => (
            <div key={item.lk} style={{ flex: '1 1 45%', padding: '8px 10px', borderRadius: 8, background: item.gold ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${item.gold ? 'rgba(251,191,36,0.15)' : 'rgba(255,255,255,0.06)'}` }}>
              <div style={{ fontSize: 10, color: '#475569', marginBottom: 3 }}>{t(item.lk)}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: item.gold ? '#fbbf24' : '#e2e8f0' }}>{item.val}</div>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    titleKey: 'questInfoTitle4',
    content: ({ t }) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '14px', borderRadius: 10, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171', marginBottom: 8 }}>{t('questInfoAutoDetect')}</div>
          <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7 }}>{t('questInfoHafizzDesc')}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['questInfoCheat1', 'questInfoCheat2', 'questInfoCheat3'].map(key => (
            <div key={key} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flexShrink: 0, width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }} />
              <span style={{ fontSize: 12, color: '#64748b' }}>{t(key)}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 4, padding: '14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', marginBottom: 6 }}>{t('questInfoWarning')}</div>
          <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.65 }}>{t('questInfoWarningDesc')}</div>
        </div>
      </div>
    ),
  },
];

function InfoPanel({ onClose }) {
  const { t } = useLanguage();
  const [slide, setSlide] = React.useState(0);
  const TOTAL = INFO_SLIDES.length;
  const ZP_VALS = [20, 60, 130, 200];
  const EXPECTED_PER_SLOT = WEIGHTS.reduce((sum, w, i) => sum + (w / W_TOTAL) * ZP_VALS[i], 0);
  const rows = [
    { shape: 'circle',   pct: NORM_PCT[0], zp: 20  },
    { shape: 'square',   pct: NORM_PCT[1], zp: 60  },
    { shape: 'triangle', pct: NORM_PCT[2], zp: 130 },
    { shape: 'star',     pct: NORM_PCT[3], zp: 200 },
  ];
  const ctx = { rows, EXPECTED_PER_SLOT, t };
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: '#0b1120', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)', padding: '24px 20px 28px', animation: 'slide-up 0.22s cubic-bezier(0.32,0.72,0,1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t(INFO_SLIDES[slide].titleKey)}</span>
            <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{slide + 1} / {TOTAL}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ minHeight: 220, marginBottom: 20 }}>
          {INFO_SLIDES[slide].content(ctx)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setSlide(s => Math.max(0, s - 1))}
            disabled={slide === 0}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: slide === 0 ? '#1e293b' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: slide === 0 ? 'default' : 'pointer' }}
          >
            {t('back')}
          </button>
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} style={{ width: i === slide ? 18 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0, background: i === slide ? (i === TOTAL - 1 ? '#ef4444' : '#38bdf8') : 'rgba(255,255,255,0.12)', cursor: 'pointer', transition: 'all 0.2s' }} />
            ))}
          </div>
          <button
            onClick={() => slide < TOTAL - 1 ? setSlide(s => s + 1) : onClose()}
            style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${slide === TOTAL - 1 ? 'rgba(239,68,68,0.3)' : 'rgba(56,189,248,0.3)'}`, background: slide === TOTAL - 1 ? 'rgba(239,68,68,0.08)' : 'rgba(56,189,248,0.08)', color: slide === TOTAL - 1 ? '#f87171' : '#38bdf8', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            {slide === TOTAL - 1 ? t('questInfoClose') : t('forward')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ana bileşen ──────────────────────────────────────────────────────────────
const QuestMap = () => {
  const navigate = useNavigate();
  const isCEO    = localStorage.getItem('zet_ceo_mode') === 'true';
  const countdown = useCountdown();

  const [rerollOffset,   setRerollOffset]   = useState(0);
  const [forceFriday,    setForceFriday]    = useState(false);
  const [showInfo,       setShowInfo]        = useState(false);
  const [collectedSlots, setCollectedSlots]  = useState(new Set());
  const [counters,       setCounters]        = useState({ words_typed: 0, editor_minutes: 0, notes_created: 0, solo_docs: 0, memories_added: 0 });
  const [zpFly,          setZpFly]           = useState(null);
  const [rerolling,      setRerolling]       = useState(false);
  const [collecting,     setCollecting]      = useState(null);
  const [userZP,         setUserZP]          = useState(null);
  const [rerollErr,      setRerollErr]       = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [meRes, todayRes] = await Promise.all([
          axios.get(`${API}/users/me`, { withCredentials: true }),
          axios.get(`${API}/quests/today`, { withCredentials: true }),
        ]);
        setUserZP(meRes.data?.mindshare_xp ?? null);
        const d = todayRes.data;
        setCollectedSlots(new Set(d.collected_slots || []));
        setCounters({ words_typed: d.words_typed || 0, editor_minutes: d.editor_minutes || 0, notes_created: d.notes_created || 0, solo_docs: d.solo_docs || 0, memories_added: d.memories_added || 0 });
        questService.initCounters(d);
        if ((d.reroll_offset || 0) > 0) setRerollOffset(d.reroll_offset);
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const handler = (e) => {
      const d = e.detail || {};
      setCounters({
        words_typed:    d.words_typed    || 0,
        editor_minutes: d.editor_minutes || 0,
        notes_created:  d.notes_created  || 0,
        solo_docs:      d.solo_docs      || 0,
        memories_added: d.memories_added || 0,
      });
    };
    window.addEventListener('quest-counter-update', handler);
    return () => window.removeEventListener('quest-counter-update', handler);
  }, []);

  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const r = await axios.get(`${API}/quests/today`, { withCredentials: true });
        setCounters({ words_typed: r.data.words_typed || 0, editor_minutes: r.data.editor_minutes || 0, notes_created: r.data.notes_created || 0, solo_docs: r.data.solo_docs || 0, memories_added: r.data.memories_added || 0 });
      } catch {}
    };
    const id = setInterval(fetchCounters, 30000);
    return () => clearInterval(id);
  }, []);

  const { slots, isFriday } = useMemo(
    () => buildDailyQuests(rerollOffset, forceFriday),
    [rerollOffset, forceFriday]
  );

  const realFriday  = new Date().getDay() === 5;
  const rerollCost  = isFriday ? 600 : 400;
  const doneCount   = collectedSlots.size;
  const totalSlots  = slots.length;
  const earnedZP    = slots.reduce((sum, slot, idx) => {
    if (!collectedSlots.has(idx)) return sum;
    if (slot.isSpecial) return sum;
    return sum + SHAPE_META[slot.shape].zp;
  }, 0);

  const handleReroll = useCallback(async () => {
    if (rerolling) return;
    setRerolling(true);
    setRerollErr('');
    try {
      if (isCEO) {
        await new Promise(r => setTimeout(r, 300));
      } else {
        const res = await axios.post(`${API}/quests/reroll`, {}, { withCredentials: true });
        setUserZP(res.data.new_zp);
      }
      setCollectedSlots(new Set());
      setRerollOffset(n => n + 1);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Yenileme başarısız';
      setRerollErr(detail);
      setTimeout(() => setRerollErr(''), 3000);
    } finally {
      setRerolling(false);
    }
  }, [isCEO, rerolling, isFriday]);

  const handleCollect = useCallback(async (slot, slotIdx, e) => {
    if (collectedSlots.has(slotIdx) || collecting === slot.id) return;
    setCollecting(slot.id);
    try {
      const res = await axios.post(`${API}/quests/collect`, {
        slot_idx:     slotIdx,
        quest_id:     slot.quest.id,
        shape:        slot.shape,
        is_special:   slot.isSpecial,
        special_type: slot.specialType || 'case',
      }, { withCredentials: true });

      setCollectedSlots(prev => new Set([...prev, slotIdx]));
      if (res.data.new_zp !== null && res.data.new_zp !== undefined) setUserZP(res.data.new_zp);

      const rect   = e.currentTarget.getBoundingClientRect();
      const badge  = document.getElementById('daily-zp-badge');
      const toRect = badge?.getBoundingClientRect();
      setZpFly({
        key: Date.now(),
        fromX: rect.left + rect.width / 2,
        fromY: rect.top  + rect.height / 2,
        toX: toRect ? toRect.left + toRect.width / 2 : window.innerWidth / 2,
        toY: toRect ? toRect.top : 60,
        label: slot.isSpecial
          ? (slot.specialType === 'case' ? 'Sandık!' : 'Çark!')
          : `+${SHAPE_META[slot.shape].zp} ZP`,
      });
      setTimeout(() => setZpFly(null), 1100);
    } catch (err) {
      const detail = err?.response?.data?.detail || 'Toplama başarısız';
      setRerollErr(detail);
      setTimeout(() => setRerollErr(''), 3000);
    } finally {
      setCollecting(null);
    }
  }, [collectedSlots, collecting]);

  return (
    <>
    <div style={{ minHeight: '100vh', background: '#050810', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px',
        background: 'rgba(5,8,16,0.95)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 4 }}>
          <ArrowLeft size={20} />
        </button>

        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', flex: 1 }}>Günlük Görevler</span>

        {isFriday && !realFriday && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            CUMA AKTİF
          </span>
        )}
        {realFriday && (
          <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
            CUMA BONUSU
          </span>
        )}

        <button
          onClick={handleReroll}
          disabled={rerolling}
          style={{
            background: rerolling ? 'rgba(245,158,11,0.04)' : 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 8, cursor: rerolling ? 'default' : 'pointer', color: '#f59e0b',
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 10px', fontSize: 11, fontWeight: 700,
            transition: 'all 0.2s', opacity: rerolling ? 0.6 : 1,
          }}
        >
          <RefreshCw size={13} style={{ animation: rerolling ? 'spin 0.4s linear infinite' : 'none' }} />
          {isCEO ? 'Yenile' : `${rerollCost} ZP`}
        </button>

        <button onClick={() => setShowInfo(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', padding: 4 }}>
          <Info size={18} />
        </button>

        <div id="daily-zp-badge" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.2"/>
            <text x="7" y="10.5" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontWeight="800">ZP</text>
          </svg>
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
            {userZP !== null ? userZP.toLocaleString('tr-TR') : '—'}
          </span>
        </div>
      </div>

      {/* ── İçerik ── */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 14px 80px' }}>

        <WeekDots />

        {/* ── Stat kutucukları ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
          {/* Tamamlanan */}
          <div style={{ padding: '12px 10px', borderRadius: 12, background: doneCount > 0 ? 'rgba(74,222,128,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${doneCount > 0 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Tamamlanan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: doneCount > 0 ? '#4ade80' : '#334155', lineHeight: 1 }}>
              {doneCount}<span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>/{totalSlots}</span>
            </div>
          </div>

          {/* Kazanılan ZP */}
          <div style={{ padding: '12px 10px', borderRadius: 12, background: earnedZP > 0 ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${earnedZP > 0 ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.06)'}` }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Kazanılan</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: earnedZP > 0 ? '#fbbf24' : '#334155', lineHeight: 1 }}>
              {earnedZP > 0 ? `+${earnedZP}` : '—'}<span style={{ fontSize: 11, color: '#475569', fontWeight: 600 }}> ZP</span>
            </div>
          </div>

          {/* Geri sayım */}
          <div style={{ padding: '12px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontSize: 9, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Yenileniyor</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#334155', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {countdown || '—:—:—'}
            </div>
          </div>
        </div>

        {/* ── Görev kartları ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {slots.map((slot, idx) => {
            const shapeMeta  = SHAPE_META[slot.shape];
            const done       = collectedSlots.has(idx);
            const req        = QUEST_REQ[slot.quest.id];
            const current    = req ? (counters[req.field] || 0) : 0;
            const isReady    = req ? (current >= req.threshold) : false;
            const isCollecting = collecting === slot.id;
            const pct        = req ? Math.min(100, Math.round(current / req.threshold * 100)) : 0;
            const catMeta    = req ? (CATEGORY_META[req.field] || { color: shapeMeta.stroke, rgb: shapeMeta.rgb }) : { color: shapeMeta.stroke, rgb: shapeMeta.rgb };

            return (
              <div
                key={slot.id}
                style={{
                  borderRadius: 16,
                  background: done
                    ? 'rgba(74,222,128,0.04)'
                    : isReady
                    ? `rgba(${catMeta.rgb},0.07)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : isReady ? `rgba(${catMeta.rgb},0.3)` : 'rgba(255,255,255,0.07)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.3s, background 0.3s',
                  boxShadow: isReady && !done ? `0 0 20px rgba(${catMeta.rgb},0.08)` : 'none',
                }}
              >
                {/* Kart içeriği */}
                <div style={{ padding: '16px 16px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>

                  {/* Kategori ikonu */}
                  <div style={{
                    flexShrink: 0,
                    width: 44, height: 44, borderRadius: 12,
                    background: done ? 'rgba(74,222,128,0.1)' : `rgba(${catMeta.rgb},0.1)`,
                    border: `1.5px solid ${done ? 'rgba(74,222,128,0.25)' : `rgba(${catMeta.rgb},0.25)`}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {done ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12l5 5L20 7" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      req && <CategoryIcon field={req.field} size={20} color={catMeta.color} />
                    )}
                  </div>

                  {/* Metin ve ilerleme */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#4ade80' : isReady ? '#e2e8f0' : '#94a3b8', marginBottom: 2, lineHeight: 1.2 }}>
                      {slot.quest.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#334155', lineHeight: 1.4, marginBottom: req && !done ? 10 : 0 }}>
                      {slot.quest.desc}
                    </div>

                    {/* İlerleme çubuğu */}
                    {req && !done && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 11, color: isReady ? catMeta.color : '#475569', fontWeight: 700 }}>
                            {current.toLocaleString('tr-TR')} / {req.threshold.toLocaleString('tr-TR')} {req.unit}
                          </span>
                          <span style={{ fontSize: 11, color: isReady ? catMeta.color : '#334155', fontWeight: 800 }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: 7, borderRadius: 99, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 99,
                            width: `${pct}%`,
                            background: isReady
                              ? `linear-gradient(90deg, ${catMeta.color}, #fff)`
                              : catMeta.color,
                            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
                            opacity: isReady ? 1 : 0.7,
                          }} />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Alt satır: ödül + buton */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 16px 14px',
                  borderTop: `1px solid ${done ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  {/* Ödül rozeti */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <ShapeIcon shape={slot.shape} size={28} color={shapeMeta.stroke} glow={shapeMeta.glow} done={done} />
                    {slot.isSpecial ? (
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                        background: slot.specialType === 'case' ? 'rgba(251,191,36,0.1)' : 'rgba(192,132,252,0.1)',
                        color:      slot.specialType === 'case' ? '#fbbf24' : '#c084fc',
                        border:     `1px solid ${slot.specialType === 'case' ? 'rgba(251,191,36,0.22)' : 'rgba(192,132,252,0.22)'}`,
                      }}>
                        {slot.specialType === 'case' ? <CaseIcon /> : <WheelIcon />}
                        {slot.specialType === 'case' ? 'Sandık' : 'Çark'}
                      </span>
                    ) : (
                      <span style={{
                        fontSize: 13, fontWeight: 800,
                        color: done ? '#4ade80' : shapeMeta.stroke,
                      }}>
                        +{shapeMeta.zp} ZP
                      </span>
                    )}
                  </div>

                  {/* TOPLA butonu */}
                  <button
                    onClick={(e) => handleCollect(slot, idx, e)}
                    disabled={done || !isReady || isCollecting}
                    style={{
                      padding: '10px 22px',
                      borderRadius: 10,
                      fontSize: 12, fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: (done || !isReady || isCollecting) ? 'default' : 'pointer',
                      transition: 'all 0.2s',
                      ...(done ? {
                        background: 'rgba(74,222,128,0.1)',
                        border: '1px solid rgba(74,222,128,0.2)',
                        color: '#4ade80',
                      } : isReady ? {
                        background: `linear-gradient(135deg, rgba(${catMeta.rgb},0.25) 0%, rgba(${catMeta.rgb},0.15) 100%)`,
                        border: `1.5px solid rgba(${catMeta.rgb},0.6)`,
                        color: catMeta.color,
                        boxShadow: `0 0 14px rgba(${catMeta.rgb},0.25)`,
                        animation: 'pulse-btn 2s ease-in-out infinite',
                      } : {
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.07)',
                        color: '#1e293b',
                      }),
                      opacity: isCollecting ? 0.6 : 1,
                    }}
                  >
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : isCollecting ? '...' : isReady ? 'TOPLA' : 'Kilitli'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Cuma bonus kartı ── */}
        {!isFriday && (
          <div style={{
            borderRadius: 14,
            background: isCEO ? 'rgba(251,191,36,0.05)' : 'rgba(255,255,255,0.02)',
            border: `1px solid ${isCEO ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.05)'}`,
            padding: '14px 18px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: isCEO ? 'rgba(251,191,36,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isCEO ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {isCEO ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <polygon points={starPoints(9,9,8,3.5)} fill="rgba(251,191,36,0.4)" stroke="#fbbf24" strokeWidth="1.2"/>
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#1e293b" strokeWidth="1.8"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#1e293b" strokeWidth="1.8"/>
                </svg>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isCEO ? '#fbbf24' : '#1e293b', marginBottom: 2 }}>
                Cuma Bonusu — 5 Slot
              </div>
              <div style={{ fontSize: 11, color: isCEO ? '#92740a' : '#1e293b' }}>
                {isCEO ? '+2 ek slot · garanti yıldız · %2.5 sandık şansı' : 'Cuma günü otomatik açılır'}
              </div>
            </div>
            {isCEO && (
              <button
                onClick={() => { setForceFriday(true); setCollectedSlots(new Set()); }}
                style={{
                  flexShrink: 0, padding: '8px 14px', borderRadius: 9,
                  background: 'rgba(251,191,36,0.12)',
                  border: '1px solid rgba(251,191,36,0.35)',
                  color: '#fbbf24', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Etkinleştir
              </button>
            )}
          </div>
        )}

        {/* Hata */}
        {rerollErr && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, textAlign: 'center' }}>
            {rerollErr}
          </div>
        )}
      </div>
    </div>

    {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}

    {zpFly && (
      <div
        key={zpFly.key}
        style={{
          position: 'fixed', left: zpFly.fromX, top: zpFly.fromY,
          transform: 'translate(-50%, -50%)', zIndex: 9999, pointerEvents: 'none',
          animation: 'daily-zp-fly 1s cubic-bezier(0.4,0,0.2,1) forwards',
          '--tx': `${zpFly.toX - zpFly.fromX}px`,
          '--ty': `${zpFly.toY - zpFly.fromY}px`,
        }}
      >
        <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24', textShadow: '0 0 10px rgba(251,191,36,0.9)', whiteSpace: 'nowrap' }}>
          {zpFly.label}
        </span>
      </div>
    )}

    <style>{`
      @keyframes daily-zp-fly {
        0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.3); }
        60%  { opacity: 1; }
        100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); }
      }
      @keyframes slide-up {
        from { transform: translateY(100%); opacity: 0; }
        to   { transform: translateY(0);    opacity: 1; }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
      @keyframes pulse-btn {
        0%, 100% { box-shadow: 0 0 14px rgba(var(--btn-rgb, 56,189,248), 0.25); }
        50%       { box-shadow: 0 0 24px rgba(var(--btn-rgb, 56,189,248), 0.45); }
      }
    `}</style>
    </>
  );
};

export default QuestMap;
