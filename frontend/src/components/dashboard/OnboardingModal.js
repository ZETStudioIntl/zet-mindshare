import React from 'react';

const OnboardingModal = ({ obUsername, setObUsername, obDisplayName, setObDisplayName, obError, obSubmitting, submitOnboarding }) => (
  <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
    <div className="w-full max-w-md mx-4 rounded-2xl p-8" style={{ background: 'var(--zet-bg-card)', border: '1px solid var(--zet-border)' }}>
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--zet-primary)' }}>
          <span className="text-2xl">👋</span>
        </div>
        <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--zet-text)' }}>ZET Mindshare'e Hoş Geldin!</h2>
        <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>Hesabını kurmak için birkaç bilgiye ihtiyacımız var.</p>
        <div className="mt-3 px-3 py-2 rounded-lg text-xs font-medium" style={{ background: '#10b98120', color: '#10b981', border: '1px solid #10b98140' }}>
          🎁 İlk 1 ay Pro plan ücretsiz aktif edildi!
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Kullanıcı Adı <span style={{ color: '#ef4444' }}>*</span></label>
          <div className="flex items-center rounded-xl px-3 py-2.5" style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)' }}>
            <span className="text-sm mr-1" style={{ color: 'var(--zet-text-muted)' }}>@</span>
            <input
              type="text"
              value={obUsername}
              onChange={e => setObUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20))}
              placeholder="kullanici_adi"
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--zet-text)' }}
            />
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--zet-text-muted)' }}>3-20 karakter, harf/rakam/alt çizgi. 30 günde bir değiştirilebilir.</p>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--zet-text-muted)' }}>Görünen İsim <span style={{ color: '#ef4444' }}>*</span></label>
          <input
            type="text"
            value={obDisplayName}
            onChange={e => setObDisplayName(e.target.value.slice(0, 50))}
            placeholder="Adın Soyadın"
            className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
            style={{ background: 'var(--zet-bg)', border: '1px solid var(--zet-border)', color: 'var(--zet-text)' }}
          />
        </div>
        {obError && <p className="text-xs px-3 py-2 rounded-lg" style={{ background: '#ef444420', color: '#ef4444' }}>{obError}</p>}
        <button
          onClick={submitOnboarding}
          disabled={obSubmitting || obUsername.length < 3 || !obDisplayName.trim()}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: 'var(--zet-primary)', color: '#fff' }}
        >
          {obSubmitting ? 'Kaydediliyor...' : 'Devam Et'}
        </button>
      </div>
    </div>
  </div>
);

export default OnboardingModal;
