import React from 'react';
import { Link } from 'react-router-dom';
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

const RANKS = [
  { name: 'Demir', hours: '0 saat', desc: 'Başlangıç rankı. Her yolculuk buradan başlar.', color: '#7a87b0', rewards: '30 kredi · 50 ZP · 2 çark' },
  { name: 'Gümüş', hours: '40 saat', desc: 'Alışkanlık kazanıyorsun.', color: '#c0c8d8', rewards: '200 kredi · 400 ZP · 2 kasa · 2 çark' },
  { name: 'Altın', hours: '75 saat', desc: 'Kararlılık kendini gösteriyor.', color: '#f4c542', rewards: '500 kredi · 1.000 ZP · 4 kasa · 2 çark' },
  { name: 'Elmas', hours: '130 saat', desc: 'Disiplin artık bir alışkanlık.', color: '#74c6f7', rewards: '800 kredi · 1.600 ZP · 7 kasa · 4 çark' },
  { name: 'Zümrüt', hours: '230 saat', desc: 'Üst düzey bir kullanıcısın.', color: '#4ca8ad', rewards: '1.000 kredi · 2.400 ZP · 10 kasa · 5 çark' },
  { name: 'Endless', hours: '400 saat', desc: 'Maksimum rank. Sınırın ötesinde.', color: '#a0aaff', rewards: '2.000 kredi · 3.000 ZP · 20 kasa · 7 çark · +Zeta paketi' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Aktif çalış', desc: 'ZET Mindshare\'de geçirdiğin aktif kullanım süresi otomatik izlenir.' },
  { step: '02', title: 'Eşiği geç', desc: 'Belirli saat eşiklerini geçtikçe rankın otomatik yükselir.' },
  { step: '03', title: 'Sezon biter', desc: 'Her sezon sonunda bulunduğun ranka göre ödüllerin hesabına yüklenir.' },
  { step: '04', title: 'Ödülü kullan', desc: 'Kredi, ZP, kasa ve çark ödülleri 1 ay geçerlidir. ZP ile plan satın alabilirsin.' },
];

export default function Mizan() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      {/* Hero */}
      <section style={{ position: 'relative', padding: '80px 0 64px', overflow: 'hidden', textAlign: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
          <div style={{ position: 'absolute', top: '-40%', left: '50%', transform: 'translateX(-50%)', width: '60vw', height: '60vw', maxWidth: 700, maxHeight: 700, background: 'radial-gradient(ellipse, rgba(41,47,145,0.4) 0%, transparent 70%)', borderRadius: '50%' }} />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 1 }}>
          <Reveal>
            <div className="section-label">Rank Sistemi</div>
            <h1 className="section-title" style={{ maxWidth: 600, margin: '0 auto 20px' }}>
              Çalıştıkça yükselen bir sistem
            </h1>
            <p className="section-desc" style={{ margin: '0 auto 40px' }}>
              ZET Mindshare'de geçirdiğin aktif kullanım süresi rankına yansır. 6 rank, sezonluk ödüller, kazanılmış ayrıcalıklar.
            </p>
            <a href={APP_URL} className="btn btn-primary btn-lg">Hemen Başla</a>
          </Reveal>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-label" style={{ marginBottom: 14 }}>Nasıl Çalışır?</div>
            <h2 className="section-title" style={{ marginBottom: 48 }}>Aktif kullan, rank kazan</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
            {HOW_IT_WORKS.map((h, i) => (
              <Reveal key={h.step} delay={i * 0.08}>
                <div style={{ padding: '28px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: 'var(--purple-mid)', marginBottom: 14, fontVariantNumeric: 'tabular-nums' }}>{h.step}</p>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{h.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{h.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Ranklar */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-label" style={{ marginBottom: 14 }}>Ranklar</div>
            <h2 className="section-title" style={{ marginBottom: 12 }}>6 rank, 6 hedef</h2>
            <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 48 }}>Sezon ödülleri 1 ay geçerlidir. ZP ile plan satın alabilirsin.</p>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 20 }}>
            {RANKS.map((r, i) => (
              <Reveal key={r.name} delay={i * 0.07}>
                <div style={{
                  padding: '28px 20px',
                  background: 'var(--bg-card)',
                  border: `1px solid ${r.name === 'Endless' ? r.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: r.name === 'Endless' ? `0 0 30px ${r.color}33` : 'none',
                }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${r.color}22`, border: `2px solid ${r.color}`, margin: '0 0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                      <path d="M11 2.5l2 5.8H19l-4.9 3.6 1.9 5.8L11 14.1 6 17.7l1.9-5.8L3 8.3h6z" fill={r.color} />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: r.color, marginBottom: 2 }}>{r.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>{r.hours}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 14 }}>{r.desc}</p>
                  <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                    {r.rewards}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 700 }}>
          <Reveal>
            <div style={{ background: 'linear-gradient(130deg, var(--purple) 0%, #1e266e 100%)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 'var(--radius)', padding: '48px 40px', textAlign: 'center' }}>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 32px)', fontWeight: 800, marginBottom: 16 }}>
                Demir'den başla, Endless'a ulaş.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: 32 }}>
                Her oturum rankına yansır. Her sezon ödülle biter.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <a href={APP_URL} className="btn btn-teal btn-lg">Hesap Oluştur</a>
                <Link to="/fiyatlandirma" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>Planları Gör</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
