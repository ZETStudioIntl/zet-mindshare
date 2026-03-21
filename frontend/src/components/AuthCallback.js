import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const tokenMatch = hash.match(/token=([^&]+)/);

      if (tokenMatch) {
        const token = tokenMatch[1];
        try {
          const res = await axios.post(
            `${API}/auth/exchange`,
            { token }
          );
          localStorage.setItem('session_token', token);
          setUser(res.data);
          navigate('/dashboard', { replace: true });
        } catch (error) {
          console.error('Auth exchange error:', error);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [location, setUser, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
        <p style={{ color: 'var(--zet-text-muted)' }}>Giriş yapılıyor...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
