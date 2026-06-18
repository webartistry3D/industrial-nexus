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
  const isLoginPage = pathname === '/login';
  
  const role = 'client' as 'admin' | 'client';

  return (
    <>
      <TopNav role={role} />
      <div className={isLoginPage ? '' : 'pt-16'}>
        {children}
      </div>
      {!isLoginPage && <MobileNav role={role} />}
    </>
  );
}
