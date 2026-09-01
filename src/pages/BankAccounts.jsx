import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MdAccountBalance, MdAddCircle, MdSearch, MdFilterList, MdSwapHoriz, 
  MdVisibility, MdVisibilityOff, MdEdit, MdArchive, MdUnarchive, MdDelete, 
  MdReceiptLong, MdPrint, MdPictureAsPdf, MdFileUpload, MdRefresh, 
  MdCheckCircle, MdWarning, MdArrowForward, MdTrendingUp, MdTrendingDown,
  MdPayments, MdAttachMoney, MdAccountBalanceWallet, MdCreditCard, MdClose, MdSave,
  MdHistory, MdFileDownload
} from 'react-icons/md';
import { bankStore, INDIAN_BANKS_PRESETS } from '../utils/bankStore';
import { loanStore } from '../utils/loanStore';
import { getLocalDateString, formatIndianDate, formatIndianDateTime } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ACCOUNT_TYPES = ['Savings', 'Current', 'Cash', 'Other'];

const BankAccounts = () => {
  // Navigation tabs within Bank Accounts page
  const [activeTab, setActiveTab] = useState('accounts'); // 'accounts' | 'transfers' | 'statements' | 'transactions'

  // Accounts & Data States
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [settings, setSettings] = useState({});

  // Search & Filters for Accounts
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('Active'); // 'All', 'Active', 'Inactive', 'Archived'
  const [unmaskedAccs, setUnmaskedAccs] = useState({});

  // Add / Edit Account Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    bankName: 'State Bank of India',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: 'SBIN0001234',
    accountType: 'Savings',
    openingBalance: '',
    currentBalance: '',
    status: 'Active',
  });

  // Transfer Funds Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    date: getLocalDateString(),
    referenceNumber: '',
    notes: '',
  });
  const [showTransferConfirmModal, setShowTransferConfirmModal] = useState(false);

  // Statement Filters & State
  const [stmtBankId, setStmtBankId] = useState('');
  const [stmtType, setStmtType] = useState('All');
  const [stmtDateRange, setStmtDateRange] = useState('This Month'); // 'Today', 'This Week', 'This Month', 'All', 'Custom'
  const [stmtStartDate, setStmtStartDate] = useState('');
  const [stmtEndDate, setStmtEndDate] = useState('');
  const [stmtCustomerId, setStmtCustomerId] = useState('');
  const [stmtLoanId, setStmtLoanId] = useState('');

  // Selected Account for quick transaction drawer
  const [drawerAccount, setDrawerAccount] = useState(null);

  // Load all bank and financial data
  const loadData = () => {
    const allAccs = bankStore.getBankAccounts(true);
    setAccounts(allAccs);
    setTransactions(bankStore.getBankTransactions());
    setTransfers(bankStore.getBankTransfers());
    setCustomers(loanStore.getCustomers());
    setLoans(loanStore.getLoans());
    setSettings(loanStore.getSettings());

    if (allAccs.length > 0 && !stmtBankId) {
      setStmtBankId(allAccs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('bankStoreUpdated', loadData);
    window.addEventListener('loanStoreUpdated', loadData);
    return () => {
      window.removeEventListener('bankStoreUpdated', loadData);
      window.removeEventListener('loanStoreUpdated', loadData);
    };
  }, []);

  // Combined balance calculation
  const combinedBalance = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'Active')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const bankTotal = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'Active' && a.accountType !== 'Cash')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const cashTotal = useMemo(() => {
    return accounts
      .filter((a) => a.status === 'Active' && a.accountType === 'Cash')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        acc.bankName.toLowerCase().includes(q) ||
        acc.accountHolderName.toLowerCase().includes(q) ||
        acc.accountNumber.toLowerCase().includes(q) ||
        (acc.ifscCode && acc.ifscCode.toLowerCase().includes(q));

      const matchesType = typeFilter === 'All' || acc.accountType === typeFilter;
      const matchesStatus =
        statusFilter === 'All'
          ? true
          : statusFilter === 'Archived'
          ? acc.status === 'Archived'
          : acc.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, searchQuery, typeFilter, statusFilter]);

  // Toggle mask state for an account
  const toggleMask = (accId) => {
    setUnmaskedAccs((prev) => ({ ...prev, [accId]: !prev[accId] }));
  };

  // ─────────────────────────────────────────────────────────────
  // ACCOUNT ADD / EDIT HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleOpenAddModal = () => {
    setEditingAccountId(null);
    setAccountFormData({
      bankName: 'State Bank of India',
      accountHolderName: '',
      accountNumber: '',
      ifscCode: 'SBIN0001234',
      accountType: 'Savings',
      openingBalance: '',
      currentBalance: '',
      status: 'Active',
    });
    setShowAccountModal(true);
  };

  const handleOpenEditModal = (acc) => {
    setEditingAccountId(acc.id);
    setAccountFormData({
      bankName: acc.bankName,
      accountHolderName: acc.accountHolderName,
      accountNumber: acc.accountNumber,
      ifscCode: acc.ifscCode || '',
      accountType: acc.accountType,
      openingBalance: acc.openingBalance,
      currentBalance: acc.currentBalance,
      status: acc.status,
    });
    setShowAccountModal(true);
  };

  const handleBankSelect = (e) => {
    const selectedBank = e.target.value;
    const preset = INDIAN_BANKS_PRESETS.find((p) => p.name === selectedBank);
    setAccountFormData((prev) => ({
      ...prev,
      bankName: selectedBank,
      accountType: selectedBank.toLowerCase().includes('cash') ? 'Cash' : prev.accountType,
      ifscCode: preset ? `${preset.ifscPrefix}1234` : prev.ifscCode,
    }));
  };

  const handleSaveAccount = (e) => {
    e.preventDefault();
    if (!accountFormData.bankName || !accountFormData.accountHolderName || !accountFormData.accountNumber) {
      alert('Please fill in all mandatory account details.');
      return;
    }

    const openBal = Number(accountFormData.openingBalance) || 0;
    const currBal =
      accountFormData.currentBalance !== '' && accountFormData.currentBalance !== undefined
        ? Number(accountFormData.currentBalance)
        : openBal;

    bankStore.saveBankAccount({
      id: editingAccountId || undefined,
      ...accountFormData,
      openingBalance: openBal,
      currentBalance: currBal,
    });

    setShowAccountModal(false);
    loadData();
  };

  const handleArchiveToggle = (acc) => {
    if (acc.status === 'Archived') {
      bankStore.unarchiveBankAccount(acc.id);
    } else {
      if (window.confirm(`Archive "${acc.bankName} (${bankStore.maskAccountNumber(acc.accountNumber)})"? It will be hidden from default active totals.`)) {
        bankStore.archiveBankAccount(acc.id);
      }
    }
  };

  const handleDeleteAccount = (accId) => {
    if (window.confirm('Are you sure you want to delete this bank account? All historical ledger entries for this account will remain.')) {
      bankStore.deleteBankAccount(accId);
      loadData();
    }
  };

  // ─────────────────────────────────────────────────────────────
  // TRANSFER FUNDS HANDLERS
  // ─────────────────────────────────────────────────────────────

  const handleOpenTransferModal = (defaultFromId = null) => {
    const activeAccs = accounts.filter((a) => a.status === 'Active');
    const fromId = defaultFromId || (activeAccs[0] ? activeAccs[0].id : '');
    const toId = activeAccs.find((a) => a.id !== fromId)?.id || '';

    setTransferFormData({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: '',
      date: getLocalDateString(),
      referenceNumber: 'TRF' + Math.floor(100000 + Math.random() * 900000),
      notes: '',
    });
    setShowTransferModal(true);
  };

  const handlePreTransferSubmit = (e) => {
    e.preventDefault();
    const amt = Number(transferFormData.amount);
    if (!amt || amt <= 0) {
      alert('Please enter a valid transfer amount.');
      return;
    }
    if (transferFormData.fromAccountId === transferFormData.toAccountId) {
      alert('Source and destination accounts must be different.');
      return;
    }
    const fromAcc = accounts.find((a) => a.id === transferFormData.fromAccountId);
    if (fromAcc && fromAcc.currentBalance < amt) {
      if (!window.confirm(`⚠️ Notice: Account balance (₹${fromAcc.currentBalance.toLocaleString('en-IN')}) is less than transfer amount (₹${amt.toLocaleString('en-IN')}). Proceed anyway?`)) {
        return;
      }
    }
    setShowTransferModal(false);
    setShowTransferConfirmModal(true);
  };

  const handleExecuteTransfer = () => {
    try {
      bankStore.recordBankTransfer(transferFormData);
      setShowTransferConfirmModal(false);
      loadData();
      alert('✓ Transfer completed successfully!');
    } catch (err) {
      alert('❌ Transfer Failed: ' + err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // BANK STATEMENT DATA COMPUTATION & EXPORT
  // ─────────────────────────────────────────────────────────────

  const selectedStatementAccount = useMemo(() => {
    return accounts.find((a) => a.id === stmtBankId) || accounts[0] || {};
  }, [accounts, stmtBankId]);

  const statementFilteredTransactions = useMemo(() => {
    let list = transactions.filter((t) => {
      let matchesAcc = !stmtBankId || t.bankAccountId === stmtBankId;
      let matchesType = stmtType === 'All' || t.type === stmtType;
      let matchesCustomer = !stmtCustomerId || t.customerId === stmtCustomerId;
      let matchesLoan = !stmtLoanId || t.loanId === stmtLoanId;

      let matchesDate = true;
      const today = getLocalDateString();
      if (stmtDateRange === 'Today') {
        matchesDate = t.date === today;
      } else if (stmtDateRange === 'This Week') {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        matchesDate = new Date(t.date) >= d;
      } else if (stmtDateRange === 'This Month') {
        const monthPrefix = today.substring(0, 7);
        matchesDate = (t.date || '').startsWith(monthPrefix);
      } else if (stmtDateRange === 'Custom') {
        if (stmtStartDate && t.date < stmtStartDate) matchesDate = false;
        if (stmtEndDate && t.date > stmtEndDate) matchesDate = false;
      }

      return matchesAcc && matchesType && matchesCustomer && matchesLoan && matchesDate;
    });

    return list.sort((a, b) => new Date(a.dateTime || a.date) - new Date(b.dateTime || b.date));
  }, [transactions, stmtBankId, stmtType, stmtCustomerId, stmtLoanId, stmtDateRange, stmtStartDate, stmtEndDate]);

  // Statement summary metrics
  const statementSummary = useMemo(() => {
    const totalIn = statementFilteredTransactions.reduce((sum, t) => sum + Number(t.moneyIn || (t.type === 'Credit' ? t.amount : 0)), 0);
    const totalOut = statementFilteredTransactions.reduce((sum, t) => sum + Number(t.moneyOut || (t.type === 'Debit' ? t.amount : 0)), 0);
    const openBal = selectedStatementAccount.openingBalance || 0;
    const closingBal = openBal + totalIn - totalOut;

    return {
      openingBalance: openBal,
      totalMoneyIn: totalIn,
      totalMoneyOut: totalOut,
      closingBalance: closingBal,
      count: statementFilteredTransactions.length,
    };
  }, [statementFilteredTransactions, selectedStatementAccount]);

  // Export PDF Statement
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const acc = selectedStatementAccount;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(26, 79, 156);
    doc.text(settings.companyName || 'R Accountant', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Official Bank Account Statement | Managed by: ${settings.ownerName || 'Rahul Chauhan'} | Period: ${stmtDateRange}`, 14, 26);
    doc.text(`Email: ${settings.email || 'rahul@raccountant.com'} | Phone: ${settings.phone || '+91 98765 43210'}`, 14, 31);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    // Account Details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('ACCOUNT SUMMARY', 14, 43);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank Name: ${acc.bankName || 'N/A'}`, 14, 50);
    doc.text(`Account Holder: ${acc.accountHolderName || 'N/A'}`, 14, 55);
    doc.text(`Account Number: ${acc.accountNumber || 'N/A'}`, 14, 60);
    doc.text(`IFSC Code: ${acc.ifscCode || 'N/A'}`, 14, 65);

    doc.text(`Opening Balance: Rs. ${Number(statementSummary.openingBalance).toLocaleString('en-IN')}`, 120, 50);
    doc.text(`Total Money Received (+): Rs. ${Number(statementSummary.totalMoneyIn).toLocaleString('en-IN')}`, 120, 55);
    doc.text(`Total Money Paid (-): Rs. ${Number(statementSummary.totalMoneyOut).toLocaleString('en-IN')}`, 120, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(`Closing Balance: Rs. ${Number(statementSummary.closingBalance).toLocaleString('en-IN')}`, 120, 66);

    // Transactions Table
    const tableRows = statementFilteredTransactions.map((t, idx) => [
      idx + 1,
      formatIndianDate(t.date),
      t.id,
      t.description || t.category,
      t.paymentMethod || 'UPI',
      t.moneyIn > 0 ? `+ Rs. ${t.moneyIn.toLocaleString('en-IN')}` : '-',
      t.moneyOut > 0 ? `- Rs. ${t.moneyOut.toLocaleString('en-IN')}` : '-',
      `Rs. ${Number(t.balanceAfter || 0).toLocaleString('en-IN')}`,
    ]);

    doc.autoTable({
      startY: 72,
      head: [['#', 'Date', 'Txn ID', 'Description', 'Method', 'Money In', 'Money Out', 'Balance']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [26, 79, 156] },
      styles: { fontSize: 8 },
    });

    doc.save(`Bank_Statement_${acc.bankName}_${getLocalDateString()}.pdf`);
  };

  // Export Excel Statement
  const handleExportExcel = () => {
    const acc = selectedStatementAccount;
    const data = statementFilteredTransactions.map((t, idx) => ({
      'S.No': idx + 1,
      'Date': formatIndianDate(t.date),
      'Transaction ID': t.id,
      'Bank Name': t.bankName,
      'Account Number': t.accountNumber,
      'Category': t.category,
      'Description': t.description,
      'Customer': t.customerName || '—',
      'Loan': t.loanName || '—',
      'Payment Method': t.paymentMethod,
      'Money In (₹)': Number(t.moneyIn || 0),
      'Money Out (₹)': Number(t.moneyOut || 0),
      'Balance Before (₹)': Number(t.balanceBefore || 0),
      'Balance After (₹)': Number(t.balanceAfter || 0),
      'Reference / UTR': t.referenceNumber || '—',
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement');
    XLSX.writeFile(workbook, `Bank_Statement_${acc.bankName}_${getLocalDateString()}.xlsx`);
  };

  // Export CSV Statement
  const handleExportCSV = () => {
    const acc = selectedStatementAccount;
    const headers = ['S.No,Date,TxnID,Description,PaymentMethod,MoneyIn,MoneyOut,BalanceAfter,Reference'];
    const rows = statementFilteredTransactions.map((t, idx) => 
      `"${idx + 1}","${t.date}","${t.id}","${(t.description || '').replace(/"/g, '""')}","${t.paymentMethod}","${t.moneyIn || 0}","${t.moneyOut || 0}","${t.balanceAfter || 0}","${t.referenceNumber || ''}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Statement_${acc.bankName}_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh', paddingBottom: '120px' }}>
      
      {/* ── Page Header ── */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <span className="p-2 bg-primary bg-opacity-10 text-primary rounded-3">
              <MdAccountBalance size={24} />
            </span>
            Bank Account Management
          </h4>
          <p className="text-muted small mb-0">Manage business bank accounts, cash vaults, inter-bank transfers, and real-time ledger statements</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button 
            type="button" 
            className="btn btn-outline-primary rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-1.5 shadow-2xs"
            onClick={() => handleOpenTransferModal()}
          >
            <MdSwapHoriz size={20} /> Transfer Funds
          </button>

          <button 
            type="button" 
            className="btn btn-primary text-white rounded-3 px-3.5 py-2 fw-bold shadow-sm d-flex align-items-center gap-1.5"
            onClick={handleOpenAddModal}
          >
            <MdAddCircle size={20} /> Add Bank Account
          </button>
        </div>
      </div>

      {/* ── Top Financial Overview KPI Cards ── */}
      <div className="row g-3 g-lg-4 mb-4">
        {/* Total Combined Balance */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm hover-lift transition-all" style={{ borderTop: '4px solid #1a4f9c' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Combined Total Balance</p>
                <h3 className="fw-bold mb-0 text-dark">₹{combinedBalance.toLocaleString('en-IN')}</h3>
                <small className="text-success fw-semibold mt-1 d-block">● Across {accounts.filter(a => a.status === 'Active').length} Active Accounts</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(26, 79, 156, 0.12)', color: '#1a4f9c' }}>
                <MdAccountBalanceWallet size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Bank Balances */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm hover-lift transition-all" style={{ borderTop: '4px solid #0ea5e9' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Bank Accounts</p>
                <h3 className="fw-bold mb-0 text-primary">₹{bankTotal.toLocaleString('en-IN')}</h3>
                <small className="text-muted mt-1 d-block">{accounts.filter(a => a.status === 'Active' && a.accountType !== 'Cash').length} Institutional Banks</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
                <MdAccountBalance size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Cash in Hand Vault */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm hover-lift transition-all" style={{ borderTop: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Cash in Hand / Chest</p>
                <h3 className="fw-bold mb-0 text-success">₹{cashTotal.toLocaleString('en-IN')}</h3>
                <small className="text-muted mt-1 d-block">Physical Liquidity</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <MdPayments size={26} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Ledger Transactions */}
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm hover-lift transition-all" style={{ borderTop: '4px solid #8b5cf6' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold text-uppercase" style={{ letterSpacing: '0.5px' }}>Total Transactions</p>
                <h3 className="fw-bold mb-0 text-purple" style={{ color: '#8b5cf6' }}>{transactions.length}</h3>
                <small className="text-muted mt-1 d-block">{transfers.length} Bank Transfers</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <MdReceiptLong size={26} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
        <div className="d-flex overflow-auto border-bottom bg-white px-3 pt-2" style={{ scrollbarWidth: 'none' }}>
          <button 
            type="button" 
            className={`btn btn-link text-decoration-none px-4 py-3 fw-bold border-0 border-bottom border-3 rounded-0 ${activeTab === 'accounts' ? 'border-primary text-primary' : 'border-transparent text-secondary'}`}
            onClick={() => setActiveTab('accounts')}
          >
            🏛️ Bank Accounts ({accounts.length})
          </button>

          <button 
            type="button" 
            className={`btn btn-link text-decoration-none px-4 py-3 fw-bold border-0 border-bottom border-3 rounded-0 ${activeTab === 'statements' ? 'border-primary text-primary' : 'border-transparent text-secondary'}`}
            onClick={() => setActiveTab('statements')}
          >
            📄 Bank Statements &amp; Reports
          </button>

          <button 
            type="button" 
            className={`btn btn-link text-decoration-none px-4 py-3 fw-bold border-0 border-bottom border-3 rounded-0 ${activeTab === 'transactions' ? 'border-primary text-primary' : 'border-transparent text-secondary'}`}
            onClick={() => setActiveTab('transactions')}
          >
            📊 Transaction Ledger ({transactions.length})
          </button>

          <button 
            type="button" 
            className={`btn btn-link text-decoration-none px-4 py-3 fw-bold border-0 border-bottom border-3 rounded-0 ${activeTab === 'transfers' ? 'border-primary text-primary' : 'border-transparent text-secondary'}`}
            onClick={() => setActiveTab('transfers')}
          >
            🔄 Transfer History ({transfers.length})
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TAB 1: BANK ACCOUNTS GRID & MANAGEMENT
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'accounts' && (
          <div className="p-3 p-md-4">
            
            {/* Search and Filters */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-4">
              <div className="input-group input-group-sm flex-grow-1" style={{ maxWidth: '360px' }}>
                <span className="input-group-text bg-white border-end-0"><MdSearch size={18} className="text-muted" /></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Search bank name, holder, account number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="d-flex align-items-center gap-2 flex-wrap">
                {/* Account Type Filter */}
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  {ACCOUNT_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>

                {/* Status Filter */}
                <div className="btn-group btn-group-sm">
                  {['Active', 'All', 'Archived'].map((st) => (
                    <button 
                      key={st}
                      type="button" 
                      className={`btn btn-sm ${statusFilter === st ? 'btn-primary fw-bold' : 'btn-outline-secondary bg-white'}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bank Accounts Grid */}
            <div className="row g-3 g-lg-4">
              {filteredAccounts.length === 0 ? (
                <div className="col-12 text-center py-5 text-muted">
                  <MdAccountBalance size={48} className="opacity-25 mb-2 d-block mx-auto" />
                  <h5>No bank accounts found</h5>
                  <p className="small mb-3">Click below to add your first bank or cash account</p>
                  <button className="btn btn-primary btn-sm rounded-pill px-4" onClick={handleOpenAddModal}>
                    <MdAddCircle size={16} /> Add Bank Account
                  </button>
                </div>
              ) : (
                filteredAccounts.map((acc) => {
                  const isUnmasked = unmaskedAccs[acc.id];
                  const displayAccNum = bankStore.maskAccountNumber(acc.accountNumber, isUnmasked);
                  const isCash = acc.accountType === 'Cash';

                  return (
                    <div key={acc.id} className="col-12 col-md-6 col-xl-4">
                      <div 
                        className="card h-100 border rounded-4 p-4 bg-white shadow-2xs position-relative hover-lift transition-all"
                        style={{ borderLeft: `6px solid ${acc.color || '#0d6efd'}` }}
                      >
                        {/* Header: Logo, Bank Name, Status Badge */}
                        <div className="d-flex justify-content-between align-items-start mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div 
                              className="rounded-3 d-flex align-items-center justify-content-center flex-shrink-0 shadow-2xs"
                              style={{ width: 44, height: 44, background: `${acc.color || '#0d6efd'}15`, fontSize: '1.4rem' }}
                            >
                              {acc.logoIcon || (isCash ? '💵' : '🏦')}
                            </div>
                            <div>
                              <h5 className="fw-bold text-dark mb-0 text-truncate" style={{ maxWidth: '170px' }}>{acc.bankName}</h5>
                              <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill small" style={{ fontSize: '0.68rem' }}>
                                {acc.accountType} Account
                              </span>
                            </div>
                          </div>

                          <div className="d-flex align-items-center gap-1">
                            <span className={`badge rounded-pill ${acc.status === 'Active' ? 'bg-success' : acc.status === 'Archived' ? 'bg-secondary' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>
                              {acc.status}
                            </span>
                          </div>
                        </div>

                        {/* Account Details */}
                        <div className="p-3 bg-light rounded-3 mb-3 border">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Account Holder:</span>
                            <span className="fw-semibold text-dark small text-truncate" style={{ maxWidth: '180px' }}>{acc.accountHolderName}</span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <span className="text-muted small">Account No:</span>
                            <div className="d-flex align-items-center gap-1.5 font-monospace">
                              <span className="fw-bold text-dark small">{displayAccNum}</span>
                              <button 
                                type="button" 
                                className="btn btn-sm btn-link p-0 text-secondary" 
                                onClick={() => toggleMask(acc.id)}
                                title={isUnmasked ? 'Mask Account Number' : 'Reveal Account Number'}
                              >
                                {isUnmasked ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                              </button>
                            </div>
                          </div>

                          {acc.ifscCode && (
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="text-muted small">IFSC Code:</span>
                              <span className="font-monospace fw-semibold text-dark small">{acc.ifscCode}</span>
                            </div>
                          )}
                        </div>

                        {/* Balance Section */}
                        <div className="d-flex justify-content-between align-items-end mb-3">
                          <div>
                            <span className="text-muted small d-block">Available Current Balance</span>
                            <h3 className="fw-bold mb-0 text-dark" style={{ letterSpacing: '-0.5px' }}>
                              ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN')}
                            </h3>
                          </div>
                          {acc.lastTransactionDate && (
                            <small className="text-muted text-end" style={{ fontSize: '0.72rem' }}>
                              Last Txn:<br />{formatIndianDate(acc.lastTransactionDate)}
                            </small>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="d-flex align-items-center justify-content-between pt-3 border-top gap-2">
                          <button 
                            type="button" 
                            className="btn btn-outline-primary btn-sm rounded-3 fw-semibold flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                            onClick={() => {
                              setStmtBankId(acc.id);
                              setActiveTab('statements');
                            }}
                          >
                            <MdReceiptLong size={16} /> Statement
                          </button>

                          <button 
                            type="button" 
                            className="btn btn-outline-success btn-sm rounded-3 fw-semibold flex-grow-1 d-flex align-items-center justify-content-center gap-1"
                            onClick={() => handleOpenTransferModal(acc.id)}
                          >
                            <MdSwapHoriz size={16} /> Transfer
                          </button>

                          <div className="dropdown">
                            <button 
                              className="btn btn-light btn-sm rounded-3 border p-1.5 text-secondary" 
                              type="button" 
                              data-bs-toggle="dropdown" 
                              aria-expanded="false"
                            >
                              •••
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-3">
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleOpenEditModal(acc)}>
                                  <MdEdit size={16} className="text-primary" /> Edit Account
                                </button>
                              </li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 small" onClick={() => handleArchiveToggle(acc)}>
                                  {acc.status === 'Archived' ? (
                                    <><MdUnarchive size={16} className="text-success" /> Unarchive Account</>
                                  ) : (
                                    <><MdArchive size={16} className="text-warning" /> Archive Account</>
                                  )}
                                </button>
                              </li>
                              <li><hr className="dropdown-divider my-1 opacity-10" /></li>
                              <li>
                                <button className="dropdown-item d-flex align-items-center gap-2 py-2 text-danger small fw-semibold" onClick={() => handleDeleteAccount(acc.id)}>
                                  <MdDelete size={16} /> Delete Account
                                </button>
                              </li>
                            </ul>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 2: BANK STATEMENTS GENERATOR
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'statements' && (
          <div className="p-3 p-md-4">
            
            {/* Filter Bar */}
            <div className="card p-3 bg-light rounded-4 border-0 mb-4 shadow-2xs">
              <div className="row g-3 align-items-end">
                {/* Select Bank Account */}
                <div className="col-12 col-sm-6 col-lg-3">
                  <label className="form-label small fw-bold text-dark mb-1">Bank Account</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={stmtBankId} 
                    onChange={(e) => setStmtBankId(e.target.value)}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.bankName} ({bankStore.maskAccountNumber(a.accountNumber)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Transaction Type */}
                <div className="col-12 col-sm-6 col-lg-2">
                  <label className="form-label small fw-bold text-dark mb-1">Transaction Type</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={stmtType} 
                    onChange={(e) => setStmtType(e.target.value)}
                  >
                    <option value="All">All Types</option>
                    <option value="Credit">Money In (Credit)</option>
                    <option value="Debit">Money Out (Debit)</option>
                  </select>
                </div>

                {/* Date Range Preset */}
                <div className="col-12 col-sm-6 col-lg-2">
                  <label className="form-label small fw-bold text-dark mb-1">Date Period</label>
                  <select 
                    className="form-select form-select-sm" 
                    value={stmtDateRange} 
                    onChange={(e) => setStmtDateRange(e.target.value)}
                  >
                    <option value="Today">Today</option>
                    <option value="This Week">This Week (7 Days)</option>
                    <option value="This Month">This Month</option>
                    <option value="All">All Time</option>
                    <option value="Custom">Custom Date Range</option>
                  </select>
                </div>

                {/* Custom Dates if selected */}
                {stmtDateRange === 'Custom' && (
                  <>
                    <div className="col-6 col-lg-2">
                      <label className="form-label small fw-bold text-dark mb-1">From</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={stmtStartDate} 
                        onChange={(e) => setStmtStartDate(e.target.value)} 
                      />
                    </div>
                    <div className="col-6 col-lg-2">
                      <label className="form-label small fw-bold text-dark mb-1">To</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={stmtEndDate} 
                        onChange={(e) => setStmtEndDate(e.target.value)} 
                      />
                    </div>
                  </>
                )}

                {/* Export Buttons */}
                <div className="col-12 col-lg-3 ms-auto d-flex gap-2 justify-content-lg-end">
                  <button 
                    type="button" 
                    className="btn btn-danger btn-sm rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
                    onClick={handleExportPDF}
                    title="Download Official PDF Statement"
                  >
                    <MdPictureAsPdf size={16} /> PDF
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-success btn-sm rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
                    onClick={handleExportExcel}
                    title="Export Excel Worksheet"
                  >
                    <MdFileDownload size={16} /> Excel
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm bg-white rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
                    onClick={handleExportCSV}
                    title="Export CSV"
                  >
                    CSV
                  </button>

                  <button 
                    type="button" 
                    className="btn btn-outline-primary btn-sm bg-white rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
                    onClick={() => window.print()}
                    title="Print Statement"
                  >
                    <MdPrint size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Statement Summary Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <div className="row g-3 text-center text-sm-start align-items-center">
                <div className="col-12 col-sm-6 col-lg-3 border-end">
                  <span className="text-muted small fw-semibold d-block">Opening Balance</span>
                  <h4 className="fw-bold text-dark mb-0">₹{Number(statementSummary.openingBalance).toLocaleString('en-IN')}</h4>
                </div>

                <div className="col-12 col-sm-6 col-lg-3 border-end">
                  <span className="text-success small fw-semibold d-block">Total Money Received (+)</span>
                  <h4 className="fw-bold text-success mb-0">+₹{Number(statementSummary.totalMoneyIn).toLocaleString('en-IN')}</h4>
                </div>

                <div className="col-12 col-sm-6 col-lg-3 border-end">
                  <span className="text-danger small fw-semibold d-block">Total Money Paid (-)</span>
                  <h4 className="fw-bold text-danger mb-0">-₹{Number(statementSummary.totalMoneyOut).toLocaleString('en-IN')}</h4>
                </div>

                <div className="col-12 col-sm-6 col-lg-3">
                  <span className="text-primary small fw-semibold d-block">Closing Balance</span>
                  <h4 className="fw-bold text-primary mb-0">₹{Number(statementSummary.closingBalance).toLocaleString('en-IN')}</h4>
                </div>
              </div>
            </div>

            {/* Statement Table */}
            <div className="table-responsive rounded-4 border bg-white shadow-2xs">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase" style={{ fontSize: '0.72rem' }}>
                    <th className="px-3 py-3">Date</th>
                    <th className="py-3">Txn ID</th>
                    <th className="py-3">Description / Category</th>
                    <th className="py-3">Party / Loan</th>
                    <th className="py-3">Method</th>
                    <th className="py-3 text-end text-success">Money In (+)</th>
                    <th className="py-3 text-end text-danger">Money Out (-)</th>
                    <th className="py-3 text-end px-3">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statementFilteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No transactions found for the selected account and date filter.
                      </td>
                    </tr>
                  ) : (
                    statementFilteredTransactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2.5">
                          <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                            {formatIndianDate(t.date)}
                          </span>
                        </td>
                        <td>
                          <span className="font-monospace small text-muted">{t.id}</span>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark d-block small">{t.description}</span>
                          <small className="text-muted" style={{ fontSize: '0.7rem' }}>{t.category}</small>
                        </td>
                        <td>
                          {t.customerName ? (
                            <div>
                              <span className="fw-semibold text-dark small">{t.customerName}</span>
                              {t.loanName && <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>{t.loanName}</small>}
                            </div>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill" style={{ fontSize: '0.7rem' }}>
                            {t.paymentMethod}
                          </span>
                        </td>
                        <td className="text-end">
                          {t.moneyIn > 0 ? (
                            <span className="fw-bold text-success font-monospace">
                              +₹{Number(t.moneyIn).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end">
                          {t.moneyOut > 0 ? (
                            <span className="fw-bold text-danger font-monospace">
                              -₹{Number(t.moneyOut).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="text-end px-3">
                          <span className="fw-bold text-dark font-monospace">
                            ₹{Number(t.balanceAfter || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 3: COMPLETE LEDGER TRANSACTIONS
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'transactions' && (
          <div className="p-3 p-md-4">
            <div className="table-responsive rounded-4 border bg-white shadow-2xs">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase" style={{ fontSize: '0.72rem' }}>
                    <th className="px-3 py-3">Date</th>
                    <th className="py-3">Bank / Account</th>
                    <th className="py-3">Description</th>
                    <th className="py-3">Type</th>
                    <th className="py-3 text-end">Amount</th>
                    <th className="py-3 text-end">Balance Before</th>
                    <th className="py-3 text-end px-3">Balance After</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No transactions recorded yet. Transactions will automatically appear here when recording payments, expenses, or transfers.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2.5">
                          <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                            {formatIndianDate(t.date)}
                          </span>
                        </td>
                        <td>
                          <span className="fw-semibold text-dark d-block small">{t.bankName}</span>
                          <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                            {bankStore.maskAccountNumber(t.accountNumber)}
                          </small>
                        </td>
                        <td>
                          <span className="text-dark small d-block">{t.description}</span>
                          {t.referenceNumber && (
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                              Ref: {t.referenceNumber}
                            </small>
                          )}
                        </td>
                        <td>
                          <span className={`badge rounded-pill ${t.type === 'Credit' || t.type === 'Transfer In' ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.7rem' }}>
                            {t.type}
                          </span>
                        </td>
                        <td className="text-end">
                          <span className={`fw-bold font-monospace ${t.type === 'Credit' || t.type === 'Transfer In' ? 'text-success' : 'text-danger'}`}>
                            {t.type === 'Credit' || t.type === 'Transfer In' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="text-end font-monospace text-muted small">
                          ₹{Number(t.balanceBefore || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="text-end px-3 font-monospace fw-bold text-dark">
                          ₹{Number(t.balanceAfter || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─────────────────────────────────────────────────────────────
            TAB 4: BANK-TO-BANK TRANSFERS HISTORY
        ───────────────────────────────────────────────────────────── */}
        {activeTab === 'transfers' && (
          <div className="p-3 p-md-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="fw-bold text-dark mb-0">Inter-Bank Funds Transfer Log</h6>
              <button 
                type="button" 
                className="btn btn-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
                onClick={() => handleOpenTransferModal()}
              >
                <MdSwapHoriz size={18} /> New Bank Transfer
              </button>
            </div>

            <div className="table-responsive rounded-4 border bg-white shadow-2xs">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase" style={{ fontSize: '0.72rem' }}>
                    <th className="px-3 py-3">Date</th>
                    <th className="py-3">Transfer ID</th>
                    <th className="py-3">From Account</th>
                    <th className="py-3">To Account</th>
                    <th className="py-3 text-end">Amount (₹)</th>
                    <th className="py-3">Ref / UTR</th>
                    <th className="py-3">Notes</th>
                    <th className="py-3 text-center px-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-5 text-muted">
                        No bank transfers recorded yet.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((trf) => (
                      <tr key={trf.id}>
                        <td className="px-3 py-2.5">
                          <span className="badge bg-light text-dark border px-2 py-1 font-monospace">
                            {formatIndianDate(trf.date)}
                          </span>
                        </td>
                        <td>
                          <span className="font-monospace small fw-semibold text-muted">{trf.id}</span>
                        </td>
                        <td>
                          <span className="fw-semibold text-danger d-block small">{trf.fromBankName}</span>
                          <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                            {bankStore.maskAccountNumber(trf.fromAccountNumber)}
                          </small>
                        </td>
                        <td>
                          <span className="fw-semibold text-success d-block small">{trf.toBankName}</span>
                          <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>
                            {bankStore.maskAccountNumber(trf.toAccountNumber)}
                          </small>
                        </td>
                        <td className="text-end">
                          <span className="fw-bold text-dark font-monospace">
                            ₹{Number(trf.amount).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td>
                          <span className="font-monospace small text-muted">{trf.referenceNumber || '—'}</span>
                        </td>
                        <td>
                          <span className="text-muted small">{trf.notes || '—'}</span>
                        </td>
                        <td className="text-center px-3">
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2 py-1 small">
                            {trf.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* ─────────────────────────────────────────────────────────────
          MODAL: ADD / EDIT BANK ACCOUNT
      ───────────────────────────────────────────────────────────── */}
      {showAccountModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalance className="text-primary" />
                  {editingAccountId ? 'Edit Bank Account' : 'Add New Bank Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAccountModal(false)}></button>
              </div>

              <form onSubmit={handleSaveAccount}>
                <div className="modal-body py-3">
                  {/* Preset Bank Picker */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Select Bank / Preset</label>
                    <select 
                      className="form-select" 
                      value={accountFormData.bankName} 
                      onChange={handleBankSelect}
                    >
                      {INDIAN_BANKS_PRESETS.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.icon} {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Holder Name */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Account Holder Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="e.g. Rahul Chauhan or Business Name" 
                      value={accountFormData.accountHolderName}
                      onChange={(e) => setAccountFormData({ ...accountFormData, accountHolderName: e.target.value })}
                      required 
                    />
                  </div>

                  {/* Account Number */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Account Number *</label>
                    <input 
                      type="text" 
                      className="form-control font-monospace" 
                      placeholder="e.g. 389201948201" 
                      value={accountFormData.accountNumber}
                      onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value })}
                      required 
                    />
                  </div>

                  {/* IFSC Code & Account Type */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">IFSC Code</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace text-uppercase" 
                        placeholder="e.g. SBIN0001234" 
                        value={accountFormData.ifscCode}
                        onChange={(e) => setAccountFormData({ ...accountFormData, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Account Type</label>
                      <select 
                        className="form-select" 
                        value={accountFormData.accountType}
                        onChange={(e) => setAccountFormData({ ...accountFormData, accountType: e.target.value })}
                      >
                        {ACCOUNT_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Opening Balance & Status */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Opening Balance (₹)</label>
                      <input 
                        type="number" 
                        className="form-control" 
                        placeholder="0.00" 
                        value={accountFormData.openingBalance}
                        onChange={(e) => setAccountFormData({ ...accountFormData, openingBalance: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Status</label>
                      <select 
                        className="form-select" 
                        value={accountFormData.status}
                        onChange={(e) => setAccountFormData({ ...accountFormData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {editingAccountId && (
                    <div className="mb-2">
                      <label className="form-label text-muted fw-semibold small mb-1">Current Balance Override (₹)</label>
                      <input 
                        type="number" 
                        className="form-control font-monospace fw-bold" 
                        value={accountFormData.currentBalance}
                        onChange={(e) => setAccountFormData({ ...accountFormData, currentBalance: e.target.value })}
                      />
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>Only edit if performing a manual balance correction.</small>
                    </div>
                  )}

                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowAccountModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                    {editingAccountId ? 'Update Account' : 'Save Account'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TRANSFER FUNDS
      ───────────────────────────────────────────────────────────── */}
      {showTransferModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdSwapHoriz className="text-primary" />
                  Transfer Funds Between Accounts
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTransferModal(false)}></button>
              </div>

              <form onSubmit={handlePreTransferSubmit}>
                <div className="modal-body py-3">
                  
                  {/* From Bank Account */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">From Bank Account (Sender) *</label>
                    <select 
                      className="form-select" 
                      value={transferFormData.fromAccountId}
                      onChange={(e) => setTransferFormData({ ...transferFormData, fromAccountId: e.target.value })}
                      required
                    >
                      {accounts.filter(a => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} (Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* To Bank Account */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">To Bank Account (Receiver) *</label>
                    <select 
                      className="form-select" 
                      value={transferFormData.toAccountId}
                      onChange={(e) => setTransferFormData({ ...transferFormData, toAccountId: e.target.value })}
                      required
                    >
                      {accounts.filter(a => a.status === 'Active').map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.bankName} (Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Transfer Amount (₹) *</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        className="form-control form-control-lg fw-bold" 
                        placeholder="0.00" 
                        value={transferFormData.amount}
                        onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                        required 
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Date & Reference */}
                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Transfer Date</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={transferFormData.date}
                        onChange={(e) => setTransferFormData({ ...transferFormData, date: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Reference / UTR</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace" 
                        placeholder="e.g. UTR-98273" 
                        value={transferFormData.referenceNumber}
                        onChange={(e) => setTransferFormData({ ...transferFormData, referenceNumber: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-2">
                    <label className="form-label text-muted fw-semibold small mb-1">Notes / Description</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="e.g. Monthly cash vault replenishment or operational fund shift"
                      value={transferFormData.notes}
                      onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                    ></textarea>
                  </div>

                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowTransferModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">
                    Review Transfer &gt;
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL: TRANSFER CONFIRMATION POPUP (SHOWS BEFORE & AFTER BALANCES)
      ───────────────────────────────────────────────────────────── */}
      {showTransferConfirmModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', zIndex: 1060 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-2xl rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdWarning className="text-warning" size={24} />
                  Confirm Funds Transfer
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTransferConfirmModal(false)}></button>
              </div>

              <div className="modal-body py-3">
                <p className="text-muted small mb-4">
                  Please review the balance impact before completing this inter-bank transfer.
                </p>

                {(() => {
                  const fromAcc = accounts.find((a) => a.id === transferFormData.fromAccountId) || {};
                  const toAcc = accounts.find((a) => a.id === transferFormData.toAccountId) || {};
                  const amt = Number(transferFormData.amount || 0);
                  const fromBefore = Number(fromAcc.currentBalance || 0);
                  const fromAfter = fromBefore - amt;
                  const toBefore = Number(toAcc.currentBalance || 0);
                  const toAfter = toBefore + amt;

                  return (
                    <div className="d-flex flex-column gap-3">
                      {/* Sender Box */}
                      <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-danger small">📤 FROM (SENDER): {fromAcc.bankName}</span>
                          <span className="badge bg-danger text-white font-monospace">-₹{amt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Balance Before: ₹{fromBefore.toLocaleString('en-IN')}</span>
                          <span className="fw-bold text-dark">Balance After: ₹{fromAfter.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Receiver Box */}
                      <div className="p-3 bg-success bg-opacity-10 border border-success border-opacity-25 rounded-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-success small">📥 TO (RECEIVER): {toAcc.bankName}</span>
                          <span className="badge bg-success text-white font-monospace">+₹{amt.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="d-flex justify-content-between small text-muted">
                          <span>Balance Before: ₹{toBefore.toLocaleString('en-IN')}</span>
                          <span className="fw-bold text-dark">Balance After: ₹{toAfter.toLocaleString('en-IN')}</span>
                        </div>
                      </div>

                      {/* Transfer Meta */}
                      <div className="p-2.5 bg-light rounded-3 small text-muted border">
                        <div>📅 <strong>Date:</strong> {formatIndianDate(transferFormData.date)}</div>
                        {transferFormData.referenceNumber && <div>🔖 <strong>Ref:</strong> {transferFormData.referenceNumber}</div>}
                        {transferFormData.notes && <div>📝 <strong>Notes:</strong> {transferFormData.notes}</div>}
                      </div>
                    </div>
                  );
                })()}

              </div>

              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowTransferConfirmModal(false)}>Back</button>
                <button type="button" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm" onClick={handleExecuteTransfer}>
                  Confirm &amp; Complete Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default BankAccounts;
