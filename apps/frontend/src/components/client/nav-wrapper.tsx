'use client';

import { MobileNav } from './mobile-nav';
import { TopNav } from './top-nav';
import { usePathname } from 'next/navigation';

interface NavWrapperProps {
  children: React.ReactNode;
}

export function NavWrapper({ children }: NavWrapperProps) {
  const pathname = usePathname();
  const hideNav = pathname === '/login' || pathname === '/';

  return (
    <>
      {!hideNav && <TopNav role="client" />}
      <div className={hideNav ? '' : 'pt-16'}>
        {children}
      </div>
      {!hideNav && <MobileNav role="client" />}
    </>
  );
}
