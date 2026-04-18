import React, { useEffect, useRef } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import AuthCallback from "./components/AuthCallback";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import Editor from "./pages/Editor";
import QuestMap from "./pages/QuestMap";
import SharedView from "./pages/SharedView";
import ConfirmDelete from "./pages/ConfirmDelete";
import ConfirmEmailChange from "./pages/ConfirmEmailChange";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Global heartbeat — tüm sayfalarda çalışır, sunucu saatine göre rate-limited
const GlobalHeartbeat = () => {
  const { user } = useAuth();
  const lastActivityRef = useRef(Date.now());
  const lastTimeSentRef = useRef(Date.now());

  useEffect(() => {
    if (!user) return;

    const INTERVAL = 30000;          // heartbeat her 30 saniye
    const TIME_INTERVAL = 60000;     // süre kaydı her 60 saniye
    const INACTIVE_LIMIT = 5 * 60 * 1000;

    const onActivity = () => { lastActivityRef.current = Date.now(); };
    document.addEventListener('mousemove', onActivity, { passive: true });
    document.addEventListener('keydown', onActivity, { passive: true });
    document.addEventListener('click', onActivity, { passive: true });
    document.addEventListener('scroll', onActivity, { passive: true });

    // Heartbeat: sunucu tarafında süre takibi
    const sendHeartbeat = () => {
      if (document.hidden) return;
      const isActive = Date.now() - lastActivityRef.current < INACTIVE_LIMIT;
      if (!isActive) return;
      axios.post(`${API}/users/heartbeat`, {}, { withCredentials: true }).catch(() => {});
    };

    // Session timer: her dakika geçen gerçek süreyi backend'e kaydet
    const sendTimeSpent = () => {
      if (document.hidden) return;
      const isActive = Date.now() - lastActivityRef.current < INACTIVE_LIMIT;
      if (!isActive) return;
      const now = Date.now();
      const seconds = Math.round((now - lastTimeSentRef.current) / 1000);
      lastTimeSentRef.current = now;
      if (seconds > 0 && seconds <= 120) {
        axios.post(`${API}/user/time-spent`, { seconds }, { withCredentials: true }).catch(() => {});
        console.debug(`[Timer] ${seconds}sn kaydedildi`);
      }
    };

    // Sayfa kapanmadan önce kalan süreyi kaydet (sendBeacon kullan — async)
    const handleUnload = () => {
      const isActive = Date.now() - lastActivityRef.current < INACTIVE_LIMIT;
      if (!isActive) return;
      const seconds = Math.round((Date.now() - lastTimeSentRef.current) / 1000);
      if (seconds > 0 && seconds <= 120) {
        const blob = new Blob([JSON.stringify({ seconds })], { type: 'application/json' });
      navigator.sendBeacon(`${API}/user/time-spent`, blob);
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    const heartbeatId = setInterval(sendHeartbeat, INTERVAL);
    const timerId = setInterval(sendTimeSpent, TIME_INTERVAL);

    return () => {
      clearInterval(heartbeatId);
      clearInterval(timerId);
      window.removeEventListener('beforeunload', handleUnload);
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
      <Route path="/auth-callback" element={<AuthCallback />} />
      <Route path="/shared/:shareId" element={<SharedView />} />
      <Route path="/confirm-delete" element={<ConfirmDelete />} />
      <Route path="/confirm-email-change" element={<ConfirmEmailChange />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <GlobalHeartbeat />
          <AppRouter />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
