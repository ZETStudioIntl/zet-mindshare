import React from 'react';
import { X, Check, Zap, Lock } from 'lucide-react';

const PLAN_ORDER = ['free', 'plus', 'pro', 'creative_station'];

const PLANS_DATA = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    color: '#6b7280',
    features: ['80 Kredi/gün', '100K Token/gün', '1 Defter', '3 Fast Select'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: 9.99,
    color: '#3b82f6',
    features: ['250 Kredi/gün', '480K Token/gün', 'Tüm araçlar açık', '10 Defter', 'Judge Aziz'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19.99,
    color: '#8b5cf6',
    features: ['500 Kredi/gün', '1.3M Token/gün', 'Nano Banana Pro', '50GB Prime Drive', '8 Fast Select'],
  },
  {
    id: 'creative_station',
    name: 'Creative Station',
    price: 49,
    color: '#f59e0b',
    features: ['4000 Ortak Kredi', '4.8M Token/gün', '1TB Prime Drive', 'Öncelikli Destek', 'Garantili Sandık'],
  },
];

const PLAN_RANK = { free: 0, plus: 1, pro: 2, creative_station: 3 };

export default function UpgradePromptModal({
  featureName,
  requiredPlan,
  currentPlan = 'free',
  onClose,
  onSubscribe,
  onDetails,
}) {
  const required = requiredPlan || 'plus';
  const requiredRank = PLAN_RANK[required] ?? 1;

  return (
    <>
      <style>{`
        @keyframes upgradeGlow {
          0%, 100% { box-shadow: 0 0 18px 4px VAR_COLOR; }
          50% { box-shadow: 0 0 36px 10px VAR_COLOR; }
        }
      `}</style>
      <div
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 16,
        }}
        onClick={onClose}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            background: 'linear-gradient(135deg, #0d0f2a 0%, #111827 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 20, padding: '28px 28px 24px',
            width: '100%', maxWidth: 620,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: `linear-gradient(135deg, ${PLANS_DATA[requiredRank]?.color}30, ${PLANS_DATA[requiredRank]?.color}15)`,
                  border: `1px solid ${PLANS_DATA[requiredRank]?.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Lock size={14} color={PLANS_DATA[requiredRank]?.color} />
                </div>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Özellik Kilitli</span>
              </div>
              <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>
                {featureName || 'Bu özellik'}
                <span style={{ color: PLANS_DATA[requiredRank]?.color }}> {PLANS_DATA[requiredRank]?.name}</span>
                {requiredRank < 3 ? ' ve üzeri' : ''} planlarda kullanılabilir
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 4, flexShrink: 0 }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Plan Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
            {PLANS_DATA.map(plan => {
              const rank = PLAN_RANK[plan.id];
              const isCurrent = plan.id === currentPlan;
              const isRequired = plan.id === required;
              const isUnlocks = rank >= requiredRank;
              const isDimmed = rank < requiredRank && !isCurrent;

              const glowColor = plan.color + '80';
              const glowColorSoft = plan.color + '40';

              return (
                <div
                  key={plan.id}
                  style={{
                    borderRadius: 14,
                    padding: '14px 12px',
                    border: isRequired
                      ? `2px solid ${plan.color}`
                      : isCurrent
                        ? '1px solid rgba(255,255,255,0.15)'
                        : isUnlocks
                          ? `1px solid ${plan.color}50`
                          : '1px solid rgba(255,255,255,0.07)',
                    background: isRequired
                      ? `linear-gradient(135deg, ${plan.color}20, ${plan.color}08)`
                      : isUnlocks
                        ? `linear-gradient(135deg, ${plan.color}10, transparent)`
                        : 'rgba(255,255,255,0.03)',
                    opacity: isDimmed ? 0.45 : 1,
                    animation: isRequired ? `upgradeGlow_${plan.id} 2s ease-in-out infinite` : 'none',
                    boxShadow: isRequired ? `0 0 22px 6px ${glowColor}` : isUnlocks ? `0 0 8px 1px ${glowColorSoft}` : 'none',
                    position: 'relative',
                    transition: 'all 0.2s',
                  }}
                >
                  {isRequired && (
                    <div style={{
                      position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                      background: plan.color, color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                    }}>
                      GEREKLİ
                    </div>
                  )}
                  {isCurrent && (
                    <div style={{
                      position: 'absolute', top: -9, left: '50%', transform: 'translateX(-50%)',
                      background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 9, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 99, whiteSpace: 'nowrap',
                    }}>
                      MEVCUT
                    </div>
                  )}

                  <div style={{ color: plan.color, fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{plan.name}</div>
                  <div style={{ color: '#fff', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>
                    {plan.price === 0 ? 'Ücretsiz' : `$${plan.price}`}
                    {plan.price > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>/ay</span>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {plan.features.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                        <Check size={10} color={isUnlocks ? plan.color : 'rgba(255,255,255,0.2)'} style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 10, color: isUnlocks ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => onSubscribe && onSubscribe(required)}
              style={{
                flex: 1, padding: '12px 20px', borderRadius: 12, border: 'none',
                background: `linear-gradient(135deg, ${PLANS_DATA[requiredRank]?.color}, ${PLANS_DATA[requiredRank]?.color}cc)`,
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Zap size={15} />
              Satın Al
            </button>
            <button
              onClick={() => onDetails && onDetails()}
              style={{
                padding: '12px 20px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.75)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Detaylara Bak
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
