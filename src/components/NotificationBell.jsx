import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MdNotifications, MdClose, MdCheckCircle, MdSearch, MdDoneAll,
  MdPayment, MdSend, MdPerson, MdAccountBalance, MdFilterList,
  MdNotificationsNone, MdOpenInNew, MdRefresh, MdEmail,
} from 'react-icons/md';
import { buildNotifications, NOTIF_CATEGORIES } from '../utils/notificationEngine';
import { formatIndianDate } from '../utils/dateUtils';
import { loanStore } from '../utils/loanStore';
import SendStatementModal from './SendStatementModal';

const fmtAmt = (a) => a != null ? '₹' + Number(a).toLocaleString('en-IN') : '';

/* ─── Toast Component (Translucent Glass) ─────────────────── */
export const ToastContainer = ({ toasts, onDismiss }) => (
  <div style={{
    position: 'fixed', top: 18, right: 18, zIndex: 99999,
    display: 'flex', flexDirection: 'column', gap: 10,
    pointerEvents: 'none',
    maxWidth: 'min(92vw, 360px)',
  }}>
    {toasts.map(t => (
      <div key={t.id} style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: `1px solid rgba(255, 255, 255, 0.6)`,
        borderLeft: `4px solid ${t.color}`,
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'flex-start', gap: 10,
        pointerEvents: 'all',
        animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <span style={{ fontSize: 20, flexShrink: 0, lineHeight: 1.2 }}>{t.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 13, color: t.color, marginBottom: 1 }}>{t.title}</div>
          <div style={{ fontSize: 11.5, color: '#1f2937', lineHeight: 1.4 }}>{t.message}</div>
          {t.amount && <div style={{ fontSize: 11, fontWeight: 800, color: '#4b5563', marginTop: 2 }}>{fmtAmt(t.amount)}</div>}
        </div>
        <button onClick={() => onDismiss(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, lineHeight: 1, flexShrink: 0 }}>
          <MdClose size={15} />
        </button>
      </div>
    ))}
  </div>
);

