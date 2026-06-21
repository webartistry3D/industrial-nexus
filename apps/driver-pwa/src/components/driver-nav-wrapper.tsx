'use client';

import BottomNavigation from './BottomNavigation';
import { usePathname } from 'next/navigation';

export function DriverNavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === '/login' || pathname === '/';

  return (
    <>
      <div className={hideNav ? '' : 'pb-24'}>
        {children}
      </div>
      {!hideNav && <BottomNavigation />}
    </>
  );
}
