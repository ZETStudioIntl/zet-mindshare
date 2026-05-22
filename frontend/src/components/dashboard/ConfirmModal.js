import React from 'react';
import { Trash2, Check } from 'lucide-react';

const ConfirmModal = ({ confirmModal, setConfirmModal }) => (
  <div className="fixed inset-0 z-[99] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={() => setConfirmModal(null)}>
    <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()}
      style={{ border: `1px solid ${confirmModal.danger ? 'rgba(239,68,68,0.4)' : 'rgba(76,168,173,0.3)'}` }}>
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: confirmModal.danger ? 'rgba(239,68,68,0.15)' : 'rgba(76,168,173,0.15)' }}>
          {confirmModal.danger
            ? <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
            : <Check className="h-5 w-5" style={{ color: '#4ca8ad' }} />}
        </div>
        <div>
          <p className="font-semibold mb-1" style={{ color: 'var(--zet-text)' }}>{confirmModal.title}</p>
          <p className="text-sm whitespace-pre-line" style={{ color: 'var(--zet-text-muted)' }}>{confirmModal.msg}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setConfirmModal(null)} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
          İptal
        </button>
        <button
          onClick={() => { const fn = confirmModal.onConfirm; setConfirmModal(null); fn(); }}
          className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
          style={confirmModal.danger
            ? { background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }
            : { background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad' }}
        >
          Onayla
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
