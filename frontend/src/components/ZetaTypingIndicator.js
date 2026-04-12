import React, { useState, useEffect, useRef } from 'react';

const THINKING_MESSAGES = [
  "Düşünüyorum...",
  "Hmm, bir bakayım...",
  "İlginç bir soru...",
  "Analiz ediyorum...",
  "Beyin fırtınası yapıyorum...",
  "Bir saniye...",
  "Cevabı buldum gibi...",
  "Az kaldı...",
];

const DOCUMENT_MESSAGES = [
  "Belgenizi inceliyorum...",
  "Satırları tarıyorum...",
  "Önemli noktaları çıkarıyorum...",
  "Özet hazırlıyorum...",
  "Detaylara bakıyorum...",
  "Yapıyı analiz ediyorum...",
  "Neredeyse bitti...",
];

const LONG_WAIT_MESSAGES = [
  "Detaylı bir cevap geliyor...",
  "Kapsamlı düşünüyorum...",
  "Biraz uzun sürecek ama değecek...",
  "Sabret, güzel şeyler geliyor...",
];

const ZetaLogo = ({ size = 20, color = '#4ca8ad' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 119.3 121.6"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fill={color}
      d="M100,121.7H.4v-35.6L77.3,28.1H3.6C3.6,12.6,14.1,0,27.2,0h92.4v30l-84,63.6h2.2l80.8.4v7.6c0,11.1-8.3,20.1-18.6,20.1h0Z"
    />
  </svg>
);

/**
 * ZetaTypingIndicator — animated logo + rotating message shown while Zeta/Judge is responding.
 *
 * Props:
 *   isJudge   — use Judge color scheme (crimson) instead of Zeta teal
 *   hasDocument — prioritise document-analysis messages
 *   size      — logo size in px (default 18)
 *   className — extra class names for the wrapper
 */
const ZetaTypingIndicator = ({ isJudge = false, hasDocument = false, size = 18, className = '' }) => {
  const color = isJudge ? '#c8005a' : '#4ca8ad';
  const [msgIndex, setMsgIndex] = useState(() => Math.floor(Math.random() * THINKING_MESSAGES.length));
  const startTimeRef = useRef(Date.now());

  useEffect(() => {
    const id = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      let pool = THINKING_MESSAGES;
      if (elapsed > 5000) pool = LONG_WAIT_MESSAGES;
      else if (hasDocument) pool = DOCUMENT_MESSAGES;
      setMsgIndex(prev => (prev + 1) % pool.length);
    }, 2500);
    return () => clearInterval(id);
  }, [hasDocument]);

  const elapsed = Date.now() - startTimeRef.current;
  let pool = THINKING_MESSAGES;
  if (elapsed > 5000) pool = LONG_WAIT_MESSAGES;
  else if (hasDocument) pool = DOCUMENT_MESSAGES;
  const message = pool[msgIndex % pool.length];

  return (
    <div
      className={`zeta-typing-indicator flex items-center gap-2 ${className}`}
      style={{ color: 'var(--zet-text-muted)' }}
    >
      <div className="zeta-typing-logo" style={{ '--zeta-shine-color': isJudge ? 'rgba(200,0,90,0.35)' : 'rgba(76,168,173,0.35)' }}>
        <ZetaLogo size={size} color={color} />
      </div>
      <span className="zeta-typing-message text-xs">{message}</span>
    </div>
  );
};

export default ZetaTypingIndicator;
