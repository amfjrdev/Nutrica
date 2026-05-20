import { useEffect, useRef } from 'react';
import { Bell, CheckCheck, Loader2, BellOff } from 'lucide-react';

const TYPE_STYLES = {
  success: { bar: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  error:   { bar: 'bg-red-500',     badge: 'bg-red-100 text-red-700',         dot: 'bg-red-500' },
  warning: { bar: 'bg-amber-500',   badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  info:    { bar: 'bg-blue-500',    badge: 'bg-blue-100 text-blue-700',        dot: 'bg-blue-500' },
};

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

// ── Bell trigger button (used in sidebars) ────────────────────────────────────
export const NotificationBell = ({ unreadCount, onClick }) => (
  <button onClick={onClick}
    className="relative flex items-center px-4 py-3 mb-1 rounded-lg w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors duration-200">
    <Bell className="w-5 h-5 mr-3" />
    <span>Notifications</span>
    {unreadCount > 0 && (
      <span className="ml-auto min-w-[20px] h-5 px-1 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
        {unreadCount > 99 ? '99+' : unreadCount}
      </span>
    )}
  </button>
);

// ── Full panel (dropdown or inline section) ───────────────────────────────────
const NotificationPanel = ({ notifications, loading, unreadCount, markRead, markAllRead, onClose }) => {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!onClose) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div ref={panelRef}
      className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden flex flex-col"
      style={{ maxHeight: '480px' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-slate-700" />
          <h3 className="font-bold text-slate-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-emerald-600 transition-colors">
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Body */}
      <div className="overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <BellOff className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm font-medium">No notifications yet</p>
          </div>
        ) : (
          <ul>
            {notifications.map((n) => {
              const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
              return (
                <li key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`flex gap-3 px-5 py-4 border-b border-slate-50 last:border-0 transition-colors
                    ${n.isRead ? 'bg-white' : 'bg-slate-50 cursor-pointer hover:bg-emerald-50/40'}`}>

                  {/* color bar */}
                  <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${style.bar}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className={`text-sm font-semibold text-slate-900 leading-tight ${!n.isRead ? '' : 'font-medium'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase tracking-wide ${style.badge}`}>
                          {n.type}
                        </span>
                        {!n.isRead && (
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{n.message}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{timeAgo(n.createdAt)}</span>
                      <span>·</span>
                      <span>from {n.senderRole}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
