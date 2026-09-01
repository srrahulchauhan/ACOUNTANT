import { getLocalDateString, formatIndianDateTime } from './dateUtils';
import { googleSheetsSync } from './googleSheetsSync';

const KEYS = {
  ACCOUNTS: 'rc_bank_accounts_data',
  TRANSACTIONS: 'rc_bank_transactions_data',
  TRANSFERS: 'rc_bank_transfers_data',
};

// Popular Indian Banks Presets with branding
export const INDIAN_BANKS_PRESETS = [
  {
    name: 'State Bank of India',
    code: 'SBI',
    ifscPrefix: 'SBIN000',
    color: '#1a4f9c',
    bgLight: 'rgba(26, 79, 156, 0.1)',
    icon: '🏛️',
  },
  {
    name: 'HDFC Bank',
    code: 'HDFC',
    ifscPrefix: 'HDFC000',
    color: '#004c8f',
    bgLight: 'rgba(0, 76, 143, 0.1)',
    icon: '🏦',
  },
  {
    name: 'ICICI Bank',
    code: 'ICICI',
    ifscPrefix: 'ICIC000',
    color: '#b02a30',
    bgLight: 'rgba(176, 42, 48, 0.1)',
    icon: '🏢',
  },
  {
    name: 'Axis Bank',
    code: 'AXIS',
    ifscPrefix: 'UTIB000',
    color: '#861f41',
    bgLight: 'rgba(134, 31, 65, 0.1)',
    icon: '💳',
  },
  {
    name: 'Kotak Mahindra Bank',
    code: 'KOTAK',
    ifscPrefix: 'KKBK000',
    color: '#e31837',
    bgLight: 'rgba(227, 24, 55, 0.1)',
    icon: '🏪',
  },
  {
    name: 'Punjab National Bank',
    code: 'PNB',
    ifscPrefix: 'PUNB000',
    color: '#a81c3c',
    bgLight: 'rgba(168, 28, 60, 0.1)',
    icon: '🏛️',
  },
  {
    name: 'Bank of Baroda',
    code: 'BOB',
    ifscPrefix: 'BARB000',
    color: '#f26522',
    bgLight: 'rgba(242, 101, 34, 0.1)',
    icon: '🏦',
  },
  {
    name: 'Canara Bank',
    code: 'CANARA',
    ifscPrefix: 'CNRB000',
    color: '#0090d0',
    bgLight: 'rgba(0, 144, 208, 0.1)',
    icon: '🏢',
  },
  {
    name: 'Union Bank of India',
    code: 'UBI',
    ifscPrefix: 'UBIN000',
    color: '#005a9c',
    bgLight: 'rgba(0, 90, 156, 0.1)',
    icon: '🏛️',
  },
  {
    name: 'IndusInd Bank',
    code: 'INDUSIND',
    ifscPrefix: 'INDB000',
    color: '#901b20',
    bgLight: 'rgba(144, 27, 32, 0.1)',
    icon: '💼',
  },
  {
    name: 'Yes Bank',
    code: 'YES',
    ifscPrefix: 'YESB000',
    color: '#004780',
    bgLight: 'rgba(0, 71, 128, 0.1)',
    icon: '🏧',
  },
  {
    name: 'Cash in Hand Account',
    code: 'CASH',
    ifscPrefix: 'CASH000',
    color: '#10b981',
    bgLight: 'rgba(16, 185, 129, 0.1)',
    icon: '💵',
  },
  {
    name: 'Other Bank / Account',
    code: 'OTHER',
    ifscPrefix: 'BANK000',
    color: '#6366f1',
    bgLight: 'rgba(99, 102, 241, 0.1)',
    icon: '🏦',
  },
];

