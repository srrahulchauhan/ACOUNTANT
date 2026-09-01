import React, { useState, useEffect } from 'react';
import { 
  MdSearch, MdPersonAdd, MdEdit, MdDelete, MdPhone, MdEmail, 
  MdHome, MdAccountBalance, MdPayment, MdFileUpload, MdBadge, MdWork,
  MdSend, MdChat, MdHistory, MdViewList, MdViewModule, MdVisibility
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { formatIndianDate } from '../utils/dateUtils';
import SendStatementModal from '../components/SendStatementModal';


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [occupationFilter, setOccupationFilter] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rc_view_customers') || (window.innerWidth >= 768 ? 'table' : 'cards');
  });

  const handleSetViewMode = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rc_view_customers', mode);
  };

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [commModal, setCommModal] = useState({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' });

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    panAadhaar: '',
    dob: '',
    employment: '',
    monthlyIncome: '',
    profilePhoto: '',
  });

  const loadData = () => {
    setCustomers(loanStore.getCustomers());
    setLoans(loanStore.getLoans());
    setPayments(loanStore.getPayments());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      id: 'CUST-' + Math.floor(1000 + Math.random() * 9000),
      name: '',
      phone: '',
      email: '',
      address: '',
      panAadhaar: '',
      dob: '',
      employment: '',
      monthlyIncome: '',
      profilePhoto: '',
    });
    setShowAddModal(true);
  };

  const openEditModal = (cust) => {
    setEditingCustomer(cust);
    setFormData({ ...cust });
    setShowAddModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;

    loanStore.saveCustomer(formData);
    setShowAddModal(false);
    loadData();
  };

  const handleDelete = (id) => {
    loanStore.deleteCustomer(id);
    setDeleteConfirmId(null);
    if (selectedProfile && selectedProfile.id === id) {
      setSelectedProfile(null);
    }
    loadData();
  };

  const handleUpdateLoanStatus = (loanId, newStatus) => {
    loanStore.updateLoanStatus(loanId, newStatus);
    const updatedLoans = loanStore.getLoans();
    setLoans(updatedLoans);
    if (selectedProfile) {
      const updatedCustLoans = updatedLoans.filter((l) => l.customerId === selectedProfile.id);
      setSelectedProfile((prev) => ({
        ...prev,
        custLoans: updatedCustLoans,
      }));
    }
  };

  // Filter Customers
  const filteredCustomers = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q)) ||
      (c.panAadhaar && c.panAadhaar.toLowerCase().includes(q));

    const matchesOcc = !occupationFilter || (c.employment && c.employment.toLowerCase().includes(occupationFilter.toLowerCase()));
    return matchesSearch && matchesOcc;
  });

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header & Controls */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer Management</h4>
          <p className="text-muted small mb-0">View, register, and track borrower profiles &amp; linked loan accounts</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* View Mode Toggle */}
          <div className="btn-group bg-white rounded-3 border p-0.5 shadow-2xs">
            <button
              type="button"
              className={`btn btn-sm px-2.5 py-1.5 fw-bold ${viewMode === 'table' ? 'btn-primary' : 'btn-light text-muted'}`}
              onClick={() => handleSetViewMode('table')}
              title="Table View"
            >
              <MdViewList size={18} /> Table
            </button>
            <button
              type="button"
              className={`btn btn-sm px-2.5 py-1.5 fw-bold ${viewMode === 'cards' ? 'btn-primary' : 'btn-light text-muted'}`}
              onClick={() => handleSetViewMode('cards')}
              title="Cards View"
            >
              <MdViewModule size={18} /> Cards
            </button>
          </div>

          <button className="btn btn-primary rounded-3 px-3 py-2 fw-bold shadow-sm d-flex align-items-center gap-1.5" onClick={openAddModal}>
            <MdPersonAdd size={18} /> Add New Customer
          </button>
        </div>
      </div>

      {/* Filter Bar */}
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
                placeholder="Search by customer name, ID, phone number, PAN/Aadhaar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-12 col-md-6 col-lg-4">
            <input
              type="text"
              className="form-control bg-light border"
              placeholder="Filter by Occupation / Business..."
              value={occupationFilter}
              onChange={(e) => setOccupationFilter(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Customer Content: Table or Cards View */}
      {viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted font-monospace small">
                <tr>
                  <th className="ps-4">CUSTOMER</th>
                  <th>PHONE / EMAIL</th>
                  <th>EMPLOYMENT / PAN</th>
                  <th>ACTIVE LOANS</th>
                  <th>TOTAL BORROWED</th>
                  <th>OUTSTANDING</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <p className="mb-0 fw-semibold">No customer profiles found matching your search.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCustomers.map((cust) => {
                    const custLoans = loans.filter((l) => l.customerId === cust.id);
                    const totalLoanAmt = custLoans.reduce((s, l) => s + Number(l.totalAmount || 0), 0);
                    const custPayments = payments.filter((p) => p.customerId === cust.id && p.status === 'Paid');
                    const totalPaidAmt = custPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
                    const outstandingBalance = Math.max(0, totalLoanAmt - totalPaidAmt);
                    const totalMonthlyEmi = custLoans.reduce((s, l) => s + Number(l.emiAmount || 0), 0);

                    return (
                      <tr key={cust.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2.5">
                            <img
                              src={cust.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=0d6efd&color=fff`}
                              alt={cust.name}
                              className="rounded-circle border border-primary shadow-2xs"
                              width="38"
                              height="38"
                              style={{ objectFit: 'cover' }}
                            />
                            <div>
                              <div className="fw-bold text-dark">{cust.name}</div>
                              <span className="badge bg-primary bg-opacity-10 text-primary font-monospace" style={{ fontSize: '0.68rem' }}>
                                {cust.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="small text-dark fw-semibold">{cust.phone || '—'}</div>
                          <small className="text-muted d-block text-truncate" style={{ maxWidth: 180 }}>{cust.email || '—'}</small>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1 rounded-2 fw-semibold">
                            {cust.employment || 'Self Employed'}
                          </span>
                          {cust.panAadhaar && <small className="d-block text-muted font-monospace">{cust.panAadhaar}</small>}
                        </td>

                        <td>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary border px-2 py-1 rounded-pill fw-bold">
                            {custLoans.length} {custLoans.length === 1 ? 'Loan' : 'Loans'}
                          </span>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">₹{totalLoanAmt.toLocaleString('en-IN')}</div>
                          <small className="text-success fw-semibold">EMI: ₹{totalMonthlyEmi.toLocaleString('en-IN')}/mo</small>
                        </td>

                        <td>
                          <div className={`fw-bold ${outstandingBalance > 0 ? 'text-danger' : 'text-success'}`}>
                            ₹{outstandingBalance.toLocaleString('en-IN')}
                          </div>
                        </td>

                        <td className="text-end pe-4">
                          <div className="d-flex align-items-center justify-content-end gap-1.5">
                            <button
                              type="button"
                              className="btn btn-outline-success btn-sm rounded-3 px-2 py-1.5 fw-bold d-flex align-items-center gap-1"
                              onClick={() => setCommModal({ open: true, customerId: cust.id, loanId: custLoans[0]?.id || null, templateKey: 'loan_statement' })}
                              title="Send Statement via WhatsApp / Gmail"
                            >
                              <MdSend size={14} /> Send
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm rounded-3 px-2 py-1.5 fw-semibold d-flex align-items-center gap-1"
                              onClick={() => setSelectedProfile({ ...cust, custLoans, totalLoanAmt, outstandingBalance, totalMonthlyEmi })}
                              title="View Profile"
                            >
                              <MdVisibility size={15} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm rounded-3 px-2 py-1.5"
                              onClick={() => openEditModal(cust)}
                              title="Edit Customer"
                            >
                              <MdEdit size={15} />
                            </button>

                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm rounded-3 px-2 py-1.5"
                              onClick={() => setDeleteConfirmId(cust.id)}
                              title="Delete Customer"
                            >
                              <MdDelete size={15} />
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
      ) : (
        /* CARDS VIEW */
        <div className="row g-3">
          {filteredCustomers.length === 0 ? (
            <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm border">
              <p className="text-muted mb-0">No customer profiles found matching your search.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const custLoans = loans.filter((l) => l.customerId === cust.id);
              const totalLoanAmt = custLoans.reduce((s, l) => s + Number(l.totalAmount || 0), 0);

              const custPayments = payments.filter((p) => p.customerId === cust.id && p.status === 'Paid');
              const totalPaidAmt = custPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
              const outstandingBalance = Math.max(0, totalLoanAmt - totalPaidAmt);
              const totalMonthlyEmi = custLoans.reduce((s, l) => s + Number(l.emiAmount || 0), 0);

              return (
                <div key={cust.id} className="col-12 col-md-6 col-xl-4">
                  <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100 position-relative hover-lift transition-all">
                    
                    {/* Action Buttons */}
                    <div className="position-absolute top-0 end-0 m-3 d-flex gap-1.5">
                      <button 
                        type="button"
                        className="btn btn-sm btn-light rounded-circle text-secondary border d-flex align-items-center justify-content-center" 
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        title="Edit Customer" 
                        onClick={() => openEditModal(cust)}
                      >
                        <MdEdit size={14} />
                      </button>
                      <button 
                        type="button"
                        className="btn btn-sm btn-light rounded-circle text-danger border d-flex align-items-center justify-content-center" 
                        style={{ width: '28px', height: '28px', padding: 0 }}
                        title="Delete Customer" 
                        onClick={() => setDeleteConfirmId(cust.id)}
                      >
                        <MdDelete size={14} />
                      </button>
                    </div>

                    <div className="d-flex align-items-center gap-3 mb-3 pe-5">
                      <img
                        src={cust.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(cust.name)}&background=0d6efd&color=fff`}
                        alt={cust.name}
                        className="rounded-circle border border-2 border-primary shadow-2xs flex-shrink-0"
                        width="50"
                        height="50"
                        style={{ objectFit: 'cover' }}
                      />
                      <div className="overflow-hidden">
                        <h6 className="fw-bold text-dark mb-0 text-truncate">{cust.name}</h6>
                        <span className="badge bg-primary bg-opacity-10 text-primary font-monospace" style={{ fontSize: '0.7rem' }}>
                          {cust.id}
                        </span>
                      </div>
                    </div>

                    <div className="small text-muted mb-3 d-flex flex-column gap-1.5">
                      <div className="d-flex align-items-center gap-2">
                        <MdPhone size={16} className="text-primary" />
                        <span>{cust.phone || 'No phone'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MdEmail size={16} className="text-primary" />
                        <span className="text-truncate">{cust.email || 'No email'}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <MdWork size={16} className="text-primary" />
                        <span className="text-truncate">{cust.employment || 'Self Employed'}</span>
                      </div>
                    </div>

                    {/* Financial Summary Snippet */}
                    <div className="p-3 bg-light rounded-3 mb-3 border">
                      <div className="row text-center g-2">
                        <div className="col-4 border-end">
                          <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Loans</small>
                          <strong className="text-dark small">{custLoans.length}</strong>
                        </div>
                        <div className="col-4 border-end">
                          <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Monthly EMI</small>
                          <strong className="text-success small">₹{totalMonthlyEmi.toLocaleString('en-IN')}</strong>
                        </div>
                        <div className="col-4">
                          <small className="text-muted d-block" style={{ fontSize: '0.68rem' }}>Outstanding</small>
                          <strong className="text-danger small">₹{outstandingBalance.toLocaleString('en-IN')}</strong>
                        </div>
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-auto">
                      <button
                        className="btn btn-outline-success btn-sm rounded-3 fw-bold py-2 d-flex align-items-center justify-content-center gap-1"
                        style={{ flex: '0 0 auto' }}
                        title="Send Statement via WhatsApp / Gmail"
                        onClick={() => setCommModal({ open: true, customerId: cust.id, loanId: custLoans[0]?.id || null, templateKey: 'loan_statement' })}
                      >
                        <MdSend size={15} /> Send
                      </button>
                      <button
                        className="btn btn-outline-primary btn-sm rounded-3 flex-grow-1 fw-bold py-2"
                        onClick={() => setSelectedProfile({ ...cust, custLoans, totalLoanAmt, outstandingBalance, totalMonthlyEmi })}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdBadge className="text-primary" /> {editingCustomer ? 'Edit Customer Profile' : 'Add New Customer Profile'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body p-4">
                  <div className="row g-3">
                    <div className="col-12 text-center mb-2">
                      <div className="d-inline-block position-relative">
                        {formData.profilePhoto ? (
                          <img src={formData.profilePhoto} alt="Preview" className="rounded-circle border border-3 border-primary shadow-sm" style={{ width: 75, height: 75, objectFit: 'cover' }} />
                        ) : (
                          <div className="rounded-circle bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center mx-auto text-primary" style={{ width: 75, height: 75, fontSize: '2rem' }}>
                            👤
                          </div>
                        )}
                        <label htmlFor="custPhotoInput" className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1 shadow" style={{ width: 28, height: 28, cursor: 'pointer' }} title="Upload Photo">
                          <MdFileUpload size={16} />
                        </label>
                        <input id="custPhotoInput" type="file" accept="image/*" className="d-none" onChange={handlePhotoUpload} />
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Customer ID</label>
                      <input type="text" className="form-control font-monospace fw-bold bg-light" value={formData.id} readOnly />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Full Name *</label>
                      <input type="text" className="form-control" placeholder="Customer Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Mobile Number</label>
                      <input type="text" className="form-control" placeholder="+91 98765 43210" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">Email Address</label>
                      <input type="email" className="form-control" placeholder="email@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label small fw-semibold text-muted">PAN / Aadhaar Number</label>
                      <input type="text" className="form-control font-monospace text-uppercase" placeholder="ABCDE1234F" value={formData.panAadhaar} onChange={(e) => setFormData({ ...formData, panAadhaar: e.target.value })} />
                    </div>

                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Date of Birth</label>
                      <input type="date" className="form-control" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Occupation / Business</label>
                      <input type="text" className="form-control" placeholder="Software Engineer / Business" value={formData.employment} onChange={(e) => setFormData({ ...formData, employment: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label small fw-semibold text-muted">Monthly Income (₹)</label>
                      <input type="number" className="form-control fw-bold text-success" placeholder="85000" value={formData.monthlyIncome} onChange={(e) => setFormData({ ...formData, monthlyIncome: e.target.value })} />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-muted">Residential Address</label>
                      <textarea className="form-control" rows="2" placeholder="Full residential street address..." value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })}></textarea>
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light py-3 px-4">
                  <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setShowAddModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm">Save Customer</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Full Profile Detail Modal */}
      {selectedProfile && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-xl">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-primary text-white py-3 px-4">
                <div className="d-flex align-items-center gap-3">
                  <img
                    src={selectedProfile.profilePhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedProfile.name)}&background=fff&color=0d6efd`}
                    alt={selectedProfile.name}
                    className="rounded-circle border border-2 border-white"
                    width="50"
                    height="50"
                    style={{ objectFit: 'cover' }}
                  />
                  <div>
                    <h5 className="modal-title fw-bold mb-0">{selectedProfile.name}</h5>
                    <small className="opacity-90">Customer ID: {selectedProfile.id} • {selectedProfile.employment || 'Borrower'}</small>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedProfile(null)}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {/* Info Cards Row */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Linked Loans</small>
                      <h4 className="fw-bold text-dark mb-0">{selectedProfile.custLoans.length} Accounts</h4>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Loan Amount</small>
                      <h4 className="fw-bold text-primary mb-0">₹{selectedProfile.totalLoanAmt.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Monthly EMI</small>
                      <h4 className="fw-bold text-success mb-0">₹{selectedProfile.totalMonthlyEmi.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                  <div className="col-12 col-md-3">
                    <div className="p-3 bg-white rounded-3 border shadow-2xs">
                      <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Outstanding Balance</small>
                      <h4 className="fw-bold text-danger mb-0">₹{selectedProfile.outstandingBalance.toLocaleString('en-IN')}</h4>
                    </div>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white mb-4">
                  <h6 className="fw-bold text-dark border-bottom pb-2 mb-3">KYC & Personal Information</h6>
                  <div className="row g-3 small">
                    <div className="col-6 col-md-3"><strong>Phone:</strong> {selectedProfile.phone || '-'}</div>
                    <div className="col-6 col-md-3"><strong>Email:</strong> {selectedProfile.email || '-'}</div>
                    <div className="col-6 col-md-3"><strong>PAN / Aadhaar:</strong> <span className="font-monospace fw-bold">{selectedProfile.panAadhaar || '-'}</span></div>
                    <div className="col-6 col-md-3"><strong>DOB:</strong> {formatIndianDate(selectedProfile.dob)}</div>
                    <div className="col-6 col-md-3"><strong>Monthly Income:</strong> ₹{Number(selectedProfile.monthlyIncome || 0).toLocaleString('en-IN')}</div>
                    <div className="col-12 col-md-9"><strong>Residential Address:</strong> {selectedProfile.address || '-'}</div>
                  </div>
                </div>

                {/* Linked Loans Table */}
                <div className="card border-0 shadow-sm rounded-3 p-3 bg-white">
                  <h6 className="fw-bold text-dark mb-3">Linked EMI Loans & Payment Schedule</h6>
                  {selectedProfile.custLoans.length === 0 ? (
                    <p className="text-muted small mb-0">No active loans linked to this customer profile.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover align-middle mb-0 small">
                        <thead className="bg-light">
                          <tr>
                            <th>Loan Name</th>
                            <th>Type</th>
                            <th>Total Amount</th>
                            <th>Monthly EMI</th>
                            <th>EMI Due Date</th>

                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProfile.custLoans.map((l) => (
                            <tr key={l.id}>
                              <td>
                                <div className="fw-bold text-dark">{l.loanName}</div>
                                <small className="text-muted font-monospace" style={{ fontSize: '0.7rem' }}>{l.id}</small>
                              </td>
                              <td><span className="badge bg-light text-dark border">{l.type}</span></td>
                              <td className="fw-bold text-dark">₹{Number(l.totalAmount).toLocaleString('en-IN')}</td>
                              <td className="fw-bold text-success">₹{Number(l.emiAmount).toLocaleString('en-IN')}</td>
                              <td className="fw-semibold text-primary">{formatIndianDate(l.dueDate)}</td>
                              <td>
                                <select
                                  className="form-select form-select-sm py-0 px-2 fw-medium border rounded-2 text-dark bg-white"
                                  style={{ fontSize: '0.72rem', height: '26px', width: 'auto', minWidth: '105px', cursor: 'pointer' }}
                                  value={l.status || 'Active'}
                                  onChange={(e) => handleUpdateLoanStatus(l.id, e.target.value)}
                                  title="Change Status"
                                >
                                  <option value="Active">Active</option>
                                  <option value="Closed">Closed</option>
                                  <option value="Permanently Closed">Permanent Close</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 bg-light py-3 px-4 d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-success rounded-3 px-3 fw-bold d-flex align-items-center gap-1.5"
                  onClick={() => setCommModal({ open: true, customerId: selectedProfile.id, loanId: selectedProfile.custLoans?.[0]?.id || null, templateKey: 'loan_statement' })}
                  title="Send Statement via WhatsApp / Gmail"
                >
                  <MdSend size={16} /> Send
                </button>
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-semibold" onClick={() => setSelectedProfile(null)}>Close Profile</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Send Statement / Communication Modal */}
      {commModal.open && (
        <SendStatementModal
          isOpen={commModal.open}
          onClose={() => setCommModal({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' })}
          initialCustomerId={commModal.customerId}
          initialLoanId={commModal.loanId}
          initialTemplateKey={commModal.templateKey}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 p-4 text-center">
              <div className="text-danger mb-2">
                <MdDelete size={40} />
              </div>
              <h6 className="fw-bold text-dark">Confirm Delete Customer</h6>
              <p className="small text-muted mb-3">Deleting this customer will also remove associated loans and EMI payments!</p>
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

export default Customers;
