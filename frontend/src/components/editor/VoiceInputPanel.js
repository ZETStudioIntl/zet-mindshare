import React, { useContext } from 'react';
import { EditorStateContext } from '../../contexts/EditorStateContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { DraggablePanel } from './DraggablePanel';
import { Zap, Loader2, Mic } from 'lucide-react';

const VoiceInputPanel = () => {
  const { language } = useLanguage();
  const {
    isMobile, showVoiceInput, setShowVoiceInput,
    isRecordingEL, elSttLoading, startElevenLabsSTT, stopElevenLabsSTT,
    isListening, startListening, stopListening,
    voiceTranscript, setVoiceTranscript, addVoiceTextToDocument,
  } = useContext(EditorStateContext);
  if (!showVoiceInput) return null;
  return (
    <DraggablePanel title="Ses Girişi" onClose={() => { setShowVoiceInput(false); stopListening(); stopElevenLabsSTT(); setVoiceTranscript(''); }} initialPosition={{ x: isMobile ? 20 : 280, y: 100 }}>
      <div className="w-72 space-y-3">
        {/* ElevenLabs STT */}
        <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg)' }}>
          <p className="text-xs font-semibold mb-2 flex items-center gap-1" style={{ color: 'var(--zet-primary)' }}>
            <Zap className="h-3 w-3" /> ElevenLabs Scribe
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={isRecordingEL ? stopElevenLabsSTT : startElevenLabsSTT}
              disabled={elSttLoading}
              className={`flex-1 py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isRecordingEL ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-600 hover:bg-blue-700 text-white'} disabled:opacity-50`}
            >
              {elSttLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mic className="h-3.5 w-3.5" />}
              {elSttLoading ? 'İşleniyor...' : isRecordingEL ? 'Durdur' : 'Kayıt Başlat'}
            </button>
          </div>
        </div>

        {/* Browser STT */}
        <div className="p-3 rounded-lg border" style={{ borderColor: 'var(--zet-border)', background: 'var(--zet-bg)' }}>
          <p className="text-xs font-semibold mb-2" style={{ color: 'var(--zet-text-muted)' }}>Tarayıcı STT</p>
          <button
            onClick={isListening ? stopListening : startListening}
            className={`w-full py-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : ''}`}
            style={!isListening ? { background: 'var(--zet-bg-card)', color: 'var(--zet-text)' } : {}}
          >
            <Mic className="h-3.5 w-3.5" />
            {isListening ? 'Dinleniyor... Durdurmak için tıkla' : 'Dinlemeye başla'}
          </button>
        </div>

        {voiceTranscript && (
          <div className="space-y-2">
            <label className="text-xs block" style={{ color: 'var(--zet-text-muted)' }}>Transkript:</label>
            <div className="p-3 rounded text-sm max-h-32 overflow-y-auto" style={{ background: 'var(--zet-bg)', color: 'var(--zet-text)' }}>
              {voiceTranscript}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setVoiceTranscript('')} className="zet-btn text-xs py-2" style={{ background: 'var(--zet-bg)' }}>Temizle</button>
              <button onClick={addVoiceTextToDocument} className="zet-btn text-xs py-2">Belgeye Ekle</button>
            </div>
          </div>
        )}

        <div className="text-xs pt-2 border-t" style={{ borderColor: 'var(--zet-border)', color: 'var(--zet-text-muted)' }}>
          <p>Dil: {language === 'tr' ? 'Türkçe' : 'English'}</p>
        </div>
      </div>
    </DraggablePanel>
  );
};

export default VoiceInputPanel;
