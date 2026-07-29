import React from 'react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function WarningPopup({ warnings, onDismiss }) {
  if (!warnings || warnings.length === 0) return null;
  const latest = warnings[warnings.length - 1];
  const total = warnings.length;

  const handleDismiss = async () => {
    try { await axios.post(`${API}/me/warnings/read`, {}, { withCredentials: true }); } catch (_) {}
    onDismiss();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#00000060', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'linear-gradient(160deg, #1a1200 0%, #0f0900 100%)',
        border: '1px solid #f59e0b40',
        borderRadius: 20, padding: 32, maxWidth: 440, width: '100%',
        boxShadow: '0 24px 64px #00000080',
        display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center',
      }}>
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="24" stroke="#f59e0b" strokeWidth="2.5" fill="#f59e0b14" />
          <path d="M26 16v14" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
          <circle cx="26" cy="36" r="2" fill="#f59e0b" />
        </svg>

        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fbbf24', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
            Hesap Uyarısı
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 16 }}>
            {Array.from({ length: Math.min(total, 3) }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i < total ? '#f59e0b' : '#f59e0b30',
              }} />
            ))}
          </div>
          <div style={{
            color: '#e2c97e', fontSize: 14, lineHeight: 1.6,
            background: '#f59e0b0a', border: '1px solid #f59e0b20',
            borderRadius: 12, padding: '14px 18px',
          }}>
            {latest.message}
          </div>
        </div>

        <div style={{ color: '#78716c', fontSize: 12, textAlign: 'center' }}>
          {new Date(latest.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>

        <button
          onClick={handleDismiss}
          style={{
            background: '#f59e0b', color: '#0a0600', border: 'none',
            borderRadius: 12, padding: '12px 32px', fontSize: 14, fontWeight: 700,
            cursor: 'pointer', width: '100%',
          }}
        >
          Anladım
        </button>
      </div>
    </div>
  );
}
