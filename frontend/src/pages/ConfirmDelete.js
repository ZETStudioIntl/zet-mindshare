import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ConfirmDelete() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = params.get('token');
    if (!token) { setStatus('error'); setMessage('Geçersiz bağlantı.'); return; }
    axios.post(`${API}/auth/delete-account/confirm`, { token }, { withCredentials: true })
      .then(() => setStatus('success'))
      .catch(err => { setStatus('error'); setMessage(err.response?.data?.detail || 'Bir hata oluştu.'); });
  }, [params]);

  return (
    <div style={{ minHeight: '100vh', background: '#080c14', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#111827', borderRadius: 16, padding: '2.5rem', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)' }}>
        {status === 'loading' && (
          <>
            <div style={{ width: 48, height: 48, border: '3px solid #ef4444', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 1.5rem', animation: 'spin 0.8s linear infinite' }} />
            <p style={{ color: '#9ca3af' }}>Hesap siliniyor...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>✅</div>
            <h2 style={{ color: '#fff', marginBottom: '0.75rem' }}>Hesabınız silindi</h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>Tüm verileriniz kalıcı olarak kaldırıldı. Görüşürüz.</p>
            <button onClick={() => navigate('/login')} style={{ background: '#4ca8ad', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Giriş sayfasına git
            </button>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 48, marginBottom: '1rem' }}>❌</div>
            <h2 style={{ color: '#ef4444', marginBottom: '0.75rem' }}>Hata</h2>
            <p style={{ color: '#9ca3af', marginBottom: '1.5rem' }}>{message}</p>
            <button onClick={() => navigate('/dashboard')} style={{ background: '#374151', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
              Ana sayfaya dön
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
