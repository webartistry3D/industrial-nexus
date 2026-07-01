'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Truck, MapPin, User, History } from 'lucide-react';

export default function BottomNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/trips', icon: Truck, label: 'Trips' },
    { path: '/tracking', icon: MapPin, label: 'Tracking' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 px-2 pb-6 pt-2 z-50 will-change-transform transition-opacity duration-200 ${isLoginPage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      {/* Active Indicator Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent" />
      
      <div className="flex items-end justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="relative flex flex-col items-center justify-end min-w-[64px] h-14 group"
              aria-label={item.label}
            >
              {/* Active Indicator Dot */}
              <div 
                className={`absolute -top-1 w-1 h-1 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-900 dark:bg-lime-500 scale-100 opacity-100' 
                    : 'scale-0 opacity-0'
                }`}
              />
              
              {/* Icon Container */}
              <div 
                className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-900 dark:text-lime-500' 
                    : 'text-gray-400 dark:text-gray-500 group-active:text-gray-600 dark:group-active:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Label */}
              <span 
                className={`text-[11px] font-medium mt-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-900 dark:text-lime-500 font-semibold' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Home Indicator Safe Area */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
    </nav>
  );
}
