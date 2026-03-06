import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { exchangeSession } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      const sessionIdMatch = hash.match(/session_id=([^&]+)/);
      
      if (sessionIdMatch) {
        const sessionId = sessionIdMatch[1];
        try {
          const userData = await exchangeSession(sessionId);
          navigate('/dashboard', { replace: true, state: { user: userData } });
        } catch (error) {
          console.error('Auth callback error:', error);
          navigate('/login', { replace: true });
        }
      } else {
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [location, exchangeSession, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--zet-bg)' }}>
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: 'var(--zet-primary)', borderTopColor: 'transparent' }}></div>
        <p style={{ color: 'var(--zet-text-muted)' }}>Authenticating...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
