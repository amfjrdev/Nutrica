import { useState, useEffect, useRef } from 'react';
import {
  Check, X, Clock, Calendar, Loader2,
  CheckCircle, XCircle, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import { getNutritionistDashboard, approveAppointment, rejectAppointment } from '../../services/api';

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });

const fmtTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const STATUS_STYLE = {
  Approved:  'bg-emerald-100 text-emerald-700',
  Pending:   'bg-amber-100   text-amber-700',
  Rejected:  'bg-red-100     text-red-600',
  Cancelled: 'bg-slate-100   text-slate-500',
  Attended:  'bg-blue-100    text-blue-700',
};

// ─── RejectModal ──────────────────────────────────────────────────────────────
const RejectModal = ({ onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Reason for Rejection</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why you are rejecting this request…"
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none mb-4"
        />
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium
                       text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!reason.trim() || loading}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 disabled:opacity-60
                       text-white rounded-lg text-sm font-medium transition-colors
                       flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Reject
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const ok = toast.type === 'success';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
                     rounded-xl shadow-lg text-sm font-medium
                     ${ok ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {toast.message}
    </div>
  );
};

// ─── PendingCard ──────────────────────────────────────────────────────────────
const PendingCard = ({ appt, onApprove, onReject, busy }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-5 hover:border-emerald-200
                  transition-colors flex flex-col sm:flex-row sm:items-center gap-4">
    {/* Client avatar + name */}
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center
                      justify-center font-bold text-sm flex-shrink-0">
        {appt.clientFirstName?.[0]?.toUpperCase() ?? 'C'}
      </div>
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 truncate">
          {appt.clientFirstName} {appt.clientLastName}
        </p>
        <p className="text-xs text-slate-400 truncate">
          {appt.notes || 'No notes provided'}
        </p>
      </div>
    </div>

    {/* Date + time */}
    <div className="flex flex-col gap-0.5 text-sm text-slate-600 flex-shrink-0">
      <span className="flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-slate-400" />
        {fmtDate(appt.scheduledAt)}
      </span>
      <span className="flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        {fmtTime(appt.scheduledAt)}
      </span>
    </div>

    {/* Actions */}
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={() => onApprove(appt.id)}
        disabled={busy}
        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600
                   disabled:opacity-60 text-white rounded-lg text-sm font-medium
                   transition-colors shadow-sm">
        {busy === appt.id
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Check className="w-4 h-4" />}
        Accept
      </button>
      <button
        onClick={() => onReject(appt.id)}
        disabled={!!busy}
        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200
                   hover:bg-slate-50 disabled:opacity-60 text-slate-700 rounded-lg
                   text-sm font-medium transition-colors">
        <X className="w-4 h-4" />
        Reject
      </button>
    </div>
  </div>
);

// ─── ApprovedRow ──────────────────────────────────────────────────────────────
const ApprovedRow = ({ appt }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between
                  p-4 bg-slate-50 rounded-xl gap-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center
                      justify-center font-bold text-sm flex-shrink-0">
        {appt.clientFirstName?.[0]?.toUpperCase() ?? 'C'}
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-sm">
          {appt.clientFirstName} {appt.clientLastName}
        </p>
        <p className="text-xs text-slate-500">
          {fmtDate(appt.scheduledAt)} · {fmtTime(appt.scheduledAt)}
          {appt.notes && ` · ${appt.notes}`}
        </p>
      </div>
    </div>
    <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full
                      uppercase tracking-wide flex-shrink-0 ${STATUS_STYLE[appt.status] ?? ''}`}>
      {appt.status === 'Approved' && <CheckCircle className="w-3.5 h-3.5" />}
      {appt.status === 'Attended' && <CheckCircle className="w-3.5 h-3.5" />}
      {appt.status}
    </span>
  </div>
);

// ─── HistoryRow ───────────────────────────────────────────────────────────────
const HistoryRow = ({ appt }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between
                  p-4 bg-slate-50 rounded-xl gap-3">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center
                      justify-center font-bold text-sm flex-shrink-0">
        <User className="w-4 h-4" />
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-sm">
          {appt.clientFirstName} {appt.clientLastName}
        </p>
        <p className="text-xs text-slate-500">
          {fmtDate(appt.scheduledAt)} · {fmtTime(appt.scheduledAt)}
          {appt.rejectionReason && ` · Reason: ${appt.rejectionReason}`}
        </p>
      </div>
    </div>
    <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full
                      uppercase tracking-wide flex-shrink-0 ${STATUS_STYLE[appt.status] ?? ''}`}>
      {appt.status}
    </span>
  </div>
);

