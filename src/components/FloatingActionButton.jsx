import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, MdClose, MdPersonAdd, MdAccountBalance, MdPayment, 
  MdReceipt, MdFileUpload, MdCheckCircle, MdDateRange, MdAttachMoney
} from 'react-icons/md';
import { fetchCustomers, createCustomer, createTransaction } from '../api';
import { getLocalDateString, addMonthsToDate } from '../utils/dateUtils';

const LOCAL_STORAGE_LOANS_KEY = 'emi_loan_management_data';

const LOAN_TYPES = [
  'Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card', 'Other Loan'
];

const FloatingActionButton = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'customer', 'loan', 'payment'

  // Data lists
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);

  // Customer Form State
  const [custForm, setCustForm] = useState({
    customerId: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
    name: '',
    phone: '',
    email: '',
    address: '',
    panAadhaar: '',
    dob: '',
    employment: '',
    monthlyIncome: '',
    profilePhoto: ''
  });

  // Loan Form State
  const [loanForm, setLoanForm] = useState({
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

  // Payment Form State
  const [paymentForm, setPaymentForm] = useState({
    loanId: '',
    amount: '',
    paidDate: getLocalDateString()
  });

  // Load data for selectors
  const loadData = async () => {
    try {
      const res = await fetchCustomers();
      let list = res.data || [];
      const savedCusts = localStorage.getItem('customers_extended_profiles');
      if (savedCusts) {
        const parsed = JSON.parse(savedCusts);
        list = list.map(c => {
          const extra = parsed.find(x => x._id === c._id || x.customerId === c.customerId);
          return extra ? { ...c, ...extra } : c;
        });
      }
      setCustomers(list);

      const savedLoans = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
      if (savedLoans) {
        setLoans(JSON.parse(savedLoans));
      }
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    if (isOpen || activeModal) {
      loadData();
    }
  }, [isOpen, activeModal]);

  // Helper EMI Calculator
  const calculateEmi = (principal, rate, months) => {
    const p = Number(principal);
    const r = Number(rate) / 12 / 100;
    const n = Number(months);
    if (!p || !n) return 0;
    if (!r) return Math.round(p / n);
    const emi = (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi);
  };

  const handleLoanFormChange = (e) => {
    const { name, value } = e.target;
    setLoanForm(prev => {
      const updated = { ...prev, [name]: value };
      if (['totalAmount', 'interestRate', 'tenureMonths'].includes(name)) {
        const autoEmi = calculateEmi(
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

  // Photo Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustForm(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 1. Submit New Customer
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    if (!custForm.name.trim()) return alert("Enter customer name!");

    try {
      const res = await createCustomer(custForm);
      const newCust = { ...res.data, ...custForm };
      
      const saved = localStorage.getItem('customers_extended_profiles');
      const list = saved ? JSON.parse(saved) : [];
      localStorage.setItem('customers_extended_profiles', JSON.stringify([...list, newCust]));

      alert(`✓ Customer "${custForm.name}" created successfully!`);
      setCustForm({
        customerId: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
        name: '', phone: '', email: '', address: '', panAadhaar: '', dob: '', employment: '', monthlyIncome: '', profilePhoto: ''
      });
      setActiveModal(null);
      setIsOpen(false);
      window.location.reload();
    } catch (err) { alert("Error saving customer: " + err.message); }
  };

  // 2. Submit New Loan
  const handleSaveLoan = async (e) => {
    e.preventDefault();
    if (!loanForm.loanName.trim() || !loanForm.totalAmount) return alert("Enter valid loan details!");

    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
      const existingLoans = saved ? JSON.parse(saved) : [];

      const newLoan = {
        id: 'loan_' + Date.now(),
        loanName: loanForm.loanName,
        borrowerName: loanForm.borrowerName || 'Primary Borrower',
        type: loanForm.type,
        totalAmount: Number(loanForm.totalAmount),
        interestRate: Number(loanForm.interestRate || 0),
        emiAmount: Number(loanForm.emiAmount || 0),
        startDate: loanForm.startDate,
        tenureMonths: Number(loanForm.tenureMonths || 12),
        paidEmis: 0,
        dueDate: loanForm.dueDate || addMonthsToDate(loanForm.startDate, 1),
        status: 'Active',
        notes: loanForm.notes,
        history: []
      };

      localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify([newLoan, ...existingLoans]));

      // Sync transaction
      try {
        await createTransaction({
          name: loanForm.borrowerName || 'Borrower',
          amount: Number(loanForm.emiAmount || 0),
          type: 'EMI',
          category: loanForm.type,
          description: `${loanForm.loanName} (Monthly EMI)`,
          date: loanForm.startDate,
          loanDate: loanForm.startDate,
          dueDate: loanForm.dueDate,
          status: 'Pending',
          totalInstallments: Number(loanForm.tenureMonths || 12),
          installmentIndex: 1
        });
      } catch (e) { console.error(e); }

      alert(`✓ Loan "${loanForm.loanName}" created successfully!`);
      setActiveModal(null);
      setIsOpen(false);
      window.location.reload();
    } catch (err) { alert("Error saving loan: " + err.message); }
  };

  // 3. Submit EMI Payment
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentForm.loanId) return alert("Select a loan account!");

    const loan = loans.find(l => l.id === paymentForm.loanId);
    if (!loan) return;

    const updatedPaidEmis = loan.paidEmis + 1;
    const isCompleted = updatedPaidEmis >= loan.tenureMonths;
    const nextDue = addMonthsToDate(loan.dueDate || getLocalDateString(), 1);

    const historyItem = {
      installment: updatedPaidEmis,
      paidDate: paymentForm.paidDate || getLocalDateString(),
      amount: Number(paymentForm.amount || loan.emiAmount)
    };

    const updatedLoans = loans.map(l => {
      if (l.id === paymentForm.loanId) {
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

    localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify(updatedLoans));
    alert(`✓ Marked EMI Payment for "${loan.loanName}" as PAID!`);
    setActiveModal(null);
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <>
      {/* Floating Circular Black '+' Button */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '24px', 
          right: '24px', 
          zIndex: 1060 
        }}
      >
        <button
          type="button"
          className="btn rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 transition-all"
          style={{
            width: '58px',
            height: '58px',
            backgroundColor: '#000000',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            color: '#ffffff',
            boxShadow: '0 12px 28px rgba(0, 0, 0, 0.4), 0 6px 12px rgba(0, 0, 0, 0.25)',
            transform: isOpen ? 'rotate(45deg) scale(1.05)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            cursor: 'pointer'
          }}
          onClick={() => setIsOpen(!isOpen)}
          title="New Entry Quick Options"
        >
          <MdAdd size={32} />
        </button>

        {/* Quick Options Popup Menu */}
        {isOpen && !activeModal && (
          <div 
            className="position-absolute bottom-100 end-0 mb-3 bg-white p-2 rounded-4 shadow-lg border animate-fadeIn"
            style={{ 
              width: '230px', 
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,0,0,0.08)'
            }}
          >
            <div className="px-3 py-2 border-bottom">
              <small className="fw-bold text-uppercase text-muted" style={{ letterSpacing: '0.5px', fontSize: '0.68rem' }}>
                Quick Create Options
              </small>
            </div>

            <div className="d-flex flex-column gap-1 pt-1">
              <button 
                type="button"
                className="btn btn-hover-light text-start d-flex align-items-center gap-2 p-2 px-3 rounded-3 border-0 w-100"
                onClick={() => setActiveModal('customer')}
              >
                <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-circle">
                  <MdPersonAdd size={18} />
                </div>
                <div>
                  <span className="fw-bold d-block small text-dark">Add New Customer</span>
                  <small className="text-muted" style={{ fontSize: '0.68rem' }}>Create borrower profile</small>
                </div>
              </button>

              <button 
                type="button"
                className="btn btn-hover-light text-start d-flex align-items-center gap-2 p-2 px-3 rounded-3 border-0 w-100"
                onClick={() => setActiveModal('loan')}
              >
                <div className="bg-success bg-opacity-10 text-success p-2 rounded-circle">
                  <MdAccountBalance size={18} />
                </div>
                <div>
                  <span className="fw-bold d-block small text-dark">Add New Loan</span>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Setup EMI account</span>
                </div>
              </button>

              <button 
                type="button"
                className="btn btn-hover-light text-start d-flex align-items-center gap-2 p-2 px-3 rounded-3 border-0 w-100"
                onClick={() => setActiveModal('payment')}
              >
                <div className="bg-warning bg-opacity-10 text-dark p-2 rounded-circle">
                  <MdPayment size={18} />
                </div>
                <div>
                  <span className="fw-bold d-block small text-dark">Add EMI Payment</span>
                  <span className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Mark installment paid</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. Modal: Add New Customer */}
      {activeModal === 'customer' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdPersonAdd className="text-primary" /> Add New Customer Profile
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>

              <form onSubmit={handleSaveCustomer}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-12 text-center mb-2">
                      <div className="d-inline-block position-relative">
                        {custForm.profilePhoto ? (
                          <img src={custForm.profilePhoto} alt="Preview" className="rounded-circle border border-3 border-primary" style={{ width: 70, height: 70, objectFit: 'cover' }} />
                        ) : (
                          <div className="rounded-circle bg-light border d-flex align-items-center justify-content-center mx-auto text-muted" style={{ width: 70, height: 70, fontSize: '1.8rem' }}>
                            👤
                          </div>
                        )}
                        <label htmlFor="fabPhotoUpload" className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1" style={{ width: 26, height: 26, cursor: 'pointer' }}>
                          <MdFileUpload size={14} />
                        </label>
                        <input id="fabPhotoUpload" type="file" accept="image/*" className="d-none" onChange={handlePhotoUpload} />
                      </div>
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Customer ID</label>
                      <input type="text" className="form-control font-monospace fw-bold bg-light" value={custForm.customerId} readOnly />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Full Name *</label>
                      <input type="text" className="form-control" placeholder="Customer Name" value={custForm.name} onChange={e => setCustForm({ ...custForm, name: e.target.value })} required />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Mobile Number</label>
                      <input type="text" className="form-control" placeholder="9876543210" value={custForm.phone} onChange={e => setCustForm({ ...custForm, phone: e.target.value })} />
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Email Address</label>
                      <input type="email" className="form-control" placeholder="email@example.com" value={custForm.email} onChange={e => setCustForm({ ...custForm, email: e.target.value })} />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">PAN / Aadhaar</label>
                      <input type="text" className="form-control font-monospace" placeholder="ABCDE1234F" value={custForm.panAadhaar} onChange={e => setCustForm({ ...custForm, panAadhaar: e.target.value })} />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Date of Birth</label>
                      <input type="date" className="form-control" value={custForm.dob} onChange={e => setCustForm({ ...custForm, dob: e.target.value })} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Employment</label>
                      <input type="text" className="form-control" placeholder="Business / Job" value={custForm.employment} onChange={e => setCustForm({ ...custForm, employment: e.target.value })} />
                    </div>
                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Monthly Income (₹)</label>
                      <input type="number" className="form-control fw-bold text-success" placeholder="85000" value={custForm.monthlyIncome} onChange={e => setCustForm({ ...custForm, monthlyIncome: e.target.value })} />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Address</label>
                      <textarea className="form-control" rows="2" placeholder="Full residential address..." value={custForm.address} onChange={e => setCustForm({ ...custForm, address: e.target.value })}></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold shadow-sm">Save Customer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal: Add New Loan */}
      {activeModal === 'loan' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdAccountBalance className="text-success" /> Add New EMI Loan Account
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>

              <form onSubmit={handleSaveLoan}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Loan Name / Description *</label>
                      <input type="text" className="form-control" name="loanName" placeholder="e.g. HDFC Home Loan" value={loanForm.loanName} onChange={handleLoanFormChange} required />
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Select Borrower / Customer *</label>
                      <select className="form-select fw-semibold" name="borrowerName" value={loanForm.borrowerName} onChange={handleLoanFormChange} required>
                        <option value="">-- Select Registered Customer --</option>
                        {customers.map(c => (
                          <option key={c._id || c.id || c.name} value={c.name}>{c.name} ({c.customerId || 'ID'})</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Loan Type</label>
                      <select className="form-select" name="type" value={loanForm.type} onChange={handleLoanFormChange}>
                        {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Total Amount (₹) *</label>
                      <input type="number" className="form-control fw-bold" name="totalAmount" placeholder="0.00" value={loanForm.totalAmount} onChange={handleLoanFormChange} required />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Interest Rate (% p.a.)</label>
                      <input type="number" step="0.1" className="form-control" name="interestRate" placeholder="8.5" value={loanForm.interestRate} onChange={handleLoanFormChange} />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Tenure (Months) *</label>
                      <input type="number" className="form-control" name="tenureMonths" value={loanForm.tenureMonths} onChange={handleLoanFormChange} required />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Monthly EMI Amount (₹) *</label>
                      <input type="number" className="form-control fw-bold text-success" name="emiAmount" value={loanForm.emiAmount} onChange={handleLoanFormChange} required />
                    </div>

                    <div className="col-4">
                      <label className="form-label small fw-semibold text-muted">Next Due Date</label>
                      <input type="date" className="form-control" name="dueDate" value={loanForm.dueDate} onChange={handleLoanFormChange} required />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Notes / Details</label>
                      <textarea className="form-control" rows="2" name="notes" placeholder="Loan details..." value={loanForm.notes} onChange={handleLoanFormChange}></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success rounded-pill px-4 fw-bold shadow-sm">Save Loan Account</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add EMI Payment */}
      {activeModal === 'payment' && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdPayment className="text-warning" /> Record EMI Payment
                </h5>
                <button type="button" className="btn-close" onClick={() => setActiveModal(null)}></button>
              </div>

              <form onSubmit={handleSavePayment}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Select Active Loan Account *</label>
                    <select 
                      className="form-select fw-bold" 
                      value={paymentForm.loanId} 
                      onChange={e => {
                        const selectedId = e.target.value;
                        const l = loans.find(x => x.id === selectedId);
                        setPaymentForm({ ...paymentForm, loanId: selectedId, amount: l ? l.emiAmount : '' });
                      }}
                      required
                    >
                      <option value="">-- Choose Loan Account --</option>
                      {loans.filter(l => l.status === 'Active').map(l => (
                        <option key={l.id} value={l.id}>
                          {l.loanName} ({l.borrowerName}) - ₹{l.emiAmount.toLocaleString('en-IN')}/mo
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Payment Amount (₹)</label>
                    <input type="number" className="form-control fw-bold text-success" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} required />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Paid Date</label>
                    <input type="date" className="form-control" value={paymentForm.paidDate} onChange={e => setPaymentForm({ ...paymentForm, paidDate: e.target.value })} required />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn btn-warning rounded-pill px-4 fw-bold shadow-sm text-dark">
                    ✓ Mark Payment Success
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingActionButton;
