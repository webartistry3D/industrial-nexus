'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { canAccessAdminFeatures } from '@/lib/role-access';

interface RoleGuardProps {
  children: React.ReactNode;
  userRole?: string;
}

export function RoleGuard({ children, userRole }: RoleGuardProps) {
  const router = useRouter();

  useEffect(() => {
    if (userRole && !canAccessAdminFeatures(userRole)) {
      // Redirect to dashboard if user doesn't have admin access
      router.push('/login');
    }
  }, [userRole, router]);

  // If user doesn't have admin access, don't render children
  if (userRole && !canAccessAdminFeatures(userRole)) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Usage Example for SUPER_ADMIN protected pages:
 * 
 * import { RoleGuard } from '@/components/role-guard';
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * export default function UsersPage() {
 *   const { user } = useAuth();
 *   
 *   return (
 *     <RoleGuard userRole={user?.role}>
 *       <div>
 *         <h1>User Management</h1>
 *         {/* SUPER_ADMIN only content *\/}
 *       </div>
 *     </RoleGuard>
 *   );
 * }
 */
