import React from 'react';
import { X, Zap } from 'lucide-react';

const CREDIT_TIERS = [
  { id: 'pack_50k',  color: '#10b981', glow: 'rgba(16,185,129,0.15)',  label: 'Başlangıç' },
  { id: 'pack_230k', color: '#3b82f6', glow: 'rgba(59,130,246,0.15)',  label: 'Standart' },
  { id: 'pack_700k', color: '#8b5cf6', glow: 'rgba(139,92,246,0.18)', label: 'Popüler',      badge: true },
  { id: 'pack_950k', color: '#f59e0b', glow: 'rgba(245,158,11,0.18)', label: 'En Avantajlı', badge: true, featured: true },
];

const CreditsModal = ({ creditPackages, buyingCredits, handleBuyCredits, onClose }) => {
  const hasDiscount = creditPackages.length > 0 && creditPackages[0].discounted_price !== creditPackages[0].price;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="zet-card p-5 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5" style={{ color: '#f59e0b' }} />
            <h2 className="text-lg font-bold" style={{ color: 'var(--zet-text)' }}>Kredi Satın Al</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
            <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          </button>
        </div>

        {hasDiscount && (
          <div className="mb-3 px-3 py-2 rounded-xl flex items-center gap-2" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Zap className="h-3 w-3 flex-shrink-0" style={{ color: '#10b981' }} />
            <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Abone indirimi — %10 indirim aktif!</span>
          </div>
        )}

        <div className="space-y-2.5">
          {creditPackages.map((pkg, i) => {
            const tier = CREDIT_TIERS.find(t => t.id === pkg.id) || CREDIT_TIERS[0];
            const priceDiff = pkg.discounted_price !== pkg.price;
            const fmtCredits = pkg.credits >= 1000000
              ? `${(pkg.credits / 1000000).toFixed(pkg.credits % 1000000 === 0 ? 0 : 1)}M`
              : `${(pkg.credits / 1000).toFixed(0)}K`;
            const barWidth = [15, 35, 70, 100][i] || 50;
            return (
              <div
                key={pkg.id}
                data-testid={`credit-pack-${pkg.credits}`}
                className="relative overflow-hidden rounded-2xl transition-all hover:scale-[1.01]"
                style={{
                  background: tier.featured ? 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(251,191,36,0.04))' : 'var(--zet-bg)',
                  border: `1px solid ${tier.featured ? 'rgba(245,158,11,0.35)' : 'var(--zet-border)'}`,
                  padding: tier.featured ? '14px 16px' : '11px 14px',
                  boxShadow: tier.featured ? '0 0 20px rgba(245,158,11,0.15)' : 'none',
                }}
              >
                {tier.badge && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: tier.glow, color: tier.color, border: `1px solid ${tier.color}40` }}>
                    {tier.label}
                  </span>
                )}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <div className="rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ width: tier.featured ? 40 : 32, height: tier.featured ? 40 : 32, background: tier.glow }}>
                      <Zap style={{ width: tier.featured ? 19 : 15, height: tier.featured ? 19 : 15, color: tier.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold" style={{ fontSize: tier.featured ? 18 : 15, color: tier.color }}>{fmtCredits}</span>
                        <span className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>kredi</span>
                        {!tier.badge && <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: tier.glow, color: tier.color }}>{tier.label}</span>}
                      </div>
                      <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${barWidth}%`, background: `linear-gradient(90deg, ${tier.color}88, ${tier.color})` }} />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="text-right">
                      {priceDiff && <p className="text-[9px] line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price.toFixed(2)}</p>}
                      <p className="font-bold" style={{ fontSize: tier.featured ? 16 : 13, color: priceDiff ? '#10b981' : 'var(--zet-text)' }}>${pkg.discounted_price.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => handleBuyCredits(pkg.id)}
                      disabled={buyingCredits}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-40"
                      style={{ background: tier.color, color: '#fff', minWidth: 64 }}
                      data-testid={`buy-credit-${pkg.credits}`}
                    >
                      {buyingCredits ? '...' : 'Satın Al'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
          Ödeme LemonSqueezy üzerinden güvenli işlenir. Abonelik sahiplerine %10 indirim otomatik uygulanır.
        </p>
      </div>
    </div>
  );
};

export default CreditsModal;