// Initial starter accounts for fresh setup
const defaultAccounts = [
  {
    id: 'ACC-1001',
    bankName: 'State Bank of India',
    accountHolderName: 'Rahul Chauhan',
    accountNumber: '389201948201',
    ifscCode: 'SBIN0001234',
    accountType: 'Savings',
    openingBalance: 150000,
    currentBalance: 150000,
    logoIcon: '🏛️',
    color: '#1a4f9c',
    status: 'Active', // 'Active', 'Inactive', 'Archived'
    createdAt: getLocalDateString(),
  },
  {
    id: 'ACC-1002',
    bankName: 'HDFC Bank',
    accountHolderName: 'RC Enterprise Services',
    accountNumber: '50200084729103',
    ifscCode: 'HDFC0004567',
    accountType: 'Current',
    openingBalance: 250000,
    currentBalance: 250000,
    logoIcon: '🏦',
    color: '#004c8f',
    status: 'Active',
    createdAt: getLocalDateString(),
  },
  {
    id: 'ACC-1003',
    bankName: 'Cash in Hand Account',
    accountHolderName: 'Office Cash Chest',
    accountNumber: 'CASH-VAULT-01',
    ifscCode: 'CASH0000001',
    accountType: 'Cash',
    openingBalance: 35000,
    currentBalance: 35000,
    logoIcon: '💵',
    color: '#10b981',
    status: 'Active',
    createdAt: getLocalDateString(),
  },
];

