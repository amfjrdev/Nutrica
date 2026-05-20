import Sidebar from '../components/Sidebar';
import NutritionistSidebar from '../components/NutritionistSidebar';
import AdminSidebar from '../components/AdminSidebar';

const SIDEBARS = {
  client:       Sidebar,
  nutritionist: NutritionistSidebar,
  admin:        AdminSidebar,
};

const AuthLayout = ({ children, role = 'client' }) => {
  const SidebarComponent = SIDEBARS[role] ?? Sidebar;
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <SidebarComponent />
      <main className="flex-1 md:ml-64 p-4 md:p-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
