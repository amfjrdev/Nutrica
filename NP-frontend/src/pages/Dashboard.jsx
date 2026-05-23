import { useEffect, useState, useRef } from 'react';
import {
  Target, Flame, Droplet, Trophy, TrendingUp, Calendar,
  CheckCircle2, Circle, Clock, FlaskConical, User, Plus, Minus, Scale
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClientProfile, getMyPlansAsClient, getMyPayments } from '../services/api';

// ─── localStorage helpers ─────────────────────────────────────────────────────
const todayStr = () => new Date().toISOString().slice(0, 10);

const getWaterMl  = ()    => { try { return parseInt(localStorage.getItem(`water_ml_${todayStr()}`) || '0', 10); } catch { return 0; } };
const setWaterMl  = (v)   => localStorage.setItem(`water_ml_${todayStr()}`, v);

const getWeightLog = () => { try { return JSON.parse(localStorage.getItem('weight_log') || '[]'); } catch { return []; } };
const saveWeightLog = (log) => localStorage.setItem('weight_log', JSON.stringify(log));

const getTodayCalories = () => {
  try {
    const history = JSON.parse(localStorage.getItem('calorie_history') || '[]');
    const today   = new Date().toLocaleDateString();
    return history.filter(s => s.date === today).reduce((sum, s) => sum + (s.estimatedCalories || 0), 0);
  } catch { return 0; }
};

// ─── Water Intake Card ────────────────────────────────────────────────────────
const WATER_GOAL_ML = 2500;
const QUICK_AMOUNTS = [150, 250, 350, 500];

