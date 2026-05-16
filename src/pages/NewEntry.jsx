import React, { useState, useEffect } from 'react';
import { MdPerson, MdDateRange, MdAttachMoney, MdDescription, MdSave, MdPayment, MdAdd, MdClose } from 'react-icons/md';
import { createTransaction, fetchTransactions } from '../api';
import { useNavigate } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
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
    dueDate: getLocalDateString(new Date().setMonth(new Date().getMonth() + 1)),
    interestRate: '',
    loanDuration: '',
    paymentMethod: 'Cash',
    paymentApp: ''
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

      await createTransaction(submitData);
      navigate('/', { state: { msg: 'Entry saved!' } });
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
              <div className="row g-2 mb-3">

                {/* Name */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdPerson className="me-1" size={14} /> First Name</label>
                  <input type="text" className="form-control form-control-custom py-1 px-2" name="name" value={formData.name} onChange={handleChange} placeholder="First name" style={{fontSize: '0.85rem'}} required />
                  {lastEntry && (
                    <div className="mt-0 animate-fadeIn">
                      <small className="text-primary fw-semibold" style={{fontSize: '0.65rem'}}>
                        Last: ₹{Number(lastEntry.amount).toLocaleString('en-IN')}
                      </small>
                    </div>
                  )}
                </div>

                {/* Last Name */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold small mb-1">Last Name</label>
                  <input type="text" className="form-control form-control-custom py-1 px-2" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" style={{fontSize: '0.85rem'}} />
                </div>

                {/* Date */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={14} /> Date</label>
                  <input type="date" className="form-control form-control-custom py-1 px-2" name="date" value={formData.date} onChange={handleChange} style={{fontSize: '0.85rem'}} required />
                </div>

                {/* Amount */}
                <div className="col-6 col-md-3">
                  <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdAttachMoney className="me-1" size={14} /> Amount</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-card text-muted border-end-0" style={{ borderColor: 'var(--border-color)', fontSize: '0.85rem' }}>₹</span>
                    <input type="number" className="form-control form-control-custom py-1 border-start-0 ps-0" name="amount" value={formData.amount} onChange={handleChange} placeholder="0.00" style={{ boxShadow: 'none', fontSize: '0.85rem' }} required />
                  </div>
                </div>

                {/* Type */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small text-center d-block mb-1">Transaction Type</label>
                  <div className="d-flex flex-wrap bg-card border rounded p-1 shadow-sm" style={{ borderColor: 'var(--border-color) !important', gap: '2px' }}>
                    <button type="button" className={`btn flex-fill py-1 px-1 rounded-2 ${formData.type === 'Credit' ? 'btn-success text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} style={{fontSize: '0.75rem'}} onClick={() => setFormData({...formData, type: 'Credit'})}>Credit</button>
                    <button type="button" className={`btn flex-fill py-1 px-1 rounded-2 ${formData.type === 'Debit' ? 'btn-danger text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} style={{fontSize: '0.75rem'}} onClick={() => setFormData({...formData, type: 'Debit'})}>Debit</button>
                    <button type="button" className={`btn flex-fill py-1 px-1 rounded-2 ${formData.type === 'EMI' ? 'btn-warning text-dark fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} style={{fontSize: '0.75rem'}} onClick={() => setFormData({...formData, type: 'EMI'})}>EMI</button>
                    <button type="button" className={`btn flex-fill py-1 px-1 rounded-2 ${formData.type === 'Loan' ? 'btn-primary text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} style={{fontSize: '0.75rem'}} onClick={() => setFormData({...formData, type: 'Loan'})}>Loan</button>
                    <button type="button" className={`btn flex-fill py-1 px-1 rounded-2 ${formData.type === 'Advance Payment' ? 'btn-info text-white fw-bold shadow-sm' : 'btn-link text-muted text-decoration-none'}`} style={{fontSize: '0.75rem'}} onClick={() => setFormData({...formData, type: 'Advance Payment'})}>Advance</button>
                  </div>
                </div>

                {/* Category */}
                <div className="col-12 col-md-6">
                  <label className="form-label text-muted fw-semibold small mb-1">Category</label>
                  {!showAddCategory ? (
                    <select
                      className="form-select form-control-custom py-1 px-2"
                      name="category"
                      value={formData.category}
                      style={{fontSize: '0.85rem'}}
                      onChange={(e) => e.target.value === '__ADD_NEW__' ? setShowAddCategory(true) : handleChange(e)}
                    >
                      {allCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="__ADD_NEW__">➕ Add New...</option>
                    </select>
                  ) : (
                    <div className="d-flex gap-1">
                      <input
                        type="text"
                        className="form-control form-control-custom py-1 px-2"
                        placeholder="New category..."
                        value={newCategoryName}
                        style={{fontSize: '0.85rem'}}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                        autoFocus
                      />
                      <button type="button" className="btn btn-primary btn-sm px-2" onClick={handleAddCategory}><MdAdd size={16} /></button>
                      <button type="button" className="btn btn-light btn-sm px-1" onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}><MdClose size={16} /></button>
                    </div>
                  )}
                </div>

                {/* EMI, Loan & Advance Specific Fields */}
                {(formData.type === 'EMI' || formData.type === 'Loan' || formData.type === 'Advance Payment') && (
                  <div className="col-12 py-1 bg-light bg-opacity-50 rounded-3 px-2">
                    <div className="row g-2">
                      <div className="col-6 col-md-3">
                        <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={12} /> {formData.type === 'Loan' ? 'Start' : 'Date'}</label>
                        <input type="date" className="form-control form-control-custom py-1 px-2" name="loanDate" value={formData.loanDate} onChange={handleChange} style={{fontSize: '0.8rem'}} required />
                      </div>
                      <div className="col-6 col-md-3">
                        <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdDateRange className="me-1" size={12} /> Due</label>
                        <input type="date" className="form-control form-control-custom py-1 px-2" name="dueDate" value={formData.dueDate} onChange={handleChange} style={{fontSize: '0.8rem'}} required />
                      </div>
                      {formData.type === 'Loan' && (
                        <>
                          <div className="col-6 col-md-3">
                            <label className="form-label text-muted fw-semibold small mb-1">Int. %</label>
                            <input type="number" step="0.1" className="form-control form-control-custom py-1 px-2" name="interestRate" value={formData.interestRate} onChange={handleChange} placeholder="%" style={{fontSize: '0.8rem'}} required />
                          </div>
                          <div className="col-6 col-md-3">
                            <label className="form-label text-muted fw-semibold small mb-1">Months</label>
                            <input type="number" className="form-control form-control-custom py-1 px-2" name="loanDuration" value={formData.loanDuration} onChange={handleChange} placeholder="12" style={{fontSize: '0.8rem'}} required />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="col-12 col-md-4">
                  <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center">
                    <MdPayment className="me-1" size={14} /> Payment Method
                  </label>
                  <div className="d-flex gap-2">
                    <div
                      className={`payment-method-card py-1 px-2 ${formData.paymentMethod === 'Cash' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Cash', paymentApp: '' })}
                      style={{ '--pm-color': '#2e7d32', flex: 1, minHeight: 'auto', padding: '4px' }}
                    >
                      <div className="payment-method-icon mb-0" style={{transform: 'scale(0.8)'}}>
                        <svg viewBox="0 0 40 40" width="24" height="24">
                          <rect width="40" height="40" rx="10" fill="#2e7d32"/>
                          <rect x="8" y="12" width="24" height="16" rx="3" fill="#fff"/>
                          <text x="20" y="23" textAnchor="middle" fill="#2e7d32" fontSize="10" fontWeight="bold">₹</text>
                        </svg>
                      </div>
                      <span className="payment-method-label small">Cash</span>
                    </div>

                    <div
                      className={`payment-method-card py-1 px-2 ${formData.paymentMethod === 'Online' ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, paymentMethod: 'Online', paymentApp: formData.paymentApp || '' })}
                      style={{ '--pm-color': '#1565c0', flex: 1, minHeight: 'auto', padding: '4px' }}
                    >
                      <div className="payment-method-icon mb-0" style={{transform: 'scale(0.8)'}}>
                        <svg viewBox="0 0 40 40" width="24" height="24">
                          <rect width="40" height="40" rx="10" fill="#1565c0"/>
                          <circle cx="20" cy="17" r="5" fill="none" stroke="#fff" strokeWidth="2"/>
                          <path d="M14 26c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="none" stroke="#fff" strokeWidth="2"/>
                        </svg>
                      </div>
                      <span className="payment-method-label small">Online</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="col-12 col-md-8">
                  <label className="form-label text-muted fw-semibold small mb-1 d-flex align-items-center"><MdDescription className="me-1" size={14} /> Description</label>
                  <textarea className="form-control form-control-custom py-1 px-2" rows="1" name="description" value={formData.description} onChange={handleChange} placeholder="Add notes..." style={{fontSize: '0.85rem'}}></textarea>
                </div>

                {/* Online Payment Apps */}
                {formData.paymentMethod === 'Online' && (
                  <div className="col-12 mt-1">
                    <div className="payment-apps-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '4px' }}>
                      {allApps.map((app) => (
                        <div
                          key={app.id}
                          className={`payment-app-card py-1 ${formData.paymentApp === app.id ? 'active' : ''}`}
                          onClick={() => setFormData({ ...formData, paymentApp: app.id })}
                          style={{ '--app-color': app.color, position: 'relative', minHeight: 'auto' }}
                        >
                          {customPaymentApps.some(c => c.name === app.id) && (
                            <span
                              onClick={(e) => { e.stopPropagation(); handleRemoveCustomMode(app.id); }}
                              style={{
                                position: 'absolute', top: 0, right: 0,
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#e53935', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 8, cursor: 'pointer'
                              }}
                            >×</span>
                          )}
                          <div className="payment-app-logo" style={{transform: 'scale(0.7)'}}>{app.logo}</div>
                          <span className="payment-app-name" style={{fontSize: '0.65rem'}}>{app.label}</span>
                        </div>
                      ))}
                      
                      {!showAddMode ? (
                        <div className="add-mode-btn py-1" style={{minHeight: 'auto'}} onClick={() => setShowAddMode(true)}>
                          <div className="add-mode-plus" style={{fontSize: '1rem'}}>+</div>
                          <span style={{fontSize: '0.65rem'}}>Add New</span>
                        </div>
                      ) : (
                        <div style={{ gridColumn: 'span 2', display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            type="text"
                            className="form-control form-control-custom py-1 px-2"
                            placeholder="New..."
                            value={newModeName}
                            onChange={(e) => setNewModeName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomMode())}
                            autoFocus
                            style={{ fontSize: '0.75rem' }}
                          />
                          <button type="button" className="btn btn-primary btn-sm px-2 py-1" onClick={handleAddCustomMode}><MdAdd size={14}/></button>
                          <button type="button" className="btn btn-light btn-sm px-2 py-1" onClick={() => { setShowAddMode(false); setNewModeName(''); }}><MdClose size={14}/></button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top mt-1" style={{ borderColor: 'var(--border-color) !important' }}>
                <button type="button" className="btn btn-light btn-sm px-3 py-1 text-muted fw-semibold" onClick={() => navigate('/')}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm px-4 py-1 fw-semibold shadow-sm" disabled={loading}>
                  <MdSave className="me-1" />{loading ? 'Saving...' : 'Save Entry'}
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
