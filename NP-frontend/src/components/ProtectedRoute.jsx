import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DASHBOARD_BY_ROLE = {
  Client:       '/dashboard',
  Nutritionist: '/nutritionist/dashboard',
  Admin:        '/admin/dashboard',
};

// Routes that should send unauthenticated users to /register instead of /login
const REGISTER_REDIRECT_PATHS = ['/payment'];

const ProtectedRoute = ({ children, role }) => {
  const { user } = useAuth();
  const { pathname, search } = useLocation();

  if (!user) {
    const shouldRegister = REGISTER_REDIRECT_PATHS.some(p => pathname.startsWith(p));
    return <Navigate to={shouldRegister ? '/register' : '/login'} replace />;
  }

  if (role && user.role !== role) return <Navigate to={DASHBOARD_BY_ROLE[user.role] ?? '/'} replace />;

  return children;
};

export default ProtectedRoute;
