import React, { useEffect, useRef } from "react";
import "@/index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Global heartbeat — tüm sayfalarda çalışır, online status için
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
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
            <AppRouter />
          </BrowserRouter>
        </AppThemeProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
