import React from 'react';

// "ZET ID ile Giriş Yap" butonu — Google/Apple butonlarıyla aynı stilde, ZET mor rengiyle
const ZetIdButton = ({ onClick, loading, label = 'ZET ID ile Giriş Yap' }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="zet-btn w-full flex items-center justify-center gap-2.5 py-3 disabled:opacity-60"
    style={{ background: '#292F91', color: '#fff' }}
    data-testid="zet-id-login-btn"
  >
    <img src="/logo.svg" alt="ZET ID" width={18} height={18} />
    {loading ? 'Yükleniyor...' : label}
  </button>
);

export default ZetIdButton;
