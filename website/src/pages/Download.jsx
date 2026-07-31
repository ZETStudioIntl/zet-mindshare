import React from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const APP_URL = 'https://app.zetstudiointl.com';

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const PLATFORMS = [
  {
    id: 'web',
    name: 'Web Uygulaması',
    desc: 'Kurulum gerekmez. Herhangi bir tarayıcıdan ZET\'e eriş. Chrome, Safari, Firefox ve Edge desteklenir.',
    cta: 'Web Uygulamasını Aç',
    href: APP_URL,
    badge: 'Önerilen',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#a0aaff" strokeWidth="1.5"/>
        <ellipse cx="20" cy="20" rx="6" ry="14" stroke="#a0aaff" strokeWidth="1.5"/>
        <path d="M6 20h28M7 13h26M7 27h26" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'ios',
    name: 'iOS',
    desc: 'iPhone ve iPad için optimize edilmiş deneyim. Apple Pencil desteğiyle canvas araçlarını doğal kullan.',
    cta: 'App Store\'dan İndir',
    href: '#',
    badge: 'Çok Yakında',
    badgeClass: 'badge-soon',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="10" y="5" width="20" height="30" rx="4" stroke="#a0aaff" strokeWidth="1.5"/>
        <path d="M16 33h8" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M17 8h6" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'android',
    name: 'Android',
    desc: 'Android telefon ve tabletler için hız odaklı tasarım. Google Play Store\'dan indirin.',
    cta: 'Google Play\'den İndir',
    href: '#',
    badge: 'Çok Yakında',
    badgeClass: 'badge-soon',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M10 28V16a10 10 0 0120 0v12" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="7" y="18" width="4" height="10" rx="2" stroke="#a0aaff" strokeWidth="1.5"/>
        <rect x="29" y="18" width="4" height="10" rx="2" stroke="#a0aaff" strokeWidth="1.5"/>
        <path d="M14 35v-4a2 2 0 014 0v4M22 35v-4a2 2 0 014 0v4" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'mac',
    name: 'macOS',
    desc: 'Apple Silicon ve Intel Mac için native uygulama. Tam offline destek ile internet olmadan da çalış.',
    cta: 'Mac Uygulamasını İndir',
    href: '#',
    badge: 'Çok Yakında',
    badgeClass: 'badge-soon',
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect x="7" y="8" width="26" height="18" rx="3" stroke="#a0aaff" strokeWidth="1.5"/>
        <path d="M14 30h12M20 26v4" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
];

export default function Download() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <section style={{ padding: '64px 0 80px', textAlign: 'center' }}>
        <div className="container">
          <Reveal>
            <div className="section-label">İndir</div>
            <h1 className="section-title" style={{ maxWidth: 540, margin: '0 auto 16px' }}>ZET her yerde seninle</h1>
            <p className="section-desc" style={{ margin: '0 auto 64px' }}>Web, iOS, Android ve masaüstü. Verilerin bulut senkronizasyonuyla anında güncellenir.</p>
          </Reveal>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, textAlign: 'left' }}>
            {PLATFORMS.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.08}>
                <div style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '28px 24px',
                  display: 'flex', flexDirection: 'column', gap: 16,
                  height: '100%',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    {p.icon}
                    <span className={`badge ${p.badgeClass || ''}`}>{p.badge}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{p.name}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{p.desc}</p>
                  </div>
                  <a href={p.href}
                    className={`btn ${p.id === 'web' ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ marginTop: 'auto' }}
                    {...(p.id !== 'web' ? { onClick: e => e.preventDefault(), style: { marginTop: 'auto', opacity: 0.5, cursor: 'not-allowed' } } : {})}
                  >
                    {p.cta}
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div style={{ marginTop: 64, padding: '32px 28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', maxWidth: 640, margin: '64px auto 0' }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Sistem gereksinimleri</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20, textAlign: 'left' }}>
                {[
                  { label: 'Web', value: 'Chrome 90+, Safari 14+, Firefox 88+, Edge 90+' },
                  { label: 'iOS', value: 'iOS 16 ve üzeri (Yakında)' },
                  { label: 'Android', value: 'Android 11 ve üzeri (Yakında)' },
                  { label: 'macOS', value: 'macOS 12 Monterey+ (Yakında)' },
                ].map(r => (
                  <div key={r.label}>
                    <p style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{r.label}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