// ─── Main page ────────────────────────────────────────────────────────────────
const NutritionistAppointments = () => {
  const [appointments,    setAppointments]    = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState(null);
  const [busy,            setBusy]            = useState(null); // id being actioned
  const [rejectTargetId,  setRejectTargetId]  = useState(null);
  const [toast,           setToast]           = useState(null);
  const [historyOpen,     setHistoryOpen]     = useState(false);
  const toastTimer = useRef(null);

  const showToast = (type, message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const load = () => {
    setLoading(true);
    setError(null);
    getNutritionistDashboard()
      .then(setAppointments)
      .catch((e) => setError(e?.detail || e?.title || 'Failed to load appointments.'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleApprove = async (id) => {
    setBusy(id);
    try {
      await approveAppointment(id);
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: 'Approved' } : a));
      showToast('success', 'Appointment accepted.');
    } catch (e) {
      showToast('error', e?.detail || 'Failed to accept appointment.');
    } finally {
      setBusy(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    setBusy(rejectTargetId);
    try {
      await rejectAppointment(rejectTargetId, reason);
      setAppointments((prev) =>
        prev.map((a) => a.id === rejectTargetId ? { ...a, status: 'Rejected' } : a));
      setRejectTargetId(null);
      showToast('success', 'Appointment rejected.');
    } catch (e) {
      showToast('error', e?.detail || 'Failed to reject appointment.');
    } finally {
      setBusy(null);
    }
  };

  const pending  = appointments.filter((a) => a.status === 'Pending');
  const approved = appointments.filter((a) => a.status === 'Approved' || a.status === 'Attended');
  const history  = appointments.filter((a) => a.status === 'Rejected' || a.status === 'Cancelled');

  return (
    <div className="max-w-5xl mx-auto">
      <Toast toast={toast} />

      {rejectTargetId && (
        <RejectModal
          loading={busy === rejectTargetId}
          onConfirm={handleRejectConfirm}
          onCancel={() => setRejectTargetId(null)}
        />
      )}

      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-1">Manage client appointment requests and sessions</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg
                     text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors
                     disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Refresh
        </button>
      </header>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl
                        text-sm text-red-600 flex items-center gap-2">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">

          {/* ── Pending requests ── */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              Incoming Requests
              {pending.length > 0 && (
                <span className="bg-amber-100 text-amber-700 text-xs font-bold
                                 px-2 py-0.5 rounded-full">
                  {pending.length}
                </span>
              )}
            </h2>

            {pending.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No pending requests</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pending.map((appt) => (
                  <PendingCard
                    key={appt.id}
                    appt={appt}
                    busy={busy}
                    onApprove={handleApprove}
                    onReject={(id) => setRejectTargetId(id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Approved / upcoming ── */}
          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-900 mb-5 flex items-center gap-2">
              Upcoming Sessions
              {approved.length > 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-xs font-bold
                                 px-2 py-0.5 rounded-full">
                  {approved.length}
                </span>
              )}
            </h2>

            {approved.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">No upcoming sessions</p>
              </div>
            ) : (
              <div className="space-y-3">
                {approved.map((appt) => (
                  <ApprovedRow key={appt.id} appt={appt} />
                ))}
              </div>
            )}
          </section>

          {/* ── History (collapsible) ── */}
          {history.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <button
                onClick={() => setHistoryOpen((o) => !o)}
                className="w-full flex items-center justify-between text-base font-bold
                           text-slate-900 hover:text-slate-700 transition-colors">
                <span className="flex items-center gap-2">
                  History
                  <span className="bg-slate-100 text-slate-500 text-xs font-bold
                                   px-2 py-0.5 rounded-full">
                    {history.length}
                  </span>
                </span>
                {historyOpen
                  ? <ChevronUp className="w-4 h-4 text-slate-400" />
                  : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {historyOpen && (
                <div className="mt-5 space-y-3">
                  {history.map((appt) => (
                    <HistoryRow key={appt.id} appt={appt} />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Empty state */}
          {appointments.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12
                            text-center shadow-sm text-slate-400">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No appointments yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NutritionistAppointments;
