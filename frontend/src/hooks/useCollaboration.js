import { useState, useEffect, useRef, useCallback } from 'react';

const API = process.env.REACT_APP_BACKEND_URL;

export function useCollaboration(docId, userId, userName, enabled = false) {
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const [myColor, setMyColor] = useState('#4ca8ad');
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const pingTimer = useRef(null);

  const connect = useCallback(() => {
    if (!docId || !userId || !enabled) return;
    
    const wsUrl = API.replace(/^http/, 'ws') + `/api/ws/collab/${docId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', user_id: userId, user_name: userName }));
      pingTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
      }, 30000);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      switch (data.type) {
        case 'connected':
          setConnected(true);
          setMyColor(data.color);
          setOnlineUsers(data.users || []);
          break;
        case 'user_joined':
          setOnlineUsers(data.users || []);
          break;
        case 'user_left':
          setOnlineUsers(data.users || []);
          setRemoteCursors(prev => { const n = { ...prev }; delete n[data.user_id]; return n; });
          break;
        case 'cursor_move':
          setRemoteCursors(prev => ({
            ...prev,
            [data.user_id]: { ...data.position, name: data.name, color: data.color }
          }));
          break;
        case 'pong':
          break;
        default:
          // Forward to handler
          if (ws._onCollabMessage) ws._onCollabMessage(data);
          break;
      }
    };

    ws.onclose = () => {
      setConnected(false);
      if (pingTimer.current) clearInterval(pingTimer.current);
      if (enabled) {
        reconnectTimer.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => ws.close();
  }, [docId, userId, userName, enabled]);

  useEffect(() => {
    if (enabled) connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pingTimer.current) clearInterval(pingTimer.current);
    };
  }, [enabled, connect]);

  const sendCursorMove = useCallback((position) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor_move', position }));
    }
  }, []);

  const sendElementUpdate = useCallback((elements, pageIndex) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'element_update', elements, page_index: pageIndex }));
    }
  }, []);

  const sendElementAdd = useCallback((element) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'element_add', element }));
    }
  }, []);

  const sendElementDelete = useCallback((elementId) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'element_delete', element_id: elementId }));
    }
  }, []);

  const onCollabMessage = useCallback((handler) => {
    if (wsRef.current) wsRef.current._onCollabMessage = handler;
  }, []);

  return {
    connected, onlineUsers, remoteCursors, myColor,
    sendCursorMove, sendElementUpdate, sendElementAdd, sendElementDelete,
    onCollabMessage, wsRef
  };
}
