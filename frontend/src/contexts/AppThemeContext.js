import React, { createContext, useContext, useState, useEffect } from 'react';

const AppThemeContext = createContext(null);

export const useAppTheme = () => useContext(AppThemeContext);

const THEMES = {
  mindshare: {
    '--zet-primary': '#292f91',
    '--zet-primary-light': '#4ca8ad',
    '--zet-primary-dark': '#1a1f5c',
    '--zet-glow': 'rgba(41, 47, 145, 0.5)',
    '--zet-glow-light': 'rgba(76, 168, 173, 0.4)',
    '--app-primary': '#4ca8ad',
    '--app-gradient': 'linear-gradient(135deg, #292f91 0%, #4ca8ad 100%)',
  },
  judge: {
    '--zet-primary': '#c8005a',
    '--zet-primary-light': '#e8337a',
    '--zet-primary-dark': '#4b0c37',
    '--zet-glow': 'rgba(200, 0, 90, 0.5)',
    '--zet-glow-light': 'rgba(232, 51, 122, 0.4)',
    '--app-primary': '#c8005a',
    '--app-gradient': 'linear-gradient(135deg, #4b0c37 0%, #c8005a 100%)',
  },
};

export const AppThemeProvider = ({ children }) => {
  const [activeApp, setActiveApp] = useState(() => localStorage.getItem('zet_active_app') || 'mindshare');

  useEffect(() => {
    const theme = THEMES[activeApp] || THEMES.mindshare;
    const root = document.documentElement;
    Object.entries(theme).forEach(([key, val]) => root.style.setProperty(key, val));
  }, [activeApp]);

  const switchApp = (app) => {
    localStorage.setItem('zet_active_app', app);
    setActiveApp(app);
  };

  return (
    <AppThemeContext.Provider value={{ activeApp, switchApp }}>
      {children}
    </AppThemeContext.Provider>
  );
};
