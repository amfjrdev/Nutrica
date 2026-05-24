import { useState, useEffect } from 'react';
import {
  Lock, Unlock, Star, Clock, Flame, Target, Trophy,
  Loader2, CheckCircle2, ChevronRight, Utensils, ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPredefinedPlans, getClientAccess } from '../../services/api';

const PLAN_META = {
  'Weight Loss Essentials':   { goal: 'Weight Loss',    duration: '8 weeks',  calories: '1,500–1,800 cal/day', difficulty: 'Beginner',     diffColor: 'bg-green-100 text-green-700',  tags: ['Calorie Deficit', 'Balanced', 'Easy to Follow'] },
  'Muscle Building Pro':      { goal: 'Muscle Gain',    duration: '12 weeks', calories: '2,500–3,000 cal/day', difficulty: 'Intermediate', diffColor: 'bg-yellow-100 text-yellow-700', tags: ['High Protein', 'Muscle Gain', 'Strength'] },
  'Mediterranean Lifestyle':  { goal: 'General Health', duration: 'Ongoing',  calories: '1,800–2,200 cal/day', difficulty: 'Beginner',     diffColor: 'bg-green-100 text-green-700',  tags: ['Heart Health', 'Anti-inflammatory', 'Whole Foods'] },
  'Keto Quick Start':         { goal: 'Fat Loss',       duration: '6 weeks',  calories: '1,600–2,000 cal/day', difficulty: 'Intermediate', diffColor: 'bg-yellow-100 text-yellow-700', tags: ['Keto', 'Low Carb', 'Fat Burning'] },
  'Plant-Based Power':        { goal: 'Vegan Health',   duration: '10 weeks', calories: '1,800–2,200 cal/day', difficulty: 'Beginner',     diffColor: 'bg-green-100 text-green-700',  tags: ['Vegan', 'Plant-Based', 'Sustainable'] },
  'Athletic Performance':     { goal: 'Performance',    duration: '12 weeks', calories: '2,800–3,500 cal/day', difficulty: 'Advanced',     diffColor: 'bg-red-100 text-red-700',      tags: ['Athletic', 'High Energy', 'Performance'] },
};
const DEFAULT_META = { goal: 'General Health', duration: '8 weeks', calories: 'Balanced', difficulty: 'Beginner', diffColor: 'bg-green-100 text-green-700', tags: ['Nutrition', 'Health'] };
const getMeta = (title) => PLAN_META[title] ?? DEFAULT_META;

