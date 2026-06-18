'use client';

import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Sun, Moon, User, LogOut, LogOut as LogOutIcon, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';

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
  
  const isDark = document.documentElement.classList.contains('dark');
  
  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
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

  return (
    <header className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 text-white p-4 border-b-2 border-blue-500 dark:border-blue-500 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{getHeaderTitle()}</h1>
          {getHeaderSubtitle() && (
            <p className="text-xs text-blue-100 dark:text-gray-400">{getHeaderSubtitle()}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
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
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
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
