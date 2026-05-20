import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, UserPlus, CreditCard, ArrowUpRight, Loader2 } from 'lucide-react';
import { getAllSubscriptions, getAllPayments } from '../../services/api';

const StatCard = ({ title, value, trendValue, icon: Icon }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-emerald-100 rounded-lg">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      <div className="flex items-center text-emerald-500 text-sm font-medium">
        {trendValue}<ArrowUpRight className="w-3 h-3 ml-1" />
      </div>
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
  </div>
);

const STATUS_COLORS = {
  Active:    'bg-emerald-500 text-white',
  Cancelled: 'bg-red-100 text-red-600',
  Expired:   'bg-slate-100 text-slate-500',
};

const PRICE_MAP = { Predefined: '$29/month', WithNutritionist: '$99/month' };

const SubscriptionRow = ({ sub }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
    <div className="flex flex-col mb-4 sm:mb-0">
      <h4 className="font-semibold text-slate-900">{sub.type}</h4>
      <p className="text-sm text-slate-500">
        Expires {new Date(sub.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
    <div className="flex items-center justify-between sm:justify-end gap-8 w-full sm:w-auto">
      <div className="text-right">
        <p className="font-bold text-slate-900">{PRICE_MAP[sub.type] || '—'}</p>
        <p className="text-xs text-slate-500">
          {new Date(sub.startsAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>
      <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wide ${STATUS_COLORS[sub.status] || 'bg-slate-100 text-slate-600'}`}>
        {sub.status}
      </span>
    </div>
  </div>
);

const AdminSubscriptions = () => {
  const [subs, setSubs]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllSubscriptions(), getAllPayments()])
      .then(([s, p]) => { setSubs(s); setPayments(p); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const activeSubs   = subs.filter((s) => s.status === 'Active');
  const totalRevenue = payments.filter((p) => p.status === 'Paid').reduce((sum, p) => sum + p.amount, 0);
  const avgValue     = activeSubs.length
    ? Math.round(activeSubs.reduce((sum, s) => sum + (PRICE_MAP[s.type] === '$99/month' ? 99 : 29), 0) / activeSubs.length)
    : 0;
  const convRate     = subs.length ? Math.round((activeSubs.length / subs.length) * 100) : 0;

  return (
    <div className="max-w-7xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Subscription Management</h1>
            <p className="text-slate-500 mt-2">Monitor subscriptions and revenue</p>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Revenue"        value={loading ? '—' : `$${totalRevenue.toLocaleString()}`} trendValue="+8%"  icon={DollarSign} />
            <StatCard title="Active Subscriptions" value={loading ? '—' : activeSubs.length}                  trendValue="+15%" icon={UserPlus} />
            <StatCard title="Conversion Rate"      value={loading ? '—' : `${convRate}%`}                     trendValue="+5%"  icon={TrendingUp} />
            <StatCard title="Avg. Plan Value"      value={loading ? '—' : `$${avgValue}`}                     trendValue="+3%"  icon={CreditCard} />
          </div>

          {/* Recent Subscriptions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Subscriptions</h3>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : subs.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No subscriptions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subs.slice().sort((a, b) => new Date(b.startsAt) - new Date(a.startsAt)).map((sub) => (
                  <SubscriptionRow key={sub.id} sub={sub} />
                ))}
              </div>
            )}
          </div>
    </div>
  );
};

export default AdminSubscriptions;
