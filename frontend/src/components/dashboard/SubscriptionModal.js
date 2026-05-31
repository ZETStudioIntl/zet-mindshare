import React, { useState } from 'react';
import { X, Star, Check, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';

const PLAN_SLIDES = {
  free: [
    {
      title: 'Ücretsiz başla, her zaman kullan',
      desc: 'Kredi kartı gerekmez. Hesap aç, hemen kullanmaya başla. Temel özellikler sonsuza kadar ücretsiz.',
      visual: 'ai',
      bg: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      accent: '#6b7280',
    },
    {
      title: 'Notlarınızı defterde toplayın',
      desc: 'Bir deftere kadar organize edin, her şeyi tek yerde tutun — belgeleriniz buluta otomatik kaydedilir.',
      visual: 'notebook',
      bg: 'linear-gradient(135deg, #1a2035 0%, #0f172a 100%)',
      accent: '#6b7280',
    },
    {
      title: 'Zeta ile anında içerik üretin',
      desc: 'Günde 80 kredi ve 100K token ile AI destekli belgeler, görseller ve içerikler oluşturun.',
      visual: 'ai',
      bg: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
      accent: '#3b82f6',
    },
    {
      title: 'Güçlü editör araçları',
      desc: 'Kalem, metin, şekil, tablo, emoji — profesyonel belgeler oluşturmak için ihtiyacınız olan her şey elinizin altında.',
      visual: 'tools',
      bg: 'linear-gradient(135deg, #1a1f3e 0%, #0f172a 100%)',
      accent: '#8b5cf6',
    },
    {
      title: 'Judge ile akıllı sohbet',
      desc: 'AI asistanınız Judge ile sorularınızı yanıtlayın, belgelerinizi analiz ettirin ve daha verimli çalışın.',
      visual: 'judge',
      bg: 'linear-gradient(135deg, #12172e 0%, #0f172a 100%)',
      accent: '#6b7280',
    },
  ],
  plus: [
    {
      title: '10 defter ile kontrol sizde',
      desc: 'Tüm projelerinizi, fikirlerinizi ve belgelerinizi ayrı defterlerde düzenli tutun.',
      visual: 'notebooks',
      bg: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
      accent: '#3b82f6',
    },
    {
      title: 'Tüm editör araçları açık',
      desc: 'Katmanlar, gradyan renkler, şablonlar, filigran, imza — hiçbir kısıtlama olmadan tasarlayın.',
      visual: 'unlock',
      bg: 'linear-gradient(135deg, #0c3547 0%, #0f172a 100%)',
      accent: '#06b6d4',
    },
    {
      title: 'Judge Aziz ile derin analiz',
      desc: 'En güçlü Judge modeliyle iş planlarınızı, projelerinizi ve stratejilerinizi analiz ettirin.',
      visual: 'judge',
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      accent: '#6366f1',
    },
    {
      title: '20GB Prime Drive',
      desc: 'Belgelerinizi ve dosyalarınızı bulutta güvende saklayın, her yerden erişin.',
      visual: 'drive',
      bg: 'linear-gradient(135deg, #0f3460 0%, #0f172a 100%)',
      accent: '#3b82f6',
    },
    {
      title: 'Sınırsız ElevenLabs TTS',
      desc: 'Metinlerinizi gerçekçi seslerle dinleyin. Çalışırken, dinlenirken — notlarınız her an kulağınızda.',
      visual: 'support',
      bg: 'linear-gradient(135deg, #0a2540 0%, #0f172a 100%)',
      accent: '#06b6d4',
    },
  ],
  pro: [
    {
      title: 'Nano Banana Pro',
      desc: 'Sinema kalitesinde AI görseller üretin. Film formatları, ultra detay, profesyonel çıktı.',
      visual: 'cinema',
      bg: 'linear-gradient(135deg, #2e1065 0%, #0f172a 100%)',
      accent: '#8b5cf6',
    },
    {
      title: 'Filigransız profesyonel belgeler',
      desc: 'Auto-Write ile ürettiğiniz belgeler tamamen temiz — hiçbir logo veya filigran yok.',
      visual: 'clean',
      bg: 'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
      accent: '#a78bfa',
    },
    {
      title: '50GB Prime Drive',
      desc: 'Geniş depolama alanı ile büyük projelerinizi, yüksek çözünürlüklü görsellerinizi saklayın.',
      visual: 'storage',
      bg: 'linear-gradient(135deg, #3b0764 0%, #0f172a 100%)',
      accent: '#7c3aed',
    },
    {
      title: '%60 Sandık Şansı',
      desc: 'Her gün %60 ihtimalle sandık kazanın, aylık 20 adede kadar. XP, kredi ve ödüller sizi bekliyor.',
      visual: 'chest',
      bg: 'linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)',
      accent: '#c084fc',
    },
    {
      title: 'Fotoğraf Düzenleme AI',
      desc: 'Görsellerinizi AI ile dönüştürün: stil transferi, arka plan değiştirme, renk optimizasyonu ve daha fazlası.',
      visual: 'cinema',
      bg: 'linear-gradient(135deg, #2d1b69 0%, #0f172a 100%)',
      accent: '#7c3aed',
    },
  ],
  creative_station: [
    {
      title: '1TB Prime Drive',
      desc: 'Sınırsız depolama alanı. Tüm projeleriniz, görseller, belgeler — hiçbir şeyi silmek zorunda kalmayın.',
      visual: 'terabyte',
      bg: 'linear-gradient(135deg, #451a03 0%, #0f172a 100%)',
      accent: '#f59e0b',
    },
    {
      title: '4000 Ortak Kredi/gün',
      desc: 'Her gün yenilenen 4000 kredi. Görsel üretimi, analiz, yazma — tüm AI özelliklerini özgürce kullanın.',
      visual: 'credits',
      bg: 'linear-gradient(135deg, #422006 0%, #0f172a 100%)',
      accent: '#fb923c',
    },
    {
      title: 'Garantili Günlük Sandık',
      desc: 'Her gün %100 sandık kazanın. Aylık 30 adede kadar. En büyük ödüller Creative Station\'a ayrılmış.',
      visual: 'guaranteed',
      bg: 'linear-gradient(135deg, #431407 0%, #0f172a 100%)',
      accent: '#f97316',
    },
    {
      title: 'Öncelikli Destek',
      desc: 'Sorunlarınız 7/24 öncelikli olarak ilgilenilir. Özel destek kanalı ve hızlı yanıt garantisi.',
      visual: 'support',
      bg: 'linear-gradient(135deg, #78350f 0%, #0f172a 100%)',
      accent: '#fbbf24',
    },
    {
      title: 'Zeta Belge Düzenleme (AI)',
      desc: 'Sadece söyleyin, Zeta yapıyor: yeni element ekle, şekil değiştir, tablo oluştur — konuşarak tasarla.',
      visual: 'ai',
      bg: 'linear-gradient(135deg, #5c2a06 0%, #0f172a 100%)',
      accent: '#f59e0b',
    },
  ],
};

const VISUAL_ICONS = {
  notebook: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="15" y="10" width="50" height="60" rx="4" fill={color + '30'} stroke={color} strokeWidth="2" />
      <line x1="25" y1="25" x2="55" y2="25" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="33" x2="55" y2="33" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="25" y1="41" x2="45" y2="41" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="18" width="6" height="44" rx="2" fill={color} opacity="0.5" />
      <circle cx="13" cy="26" r="2" fill={color} />
      <circle cx="13" cy="34" r="2" fill={color} />
      <circle cx="13" cy="42" r="2" fill={color} />
    </svg>
  ),
  notebooks: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      {[0,1,2,3,4].map((i) => (
        <rect key={i} x={8 + i * 12} y={15 - i * 2} width="38" height="52" rx="3"
          fill={color + (20 - i * 3).toString(16).padStart(2,'0')} stroke={color} strokeWidth="1.5" opacity={0.4 + i * 0.12} />
      ))}
      <rect x="32" y="10" width="38" height="52" rx="3" fill={color + '30'} stroke={color} strokeWidth="2" />
      <line x1="40" y1="24" x2="62" y2="24" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="32" x2="62" y2="32" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  ai: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <circle cx="40" cy="40" r="22" fill={color + '20'} stroke={color} strokeWidth="2" />
      <circle cx="40" cy="40" r="14" fill={color + '30'} />
      <path d="M32 36l5 5 11-11" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 20 L14 14 M60 20 L66 14 M20 60 L14 66 M60 60 L66 66" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <circle cx="40" cy="14" r="3" fill={color} opacity="0.6" />
      <circle cx="66" cy="40" r="3" fill={color} opacity="0.6" />
    </svg>
  ),
  tools: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="12" y="12" width="24" height="24" rx="4" fill={color + '25'} stroke={color} strokeWidth="2" />
      <rect x="44" y="12" width="24" height="24" rx="4" fill={color + '25'} stroke={color} strokeWidth="2" />
      <rect x="12" y="44" width="24" height="24" rx="4" fill={color + '25'} stroke={color} strokeWidth="2" />
      <rect x="44" y="44" width="24" height="24" rx="4" fill={color + '40'} stroke={color} strokeWidth="2" />
      <line x1="50" y1="50" x2="62" y2="62" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="52" cy="52" r="5" fill={color} opacity="0.7" />
    </svg>
  ),
  unlock: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="20" y="38" width="40" height="28" rx="5" fill={color + '25'} stroke={color} strokeWidth="2" />
      <path d="M30 38V28a10 10 0 0 1 20 0" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4" />
      <circle cx="40" cy="50" r="5" fill={color} opacity="0.8" />
      <line x1="40" y1="55" x2="40" y2="60" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M56 18 L68 18 M68 18 L68 30 M56 28 L68 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  judge: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <line x1="40" y1="15" x2="40" y2="65" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="28" x2="60" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <ellipse cx="24" cy="38" rx="10" ry="5" fill={color + '30'} stroke={color} strokeWidth="1.5" />
      <ellipse cx="56" cy="32" rx="10" ry="5" fill={color + '20'} stroke={color} strokeWidth="1.5" opacity="0.7" />
      <path d="M18 58 L30 58 L24 50 Z" fill={color} opacity="0.5" />
      <path d="M50 52 L62 52 L56 44 Z" fill={color} opacity="0.3" />
    </svg>
  ),
  drive: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="12" y="24" width="56" height="32" rx="6" fill={color + '20'} stroke={color} strokeWidth="2" />
      <circle cx="57" cy="40" r="5" fill={color} opacity="0.7" />
      <circle cx="44" cy="40" r="5" fill={color + '50'} stroke={color} strokeWidth="1.5" />
      <line x1="20" y1="36" x2="34" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="20" y1="44" x2="30" y2="44" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <path d="M30 18 L40 10 L50 18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
    </svg>
  ),
  cinema: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="10" y="20" width="60" height="40" rx="4" fill={color + '20'} stroke={color} strokeWidth="2" />
      {[0,1,2,3,4,5].map(i => (
        <rect key={i} x={i % 2 === 0 ? 10 : 66} y={26 + Math.floor(i/2) * 12} width="6" height="8" rx="1" fill={color} opacity="0.5" />
      ))}
      <path d="M34 32 L54 40 L34 48 Z" fill={color} opacity="0.8" />
    </svg>
  ),
  clean: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="15" y="12" width="50" height="56" rx="4" fill={color + '15'} stroke={color} strokeWidth="2" />
      <line x1="24" y1="28" x2="56" y2="28" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="24" y1="36" x2="56" y2="36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <line x1="24" y1="44" x2="48" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
      <circle cx="60" cy="60" r="14" fill="#0f172a" stroke={color} strokeWidth="2" />
      <path d="M53 60 L57.5 64.5 L67 55" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  storage: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      {[0,1,2].map(i => (
        <rect key={i} x="14" y={16 + i * 18} width="52" height="14" rx="4"
          fill={color + (i === 2 ? '35' : '20')} stroke={color} strokeWidth="1.5" opacity={1 - i * 0.15} />
      ))}
      {[0,1,2].map(i => (
        <circle key={i} cx="56" cy={23 + i * 18} r="3" fill={color} opacity={0.8 - i * 0.1} />
      ))}
      <text x="20" y="27" fill={color} fontSize="7" fontFamily="monospace" opacity="0.6">50 GB</text>
    </svg>
  ),
  chest: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="14" y="36" width="52" height="32" rx="5" fill={color + '25'} stroke={color} strokeWidth="2" />
      <path d="M14 44 L66 44" stroke={color} strokeWidth="1.5" opacity="0.5" />
      <rect x="14" y="28" width="52" height="16" rx="5" fill={color + '35'} stroke={color} strokeWidth="2" />
      <rect x="32" y="38" width="16" height="10" rx="3" fill={color} opacity="0.7" />
      <path d="M30 10 L40 4 L50 10 L44 20 L36 20 Z" fill={color} opacity="0.4" stroke={color} strokeWidth="1.5" />
      <circle cx="40" cy="14" r="3" fill={color} opacity="0.8" />
    </svg>
  ),
  terabyte: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <ellipse cx="40" cy="42" rx="26" ry="16" fill={color + '20'} stroke={color} strokeWidth="2" />
      <ellipse cx="40" cy="34" rx="26" ry="16" fill={color + '25'} stroke={color} strokeWidth="2" />
      <path d="M14 34 L14 42" stroke={color} strokeWidth="2" />
      <path d="M66 34 L66 42" stroke={color} strokeWidth="2" />
      <text x="28" y="38" fill={color} fontSize="10" fontFamily="monospace" fontWeight="bold" opacity="0.9">1 TB</text>
    </svg>
  ),
  credits: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      {[0,1,2,3].map(i => (
        <circle key={i} cx={20 + i * 14} cy={38 + (i % 2 === 0 ? -4 : 4)} r="10"
          fill={color + '30'} stroke={color} strokeWidth="1.5" opacity={0.5 + i * 0.12} />
      ))}
      <circle cx="40" cy="38" r="13" fill={color + '40'} stroke={color} strokeWidth="2" />
      <path d="M36 34 L44 38 L36 42" fill={color} opacity="0.8" />
    </svg>
  ),
  guaranteed: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <rect x="14" y="36" width="52" height="30" rx="5" fill={color + '25'} stroke={color} strokeWidth="2" />
      <rect x="14" y="28" width="52" height="14" rx="5" fill={color + '35'} stroke={color} strokeWidth="2" />
      <rect x="32" y="38" width="16" height="10" rx="3" fill={color} opacity="0.7" />
      <circle cx="40" cy="22" r="10" fill={color + '30'} stroke={color} strokeWidth="2" />
      <path d="M35 22 L38.5 25.5 L45 19" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  support: (color) => (
    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 80, height: 80 }}>
      <circle cx="40" cy="36" r="20" fill={color + '20'} stroke={color} strokeWidth="2" />
      <path d="M28 28 C28 20 52 20 52 32 C52 40 40 40 40 48" stroke={color} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <circle cx="40" cy="55" r="3" fill={color} opacity="0.8" />
      <path d="M16 62 Q40 72 64 62" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.4" />
    </svg>
  ),
};

