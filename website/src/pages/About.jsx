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
  {
    name: 'ZET Mindshare',
    logo: '/logo-mindshare.svg',
    desc: 'Akıllı belge editörü. Zeta AI, canvas araçları, Prime Drive ve rank sistemi.',
    features: ['Belge editörü & canvas araçları', 'Zeta AI yazma asistanı', 'Prime Drive bulut depolama', 'Quest haritası & XP sistemi'],
    color: 'rgba(76,168,173,0.15)',
    border: 'rgba(76,168,173,0.3)',
  },
  {
    name: 'ZET Judge',
    logo: '/logo-judge.svg',
    desc: 'İş planı, fikir ve strateji değerlendirmesi için özel geliştirilmiş analitik AI.',
    features: ['İş planı & risk analizi', 'Başarı skoru hesaplama', 'Derin araştırma modu', 'Geçmiş analiz arşivi'],
    color: 'rgba(200,0,90,0.1)',
    border: 'rgba(200,0,90,0.25)',
  },
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {APPS.map((app, i) => (
              <Reveal key={app.name} delay={i * 0.08}>
                <div style={{ padding: '28px 24px', background: 'var(--bg-card)', border: `1px solid ${app.border}`, borderRadius: 'var(--radius)', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: app.color, border: `1px solid ${app.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <img src={app.logo} alt={app.name} style={{ width: 30, height: 30, objectFit: 'contain' }} />
                    </div>
                    <h3 style={{ fontSize: 16, fontWeight: 700 }}>{app.name}</h3>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>{app.desc}</p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {app.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)', flexShrink: 0, opacity: 0.5 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
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
