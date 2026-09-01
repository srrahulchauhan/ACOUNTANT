import React, { useState, useEffect, useMemo } from 'react';
import { 
  MdAccountBalance, MdAdd, MdEdit, MdDelete, MdSwapHoriz, 
  MdReceiptLong, MdVisibility, MdVisibilityOff, MdSearch,
  MdFilterList, MdFileDownload, MdPrint, MdCheckCircle,
  MdWarning, MdContentCopy, MdArrowForward, MdArchive, MdUnarchive,
  MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdClose, MdRefresh
} from 'react-icons/md';
import { customerBankStore, INDIAN_BANKS_PRESETS, ACCOUNT_TYPES } from '../utils/customerBankStore';
import { formatIndianDate, getLocalDateString } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CustomerBankManager = ({ customer, loans = [], payments = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState('accounts'); // 'accounts' | 'statement' | 'transfers'
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [unmaskedAccs, setUnmaskedAccs] = useState({});

  // Filter States for Accounts
  const [accountSearch, setAccountSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Statement Filters
  const [statementAccount, setStatementAccount] = useState('All');
  const [statementDateRange, setStatementDateRange] = useState('This Month');
  const [statementStartDate, setStatementStartDate] = useState('');
  const [statementEndDate, setStatementEndDate] = useState('');
  const [statementType, setStatementType] = useState('All');
  const [statementLoan, setStatementLoan] = useState('All');

  // Modal States
  const [showAddAccountModal, setShowAddAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [accountFormData, setAccountFormData] = useState({
    bankName: 'HDFC Bank',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'Savings',
    upiId: '',
    openingBalance: '',
    currentBalance: '',
    status: 'Active',
    notes: '',
  });

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferFormData, setTransferFormData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    referenceNumber: '',
    notes: '',
    date: getLocalDateString(),
  });
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);

  // Quick Deposit / Withdrawal Modal
  const [showDirectTxnModal, setShowDirectTxnModal] = useState(false);
  const [directTxnData, setDirectTxnData] = useState({
    customerBankAccountId: '',
    type: 'Credit',
    amount: '',
    category: 'Payment',
    paymentMethod: 'UPI',
    referenceNumber: '',
    loanId: '',
    notes: '',
    date: getLocalDateString(),
  });
  const [showTxnConfirm, setShowTxnConfirm] = useState(false);

  // Delete & Archive Confirmation
  const [deleteConfirmAcc, setDeleteConfirmAcc] = useState(null);
  const [copyNotification, setCopyNotification] = useState('');

  const loadData = () => {
    if (!customer?.id) return;
    const accs = customerBankStore.getCustomerBankAccounts(customer.id, true);
    setAccounts(accs);
    const txns = customerBankStore.getCustomerTransactions({ customerId: customer.id });
    setTransactions(txns);
    const trfs = customerBankStore.getCustomerTransfers(customer.id);
    setTransfers(trfs);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('customerBankStoreUpdated', loadData);
    return () => window.removeEventListener('customerBankStoreUpdated', loadData);
  }, [customer?.id]);

  // Total balance across active accounts
  const totalCustomerBalance = useMemo(() => {
    return accounts
      .filter(a => a.status === 'Active')
      .reduce((sum, a) => sum + Number(a.currentBalance || 0), 0);
  }, [accounts]);

  const activeAccountsCount = useMemo(() => {
    return accounts.filter(a => a.status === 'Active').length;
  }, [accounts]);

  // Filtered Accounts Grid
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const q = accountSearch.toLowerCase();
      const matchesSearch = 
        acc.bankName.toLowerCase().includes(q) ||
        (acc.accountNumber || '').includes(q) ||
        (acc.upiId || '').toLowerCase().includes(q);
      const matchesType = typeFilter === 'All' || acc.accountType === typeFilter;
      const matchesStatus = statusFilter === 'All' || acc.status === statusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [accounts, accountSearch, typeFilter, statusFilter]);

  // Copy to clipboard helper
  const handleCopyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopyNotification(`${label} copied!`);
    setTimeout(() => setCopyNotification(''), 2500);
  };

  // Toggle Masked state for specific account
  const toggleUnmask = (id) => {
    setUnmaskedAccs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingAccount(null);
    setAccountFormData({
      bankName: 'HDFC Bank',
      accountHolderName: customer.name || '',
      accountNumber: '',
      ifscCode: '',
      accountType: 'Savings',
      upiId: '',
      openingBalance: '0',
      currentBalance: '0',
      status: 'Active',
      notes: '',
    });
    setShowAddAccountModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (acc) => {
    setEditingAccount(acc);
    setAccountFormData({
      bankName: acc.bankName,
      accountHolderName: acc.accountHolderName || customer.name,
      accountNumber: acc.accountNumber,
      ifscCode: acc.ifscCode || '',
      accountType: acc.accountType || 'Savings',
      upiId: acc.upiId || '',
      openingBalance: acc.openingBalance || 0,
      currentBalance: acc.currentBalance || 0,
      status: acc.status || 'Active',
      notes: acc.notes || '',
    });
    setShowAddAccountModal(true);
  };

  // Save Account
  const handleSaveAccount = (e) => {
    e.preventDefault();
    try {
      customerBankStore.saveCustomerBankAccount({
        ...accountFormData,
        id: editingAccount?.id,
        customerId: customer.id,
        customerName: customer.name,
      });
      setShowAddAccountModal(false);
      loadData();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  // Archive / Unarchive
  const handleToggleArchive = (acc) => {
    const newStatus = acc.status === 'Archived' ? 'Active' : 'Archived';
    customerBankStore.updateCustomerAccountStatus(acc.id, newStatus);
    loadData();
  };

  // Delete Account
  const handleDeleteAccount = (accId) => {
    customerBankStore.deleteCustomerBankAccount(accId);
    setDeleteConfirmAcc(null);
    loadData();
  };

  // Open Transfer Modal
  const handleOpenTransfer = (preselectedFromId = null) => {
    const available = accounts.filter(a => a.status === 'Active');
    if (available.length < 2) {
      alert('You need at least 2 active bank accounts for this customer to perform an inter-account transfer.');
      return;
    }
    const fromId = preselectedFromId || available[0].id;
    const toId = available.find(a => a.id !== fromId)?.id || available[1]?.id;

    setTransferFormData({
      fromAccountId: fromId,
      toAccountId: toId,
      amount: '',
      referenceNumber: `CTRF-${Date.now().toString().slice(-6)}`,
      notes: 'Customer Inter-Account Funds Transfer',
      date: getLocalDateString(),
    });
    setShowTransferConfirm(false);
    setShowTransferModal(true);
  };

  // Submit Transfer
  const handleExecuteTransfer = () => {
    try {
      customerBankStore.recordCustomerTransfer({
        ...transferFormData,
        amount: Number(transferFormData.amount),
      });
      setShowTransferConfirm(false);
      setShowTransferModal(false);
      loadData();
      alert('✓ Funds transferred successfully between customer bank accounts!');
    } catch (err) {
      alert('Transfer Failed: ' + err.message);
    }
  };

  // Open Quick Record Transaction Modal
  const handleOpenDirectTxn = (accId = null, defaultType = 'Credit') => {
    const activeAccs = accounts.filter(a => a.status === 'Active');
    if (activeAccs.length === 0) {
      alert('Please add an active customer bank account first.');
      return;
    }
    setDirectTxnData({
      customerBankAccountId: accId || activeAccs[0].id,
      type: defaultType,
      amount: '',
      category: defaultType === 'Credit' ? 'Payment Received' : 'Withdrawal / Refund',
      paymentMethod: 'UPI',
      referenceNumber: `CTXN-${Date.now().toString().slice(-6)}`,
      loanId: loans[0]?.id || '',
      notes: '',
      date: getLocalDateString(),
    });
    setShowTxnConfirm(false);
    setShowDirectTxnModal(true);
  };

  // Execute Quick Transaction
  const handleExecuteDirectTxn = () => {
    try {
      const selectedLoan = loans.find(l => l.id === directTxnData.loanId);
      customerBankStore.recordCustomerTransaction({
        ...directTxnData,
        customerId: customer.id,
        customerName: customer.name,
        loanName: selectedLoan?.loanName || null,
        amount: Number(directTxnData.amount),
        description: directTxnData.notes || `${directTxnData.category} (${directTxnData.paymentMethod})`,
      });
      setShowTxnConfirm(false);
      setShowDirectTxnModal(false);
      loadData();
      alert(`✓ ${directTxnData.type} transaction of ₹${Number(directTxnData.amount).toLocaleString('en-IN')} recorded successfully!`);
    } catch (err) {
      alert('Transaction Error: ' + err.message);
    }
  };

  // ── Statement Computation & Filtering ───────────────────────
  const filteredStatementTxns = useMemo(() => {
    const today = getLocalDateString();
    let startDate = statementStartDate;
    let endDate = statementEndDate;

    if (statementDateRange === 'Today') {
      startDate = today;
      endDate = today;
    } else if (statementDateRange === 'This Week') {
      const now = new Date();
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      startDate = firstDay.toISOString().split('T')[0];
      endDate = today;
    } else if (statementDateRange === 'This Month') {
      startDate = today.substring(0, 7) + '-01';
      endDate = today;
    }

    return transactions.filter(t => {
      const matchesAccount = statementAccount === 'All' || t.customerBankAccountId === statementAccount;
      const matchesType = statementType === 'All' || t.type === statementType;
      const matchesLoan = statementLoan === 'All' || t.loanId === statementLoan;
      const matchesStart = !startDate || t.date >= startDate;
      const matchesEnd = !endDate || t.date <= endDate;
      return matchesAccount && matchesType && matchesLoan && matchesStart && matchesEnd;
    });
  }, [transactions, statementAccount, statementDateRange, statementStartDate, statementEndDate, statementType, statementLoan]);

  const statementMetrics = useMemo(() => {
    const totalCredits = filteredStatementTxns
      .filter(t => t.type === 'Credit' || t.type === 'Transfer In')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalDebits = filteredStatementTxns
      .filter(t => t.type === 'Debit' || t.type === 'Transfer Out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    let openingBal = 0;
    if (statementAccount !== 'All') {
      const target = accounts.find(a => a.id === statementAccount);
      openingBal = Number(target?.openingBalance || 0);
    } else {
      openingBal = accounts.reduce((sum, a) => sum + Number(a.openingBalance || 0), 0);
    }

    const netClosing = openingBal + totalCredits - totalDebits;

    return {
      openingBal,
      totalCredits,
      totalDebits,
      netClosing,
      count: filteredStatementTxns.length,
    };
  }, [filteredStatementTxns, statementAccount, accounts]);

  // ── Statement Export Handlers ────────────────────────────────
  const handleExportCSV = () => {
    if (filteredStatementTxns.length === 0) {
      alert('No transactions to export for the selected filters.');
      return;
    }
    const headers = ['Date', 'Transaction ID', 'Bank Account', 'Description', 'Type', 'Method', 'Reference No', 'Loan', 'Amount (₹)', 'Running Balance (₹)'];
    const rows = filteredStatementTxns.map(t => [
      formatIndianDate(t.date),
      t.id,
      `${t.bankName} (${t.accountNumber})`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.type,
      t.paymentMethod || 'UPI',
      t.referenceNumber || '',
      t.loanName || '-',
      t.amount,
      t.balanceAfter || 0,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bank_Statement_${customer.name.replace(/\s+/g, '_')}_${getLocalDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportExcel = () => {
    if (filteredStatementTxns.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const data = filteredStatementTxns.map(t => ({
      'Date': formatIndianDate(t.date),
      'Transaction ID': t.id,
      'Bank Name': t.bankName,
      'Account Number': t.accountNumber,
      'Description': t.description,
      'Category': t.category,
      'Type': t.type,
      'Method': t.paymentMethod,
      'Reference No': t.referenceNumber,
      'Linked Loan': t.loanName || '-',
      'Amount (₹)': Number(t.amount),
      'Running Balance (₹)': Number(t.balanceAfter || 0),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Customer Statement');
    XLSX.writeFile(wb, `Customer_Bank_Statement_${customer.name.replace(/\s+/g, '_')}_${getLocalDateString()}.xlsx`);
  };

  const handleExportPDF = () => {
    if (filteredStatementTxns.length === 0) {
      alert('No transactions to export.');
      return;
    }
    const doc = new jsPDF();

    // Header
    doc.setFontSize(18);
    doc.setTextColor(26, 79, 156);
    doc.text('R ACCOUNTANT', 14, 18);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text('Customer Bank Account Statement • Managed by Rahul Chauhan', 14, 25);

    // Customer & Period Info
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Customer: ${customer.name} (ID: ${customer.id})`, 14, 33);
    doc.text(`Phone: ${customer.phone || 'N/A'} | PAN: ${customer.panAadhaar || 'N/A'}`, 14, 38);
    doc.text(`Generated On: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, 14, 43);

    // Summary Box
    doc.setFillColor(245, 247, 250);
    doc.roundedRect(14, 47, 182, 18, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.text(`Opening Balance: Rs. ${statementMetrics.openingBal.toLocaleString('en-IN')}`, 18, 54);
    doc.text(`Total Credits (+): Rs. ${statementMetrics.totalCredits.toLocaleString('en-IN')}`, 18, 60);
    doc.text(`Total Debits (-): Rs. ${statementMetrics.totalDebits.toLocaleString('en-IN')}`, 105, 54);
    doc.text(`Net Closing: Rs. ${statementMetrics.netClosing.toLocaleString('en-IN')}`, 105, 60);

    // Table
    const tableRows = filteredStatementTxns.map(t => [
      formatIndianDate(t.date),
      `${t.bankName}\n(${customerBankStore.maskAccountNumber(t.accountNumber)})`,
      t.description || t.category,
      t.type,
      t.paymentMethod || 'UPI',
      (t.type === 'Credit' || t.type === 'Transfer In' ? '+' : '-') + 'Rs. ' + Number(t.amount).toLocaleString('en-IN'),
      'Rs. ' + Number(t.balanceAfter || 0).toLocaleString('en-IN'),
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Date', 'Bank Account', 'Description', 'Type', 'Method', 'Amount', 'Balance']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [26, 79, 156], textColor: 255, fontStyle: 'bold', fontSize: 8 },
      bodyStyles: { fontSize: 7.5 },
      columnStyles: {
        5: { halign: 'right', fontStyle: 'bold' },
        6: { halign: 'right', fontStyle: 'bold' },
      },
    });

    doc.save(`Bank_Statement_${customer.name.replace(/\s+/g, '_')}_${getLocalDateString()}.pdf`);
  };

  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="customer-bank-manager">
      
      {/* Copy Notification Toast */}
      {copyNotification && (
        <div className="position-fixed top-0 start-50 translate-middle-x mt-3 z-3 alert alert-dark py-1.5 px-3 rounded-pill shadow small animate-fadeIn" style={{ zIndex: 9999 }}>
          ✓ {copyNotification}
        </div>
      )}

      {/* Top Total Liquidity Overview Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-3.5 mb-4 text-white" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle p-3 bg-white bg-opacity-20 d-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
              <MdAccountBalanceWallet size={32} />
            </div>
            <div>
              <span className="small text-white text-opacity-75 text-uppercase fw-semibold" style={{ fontSize: '0.72rem', letterSpacing: '0.5px' }}>
                Customer Total Liquidity across Linked Accounts
              </span>
              <h2 className="fw-bold mb-0 font-monospace" style={{ fontSize: '1.8rem' }}>
                ₹{totalCustomerBalance.toLocaleString('en-IN')}
              </h2>
              <small className="text-white text-opacity-90">
                {activeAccountsCount} Active Bank Account{activeAccountsCount === 1 ? '' : 's'} linked to {customer.name}
              </small>
            </div>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button 
              type="button" 
              className="btn btn-light btn-sm rounded-3 fw-bold d-flex align-items-center gap-1.5 px-3 py-2 shadow-2xs hover-lift"
              onClick={handleOpenAddModal}
            >
              <MdAdd size={18} className="text-primary" /> Add Bank Account
            </button>
            <button 
              type="button" 
              className="btn btn-outline-light btn-sm rounded-3 fw-semibold d-flex align-items-center gap-1.5 px-3 py-2 hover-lift"
              onClick={() => handleOpenTransfer()}
              disabled={activeAccountsCount < 2}
              title={activeAccountsCount < 2 ? 'Need at least 2 active accounts' : 'Transfer funds'}
            >
              <MdSwapHoriz size={18} /> Transfer Funds
            </button>
            <button 
              type="button" 
              className="btn btn-warning btn-sm text-dark rounded-3 fw-bold d-flex align-items-center gap-1.5 px-3 py-2 shadow-2xs hover-lift"
              onClick={() => handleOpenDirectTxn(null, 'Credit')}
            >
              ⚡ Record Payment / Inflow
            </button>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Pills */}
      <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3">
        <ul className="nav nav-pills gap-2">
          <li className="nav-item">
            <button 
              className={`nav-link rounded-pill px-3.5 py-1.5 fw-bold small ${activeSubTab === 'accounts' ? 'active shadow-2xs' : 'text-secondary bg-light'}`}
              onClick={() => setActiveSubTab('accounts')}
            >
              🏦 Linked Accounts ({accounts.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link rounded-pill px-3.5 py-1.5 fw-bold small ${activeSubTab === 'statement' ? 'active shadow-2xs' : 'text-secondary bg-light'}`}
              onClick={() => setActiveSubTab('statement')}
            >
              📄 Bank Statements &amp; Ledger ({transactions.length})
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link rounded-pill px-3.5 py-1.5 fw-bold small ${activeSubTab === 'transfers' ? 'active shadow-2xs' : 'text-secondary bg-light'}`}
              onClick={() => setActiveSubTab('transfers')}
            >
              🔁 Transfer History ({transfers.length})
            </button>
          </li>
        </ul>
      </div>

      {/* ── TAB 1: Linked Accounts Grid ───────────────────────────── */}
      {activeSubTab === 'accounts' && (
        <div>
          {/* Filters Bar */}
          <div className="card border-0 shadow-2xs rounded-3 p-3 bg-white mb-3">
            <div className="row g-2 align-items-center">
              <div className="col-12 col-md-5">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-end-0 text-muted"><MdSearch size={16} /></span>
                  <input 
                    type="text" 
                    className="form-control bg-light border-start-0" 
                    placeholder="Search bank name, account number, UPI..."
                    value={accountSearch}
                    onChange={(e) => setAccountSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-6 col-md-3">
                <select 
                  className="form-select form-select-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="col-6 col-md-3">
                <select 
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Statuses</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Closed">Closed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              <div className="col-12 col-md-1 text-end">
                <button className="btn btn-outline-secondary btn-sm w-100" onClick={() => { setAccountSearch(''); setTypeFilter('All'); setStatusFilter('All'); }} title="Reset filters">
                  <MdRefresh size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Accounts Cards List */}
          {filteredAccounts.length === 0 ? (
            <div className="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
              <div className="text-muted mb-2">
                <MdAccountBalance size={48} className="opacity-40 text-primary" />
              </div>
              <h6 className="fw-bold text-dark mb-1">No linked bank accounts found</h6>
              <p className="small text-muted mb-3">Add this customer's bank or cash accounts to track transactions &amp; disburse EMIs.</p>
              <div>
                <button className="btn btn-primary btn-sm rounded-3 px-4 fw-bold shadow-sm" onClick={handleOpenAddModal}>
                  + Add First Bank Account
                </button>
              </div>
            </div>
          ) : (
            <div className="row g-3">
              {filteredAccounts.map((acc) => {
                const isUnmasked = !!unmaskedAccs[acc.id];
                const displayAccNum = isUnmasked ? acc.accountNumber : customerBankStore.maskAccountNumber(acc.accountNumber);

                return (
                  <div key={acc.id} className="col-12 col-md-6 col-xl-6">
                    <div 
                      className={`card border-0 shadow-sm rounded-4 h-100 bg-white overflow-hidden transition-all hover-lift ${acc.status === 'Archived' ? 'opacity-75' : ''}`}
                      style={{ borderLeft: `6px solid ${acc.color || '#0d6efd'} !important` }}
                    >
                      <div className="card-body p-3.5 d-flex flex-column justify-content-between">
                        
                        {/* Top: Logo, Bank Name, Badges */}
                        <div>
                          <div className="d-flex align-items-start justify-content-between gap-2 mb-2.5">
                            <div className="d-flex align-items-center gap-2.5">
                              <span style={{ fontSize: '1.7rem' }}>{acc.bankLogo || '🏦'}</span>
                              <div>
                                <h6 className="fw-bold text-dark mb-0">{acc.bankName}</h6>
                                <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  Holder: <strong className="text-dark">{acc.accountHolderName || customer.name}</strong>
                                </small>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.68rem' }}>
                                {acc.accountType}
                              </span>
                              <span className={`badge rounded-pill px-2 py-1 ${
                                acc.status === 'Active' ? 'bg-success' :
                                acc.status === 'Closed' ? 'bg-danger' :
                                acc.status === 'Archived' ? 'bg-secondary' : 'bg-warning text-dark'
                              }`} style={{ fontSize: '0.68rem' }}>
                                {acc.status}
                              </span>
                            </div>
                          </div>

                          {/* Account Details & UPI */}
                          <div className="p-2.5 rounded-3 bg-light bg-opacity-70 border mb-3">
                            <div className="d-flex align-items-center justify-content-between mb-1.5">
                              <div className="d-flex align-items-center gap-1.5">
                                <small className="text-muted fw-semibold" style={{ fontSize: '0.72rem' }}>A/C Number:</small>
                                <span className="font-monospace fw-bold text-dark small">{displayAccNum}</span>
                                <button 
                                  type="button"
                                  className="btn btn-link btn-sm p-0 text-muted"
                                  onClick={() => toggleUnmask(acc.id)}
                                  title={isUnmasked ? 'Mask Account Number' : 'Reveal Account Number'}
                                >
                                  {isUnmasked ? <MdVisibilityOff size={15} /> : <MdVisibility size={15} />}
                                </button>
                              </div>
                              <button 
                                type="button" 
                                className="btn btn-link btn-sm p-0 text-primary small text-decoration-none"
                                onClick={() => handleCopyText(acc.accountNumber, 'Account Number')}
                                title="Copy full account number"
                              >
                                <MdContentCopy size={13} /> Copy
                              </button>
                            </div>

                            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small">
                              {acc.ifscCode && (
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  IFSC: <strong className="text-dark font-monospace">{acc.ifscCode}</strong>
                                </div>
                              )}
                              {acc.upiId && (
                                <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                                  UPI: <strong className="text-primary font-monospace">{acc.upiId}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Balance & Actions */}
                        <div>
                          <div className="d-flex align-items-end justify-content-between border-top pt-2.5 mb-3">
                            <div>
                              <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Available Current Balance</small>
                              <h4 className="fw-bold text-dark mb-0 font-monospace" style={{ fontSize: '1.35rem' }}>
                                ₹{Number(acc.currentBalance || 0).toLocaleString('en-IN')}
                              </h4>
                            </div>
                            <div className="text-end">
                              <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Opening: ₹{Number(acc.openingBalance || 0).toLocaleString('en-IN')}</small>
                              <small className="text-secondary" style={{ fontSize: '0.68rem' }}>Last Txn: {formatIndianDate(acc.lastTransactionDate)}</small>
                            </div>
                          </div>

                          {/* Quick Action Button Toolbar */}
                          <div className="d-flex flex-wrap align-items-center justify-content-between gap-1.5 pt-1">
                            <div className="d-flex gap-1">
                              <button 
                                type="button"
                                className="btn btn-outline-success btn-sm rounded-2 py-1 px-2.5 fw-bold d-flex align-items-center gap-1"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => handleOpenDirectTxn(acc.id, 'Credit')}
                                title="Deposit / Inflow"
                              >
                                ⚡ Inflow
                              </button>
                              <button 
                                type="button"
                                className="btn btn-outline-danger btn-sm rounded-2 py-1 px-2.5 fw-bold d-flex align-items-center gap-1"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => handleOpenDirectTxn(acc.id, 'Debit')}
                                title="Withdraw / Outflow"
                              >
                                💸 Outflow
                              </button>
                              <button 
                                type="button"
                                className="btn btn-outline-primary btn-sm rounded-2 py-1 px-2.5 fw-semibold d-flex align-items-center gap-1"
                                style={{ fontSize: '0.72rem' }}
                                onClick={() => {
                                  setStatementAccount(acc.id);
                                  setActiveSubTab('statement');
                                }}
                                title="View Statement"
                              >
                                <MdReceiptLong size={14} /> Statement
                              </button>
                            </div>

                            <div className="d-flex align-items-center gap-1">
                              <button 
                                type="button" 
                                className="btn btn-light border btn-sm p-1 rounded-2 text-secondary"
                                onClick={() => handleOpenEditModal(acc)}
                                title="Edit Account"
                              >
                                <MdEdit size={15} />
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-light border btn-sm p-1 rounded-2 text-secondary"
                                onClick={() => handleToggleArchive(acc)}
                                title={acc.status === 'Archived' ? 'Unarchive' : 'Archive'}
                              >
                                {acc.status === 'Archived' ? <MdUnarchive size={15} /> : <MdArchive size={15} />}
                              </button>
                              <button 
                                type="button" 
                                className="btn btn-light border btn-sm p-1 rounded-2 text-danger"
                                onClick={() => setDeleteConfirmAcc(acc)}
                                title="Delete Account"
                              >
                                <MdDelete size={15} />
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Customer Bank Statement ─────────────────────────── */}
      {activeSubTab === 'statement' && (
        <div>
          {/* Statement Filters */}
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-3">
            <div className="row g-2 align-items-center">
              
              <div className="col-12 col-md-3">
                <label className="form-label small fw-semibold text-muted mb-1">Select Bank Account</label>
                <select 
                  className="form-select form-select-sm fw-semibold"
                  value={statementAccount}
                  onChange={(e) => setStatementAccount(e.target.value)}
                >
                  <option value="All">All Linked Accounts ({accounts.length})</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.bankName} ({customerBankStore.maskAccountNumber(a.accountNumber)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold text-muted mb-1">Date Period</label>
                <select 
                  className="form-select form-select-sm"
                  value={statementDateRange}
                  onChange={(e) => setStatementDateRange(e.target.value)}
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              {statementDateRange === 'Custom' && (
                <>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">From Date</label>
                    <input type="date" className="form-control form-control-sm" value={statementStartDate} onChange={e => setStatementStartDate(e.target.value)} />
                  </div>
                  <div className="col-6 col-md-2">
                    <label className="form-label small fw-semibold text-muted mb-1">To Date</label>
                    <input type="date" className="form-control form-control-sm" value={statementEndDate} onChange={e => setStatementEndDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="col-6 col-md-2">
                <label className="form-label small fw-semibold text-muted mb-1">Type</label>
                <select 
                  className="form-select form-select-sm"
                  value={statementType}
                  onChange={(e) => setStatementType(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Credit">Credit (Money In)</option>
                  <option value="Debit">Debit (Money Out)</option>
                </select>
              </div>

              <div className="col-12 col-md-3 ms-auto text-md-end pt-3 pt-md-0">
                <div className="d-flex flex-wrap gap-1.5 justify-content-md-end">
                  <button type="button" className="btn btn-outline-secondary btn-sm rounded-2 fw-bold" onClick={handlePrintStatement} title="Print Statement">
                    <MdPrint size={15} /> Print
                  </button>
                  <button type="button" className="btn btn-outline-danger btn-sm rounded-2 fw-bold" onClick={handleExportPDF} title="Download PDF">
                    <MdFileDownload size={15} /> PDF
                  </button>
                  <button type="button" className="btn btn-outline-success btn-sm rounded-2 fw-bold" onClick={handleExportExcel} title="Export Excel">
                    📊 Excel
                  </button>
                  <button type="button" className="btn btn-outline-primary btn-sm rounded-2 fw-bold" onClick={handleExportCSV} title="Export CSV">
                    CSV
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Statement Summary KPI Cards */}
          <div className="row g-3 mb-3">
            <div className="col-6 col-md-3">
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Opening Balance</small>
                <h5 className="fw-bold text-dark mb-0 font-monospace">₹{statementMetrics.openingBal.toLocaleString('en-IN')}</h5>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Received (+)</small>
                <h5 className="fw-bold text-success mb-0 font-monospace">+₹{statementMetrics.totalCredits.toLocaleString('en-IN')}</h5>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Paid (-)</small>
                <h5 className="fw-bold text-danger mb-0 font-monospace">-₹{statementMetrics.totalDebits.toLocaleString('en-IN')}</h5>
              </div>
            </div>
            <div className="col-6 col-md-3">
              <div className="p-3 bg-white rounded-3 border shadow-2xs">
                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Net Closing Balance</small>
                <h5 className="fw-bold text-primary mb-0 font-monospace">₹{statementMetrics.netClosing.toLocaleString('en-IN')}</h5>
              </div>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th>Account</th>
                    <th>Description &amp; Ref</th>
                    <th>Category</th>
                    <th>Method</th>
                    <th className="text-end">Amount</th>
                    <th className="text-end px-3">Running Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStatementTxns.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No transactions found for the selected account and date filters.
                      </td>
                    </tr>
                  ) : (
                    filteredStatementTxns.map((t) => {
                      const isCredit = t.type === 'Credit' || t.type === 'Transfer In';

                      return (
                        <tr key={t.id}>
                          <td className="px-3 text-nowrap font-monospace text-muted">
                            {formatIndianDate(t.date)}
                          </td>
                          <td>
                            <span className="fw-bold text-dark d-block">{t.bankName}</span>
                            <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                              {customerBankStore.maskAccountNumber(t.accountNumber)}
                            </small>
                          </td>
                          <td>
                            <span className="text-dark d-block fw-semibold">{t.description}</span>
                            {t.referenceNumber && (
                              <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                                Ref: {t.referenceNumber}
                              </small>
                            )}
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border px-2 py-0.5" style={{ fontSize: '0.68rem' }}>
                              {t.category}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-light text-secondary border px-2 py-0.5 rounded-pill" style={{ fontSize: '0.68rem' }}>
                              {t.paymentMethod || 'UPI'}
                            </span>
                          </td>
                          <td className="text-end text-nowrap font-monospace">
                            <span className={`fw-bold ${isCredit ? 'text-success' : 'text-danger'}`}>
                              {isCredit ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="text-end px-3 text-nowrap font-monospace fw-bold text-dark">
                            ₹{Number(t.balanceAfter || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Transfers History ──────────────────────────────── */}
      {activeSubTab === 'transfers' && (
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
            <h6 className="fw-bold text-dark mb-0">Customer Inter-Account Fund Transfers</h6>
            <button 
              type="button" 
              className="btn btn-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-1 shadow-2xs"
              onClick={() => handleOpenTransfer()}
              disabled={activeAccountsCount < 2}
            >
              <MdSwapHoriz size={16} /> New Transfer
            </button>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0 small">
              <thead className="bg-light text-muted text-uppercase" style={{ fontSize: '0.72rem' }}>
                <tr>
                  <th className="py-2.5 px-3">Date &amp; ID</th>
                  <th>Source (From)</th>
                  <th>Destination (To)</th>
                  <th>Transfer Amount</th>
                  <th>Ref &amp; Notes</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5 text-muted">
                      No inter-account transfers recorded yet for this customer.
                    </td>
                  </tr>
                ) : (
                  transfers.map(tr => (
                    <tr key={tr.id}>
                      <td className="px-3">
                        <span className="fw-bold text-dark d-block font-monospace">{formatIndianDate(tr.date)}</span>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>{tr.id}</small>
                      </td>
                      <td>
                        <div className="fw-bold text-danger">{tr.fromBankName}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                          {customerBankStore.maskAccountNumber(tr.fromAccountNumber)} (Bal: ₹{Number(tr.fromBalanceAfter || 0).toLocaleString('en-IN')})
                        </small>
                      </td>
                      <td>
                        <div className="fw-bold text-success">{tr.toBankName}</div>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>
                          {customerBankStore.maskAccountNumber(tr.toAccountNumber)} (Bal: ₹{Number(tr.toBalanceAfter || 0).toLocaleString('en-IN')})
                        </small>
                      </td>
                      <td>
                        <span className="fw-bold font-monospace text-primary">₹{Number(tr.amount).toLocaleString('en-IN')}</span>
                      </td>
                      <td>
                        <span className="text-dark d-block">{tr.notes || 'Fund Transfer'}</span>
                        <small className="text-muted font-monospace" style={{ fontSize: '0.68rem' }}>Ref: {tr.referenceNumber}</small>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODAL 1: Add / Edit Bank Account ──────────────────────── */}
      {showAddAccountModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalance className="text-primary" />
                  {editingAccount ? `Edit ${editingAccount.bankName}` : 'Add Linked Customer Bank Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddAccountModal(false)}></button>
              </div>

              <form onSubmit={handleSaveAccount}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    
                    {/* Bank Selection */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Bank Name *</label>
                      <select 
                        className="form-select fw-semibold"
                        value={accountFormData.bankName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setAccountFormData(prev => ({ ...prev, bankName: val }));
                        }}
                        required
                      >
                        {INDIAN_BANKS_PRESETS.map(b => (
                          <option key={b.code} value={b.bankName}>
                            {b.icon} {b.bankName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Account Holder Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Account Holder Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="As per bank passbook"
                        value={accountFormData.accountHolderName}
                        onChange={(e) => setAccountFormData({ ...accountFormData, accountHolderName: e.target.value })}
                        required
                      />
                    </div>

                    {/* Account Number */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Account Number *</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace fw-bold" 
                        placeholder="e.g. 50100458921478"
                        value={accountFormData.accountNumber}
                        onChange={(e) => setAccountFormData({ ...accountFormData, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                        required
                      />
                      <small className="text-muted" style={{ fontSize: '0.68rem' }}>Will be masked in regular views for security</small>
                    </div>

                    {/* IFSC Code */}
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">IFSC Code</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace text-uppercase" 
                        placeholder="e.g. HDFC0001234"
                        value={accountFormData.ifscCode}
                        onChange={(e) => setAccountFormData({ ...accountFormData, ifscCode: e.target.value.toUpperCase() })}
                      />
                    </div>

                    {/* Account Type */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Account Type</label>
                      <select 
                        className="form-select"
                        value={accountFormData.accountType}
                        onChange={(e) => setAccountFormData({ ...accountFormData, accountType: e.target.value })}
                      >
                        {ACCOUNT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    {/* UPI ID */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">UPI ID (Optional)</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace" 
                        placeholder="customer@okhdfcbank"
                        value={accountFormData.upiId}
                        onChange={(e) => setAccountFormData({ ...accountFormData, upiId: e.target.value })}
                      />
                    </div>

                    {/* Status */}
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Account Status</label>
                      <select 
                        className="form-select"
                        value={accountFormData.status}
                        onChange={(e) => setAccountFormData({ ...accountFormData, status: e.target.value })}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                        <option value="Closed">Closed</option>
                      </select>
                    </div>

                    {/* Balances */}
                    {!editingAccount ? (
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-muted">Opening Balance (₹)</label>
                        <input 
                          type="number" 
                          className="form-control font-monospace fw-bold text-success" 
                          placeholder="0"
                          value={accountFormData.openingBalance}
                          onChange={(e) => setAccountFormData({ 
                            ...accountFormData, 
                            openingBalance: e.target.value,
                            currentBalance: e.target.value
                          })}
                        />
                      </div>
                    ) : (
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-muted">Current Balance (₹)</label>
                        <input 
                          type="number" 
                          className="form-control font-monospace fw-bold text-dark" 
                          value={accountFormData.currentBalance}
                          onChange={(e) => setAccountFormData({ ...accountFormData, currentBalance: e.target.value })}
                        />
                      </div>
                    )}

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Account Notes / Purpose</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Primary salary account for EMI deduction"
                        value={accountFormData.notes}
                        onChange={(e) => setAccountFormData({ ...accountFormData, notes: e.target.value })}
                      />
                    </div>

                  </div>
                </div>

                <div className="modal-footer border-0 bg-light py-3 px-4">
                  <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setShowAddAccountModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">Save Bank Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Inter-Account Transfer ───────────────────────── */}
      {showTransferModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdSwapHoriz className="text-primary" size={24} /> Customer Inter-Account Transfer
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowTransferModal(false)}></button>
              </div>

              {!showTransferConfirm ? (
                <form onSubmit={(e) => { e.preventDefault(); setShowTransferConfirm(true); }}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      
                      {/* From Account */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">From Account (Debit)</label>
                        <select 
                          className="form-select fw-semibold"
                          value={transferFormData.fromAccountId}
                          onChange={(e) => setTransferFormData({ ...transferFormData, fromAccountId: e.target.value })}
                          required
                        >
                          {accounts.filter(a => a.status === 'Active').map(a => (
                            <option key={a.id} value={a.id}>
                              {a.bankLogo} {a.bankName} ({customerBankStore.maskAccountNumber(a.accountNumber)}) — Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* To Account */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">To Account (Credit)</label>
                        <select 
                          className="form-select fw-semibold"
                          value={transferFormData.toAccountId}
                          onChange={(e) => setTransferFormData({ ...transferFormData, toAccountId: e.target.value })}
                          required
                        >
                          {accounts.filter(a => a.status === 'Active' && a.id !== transferFormData.fromAccountId).map(a => (
                            <option key={a.id} value={a.id}>
                              {a.bankLogo} {a.bankName} ({customerBankStore.maskAccountNumber(a.accountNumber)}) — Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Amount */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Transfer Amount (₹) *</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg font-monospace fw-bold text-primary" 
                          placeholder="e.g. 15000"
                          min="1"
                          value={transferFormData.amount}
                          onChange={(e) => setTransferFormData({ ...transferFormData, amount: e.target.value })}
                          required
                        />
                      </div>

                      {/* Date & Ref */}
                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-muted">Transfer Date</label>
                        <input 
                          type="date" 
                          className="form-control" 
                          value={transferFormData.date}
                          onChange={(e) => setTransferFormData({ ...transferFormData, date: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-12 col-md-6">
                        <label className="form-label small fw-semibold text-muted">Reference / UTR #</label>
                        <input 
                          type="text" 
                          className="form-control font-monospace" 
                          value={transferFormData.referenceNumber}
                          onChange={(e) => setTransferFormData({ ...transferFormData, referenceNumber: e.target.value })}
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Notes / Reason</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          placeholder="Optional transfer remarks..."
                          value={transferFormData.notes}
                          onChange={(e) => setTransferFormData({ ...transferFormData, notes: e.target.value })}
                        />
                      </div>

                    </div>
                  </div>

                  <div className="modal-footer border-0 bg-light py-3 px-4">
                    <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setShowTransferModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">Review Transfer &gt;</button>
                  </div>
                </form>
              ) : (
                /* Confirmation Screen */
                <div>
                  {(() => {
                    const fromAcc = accounts.find(a => a.id === transferFormData.fromAccountId);
                    const toAcc = accounts.find(a => a.id === transferFormData.toAccountId);
                    const amt = Number(transferFormData.amount || 0);
                    const fromBefore = Number(fromAcc?.currentBalance || 0);
                    const fromAfter = fromBefore - amt;
                    const toBefore = Number(toAcc?.currentBalance || 0);
                    const toAfter = toBefore + amt;

                    return (
                      <div className="p-4">
                        <div className="alert alert-info border-0 rounded-3 mb-3 p-3">
                          <h6 className="fw-bold mb-1">Confirm Fund Transfer</h6>
                          <p className="small mb-0">Please review the balance impact before completing this transaction:</p>
                        </div>

                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <div>
                              <small className="text-muted d-block">From (Debit Account)</small>
                              <strong>{fromAcc?.bankName} ({customerBankStore.maskAccountNumber(fromAcc?.accountNumber)})</strong>
                            </div>
                            <div className="text-end">
                              <small className="text-muted d-block">Before &gt; After</small>
                              <span className="text-danger font-monospace fw-bold">₹{fromBefore.toLocaleString('en-IN')} &gt; ₹{fromAfter.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                            <div>
                              <small className="text-muted d-block">To (Credit Account)</small>
                              <strong>{toAcc?.bankName} ({customerBankStore.maskAccountNumber(toAcc?.accountNumber)})</strong>
                            </div>
                            <div className="text-end">
                              <small className="text-muted d-block">Before &gt; After</small>
                              <span className="text-success font-monospace fw-bold">₹{toBefore.toLocaleString('en-IN')} &gt; ₹{toAfter.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center pt-1">
                            <span className="fw-bold text-dark">Transfer Amount</span>
                            <h4 className="fw-bold text-primary font-monospace mb-0">₹{amt.toLocaleString('en-IN')}</h4>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-light border rounded-3 px-3 fw-semibold" onClick={() => setShowTransferConfirm(false)}>Back</button>
                          <button type="button" className="btn btn-success rounded-3 px-4 fw-bold shadow-sm" onClick={handleExecuteTransfer}>
                            ✓ Confirm &amp; Transfer
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 3: Direct Inflow / Outflow Transaction ──────────── */}
      {showDirectTxnModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  {directTxnData.type === 'Credit' ? '⚡ Record Inflow / Deposit' : '💸 Record Outflow / Withdrawal'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowDirectTxnModal(false)}></button>
              </div>

              {!showTxnConfirm ? (
                <form onSubmit={(e) => { e.preventDefault(); setShowTxnConfirm(true); }}>
                  <div className="modal-body p-4">
                    <div className="row g-3">
                      
                      {/* Target Account */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Customer Bank Account</label>
                        <select 
                          className="form-select fw-semibold"
                          value={directTxnData.customerBankAccountId}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, customerBankAccountId: e.target.value })}
                          required
                        >
                          {accounts.filter(a => a.status === 'Active').map(a => (
                            <option key={a.id} value={a.id}>
                              {a.bankLogo} {a.bankName} ({customerBankStore.maskAccountNumber(a.accountNumber)}) — Bal: ₹{Number(a.currentBalance || 0).toLocaleString('en-IN')}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Type Toggle */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Transaction Type</label>
                        <div className="btn-group w-100" role="group">
                          <button 
                            type="button" 
                            className={`btn btn-sm ${directTxnData.type === 'Credit' ? 'btn-success fw-bold' : 'btn-outline-secondary'}`}
                            onClick={() => setDirectTxnData({ ...directTxnData, type: 'Credit', category: 'Payment Received' })}
                          >
                            + Credit (Money Received / Inflow)
                          </button>
                          <button 
                            type="button" 
                            className={`btn btn-sm ${directTxnData.type === 'Debit' ? 'btn-danger fw-bold' : 'btn-outline-secondary'}`}
                            onClick={() => setDirectTxnData({ ...directTxnData, type: 'Debit', category: 'Withdrawal / Refund' })}
                          >
                            - Debit (Money Paid / Outflow)
                          </button>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Amount (₹) *</label>
                        <input 
                          type="number" 
                          className="form-control form-control-lg font-monospace fw-bold" 
                          placeholder="e.g. 5000"
                          min="1"
                          value={directTxnData.amount}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, amount: e.target.value })}
                          required
                        />
                      </div>

                      {/* Method & Category */}
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-muted">Payment Method</label>
                        <select 
                          className="form-select form-select-sm"
                          value={directTxnData.paymentMethod}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, paymentMethod: e.target.value })}
                        >
                          <option value="UPI">UPI</option>
                          <option value="Net Banking">Net Banking</option>
                          <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Cash">Cash</option>
                          <option value="Card">Card</option>
                        </select>
                      </div>

                      <div className="col-6">
                        <label className="form-label small fw-semibold text-muted">Category</label>
                        <select 
                          className="form-select form-select-sm"
                          value={directTxnData.category}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, category: e.target.value })}
                        >
                          <option value="Payment Received">Payment Received</option>
                          <option value="EMI Collection">EMI Collection</option>
                          <option value="Loan Disbursement">Loan Disbursement</option>
                          <option value="Salary Deposit">Salary Deposit</option>
                          <option value="Cash Withdrawal">Cash Withdrawal</option>
                          <option value="Refund">Refund</option>
                          <option value="Adjustment">Adjustment</option>
                        </select>
                      </div>

                      {/* Linked Loan */}
                      {loans.length > 0 && (
                        <div className="col-12">
                          <label className="form-label small fw-semibold text-muted">Link to Loan Contract (Optional)</label>
                          <select 
                            className="form-select form-select-sm"
                            value={directTxnData.loanId}
                            onChange={(e) => setDirectTxnData({ ...directTxnData, loanId: e.target.value })}
                          >
                            <option value="">-- No specific loan linked --</option>
                            {loans.map(l => (
                              <option key={l.id} value={l.id}>{l.loanName} ({l.type})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Date & Ref */}
                      <div className="col-6">
                        <label className="form-label small fw-semibold text-muted">Date</label>
                        <input 
                          type="date" 
                          className="form-control form-control-sm"
                          value={directTxnData.date}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, date: e.target.value })}
                          required
                        />
                      </div>

                      <div className="col-6">
                        <label className="form-label small fw-semibold text-muted">Reference / UPI #</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm font-monospace"
                          value={directTxnData.referenceNumber}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, referenceNumber: e.target.value })}
                        />
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-muted">Description / Notes</label>
                        <input 
                          type="text" 
                          className="form-control form-control-sm"
                          placeholder="Remarks..."
                          value={directTxnData.notes}
                          onChange={(e) => setDirectTxnData({ ...directTxnData, notes: e.target.value })}
                        />
                      </div>

                    </div>
                  </div>

                  <div className="modal-footer border-0 bg-light py-3 px-4">
                    <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setShowDirectTxnModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">Review &gt;</button>
                  </div>
                </form>
              ) : (
                /* Txn Confirmation */
                <div>
                  {(() => {
                    const acc = accounts.find(a => a.id === directTxnData.customerBankAccountId);
                    const amt = Number(directTxnData.amount || 0);
                    const before = Number(acc?.currentBalance || 0);
                    const after = directTxnData.type === 'Credit' ? before + amt : before - amt;

                    return (
                      <div className="p-4">
                        <div className="alert alert-warning border-0 rounded-3 mb-3 p-3">
                          <h6 className="fw-bold mb-1">Confirm Account Balance Change</h6>
                          <p className="small mb-0">This transaction will directly modify the customer's account balance:</p>
                        </div>

                        <div className="p-3 bg-light rounded-3 border mb-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Target Bank Account</span>
                            <strong>{acc?.bankName} ({customerBankStore.maskAccountNumber(acc?.accountNumber)})</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Current Balance (Before)</span>
                            <span className="font-monospace">₹{before.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted small">Transaction Amount</span>
                            <span className={`fw-bold font-monospace ${directTxnData.type === 'Credit' ? 'text-success' : 'text-danger'}`}>
                              {directTxnData.type === 'Credit' ? '+' : '-'}₹{amt.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between border-top pt-2">
                            <span className="fw-bold text-dark">Updated Balance (After)</span>
                            <h5 className="fw-bold text-primary font-monospace mb-0">₹{after.toLocaleString('en-IN')}</h5>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between">
                          <button type="button" className="btn btn-light border rounded-3 px-3 fw-semibold" onClick={() => setShowTxnConfirm(false)}>Back</button>
                          <button type="button" className="btn btn-success rounded-3 px-4 fw-bold shadow-sm" onClick={handleExecuteDirectTxn}>
                            ✓ Confirm &amp; Save Transaction
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Delete Confirmation ─────────────────────────── */}
      {deleteConfirmAcc && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1090 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
              <div className="text-danger mb-2">
                <MdDelete size={38} />
              </div>
              <h6 className="fw-bold text-dark">Delete Bank Account?</h6>
              <p className="small text-muted mb-3">
                Are you sure you want to delete {deleteConfirmAcc.bankName} ({customerBankStore.maskAccountNumber(deleteConfirmAcc.accountNumber)})?
              </p>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-light border btn-sm rounded-3 px-3 fw-semibold" onClick={() => setDeleteConfirmAcc(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm rounded-3 px-3 fw-bold" onClick={() => handleDeleteAccount(deleteConfirmAcc.id)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CustomerBankManager;
