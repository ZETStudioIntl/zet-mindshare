import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { loadPreferences } from '../lib/preferences';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Her istekte token varsa Authorization header ekle
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('session_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('session_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Çevrimdışıysa ağ isteği yapma — cached user'ı hemen kullan
    if (!navigator.onLine) {
      const cached = localStorage.getItem('zet_cached_user');
      if (cached) {
        try { setUser(JSON.parse(cached)); loadPreferences(); } catch {}
      }
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API}/auth/me`);
      setUser(response.data);
      localStorage.setItem('zet_cached_user', JSON.stringify(response.data));
      loadPreferences();
    } catch (error) {
      const currentToken = localStorage.getItem('session_token');
      if (currentToken === token) {
        const status = error.response?.status;
        if (status === 401 || status === 403) {
          // Gerçekten geçersiz token — temizle
          localStorage.removeItem('session_token');
          localStorage.removeItem('zet_cached_user');
          setUser(null);
        } else {
          // Network hatası veya sunucu hatası — token geçerli olabilir, cached user'ı kullan
          const cached = localStorage.getItem('zet_cached_user');
          if (cached) {
            try { setUser(JSON.parse(cached)); loadPreferences(); } catch {}
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/api/auth/google`;
  };

  const logout = async () => {
    try {
      await axios.post(`${API}/auth/logout`, {});
    } catch (error) {
      console.error('Logout error:', error);
    }
    localStorage.removeItem('session_token');
    setUser(null);
  };

  const updateUser = useCallback((updates) => {
    setUser(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
