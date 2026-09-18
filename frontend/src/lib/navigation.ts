import type { UserRole } from './types';

export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case 'driver':
      return '/dashboard/driver';
    case 'admin':
      return '/dashboard/admin';
    case 'recycler':
      return '/dashboard/recycler';
    default:
      return '/dashboard/user';
  }
}
