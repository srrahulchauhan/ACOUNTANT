import React, { useState, useEffect, useMemo } from 'react';
import { 
  MdAttachMoney, MdDateRange, MdDescription, MdEdit, MdDelete, 
  MdWarning, MdAdd, MdSearch, MdFilterList, MdTrendingDown, 
  MdAccountBalanceWallet, MdCheckCircle, MdSettings, MdShoppingBag, 
  MdRestaurant, MdDirectionsCar, MdReceipt, MdLocalHospital, MdMoreHoriz,
  MdClose, MdSave, MdRefresh
} from 'react-icons/md';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, ArcElement 
} from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import { getLocalDateString } from '../utils/dateUtils';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, ArcElement, Title, Tooltip, Legend
);

const LOCAL_STORAGE_EXPENSES_KEY = 'daily_expenses_tracker';
const LOCAL_STORAGE_BUDGET_KEY = 'daily_expense_budget_limit';

const CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', icon: <MdRestaurant size={18} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' },
  { id: 'Travel', label: 'Travel & Transport', icon: <MdDirectionsCar size={18} />, color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)' },
  { id: 'Shopping', label: 'Shopping', icon: <MdShoppingBag size={18} />, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.12)' },
  { id: 'Bills', label: 'Bills & Utilities', icon: <MdReceipt size={18} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)' },
  { id: 'Health', label: 'Health & Medical', icon: <MdLocalHospital size={18} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)' },
  { id: 'Other', label: 'Other Expenses', icon: <MdMoreHoriz size={18} />, color: '#64748b', bg: 'rgba(100, 116, 139, 0.12)' },
];

const getCategoryMeta = (catId) => {
  return CATEGORIES.find(c => c.id === catId) || CATEGORIES[5];
};

