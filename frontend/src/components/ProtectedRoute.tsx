import { Navigate, Outlet } from 'react-router-dom';
import { dashboardPathForRole } from '../lib/navigation';
import { useSessionStore } from '../store/session';

export function ProtectedRoute({ allowedRoles }: { allowedRoles: string[] }) {
  const user = useSessionStore((state) => state.user);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // If they have the wrong role, redirect to their role-specific dashboard path
    return <Navigate to={dashboardPathForRole(user.role)} replace />;
  }

  return <Outlet />;
}

