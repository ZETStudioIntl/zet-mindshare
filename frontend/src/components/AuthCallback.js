import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { A4LoadingScreen } from './LoadingScreens';

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

      // Admin / CEO token akışı
      const ceoTokenMatch = hash.match(/ceo_token=([^&]+)/);
      const adminTokenMatch = hash.match(/admin_token=([^&]+)/);
      const ceoErrorMatch = hash.match(/ceo_error=([^&]+)/);
      if (ceoTokenMatch || adminTokenMatch || ceoErrorMatch) {
        const savedDoc = localStorage.getItem('zet_admin_auth_doc');
        localStorage.removeItem('zet_admin_auth_pending');
        localStorage.removeItem('zet_admin_auth_doc');
        if (ceoTokenMatch) {
          try {
            await axios.get(`${API}/auth/admin-verify?token=${ceoTokenMatch[1]}`, { withCredentials: true });
            // Token doğrulandı — PIN adımı için pending işaretle, henüz CEO modu aktif değil
            localStorage.setItem('zet_ceo_pending', 'true');
            localStorage.removeItem('zet_ceo_mode');
            localStorage.removeItem('zet_admin_mode');
          } catch {
            localStorage.removeItem('zet_ceo_mode');
            localStorage.removeItem('zet_ceo_pending');
          }
        } else if (adminTokenMatch) {
          try {
            await axios.get(`${API}/auth/admin-verify-admin?token=${adminTokenMatch[1]}`, { withCredentials: true });
            // Admin modu — PIN gerekmez, direkt aktif
            localStorage.setItem('zet_admin_mode', 'true');
            localStorage.removeItem('zet_ceo_mode');
            localStorage.removeItem('zet_ceo_pending');
          } catch {
            localStorage.removeItem('zet_admin_mode');
          }
        }
        navigate(savedDoc ? `/editor/${savedDoc}` : '/dashboard', { replace: true });
        return;
      }

      // Normal Google OAuth akışı
      const tokenMatch = hash.match(/token=([^&]+)/);
      if (tokenMatch) {
        const token = tokenMatch[1];
        try {
          const res = await axios.post(`${API}/auth/exchange`, { token });
          localStorage.setItem('session_token', token);
          setUser(res.data);
          navigate('/app-select', { replace: true });
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

  return <A4LoadingScreen playSound={false} />;
};

export default AuthCallback;
