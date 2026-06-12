import React from 'react';
import { VerificationBadge } from './VerificationBadge';

export function Avatar({ src, displayName, size = 40, verification, online, className = '' }) {
  const initials = (displayName || '?').slice(0, 2).toUpperCase();
  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img src={src} alt={displayName} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
      ) : (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          background: 'linear-gradient(135deg,#3a0ca3,#7b3ff2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: size * 0.38,
        }}>
          {initials}
        </div>
      )}
      {online && (
        <span style={{
          position: 'absolute', bottom: 1, right: 1,
          width: size * 0.28, height: size * 0.28,
          background: '#22c55e', borderRadius: '50%',
          border: '2px solid var(--media-bg, #0f0f0f)',
        }} />
      )}
      {verification && (
        <span style={{ position: 'absolute', bottom: -2, right: -2 }}>
          <VerificationBadge type={verification.type} size={size * 0.38} />
        </span>
      )}
    </div>
  );
}
