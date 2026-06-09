import React, { useEffect, useState } from 'react';
import { getConversations } from '../lib/mediaApi';
import { useMedia } from '../contexts/MediaContext';
import { ConversationList } from '../components/messaging/ConversationList';
import { ChatWindow } from '../components/messaging/ChatWindow';

export default function MessagesPage() {
  const { conversations, setConversations, setUnreadMessages } = useMedia();
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversations().then(data => {
      setConversations(data);
      const total = data.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadMessages(total);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [setConversations, setUnreadMessages]);

  const handleSelect = (conv) => {
    setSelectedConv(conv);
    setConversations(prev => {
      const idx = prev.findIndex(c => c.conv_id === conv.conv_id);
      if (idx === -1) return [conv, ...prev];
      return prev;
    });
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--media-bg,#0f0f0f)' }}>
      <div style={{ color: '#555' }}>Yükleniyor…</div>
    </div>
  );

  if (selectedConv) {
    return (
      <ChatWindow
        conv={selectedConv}
        onBack={() => setSelectedConv(null)}
      />
    );
  }

  return (
    <>
      <ConversationList conversations={conversations} onSelect={handleSelect} />
    </>
  );
}
