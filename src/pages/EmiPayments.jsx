import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MdSearch, MdPayment, MdCheckCircle, MdWarning, MdHourglassEmpty, 
  MdDelete, MdAddCircle, MdNotifications
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { getLocalDateString, formatIndianDate } from '../utils/dateUtils';

const EmiPayments = () => {
  const location = useLocation();

  const [payments, setPayments] = useState([]);
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(location.state?.status || '');
  const [methodFilter, setMethodFilter] = useState('');

  // Mark Paid Modal state
  const [markingPayment, setMarkingPayment] = useState(null);
  const [paidDetails, setPaidDetails] = useState({
    paidDate: getLocalDateString(),
    paymentMethod: 'UPI',
    lateFee: 0,
    notes: 'Payment received',
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadData = () => {
    setPayments(loanStore.getPayments());
    setLoans(loanStore.getLoans());
    setCustomers(loanStore.getCustomers());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  const openMarkPaidModal = (pay) => {
    setMarkingPayment(pay);
    setPaidDetails({
      paidDate: getLocalDateString(),
      paymentMethod: pay.paymentMethod || 'UPI',
      lateFee: pay.lateFee || 0,
      notes: pay.notes || 'Marked as paid',
    });
  };

  const handleConfirmPaid = (e) => {
    e.preventDefault();
    if (!markingPayment) return;

    loanStore.markPaymentAsPaid(markingPayment.id, paidDetails);
    alert(`✓ Payment of ₹${Number(markingPayment.amount).toLocaleString('en-IN')} marked as PAID!`);
    setMarkingPayment(null);
  };

  const handleDeletePayment = (id) => {
    loanStore.deletePayment(id);
    setDeleteConfirmId(null);
    alert('✓ Payment record removed.');
  };

  // Filter payments and sort nearest-to-farthest by dueDate
  const filteredPayments = payments
    .filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.customerName.toLowerCase().includes(q) ||
        p.loanName.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);

      const matchesStatus = !statusFilter || p.status === statusFilter;
      const matchesMethod = !methodFilter || p.paymentMethod === methodFilter;

      return matchesSearch && matchesStatus && matchesMethod;
    })
    .sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0));


  const todayStr = getLocalDateString();
  const overdueCount = payments.filter((p) => p.status === 'Overdue' || (p.status !== 'Paid' && p.dueDate && p.dueDate < todayStr)).length;
  const upcomingCount = payments.filter((p) => p.status === 'Upcoming' || p.status === 'Pending').length;
  const paidCount = payments.filter((p) => p.status === 'Paid').length;

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">EMI Payments Ledger & Collections</h4>
          <p className="text-muted small mb-0">Record installment payments, issue late fee rules, and review complete payment history</p>
        </div>
      </div>

      {/* Alert Banner for Overdue / Upcoming */}
      {(overdueCount > 0 || upcomingCount > 0) && (
        <div className="row g-3 mb-4">
          {overdueCount > 0 && (
            <div className="col-12 col-md-6">
              <div className="alert bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-4 p-3 d-flex align-items-center gap-3 mb-0 shadow-2xs">
                <div className="bg-danger text-white rounded-circle p-2">
                  <MdWarning size={20} />
                </div>
                <div>
                  <h6 className="fw-bold text-danger mb-0">{overdueCount} Overdue EMI Installments Alert</h6>
                  <small className="text-muted">Overdue fees apply. Click filter to review overdue accounts.</small>
                </div>
              </div>
            </div>
          )}

          {upcomingCount > 0 && (
            <div className="col-12 col-md-6">
              <div className="alert bg-warning bg-opacity-10 border border-warning border-opacity-20 rounded-4 p-3 d-flex align-items-center gap-3 mb-0 shadow-2xs">
                <div className="bg-warning text-dark rounded-circle p-2">
                  <MdNotifications size={20} />
                </div>
                <div>
                  <h6 className="fw-bold text-dark mb-0">{upcomingCount} Upcoming EMI Payments Scheduled</h6>
                  <small className="text-muted">Pending collections due in the upcoming installment period.</small>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status Summary Pill Cards */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div 
            className={`p-3 rounded-4 shadow-2xs text-center cursor-pointer transition-all hover-lift ${
              statusFilter === 'Paid' ? 'border border-2 border-success bg-success bg-opacity-10 shadow-sm' : 'bg-white border'
            }`} 
            onClick={() => setStatusFilter(statusFilter === 'Paid' ? 'All' : 'Paid')}
            title="Click to filter Paid installments"
            style={{ cursor: 'pointer' }}
          >
            <small className="text-muted d-block font-monospace text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Paid Installments</small>
            <h4 className="fw-bold text-success mb-0">{paidCount}</h4>
            {statusFilter === 'Paid' && <small className="badge bg-success mt-1" style={{ fontSize: '0.6rem' }}>Filtered</small>}
          </div>
        </div>

        <div className="col-4">
          <div 
            className={`p-3 rounded-4 shadow-2xs text-center cursor-pointer transition-all hover-lift ${
              statusFilter === 'Upcoming' ? 'border border-2 border-warning bg-warning bg-opacity-10 shadow-sm' : 'bg-white border'
            }`} 
            onClick={() => setStatusFilter(statusFilter === 'Upcoming' ? 'All' : 'Upcoming')}
            title="Click to filter Upcoming dues"
            style={{ cursor: 'pointer' }}
          >
            <small className="text-muted d-block font-monospace text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Upcoming Dues</small>
            <h4 className="fw-bold text-warning mb-0">{upcomingCount}</h4>
            {statusFilter === 'Upcoming' && <small className="badge bg-warning text-dark mt-1" style={{ fontSize: '0.6rem' }}>Filtered</small>}
          </div>
        </div>

        <div className="col-4">
          <div 
            className={`p-3 rounded-4 shadow-2xs text-center cursor-pointer transition-all hover-lift ${
              statusFilter === 'Overdue' ? 'border border-2 border-danger bg-danger bg-opacity-10 shadow-sm' : 'bg-white border'
            }`} 
            onClick={() => setStatusFilter(statusFilter === 'Overdue' ? 'All' : 'Overdue')}
            title="Click to filter Overdue accounts"
            style={{ cursor: 'pointer' }}
          >
            <small className="text-muted d-block font-monospace text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Overdue Accounts</small>
            <h4 className="fw-bold text-danger mb-0">{overdueCount}</h4>
            {statusFilter === 'Overdue' && <small className="badge bg-danger mt-1" style={{ fontSize: '0.6rem' }}>Filtered</small>}
          </div>
        </div>
      </div>


      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-5">
            <div className="input-group bg-light rounded-3 border">
              <span className="input-group-text bg-transparent border-0 pe-1">
                <MdSearch size={20} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 box-shadow-none"
                placeholder="Search by customer name, loan title, payment ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select bg-light border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">-- All Payment Statuses --</option>
              <option value="Paid">Paid</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Pending">Pending</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="col-6 col-md-4">
            <select className="form-select bg-light border" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="">-- All Payment Methods --</option>
              <option value="UPI">UPI / PhonePe</option>
              <option value="Net Banking">Net Banking</option>
              <option value="Cash">Cash</option>
              <option value="Card">Debit/Credit Card</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>
      </div>

      {/* EMI Ledger Table */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">EMI Transactions History Ledger</h5>
          <small className="text-muted">Showing {filteredPayments.length} of {payments.length} records</small>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="bg-light text-muted small">
              <tr>
                <th className="py-2.5">Customer Name</th>
                <th>Loan Contract</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>EMI Amount</th>
                <th>Late Fee</th>
                <th>Method</th>
                <th className="text-center">Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-5 text-muted">
                    No EMI payment records found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((pay) => (
                  <tr key={pay.id}>
                    <td className="fw-bold text-dark">{pay.customerName}</td>
                    <td className="text-secondary small">{pay.loanName}</td>
                    <td className={`fw-semibold small ${
                      pay.status === 'Paid' ? 'text-success' :
                      pay.status === 'Overdue' ? 'text-danger' : 'text-warning'
                    }`}>
                      {formatIndianDate(pay.dueDate)}
                    </td>
                    <td className="text-muted small">{pay.paidDate ? formatIndianDate(pay.paidDate) : '-'}</td>

                    <td className="fw-bold text-success">₹{Number(pay.amount).toLocaleString('en-IN')}</td>
                    <td className="text-danger small">{pay.lateFee ? `+₹${pay.lateFee}` : '-'}</td>
                    <td>
                      <span className="badge bg-light text-dark border px-2.5 py-1">{pay.paymentMethod || 'UPI'}</span>
                    </td>
                    <td className="text-center">
                      <span className={`badge rounded-pill px-3 py-1.5 ${
                        pay.status === 'Paid' ? 'bg-success bg-opacity-10 text-success' :
                        pay.status === 'Overdue' ? 'bg-danger bg-opacity-10 text-danger' :
                        pay.status === 'Upcoming' ? 'bg-warning bg-opacity-10 text-dark' :
                        'bg-secondary bg-opacity-10 text-secondary'
                      }`}>
                        {pay.status}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-1.5">
                        {pay.status !== 'Paid' && (
                          <button
                            className="btn btn-sm btn-success rounded-pill px-3 py-1 fw-bold shadow-2xs"
                            onClick={() => openMarkPaidModal(pay)}
                          >
                            Mark Paid
                          </button>
                        )}
                        <button
                          className="btn btn-sm btn-light text-danger rounded-circle p-1.5 border"
                          title="Delete Payment Record"
                          onClick={() => setDeleteConfirmId(pay.id)}
                        >
                          <MdDelete size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Paid Modal */}
      {markingPayment && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-light py-3 px-4">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdCheckCircle className="text-success" /> Confirm EMI Payment Collection
                </h5>
                <button type="button" className="btn-close" onClick={() => setMarkingPayment(null)}></button>
              </div>

              <form onSubmit={handleConfirmPaid}>
                <div className="modal-body p-4">
                  <div className="p-3 bg-light rounded-3 border mb-3">
                    <div className="fw-bold text-dark">{markingPayment.customerName}</div>
                    <div className="small text-muted">{markingPayment.loanName} • Due: {markingPayment.dueDate}</div>
                    <div className="mt-2 fw-bold text-success fs-5">₹{Number(markingPayment.amount).toLocaleString('en-IN')}</div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Payment Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={paidDetails.paidDate}
                        onChange={(e) => setPaidDetails({ ...paidDetails, paidDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-muted">Payment Method *</label>
                      <select
                        className="form-select fw-semibold"
                        value={paidDetails.paymentMethod}
                        onChange={(e) => setPaidDetails({ ...paidDetails, paymentMethod: e.target.value })}
                      >
                        <option value="UPI">UPI / PhonePe</option>
                        <option value="Net Banking">Net Banking</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Debit / Credit Card</option>
                        <option value="Cheque">Cheque</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-muted">Late Penalty Fee (₹)</label>
                    <input
                      type="number"
                      className="form-control text-danger fw-semibold"
                      value={paidDetails.lateFee}
                      onChange={(e) => setPaidDetails({ ...paidDetails, lateFee: e.target.value })}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label small fw-semibold text-muted">Payment Notes / Reference</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Transaction reference, bank UTR, or Cheque No."
                      value={paidDetails.notes}
                      onChange={(e) => setPaidDetails({ ...paidDetails, notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 bg-light py-3 px-4">
                  <button type="button" className="btn btn-light border rounded-3 px-4 fw-semibold" onClick={() => setMarkingPayment(null)}>Cancel</button>
                  <button type="submit" className="btn btn-success rounded-3 px-4 fw-bold shadow-sm">
                    ✓ Confirm Payment
                  </button>
                </div>
              </form>
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
              <h6 className="fw-bold text-dark">Confirm Delete Record</h6>
              <p className="small text-muted mb-3">Are you sure you want to delete this EMI payment record?</p>
              <div className="d-flex gap-2 justify-content-center">
                <button className="btn btn-light border btn-sm rounded-3 px-3 fw-semibold" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                <button className="btn btn-danger btn-sm rounded-3 px-3 fw-bold" onClick={() => handleDeletePayment(deleteConfirmId)}>Yes, Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmiPayments;
