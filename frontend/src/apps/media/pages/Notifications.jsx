import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getNotifications } from '../lib/mediaApi';
import { useMedia } from '../contexts/MediaContext';
import { Avatar } from '../components/ui/Avatar';

function timeAgo(iso) {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'şimdi';
  if (secs < 3600) return `${Math.floor(secs / 60)}d önce`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}s önce`;
  return `${Math.floor(secs / 86400)}g önce`;
}

const NOTIF_TEXTS = {
  like: 'gönderini beğendi',
  comment: 'gönderine yorum yaptı',
  follow: 'seni takip etmeye başladı',
  mention: 'seni bir gönderide etiketledi',
  message: 'sana mesaj gönderdi',
  group_message: 'gruba mesaj gönderdi',
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { clearNotifBadge } = useMedia();
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    clearNotifBadge();
    getNotifications(1).then(data => {
      setNotifs(data.notifications || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [clearNotifBadge]);

  const handleClick = (notif) => {
    if (notif.type === 'follow' || notif.type === 'mention') {
      navigate(`/media/profile/${notif.actor?.handle}`);
    } else if (notif.type === 'like' || notif.type === 'comment') {
      navigate(`/media/post/${notif.target_id}`);
    } else if (notif.type === 'message' || notif.type === 'group_message') {
      navigate('/media/messages');
    }
  };

  return (
    <div style={{ background: 'var(--media-bg,#0f0f0f)', minHeight: '100vh', paddingBottom: 80 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--media-bg,#0f0f0f)',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        padding: '14px 16px', paddingTop: 'calc(14px + env(safe-area-inset-top))',
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Bildirimler</span>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#555' }}>Yükleniyor…</div>
      ) : notifs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 20px', color: '#555' }}>
          <p>Henüz bildirim yok</p>
        </div>
      ) : (
        notifs.map(n => (
          <button
            key={n.notif_id}
            onClick={() => handleClick(n)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', background: n.read ? 'none' : 'rgba(41,47,145,0.08)',
              border: 'none', borderBottom: '1px solid var(--media-border,#1a1a1a)',
              cursor: 'pointer', textAlign: 'left',
            }}
          >
            <Avatar src={n.actor?.profile_photo} displayName={n.actor?.display_name} size={42} verification={n.actor?.verification} />
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{n.actor?.display_name || n.actor?.handle || 'Birisi'}</span>
              <span style={{ fontSize: 14, color: '#888' }}> {NOTIF_TEXTS[n.type] || n.type}</span>
              <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3a0ca3', flexShrink: 0 }} />}
          </button>
        ))
      )}
    </div>
  );
}
