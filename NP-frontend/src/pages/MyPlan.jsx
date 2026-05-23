import { useState, useEffect } from 'react';
import { ChevronDown, Star } from 'lucide-react';
import { getMyPlansAsClient, submitFeedback, getFeedbacksByPlan } from '../services/api';

// --- Sub-components ---

const MacroCard = ({ value, label, bgColor }) => (
  <div className={`flex-1 p-4 rounded-xl text-center ${bgColor}`}>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
    <p className="text-sm text-slate-600 mt-1">{label}</p>
  </div>
);

const DayTab = ({ day, isActive, onClick }) => (
  <button onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}>
    {day}
  </button>
);

const MealItem = ({ time, type, name, calories, protein }) => (
  <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors cursor-pointer group">
    <div className="flex items-center">
      <div className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-2 rounded-lg mr-4 min-w-[70px] text-center">
        {time}
      </div>
      <div>
        <p className="text-sm text-slate-500 mb-0.5">{type}</p>
        <p className="font-semibold text-slate-900">{name}</p>
      </div>
    </div>
    <div className="flex items-center">
      <div className="text-right mr-4">
        <p className="font-semibold text-slate-900">{calories}</p>
        <p className="text-sm text-slate-500">{protein}</p>
      </div>
      <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
    </div>
  </div>
);

const StarRating = ({ rating, onRate, disabled }) => (
  <div className="flex space-x-2">
    {[1, 2, 3, 4, 5].map((star) => (
      <button key={star} onClick={() => !disabled && onRate(star)}
        className={`focus:outline-none transition-transform ${disabled ? 'cursor-default' : 'hover:scale-110'}`}>
        <Star className={`w-8 h-8 ${star <= rating ? 'fill-emerald-400 text-emerald-400' : 'text-slate-300'}`} />
      </button>
    ))}
  </div>
);

// Parse plan content into day-keyed meal structure
// Expected content format (JSON string): { "Mon": [...], "Tue": [...], ... }
// Fallback: display raw content as text
const parsePlanContent = (content) => {
  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === 'object' && !Array.isArray(parsed)) return { type: 'structured', data: parsed };
  } catch (_) {}
  return { type: 'text', data: content };
};

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// --- Main Page ---

