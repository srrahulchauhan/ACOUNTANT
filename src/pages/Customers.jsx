import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MdAdd, MdDelete, MdEdit, MdSave, MdPhone, MdEmail, MdPerson, 
  MdAccountBalance, MdClose, MdBadge, MdHome, MdWork, MdAttachMoney, 
  MdCake, MdSearch, MdPayment, MdReceipt, MdFileUpload, MdVisibility
} from 'react-icons/md';
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer, fetchTransactions } from '../api';

const LOCAL_STORAGE_LOANS_KEY = 'emi_loan_management_data';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [viewCustomer, setViewCustomer] = useState(null); // Selected customer for full profile view

  const [formData, setFormData] = useState({
    customerId: '',
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

  // Load Customers, Transactions & EMI Loans
  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, transRes] = await Promise.all([fetchCustomers(), fetchTransactions()]);
        let custData = custRes.data || [];

        // Check if local extra fields exist
        const savedCustExtra = localStorage.getItem('customers_extended_profiles');
        if (savedCustExtra) {
          const parsed = JSON.parse(savedCustExtra);
          custData = custData.map(c => {
            const extra = parsed.find(x => x._id === c._id || x.customerId === c.customerId);
            return extra ? { ...c, ...extra } : c;
          });
        }

        setCustomers(custData);
        setTransactions(transRes.data || []);

        const savedLoans = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
        if (savedLoans) {
          setLoans(JSON.parse(savedLoans));
        }
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const saveExtendedProfiles = (updatedCusts) => {
    setCustomers(updatedCusts);
    localStorage.setItem('customers_extended_profiles', JSON.stringify(updatedCusts));
  };

  // Generate unique Customer ID
  const generateCustomerId = () => {
    return 'CUST-' + Math.floor(1000 + Math.random() * 9000);
  };

  // Open Add Modal
  const handleOpenAddModal = () => {
    setEditId(null);
    setFormData({
      customerId: generateCustomerId(),
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
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cust) => {
    setEditId(cust._id || cust.id);
    setFormData({
      customerId: cust.customerId || generateCustomerId(),
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      address: cust.address || '',
      panAadhaar: cust.panAadhaar || '',
      dob: cust.dob || '',
      employment: cust.employment || '',
      monthlyIncome: cust.monthlyIncome || '',
      profilePhoto: cust.profilePhoto || ''
    });
    setShowModal(true);
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePhoto: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Handler
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter customer name!');
      return;
    }

    try {
      if (editId) {
        // Edit Customer
        await updateCustomer(editId, formData);
        const updated = customers.map(c => (c._id === editId || c.id === editId) ? { ...c, ...formData } : c);
        saveExtendedProfiles(updated);
      } else {
        // Create Customer
        const res = await createCustomer(formData);
        const newCust = { ...res.data, ...formData };
        saveExtendedProfiles([...customers, newCust]);
      }

      setShowModal(false);
      setEditId(null);
    } catch (err) {
      alert('Error saving customer: ' + err.message);
    }
  };

  // Delete Customer
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer profile?')) return;
    try {
      await deleteCustomer(id);
      const updated = customers.filter(c => c._id !== id && c.id !== id);
      saveExtendedProfiles(updated);
      if (viewCustomer && (viewCustomer._id === id || viewCustomer.id === id)) {
        setViewCustomer(null);
      }
    } catch (err) { alert('Error: ' + err.message); }
  };

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const s = searchTerm.toLowerCase();
      return !s || 
        c.name?.toLowerCase().includes(s) || 
        c.phone?.toLowerCase().includes(s) || 
        c.email?.toLowerCase().includes(s) ||
        c.customerId?.toLowerCase().includes(s) ||
        c.panAadhaar?.toLowerCase().includes(s);
    });
  }, [customers, searchTerm]);

  // Linked Loans for Customer
  const getCustomerLoans = (custName) => {
    if (!custName) return [];
    const cName = custName.trim().toLowerCase();
    return loans.filter(l => (l.borrowerName || '').trim().toLowerCase().includes(cName) || cName.includes((l.borrowerName || '').trim().toLowerCase()));
  };

  // Calculate customer financial metrics
  const getCustomerMetrics = (custName) => {
    const custLoans = getCustomerLoans(custName);
    const totalLoanAmount = custLoans.reduce((sum, l) => sum + Number(l.totalAmount || 0), 0);
    const totalMonthlyEmi = custLoans.reduce((sum, l) => sum + Number(l.emiAmount || 0), 0);

    const outstandingBalance = custLoans.reduce((sum, l) => {
      const remainingRatio = Math.max(0, (l.tenureMonths - l.paidEmis) / l.tenureMonths);
      return sum + Math.round((l.totalAmount || 0) * remainingRatio);
    }, 0);

    const upcomingDue = custLoans
      .filter(l => l.status === 'Active')
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]?.dueDate || null;

    return { custLoans, totalLoanAmount, totalMonthlyEmi, outstandingBalance, upcomingDue };
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
            <MdPerson size={30} style={{ color: '#0284c7' }} /> 
            Customer Management Registry
          </h3>
          <p className="text-muted small mb-0">{customers.length} registered profiles with linked loans & financial profiles</p>
        </div>

        <div className="d-flex align-items-center gap-2">
          <div className="input-group input-group-sm shadow-sm" style={{ width: '240px' }}>
            <span className="input-group-text bg-white border-end-0"><MdSearch size={16} /></span>
            <input 
              type="text" 
              className="form-control border-start-0 ps-0" 
              placeholder="Search customer, phone, ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <button 
            className="btn text-white px-4 py-2 fw-bold shadow-sm d-flex align-items-center gap-2 rounded-pill"
            style={{ background: 'linear-gradient(135deg, #0284c7 0%, #10b981 100%)', border: 'none' }}
            onClick={handleOpenAddModal}
          >
            <MdAdd size={22} /> Add Customer
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      {loading ? (
        <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-5 card modern-card">
          <MdPerson size={64} className="text-muted opacity-25 mx-auto mb-3" />
          <h5 className="text-muted">No customers found</h5>
          <p className="text-muted small">Click "+ Add Customer" to register a new customer profile</p>
        </div>
      ) : (
        <div className="row g-3 g-lg-4">
          {filteredCustomers.map((c) => {
            const metrics = getCustomerMetrics(c.name);
            return (
              <div key={c._id || c.id} className="col-12 col-md-6 col-xl-4">
                <div className="card modern-card p-4 h-100 border-0 shadow-sm animate-fadeIn">
                  
                  {/* Customer Card Header */}
                  <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      {c.profilePhoto ? (
                        <img 
                          src={c.profilePhoto} 
                          alt={c.name} 
                          className="rounded-circle border border-2 border-primary shadow-sm"
                          style={{ width: 52, height: 52, objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div 
                          className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center fw-bold"
                          style={{ width: 52, height: 52, fontSize: '1.3rem', flexShrink: 0 }}
                        >
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <h6 className="fw-bold mb-0 text-dark">{c.name}</h6>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary font-monospace" style={{ fontSize: '0.65rem' }}>
                            {c.customerId || 'CUST-ID'}
                          </span>
                        </div>
                        <small className="text-muted d-block mt-1">
                          {c.phone ? <><MdPhone size={12} className="me-1" />{c.phone}</> : 'No Phone'}
                        </small>
                        <small className="text-muted d-block">
                          {c.email ? <><MdEmail size={12} className="me-1" />{c.email}</> : ''}
                        </small>
                      </div>
                    </div>

                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-primary btn-sm rounded-circle p-1"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleOpenEditModal(c)}
                        title="Edit Customer Profile"
                      >
                        <MdEdit size={14} />
                      </button>
                      <button 
                        className="btn btn-outline-danger btn-sm rounded-circle p-1"
                        style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => handleDelete(c._id || c.id)}
                        title="Delete Customer"
                      >
                        <MdDelete size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Employment & Income Quick Details */}
                  {(c.employment || c.monthlyIncome) && (
                    <div className="bg-light p-2 px-3 rounded-3 mb-3 small d-flex justify-content-between">
                      <span className="text-muted"><MdWork size={14} className="me-1" />{c.employment || 'N/A'}</span>
                      <span className="fw-bold text-success">₹{Number(c.monthlyIncome || 0).toLocaleString('en-IN')}/mo</span>
                    </div>
                  )}

                  {/* Financial & Linked Loans Summary */}
                  <div className="bg-light bg-opacity-50 p-3 rounded-3 mb-3 border">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Linked EMI Loans:</span>
                      <span className="badge bg-primary bg-opacity-10 text-primary fw-bold">{metrics.custLoans.length} Loans</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Total Loan Amount:</span>
                      <span className="fw-bold text-dark">₹{metrics.totalLoanAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="small text-muted">Outstanding Balance:</span>
                      <span className="fw-bold text-danger">₹{metrics.outstandingBalance.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span className="small text-muted">Monthly EMI:</span>
                      <span className="fw-bold text-success">₹{metrics.totalMonthlyEmi.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="d-flex gap-2 mt-auto">
                    <button 
                      className="btn btn-outline-primary btn-sm flex-grow-1 rounded-pill fw-semibold"
                      onClick={() => setViewCustomer(c)}
                    >
                      <MdVisibility size={16} /> View Profile & Loans
                    </button>
                    <button 
                      className="btn btn-primary btn-sm rounded-pill px-3 fw-bold"
                      onClick={() => navigate('/emi-dashboard')}
                      title="Manage Loans in EMI Dashboard"
                    >
                      + Create Loan
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Customer Profile Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdPerson className="text-primary" />
                  {editId ? 'Edit Customer Profile' : 'Add New Customer Profile'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>

              <form onSubmit={handleSubmitForm}>
                <div className="modal-body py-3">
                  <div className="row g-3">
                    
                    {/* Profile Photo Upload */}
                    <div className="col-12 text-center mb-2">
                      <div className="d-inline-block position-relative">
                        {formData.profilePhoto ? (
                          <img 
                            src={formData.profilePhoto} 
                            alt="Profile" 
                            className="rounded-circle border border-3 border-primary shadow-sm"
                            style={{ width: 80, height: 80, objectFit: 'cover' }}
                          />
                        ) : (
                          <div 
                            className="rounded-circle bg-light border d-flex align-items-center justify-content-center mx-auto text-muted"
                            style={{ width: 80, height: 80, fontSize: '2rem' }}
                          >
                            <MdPerson />
                          </div>
                        )}
                        <label 
                          htmlFor="photoUploadInput" 
                          className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1 shadow-sm"
                          style={{ width: 28, height: 28, cursor: 'pointer' }}
                          title="Upload Profile Photo"
                        >
                          <MdFileUpload size={16} />
                        </label>
                        <input 
                          id="photoUploadInput"
                          type="file" 
                          accept="image/*" 
                          className="d-none" 
                          onChange={handlePhotoUpload}
                        />
                      </div>
                      <small className="d-block text-muted mt-1">Upload Customer Photo</small>
                    </div>

                    {/* Customer ID & Name */}
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Customer ID</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace fw-bold bg-light" 
                        value={formData.customerId} 
                        readOnly 
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Rahul Chauhan" 
                        value={formData.name} 
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required 
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Mobile Number</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="9876543210" 
                        value={formData.phone} 
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    {/* Email & PAN/Aadhaar */}
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">Email Address</label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="rahul@example.com" 
                        value={formData.email} 
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label text-muted fw-semibold small mb-1">PAN / Aadhaar Number</label>
                      <input 
                        type="text" 
                        className="form-control font-monospace" 
                        placeholder="ABCDE1234F / 1234-5678-9012" 
                        value={formData.panAadhaar} 
                        onChange={e => setFormData({ ...formData, panAadhaar: e.target.value })}
                      />
                    </div>

                    {/* Date of Birth & Monthly Income */}
                    <div className="col-6 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        className="form-control" 
                        value={formData.dob} 
                        onChange={e => setFormData({ ...formData, dob: e.target.value })}
                      />
                    </div>
                    <div className="col-6 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Employment / Business</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="e.g. Software Engineer" 
                        value={formData.employment} 
                        onChange={e => setFormData({ ...formData, employment: e.target.value })}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label text-muted fw-semibold small mb-1">Monthly Income (₹)</label>
                      <input 
                        type="number" 
                        className="form-control fw-bold text-success" 
                        placeholder="85000" 
                        value={formData.monthlyIncome} 
                        onChange={e => setFormData({ ...formData, monthlyIncome: e.target.value })}
                      />
                    </div>

                    {/* Home Address */}
                    <div className="col-12">
                      <label className="form-label text-muted fw-semibold small mb-1">Home Address</label>
                      <textarea 
                        className="form-control" 
                        rows="2" 
                        placeholder="Complete residential address..."
                        value={formData.address} 
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
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
                    {editId ? 'Update Customer' : 'Save Customer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Customer Full Profile Drawer / Modal View */}
      {viewCustomer && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-primary text-white p-4">
                <div className="d-flex align-items-center gap-3">
                  {viewCustomer.profilePhoto ? (
                    <img src={viewCustomer.profilePhoto} alt={viewCustomer.name} className="rounded-circle border border-2 border-white shadow-sm" style={{ width: 60, height: 60, objectFit: 'cover' }} />
                  ) : (
                    <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 60, height: 60, fontSize: '1.5rem' }}>
                      {viewCustomer.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4 className="fw-bold mb-0 text-white">{viewCustomer.name}</h4>
                    <span className="badge bg-white bg-opacity-20 text-white font-monospace">{viewCustomer.customerId || 'CUST-ID'}</span>
                  </div>
                </div>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewCustomer(null)}></button>
              </div>

              <div className="modal-body p-4">
                {/* Profile Overview Grid */}
                <div className="row g-3 mb-4">
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Phone Number</small>
                    <span className="fw-bold text-dark">{viewCustomer.phone || 'N/A'}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Email Address</small>
                    <span className="fw-bold text-dark text-truncate d-block">{viewCustomer.email || 'N/A'}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">PAN / Aadhaar</small>
                    <span className="fw-bold text-dark font-monospace">{viewCustomer.panAadhaar || 'N/A'}</span>
                  </div>
                  <div className="col-6 col-md-3">
                    <small className="text-muted d-block">Monthly Income</small>
                    <span className="fw-bold text-success">₹{Number(viewCustomer.monthlyIncome || 0).toLocaleString('en-IN')}/mo</span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="text-muted d-block">Employment / Business</small>
                    <span className="fw-semibold text-dark">{viewCustomer.employment || 'N/A'}</span>
                  </div>
                  <div className="col-12 col-md-6">
                    <small className="text-muted d-block">Home Address</small>
                    <span className="fw-semibold text-dark">{viewCustomer.address || 'N/A'}</span>
                  </div>
                </div>

                {/* Linked Loans Section */}
                <h6 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                  <MdPayment className="text-primary" /> Linked EMI Loans & History
                </h6>

                {getCustomerLoans(viewCustomer.name).length === 0 ? (
                  <p className="text-muted small py-3 text-center bg-light rounded-3">No active EMI loans linked to this customer profile.</p>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-sm table-hover align-middle mb-0">
                      <thead className="bg-light">
                        <tr className="text-muted small">
                          <th>Loan Name</th>
                          <th>Type</th>
                          <th>Total Loan</th>
                          <th>EMI Amount</th>
                          <th>Next Due</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {getCustomerLoans(viewCustomer.name).map(l => (
                          <tr key={l.id}>
                            <td className="fw-bold">{l.loanName}</td>
                            <td><span className="badge bg-info bg-opacity-10 text-info">{l.type}</span></td>
                            <td className="fw-bold text-dark">₹{Number(l.totalAmount).toLocaleString('en-IN')}</td>
                            <td className="fw-bold text-success">₹{Number(l.emiAmount).toLocaleString('en-IN')}</td>
                            <td className="small text-muted">{l.dueDate}</td>
                            <td><span className={`badge ${l.status === 'Completed' ? 'bg-success' : 'bg-warning text-dark'}`}>{l.status || 'Active'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0">
                <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setViewCustomer(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Customers;
