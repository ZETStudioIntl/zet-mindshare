import React, { useState } from 'react';
import { useScrollReveal } from '../hooks/useScrollReveal';

const SUPPORT_EMAIL = 'help@zetstudiointl.com';

function Reveal({ children, delay = 0 }) {
  const [ref, visible] = useScrollReveal();
  return (
    <div ref={ref} className={`reveal${visible ? ' visible' : ''}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const FAQS = [
  {
    q: 'Ücretsiz plan ne kadar süre geçerli?',
    a: 'Ücretsiz plan sonsuza kadar geçerlidir. Herhangi bir süre kısıtlaması yoktur. İstediğin zaman ücretli bir plana geçebilirsin.',
  },
  {
    q: 'Verilerimi başka bir platforma taşıyabilir miyim?',
    a: 'Evet. Belgelerini PDF olarak dışa aktarabilir ya da JSON formatında tüm verileri indirebilirsin.',
  },
  {
    q: 'Aboneliğimi iptal etmek istesem ne olur?',
    a: 'İptal ettiğinde mevcut dönem sonuna kadar planın aktif kalır. Dönem bitince ücretsiz plana geçersin. Verilerine erişimini kaybetmezsin.',
  },
  {
    q: 'Belgelerim güvende mi?',
    a: 'Evet. Belgeler Cloudflare R2 üzerinde şifreli olarak saklanır. Verilerini üçüncü taraflarla paylaşmıyor, AI eğitiminde kullanmıyoruz.',
  },
  {
    q: 'Zeta AI hangi dilleri destekliyor?',
    a: 'Zeta, Türkçe dahil 10 dilde yanıt verebilir. Uygulama dili ile AI dili birbirinden bağımsız ayarlanabilir.',
  },
  {
    q: 'Fatura nereden alınır?',
    a: 'Ücretli aboneliklerde ödeme sonrası Paddle üzerinden otomatik fatura e-posta adresine gönderilir.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', textAlign: 'left', padding: '18px 0',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        background: 'transparent', color: 'var(--text)', fontSize: 15, fontWeight: 600,
        cursor: 'pointer',
      }}>
        {q}
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, transition: 'transform 0.25s', transform: open ? 'rotate(180deg)' : 'none' }}>
          <path d="M4 7l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.3s ease' }}>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.8, paddingBottom: 18 }}>{a}</p>
      </div>
    </div>
  );
}

export default function Support() {
  return (
    <div style={{ paddingTop: 'var(--header-h)' }}>
      <section style={{ padding: '64px 0 80px' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 64px' }}>
            <Reveal>
              <div className="section-label">Destek</div>
              <h1 className="section-title">Sana nasıl yardımcı olabiliriz?</h1>
              <p className="section-desc" style={{ margin: '0 auto' }}>
                Sorularına hızlı yanıt almak için aşağıdaki seçenekleri kullanabilirsin.
              </p>
            </Reveal>
          </div>

          {/* Contact cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20, maxWidth: 860, margin: '0 auto 72px' }}>
            {[
              {
                title: 'E-posta Desteği',
                desc: 'Teknik sorunlar, hesap yönetimi ve fatura sorularında doğrudan destek ekibimize yazın.',
                cta: 'E-posta Gönder',
                href: `mailto:${SUPPORT_EMAIL}`,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#a0aaff" strokeWidth="1.5"/><path d="M3 9l9 6 9-6" stroke="#a0aaff" strokeWidth="1.5" strokeLinecap="round"/></svg>
                ),
              },
              {
                title: 'Özellik Talebi',
                desc: 'Eksik bir özellik mi gördün? Fikirlerini paylaş, en çok istenenler yol haritamıza giriyor.',
                cta: 'Talep Gönder',
                href: `mailto:${SUPPORT_EMAIL}?subject=Özellik Talebi`,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3l2.5 5.5L21 9.5l-4.5 4.5 1.5 6.5L12 17.5 6 20.5l1.5-6.5L3 9.5l6.5-1z" stroke="#a0aaff" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                ),
              },
              {
                title: 'Hata Bildirimi',
                desc: 'Bir hata veya beklenmedik davranış mı keşfettin? Bize anlat, en kısa sürede düzelteceğiz.',
                cta: 'Hata Bildir',
                href: `mailto:${SUPPORT_EMAIL}?subject=Hata Bildirimi`,
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 8v4M12 16h.01" stroke="#a0aaff" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="12" r="9" stroke="#a0aaff" strokeWidth="1.5"/></svg>
                ),
              },
            ].map((c, i) => (
              <Reveal key={c.title} delay={i * 0.08}>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(41,47,145,0.18)', border: '1px solid rgba(41,47,145,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.icon}
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 700 }}>{c.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.7, flex: 1 }}>{c.desc}</p>
                  <a href={c.href} className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }}>{c.cta}</a>
                </div>
              </Reveal>
            ))}
          </div>

          {/* FAQ */}
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <Reveal>
              <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Sıkça sorulan sorular</h2>
              <p style={{ fontSize: 15, color: 'var(--text-muted)', marginBottom: 36 }}>Cevabını bulamazsan <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: 'var(--teal)' }}>{SUPPORT_EMAIL}</a> adresine yazabilirsin.</p>
            </Reveal>
            {FAQS.map(f => (
              <FAQItem key={f.q} {...f} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
