import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Info, X, RefreshCw, Star } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

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

// Normalized oranlar (bilgi paneli için)
const NORM_PCT = WEIGHTS.map(w => Math.round(w / W_TOTAL * 100));

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

// ─── Görev gereksinim eşleme (frontend ilerleme için) ─────────────────────────
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

// ─── Deterministik PRNG ───────────────────────────────────────────────────────
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

function ShapeIcon({ shape, size = 44, color, glow, done }) {
  const c = done ? '#4ade80' : color;
  const g = done ? 'rgba(74,222,128,0.5)' : glow;
  const f = `drop-shadow(0 0 6px ${g})`;
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

// ─── Haftalık ilerleme ────────────────────────────────────────────────────────
const DAYS = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
function WeekProgress() {
  const today = new Date().getDay();
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
      {DAYS.map((label, i) => {
        const isToday = i === today;
        const isPast  = i < today;
        const isFri   = i === 5;
        return (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: isFri ? 32 : 26, height: isFri ? 32 : 26,
              borderRadius: isFri ? 7 : '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isToday ? 'rgba(251,191,36,0.15)' : isPast ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${isToday ? '#fbbf24' : isPast ? '#4ade80' : 'rgba(255,255,255,0.07)'}`,
              transition: 'all 0.2s',
            }}>
              {isPast ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : isFri ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
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

// ─── Bilgi Paneli — 4 slayt ───────────────────────────────────────────────────
const INFO_SLIDES = [
  {
    titleKey: 'questInfoTitle1',
    content: ({ rows, t }) => (
      <div>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.7, marginBottom: 18 }}>
          {t('questInfoDesc1')}
        </p>
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
        style={{
          width: '100%', maxWidth: 480,
          background: '#0b1120', borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: '24px 20px 28px',
          animation: 'slide-up 0.22s cubic-bezier(0.32,0.72,0,1)',
        }}
      >
        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t(INFO_SLIDES[slide].titleKey)}</span>
            <span style={{ fontSize: 10, color: '#334155', fontWeight: 600 }}>{slide + 1} / {TOTAL}</span>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Slayt içeriği */}
        <div style={{ minHeight: 220, marginBottom: 20 }}>
          {INFO_SLIDES[slide].content(ctx)}
        </div>

        {/* Navigasyon */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setSlide(s => Math.max(0, s - 1))}
            disabled={slide === 0}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)', color: slide === 0 ? '#1e293b' : '#94a3b8', fontSize: 12, fontWeight: 600, cursor: slide === 0 ? 'default' : 'pointer' }}
          >
            {t('back')}
          </button>

          {/* Nokta indikatörü */}
          <div style={{ display: 'flex', gap: 6 }}>
            {Array.from({ length: TOTAL }).map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: i === slide ? 18 : 6, height: 6, borderRadius: 3, border: 'none', padding: 0,
                  background: i === slide ? (i === TOTAL - 1 ? '#ef4444' : '#38bdf8') : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              />
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

  const [rerollOffset,   setRerollOffset]   = useState(0);
  const [forceFriday,    setForceFriday]    = useState(false);
  const [showInfo,       setShowInfo]        = useState(false);
  const [collectedSlots, setCollectedSlots]  = useState(new Set()); // slot_idx'ler
  const [counters,       setCounters]        = useState({ words_typed: 0, editor_minutes: 0, notes_created: 0, solo_docs: 0, memories_added: 0 });
  const [zpFly,          setZpFly]           = useState(null);
  const [rerolling,      setRerolling]       = useState(false);
  const [collecting,     setCollecting]      = useState(null); // collecting slot.id
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
        if ((d.reroll_offset || 0) > 0) setRerollOffset(d.reroll_offset);
      } catch {}
    })();
  }, []);

  // Periyodik sayaç yenileme + Editor'dan gelince race condition için 800ms gecikmeli yenileme
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const r = await axios.get(`${API}/quests/today`, { withCredentials: true });
        setCounters({ words_typed: r.data.words_typed || 0, editor_minutes: r.data.editor_minutes || 0, notes_created: r.data.notes_created || 0, solo_docs: r.data.solo_docs || 0, memories_added: r.data.memories_added || 0 });
      } catch {}
    };
    const delay = setTimeout(fetchCounters, 800); // Editor cleanup fetch'inin tamamlanmasını bekle
    const id = setInterval(fetchCounters, 30000);  // 30s'de bir yenile
    return () => { clearTimeout(delay); clearInterval(id); };
  }, []);

  const { slots, isFriday } = useMemo(
    () => buildDailyQuests(rerollOffset, forceFriday),
    [rerollOffset, forceFriday]
  );

  const realFriday = new Date().getDay() === 5;
  const rerollCost = isFriday ? 600 : 400;

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

  // Topla
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

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        background: 'rgba(5,8,16,0.92)', backdropFilter: 'blur(14px)',
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

        {/* Yenile butonu — CEO ücretsiz, diğerleri 600/900 ZP */}
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

        {/* Bilgi */}
        <button
          onClick={() => setShowInfo(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#334155', display: 'flex', padding: 4 }}
        >
          <Info size={18} />
        </button>

        {/* ZP göstergesi */}
        <div id="daily-zp-badge" style={{ display: 'flex', alignItems: 'center', gap: 5, marginLeft: 2 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" fill="rgba(251,191,36,0.15)" stroke="#fbbf24" strokeWidth="1.2"/>
            <text x="7" y="10.5" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontWeight="800">ZP</text>
          </svg>
          <span style={{ fontSize: 13, color: '#fbbf24', fontWeight: 700 }}>
            {userZP !== null ? userZP.toLocaleString('tr-TR') : '—'}
          </span>
        </div>
      </div>

      {/* İçerik */}
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '28px 16px 80px' }}>

        <WeekProgress />

        {/* Görev kartları */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {slots.map((slot, idx) => {
            const meta       = SHAPE_META[slot.shape];
            const done       = collectedSlots.has(idx);
            const rgb        = meta.rgb;
            const req        = QUEST_REQ[slot.quest.id];
            const current    = req ? (counters[req.field] || 0) : 0;
            const isReady    = req ? (current >= req.threshold) : false;
            const isCollecting = collecting === slot.id;
            const pct        = req ? Math.min(100, Math.round(current / req.threshold * 100)) : 0;
            return (
              <div
                key={slot.id}
                style={{
                  borderRadius: 16,
                  background: done ? 'rgba(74,222,128,0.04)' : `rgba(${rgb},0.06)`,
                  border: `1px solid ${done ? 'rgba(74,222,128,0.25)' : `rgba(${rgb},0.22)`}`,
                  padding: '16px 16px 16px 18px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  opacity: done ? 0.55 : 1,
                  transition: 'opacity 0.3s',
                  position: 'relative', overflow: 'hidden',
                }}
              >
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 16, pointerEvents: 'none',
                  background: done
                    ? 'radial-gradient(circle at 15% 50%, rgba(74,222,128,0.05) 0%, transparent 55%)'
                    : `radial-gradient(circle at 15% 50%, rgba(${rgb},0.07) 0%, transparent 55%)`,
                }} />

                <ShapeIcon shape={slot.shape} size={44} color={meta.stroke} glow={meta.glow} done={done} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: done ? '#4ade80' : isReady ? '#e2e8f0' : '#94a3b8', marginBottom: 3 }}>
                    {slot.quest.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#475569', lineHeight: 1.4 }}>{slot.quest.desc}</div>

                  {/* İlerleme çubuğu */}
                  {req && !done && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: isReady ? '#4ade80' : '#475569', fontWeight: 700 }}>
                          {current.toLocaleString('tr-TR')} / {req.threshold.toLocaleString('tr-TR')} {req.unit}
                        </span>
                        <span style={{ fontSize: 10, color: isReady ? '#4ade80' : '#334155', fontWeight: 600 }}>%{pct}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: 2, transition: 'width 0.4s ease',
                          width: `${pct}%`,
                          background: isReady ? '#4ade80' : meta.stroke,
                        }} />
                      </div>
                    </div>
                  )}

                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99,
                        background: `rgba(${rgb},0.1)`, color: meta.stroke,
                        border: `1px solid rgba(${rgb},0.22)`,
                      }}>
                        +{meta.zp} ZP
                      </span>
                    )}
                    <span style={{ fontSize: 10, color: '#1e293b', fontWeight: 600 }}>{meta.label}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleCollect(slot, idx, e)}
                  disabled={done || !isReady || isCollecting}
                  style={{
                    flexShrink: 0, padding: '9px 18px', borderRadius: 10,
                    border: `1px solid ${done ? 'rgba(74,222,128,0.2)' : isReady ? `rgba(${rgb},0.5)` : 'rgba(255,255,255,0.06)'}`,
                    cursor: (done || !isReady || isCollecting) ? 'default' : 'pointer',
                    background: done ? 'rgba(74,222,128,0.08)' : isReady ? `rgba(${rgb},0.15)` : 'rgba(255,255,255,0.03)',
                    color: done ? '#4ade80' : isReady ? meta.stroke : '#1e293b',
                    fontSize: 12, fontWeight: 700, transition: 'all 0.2s', lineHeight: 1,
                    opacity: isCollecting ? 0.6 : 1,
                  }}
                >
                  {done ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M3 8l4 4 6-6" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : isCollecting ? '...' : isReady ? 'Topla' : 'Kilitli'}
                </button>

                <span style={{ position: 'absolute', top: 8, right: 10, fontSize: 10, color: '#1a2035', fontWeight: 700 }}>#{idx + 1}</span>
              </div>
            );
          })}
        </div>

        {/* ── Cuma Slot Butonu ── */}
        {!isFriday && (
          <div style={{
            borderRadius: 14,
            background: 'rgba(251,191,36,0.04)',
            border: `1px solid ${isCEO ? 'rgba(251,191,36,0.28)' : 'rgba(255,255,255,0.06)'}`,
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
                <Star size={18} fill="rgba(251,191,36,0.3)" stroke="#fbbf24" strokeWidth={1.5} />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="#334155" strokeWidth="1.8"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#334155" strokeWidth="1.8"/>
                </svg>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: isCEO ? '#fbbf24' : '#334155', marginBottom: 2 }}>
                Cuma Bonusu — 5 Slot
              </div>
              <div style={{ fontSize: 11, color: isCEO ? '#92740a' : '#1e293b' }}>
                {isCEO ? '+2 ek slot · garanti yıldız · %2.5 sandık şansı' : 'Cuma günü otomatik açılır'}
              </div>
            </div>

            {isCEO && (
              <button
                onClick={() => { setForceFriday(true); setCollected(new Set()); }}
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

        {/* Yenileme hatası */}
        {rerollErr && (
          <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, textAlign: 'center' }}>
            {rerollErr}
          </div>
        )}

        {/* Sıfırlanma notu */}
        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#1e293b' }}>
          Görevler her gece 00:00'da yenilenir
        </p>
      </div>
    </div>

    {/* Bilgi paneli */}
    {showInfo && <InfoPanel onClose={() => setShowInfo(false)} />}

    {/* ZP animasyonu */}
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
        <span style={{ fontSize: 14, fontWeight: 800, color: '#fbbf24', textShadow: '0 0 8px rgba(251,191,36,0.8)', whiteSpace: 'nowrap' }}>
          {zpFly.label}
        </span>
      </div>
    )}

    <style>{`
      @keyframes daily-zp-fly {
        0%   { opacity: 1; transform: translate(-50%,-50%) scale(1.2); }
        60%  { opacity: 1; }
        100% { opacity: 0; transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty))) scale(0.6); }
      }
      @keyframes slide-up {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }
      @keyframes spin {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }
    `}</style>
    </>
  );
};

export default QuestMap;
