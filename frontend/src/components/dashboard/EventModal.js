import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Gift, Check } from 'lucide-react';
import { EventSVGIcon } from '../../lib/eventSVGs';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const REWARD_LABELS = {
  zp:          (r) => `${r.amount?.toLocaleString()} ZP`,
  credit:      (r) => `${r.amount} Kredi`,
  case:        ()  => 'Kasa',
  wheel:       ()  => 'Çark',
  mood_unlock: (r) => `${r.mode || ''} Modu`,
};

export default function EventModal({ event, onClose }) {
  const [slideIndex, setSlideIndex] = useState(0);
  const [claimed, setClaimed] = useState(new Set(event.claimed_slide_ids || []));
  const [claiming, setClaiming] = useState(false);
  const [completed, setCompleted] = useState(event.completed || false);

  const slides = event.slides || [];
  const slide = slides[slideIndex];
  const color = event.accent_color || '#4ca8ad';
  const total = slides.length;
  const isFirst = slideIndex === 0;
  const isLast = slideIndex === total - 1;
  const slideClaimed = slide && claimed.has(slide.slide_id);

  const handleClaim = async () => {
    if (!slide || slideClaimed || claiming) return;
    setClaiming(true);
    try {
      const res = await axios.post(
        `${API}/events/${event.event_id}/claim-slide/${slide.slide_id}`,
        {},
        { withCredentials: true }
      );
      const newClaimed = new Set(claimed);
      newClaimed.add(slide.slide_id);
      setClaimed(newClaimed);
      if (res.data.completed) setCompleted(true);
    } catch (e) {
      console.error(e);
    }
    setClaiming(false);
  };

  const handleClose = async () => {
    try {
      await axios.post(`${API}/events/${event.event_id}/seen`, {}, { withCredentials: true });
    } catch {}
    onClose();
  };

  if (!slide) return null;

  const rewardLabel = slide.reward
    ? (REWARD_LABELS[slide.reward.type] || (() => ''))(slide.reward)
    : null;

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          background: 'linear-gradient(160deg, #0d1117 0%, #111827 100%)',
          borderRadius: 24,
          border: `1px solid ${color}40`,
          boxShadow: `0 0 60px ${color}20, 0 24px 48px rgba(0,0,0,0.6)`,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px 12px',
          borderBottom: `1px solid ${color}20`,
          background: `linear-gradient(90deg, ${color}10, transparent)`,
        }}>
          <div>
            <p style={{ fontSize: 11, color: color, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', margin: 0 }}>
              Etkinlik
            </p>
            <p style={{ fontSize: 16, color: '#f1f5f9', fontWeight: 700, margin: '2px 0 0' }}>
              {event.title}
            </p>
          </div>
          <button
            onClick={handleClose}
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 10, padding: 8, cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SVG Area */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '28px 20px 16px',
          background: `radial-gradient(ellipse at center, ${color}12 0%, transparent 70%)`,
          position: 'relative',
          minHeight: 180,
        }}>
          <EventSVGIcon svgKey={slide.svg_key} color={color} size={140} />
        </div>

        {/* Slide Content */}
        <div style={{ padding: '0 24px 8px', textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: '0 0 8px', lineHeight: 1.3 }}>
            {slide.title}
          </h2>
          {slide.body && (
            <p style={{ fontSize: 14, color: '#94a3b8', margin: '0 0 12px', lineHeight: 1.6 }}>
              {slide.body}
            </p>
          )}

          {/* Reward */}
          {rewardLabel && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: slideClaimed ? 'rgba(34,197,94,0.12)' : `${color}15`,
              border: `1px solid ${slideClaimed ? '#22c55e40' : color + '40'}`,
              borderRadius: 12, padding: '8px 16px', marginBottom: 4,
            }}>
              {slideClaimed
                ? <Check size={15} color="#22c55e" />
                : <Gift size={15} color={color} />}
              <span style={{ fontSize: 13, fontWeight: 700, color: slideClaimed ? '#22c55e' : color }}>
                {slideClaimed ? 'Toplandı' : rewardLabel}
              </span>
            </div>
          )}
        </div>

        {/* Claim Button */}
        {slide.reward && !slideClaimed && (
          <div style={{ padding: '8px 24px 4px' }}>
            <button
              onClick={handleClaim}
              disabled={claiming}
              style={{
                width: '100%', padding: '13px', borderRadius: 14, fontWeight: 700,
                fontSize: 15, cursor: claiming ? 'default' : 'pointer',
                background: claiming ? `${color}40` : `linear-gradient(90deg, ${color}, ${color}cc)`,
                color: '#fff', border: 'none',
                transition: 'all 0.2s',
                boxShadow: `0 4px 16px ${color}40`,
              }}
            >
              {claiming ? 'Toplanıyor...' : `Ödülü Topla — ${rewardLabel}`}
            </button>
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 24px 20px', gap: 12 }}>
          <button
            onClick={() => setSlideIndex(i => i - 1)}
            disabled={isFirst}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 12px', cursor: isFirst ? 'default' : 'pointer',
              color: isFirst ? '#334155' : '#94a3b8', display: 'flex', alignItems: 'center',
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dots */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {slides.map((s, i) => (
              <button
                key={i}
                onClick={() => setSlideIndex(i)}
                style={{
                  width: i === slideIndex ? 20 : 8, height: 8,
                  borderRadius: 4, border: 'none', cursor: 'pointer',
                  background: i === slideIndex ? color : (claimed.has(s.slide_id) ? color + '80' : 'rgba(255,255,255,0.15)'),
                  transition: 'all 0.2s',
                  padding: 0,
                }}
              />
            ))}
          </div>

          {isLast ? (
            <button
              onClick={handleClose}
              style={{
                background: completed ? 'rgba(34,197,94,0.15)' : `${color}20`,
                border: `1px solid ${completed ? '#22c55e40' : color + '40'}`,
                borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                color: completed ? '#22c55e' : color, fontWeight: 700, fontSize: 13,
              }}
            >
              {completed ? 'Tamamlandı' : 'Kapat'}
            </button>
          ) : (
            <button
              onClick={() => setSlideIndex(i => i + 1)}
              style={{
                background: `${color}20`, border: `1px solid ${color}40`,
                borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                color: color, display: 'flex', alignItems: 'center',
              }}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ height: 3, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%',
            width: `${((slideIndex + 1) / total) * 100}%`,
            background: color,
            transition: 'width 0.3s ease',
            borderRadius: '0 2px 2px 0',
          }} />
        </div>
      </div>
    </div>
  );
}
