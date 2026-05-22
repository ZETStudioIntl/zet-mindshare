import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { DraggablePanel } from './DraggablePanel';

const ChatSettingsPanel = () => {
  const {
    isMobile, showChatSettings, setShowChatSettings,
    zetaMood, setZetaMood, zetaCustomPrompt, setZetaCustomPrompt,
    zetaEmoji, setZetaEmoji, judgeMood, setJudgeMood,
  } = useContext(EditorStateContext);
  if (!showChatSettings) return null;
  return (
    <DraggablePanel title="Chat Ayarları" onClose={() => setShowChatSettings(false)} initialPosition={{ x: isMobile ? 20 : 280, y: 80 }}>
      <div className="w-80 space-y-4">
        {/* ZETA Settings */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(76, 168, 173, 0.1)', border: '1px solid rgba(76, 168, 173, 0.3)' }}>
          <h4 className="font-semibold text-sm mb-3" style={{ color: '#4ca8ad' }}>ZETA Özelleştirme</h4>
          <div className="space-y-3">
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
              <select 
                value={zetaMood} 
                onChange={e => { setZetaMood(e.target.value); localStorage.setItem('zet_zeta_mood', e.target.value); }}
                className="zet-input text-xs w-full"
              >
                <option value="cheerful">🎉 Neşeli</option>
                <option value="professional">💼 Profesyonel</option>
                <option value="curious">🔍 Meraklı</option>
                <option value="custom">✨ Özel</option>
              </select>
            </div>
            {zetaMood === 'custom' && (
              <div>
                <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Özel Prompt</label>
                <textarea 
                  value={zetaCustomPrompt} 
                  onChange={e => { setZetaCustomPrompt(e.target.value); localStorage.setItem('zet_zeta_custom', e.target.value); }}
                  placeholder="ZETA nasıl davransın? Örn: Kısa ve öz cevaplar ver, her cevabın sonuna bir bilgi ekle..."
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
                <option value="none">❌ Kullanma</option>
                <option value="low">📍 Az Kullan</option>
                <option value="medium">📌 Orta</option>
                <option value="high">🎯 Çok Kullan</option>
              </select>
            </div>
          </div>
        </div>

        {/* Judge Settings */}
        <div className="p-3 rounded-lg" style={{ background: 'rgba(200, 0, 90, 0.1)', border: '1px solid rgba(200, 0, 90, 0.3)' }}>
          <h4 className="font-semibold text-sm mb-3" style={{ color: '#c8005a' }}>ZET Judge Mini Özelleştirme</h4>
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Mod</label>
            <select 
              value={judgeMood} 
              onChange={e => { setJudgeMood(e.target.value); localStorage.setItem('zet_judge_mood', e.target.value); }}
              className="zet-input text-xs w-full"
            >
              <option value="normal">⚖️ Normal (Yapıcı eleştiri)</option>
              <option value="harsh">🔥 Sert (Esprili dalga geçme)</option>
            </select>
            <p className="text-xs mt-2 opacity-70" style={{ color: 'var(--zet-text-muted)' }}>
              {judgeMood === 'harsh' ? '😈 Judge sizi esprilerle "kavuracak"!' : '🤝 Judge yapıcı ve profesyonel olacak.'}
            </p>
          </div>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default ChatSettingsPanel;
