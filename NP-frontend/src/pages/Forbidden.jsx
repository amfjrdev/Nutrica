import { useNavigate } from 'react-router-dom';
import { ShieldOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const DASHBOARD_BY_ROLE = {
  Client:       '/dashboard',
  Nutritionist: '/nutritionist/dashboard',
  Admin:        '/admin/dashboard',
};

const Forbidden = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const dashboardPath = user ? (DASHBOARD_BY_ROLE[user.role] ?? '/') : '/';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-5 rounded-full">
            <ShieldOff className="w-12 h-12 text-red-500" />
          </div>
        </div>

        <h1 className="text-6xl font-extrabold text-slate-900 mb-2">403</h1>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Access Denied</h2>
        <p className="text-slate-500 text-base mb-8">
          You don't have permission to access this page.
        </p>

        <button
          onClick={() => navigate(dashboardPath)}
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors shadow-md"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Forbidden;
