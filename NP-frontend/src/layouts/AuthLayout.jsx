import { useState } from 'react';
import { Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">

      {/* Desktop sidebar */}
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 z-10">
        <SidebarComponent />
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="relative h-full">
          <SidebarComponent />
          <button
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center z-10"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 md:ml-64 min-w-0">

        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <NotificationPanel
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
          />
        </div>

        {/* Desktop notification bell */}
        <div className="hidden md:block fixed top-6 right-6 z-40">
          <NotificationPanel
            notifications={notifications}
            loading={loading}
            unreadCount={unreadCount}
            markRead={markRead}
            markAllRead={markAllRead}
          />
        </div>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AuthLayout;
