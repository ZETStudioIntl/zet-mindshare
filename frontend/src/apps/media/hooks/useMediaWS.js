import { useEffect, useRef, useCallback } from 'react';
import { getWsUrl } from '../lib/mediaApi';

export function useMediaWS(userId, onMessage) {
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const connect = useCallback(() => {
    if (!userId) return;
    try {
      const url = getWsUrl(userId);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        clearInterval(reconnectTimer.current);
        // heartbeat
        const ping = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
        }, 25000);
        ws._pingInterval = ping;
      };

      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type !== 'pong') onMessageRef.current(data);
        } catch {}
      };

      ws.onclose = () => {
        clearInterval(ws._pingInterval);
        // 3s sonra yeniden bağlan
        reconnectTimer.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    } catch {}
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  const sendWS = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { sendWS };
}
