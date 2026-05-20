import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar, Clock, ChevronLeft, ChevronRight,
  Loader2, CheckCircle, XCircle, AlertCircle, X, Info,
} from 'lucide-react';
import {
  getAvailableSlots, requestAppointment,
  getMyAppointments, cancelAppointment, getClientAccess,
} from '../../services/api';

// ─── constants ────────────────────────────────────────────────────────────────
const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i); // 00 – 23

const STATUS_STYLE = {
  Approved:  'bg-emerald-100 text-emerald-700',
  Pending:   'bg-amber-100   text-amber-700',
  Rejected:  'bg-red-100     text-red-600',
  Cancelled: 'bg-slate-100   text-slate-500',
  Attended:  'bg-blue-100    text-blue-700',
};

const STATUS_ICON = {
  Approved:  <CheckCircle className="w-3.5 h-3.5" />,
  Pending:   <Clock        className="w-3.5 h-3.5" />,
  Rejected:  <XCircle      className="w-3.5 h-3.5" />,
  Cancelled: <XCircle      className="w-3.5 h-3.5" />,
  Attended:  <CheckCircle  className="w-3.5 h-3.5" />,
};

// ─── helpers ──────────────────────────────────────────────────────────────────
const addDays = (date, n) => {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
};

const startOfDay = (date) => {
  // Keep as local midnight — only used for calendar display/navigation,
  // not for building UTC slot keys (toUtcIso handles that separately).
  const d = new Date(date); d.setHours(0, 0, 0, 0); return d;
};

/** Build a UTC ISO string for a given local-date object + hour.
 *  We construct the date in UTC directly so the ISO string always
 *  matches what the server generates (pure UTC slots), regardless
 *  of the browser's local timezone. */
const toUtcIso = (localDate, hour) => {
  // Use Date.UTC so the resulting timestamp is always UTC midnight + hour,
  // not local-midnight + hour (which would be off by the TZ offset).
  const ms = Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    hour, 0, 0, 0,
  );
  return new Date(ms).toISOString();
};

const fmtShortDate = (d) =>
  d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const fmtWeekday = (d) =>
  d.toLocaleDateString('en-US', { weekday: 'short' });

const fmtHour = (h) =>
  `${String(h).padStart(2, '0')}:00`;

const fmtFull = (iso) =>
  new Date(iso).toLocaleString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

