/**
 * RC Accountant – Customer Bank Accounts & Transactions Store
 * Manages multiple linked bank accounts per customer, transaction ledgers,
 * inter-account transfers, statement generators, and Google Sheets synchronization.
 */

import { getLocalDateString } from './dateUtils';
import { googleSheetsSync } from './googleSheetsSync';

const KEYS = {
  CUSTOMER_BANK_ACCOUNTS: 'rc_customer_bank_accounts_data',
  CUSTOMER_BANK_TRANSACTIONS: 'rc_customer_bank_transactions_data',
  CUSTOMER_BANK_TRANSFERS: 'rc_customer_bank_transfers_data',
};

// Preset Indian Banks with logos and brand styling
export const INDIAN_BANKS_PRESETS = [
  { bankName: 'State Bank of India', code: 'SBI', icon: '🏛️', color: '#1a4f9c' },
  { bankName: 'HDFC Bank', code: 'HDFC', icon: '🏦', color: '#004c8f' },
  { bankName: 'ICICI Bank', code: 'ICICI', icon: '🏦', color: '#b02a30' },
  { bankName: 'Axis Bank', code: 'AXIS', icon: '🏦', color: '#97144d' },
  { bankName: 'Kotak Mahindra Bank', code: 'KOTAK', icon: '🏦', color: '#ed1b24' },
  { bankName: 'Punjab National Bank', code: 'PNB', icon: '🏛️', color: '#a21d22' },
  { bankName: 'Bank of Baroda', code: 'BOB', icon: '🏦', color: '#f26522' },
  { bankName: 'Canara Bank', code: 'CANARA', icon: '🏦', color: '#0090d0' },
  { bankName: 'Union Bank of India', code: 'UNION', icon: '🏛️', color: '#00529b' },
  { bankName: 'IndusInd Bank', code: 'INDUS', icon: '🏦', color: '#8b1d41' },
  { bankName: 'Yes Bank', code: 'YES', icon: '🏦', color: '#0b4d9c' },
  { bankName: 'Federal Bank', code: 'FED', icon: '🏦', color: '#004184' },
  { bankName: 'IDFC FIRST Bank', code: 'IDFC', icon: '🏦', color: '#9d1d27' },
  { bankName: 'Cash Wallet / Petty Cash', code: 'CASH', icon: '💵', color: '#10b981' },
  { bankName: 'Other Bank / Cooperative', code: 'OTHER', icon: '🏢', color: '#64748b' },
];

export const ACCOUNT_TYPES = ['Savings', 'Current', 'Salary', 'Joint', 'Other'];

// Default sample customer bank accounts seeded for demonstration
const defaultCustomerBankAccounts = [
  {
    id: 'CBA-1001',
    customerId: 'CUST-1001',
    customerName: 'Rahul Sharma',
    bankName: 'HDFC Bank',
    bankLogo: '🏦',
    color: '#004c8f',
    accountHolderName: 'Rahul Sharma',
    accountNumber: '50100458921478',
    ifscCode: 'HDFC0001234',
    accountType: 'Savings',
    upiId: 'rahulsharma@okhdfcbank',
    openingBalance: 45000,
    currentBalance: 45000,
    status: 'Active',
    notes: 'Primary salary savings account',
    createdAt: '2026-01-10',
    lastTransactionDate: '2026-08-15',
  },
  {
    id: 'CBA-1002',
    customerId: 'CUST-1001',
    customerName: 'Rahul Sharma',
    bankName: 'State Bank of India',
    bankLogo: '🏛️',
    color: '#1a4f9c',
    accountHolderName: 'Rahul Sharma',
    accountNumber: '320984512098',
    ifscCode: 'SBIN0004589',
    accountType: 'Current',
    upiId: 'rahul.business@sbi',
    openingBalance: 125000,
    currentBalance: 125000,
    status: 'Active',
    notes: 'Business current account',
    createdAt: '2026-02-15',
    lastTransactionDate: '2026-08-20',
  },
  {
    id: 'CBA-1003',
    customerId: 'CUST-1002',
    customerName: 'Priya Verma',
    bankName: 'ICICI Bank',
    bankLogo: '🏦',
    color: '#b02a30',
    accountHolderName: 'Priya Verma',
    accountNumber: '001201589456',
    ifscCode: 'ICIC0000012',
    accountType: 'Salary',
    upiId: 'priya.verma@icici',
    openingBalance: 68000,
    currentBalance: 68000,
    status: 'Active',
    notes: 'Corporate salary account',
    createdAt: '2026-01-20',
    lastTransactionDate: '2026-08-10',
  },
  {
    id: 'CBA-1004',
    customerId: 'CUST-1003',
    customerName: 'Amit Patel',
    bankName: 'Kotak Mahindra Bank',
    bankLogo: '🏦',
    color: '#ed1b24',
    accountHolderName: 'Amit Patel',
    accountNumber: '9845123654',
    ifscCode: 'KKBK0001290',
    accountType: 'Savings',
    upiId: 'amitpatel@kotak',
    openingBalance: 32000,
    currentBalance: 32000,
    status: 'Active',
    notes: 'Personal savings account',
    createdAt: '2026-03-01',
    lastTransactionDate: '2026-07-28',
  },
];

