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
      borderLeft: `3.5px solid ${n.border}`,
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
          {n.actions?.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 7 }}>
              {n.actions.includes('markPaid') && (
                <ActionBtn icon={<MdPayment size={11} />} label={marking ? 'Marking…' : 'Mark Paid'} color="#10b981" onClick={handleMarkPaid} />
              )}
              {n.actions.includes('sendReminder') && n.customerId && (
                <ActionBtn icon={<MdSend size={11} />} label="Notify" color="#25d366" onClick={() => onOpenComm(n.customerId, n.loanId, 'overdue_reminder')} />
              )}
              {n.actions.includes('viewCustomer') && n.customerId && (
                <ActionBtn icon={<MdPerson size={11} />} label="Customer" color="#3b82f6" onClick={() => { navigate('/customers'); onRead(n.id); }} />
              )}
              {n.actions.includes('viewLoan') && n.loanId && (
                <ActionBtn icon={<MdAccountBalance size={11} />} label="Loan" color="#6366f1" onClick={() => { navigate('/loans'); onRead(n.id); }} />
              )}
              <ActionBtn icon={<MdCheckCircle size={11} />} label="Read" color="#9ca3af" onClick={() => onRead(n.id)} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main NotificationBell Component ─────────────────────── */
const NotificationBell = ({ payments = [] }) => {
  const navigate = useNavigate();
  const dropRef = useRef(null);

  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [readIds, setReadIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_notif_read') || '[]'); } catch { return []; }
  });
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('rc_notif_dismissed') || '[]'); } catch { return []; }
  });
  const [toasts, setToasts] = useState([]);
  const [allNotifs, setAllNotifs] = useState([]);

  // Modal for communication
  const [commModal, setCommModal] = useState({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' });

  const rebuildNotifs = useCallback(() => {
    const p = loanStore.getPayments();
    const l = loanStore.getLoans();
    const c = loanStore.getCustomers();
    const n = buildNotifications(p, l, c);
    setAllNotifs(n);
  }, []);

  useEffect(() => {
    rebuildNotifs();
    window.addEventListener('loanStoreUpdated', rebuildNotifs);
    return () => window.removeEventListener('loanStoreUpdated', rebuildNotifs);
  }, [rebuildNotifs]);

  // Save read/dismissed
  useEffect(() => { localStorage.setItem('rc_notif_read', JSON.stringify(readIds)); }, [readIds]);
  useEffect(() => { localStorage.setItem('rc_notif_dismissed', JSON.stringify(dismissedIds)); }, [dismissedIds]);

  // Outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [open]);

  // Auto-toast on urgent new notifs (overdue + today)
  useEffect(() => {
    const urgent = allNotifs.filter(n =>
      !dismissedIds.includes(n.id) && !readIds.includes(n.id) &&
      (n.category === 'overdue' || (n.category === 'emiDue' && n.title.includes('Today')))
    ).slice(0, 2);
    if (urgent.length && !open) {
      setToasts(urgent.map(n => ({ ...n, toastId: 'toast_' + n.id })));
      const t = setTimeout(() => setToasts([]), 6000);
      return () => clearTimeout(t);
    }
  }, [allNotifs]);

  const handleRead = (id) => setReadIds(prev => [...new Set([...prev, id])]);
  const handleDismiss = (id) => { setDismissedIds(prev => [...new Set([...prev, id])]); setToasts(p => p.filter(t => t.id !== id)); };
  const handleMarkAllRead = () => setReadIds(prev => [...new Set([...prev, ...visible.map(n => n.id)])]);
  const handleRestoreAll = () => { setDismissedIds([]); setReadIds([]); };

  const handleOpenComm = (customerId, loanId, templateKey = 'loan_statement') => {
    setCommModal({ open: true, customerId, loanId, templateKey });
    setOpen(false);
  };

  const visible = allNotifs.filter(n => !dismissedIds.includes(n.id));
  const unread = visible.filter(n => !readIds.includes(n.id));

  const filtered = visible
    .filter(n => tab === 'all' || n.category === tab)
    .filter(n => !search || n.message.toLowerCase().includes(search.toLowerCase()) || (n.customerName || '').toLowerCase().includes(search.toLowerCase()) || (n.loanName || '').toLowerCase().includes(search.toLowerCase()))
    .map(n => ({ ...n, isRead: readIds.includes(n.id) }));

  const urgentCount = unread.filter(n => n.category === 'overdue' || (n.category === 'emiDue' && n.title.includes('Today'))).length;

  const catCounts = {};
  NOTIF_CATEGORIES.forEach(c => {
    catCounts[c.key] = c.key === 'all' ? visible.length : visible.filter(n => n.category === c.key).length;
  });

  return (
    <>
      {/* ── Global Styles ── */}
      <style>{`
        @keyframes toastIn  { from { opacity:0; transform:translateX(60px) scale(0.92) } to { opacity:1; transform:translateX(0) scale(1) } }
        @keyframes notifIn  { from { opacity:0; transform:translateY(-6px) } to { opacity:1; transform:translateY(0) } }
        @keyframes bellRing { 0%,100%{transform:rotate(0)} 20%{transform:rotate(-18deg)} 40%{transform:rotate(18deg)} 60%{transform:rotate(-12deg)} 80%{transform:rotate(8deg)} }
        .nb-tab:hover { background: rgba(99,102,241,0.12) !important; }
        .nb-glass-scroll::-webkit-scrollbar { width: 4px; }
        .nb-glass-scroll::-webkit-scrollbar-track { background: transparent; }
        .nb-glass-scroll::-webkit-scrollbar-thumb { background: rgba(156,163,175,0.4); border-radius: 4px; }
      `}</style>

      {/* ── Toast Notifications (Glassmorphic) ── */}
      <ToastContainer toasts={toasts} onDismiss={handleDismiss} />

      {/* ── Communication Statement Modal ── */}
      {commModal.open && (
        <SendStatementModal
          isOpen={commModal.open}
          onClose={() => setCommModal({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' })}
          initialCustomerId={commModal.customerId}
          initialLoanId={commModal.loanId}
          initialTemplateKey={commModal.templateKey}
        />
      )}

      <div ref={dropRef} style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>

        {/* ── Bell Button ── */}
        <button
          className="btn btn-link p-0 position-relative"
          style={{ color: '#374151', outline: 'none', border: 'none' }}
          onClick={() => { rebuildNotifs(); setOpen(o => !o); }}
          title={`${unread.length} notifications`}
        >
          <MdNotifications
            size={26}
            style={{ animation: urgentCount > 0 && !open ? 'bellRing 1.2s ease infinite' : 'none' }}
          />
          {unread.length > 0 && (
            <span style={{
              position: 'absolute', top: -5, right: -6,
              background: urgentCount > 0 ? '#ef4444' : '#6366f1',
              color: '#fff', borderRadius: '50%',
              fontSize: '0.6rem', fontWeight: 800,
              minWidth: 18, height: 18, padding: '0 3px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #fff',
              boxShadow: urgentCount > 0 ? '0 0 0 2px rgba(239,68,68,0.3)' : 'none',
            }}>
              {unread.length > 99 ? '99+' : unread.length}
            </span>
          )}
        </button>

        {/* ── Dropdown Panel (Transparent / Frosted Glassmorphism) ── */}
        {open && (
          <div style={{
            position: 'fixed',
            top: 62, right: 12,
            width: 'min(92vw, 410px)',
            maxHeight: '88vh',
            background: 'rgba(255, 255, 255, 0.78)',
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

            {/* Header (Glass Gradient) */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.92) 0%, rgba(124, 58, 237, 0.88) 100%)',
              backdropFilter: 'blur(10px)',
              padding: '14px 16px 10px',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MdNotifications color="#fff" size={20} />
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>Notifications</span>
                  {urgentCount > 0 && (
                    <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 9, padding: '2px 7px', fontWeight: 800, letterSpacing: '0.5px' }}>
                      {urgentCount} URGENT
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {unread.length > 0 && (
                    <button onClick={handleMarkAllRead} title="Mark all as read" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: '#fff', fontSize: 10.5, fontWeight: 700, padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MdDoneAll size={13} /> All Read
                    </button>
                  )}
                  <button onClick={rebuildNotifs} title="Refresh" style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, color: '#fff', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <MdRefresh size={15} />
                  </button>
                  <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.18)', border: 'none', borderRadius: 8, color: '#fff', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <MdClose size={16} />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ position: 'relative' }}>
                <MdSearch size={15} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.7)' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search notifications, borrowers…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                    borderRadius: 10, padding: '6px 10px 6px 28px',
                    color: '#fff', fontSize: 12, outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Tabs (Glass Translucent) */}
            <div style={{
              display: 'flex', overflowX: 'auto', padding: '6px 8px 0',
              borderBottom: '1px solid rgba(229, 231, 235, 0.6)', gap: 2, flexShrink: 0,
              scrollbarWidth: 'none',
              background: 'rgba(248, 250, 252, 0.5)',
            }}>
              {NOTIF_CATEGORIES.map(c => (
                <button
                  key={c.key}
                  className="nb-tab"
                  onClick={() => setTab(c.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '5px 9px', borderRadius: '8px 8px 0 0',
                    border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                    fontSize: 11, fontWeight: 700,
                    background: tab === c.key ? 'rgba(79, 70, 229, 0.9)' : 'transparent',
                    color: tab === c.key ? '#fff' : '#4b5563',
                    transition: 'all 0.15s',
                    flexShrink: 0,
                  }}
                >
                  {c.icon} {c.label}
                  {catCounts[c.key] > 0 && (
                    <span style={{
                      background: tab === c.key ? 'rgba(255,255,255,0.3)' : 'rgba(229,231,235,0.8)',
                      color: tab === c.key ? '#fff' : '#1f2937',
                      borderRadius: 10, fontSize: 9, padding: '1px 5px', fontWeight: 800,
                    }}>{catCounts[c.key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="nb-glass-scroll" style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 20px', color: '#6b7280' }}>
                  <MdNotificationsNone size={44} style={{ opacity: 0.3, marginBottom: 8 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#374151' }}>All clear!</div>
                  <div style={{ fontSize: 12, marginTop: 4, color: '#6b7280' }}>No {tab !== 'all' ? tab : ''} notifications {search ? `matching "${search}"` : ''}</div>
                  {dismissedIds.length > 0 && (
                    <button onClick={handleRestoreAll} style={{ marginTop: 10, background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(229,231,235,0.8)', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#4b5563', cursor: 'pointer', fontWeight: 600 }}>
                      Restore dismissed
                    </button>
                  )}
                </div>
              ) : (
                filtered.map(n => (
                  <div key={n.id} style={{ opacity: n.isRead ? 0.6 : 1, transition: 'opacity 0.2s' }}>
                    <NotifCard
                      n={n}
                      onRead={handleRead}
                      onDismiss={handleDismiss}
                      navigate={navigate}
                      loanStoreRef={loanStore}
                      onOpenComm={handleOpenComm}
                    />
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div style={{
              padding: '8px 14px', borderTop: '1px solid rgba(229, 231, 235, 0.6)', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: 'rgba(249, 250, 251, 0.65)',
            }}>
              <span style={{ fontSize: 10.5, color: '#6b7280', fontWeight: 600 }}>
                {unread.length} unread · {visible.length} total
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {dismissedIds.length > 0 && (
                  <button onClick={handleRestoreAll} style={{ background: 'none', border: 'none', fontSize: 10.5, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline' }}>
                    Restore All
                  </button>
                )}
                <button
                  onClick={() => { navigate('/emi-payments'); setOpen(false); }}
                  style={{ background: 'none', border: 'none', fontSize: 10.5, color: '#4f46e5', cursor: 'pointer', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  View All <MdOpenInNew size={11} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationBell;
