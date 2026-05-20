import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const DASHBOARD_BY_ROLE = {
  Client:       '/dashboard',
  Nutritionist: '/nutritionist/dashboard',
  Admin:        '/admin/dashboard',
};

const GuestRoute = ({ children }) => {
  const { user } = useAuth();

  if (user) return <Navigate to={DASHBOARD_BY_ROLE[user.role] ?? '/'} replace />;

  return children;
};

export default GuestRoute;
