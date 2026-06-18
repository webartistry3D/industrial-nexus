'use client';

import BottomNavigation from './BottomNavigation';
import { usePathname } from 'next/navigation';

export function DriverNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      <div className={isLoginPage ? '' : 'pb-24'}>
        {children}
      </div>
      <BottomNavigation />
    </>
  );
}
