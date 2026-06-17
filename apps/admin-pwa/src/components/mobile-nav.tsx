'use client';

import { useRouter, usePathname } from 'next/navigation';
import { LayoutDashboard, Package, Truck, Users, MapPin } from 'lucide-react';

interface MobileNavProps {
  role: 'admin' | 'client' | 'driver';
}

const adminLinks = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Package, label: 'Orders', path: '/orders' },
  { icon: Truck, label: 'Trips', path: '/trips' },
  { icon: MapPin, label: 'Tracking', path: '/tracking' },
  { icon: Users, label: 'Drivers', path: '/drivers' },
];

export function MobileNav({ role }: MobileNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  const links = role === 'admin' ? adminLinks : [];

  return (
    <nav className={`fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 px-4 py-2 z-50 transition-opacity duration-200 ${isLoginPage ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex items-center justify-around">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.path;
          
          return (
            <button
              key={link.path}
              onClick={() => router.push(link.path)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg ${
                isActive ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
