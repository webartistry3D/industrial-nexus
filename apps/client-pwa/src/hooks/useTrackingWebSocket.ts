import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useTrackingWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

  const connect = () => {
    try {
      const token = localStorage.getItem('accessToken');
      const socket = io(`${WS_URL}/tracking`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 5000,
      });

      socket.on('connect', () => {
        setIsConnected(true);
        setError(null);
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

      socket.on('connect_error', (err) => {
        console.error('[Tracking WebSocket] Error:', err);
        setError('WebSocket connection error');
      });

      socket.on('location:update', (data) => {
        const handler = eventHandlersRef.current.get('location:update');
        if (handler) handler(data);
      });

      socket.on('geofence:event', (data) => {
        const handler = eventHandlersRef.current.get('geofence:event');
        if (handler) handler(data);
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

    if (socketRef.current?.connected) {
      if (eventType.startsWith('trip:')) {
        socketRef.current.emit('subscribe:trip', { tripId: eventType.split(':')[1] });
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
