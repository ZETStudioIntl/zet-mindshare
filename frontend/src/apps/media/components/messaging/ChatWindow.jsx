import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getMessages, sendMessage } from '../../lib/mediaApi';
import { useMedia } from '../../contexts/MediaContext';
import { useAuth } from '../../../../contexts/AuthContext';
import { MessageBubble } from './MessageBubble';
import { Avatar } from '../ui/Avatar';

function BackSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}

function SendSVG() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>;
}

function InfoSVG() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>;
}

export function ChatWindow({ conv, onBack }) {
  const { user } = useAuth();
  const { convMessagesRef, sendTyping, markConvRead, setActiveConvId } = useMedia();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const [replyTo, setReplyTo] = useState(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);

  const convId = conv.conv_id;
  const myId = user?.user_id;

  // Başlık bilgisi
  const title = conv.type === 'dm'
    ? (conv.other_profile?.display_name || conv.other_profile?.handle || 'DM')
    : (conv.name || 'Grup');

  const headerPhoto = conv.type === 'dm' ? conv.other_profile?.profile_photo : conv.photo;
  const headerVerif = conv.type === 'dm' ? conv.other_profile?.verification : null;
  const isOnline = conv.other_online || false;

  useEffect(() => {
    setActiveConvId(convId);
    return () => setActiveConvId(null);
  }, [convId, setActiveConvId]);

  // Mesajları yükle
  useEffect(() => {
    const cached = convMessagesRef.current[convId];
    if (cached && cached.length > 0) {
      setMessages(cached);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      return;
    }
    getMessages(convId, { limit: 30 }).then(data => {
      const msgs = data.messages || [];
      setMessages(msgs);
      convMessagesRef.current[convId] = msgs;
      setHasOlder(msgs.length === 30);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
      if (msgs.length > 0) {
        markConvRead(convId, msgs.map(m => m.msg_id));
      }
    }).catch(() => {});
  }, [convId]);

  // WebSocket'ten gelen yeni mesajları state'e yansıt
  useEffect(() => {
    const interval = setInterval(() => {
      const cached = convMessagesRef.current[convId];
      if (cached) {
        setMessages(prev => {
          if (prev.length === cached.length && prev[prev.length - 1]?.msg_id === cached[cached.length - 1]?.msg_id) return prev;
          return [...cached];
        });
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [convId, convMessagesRef]);

  const loadOlder = async () => {
    if (loadingOlder || !hasOlder || messages.length === 0) return;
    setLoadingOlder(true);
    try {
      const oldest = messages[0]?.created_at;
      const data = await getMessages(convId, { before: oldest, limit: 30 });
      const older = data.messages || [];
      const merged = [...older, ...messages];
      setMessages(merged);
      convMessagesRef.current[convId] = merged;
      setHasOlder(older.length === 30);
    } catch {}
    setLoadingOlder(false);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setReplyTo(null);
    try {
      const msg = await sendMessage(convId, {
        type: 'text',
        content: text,
        reply_to: replyTo?.msg_id || null,
      });
      const updated = [...(convMessagesRef.current[convId] || []), msg];
      convMessagesRef.current[convId] = updated;
      setMessages(updated);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    } catch {}
    setSending(false);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTyping(convId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => sendTyping(convId, false), 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleMsgDelete = useCallback((msgId) => {
    setMessages(prev => prev.filter(m => m.msg_id !== msgId));
    convMessagesRef.current[convId] = (convMessagesRef.current[convId] || []).filter(m => m.msg_id !== msgId);
  }, [convId, convMessagesRef]);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100vh',
      background: 'var(--media-bg,#0f0f0f)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderBottom: '1px solid var(--media-border,#2a2a2a)',
        background: 'var(--media-surface,#1a1a1a)',
        position: 'sticky', top: 0, zIndex: 10,
        paddingTop: 'calc(10px + env(safe-area-inset-top))',
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', padding: 4 }}>
          <BackSVG />
        </button>
        <Avatar src={headerPhoto} displayName={title} size={36} verification={headerVerif} online={isOnline} />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#fff' }}>{title}</div>
          <div style={{ fontSize: 11, color: '#666' }}>
            {conv.type === 'group' ? `${conv.member_count || 0} üye` : isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
          </div>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}>
          <InfoSVG />
        </button>
      </div>

      {/* Zeta bilgisi */}
      {conv.zeta_enabled && (
        <div style={{ padding: '6px 14px', background: 'rgba(245,166,35,0.08)', borderBottom: '1px solid rgba(245,166,35,0.15)', fontSize: 12, color: '#F5A623', textAlign: 'center' }}>
          ⚡ Zeta AI bu sohbette aktif — @zeta yazarak kullanabilirsin
        </div>
      )}

      {/* Mesajlar */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {hasOlder && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <button onClick={loadOlder} disabled={loadingOlder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 13 }}>
              {loadingOlder ? 'Yükleniyor…' : 'Daha eski mesajlar'}
            </button>
          </div>
        )}

        {messages.map((msg, i) => {
          const isOwn = msg.sender_id === myId;
          const prevMsg = messages[i - 1];
          const showAvatar = !isOwn && prevMsg?.sender_id !== msg.sender_id;
          return (
            <MessageBubble
              key={msg.msg_id}
              msg={msg}
              isOwn={isOwn}
              showAvatar={showAvatar}
              onReply={(m) => setReplyTo(m)}
              onDelete={handleMsgDelete}
              myUserId={myId}
            />
          );
        })}

        {typing && (
          <div style={{ padding: '4px 54px', color: '#666', fontSize: 13 }}>yazıyor…</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div style={{
          padding: '6px 14px', background: 'var(--media-surface,#1a1a1a)',
          borderTop: '1px solid var(--media-border,#2a2a2a)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ flex: 1, borderLeft: '2px solid #292F91', paddingLeft: 8 }}>
            <div style={{ fontSize: 11, color: '#666' }}>Yanıtlıyor: {replyTo.sender_handle}</div>
            <div style={{ fontSize: 13, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{replyTo.content}</div>
          </div>
          <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: 18 }}>×</button>
        </div>
      )}

      {/* Input */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 14px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom))',
        background: 'var(--media-surface,#1a1a1a)',
        borderTop: '1px solid var(--media-border,#2a2a2a)',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Mesaj yaz… (@zeta ile AI komutları)"
          rows={1}
          style={{
            flex: 1, background: 'var(--media-surface2,#242424)',
            border: '1px solid var(--media-border,#333)', borderRadius: 20,
            padding: '9px 14px', color: '#fff', fontSize: 14, resize: 'none',
            outline: 'none', maxHeight: 120, overflowY: 'auto',
            fontFamily: 'inherit', lineHeight: 1.4,
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          style={{
            background: input.trim() ? 'linear-gradient(135deg,#292F91,#3b4abf)' : '#2a2a2a',
            border: 'none', borderRadius: '50%', width: 40, height: 40,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            color: '#fff', flexShrink: 0,
            transition: 'background .15s',
          }}
        >
          <SendSVG />
        </button>
      </div>
    </div>
  );
}
