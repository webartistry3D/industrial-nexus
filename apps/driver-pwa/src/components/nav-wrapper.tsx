'use client';

import { MobileNav } from './mobile-nav';
import { TopNav } from './top-nav';
import { usePathname } from 'next/navigation';

export function NavWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      <TopNav />
      <div className={isLoginPage ? '' : 'pt-16'}>
        {children}
      </div>
      <MobileNav />
    </>
  );
}
