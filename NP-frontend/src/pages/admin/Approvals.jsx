import { useState, useEffect } from 'react';
import { Check, X, FileText, BookOpen, CheckSquare, Loader2, CreditCard } from 'lucide-react';
import { getPendingPlans, getPendingPosts, approvePlan, rejectPlan, approvePost, rejectPost, getPendingPayments, approvePayment } from '../../services/api';

const TabButton = ({ icon: Icon, label, active, onClick }) => (
  <button onClick={onClick}
    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-slate-600 border border-transparent hover:bg-slate-50'}`}>
    <Icon className="w-4 h-4 mr-2" />{label}
  </button>
);

const RejectModal = ({ label, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="font-bold text-slate-900 mb-4">Reject {label}</h3>
        <textarea value={reason} onChange={(e) => setReason(e.target.value)}
          placeholder="Reason for rejection..." rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none mb-4" />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
          <button onClick={() => onConfirm(reason)} disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}Reject
          </button>
        </div>
      </div>
    </div>
  );
};

const ApprovalItem = ({ title, subtitle, date, onApprove, onReject, actionId, id }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
    <div className="mb-4 sm:mb-0">
      <h4 className="font-semibold text-slate-900 text-lg">{title}</h4>
      <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
      <p className="text-xs text-slate-400 mt-1">Submitted: {date}</p>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0">
      <button onClick={() => onApprove(id)} disabled={!!actionId}
        className="flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
        {actionId === id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
        Approve
      </button>
      <button onClick={() => onReject(id)} disabled={!!actionId}
        className="flex items-center px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg text-sm font-medium transition-colors">
        <X className="w-4 h-4 mr-2" />Reject
      </button>
    </div>
  </div>
);

const AdminApprovals = () => {
  const [plans, setPlans]       = useState([]);
  const [posts, setPosts]       = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [actionId, setActionId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [activeTab, setActiveTab] = useState('payments');

  useEffect(() => {
    Promise.all([getPendingPlans(), getPendingPosts(), getPendingPayments()])
      .then(([p, po, pay]) => { setPlans(p); setPosts(po); setPayments(pay); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleApprovePayment = async (id) => {
    setActionId(id);
    try { await approvePayment(id); setPayments((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { console.error(e); } finally { setActionId(null); }
  };

  const handleApprovePlan = async (id) => {
    setActionId(id);
    try { await approvePlan(id); setPlans((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { console.error(e); } finally { setActionId(null); }
  };

  const handleApprovePost = async (id) => {
    setActionId(id);
    try { await approvePost(id); setPosts((prev) => prev.filter((p) => p.id !== id)); }
    catch (e) { console.error(e); } finally { setActionId(null); }
  };

  const handleRejectConfirm = async (reason) => {
    setActionId(rejectTarget.id);
    try {
      if (rejectTarget.type === 'plan') {
        await rejectPlan(rejectTarget.id, reason);
        setPlans((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      } else {
        await rejectPost(rejectTarget.id, reason);
        setPosts((prev) => prev.filter((p) => p.id !== rejectTarget.id));
      }
      setRejectTarget(null);
    } catch (e) { console.error(e); } finally { setActionId(null); }
  };

  const formatDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto">
      {rejectTarget && (
        <RejectModal
          label={rejectTarget.type === 'plan' ? 'Plan' : 'Article'}
          loading={!!actionId}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTarget(null)}
        />
      )}
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Approval Center</h1>
            <p className="text-slate-500 mt-2">Review and approve pending items</p>
          </header>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-8">
            <TabButton icon={CreditCard} label={`Payments (${payments.length})`} active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
            <TabButton icon={FileText}   label={`Plans (${plans.length})`}        active={activeTab === 'plans'}    onClick={() => setActiveTab('plans')} />
            <TabButton icon={BookOpen}   label={`Articles (${posts.length})`}     active={activeTab === 'articles'} onClick={() => setActiveTab('articles')} />
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6">
              {activeTab === 'plans' ? 'Pending Nutrition Plans' : 'Pending Articles'}
            </h3>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
            ) : activeTab === 'payments' ? (
              payments.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No pending payments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <ApprovalItem key={payment.id} id={payment.id}
                      title={`Payment — $${payment.amount} ${payment.currency.toUpperCase()}`}
                      subtitle={`Subscription ID: ${payment.subscriptionId?.slice(0, 8)}... • Status: ${payment.status}`}
                      date={formatDate(payment.createdAt)}
                      actionId={actionId}
                      onApprove={handleApprovePayment}
                      onReject={() => {}} />
                  ))}
                </div>
              )
            ) : activeTab === 'plans' ? (
              plans.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No pending plans</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => (
                    <ApprovalItem key={plan.id} id={plan.id}
                      title={plan.title}
                      subtitle={plan.isPredefined ? 'Predefined plan' : `Custom plan · ${plan.content?.slice(0, 60)}...`}
                      date={formatDate(plan.createdAt)}
                      actionId={actionId}
                      onApprove={handleApprovePlan}
                      onReject={(id) => setRejectTarget({ id, type: 'plan' })} />
                  ))}
                </div>
              )
            ) : (
              posts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No pending articles</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {posts.map((post) => (
                    <ApprovalItem key={post.id} id={post.id}
                      title={post.title}
                      subtitle={`By ${post.authorRole} · ${post.content?.slice(0, 60)}...`}
                      date={formatDate(post.createdAt)}
                      actionId={actionId}
                      onApprove={handleApprovePost}
                      onReject={(id) => setRejectTarget({ id, type: 'post' })} />
                  ))}
                </div>
              )
            )}
          </div>
    </div>
  );
};

export default AdminApprovals;
