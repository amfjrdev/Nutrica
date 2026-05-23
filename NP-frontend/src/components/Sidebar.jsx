import { useEffect, useState } from 'react';
import { LayoutDashboard, Utensils, MessageSquare, Camera, BookOpen, User, LogOut, MessageCircle, CreditCard, Lock, CalendarDays, Library } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClientAccess } from '../services/api';
import logo from '../assets/Nutrica-logo.png';

// Which nav items each approved plan type unlocks (on top of the always-visible set)
const PLAN_UNLOCKS = {
  Predefined:    ['my-plan', 'ai-assistant', 'calorie-scan', 'articles'],
  AI:            ['ai-assistant', 'calorie-scan'],
  Personalized:  ['my-plan', 'ai-assistant', 'calorie-scan', 'articles', 'chat', 'appointments'],
};

// key = unique id used for unlock logic, path = route
const NAV_ITEMS = [
  { key: 'dashboard',       icon: LayoutDashboard, label: 'Dashboard',       path: '/dashboard',               alwaysVisible: true },
  { key: 'pricing',         icon: CreditCard,      label: 'Pricing',         path: '/client/pricing',          alwaysVisible: true },
  { key: 'ready-made-plans',icon: Library,         label: 'Ready-Made Plans',path: '/client/ready-made-plans', alwaysVisible: true },
  { key: 'profile',         icon: User,            label: 'Profile',         path: '/profile',                 alwaysVisible: true },
  { key: 'my-plan',      icon: Utensils,        label: 'My Plan',      path: '/my-plan',            alwaysVisible: false },
  { key: 'ai-assistant', icon: MessageSquare,   label: 'AI Assistant', path: '/ai-assistant',       alwaysVisible: false },
  { key: 'chat',         icon: MessageCircle,   label: 'Chat',         path: '/chat',               alwaysVisible: false },
  { key: 'appointments', icon: CalendarDays,    label: 'Appointments', path: '/appointments',       alwaysVisible: false },
  { key: 'calorie-scan', icon: Camera,          label: 'Calorie Scan', path: '/calorie-scan',       alwaysVisible: false },
  { key: 'articles',     icon: BookOpen,        label: 'Articles',     path: '/client/articles',    alwaysVisible: false },
];

const Sidebar = () => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [access, setAccess] = useState(null);

  useEffect(() => {
    getClientAccess().then(setAccess).catch(() => setAccess(null));
  }, []);

  const handleLogout = () => { clearAuth(); navigate('/'); };

  // Derive the set of unlocked keys
  const unlockedKeys = (() => {
    if (!access?.hasActiveSubscription) return new Set();
    return new Set(PLAN_UNLOCKS[access.subscriptionType] ?? []);
  })();

  const isUnlocked = (item) => item.alwaysVisible || unlockedKeys.has(item.key);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
      <Link to="/dashboard" className="p-6 flex items-center border-b border-slate-100">
        <img src={logo} alt="NutriCA" className="h-8 w-auto" />
      </Link>

      <div className="p-6 border-b border-slate-100">
        <p className="text-sm text-slate-500">Welcome back,</p>
        <p className="font-semibold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : '...'}</p>
        {access?.hasPendingSubscription && (
          <span className="mt-2 inline-block text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            Pending approval
          </span>
        )}
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map(({ key, icon: Icon, label, path }) => {
          const unlocked = isUnlocked({ key, alwaysVisible: NAV_ITEMS.find(i => i.key === key)?.alwaysVisible });
          const active   = pathname === path;

          if (!unlocked) {
            return (
              <div key={key}
                className="flex items-center px-4 py-3 mb-1 rounded-lg text-slate-300 cursor-not-allowed select-none">
                <Icon className="w-5 h-5 mr-3" />
                <span className="flex-1">{label}</span>
                <Lock className="w-3.5 h-3.5 opacity-50" />
              </div>
            );
          }

          return (
            <Link key={path} to={path}
              className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors duration-200 ${active ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
              <Icon className="w-5 h-5 mr-3" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button onClick={handleLogout}
          className="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
          <LogOut className="w-5 h-5 mr-3" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
