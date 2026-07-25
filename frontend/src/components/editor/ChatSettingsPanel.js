import React, { useContext, useState, useMemo } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

/* ── SVG ikonlar ─────────────────────────────────────────────── */
const InfoIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="8" cy="5.5" r="1" fill="currentColor"/>
    <path d="M8 8v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const LockIcon = () => (
  <svg width="11" height="11" viewBox="0 0 16 16" fill="none" style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle', opacity: 0.6 }}>
    <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const ChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ── Mod tanımları ───────────────────────────────────────────── */
const TROLL_MODES = {
  agresif: {
    label: 'Agresif',
    color: '#ef4444',
    warning: '"Kanka malmısın" düzeyinde davranabilir. Hassas yapılar için önerilmez.',
    hasWarning: true,
  },
  robot: {
    label: 'Robot',
    color: '#6366f1',
    hasWarning: false,
  },
  yorgun: {
    label: 'Yorgun',
    color: '#78716c',
    hasWarning: false,
  },
};

/* ── Slayt içerikleri ────────────────────────────────────────── */
const SLIDES = [
  {
    title: 'AI Ayarları nedir?',
    desc: 'Zeta ile konuşma tonunu ve kişiliğini buradan ayarlayabilirsin. Normal modlar herkese açık. Troll modlar kasadan açılır.',
    tag: null,
    color: '#4ca8ad',
    sample: null,
  },
  {
    title: 'Neseli',
    desc: 'Enerjik ve konuşkan. Cümleler kısa ve akıcı. Doğal tepkiler verir, samimi sorular sorar.',
    tag: 'Normal',
    tagColor: '#4ca8ad',
    color: '#4ca8ad',
    sample: '"Yaaa harika soru! Color panelini aç, gradient sekmesine geç. Peki bu belge ne için?"',
  },
  {
    title: 'Profesyonel',
    desc: 'Direkt ve iş odaklı. Gereksiz sohbet yok. Bağlamı netleştiren sorular sorar.',
    tag: 'Normal',
    tagColor: '#4ca8ad',
    color: '#4ca8ad',
    sample: '"Color panelini aç, gradient sekmesine geç. Bu belge hangi aşamada?"',
  },
  {
    title: 'Merakli',
    desc: 'Arka planı anlamaya çalışır. Yüzeyde kalmaz, konuyu derinleştiren sorular sorar.',
    tag: 'Normal',
    tagColor: '#4ca8ad',
    color: '#4ca8ad',
    sample: '"Gradient uygulayabilirsin. Peki bu belge kim için hazırlanıyor, nasıl kullanılacak?"',
  },
  {
    title: 'Agresif',
    desc: 'Kısa, sert, eğlenceli. Doğru cevabı verir — ama çok kaba bir şekilde. Saçma soru gelirse daha da sert olur.',
    tag: 'Kasaya Ozel',
    tagColor: '#ef4444',
    color: '#ef4444',
    sample: '"Malmısın kanka. Color tool var. Tıkla. Bitti."',
    warn: 'Aşağılayıcı ifadeler içerebilir.',
  },
  {
    title: 'Robot',
    desc: 'Tamamen mekanik ve duygusuz. Hiçbir sohbet, hiçbir soru. Sadece komut-cevap formatı.',
    tag: 'Kasaya Ozel',
    tagColor: '#6366f1',
    color: '#6366f1',
    sample: '"KOMUT ALINDI: Üçgen boyama. ÇÖZÜM: Color tool. İŞLEM TAMAMLANDI."',
  },
  {
    title: 'Yorgun',
    desc: 'Hayattan bezmiş, üşengeç. Cevaplar yarım bırakılmış gibi. Doğru cevabı verir ama canı istemeden.',
    tag: 'Kasaya Ozel',
    tagColor: '#78716c',
    color: '#78716c',
    sample: '"ya... color var sanırım... tıkla işte... neyse bilmiyorum kanka yoruldum"',
  },
];

/* ── Overlay backdrop ────────────────────────────────────────── */
const Overlay = ({ onClick, children }) => (
  <div
    onClick={onClick}
    style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0 16px 32px',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(4px)',
    }}
  >
    {children}
  </div>
);

