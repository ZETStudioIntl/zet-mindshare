import React from 'react';

export function VerificationBadge({ type, size = 14 }) {
  if (!type) return null;
  const badges = {
    controller: { color: '#1a1a1a', label: 'Controller' },
    gold: { color: '#F5A623', label: 'Gold' },
    business: { color: '#2563EB', label: 'Business' },
  };
  const b = badges[type];
  if (!b) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-label={b.label} title={b.label}>
      <circle cx="8" cy="8" r="8" fill={b.color} />
      <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
