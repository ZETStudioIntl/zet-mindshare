import React from 'react';
import { X, Check } from 'lucide-react';

const MISSIONS = [
  { title: 'İlk Belge', desc: 'İlk belgenizi oluşturun', xp: 10, progress: 100, done: true },
  { title: 'AI Keşifçisi', desc: 'ZETA ile 5 sohbet yapın', xp: 25, progress: 40 },
  { title: 'Renk Ustası', desc: 'Gradient kullanın', xp: 15, progress: 0 },
  { title: 'Grafik Sihirbazı', desc: '3 grafik oluşturun', xp: 30, progress: 33 },
  { title: 'Şablon Uzmanı', desc: '5 farklı şablon kullanın', xp: 20, progress: 0 },
  { title: 'Organizatör', desc: '10 not oluşturun', xp: 15, progress: 0 },
];

const MissionsModal = ({ onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>Görevler</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--zet-text)' }}>Aktif Görevler</h4>
        <div className="space-y-2">
          {MISSIONS.map((mission, i) => (
            <div key={i} className="p-3 rounded-lg" style={{ background: mission.done ? 'rgba(34, 197, 94, 0.1)' : 'var(--zet-bg)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium" style={{ color: mission.done ? '#22c55e' : 'var(--zet-text)' }}>
                  {mission.done && <Check className="h-3 w-3 inline mr-1" />}
                  {mission.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#f59e0b', color: 'white' }}>+{mission.xp} XP</span>
              </div>
              <p className="text-xs mb-2" style={{ color: 'var(--zet-text-muted)' }}>{mission.desc}</p>
              {!mission.done && (
                <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--zet-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${mission.progress}%`, background: '#4ca8ad' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default MissionsModal;
