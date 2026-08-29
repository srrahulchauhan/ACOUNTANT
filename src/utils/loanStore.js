import { getLocalDateString, addMonthsToDate } from './dateUtils';

const KEYS = {
  CUSTOMERS: 'emi_customers_data',
  LOANS: 'emi_loans_data',
  PAYMENTS: 'emi_payments_data',
  REMINDERS: 'emi_reminders_data',
  SETTINGS: 'emi_settings_data',
};

// Initial Sample Seed Data
const defaultCustomers = [
  {
    id: 'CUST-1001',
    name: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'rajesh.sharma@example.com',
    address: '42, Park Street, Civil Lines, Jaipur, Rajasthan',
    panAadhaar: 'ABCPS1234F',
    dob: '1985-06-15',
    employment: 'Business Owner - Software Solutions',
    monthlyIncome: '125000',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-01-10',
  },
  {
    id: 'CUST-1002',
    name: 'Priya Patel',
    phone: '+91 98123 45678',
    email: 'priya.patel@example.com',
    address: '108, Sunrise Heights, SG Highway, Ahmedabad, Gujarat',
    panAadhaar: 'BVCPP8821K',
    dob: '1990-11-22',
    employment: 'Senior Software Engineer - TechCorp',
    monthlyIncome: '110000',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-02-01',
  },
  {
    id: 'CUST-1003',
    name: 'Amit Vikram Singh',
    phone: '+91 97654 32109',
    email: 'amit.singh@example.com',
    address: '15/2, MG Road, Indiranagar, Bengaluru, Karnataka',
    panAadhaar: 'DFGPS5432M',
    dob: '1988-04-10',
    employment: 'Financial Analyst - Global Advisory',
    monthlyIncome: '95000',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-02-15',
  },
  {
    id: 'CUST-1004',
    name: 'Sunita Verma',
    phone: '+91 99887 76655',
    email: 'sunita.verma@example.com',
    address: '77, Green Park Extension, New Delhi',
    panAadhaar: 'KLMPO9988Q',
    dob: '1993-08-30',
    employment: 'Architect - Studio Design',
    monthlyIncome: '85000',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    createdAt: '2025-03-01',
  },
];

const defaultLoans = [
  {
    id: 'LOAN-1001',
    customerId: 'CUST-1001',
    customerName: 'Rajesh Sharma',
    loanName: 'Jaipur Dream Villa Home Loan',
    type: 'Home Loan',
    totalAmount: 4500000,
    interestRate: 8.5,
    emiAmount: 39045,
    startDate: '2025-01-15',
    tenureMonths: 240,
    dueDate: '2026-09-05',
    lateFee: 500,
    status: 'Active',
    notes: 'Primary residence home loan disbursed via SBI Bank.',
  },
  {
    id: 'LOAN-1002',
    customerId: 'CUST-1002',
    customerName: 'Priya Patel',
    loanName: 'Hyundai SUV Car Loan',
    type: 'Car Loan',
    totalAmount: 1200000,
    interestRate: 9.2,
    emiAmount: 25040,
    startDate: '2025-02-10',
    tenureMonths: 60,
    dueDate: '2026-08-29', // Due today
    lateFee: 250,
    status: 'Active',
    notes: 'Vehicle loan hypothecated to HDFC Bank.',
  },
  {
    id: 'LOAN-1003',
    customerId: 'CUST-1003',
    customerName: 'Amit Vikram Singh',
    loanName: 'Business Expansion Personal Loan',
    type: 'Personal Loan',
    totalAmount: 500000,
    interestRate: 13.5,
    emiAmount: 16960,
    startDate: '2025-03-01',
    tenureMonths: 36,
    dueDate: '2026-08-15', // Overdue
    lateFee: 350,
    status: 'Active',
    notes: 'Unsecured personal loan for office interior setup.',
  },
  {
    id: 'LOAN-1004',
    customerId: 'CUST-1004',
    customerName: 'Sunita Verma',
    loanName: 'Higher Education Masters Loan',
    type: 'Education Loan',
    totalAmount: 800000,
    interestRate: 7.9,
    emiAmount: 16180,
    startDate: '2025-03-10',
    tenureMonths: 60,
    dueDate: '2026-09-10',
    lateFee: 200,
    status: 'Active',
    notes: 'Education loan for Master of Architecture degree.',
  },
  {
    id: 'LOAN-1005',
    customerId: 'CUST-1001',
    customerName: 'Rajesh Sharma',
    loanName: 'Corporate Platinum Card',
    type: 'Credit Card',
    totalAmount: 250000,
    interestRate: 14.0,
    emiAmount: 22400,
    startDate: '2025-04-01',
    tenureMonths: 12,
    dueDate: '2026-09-01',
    lateFee: 300,
    status: 'Active',
    notes: 'Equated monthly installment converted from credit card balance.',
  },
];

