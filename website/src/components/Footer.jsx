import React from 'react';
import { Link } from 'react-router-dom';
import ZetLogoSrc from '../assets/zet-logo.svg';

const APP_URL = 'https://app.zetstudiointl.com';

const LINKS = {
  Ürün: [
    { label: 'Özellikler', href: '/#urunler' },
    { label: 'Fiyatlandırma', href: '/fiyatlandirma' },
    { label: 'İndir', href: '/indir' },
  ],
  Şirket: [
    { label: 'Hakkımızda', href: '/hakkimizda' },
    { label: 'Destek', href: '/destek' },
  ],
  Hukuki: [
    { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
    { label: 'Gizlilik Politikası', href: '/gizlilik-politikasi' },
    { label: 'Çerez Politikası', href: '/cerez-politikasi' },
  ],
};

const ZetLogo = () => (
  <img src={ZetLogoSrc} alt="ZET Studio" height="24" style={{ width: 'auto', filter: 'brightness(0) invert(1)' }} />
);

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      background: 'var(--bg-2)',
      paddingTop: 64,
      paddingBottom: 40,
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.6fr repeat(3, 1fr)',
          gap: 48,
          marginBottom: 56,
        }} className="footer-grid">
          {/* Brand */}
          <div>
            <Link to="/" aria-label="ZET ana sayfa" style={{ display: 'inline-block', marginBottom: 16 }}>
              <ZetLogo />
            </Link>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 240, marginBottom: 24 }}>
              Bilgi yönetimini yeniden tasarlayan AI destekli üretkenlik platformu.
            </p>
            <a href={APP_URL} className="btn btn-primary btn-sm">
              Uygulamayı Dene
            </a>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([col, items]) => (
            <div key={col}>
              <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 16 }}>
                {col}
              </h4>
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {items.map(item => (
                  <li key={item.href}>
                    <Link to={item.href} style={{ fontSize: 14, color: 'var(--text-muted)', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider" style={{ marginBottom: 28 }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            &copy; {new Date().getFullYear()} ZET Studio International. Tüm hakları saklıdır.
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            İstanbul, Türkiye
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .footer-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 540px) {
          .footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  );
}
