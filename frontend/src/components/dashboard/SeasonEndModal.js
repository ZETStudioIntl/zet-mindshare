import React, { useState } from 'react';
import axios from 'axios';
import ironRankImg    from '../../assets/rank-iron.svg';
import silverRankImg  from '../../assets/rank-silver.svg';
import goldRankImg    from '../../assets/rank-gold.svg';
import diamondRankImg from '../../assets/rank-diamond.svg';
import emeraldRankImg from '../../assets/rank-emerald.svg';
import endlessRankImg from '../../assets/rank-endless.svg';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const RANK_META = {
  iron:    { label: 'Demir',   color: '#9ca3af', img: ironRankImg    },
  silver:  { label: 'Gümüş',  color: '#cdd2d6', img: silverRankImg  },
  gold:    { label: 'Altın',   color: '#ecca66', img: goldRankImg    },
  diamond: { label: 'Elmas',   color: '#818cf8', img: diamondRankImg },
  emerald: { label: 'Zümrüt', color: '#34d399', img: emeraldRankImg },
  endless: { label: 'Endless', color: '#ef4444', img: endlessRankImg },
};

const SeasonEndModal = ({ result, onClose }) => {
  const [slide, setSlide] = useState(0);
  const [dismissing, setDismissing] = useState(false);

  const meta  = RANK_META[result.final_rank] || RANK_META.iron;
  const color = meta.color;

  const totalSecs = result.active_time_seconds || 0;
  const hours     = Math.floor(totalSecs / 3600);
  const minutes   = Math.floor(totalSecs / 60);
  const timeValue = hours >= 1 ? hours   : minutes;
  const timeLabel = hours >= 1 ? 'Saat'  : 'Dakika';

  const handleClose = async () => {
    setDismissing(true);
    try { await axios.post(`${API}/season/my-result/dismiss`, {}, { withCredentials: true }); }
    catch (_) {}
    onClose();
  };

  const SLIDES = [
    // Slide 0 — Rank
    <div key="rank" style={{ minWidth: '100%', padding: '40px 28px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28 }}>
        SEZON SONA ERDİ
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
        <img
          src={meta.img}
          alt={meta.label}
          style={{ width: 130, height: 130, objectFit: 'contain', filter: `drop-shadow(0 0 24px ${color}88)` }}
        />
      </div>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginBottom: 4 }}>Bu sezonu</p>
      <p style={{ fontSize: 42, fontWeight: 900, color, lineHeight: 1.1, marginBottom: 4 }}>{meta.label}</p>
      <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)' }}>rankıyla tamamladın!</p>
    </div>,

    // Slide 1 — Stats
    <div key="stats" style={{ minWidth: '100%', padding: '40px 28px 24px' }}>
      <p style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28, textAlign: 'center' }}>
        SEZON İSTATİSTİKLERİ
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '24px 16px', textAlign: 'center', border: `1px solid ${color}22` }}>
          <p style={{ fontSize: 46, fontWeight: 900, color, lineHeight: 1 }}>{result.duration_days}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>Gün Sürdü</p>
        </div>
        <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '24px 16px', textAlign: 'center', border: `1px solid ${color}22` }}>
          <p style={{ fontSize: 46, fontWeight: 900, color, lineHeight: 1 }}>{timeValue}</p>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>{timeLabel} Harcandı</p>
        </div>
      </div>
      <p style={{ fontSize: 11, color: '#475569', textAlign: 'center' }}>
        {result.season_start} — {result.season_end}
      </p>
    </div>,

    // Slide 2 — Rewards
    <div key="rewards" style={{ minWidth: '100%', padding: '40px 28px 24px', textAlign: 'center' }}>
      <p style={{ fontSize: 10, color, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 28 }}>
        ÖDÜLLER
      </p>
      <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 20, padding: '32px 24px', border: `1px solid ${color}25`, marginBottom: 24 }}>
        <p style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>Hesabınıza eklendi</p>
        <p style={{ fontSize: 60, fontWeight: 900, color, lineHeight: 1 }}>+{result.credits_earned}</p>
        <p style={{ fontSize: 15, color: '#94a3b8', marginTop: 8 }}>Kredi</p>
      </div>
      <button
        onClick={handleClose}
        disabled={dismissing}
        style={{
          width: '100%', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700,
          color: '#0a0f1e', border: 'none', cursor: dismissing ? 'not-allowed' : 'pointer',
          background: `linear-gradient(135deg, ${color}cc, ${color})`,
          opacity: dismissing ? 0.6 : 1,
        }}
      >
        Harika!
      </button>
    </div>,
  ];

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9100, backdropFilter: 'blur(12px)', padding: 16 }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div style={{
        width: '100%', maxWidth: 400, borderRadius: 24,
        background: 'linear-gradient(160deg, #0d1117 0%, #0f1620 100%)',
        border: `1px solid ${color}30`,
        boxShadow: `0 0 100px ${color}20, 0 24px 60px rgba(0,0,0,0.8)`,
        overflow: 'hidden',
      }}>
        {/* Slides */}
        <div style={{ display: 'flex', transition: 'transform 0.45s cubic-bezier(0.4,0,0.2,1)', transform: `translateX(-${slide * 100}%)` }}>
          {SLIDES}
        </div>

        {/* Navigation */}
        <div style={{ padding: '0 28px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <div
                key={i}
                onClick={() => setSlide(i)}
                style={{
                  width: slide === i ? 22 : 8, height: 8, borderRadius: 4,
                  background: slide === i ? color : 'rgba(255,255,255,0.12)',
                  cursor: 'pointer', transition: 'all 0.3s',
                }}
              />
            ))}
          </div>
          {slide < SLIDES.length - 1 && (
            <button
              onClick={() => setSlide(s => s + 1)}
              style={{
                padding: '8px 22px', background: `${color}18`, border: `1px solid ${color}40`,
                borderRadius: 10, color, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              İleri
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonEndModal;
