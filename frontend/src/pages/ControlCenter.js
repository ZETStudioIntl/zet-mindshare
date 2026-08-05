import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import EventCreatorPanel from '../components/dashboard/EventCreatorPanel';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLAN_COLORS = {
  free: '#64748b', plus: '#6366f1', pro: '#4ca8ad',
  creative_station: '#f59e0b', entertainment_pocket: '#a78bfa',
};

const STATUS_COLORS = {
  active: '#22c55e', banned: '#ef4444', temp_banned: '#f97316',
};

const fmtTime = (seconds) => {
  if (!seconds) return '0 dk';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h} sa ${m} dk`;
  return `${m} dk`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
};

const Badge = ({ label, color }) => (
  <span style={{
    display: 'inline-block', fontSize: 11, fontWeight: 700, padding: '2px 8px',
    borderRadius: 20, background: color + '20', color, border: `1px solid ${color}40`,
  }}>{label}</span>
);

const Card = ({ children, style }) => (
  <div style={{
    background: '#0d1117', border: '1px solid #1e2433',
    borderRadius: 16, padding: 20, ...style,
  }}>{children}</div>
);

const Stat = ({ label, value, sub, color }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    <div style={{ fontSize: 11, color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
    <div style={{ fontSize: 22, fontWeight: 800, color: color || '#f1f5f9', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: '#6b7280' }}>{sub}</div>}
  </div>
);

export default function ControlCenter() {
  const navigate = useNavigate();

  // List state
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [listLoading, setListLoading] = useState(false);

  // Detail state
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action state
  const [actionReason, setActionReason] = useState('');
  const [actionDuration, setActionDuration] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);


  // View
  const [view, setView] = useState('users'); // 'users' | 'events'

  // Mobile
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'detail'
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const showToast = (msg, type = 'info') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadUsers = useCallback(async () => {
    setListLoading(true);
    try {
      const r = await axios.get(`${API}/ceo/control-center/users`, {
        params: { page, search },
        withCredentials: true,
      });
      setUsers(r.data.users || []);
      setTotal(r.data.total || 0);
    } catch (err) {
      if (err?.response?.status === 403) navigate('/app-select');
    } finally {
      setListLoading(false);
    }
  }, [page, search, navigate]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const loadDetail = async (userId) => {
    setDetailLoading(true);
    setDetail(null);
    if (isMobile) setMobileView('detail');
    try {
      const r = await axios.get(`${API}/ceo/control-center/users/${userId}/detail`, { withCredentials: true });
      setDetail(r.data);
      setActionReason('');
      setActionDuration('');
    } catch { showToast('Detay yüklenemedi', 'error'); }
    finally { setDetailLoading(false); }
  };

  const doAction = async (userId, action) => {
    setActionLoading(true);
    try {
      const body = { reason: actionReason || 'Kural ihlali' };
      if (action === 'ban' && actionDuration) body.duration_hours = parseInt(actionDuration);
      await axios.post(`${API}/ceo/control-center/users/${userId}/${action}`, body, { withCredentials: true });
      showToast(`İşlem başarılı: ${action}`, 'success');
      await loadDetail(userId);
      loadUsers();
    } catch { showToast('İşlem başarısız', 'error'); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / 50);

  return (
    <div style={{
      minHeight: '100vh', background: '#060811',
      fontFamily: "'DM Sans', system-ui, sans-serif", color: '#e2e8f0',
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12, fontSize: 13, fontWeight: 600,
          background: toast.type === 'success' ? '#052e16' : toast.type === 'error' ? '#1a0000' : '#0a1628',
          color: toast.type === 'success' ? '#4ade80' : toast.type === 'error' ? '#f87171' : '#93c5fd',
          border: `1px solid ${toast.type === 'success' ? '#4ade8040' : toast.type === 'error' ? '#f8717140' : '#93c5fd40'}`,
          boxShadow: '0 8px 32px #00000080',
        }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ padding: isMobile ? '14px 16px' : '20px 32px', borderBottom: '1px solid #1e2433', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16 }}>
          <button
            onClick={() => {
              if (isMobile && mobileView === 'detail') { setMobileView('list'); return; }
              navigate('/app-select');
            }}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            {isMobile && mobileView === 'detail' ? 'Liste' : 'Geri'}
          </button>
          <div>
            <div style={{ fontSize: isMobile ? 15 : 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.3px' }}>
              {isMobile && mobileView === 'detail' ? (detail?.user?.name || 'Detay') : 'Kontrol Merkezi'}
            </div>
            {(!isMobile || mobileView === 'list') && (
              <div style={{ fontSize: 12, color: '#4b5563', marginTop: 1 }}>{total.toLocaleString('tr-TR')} kullanıcı kayıtlı</div>
            )}
          </div>
        </div>
        {!isMobile && (
          <button
            onClick={async () => {
              try {
                await axios.post(`${API}/ceo/control-center/aggregate-daily`, {}, { withCredentials: true });
                showToast('Günlük agregasyon tamamlandı', 'success');
              } catch { showToast('Agregasyon başarısız', 'error'); }
            }}
            style={{ background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', borderRadius: 10, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
          >
            Güncelle (Daily Agg.)
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '10px 32px 0', borderBottom: '1px solid #1e2433', background: '#060811' }}>
        {[
          { id: 'users', label: 'Kullanıcılar' },
          { id: 'events', label: 'Etkinlikler' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            style={{
              padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: 'none', border: 'none',
              color: view === tab.id ? '#f59e0b' : '#6b7280',
              borderBottom: view === tab.id ? '2px solid #f59e0b' : '2px solid transparent',
              transition: 'all 0.15s', marginBottom: -1,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'events' && (
        <div style={{ padding: '24px 32px', maxWidth: 640 }}>
          <EventCreatorPanel />
        </div>
      )}

      {view === 'users' && <div style={{ display: 'flex', height: 'calc(100vh - 113px)' }}>
        {/* LEFT — user list */}
        <div style={{
          width: isMobile ? '100%' : 380,
          borderRight: isMobile ? 'none' : '1px solid #1e2433',
          display: isMobile && mobileView === 'detail' ? 'none' : 'flex',
          flexDirection: 'column', flexShrink: 0,
        }}>
          {/* Search */}
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e2433' }}>
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1); } }}
              placeholder="ZET ID, email, isim ara..."
              style={{
                width: '100%', padding: '9px 14px', borderRadius: 10, fontSize: 13,
                background: '#0d1117', border: '1px solid #1e2433', color: '#e2e8f0',
                outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {listLoading ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Yükleniyor...</div>
            ) : users.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#4b5563', fontSize: 13 }}>Sonuç bulunamadı</div>
            ) : users.map(u => (
              <button
                key={u.user_id}
                onClick={() => loadDetail(u.user_id)}
                style={{
                  width: '100%', padding: '12px 16px', textAlign: 'left', cursor: 'pointer',
                  background: detail?.user?.user_id === u.user_id ? '#1e2433' : 'transparent',
                  border: 'none', borderBottom: '1px solid #1e243380',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                    {u.name || u.username || u.email}
                  </span>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    <Badge label={u.plan} color={PLAN_COLORS[u.plan] || '#64748b'} />
                    {u.status !== 'active' && <Badge label={u.status} color={STATUS_COLORS[u.status]} />}
                  </div>
                </div>
                <span style={{ fontSize: 11, color: '#4b5563' }}>{u.email}</span>
                <span style={{ fontSize: 10, color: '#374151', fontFamily: 'monospace' }}>{u.zet_id || u.user_id}</span>
              </button>
            ))}
          </div>

          {/* Pagination */}
          <div style={{ padding: '10px 16px', borderTop: '1px solid #1e2433', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || listLoading}
              style={{ background: 'none', border: '1px solid #1e2433', color: '#6b7280', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', disabled: 'opacity:0.4' }}>
              Önceki
            </button>
            <span style={{ fontSize: 12, color: '#4b5563' }}>{page} / {totalPages || 1}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages || listLoading}
              style={{ background: 'none', border: '1px solid #1e2433', color: '#6b7280', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer' }}>
              Sonraki
            </button>
          </div>
        </div>

        {/* RIGHT — detail */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? 16 : 24, display: isMobile && mobileView === 'list' ? 'none' : 'block' }}>
          {detailLoading && (
            <div style={{ textAlign: 'center', color: '#4b5563', paddingTop: 80, fontSize: 14 }}>Yükleniyor...</div>
          )}
          {!detail && !detailLoading && (
            <div style={{ textAlign: 'center', color: '#1e2433', paddingTop: 80 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 12px', display: 'block' }}>
                <circle cx="24" cy="24" r="22" stroke="#1e2433" strokeWidth="2" />
                <path d="M16 24h16M24 16v16" stroke="#1e2433" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p style={{ color: '#374151', fontSize: 13 }}>Detayları görmek için bir kullanıcı seç</p>
            </div>
          )}

          {detail && !detailLoading && (() => {
            const u = detail.user;
            const sec = detail.security;
            const rev = detail.revenue;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 900 }}>
                {/* Identity */}
                <Card>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                    {u.picture ? (
                      <img src={u.picture} alt="" style={{ width: 52, height: 52, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: 14, background: '#1e2433', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, color: '#374151' }}>
                        {(u.name || '?')[0].toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{u.name || '—'}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: '#374151', fontFamily: 'monospace', marginTop: 2 }}>{u.zet_id || u.user_id}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <Badge label={u.subscription?.plan || 'free'} color={PLAN_COLORS[u.subscription?.plan] || '#64748b'} />
                      {u.banned && <Badge label="Kalıcı Ban" color="#ef4444" />}
                      {u.temp_banned && <Badge label="Geçici Ban" color="#f97316" />}
                      {!u.banned && !u.temp_banned && <Badge label="Aktif" color="#22c55e" />}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 20 }}>
                    <Stat label="Kayıt" value={fmtDate(u.created_at)} />
                    <Stat label="Son aktif" value={fmtDate(u.last_heartbeat)} />
                    <Stat label="Aktif süre" value={fmtTime(u.active_time_seconds)} color="#4ca8ad" />
                    <Stat label="Rank" value={u.mindshare_rank || 'iron'} sub={`${(u.mindshare_xp || 0).toLocaleString('tr-TR')} XP`} color="#f59e0b" />
                  </div>
                  {u.ban_reason && (
                    <div style={{ marginTop: 14, padding: '8px 12px', borderRadius: 8, background: '#1a000080', border: '1px solid #ef444425', fontSize: 12, color: '#fca5a5' }}>
                      Ban: {u.ban_reason} {u.banned_until && `— ${fmtDateTime(u.banned_until)}'e kadar`}
                    </div>
                  )}
                </Card>

                {/* Revenue */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Gelir</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 20, marginBottom: 16 }}>
                    <Stat label="Toplam" value={`$${rev.total_usd.toFixed(2)}`} color="#4ade80" />
                    {Object.entries(rev.by_type || {}).map(([k, v]) => (
                      <Stat key={k} label={k === 'subscription' ? 'Abonelik' : k === 'credits' ? 'Krediler' : k} value={`$${v.toFixed(2)}`} color="#a78bfa" />
                    ))}
                  </div>
                  {rev.transactions?.length > 0 && (
                    <div style={{ maxHeight: 180, overflowY: 'auto', overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, minWidth: 340 }}>
                        <thead>
                          <tr style={{ color: '#374151' }}>
                            {['Tarih', 'Tür', 'Detay', 'Tutar'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '4px 8px', borderBottom: '1px solid #1e2433', fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rev.transactions.map((t, i) => (
                            <tr key={i} style={{ color: '#9ca3af' }}>
                              <td style={{ padding: '4px 8px' }}>{fmtDate(t.timestamp)}</td>
                              <td style={{ padding: '4px 8px' }}>{t.type}</td>
                              <td style={{ padding: '4px 8px' }}>{t.plan || t.package_id || '—'}</td>
                              <td style={{ padding: '4px 8px', color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>${(t.amount_usd || 0).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Security */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Güvenlik</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 16 }}>
                    <Stat label="Anomali Skoru" value={sec.anomaly_score} color={sec.anomaly_score > 50 ? '#ef4444' : sec.anomaly_score > 20 ? '#f97316' : '#22c55e'} />
                    <Stat label="Uyarı Sayısı" value={(u.hafizz_warnings || []).length} color="#f59e0b" />
                  </div>
                  {sec.log?.length > 0 && (
                    <div style={{ maxHeight: 140, overflowY: 'auto', fontSize: 11, color: '#6b7280' }}>
                      {sec.log.slice().reverse().map((l, i) => (
                        <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid #1e243350' }}>
                          <span style={{ color: '#374151' }}>{fmtDate(l.at)}</span> — {l.reason} <span style={{ color: '#ef4444' }}>+{l.delta}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Inventory */}
                {u.inventory?.length > 0 && (
                  <Card>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Envanter ({u.inventory.length} öge)</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {u.inventory.slice(0, 30).map((item, i) => (
                        <span key={i} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#1e2433', color: '#9ca3af', border: '1px solid #2d3748' }}>
                          {item.item_id || item.type || JSON.stringify(item).slice(0, 20)}
                        </span>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Moderation */}
                <Card style={{ border: '1px solid #ef444425' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Moderasyon</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input
                      value={actionReason}
                      onChange={e => setActionReason(e.target.value)}
                      placeholder="Sebep / mesaj..."
                      style={{ padding: '9px 12px', borderRadius: 10, background: '#0d1117', border: '1px solid #1e2433', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                    />
                    {/* Uyar + Geçici Ban satırı */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button disabled={actionLoading} onClick={() => doAction(u.user_id, 'warn')}
                        style={{ padding: '9px 16px', borderRadius: 10, background: '#f59e0b15', border: '1px solid #f59e0b30', color: '#f59e0b', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
                        Uyar
                      </button>
                      <input
                        value={actionDuration}
                        onChange={e => setActionDuration(e.target.value)}
                        placeholder="Süre (saat)"
                        type="number" min="1"
                        style={{ width: 110, padding: '9px 12px', borderRadius: 10, background: '#0d1117', border: '1px solid #1e2433', color: '#e2e8f0', fontSize: 13, outline: 'none' }}
                      />
                      <button
                        disabled={actionLoading || !actionDuration}
                        onClick={() => doAction(u.user_id, 'ban')}
                        style={{ padding: '9px 16px', borderRadius: 10, background: '#f9731615', border: '1px solid #f9731630', color: '#f97316', fontSize: 13, fontWeight: 600, cursor: actionDuration ? 'pointer' : 'not-allowed', opacity: (actionLoading || !actionDuration) ? 0.4 : 1 }}>
                        {actionDuration ? `${actionDuration} sa Geçici Ban` : 'Geçici Ban'}
                      </button>
                    </div>
                    {/* Kalıcı Ban — ayrı satır, tehlikeli */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4, borderTop: '1px solid #1e2433' }}>
                      <button
                        disabled={actionLoading}
                        onClick={() => { if (window.confirm(`${u.name || u.email} kullanıcısını kalıcı olarak banlamak istediğinize emin misiniz?`)) doAction(u.user_id, 'ban'); }}
                        style={{ padding: '9px 16px', borderRadius: 10, background: '#ef444415', border: '1px solid #ef444430', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
                        Kalıcı Ban
                      </button>
                      {(u.banned || u.temp_banned) && (
                        <button disabled={actionLoading} onClick={() => doAction(u.user_id, 'unban')}
                          style={{ padding: '9px 16px', borderRadius: 10, background: '#22c55e15', border: '1px solid #22c55e30', color: '#22c55e', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
                          Ban Kaldır
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action log */}
                  {detail.action_log?.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <div style={{ fontSize: 11, color: '#374151', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>İşlem Geçmişi</div>
                      <div style={{ maxHeight: 160, overflowY: 'auto', fontSize: 12 }}>
                        {detail.action_log.map((a, i) => (
                          <div key={i} style={{ display: 'flex', gap: 10, padding: '5px 0', borderBottom: '1px solid #1e243350', color: '#6b7280' }}>
                            <span style={{ color: '#374151', flexShrink: 0 }}>{fmtDateTime(a.timestamp)}</span>
                            <span style={{ color: a.action.includes('ban') ? '#ef4444' : a.action === 'unban' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{a.action}</span>
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.details?.reason || ''}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            );
          })()}
        </div>
      </div>}
    </div>
  );
}
