import React from 'react';
import { X } from 'lucide-react';

const RanksModal = ({ currentRank, nextRank, rankProgress, userZP, RANKS, RankIcon, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>Rütbe</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>

      <div className="p-4 rounded-xl mb-6 text-center" style={{ background: `linear-gradient(135deg, ${currentRank.color}33 0%, rgba(139,92,246,0.2) 100%)`, border: `1px solid ${currentRank.color}50` }}>
        <div className="flex justify-center mb-2"><RankIcon rank={currentRank} size={72} /></div>
        <h3 className="text-lg font-bold" style={{ color: currentRank.color }}>{currentRank.name}</h3>
        <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>
          Seviye {currentRank.level} • {userZP.toLocaleString()} XP {nextRank ? `/ ${nextRank.xp.toLocaleString()} XP` : '(Maksimum)'}
        </p>
        <div className="w-full h-2 rounded-full mt-2" style={{ background: 'var(--zet-bg)' }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${rankProgress}%`, background: `linear-gradient(90deg, ${currentRank.color}, #8b5cf6)` }} />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--zet-text)' }}>Tüm Rütbeler</h4>
        <div className="space-y-2">
          {RANKS.map((rank, i) => {
            const isCurrent = rank.name === currentRank.name;
            return (
              <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${isCurrent ? 'ring-2' : ''}`} style={{ background: isCurrent ? `${rank.color}1a` : 'var(--zet-bg)', outline: isCurrent ? `2px solid ${rank.color}` : undefined }}>
                <div className="flex items-center gap-2">
                  <RankIcon rank={rank} size={20} />
                  <span className="text-sm" style={{ color: isCurrent ? rank.color : 'var(--zet-text)' }}>{rank.name}</span>
                  {isCurrent && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: `${rank.color}33`, color: rank.color }}>Mevcut</span>}
                </div>
                <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>{rank.xp.toLocaleString()} XP</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </div>
);

export default RanksModal;
