import { Loader2 } from 'lucide-react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';

/**
 * Gate for every /admin/* route except the login page.
 *
 * While the stored token is being revalidated it renders a spinner rather
 * than redirecting — otherwise a refresh on an admin page would bounce the
 * user to login before the check completes.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAdminAuth();
  const location = useLocation();

  if (isRestoring) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink-950">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-violet-accent" />
          Checking your session…
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // `state.from` lets the login page send the user back where they meant to go.
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
