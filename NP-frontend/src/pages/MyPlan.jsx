import { useState, useEffect } from 'react';
import {
  Star, Users, Clock, Flame, Trophy, Target, ArrowLeft,
  CheckCircle2, Loader2, Utensils, ChevronRight, UserCheck
} from 'lucide-react';
import { getMyPlansAsClient, submitFeedback, getFeedbacksByPlan, rateNutritionist, getMyNutritionistRating } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────────────────

const parsePlanContent = (content) => {
  try {
    const p = JSON.parse(content);
    if (typeof p === 'object' && !Array.isArray(p)) return { type: 'structured', data: p };
  } catch (_) {}
  return { type: 'text', data: content };
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const difficultyStyle = (status) => {
  if (status === 'Approved') return 'bg-green-100 text-green-700';
  if (status === 'PendingApproval') return 'bg-yellow-100 text-yellow-700';
  return 'bg-slate-100 text-slate-600';
};

const goalFromContent = (content) => {
  try {
    const p = JSON.parse(content);
    return p.goal || 'General Health';
  } catch { return 'General Health'; }
};

const caloriesFromContent = (content) => {
  try {
    const p = JSON.parse(content);
    if (p.macros?.calories) return `${p.macros.calories} cal/day`;
  } catch {}
  return 'Balanced';
};

// ── StarRating ────────────────────────────────────────────────────────────────

const StarRating = ({ rating, onRate, disabled }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button key={s} onClick={() => !disabled && onRate(s)}
        className={`focus:outline-none transition-transform ${disabled ? 'cursor-default' : 'hover:scale-110'}`}>
        <Star className={`w-7 h-7 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

// ── Plan Card ─────────────────────────────────────────────────────────────────

const PlanCard = ({ plan, onSelect }) => {
  const goal     = goalFromContent(plan.content);
  const calories = caloriesFromContent(plan.content);
  const parsed   = parsePlanContent(plan.content);
  const tags     = parsed.type === 'structured' && parsed.data.tags
    ? parsed.data.tags
    : [plan.isPredefined ? 'Predefined' : 'Custom', plan.status];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:border-emerald-200 transition-all flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-bold text-slate-900 leading-tight pr-2">{plan.title}</h3>
        {!plan.isPredefined && (
          <span className="flex-shrink-0 flex items-center gap-1 bg-orange-100 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
            <Trophy className="w-3 h-3" /> Personal
          </span>
        )}
      </div>

      <p className="text-sm text-slate-500 mb-4 line-clamp-2 flex-1">
        {parsed.type === 'structured' && parsed.data.description
          ? parsed.data.description
          : `A ${plan.isPredefined ? 'predefined' : 'custom'} nutrition plan created for you.`}
      </p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-slate-900">4.8</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Users className="w-4 h-4" />
          <span className="text-sm">Active plan</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Goal:</span>
          <span className="font-medium text-slate-900 flex items-center gap-1">
            <Target className="w-3 h-3 text-slate-400" />{goal}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Calories:</span>
          <span className="font-medium text-slate-900 flex items-center gap-1">
            <Flame className="w-3 h-3 text-slate-400" />{calories}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Type:</span>
          <span className="font-medium text-slate-900 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />{plan.isPredefined ? 'Predefined' : 'Personalized'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Status:</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${difficultyStyle(plan.status)}`}>
            {plan.status === 'PendingApproval' ? 'Pending' : plan.status}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {tags.slice(0, 3).map((tag) => (
          <span key={tag} className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">{tag}</span>
        ))}
      </div>

      <button onClick={() => onSelect(plan)}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
        View Plan Details <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// ── Plan Detail ───────────────────────────────────────────────────────────────

const PlanDetail = ({ plan, onBack }) => {
  const [activeDay, setActiveDay]             = useState('Mon');
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [userRating, setUserRating]           = useState(0);
  const [comment, setComment]                 = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg]         = useState('');

  // Nutritionist rating
  const [existingNutRating, setExistingNutRating] = useState(null);
  const [nutRating, setNutRating]                 = useState(0);
  const [nutComment, setNutComment]               = useState('');
  const [nutLoading, setNutLoading]               = useState(false);
  const [nutMsg, setNutMsg]                       = useState('');

  const parsed    = parsePlanContent(plan.content);
  const mealsForDay = parsed.type === 'structured' ? (parsed.data[activeDay] || []) : [];

  useEffect(() => {
    getFeedbacksByPlan(plan.id)
      .then((fb) => {
        if (fb.length > 0) { setExistingFeedback(fb[0]); setUserRating(fb[0].rating); setComment(fb[0].comment); }
      }).catch(() => {});

    if (plan.nutritionistId)
      getMyNutritionistRating(plan.nutritionistId)
        .then((r) => { if (r) { setExistingNutRating(r); setNutRating(r.rating); setNutComment(r.comment); } })
        .catch(() => {});
  }, [plan.id, plan.nutritionistId]);

  const handleFeedback = async (e) => {
    e.preventDefault();
    if (!userRating) return setFeedbackMsg('Please select a rating.');
    setFeedbackLoading(true); setFeedbackMsg('');
    try {
      await submitFeedback(plan.id, comment, userRating);
      setFeedbackMsg('Feedback submitted!');
      setExistingFeedback({ rating: userRating, comment });
    } catch (err) {
      setFeedbackMsg(err?.detail || 'Failed to submit feedback.');
    } finally { setFeedbackLoading(false); }
  };

  const handleNutRating = async (e) => {
    e.preventDefault();
    if (!nutRating) return setNutMsg('Please select a rating.');
    setNutLoading(true); setNutMsg('');
    try {
      await rateNutritionist(plan.nutritionistId, nutRating, nutComment);
      setNutMsg('Rating submitted!');
      setExistingNutRating({ rating: nutRating, comment: nutComment });
    } catch (err) {
      setNutMsg(err?.detail || err?.title || 'Failed to submit rating.');
    } finally { setNutLoading(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors mb-6 text-sm font-medium">
        <ArrowLeft className="w-4 h-4" /> Back to Plans
      </button>

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{plan.title}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {parsed.type === 'structured' && parsed.data.description
                ? parsed.data.description
                : `A ${plan.isPredefined ? 'predefined' : 'personalized'} nutrition plan.`}
            </p>
          </div>
          <span className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full ${difficultyStyle(plan.status)}`}>
            {plan.status === 'PendingApproval' ? 'Pending Approval' : plan.status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          {[
            { icon: Target, label: 'Goal',    value: goalFromContent(plan.content) },
            { icon: Flame,  label: 'Calories', value: caloriesFromContent(plan.content) },
            { icon: Clock,  label: 'Type',     value: plan.isPredefined ? 'Predefined' : 'Personalized' },
            { icon: CheckCircle2, label: 'Created', value: new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
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

        {/* Macros */}
        {parsed.type === 'structured' && parsed.data.macros && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Daily Macros</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Protein', value: parsed.data.macros.protein, color: 'bg-blue-50 text-blue-700' },
                { label: 'Carbs',   value: parsed.data.macros.carbs,   color: 'bg-amber-50 text-amber-700' },
                { label: 'Fats',    value: parsed.data.macros.fats,    color: 'bg-rose-50 text-rose-700' },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-xs opacity-80">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Meal plan */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-5 flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" /> Weekly Meal Plan
        </h2>

        {parsed.type === 'structured' ? (
          <>
            <div className="flex flex-wrap gap-2 mb-5">
              {DAYS.map((day) => (
                <button key={day} onClick={() => setActiveDay(day)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${activeDay === day ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  {day}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {mealsForDay.length > 0 ? mealsForDay.map((meal, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-lg min-w-[60px] text-center">
                      {meal.time}
                    </span>
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
              )) : (
                <p className="text-slate-400 text-sm text-center py-8">No meals scheduled for {activeDay}.</p>
              )}
            </div>
          </>
        ) : (
          <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">
            {plan.content}
          </pre>
        )}
      </div>

      {/* Feedback + Nutritionist rating — only for non-predefined approved plans */}
      {!plan.isPredefined && plan.status === 'Approved' && (
        <div className="space-y-6">

          {/* Rate the plan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Rate This Plan</h2>
            <p className="text-slate-500 text-sm mb-5">How satisfied are you with this nutrition plan?</p>
            {feedbackMsg && (
              <div className={`mb-4 p-3 rounded-xl text-sm ${feedbackMsg.includes('submitted') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                {feedbackMsg}
              </div>
            )}
            <form onSubmit={handleFeedback}>
              <StarRating rating={userRating} onRate={setUserRating} disabled={!!existingFeedback} />
              <textarea value={comment} onChange={(e) => setComment(e.target.value)}
                disabled={!!existingFeedback}
                placeholder="Share your experience with this plan..."
                rows={3}
                className="mt-4 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
              />
              {!existingFeedback && (
                <button type="submit" disabled={feedbackLoading}
                  className="mt-3 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                  {feedbackLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Feedback
                </button>
              )}
            </form>
          </div>

          {/* Rate the nutritionist */}
          {plan.nutritionistId && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-500" /> Rate Your Nutritionist
              </h2>
              <p className="text-slate-500 text-sm mb-5">How would you rate your nutritionist's support and guidance?</p>
              {nutMsg && (
                <div className={`mb-4 p-3 rounded-xl text-sm ${nutMsg.includes('submitted') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                  {nutMsg}
                </div>
              )}
              <form onSubmit={handleNutRating}>
                <StarRating rating={nutRating} onRate={setNutRating} disabled={!!existingNutRating} />
                <textarea value={nutComment} onChange={(e) => setNutComment(e.target.value)}
                  disabled={!!existingNutRating}
                  placeholder="Share your experience with your nutritionist..."
                  rows={3}
                  className="mt-4 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                />
                {!existingNutRating && (
                  <button type="submit" disabled={nutLoading}
                    className="mt-3 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2">
                    {nutLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Rating
                  </button>
                )}
              </form>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const MyPlan = () => {
  const [plans, setPlans]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    getMyPlansAsClient()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
    </div>
  );

  if (selected) return <PlanDetail plan={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">My Nutrition Plans</h1>
        <p className="text-slate-500 mt-1">Your assigned nutrition plans — click a plan to view details</p>
      </header>

      {plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-slate-500 font-medium">No nutrition plans assigned yet.</p>
          <p className="text-slate-400 text-sm mt-1">Your nutritionist will assign a plan to you soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={setSelected} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPlan;
