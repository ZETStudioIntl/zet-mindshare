import React, { useState } from 'react';
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

const Check = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M3 8l4 4 6-6" stroke="#4ca8ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const Dash = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M4 8h8" stroke="#4a5580" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    monthly: 0,
    yearly: 0,
    yearlyTotal: 0,
    desc: 'Başlamak için yeterli. Süre sınırı yok.',
    cta: 'Ücretsiz Başla',
    href: APP_URL,
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 9.99,
    yearly: 8.25,
    yearlyTotal: 99,
    desc: 'Bireysel kullanıcılar için tam Mindshare erişimi.',
    cta: 'Plus\'a Geç',
    href: APP_URL,
    highlighted: true,
    zpPrice: '10.000 ZP',
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 19.99,
    yearly: 16.58,
    yearlyTotal: 199,
    desc: 'Yoğun kullanıcılar için gelişmiş özellikler.',
    cta: 'Pro\'ya Geç',
    href: APP_URL,
    zpPrice: '30.000 ZP',
  },
  {
    id: 'creative_station',
    name: 'Creative Station',
    monthly: 49,
    yearly: 40.83,
    yearlyTotal: 490,
    desc: 'Tüm ZET ekosistemi — Mindshare + Judge tam erişim.',
    cta: 'CS\'ye Geç',
    href: APP_URL,
    zpPrice: '50.000 ZP',
  },
];

const ROWS = [
  { category: 'Kredi & Token', features: [
    { label: 'Günlük kredi', free: '80', plus: '250', pro: '500', creative_station: '4.000' },
    { label: 'Günlük token (Zeta + Judge)', free: '100K', plus: '480K', pro: '1,3M', creative_station: '4,8M' },
  ]},
  { category: 'Depolama', features: [
    { label: 'Prime Drive kapasitesi', free: '1 GB', plus: '20 GB', pro: '50 GB', creative_station: '1 TB' },
    { label: 'PDF içe aktarma limiti', free: '20 sayfa', plus: '50 sayfa', pro: '100 sayfa', creative_station: 'Sınırsız' },
  ]},
  { category: 'Editör & Araçlar', features: [
    { label: 'Defter sayısı', free: '1', plus: '10', pro: 'Sınırsız', creative_station: 'Sınırsız' },
    { label: 'Fast Select', free: '3', plus: '5', pro: '8', creative_station: 'Sınırsız' },
    { label: 'Temel editör araçları', free: true, plus: true, pro: true, creative_station: true },
    { label: 'Katmanlar, gradyan, şablonlar', free: false, plus: true, pro: true, creative_station: true },
    { label: 'Grafik, imza, fotoğraf düzenleme', free: false, plus: true, pro: true, creative_station: true },
    { label: 'Sayfa rengi, filigran', free: false, plus: true, pro: true, creative_station: true },
    { label: 'AI görsel üretimi (Nano Banana Pro)', free: false, plus: false, pro: true, creative_station: true },
    { label: 'Filigransız Auto-Write', free: false, plus: false, pro: true, creative_station: true },
  ]},
  { category: 'AI Özellikleri', features: [
    { label: 'Zeta AI asistan', free: true, plus: true, pro: true, creative_station: true },
    { label: 'Judge AI', free: 'Kısıtlı', plus: 'Kısıtlı', pro: 'Kısıtlı', creative_station: 'Tam erişim' },
    { label: 'ElevenLabs TTS', free: 'Günde 1', plus: 'Sınırsız', pro: 'Sınırsız', creative_station: 'Sınırsız' },
  ]},
  { category: 'Sandık & Ödüller', features: [
    { label: 'Günlük sandık şansı', free: false, plus: '%40', pro: '%60', creative_station: '%100 garantili' },
    { label: 'Aylık maks sandık', free: '0', plus: '10', pro: '20', creative_station: '30' },
  ]},
  { category: 'Destek', features: [
    { label: 'Öncelikli destek', free: false, plus: false, pro: true, creative_station: true },
    { label: 'ZP ile satın alma', free: false, plus: '10.000 ZP', pro: '30.000 ZP', creative_station: '50.000 ZP' },
  ]},
];

