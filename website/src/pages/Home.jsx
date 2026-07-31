import React, { useRef, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScrollReveal } from '../hooks/useScrollReveal';

const APP_URL = 'https://app.zetstudiointl.com';

/* ── Scroll reveal section wrapper ──────────────────────────── */
function Reveal({ children, delay = 0, style = {} }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`}
      style={{ transitionDelay: `${delay}s`, ...style }}>
      {children}
    </div>
  );
}

/* ── Hero animated blob bg ──────────────────────────────────── */
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

/* ── Feature card ───────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
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
          cursor: 'default',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'rgba(41,47,145,0.18)',
          border: '1px solid rgba(41,47,145,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 18,
        }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</h3>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7 }}>{desc}</p>
      </div>
    </Reveal>
  );
}

/* ── Plan card ──────────────────────────────────────────────── */
function PlanCard({ name, price, desc, features, highlighted, delay }) {
  return (
    <Reveal delay={delay}>
      <div style={{
        background: highlighted ? 'linear-gradient(160deg, var(--purple) 0%, #1e266e 100%)' : 'var(--bg-card)',
        border: `1px solid ${highlighted ? 'rgba(255,255,255,0.15)' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '32px 28px',
        display: 'flex', flexDirection: 'column', gap: 0,
        position: 'relative',
        boxShadow: highlighted ? '0 0 60px rgba(41,47,145,0.4)' : 'none',
      }}>
        {highlighted && (
          <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)' }}>
            <span className="badge badge-teal">En Popüler</span>
          </div>
        )}
        <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: highlighted ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginBottom: 8 }}>{name}</p>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 8 }}>
          <span style={{ fontSize: 40, fontWeight: 800, lineHeight: 1 }}>{price === 0 ? 'Ücretsiz' : `$${price}`}</span>
          {price > 0 && <span style={{ fontSize: 14, color: highlighted ? 'rgba(255,255,255,0.6)' : 'var(--text-muted)', paddingBottom: 6 }}>/ay</span>}
        </div>
        <p style={{ fontSize: 13, color: highlighted ? 'rgba(255,255,255,0.65)' : 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>{desc}</p>
        <Link to="/fiyatlandirma" className={`btn ${highlighted ? 'btn-teal' : 'btn-secondary'}`} style={{ marginBottom: 28, textAlign: 'center', justifyContent: 'center' }}>
          Başla
        </Link>
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', gap: 10, fontSize: 14, color: highlighted ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}>
              <CheckIcon color={highlighted ? '#4ca8ad' : '#4ca8ad'} />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </Reveal>
  );
}

