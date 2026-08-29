import React, { useState, useEffect } from 'react';
import { MdPerson, MdDateRange, MdAttachMoney, MdDescription, MdSave, MdPayment, MdAdd, MdClose, MdAutorenew } from 'react-icons/md';
import { createTransaction, fetchTransactions } from '../api';
import { useNavigate } from 'react-router-dom';
import { getLocalDateString, addMonthsToDate, calculateMonthsBetween } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_APPS, CUSTOM_COLORS } from '../utils/paymentApps';

const DEFAULT_CATEGORIES = ['General', 'Sales', 'Services', 'Rent', 'Utilities', 'Salary', 'Other'];

const NewEntry = () => {
  const navigate = useNavigate();
  const { updateUserData, customCategories, customPaymentApps } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    amount: '',
    type: 'Credit',
    category: 'General',
    description: '',
    date: getLocalDateString(),
    loanDate: getLocalDateString(),
    dueDate: addMonthsToDate(getLocalDateString(), 1),
    interestRate: '',
    loanDuration: '',
    paymentMethod: 'Cash',
    paymentApp: '',
    emiMonths: 1,
    createMultipleInstallments: true,
    installmentAmountMode: 'per_month'
  });
  const [loading, setLoading] = useState(false);
  const [showAddMode, setShowAddMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!formData.name.trim()) {
      setLastEntry(null);
      return;
    }
    const name = formData.name.trim().toLowerCase();
    const lastName = formData.lastName.trim().toLowerCase();
    
    const matches = transactions.filter(t => {
      const tName = (t.name || '').trim().toLowerCase();
      const tLastName = (t.lastName || '').trim().toLowerCase();
      if (lastName) {
        return tName === name && tLastName === lastName;
      }
      return tName === name;
    });

    if (matches.length > 0) {
      const latest = matches.reduce((prev, curr) => {
        return new Date(curr.date) > new Date(prev.date) ? curr : prev;
      });
      setLastEntry(latest);
    } else {
      setLastEntry(null);
    }
  }, [formData.name, formData.lastName, transactions]);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const allApps = [
    ...DEFAULT_APPS,
    ...customPaymentApps.map((app, i) => ({
      id: app.name,
      label: app.name,
      color: app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length],
      logo: (
        <svg viewBox="0 0 40 40" width="28" height="28">
          <rect width="40" height="40" rx="10" fill={app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length]}/>
          <text x="20" y="26" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="bold" fontFamily="Arial">
            {app.name.charAt(0).toUpperCase()}
          </text>
        </svg>
      )
    }))
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleEmiMonthsChange = (months) => {
    const numMonths = Math.max(1, parseInt(months || 1, 10));
    const startDate = formData.loanDate || formData.date || getLocalDateString();
    const newDueDate = addMonthsToDate(startDate, numMonths);
    setFormData(prev => ({
      ...prev,
      emiMonths: numMonths,
      dueDate: newDueDate
    }));
  };

  const handleStartDateChange = (e) => {
    const newDate = e.target.value;
    const newDueDate = addMonthsToDate(newDate, formData.emiMonths || 1);
    setFormData(prev => ({
      ...prev,
      date: newDate,
      loanDate: newDate,
      dueDate: newDueDate
    }));
  };

  const handleDueDateChange = (e) => {
    const newDueDate = e.target.value;
    const startDate = formData.loanDate || formData.date || getLocalDateString();
    const months = calculateMonthsBetween(startDate, newDueDate);
    setFormData(prev => ({
      ...prev,
      dueDate: newDueDate,
      emiMonths: months
    }));
  };

  const handleAddCustomMode = async () => {
    const trimmed = newModeName.trim();
    if (!trimmed) return;
    if (allApps.some(a => a.id.toLowerCase() === trimmed.toLowerCase())) {
      alert('This payment mode already exists!');
      return;
    }
    const color = CUSTOM_COLORS[customPaymentApps.length % CUSTOM_COLORS.length];
    const updated = [...customPaymentApps, { name: trimmed, color }];
    
    try {
      await updateUserData({ customPaymentApps: updated });
      setFormData({ ...formData, paymentApp: trimmed });
      setNewModeName('');
      setShowAddMode(false);
    } catch (err) {
      alert('Failed to save payment mode');
    }
  };

  const handleRemoveCustomMode = async (name) => {
    const updated = customPaymentApps.filter(a => a.name !== name);
    try {
      await updateUserData({ customPaymentApps: updated });
      if (formData.paymentApp === name) {
        setFormData({ ...formData, paymentApp: '' });
      }
    } catch (err) {
      alert('Failed to remove payment mode');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (submitData.paymentMethod === 'Cash') {
        submitData.paymentApp = '';
      }
      if (submitData.type === 'EMI' || submitData.type === 'Loan' || submitData.type === 'Advance Payment') {
        submitData.status = 'Pending';
      } else {
        delete submitData.loanDate;
        delete submitData.dueDate;
        delete submitData.status;
        delete submitData.interestRate;
        delete submitData.loanDuration;
      }

      if (formData.type === 'EMI' && formData.createMultipleInstallments && Number(formData.emiMonths) > 1) {
        const totalMonths = Number(formData.emiMonths);
        const baseAmount = Number(formData.amount) || 0;
        const monthlyAmt = formData.installmentAmountMode === 'total' 
          ? (baseAmount / totalMonths).toFixed(2) 
          : baseAmount;

        const startDate = formData.loanDate || formData.date || getLocalDateString();
        const promises = [];

        for (let i = 1; i <= totalMonths; i++) {
          const entryDueDate = addMonthsToDate(startDate, i);
          const entryDate = addMonthsToDate(startDate, i - 1);
          
          const singleEntry = {
            ...submitData,
            amount: Number(monthlyAmt),
            date: entryDate,
            loanDate: startDate,
            dueDate: entryDueDate,
            description: submitData.description 
              ? `${submitData.description} (EMI ${i}/${totalMonths})`
              : `EMI Installment ${i}/${totalMonths}`,
            installmentIndex: i,
            totalInstallments: totalMonths,
            emiMonths: totalMonths
          };
          promises.push(createTransaction(singleEntry));
        }

        await Promise.all(promises);
        navigate('/', { state: { msg: `Saved ${totalMonths} monthly EMI entries!` } });
      } else {
        await createTransaction(submitData);
        navigate('/', { state: { msg: 'Entry saved!' } });
      }
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists!');
      return;
    }
    const updated = [...customCategories, trimmed];
    try {
      await updateUserData({ customCategories: updated });
      setFormData({ ...formData, category: trimmed });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      alert('Failed to save category');
    }
  };

  return (
    <div className="container-fluid py-2 px-3 px-md-4">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <div>
          <h4 className="fw-bold mb-0">New Entry</h4>
          <p className="text-muted small mb-0 d-none d-sm-block">Add a new daily transaction record</p>
        </div>
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-xl-10">
          <div className="card modern-card p-3 p-md-3 animate-fade-in shadow-sm">
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-3">

                {/* Name */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdPerson className="me-1" size={16} /> First Name</label>
                  <input type="text" className="form-control form-control-custom p-2" name="name" value={formData.name} onChange={handleChange} placeholder="First name" required />
                  {lastEntry && (
                    <div className="mt-1 animate-fadeIn">
                      <small className="text-primary fw-semibold">
                        Last: ₹{Number(lastEntry.amount).toLocaleString('en-IN')}
                      </small>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold mb-1">Last Name</label>
                  <input type="text" className="form-control form-control-custom p-2" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" />
                </div>

                {/* Date */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={16} /> Date</label>
                  <input type="date" className="form-control form-control-custom p-2" name="date" value={formData.date} onChange={handleStartDateChange} required />
                </div>

                {/* Amount */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdAttachMoney className="me-1" size={16} /> Amount</label>
                  <div className="input-group">
                    <span className="input-group-text bg-card text-muted border-end-0" style={{ borderColor: 'var(--border-color)' }}>₹</span>
                    <input type="number" className="form-control form-control-custom p-2 border-start-0 ps-0" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" style={{ boxShadow: 'none' }} required />
                  </div>
                </div>

                {/* Type */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold text-center d-block mb-1">Transaction Type</label>
                  <div className="d-flex flex-wrap bg-card border rounded p-1 shadow-sm" style={{ borderColor: 'var(--border-color) !important', gap: '4px' }}>
                    <button type="button" className={`btn flex-fill p-2 rounded-2 ${formData.type === 'Credit' ? 'btn-success text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Credit'})}>Credit</button>
                    <button type="button" className={`btn flex-fill p-2 rounded-2 ${formData.type === 'Debit' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Debit'})}>Debit</button>
                    <button type="button" className={`btn flex-fill p-2 rounded-2 ${formData.type === 'EMI' ? 'btn-warning text-dark fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'EMI'})}>EMI</button>
                    <button type="button" className={`btn flex-fill p-2 rounded-2 ${formData.type === 'Loan' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Loan'})}>Loan</button>
                    <button type="button" className={`btn flex-fill p-2 rounded-2 ${formData.type === 'Advance Payment' ? 'btn-info text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} onClick={() => setFormData({...formData, type: 'Advance Payment'})}>Advance</button>
                  </div>
                </div>

                {/* Category */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold mb-1">Category</label>
                  {!showAddCategory ? (
                    <select
                      className="form-select form-control-custom p-2"
                      name="category"
                      value={formData.category}
                      onChange={(e) => e.target.value === '__ADD_NEW__' ? setShowAddCategory(true) : handleChange(e)}
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__ADD_NEW__">➕ Add New...</option>
                    </select>
                  ) : (
                    <div className="d-flex gap-2">
                      <input
                        type="text"
                        className="form-control form-control-custom p-2"
                        placeholder="New category..."
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        autoFocus
                      />
                      <button type="button" className="btn btn-primary px-3" onClick={handleAddCategory}><MdAdd size={20} /></button>
                      <button type="button" className="btn btn-light px-2" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}><MdClose size={20} /></button>
                    </div>
                  )}
                </div>

                {/* EMI, Loan & Advance Specific Fields */}
                {(formData.type === 'EMI' || formData.type === 'Loan' || formData.type === 'Advance Payment') && (
                  <div className="col-12 py-3 bg-light bg-opacity-50 rounded-3 px-3 border my-2">
                    <div className="row g-3 align-items-center">
                      <div className="col-6 col-md-3">
                        <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={14} /> {formData.type === 'Loan' ? 'Start' : 'Date'}</label>
                        <input type="date" className="form-control form-control-custom p-2" name="loanDate" value={formData.loanDate} onChange={handleStartDateChange} required />
                      </div>

                      {formData.type === 'EMI' && (
                        <div className="col-12 col-md-6">
                          <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center justify-content-between">
                            <span><MdDateRange className="me-1" size={14} /> EMI Months (Duration)</span>
                            <span className="badge bg-warning text-dark font-monospace">{formData.emiMonths} {formData.emiMonths == 1 ? 'Month' : 'Months'}</span>
                          </label>
                          <div className="d-flex flex-wrap gap-1 align-items-center">
                            {[1, 3, 6, 12, 18, 24].map(m => (
                              <button
                                key={m}
                                type="button"
                                className={`btn btn-sm rounded-pill px-2 py-1 fw-semibold ${Number(formData.emiMonths) === m ? 'btn-warning text-dark shadow-sm fw-bold' : 'btn-outline-secondary bg-white'}`}
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleEmiMonthsChange(m)}
                              >
                                {m} {m === 1 ? 'Mo' : 'Mos'}
                              </button>
                            ))}
                            <div className="d-flex align-items-center gap-1 ms-auto" style={{ maxWidth: '100px' }}>
                              <input
                                type="number"
                                min="1"
                                max="120"
                                className="form-control form-control-sm text-center fw-bold"
                                placeholder="Custom"
                                value={formData.emiMonths}
                                onChange={(e) => handleEmiMonthsChange(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="col-6 col-md-3">
                        <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={14} /> Due Date</label>
                        <input type="date" className="form-control form-control-custom p-2" name="dueDate" value={formData.dueDate} onChange={handleDueDateChange} required />
                      </div>

                      {formData.type === 'Loan' && (
                        <>
                          <div className="col-6 col-md-3">
                            <label className="form-label text-muted fw-semibold mb-1">Int. %</label>
                            <input type="number" step="0.1" className="form-control form-control-custom p-2" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="%" required />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label text-muted fw-semibold mb-1">Months</label>
                            <input type="number" className="form-control form-control-custom p-2" name="loanDuration" value={formData.loanDuration} onChange={handleChange} placeholder="12" required />
                          </div>
                        </>
                      )}
                    </div>

                    {/* EMI Multi-Month Continuous Entries Controls */}
                    {formData.type === 'EMI' && Number(formData.emiMonths) > 1 && (
                      <div className="mt-3 pt-3 border-top">
                        <div className="form-check form-switch d-flex align-items-center justify-content-between bg-white p-2 px-3 rounded-3 border mb-2 shadow-sm">
                          <div>
                            <label className="form-check-label fw-bold text-dark cursor-pointer mb-0 d-flex align-items-center gap-1" htmlFor="continueEmiSwitch">
                              <MdAutorenew className="text-warning spin-slow" size={18} /> Continue EMI for Next {formData.emiMonths} Months (Generate Monthly Entries)
                            </label>
                            <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                              Creates {formData.emiMonths} individual monthly due entries automatically for upcoming consecutive months.
                            </small>
                          </div>
                          <input
                            className="form-check-input ms-3 cursor-pointer"
                            type="checkbox"
                            role="switch"
                            id="continueEmiSwitch"
                            checked={formData.createMultipleInstallments}
                            onChange={(e) => setFormData({ ...formData, createMultipleInstallments: e.target.checked })}
                            style={{ width: '2.5em', height: '1.3em' }}
                          />
                        </div>

                        {formData.createMultipleInstallments && (
                          <div className="bg-white p-3 rounded-3 border">
                            <div className="d-flex flex-wrap align-items-center justify-content-between mb-2 gap-2">
                              <span className="small fw-bold text-secondary">Monthly Amount Option:</span>
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  className={`btn btn-sm ${formData.installmentAmountMode === 'per_month' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'}`}
                                  onClick={() => setFormData({ ...formData, installmentAmountMode: 'per_month' })}
                                >
                                  ₹{Number(formData.amount || 0).toLocaleString('en-IN')} / month
                                </button>
                                <button
                                  type="button"
                                  className={`btn btn-sm ${formData.installmentAmountMode === 'total' ? 'btn-warning text-dark fw-bold' : 'btn-outline-secondary'}`}
                                  onClick={() => setFormData({ ...formData, installmentAmountMode: 'total' })}
                                >
                                  Split Total (₹{(Number(formData.amount || 0) / Number(formData.emiMonths)).toFixed(0)} / mo)
                                </button>
                              </div>
                            </div>

                            {/* Monthly Preview List */}
                            <div className="mt-2">
                              <small className="fw-semibold text-muted mb-1 d-block">Monthly Schedule Preview ({formData.emiMonths} Installments):</small>
                              <div className="d-flex gap-2 overflow-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
                                {Array.from({ length: Math.min(Number(formData.emiMonths), 12) }).map((_, idx) => {
                                  const i = idx + 1;
                                  const monthDueDate = addMonthsToDate(formData.loanDate || formData.date, i);
                                  const amt = formData.installmentAmountMode === 'total'
                                    ? (Number(formData.amount || 0) / Number(formData.emiMonths)).toFixed(0)
                                    : formData.amount || 0;

                                  return (
                                    <div key={i} className="badge bg-warning bg-opacity-10 text-dark border border-warning px-2 py-1 text-start" style={{ minWidth: '115px' }}>
                                      <div className="fw-bold small">Month {i}/{formData.emiMonths}</div>
                                      <div className="text-danger fw-bold">₹{Number(amt).toLocaleString('en-IN')}</div>
                                      <div className="text-muted" style={{ fontSize: '0.65rem' }}>Due: {monthDueDate}</div>
                                    </div>
                                  );
                                })}
                                {Number(formData.emiMonths) > 12 && (
                                  <div className="badge bg-light text-muted border px-2 py-2 d-flex align-items-center">
                                    +{Number(formData.emiMonths) - 12} more months...
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}


                {/* Payment Method */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center">
                    <MdPayment className="me-1" size={16} /> Payment Method
                  </label>
                  <div className="d-flex gap-3">
                    <div
                      className={`card flex-fill text-center p-3 cursor-pointer transition-all ${formData.paymentMethod === 'Cash' ? 'border-success bg-success bg-opacity-10 shadow-sm' : 'border bg-light bg-opacity-50'}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Cash', paymentApp: '' })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${formData.paymentMethod === 'Cash' ? 'bg-success text-white' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ width: '32px', height: '32px' }}>
                          <span className="fw-bold">₹</span>
                        </div>
                        <span className={`fw-bold ${formData.paymentMethod === 'Cash' ? 'text-success' : 'text-muted'}`}>Cash</span>
                      </div>
                    </div>

                    <div
                      className={`card flex-fill text-center p-3 cursor-pointer transition-all ${formData.paymentMethod === 'Online' ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'border bg-light bg-opacity-50'}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Online', paymentApp: formData.paymentApp || '' })}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="d-flex align-items-center justify-content-center gap-2">
                        <div className={`rounded-circle d-flex align-items-center justify-content-center ${formData.paymentMethod === 'Online' ? 'bg-primary text-white' : 'bg-secondary bg-opacity-25 text-secondary'}`} style={{ width: '32px', height: '32px' }}>
                          <MdPayment size={18} />
                        </div>
                        <span className={`fw-bold ${formData.paymentMethod === 'Online' ? 'text-primary' : 'text-muted'}`}>Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Online Payment Apps - MOVED DIRECTLY BELOW PAYMENT METHOD AND MADE HORIZONTAL */}
                  {formData.paymentMethod === 'Online' && (
                    <div className="mt-3 animate-fade-in p-3 border rounded-3 bg-light bg-opacity-25">
                      <label className="form-label text-muted fw-semibold small mb-2 d-block">Select Payment App</label>
                      <div className="d-flex flex-wrap gap-2">
                        {allApps.map((app) => (
                          <div
                            key={app.id}
                            className={`d-flex align-items-center gap-2 p-2 px-3 rounded-pill border cursor-pointer transition-all ${formData.paymentApp === app.id ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-white hover-bg-light'}`}
                            onClick={() => setFormData({ ...formData, paymentApp: app.id })}
                            style={{ cursor: 'pointer' }}
                          >
                            <div style={{ transform: 'scale(0.8)' }} className="d-flex align-items-center">{app.logo}</div>
                            <span className="fw-semibold small">{app.label}</span>
                            {customPaymentApps.some(c => c.name === app.id) && (
                              <MdClose 
                                className="text-danger ms-1" 
                                size={16} 
                                onClick={(e) => { e.stopPropagation(); handleRemoveCustomMode(app.id); }} 
                                title="Remove"
                              />
                            )}
                          </div>
                        ))}
                        
                        {!showAddMode ? (
                          <div 
                            className="d-flex align-items-center gap-1 p-2 px-3 rounded-pill border border-dashed text-muted cursor-pointer hover-bg-light bg-white"
                            onClick={() => setShowAddMode(true)}
                            style={{ cursor: 'pointer' }}
                          >
                            <MdAdd size={16} /> <span className="fw-semibold small">Add New</span>
                          </div>
                        ) : (
                          <div className="d-flex align-items-center gap-1 p-1 rounded-pill border bg-white shadow-sm">
                            <input
                              type="text"
                              className="form-control form-control-sm border-0 bg-transparent ps-3"
                              placeholder="App name..."
                              value={newModeName}
                              onChange={(e) => setNewModeName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomMode())}
                              autoFocus
                              style={{ width: '120px', boxShadow: 'none' }}
                            />
                            <button type="button" className="btn btn-primary btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center" style={{ width: 26, height: 26 }} onClick={handleAddCustomMode}><MdAdd size={16}/></button>
                            <button type="button" className="btn btn-light border btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center me-1" style={{ width: 26, height: 26 }} onClick={() => { setShowAddMode(false); setNewModeName(''); }}><MdClose size={16}/></button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold mb-1 d-flex align-items-center"><MdDescription className="me-1" size={16} /> Description</label>
                  <textarea className="form-control form-control-custom p-2" rows="4" name="description" value={formData.description} onChange={handleChange} placeholder="Add notes..." style={{ height: formData.paymentMethod === 'Online' ? '100%' : '110px' }}></textarea>
                </div>

              </div>

              <div className="d-flex justify-content-end gap-3 pt-3 border-top mt-2" style={{ borderColor: 'var(--border-color) !important' }}>
                <button type="button" className="btn btn-light px-4 py-2 text-muted fw-bold rounded-pill" onClick={() => navigate('/')}>Cancel</button>
                <button type="submit" className="btn btn-primary px-5 py-2 fw-bold shadow-sm rounded-pill" disabled={loading}>
                  <MdSave className="me-2" size={18} />{loading ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewEntry;
