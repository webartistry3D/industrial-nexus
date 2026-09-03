/**
 * Role-based access control utilities for the admin PWA
 */

export enum AdminRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OPERATIONS = 'OPERATIONS',
}

export interface RoleConfig {
  canManageUsers: boolean;
  canAccessSystemConfig: boolean;
  canAccessAllFeatures: boolean;
}

const rolePermissions: Record<AdminRole, RoleConfig> = {
  [AdminRole.SUPER_ADMIN]: {
    canManageUsers: true,
    canAccessSystemConfig: true,
    canAccessAllFeatures: true,
  },
  [AdminRole.OPERATIONS]: {
    canManageUsers: false,
    canAccessSystemConfig: false,
    canAccessAllFeatures: false,
  },
};

/**
 * Check if user has specific permission
 */
export function hasPermission(role: string, permission: keyof RoleConfig): boolean {
  const upperRole = role.toUpperCase() as AdminRole;
  const config = rolePermissions[upperRole];
  return config ? config[permission] : false;
}

/**
 * Check if user can access admin-only features
 */
export function canAccessAdminFeatures(role: string): boolean {
  return hasPermission(role, 'canAccessAllFeatures');
}

/**
 * Check if user can manage users
 */
export function canManageUsers(role: string): boolean {
  return hasPermission(role, 'canManageUsers');
}

/**
 * Check if user can access system configuration
 */
export function canAccessSystemConfig(role: string): boolean {
  return hasPermission(role, 'canAccessSystemConfig');
}

/**
 * Get navigation items based on user role
 */
export interface NavItem {
  icon: any;
  label: string;
  path: string;
  requiresAdmin?: boolean;
}

export function filterNavItemsByRole(items: NavItem[], role: string): NavItem[] {
  return items.filter(item => {
    if (item.requiresAdmin && !canAccessAdminFeatures(role)) {
      return false;
    }
    return true;
  });
}
