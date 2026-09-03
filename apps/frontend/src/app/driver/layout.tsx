'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { DriverNavWrapper } from '@/components/driver/driver-nav-wrapper';

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }
    if (!isLoading && user && user.role !== 'DRIVER') {
      if (user.role === 'SUPER_ADMIN' || user.role === 'OPERATIONS') router.push('/admin/dashboard');
      else if (user.role === 'CLIENT') router.push('/client/dashboard');
      else router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!user || user.role !== 'DRIVER') {
    return null;
  }

  return <DriverNavWrapper>{children}</DriverNavWrapper>;
}