const defaultPayments = [
  {
    id: 'PAY-1001',
    loanId: 'LOAN-1001',
    customerId: 'CUST-1001',
    customerName: 'Rajesh Sharma',
    loanName: 'Jaipur Dream Villa Home Loan',
    amount: 39045,
    paidDate: '2026-07-05',
    dueDate: '2026-07-05',
    lateFee: 0,
    paymentMethod: 'Net Banking',
    notes: 'Auto-debit processed successfully',
    status: 'Paid',
  },
  {
    id: 'PAY-1002',
    loanId: 'LOAN-1001',
    customerId: 'CUST-1001',
    customerName: 'Rajesh Sharma',
    loanName: 'Jaipur Dream Villa Home Loan',
    amount: 39045,
    paidDate: '2026-08-05',
    dueDate: '2026-08-05',
    lateFee: 0,
    paymentMethod: 'UPI',
    notes: 'Paid via PhonePe',
    status: 'Paid',
  },
  {
    id: 'PAY-1003',
    loanId: 'LOAN-1002',
    customerId: 'CUST-1002',
    customerName: 'Priya Patel',
    loanName: 'Hyundai SUV Car Loan',
    amount: 25040,
    paidDate: '2026-07-28',
    dueDate: '2026-07-28',
    lateFee: 0,
    paymentMethod: 'Net Banking',
    notes: 'Paid on time',
    status: 'Paid',
  },
  {
    id: 'PAY-1004',
    loanId: 'LOAN-1002',
    customerId: 'CUST-1002',
    customerName: 'Priya Patel',
    loanName: 'Hyundai SUV Car Loan',
    amount: 25040,
    paidDate: '',
    dueDate: '2026-08-29',
    lateFee: 0,
    paymentMethod: 'UPI',
    notes: 'Installment due today',
    status: 'Upcoming',
  },
  {
    id: 'PAY-1005',
    loanId: 'LOAN-1003',
    customerId: 'CUST-1003',
    customerName: 'Amit Vikram Singh',
    loanName: 'Business Expansion Personal Loan',
    amount: 16960,
    paidDate: '',
    dueDate: '2026-08-15',
    lateFee: 350,
    paymentMethod: 'Cash',
    notes: 'Overdue penalty applied',
    status: 'Overdue',
  },
  {
    id: 'PAY-1006',
    loanId: 'LOAN-1004',
    customerId: 'CUST-1004',
    customerName: 'Sunita Verma',
    loanName: 'Higher Education Masters Loan',
    amount: 16180,
    paidDate: '2026-08-10',
    dueDate: '2026-08-10',
    lateFee: 0,
    paymentMethod: 'Cheque',
    notes: 'Cheque #40912 cleared',
    status: 'Paid',
  },
  {
    id: 'PAY-1007',
    loanId: 'LOAN-1005',
    customerId: 'CUST-1001',
    customerName: 'Rajesh Sharma',
    loanName: 'Corporate Platinum Card',
    amount: 22400,
    paidDate: '',
    dueDate: '2026-09-01',
    lateFee: 0,
    paymentMethod: 'Card',
    notes: 'Scheduled upcoming EMI',
    status: 'Upcoming',
  },
];

