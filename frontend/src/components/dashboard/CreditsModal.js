import React from 'react';
import { X, Zap } from 'lucide-react';

const CreditsModal = ({ creditPackages, buyingCredits, handleBuyCredits, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="zet-card p-5 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" style={{ color: '#fbbf24' }} />
          <h2 className="text-lg font-bold" style={{ color: 'var(--zet-text)' }}>Kredi Satin Al</h2>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10">
          <X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>

      {creditPackages.length > 0 && creditPackages[0].discounted_price !== creditPackages[0].price && (
        <div className="mb-3 px-3 py-2 rounded-lg text-center" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <span className="text-xs font-bold" style={{ color: '#10b981' }}>%15 Abone Indirimi Uygulandi!</span>
        </div>
      )}

      <div className="space-y-2.5">
        {creditPackages.map(pkg => {
          const hasDiscount = pkg.discounted_price !== pkg.price;
          return (
            <div key={pkg.id} className="flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
              style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}
              data-testid={`credit-pack-${pkg.credits}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
                  background: pkg.credits >= 1000 ? 'rgba(251,191,36,0.15)' : pkg.credits >= 700 ? 'rgba(139,92,246,0.15)' : pkg.credits >= 350 ? 'rgba(59,130,246,0.15)' : 'rgba(16,185,129,0.15)'
                }}>
                  <Zap className="h-5 w-5" style={{ color: pkg.credits >= 1000 ? '#fbbf24' : pkg.credits >= 700 ? '#8b5cf6' : pkg.credits >= 350 ? '#3b82f6' : '#10b981' }} />
                </div>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--zet-text)' }}>{pkg.credits} Kredi</p>
                  <p className="text-[10px]" style={{ color: 'var(--zet-text-muted)' }}>
                    {pkg.credits >= 1000 ? 'En Avantajlı' : pkg.credits >= 700 ? 'Popüler' : pkg.credits >= 350 ? 'Standart' : 'Başlangıç'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="text-right">
                  {hasDiscount && <p className="text-[10px] line-through" style={{ color: 'var(--zet-text-muted)' }}>${pkg.price}</p>}
                  <p className="text-sm font-bold" style={{ color: hasDiscount ? '#10b981' : 'var(--zet-text)' }}>${pkg.discounted_price}</p>
                </div>
                <button
                  onClick={() => handleBuyCredits(pkg.id)}
                  disabled={buyingCredits}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:scale-105 disabled:opacity-40"
                  style={{ background: 'var(--zet-primary)', color: 'white' }}
                  data-testid={`buy-credit-${pkg.credits}`}
                >
                  {buyingCredits ? '...' : 'Satin Al'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-center mt-3" style={{ color: 'var(--zet-text-muted)' }}>
        Kredi paketleri aninda hesabiniza eklenir. Free dışındaki planlara %15 indirim uygulanir.
        <br />Maksimum kredi bakiyesi: 1000. Limit asildiginda fazla krediler silinir.
      </p>
    </div>
  </div>
);

export default CreditsModal;
