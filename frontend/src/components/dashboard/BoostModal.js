import React from 'react';
import { X } from 'lucide-react';

const BoostModal = ({ boostPackages, boostingTier, boostError, purchaseBoost, onClose }) => (
  <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}>
    <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--zet-text)' }}>🚀 Gönderiyi Öne Çıkar</h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--zet-text-muted)' }}>ZET kredisiyle daha fazla kişiye ulaş</p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} /></button>
      </div>
      <div className="space-y-2.5">
        {boostPackages.map(pkg => (
          <button
            key={pkg.tier}
            onClick={() => purchaseBoost(pkg.tier)}
            disabled={!!boostingTier}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}
          >
            <div className="text-left">
              <p className="font-semibold">{pkg.label}</p>
              <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{pkg.duration_hours < 24 ? `${pkg.duration_hours} saat` : `${pkg.duration_hours / 24} gün`}</p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ color: '#f59e0b' }}>{pkg.credits} kredi</p>
              <p className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>≈ ₺{pkg.price_try}</p>
            </div>
          </button>
        ))}
      </div>
      {boostError && <p className="mt-3 text-xs px-3 py-2 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>{boostError}</p>}
      {boostingTier && <p className="mt-3 text-xs text-center" style={{ color: 'var(--zet-text-muted)' }}>İşleniyor...</p>}
    </div>
  </div>
);

export default BoostModal;
