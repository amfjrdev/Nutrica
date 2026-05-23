import Sidebar from '../components/Sidebar';
import NutritionistSidebar from '../components/NutritionistSidebar';
import AdminSidebar from '../components/AdminSidebar';
import NotificationPanel from '../components/NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';

const SIDEBARS = {
  client:       Sidebar,
  nutritionist: NutritionistSidebar,
  admin:        AdminSidebar,
};

const AuthLayout = ({ children, role = 'client' }) => {
  const SidebarComponent = SIDEBARS[role] ?? Sidebar;
  const { notifications, loading, unreadCount, markRead, markAllRead } = useNotifications();
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <SidebarComponent />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        <div className="fixed top-6 right-6 z-40">
          <NotificationPanel
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
          />
        </div>
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
