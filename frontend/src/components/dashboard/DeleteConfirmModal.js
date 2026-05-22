import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteConfirmModal = ({ title, subtitle, onConfirm, onCancel, cancelLabel = 'İptal', confirmLabel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }} onClick={onCancel}>
    <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(239,68,68,0.4)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.15)' }}>
          <Trash2 className="h-5 w-5" style={{ color: '#ef4444' }} />
        </div>
        <div>
          <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>{title}</p>
          {subtitle && <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{subtitle}</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
          {cancelLabel}
        </button>
        <button onClick={onConfirm} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#ef4444' }}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default DeleteConfirmModal;