const defaultReminders = [
  {
    id: 'REM-1001',
    title: 'Collect EMI Cheque - Rajesh Sharma',
    date: '2026-09-05',
    type: 'Reminder',
    customerId: 'CUST-1001',
    loanId: 'LOAN-1001',
    notes: 'Call customer before 11:00 AM regarding SBI bank auto-debit.',
  },
  {
    id: 'REM-1002',
    title: 'Follow-up Overdue Payment - Amit Vikram',
    date: '2026-08-30',
    type: 'Follow-up',
    customerId: 'CUST-1003',
    loanId: 'LOAN-1003',
    notes: 'Customer promised cash deposit by 4:00 PM.',
  },
];

const defaultSettings = {
  companyName: 'RC Accountant Services Ltd.',
  companyTagline: 'Smart Financial & EMI Asset Management',
  companyLogo: '',
  email: 'support@rcaccountant.com',
  phone: '+91 1800 200 9999',
  address: 'Suite 405, Financial Tower, Cyber City, Gurugram, Haryana - 122002',
  gstNumber: '07AAAAA0000A1Z5',
  currencySymbol: '₹',
  defaultLateFee: 350,
  autoSendReminders: true,
};


// LocalStorage Helper with Fallbacks & Listeners
export const loanStore = {
  // Initialize storage if missing
  init() {
    if (!localStorage.getItem(KEYS.CUSTOMERS)) {
      localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(defaultCustomers));
    }
    if (!localStorage.getItem(KEYS.LOANS)) {
      localStorage.setItem(KEYS.LOANS, JSON.stringify(defaultLoans));
    }
    if (!localStorage.getItem(KEYS.PAYMENTS)) {
      localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(defaultPayments));
    }
    if (!localStorage.getItem(KEYS.REMINDERS)) {
      localStorage.setItem(KEYS.REMINDERS, JSON.stringify(defaultReminders));
    }
    if (!localStorage.getItem(KEYS.SETTINGS)) {
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    }
  },

  notify() {
    window.dispatchEvent(new Event('loanStoreUpdated'));
  },

  // 1. Customers
  getCustomers() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.CUSTOMERS)) || [];
    } catch {
      return defaultCustomers;
    }
  },

  saveCustomer(customerData) {
    this.init();
    const list = this.getCustomers();
    let updated;
    if (customerData.id && list.some((c) => c.id === customerData.id)) {
      updated = list.map((c) => (c.id === customerData.id ? { ...c, ...customerData } : c));
    } else {
      const newCust = {
        ...customerData,
        id: customerData.id || 'CUST-' + Math.floor(1000 + Math.random() * 9000),
        createdAt: customerData.createdAt || getLocalDateString(),
      };
      updated = [newCust, ...list];
    }
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(updated));
    this.notify();
    return updated;
  },

  deleteCustomer(customerId) {
    this.init();
    const list = this.getCustomers().filter((c) => c.id !== customerId);
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(list));
    
    // Cascade delete customer's loans & payments
    const loans = this.getLoans().filter((l) => l.customerId !== customerId);
    localStorage.setItem(KEYS.LOANS, JSON.stringify(loans));

    const payments = this.getPayments().filter((p) => p.customerId !== customerId);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));

    this.notify();
  },

  // 2. Loans
  getLoans() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.LOANS)) || [];
    } catch {
      return defaultLoans;
    }
  },

  saveLoan(loanData) {
    this.init();
    const list = this.getLoans();
    const customers = this.getCustomers();
    const cust = customers.find((c) => c.id === loanData.customerId);
    const custName = cust ? cust.name : loanData.customerName || 'Borrower';

    let updated;
    let targetLoanId = loanData.id;

    if (loanData.id && list.some((l) => l.id === loanData.id)) {
      updated = list.map((l) => (l.id === loanData.id ? { ...l, ...loanData, customerName: custName } : l));
    } else {
      targetLoanId = loanData.id || 'LOAN-' + Math.floor(1000 + Math.random() * 9000);
      const newLoan = {
        ...loanData,
        id: targetLoanId,
        customerName: custName,
        status: loanData.status || 'Active',
      };
      updated = [newLoan, ...list];

      // Auto-generate upcoming first EMI payment record
      this.addPaymentRecord({
        loanId: targetLoanId,
        customerId: loanData.customerId,
        customerName: custName,
        loanName: loanData.loanName,
        amount: Number(loanData.emiAmount),
        paidDate: '',
        dueDate: loanData.dueDate || addMonthsToDate(loanData.startDate, 1),
        lateFee: 0,
        paymentMethod: 'UPI',
        notes: 'Initial scheduled EMI',
        status: 'Upcoming',
      });
    }
    localStorage.setItem(KEYS.LOANS, JSON.stringify(updated));
    this.notify();
    return updated;
  },

  deleteLoan(loanId) {
    this.init();
    const list = this.getLoans().filter((l) => l.id !== loanId);
    localStorage.setItem(KEYS.LOANS, JSON.stringify(list));

    const payments = this.getPayments().filter((p) => p.loanId !== loanId);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(payments));

    this.notify();
  },

  // 3. Payments
  getPayments() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.PAYMENTS)) || [];
    } catch {
      return defaultPayments;
    }
  },

  addPaymentRecord(paymentData) {
    this.init();
    const list = this.getPayments();
    const loans = this.getLoans();
    const targetLoan = loans.find((l) => l.id === paymentData.loanId);

    const newPayment = {
      ...paymentData,
      id: paymentData.id || 'PAY-' + Math.floor(1000 + Math.random() * 9000),
      customerName: targetLoan ? targetLoan.customerName : paymentData.customerName,
      loanName: targetLoan ? targetLoan.loanName : paymentData.loanName,
    };

    const updated = [newPayment, ...list];
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(updated));
    this.notify();
    return updated;
  },

  markPaymentAsPaid(paymentId, details = {}) {
    this.init();
    const list = this.getPayments();
    const loans = this.getLoans();
    const today = getLocalDateString();

    const targetPayment = list.find((p) => p.id === paymentId);
    if (!targetPayment) return;

    const updatedPayments = list.map((p) => {
      if (p.id === paymentId) {
        return {
          ...p,
          status: 'Paid',
          paidDate: details.paidDate || today,
          paymentMethod: details.paymentMethod || p.paymentMethod || 'UPI',
          lateFee: details.lateFee !== undefined ? Number(details.lateFee) : p.lateFee || 0,
          notes: details.notes || p.notes || 'Marked as paid',
        };
      }
      return p;
    });

    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(updatedPayments));

    // Update target loan due date & next upcoming installment
    if (targetPayment.loanId) {
      const loan = loans.find((l) => l.id === targetPayment.loanId);
      if (loan) {
        const nextDueDate = addMonthsToDate(targetPayment.dueDate || loan.dueDate, 1);
        const updatedLoans = loans.map((l) => {
          if (l.id === targetPayment.loanId) {
            return {
              ...l,
              dueDate: nextDueDate,
            };
          }
          return l;
        });
        localStorage.setItem(KEYS.LOANS, JSON.stringify(updatedLoans));

        // Create next upcoming EMI payment record automatically
        const nextPayment = {
          id: 'PAY-' + Math.floor(1000 + Math.random() * 9000),
          loanId: loan.id,
          customerId: loan.customerId,
          customerName: loan.customerName,
          loanName: loan.loanName,
          amount: loan.emiAmount,
          paidDate: '',
          dueDate: nextDueDate,
          lateFee: 0,
          paymentMethod: 'UPI',
          notes: 'Auto scheduled next installment',
          status: 'Upcoming',
        };
        localStorage.setItem(KEYS.PAYMENTS, JSON.stringify([nextPayment, ...updatedPayments]));
      }
    }

    this.notify();
  },

  deletePayment(paymentId) {
    this.init();
    const list = this.getPayments().filter((p) => p.id !== paymentId);
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(list));
    this.notify();
  },

  // 4. Reminders / Calendar Events
  getReminders() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.REMINDERS)) || [];
    } catch {
      return defaultReminders;
    }
  },

  saveReminder(reminderData) {
    this.init();
    const list = this.getReminders();
    let updated;
    if (reminderData.id && list.some((r) => r.id === reminderData.id)) {
      updated = list.map((r) => (r.id === reminderData.id ? { ...r, ...reminderData } : r));
    } else {
      const newRem = {
        ...reminderData,
        id: reminderData.id || 'REM-' + Math.floor(1000 + Math.random() * 9000),
      };
      updated = [newRem, ...list];
    }
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(updated));
    this.notify();
    return updated;
  },

  deleteReminder(reminderId) {
    this.init();
    const list = this.getReminders().filter((r) => r.id !== reminderId);
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(list));
    this.notify();
  },

  // 5. Settings
  getSettings() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem(KEYS.SETTINGS)) || defaultSettings;
    } catch {
      return defaultSettings;
    }
  },

  saveSettings(settingsData) {
    this.init();
    const current = this.getSettings();
    const updated = { ...current, ...settingsData };
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
    this.notify();
    return updated;
  },

  // Export / Import / Reset Data
  exportBackup() {
    this.init();
    const data = {
      customers: this.getCustomers(),
      loans: this.getLoans(),
      payments: this.getPayments(),
      reminders: this.getReminders(),
      settings: this.getSettings(),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RC_Accountant_Backup_${getLocalDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importBackup(jsonData) {
    try {
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      if (parsed.customers) localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(parsed.customers));
      if (parsed.loans) localStorage.setItem(KEYS.LOANS, JSON.stringify(parsed.loans));
      if (parsed.payments) localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(parsed.payments));
      if (parsed.reminders) localStorage.setItem(KEYS.REMINDERS, JSON.stringify(parsed.reminders));
      if (parsed.settings) localStorage.setItem(KEYS.SETTINGS, JSON.stringify(parsed.settings));
      this.notify();
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  },

  resetToDefaults() {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(defaultCustomers));
    localStorage.setItem(KEYS.LOANS, JSON.stringify(defaultLoans));
    localStorage.setItem(KEYS.PAYMENTS, JSON.stringify(defaultPayments));
    localStorage.setItem(KEYS.REMINDERS, JSON.stringify(defaultReminders));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    this.notify();
  },

  // Helper EMI Calculator: EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
  calculateEmi(principal, annualRate, tenureMonths) {
    const p = Number(principal) || 0;
    const r = (Number(annualRate) || 0) / 12 / 100;
    const n = Number(tenureMonths) || 0;
    if (!p || !n) return 0;
    if (!r) return Math.round(p / n);
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  },

  // Helper to generate full EMI schedule array
  generateEmiSchedule(loan) {
    const p = Number(loan.totalAmount) || 0;
    const rate = Number(loan.interestRate) || 0;
    const monthlyRate = rate / 12 / 100;
    const n = Number(loan.tenureMonths) || 12;
    const emi = loan.emiAmount || this.calculateEmi(p, rate, n);

    let balance = p;
    const schedule = [];
    let curDate = loan.startDate || getLocalDateString();

    const payments = this.getPayments().filter((pay) => pay.loanId === loan.id && pay.status === 'Paid');

    for (let i = 1; i <= n; i++) {
      const interest = monthlyRate ? Math.round(balance * monthlyRate) : 0;
      const principal = Math.min(emi - interest, balance);
      balance = Math.max(0, balance - principal);
      curDate = addMonthsToDate(curDate, 1);

      const isPaid = i <= payments.length;
      schedule.push({
        installmentNumber: i,
        dueDate: curDate,
        emiAmount: emi,
        principalComponent: principal,
        interestComponent: interest,
        remainingBalance: balance,
        status: isPaid ? 'Paid' : i === payments.length + 1 ? 'Upcoming' : 'Pending',
      });
    }

    return schedule;
  },
};
