import React, { useState, useEffect, useRef } from 'react';
import { MdNotifications, MdCheckCircle, MdClose } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────── */
const getToday = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  const t = new Date(dateStr);
  const target = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  return Math.round((target - getToday()) / 86400000);
};

const fmtDate = (d) => {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtAmt = (a) => '₹' + Number(a).toLocaleString('en-IN');

/* ─── build notifications from transactions array ──── */
const buildNotifs = (txns) => {
  try {
    const notifs = [];

    txns.forEach((t) => {
      const paid = ['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status);
      const dueStr = t.dueDate || t.date;
      const diff = daysDiff(dueStr);
      const name = (t.name || '') + (t.lastName ? ' ' + t.lastName : '');

      if (paid) {
        notifs.push({
          id: 'suc_' + t._id, cat: 'success', urgent: false,
          icon: '✅', colorClass: 'text-emerald-500', borderClass: 'border-emerald-500', bgClass: 'bg-emerald-50',
          title: 'Payment Received',
          body: name + ' — ' + fmtAmt(t.amount),
          sub: t.emiPaidDate ? 'Paid: ' + fmtDate(t.emiPaidDate) : 'Entry: ' + fmtDate(t.date),
          time: t.emiPaidDate || t.date,
        });
        return;
      }

      if (diff !== null && diff < 0) {
        notifs.push({
          id: 'del_' + t._id, cat: 'delayed', urgent: true,
          icon: '⚠️', colorClass: 'text-rose-500', borderClass: 'border-rose-500', bgClass: 'bg-rose-50',
          title: 'Overdue by ' + Math.abs(diff) + ' day' + (Math.abs(diff) > 1 ? 's' : ''),
          body: name + ' — ' + fmtAmt(t.amount),
          sub: 'Was due ' + fmtDate(dueStr),
          time: dueStr,
        });
        return;
      }

      if (diff !== null && diff >= 0 && diff <= 14) {
        var when = diff === 0 ? 'Today!' : diff === 1 ? 'Tomorrow!' : 'in ' + diff + ' days';
        notifs.push({
          id: 'up_' + t._id, cat: 'upcoming', urgent: diff <= 2,
          icon: diff <= 2 ? '🔔' : '📅',
          colorClass: diff <= 2 ? 'text-amber-500' : 'text-indigo-500',
          borderClass: diff <= 2 ? 'border-amber-500' : 'border-indigo-500',
          bgClass: diff <= 2 ? 'bg-amber-50' : 'bg-indigo-50',
          title: 'Due ' + when,
          body: name + ' — ' + fmtAmt(t.amount),
          sub: 'Due Date: ' + fmtDate(dueStr),
          time: dueStr,
        });
        return;
      }

      if (!paid) {
        notifs.push({
          id: 'pen_' + t._id, cat: 'pending', urgent: false,
          icon: '🕐', colorClass: 'text-amber-500', borderClass: 'border-amber-500', bgClass: 'bg-amber-50',
          title: 'Pending Payment',
          body: name + ' — ' + fmtAmt(t.amount),
          sub: dueStr ? 'Due: ' + fmtDate(dueStr) : 'No due date',
          time: dueStr || t.date,
        });
      }
    });

    notifs.sort((a, b) => {
      if (a.urgent && !b.urgent) return -1;
      if (!a.urgent && b.urgent) return 1;
      return new Date(b.time || 0) - new Date(a.time || 0);
    });

    return notifs;
  } catch (e) {
    console.error('NotificationBell error:', e);
    return [];
  }
};

const TABS = ['all', 'pending', 'success', 'delayed', 'upcoming'];
const TAB_LABELS = { all: 'All', pending: 'Pending', success: 'Success', delayed: 'Delayed', upcoming: 'Upcoming' };

const NotificationBell = ({ transactions = [] }) => {
  const { userData, updateUserData } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const dismissed = userData?.dismissedNotifications || [];
  const [tab, setTab] = useState('all');
  const dropRef = useRef(null);

  const reload = () => {
    setNotifs(buildNotifs(transactions));
  };

  useEffect(() => {
    reload();
  }, [transactions]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const saveDis = async (arr) => {
    try {
      await updateUserData({ dismissedNotifications: arr });
    } catch (err) {
      console.error('Failed to save dismissed notifications:', err);
    }
  };

  const visible = notifs.filter(n => dismissed.indexOf(n.id) === -1);
  const filtered = tab === 'all' ? visible : visible.filter(n => n.cat === tab);
  const urgentCount = visible.filter(n => n.urgent).length;
  const totalCount = visible.length;

  return (
    <div ref={dropRef} className="relative inline-flex items-center">
      {/* Bell Button */}
      <button
        onClick={() => { reload(); setOpen(!open); }}
        className="p-2.5 text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-primary transition-all relative"
      >
        <MdNotifications size={22} />
        {totalCount > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center text-[10px] font-bold text-white rounded-full border-2 border-white ${urgentCount > 0 ? 'bg-rose-500' : 'bg-primary'}`}>
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-14 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-premium border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2">
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MdNotifications className="text-white" size={18} />
              <span className="text-white font-bold text-sm">Notifications</span>
              {urgentCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter animate-pulse">
                  {urgentCount} Urgent
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => saveDis(notifs.map(n => n.id))}
                className="text-[10px] font-bold text-white/80 hover:text-white uppercase tracking-wider"
              >
                Clear
              </button>
              <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
                <MdClose size={18} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex overflow-x-auto px-2 pt-2 gap-1 border-b border-gray-50 bg-gray-50/30">
            {TABS.map(k => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-t-lg transition-all whitespace-nowrap ${tab === k ? 'bg-white text-primary' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {TAB_LABELS[k]}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <MdCheckCircle size={40} className="mx-auto text-emerald-100 mb-2" />
                <p className="text-sm font-bold text-gray-900">All clear!</p>
                <p className="text-xs text-gray-400">No notifications to show.</p>
              </div>
            ) : (
              filtered.map(n => (
                <div 
                  key={n.id} 
                  className={`mx-3 my-2 p-3 rounded-xl border-l-4 transition-all hover:translate-x-1 ${n.bgClass} ${n.borderClass}`}
                >
                  <div className="flex gap-3">
                    <span className="text-xl flex-shrink-0">{n.icon}</span>
                    <div className="flex-grow min-w-0">
                      <p className={`text-[10px] font-black uppercase tracking-wider mb-0.5 ${n.colorClass}`}>{n.title}</p>
                      <p className="text-xs font-bold text-gray-800 truncate">{n.body}</p>
                      <p className="text-[10px] text-gray-400 mt-1">{n.sub}</p>
                    </div>
                    <button 
                      onClick={() => saveDis([...dismissed, n.id])}
                      className="text-gray-300 hover:text-gray-500"
                    >
                      <MdClose size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-4 py-2 border-t border-gray-100">
             <p className="text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest">
               Showing {filtered.length} of {totalCount} notifications
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
