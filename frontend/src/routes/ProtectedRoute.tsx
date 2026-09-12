import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageState } from '../components/PageState';
import { useCurrentUser } from '../features/auth/use-auth';

export function ProtectedRoute() {
  const location = useLocation();
  const { data, isPending } = useCurrentUser();

  if (isPending) return <main className="centered-page"><PageState title="Cargando tu espacio clínico…" /></main>;
  if (!data?.user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}
