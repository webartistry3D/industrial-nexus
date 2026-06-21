import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { api } from '@/lib/api';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  entityId?: string;
  entityType?: string;
  isRead: boolean;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialFetchDone = useRef(false);

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

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications();
      const list = Array.isArray(data) ? data : [];
      const unread = list.filter((n: Notification) => !n.isRead).length;
      setNotifications(list);
      setUnreadCount(unread);
      if (!initialFetchDone.current) {
        initialFetchDone.current = true;
        if (unread > 0) playNotificationSound();
      }
    } catch (err) {
      console.error('[Notifications] Failed to fetch:', err);
    } finally {
      setLoading(false);
    }
  }, [playNotificationSound]);

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

  // Connect WebSocket and listen for real-time notifications
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    fetchNotifications();

    const socket = io(`${WS_URL}/tracking`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 5000,
    });

    socket.on('connect', () => {
      console.log('[Notifications WS] Connected');
    });

    socket.on('notification:new', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      playNotificationSound();
    });

    socket.on('connect_error', (err) => {
      console.error('[Notifications WS] Connection error:', err);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

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