const renderCell = (val) => {
  if (val === true) return <div style={{ display: 'flex', justifyContent: 'center' }}><Check /></div>;
  if (val === false) return <div style={{ display: 'flex', justifyContent: 'center' }}><Dash /></div>;
  return <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{val}</div>;
};

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <section style={{ padding: '64px 0 48px', textAlign: 'center' }}>
        <div className="container">
          <Reveal>
            <div className="section-label">Fiyatlandırma</div>
            <h1 className="section-title" style={{ maxWidth: 560, margin: '0 auto 16px' }}>İhtiyacına göre seç</h1>
            <p className="section-desc" style={{ margin: '0 auto 16px' }}>
              Kredi kartı gerekmeden başla. ZP kazanarak plan satın alma seçeneği de mevcut.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 36 }}>
              Free, Plus ve Pro planları <strong style={{ color: 'var(--text-muted)' }}>ZET Mindshare</strong>'e aittir. Creative Station tüm ZET ekosistemini kapsar.
            </p>
          </Reveal>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 8px' }}>
            <button onClick={() => setYearly(false)} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: !yearly ? 'var(--purple)' : 'transparent',
              color: !yearly ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s',
            }}>Aylık</button>
            <button onClick={() => setYearly(true)} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: yearly ? 'var(--purple)' : 'transparent',
              color: yearly ? '#fff' : 'var(--text-muted)', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Yıllık
              <span className="badge badge-teal" style={{ fontSize: 11, padding: '2px 8px' }}>Tasarruf Et</span>
            </button>
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 64 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {PLANS.map((plan, i) => {
              const price = yearly ? plan.yearly : plan.monthly;
              return (
                <Reveal key={plan.id} delay={i * 0.07}>
                  <div style={{
                    background: plan.highlighted ? 'linear-gradient(160deg, var(--purple) 0%, #1e266e 100%)' : 'var(--bg-card)',
                    border: `1px solid ${plan.highlighted ? 'rgba(255,255,255,0.18)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius)', padding: '28px 24px',
                    boxShadow: plan.highlighted ? '0 0 60px rgba(41,47,145,0.45)' : 'none',
                    position: 'relative',
                  }}>
                    {plan.highlighted && (
                      <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                        <span className="badge badge-teal">Önerilen</span>
                      </div>
                    )}
                    <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: plan.highlighted ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', marginBottom: 6 }}>{plan.name}</p>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>
                        {price === 0 ? 'Ücretsiz' : `$${price}`}
                      </span>
                      {price > 0 && <span style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.5)' : 'var(--text-dim)', marginLeft: 4 }}>/ay</span>}
                    </div>
                    {yearly && plan.yearlyTotal > 0 && (
                      <p style={{ fontSize: 12, color: '#4ca8ad', marginBottom: 10 }}>Yıllık toplam ${plan.yearlyTotal}</p>
                    )}
                    {plan.zpPrice && !yearly && (
                      <p style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 10 }}>veya {plan.zpPrice}</p>
                    )}
                    <p style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
                    <a href={plan.href} className={`btn ${plan.highlighted ? 'btn-teal' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>{plan.cta}</a>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Karşılaştırma tablosu */}
      <section style={{ paddingBottom: 100 }}>
        <div className="container">
          <Reveal>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Tüm özellikleri karşılaştır</h2>
          </Reveal>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, width: '32%' }}>Özellik</th>
                  {PLANS.map(p => (
                    <th key={p.id} style={{ padding: '14px 12px', textAlign: 'center', fontSize: 13, color: p.highlighted ? '#a0aaff' : 'var(--text-muted)', fontWeight: 700 }}>{p.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(row => (
                  <React.Fragment key={row.category}>
                    <tr>
                      <td colSpan={5} style={{ paddingTop: 28, paddingBottom: 8, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--teal)' }}>
                        {row.category}
                      </td>
                    </tr>
                    {row.features.map(f => (
                      <tr key={f.label} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 0', fontSize: 14, color: 'var(--text-muted)' }}>{f.label}</td>
                        {PLANS.map(p => (
                          <td key={p.id} style={{ padding: '12px' }}>{renderCell(f[p.id])}</td>
                        ))}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
