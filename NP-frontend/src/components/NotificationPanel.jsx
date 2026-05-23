import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, Loader2, BellOff, X } from 'lucide-react';

const TYPE_STYLES = {
  success: { bar: 'bg-emerald-500', dot: 'bg-emerald-500', icon: 'text-emerald-600 bg-emerald-50' },
  error:   { bar: 'bg-red-500',     dot: 'bg-red-500',     icon: 'text-red-600 bg-red-50' },
  warning: { bar: 'bg-amber-500',   dot: 'bg-amber-500',   icon: 'text-amber-600 bg-amber-50' },
  info:    { bar: 'bg-blue-500',    dot: 'bg-blue-500',    icon: 'text-blue-600 bg-blue-50' },
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

const NotificationPanel = ({ notifications, loading, unreadCount, markRead, markAllRead }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-colors"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden"
          style={{ maxHeight: '480px' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors">
                  <CheckCheck className="w-3.5 h-3.5" />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <BellOff className="w-8 h-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => {
                  const style = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                  return (
                    <li key={n.id}
                      onClick={() => !n.isRead && markRead(n.id)}
                      className={`flex gap-3 px-4 py-3 border-b border-slate-50 last:border-0 transition-colors
                        ${n.isRead ? 'bg-white' : 'bg-slate-50 cursor-pointer hover:bg-emerald-50/50'}`}>
                      <div className={`w-1 rounded-full flex-shrink-0 self-stretch ${style.bar}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <p className="text-sm font-semibold text-slate-900 leading-tight truncate">{n.title}</p>
                          {!n.isRead && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${style.dot}`} />}
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed mb-1">{n.message}</p>
                        <span className="text-[10px] text-slate-400">{timeAgo(n.createdAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
