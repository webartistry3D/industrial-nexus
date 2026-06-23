'use client';

import { MobileNav } from './mobile-nav';
import { TopNav } from './top-nav';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEffect } from 'react';

interface NavWrapperProps {
  children: React.ReactNode;
}

export function NavWrapper({ children }: NavWrapperProps) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/';

  useEffect(() => {
    if (!isLoading && !user && !isLoginPage && !isLandingPage) {
      window.location.href = '/login';
    }
  }, [user, isLoading, isLoginPage, isLandingPage]);

  if (isLoading) {
    return null;
  }

  if (!user && !isLoginPage && !isLandingPage) {
    return null;
  }

  const role = 'client' as 'admin' | 'client';

  return (
    <>
      {!isLandingPage && <TopNav role={role} />}
      <div className={isLoginPage || isLandingPage ? '' : 'pt-16'}>
        {children}
      </div>
      {!isLoginPage && !isLandingPage && <MobileNav role={role} />}
    </>
  );
}
