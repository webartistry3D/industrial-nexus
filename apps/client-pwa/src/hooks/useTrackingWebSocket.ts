import { useEffect, useRef, useState } from 'react';

type TrackingEvent = {
  type: 'location:update' | 'geofence:event';
  data: any;
};

export function useTrackingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/tracking';

  const connect = () => {
    try {
      const token = localStorage.getItem('accessToken');
      const ws = new WebSocket(`${WS_URL}?token=${token}`);

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        console.log('[Tracking WebSocket] Connected');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('[Tracking WebSocket] Disconnected');
        setTimeout(() => {
          if (!socketRef.current?.OPEN) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = (err) => {
        console.error('[Tracking WebSocket] Error:', err);
        setError('WebSocket connection error');
      };

      ws.onmessage = (event) => {
        try {
          const message: TrackingEvent = JSON.parse(event.data);
          const handlers = eventHandlersRef.current.get(message.type);
          if (handlers) {
            handlers(message.data);
          }
        } catch (err) {
          console.error('[Tracking WebSocket] Failed to parse message:', err);
        }
      };

      socketRef.current = ws;
    } catch (err) {
      console.error('[Tracking WebSocket] Connection failed:', err);
      setError('Failed to connect to WebSocket');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const subscribe = (eventType: string, handler: (data: any) => void) => {
    eventHandlersRef.current.set(eventType, handler);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (eventType.startsWith('trip:')) {
        const tripId = eventType.split(':')[1];
        socketRef.current.send(JSON.stringify({ event: 'subscribe:trip', tripId }));
      }
    }
  };

  const unsubscribe = (eventType: string) => {
    eventHandlersRef.current.delete(eventType);

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      if (eventType.startsWith('trip:')) {
        const tripId = eventType.split(':')[1];
        socketRef.current.send(JSON.stringify({ event: 'unsubscribe:trip', tripId }));
      }
    }
  };

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, []);

  return {
    isConnected,
    error,
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  };
}
