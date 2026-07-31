import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

const APP_URL = 'https://app.zetstudiointl.com';

function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`}
      style={{ transitionDelay: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

function HeroBlob() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <div style={{
        position: 'absolute', top: '-30%', left: '30%', width: '70vw', height: '70vw',
        maxWidth: 900, maxHeight: 900,
        background: 'radial-gradient(ellipse at center, rgba(41,47,145,0.45) 0%, transparent 70%)',
        animation: 'blobA 14s ease-in-out infinite alternate',
        borderRadius: '60% 40% 50% 60% / 50% 60% 40% 50%',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', right: '20%', width: '50vw', height: '50vw',
        maxWidth: 640, maxHeight: 640,
        background: 'radial-gradient(ellipse at center, rgba(76,168,173,0.2) 0%, transparent 70%)',
        animation: 'blobB 18s ease-in-out infinite alternate',
        borderRadius: '40% 60% 60% 40% / 40% 50% 60% 50%',
      }} />
      <style>{`
        @keyframes blobA { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(-60px, 40px) scale(1.08); } }
        @keyframes blobB { 0% { transform: translate(0,0) scale(1); } 100% { transform: translate(40px, -50px) scale(1.06); } }
      `}</style>
    </div>
  );
}

function AppCard({ name, tag, desc, badge, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Reveal delay={delay}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? 'var(--bg-card-2)' : 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--border-2)' : 'var(--border)'}`,
          borderRadius: 'var(--radius)',
          padding: '28px 28px 24px',
          transition: 'all 0.25s ease',
          transform: hovered ? 'translateY(-4px)' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'rgba(41,47,145,0.2)',
            border: '1px solid rgba(41,47,145,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <text x="2" y="17" fontSize="14" fontWeight="900" fill="#a0aaff" fontFamily="DM Sans,sans-serif">{tag}</text>
            </svg>
          </div>
          {badge && <span className={`badge ${badge === 'Beta' ? 'badge-soon' : ''}`}>{badge}</span>}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{name}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </Reveal>
  );
}

const APPS = [
  {
    tag: 'MS',
    name: 'ZET Mindshare',
    desc: 'Akıllı belge editörü ve not alma platformu. Zeta AI asistanı, canvas araçları ve Prime Drive ile düşüncelerini organize et.',
  },
  {
    tag: 'JD',
    name: 'ZET Judge',
    desc: 'İş planı değerlendirmesi, risk analizi ve AI tabanlı stratejik danışmanlık. Fikirlerini sorgula, kararlarını güçlendir.',
  },
  {
    tag: 'MD',
    name: 'ZET Media',
    desc: 'Bağımsız sosyal medya ve mesajlaşma platformu. Akış, keşfet ve doğrudan mesajlaşma.',
    badge: 'Beta',
  },
];

