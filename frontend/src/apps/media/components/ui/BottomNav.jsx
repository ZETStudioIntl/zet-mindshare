import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMedia } from '../../contexts/MediaContext';
import { useAuth } from '../../../../contexts/AuthContext';

const HomeSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const ExploreSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const PlusSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const MsgSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const ProfileSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const NotifSVG = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadMessages, unreadNotifs, mediaProfile } = useMedia();
  const { user } = useAuth();

  const tabs = [
    { path: '/media', icon: <HomeSVG />, label: 'Ana Sayfa' },
    { path: '/media/explore', icon: <ExploreSVG />, label: 'Keşfet' },
    { path: '/media/create', icon: <PlusSVG />, label: 'Oluştur', highlight: true },
    { path: '/media/messages', icon: <MsgSVG />, label: 'Mesajlar', badge: unreadMessages },
    { path: '/media/profile/' + (mediaProfile?.handle || ''), icon: <ProfileSVG />, label: 'Profil' },
  ];

  const isActive = (path) => {
    if (path === '/media') return pathname === '/media' || pathname === '/media/';
    return pathname.startsWith(path);
  };

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'var(--media-surface, #1a1a1a)',
      borderTop: '1px solid var(--media-border, #2a2a2a)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
      height: 60,
    }}>
      {tabs.map((tab) => (
        <button
          key={tab.path}
          onClick={() => navigate(tab.path)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 2, border: 'none', background: 'none',
            color: isActive(tab.path) ? '#fff' : '#666',
            cursor: 'pointer', padding: '6px 0', position: 'relative',
            transition: 'color .15s',
          }}
        >
          {tab.highlight ? (
            <span style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg,#3a0ca3,#7b3ff2)',
              borderRadius: 12, padding: 8, color: '#fff',
            }}>
              {tab.icon}
            </span>
          ) : (
            <>
              {tab.icon}
              {tab.badge > 0 && (
                <span style={{
                  position: 'absolute', top: 4, right: '50%', transform: 'translateX(6px)',
                  background: '#ef4444', color: '#fff', borderRadius: 99,
                  fontSize: 10, fontWeight: 700, minWidth: 16, height: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  paddingInline: 3,
                }}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </>
          )}
        </button>
      ))}
    </nav>
  );
}