function PlanSlideshow({ plan, planColor, slides, onClose }) {
  const [current, setCurrent] = useState(0);
  const total = slides.length;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 10001, padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 480,
          background: slides[current].bg,
          border: `1px solid ${planColor}40`,
          borderRadius: 24, overflow: 'hidden',
          fontFamily: "'DM Sans', sans-serif",
          boxShadow: `0 0 60px ${planColor}30`,
        }}
      >
        {/* Visual area */}
        <div style={{
          height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          background: `radial-gradient(circle at 50% 60%, ${slides[current].accent}20 0%, transparent 70%)`,
        }}>
          <div style={{ transform: 'scale(1.8)', opacity: 0.9 }}>
            {(VISUAL_ICONS[slides[current].visual] || VISUAL_ICONS.ai)(slides[current].accent)}
          </div>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: 8,
              color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: '4px 6px',
              lineHeight: 1,
            }}
          >
            <X size={16} />
          </button>
          {/* Plan badge */}
          <div style={{
            position: 'absolute', top: 14, left: 14,
            background: planColor + '30', border: `1px solid ${planColor}60`,
            borderRadius: 99, padding: '3px 10px',
            color: planColor, fontSize: 11, fontWeight: 700,
          }}>
            {plan.toUpperCase().replace('_', ' ')}
          </div>
          {/* Slide counter */}
          <div style={{
            position: 'absolute', bottom: 14, right: 14,
            color: 'rgba(255,255,255,0.3)', fontSize: 11,
          }}>
            {current + 1}/{total}
          </div>
        </div>

        {/* Text area */}
        <div style={{ padding: '24px 28px 28px' }}>
          <h3 style={{ color: '#fff', fontSize: 20, fontWeight: 700, margin: '0 0 10px' }}>
            {slides[current].title}
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, lineHeight: 1.65, margin: '0 0 24px' }}>
            {slides[current].desc}
          </p>

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              onClick={() => setCurrent(c => Math.max(0, c - 1))}
              disabled={current === 0}
              style={{
                width: 40, height: 40, borderRadius: 12, border: `1px solid ${planColor}40`,
                background: current === 0 ? 'rgba(255,255,255,0.03)' : planColor + '20',
                color: current === 0 ? 'rgba(255,255,255,0.2)' : planColor,
                cursor: current === 0 ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {slides.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  style={{
                    width: i === current ? 20 : 6, height: 6,
                    borderRadius: 99, border: 'none', cursor: 'pointer',
                    background: i === current ? planColor : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.25s',
                    padding: 0,
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => current < total - 1 ? setCurrent(c => c + 1) : onClose()}
              style={{
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: current === total - 1 ? planColor : planColor + '25',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {current === total - 1 ? <X size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SubscriptionModal = ({
  onClose, userZP, billingCycle, setBillingCycle,
  SUBSCRIPTION_PLANS, userSubscription, subscribing,
  handleSubscribe, handleBuyWithSP,
}) => {
  const [slideshow, setSlideshow] = useState(null); // planId

  const FREE_PLAN = {
    id: 'free', name: 'Free', monthlyPrice: 0, yearlyPrice: 0,
    color: '#6b7280', zpCost: 0, features: ['80 Kredi/gün', '100K Token/gün', '1 Defter', '3 Fast Select', 'Temel araçlar'],
  };

  const allPlans = [FREE_PLAN, ...SUBSCRIPTION_PLANS];

  return (
    <>
      <div
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #0d0f2a 0%, #111827 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 24, padding: '28px 24px 24px',
            width: '100%', maxWidth: 880,
            fontFamily: "'DM Sans', sans-serif",
            maxHeight: '90vh', overflowY: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, margin: 0 }}>Planını Seç</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, margin: '4px 0 0' }}>İhtiyacına uygun paketi bul</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* ZP balance */}
              {userZP > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
                  borderRadius: 99, padding: '4px 12px',
                }}>
                  <Star size={13} color="#fbbf24" />
                  <span style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700 }}>{userZP.toLocaleString()} ZP</span>
                </div>
              )}
              {/* Billing toggle */}
              <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 3 }}>
                {['monthly', 'yearly'].map(cycle => (
                  <button
                    key={cycle}
                    onClick={() => setBillingCycle(cycle)}
                    style={{
                      padding: '5px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                      background: billingCycle === cycle ? 'rgba(255,255,255,0.15)' : 'transparent',
                      color: billingCycle === cycle ? '#fff' : 'rgba(255,255,255,0.4)',
                      fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {cycle === 'monthly' ? 'Aylık' : 'Yıllık'}
                    {cycle === 'yearly' && (
                      <span style={{ background: '#22c55e', color: '#fff', fontSize: 9, borderRadius: 4, padding: '1px 4px' }}>-17%</span>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4 }}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Plan Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {allPlans.map(plan => {
              const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const isCurrent = userSubscription === plan.id || (!userSubscription && plan.id === 'free');
              const slides = PLAN_SLIDES[plan.id] || [];

              return (
                <div
                  key={plan.id}
                  style={{
                    borderRadius: 16,
                    padding: '18px 16px',
                    border: isCurrent ? `2px solid ${plan.color}` : `1px solid ${plan.color}30`,
                    background: `linear-gradient(160deg, ${plan.color}15 0%, ${plan.color}05 100%)`,
                    display: 'flex', flexDirection: 'column', gap: 0,
                    position: 'relative',
                  }}
                >
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                      background: plan.color, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                    }}>
                      MEVCUT PLAN
                    </div>
                  )}
                  {plan.id === 'pro' && !isCurrent && (
                    <div style={{
                      position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                      background: plan.color, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 10px', borderRadius: 99, whiteSpace: 'nowrap',
                    }}>
                      ÖNERİLEN
                    </div>
                  )}

                  {/* Plan header */}
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ color: plan.color, fontSize: 14, fontWeight: 700, marginBottom: 6 }}>{plan.name}</div>
                    <div>
                      <span style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>
                        {price === 0 ? 'Ücretsiz' : `$${price}`}
                      </span>
                      {price > 0 && (
                        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                          /{billingCycle === 'monthly' ? 'ay' : 'yıl'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div style={{ flex: 1, marginBottom: 14 }}>
                    {plan.features.slice(0, 5).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                        <Check size={11} color={plan.color} style={{ flexShrink: 0, marginTop: 3 }} />
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>

                  {/* Paket detay butonu */}
                  {slides.length > 0 && (
                    <button
                      onClick={() => setSlideshow(plan.id)}
                      style={{
                        width: '100%', padding: '7px 0', borderRadius: 8, marginBottom: 8,
                        border: `1px solid ${plan.color}40`, background: 'transparent',
                        color: plan.color, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      Paket Hakkında Herşey
                      <ArrowRight size={11} />
                    </button>
                  )}

                  {/* Subscribe button */}
                  {plan.id !== 'free' && (
                    <button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={subscribing || isCurrent}
                      style={{
                        width: '100%', padding: '9px 0', borderRadius: 10, border: 'none',
                        background: isCurrent ? 'rgba(255,255,255,0.06)' : plan.color,
                        color: isCurrent ? plan.color : '#fff',
                        fontSize: 12, fontWeight: 700, cursor: isCurrent ? 'default' : 'pointer',
                        opacity: subscribing ? 0.6 : 1,
                      }}
                    >
                      {isCurrent ? 'Mevcut Plan' : 'Satın Al'}
                    </button>
                  )}
                  {plan.id !== 'free' && userZP >= plan.zpCost && !isCurrent && (
                    <button
                      onClick={() => handleBuyWithSP(plan.id)}
                      disabled={subscribing}
                      style={{
                        width: '100%', padding: '7px 0', borderRadius: 10, marginTop: 6,
                        border: '1px solid rgba(251,191,36,0.3)',
                        background: 'rgba(251,191,36,0.08)',
                        color: '#fbbf24', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      <Star size={11} />
                      {plan.zpCost.toLocaleString()} ZP ile Al
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 16 }}>
            Abonelik aynı takvim günü her ay yenilenir · İptal etmek istersen her zaman iptal edebilirsin
          </p>
        </div>
      </div>

      {/* Slideshow */}
      {slideshow && (
        <PlanSlideshow
          plan={slideshow}
          planColor={allPlans.find(p => p.id === slideshow)?.color || '#6b7280'}
          slides={PLAN_SLIDES[slideshow] || []}
          onClose={() => setSlideshow(null)}
        />
      )}
    </>
  );
};

export default SubscriptionModal;