export const bankStore = {
  // Initialize storage
  init() {
    if (!localStorage.getItem(KEYS.ACCOUNTS)) {
      localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(defaultAccounts));
    }
    if (!localStorage.getItem(KEYS.TRANSACTIONS)) {
      localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify([]));
    }
    if (!localStorage.getItem(KEYS.TRANSFERS)) {
      localStorage.setItem(KEYS.TRANSFERS, JSON.stringify([]));
    }
  },

  notify() {
    window.dispatchEvent(new Event('bankStoreUpdated'));
    window.dispatchEvent(new Event('loanStoreUpdated'));
  },

  // ─────────────────────────────────────────────────────────────
  // 1. BANK ACCOUNTS CRUD
  // ─────────────────────────────────────────────────────────────

  getBankAccounts(includeArchived = false) {
    this.init();
    try {
      const list = JSON.parse(localStorage.getItem(KEYS.ACCOUNTS)) || [];
      if (!includeArchived) {
        return list.filter((a) => a.status !== 'Archived');
      }
      return list;
    } catch {
      return defaultAccounts;
    }
  },

  getBankAccountById(id) {
    const list = this.getBankAccounts(true);
    return list.find((a) => a.id === id) || null;
  },

  saveBankAccount(accountData) {
    this.init();
    const list = this.getBankAccounts(true);
    let updated;
    let actionType = 'CREATE';
    let targetAcc;

    const matchedPreset = INDIAN_BANKS_PRESETS.find(
      (p) => p.name.toLowerCase() === (accountData.bankName || '').toLowerCase()
    );

    const color = accountData.color || matchedPreset?.color || '#0d6efd';
    const logoIcon = accountData.logoIcon || matchedPreset?.icon || '🏦';

    if (accountData.id && list.some((a) => a.id === accountData.id)) {
      actionType = 'UPDATE';
      targetAcc = {
        ...accountData,
        color,
        logoIcon,
        currentBalance: Number(accountData.currentBalance ?? accountData.openingBalance ?? 0),
        openingBalance: Number(accountData.openingBalance || 0),
      };
      updated = list.map((a) => (a.id === accountData.id ? { ...a, ...targetAcc } : a));
    } else {
      const openBal = Number(accountData.openingBalance || 0);
      const currBal = accountData.currentBalance !== undefined ? Number(accountData.currentBalance) : openBal;
      targetAcc = {
        ...accountData,
        id: accountData.id || 'ACC-' + Math.floor(1000 + Math.random() * 9000),
        openingBalance: openBal,
        currentBalance: currBal,
        color,
        logoIcon,
        status: accountData.status || 'Active',
        createdAt: accountData.createdAt || getLocalDateString(),
      };
      updated = [targetAcc, ...list];
    }

    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));
    this.notify();

    // Async sync to Google Sheets (Tab: Bank Accounts)
    googleSheetsSync.sendToGoogleSheet(actionType, 'Bank Accounts', targetAcc);

    return updated;
  },

  archiveBankAccount(accountId) {
    this.init();
    const list = this.getBankAccounts(true);
    const updated = list.map((a) => (a.id === accountId ? { ...a, status: 'Archived' } : a));
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));
    this.notify();
    googleSheetsSync.sendToGoogleSheet('UPDATE', 'Bank Accounts', { id: accountId, status: 'Archived' });
    return updated;
  },

  unarchiveBankAccount(accountId) {
    this.init();
    const list = this.getBankAccounts(true);
    const updated = list.map((a) => (a.id === accountId ? { ...a, status: 'Active' } : a));
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updated));
    this.notify();
    googleSheetsSync.sendToGoogleSheet('UPDATE', 'Bank Accounts', { id: accountId, status: 'Active' });
    return updated;
  },

  deleteBankAccount(accountId) {
    this.init();
    const list = this.getBankAccounts(true).filter((a) => a.id !== accountId);
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(list));
    this.notify();
    googleSheetsSync.sendToGoogleSheet('DELETE', 'Bank Accounts', { id: accountId });
  },

  // ─────────────────────────────────────────────────────────────
  // 2. BANK TRANSACTIONS LEDGER & AUTO-BALANCE UPDATING
  // ─────────────────────────────────────────────────────────────

  getBankTransactions(filters = {}) {
    this.init();
    try {
      let data = JSON.parse(localStorage.getItem(KEYS.TRANSACTIONS)) || [];
      
      // Sort newest first
      data.sort((a, b) => new Date(b.dateTime || b.date || 0) - new Date(a.dateTime || a.date || 0));

      if (filters.bankAccountId) {
        data = data.filter((t) => t.bankAccountId === filters.bankAccountId);
      }
      if (filters.type && filters.type !== 'All') {
        data = data.filter((t) => t.type === filters.type);
      }
      if (filters.customerId) {
        data = data.filter((t) => t.customerId === filters.customerId);
      }
      if (filters.loanId) {
        data = data.filter((t) => t.loanId === filters.loanId);
      }
      if (filters.startDate) {
        data = data.filter((t) => (t.date || t.dateTime) >= filters.startDate);
      }
      if (filters.endDate) {
        data = data.filter((t) => (t.date || t.dateTime) <= filters.endDate);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        data = data.filter(
          (t) =>
            (t.description || '').toLowerCase().includes(q) ||
            (t.customerName || '').toLowerCase().includes(q) ||
            (t.bankName || '').toLowerCase().includes(q) ||
            (t.id || '').toLowerCase().includes(q) ||
            (t.referenceNumber || '').toLowerCase().includes(q)
        );
      }

      return data;
    } catch {
      return [];
    }
  },

  /**
   * Records a financial transaction and automatically adjusts the target Bank/Cash account's balance
   * @param {Object} txData
   * {
   *   type: 'Credit' | 'Debit' | 'Transfer In' | 'Transfer Out',
   *   amount: Number,
   *   bankAccountId: String,
   *   category: String (e.g. 'EMI Collection', 'Expense', 'Loan Disbursement', 'Transfer', 'Adjustment'),
   *   paymentMethod: 'UPI' | 'Bank Transfer' | 'Cash' | 'Cheque' | 'Other',
   *   customerId: String (optional),
   *   customerName: String (optional),
   *   loanId: String (optional),
   *   loanName: String (optional),
   *   expenseId: String (optional),
   *   description: String,
   *   referenceNumber: String,
   *   date: String (YYYY-MM-DD),
   *   time: String (HH:mm),
   * }
   */
  recordBankTransaction(txData) {
    this.init();
    const amount = Number(txData.amount || 0);
    if (!amount || amount <= 0) return null;

    const accounts = this.getBankAccounts(true);
    // If no bankAccountId supplied, try fallback to Cash or first active account
    let targetAccount = accounts.find((a) => a.id === txData.bankAccountId);
    if (!targetAccount) {
      if (txData.paymentMethod === 'Cash') {
        targetAccount = accounts.find((a) => a.accountType === 'Cash') || accounts[0];
      } else {
        targetAccount = accounts.find((a) => a.status === 'Active') || accounts[0];
      }
    }

    if (!targetAccount) {
      console.warn('No active bank account available for transaction');
      return null;
    }

    const balanceBefore = Number(targetAccount.currentBalance || 0);
    const isCredit = txData.type === 'Credit' || txData.type === 'Transfer In';
    const balanceAfter = isCredit ? balanceBefore + amount : balanceBefore - amount;

    // 1. Update the account balance
    const updatedAccounts = accounts.map((a) => {
      if (a.id === targetAccount.id) {
        return {
          ...a,
          currentBalance: balanceAfter,
          lastTransactionDate: txData.date || getLocalDateString(),
        };
      }
      return a;
    });
    localStorage.setItem(KEYS.ACCOUNTS, JSON.stringify(updatedAccounts));

    // 2. Build the transaction ledger entry
    const newTx = {
      id: txData.id || 'TXN-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900),
      bankAccountId: targetAccount.id,
      bankName: targetAccount.bankName,
      accountNumber: targetAccount.accountNumber,
      accountType: targetAccount.accountType,
      type: txData.type || (isCredit ? 'Credit' : 'Debit'),
      amount: amount,
      moneyIn: isCredit ? amount : 0,
      moneyOut: !isCredit ? amount : 0,
      balanceBefore: balanceBefore,
      balanceAfter: balanceAfter,
      category: txData.category || 'General',
      paymentMethod: txData.paymentMethod || 'UPI',
      customerId: txData.customerId || '',
      customerName: txData.customerName || '',
      loanId: txData.loanId || '',
      loanName: txData.loanName || '',
      expenseId: txData.expenseId || '',
      description: txData.description || `${txData.category || 'Transaction'} - ${targetAccount.bankName}`,
      referenceNumber: txData.referenceNumber || '',
      date: txData.date || getLocalDateString(),
      dateTime: new Date().toISOString(),
      formattedTime: formatIndianDateTime(),
    };

    const transactions = this.getBankTransactions();
    const updatedTransactions = [newTx, ...transactions];
    localStorage.setItem(KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));

    this.notify();

    // Async sync to Google Sheets (Tab: Bank Transactions)
    googleSheetsSync.sendToGoogleSheet('CREATE', 'Bank Transactions', newTx);

    return newTx;
  },

  // ─────────────────────────────────────────────────────────────
  // 3. BANK-TO-BANK TRANSFERS
  // ─────────────────────────────────────────────────────────────

  getBankTransfers() {
    this.init();
    try {
      const list = JSON.parse(localStorage.getItem(KEYS.TRANSFERS)) || [];
      return list.sort((a, b) => new Date(b.dateTime || b.date || 0) - new Date(a.dateTime || a.date || 0));
    } catch {
      return [];
    }
  },

  /**
   * Execute atomic Bank-to-Bank transfer
   * @param {Object} transferData
   * {
   *   fromAccountId,
   *   toAccountId,
   *   amount,
   *   date,
   *   referenceNumber,
   *   notes
   * }
   */
  recordBankTransfer(transferData) {
    this.init();
    const { fromAccountId, toAccountId, referenceNumber, notes } = transferData;
    const amount = Number(transferData.amount || 0);

    if (!amount || amount <= 0) {
      throw new Error('Transfer amount must be greater than zero.');
    }
    if (fromAccountId === toAccountId) {
      throw new Error('Sender and Receiver accounts cannot be the same.');
    }

    const fromAcc = this.getBankAccountById(fromAccountId);
    const toAcc = this.getBankAccountById(toAccountId);

    if (!fromAcc) throw new Error('Sender bank account not found.');
    if (!toAcc) throw new Error('Destination bank account not found.');

    const fromBalanceBefore = Number(fromAcc.currentBalance || 0);
    const toBalanceBefore = Number(toAcc.currentBalance || 0);

    const fromBalanceAfter = fromBalanceBefore - amount;
    const toBalanceAfter = toBalanceBefore + amount;

    const transferId = 'TRF-' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
    const dateStr = transferData.date || getLocalDateString();
    const refNo = referenceNumber || 'TRF' + Math.floor(100000 + Math.random() * 900000);

    // 1. Record Sender Outflow Transaction
    this.recordBankTransaction({
      id: `${transferId}-OUT`,
      type: 'Debit',
      amount: amount,
      bankAccountId: fromAccountId,
      category: 'Bank Transfer',
      paymentMethod: 'Bank Transfer',
      description: `Transfer to ${toAcc.bankName} (${this.maskAccountNumber(toAcc.accountNumber)}) - ${notes || 'Funds Transfer'}`,
      referenceNumber: refNo,
      date: dateStr,
    });

    // 2. Record Receiver Inflow Transaction
    this.recordBankTransaction({
      id: `${transferId}-IN`,
      type: 'Credit',
      amount: amount,
      bankAccountId: toAccountId,
      category: 'Bank Transfer',
      paymentMethod: 'Bank Transfer',
      description: `Received from ${fromAcc.bankName} (${this.maskAccountNumber(fromAcc.accountNumber)}) - ${notes || 'Funds Transfer'}`,
      referenceNumber: refNo,
      date: dateStr,
    });

    // 3. Record Master Transfer Log
    const newTransfer = {
      id: transferId,
      fromAccountId,
      fromBankName: fromAcc.bankName,
      fromAccountNumber: fromAcc.accountNumber,
      fromBalanceBefore,
      fromBalanceAfter,
      toAccountId,
      toBankName: toAcc.bankName,
      toAccountNumber: toAcc.accountNumber,
      toBalanceBefore,
      toBalanceAfter,
      amount,
      referenceNumber: refNo,
      notes: notes || '',
      date: dateStr,
      dateTime: new Date().toISOString(),
      formattedTime: formatIndianDateTime(),
      status: 'Completed',
    };

    const transfers = this.getBankTransfers();
    const updatedTransfers = [newTransfer, ...transfers];
    localStorage.setItem(KEYS.TRANSFERS, JSON.stringify(updatedTransfers));

    this.notify();

    // Async sync to Google Sheets (Tab: Bank Transfers)
    googleSheetsSync.sendToGoogleSheet('CREATE', 'Bank Transfers', newTransfer);

    return newTransfer;
  },

  // ─────────────────────────────────────────────────────────────
  // 4. BALANCES & AGGREGATE METRICS
  // ─────────────────────────────────────────────────────────────

  getCombinedBalance() {
    const accounts = this.getBankAccounts(false).filter((a) => a.status === 'Active');
    return accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  },

  getBankBreakdown() {
    const activeAccounts = this.getBankAccounts(false).filter((a) => a.status === 'Active');
    const cashTotal = activeAccounts
      .filter((a) => a.accountType === 'Cash')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
    const bankTotal = activeAccounts
      .filter((a) => a.accountType !== 'Cash')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
    const combined = cashTotal + bankTotal;

    return {
      cashTotal,
      bankTotal,
      combined,
      accountsCount: activeAccounts.length,
      accounts: activeAccounts,
    };
  },

  // Mask account number: shows only last 4 digits (e.g., •••• •••• •••• 4589)
  maskAccountNumber(accNo, showFull = false) {
    if (!accNo) return '•••• 0000';
    if (showFull) return accNo;
    const str = String(accNo).trim();
    if (str.length <= 4) return str;
    const last4 = str.slice(-4);
    return `•••• •••• •••• ${last4}`;
  },
};
