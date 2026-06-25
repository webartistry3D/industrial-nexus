'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Truck, Users, MapPin } from 'lucide-react';

interface MobileNavProps {
  role: 'admin' | 'client' | 'driver';
}

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: Truck, label: 'Trips', path: '/trips' },
  { icon: MapPin, label: 'Tracking', path: '/tracking' },
  { icon: Users, label: 'Drivers', path: '/drivers' },
];

const clientLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: Truck, label: 'Trips', path: '/trips' },
  { icon: MapPin, label: 'Tracking', path: '/tracking' },
];

export function MobileNav({ role }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();

  const links = role === 'admin' ? adminLinks : role === 'client' ? clientLinks : adminLinks;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-gray-200/80 dark:border-slate-700/80 px-2 pb-6 pt-2 z-50 transition-opacity duration-200 opacity-100">
      {/* Active Indicator Line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-slate-600 to-transparent" />
      
      <div className="flex items-end justify-around max-w-lg mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          
          return (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className="relative flex flex-col items-center justify-end min-w-[64px] h-14 group"
              aria-label={link.label}
            >
              {/* Active Indicator Dot */}
              <div 
                className={`absolute -top-1 w-1 h-1 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-blue-600 dark:bg-blue-400 scale-100 opacity-100' 
                    : 'scale-0 opacity-0'
                }`}
              />
              
              {/* Icon Container */}
              <div 
                className={`flex items-center justify-center w-12 h-8 rounded-2xl transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-800 dark:text-blue-400' 
                    : 'text-gray-400 dark:text-gray-500 group-active:text-gray-600 dark:group-active:text-gray-300'
                }`}
              >
                <Icon className={`w-6 h-6 transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              
              {/* Label */}
              <span 
                className={`text-[11px] font-medium mt-1 transition-all duration-200 ${
                  isActive 
                    ? 'text-blue-900 dark:text-blue-600 font-semibold' 
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {link.label}
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
