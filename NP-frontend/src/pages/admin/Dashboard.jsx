import { useState, useEffect } from 'react';
import { Users, DollarSign, Activity, UserCheck, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { getAllUsers, getAllSubscriptions, getAllPayments, getPendingPlans, getPendingPosts } from '../../services/api';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from '../../components/NotificationPanel';

const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
        {trend === 'up' ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
        {trendValue}
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
  </div>
);

const RevenueChart = () => {
  const points = [
    { x: 0, y: 140 }, { x: 100, y: 100 }, { x: 200, y: 80 },
    { x: 300, y: 65 }, { x: 400, y: 90 }, { x: 500, y: 60 },
  ];
  const pathD = `M ${points[0].x} ${points[0].y} C ${points[0].x+50} ${points[0].y}, ${points[1].x-50} ${points[1].y}, ${points[1].x} ${points[1].y} S ${points[2].x-50} ${points[2].y}, ${points[2].x} ${points[2].y} S ${points[3].x-50} ${points[3].y}, ${points[3].x} ${points[3].y} S ${points[4].x-50} ${points[4].y}, ${points[4].x} ${points[4].y} S ${points[5].x-50} ${points[5].y}, ${points[5].x} ${points[5].y}`;
  const areaPathD = `${pathD} L 500 200 L 0 200 Z`;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Revenue Trend</h3>
      <div className="relative h-64 w-full">
        <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="revenueGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0, 50, 100, 150, 200].map((y) => (
            <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray={y === 0 || y === 200 ? '0' : '4 4'} />
          ))}
          {[['60k', 5], ['45k', 55], ['30k', 105], ['15k', 155], ['0', 205]].map(([label, y]) => (
            <text key={label} x="-10" y={y} className="text-[10px] fill-slate-400" textAnchor="end">{label}</text>
          ))}
          <path d={areaPathD} fill="url(#revenueGradient)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <div className="flex justify-between mt-2 px-1 text-xs text-slate-400 font-medium">
          {['Jan','Feb','Mar','Apr','May','Jun'].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  );
};

const SubscriptionPieChart = ({ predefined, withNutritionist }) => {
  const total = predefined + withNutritionist || 1;
  const pct   = Math.round((predefined / total) * 100);
  const nPct  = 100 - pct;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-8">Subscription Distribution</h3>
      <div className="flex flex-col items-center">
        <div className="relative w-48 h-48 mb-8">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50,50 L50,0 A50,50 0 1,1 13.8,86.6 Z" fill="#3b82f6" />
            <path d="M50,50 L13.8,86.6 A50,50 0 1,1 50,0 Z" fill="#10b981" />
          </svg>
        </div>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
            <span className="text-sm font-medium text-blue-900">Predefined Plans</span>
            <span className="text-sm font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg">
            <span className="text-sm font-medium text-emerald-900">With Nutritionist</span>
            <span className="text-sm font-bold text-emerald-600">{nPct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [stats, setStats]   = useState({ users: '—', subs: '—', payments: '—', pending: '—' });
  const [subDist, setSubDist] = useState({ predefined: 0, withNutritionist: 0 });
  const [loading, setLoading] = useState(true);
  const { notifications, loading: nLoading, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getAllSubscriptions(),
      getAllPayments(),
      getPendingPlans(),
      getPendingPosts(),
    ]).then(([users, subs, payments, plans, posts]) => {
      const activeSubs = subs.filter((s) => s.status === 'Active');
      const predefined = subs.filter((s) => s.type === 'Predefined').length;
      const withNutri  = subs.filter((s) => s.type === 'Personalized').length;
      const totalRevenue = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
      const pendingCount = plans.length + posts.length;

      setStats({
        users:    users.length,
        subs:     activeSubs.length,
        payments: `$${totalRevenue.toLocaleString()}`,
        pending:  pendingCount,
      });
      setSubDist({ predefined, withNutritionist: withNutri });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
            <p className="text-slate-500 mt-2">Monitor platform performance and metrics</p>
          </header>

          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Users"          value={stats.users}    trend="up"   trendValue="+12%" icon={Users}      colorClass="text-blue-600"   bgClass="bg-blue-100" />
                <StatCard title="Total Revenue"        value={stats.payments} trend="up"   trendValue="+8%"  icon={DollarSign} colorClass="text-emerald-600" bgClass="bg-emerald-100" />
                <StatCard title="Active Subscriptions" value={stats.subs}     trend="up"   trendValue="+15%" icon={Activity}   colorClass="text-purple-600" bgClass="bg-purple-100" />
                <StatCard title="Pending Approvals"    value={stats.pending}  trend="down" trendValue="-5%"  icon={UserCheck}  colorClass="text-orange-600" bgClass="bg-orange-100" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <RevenueChart />
                <SubscriptionPieChart predefined={subDist.predefined} withNutritionist={subDist.withNutritionist} />
              </div>
              <div className="mt-8">
                <NotificationPanel
                  notifications={notifications}
                  loading={nLoading}
                  unreadCount={unreadCount}
                  markRead={markRead}
                  markAllRead={markAllRead}
                />
              </div>
            </>
          )}
    </div>
  );
};

export default AdminDashboard;
