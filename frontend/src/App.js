import React, { useEffect, useRef, useState } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppThemeProvider } from "./contexts/AppThemeContext";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import QuestMap from "./pages/QuestMap";
import SharedView from "./pages/SharedView";
import Profile from "./pages/Profile";
import ConfirmDelete from "./pages/ConfirmDelete";
import RecycleBin from "./pages/RecycleBin";
import ConfirmEmailChange from "./pages/ConfirmEmailChange";
import AppSelector from "./pages/AppSelector";
import JudgeDashboard from "./pages/JudgeDashboard";
import PaymentSuccess from "./pages/PaymentSuccess";
import MediaApp from "./apps/media/App";
import ControlCenter from "./pages/ControlCenter";
import axios from "axios";

const BanScreen = ({ reason, bannedUntil }) => {
  const [remaining, setRemaining] = React.useState('');

  React.useEffect(() => {
    if (!bannedUntil) return;
    const tick = () => {
      const diff = new Date(bannedUntil) - Date.now();
      if (diff <= 0) { setRemaining(''); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? h + ' sa ' : ''}${m} dk ${s} sn`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [bannedUntil]);

  const isTemp = !!bannedUntil;
  const accentColor = isTemp ? '#f97316' : '#ef4444';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999999,
      background: 'linear-gradient(160deg, #0a0a1e 0%, #060612 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 20, padding: 32, fontFamily: 'system-ui, sans-serif',
    }}>
      {isTemp ? (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke={accentColor} strokeWidth="3" fill={accentColor + '14'} />
          <path d="M32 18v16l10 6" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke={accentColor} strokeWidth="3" fill={accentColor + '14'} />
          <path d="M20 20L44 44M44 20L20 44" stroke={accentColor} strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      )}
      <div style={{ color: '#f1f5f9', fontSize: 22, fontWeight: 700, textAlign: 'center' }}>
        {isTemp ? 'Hesabınız Geçici Olarak Askıya Alındı' : 'Hesabınız Askıya Alındı'}
      </div>
      <div style={{
        color: '#94a3b8', fontSize: 14, textAlign: 'center', maxWidth: 420, lineHeight: 1.6,
        background: '#ffffff0a', border: `1px solid ${accentColor}30`, borderRadius: 12, padding: '14px 20px',
      }}>
        {reason || "Kural ihlali nedeniyle hesabınıza erişim engellendi."}
      </div>
      {isTemp && remaining && (
        <div style={{
          color: accentColor, fontSize: 24, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
          background: accentColor + '12', border: `1px solid ${accentColor}30`, borderRadius: 12, padding: '12px 24px',
        }}>
          {remaining}
        </div>
      )}
      <div style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>
        İtiraz için{' '}
        <a href="mailto:help@zetstudiointl.com" style={{ color: '#6366f1', textDecoration: 'none' }}>
          help@zetstudiointl.com
        </a>
      </div>
    </div>
  );
};

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Global heartbeat — tüm sayfalarda çalışır, online status için
const GradientAnimEffect = () => {
  const { pathname } = useLocation();
  const overlayRef = useRef(null);
  const currentTargetRef = useRef(null);

  // Renkleri path'e göre güncelle
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay) return;
    const isJudge = pathname.startsWith('/judge');
    overlay.style.setProperty('--gc1', isJudge ? '#c8005a' : '#4ca8dd');
    overlay.style.setProperty('--gc2', isJudge ? '#4b0c37' : '#292f91');
  }, [pathname]);

  useEffect(() => {
    // CSS keyframe'leri ve blob stilleri bir kez enjekte et
    const styleEl = document.createElement('style');
    styleEl.id = '__zet-grad-style';
    styleEl.textContent = `
      @keyframes zet-b1 {
        0%,100% { transform: translate(-15%, -20%); }
        33%      { transform: translate(55%, 30%); }
        66%      { transform: translate(20%, 65%); }
      }
      @keyframes zet-b2 {
        0%,100% { transform: translate(60%, 60%); }
        33%      { transform: translate(-10%, 20%); }
        66%      { transform: translate(40%, -15%); }
      }
      #__zet-grad-overlay {
        position: fixed;
        pointer-events: none;
        z-index: 99999;
        overflow: hidden;
        clip-path: inset(0);
        opacity: 0;
        transition: opacity 0.2s ease;
        mix-blend-mode: screen;
      }
      #__zet-grad-overlay .zgb {
        position: absolute;
        width: 130%;
        height: 130%;
        top: -15%;
        left: -15%;
        border-radius: 50%;
        filter: blur(16px);
        will-change: transform;
      }
      #__zet-grad-overlay .zgb1 {
        background: var(--gc1, #4ca8dd);
        animation: zet-b1 3.5s ease-in-out infinite;
      }
      #__zet-grad-overlay .zgb2 {
        background: var(--gc2, #292f91);
        animation: zet-b2 4.8s ease-in-out infinite;
        animation-delay: -2s;
      }
    `;
    document.head.appendChild(styleEl);

    const isJudge = window.location.pathname.startsWith('/judge');
    const overlay = document.createElement('div');
    overlay.id = '__zet-grad-overlay';
    overlay.style.setProperty('--gc1', isJudge ? '#c8005a' : '#4ca8dd');
    overlay.style.setProperty('--gc2', isJudge ? '#4b0c37' : '#292f91');

    const b1 = document.createElement('div'); b1.className = 'zgb zgb1';
    const b2 = document.createElement('div'); b2.className = 'zgb zgb2';
    overlay.appendChild(b1);
    overlay.appendChild(b2);
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    const SELECTOR = 'a,button,[role="button"],.cursor-pointer,input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],summary';

    const positionOverlay = (target) => {
      const rect = target.getBoundingClientRect();
      const br = getComputedStyle(target).borderRadius;
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      overlay.style.borderRadius = br;
      overlay.style.clipPath = `inset(0 round ${br})`;
    };

    const onMouseOver = (e) => {
      const plan = localStorage.getItem('zet_gradient_anim_plan');
      if (localStorage.getItem('zet_gradient_anim') !== 'true' || !plan || plan === 'free') {
        if (currentTargetRef.current) { overlay.style.opacity = '0'; currentTargetRef.current = null; }
        return;
      }
      const target = e.target.closest ? e.target.closest(SELECTOR) : null;
      if (!target) { overlay.style.opacity = '0'; currentTargetRef.current = null; return; }
      if (target === currentTargetRef.current) return;
      const rect = target.getBoundingClientRect();
      // Sadece canvas sayfası gibi çok büyük elementleri atla
      if (rect.width > 900 || rect.height > 600) { overlay.style.opacity = '0'; currentTargetRef.current = null; return; }
      currentTargetRef.current = target;
      positionOverlay(target);
      overlay.style.opacity = '1';
    };

    const onMouseOut = (e) => {
      if (!currentTargetRef.current) return;
      const related = e.relatedTarget;
      if (!related || !currentTargetRef.current.contains(related)) {
        currentTargetRef.current = null;
        overlay.style.opacity = '0';
      }
    };

    const onScroll = () => {
      if (!currentTargetRef.current) return;
      const rect = currentTargetRef.current.getBoundingClientRect();
      // Element viewport dışına çıktıysa overlay'i gizle
      if (rect.bottom < 0 || rect.top > window.innerHeight || rect.right < 0 || rect.left > window.innerWidth) {
        overlay.style.opacity = '0';
        currentTargetRef.current = null;
        return;
      }
      positionOverlay(currentTargetRef.current);
    };

    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });
    document.addEventListener('scroll', onScroll, { passive: true, capture: true });

    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('scroll', onScroll, { capture: true });
      overlay.remove();
      styleEl.remove();
    };
  }, []);

  return null;
};

const GlobalHeartbeat = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const INTERVAL = 30000;
    const INACTIVE_LIMIT = 3 * 60 * 1000;

    const onActivity = () => { lastActivityRef.current = Date.now(); };
    document.addEventListener('mousemove', onActivity, { passive: true });
    document.addEventListener('keydown', onActivity, { passive: true });
    document.addEventListener('click', onActivity, { passive: true });
    document.addEventListener('scroll', onActivity, { passive: true });

    const sendHeartbeat = () => {
      if (!pathname.startsWith('/editor')) return;
      if (document.hidden) return;
      const isActive = Date.now() - lastActivityRef.current < INACTIVE_LIMIT;
      if (!isActive) return;
      axios.post(`${API}/users/heartbeat`, {}, { withCredentials: true }).catch(() => {});
    };

    const heartbeatId = setInterval(sendHeartbeat, INTERVAL);

    return () => {
      clearInterval(heartbeatId);
      document.removeEventListener('mousemove', onActivity);
      document.removeEventListener('keydown', onActivity);
      document.removeEventListener('click', onActivity);
      document.removeEventListener('scroll', onActivity);
    };
  }, [user]);

  return null;
};

const AppRouter = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/editor/:docId" element={
        <ProtectedRoute>
          <Editor />
        </ProtectedRoute>
      } />
      <Route path="/quest-map" element={
        <ProtectedRoute>
          <QuestMap />
        </ProtectedRoute>
      } />
      <Route path="/profile/:username" element={
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      } />
      <Route path="/app-select" element={
        <ProtectedRoute>
          <AppSelector />
        </ProtectedRoute>
      } />
      <Route path="/judge" element={
        <ProtectedRoute>
          <JudgeDashboard />
        </ProtectedRoute>
      } />
      <Route path="/trash" element={
        <ProtectedRoute>
          <RecycleBin />
        </ProtectedRoute>
      } />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/shared/:shareId" element={<SharedView />} />
      <Route path="/confirm-delete" element={<ConfirmDelete />} />
      <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
      <Route path="/media/*" element={
        <ProtectedRoute>
          <MediaApp />
        </ProtectedRoute>
      } />
      <Route path="/control-center" element={
        <ProtectedRoute>
          <ControlCenter />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/app-select" replace />} />
      <Route path="*" element={<Navigate to="/app-select" replace />} />
    </Routes>
  );
};

function App() {
  const [banInfo, setBanInfo] = useState(null);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 403) {
          const detail = err.response.data?.detail;
          if (detail?.code === 'BANNED') {
            setBanInfo({ reason: detail.reason });
          } else if (detail?.code === 'TEMP_BANNED') {
            setBanInfo({ reason: detail.reason, bannedUntil: detail.banned_until });
          }
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    const pub = process.env.PUBLIC_URL || '';
    const s = document.createElement('style');
    s.id = '__zet-cursors';
    s.textContent = [
      `html { cursor: url('${pub}/cursors/arrow.svg') 1 1, default !important; }`,
      `a, button, [role="button"], label[for], select, .cursor-pointer, [style*="cursor: pointer"], [style*="cursor:pointer"], input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], summary { cursor: url('${pub}/cursors/touch.svg') 11 2, pointer !important; }`,
      `input[type="text"], input[type="email"], input[type="password"], input[type="search"], input[type="number"], input[type="url"], textarea, [contenteditable="true"] { cursor: text !important; }`,
    ].join('\n');
    document.head.appendChild(s);
    return () => document.getElementById('__zet-cursors')?.remove();
  }, []);

  if (banInfo) return <BanScreen reason={banInfo.reason} bannedUntil={banInfo.bannedUntil} />;

  return (
    <LanguageProvider>
      <AuthProvider>
        <AppThemeProvider>
          <BrowserRouter>
            <GlobalHeartbeat />
            <GradientAnimEffect />
            <AppRouter />
          </BrowserRouter>
        </AppThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