function PlanCard({ name, price, yearlyPrice, desc, features, highlighted, delay }) {
  return (
    <Reveal delay={delay}>
      <div style={{
        background: highlighted ? 'linear-gradient(160deg, var(--purple) 0%, #1e266e 100%)' : 'var(--bg-card)',
        border: `1px solid ${highlighted ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column',
        position: 'relative',
        boxShadow: highlighted ? '0 0 60px rgba(41,47,145,0.4)' : 'none',
      }}>
        {highlighted && (
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
            <span className="badge badge-teal">Önerilen</span>
          </div>
        )}
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 8 }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1 }}>{price === 0 ? 'Ücretsiz' : `$${price}`}</span>
          {price > 0 && <span style={{ fontSize: 13, color: highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', paddingBottom: 6 }}>/ay</span>}
        </div>
        {yearlyPrice && <p style={{ fontSize: 12, color: '#4ca8ad', marginBottom: 16 }}>Yıllık ${yearlyPrice}/ay</p>}
        <p style={{ fontSize: 13, color: highlighted ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>{desc}</p>
        <Link to="/fiyatlandirma" className={`btn ${highlighted ? 'btn-teal' : 'btn-secondary'}`} style={{ marginBottom: 24, textAlign: 'center', justifyContent: 'center' }}>
          Başla
        </Link>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: highlighted ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
                <path d="M3 8l4 4 6-6" stroke="#4ca8ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

export default function Home() {
  return (
    <div>
      {/* HERO */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 'var(--header-h)', overflow: 'hidden' }}>
        <HeroBlob />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 60, paddingBottom: 80 }}>
          <div style={{ display: 'inline-flex', marginBottom: 24 }}>
            <span className="badge">Yapay Zeka Destekli Ekosistem</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 74px)',
            fontWeight: 900, lineHeight: 1.08,
            letterSpacing: '-2px', marginBottom: 24, textWrap: 'balance',
          }}>
            Düşün, yaz, analiz et.<br />
            <span style={{ color: 'var(--teal)' }}>Hepsi bir yerde.</span>
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-muted)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7 }}>
            ZET; belge editörü, AI danışmanı ve sosyal platform uygulamalarını tek çatı altında toplayan üretkenlik ekosistemi.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={APP_URL} className="btn btn-primary btn-lg">Ücretsiz Başla</a>
            <Link to="/fiyatlandirma" className="btn btn-secondary btn-lg">Planları Gör</Link>
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: 'var(--text-dim)' }}>Kredi kartı gerekmez · Ücretsiz plan sonsuza kadar</p>

          <div style={{
            marginTop: 64,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
            maxWidth: 900, marginLeft: 'auto', marginRight: 'auto',
          }}>
            <div style={{ height: 36, background: 'var(--bg-card-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{ height: 320, background: 'linear-gradient(160deg, #0d1029 0%, #0a0d1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, flexWrap: 'wrap', padding: 32 }}>
              {['Mindshare', 'Judge', 'Media'].map((app, i) => (
                <div key={app} style={{ textAlign: 'center', opacity: i === 0 ? 1 : 0.4 }}>
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <text x="4" y="21" fontSize="14" fontWeight="900" fill="#fff" fontFamily="DM Sans,sans-serif">{app.slice(0,2)}</text>
                    </svg>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 600 }}>ZET {app}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* UYGULAMALAR */}
      <section className="section" id="urunler">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 56px' }}>
            <Reveal>
              <div className="section-label">Uygulamalar</div>
              <h2 className="section-title">Tek hesap, tüm ekosistem</h2>
              <p className="section-desc" style={{ margin: '0 auto' }}>
                ZET hesabınla Mindshare, Judge ve Media uygulamalarına aynı anda erişirsin. Yeni uygulamalar yolda.
              </p>
            </Reveal>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {APPS.map((app, i) => (
              <AppCard key={app.name} {...app} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </section>

      {/* MİNDSHARE ÖZELLİKLERİ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 48px' }}>
            <Reveal>
              <div className="section-label">ZET Mindshare</div>
              <h2 className="section-title">Güçlü bir editörden fazlası</h2>
            </Reveal>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {[
              { title: 'Zeta AI Asistan', desc: 'Belgeni anlayan, soru yanıtlayan, özetler çıkaran ve içerik üreten kişisel AI asistanın.' },
              { title: 'Canvas Editörü', desc: 'Kalem, şekil, tablo, grafik, resim, imza ve serbest çizimi tek belgede birleştir.' },
              { title: 'Prime Drive', desc: 'Dosyalarını bulutta güvenle sakla. Plana göre 1 GB\'dan 1 TB\'a kadar depolama.' },
              { title: 'Rank & Sezon Sistemi', desc: 'Demir\'den Endless\'e uzanan 6 ranklı ilerleme sistemi. Her sezonu kazan.' },
              { title: 'Judge AI', desc: 'İş planlarını, argümanları ve stratejileri eleştiren ve analiz eden ikinci AI.' },
              { title: 'ZP & Kredi Sistemi', desc: 'ZP ile plan satın al, sandık aç, envanter topla. Her gün yenilenen kredi havuzu.' },
            ].map((f, i) => (
              <Reveal key={f.title} delay={i * 0.06}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '22px 20px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <Reveal>
            <div style={{
              background: 'linear-gradient(130deg, var(--purple) 0%, #1e266e 60%, #102025 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius)',
              padding: 'clamp(40px, 6vw, 72px) clamp(28px, 6vw, 72px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(76,168,173,0.12)', filter: 'blur(60px)' }} />
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16, position: 'relative' }}>
                Hemen ücretsiz başla
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, maxWidth: 420, lineHeight: 1.7, marginBottom: 32, position: 'relative' }}>
                Kredi kartı gerekmeden bugün dene. Ücretsiz plan süre sınırı olmadan kullanılabilir.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
                <a href={APP_URL} className="btn btn-teal btn-lg">Ücretsiz Hesap Oluştur</a>
                <Link to="/fiyatlandirma" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>Planları Karşılaştır</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FİYAT ÖNİZLEME */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 56px' }}>
            <Reveal>
              <div className="section-label">Fiyatlandırma</div>
              <h2 className="section-title">İhtiyacına göre büyü</h2>
              <p className="section-desc" style={{ margin: '0 auto' }}>
                Ücretsizden Creative Station'a kadar her seviyeye uygun plan.
              </p>
            </Reveal>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24, maxWidth: 1000, margin: '0 auto' }}>
            <PlanCard
              name="Free"
              price={0}
              desc="Başlamak için her şey mevcut."
              features={['80 kredi/gün', '1 GB Prime Drive', '1 Defter', 'Zeta + Judge AI', 'Temel editör araçları']}
              delay={0}
            />
            <PlanCard
              name="Plus"
              price={9.99}
              yearlyPrice={8.25}
              desc="Bireysel kullanıcılar için tam erişim."
              features={['250 kredi/gün', '20 GB Prime Drive', '10 Defter', 'Tüm editör araçları açık', 'ElevenLabs TTS sınırsız']}
              highlighted
              delay={0.1}
            />
            <PlanCard
              name="Pro"
              price={19.99}
              yearlyPrice={16.58}
              desc="Yoğun kullanıcılar için gelişmiş özellikler."
              features={['500 kredi/gün', '50 GB Prime Drive', 'AI görsel üretimi', 'Filigransız Auto-Write', 'Öncelikli destek']}
              delay={0.2}
            />
            <PlanCard
              name="Creative Station"
              price={49}
              yearlyPrice={40.83}
              desc="Tüm ZET ekosistemi — Mindshare + Judge."
              features={['4.000 kredi/gün', '1 TB Prime Drive', 'Tüm uygulamalar tam erişim', 'Garantili günlük sandık', 'Sınırsız defter ve Fast Select']}
              delay={0.3}
            />
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Link to="/fiyatlandirma" style={{ fontSize: 14, color: 'var(--teal)', textDecoration: 'underline' }}>
              Tüm plan özelliklerini karşılaştır
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