const defaultCustomerBankTransactions = [
  {
    id: 'CTXN-8001',
    customerBankAccountId: 'CBA-1001',
    customerId: 'CUST-1001',
    customerName: 'Rahul Sharma',
    bankName: 'HDFC Bank',
    accountNumber: '50100458921478',
    type: 'Credit',
    amount: 45000,
    moneyIn: 45000,
    moneyOut: 0,
    balanceBefore: 0,
    balanceAfter: 45000,
    category: 'Opening Balance',
    description: 'Initial Account Balance Setup',
    paymentMethod: 'Net Banking',
    referenceNumber: 'OPN-HDFC-001',
    date: '2026-01-10',
    dateTime: '2026-01-10T10:00:00.000Z',
    notes: 'Initial deposit',
  },
  {
    id: 'CTXN-8002',
    customerBankAccountId: 'CBA-1002',
    customerId: 'CUST-1001',
    customerName: 'Rahul Sharma',
    bankName: 'State Bank of India',
    accountNumber: '320984512098',
    type: 'Credit',
    amount: 125000,
    moneyIn: 125000,
    moneyOut: 0,
    balanceBefore: 0,
    balanceAfter: 125000,
    category: 'Opening Balance',
    description: 'Initial Account Balance Setup',
    paymentMethod: 'Net Banking',
    referenceNumber: 'OPN-SBI-002',
    date: '2026-02-15',
    dateTime: '2026-02-15T11:30:00.000Z',
    notes: 'Business capital deposit',
  },
];

