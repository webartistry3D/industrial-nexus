'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, User, LogOut, LogOut as LogOutIcon, Wifi, WifiOff, Bell, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';

interface PageHeaderProps {
  title?: string;
  subtitle?: string;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  pendingCount?: number;
}

export function PageHeader({ title, subtitle, showOnlineStatus = false, isOnline = true, pendingCount = 0 }: PageHeaderProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    const newIsDark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark');
    setIsDark(newIsDark);
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const getHeaderTitle = () => {
    if (title) return title;
    if (pathname === '/dashboard') return 'Industrial Nexus';
    if (pathname === '/trips') return 'My Trips';
    if (pathname === '/tracking') return 'Live Tracking';
    if (pathname === '/history') return 'Trip History';
    if (pathname === '/profile') return 'My Profile';
    return 'Industrial Nexus';
  };

  const getHeaderSubtitle = () => {
    if (subtitle) return subtitle;
    if (pathname === '/dashboard') return 'Driver Operations Center';
    return '';
  };

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 text-white border-b-2 border-blue-500 z-50">
      <div className="h-full px-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{getHeaderTitle()}</h1>
          {getHeaderSubtitle() && (
            <p className="text-xs text-blue-100">{getHeaderSubtitle()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileDropdown(false);
              }}
              className="p-2 bg-white/20 dark:bg-blue-600 rounded-lg hover:bg-white/30 dark:hover:bg-blue-700 transition-colors relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <>
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  {unreadCount > 0 && (
                    <div className="px-4 py-1.5 border-b border-gray-100 dark:border-slate-700 flex justify-end">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Mark all read
                      </button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => !notification.isRead && markAsRead(notification.id)}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                          !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                        }`}
                      >
                        <p className="text-sm text-gray-900 dark:text-white font-medium">{notification.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{notification.message}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 font-mono">{formatTime(notification.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
                {/* Click outside to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
              </>
            )}
          </div>

          {showOnlineStatus && (
            <>
              {isOnline ? (
                <div className="flex items-center gap-1 bg-green-500/20 dark:bg-green-500/20 px-2 py-1 rounded-full">
                  <Wifi className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400">Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-red-500/20 dark:bg-red-500/20 px-2 py-1 rounded-full">
                  <WifiOff className="w-3 h-3 text-red-400" />
                  <span className="text-xs text-red-400">Offline</span>
                </div>
              )}
              {pendingCount > 0 && (
                <div className="bg-orange-500 px-3 py-1 rounded-full">
                  <span className="text-xs font-semibold">{pendingCount} Pending</span>
                </div>
              )}
            </>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/20 dark:bg-blue-600 rounded-lg hover:bg-white/30 dark:hover:bg-blue-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="p-2 bg-white/20 dark:bg-blue-600 rounded-lg hover:bg-white/30 dark:hover:bg-blue-700 transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                    <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      window.location.href = '/profile';
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <LogOutIcon className="w-4 h-4" />
                    Logout
                  </button>
                </div>
                {/* Click outside to close dropdown */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowProfileDropdown(false)}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
