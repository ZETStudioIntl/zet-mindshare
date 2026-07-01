import React, { useEffect, useState } from 'react';

export default function QuestNotification({ quest, onClose }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!quest) { setVisible(false); return; }
    setVisible(true);
    const t = setTimeout(() => { setVisible(false); setTimeout(onClose, 350); }, 4000);
    return () => clearTimeout(t);
  }, [quest, onClose]);

  if (!quest) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: visible ? 16 : -120,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        transition: 'top 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        background: 'linear-gradient(135deg, #0a1628, #1a2a4a)',
        border: '1px solid rgba(251,191,36,0.5)',
        borderRadius: 16,
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.12)',
        minWidth: 280,
        maxWidth: 360,
        pointerEvents: 'none',
      }}
    >
      {/* Animated star icon */}
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: 'rgba(251,191,36,0.12)',
        border: '1px solid rgba(251,191,36,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        animation: 'quest-pulse 1.2s ease-in-out infinite',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="#fbbf24">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
        </svg>
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, color: '#fbbf24', fontWeight: 700, letterSpacing: '0.05em', marginBottom: 2 }}>
          GÖREV TAMAMLANDI
        </div>
        <div style={{ fontSize: 13, color: '#e2e8f0', fontWeight: 600, marginBottom: 3 }}>
          {quest.name}
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8' }}>
          +{quest.zp} ZP • Görev haritasından toplayın
        </div>
      </div>
      <style>{`
        @keyframes quest-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(251,191,36,0.3); }
          50% { box-shadow: 0 0 0 8px rgba(251,191,36,0); }
        }
      `}</style>
    </div>
  );
}