const WaterCard = ({ waterMl, setWaterMl: setWater }) => {
  const pct     = Math.min((waterMl / WATER_GOAL_ML) * 100, 100);
  const glasses = Math.round(waterMl / 250);
  const color   = pct >= 100 ? '#10b981' : pct >= 60 ? '#3b82f6' : pct >= 30 ? '#60a5fa' : '#93c5fd';

  const add    = (ml) => { const next = Math.min(waterMl + ml, WATER_GOAL_ML + 500); setWater(next); setWaterMl(next); };
  const remove = (ml) => { const next = Math.max(waterMl - ml, 0); setWater(next); setWaterMl(next); };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 rounded-lg"><Droplet className="w-5 h-5 text-blue-500" /></div>
          <div>
            <p className="font-bold text-slate-900 text-sm">Water Intake</p>
            <p className="text-xs text-slate-400">Daily goal: {WATER_GOAL_ML} ml</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-blue-600">{waterMl}</p>
          <p className="text-xs text-slate-400">/ {WATER_GOAL_ML} ml</p>
        </div>
      </div>

      {/* Animated fill bar */}
      <div className="relative h-5 bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, #93c5fd, ${color})` }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
          {pct.toFixed(0)}%
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-4 text-center">≈ {glasses} glasses · {WATER_GOAL_ML - waterMl > 0 ? `${WATER_GOAL_ML - waterMl} ml remaining` : '🎉 Goal reached!'}</p>

      {/* Quick add buttons */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {QUICK_AMOUNTS.map(ml => (
          <button key={ml} onClick={() => add(ml)}
            className="py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-colors">
            +{ml}ml
          </button>
        ))}
      </div>

      {/* Manual +/- */}
      <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
        <button onClick={() => remove(250)}
          className="w-8 h-8 rounded-full bg-white shadow-sm hover:bg-red-50 flex items-center justify-center transition-colors">
          <Minus className="w-4 h-4 text-slate-500" />
        </button>
        <span className="text-sm text-slate-500 font-medium">250 ml / glass</span>
        <button onClick={() => add(250)}
          className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 shadow-sm flex items-center justify-center transition-colors">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
};

// ─── Weight Log & Chart ───────────────────────────────────────────────────────
const WeightChart = ({ log, currentWeight, goal }) => {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  // Build display points: last 10 entries + today's questionnaire weight if no log
  const points = log.length > 0
    ? log.slice(-10)
    : currentWeight
      ? [{ date: todayStr(), weight: parseFloat(currentWeight) }]
      : [];

  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-slate-400">
        <Scale className="w-10 h-10 mb-2 opacity-30" />
        <p className="text-sm">Log your weight to see progress</p>
      </div>
    );
  }

  const W = 460, H = 180, PAD = { top: 16, right: 16, bottom: 32, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top  - PAD.bottom;

  const weights = points.map(p => p.weight);
  const minW    = Math.floor(Math.min(...weights) - 1);
  const maxW    = Math.ceil(Math.max(...weights)  + 1);
  const rangeW  = maxW - minW || 1;

  const toX = (i) => PAD.left + (i / Math.max(points.length - 1, 1)) * chartW;
  const toY = (w) => PAD.top  + chartH - ((w - minW) / rangeW) * chartH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.weight).toFixed(1)}`).join(' ');
  const areaD = pathD + ` L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + chartH).toFixed(1)} L ${PAD.left.toFixed(1)} ${(PAD.top + chartH).toFixed(1)} Z`;

  // Y-axis ticks
  const yTicks = Array.from({ length: 5 }, (_, i) => minW + (rangeW / 4) * i);

  // Goal line
  const isLoss   = goal?.toLowerCase().includes('loss') || goal?.toLowerCase().includes('lose');
  const isMass   = goal?.toLowerCase().includes('mass') || goal?.toLowerCase().includes('gain') || goal?.toLowerCase().includes('muscle');
  const goalW    = isLoss ? minW + 0.5 : isMass ? maxW - 0.5 : null;
  const goalY    = goalW ? toY(goalW) : null;

  // Format date label
  const fmtDate = (d) => {
    const dt = new Date(d);
    return `${dt.getDate()}/${dt.getMonth() + 1}`;
  };

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="wGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {yTicks.map((w, i) => {
          const y = toY(w);
          return (
            <g key={i}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
                stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 3" />
              <text x={PAD.left - 6} y={y + 4} fontSize="9" fill="#94a3b8" textAnchor="end">
                {w.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Goal line */}
        {goalY && (
          <g>
            <line x1={PAD.left} y1={goalY} x2={W - PAD.right} y2={goalY}
              stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 3" />
            <text x={W - PAD.right + 4} y={goalY + 4} fontSize="9" fill="#f59e0b">Goal</text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#wGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#10b981" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" />

        {/* Data points + X labels + hover zones */}
        {points.map((p, i) => {
          const cx = toX(i), cy = toY(p.weight);
          return (
            <g key={i}>
              <text x={cx} y={H - 6} fontSize="9" fill="#94a3b8" textAnchor="middle">
                {fmtDate(p.date)}
              </text>
              <circle cx={cx} cy={cy} r="5" fill="#10b981" stroke="white" strokeWidth="2" />
              {/* invisible hover target */}
              <circle cx={cx} cy={cy} r="14" fill="transparent"
                onMouseEnter={() => setTooltip({ x: cx, y: cy, weight: p.weight, date: p.date })}
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltip && (() => {
          const bx = Math.min(tooltip.x - 30, W - PAD.right - 70);
          const by = tooltip.y - 44;
          return (
            <g>
              <rect x={bx} y={by} width="70" height="34" rx="6" fill="#1e293b" opacity="0.9" />
              <text x={bx + 35} y={by + 13} fontSize="10" fill="white" textAnchor="middle" fontWeight="bold">
                {tooltip.weight} kg
              </text>
              <text x={bx + 35} y={by + 26} fontSize="9" fill="#94a3b8" textAnchor="middle">
                {new Date(tooltip.date).toLocaleDateString('en', { day: 'numeric', month: 'short' })}
              </text>
            </g>
          );
        })()}
      </svg>
    </div>
  );
};

const WeightLogger = ({ onLog }) => {
  const [val, setVal] = useState('');
  const submit = () => {
    const w = parseFloat(val);
    if (!w || w < 20 || w > 300) return;
    onLog(w);
    setVal('');
  };
  return (
    <div className="flex items-center gap-2 mt-4">
      <div className="relative flex-1">
        <input
          type="number"
          value={val}
          onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="Enter weight (kg)"
          className="w-full pl-3 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">kg</span>
      </div>
      <button onClick={submit}
        className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors">
        Log
      </button>
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, subValue, accentBg = 'bg-emerald-50', accentText = 'text-emerald-600', subColor = 'text-emerald-500' }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 ${accentBg} rounded-xl`}><Icon className={`w-5 h-5 ${accentText}`} /></div>
      <TrendingUp className="w-4 h-4 text-emerald-400" />
    </div>
    <p className="text-sm text-slate-500 mb-1">{label}</p>
    <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
    {subValue && <p className={`text-sm mt-1 font-medium ${subColor}`}>{subValue}</p>}
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user }  = useAuth();
  const [client, setClient]     = useState(null);
  const [plans, setPlans]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [waterMl, setWaterMl]   = useState(getWaterMl);
  const [weightLog, setWeightLog] = useState(getWeightLog);
  const [todayCal, setTodayCal] = useState(getTodayCalories);
  const [searchParams, setSearchParams] = useSearchParams();

  const showPendingBanner = searchParams.get('payment') === 'pending';
  const isTestMode        = searchParams.get('mode')    === 'test';

  useEffect(() => {
    getClientProfile().then(setClient).catch(console.error);
    getMyPlansAsClient().then(setPlans).catch(console.error);
    getMyPayments().then(setPayments).catch(console.error);
  }, []);

  useEffect(() => {
    const refresh = () => setTodayCal(getTodayCalories());
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);

  const handleLogWeight = (w) => {
    const entry = { date: todayStr(), weight: w };
    // Replace today's entry if exists, otherwise append
    const next = [...weightLog.filter(e => e.date !== todayStr()), entry]
      .sort((a, b) => a.date.localeCompare(b.date));
    setWeightLog(next);
    saveWeightLog(next);
  };

  const dismissBanner = () => {
    searchParams.delete('payment');
    searchParams.delete('mode');
    setSearchParams(searchParams);
  };

  const hasApprovedPayment = payments.some(p => p.status === 'Succeeded');

  const calorieTarget = (() => {
    if (!client?.weight || !client?.height || !client?.age || !client?.gender) return 2000;
    const bmr = client.gender === 'Male'
      ? 88.36 + 13.4 * parseFloat(client.weight) + 4.8 * parseFloat(client.height) - 5.7 * client.age
      : 447.6 + 9.2  * parseFloat(client.weight) + 3.1 * parseFloat(client.height) - 4.3 * client.age;
    const mult = { 'Sedentary': 1.2, 'Lightly Active': 1.375, 'Moderately Active': 1.55, 'Very Active': 1.725 }[client.activityLevel] ?? 1.375;
    return Math.round(bmr * mult);
  })();

  const caloriesRemaining = Math.max(calorieTarget - todayCal, 0);

  // Latest logged weight (or questionnaire weight)
  const displayWeight = weightLog.length > 0
    ? weightLog[weightLog.length - 1].weight
    : client?.weight ? parseFloat(client.weight) : null;

  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">
          Welcome Back{user?.firstName ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="text-slate-500 mt-1">Here's your health overview for today</p>
      </header>

      {showPendingBanner && (
        <div className={`mb-8 rounded-2xl p-4 flex items-start justify-between gap-4 border ${isTestMode ? 'bg-violet-50 border-violet-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-start gap-3">
            {isTestMode ? <FlaskConical className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" /> : <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />}
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
          value={displayWeight ? `${displayWeight} kg` : '—'}
          subValue={client?.goal || 'Complete questionnaire'}
        />
        <StatCard
          icon={Flame}
          label="Today's Calories"
          accentBg="bg-orange-50" accentText="text-orange-500" subColor="text-orange-500"
          value={todayCal > 0 ? todayCal.toLocaleString() : '0'}
          subValue={todayCal > 0 ? `${caloriesRemaining.toLocaleString()} remaining` : 'Scan a meal to track'}
        />
        <StatCard
          icon={Droplet}
          label="Water Today"
          accentBg="bg-blue-50" accentText="text-blue-500" subColor="text-blue-500"
          value={`${waterMl} ml`}
          subValue={`${Math.round((waterMl / WATER_GOAL_ML) * 100)}% of daily goal`}
        />
        <StatCard
          icon={Trophy}
          label="Active Plans"
          value={plans.length || '0'}
          subValue="nutrition plans"
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left: Weight chart + Water card */}
        <div className="lg:col-span-2 space-y-6">

          {/* Weight Progress */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-slate-900">Weight Progress</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {weightLog.length > 0 && (
                  <span className="bg-slate-50 px-2 py-1 rounded-lg">
                    {weightLog.length} entr{weightLog.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <span className="w-3 h-0.5 bg-amber-400 inline-block" style={{ borderTop: '2px dashed #f59e0b' }} />
                  Goal
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 mb-4">Log your weight daily to track real progress</p>

            <WeightChart log={weightLog} currentWeight={client?.weight} goal={client?.goal} />

            <WeightLogger onLog={handleLogWeight} />

            {weightLog.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-2">
                <span>Start: <strong>{weightLog[0].weight} kg</strong></span>
                <span>Latest: <strong className="text-emerald-600">{weightLog[weightLog.length - 1].weight} kg</strong></span>
                {weightLog.length > 1 && (
                  <span>
                    Change:{' '}
                    <strong className={weightLog[weightLog.length - 1].weight < weightLog[0].weight ? 'text-emerald-600' : 'text-rose-500'}>
                      {(weightLog[weightLog.length - 1].weight - weightLog[0].weight).toFixed(1)} kg
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Water Intake */}
          <WaterCard waterMl={waterMl} setWaterMl={setWaterMl} />
        </div>

        {/* Right: Health profile + Plans */}
        <div className="space-y-6">
          {hasApprovedPayment && client?.questionnaireCompleted && (
            <div className="bg-white p-6 rounded-2xl border border-emerald-100 shadow-sm">
              <h3 className="font-bold text-slate-900 flex items-center mb-4">
                <User className="w-5 h-5 mr-2 text-emerald-500" />
                My Health Profile
              </h3>
              <div className="space-y-2">
                {[
                  ['Goal',          client.goal],
                  ['Activity',      client.activityLevel],
                  ['Weight',        client.weight ? `${client.weight} kg` : null],
                  ['Height',        client.height ? `${client.height} cm` : null],
                  ['Age',           client.age],
                  ['Gender',        client.gender],
                  ['Medical',       client.medicalConditions || 'None'],
                  ['Allergies',     client.foodAllergies    || 'None'],
                  ['Daily Target',  `${calorieTarget} kcal`],
                ].map(([label, value]) => value ? (
                  <div key={label} className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-xs text-slate-500">{label}</span>
                    <span className="text-xs font-semibold text-slate-900">{value}</span>
                  </div>
                ) : null)}
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 flex items-center mb-6">
              <Calendar className="w-5 h-5 mr-2 text-slate-500" />
              My Nutrition Plans
            </h3>
            {plans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No plans assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {plans.map(plan => (
                  <Link to="/my-plan" key={plan.id}
                    className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-xl px-2 transition-colors">
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

      </div>
    </div>
  );
};

export default Dashboard;
