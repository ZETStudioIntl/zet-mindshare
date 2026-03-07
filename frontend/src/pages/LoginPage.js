import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LogIn, FileText, Sparkles, Cloud, Layout, Mail, Lock, User } from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const LoginPage = () => {
  const { login, setUser } = useAuth();
  const { t } = useLanguage();
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login' 
        ? { email, password }
        : { email, password, name };
      
      const res = await axios.post(`${API}${endpoint}`, payload, { withCredentials: true });
      
      if (res.data.user) {
        setUser(res.data.user);
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed');
    }
    setLoading(false);
  };

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
          <div className="mb-6">
            <img 
              src="https://customer-assets.emergentagent.com/job_unified-device-app-1/artifacts/92d5edoi_ZET%20M%C4%B0NDSHARE%20LOGO%20SVG_1.svg" 
              alt="ZET Mindshare" 
              className="h-20 w-20 mx-auto mb-3 glow-md rounded-2xl p-2"
              style={{ background: 'var(--zet-bg-card)' }}
            />
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--zet-text)' }}>ZET Mindshare</h1>
            <p className="text-sm" style={{ color: 'var(--zet-text-muted)' }}>{t('documentCreation')}</p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            <div className="zet-card p-2">
              <FileText className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} />
            </div>
            <div className="zet-card p-2">
              <Sparkles className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} />
            </div>
            <div className="zet-card p-2">
              <Layout className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} />
            </div>
            <div className="zet-card p-2">
              <Cloud className="h-4 w-4 mx-auto" style={{ color: 'var(--zet-primary-light)' }} />
            </div>
          </div>

          {/* Google Login Button */}
          <button 
            onClick={login}
            className="zet-btn w-full flex items-center justify-center gap-2 py-3 mb-4"
            data-testid="google-login-btn"
          >
            <LogIn className="h-5 w-5" />
            {t('continueWithGoogle')}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: 'var(--zet-border)' }} />
            <span className="text-xs" style={{ color: 'var(--zet-text-muted)' }}>or</span>
            <div className="flex-1 h-px" style={{ background: 'var(--zet-border)' }} />
          </div>

          {/* Email Auth Form */}
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {authMode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="zet-input pl-10 w-full"
                  required={authMode === 'register'}
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="zet-input pl-10 w-full"
                required
                data-testid="email-input"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--zet-text-muted)' }} />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="zet-input pl-10 w-full"
                required
                minLength={6}
                data-testid="password-input"
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className="zet-btn w-full flex items-center justify-center gap-2 py-2"
              data-testid="email-auth-btn"
              style={{ background: 'var(--zet-bg-card)' }}
            >
              <Mail className="h-4 w-4" />
              {loading ? 'Loading...' : (authMode === 'login' ? 'Sign in with Email' : 'Create Account')}
            </button>
          </form>

          {/* Toggle Auth Mode */}
          <p className="mt-4 text-sm" style={{ color: 'var(--zet-text-muted)' }}>
            {authMode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button 
              onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); }}
              className="underline"
              style={{ color: 'var(--zet-primary-light)' }}
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          <p className="mt-3 text-xs" style={{ color: 'var(--zet-text-muted)' }}>
            {t('termsAgree')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
