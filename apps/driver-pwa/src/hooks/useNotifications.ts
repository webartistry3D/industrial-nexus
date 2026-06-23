import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api, refreshAccessToken } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export interface Notification {
  id: string;
  userId?: string;
  userName?: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialFetchDone = useRef(false);
  const mountedRef = useRef(false);
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/new-notification.mp3');
      audioRef.current.preload = 'auto';
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const playNotificationSoundRef = useRef(playNotificationSound);
  playNotificationSoundRef.current = playNotificationSound;

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : [];
      const unread = list.filter((n: Notification) => !n.isRead).length;
      setNotifications(list);
      setUnreadCount(unread);
      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
        if (unread > 0) playNotificationSoundRef.current();
      }
    } catch (err) {
      console.error('[Notifications] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[Notifications] Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[Notifications] Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications(prev => {
        const updated = prev.filter(n => n.id !== id);
        setUnreadCount(updated.filter(n => !n.isRead).length);
        return updated;
      });
    } catch (err) {
      console.error('[Notifications] Failed to delete:', err);
    }
  }, []);

  const fetchNotificationsRef = useRef(fetchNotifications);
  fetchNotificationsRef.current = fetchNotifications;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }
    if (mountedRef.current) return;
    mountedRef.current = true;

    let socket: Socket | null = null;
    let isRefreshing = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 2;

    const connectSocket = async (tokenOverride?: string) => {
      const token = tokenOverride || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (!token) return;

      if (socket) {
        socket.disconnect();
        socket = null;
      }

      socket = io(`${WS_URL}/tracking`, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 5000,
      });

      socket.on('connect', () => {
        console.log('[Notifications WS] Connected');
        reconnectAttempts = 0;
      });

      socket.on('notification:new', (notification: Notification) => {
        if (notification.userId && notification.userId !== user?.userId) return;
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        playNotificationSoundRef.current();
      });

      socket.on('connect_error', async (err) => {
        console.error('[Notifications WS] Connection error:', err);
        const isTokenError = err.message?.includes('jwt expired') ||
          err.message?.includes('TokenExpiredError') ||
          err.message?.includes('Unauthorized') ||
          err.message?.includes('invalid token');

        if (isTokenError && !isRefreshing && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts += 1;
          isRefreshing = true;
          const newToken = await refreshAccessToken();
          isRefreshing = false;
          if (newToken) connectSocket(newToken);
        }
      });

      socketRef.current = socket;
    };

    fetchNotificationsRef.current();
    connectSocket();

    return () => {
      socket?.disconnect();
      socketRef.current = null;
      mountedRef.current = false;
    };
  }, [authLoading, user]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refetch: fetchNotifications,
  };
}
