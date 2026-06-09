import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FileText, Sparkles, Cloud, Layout, Mail, Lock, User, Check, ChevronRight, ArrowLeft, Plus } from 'lucide-react';
import axios from 'axios';
import ZetIdButton from '../components/ZetIdButton';
import { getZetIdAccounts, createZetIdForCurrentSession, loginWithZetIdAccount, removeZetIdAccount } from '../lib/zetId';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AppleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
    <path d="M14.94 12.66c-.26.6-.57 1.15-.93 1.66-.49.7-.9 1.18-1.21 1.45-.48.44-.99.67-1.55.69-.4 0-.88-.11-1.44-.34-.56-.23-1.08-.34-1.55-.34-.49 0-1.02.11-1.58.34-.56.23-1.02.35-1.37.36-.53.02-1.05-.22-1.55-.71-.35-.3-.78-.81-1.29-1.53-.55-.77-1-1.67-1.36-2.69-.38-1.1-.57-2.17-.57-3.2 0-1.18.26-2.2.77-3.04.4-.68.94-1.21 1.62-1.61.68-.4 1.42-.6 2.2-.61.42 0 .98.13 1.67.38.69.26 1.13.39 1.32.39.14 0 .63-.15 1.44-.45.77-.28 1.42-.4 1.95-.35 1.44.12 2.52.69 3.24 1.73-1.29.78-1.92 1.87-1.91 3.28.01 1.09.41 2 1.19 2.72.35.34.75.6 1.18.78-.1.28-.2.55-.3.83zM11.37.36c0 .86-.31 1.66-.94 2.39-.76.89-1.67 1.4-2.67 1.32a2.68 2.68 0 0 1-.02-.33c0-.82.36-1.7 1-2.42.32-.36.73-.67 1.23-.91.5-.24.97-.37 1.41-.39.01.12.02.23.02.34h-.03z"/>
  </svg>
);

