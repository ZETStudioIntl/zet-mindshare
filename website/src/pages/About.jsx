import React from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const VALUES = [
  { title: 'Kullanıcı önce gelir', desc: 'Her özelliği önce kullanıcı geri bildirimiyle tasarlıyoruz. Şişirilmiş özellik listeleri değil, gerçek ihtiyaçlara yanıt.' },
  { title: 'Gizlilik hakkı', desc: 'Verilerini satmıyoruz. Belgelerini AI eğitiminde kullanmıyoruz. Sana ait olan sende kalır.' },
  { title: 'Hız = saygı', desc: 'Yavaş bir uygulama zamanına saygısızlıktır. Her sürümde performans birinci öncelik.' },
  { title: 'Dürüst fiyatlandırma', desc: 'Gizli ücret yok. ZP kazanarak plan satın alabilirsin. Şeffaf, adil fiyatlandırma.' },
];

const APPS = [
  { name: 'ZET Mindshare', tag: 'MS', desc: 'Akıllı belge editörü. Zeta AI, canvas araçları, Prime Drive ve rank sistemi.' },
  { name: 'ZET Judge', tag: 'JD', desc: 'İş planı değerlendirmesi ve stratejik AI danışmanlığı.' },
];

export default function About() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      {/* Hero */}
      <section style={{ padding: '64px 0 48px' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Reveal>
            <div className="section-label">Hakkımızda</div>
            <h1 className="section-title" style={{ marginBottom: 24 }}>
              Tek hesap.<br />Büyüyen bir ekosistem.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
              ZET Studio International, insanların düşünme, yazma ve karar verme süreçlerini destekleyen yapay zeka destekli uygulamalar geliştiriyor.
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
              ZET Mindshare ile belgelerini yönet, ZET Judge ile fikirlerini sorgula. Tek hesap, tüm ekosisteme erişim.
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Yeni uygulamalar sürekli ekleniyor.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Uygulamalar */}
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
            {APPS.map((app, i) => (
              <Reveal key={app.name} delay={i * 0.08}>
                <div style={{ padding: '24px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(41,47,145,0.2)', border: '1px solid rgba(41,47,145,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <text x="1" y="15" fontSize="12" fontWeight="900" fill="#a0aaff" fontFamily="DM Sans,sans-serif">{app.tag}</text>
                    </svg>
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{app.name}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{app.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Değerler */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div className="section-label">Değerlerimiz</div>
            <h2 className="section-title" style={{ maxWidth: 480, marginBottom: 48 }}>Nasıl çalışıyoruz</h2>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
            {VALUES.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div style={{ padding: '28px 24px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ padding: '48px', background: 'linear-gradient(130deg, var(--bg-card) 0%, var(--bg-card-2) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <Reveal>
              <h2 style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 800, marginBottom: 16 }}>
                ZET ekosistemini keşfet
              </h2>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
                Tek hesapla tüm uygulamalara erişirsin. Ücretsiz planla başla, ihtiyacına göre yükselt.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to="/fiyatlandirma" className="btn btn-primary">Planları Gör</Link>
                <Link to="/destek" className="btn btn-secondary">Destek Al</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