const MyPlan = () => {
  const [plans, setPlans]           = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [activeDay, setActiveDay]   = useState('Mon');
  const [loading, setLoading]       = useState(true);

  // Feedback state
  const [existingFeedback, setExistingFeedback] = useState(null);
  const [userRating, setUserRating]             = useState(0);
  const [comment, setComment]                   = useState('');
  const [feedbackLoading, setFeedbackLoading]   = useState(false);
  const [feedbackMsg, setFeedbackMsg]           = useState('');

  useEffect(() => {
    getMyPlansAsClient()
      .then((data) => {
        setPlans(data);
        if (data.length > 0) setActivePlan(data[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load existing feedback when active plan changes
  useEffect(() => {
    if (!activePlan) return;
    getFeedbacksByPlan(activePlan.id)
      .then((feedbacks) => {
        if (feedbacks.length > 0) {
          setExistingFeedback(feedbacks[0]);
          setUserRating(feedbacks[0].rating);
          setComment(feedbacks[0].comment);
        } else {
          setExistingFeedback(null);
          setUserRating(0);
          setComment('');
        }
      })
      .catch(console.error);
  }, [activePlan]);

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!userRating) return setFeedbackMsg('Please select a rating.');
    setFeedbackLoading(true);
    setFeedbackMsg('');
    try {
      await submitFeedback(activePlan.id, comment, userRating);
      setFeedbackMsg('Feedback submitted successfully!');
      setExistingFeedback({ rating: userRating, comment });
    } catch (err) {
      setFeedbackMsg(err?.detail || 'Failed to submit feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  };

  const parsedContent = activePlan ? parsePlanContent(activePlan.content) : null;
  const mealsForDay = parsedContent?.type === 'structured' ? (parsedContent.data[activeDay] || []) : [];

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-400">Loading your plan...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">My Nutrition Plan</h1>
            <p className="text-slate-500 mt-2">Your personalized meal plan for success</p>
          </header>

          {plans.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <p className="text-slate-400 text-lg">No nutrition plans assigned yet.</p>
              <p className="text-slate-400 text-sm mt-2">Your nutritionist will assign a plan to you soon.</p>
            </div>
          ) : (
            <>
              {/* Plan Selector (if multiple plans) */}
              {plans.length > 1 && (
                <div className="flex gap-3 mb-6 flex-wrap">
                  {plans.map((plan) => (
                    <button key={plan.id} onClick={() => setActivePlan(plan)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${activePlan?.id === plan.id ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-300'}`}>
                      {plan.title}
                    </button>
                  ))}
                </div>
              )}

              {/* Plan Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <h2 className="text-xl font-bold text-slate-900">{activePlan.title}</h2>
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${activePlan.status === 'Approved' ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    {activePlan.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-6 pb-6 border-b border-slate-100">
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Type</p>
                    <p className="font-semibold text-slate-900">{activePlan.isPredefined ? 'Predefined Plan' : 'Custom Plan'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Created</p>
                    <p className="font-semibold text-slate-900">{new Date(activePlan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Status</p>
                    <p className="font-semibold text-slate-900">{activePlan.status}</p>
                  </div>
                </div>

                {/* Macros — shown only if structured content */}
                {parsedContent?.type === 'structured' && parsedContent.data.macros && (
                  <div>
                    <p className="text-sm text-slate-500 mb-3">Daily Macros Target</p>
                    <div className="flex gap-4">
                      <MacroCard value={parsedContent.data.macros.protein} label="Protein" bgColor="bg-blue-50" />
                      <MacroCard value={parsedContent.data.macros.carbs}   label="Carbs"   bgColor="bg-orange-50" />
                      <MacroCard value={parsedContent.data.macros.fats}    label="Fats"    bgColor="bg-yellow-50" />
                    </div>
                  </div>
                )}
              </div>

              {/* Weekly Meal Plan */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-6">Weekly Meal Plan</h3>

                {parsedContent?.type === 'structured' ? (
                  <>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {DAYS.map((day) => (
                        <DayTab key={day} day={day} isActive={activeDay === day} onClick={() => setActiveDay(day)} />
                      ))}
                    </div>
                    <div className="space-y-3">
                      {mealsForDay.length > 0 ? mealsForDay.map((meal, idx) => (
                        <MealItem key={idx} {...meal} />
                      )) : (
                        <p className="text-slate-400 text-sm text-center py-6">No meals scheduled for {activeDay}.</p>
                      )}
                    </div>
                  </>
                ) : (
                  // Fallback: render raw content as formatted text
                  <div className="prose prose-slate max-w-none">
                    <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">
                      {activePlan.content}
                    </pre>
                  </div>
                )}
              </div>

              {/* Rate Your Plan — only for personalized/AI plans (not predefined) */}
              {!activePlan.isPredefined && activePlan.status === 'Approved' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-1">Rate Your Plan</h3>
                <p className="text-slate-500 text-sm mb-6">How satisfied are you with this nutrition plan?</p>

                {feedbackMsg && (
                  <div className={`mb-4 p-3 rounded-lg text-sm ${feedbackMsg.includes('success') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {feedbackMsg}
                  </div>
                )}

                <form onSubmit={handleFeedbackSubmit}>
                  <StarRating rating={userRating} onRate={setUserRating} disabled={!!existingFeedback} />

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={!!existingFeedback}
                    placeholder="Share your experience with this plan..."
                    rows={3}
                    className="mt-4 w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed transition-all"
                  />

                  {!existingFeedback && (
                    <button type="submit" disabled={feedbackLoading}
                      className="mt-4 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-colors">
                      {feedbackLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  )}
                </form>
              </div>
              )}
            </>
          )}
    </div>
  );
};

export default MyPlan;
