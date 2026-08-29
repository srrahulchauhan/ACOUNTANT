import React, { useState, useEffect } from 'react';
import { 
  MdSearch, MdAccountBalance, MdAddCircle, MdEdit, MdDelete, 
  MdReceipt, MdCalendarToday, MdInfo, MdVisibility
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { getLocalDateString, addMonthsToDate } from '../utils/dateUtils';

const LOAN_TYPES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card', 'Other Loan'];

const Loans = () => {
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [payments, setPayments] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoanDetails, setSelectedLoanDetails] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    customerId: '',
    loanName: '',
    type: 'Home Loan',
    totalAmount: '',
    interestRate: '8.5',
    emiAmount: '',
    startDate: getLocalDateString(),
    tenureMonths: 12,
    dueDate: addMonthsToDate(getLocalDateString(), 1),
    lateFee: 350,
    status: 'Active',
    notes: '',
  });

  const loadData = () => {
    setLoans(loanStore.getLoans());
    setCustomers(loanStore.getCustomers());
    setPayments(loanStore.getPayments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  const openAddModal = () => {
    setEditingLoan(null);
    setFormData({
      id: 'LOAN-' + Math.floor(1000 + Math.random() * 9000),
      customerId: customers.length > 0 ? customers[0].id : '',
      loanName: '',
      type: 'Home Loan',
      totalAmount: '',
      interestRate: '8.5',
      emiAmount: '',
      startDate: getLocalDateString(),
      tenureMonths: 12,
      dueDate: addMonthsToDate(getLocalDateString(), 1),
      lateFee: 350,
      status: 'Active',
      notes: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (loan) => {
    setEditingLoan(loan);
    setFormData({ ...loan });
    setShowAddModal(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (['totalAmount', 'interestRate', 'tenureMonths'].includes(name)) {
        const autoEmi = loanStore.calculateEmi(
          name === 'totalAmount' ? value : prev.totalAmount,
          name === 'interestRate' ? value : prev.interestRate,
          name === 'tenureMonths' ? value : prev.tenureMonths
        );
        if (autoEmi > 0) updated.emiAmount = autoEmi.toString();
      }
      if (name === 'startDate') {
        updated.dueDate = addMonthsToDate(value, 1);
      }
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.loanName.trim() || !formData.customerId || !formData.totalAmount) {
      return alert('Please select a borrower and enter loan details!');
    }

    const calculatedEmi = Number(formData.emiAmount) || loanStore.calculateEmi(formData.totalAmount, formData.interestRate, formData.tenureMonths);

    loanStore.saveLoan({
      ...formData,
      totalAmount: Number(formData.totalAmount),
      interestRate: Number(formData.interestRate || 0),
      emiAmount: calculatedEmi,
      tenureMonths: Number(formData.tenureMonths || 12),
      lateFee: Number(formData.lateFee || 0),
    });

    alert(editingLoan ? '✓ Loan contract updated successfully!' : '✓ New loan account created successfully!');
    setShowAddModal(false);
  };

  const handleDelete = (id) => {
    loanStore.deleteLoan(id);
    setDeleteConfirmId(null);
    if (selectedLoanDetails && selectedLoanDetails.id === id) {
      setSelectedLoanDetails(null);
    }
    alert('✓ Loan account deleted.');
  };

  // Filter Loans
  const filteredLoans = loans.filter((l) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      l.loanName.toLowerCase().includes(q) ||
      l.customerName.toLowerCase().includes(q) ||
      l.id.toLowerCase().includes(q);

    const matchesType = !typeFilter || l.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header & Actions */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Loan Management System</h4>
          <p className="text-muted small mb-0">Create loans, view payment progress bars, and monitor EMI schedules</p>
        </div>
        <button className="btn btn-success rounded-3 px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2" onClick={openAddModal}>
          <MdAddCircle size={20} /> Create New Loan
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-6 col-lg-8">
            <div className="input-group bg-light rounded-3 border">
              <span className="input-group-text bg-transparent border-0 pe-1">
                <MdSearch size={20} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 box-shadow-none"
                placeholder="Search by loan name, borrower customer name, loan ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <select className="form-select bg-light border" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">-- All Loan Types --</option>
              {LOAN_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loans Grid / Cards */}
      <div className="row g-3">
        {filteredLoans.length === 0 ? (
          <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border">
            <p className="text-muted mb-0">No loan accounts found matching your filter criteria.</p>
          </div>
        ) : (
          filteredLoans.map((loan) => {
            const loanPayments = payments.filter((p) => p.loanId === loan.id && p.status === 'Paid');
            const paidEmis = loanPayments.length;
            const tenure = Number(loan.tenureMonths) || 12;
            const remainingEmis = Math.max(0, tenure - paidEmis);

            const totalPaidAmt = loanPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
            const outstanding = Math.max(0, Number(loan.totalAmount) - totalPaidAmt);
            const progressPercent = Math.min(100, Math.round((paidEmis / tenure) * 100));

            return (
              <div key={loan.id} className="col-12 col-md-6 col-xl-4">
                <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative hover-lift transition-all">
                  
                  {/* Actions */}
                  <div className="position-absolute top-0 end-0 m-3 d-flex gap-1">
                    <button className="btn btn-sm btn-light rounded-circle p-1.5 text-secondary border" title="Edit Loan" onClick={() => openEditModal(loan)}>
                      <MdEdit size={16} />
                    </button>
                    <button className="btn btn-sm btn-light rounded-circle p-1.5 text-danger border" title="Delete Loan" onClick={() => setDeleteConfirmId(loan.id)}>
                      <MdDelete size={16} />
                    </button>
                  </div>

                  <div className="mb-3">
                    <span className="badge bg-success bg-opacity-10 text-success rounded-pill px-2.5 py-1 mb-2 font-monospace">
                      {loan.type}
                    </span>
                    <h5 className="fw-bold text-dark mb-0">{loan.loanName}</h5>
                    <small className="text-muted">Borrower: <strong className="text-dark">{loan.customerName}</strong></small>
                  </div>

                  {/* Loan Amount Metrics */}
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Total Amount</small>
                      <h5 className="fw-bold text-dark mb-0">₹{Number(loan.totalAmount).toLocaleString('en-IN')}</h5>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>Monthly EMI</small>
                      <h5 className="fw-bold text-success mb-0">₹{Number(loan.emiAmount).toLocaleString('en-IN')}</h5>
                    </div>
                  </div>

                  {/* Payment Progress Bar */}
                  <div className="mb-3 p-3 bg-light rounded-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1.5">
                      <span className="small fw-semibold text-muted">EMI Paid Progress</span>
                      <span className="small fw-bold text-primary">{paidEmis} / {tenure} EMIs ({progressPercent}%)</span>
                    </div>
                    <div className="progress rounded-pill mb-2" style={{ height: '8px' }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <div className="d-flex justify-content-between small text-muted">
                      <span>Remaining: <strong className="text-dark">{remainingEmis} EMIs</strong></span>
                      <span>Balance: <strong className="text-danger">₹{outstanding.toLocaleString('en-IN')}</strong></span>
                    </div>
                  </div>

                  <button
                    className="btn btn-outline-success btn-sm rounded-3 w-100 fw-bold py-2 mt-auto d-flex align-items-center justify-content-center gap-1.5"
                    onClick={() => setSelectedLoanDetails({ ...loan, paidEmis, tenure, remainingEmis, outstanding, progressPercent, schedule: loanStore.generateEmiSchedule(loan) })}
                  >
                    <MdVisibility size={16} /> View Loan Details & Schedule
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create / Edit Loan Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalance className="text-success" /> {editingLoan ? 'Edit Loan Account' : 'Create New EMI Loan Account'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Select Borrower / Customer *</label>
                      <select className="form-select fw-semibold" name="customerId" value={formData.customerId} onChange={handleFormChange} required>
                        <option value="">-- Select Registered Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.id})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Loan Account Name *</label>
                      <input type="text" className="form-control" name="loanName" placeholder="e.g. HDFC Home Loan" value={formData.loanName} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Loan Type</label>
                      <select className="form-select" name="type" value={formData.type} onChange={handleFormChange}>
                        {LOAN_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Total Loan Amount (₹) *</label>
                      <input type="number" className="form-control fw-bold" name="totalAmount" placeholder="500000" value={formData.totalAmount} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Interest Rate (% p.a.)</label>
                      <input type="number" step="0.1" className="form-control" name="interestRate" placeholder="8.5" value={formData.interestRate} onChange={handleFormChange} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Tenure (Months) *</label>
                      <input type="number" className="form-control" name="tenureMonths" value={formData.tenureMonths} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Monthly EMI Amount (₹) *</label>
                      <input type="number" className="form-control fw-bold text-success" name="emiAmount" value={formData.emiAmount} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Start Date</label>
                      <input type="date" className="form-control" name="startDate" value={formData.startDate} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Next Due Date</label>
                      <input type="date" className="form-control" name="dueDate" value={formData.dueDate} onChange={handleFormChange} required />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Late Fee Rule (₹)</label>
                      <input type="number" className="form-control text-danger" name="lateFee" value={formData.lateFee} onChange={handleFormChange} />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Loan Notes & Terms</label>
                      <textarea className="form-control" rows="2" name="notes" placeholder="Loan details..." value={formData.notes} onChange={handleFormChange}></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light py-3 px-4">
                  <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-success rounded-3 px-4 fw-bold shadow-sm">Save Loan Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loan Details & EMI Schedule Breakdown Modal */}
      {selectedLoanDetails && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-success text-white py-3 px-4">
                <div>
                  <h5 className="modal-title fw-bold mb-0">{selectedLoanDetails.loanName}</h5>
                  <small className="opacity-90">Borrower: {selectedLoanDetails.customerName} • {selectedLoanDetails.type}</small>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedLoanDetails(null)}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Summary Metrics Cards */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Principal</small>
                      <h4 className="fw-bold text-dark mb-0">₹{Number(selectedLoanDetails.totalAmount).toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Monthly EMI</small>
                      <h4 className="fw-bold text-success mb-0">₹{Number(selectedLoanDetails.emiAmount).toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Progress</small>
                      <h4 className="fw-bold text-primary mb-0">{selectedLoanDetails.paidEmis} / {selectedLoanDetails.tenure} EMIs</h4>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Outstanding Balance</small>
                      <h4 className="fw-bold text-danger mb-0">₹{selectedLoanDetails.outstanding.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                </div>

                {/* Schedule Table */}
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Month-by-Month EMI Payment Schedule Breakdown</h6>
                  <div className="table-responsive" style={{ maxHeight: '350px' }}>
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="bg-light sticky-top">
                        <tr>
                          <th>Inst #</th>
                          <th>Due Date</th>
                          <th>EMI Amount</th>
                          <th>Principal Component</th>
                          <th>Interest Component</th>
                          <th>Remaining Balance</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedLoanDetails.schedule.map((row) => (
                          <tr key={row.installmentNumber}>
                            <td className="fw-bold">{row.installmentNumber}</td>
                            <td>{row.dueDate}</td>
                            <td className="fw-bold text-dark">₹{row.emiAmount.toLocaleString('en-IN')}</td>
                            <td className="text-success">₹{row.principalComponent.toLocaleString('en-IN')}</td>
                            <td className="text-muted">₹{row.interestComponent.toLocaleString('en-IN')}</td>
                            <td className="fw-semibold">₹{row.remainingBalance.toLocaleString('en-IN')}</td>
                            <td>
                              <span className={`badge rounded-pill ${
                                row.status === 'Paid' ? 'bg-success bg-opacity-10 text-success' :
                                row.status === 'Upcoming' ? 'bg-warning bg-opacity-10 text-dark' :
                                'bg-secondary bg-opacity-10 text-secondary'
                              }`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 bg-light py-3 px-4">
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-semibold" onClick={() => setSelectedLoanDetails(null)}>Close Schedule</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
              <div className="text-danger mb-2">
                <MdDelete size={40} />
              </div>
              <h6 className="fw-bold text-dark">Confirm Delete Loan Account</h6>
              <p className="small text-muted mb-3">Deleting this loan will also erase associated payment logs!</p>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-light border btn-sm rounded-3 px-3 fw-semibold" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm rounded-3 px-3 fw-bold" onClick={() => handleDelete(deleteConfirmId)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Loans;
