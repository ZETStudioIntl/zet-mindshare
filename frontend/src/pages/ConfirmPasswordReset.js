import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { A4LoadingScreen } from '../components/LoadingScreens';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ConfirmPasswordReset = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | confirm | success | error
  const [errorMsg, setErrorMsg] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) { setStatus('error'); setErrorMsg('Geçersiz bağlantı'); return; }
    setStatus('confirm');
  }, [token]);

  const handleConfirm = async () => {
    setStatus('loading');
    try {
      await axios.post(`${API}/confirm-password-reset`, { token }, { withCredentials: true });
      setStatus('success');
      setTimeout(() => navigate('/dashboard'), 3000);
    } catch (e) {
      setStatus('error');
      setErrorMsg(e?.response?.data?.detail || 'Geçersiz veya süresi dolmuş bağlantı');
    }
  };

  if (status === 'loading') return <A4LoadingScreen playSound={false} />;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070916', padding: 24 }}>
      <div style={{ background: '#0d1030', border: '1px solid rgba(76,168,173,0.3)', borderRadius: 16, padding: '40px 32px', maxWidth: 400, width: '100%', textAlign: 'center' }}>
        {status === 'confirm' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(76,168,173,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M14 2a12 12 0 1 1 0 24A12 12 0 0 1 14 2z" stroke="#4ca8ad" strokeWidth="1.5" fill="none"/>
                <path d="M9 14l3.5 3.5 6.5-7" stroke="#4ca8ad" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Şifre Sıfırlama</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Belge veya defterin şifresi sıfırlanacak ve kilit kaldırılacak. Devam etmek istiyor musunuz?
            </p>
            <button
              onClick={handleConfirm}
              style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'rgba(76,168,173,0.18)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}
            >
              Şifreyi Sıfırla
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              style={{ width: '100%', marginTop: 10, padding: '10px 0', borderRadius: 10, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', fontSize: 14, cursor: 'pointer' }}
            >
              İptal
            </button>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M9 14l3.5 3.5 6.5-7" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 style={{ color: '#22c55e', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Şifre Sıfırlandı</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>Kilit başarıyla kaldırıldı. Dashboard'a yönlendiriliyorsunuz...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <path d="M8 8l12 12M20 8L8 20" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 style={{ color: '#ef4444', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Bağlantı Geçersiz</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 20 }}>{errorMsg}</p>
            <button onClick={() => navigate('/dashboard')} style={{ width: '100%', padding: '12px 0', borderRadius: 10, background: 'rgba(76,168,173,0.18)', border: '1px solid rgba(76,168,173,0.5)', color: '#4ca8ad', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Dashboard'a Dön
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ConfirmPasswordReset;