/* ─── Action Button (Translucent Tag) ─────────────────────── */
const ActionBtn = ({ icon, label, color, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: 4,
      background: `${color}18`, border: `1px solid ${color}35`,
      color, borderRadius: 6, padding: '3px 8px',
      fontSize: 10.5, fontWeight: 700, cursor: 'pointer',
      transition: 'all 0.15s',
      whiteSpace: 'nowrap',
      backdropFilter: 'blur(4px)',
    }}
    onMouseEnter={e => { e.currentTarget.style.background = `${color}30`; e.currentTarget.style.transform = 'translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.background = `${color}18`; e.currentTarget.style.transform = 'translateY(0)'; }}
  >
    {icon} {label}
  </button>
);

/* ─── Single Notification Card (Glassmorphic) ─────────────── */
const NotifCard = ({ n, onRead, onDismiss, navigate, loanStoreRef, onOpenComm }) => {
  const [marking, setMarking] = useState(false);

  const handleMarkPaid = () => {
    if (!n.paymentId) return;
    setMarking(true);
    loanStoreRef.markPaymentAsPaid(n.paymentId);
    onRead(n.id);
    setTimeout(() => setMarking(false), 600);
  };

  return (
    <div style={{
      margin: '4px 8px',
      padding: '10px 12px',
      borderRadius: 12,
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.6)',
      borderLeft: `3.5px solid ${n.border || '#6366f1'}`,
      boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
      transition: 'all 0.18s ease',
      animation: 'notifIn 0.25s ease',
    }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateX(2px)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.85)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateX(0)';
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.65)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0, marginTop: 1 }}>{n.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
            <div style={{ fontWeight: 800, fontSize: 12.5, color: n.color, lineHeight: 1.3 }}>{n.title}</div>
            <button onClick={() => onDismiss(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, flexShrink: 0, lineHeight: 1 }}><MdClose size={13} /></button>
          </div>
          <div style={{ fontSize: 12, color: '#1f2937', fontWeight: 600, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</div>
          {n.loanName && <div style={{ fontSize: 10.5, color: '#6b7280', marginTop: 1 }}>📋 {n.loanName}</div>}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {n.amount != null && <span style={{ fontSize: 11, fontWeight: 800, color: n.color }}>{fmtAmt(n.amount)}</span>}
            {n.dueDate && <span style={{ fontSize: 10, color: '#6b7280' }}>📅 {formatIndianDate(n.dueDate)}</span>}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
            {n.actions?.includes('markPaid') && (
              <ActionBtn icon={<MdPayment size={11} />} label={marking ? 'Marking…' : 'Mark Paid'} color="#10b981" onClick={handleMarkPaid} />
            )}
            {n.actions?.includes('sendReminder') && n.customerId && (
              <ActionBtn icon={<MdSend size={11} />} label="Notify" color="#25d366" onClick={() => onOpenComm(n.customerId, n.loanId, 'overdue_reminder')} />
            )}
            {n.actions?.includes('viewCustomer') && n.customerId && (
              <ActionBtn icon={<MdPerson size={11} />} label="Customer" color="#3b82f6" onClick={() => { navigate('/customers'); onRead(n.id); }} />
            )}
            {n.actions?.includes('viewLoan') && n.loanId && (
              <ActionBtn icon={<MdAccountBalance size={11} />} label="Loan" color="#6366f1" onClick={() => { navigate('/loans'); onRead(n.id); }} />
            )}
            <ActionBtn icon={<MdCheckCircle size={11} />} label="Read" color="#9ca3af" onClick={() => onRead(n.id)} />
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── NotificationBell Dropdown Panel ─────────────────────── */
const NotificationBell = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [allNotifs, setAllNotifs] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_read_notifs') || '[]'); } catch { return []; }
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_dismissed_notifs') || '[]'); } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rc_view_notifs') || 'cards';
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rc_view_notifs', mode);
  };

  const [commModal, setCommModal] = useState({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' });
  const dropRef = useRef(null);

  const rebuildNotifs = useCallback(() => {
    const notifs = buildNotifications();
    setAllNotifs(notifs);
  }, []);

  useEffect(() => {
    rebuildNotifs();
    window.addEventListener('loanStoreUpdated', rebuildNotifs);
    return () => window.removeEventListener('loanStoreUpdated', rebuildNotifs);
  }, [rebuildNotifs]);

  useEffect(() => {
    localStorage.setItem('rc_read_notifs', JSON.stringify(readIds));
  }, [readIds]);

  useEffect(() => {
    localStorage.setItem('rc_dismissed_notifs', JSON.stringify(dismissedIds));
  }, [dismissedIds]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleRead = (id) => {
    setReadIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const handleDismiss = (id) => {
    setDismissedIds(prev => prev.includes(id) ? prev : [...prev, id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleMarkAllRead = () => {
    setReadIds(allNotifs.map(n => n.id));
  };

  const handleRestoreAll = () => {
    setDismissedIds([]);
  };

  const handleOpenComm = (customerId, loanId, templateKey = 'loan_statement') => {
    setCommModal({ open: true, customerId, loanId, templateKey });
    setOpen(false);
  };

  const visible = allNotifs.filter(n => !dismissedIds.includes(n.id));
  const unreadCount = visible.filter(n => !readIds.includes(n.id)).length;
  
  const filtered = visible
    .filter(n => tab === 'all' || n.category === tab)
    .filter(n => !search || n.message.toLowerCase().includes(search.toLowerCase()) || (n.customerName || '').toLowerCase().includes(search.toLowerCase()))
    .map(n => ({ ...n, isRead: readIds.includes(n.id) }));

  const urgentCount = visible.filter(n => !readIds.includes(n.id) && n.category === 'overdue').length;

  return (
    <>
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(60px) scale(0.92) } to { opacity:1; transform:translateX(0) scale(1) } }
        @keyframes notifIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bellRing { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-18deg)} 40%{transform:rotate(18deg)} 60%{transform:rotate(-12deg)} 80%{transform:rotate(8deg)} }
        .nb-glass-scroll::-webkit-scrollbar { width: 4px; }
        .nb-glass-scroll::-webkit-scrollbar-track { background: transparent; }
        .nb-glass-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.4); border-radius: 4px; }
      `}</style>

      <ToastContainer toasts={toasts} onDismiss={handleDismiss} />

      {commModal.open && (
        <SendStatementModal
          isOpen={commModal.open}
          onClose={() => setCommModal({ ...commModal, open: false })}
          initialCustomerId={commModal.customerId}
          initialLoanId={commModal.loanId}
          initialTemplateKey={commModal.templateKey}
        />
      )}

      <div ref={dropRef} style={{ position: 'relative', display: 'inline-flex' }}>
        <button
          onClick={() => { rebuildNotifs(); setOpen(o => !o); }}
          style={{ background: 'none', border: 'none', color: '#374151', cursor: 'pointer', position: 'relative' }}
        >
          <MdNotifications size={26} style={{ animation: urgentCount > 0 && !open ? 'bellRing 1.2s ease infinite' : 'none' }} />
          {unreadCount > 0 && (
            <span style={{
              position: 'absolute', top: -2, right: -2,
              background: '#ef4444', color: '#fff', borderRadius: '50%',
              fontSize: '0.65rem', fontWeight: 800, width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {open && (
          <div style={{
            position: 'fixed',
            top: 62, right: 12,
            width: 'min(92vw, 420px)',
            maxHeight: '88vh',
            background: 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(24px) saturate(190%)',
            WebkitBackdropFilter: 'blur(24px) saturate(190%)',
            border: '1px solid rgba(255, 255, 255, 0.7)',
            borderRadius: 20,
            boxShadow: '0 24px 80px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.45)',
            zIndex: 99998,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            animation: 'notifIn 0.22s ease',
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Notifications</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ display: 'flex', background: 'rgba(255,255,255,0.22)', borderRadius: 8, padding: 2 }}>
                    <button
                      onClick={() => handleSetViewMode('table')}
                      title="Table List View"
                      style={{
                        background: viewMode === 'table' ? '#fff' : 'transparent',
                        color: viewMode === 'table' ? '#4f46e5' : '#fff',
                        border: 'none', borderRadius: 6, padding: '2px 5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <MdViewList size={14} />
                    </button>
                    <button
                      onClick={() => handleSetViewMode('cards')}
                      title="Cards Grid View"
                      style={{
                        background: viewMode === 'cards' ? '#fff' : 'transparent',
                        color: viewMode === 'cards' ? '#4f46e5' : '#fff',
                        border: 'none', borderRadius: 6, padding: '2px 5px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center',
                      }}
                    >
                      <MdViewModule size={14} />
                    </button>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} title="Mark all as read" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '4px 8px', cursor: 'pointer' }}>
                      <MdDoneAll size={13} />
                    </button>
                  )}
                  <button onClick={rebuildNotifs} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, color: '#fff', padding: '4px 6px', cursor: 'pointer' }}>
                    <MdRefresh size={15} />
                  </button>
                </div>
              </div>

              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: 10, padding: '6px 10px',
                  color: '#fff', fontSize: 12, outline: 'none',
                }}
              />
            </div>

            <div className="nb-glass-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#6b7280' }}>
                  <MdNotificationsNone size={44} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>All clear!</div>
                </div>
              ) : viewMode === 'table' ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                  <tbody>
                    {filtered.map(n => (
                      <tr key={n.id} style={{ borderBottom: '1px solid rgba(229, 231, 235, 0.6)', background: !n.isRead ? 'rgba(245, 247, 255, 0.6)' : 'transparent', opacity: n.isRead ? 0.65 : 1 }}>
                        <td style={{ padding: '8px 10px', verticalAlign: 'top', width: 28 }}><span style={{ fontSize: 15 }}>{n.icon}</span></td>
                        <td style={{ padding: '8px 6px', verticalAlign: 'top' }}>
                          <div style={{ fontWeight: 800, color: n.color || '#1f2937' }}>{n.title}</div>
                          <div style={{ color: '#4b5563', fontSize: 11 }}>{n.message}</div>
                        </td>
                        <td style={{ padding: '8px 10px', verticalAlign: 'top', textAlign: 'right' }}>
                          <button onClick={() => handleDismiss(n.id)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                filtered.map(n => (
                  <NotifCard key={n.id} n={n} onRead={handleRead} onDismiss={handleDismiss} navigate={navigate} loanStoreRef={loanStore} onOpenComm={handleOpenComm} />
                ))
              )}
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid rgba(229, 231, 235, 0.6)', background: 'rgba(249, 250, 251, 0.65)' }}>
               {dismissedIds.length > 0 && <button onClick={handleRestoreAll} style={{ background: 'none', border: 'none', fontSize: 10, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>Restore All</button>}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
