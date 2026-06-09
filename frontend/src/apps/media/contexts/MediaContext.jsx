import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { getMyProfile, getNotifications, markNotificationsRead } from '../lib/mediaApi';
import { useMediaWS } from '../hooks/useMediaWS';

const MediaContext = createContext(null);
export const useMedia = () => useContext(MediaContext);

export function MediaProvider({ children }) {
  const { user } = useAuth();
  const [mediaProfile, setMediaProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  // conv_id → messages[]
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const convMessagesRef = useRef({});

  const loadProfile = useCallback(async () => {
    if (!user) { setProfileLoading(false); return; }
    try {
      const p = await getMyProfile();
      setMediaProfile(p);
    } catch {
      setMediaProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  useEffect(() => {
    if (!user) return;
    getNotifications(1).then(d => setUnreadNotifs(d.unread_count || 0)).catch(() => {});
  }, [user]);

  const handleWsMessage = useCallback((data) => {
    if (data.type === 'new_message') {
      const { conv_id, message } = data;
      convMessagesRef.current[conv_id] = [
        ...(convMessagesRef.current[conv_id] || []),
        message,
      ];
      if (conv_id !== activeConvId) {
        setUnreadMessages(prev => prev + 1);
      }
      setConversations(prev => {
        const idx = prev.findIndex(c => c.conv_id === conv_id);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          last_message: { content: message.content, sender_id: message.sender_id, sent_at: message.created_at },
          unread_count: conv_id === activeConvId ? 0 : (updated[idx].unread_count || 0) + 1,
        };
        return updated;
      });
    } else if (data.type === 'message_deleted') {
      const { conv_id, msg_id } = data;
      if (convMessagesRef.current[conv_id]) {
        convMessagesRef.current[conv_id] = convMessagesRef.current[conv_id].filter(m => m.msg_id !== msg_id);
      }
    } else if (data.type === 'reaction_update') {
      const { conv_id, msg_id, reactions } = data;
      if (convMessagesRef.current[conv_id]) {
        convMessagesRef.current[conv_id] = convMessagesRef.current[conv_id].map(m =>
          m.msg_id === msg_id ? { ...m, reactions } : m
        );
      }
    } else if (data.type === 'notification') {
      setUnreadNotifs(prev => prev + 1);
    }
  }, [activeConvId]);

  const { sendWS } = useMediaWS(user?.user_id, handleWsMessage);

  const sendTyping = useCallback((convId, typing) => {
    sendWS({ type: 'typing', conv_id: convId, typing });
  }, [sendWS]);

  const markConvRead = useCallback((convId, msgIds) => {
    sendWS({ type: 'mark_read', conv_id: convId, msg_ids: msgIds });
    setConversations(prev => {
      const idx = prev.findIndex(c => c.conv_id === convId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], unread_count: 0 };
      return updated;
    });
  }, [sendWS]);

  const clearNotifBadge = useCallback(async () => {
    setUnreadNotifs(0);
    try { await markNotificationsRead(); } catch {}
  }, []);

  return (
    <MediaContext.Provider value={{
      mediaProfile,
      setMediaProfile,
      profileLoading,
      loadProfile,
      unreadNotifs,
      unreadMessages,
      setUnreadMessages,
      conversations,
      setConversations,
      activeConvId,
      setActiveConvId,
      convMessagesRef,
      sendTyping,
      markConvRead,
      clearNotifBadge,
      sendWS,
    }}>
      {children}
    </MediaContext.Provider>
  );
}
