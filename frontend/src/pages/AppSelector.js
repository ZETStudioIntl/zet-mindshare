import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppTheme } from '../contexts/AppThemeContext';
import { RainbowSpinner } from '../components/LoadingScreens';
import axios from 'axios';
import { motion } from 'framer-motion';
import { SPRING, SPRING_FAST, STAGGER_CONTAINER, STAGGER_ITEM, haptic } from '../lib/animations';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const MindshareIcon = () => (
  <img src="/logo-mindshare.svg" alt="ZET Mindshare" style={{ width: 44, height: 44, objectFit: 'contain' }} />
);

const JudgeIcon = () => (
  <img src="/logo-judge.svg" alt="ZET Judge" style={{ width: 44, height: 44, objectFit: 'contain' }} />
);

const MediaIcon = () => (
  <img src="/logo-media.svg" alt="ZET Media" style={{ width: 44, height: 44, objectFit: 'contain' }} />
);

const APPS = [
  {
    id: 'mindshare',
    name: 'ZET Mindshare',
    tagline: 'Yaz. Öğren. Paylaş.',
    description: 'Akıllı belge editörü, Zeta AI asistanı, fikir haritası ve sosyal okuma deneyimi.',
    gradient: 'linear-gradient(135deg, #1a1f5c 0%, #292f91 40%, #4ca8ad 100%)',
    borderGlow: 'rgba(76, 168, 173, 0.4)',
    hoverBg: '#0d0f2a',
    route: '/dashboard',
    Icon: MindshareIcon,
    version: 'v26.07.31',
    features: ['Belge editörü & sayfa sistemi', 'Zeta AI yazma asistanı', 'ZET Media sosyal feed', 'Quest haritası & XP sistemi'],
  },
  {
    id: 'judge',
    name: 'ZET Judge',
    tagline: 'Analiz Et. Karar Ver.',
    description: 'İş planı değerlendirmesi, risk analizi ve AI tabanlı stratejik danışmanlık.',
    gradient: 'linear-gradient(135deg, #2a0618 0%, #4b0c37 40%, #c8005a 100%)',
    borderGlow: 'rgba(200, 0, 90, 0.4)',
    hoverBg: '#160310',
    route: '/judge',
    Icon: JudgeIcon,
    version: 'v26.07.27',
    features: ['İş planı analizi', 'Risk & başarı skoru', 'Derin araştırma modu', 'Geçmiş analizler'],
  },
  {
    id: 'media',
    name: 'ZET Media',
    tagline: 'Paylaş. Bağlan. Keşfet.',
    description: 'Bağımsız sosyal medya ve mesajlaşma uygulaması — gönderiler, keşfet akışı, mesajlar ve bildirimler.',
    gradient: 'linear-gradient(135deg, #050505 0%, #1f0a52 40%, #3a0ca3 100%)',
    borderGlow: 'rgba(58, 12, 163, 0.4)',
    hoverBg: '#050505',
    route: '/media',
    Icon: MediaIcon,
    version: 'v26.07.27 beta',
    features: ['Akış & Keşfet', 'Gönderi paylaşımı', 'Mesajlaşma (DM)', 'Bildirimler & profil'],
  },
];

const ControlCenterIcon = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
    <rect width="44" height="44" rx="12" fill="#1a0a0a" />
    <circle cx="22" cy="22" r="12" stroke="#ef4444" strokeWidth="1.5" fill="none" />
    <path d="M22 10v4M22 30v4M10 22h4M30 22h4" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="22" cy="22" r="3.5" fill="#ef4444" />
  </svg>
);

