import React, { useState } from 'react';
import { Avatar } from '../ui/Avatar';
import { reactToMessage, deleteMessage } from '../../lib/mediaApi';

const EMOJI_REACTIONS = ['❤️', '😂', '😮', '😢', '😡', '👍'];

function timeStr(iso) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ msg, isOwn, showAvatar, onReply, onDelete, myUserId }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactions, setReactions] = useState(msg.reactions || []);

  const handleReact = async (emoji) => {
    setShowEmoji(false);
    try {
      const res = await reactToMessage(msg.msg_id, emoji);
      setReactions(res.reactions);
    } catch {}
  };

  const handleDelete = async () => {
    if (window.confirm('Bu mesajı silmek istiyor musun?')) {
      try {
        await deleteMessage(msg.msg_id);
        onDelete?.(msg.msg_id);
      } catch {}
    }
  };

  const reactionGroups = reactions.reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});

  const isBot = msg.is_bot || msg.sender_id === 'zeta_bot';

  return (
    <div style={{
      display: 'flex',
      flexDirection: isOwn ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: 8,
      marginBottom: 4,
      padding: '0 12px',
    }}>
      {/* Avatar — sadece karşı tarafta ve gerektiğinde */}
      {!isOwn && showAvatar ? (
        <Avatar src={msg.sender_photo} displayName={msg.sender_display_name || msg.sender_handle} size={28} verification={msg.sender_verification} />
      ) : !isOwn ? (
        <div style={{ width: 28, flexShrink: 0 }} />
      ) : null}

      <div style={{ maxWidth: '72%', position: 'relative' }}>
        {/* Zeta bot label */}
        {isBot && !isOwn && (
          <div style={{ fontSize: 11, color: '#F5A623', marginBottom: 2, fontWeight: 600 }}>⚡ Zeta AI</div>
        )}

        {/* Reply preview */}
        {msg.reply_to && (
          <div style={{
            background: 'rgba(255,255,255,0.06)', borderLeft: '2px solid #555',
            borderRadius: '8px 8px 0 0', padding: '4px 8px', fontSize: 12, color: '#888',
            marginBottom: -4,
          }}>
            Yanıtlandı
          </div>
        )}

        {/* Bubble */}
        <div
          style={{
            background: isOwn ? 'linear-gradient(135deg,#292F91,#3b4abf)' : isBot ? 'rgba(245,166,35,0.12)' : 'var(--media-surface2,#242424)',
            color: 'var(--media-text,#e5e5e5)',
            borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            padding: '8px 12px',
            fontSize: 14, lineHeight: 1.5,
            border: isBot ? '1px solid rgba(245,166,35,0.3)' : 'none',
          }}
          onDoubleClick={() => setShowEmoji(v => !v)}
          onContextMenu={(e) => { e.preventDefault(); setShowEmoji(v => !v); }}
        >
          {msg.type === 'text' && <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{msg.content}</span>}
          {msg.type === 'image' && msg.media_url && <img src={msg.media_url} alt="Görsel" style={{ maxWidth: '100%', borderRadius: 8, display: 'block' }} />}
          {msg.type === 'voice' && msg.media_url && <audio controls src={msg.media_url} style={{ maxWidth: '100%' }} />}
          {msg.type === 'file' && msg.media_url && (
            <a href={msg.media_url} target="_blank" rel="noopener noreferrer" style={{ color: '#60a5fa', textDecoration: 'none' }}>
              📎 {msg.content || 'Dosya'}
            </a>
          )}

          <div style={{ textAlign: isOwn ? 'right' : 'left', marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: isOwn ? 'flex-end' : 'flex-start', gap: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{timeStr(msg.created_at)}</span>
            {isOwn && (
              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>
                {msg.read_by?.length > 1 ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>

        {/* Reactions */}
        {Object.keys(reactionGroups).length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 2, flexWrap: 'wrap', justifyContent: isOwn ? 'flex-end' : 'flex-start' }}>
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <button key={emoji} onClick={() => handleReact(emoji)} style={{
                background: 'var(--media-surface2,#242424)', border: '1px solid var(--media-border,#333)',
                borderRadius: 12, padding: '1px 6px', cursor: 'pointer', fontSize: 13,
              }}>
                {emoji} {count > 1 && <span style={{ fontSize: 11, color: '#888' }}>{count}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker */}
        {showEmoji && (
          <div style={{
            position: 'absolute', [isOwn ? 'right' : 'left']: 0, bottom: '100%',
            background: 'var(--media-surface2,#242424)',
            border: '1px solid var(--media-border,#333)',
            borderRadius: 24, padding: '6px 8px', display: 'flex', gap: 4, zIndex: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          }}>
            {EMOJI_REACTIONS.map(e => (
              <button key={e} onClick={() => handleReact(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 2 }}>{e}</button>
            ))}
            <span style={{ width: 1, background: '#333', margin: '2px 0' }} />
            {onReply && <button onClick={() => { setShowEmoji(false); onReply(msg); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 12, padding: '0 4px' }}>Yanıtla</button>}
            {isOwn && <button onClick={handleDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12, padding: '0 4px' }}>Sil</button>}
          </div>
        )}
      </div>
    </div>
  );
}
