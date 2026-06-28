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

// Module-level flag to prevent duplicate socket connections across remounts
let socketInitialized = false;
let sharedSocket: Socket | null = null;

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const initialFetchDone = useRef(false);
  const knownIdsRef = useRef<Set<string>>(new Set());
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
      // Track known IDs so we don't play sound for pre-existing notifications
      list.forEach((n: Notification) => knownIdsRef.current.add(n.id));
      initialFetchDone.current = true;
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

    // Always fetch notifications on mount (to refresh the list)
    fetchNotificationsRef.current();

    // Only create the WebSocket once across all mounts
    if (socketInitialized) {
      socketRef.current = sharedSocket;
      return;
    }
    socketInitialized = true;

    let isRefreshing = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 2;

    const connectSocket = async (tokenOverride?: string) => {
      const token = tokenOverride || (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null);
      if (!token) return;

      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
      }

      const socket = io(`${WS_URL}/tracking`, {
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
        // Only play sound for genuinely new notifications we haven't seen before
        if (knownIdsRef.current.has(notification.id)) return;
        knownIdsRef.current.add(notification.id);
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

      sharedSocket = socket;
      socketRef.current = socket;
    };

    connectSocket();

    // Do NOT disconnect on unmount — the socket is shared across page navigations
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
