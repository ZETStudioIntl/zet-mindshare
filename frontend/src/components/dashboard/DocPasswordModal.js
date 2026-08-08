import React from 'react';
import { Lock } from 'lucide-react';

const DocPasswordModal = ({
  docPasswordModal, setDocPasswordModal,
  docPwInput, setDocPwInput,
  docPwConfirm, setDocPwConfirm,
  docPwError, setDocPwError,
  docPwLoading, docPwLockout, docPwFailed,
  handleDocPasswordSubmit,
  onForgotPassword,
  t,
}) => {
  const closeModal = () => { setDocPasswordModal(null); setDocPwInput(''); setDocPwConfirm(''); setDocPwError(''); };
  const { mode, docId, docTitle } = docPasswordModal;

  const lockUntil = docPwLockout[docId] || 0;
  const remaining = Math.max(0, Math.ceil((lockUntil - Date.now()) / 1000));
  const failed = docPwFailed[docId] || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={closeModal}>
      <div className="zet-card p-6 mx-4 w-full max-w-sm animate-fadeIn" onClick={e => e.stopPropagation()} style={{ border: '1px solid rgba(76,168,173,0.4)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(76,168,173,0.15)' }}>
            <Lock className="h-5 w-5" style={{ color: '#4ca8ad' }} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--zet-text)' }}>
              {mode === 'set' ? t('addPassword') : mode === 'remove' ? t('removePassword') : t('docLock')}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--zet-text-muted)' }}>{docTitle}</p>
          </div>
        </div>

        {mode === 'unlock' && (
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
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>
              {mode === 'unlock' ? 'Şifre' : mode === 'set' ? 'Yeni Şifre (min. 4 karakter)' : 'Mevcut Şifre'}
            </label>
            <input
              type="password"
              value={docPwInput}
              onChange={e => { setDocPwInput(e.target.value); setDocPwError(''); }}
              onKeyDown={e => e.key === 'Enter' && (mode === 'set' ? document.getElementById('doc-pw-confirm')?.focus() : handleDocPasswordSubmit())}
              className="zet-input w-full"
              placeholder="••••"
              autoFocus
              disabled={lockUntil > Date.now()}
            />
          </div>
          {mode === 'set' && (
            <div>
              <label className="text-xs block mb-1" style={{ color: 'var(--zet-text-muted)' }}>Şifre Tekrar</label>
              <input
                id="doc-pw-confirm"
                type="password"
                value={docPwConfirm}
                onChange={e => { setDocPwConfirm(e.target.value); setDocPwError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleDocPasswordSubmit()}
                className="zet-input w-full"
                placeholder="••••"
              />
            </div>
          )}
          {docPwError && <p className="text-xs" style={{ color: '#ef4444' }}>{docPwError}</p>}
        </div>

        <div className="flex gap-2 mt-4">
          <button onClick={closeModal} className="flex-1 py-2 rounded-lg text-sm font-medium transition-all hover:bg-white/10" style={{ color: 'var(--zet-text-muted)', border: '1px solid var(--zet-border)' }}>
            İptal
          </button>
          <button
            onClick={handleDocPasswordSubmit}
            disabled={docPwLoading || lockUntil > Date.now()}
            className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
            style={{ background: 'rgba(76,168,173,0.2)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad' }}
          >
            {docPwLoading ? '...' : mode === 'unlock' ? 'Aç' : mode === 'set' ? 'Kaydet' : 'Kaldır'}
          </button>
        </div>

        {mode === 'unlock' && (
          <button
            onClick={() => onForgotPassword('document', docId)}
            className="w-full mt-3 text-xs text-center transition-all hover:opacity-80"
            style={{ color: 'var(--zet-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {t('forgotPassword')}
          </button>
        )}
      </div>
    </div>
  );
};

export default DocPasswordModal;