const AppSelector = () => {
  const navigate = useNavigate();
  const { switchApp } = useAppTheme();
  const [hovered, setHovered] = useState(null);
  const [selecting, setSelecting] = useState(null);
  const [showCC, setShowCC] = useState(false);

  useEffect(() => {
    axios.get(`${API}/ceo/check-cc`, { withCredentials: true })
      .then(r => { if (r.data.show) setShowCC(true); })
      .catch(() => {});
  }, []);

  const bgColor = hovered === 'judge' ? '#12020c' : hovered === 'mindshare' ? '#080a1a' : hovered === 'media' ? '#050505' : hovered === 'control-center' ? '#0d0000' : '#0a0d1a';

  const handleSelect = (app) => {
    haptic(20);
    setSelecting(app.id);
    switchApp(app.id);
    try { const a = new Audio('/sounds/app-select.wav'); a.volume = 0.6; a.play().catch(() => {}); } catch (_) {}
    setTimeout(() => navigate(app.route), 380);
  };

  const allApps = [...APPS, ...(showCC ? [{
    id: 'control-center',
    name: 'Kontrol Merkezi',
    tagline: 'CEO Paneli',
    description: 'Kullanıcı yönetimi, güvenlik analizleri, gelir takibi ve moderasyon araçları.',
    gradient: 'linear-gradient(135deg, #1a0000 0%, #3d0000 40%, #7f1d1d 100%)',
    borderGlow: 'rgba(239, 68, 68, 0.5)',
    hoverBg: '#0d0000',
    route: '/control-center',
    Icon: ControlCenterIcon,
    version: 'CEO Only',
    features: ['Tüm kullanıcı listesi', 'Kullanıcı detay & gelir', 'Ban / Uyarı yönetimi', 'Güvenlik skorları'],
  }] : [])];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        minHeight: '100vh',
        background: bgColor,
        transition: 'background 0.7s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 28, delay: 0.05 }}
        style={{ textAlign: 'center', marginBottom: 56 }}
      >
        <motion.img
          src="/logo-cs.svg"
          alt="ZET Portal"
          layoutId="zet-portal-logo"
          style={{ height: 64, width: 64, margin: '0 auto 16px', display: 'block' }}
        />
        <h1 style={{ color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: '-0.5px', marginBottom: 10 }}>
          ZET Portal
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 15 }}>
          Hangi uygulamayı kullanmak istiyorsunuz?
        </p>
      </motion.div>

      <motion.div
        variants={STAGGER_CONTAINER}
        initial="initial"
        animate="animate"
        style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 860, width: '100%' }}
      >
        {allApps.map((app) => {
          const isHovered = hovered === app.id;
          const isSelecting = selecting === app.id;
          return (
            <motion.button
              key={app.id}
              variants={STAGGER_ITEM}
              layoutId={`app-card-${app.id}`}
              onClick={() => handleSelect(app)}
              onHoverStart={() => setHovered(app.id)}
              onHoverEnd={() => setHovered(null)}
              whileHover={{ y: -6, scale: 1.02, transition: SPRING }}
              whileTap={{ scale: 0.97, transition: SPRING_FAST }}
              animate={{ opacity: selecting && !isSelecting ? 0.45 : 1 }}
              transition={SPRING}
              style={{
                flex: '1 1 340px',
                maxWidth: 400,
                padding: '32px 28px',
                borderRadius: 20,
                border: `1px solid ${isHovered ? app.borderGlow : 'rgba(255,255,255,0.07)'}`,
                background: isHovered ? app.gradient : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: isHovered ? `0 8px 60px ${app.borderGlow}` : 'none',
                transition: 'border-color 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                <motion.div layoutId={`app-icon-${app.id}`}>
                  <app.Icon />
                </motion.div>
                <div>
                  <div style={{ color: '#fff', fontSize: 19, fontWeight: 700, lineHeight: 1.2 }}>{app.name}</div>
                  <div style={{ color: isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 3, transition: 'color 0.3s' }}>{app.tagline}</div>
                </div>
              </div>

              <p style={{ color: isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)', fontSize: 13, lineHeight: 1.6, marginBottom: 20, transition: 'color 0.3s' }}>
                {app.description}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {app.features.map((f) => (
                  <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, color: isHovered ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.35)', fontSize: 12, transition: 'color 0.3s' }}>
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: isHovered ? '#fff' : 'rgba(255,255,255,0.3)', flexShrink: 0, transition: 'background 0.3s' }} />
                    {f}
                  </li>
                ))}
              </ul>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: isHovered ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 14, fontWeight: 600, transition: 'color 0.3s' }}>
                    {isSelecting ? 'Açılıyor...' : 'Başla'}
                  </span>
                  {isSelecting
                    ? <RainbowSpinner size={20} thickness={3} />
                    : <span style={{ color: isHovered ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: 18, transition: 'color 0.3s' }}>→</span>
                  }
                </div>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, fontVariantNumeric: 'tabular-nums' }}>{app.version}</span>
              </div>
            </motion.button>
          );
        })}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        style={{ marginTop: 40, color: 'rgba(255,255,255,0.2)', fontSize: 12 }}
      >
        Her zaman ayarlar menüsünden uygulama değiştirebilirsiniz
      </motion.p>
    </motion.div>
  );
};

export default AppSelector;
