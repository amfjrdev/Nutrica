import { useState, useEffect } from 'react';
import {
  Users, DollarSign, Activity, UserCheck,
  TrendingUp, TrendingDown, Loader2, CreditCard
} from 'lucide-react';
import {
  getAllUsers, getAllSubscriptions, getAllPayments,
  getPendingPlans, getPendingPosts,
} from '../../services/api';

// ─── helpers ──────────────────────────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const groupRevenueByMonth = (payments) => {
  const now    = new Date();
  const result = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    return { label: MONTHS[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), total: 0 };
  });
  payments
    .filter(p => p.status === 'Succeeded' || p.status === 'Paid')
    .forEach(p => {
      const d = new Date(p.createdAt || p.paidAt || Date.now());
      const slot = result.find(r => r.month === d.getMonth() && r.year === d.getFullYear());
      if (slot) slot.total += p.amount || 0;
    });
  return result;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, trend, trendValue, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-xl ${bgClass}`}>
        <Icon className={`w-6 h-6 ${colorClass}`} />
      </div>
      {trendValue !== null && (
        <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-red-500' : 'text-slate-400'}`}>
          {trend === 'up'   && <TrendingUp   className="w-4 h-4 mr-1" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 mr-1" />}
          {trendValue}
        </div>
      )}
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
  </div>
);

