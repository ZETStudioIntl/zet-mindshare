import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [plan, setPlan] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/subscription`, { withCredentials: true })
      .then(r => setPlan(r.data.plan || ''))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0d1a 0%, #1a1f5c 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: 24,
      textAlign: 'center',
    }}>
      {loading ? (
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 15 }}>Yükleniyor...</div>
      ) : (
        <>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h1 style={{ color: '#fff', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            Ödeme Başarılı!
          </h1>
          {plan && plan !== 'free' && (
            <p style={{ color: '#4ca8ad', fontSize: 17, fontWeight: 600, marginBottom: 8 }}>
              {plan.toUpperCase()} planına hoş geldiniz
            </p>
          )}
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, maxWidth: 360, lineHeight: 1.6, marginBottom: 32 }}>
            Aboneliğiniz aktifleştirildi. Onay e-postası gönderildi.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: '#4ca8ad',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '12px 32px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Dashboard'a Git
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentSuccess;
