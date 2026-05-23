import { LayoutDashboard, Users, CreditCard, CheckSquare, BookOpen, LogOut } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/Nutrica-logo.png';

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview',      path: '/admin/dashboard' },
  { icon: Users,           label: 'Users',         path: '/admin/users' },
  { icon: CreditCard,      label: 'Subscriptions', path: '/admin/subscriptions' },
  { icon: CheckSquare,     label: 'Approvals',     path: '/admin/approvals' },
  { icon: BookOpen,        label: 'Articles',      path: '/admin/articles' },
];

const AdminSidebar = () => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <Link to="/admin/dashboard" className="p-6 flex items-center border-b border-slate-100">
        <img src={logo} alt="NutriCA" className="h-8 w-auto" />
      </Link>

      <div className="p-6 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Administrator</p>
        <p className="font-semibold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : 'Admin'}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path}
            className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors duration-200 ${pathname === path ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon className="w-5 h-5 mr-3" /><span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button onClick={() => { clearAuth(); navigate('/'); }}
          className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut className="w-5 h-5 mr-3" /><span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
