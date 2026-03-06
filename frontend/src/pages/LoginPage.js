import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogIn, FileText, Sparkles, Cloud, Layout } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--zet-bg)' }}>
      {/* Header */}
      <header className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img 
            src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
            alt="ZET" 
            className="h-10 w-10"
          />
          <span className="text-xl font-semibold" style={{ color: 'var(--zet-text)' }}>ZET Mindshare</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center animate-fadeIn">
          {/* Logo */}
          <div className="mb-8">
            <img 
              src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
              alt="ZET Mindshare" 
              className="h-24 w-24 mx-auto mb-4 glow-md rounded-2xl p-2"
              style={{ background: 'var(--zet-bg-card)' }}
            />
            <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--zet-text)' }}>ZET Mindshare</h1>
            <p style={{ color: 'var(--zet-text-muted)' }}>{t('documentCreation')}</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="zet-card p-4">
              <FileText className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('smartDocuments')}</p>
            </div>
            <div className="zet-card p-4">
              <Sparkles className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('zetaAI')}</p>
            </div>
            <div className="zet-card p-4">
              <Layout className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('proTools')}</p>
            </div>
            <div className="zet-card p-4">
              <Cloud className="h-6 w-6 mx-auto mb-2" style={{ color: 'var(--zet-primary-light)' }} />
              <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('cloudSync')}</p>
            </div>
          </div>

          {/* Login Button */}
          <button 
            onClick={login}
            className="zet-btn w-full flex items-center justify-center gap-2 py-3 text-lg animate-pulse-glow"
            data-testid="google-login-btn"
          >
            <LogIn className="h-5 w-5" />
            {t('continueWithGoogle')}
          </button>

          <p className="mt-4 text-sm" style={{ color: 'var(--zet-text-muted)' }}>
            {t('termsAgree')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
