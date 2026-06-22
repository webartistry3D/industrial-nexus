'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Bell, Moon, Sun, LogOut, User, Truck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

export function TopNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setIsDarkMode(savedTheme === 'dark');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (pathname === '/login') return null;

  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(notifications.length / itemsPerPage);
  
  const paginatedNotifications = notifications.slice((page - 1) * itemsPerPage, page * itemsPerPage);

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
        {/* Left: Branding */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 focus:outline-none"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Truck className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-white text-sm leading-tight">Industrial</span>
              <span className="text-xs text-blue-100 dark:text-gray-400 font-medium leading-tight">Nexus</span>
            </div>
          </button>
          
          <span className="ml-2 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full font-medium">
            Driver
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfile(false);
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
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50 left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                  </div>
                  {unreadCount > 0 && (
                    <div className="px-4 py-1.5 border-b border-gray-100 dark:border-slate-700 flex justify-end">
                      <button
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                      >
                        Mark all read
                      </button>
                    </div>
                  )}
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">No notifications</div>
                  ) : (
                    <>
                      <div className="max-h-[180px] overflow-y-auto">
                        {paginatedNotifications.map((notification) => (
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
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <div className="px-4 py-2 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Previous
                          </button>
                          <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                            Page {page} of {totalPages}
                          </span>
                          <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 bg-white/20 dark:bg-blue-600 rounded-lg hover:bg-white/30 dark:hover:bg-blue-700 transition-colors"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
                setShowNotifications(false);
              }}
              className="p-2 bg-white/20 dark:bg-blue-600 rounded-lg hover:bg-white/30 dark:hover:bg-blue-700 transition-colors"
              aria-label="Profile"
            >
              <User className="w-5 h-5" />
            </button>

            {showProfile && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                  <p className="font-semibold text-gray-900 dark:text-white">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setShowProfile(false);
                    router.push('/profile');
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
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {(showNotifications || showProfile) && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfile(false);
          }}
        />
      )}
    </header>
  );
}
