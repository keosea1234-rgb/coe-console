import type { SessionUser, UserRole } from './session';

export type Permission =
  | 'request:create'
  | 'request:view_own'
  | 'request:view_all'
  | 'event:view'
  | 'event:update_status'
  | 'event:admin'
  | 'analytics:view'
  | 'feedback:request'
  | 'admin:audit'
  | 'admin:users';

// Bridge model for Sprint 8: permissions are derived from profiles.role until
// org_memberships and richer org-scoped assignments become the source of truth.
// This is frontend ergonomics only; Supabase RLS remains authoritative for data
// access and mutation enforcement.
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  user: ['request:create', 'request:view_own', 'event:view', 'analytics:view'],
  admin: [
    'request:view_all',
    'event:view',
    'event:update_status',
    'event:admin',
    'analytics:view',
    'feedback:request',
    'admin:audit',
    'admin:users',
  ],
};

export function permissionsForRole(role: UserRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(user: Pick<SessionUser, 'role'> | null | undefined, permission: Permission) {
  if (!user) return false;
  return permissionsForRole(user.role).includes(permission);
}

export function hasAnyPermission(
  user: Pick<SessionUser, 'role'> | null | undefined,
  permissions: readonly Permission[],
) {
  return permissions.some((permission) => hasPermission(user, permission));
}