// ─── BookingModal ─────────────────────────────────────────────────────────────
const BookingModal = ({ slotIso, onConfirm, onCancel, loading }) => {
  const [notes, setNotes] = useState('');
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-slate-900 text-lg">Confirm Appointment</h3>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-emerald-50 rounded-xl p-4 mb-5 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <p className="font-semibold text-slate-900 text-sm">{fmtFull(slotIso)}</p>
        </div>

        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add notes for your nutritionist (optional)…"
          rows={3}
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none mb-5"
        />

        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium
                       text-slate-600 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={() => onConfirm(notes)} disabled={loading}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60
                       text-white rounded-lg text-sm font-medium transition-colors
                       flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({ toast }) => {
  if (!toast) return null;
  const isOk = toast.type === 'success';
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5
                     rounded-xl shadow-lg text-sm font-medium
                     ${isOk ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
      {isOk ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
      {toast.message}
    </div>
  );
};

// ─── Main page ────────────────────────────────────────────────────────────────
const ClientAppointments = () => {
  const [access,          setAccess]          = useState(null);
  const [availableSlots,  setAvailableSlots]  = useState([]);   // AvailableSlotDto[]
  const [myAppointments,  setMyAppointments]  = useState([]);   // AppointmentDto[]
  const [loading,         setLoading]         = useState(true);
  const [weekStart,       setWeekStart]       = useState(() => startOfDay(new Date()));
  const [selectedSlot,    setSelectedSlot]    = useState(null); // ISO string | null
  const [booking,         setBooking]         = useState(false);
  const [cancelling,      setCancelling]      = useState(null); // appointment id | null
  const [toast,           setToast]           = useState(null);
  const toastTimer = useRef(null);

  const showToast = (type, message) => {
    clearTimeout(toastTimer.current);
    setToast({ type, message });
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };

  // ── initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getClientAccess(), getMyAppointments()])
      .then(([acc, appts]) => {
        setAccess(acc);
        setMyAppointments(appts);
        if (acc?.nutritionistId)
          return getAvailableSlots(acc.nutritionistId).then(setAvailableSlots);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // ── derived sets (O(1) lookup) ───────────────────────────────────────────────
  // Available slots returned by the API — keyed by UTC ISO string.
  // The server returns { slotUtc: "2025-...Z" }, parse via new Date() to
  // normalise any formatting differences, then re-serialise to ISO.
  const availableSet = useMemo(
    () => new Set(availableSlots.map((s) => new Date(s.slotUtc).toISOString())),
    [availableSlots],
  );

  // Slots this client already has Pending or Approved
  const myActiveSet = useMemo(
    () => new Set(
      myAppointments
        .filter((a) => a.status === 'Pending' || a.status === 'Approved')
        .map((a) => new Date(a.scheduledAt).toISOString()),
    ),
    [myAppointments],
  );

  // Count of pending requests (for anti-spam UI hint)
  const pendingCount = useMemo(
    () => myAppointments.filter((a) => a.status === 'Pending').length,
    [myAppointments],
  );

  // ── calendar helpers ─────────────────────────────────────────────────────────
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const prevWeek = () => setWeekStart((w) => addDays(w, -7));
  const nextWeek = () => setWeekStart((w) => addDays(w, 7));

  const isPast = (day, hour) => {
    // Compare in UTC so past-detection is consistent with slot generation
    const slotMs = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate(), hour, 0, 0, 0);
    return slotMs <= Date.now();
  };

  const slotState = (day, hour) => {
    const iso = toUtcIso(day, hour);
    if (isPast(day, hour))          return 'past';
    if (myActiveSet.has(iso))       return 'mine';
    if (availableSet.has(iso))      return 'available';
    return 'taken';
  };

  // ── booking ──────────────────────────────────────────────────────────────────
  const handleSlotClick = (day, hour) => {
    if (slotState(day, hour) !== 'available') return;
    if (pendingCount >= 3) {
      showToast('error', 'You already have 3 pending requests. Cancel one before booking again.');
      return;
    }
    setSelectedSlot(toUtcIso(day, hour));
  };

  const handleBookingConfirm = async (notes) => {
    if (!selectedSlot || !access?.nutritionistId) return;
    setBooking(true);
    try {
      await requestAppointment(access.nutritionistId, selectedSlot, notes || null);
      const [slots, appts] = await Promise.all([
        getAvailableSlots(access.nutritionistId),
        getMyAppointments(),
      ]);
      setAvailableSlots(slots);
      setMyAppointments(appts);
      setSelectedSlot(null);
      showToast('success', 'Request sent! Your nutritionist will confirm shortly.');
    } catch (e) {
      // Surface the exact server message for 409 (slot taken / too many pending)
      // and 403 (premium required), falling back to a generic message.
      const msg = e?.detail || e?.message || e?.title || 'Failed to book appointment. Please try again.';
      showToast('error', msg);
      // Refresh available slots so the calendar reflects the current server state
      if (access?.nutritionistId) {
        getAvailableSlots(access.nutritionistId).then(setAvailableSlots).catch(() => {});
      }
    } finally {
      setBooking(false);
    }
  };

  const handleCancel = async (id) => {
    setCancelling(id);
    try {
      await cancelAppointment(id);
      setMyAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, status: 'Cancelled' } : a),
      );
      if (access?.nutritionistId) {
        const slots = await getAvailableSlots(access.nutritionistId);
        setAvailableSlots(slots);
      }
      showToast('success', 'Appointment cancelled.');
    } catch {
      showToast('error', 'Failed to cancel appointment.');
    } finally {
      setCancelling(null);
    }
  };

  // ── render guards ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!access?.nutritionistId) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">No Nutritionist Assigned Yet</h2>
        <p className="text-slate-500">
          Your nutritionist will be assigned after your subscription is activated. Check back soon.
        </p>
      </div>
    );
  }

  const upcoming = myAppointments.filter((a) => a.status === 'Pending' || a.status === 'Approved');
  const history  = myAppointments.filter((a) => a.status !== 'Pending' && a.status !== 'Approved');

  // ── render ───────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-6xl mx-auto">
      <Toast toast={toast} />

      {selectedSlot && (
        <BookingModal
          slotIso={selectedSlot}
          loading={booking}
          onConfirm={handleBookingConfirm}
          onCancel={() => setSelectedSlot(null)}
        />
      )}

      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-slate-500 mt-1">Pick any available slot to request a session with your nutritionist</p>
      </header>

      {/* Anti-spam hint */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 bg-amber-50 border border-amber-200
                        rounded-xl text-sm text-amber-700">
          <Info className="w-4 h-4 flex-shrink-0" />
          You have <strong>{pendingCount}/3</strong> pending request{pendingCount > 1 ? 's' : ''}.
          {pendingCount >= 3 && ' Cancel one to book a new slot.'}
        </div>
      )}

      {/* ── Calendar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-8 overflow-hidden">

        {/* Week navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <button onClick={prevWeek}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-slate-900 text-sm">
            {fmtShortDate(weekDays[0])} – {fmtShortDate(weekDays[6])}
          </span>
          <button onClick={nextWeek}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Grid — scrollable vertically */}
        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr>
                {/* time column header */}
                <th className="w-14 py-3 border-b border-slate-100" />
                {weekDays.map((day, i) => (
                  <th key={i}
                    className="py-3 px-1 text-center font-medium text-slate-700 border-b border-slate-100 min-w-[80px]">
                    <div className="font-semibold">{fmtWeekday(day)}</div>
                    <div className="text-slate-400 font-normal">{fmtShortDate(day)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_HOURS.map((hour) => (
                <tr key={hour} className="border-t border-slate-50 hover:bg-slate-50/50">
                  {/* time label */}
                  <td className="py-1 pr-3 text-right text-slate-400 font-medium whitespace-nowrap">
                    {fmtHour(hour)}
                  </td>

                  {weekDays.map((day, di) => {
                    const state = slotState(day, hour);

                    const base = 'rounded-md py-1.5 mx-0.5 text-center font-medium transition-all select-none ';
                    const styles = {
                      past:      base + 'text-slate-200 cursor-not-allowed',
                      taken:     base + 'bg-slate-100 text-slate-300 cursor-not-allowed',
                      mine:      base + 'bg-amber-100 text-amber-700 cursor-default',
                      available: base + 'bg-emerald-50 text-emerald-600 border border-emerald-200 ' +
                                        'hover:bg-emerald-500 hover:text-white hover:border-emerald-500 cursor-pointer',
                    };

                    const labels = {
                      past:      '·',
                      taken:     'Taken',
                      mine:      'Booked',
                      available: 'Free',
                    };

                    return (
                      <td key={di} className="py-0.5 px-0.5">
                        <div
                          className={styles[state]}
                          onClick={() => state === 'available' && handleSlotClick(day, hour)}
                          title={state === 'available' ? `Book ${fmtHour(hour)} on ${fmtShortDate(day)}` : undefined}
                        >
                          {labels[state]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-5 px-6 py-3 border-t border-slate-100 text-xs text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200 inline-block" />
            Available — click to book
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-100 inline-block" />
            Your booking
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-100 inline-block" />
            Taken / past
          </span>
        </div>
      </div>

      {/* ── Upcoming ── */}
      {upcoming.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((appt) => (
              <div key={appt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between
                           p-4 bg-slate-50 rounded-xl gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700
                                  flex items-center justify-center font-bold text-sm flex-shrink-0">
                    N
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">
                      {new Date(appt.scheduledAt).toLocaleDateString('en-US',
                        { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(appt.scheduledAt).toLocaleTimeString([],
                        { hour: '2-digit', minute: '2-digit' })}
                      {appt.notes && ` · ${appt.notes}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold
                                    rounded-full uppercase tracking-wide ${STATUS_STYLE[appt.status] ?? ''}`}>
                    {STATUS_ICON[appt.status]}
                    {appt.status}
                  </span>
                  {appt.status === 'Pending' && (
                    <button
                      onClick={() => handleCancel(appt.id)}
                      disabled={cancelling === appt.id}
                      className="text-xs text-red-500 hover:text-red-700 font-medium
                                 disabled:opacity-50 flex items-center gap-1 transition-colors">
                      {cancelling === appt.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <X className="w-3 h-3" />}
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── History ── */}
      {history.length > 0 && (
        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">History</h2>
          <div className="space-y-3">
            {history.map((appt) => (
              <div key={appt.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between
                           p-4 bg-slate-50 rounded-xl gap-3">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {new Date(appt.scheduledAt).toLocaleDateString('en-US',
                      { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(appt.scheduledAt).toLocaleTimeString([],
                      { hour: '2-digit', minute: '2-digit' })}
                    {appt.rejectionReason && ` · Reason: ${appt.rejectionReason}`}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold
                                  rounded-full uppercase tracking-wide ${STATUS_STYLE[appt.status] ?? ''}`}>
                  {STATUS_ICON[appt.status]}
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {myAppointments.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm text-slate-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No appointments yet — pick any free slot above to get started</p>
        </div>
      )}
    </div>
  );
};

export default ClientAppointments;
