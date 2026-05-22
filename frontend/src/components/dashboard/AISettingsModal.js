import React from 'react';
import { X, Sparkles, Scale } from 'lucide-react';

const AISettingsModal = ({ zetaMood, setZetaMood, zetaEmoji, setZetaEmoji, zetaCustomPrompt, setZetaCustomPrompt, judgeMood, setJudgeMood, onClose }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="zet-card p-6 w-full max-w-md animate-fadeIn" onClick={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold" style={{ color: 'var(--zet-text)' }}>AI Ayarları</h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-white/10">
          <X className="h-5 w-5" style={{ color: 'var(--zet-text-muted)' }} />
        </button>
      </div>
      <div className="space-y-4">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5" style={{ color: '#4ca8ad' }} />
            <h3 className="font-semibold" style={{ color: '#4ca8ad' }}>ZETA Özelleştirme</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
              <select value={zetaMood} onChange={e => { setZetaMood(e.target.value); localStorage.setItem('zet_zeta_mood', e.target.value); }} className="zet-input text-sm w-full">
                <option value="cheerful">Neşeli</option>
                <option value="professional">Profesyonel</option>
                <option value="curious">Meraklı</option>
                <option value="custom">Özel</option>
              </select>
            </div>
            {zetaMood === 'custom' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Özel Prompt</label>
                <textarea value={zetaCustomPrompt} onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }} placeholder="ZETA nasıl davransın?" className="zet-input text-sm w-full h-20 resize-none" />
              </div>
            )}
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Emoji Kullanımı</label>
              <select value={zetaEmoji} onChange={e => { setZetaEmoji(e.target.value); localStorage.setItem('zet_zeta_emoji', e.target.value); }} className="zet-input text-sm w-full">
                <option value="none">Kullanma</option>
                <option value="low">Az Kullan</option>
                <option value="medium">Orta</option>
                <option value="high">Çok Kullan</option>
              </select>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(200, 0, 90, 0.1)', border: '1px solid rgba(200, 0, 90, 0.3)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Scale className="h-5 w-5" style={{ color: '#c8005a' }} />
            <h3 className="font-semibold" style={{ color: '#c8005a' }}>ZET Judge Mini Özelleştirme</h3>
          </div>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
            <select value={judgeMood} onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }} className="zet-input text-sm w-full">
              <option value="normal">Normal (Yapıcı eleştiri)</option>
              <option value="harsh">Sert (Esprili dalga geçme)</option>
            </select>
            <p className="text-xs mt-2" style={{ color: 'var(--zet-text-muted)' }}>
              {judgeMood === 'harsh' ? 'Judge sizi esprilerle "kavuracak"!' : 'Judge yapıcı ve profesyonel olacak.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default AISettingsModal;
