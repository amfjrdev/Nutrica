import { useEffect, useState } from 'react';
import { Target, Flame, Droplet, Trophy, TrendingUp, Calendar, CheckCircle2, Circle, Clock, FlaskConical, User, Plus, Minus } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClientProfile, getMyPlansAsClient, getMyPayments } from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import NotificationPanel from '../components/NotificationPanel';

// ── localStorage helpers ──────────────────────────────────────────────────────
const todayKey = () => `water_${new Date().toISOString().slice(0, 10)}`;

const getTodayWater = () => {
  try { return parseInt(localStorage.getItem(todayKey()) || '0', 10); }
  catch { return 0; }
};

const setTodayWater = (v) => localStorage.setItem(todayKey(), v);

const getTodayCalories = () => {
  try {
    const history = JSON.parse(localStorage.getItem('calorie_history') || '[]');
    const today   = new Date().toLocaleDateString();
    return history
      .filter((s) => s.date === today)
      .reduce((sum, s) => sum + (s.estimatedCalories || 0), 0);
  } catch { return 0; }
};

// ── Weight chart ──────────────────────────────────────────────────────────────
const WeightChart = ({ currentWeight, goal }) => {
  const weeks  = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'];
  const isLoss = goal?.toLowerCase().includes('loss') || goal?.toLowerCase().includes('lose');
  const isMass = goal?.toLowerCase().includes('mass') || goal?.toLowerCase().includes('gain') || goal?.toLowerCase().includes('muscle');

  // Simulate a realistic 6-week trend toward goal from current weight
  const delta  = isLoss ? -0.6 : isMass ? 0.5 : 0;
  const points = weeks.map((_, i) => {
    const w = currentWeight ? parseFloat(currentWeight) + delta * i : 70 + i * delta;
    return w;
  });

  const min    = Math.min(...points) - 1;
  const max    = Math.max(...points) + 1;
  const range  = max - min || 1;
  const toY    = (w) => 130 - ((w - min) / range) * 110;
  const toX    = (i) => (i / (weeks.length - 1)) * 380 + 10;

  const pathD  = points.map((w, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(w)}`).join(' ');
  const areaD  = pathD + ` L ${toX(weeks.length - 1)} 150 L ${toX(0)} 150 Z`;

  return (
    <div className="w-full h-48 relative mt-4">
      <svg viewBox="0 0 400 150" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[30, 75, 120].map((y) => (
          <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
        ))}
        {points.map((w, i) => (
          <text key={i} x="-8" y={toY(w) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">
            {w.toFixed(1)}
          </text>
        ))}
        <path d={areaD} fill="url(#chartGradient)" />
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((w, i) => (
          <circle key={i} cx={toX(i)} cy={toY(w)} r="4" fill="#10b981" stroke="white" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-2 px-1 text-xs text-slate-400">
        {weeks.map((w) => <span key={w}>{w}</span>)}
      </div>
    </div>
  );
};

// ── Water tracker ─────────────────────────────────────────────────────────────
const WaterTracker = ({ glasses, onAdd, onRemove }) => (
  <div className="flex items-center gap-2">
    <button onClick={onRemove} disabled={glasses === 0}
      className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 disabled:opacity-40 flex items-center justify-center transition-colors">
      <Minus className="w-3 h-3 text-slate-600" />
    </button>
    <div className="flex gap-1">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={`w-4 h-6 rounded-sm transition-colors ${i < glasses ? 'bg-blue-400' : 'bg-slate-100'}`} />
      ))}
    </div>
    <button onClick={onAdd} disabled={glasses === 8}
      className="w-7 h-7 rounded-full bg-blue-100 hover:bg-blue-200 disabled:opacity-40 flex items-center justify-center transition-colors">
      <Plus className="w-3 h-3 text-blue-600" />
    </button>
  </div>
);

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subValue, accent = 'emerald', children }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 bg-${accent}-50 rounded-lg`}><Icon className={`w-5 h-5 text-${accent}-600`} /></div>
      <TrendingUp className="w-4 h-4 text-emerald-500" />
    </div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    {subValue && <p className={`text-sm mt-1 font-medium text-${accent}-500`}>{subValue}</p>}
    {children}
  </div>
);

// ── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [client, setClient]     = useState(null);
  const [plans, setPlans]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [glasses, setGlasses]   = useState(getTodayWater);
  const [todayCal, setTodayCal] = useState(getTodayCalories);
  const [searchParams, setSearchParams] = useSearchParams();

  const showPendingBanner = searchParams.get('payment') === 'pending';
  const isTestMode        = searchParams.get('mode') === 'test';
  const { notifications, loading: nLoading, unreadCount, markRead, markAllRead } = useNotifications();

  useEffect(() => {
    getClientProfile().then(setClient).catch(console.error);
    getMyPlansAsClient().then(setPlans).catch(console.error);
    getMyPayments().then(setPayments).catch(console.error);
  }, []);

  // Refresh today's calories whenever the page gains focus (user may have just scanned)
  useEffect(() => {
    const refresh = () => setTodayCal(getTodayCalories());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const addGlass = () => {
    const next = Math.min(glasses + 1, 8);
    setGlasses(next);
    setTodayWater(next);
  };

  const removeGlass = () => {
    const next = Math.max(glasses - 1, 0);
    setGlasses(next);
    setTodayWater(next);
  };

  const dismissBanner = () => {
    searchParams.delete('payment');
    searchParams.delete('mode');
    setSearchParams(searchParams);
  };

  const hasApprovedPayment = payments.some((p) => p.status === 'Succeeded');

  // Daily calorie target based on questionnaire data (simple Harris-Benedict estimate)
  const calorieTarget = (() => {
    if (!client?.weight || !client?.height || !client?.age || !client?.gender) return 2000;
    const bmr = client.gender === 'Male'
      ? 88.36 + 13.4 * parseFloat(client.weight) + 4.8 * parseFloat(client.height) - 5.7 * client.age
      : 447.6 + 9.2  * parseFloat(client.weight) + 3.1 * parseFloat(client.height) - 4.3 * client.age;
    const activityMultiplier = {
      'Sedentary': 1.2, 'Lightly Active': 1.375,
      'Moderately Active': 1.55, 'Very Active': 1.725,
    }[client.activityLevel] ?? 1.375;
    return Math.round(bmr * activityMultiplier);
  })();

  const caloriesRemaining = Math.max(calorieTarget - todayCal, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-slate-500 mt-1">Here's your health overview for today</p>
      </header>

      {showPendingBanner && (
        <div className={`mb-8 rounded-xl p-4 flex items-start justify-between gap-4 border ${
          isTestMode ? 'bg-violet-50 border-violet-200' : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-start gap-3">
            {isTestMode
              ? <FlaskConical className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
              : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
            <div>
              <p className={`font-semibold text-sm ${isTestMode ? 'text-violet-800' : 'text-amber-800'}`}>
                {isTestMode ? 'Payment received (TEST MODE). Awaiting admin approval.' : 'Payment successful. Awaiting admin approval.'}
              </p>
              <p className={`text-sm mt-0.5 ${isTestMode ? 'text-violet-700' : 'text-amber-700'}`}>
                Your subscription is <span className="font-bold">Pending</span>. Premium features unlock after admin approval.
              </p>
            </div>
          </div>
          <button onClick={dismissBanner} className={`text-lg font-bold flex-shrink-0 ${isTestMode ? 'text-violet-400 hover:text-violet-600' : 'text-amber-400 hover:text-amber-600'}`}>&times;</button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Target}
          label="Current Weight"
          value={client?.weight ? `${client.weight} kg` : '—'}
          subValue={client?.goal || 'Complete questionnaire'}
        />
        <StatCard
          icon={Flame}
          label="Today's Calories"
          accent="orange"
          value={todayCal > 0 ? todayCal.toLocaleString() : '0'}
          subValue={todayCal > 0 ? `${caloriesRemaining.toLocaleString()} remaining of ${calorieTarget.toLocaleString()}` : 'Scan a meal to track'}
        />
        <StatCard icon={Droplet} label="Water Intake" accent="blue" value={`${glasses} / 8`} subValue="glasses today">
          <div className="mt-3">
            <WaterTracker glasses={glasses} onAdd={addGlass} onRemove={removeGlass} />
          </div>
        </StatCard>
        <StatCard
          icon={Trophy}
          label="Active Plans"
          value={plans.length || '0'}
          subValue="nutrition plans"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weight chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900">Weight Progress</h3>
            {client?.weight && (
              <span className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">
                Current: {client.weight} kg
              </span>
            )}
          </div>
          <WeightChart currentWeight={client?.weight} goal={client?.goal} />
          <div className="mt-6 bg-emerald-50 p-4 rounded-lg flex items-start">
            <div className="bg-white p-1 rounded-full mr-3 shadow-sm">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-sm text-slate-700">
              <span className="font-semibold text-emerald-700">
                {client?.goal ? `Goal: ${client.goal}` : 'Complete your questionnaire'}
              </span>
              {client?.weight && client?.goal && (
                <span className="text-slate-500">
                  {' '}— tracking from {client.weight} kg
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Health profile */}
          {hasApprovedPayment && client?.questionnaireCompleted && (
            <div className="bg-white p-6 rounded-xl border border-emerald-100 shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-emerald-500" />
                My Health Profile
              </h3>
              <div className="space-y-2">
                {[
                  ['Goal',       client.goal],
                  ['Activity',   client.activityLevel],
                  ['Weight',     client.weight ? `${client.weight} kg` : null],
                  ['Height',     client.height ? `${client.height} cm` : null],
                  ['Age',        client.age],
                  ['Gender',     client.gender],
                  ['Medical',    client.medicalConditions || 'None'],
                  ['Allergies',  client.foodAllergies    || 'None'],
                  ['Daily Target', `${calorieTarget} kcal`],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-medium text-slate-900">{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          {/* Nutrition plans */}
          <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center mb-6">
              <Calendar className="w-5 h-5 mr-2 text-slate-500" />
              My Nutrition Plans
            </h3>
            {plans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No plans assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {plans.map((plan) => (
                  <Link to="/my-plan" key={plan.id}
                    className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${plan.status === 'Approved' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                        {plan.status === 'Approved'
                          ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          : <Circle className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm">{plan.title}</p>
                        <p className="text-xs text-slate-500">{plan.status}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
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
    </div>
  );
};

export default Dashboard;
