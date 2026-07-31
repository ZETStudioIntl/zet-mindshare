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
  { name: 'Aday', xp: '0 XP', desc: 'Yolculuğun başlangıcı.', color: '#7a87b0' },
  { name: 'Çırak', xp: '500 XP', desc: 'İlk adımlar atılıyor.', color: '#6dbf67' },
  { name: 'Usta', xp: '2.000 XP', desc: 'Disiplin kazanılmaya başlandı.', color: '#4ca8ad' },
  { name: 'Bilge', xp: '5.000 XP', desc: 'Derin bilgi ve tutarlılık.', color: '#a0aaff' },
  { name: 'Hakim', xp: '12.000 XP', desc: 'Ustalık zirveye yaklaşıyor.', color: '#f4c542' },
  { name: 'Mizan', xp: '25.000 XP', desc: 'Dengenin ve bilgeliğin sembolü.', color: '#ff7c56' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Belge yaz', desc: 'Her yeni belge ve sayfa XP kazandırır. Düzenli çalışma bonus XP verir.' },
  { step: '02', title: 'Görevleri tamamla', desc: 'Görev Haritası\'ndaki görevleri tamamlayarak büyük XP paketleri kazan.' },
  { step: '03', title: 'Rank yükselt', desc: 'Biriken XP ile rankın yükselir. Her rank yeni avatarlar ve rozet açar.' },
  { step: '04', title: 'Sezon ödülü al', desc: 'Her sezon sonunda rankına göre özel ödüller ve unvanlar verilir.' },
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
            <div className="section-label">Mizan-ı ZET</div>
            <h1 className="section-title" style={{ maxWidth: 600, margin: '0 auto 20px' }}>
              Üretkenliğini bir oyuna dönüştür
            </h1>
            <p className="section-desc" style={{ margin: '0 auto 40px' }}>
              Mizan-ı ZET, çalışmalarını anlayan ve takip eden bir ilerleme sistemidir. Yaz, öğren, büyü — her adım sana geri döner.
            </p>
            <a href={APP_URL} className="btn btn-primary btn-lg">Sisteme Katıl</a>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-label" style={{ marginBottom: 14 }}>Nasıl Çalışır?</div>
            <h2 className="section-title" style={{ marginBottom: 48 }}>Dört adımda üst ranka ulaş</h2>
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

      {/* Ranks */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div className="section-label" style={{ marginBottom: 14 }}>Ranklar</div>
            <h2 className="section-title" style={{ marginBottom: 48 }}>Hangi seviyedesin?</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 20 }}>
            {RANKS.map((r, i) => (
              <Reveal key={r.name} delay={i * 0.07}>
                <div style={{
                  padding: '28px 20px', textAlign: 'center',
                  background: 'var(--bg-card)',
                  border: `1px solid ${r.name === 'Mizan' ? r.color : 'var(--border)'}`,
                  borderRadius: 'var(--radius)',
                  boxShadow: r.name === 'Mizan' ? `0 0 30px ${r.color}33` : 'none',
                }}>
                  <div style={{ width: 52, height: 52, borderRadius: '50%', background: `${r.color}22`, border: `2px solid ${r.color}`, margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 3l2.2 6.4H21l-5.6 4 2.2 6.4L12 16l-5.6 3.8 2.2-6.4L3 9.4h6.8z" fill={r.color} />
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: r.color, marginBottom: 4 }}>{r.name}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-dim)', fontWeight: 700, fontVariantNumeric: 'tabular-nums', marginBottom: 8 }}>{r.xp}</p>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{r.desc}</p>
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
                Bugün "Aday" olarak başla,<br />bir gün "Mizan"a ulaş.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, marginBottom: 32 }}>
                Her belge, her not, her görev seni ileriye taşır.
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
