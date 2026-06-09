import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { loadPreferences } from '../lib/preferences';
import axios from 'axios';
import { A4LoadingScreen } from './LoadingScreens';
import { createZetIdForCurrentSession } from '../lib/zetId';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);
  const [welcomeZetId, setWelcomeZetId] = useState(null);
  const [dbgLog, setDbgLog] = useState([]);
  const dbg = (msg) => {
    console.log('[AuthCallback]', msg);
    setDbgLog(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      const hash = location.hash;
      dbg(`hash: ${hash.slice(0, 40)}...`);

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
        dbg(`token bulundu: ${token.slice(0, 12)}...`);
        try {
          dbg('auth/exchange çağrılıyor...');
          const res = await axios.post(`${API}/auth/exchange`, { token });
          dbg(`exchange OK user=${res.data?.email}`);
          localStorage.setItem('session_token', token);
          setUser(res.data);
          loadPreferences();
          try {
            dbg('ZET ID oluşturuluyor...');
            const created = await createZetIdForCurrentSession();
            dbg(`ZET ID ok is_new=${created.is_new} id=${created.zet_id}`);
            if (created.is_new) {
              setWelcomeZetId(created.zet_id);
              return;
            }
          } catch (ze) {
            dbg(`ZET ID HATA: ${ze?.response?.status} ${ze?.message}`);
          }
          dbg('app-select yönlendiriliyor...');
          navigate('/app-select', { replace: true });
        } catch (error) {
          dbg(`exchange HATA: ${error?.response?.status} ${error?.message}`);
          console.error('Auth exchange error:', error);
          // navigate yerine log'u göster — kullanıcı ne olduğunu görsün
          setTimeout(() => navigate('/login', { replace: true }), 4000);
        }
      } else {
        dbg('hash\'te token YOK — login\'e yönlendiriliyor');
        navigate('/login', { replace: true });
      }
    };

    processAuth();
  }, [location, setUser, navigate]);

  const debugPanel = dbgLog.length > 0 ? (
    <div style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 9999, background: '#111', color: '#0f0', fontSize: 10, padding: '6px 8px', borderRadius: 6, textAlign: 'left', whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 140, overflowY: 'auto' }}>
      {dbgLog.map((l, i) => <div key={i}>{l}</div>)}
    </div>
  ) : null;

  if (welcomeZetId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--zet-bg)', position: 'relative' }}>
        <div className="max-w-sm w-full text-center zet-card p-8 animate-fadeIn">
          <img src="/logo-cs.svg" alt="ZET ID" className="h-16 w-16 mx-auto mb-4 rounded-2xl p-2" style={{ background: '#292F91' }} />
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--zet-text)' }}>ZET ID'niz oluşturuldu</h2>
          <p className="text-2xl font-bold mb-3 tracking-wide" style={{ color: '#292F91' }} data-testid="welcome-zet-id">{welcomeZetId}</p>
          <p className="text-sm mb-5" style={{ color: 'var(--zet-text-muted)' }}>
            Bu kimlikle artık tüm ZET uygulamalarına tek dokunuşla giriş yapabilirsiniz. Mevcut belgeleriniz, ayarlarınız ve aboneliğiniz korundu.
          </p>
          <button
            onClick={() => navigate('/app-select', { replace: true })}
            className="zet-btn w-full py-3"
            style={{ background: '#292F91', color: '#fff' }}
            data-testid="welcome-continue-btn"
          >
            Devam Et
          </button>
        </div>
        {debugPanel}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <A4LoadingScreen playSound={false} />
      {debugPanel}
    </div>
  );
};

export default AuthCallback;
