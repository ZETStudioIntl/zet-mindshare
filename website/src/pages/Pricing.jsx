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

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M3 8l4 4 6-6" stroke="#4ca8ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const DashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M4 8h8" stroke="#4a5580" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    monthly: 0,
    yearly: 0,
    desc: 'Kişisel kullanım ve ZET ile tanışmak için.',
    cta: 'Ücretsiz Başla',
    href: APP_URL,
  },
  {
    id: 'plus',
    name: 'Plus',
    monthly: 9,
    yearly: 7,
    desc: 'Bireysel profesyoneller ve öğrenciler için.',
    cta: 'Plus\'a Geç',
    href: APP_URL,
    highlighted: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    monthly: 19,
    yearly: 15,
    desc: 'Yoğun kullanıcılar ve küçük takımlar için.',
    cta: 'Pro\'ya Geç',
    href: APP_URL,
  },
  {
    id: 'creative_station',
    name: 'Creative Station',
    monthly: 39,
    yearly: 30,
    desc: 'Tasarımcılar ve içerik üreticileri için eksiksiz paket.',
    cta: 'CS\'ye Geç',
    href: APP_URL,
  },
];

const ROWS = [
  { category: 'Belge & Editör', features: [
    { label: 'Belge sayısı', starter: '10', plus: 'Sınırsız', pro: 'Sınırsız', creative_station: 'Sınırsız' },
    { label: 'Sayfa boyutu seçenekleri', starter: true, plus: true, pro: true, creative_station: true },
    { label: 'Canvas araçları (kalem, şekil, tablo…)', starter: false, plus: true, pro: true, creative_station: true },
    { label: 'Grafik editörü', starter: false, plus: true, pro: true, creative_station: true },
    { label: 'Header / Footer', starter: false, plus: true, pro: true, creative_station: true },
    { label: 'Filigran', starter: false, plus: true, pro: true, creative_station: true },
    { label: 'PDF dışa aktarma', starter: true, plus: true, pro: true, creative_station: true },
  ]},
  { category: 'Depolama', features: [
    { label: 'Prime Drive kapasitesi', starter: '1 GB', plus: '10 GB', pro: '50 GB', creative_station: '200 GB' },
    { label: 'Dosya yükleme boyutu', starter: '5 MB', plus: '50 MB', pro: '200 MB', creative_station: '500 MB' },
  ]},
  { category: 'AI Özellikleri', features: [
    { label: 'Zeta AI asistan', starter: 'Günde 10', plus: 'Sınırsız', pro: 'Sınırsız', creative_station: 'Sınırsız' },
    { label: 'Judge AI analizi', starter: false, plus: false, pro: true, creative_station: true },
    { label: 'AI görsel oluşturma (Zeta Colors)', starter: false, plus: false, pro: true, creative_station: true },
    { label: 'AI fotoğraf düzenleme', starter: false, plus: false, pro: false, creative_station: true },
    { label: 'Sesli AI (TTS + STT)', starter: false, plus: true, pro: true, creative_station: true },
  ]},
  { category: 'Platform', features: [
    { label: 'Mobil uygulama', starter: true, plus: true, pro: true, creative_station: true },
    { label: 'Görev Haritası & XP sistemi', starter: true, plus: true, pro: true, creative_station: true },
    { label: 'Öncelikli destek', starter: false, plus: false, pro: true, creative_station: true },
    { label: 'API erişimi', starter: false, plus: false, pro: true, creative_station: true },
  ]},
];

const renderCell = (val) => {
  if (val === true) return <CheckIcon />;
  if (val === false) return <DashIcon />;
  return <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{val}</span>;
};

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      {/* Header */}
      <section style={{ padding: '64px 0 48px', textAlign: 'center' }}>
        <div className="container">
          <Reveal>
            <div className="section-label">Fiyatlandırma</div>
            <h1 className="section-title" style={{ maxWidth: 560, margin: '0 auto 16px' }}>Sana uygun planı seç</h1>
            <p className="section-desc" style={{ margin: '0 auto 36px' }}>Kredi kartı gerekmeden başla. İstediğin zaman yükselt veya iptal et.</p>
          </Reveal>
          {/* Toggle */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 99, padding: '6px 8px' }}>
            <button onClick={() => setYearly(false)} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: !yearly ? 'var(--purple)' : 'transparent',
              color: !yearly ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}>Aylık</button>
            <button onClick={() => setYearly(true)} style={{
              padding: '8px 20px', borderRadius: 99, fontSize: 14, fontWeight: 600,
              background: yearly ? 'var(--purple)' : 'transparent',
              color: yearly ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              Yıllık
              <span className="badge badge-teal" style={{ fontSize: 11, padding: '2px 8px' }}>%30 İndirim</span>
            </button>
          </div>
        </div>
      </section>

      {/* Plan cards */}
      <section style={{ paddingBottom: 64 }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 20 }}>
            {PLANS.map((plan, i) => (
              <Reveal key={plan.id} delay={i * 0.07}>
                <div style={{
                  background: plan.highlighted ? 'linear-gradient(160deg, var(--purple) 0%, #1e266e 100%)' : 'var(--bg-card)',
                  border: `1px solid ${plan.highlighted ? 'rgba(255,255,255,0.18)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  padding: '28px 24px',
                  boxShadow: plan.highlighted ? '0 0 60px rgba(41,47,145,0.45)' : 'none',
                  position: 'relative',
                }}>
                  {plan.highlighted && (
                    <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
                      <span className="badge badge-teal">En Popüler</span>
                    </div>
                  )}
                  <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: plan.highlighted ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', marginBottom: 6 }}>{plan.name}</p>
                  <div style={{ marginBottom: 8 }}>
                    <span style={{ fontSize: 38, fontWeight: 800, lineHeight: 1 }}>
                      {(yearly ? plan.yearly : plan.monthly) === 0 ? 'Ücretsiz' : `$${yearly ? plan.yearly : plan.monthly}`}
                    </span>
                    {(yearly ? plan.yearly : plan.monthly) > 0 && (
                      <span style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.5)' : 'var(--text-dim)', marginLeft: 4 }}>/ay</span>
                    )}
                  </div>
                  {yearly && plan.monthly > 0 && (
                    <p style={{ fontSize: 12, color: '#4ca8ad', marginBottom: 10 }}>
                      Yıllık ${plan.yearly * 12} yerine ${plan.monthly * 12}
                    </p>
                  )}
                  <p style={{ fontSize: 13, color: plan.highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', lineHeight: 1.6, marginBottom: 24 }}>{plan.desc}</p>
                  <a href={plan.href} className={`btn ${plan.highlighted ? 'btn-teal' : 'btn-secondary'}`} style={{ width: '100%', justifyContent: 'center' }}>{plan.cta}</a>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <section style={{ paddingBottom: 100 }}>
        <div className="container">
          <Reveal>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 32 }}>Tüm özellikleri karşılaştır</h2>
          </Reveal>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 0', textAlign: 'left', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, width: '30%' }}>Özellik</th>
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
                          <td key={p.id} style={{ padding: '12px', textAlign: 'center', display: 'flex' === 'none' ? 'none' : undefined }}>
                            <div style={{ display: 'flex', justifyContent: 'center' }}>{renderCell(f[p.id])}</div>
                          </td>
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
