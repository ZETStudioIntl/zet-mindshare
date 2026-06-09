import React, { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { createConversation, search } from '../../lib/mediaApi';
import { useMedia } from '../../contexts/MediaContext';

function timeAgo(iso) {
  if (!iso) return '';
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return 'şimdi';
  if (secs < 3600) return `${Math.floor(secs / 60)}d`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}s`;
  return `${Math.floor(secs / 86400)}g`;
}

function NewConvSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>;
}

export function ConversationList({ conversations, onSelect }) {
  const { mediaProfile } = useMedia();
  const [showNewDM, setShowNewDM] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [tab, setTab] = useState('all');

  const handleSearch = async (q) => {
    setSearchQ(q);
    if (!q.trim()) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await search(q, 'users', 1);
      setSearchResults(res.users || []);
    } catch {}
    setSearching(false);
  };

  const startDM = async (targetProfile) => {
    try {
      const conv = await createConversation({ type: 'dm', other_user_id: targetProfile.user_id || targetProfile.user_id });
      setShowNewDM(false);
      setSearchQ('');
      setSearchResults([]);
      onSelect(conv);
    } catch {}
  };

  const filtered = conversations.filter(c => {
    if (tab === 'dms') return c.type === 'dm';
    if (tab === 'groups') return c.type === 'group';
    if (tab === 'channels') return c.type === 'channel';
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--media-bg,#0f0f0f)' }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px 8px',
        paddingTop: 'calc(14px + env(safe-area-inset-top))',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        background: 'var(--media-surface,#1a1a1a)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Mesajlar</span>
          <button onClick={() => setShowNewDM(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
            <NewConvSVG />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none' }}>
          {[['all', 'Tümü'], ['dms', 'DM'], ['groups', 'Gruplar'], ['channels', 'Kanallar']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: tab === key ? '#292F91' : 'transparent',
              color: tab === key ? '#fff' : '#666',
              border: '1px solid ' + (tab === key ? '#292F91' : '#333'),
              borderRadius: 20, padding: '4px 12px', fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* Yeni DM arama */}
      {showNewDM && (
        <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--media-border,#2a2a2a)', background: 'var(--media-surface,#1a1a1a)' }}>
          <input
            autoFocus
            value={searchQ}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Kullanıcı ara…"
            style={{
              width: '100%', background: 'var(--media-surface2,#242424)',
              border: '1px solid #333', borderRadius: 20,
              padding: '8px 14px', color: '#fff', fontSize: 14, outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {searching && <div style={{ padding: '8px 0', color: '#666', fontSize: 13 }}>Aranıyor…</div>}
          {searchResults.map(u => (
            <button
              key={u.user_id || u.handle}
              onClick={() => startDM(u)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 0', background: 'none', border: 'none', cursor: 'pointer',
              }}
            >
              <Avatar src={u.profile_photo} displayName={u.display_name || u.handle} size={36} verification={u.verification} />
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontSize: 14, color: '#fff', fontWeight: 600 }}>{u.display_name || u.handle}</div>
                <div style={{ fontSize: 12, color: '#666' }}>@{u.handle}</div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Liste */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#555' }}>
            <p>Henüz mesaj yok</p>
            <button onClick={() => setShowNewDM(true)} style={{ marginTop: 12, background: '#292F91', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', cursor: 'pointer', fontSize: 14 }}>
              Yeni Mesaj
            </button>
          </div>
        )}
        {filtered.map(conv => {
          const name = conv.type === 'dm'
            ? (conv.other_profile?.display_name || conv.other_profile?.handle || 'DM')
            : (conv.name || 'Grup');
          const photo = conv.type === 'dm' ? conv.other_profile?.profile_photo : conv.photo;
          const verif = conv.type === 'dm' ? conv.other_profile?.verification : null;
          const online = conv.other_online;
          const lastMsg = conv.last_message;
          const unread = conv.unread_count || 0;

          return (
            <button
              key={conv.conv_id}
              onClick={() => onSelect(conv)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: '1px solid var(--media-border,#222)',
                textAlign: 'left',
              }}
            >
              <Avatar src={photo} displayName={name} size={48} verification={verif} online={online} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 15, fontWeight: unread > 0 ? 700 : 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                  <span style={{ fontSize: 11, color: '#555', flexShrink: 0, marginLeft: 8 }}>{timeAgo(lastMsg?.sent_at)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span style={{ fontSize: 13, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                    {lastMsg ? (lastMsg.sender_id === mediaProfile?.user_id ? 'Sen: ' : '') + (lastMsg.content || '[medya]') : 'Henüz mesaj yok'}
                  </span>
                  {unread > 0 && (
                    <span style={{
                      background: '#292F91', color: '#fff', borderRadius: 99,
                      fontSize: 11, fontWeight: 700, minWidth: 18, height: 18,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      paddingInline: 4, flexShrink: 0, marginLeft: 6,
                    }}>
                      {unread > 99 ? '99+' : unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
