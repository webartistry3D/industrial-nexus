import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { refreshAccessToken, getAccessToken } from '@/lib/api';

export function useTrackingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  // WebSocket URL - adjust based on your backend configuration
  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

  const isRefreshingRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 2;

  const connect = async (tokenOverride?: string) => {
    try {
      let token = tokenOverride || getAccessToken();
      if (!token) return;

      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      const socket = io(`${WS_URL}/tracking`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 5000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log('[Tracking WebSocket] Connected');
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
        const handlers = eventHandlersRef.current.get('location:update');
        if (handlers) {
          handlers(data);
        }
      });

      socket.on('geofence:event', (data) => {
        const handlers = eventHandlersRef.current.get('geofence:event');
        if (handlers) {
          handlers(data);
        }
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('[Tracking WebSocket] Connection failed:', err);
      setError('Failed to connect to WebSocket');
    }
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    }
  };

  const subscribe = (eventType: string, handler: (data: any) => void) => {
    eventHandlersRef.current.set(eventType, handler);

    // Send subscription message to server
    if (socketRef.current?.connected) {
      if (eventType === 'location:update') {
        socketRef.current.emit('subscribe:fleet');
      } else if (eventType.startsWith('trip:')) {
        const tripId = eventType.split(':')[1];
        socketRef.current.emit('subscribe:trip', { tripId });
      }
    }
  };

  const unsubscribe = (eventType: string) => {
    eventHandlersRef.current.delete(eventType);

    // Send unsubscribe message to server
    if (socketRef.current?.connected) {
      if (eventType === 'location:update') {
        socketRef.current.emit('unsubscribe:fleet');
      } else if (eventType.startsWith('trip:')) {
        const tripId = eventType.split(':')[1];
        socketRef.current.emit('unsubscribe:trip', { tripId });
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
