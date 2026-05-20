import { Users, Calendar, MessageCircle, PlusCircle, BookOpen, User, LogOut, ClipboardList, LayoutList } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationBell } from './NotificationPanel';
import NotificationPanel from './NotificationPanel';
import logo from '../assets/Nutrica-logo.png';

const NAV_ITEMS = [
  { icon: Users,         label: 'Clients',        path: '/nutritionist/dashboard' },
  { icon: Calendar,      label: 'Appointments',   path: '/nutritionist/appointments' },
  { icon: MessageCircle, label: 'Messages',       path: '/nutritionist/chat' },
  { icon: PlusCircle,    label: 'Create Plan',    path: '/nutritionist/create-plan' },
  { icon: LayoutList,    label: 'Manage Plans',   path: '/nutritionist/manage-plans' },
  { icon: ClipboardList, label: 'Client Answers', path: '/nutritionist/client-answers' },
  { icon: BookOpen,      label: 'Write Article',  path: '/nutritionist/write-article' },
  { icon: User,          label: 'Profile',        path: '/nutritionist/profile' },
];

const NutritionistSidebar = () => {
  const { user, clearAuth } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();
  const [showPanel, setShowPanel] = useState(false);

  const handleLogout = () => { clearAuth(); navigate('/'); };

  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
      <Link to="/" className="p-6 flex items-center border-b border-slate-100">
        <img src={logo} alt="NutriCA" className="h-8 w-auto" />
      </Link>

      <div className="p-6 border-b border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Nutritionist</p>
        <p className="font-semibold text-slate-900">{user ? `${user.firstName} ${user.lastName}` : '...'}</p>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, path }) => (
          <Link key={path} to={path}
            className={`flex items-center px-4 py-3 mb-1 rounded-lg transition-colors duration-200 ${pathname === path ? 'bg-emerald-50 text-emerald-600 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon className="w-5 h-5 mr-3" />
            <span>{label}</span>
          </Link>
        ))}
        <NotificationBell unreadCount={unreadCount} onClick={() => setShowPanel((v) => !v)} />
        {showPanel && (
          <div className="mt-2">
            <NotificationPanel
              notifications={notifications}
              loading={loading}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              onClose={() => setShowPanel(false)}
            />
          </div>
        )}
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

export default NutritionistSidebar;