export const customerBankStore = {
  init() {
    if (!localStorage.getItem(KEYS.CUSTOMER_BANK_ACCOUNTS)) {
      localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(defaultCustomerBankAccounts));
    }
    if (!localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSACTIONS)) {
      localStorage.setItem(KEYS.CUSTOMER_BANK_TRANSACTIONS, JSON.stringify(defaultCustomerBankTransactions));
    }
    if (!localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSFERS)) {
      localStorage.setItem(KEYS.CUSTOMER_BANK_TRANSFERS, JSON.stringify([]));
    }
  },

  notify() {
    window.dispatchEvent(new Event('customerBankStoreUpdated'));
    window.dispatchEvent(new Event('bankStoreUpdated'));
  },

  // ── 1. Customer Bank Accounts Management ───────────────────
  getCustomerBankAccounts(customerId = null, includeArchived = false) {
    this.init();
    try {
      const data = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_ACCOUNTS) || '[]');
      let filtered = data;
      if (customerId) {
        filtered = filtered.filter(a => a.customerId === customerId);
      }
      if (!includeArchived) {
        filtered = filtered.filter(a => a.status !== 'Archived');
      }
      return filtered;
    } catch (e) {
      console.error('Error fetching customer bank accounts:', e);
      return [];
    }
  },

  getCustomerBankAccountById(id) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    return accounts.find(a => a.id === id) || null;
  },

  getCustomerTotalBalance(customerId) {
    const accounts = this.getCustomerBankAccounts(customerId, false).filter(a => a.status === 'Active');
    return accounts.reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  },

  saveCustomerBankAccount(accountData) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    const isNew = !accountData.id || !accounts.some(a => a.id === accountData.id);

    // Duplicate account number check for the same customer
    const duplicate = accounts.find(
      a => a.customerId === accountData.customerId && 
           a.accountNumber === accountData.accountNumber && 
           a.id !== accountData.id
    );
    if (duplicate) {
      throw new Error(`An account with number ${accountData.accountNumber} already exists for this customer!`);
    }

    const preset = INDIAN_BANKS_PRESETS.find(p => p.bankName.toLowerCase() === (accountData.bankName || '').toLowerCase());

    const account = {
      ...accountData,
      id: accountData.id || `CBA-${Date.now().toString().slice(-6)}`,
      bankLogo: accountData.bankLogo || preset?.icon || '🏦',
      color: accountData.color || preset?.color || '#0d6efd',
      accountHolderName: accountData.accountHolderName || accountData.customerName,
      accountNumber: (accountData.accountNumber || '').trim(),
      ifscCode: (accountData.ifscCode || '').toUpperCase().trim(),
      accountType: accountData.accountType || 'Savings',
      upiId: (accountData.upiId || '').trim(),
      openingBalance: Number(accountData.openingBalance !== undefined ? accountData.openingBalance : (accountData.currentBalance || 0)),
      currentBalance: Number(accountData.currentBalance !== undefined ? accountData.currentBalance : (accountData.openingBalance || 0)),
      status: accountData.status || 'Active',
      notes: accountData.notes || '',
      createdAt: accountData.createdAt || getLocalDateString(),
      lastTransactionDate: accountData.lastTransactionDate || getLocalDateString(),
    };

    let updatedAccounts = [];
    if (isNew) {
      updatedAccounts = [account, ...accounts];
      localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updatedAccounts));

      // Record opening transaction if opening balance > 0
      if (account.openingBalance > 0) {
        this.recordCustomerTransaction({
          customerBankAccountId: account.id,
          customerId: account.customerId,
          customerName: account.customerName,
          type: 'Credit',
          amount: account.openingBalance,
          category: 'Opening Balance',
          description: `Initial Opening Balance for ${account.bankName}`,
          paymentMethod: 'Opening Setup',
          referenceNumber: `OPN-${account.id}`,
          date: account.createdAt,
          notes: 'Account created with initial opening balance',
        }, false);
      }
    } else {
      updatedAccounts = accounts.map(a => (a.id === account.id ? account : a));
      localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updatedAccounts));
    }

    this.notify();
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Accounts', updatedAccounts);
    return account;
  },

  updateCustomerAccountStatus(id, newStatus) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    const updated = accounts.map(a => (a.id === id ? { ...a, status: newStatus } : a));
    localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updated));
    this.notify();
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Accounts', updated);
    return true;
  },

  deleteCustomerBankAccount(id) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    const updated = accounts.filter(a => a.id !== id);
    localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updated));
    this.notify();
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Accounts', updated);
    return true;
  },

  // ── 2. Customer Bank Transactions Ledger ───────────────────
  getCustomerTransactions(filterCriteria = {}) {
    this.init();
    try {
      let txns = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSACTIONS) || '[]');
      if (filterCriteria.customerBankAccountId) {
        txns = txns.filter(t => t.customerBankAccountId === filterCriteria.customerBankAccountId);
      }
      if (filterCriteria.customerId) {
        txns = txns.filter(t => t.customerId === filterCriteria.customerId);
      }
      if (filterCriteria.type && filterCriteria.type !== 'All') {
        txns = txns.filter(t => t.type === filterCriteria.type);
      }
      if (filterCriteria.loanId) {
        txns = txns.filter(t => t.loanId === filterCriteria.loanId);
      }
      if (filterCriteria.startDate) {
        txns = txns.filter(t => t.date >= filterCriteria.startDate);
      }
      if (filterCriteria.endDate) {
        txns = txns.filter(t => t.date <= filterCriteria.endDate);
      }
      // Sort newest first
      return txns.sort((a, b) => new Date(b.dateTime || b.date) - new Date(a.dateTime || a.date));
    } catch (e) {
      console.error('Error fetching customer transactions:', e);
      return [];
    }
  },

  recordCustomerTransaction(txnData, updateAccountBalance = true) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    const targetAccount = accounts.find(a => a.id === txnData.customerBankAccountId);

    if (!targetAccount && updateAccountBalance) {
      throw new Error(`Customer Bank Account with ID "${txnData.customerBankAccountId}" not found!`);
    }

    const amt = Number(txnData.amount || 0);
    const balanceBefore = Number(targetAccount ? targetAccount.currentBalance || 0 : (txnData.balanceBefore || 0));
    let balanceAfter = balanceBefore;

    const isCredit = txnData.type === 'Credit' || txnData.type === 'Transfer In';
    if (isCredit) {
      balanceAfter = balanceBefore + amt;
    } else {
      balanceAfter = balanceBefore - amt;
    }

    const newTxn = {
      id: txnData.id || `CTXN-${Date.now().toString().slice(-7)}`,
      customerBankAccountId: txnData.customerBankAccountId,
      customerId: txnData.customerId || targetAccount?.customerId,
      customerName: txnData.customerName || targetAccount?.customerName,
      bankName: targetAccount?.bankName || txnData.bankName || 'Bank',
      accountNumber: targetAccount?.accountNumber || txnData.accountNumber || '',
      type: txnData.type || 'Credit',
      amount: amt,
      moneyIn: isCredit ? amt : 0,
      moneyOut: !isCredit ? amt : 0,
      balanceBefore,
      balanceAfter,
      category: txnData.category || 'Payment',
      description: txnData.description || 'Customer Transaction',
      loanId: txnData.loanId || null,
      loanName: txnData.loanName || null,
      paymentId: txnData.paymentId || null,
      paymentMethod: txnData.paymentMethod || 'UPI',
      referenceNumber: txnData.referenceNumber || '',
      notes: txnData.notes || '',
      date: txnData.date || getLocalDateString(),
      dateTime: txnData.dateTime || new Date().toISOString(),
    };

    const allTxns = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSACTIONS) || '[]');
    const updatedTxns = [newTxn, ...allTxns];
    localStorage.setItem(KEYS.CUSTOMER_BANK_TRANSACTIONS, JSON.stringify(updatedTxns));

    if (updateAccountBalance && targetAccount) {
      const updatedAccounts = accounts.map(a =>
        a.id === targetAccount.id
          ? {
              ...a,
              currentBalance: balanceAfter,
              lastTransactionDate: newTxn.date,
            }
          : a
      );
      localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updatedAccounts));
      googleSheetsSync.syncTabToGoogleSheet('Customer Bank Accounts', updatedAccounts);
    }

    this.notify();
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Transactions', updatedTxns);
    return newTxn;
  },

  // ── 3. Customer Inter-Account Transfer ─────────────────────
  recordCustomerTransfer({ fromAccountId, toAccountId, amount, referenceNumber, notes, date }) {
    this.init();
    const accounts = this.getCustomerBankAccounts(null, true);
    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    if (!fromAcc) throw new Error('Source customer bank account not found!');
    if (!toAcc) throw new Error('Destination customer bank account not found!');
    if (fromAccountId === toAccountId) throw new Error('Source and destination accounts must be different!');

    const transferAmt = Number(amount || 0);
    if (transferAmt <= 0) throw new Error('Transfer amount must be greater than zero!');

    const fromBalanceBefore = Number(fromAcc.currentBalance || 0);
    const fromBalanceAfter = fromBalanceBefore - transferAmt;

    const toBalanceBefore = Number(toAcc.currentBalance || 0);
    const toBalanceAfter = toBalanceBefore + transferAmt;

    const transferDate = date || getLocalDateString();
    const transferRef = referenceNumber || `CTRF-${Date.now().toString().slice(-6)}`;
    const transferId = `CTRF-${Date.now().toString().slice(-7)}`;

    // Debit Sender
    const debitTxn = {
      id: `${transferId}-OUT`,
      customerBankAccountId: fromAcc.id,
      customerId: fromAcc.customerId,
      customerName: fromAcc.customerName,
      bankName: fromAcc.bankName,
      accountNumber: fromAcc.accountNumber,
      type: 'Transfer Out',
      amount: transferAmt,
      moneyIn: 0,
      moneyOut: transferAmt,
      balanceBefore: fromBalanceBefore,
      balanceAfter: fromBalanceAfter,
      category: 'Customer Transfer',
      description: `Transfer to ${toAcc.bankName} (${this.maskAccountNumber(toAcc.accountNumber)})`,
      paymentMethod: 'Bank Transfer',
      referenceNumber: transferRef,
      notes: notes || '',
      date: transferDate,
      dateTime: new Date().toISOString(),
    };

    // Credit Receiver
    const creditTxn = {
      id: `${transferId}-IN`,
      customerBankAccountId: toAcc.id,
      customerId: toAcc.customerId,
      customerName: toAcc.customerName,
      bankName: toAcc.bankName,
      accountNumber: toAcc.accountNumber,
      type: 'Transfer In',
      amount: transferAmt,
      moneyIn: transferAmt,
      moneyOut: 0,
      balanceBefore: toBalanceBefore,
      balanceAfter: toBalanceAfter,
      category: 'Customer Transfer',
      description: `Transfer from ${fromAcc.bankName} (${this.maskAccountNumber(fromAcc.accountNumber)})`,
      paymentMethod: 'Bank Transfer',
      referenceNumber: transferRef,
      notes: notes || '',
      date: transferDate,
      dateTime: new Date().toISOString(),
    };

    const allTxns = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSACTIONS) || '[]');
    const updatedTxns = [debitTxn, creditTxn, ...allTxns];
    localStorage.setItem(KEYS.CUSTOMER_BANK_TRANSACTIONS, JSON.stringify(updatedTxns));

    // Update both account balances
    const updatedAccounts = accounts.map(a => {
      if (a.id === fromAcc.id) {
        return { ...a, currentBalance: fromBalanceAfter, lastTransactionDate: transferDate };
      }
      if (a.id === toAcc.id) {
        return { ...a, currentBalance: toBalanceAfter, lastTransactionDate: transferDate };
      }
      return a;
    });
    localStorage.setItem(KEYS.CUSTOMER_BANK_ACCOUNTS, JSON.stringify(updatedAccounts));

    // Store master transfer record
    const masterTransfer = {
      id: transferId,
      customerId: fromAcc.customerId,
      customerName: fromAcc.customerName,
      fromAccountId: fromAcc.id,
      fromBankName: fromAcc.bankName,
      fromAccountNumber: fromAcc.accountNumber,
      fromBalanceBefore,
      fromBalanceAfter,
      toAccountId: toAcc.id,
      toBankName: toAcc.bankName,
      toAccountNumber: toAcc.accountNumber,
      toBalanceBefore,
      toBalanceAfter,
      amount: transferAmt,
      referenceNumber: transferRef,
      notes: notes || '',
      date: transferDate,
      timestamp: new Date().toISOString(),
    };

    const allTransfers = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSFERS) || '[]');
    const updatedTransfers = [masterTransfer, ...allTransfers];
    localStorage.setItem(KEYS.CUSTOMER_BANK_TRANSFERS, JSON.stringify(updatedTransfers));

    this.notify();
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Accounts', updatedAccounts);
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Transactions', updatedTxns);
    googleSheetsSync.syncTabToGoogleSheet('Customer Bank Transfers', updatedTransfers);

    return {
      masterTransfer,
      debitTxn,
      creditTxn,
    };
  },

  getCustomerTransfers(customerId = null) {
    this.init();
    try {
      const data = JSON.parse(localStorage.getItem(KEYS.CUSTOMER_BANK_TRANSFERS) || '[]');
      if (customerId) {
        return data.filter(t => t.customerId === customerId);
      }
      return data;
    } catch (e) {
      console.error('Error fetching customer transfers:', e);
      return [];
    }
  },

  // Mask account number: e.g. "•••• •••• •••• 4589"
  maskAccountNumber(accNum) {
    if (!accNum) return '••••';
    const str = String(accNum).replace(/\s+/g, '');
    if (str.length <= 4) return str;
    const last4 = str.slice(-4);
    const maskedPortion = '•••• •••• •••• '.slice(0, Math.max(0, str.length - 4));
    return `•••• •••• ${last4}`;
  },
};

customerBankStore.init();
