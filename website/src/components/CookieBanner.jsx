import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'zet_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => { localStorage.setItem(STORAGE_KEY, 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem(STORAGE_KEY, 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <div className="cookie-banner" style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      zIndex: 200,
      width: 'min(560px, calc(100vw - 32px))',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-2)',
      borderRadius: 'var(--radius)',
      padding: '20px 24px',
      display: 'flex', alignItems: 'flex-start', gap: 16,
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.35s cubic-bezier(0.22,1,0.36,1)',
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 14, color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}>
          Bu site çerez kullanır
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
          Deneyimini geliştirmek için çerezler ve benzer teknolojiler kullanıyoruz.{' '}
          <Link to="/cerez-politikasi" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
            Çerez politikamızı
          </Link>{' '}
          okuyabilirsin.
        </p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignSelf: 'center' }}>
        <button onClick={decline} className="btn btn-secondary btn-sm">Reddet</button>
        <button onClick={accept} className="btn btn-primary btn-sm">Kabul Et</button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @media (max-width: 500px) {
          .cookie-banner { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
