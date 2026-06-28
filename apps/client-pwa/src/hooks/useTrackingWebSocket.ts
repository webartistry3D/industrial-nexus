import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { refreshAccessToken } from '@/lib/api';

export function useTrackingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

  const isRefreshingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 2;

  const connect = async (tokenOverride?: string) => {
    try {
      let token = tokenOverride || localStorage.getItem('accessToken');
      if (!token) return;

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(`${WS_URL}/tracking`, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionDelay: 5000,
        timeout: 10000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log('[Tracking WebSocket] Connected');
        // Re-subscribe all registered handlers after reconnect
        eventHandlersRef.current.forEach((_, key) => {
          if (key.startsWith('trip:')) {
            socket.emit('subscribe:trip', { tripId: key.split(':')[1] });
          }
        });
      });

      socket.on('disconnect', () => {
        setIsConnected(false);
        console.log('[Tracking WebSocket] Disconnected');
      });

      socket.on('connect_error', async (err) => {
        console.error('[Tracking WebSocket] Error:', err);
        setError('WebSocket connection error');

        const isTokenError = err.message?.includes('jwt expired') ||
          err.message?.includes('TokenExpiredError') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('invalid token');

        if (isTokenError && !isRefreshingRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttemptsRef.current += 1;
          isRefreshingRef.current = true;
          const newToken = await refreshAccessToken();
          isRefreshingRef.current = false;
          if (newToken) {
            connect(newToken);
          }
        }
      });

      socket.on('location:update', (data) => {
        const handler = eventHandlersRef.current.get('location:update');
        if (handler) handler(data);
      });

      socket.on('geofence:event', (data) => {
        const handler = eventHandlersRef.current.get('geofence:event');
        if (handler) handler(data);
      });

      socket.on('package:location:update', (data) => {
        if (data?.packageTrackerId) {
          const handler = eventHandlersRef.current.get(`package:${data.packageTrackerId}`);
          if (handler) handler(data);
        }
      });

      socket.on('auth:expired', async () => {
        console.warn('[Tracking WebSocket] Server signalled token expiry — refreshing');
        if (!isRefreshingRef.current) {
          isRefreshingRef.current = true;
          const newToken = await refreshAccessToken();
          isRefreshingRef.current = false;
          if (newToken) {
            connect(newToken);
          }
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('[Tracking WebSocket] Connection failed:', err);
      setError('Failed to connect to WebSocket');
    }
  };

  const disconnect = () => {
    const socket = socketRef.current;
    if (socket) {
      socket.off();
      if (socket.connected || socket.io?.engine?.readyState === 'opening') {
        socket.disconnect();
      }
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const subscribe = (eventType: string, handler: (data: any) => void) => {
    eventHandlersRef.current.set(eventType, handler);

    if (socketRef.current?.connected) {
      if (eventType.startsWith('trip:')) {
        socketRef.current.emit('subscribe:trip', { tripId: eventType.split(':')[1] });
      } else if (eventType.startsWith('package:')) {
        socketRef.current.emit('subscribe:package', { packageTrackerId: eventType.split(':')[1] });
      } else if (eventType === 'location:update') {
        socketRef.current.emit('subscribe:fleet');
      }
    }
  };

  const unsubscribe = (eventType: string) => {
    eventHandlersRef.current.delete(eventType);

    if (socketRef.current?.connected) {
      if (eventType.startsWith('trip:')) {
        socketRef.current.emit('unsubscribe:trip', { tripId: eventType.split(':')[1] });
      } else if (eventType.startsWith('package:')) {
        socketRef.current.emit('unsubscribe:package', { packageTrackerId: eventType.split(':')[1] });
      } else if (eventType === 'location:update') {
        socketRef.current.emit('unsubscribe:fleet');
      }
    }
  };

  useEffect(() => {
    connect();
    return () => disconnect();
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
