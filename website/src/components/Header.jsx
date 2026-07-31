import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const APP_URL = 'https://app.zetstudiointl.com';

const ZetLogo = () => (
  <svg width="88" height="28" viewBox="0 0 88 28" fill="none">
    <text x="0" y="22" fontSize="22" fontWeight="800" fill="#ffffff" fontFamily="DM Sans, sans-serif" letterSpacing="-1">ZET</text>
    <rect x="52" y="8" width="4" height="4" rx="1" fill="#4ca8ad" />
  </svg>
);

const NAV_LINKS = [
  { label: 'Ürünler', href: '/#urunler' },
  { label: 'Fiyatlandırma', href: '/fiyatlandirma' },
  { label: 'İndir', href: '/indir' },
  { label: 'Hakkımızda', href: '/hakkimizda' },
  { label: 'Destek', href: '/destek' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        height: 'var(--header-h)',
        display: 'flex', alignItems: 'center',
        background: scrolled ? 'rgba(7,9,22,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/" aria-label="ZET ana sayfa">
            <ZetLogo />
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
            {NAV_LINKS.map(l => (
              <Link key={l.href} to={l.href} style={{
                padding: '8px 14px', fontSize: 14, fontWeight: 500,
                color: pathname === l.href ? '#fff' : 'var(--text-muted)',
                borderRadius: 'var(--radius-xs)',
                transition: 'color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color='#fff'; e.currentTarget.style.background='rgba(255,255,255,0.05)'; }}
              onMouseLeave={e => { e.currentTarget.style.color=pathname===l.href?'#fff':'var(--text-muted)'; e.currentTarget.style.background='transparent'; }}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <a href={`${APP_URL}/login`} className="btn btn-secondary btn-sm desktop-nav">Giriş Yap</a>
            <a href={APP_URL} className="btn btn-primary btn-sm">Uygulamaya Git</a>
            <button
              aria-label={menuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
              onClick={() => setMenuOpen(v => !v)}
              className="mobile-menu-btn"
              style={{ display: 'none', flexDirection: 'column', gap: 5, padding: 8, background: 'transparent', cursor: 'pointer' }}
            >
              <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(7px)' : 'none', display: 'block' }} />
              <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', opacity: menuOpen ? 0 : 1, display: 'block' }} />
              <span style={{ width: 22, height: 2, background: '#fff', borderRadius: 2, transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-7px)' : 'none', display: 'block' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99,
        background: 'rgba(7,9,22,0.97)',
        backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column',
        padding: '100px 32px 48px',
        gap: 4,
        opacity: menuOpen ? 1 : 0,
        pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'opacity 0.25s ease',
      }} className="mobile-menu">
        {NAV_LINKS.map((l, i) => (
          <Link key={l.href} to={l.href} style={{
            fontSize: 26, fontWeight: 700, color: 'var(--text)',
            padding: '14px 0', borderBottom: '1px solid var(--border)',
            transition: 'color 0.2s',
            animationDelay: `${i * 0.05}s`,
          }}
          onMouseEnter={e => e.currentTarget.style.color='var(--teal)'}
          onMouseLeave={e => e.currentTarget.style.color='var(--text)'}
          >
            {l.label}
          </Link>
        ))}
        <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap' }}>
          <a href={`${APP_URL}/login`} className="btn btn-secondary">Giriş Yap</a>
          <a href={APP_URL} className="btn btn-primary">Uygulamaya Git</a>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </>
  );
}