// ── Confirm modal ─────────────────────────────────────────────────────────────
const ConfirmModal = ({ plan, onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-slate-100">
      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Unlock className="w-6 h-6 text-emerald-600" />
      </div>
      <h3 className="font-bold text-slate-900 mb-2">Buy This Plan?</h3>
      <p className="text-sm text-slate-500 mb-2">
        You are about to purchase the <span className="font-semibold text-slate-700">"{plan.title}"</span>.
      </p>
      <p className="text-xs text-amber-600 mb-6 bg-amber-50 rounded-xl px-3 py-2 border border-amber-100">
        This plan costs $29/month. You will be redirected to our secure Stripe checkout.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Go to Checkout
        </button>
      </div>
    </div>
  </div>
);

// ── Plan detail view ──────────────────────────────────────────────────────────
const PlanDetail = ({ plan, meta, onBack, isUnlocked, isPending, onSelect, selecting }) => {
  const parsedContent = (() => {
    try { const p = JSON.parse(plan.content); return typeof p === 'object' ? p : null; } catch { return null; }
  })();
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const [activeDay, setActiveDay] = useState('Mon');
  const meals = parsedContent?.[activeDay] ?? [];

  const showOverlay = !isUnlocked;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-sm font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
            <p className="text-slate-500 text-sm mt-1">{parsedContent?.description ?? 'Expert-designed nutrition plan.'}</p>
          </div>
          {isUnlocked
            ? <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-bold px-3 py-1.5 rounded-full"><CheckCircle2 className="w-3.5 h-3.5" /> Unlocked</span>
            : <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 text-xs font-bold px-3 py-1.5 rounded-full"><Lock className="w-3.5 h-3.5" /> Locked</span>
          }
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {[
            { icon: Target, label: 'Goal',       value: meta.goal },
            { icon: Flame,  label: 'Calories',   value: meta.calories },
            { icon: Clock,  label: 'Duration',   value: meta.duration },
            { icon: Trophy, label: 'Difficulty', value: meta.difficulty },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="text-center">
              <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Icon className="w-4 h-4 text-emerald-600" />
              </div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-sm font-semibold text-slate-900 mt-0.5">{value}</p>
            </div>
          ))}
        </div>

        {parsedContent?.macros && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Macros</p>
            <div className="grid grid-cols-3 gap-3">
              {[['Protein', parsedContent.macros.protein, 'bg-blue-50 text-blue-700'],
                ['Carbs',   parsedContent.macros.carbs,   'bg-amber-50 text-amber-700'],
                ['Fats',    parsedContent.macros.fats,    'bg-rose-50 text-rose-700']].map(([label, value, color]) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative ${showOverlay ? 'overflow-hidden' : ''}`}>
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" /> Weekly Meal Plan
        </h2>

        {parsedContent ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {DAYS.map(day => (
                <button key={day} onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeDay === day ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {day}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {meals.length > 0 ? meals.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg">{meal.time}</span>
                    <div>
                      <p className="text-xs text-slate-400">{meal.type}</p>
                      <p className="font-semibold text-slate-900 text-sm">{meal.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900 text-sm">{meal.calories}</p>
                    <p className="text-xs text-slate-400">{meal.protein}</p>
                  </div>
                </div>
              )) : <p className="text-slate-400 text-sm text-center py-8">No meals for {activeDay}.</p>}
            </div>
          </>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-xl">{plan.content}</pre>
        )}

        {showOverlay && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
            <Lock className="w-10 h-10 text-slate-400 mb-3" />
            <p className="font-semibold text-slate-700 mb-1">Plan Locked</p>
            
            {isPending ? (
              <>
                <p className="text-sm text-slate-500 mb-4 text-center px-8 bg-amber-50 text-amber-700 py-2 rounded-xl border border-amber-100">
                  ⚠️ Your payment for this plan is pending approval.
                </p>
                <button onClick={onBack}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-500 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors">
                  Back to Plans
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-slate-500 mb-4 text-center px-8">
                  Unlock this predefined plan individually for $29/month to view the full meal schedule.
                </p>
                <button onClick={onSelect} disabled={selecting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors">
                  Buy Plan ($29/mo)
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────
const ReadyMadePlans = () => {
  const navigate = useNavigate();
  const [plans, setPlans]         = useState([]);
  const [access, setAccess]       = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [toConfirm, setToConfirm] = useState(null);
  const [selecting, setSelecting] = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    Promise.all([getPredefinedPlans(), getClientAccess()])
      .then(([p, a]) => { setPlans(p); setAccess(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unlockedPlanIds = access?.unlockedPlanIds ?? [];
  const pendingPlanIds  = access?.pendingPlanIds ?? [];

  // Called when user confirms in the modal
  const handleConfirm = () => {
    if (!toConfirm) return;
    navigate(`/payment?plan=predefined&returnPlanId=${toConfirm.id}`);
    setToConfirm(null);
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  );

  if (selected) {
    const meta = getMeta(selected.title);
    const isUnlocked = unlockedPlanIds.includes(selected.id);
    const isPending = pendingPlanIds.includes(selected.id);
    return (
      <>
        {toConfirm && <ConfirmModal plan={toConfirm} onConfirm={handleConfirm} onCancel={() => setToConfirm(null)} loading={selecting} />}
        <PlanDetail
          plan={selected}
          meta={meta}
          isUnlocked={isUnlocked}
          isPending={isPending}
          onBack={() => setSelected(null)}
          onSelect={() => setToConfirm(selected)}
          selecting={selecting}
        />
      </>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {toConfirm && <ConfirmModal plan={toConfirm} onConfirm={handleConfirm} onCancel={() => setToConfirm(null)} loading={selecting} />}

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Ready-Made Plans</h1>
        <p className="text-slate-500 mt-1">Expert-designed nutrition plans — unlock individual plans to view their meal schedules</p>
      </header>

      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
        <Unlock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-emerald-800">Unlock Individual Plans</p>
          <p className="text-sm text-emerald-700 mt-0.5">
            Each Ready-Made plan costs <strong>$29/month</strong> individually. Buy as many plans as you want, and all your purchased plans will remain unlocked simultaneously!
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-4 rounded-xl mb-6">{error}</div>}

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <Utensils className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No predefined plans available yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const meta       = getMeta(plan.title);
            const isUnlocked = unlockedPlanIds.includes(plan.id);
            const isPending  = pendingPlanIds.includes(plan.id);

            return (
              <div key={plan.id}
                className={`bg-white rounded-2xl border p-6 flex flex-col transition-all relative
                  ${isUnlocked ? 'border-emerald-300 shadow-md animate-in fade-in' : 'border-slate-200 hover:shadow-md hover:border-slate-300'}`}>

                <div className="absolute top-4 right-4">
                  {isUnlocked && <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3" /> Unlocked</span>}
                  {isPending && <span className="flex items-center gap-1 bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full"><Clock className="w-3 h-3" /> Pending</span>}
                  {!isUnlocked && !isPending && <span className="flex items-center gap-1 bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full"><Lock className="w-3 h-3" /> Locked</span>}
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 pr-20">{plan.title}</h3>

                <div className="flex items-center gap-1 mb-3">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {plan.averageRating > 0 ? plan.averageRating.toFixed(1) : 'No reviews'}
                  </span>
                </div>

                <div className="space-y-1.5 mb-4 flex-1">
                  {[
                    { label: 'Goal',     value: meta.goal },
                    { label: 'Duration', value: meta.duration },
                    { label: 'Calories', value: meta.calories },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm">
                      <span className="text-slate-500">{label}:</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Difficulty:</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${meta.diffColor}`}>{meta.difficulty}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-5">
                  {meta.tags.map(tag => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">{tag}</span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setSelected(plan)}
                    className="flex-1 py-2.5 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-600 text-sm font-medium rounded-xl transition-colors">
                    View Details
                  </button>
                  {isUnlocked && (
                    <button onClick={() => navigate('/my-plan')}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5" /> View Plan
                    </button>
                  )}
                  {isPending && (
                    <button disabled
                      className="flex-1 py-2.5 bg-slate-100 text-slate-400 text-sm font-semibold rounded-xl flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200">
                      <Clock className="w-3.5 h-3.5" /> Pending
                    </button>
                  )}
                  {!isUnlocked && !isPending && (
                    <button onClick={() => setToConfirm(plan)}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5">
                      <Unlock className="w-3.5 h-3.5" /> Buy ($29)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReadyMadePlans;
