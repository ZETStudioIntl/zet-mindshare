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
  {
    title: 'Kullanıcı önce gelir',
    desc: 'Her özelliği önce kullanıcı geri bildirimiyle tasarlıyoruz. Şişirilmiş özellik listeleri değil, gerçek ihtiyaçlara yanıt.',
  },
  {
    title: 'Gizlilik hakkı',
    desc: 'Verilerini satmıyoruz. Belgelerini AI eğitiminde kullanmıyoruz. Sana ait olan sende kalır.',
  },
  {
    title: 'Hız = saygı',
    desc: 'Yavaş bir uygulama zamanına saygısızlıktır. Her sürümde performans bir öncelik, sonradan eklenecek bir detay değil.',
  },
  {
    title: 'Dürüst fiyatlandırma',
    desc: 'Gizli ücret yok, yanıltıcı "ücretsiz" katmanı yok. Ne ödediğini ve ne aldığını açık söylüyoruz.',
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
              Bilgiyi düzenli tutmak<br />zor olmamalı.
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
              ZET Studio International, bir not defterinin sadeliğini bir doküman editörünün gücüyle birleştirmek üzere kuruldu. Zet, Türkçe'de "özet"ten geliyor — ana fikri, özü, en değerli kısmı ifade ediyor.
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: 20 }}>
              Bir öğrencinin ders notları, bir araştırmacının gözlemleri, bir girişimcinin fikir akışı — hepsi farklı biçimlerde ama aynı ihtiyaçla: düşünceyi kaybetmeden yakalamak, daha sonra bulmak, başkasına iletmek.
            </p>
            <p style={{ fontSize: 18, color: 'var(--text-muted)', lineHeight: 1.8 }}>
              Yapay zeka bu sürecin ortağı olabilir — sana yazan değil, senin yazdığını anlayan bir asistan.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Stats */}
      <section style={{ padding: '48px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 32 }}>
            {[
              { num: '2024', label: 'Kuruluş yılı' },
              { num: '10+', label: 'Dil desteği' },
              { num: 'Web + Mobil', label: 'Platform' },
              { num: 'İstanbul', label: 'Şehir' },
            ].map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{s.num}</p>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>{s.label}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
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

      {/* Mission */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ padding: '48px', background: 'linear-gradient(130deg, var(--bg-card) 0%, var(--bg-card-2) 100%)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
            <Reveal>
              <div className="section-label">Misyonumuz</div>
              <blockquote style={{ fontSize: 'clamp(18px, 2.5vw, 24px)', fontWeight: 700, lineHeight: 1.5, color: 'var(--text)', marginBottom: 24, fontStyle: 'italic' }}>
                "Her insanın bilgi birikimini daha kolay organize etmesini, daha verimli paylaşmasını ve yapay zeka ile daha derin düşünmesini sağlamak."
              </blockquote>
            </Reveal>
            <Reveal delay={0.1}>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to="/fiyatlandirma" className="btn btn-primary">Hemen Başla</Link>
                <Link to="/destek" className="btn btn-secondary">Destek Al</Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
