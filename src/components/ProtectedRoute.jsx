import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/authState';
export default function ProtectedRoute({ roles }) {
  const { user, loading, error, retrySession } = useAuth();
  if (loading) return <div className="container section-block" role="status">Restoring session…</div>;
  if (!user && error && localStorage.getItem('authToken')) return <div className="container section-block" role="alert"><p>{error}</p><button onClick={retrySession}>Retry session</button></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={'/' + user.role} replace />;
  return <Outlet />;
}