// ─── Revenue Line Chart ───────────────────────────────────────────────────────
const RevenueChart = ({ data }) => {
  const [tooltip, setTooltip] = useState(null);

  const W = 500, H = 200;
  const PAD = { top: 16, right: 16, bottom: 28, left: 48 };
  const cW  = W - PAD.left - PAD.right;
  const cH  = H - PAD.top  - PAD.bottom;

  const maxVal = Math.max(...data.map(d => d.total), 1);
  const toX    = (i) => PAD.left + (i / (data.length - 1)) * cW;
  const toY    = (v) => PAD.top  + cH - (v / maxVal) * cH;

  const pathD = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(d.total).toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${toX(data.length - 1).toFixed(1)} ${(PAD.top + cH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + cH).toFixed(1)} Z`;

  const yTicks = Array.from({ length: 5 }, (_, i) => Math.round((maxVal / 4) * i));

  const totalRevenue = data.reduce((s, d) => s + d.total, 0);
  const lastTwo      = data.slice(-2);
  const revTrend     = lastTwo.length === 2 && lastTwo[0].total > 0
    ? (((lastTwo[1].total - lastTwo[0].total) / lastTwo[0].total) * 100).toFixed(0)
    : null;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Revenue (Last 6 Months)</h3>
          <p className="text-sm text-slate-400 mt-0.5">Confirmed payments only</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-emerald-600">${totalRevenue.toLocaleString()}</p>
          {revTrend !== null && (
            <p className={`text-xs font-medium ${Number(revTrend) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {Number(revTrend) >= 0 ? '▲' : '▼'} {Math.abs(revTrend)}% vs last month
            </p>
          )}
        </div>
      </div>

      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" onMouseLeave={() => setTooltip(null)}>
          <defs>
            <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
            </linearGradient>
          </defs>

          {yTicks.map((v, i) => {
            const y = toY(v);
            return (
              <g key={i}>
                <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                  stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />
                <text x={PAD.left - 6} y={y + 4} fontSize="9" fill="#94a3b8" textAnchor="end">
                  ${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                </text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#revGrad)" />
          <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {data.map((d, i) => {
            const cx = toX(i), cy = toY(d.total);
            return (
              <g key={i}>
                <text x={cx} y={H - 4} fontSize="9" fill="#94a3b8" textAnchor="middle">{d.label}</text>
                <circle cx={cx} cy={cy} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
                <circle cx={cx} cy={cy} r="14" fill="transparent"
                  onMouseEnter={() => setTooltip({ x: cx, y: cy, label: d.label, total: d.total })} />
              </g>
            );
          })}

          {tooltip && (() => {
            const bx = Math.min(tooltip.x - 35, W - PAD.right - 80);
            const by = tooltip.y - 46;
            return (
              <g>
                <rect x={bx} y={by} width="80" height="36" rx="6" fill="#1e293b" opacity="0.92" />
                <text x={bx + 40} y={by + 14} fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                  ${tooltip.total.toLocaleString()}
                </text>
                <text x={bx + 40} y={by + 28} fontSize="9" fill="#94a3b8" textAnchor="middle">
                  {tooltip.label}
                </text>
              </g>
            );
          })()}
        </svg>
      </div>
    </div>
  );
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const polarToCartesian = (cx, cy, r, angleDeg) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const donutArc = (cx, cy, r, startAngle, endAngle) => {
  const s   = polarToCartesian(cx, cy, r, startAngle);
  const e   = polarToCartesian(cx, cy, r, endAngle);
  const big = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${big} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
};

const DonutChart = ({ segments, total }) => {
  const [hovered, setHovered] = useState(null);
  const cx = 80, cy = 80, R = 60, r = 36;

  let cursor = 0;
  const arcs = segments.map((seg, i) => {
    const angle = (seg.value / (total || 1)) * 360;
    const start = cursor;
    const end   = cursor + angle - 0.5;
    cursor += angle;
    return { ...seg, start, end, color: COLORS[i % COLORS.length] };
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="w-40 h-40 flex-shrink-0">
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={donutArc(cx, cy, R, arc.start, arc.end)}
            fill="none"
            stroke={arc.color}
            strokeWidth={hovered === i ? 26 : 22}
            strokeLinecap="butt"
            style={{ transition: 'stroke-width 0.2s' }}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className="cursor-pointer"
          />
        ))}
        {/* Inner circle */}
        <circle cx={cx} cy={cy} r={r} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="8" fill="#94a3b8">total</text>
      </svg>

      <div className="flex flex-col gap-2 flex-1">
        {arcs.map((arc, i) => (
          <div key={i}
            className={`flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-default ${hovered === i ? 'bg-slate-100' : 'bg-slate-50'}`}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: arc.color }} />
              <span className="text-xs font-medium text-slate-700">{arc.label}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-900">{arc.value}</span>
              <span className="text-xs text-slate-400 ml-1">({total ? Math.round((arc.value / total) * 100) : 0}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Payments Bar Chart ───────────────────────────────────────────────────────
const PaymentsBarChart = ({ data }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-slate-600 font-medium">{d.label}</span>
            <span className="font-bold text-slate-900">{d.value} <span className="text-slate-400 font-normal">({d.pct}%)</span></span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / max) * 100}%`, background: COLORS[i % COLORS.length] }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Admin Dashboard ──────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const [loading, setLoading]       = useState(true);
  const [stats, setStats]           = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [subSegments, setSubSegments] = useState([]);
  const [subTotal, setSubTotal]     = useState(0);
  const [paymentBars, setPaymentBars] = useState([]);
  useEffect(() => {
    Promise.all([
      getAllUsers(),
      getAllSubscriptions(),
      getAllPayments(),
      getPendingPlans(),
      getPendingPosts(),
    ]).then(([users, subs, payments, plans, posts]) => {

      // ── Revenue ──────────────────────────────────────────────────────────
      const revData = groupRevenueByMonth(payments);
      setRevenueData(revData);

      // ── Subscriptions donut ───────────────────────────────────────────────
      const subTypes = {};
      subs.forEach(s => { subTypes[s.type] = (subTypes[s.type] || 0) + 1; });
      const segments = Object.entries(subTypes).map(([label, value]) => ({ label, value }));
      setSubSegments(segments);
      setSubTotal(subs.length);

      // ── Payment status bars ───────────────────────────────────────────────
      const statusMap = {};
      payments.forEach(p => { statusMap[p.status] = (statusMap[p.status] || 0) + 1; });
      const total = payments.length || 1;
      const bars  = Object.entries(statusMap).map(([label, value]) => ({
        label, value, pct: Math.round((value / total) * 100),
      }));
      setPaymentBars(bars);

      // ── Stat cards ────────────────────────────────────────────────────────
      const activeSubs   = subs.filter(s => s.status === 'Active').length;
      const totalRevenue = payments
        .filter(p => p.status === 'Succeeded' || p.status === 'Paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const pendingCount = plans.length + posts.length;

      // Month-over-month user growth (rough: users created this month vs last)
      const now       = new Date();
      const thisMonth = users.filter(u => new Date(u.createdAt).getMonth() === now.getMonth()).length;
      const lastMonth = users.filter(u => new Date(u.createdAt).getMonth() === now.getMonth() - 1).length;
      const userTrend = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;

      setStats({
        users:    users.length,
        revenue:  `$${totalRevenue.toLocaleString()}`,
        subs:     activeSubs,
        pending:  pendingCount,
        userTrend,
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">System Overview</h1>
        <p className="text-slate-500 mt-2">Real-time platform metrics and analytics</p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users" value={stats.users}
          trend={stats.userTrend > 0 ? 'up' : stats.userTrend < 0 ? 'down' : null}
          trendValue={stats.userTrend !== null ? `${stats.userTrend > 0 ? '+' : ''}${stats.userTrend}% this month` : 'No data yet'}
          icon={Users} colorClass="text-blue-600" bgClass="bg-blue-100"
        />
        <StatCard
          title="Total Revenue" value={stats.revenue}
          trend="up" trendValue="Confirmed payments"
          icon={DollarSign} colorClass="text-emerald-600" bgClass="bg-emerald-100"
        />
        <StatCard
          title="Active Subscriptions" value={stats.subs}
          trend={stats.subs > 0 ? 'up' : null} trendValue={`of ${subTotal} total`}
          icon={Activity} colorClass="text-purple-600" bgClass="bg-purple-100"
        />
        <StatCard
          title="Pending Approvals" value={stats.pending}
          trend={stats.pending > 0 ? 'down' : null} trendValue={stats.pending > 0 ? 'Needs attention' : 'All clear ✓'}
          icon={UserCheck} colorClass="text-orange-600" bgClass="bg-orange-100"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <RevenueChart data={revenueData} />
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Subscription Types</h3>
          {subSegments.length > 0
            ? <DonutChart segments={subSegments} total={subTotal} />
            : <p className="text-sm text-slate-400 text-center py-8">No subscriptions yet</p>
          }
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Payment status breakdown */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <CreditCard className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Payment Status</h3>
              <p className="text-xs text-slate-400">All payment records</p>
            </div>
          </div>
          {paymentBars.length > 0
            ? <PaymentsBarChart data={paymentBars} />
            : <p className="text-sm text-slate-400 text-center py-8">No payments yet</p>
          }
        </div>

        {/* User roles donut */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Users by Role</h3>
              <p className="text-xs text-slate-400">Platform user distribution</p>
            </div>
          </div>
          {stats.users > 0
            ? <_UserRolesChart />
            : <p className="text-sm text-slate-400 text-center py-8">No users yet</p>
          }
        </div>
      </div>

    </div>
  );
};

// Lazy user-roles chart — fetches users internally to avoid prop drilling
const _UserRolesChart = () => {
  const [segments, setSegments] = useState([]);
  const [total, setTotal]       = useState(0);

  useEffect(() => {
    getAllUsers().then(users => {
      const roles = {};
      users.forEach(u => { roles[u.role] = (roles[u.role] || 0) + 1; });
      setSegments(Object.entries(roles).map(([label, value]) => ({ label, value })));
      setTotal(users.length);
    }).catch(console.error);
  }, []);

  if (segments.length === 0) return <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>;
  return <DonutChart segments={segments} total={total} />;
};

export default AdminDashboard;