/* ── SVG icons ──────────────────────────────────────────────── */
const CheckIcon = ({ color = '#4ca8ad' }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: 1 }}>
    <path d="M3 8l4 4 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const FEATURES = [
  {
    title: 'AI Zeta Asistan',
    desc: 'Belgelerini anlayan, soru yanıtlayan, özetler çıkaran ve içerik üreten kişisel AI asistanın.',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="5" stroke="#a0aaff" strokeWidth="1.5"/><path d="M11 2v2M11 18v2M2 11h2M18 11h2" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  },
  {
    title: 'Canvas Editörü',
    desc: 'Kalem, şekil, tablo, grafik, resim ve serbest çizimi tek yerde birleştiren güçlü belge tuvali.',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="7" height="7" rx="2" stroke="#a0aaff" strokeWidth="1.5"/><rect x="12" y="3" width="7" height="7" rx="2" stroke="#a0aaff" strokeWidth="1.5"/><rect x="3" y="12" width="7" height="7" rx="2" stroke="#a0aaff" strokeWidth="1.5"/><rect x="12" y="12" width="7" height="7" rx="2" stroke="#a0aaff" strokeWidth="1.5"/></svg>,
  },
  {
    title: 'Prime Drive',
    desc: "Belgelerini bulutta güvenle sakla ve her cihazdan hızla eriş. 10 GB'a kadar ücretsiz.",
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 14c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4 0-1.8-1.2-3.4-3-3.9A5 5 0 005 11c-1.2.4-2 1.5-1 3z" stroke="#a0aaff" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  },
  {
    title: 'Görev Haritası',
    desc: 'Çalışmak için seni motive eden XP sistemi, sezonluk ranklar ve görev ağacıyla üretkenliği oyunlaştır.',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 17l4.5-8 4 5 3-4 4.5 7" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  },
  {
    title: 'Judge AI',
    desc: 'Tezini, argümanlarını veya yazını analiz edip eleştiren ve güçlü yönleri öne çıkaran ikinci bir yapay zeka.',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M11 3L4 7v4c0 4 3.1 7.7 7 8.9C14.9 18.7 18 15 18 11V7l-7-4z" stroke="#a0aaff" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  },
  {
    title: 'Çoklu Platform',
    desc: 'Web, iOS ve Android uygulamalarıyla her yerden çalış. Veriler anında senkronize edilir.',
    icon: <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="10" height="13" rx="2" stroke="#a0aaff" strokeWidth="1.5"/><path d="M15 8h2a2 2 0 012 2v5a2 2 0 01-2 2h-2" stroke="#a0aaff" strokeWidth="1.5"/></svg>,
  },
];

/* ══════════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 'var(--header-h)', overflow: 'hidden' }}>
        <HeroBlob />
        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center', paddingTop: 60, paddingBottom: 80 }}>
          <div style={{ display: 'inline-flex', marginBottom: 24 }}>
            <span className="badge">Yapay Zeka Destekli Üretkenlik</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 74px)',
            fontWeight: 900,
            lineHeight: 1.08,
            letterSpacing: '-2px',
            marginBottom: 24,
            textWrap: 'balance',
          }}>
            Düşünceni not et,<br />
            <span style={{ color: 'var(--teal)' }}>AI ile</span> dönüştür.
          </h1>
          <p style={{ fontSize: 'clamp(16px, 2vw, 20px)', color: 'var(--text-muted)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            ZET, belgeni anlayan, sana soru soran ve bilgini organize eden AI destekli not ve belge editörü.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={APP_URL} className="btn btn-primary btn-lg">Ücretsiz Başla</a>
            <Link to="/fiyatlandirma" className="btn btn-secondary btn-lg">Planları Gör</Link>
          </div>
          <p style={{ marginTop: 18, fontSize: 13, color: 'var(--text-dim)' }}>Kredi kartı gerekmez · Ücretsiz plan sonsuza kadar</p>

          {/* Dashboard preview */}
          <div style={{
            marginTop: 64,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'var(--bg-card)',
            overflow: 'hidden',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6)',
            maxWidth: 900,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            <div style={{ height: 36, background: 'var(--bg-card-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}>
              {['#ff5f57','#febc2e','#28c840'].map(c => (
                <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />
              ))}
            </div>
            <div style={{ height: 360, background: 'linear-gradient(160deg, #0d1029 0%, #0a0d1a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none"><text x="4" y="24" fontSize="22" fontWeight="900" fill="#fff" fontFamily="DM Sans,sans-serif">Z</text></svg>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>ZET Studio Editörü</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="section" id="urunler">
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto 56px' }}>
            <Reveal>
              <div className="section-label">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="1" width="5" height="5" rx="1" fill="currentColor"/><rect x="1" y="8" width="5" height="5" rx="1" fill="currentColor"/><rect x="8" y="8" width="5" height="5" rx="1" fill="currentColor"/></svg>
                Özellikler
              </div>
              <h2 className="section-title">Üretkenliğini tek platformda topla</h2>
              <p className="section-desc" style={{ margin: '0 auto' }}>
                Not almaktan belge oluşturmaya, AI analizinden görev yönetimine kadar ihtiyacın olan her şey burada.
              </p>
            </Reveal>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} delay={i * 0.07} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ───────────────────────────────────────── */}
      <section className="section">
        <div className="container">
          <Reveal>
            <div style={{
              background: 'linear-gradient(130deg, var(--purple) 0%, #1e266e 60%, #102025 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 'var(--radius)',
              padding: 'clamp(40px, 6vw, 72px) clamp(28px, 6vw, 72px)',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(76,168,173,0.12)', filter: 'blur(60px)' }} />
              <h2 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 16, position: 'relative' }}>
                Hemen ücretsiz başla
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 16, maxWidth: 420, lineHeight: 1.7, marginBottom: 32, position: 'relative' }}>
                Kredi kartı gerekmeden bugün dene. Ücretsiz planla sınırsız süre kullan.
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', position: 'relative' }}>
                <a href={APP_URL} className="btn btn-teal btn-lg">Ücretsiz Hesap Oluştur</a>
                <Link to="/fiyatlandirma" className="btn btn-secondary btn-lg" style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.8)' }}>Planları Karşılaştır</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING PREVIEW ──────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 56px' }}>
            <Reveal>
              <div className="section-label">Fiyatlandırma</div>
              <h2 className="section-title">Seninle büyüyen planlar</h2>
              <p className="section-desc" style={{ margin: '0 auto' }}>
                Bireyden kurumsal takımlara kadar her ihtiyaca uygun plan.
              </p>
            </Reveal>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
            <PlanCard
              name="Starter"
              price={0}
              desc="Kişisel kullanım için yeterli temel özellikler."
              features={['10 belge', '1 GB depolama', 'Zeta AI (sınırlı)', 'Mobil uygulama']}
              delay={0}
            />
            <PlanCard
              name="Plus"
              price={9}
              desc="Bireysel profesyoneller için ideal."
              features={['Sınırsız belge', '10 GB depolama', 'Zeta AI tam erişim', 'Prime Drive', 'Canvas araçları']}
              highlighted
              delay={0.1}
            />
            <PlanCard
              name="Pro"
              price={19}
              desc="Yoğun çalışanlar ve küçük takımlar için."
              features={['Sınırsız depolama', 'Judge AI', 'Öncelikli destek', 'Gelişmiş analitik', 'API erişimi']}
              delay={0.2}
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
