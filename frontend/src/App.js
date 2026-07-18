import React, { useEffect, useRef } from "react";
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
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Global heartbeat — tüm sayfalarda çalışır, online status için
const GradientAnimEffect = () => {
  const { pathname } = useLocation();
  const overlayRef = useRef(null);
  const currentTargetRef = useRef(null);
  const rafRef = useRef(null);
  const colorsRef = useRef(['#4ca8dd', '#292f91']);

  useEffect(() => {
    colorsRef.current = pathname.startsWith('/judge')
      ? ['#c8005a', '#4b0c37']
      : ['#4ca8dd', '#292f91'];
  }, [pathname]);

  useEffect(() => {
    const overlay = document.createElement('div');
    overlay.id = '__zet-gradient-overlay';
    overlay.style.cssText = 'position:fixed;pointer-events:none;z-index:99999;opacity:0;transition:opacity 0.15s ease;';
    document.body.appendChild(overlay);
    overlayRef.current = overlay;

    const SELECTOR = 'a,button,[role="button"],.cursor-pointer,input[type="button"],input[type="submit"],input[type="reset"],input[type="checkbox"],input[type="radio"],summary';

    const updateOverlay = (target, mx, my) => {
      const rect = target.getBoundingClientRect();
      const gax = ((mx - rect.left) / rect.width * 100).toFixed(1) + '%';
      const gay = ((my - rect.top) / rect.height * 100).toFixed(1) + '%';
      const [c1, c2] = colorsRef.current;
      overlay.style.left = rect.left + 'px';
      overlay.style.top = rect.top + 'px';
      overlay.style.width = rect.width + 'px';
      overlay.style.height = rect.height + 'px';
      overlay.style.borderRadius = getComputedStyle(target).borderRadius;
      overlay.style.background = `radial-gradient(circle at ${gax} ${gay}, ${c1}99, ${c2}55, transparent 70%)`;
    };

    const onMouseOver = (e) => {
      const plan = localStorage.getItem('zet_gradient_anim_plan');
      if (localStorage.getItem('zet_gradient_anim') !== 'true' || !plan || plan === 'free') {
        if (currentTargetRef.current) { overlay.style.opacity = '0'; currentTargetRef.current = null; }
        return;
      }
      const target = e.target.closest ? e.target.closest(SELECTOR) : null;
      if (!target) { overlay.style.opacity = '0'; currentTargetRef.current = null; return; }
      currentTargetRef.current = target;
      updateOverlay(target, e.clientX, e.clientY);
      overlay.style.opacity = '1';
    };

    const onMouseMove = (e) => {
      if (!enabledRef.current || !currentTargetRef.current) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        if (currentTargetRef.current) updateOverlay(currentTargetRef.current, e.clientX, e.clientY);
      });
    };

    const onMouseOut = (e) => {
      if (!currentTargetRef.current) return;
      const related = e.relatedTarget;
      if (!related || !currentTargetRef.current.contains(related)) {
        currentTargetRef.current = null;
        overlay.style.opacity = '0';
      }
    };

    document.addEventListener('mouseover', onMouseOver, { passive: true });
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseout', onMouseOut, { passive: true });

    return () => {
      document.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseout', onMouseOut);
      overlay.remove();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return null;
};

const GlobalHeartbeat = () => {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const INTERVAL = 30000;
    const INACTIVE_LIMIT = 5 * 60 * 1000;

    const onActivity = () => { lastActivityRef.current = Date.now(); };
    document.addEventListener('mousemove', onActivity, { passive: true });
    document.addEventListener('keydown', onActivity, { passive: true });
    document.addEventListener('click', onActivity, { passive: true });
    document.addEventListener('scroll', onActivity, { passive: true });

    const sendHeartbeat = () => {
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
      <Route path="/" element={<Navigate to="/app-select" replace />} />
      <Route path="*" element={<Navigate to="/app-select" replace />} />
    </Routes>
  );
};

function App() {
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
