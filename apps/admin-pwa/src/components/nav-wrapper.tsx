'use client';

import { MobileNav } from './mobile-nav';
import { TopNav } from './top-nav';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface NavWrapperProps {
  children: React.ReactNode;
}

export function NavWrapper({ children }: NavWrapperProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const hideNav = pathname === '/login' || pathname === '/';
  
  const role = (user?.role === 'CLIENT' ? 'client' : 'admin') as 'admin' | 'client';

  return (
    <>
      {!hideNav && <TopNav role={role} />}
      <div className={hideNav ? '' : 'pt-16'}>
        {children}
      </div>
      {!hideNav && <MobileNav role={role} />}
    </>
  );
}