const DailyExpenses = () => {
  // State
  const [expenses, setExpenses] = useState([]);
  const [dailyBudget, setDailyBudget] = useState(1000); // Default ₹1,000/day
  const [editingBudget, setEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(1000);

  // Form State
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    amount: '',
    category: 'Food',
    date: getLocalDateString(),
    notes: ''
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('Today'); // 'Today', 'This Week', 'This Month', 'All'

  // Load from Local Storage
  useEffect(() => {
    try {
      const savedExpenses = localStorage.getItem(LOCAL_STORAGE_EXPENSES_KEY);
      if (savedExpenses) {
        setExpenses(JSON.parse(savedExpenses));
      } else {
        // Initial sample data if empty
        const samples = [
          { id: '1', amount: 150, category: 'Food', date: getLocalDateString(), notes: 'Lunch thali' },
          { id: '2', amount: 80, category: 'Travel', date: getLocalDateString(), notes: 'Cab fare' },
          { id: '3', amount: 450, category: 'Shopping', date: getLocalDateString(), notes: 'Groceries' },
          { id: '4', amount: 300, category: 'Bills', date: getLocalDateString(new Date(Date.now() - 86400000)), notes: 'Mobile recharge' },
        ];
        setExpenses(samples);
        localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(samples));
      }

      const savedBudget = localStorage.getItem(LOCAL_STORAGE_BUDGET_KEY);
      if (savedBudget) {
        const b = Number(savedBudget);
        setDailyBudget(b);
        setTempBudget(b);
      }
    } catch (e) {
      console.error("Failed to load daily expenses data", e);
    }
  }, []);

  // Helper to save expenses
  const saveExpensesToStorage = (updated) => {
    setExpenses(updated);
    localStorage.setItem(LOCAL_STORAGE_EXPENSES_KEY, JSON.stringify(updated));
  };

  // Helper to save budget limit
  const handleSaveBudget = () => {
    const b = Math.max(1, Number(tempBudget) || 1000);
    setDailyBudget(b);
    localStorage.setItem(LOCAL_STORAGE_BUDGET_KEY, b.toString());
    setEditingBudget(false);
  };

  // Submit Handler for Add / Edit
  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount!");
      return;
    }

    if (editingId) {
      // Edit
      const updated = expenses.map(exp => 
        exp.id === editingId 
          ? { ...exp, amount: Number(formData.amount), category: formData.category, date: formData.date, notes: formData.notes } 
          : exp
      );
      saveExpensesToStorage(updated);
    } else {
      // Add
      const newExp = {
        id: Date.now().toString(),
        amount: Number(formData.amount),
        category: formData.category,
        date: formData.date,
        notes: formData.notes
      };
      saveExpensesToStorage([newExp, ...expenses]);
    }

    // Reset Form
    setFormData({ amount: '', category: 'Food', date: getLocalDateString(), notes: '' });
    setEditingId(null);
    setShowFormModal(false);
  };

  // Edit Trigger
  const handleEditClick = (exp) => {
    setEditingId(exp.id);
    setFormData({
      amount: exp.amount.toString(),
      category: exp.category,
      date: exp.date,
      notes: exp.notes || ''
    });
    setShowFormModal(true);
  };

  // Delete Trigger
  const handleDeleteClick = (id) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      const updated = expenses.filter(e => e.id !== id);
      saveExpensesToStorage(updated);
    }
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditingId(null);
    setFormData({ amount: '', category: 'Food', date: getLocalDateString(), notes: '' });
    setShowFormModal(true);
  };

  // Metrics Calculations
  const todayStr = getLocalDateString();
  const now = new Date();

  // Today's total
  const todaySpending = useMemo(() => {
    return expenses
      .filter(e => e.date === todayStr)
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses, todayStr]);

  // Remaining budget today
  const remainingBudget = dailyBudget - todaySpending;
  const isBudgetExceeded = todaySpending > dailyBudget;
  const budgetUsagePct = Math.min(Math.round((todaySpending / dailyBudget) * 100), 100);

  // This Month's Total
  const monthlySpending = useMemo(() => {
    const currMonth = now.getMonth();
    const currYear = now.getFullYear();
    return expenses
      .filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currMonth && d.getFullYear() === currYear;
      })
      .reduce((sum, e) => sum + Number(e.amount), 0);
  }, [expenses]);

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Search
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        exp.category.toLowerCase().includes(s) || 
        (exp.notes && exp.notes.toLowerCase().includes(s)) ||
        exp.amount.toString().includes(s);

      // Category
      const matchesCat = categoryFilter === 'All' || exp.category === categoryFilter;

      // Date Range
      let matchesDate = true;
      if (dateFilter === 'Today') {
        matchesDate = exp.date === todayStr;
      } else if (dateFilter === 'This Week') {
        const expDate = new Date(exp.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        matchesDate = expDate >= weekAgo;
      } else if (dateFilter === 'This Month') {
        const expDate = new Date(exp.date);
        matchesDate = expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesCat && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchTerm, categoryFilter, dateFilter, todayStr]);

  // Category Breakdown for Doughnut Chart
  const categoryChartData = useMemo(() => {
    const catTotals = {};
    CATEGORIES.forEach(c => catTotals[c.id] = 0);

    expenses.forEach(e => {
      if (catTotals[e.category] !== undefined) {
        catTotals[e.category] += Number(e.amount);
      } else {
        catTotals['Other'] = (catTotals['Other'] || 0) + Number(e.amount);
      }
    });

    const labels = CATEGORIES.map(c => c.label);
    const data = CATEGORIES.map(c => catTotals[c.id]);
    const colors = CATEGORIES.map(c => c.color);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderWidth: 0,
          hoverOffset: 6
        }
      ]
    };
  }, [expenses]);

  // Weekly Trend Chart (Last 7 Days)
  const weeklyChartData = useMemo(() => {
    const labels = [];
    const data = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = getLocalDateString(d);
      const dayName = d.toLocaleDateString('en-IN', { weekday: 'short' });

      labels.push(dayName);

      const dayTotal = expenses
        .filter(e => e.date === dStr)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      data.push(dayTotal);
    }

    return {
      labels,
      datasets: [
        {
          label: 'Daily Spending (₹)',
          data,
          backgroundColor: '#0ea5e9',
          borderRadius: 6,
          hoverBackgroundColor: '#0284c7'
        }
      ]
    };
  }, [expenses]);

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header & Budget Warning Alert */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0369a1' }}>
            <MdAccountBalanceWallet className="text-teal" size={30} style={{ color: '#0ea5e9' }} /> 
            Daily Expense Tracker
          </h3>
          <p className="text-muted small mb-0">Track daily spending, manage budgets & analyze category trends</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          {!editingBudget ? (
            <button 
              className="btn btn-outline-info btn-sm rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-1 shadow-sm"
              onClick={() => { setEditingBudget(true); setTempBudget(dailyBudget); }}
            >
              <MdSettings size={16} /> Budget: ₹{dailyBudget.toLocaleString('en-IN')}/day
            </button>
          ) : (
            <div className="d-flex align-items-center gap-1 bg-white p-1 rounded-pill border shadow-sm">
              <span className="ps-2 fw-bold text-muted small">₹</span>
              <input 
                type="number" 
                className="form-control form-control-sm border-0 bg-transparent text-center fw-bold" 
                style={{ width: '80px' }}
                value={tempBudget}
                onChange={e => setTempBudget(e.target.value)}
                autoFocus
              />
              <button className="btn btn-sm btn-primary rounded-circle p-1" onClick={handleSaveBudget}><MdSave size={16} /></button>
              <button className="btn btn-sm btn-light rounded-circle p-1" onClick={() => setEditingBudget(false)}><MdClose size={16} /></button>
            </div>
          )}

          <button 
            className="btn text-white px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 rounded-pill"
            style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)', border: 'none' }}
            onClick={handleOpenAddModal}
          >
            <MdAdd size={22} /> Add Expense
          </button>
        </div>
      </div>

      {/* Budget Warning Alert (When limit exceeded) */}
      {isBudgetExceeded && (
        <div className="alert alert-danger border-0 shadow-sm rounded-4 mb-4 p-3 d-flex align-items-center justify-content-between animate-fadeIn" style={{ background: '#fef2f2', borderLeft: '5px solid #ef4444' }}>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-circle">
              <MdWarning size={28} />
            </div>
            <div>
              <h6 className="fw-bold text-danger mb-0">⚠️ Daily Budget Limit Exceeded!</h6>
              <p className="small text-secondary mb-0">
                You have spent <strong className="text-danger">₹{todaySpending.toLocaleString('en-IN')}</strong> today, exceeding your daily limit of <strong>₹{dailyBudget.toLocaleString('en-IN')}</strong> by <strong className="text-danger">₹{Math.abs(remainingBudget).toLocaleString('en-IN')}</strong>.
              </p>
            </div>
          </div>
          <button className="btn btn-outline-danger btn-sm rounded-pill px-3" onClick={() => handleOpenAddModal()}>Manage</button>
        </div>
      )}

      {/* Top Spending & Budget Metrics Cards */}
      <div className="row g-3 g-lg-4 mb-4">
        {/* Today's Total */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #10b981' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Today's Spending</p>
                <h3 className="fw-bold mb-0 text-success">₹{todaySpending.toLocaleString('en-IN')}</h3>
                <small className="text-muted">{expenses.filter(e => e.date === todayStr).length} items today</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                <MdTrendingDown size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Daily Budget */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #0ea5e9' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Daily Budget</p>
                <h3 className="fw-bold mb-0 text-primary">₹{dailyBudget.toLocaleString('en-IN')}</h3>
                <small className="text-muted">Target per day</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(14, 165, 233, 0.12)', color: '#0ea5e9' }}>
                <MdAccountBalanceWallet size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Remaining Balance */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: `4px solid ${remainingBudget < 0 ? '#ef4444' : '#8b5cf6'}` }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">Remaining Balance</p>
                <h3 className={`fw-bold mb-0 ${remainingBudget < 0 ? 'text-danger' : 'text-purple'}`} style={{ color: remainingBudget < 0 ? '#ef4444' : '#8b5cf6' }}>
                  ₹{remainingBudget.toLocaleString('en-IN')}
                </h3>
                <small className="text-muted">{remainingBudget < 0 ? 'Over limit!' : 'Available today'}</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: remainingBudget < 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(139, 92, 246, 0.12)', color: remainingBudget < 0 ? '#ef4444' : '#8b5cf6' }}>
                <MdCheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Summary */}
        <div className="col-6 col-lg-3">
          <div className="card modern-card p-3 p-lg-4 h-100 border-0 shadow-sm" style={{ borderTop: '4px solid #f59e0b' }}>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <p className="text-muted small mb-1 fw-semibold">This Month Spending</p>
                <h3 className="fw-bold mb-0 text-warning">₹{monthlySpending.toLocaleString('en-IN')}</h3>
                <small className="text-muted">Month-to-date total</small>
              </div>
              <div className="p-3 rounded-3" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                <MdReceipt size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="card modern-card p-3 mb-4 border-0 shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="small fw-bold text-muted text-uppercase" style={{ letterSpacing: '0.5px' }}>Daily Budget Usage ({budgetUsagePct}%)</span>
          <span className={`badge rounded-pill ${isBudgetExceeded ? 'bg-danger' : 'bg-success'}`}>
            ₹{todaySpending} / ₹{dailyBudget}
          </span>
        </div>
        <div className="progress" style={{ height: 10, borderRadius: 5 }}>
          <div 
            className={`progress-bar progress-bar-striped progress-bar-animated ${isBudgetExceeded ? 'bg-danger' : 'bg-success'}`}
            role="progressbar" 
            style={{ width: `${budgetUsagePct}%` }}
          ></div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Category Spending Chart */}
        <div className="col-12 col-lg-6">
          <div className="card modern-card p-4 border-0 shadow-sm h-100">
            <h6 className="fw-bold mb-3 text-dark">Category-Wise Spending Breakdown</h6>
            <div style={{ height: '240px' }} className="d-flex align-items-center justify-content-center">
              {expenses.length > 0 ? (
                <Doughnut 
                  data={categoryChartData} 
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
                <p className="text-muted small">No expense data available for breakdown.</p>
              )}
            </div>
          </div>
        </div>

        {/* Weekly Expense Trend */}
        <div className="col-12 col-lg-6">
          <div className="card modern-card p-4 border-0 shadow-sm h-100">
            <h6 className="fw-bold mb-3 text-dark">Weekly Spending Trend (Last 7 Days)</h6>
            <div style={{ height: '240px' }}>
              <Bar 
                data={weeklyChartData}
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

      {/* Expense List & Search/Filter Section */}
      <div className="card modern-card border-0 shadow-sm overflow-hidden">
        <div className="p-3 p-md-4 border-bottom bg-light bg-opacity-40">
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
            <h5 className="fw-bold mb-0 text-dark">Recent Daily Expenses</h5>

            {/* Filters */}
            <div className="d-flex flex-wrap align-items-center gap-2 w-100 w-md-auto">
              {/* Search */}
              <div className="input-group input-group-sm flex-grow-1" style={{ minWidth: '180px', maxWidth: '250px' }}>
                <span className="input-group-text bg-white border-end-0"><MdSearch size={16} /></span>
                <input 
                  type="text" 
                  className="form-control border-start-0 ps-0" 
                  placeholder="Search notes or category..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Category Filter */}
              <select 
                className="form-select form-select-sm" 
                style={{ width: 'auto' }}
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>

              {/* Date Filter */}
              <div className="btn-group btn-group-sm">
                {['Today', 'This Week', 'This Month', 'All'].map(df => (
                  <button 
                    key={df}
                    type="button" 
                    className={`btn btn-sm ${dateFilter === df ? 'btn-primary fw-bold' : 'btn-outline-secondary bg-white'}`}
                    onClick={() => setDateFilter(df)}
                  >
                    {df}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light">
              <tr className="text-muted small text-uppercase">
                <th className="px-4 py-3">Category</th>
                <th className="py-3">Date</th>
                <th className="py-3">Notes / Description</th>
                <th className="py-3 text-end">Amount</th>
                <th className="py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No expense records found for the selected filter.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catMeta = getCategoryMeta(exp.category);
                  return (
                    <tr key={exp.id}>
                      <td className="px-4 py-3">
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{ width: 36, height: 36, background: catMeta.bg, color: catMeta.color }}
                          >
                            {catMeta.icon}
                          </div>
                          <div>
                            <span className="fw-bold d-block text-dark small">{exp.category}</span>
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>{catMeta.label}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-muted small">{new Date(exp.date).toLocaleDateString('en-IN')}</span>
                      </td>
                      <td>
                        <span className="text-dark small">{exp.notes || '-'}</span>
                      </td>
                      <td className="text-end fw-bold text-danger">
                        ₹{Number(exp.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="text-center">
                        <div className="d-flex gap-2 justify-content-center">
                          <button 
                            className="btn btn-outline-primary btn-sm rounded-circle p-1"
                            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justify: 'center' }}
                            onClick={() => handleEditClick(exp)}
                            title="Edit Expense"
                          >
                            <MdEdit size={16} />
                          </button>
                          <button 
                            className="btn btn-outline-danger btn-sm rounded-circle p-1"
                            style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justify: 'center' }}
                            onClick={() => handleDeleteClick(exp.id)}
                            title="Delete Expense"
                          >
                            <MdDelete size={16} />
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

      {/* Add / Edit Expense Modal */}
      {showFormModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalanceWallet className="text-primary" />
                  {editingId ? 'Edit Expense' : 'Add New Daily Expense'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowFormModal(false)}></button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="modal-body py-3">
                  {/* Amount */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Amount (₹)</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light text-muted fw-bold">₹</span>
                      <input 
                        type="number" 
                        step="0.01"
                        className="form-control form-control-lg fw-bold" 
                        placeholder="0.00" 
                        value={formData.amount} 
                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                        required 
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Category */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Category</label>
                    <div className="row g-2">
                      {CATEGORIES.map(cat => (
                        <div className="col-4" key={cat.id}>
                          <div 
                            className={`p-2 rounded-3 border text-center cursor-pointer transition-all ${formData.category === cat.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-light hover-bg-white'}`}
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ color: cat.color }}>{cat.icon}</div>
                            <span className="small fw-semibold d-block mt-1 text-truncate">{cat.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Date</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={formData.date} 
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      required 
                    />
                  </div>

                  {/* Notes */}
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold small mb-1">Notes / Description (Optional)</label>
                    <textarea 
                      className="form-control" 
                      rows="2" 
                      placeholder="e.g. Lunch thali, Uber to office, Grocery shopping..."
                      value={formData.notes} 
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowFormModal(false)}>Cancel</button>
                  <button 
                    type="submit" 
                    className="btn text-white rounded-pill px-4 fw-bold shadow-sm"
                    style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #10b981 100%)', border: 'none' }}
                  >
                    {editingId ? 'Update Expense' : 'Save Expense'}
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

export default DailyExpenses;
