import { getLocalDateString, formatIndianDate } from './dateUtils';

const today = () => getLocalDateString();

const daysDiff = (dateStr) => {
  if (!dateStr) return null;
  const todayMs = new Date(today()).getTime();
  const targetMs = new Date(dateStr).getTime();
  return Math.round((targetMs - todayMs) / 86400000);
};

const fmtAmt = (a) => '₹' + Number(a || 0).toLocaleString('en-IN');

let _idCounter = 0;
const uid = (prefix) => `${prefix}_${++_idCounter}_${Date.now()}`;

/**
 * Build all smart notifications from loanStore & bankStore data
 * @param {Array} payments
 * @param {Array} loans
 * @param {Array} customers
 * @returns {Array} notifications
 */
export const buildNotifications = (payments = [], loans = [], customers = []) => {
  const notifs = [];
  const todayStr = today();

  // ── 1. Overdue EMI alerts ──────────────────────────────────
  payments
    .filter(p => p.status !== 'Paid' && p.dueDate && p.dueDate < todayStr)
    .forEach(p => {
      const diff = Math.abs(daysDiff(p.dueDate));
      notifs.push({
        id: uid('overdue'),
        category: 'overdue',
        priority: 1,
        icon: '🚨',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.08)',
        border: '#ef4444',
        title: `Overdue EMI — ${diff} day${diff > 1 ? 's' : ''} late`,
        message: `${p.customerName} has an unpaid EMI`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.dueDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.dueDate,
        read: false,
        actions: ['markPaid', 'sendReminder', 'viewLoan'],
      });
    });

  // ── 2. EMI Due Today ───────────────────────────────────────
  payments
    .filter(p => p.status !== 'Paid' && p.dueDate === todayStr)
    .forEach(p => {
      notifs.push({
        id: uid('duetoday'),
        category: 'emiDue',
        priority: 2,
        icon: '🔔',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.08)',
        border: '#f59e0b',
        title: 'EMI Due Today!',
        message: `${p.customerName}'s EMI is due today`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.dueDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.dueDate,
        read: false,
        actions: ['markPaid', 'sendReminder'],
      });
    });

  // ── 3. EMI Due in 1 day ────────────────────────────────────
  payments
    .filter(p => p.status !== 'Paid' && daysDiff(p.dueDate) === 1)
    .forEach(p => {
      notifs.push({
        id: uid('due1'),
        category: 'emiDue',
        priority: 3,
        icon: '⏰',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.07)',
        border: '#f59e0b',
        title: 'EMI Due Tomorrow',
        message: `${p.customerName}'s EMI is due tomorrow`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.dueDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.dueDate,
        read: false,
        actions: ['sendReminder', 'markPaid'],
      });
    });

  // ── 4. EMI Due in 3 days ───────────────────────────────────
  payments
    .filter(p => p.status !== 'Paid' && daysDiff(p.dueDate) === 3)
    .forEach(p => {
      notifs.push({
        id: uid('due3'),
        category: 'emiDue',
        priority: 4,
        icon: '📅',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.07)',
        border: '#6366f1',
        title: 'EMI Due in 3 Days',
        message: `${p.customerName}'s EMI due on ${formatIndianDate(p.dueDate)}`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.dueDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.dueDate,
        read: false,
        actions: ['sendReminder'],
      });
    });

  // ── 5. EMI Due in 7 days ───────────────────────────────────
  payments
    .filter(p => p.status !== 'Paid' && daysDiff(p.dueDate) === 7)
    .forEach(p => {
      notifs.push({
        id: uid('due7'),
        category: 'emiDue',
        priority: 5,
        icon: '📆',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.06)',
        border: '#3b82f6',
        title: 'EMI Due in 7 Days',
        message: `Reminder: ${p.customerName}'s EMI coming up`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.dueDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.dueDate,
        read: false,
        actions: ['sendReminder'],
      });
    });

  // ── 6. Recent payments received (last 7 days) ──────────────
  payments
    .filter(p => p.status === 'Paid' && p.paidDate && daysDiff(p.paidDate) >= -7)
    .slice(0, 8)
    .forEach(p => {
      notifs.push({
        id: uid('paid'),
        category: 'payments',
        priority: 6,
        icon: '✅',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.07)',
        border: '#10b981',
        title: 'EMI Payment Received',
        message: `${p.customerName} paid ${fmtAmt(p.amount)} successfully`,
        customerName: p.customerName,
        loanName: p.loanName,
        amount: p.amount,
        dueDate: p.paidDate,
        paymentId: p.id,
        loanId: p.loanId,
        customerId: p.customerId,
        time: p.paidDate,
        read: false,
        actions: ['viewLoan'],
      });
    });

  // ── 7. Loans fully paid ────────────────────────────────────
  loans.forEach(loan => {
    const loanPayments = payments.filter(p => p.loanId === loan.id);
    const paid = loanPayments.filter(p => p.status === 'Paid').length;
    const tenure = Number(loan.tenureMonths) || 12;
    if (paid >= tenure && loan.status !== 'Closed') {
      notifs.push({
        id: uid('fullpaid'),
        category: 'payments',
        priority: 7,
        icon: '🎉',
        color: '#10b981',
        bg: 'rgba(16,185,129,0.1)',
        border: '#10b981',
        title: 'Loan Fully Repaid! 🎉',
        message: `${loan.customerName}'s ${loan.loanName} is completely paid off`,
        customerName: loan.customerName,
        loanName: loan.loanName,
        amount: loan.totalAmount,
        dueDate: null,
        loanId: loan.id,
        customerId: loan.customerId,
        time: todayStr,
        read: false,
        actions: ['viewLoan', 'viewCustomer'],
      });
    }
  });

  // ── 8. High overdue alert ──────────────────────────────────
  const overdueTotal = payments
    .filter(p => p.status !== 'Paid' && p.dueDate && p.dueDate < todayStr)
    .reduce((s, p) => s + Number(p.amount || 0), 0);
  if (overdueTotal > 50000) {
    notifs.push({
      id: uid('highovd'),
      category: 'system',
      priority: 1,
      icon: '⚠️',
      color: '#ef4444',
      bg: 'rgba(239,68,68,0.07)',
      border: '#ef4444',
      title: 'High Overdue Alert',
      message: `Total overdue amount is ${fmtAmt(overdueTotal)} — action required`,
      customerName: null,
      loanName: null,
      amount: overdueTotal,
      dueDate: null,
      time: todayStr,
      read: false,
      actions: [],
    });
  }

  // ── 9. New customers (last 3 days) ─────────────────────────
  customers
    .filter(c => c.createdAt && daysDiff(c.createdAt.substring(0, 10)) >= -3)
    .forEach(c => {
      notifs.push({
        id: uid('newcust'),
        category: 'customers',
        priority: 8,
        icon: '👤',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.07)',
        border: '#3b82f6',
        title: 'New Customer Added',
        message: `${c.name} was added as a new borrower`,
        customerName: c.name,
        loanName: null,
        amount: null,
        dueDate: null,
        customerId: c.id,
        time: c.createdAt,
        read: false,
        actions: ['viewCustomer'],
      });
    });

  // ── 10. New loans (last 3 days) ────────────────────────────
  loans
    .filter(l => l.createdAt && daysDiff(l.createdAt.substring(0, 10)) >= -3)
    .forEach(l => {
      notifs.push({
        id: uid('newloan'),
        category: 'customers',
        priority: 9,
        icon: '🏦',
        color: '#6366f1',
        bg: 'rgba(99,102,241,0.07)',
        border: '#6366f1',
        title: 'New Loan Account Created',
        message: `${l.loanName} for ${l.customerName} — ${fmtAmt(l.totalAmount)}`,
        customerName: l.customerName,
        loanName: l.loanName,
        amount: l.totalAmount,
        dueDate: l.startDate,
        loanId: l.id,
        customerId: l.customerId,
        time: l.createdAt,
        read: false,
        actions: ['viewLoan'],
      });
    });

  // Sort: priority then time desc
  notifs.sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return new Date(b.time || 0) - new Date(a.time || 0);
  });

  return notifs;
};

export const NOTIF_CATEGORIES = [
  { key: 'all',       label: 'All',       icon: '🔔' },
  { key: 'emiDue',    label: 'EMI Due',   icon: '📅' },
  { key: 'overdue',   label: 'Overdue',   icon: '🚨' },
  { key: 'payments',  label: 'Payments',  icon: '✅' },
  { key: 'customers', label: 'Customers', icon: '👤' },
  { key: 'system',    label: 'System',    icon: '⚙️' },
];
