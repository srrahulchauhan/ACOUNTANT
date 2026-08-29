import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MdHome, MdDirectionsCar, MdPerson, MdSchool, MdCreditCard, 
  MdMoreHoriz, MdAdd, MdEdit, MdDelete, MdCheckCircle, MdWarning, 
  MdSchedule, MdPayment, MdBarChart, MdCalendarToday, MdAccountBalance, 
  MdTrendingDown, MdReceipt, MdClose, MdSave, MdHistory, MdFilterList, MdSearch
} from 'react-icons/md';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getLocalDateString, addMonthsToDate } from '../utils/dateUtils';
import { fetchTransactions, createTransaction, updateTransaction } from '../api';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
);

const LOCAL_STORAGE_LOANS_KEY = 'emi_loan_management_data';

const LOAN_TYPES = [
  { id: 'Home Loan', label: 'Home Loan', icon: <MdHome size={20} />, color: '#0284c7', bg: 'rgba(2, 132, 199, 0.12)' },
  { id: 'Car Loan', label: 'Car Loan', icon: <MdDirectionsCar size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'Personal Loan', label: 'Personal Loan', icon: <MdPerson size={20} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'Education Loan', label: 'Education Loan', icon: <MdSchool size={20} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'Credit Card', label: 'Credit Card EMI', icon: <MdCreditCard size={20} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'Other Loan', label: 'Other Loan', icon: <MdMoreHoriz size={20} />, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
];

const getLoanMeta = (typeId) => {
  return LOAN_TYPES.find(t => t.id === typeId) || LOAN_TYPES[5];
};

const EmiDashboard = () => {
  // State
  const [loans, setLoans] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'calendar', 'history'
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    loanName: '',
    borrowerName: '',
    type: 'Home Loan',
    totalAmount: '',
    interestRate: '',
    emiAmount: '',
    startDate: getLocalDateString(),
    tenureMonths: 12,
    dueDate: addMonthsToDate(getLocalDateString(), 1),
    notes: ''
  });

  // Sound Alert for upcoming/overdue EMI
  const playRingAlert = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) { console.error(e); }
  }, []);

  // Load Loans Data
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
      if (saved) {
        setLoans(JSON.parse(saved));
      } else {
        // Samples
        const samples = [
          {
            id: 'loan_1',
            loanName: 'HDFC Housing Loan',
            borrowerName: 'Rahul Chauhan',
            type: 'Home Loan',
            totalAmount: 2500000,
            interestRate: 8.5,
            emiAmount: 21699,
            startDate: '2025-01-10',
            tenureMonths: 240,
            paidEmis: 19,
            dueDate: addMonthsToDate(getLocalDateString(), 1),
            status: 'Active',
            notes: '20-Year Home Mortgage',
            history: [
              { installment: 1, paidDate: '2025-02-10', amount: 21699 },
              { installment: 2, paidDate: '2025-03-10', amount: 21699 }
            ]
          },
          {
            id: 'loan_2',
            loanName: 'SBI Auto Loan',
            borrowerName: 'Rahul Chauhan',
            type: 'Car Loan',
            totalAmount: 600000,
            interestRate: 9.0,
            emiAmount: 12460,
            startDate: '2025-06-01',
            tenureMonths: 60,
            paidEmis: 14,
            dueDate: getLocalDateString(),
            status: 'Active',
            notes: 'Hyundai i20 Car Finance',
            history: [
              { installment: 1, paidDate: '2025-07-01', amount: 12460 }
            ]
          },
          {
            id: 'loan_3',
            loanName: 'HDFC Credit Card EMI',
            borrowerName: 'Rahul Chauhan',
            type: 'Credit Card',
            totalAmount: 85000,
            interestRate: 14.0,
            emiAmount: 7625,
            startDate: '2026-03-15',
            tenureMonths: 12,
            paidEmis: 5,
            dueDate: addMonthsToDate(getLocalDateString(), 1),
            status: 'Active',
            notes: 'Laptop Purchase EMI',
            history: []
          }
        ];
        setLoans(samples);
        localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify(samples));
      }
    } catch (e) { console.error(e); }
  }, []);

  const saveLoans = (updated) => {
    setLoans(updated);
    localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify(updated));
  };

  // Calculate EMI helper when amount, rate, tenure change
  const calculateEmi = (principal, rate, months) => {
    const p = Number(principal);
    const r = Number(rate) / 12 / 100;
    const n = Number(months);
    if (!p || !n) return 0;
    if (!r) return Math.round(p / n);
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  // Form input change
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calculate EMI if user changes totalAmount, interestRate, or tenureMonths
      if (['totalAmount', 'interestRate', 'tenureMonths'].includes(name)) {
        const autoEmi = calculateEmi(
          name === 'totalAmount' ? value : prev.totalAmount,
          name === 'interestRate' ? value : prev.interestRate,
          name === 'tenureMonths' ? value : prev.tenureMonths
        );
        if (autoEmi > 0) updated.emiAmount = autoEmi.toString();
      }

      // Auto-set Due Date if startDate or tenureMonths changes
      if (name === 'startDate') {
        updated.dueDate = addMonthsToDate(value, 1);
      }

      return updated;
    });
  };

  // Save / Update Loan
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.loanName.trim() || !formData.totalAmount || Number(formData.totalAmount) <= 0) {
      alert("Please enter a valid Loan Name and Total Amount!");
      return;
    }

    if (editingId) {
      // Edit Loan
      const updated = loans.map(l => {
        if (l.id === editingId) {
          return {
            ...l,
            loanName: formData.loanName,
            borrowerName: formData.borrowerName || 'Primary Borrower',
            type: formData.type,
            totalAmount: Number(formData.totalAmount),
            interestRate: Number(formData.interestRate || 0),
            emiAmount: Number(formData.emiAmount || 0),
            startDate: formData.startDate,
            tenureMonths: Number(formData.tenureMonths || 12),
            dueDate: formData.dueDate,
            notes: formData.notes
          };
        }
        return l;
      });
      saveLoans(updated);
    } else {
      // New Loan
      const newLoan = {
        id: 'loan_' + Date.now(),
        loanName: formData.loanName,
        borrowerName: formData.borrowerName || 'Primary Borrower',
        type: formData.type,
        totalAmount: Number(formData.totalAmount),
        interestRate: Number(formData.interestRate || 0),
        emiAmount: Number(formData.emiAmount || 0),
        startDate: formData.startDate,
        tenureMonths: Number(formData.tenureMonths || 12),
        paidEmis: 0,
        dueDate: formData.dueDate || addMonthsToDate(formData.startDate, 1),
        status: 'Active',
        notes: formData.notes,
        history: []
      };
      saveLoans([newLoan, ...loans]);

      // Sync transaction to main transaction registry
      try {
        createTransaction({
          name: formData.borrowerName || 'Borrower',
          amount: Number(formData.emiAmount || 0),
          type: 'EMI',
          category: formData.type,
          description: `${formData.loanName} (Monthly EMI)`,
          date: formData.startDate,
          loanDate: formData.startDate,
          dueDate: formData.dueDate,
          status: 'Pending',
          totalInstallments: Number(formData.tenureMonths || 12),
          installmentIndex: 1
        });
      } catch (err) { console.error(err); }
    }

    setShowModal(false);
    setEditingId(null);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({
      loanName: '',
      borrowerName: '',
      type: 'Home Loan',
      totalAmount: '',
      interestRate: '',
      emiAmount: '',
      startDate: getLocalDateString(),
      tenureMonths: 12,
      dueDate: addMonthsToDate(getLocalDateString(), 1),
      notes: ''
    });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleEditClick = (loan) => {
    setEditingId(loan.id);
    setFormData({
      loanName: loan.loanName,
      borrowerName: loan.borrowerName || '',
      type: loan.type,
      totalAmount: loan.totalAmount.toString(),
      interestRate: loan.interestRate.toString(),
      emiAmount: loan.emiAmount.toString(),
      startDate: loan.startDate,
      tenureMonths: loan.tenureMonths.toString(),
      dueDate: loan.dueDate || getLocalDateString(),
      notes: loan.notes || ''
    });
    setShowModal(true);
  };

  // Delete Loan
  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this loan record?")) {
      const updated = loans.filter(l => l.id !== id);
      saveLoans(updated);
    }
  };

  // Mark EMI as Paid Action
  const handleMarkEmiPaid = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (window.confirm(`Mark current EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} for "${loan.loanName}" as PAID?`)) {
      const updatedPaidEmis = loan.paidEmis + 1;
      const isCompleted = updatedPaidEmis >= loan.tenureMonths;
      const nextDue = addMonthsToDate(loan.dueDate || getLocalDateString(), 1);

      const historyItem = {
        installment: updatedPaidEmis,
        paidDate: getLocalDateString(),
        amount: loan.emiAmount
      };

      const updated = loans.map(l => {
        if (l.id === loanId) {
          return {
            ...l,
            paidEmis: updatedPaidEmis,
            dueDate: nextDue,
            status: isCompleted ? 'Completed' : 'Active',
            history: [historyItem, ...(l.history || [])]
          };
        }
        return l;
      });

      saveLoans(updated);
    }
  };

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter(l => {
      const matchesType = filterType === 'All' || l.type === filterType;
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        l.loanName.toLowerCase().includes(s) || 
        (l.borrowerName && l.borrowerName.toLowerCase().includes(s)) ||
        l.type.toLowerCase().includes(s);
      return matchesType && matchesSearch;
    });
  }, [loans, filterType, searchTerm]);

  // Overall Financial Calculations
  const todayStr = getLocalDateString();
  const today = new Date();

  // Active Loans
  const activeLoans = useMemo(() => loans.filter(l => l.status === 'Active'), [loans]);

  // Total Outstanding Amount (Remaining Principal Estimation)
  const totalOutstandingAmount = useMemo(() => {
    return activeLoans.reduce((sum, l) => {
      const remainingRatio = Math.max(0, (l.tenureMonths - l.paidEmis) / l.tenureMonths);
      return sum + Math.round(l.totalAmount * remainingRatio);
    }, 0);
  }, [activeLoans]);

  // Total Monthly EMI Amount
  const totalMonthlyEmi = useMemo(() => {
    return activeLoans.reduce((sum, l) => sum + Number(l.emiAmount), 0);
  }, [activeLoans]);

  // Next Upcoming Due Loan
  const upcomingLoan = useMemo(() => {
    if (activeLoans.length === 0) return null;
    return [...activeLoans].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  }, [activeLoans]);

  // Total Paid vs Total Remaining EMIs
  const paidEmisCount = useMemo(() => loans.reduce((sum, l) => sum + l.paidEmis, 0), [loans]);
  const remainingEmisCount = useMemo(() => loans.reduce((sum, l) => sum + Math.max(0, l.tenureMonths - l.paidEmis), 0), [loans]);

  // Overdue / Upcoming Alerts (Due within 5 days)
  const alertLoans = useMemo(() => {
    const threshold = new Date(today);
    threshold.setDate(today.getDate() + 5);
    const thresholdStr = getLocalDateString(threshold);

    return activeLoans.filter(l => l.dueDate && l.dueDate <= thresholdStr);
  }, [activeLoans, today]);

  // Play alert sound if overdue exists
  useEffect(() => {
    if (alertLoans.length > 0 && !sessionStorage.getItem('emi_mgmt_sound_played')) {
      playRingAlert();
      sessionStorage.setItem('emi_mgmt_sound_played', 'true');
    }
  }, [alertLoans, playRingAlert]);

  // Chart Data 1: Loan Balance Distribution (Doughnut)
  const balanceChartData = useMemo(() => {
    const labels = activeLoans.map(l => l.loanName);
    const data = activeLoans.map(l => {
      const remainingRatio = Math.max(0, (l.tenureMonths - l.paidEmis) / l.tenureMonths);
      return Math.round(l.totalAmount * remainingRatio);
    });
    const colors = activeLoans.map(l => getLoanMeta(l.type).color);

    return {
      labels: labels.length > 0 ? labels : ['No Active Loans'],
      datasets: [
        {
          data: data.length > 0 ? data : [1],
          backgroundColor: colors.length > 0 ? colors : ['#e2e8f0'],
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    };
  }, [activeLoans]);

  // Chart Data 2: Monthly Payments Comparison (Bar)
  const monthlyBarChartData = useMemo(() => {
    const labels = activeLoans.map(l => l.loanName);
    const data = activeLoans.map(l => l.emiAmount);
    const colors = activeLoans.map(l => getLoanMeta(l.type).color);

    return {
      labels: labels.length > 0 ? labels : ['No Loans'],
      datasets: [
        {
          label: 'Monthly EMI (₹)',
          data: data.length > 0 ? data : [0],
          backgroundColor: colors.length > 0 ? colors : ['#0ea5e9'],
          borderRadius: 6
        }
      ]
    };
  }, [activeLoans]);

  // Flattened Payment History
  const fullPaymentHistory = useMemo(() => {
    const list = [];
    loans.forEach(l => {
      if (l.history && l.history.length > 0) {
        l.history.forEach(h => {
          list.push({
            loanId: l.id,
            loanName: l.loanName,
            borrowerName: l.borrowerName,
            type: l.type,
            installment: h.installment,
            totalTenure: l.tenureMonths,
            paidDate: h.paidDate,
            amount: h.amount
          });
        });
      }
    });
    return list.sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
  }, [loans]);

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Top Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
            <MdPayment size={30} style={{ color: '#0284c7' }} /> 
            EMI & Loan Management
          </h3>
          <p className="text-muted small mb-0">Comprehensive tracker for loans, EMIs, due dates & payment schedules</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {/* Navigation View Tabs */}
          <div className="btn-group bg-light p-1 rounded-pill shadow-sm" style={{ border: '1px solid var(--border-color)' }}>
            <button className={`btn btn-sm rounded-pill px-3 py-1 ${activeTab === 'overview' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`} onClick={() => setActiveTab('overview')}>
              Overview & Loans
            </button>
            <button className={`btn btn-sm rounded-pill px-3 py-1 ${activeTab === 'calendar' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`} onClick={() => setActiveTab('calendar')}>
              Calendar Schedule
            </button>
            <button className={`btn btn-sm rounded-pill px-3 py-1 ${activeTab === 'history' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`} onClick={() => setActiveTab('history')}>
              Payment History
            </button>
          </div>

          <button 
            className="btn text-white px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 rounded-pill"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)', border: 'none' }}
            onClick={handleOpenAddModal}
          >
            <MdAdd size={22} /> Add New Loan
          </button>
        </div>
      </div>

      {/* Overdue / Upcoming Payment Alerts Banner */}
      {alertLoans.length > 0 && (
        <div className="alert alert-warning border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-center justify-content-between animate-fadeIn" style={{ background: '#fffbeb', borderLeft: '5px solid #f59e0b' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-warning bg-opacity-20 text-warning p-2 rounded-circle">
              <MdWarning size={28} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0">🔔 Upcoming & Due EMI Alerts ({alertLoans.length})</h6>
              <p className="small text-muted mb-0">
                {alertLoans.map(l => `${l.loanName} (₹${l.emiAmount.toLocaleString('en-IN')} Due: ${l.dueDate})`).join(' | ')}
              </p>
            </div>
          </div>
          <button className="btn btn-warning btn-sm fw-bold text-dark rounded-pill px-3 shadow-sm" onClick={() => setActiveTab('overview')}>Review Loans</button>
        </div>
      )}

      {/* Key Summary Cards */}
      <div className="row g-3 g-lg-4 mb-4">
        {/* Total Outstanding Loan Amount */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #0284c7' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Total Outstanding Loan</p>
                <h3 className="fw-bold mb-0 text-primary">₹{totalOutstandingAmount.toLocaleString('en-IN')}</h3>
                <small className="text-muted">{activeLoans.length} active loan accounts</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7' }}>
                <MdAccountBalance size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Total Monthly EMI Amount */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Total Monthly EMI</p>
                <h3 className="fw-bold mb-0 text-success">₹{totalMonthlyEmi.toLocaleString('en-IN')}</h3>
                <small className="text-muted">Combined monthly commitment</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <MdTrendingDown size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming EMI Due */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Upcoming EMI Due</p>
                <h4 className="fw-bold mb-0 text-warning">
                  {upcomingLoan ? new Date(upcomingLoan.dueDate).toLocaleDateString('en-IN') : 'No Due'}
                </h4>
                <small className="text-muted text-truncate d-block" style={{ maxWidth: '140px' }}>
                  {upcomingLoan ? `${upcomingLoan.loanName} (₹${upcomingLoan.emiAmount.toLocaleString('en-IN')})` : 'All cleared'}
                </small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <MdSchedule size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Paid vs Remaining EMIs */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #8b5cf6' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Paid / Total Installments</p>
                <h3 className="fw-bold mb-0 text-purple" style={{ color: '#8b5cf6' }}>
                  {paidEmisCount} <span className="fs-6 text-muted">/ {paidEmisCount + remainingEmisCount} EMIs</span>
                </h3>
                <small className="text-muted">{remainingEmisCount} EMIs remaining</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8b5cf6' }}>
                <MdCheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview & Charts View */}
      {activeTab === 'overview' && (
        <>
          {/* Charts Row */}
          <div className="row g-4 mb-4">
            {/* Loan Balance Distribution Chart */}
            <div className="col-12 col-lg-6">
              <div className="card modern-card p-4 border-0 shadow-sm h-100">
                <h6 className="fw-bold mb-3 text-dark">Loan Outstanding Balance Distribution</h6>
                <div style={{ height: '240px' }} className="d-flex align-items-center justify-content-center">
                  {activeLoans.length > 0 ? (
                    <Doughnut 
                      data={balanceChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '68%',
                        plugins: {
                          legend: {
                            position: 'right',
                            labels: { usePointStyle: true, boxWidth: 10, padding: 15 }
                          }
                        }
                      }} 
                    />
                  ) : (
                    <p className="text-muted small">No active loans to show distribution.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Payment Projection Bar Chart */}
            <div className="col-12 col-lg-6">
              <div className="card modern-card p-4 border-0 shadow-sm h-100">
                <h6 className="fw-bold mb-3 text-dark">Loan-Wise Monthly EMI Amounts</h6>
                <div style={{ height: '240px' }}>
                  <Bar 
                    data={monthlyBarChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { grid: { display: false } },
                        y: { 
                          grid: { color: 'rgba(0,0,0,0.05)' },
                          ticks: { callback: (val) => '₹' + val }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Loan-Wise Payment Progress & Loan Records Table */}
          <div className="card modern-card border-0 shadow-sm overflow-hidden mb-4">
            <div className="p-3 p-md-4 border-bottom bg-light bg-opacity-40">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
                <h5 className="fw-bold mb-0 text-dark">Active & Managed Loans</h5>

                <div className="d-flex flex-wrap align-items-center gap-2">
                  {/* Search */}
                  <div className="input-group input-group-sm" style={{ maxWidth: '220px' }}>
                    <span className="input-group-text bg-white border-end-0"><MdSearch size={16} /></span>
                    <input 
                      type="text" 
                      className="form-control border-start-0 ps-0" 
                      placeholder="Search loan or borrower..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {/* Loan Type Filter */}
                  <select 
                    className="form-select form-select-sm"
                    style={{ width: 'auto' }}
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                  >
                    <option value="All">All Loan Types</option>
                    {LOAN_TYPES.map(t => (
                      <option key={t.id} value={t.id}>{t.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="bg-light">
                  <tr className="text-muted small text-uppercase">
                    <th className="px-4 py-3">Loan Account</th>
                    <th className="py-3">Type & Rate</th>
                    <th className="py-3">Total Amount</th>
                    <th className="py-3">Monthly EMI</th>
                    <th className="py-3">Next Due</th>
                    <th className="py-3" style={{ minWidth: '180px' }}>Payment Progress</th>
                    <th className="py-3 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLoans.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No loan records found. Click <strong>+ Add New Loan</strong> to create one!
                      </td>
                    </tr>
                  ) : (
                    filteredLoans.map((l) => {
                      const typeMeta = getLoanMeta(l.type);
                      const progressPct = Math.min(100, Math.round((l.paidEmis / l.tenureMonths) * 100));
                      const isDueSoon = l.dueDate && l.dueDate <= todayStr;

                      return (
                        <tr key={l.id} className={l.status === 'Completed' ? 'table-success opacity-75' : ''}>
                          <td className="px-4 py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div 
                                className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                                style={{ width: 38, height: 38, background: typeMeta.bg, color: typeMeta.color }}
                              >
                                {typeMeta.icon}
                              </div>
                              <div>
                                <span className="fw-bold d-block text-dark small">{l.loanName}</span>
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>{l.borrowerName || 'Borrower'}</small>
                              </div>
                            </div>
                          </td>

                          <td>
                            <span className="badge rounded-pill px-2 py-1 mb-1 d-inline-block" style={{ background: typeMeta.bg, color: typeMeta.color, fontSize: '0.7rem' }}>
                              {l.type}
                            </span>
                            <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>{l.interestRate}% p.a.</small>
                          </td>

                          <td>
                            <span className="fw-bold text-dark">₹{Number(l.totalAmount).toLocaleString('en-IN')}</span>
                            <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>{l.tenureMonths} Months</small>
                          </td>

                          <td>
                            <span className="fw-bold text-primary">₹{Number(l.emiAmount).toLocaleString('en-IN')}</span>
                            <small className="d-block text-muted" style={{ fontSize: '0.7rem' }}>/ month</small>
                          </td>

                          <td>
                            <span className={`fw-semibold small ${isDueSoon ? 'text-danger fw-bold' : 'text-dark'}`}>
                              {new Date(l.dueDate).toLocaleDateString('en-IN')}
                            </span>
                            {isDueSoon && <small className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>Due Now</small>}
                          </td>

                          <td>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <small className="fw-semibold text-muted" style={{ fontSize: '0.7rem' }}>{l.paidEmis}/{l.tenureMonths} EMIs</small>
                              <small className="fw-bold text-success" style={{ fontSize: '0.7rem' }}>{progressPct}%</small>
                            </div>
                            <div className="progress" style={{ height: 6, borderRadius: 3 }}>
                              <div 
                                className="progress-bar bg-success"
                                role="progressbar"
                                style={{ width: `${progressPct}%` }}
                              ></div>
                            </div>
                          </td>

                          <td className="text-center">
                            <div className="d-flex gap-1 justify-content-center align-items-center">
                              {l.status !== 'Completed' ? (
                                <button 
                                  className="btn btn-success btn-sm rounded-pill px-3 py-1 fw-bold shadow-sm"
                                  style={{ fontSize: '0.75rem' }}
                                  onClick={() => handleMarkEmiPaid(l.id)}
                                >
                                  ✓ Pay EMI
                                </button>
                              ) : (
                                <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 fw-bold" style={{ fontSize: '0.75rem' }}>
                                  ✓ Cleared
                                </span>
                              )}

                              <button 
                                className="btn btn-outline-primary btn-sm rounded-circle p-1"
                                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                onClick={() => handleEditClick(l)}
                                title="Edit Loan"
                              >
                                <MdEdit size={14} />
                              </button>

                              <button 
                                className="btn btn-outline-danger btn-sm rounded-circle p-1"
                                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justify: 'center' }}
                                onClick={() => handleDeleteClick(l.id)}
                                title="Delete Loan"
                              >
                                <MdDelete size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Monthly Payment Calendar View */}
      {activeTab === 'calendar' && (
        <div className="card modern-card border-0 p-4 shadow-sm mb-4">
          <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
            <MdCalendarToday className="text-primary" /> Monthly Payment Calendar Schedule
          </h5>
          <p className="text-muted small mb-4">Visual breakdown of all upcoming loan due dates and monthly commitments</p>

          <div className="row g-3">
            {activeLoans.map(l => {
              const typeMeta = getLoanMeta(l.type);
              const progressPct = Math.min(100, Math.round((l.paidEmis / l.tenureMonths) * 100));

              return (
                <div key={l.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card h-100 border p-3 rounded-4 shadow-sm" style={{ borderLeft: `5px solid ${typeMeta.color}` }}>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div className="p-2 rounded-circle" style={{ background: typeMeta.bg, color: typeMeta.color }}>
                          {typeMeta.icon}
                        </div>
                        <div>
                          <h6 className="fw-bold mb-0">{l.loanName}</h6>
                          <small className="text-muted">{l.borrowerName}</small>
                        </div>
                      </div>
                      <span className="badge bg-warning text-dark font-monospace fw-bold">Due: {l.dueDate}</span>
                    </div>

                    <div className="bg-light p-3 rounded-3 my-2">
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">Monthly EMI:</span>
                        <span className="fw-bold text-success">₹{Number(l.emiAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between mb-1">
                        <span className="text-muted small">Total Loan:</span>
                        <span className="fw-bold text-dark">₹{Number(l.totalAmount).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="d-flex justify-content-between">
                        <span className="text-muted small">Progress:</span>
                        <span className="fw-bold text-primary">{l.paidEmis} of {l.tenureMonths} EMIs Paid</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2">
                      <button 
                        className="btn btn-success btn-sm rounded-pill px-3 py-1 fw-bold w-100"
                        onClick={() => handleMarkEmiPaid(l.id)}
                      >
                        ✓ Mark Next EMI Paid (₹{l.emiAmount})
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Payment History View */}
      {activeTab === 'history' && (
        <div className="card modern-card border-0 p-4 shadow-sm mb-4">
          <h5 className="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
            <MdHistory className="text-primary" /> EMI Payment History Log
          </h5>
          <p className="text-muted small mb-3">Complete audit trail of all paid installments across all managed loans</p>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr className="text-muted small text-uppercase">
                  <th className="px-4 py-3">Paid Date</th>
                  <th className="py-3">Loan Name</th>
                  <th className="py-3">Borrower</th>
                  <th className="py-3">Installment No.</th>
                  <th className="py-3 text-end">Paid Amount</th>
                  <th className="py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {fullPaymentHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-5 text-muted">
                      No EMI payments recorded yet. Click <strong>✓ Pay EMI</strong> on any active loan to log history!
                    </td>
                  </tr>
                ) : (
                  fullPaymentHistory.map((h, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 fw-semibold text-dark">
                        {new Date(h.paidDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="fw-bold text-primary">{h.loanName}</td>
                      <td className="text-muted small">{h.borrowerName || 'Primary'}</td>
                      <td>
                        <span className="badge bg-info bg-opacity-10 text-info font-monospace px-2 py-1">
                          Installment {h.installment} of {h.totalTenure}
                        </span>
                      </td>
                      <td className="text-end fw-bold text-success">
                        ₹{Number(h.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="text-center">
                        <span className="badge bg-success rounded-pill px-3 py-1">
                          ✓ Success / Paid
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

      {/* Add / Edit Loan Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalance className="text-primary" />
                  {editingId ? 'Edit Loan Account' : 'Add New EMI Loan Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    {/* Loan Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Loan Name / Description</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="loanName"
                        placeholder="e.g. HDFC Home Loan, SBI Car Loan"
                        value={formData.loanName}
                        onChange={handleFormChange}
                        required
                        autoFocus
                      />
                    </div>

                    {/* Borrower Name */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Borrower / Customer Name</label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="borrowerName"
                        placeholder="Primary Borrower Name"
                        value={formData.borrowerName}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Loan Type */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Loan Type</label>
                      <select 
                        className="form-select"
                        name="type"
                        value={formData.type}
                        onChange={handleFormChange}
                      >
                        {LOAN_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Total Loan Amount */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Total Loan Amount (Principal ₹)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                        <input 
                          type="number"
                          className="form-control fw-bold"
                          name="totalAmount"
                          placeholder="0.00"
                          value={formData.totalAmount}
                          onChange={handleFormChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Interest Rate */}
                    <div className="col-6 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Interest Rate (% p.a.)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="form-control"
                        name="interestRate"
                        placeholder="e.g. 8.5"
                        value={formData.interestRate}
                        onChange={handleFormChange}
                      />
                    </div>

                    {/* Tenure (Months) */}
                    <div className="col-6 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Tenure (Months)</label>
                      <input 
                        type="number"
                        className="form-control"
                        name="tenureMonths"
                        placeholder="e.g. 240, 60, 12"
                        value={formData.tenureMonths}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* EMI Amount */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Monthly EMI Amount (₹)</label>
                      <input 
                        type="number"
                        className="form-control fw-bold text-success"
                        name="emiAmount"
                        placeholder="Auto-calculated"
                        value={formData.emiAmount}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Start Date */}
                    <div className="col-6 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Start Date</label>
                      <input 
                        type="date"
                        className="form-control"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Due Date */}
                    <div className="col-6 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Next EMI Due Date</label>
                      <input 
                        type="date"
                        className="form-control"
                        name="dueDate"
                        value={formData.dueDate}
                        onChange={handleFormChange}
                        required
                      />
                    </div>

                    {/* Notes */}
                    <div className="col-12">
                      <label className="form-label text-muted fw-semibold small mb-1">Notes / Additional Details</label>
                      <textarea 
                        className="form-control"
                        name="notes"
                        rows="2"
                        placeholder="e.g. Loan account number, bank details, auto-debit notes..."
                        value={formData.notes}
                        onChange={handleFormChange}
                      ></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowModal(false)}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn text-white rounded-pill px-4 fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)', border: 'none' }}
                  >
                    {editingId ? 'Update Loan' : 'Save Loan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EmiDashboard;