const ZetIdAccountRow = ({ account, onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="zet-card w-full flex items-center gap-3 p-3 text-left transition-all hover:opacity-90 disabled:opacity-50"
    data-testid="zet-id-account-row"
  >
    {account.picture ? (
      <img src={account.picture} alt={account.name || account.zet_id} className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
    ) : (
      <div className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 font-semibold text-white" style={{ background: '#292F91' }}>
        {(account.name || account.zet_id || '?').charAt(0).toUpperCase()}
      </div>
    )}
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium truncate" style={{ color: 'var(--zet-text)' }}>{account.name || account.email}</p>
      <p className="text-xs truncate" style={{ color: 'var(--zet-text-muted)' }}>{account.zet_id}</p>
    </div>
    {loading ? (
      <span className="text-xs flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }}>Yükleniyor...</span>
    ) : (
      <ChevronRight className="h-4 w-4 flex-shrink-0" style={{ color: 'var(--zet-text-muted)' }} />
    )}
  </button>
);

const LoginPage = () => {
  const { login, setUser } = useAuth();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // ZET ID akışı: 'main' (iki buton) | 'picker' (cihazdaki hesaplar) | 'add' (Google/Apple/Email)
  const [view, setView] = useState('main');
  const [addMethod, setAddMethod] = useState(null);
  const [accounts, setAccounts] = useState(() => getZetIdAccounts());
  const [pickerLoadingId, setPickerLoadingId] = useState(null);
  const [welcomeZetId, setWelcomeZetId] = useState(null);

  const finishLogin = async (user) => {
    setUser(user);
    try {
      const created = await createZetIdForCurrentSession();
      if (created.is_new) {
        setWelcomeZetId(created.zet_id);
        return;
      }
    } catch {
      // ZET ID oluşturulamadı — giriş akışını engelleme
    }
    window.location.href = '/app-select';
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (authMode === 'register' && !termsAccepted) {
      setError('Devam etmek için sozlesmeleri kabul etmelisiniz.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email, password }
        : { email, password, name };
      const res = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      if (res.data.user) {
        await finishLogin(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Kimlik doğrulama başarısız');
    }
    setLoading(false);
  };

  const handleAppleLogin = async () => {
    try {
      const res = await axios.get(`${API}/auth/apple/init`, { withCredentials: true });
      if (res.data.auth_url) {
        window.location.href = res.data.auth_url;
      } else {
        setError('Apple ile giriş henuz yapilandirilmadi.');
      }
    } catch {
      setError('Apple ile giriş henuz yapilandirilmadi.');
    }
  };

  const openZetIdPicker = () => {
    setError('');
    setAccounts(getZetIdAccounts());
    setView('picker');
  };

  const openAddAccount = () => {
    setError('');
    setAddMethod(null);
    setView('add');
  };

  const backToMain = () => {
    setError('');
    setAddMethod(null);
    setView('main');
  };

  const handlePickAccount = async (account) => {
    setError('');
    setPickerLoadingId(account.zet_id);
    try {
      const res = await loginWithZetIdAccount(account);
      if (res.user) {
        setUser(res.user);
        window.location.href = '/app-select';
        return;
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 409) {
        // Cihaz uyuşmazlığı — hesabı kaldırma, kullanıcıya yeniden giriş seçeneği sun
        setError('Bu hesap farklı bir cihazdan tanınıyor — güvenlik için yeniden giriş yapmalısınız.');
        setPickerLoadingId(null);
        return;
      }
      // Geçersiz/süresi dolmuş token — hesabı listeden sil, döngüyü kır
      removeZetIdAccount(account.zet_id);
      const remaining = getZetIdAccounts();
      setAccounts(remaining);
      if (remaining.length === 0) {
        setAddMethod(null);
        setView('add');
      }
    }
    setPickerLoadingId(null);
  };

  const renderMain = () => (
    <>
      <div className="space-y-2.5 mb-2">
        <ZetIdButton onClick={openZetIdPicker} loading={false} label="ZET ID ile Giriş Yap" />
        <button
          onClick={openAddAccount}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium transition-all hover:opacity-80"
          style={{ background: 'transparent', color: '#292F91', border: '1.5px solid #292F91' }}
          data-testid="zet-id-add-btn"
        >
          <Plus className="h-4 w-4" />
          ZET ID Ekle
        </button>
      </div>
      <p className="text-xs mb-4" style={{ color: 'var(--zet-text-muted)' }}>
        ZET ID, tüm ZET uygulamalarında kullanabileceğiniz tek kimliğinizdir.
      </p>
    </>
  );

  const renderPicker = () => (
    <div className="text-left">
      <button onClick={backToMain} className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }} data-testid="zet-id-picker-back">
        <ArrowLeft className="h-3.5 w-3.5" /> Geri
      </button>
      <p className="text-sm font-medium mb-2" style={{ color: 'var(--zet-text)' }}>Bu cihazdaki ZET ID hesapları</p>
      {error && <p className="text-red-400 text-sm mb-2" data-testid="auth-error">{error}</p>}
      {accounts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm mb-3" style={{ color: 'var(--zet-text-muted)' }}>Bu cihazda kayıtlı ZET ID hesabı yok.</p>
          <button
            onClick={openAddAccount}
            className="zet-btn w-full flex items-center justify-center gap-2 py-2.5"
            style={{ background: '#292F91', color: '#fff' }}
            data-testid="zet-id-picker-add-empty"
          >
            <Plus className="h-4 w-4" /> ZET ID Ekle
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-2 mb-3">
            {accounts.map((acc) => (
              <ZetIdAccountRow key={acc.zet_id} account={acc} loading={pickerLoadingId === acc.zet_id} onClick={() => handlePickAccount(acc)} />
            ))}
          </div>
          <button
            onClick={openAddAccount}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{ background: 'transparent', color: '#292F91', border: '1.5px dashed #292F91' }}
            data-testid="zet-id-picker-add"
          >
            <Plus className="h-4 w-4" /> Başka ZET ID ekle
          </button>
        </>
      )}
    </div>
  );

  const renderAddMethods = () => (
    <div className="text-left">
      <button onClick={view === 'add' && accounts.length > 0 ? () => setView('picker') : backToMain} className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }} data-testid="zet-id-add-back">
        <ArrowLeft className="h-3.5 w-3.5" /> Geri
      </button>
      <p className="text-sm font-medium mb-1" style={{ color: 'var(--zet-text)' }}>ZET ID Ekle</p>
      <p className="text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }}>Mevcut bir hesabınızı bağlayın — bir dakikadan kısa sürer.</p>
      <div className="space-y-2.5">
        <button onClick={login} className="zet-btn w-full flex items-center justify-center gap-2.5 py-3" data-testid="google-login-btn">
          <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
          Google ile Bağlan
        </button>
        <button
          onClick={handleAppleLogin}
          className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl font-medium transition-all hover:opacity-90"
          style={{ background: '#000', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}
          data-testid="apple-login-btn"
        >
          <AppleIcon />
          Apple ile Bağlan
        </button>
        <button
          onClick={() => { setError(''); setAddMethod('email'); }}
          className="zet-btn w-full flex items-center justify-center gap-2.5 py-3"
          style={{ background: 'var(--zet-bg-card)' }}
          data-testid="email-method-btn"
        >
          <Mail className="h-4 w-4" />
          E-posta ile Bağlan
        </button>
      </div>
    </div>
  );

  const renderEmailForm = () => (
    <div className="text-left">
      <button onClick={() => setAddMethod(null)} className="flex items-center gap-1.5 text-xs mb-3" style={{ color: 'var(--zet-text-muted)' }} data-testid="zet-id-email-back">
        <ArrowLeft className="h-3.5 w-3.5" /> Geri
      </button>
      <form onSubmit={handleEmailAuth} className="space-y-3">
        {authMode === 'register' && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
            <input type="text" placeholder="Ad Soyad" value={name} onChange={(e) => setName(e.target.value)} className="zet-input pl-10 w-full" required={authMode === 'register'} />
          </div>
        )}
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} className="zet-input pl-10 w-full" required data-testid="email-input" />
        </div>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
          <input type="password" placeholder="Sifre" value={password} onChange={(e) => setPassword(e.target.value)} className="zet-input pl-10 w-full" required minLength={6} data-testid="password-input" />
        </div>

        {authMode === 'register' && (
          <div className="flex items-start gap-2 text-left">
            <button
              type="button"
              onClick={() => setTermsAccepted(!termsAccepted)}
              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all"
              style={{
                background: termsAccepted ? 'var(--zet-primary)' : 'transparent',
                borderColor: termsAccepted ? 'var(--zet-primary)' : 'var(--zet-border)',
              }}
              data-testid="terms-checkbox"
            >
              {termsAccepted && <Check className="h-3 w-3 text-white" />}
            </button>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--zet-text-muted)' }}>
              ZET Studio International{' '}
              <a href="https://zetstudiointernational.com/zet-kullanim-kosullari/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: 'var(--zet-primary-light)' }} data-testid="terms-link">
                Kullanim Kosullari
              </a>
              ,{' '}
              <a href="https://zetstudiointernational.com/odeme-ve-iade-sozlesmesi/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: 'var(--zet-primary-light)' }} data-testid="payment-terms-link">
                Odeme ve Iade Sozlesmesi
              </a>
              {' '}ve{' '}
              <a href="https://zetstudiointernational.com/zet-gizlilik-sozlesmesi/" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-80" style={{ color: 'var(--zet-primary-light)' }} data-testid="privacy-policy-link">
                Gizlilik Politikasi
              </a>
              'ni okudum ve kabul ediyorum.
            </p>
          </div>
        )}

        {error && <p className="text-red-400 text-sm" data-testid="auth-error">{error}</p>}

        <button
          type="submit"
          disabled={loading || (authMode === 'register' && !termsAccepted)}
          className="zet-btn w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-40"
          data-testid="email-auth-btn"
          style={{ background: 'var(--zet-bg-card)' }}
        >
          <Mail className="h-4 w-4" />
          {loading ? 'Yükleniyor...' : (authMode === 'login' ? 'E-posta ile Giriş Yap' : 'Hesap Oluştur')}
        </button>
      </form>

      <p className="mt-4 text-sm" style={{ color: 'var(--zet-text-muted)' }}>
        {authMode === 'login' ? 'Hesabiniz yok mu? ' : 'Zaten hesabiniz var mi? '}
        <button
          onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); setTermsAccepted(false); }}
          className="underline"
          style={{ color: 'var(--zet-primary-light)' }}
          data-testid="toggle-auth-mode"
        >
          {authMode === 'login' ? 'Kayit Ol' : 'Giriş Yap'}
        </button>
      </p>
    </div>
  );

  if (welcomeZetId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--zet-bg)' }}>
        <div className="max-w-sm w-full text-center zet-card p-8 animate-fadeIn">
          <img src="/logo-cs.svg" alt="ZET ID" className="h-16 w-16 mx-auto mb-4 rounded-2xl p-2" style={{ background: '#292F91' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--zet-text)' }}>ZET ID'niz oluşturuldu</h2>
          <p className="text-2xl font-bold mb-3 tracking-wide" style={{ color: '#292F91' }} data-testid="welcome-zet-id">{welcomeZetId}</p>
          <p className="text-sm mb-5" style={{ color: 'var(--zet-text-muted)' }}>
            Bu kimlikle artık tüm ZET uygulamalarına tek dokunuşla giriş yapabilirsiniz. Mevcut belgeleriniz, ayarlarınız ve aboneliğiniz korundu.
          </p>
          <button
            onClick={() => { window.location.href = '/app-select'; }}
            className="zet-btn w-full py-3"
            style={{ background: '#292F91', color: '#fff' }}
            data-testid="welcome-continue-btn"
          >
            Devam Et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-cs.svg" alt="ZET" className="h-10 w-10" />
          <span className="text-xl font-semibold" style={{ color: 'var(--zet-text)' }}>ZET Creative Station</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="mb-6">
            <img src="/logo-cs.svg" alt="ZET Creative Station" className="h-20 w-20 mx-auto mb-3 glow-md rounded-2xl p-2" style={{ background: 'var(--zet-bg-card)' }} />
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--zet-text)' }}>ZET Creative Station</h1>
            <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('documentCreation')}</p>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="zet-card p-2"><FileText className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>
            <div className="zet-card p-2"><Sparkles className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>
            <div className="zet-card p-2"><Layout className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>
            <div className="zet-card p-2"><Cloud className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} /></div>
          </div>

          {error && view === 'main' && <p className="text-red-400 text-sm mb-3" data-testid="auth-error">{error}</p>}
          {error && view === 'add' && addMethod !== 'email' && <p className="text-red-400 text-sm mb-3" data-testid="auth-error">{error}</p>}

          {view === 'main' && renderMain()}
          {view === 'picker' && renderPicker()}
          {view === 'add' && (addMethod === 'email' ? renderEmailForm() : renderAddMethods())}

          {view === 'main' && (
            <p className="mt-3 text-[10px] leading-relaxed" style={{ color: 'var(--zet-text-muted)' }}>
              Giriş yaparak{' '}
              <a href="https://zetstudiointernational.com/zet-kullanim-kosullari/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--zet-text-muted)' }}>Kullanim Kosullari</a>
              {' '}ve{' '}
              <a href="https://zetstudiointernational.com/zet-gizlilik-sozlesmesi/" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: 'var(--zet-text-muted)' }}>Gizlilik Politikasi</a>
              'ni kabul etmis olursunuz.
            </p>
          )}
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
