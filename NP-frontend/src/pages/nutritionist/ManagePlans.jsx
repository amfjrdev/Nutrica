import { useState, useEffect } from 'react';
import { Loader2, LayoutList, CheckCircle2, Clock, XCircle, FileEdit, Star, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { getMyPlansAsNutritionist, getMyFeedbacksAsNutritionist } from '../../services/api';

const STATUS_STYLES = {
  Approved:       { icon: CheckCircle2, cls: 'text-emerald-600 bg-emerald-50',  label: 'Approved' },
  PendingApproval:{ icon: Clock,        cls: 'text-amber-600  bg-amber-50',     label: 'Pending' },
  Rejected:       { icon: XCircle,      cls: 'text-red-600    bg-red-50',       label: 'Rejected' },
  Draft:          { icon: FileEdit,     cls: 'text-slate-500  bg-slate-100',    label: 'Draft' },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_STYLES[status] ?? STATUS_STYLES.Draft;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      <Icon className="w-3.5 h-3.5" />{cfg.label}
    </span>
  );
};

const StarDisplay = ({ rating }) => (
  <div className="flex gap-0.5">
    {[1,2,3,4,5].map(s => (
      <Star key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
    ))}
  </div>
);

const ManagePlans = () => {
  const [plans, setPlans]         = useState([]);
  const [feedbacks, setFeedbacks]  = useState([]);
  const [loading, setLoading]      = useState(true);
  const [filter, setFilter]        = useState('all');
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => {
    Promise.all([getMyPlansAsNutritionist(), getMyFeedbacksAsNutritionist()])
      .then(([p, f]) => { setPlans(p); setFeedbacks(f); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? plans : plans.filter((p) => p.status === filter);

  const counts = {
    all:            plans.length,
    Approved:       plans.filter((p) => p.status === 'Approved').length,
    PendingApproval:plans.filter((p) => p.status === 'PendingApproval').length,
    Rejected:       plans.filter((p) => p.status === 'Rejected').length,
  };

  const FILTERS = [
    { key: 'all',             label: 'All' },
    { key: 'Approved',        label: 'Approved' },
    { key: 'PendingApproval', label: 'Pending' },
    { key: 'Rejected',        label: 'Rejected' },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Plans</h1>
        <p className="text-slate-500 mt-2">All nutrition plans you have created</p>
      </header>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTERS.map(({ key, label }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              filter === key
                ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                : 'bg-white text-slate-600 border-transparent hover:bg-slate-50'
            }`}>
            {label}
            <span className="ml-1.5 text-xs opacity-60">({counts[key] ?? 0})</span>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <LayoutList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No plans found</p>
            <p className="text-sm mt-1">Create a plan from the Create Plan page</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((plan) => (
              <div key={plan.id} className="border-b border-slate-100 last:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors">
                <div className="mb-3 sm:mb-0 flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 truncate">{plan.title}</h4>
                    {plan.isPredefined && (
                      <span className="flex-shrink-0 text-xs font-medium bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                        Predefined
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-1">{plan.content}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    {new Date(plan.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    {plan.clientId && <span className="ml-2">· Assigned to client</span>}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <StatusBadge status={plan.status} />
                  {plan.status === 'Rejected' && plan.rejectionReason && (
                    <p className="text-xs text-red-500 max-w-xs">{plan.rejectionReason}</p>
                  )}
                  {(() => {
                    const planFeedbacks = feedbacks.filter(f => f.nutritionPlanId === plan.id);
                    if (planFeedbacks.length === 0) return null;
                    return (
                      <button onClick={() => setExpandedPlan(expandedPlan === plan.id ? null : plan.id)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {planFeedbacks.length}
                        {expandedPlan === plan.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    );
                  })()}
                </div>
              </div>

              {/* Feedbacks panel */}
              {expandedPlan === plan.id && (() => {
                const planFeedbacks = feedbacks.filter(f => f.nutritionPlanId === plan.id);
                return (
                  <div className="px-5 pb-5 space-y-3">
                    {planFeedbacks.map(fb => (
                      <div key={fb.id} className="bg-slate-50 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <StarDisplay rating={fb.rating} />
                          <span className="text-xs text-slate-400">
                            {new Date(fb.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                        {fb.comment && <p className="text-sm text-slate-600">{fb.comment}</p>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagePlans;
