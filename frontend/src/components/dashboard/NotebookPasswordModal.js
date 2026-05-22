import React from 'react';
import { Lock } from 'lucide-react';

const NotebookPasswordModal = ({
  notebookPasswordModal, setNotebookPasswordModal,
  nbPwInput, setNbPwInput,
  nbPwConfirm, setNbPwConfirm,
  nbPwError, setNbPwError,
  nbPwLoading, nbLockoutUntil, nbFailedAttempts,
  handleNotebookPasswordSubmit,
}) => {
  const closeModal = () => { setNotebookPasswordModal(null); setNbPwInput(''); setNbPwConfirm(''); setNbPwError(''); };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeModal}>
      <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(76,168,173,0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,168,173,0.15)' }}>
            <Lock className="h-5 w-5" style={{ color: '#4ca8ad' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>
              {notebookPasswordModal.mode === 'set' ? 'Şifre Koy' : notebookPasswordModal.mode === 'remove' ? 'Şifre Kaldır' : 'Defter Kilidi'}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--zet-text-muted)' }}>{notebookPasswordModal.notebookName}</p>
          </div>
        </div>

        {notebookPasswordModal.mode === 'unlock' && (() => {
          const lockUntil = nbLockoutUntil[notebookPasswordModal.notebookId] || 0;
          const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
          const failed = nbFailedAttempts[notebookPasswordModal.notebookId] || 0;
          return (
            <>
              {remaining > 0 && (
                <div className="mb-3 p-3 rounded-lg text-sm text-center" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                  {remaining} saniye bekleyin...
                </div>
              )}
              {failed >= 3 && remaining === 0 && (
                <p className="text-xs mb-2 text-center" style={{ color: '#f59e0b' }}>{failed} başarısız deneme</p>
              )}
            </>
          );
        })()}

        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>
              {notebookPasswordModal.mode === 'unlock' ? 'Şifre' : notebookPasswordModal.mode === 'set' ? 'Yeni Şifre (min. 4 karakter)' : 'Mevcut Şifre'}
            </label>
            <input
              type="password"
              value={nbPwInput}
              onChange={e => { setNbPwInput(e.target.value); setNbPwError(''); }}
              onKeyDown={e => e.key === 'Enter' && (notebookPasswordModal.mode === 'set' ? document.getElementById('nb-pw-confirm')?.focus() : handleNotebookPasswordSubmit())}
              className="zet-input w-full"
              placeholder="••••"
              autoFocus
              disabled={nbLockoutUntil[notebookPasswordModal.notebookId] > Date.now()}
            />
          </div>
          {notebookPasswordModal.mode === 'set' && (
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Şifre Tekrar</label>
              <input
                id="nb-pw-confirm"
                type="password"
                value={nbPwConfirm}
                onChange={e => { setNbPwConfirm(e.target.value); setNbPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleNotebookPasswordSubmit()}
                className="zet-input w-full"
                placeholder="••••"
              />
            </div>
          )}
          {nbPwError && <p className="text-xs" style={{ color: '#ef4444' }}>{nbPwError}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={closeModal} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
            İptal
          </button>
          <button
            onClick={handleNotebookPasswordSubmit}
            disabled={nbPwLoading || nbLockoutUntil[notebookPasswordModal.notebookId] > Date.now()}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad' }}
          >
            {nbPwLoading ? '...' : notebookPasswordModal.mode === 'unlock' ? 'Aç' : notebookPasswordModal.mode === 'set' ? 'Kaydet' : 'Kaldır'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotebookPasswordModal;