/* ── Ana bileşen ─────────────────────────────────────────────── */
const ChatSettingsPanel = () => {
  const {
    isMobile, showChatSettings, setShowChatSettings,
    zetaMood, setZetaMood, zetaCustomPrompt, setZetaCustomPrompt,
    zetaEmoji, setZetaEmoji, judgeMood, setJudgeMood,
  } = useContext(EditorStateContext);

  const [pendingMood, setPendingMood]   = useState(null); // troll onay popup
  const [lockedMood,  setLockedMood]    = useState(null); // kilitli mod popup
  const [showInfo,    setShowInfo]      = useState(false);
  const [slide,       setSlide]         = useState(0);

  const unlockedModes = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('zet_unlocked_modes') || '[]'); }
    catch { return []; }
  }, []);

  const isTrollLocked = (key) => !!TROLL_MODES[key] && !unlockedModes.includes(key);

  const handleMoodChange = (value) => {
    if (TROLL_MODES[value]) {
      if (isTrollLocked(value)) {
        setLockedMood(value);
      } else {
        setPendingMood(value);
      }
    } else {
      setZetaMood(value);
      localStorage.setItem('zet_zeta_mood', value);
    }
  };

  const confirmMood = () => {
    setZetaMood(pendingMood);
    localStorage.setItem('zet_zeta_mood', pendingMood);
    setPendingMood(null);
  };

  if (!showChatSettings) return null;

  const totalSlides = SLIDES.length;

  return (
    <>
      <DraggablePanel
        title="Chat Ayarları"
        onClose={() => setShowChatSettings(false)}
        initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}
      >
        <div className="w-80 space-y-4">

          {/* ZETA ayarları */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(76,168,173,0.1)', border: '1px solid rgba(76,168,173,0.3)' }}>

            {/* Başlık + i butonu */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h4 className="font-semibold text-sm" style={{ color: '#4ca8ad' }}>ZETA Ozelleştirme</h4>
              <button
                onClick={() => { setShowInfo(true); setSlide(0); }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 22, height: 22, borderRadius: '50%', border: '1px solid rgba(76,168,173,0.4)',
                  background: 'rgba(76,168,173,0.08)', color: '#4ca8ad', cursor: 'pointer',
                }}
                title="AI modları hakkında bilgi al"
              >
                <InfoIcon />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
                <select
                  value={zetaMood}
                  onChange={e => handleMoodChange(e.target.value)}
                  className="zet-input text-xs w-full"
                >
                  <option value="cheerful">Neseli</option>
                  <option value="professional">Profesyonel</option>
                  <option value="curious">Merakli</option>
                  <optgroup label="— Troll Modlar —">
                    {Object.entries(TROLL_MODES).map(([key, m]) => (
                      <option key={key} value={key}>
                        {isTrollLocked(key) ? `${m.label} (Kilitli)` : m.label}
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">Ozel</option>
                </select>
              </div>

              {zetaMood === 'custom' && (
                <div>
                  <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Ozel Prompt</label>
                  <textarea
                    value={zetaCustomPrompt}
                    onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }}
                    placeholder="ZETA nasıl davransın? Örn: Kısa ve öz cevaplar ver..."
                    className="zet-input text-xs w-full h-20 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Emoji Kullanımı</label>
                <select
                  value={zetaEmoji}
                  onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }}
                  className="zet-input text-xs w-full"
                >
                  <option value="none">Kullanma</option>
                  <option value="low">Az Kullan</option>
                  <option value="medium">Orta</option>
                  <option value="high">Cok Kullan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Judge ayarları */}
          <div className="p-3 rounded-lg" style={{ background: 'rgba(200,0,90,0.1)', border: '1px solid rgba(200,0,90,0.3)' }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: '#c8005a' }}>ZET Judge Mini Ozelleştirme</h4>
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
              <select
                value={judgeMood}
                onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }}
                className="zet-input text-xs w-full"
              >
                <option value="normal">Normal (Yapici elestiri)</option>
                <option value="harsh">Sert (Esprili dalga gecme)</option>
              </select>
              <p className="text-xs mt-2 opacity-70" style={{ color: 'var(--zet-text-muted)' }}>
                {judgeMood === 'harsh' ? 'Judge sizi esprilerle kavuracak!' : 'Judge yapici ve profesyonel olacak.'}
              </p>
            </div>
          </div>

        </div>
      </DraggablePanel>

      {/* ── Bilgi slayt modal ─────────────────────────────────── */}
      {showInfo && (
        <Overlay onClick={() => setShowInfo(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--zet-bg-panel, #1a1a2e)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 18,
              padding: '24px 24px 20px',
              width: '100%',
              maxWidth: 380,
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            {(() => {
              const s = SLIDES[slide];
              return (
                <>
                  {/* Tag */}
                  {s.tag && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                      fontSize: 10, fontWeight: 700, letterSpacing: 1.2,
                      textTransform: 'uppercase', color: s.tagColor,
                      background: `${s.tagColor}18`, border: `1px solid ${s.tagColor}33`,
                      borderRadius: 20, padding: '2px 10px', marginBottom: 12,
                    }}>
                      {s.tag === 'Kasaya Ozel' && <LockIcon />}
                      {s.tag}
                    </div>
                  )}

                  {/* Başlık */}
                  <div style={{ fontSize: 18, fontWeight: 800, color: s.color, marginBottom: 10 }}>
                    {s.title}
                  </div>

                  {/* Açıklama */}
                  <p style={{ fontSize: 13, color: 'var(--zet-text-muted)', lineHeight: 1.65, marginBottom: s.sample ? 14 : 0 }}>
                    {s.desc}
                  </p>

                  {/* Uyarı banner (sadece agresif) */}
                  {s.warn && (
                    <div style={{
                      marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                      fontSize: 12, color: '#f87171',
                    }}>
                      Uyari: {s.warn}
                    </div>
                  )}

                  {/* Örnek çıktı */}
                  {s.sample && (
                    <div style={{
                      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                      borderLeft: `3px solid ${s.color}`, borderRadius: 8,
                      padding: '10px 14px', fontSize: 12,
                      color: 'rgba(255,255,255,0.55)', fontStyle: 'italic', lineHeight: 1.6,
                    }}>
                      {s.sample}
                    </div>
                  )}

                  {/* Navigasyon */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20 }}>
                    <button
                      onClick={() => setSlide(Math.max(0, slide - 1))}
                      disabled={slide === 0}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 34, height: 34, borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: 'transparent', color: slide === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                        cursor: slide === 0 ? 'default' : 'pointer',
                      }}
                    >
                      <ChevronLeft />
                    </button>

                    {/* Nokta göstergeler */}
                    <div style={{ display: 'flex', gap: 6 }}>
                      {SLIDES.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setSlide(i)}
                          style={{
                            width: i === slide ? 18 : 6,
                            height: 6, borderRadius: 3, border: 'none', padding: 0, cursor: 'pointer',
                            background: i === slide ? SLIDES[i].color || '#4ca8ad' : 'rgba(255,255,255,0.2)',
                            transition: 'width 0.2s, background 0.2s',
                          }}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => slide < totalSlides - 1 ? setSlide(slide + 1) : setShowInfo(false)}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: 34, height: 34, borderRadius: '50%',
                        border: '1px solid rgba(255,255,255,0.1)',
                        background: slide === totalSlides - 1 ? '#4ca8ad' : 'transparent',
                        color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
                      }}
                    >
                      <ChevronRight />
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </Overlay>
      )}

      {/* ── Troll onay popup ──────────────────────────────────── */}
      {pendingMood && (() => {
        const troll = TROLL_MODES[pendingMood];
        return (
          <Overlay onClick={() => setPendingMood(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--zet-bg-panel, #1a1a2e)',
                border: `1px solid ${troll.color}44`,
                borderRadius: 16, padding: '20px 24px', width: '100%', maxWidth: 400,
                boxShadow: `0 0 40px ${troll.color}22`,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, color: troll.color, marginBottom: 10 }}>
                {troll.label} modu
              </div>
              {troll.hasWarning && (
                <div style={{
                  marginBottom: 12, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                  fontSize: 12, color: '#f87171',
                }}>
                  Uyari: {troll.warning}
                </div>
              )}
              {!troll.hasWarning && (
                <p style={{ fontSize: 13, color: 'var(--zet-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                  {troll.label} modunu aktif etmek istiyor musun?
                </p>
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: troll.hasWarning ? 4 : 0 }}>
                <button
                  onClick={() => setPendingMood(null)}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
                    color: 'var(--zet-text-muted)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
                  }}
                >
                  Iptal
                </button>
                <button
                  onClick={confirmMood}
                  style={{
                    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
                    background: troll.color, color: '#fff', fontSize: 13,
                    cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  Aktif Et
                </button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ── Kilitli mod popup ─────────────────────────────────── */}
      {lockedMood && (() => {
        const troll = TROLL_MODES[lockedMood];
        return (
          <Overlay onClick={() => setLockedMood(null)}>
            <div
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--zet-bg-panel, #1a1a2e)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '20px 24px', width: '100%', maxWidth: 400,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <LockIcon />
                <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>
                  {troll.label} Kilitli
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--zet-text-muted)', lineHeight: 1.65, marginBottom: 18 }}>
                Bu mod kasaya ozeldir. Kasalardan birini acarak bu modu kazanabilirsin.
              </p>
              <button
                onClick={() => setLockedMood(null)}
                style={{
                  width: '100%', padding: '9px 0', borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                  fontSize: 13, cursor: 'pointer', fontWeight: 600,
                }}
              >
                Tamam
              </button>
            </div>
          </Overlay>
        );
      })()}
    </>
  );
};

export default ChatSettingsPanel;
