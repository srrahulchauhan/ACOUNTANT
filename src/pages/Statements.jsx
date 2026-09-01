import React, { useState, useEffect, useRef } from 'react';
import { 
  MdPrint, MdPictureAsPdf, MdFileUpload, MdFilterList, 
  MdReceiptLong, MdSearch, MdBusiness, MdSend, MdViewList, MdViewModule
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { getLocalDateString, formatIndianDate } from '../utils/dateUtils';
import SendStatementModal from '../components/SendStatementModal';

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const Statements = () => {
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({});

  // Filters State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedLoanId, setSelectedLoanId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [commModal, setCommModal] = useState({ open: false, customerId: null, loanId: null, templateKey: 'loan_statement' });

  const statementPrintRef = useRef(null);

  const loadData = () => {
    const custs = loanStore.getCustomers();
    const lns = loanStore.getLoans();
    setCustomers(custs);
    setLoans(lns);
    setPayments(loanStore.getPayments());
    setSettings(loanStore.getSettings());

    if (custs.length > 0 && !selectedCustomerId) {
      setSelectedCustomerId(custs[0].id);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  // Filter loans for selected customer
  const customerLoans = loans.filter((l) => l.customerId === selectedCustomerId);
  const activeLoan = selectedLoanId ? loans.find((l) => l.id === selectedLoanId) : customerLoans[0] || loans[0];
  const activeCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0] || {};

  // Filter statement payments
  const statementPayments = payments.filter((p) => {
    let matchesCustomer = !selectedCustomerId || p.customerId === selectedCustomerId;
    let matchesLoan = !selectedLoanId || p.loanId === selectedLoanId;
    let matchesStatus = !statusFilter || p.status === statusFilter;
    let matchesDate = true;
    if (startDate && p.dueDate && p.dueDate < startDate) matchesDate = false;
    if (endDate && p.dueDate && p.dueDate > endDate) matchesDate = false;

    return matchesCustomer && matchesLoan && matchesStatus && matchesDate;
  });

  // Calculate Metrics for Active Statement
  const totalLoanAmount = activeLoan ? Number(activeLoan.totalAmount) : 0;
  const paidPayments = statementPayments.filter((p) => p.status === 'Paid');
  const totalPaidAmount = paidPayments.reduce((s, p) => s + Number(p.amount || 0), 0);
  const outstandingBalance = Math.max(0, totalLoanAmount - totalPaidAmount);

  const totalPaidEmis = paidPayments.length;
  const tenureMonths = activeLoan ? Number(activeLoan.tenureMonths) : 12;
  const remainingEmis = Math.max(0, tenureMonths - totalPaidEmis);

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // Export PDF using jsPDF
  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Header Company Letterhead
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(13, 110, 253);
    doc.text(settings.companyName || 'R Accountant', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(`Managed by: ${settings.ownerName || 'Rahul Chauhan'} • ${settings.companyTagline || 'Smart Loan, EMI & Account Management'}`, 14, 26);
    doc.text(`Email: ${settings.email || 'rahul@raccountant.com'} | Phone: ${settings.phone || '+91 98765 43210'} | GST: ${settings.gstNumber || 'N/A'}`, 14, 31);

    doc.setLineWidth(0.5);
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);

    // Customer & Loan Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('STATEMENT OF ACCOUNT', 14, 43);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Customer Name: ${activeCustomer.name || 'N/A'}`, 14, 50);
    doc.text(`Customer ID: ${activeCustomer.id || 'N/A'}`, 14, 55);
    doc.text(`Mobile: ${activeCustomer.phone || 'N/A'}`, 14, 60);

    doc.text(`Loan Account: ${activeLoan?.loanName || 'N/A'}`, 120, 50);
    doc.text(`Total Amount: Rs. ${totalLoanAmount.toLocaleString('en-IN')}`, 120, 55);
    doc.text(`Outstanding: Rs. ${outstandingBalance.toLocaleString('en-IN')}`, 120, 60);

    // Payment History Table
    const tableRows = statementPayments.map((p, idx) => [
      idx + 1,
      p.dueDate || '-',
      p.paidDate || '-',
      `Rs. ${Number(p.amount).toLocaleString('en-IN')}`,
      p.paymentMethod || 'UPI',
      p.status,
    ]);

    doc.autoTable({
      startY: 68,
      head: [['#', 'Due Date', 'Paid Date', 'EMI Amount', 'Method', 'Status']],
      body: tableRows,
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253] },
    });

    doc.save(`Statement_${activeCustomer.name || 'Account'}_${getLocalDateString()}.pdf`);
  };

  // Export Excel using XLSX
  const handleExportExcel = () => {
    const data = statementPayments.map((p, idx) => ({
      'S.No': idx + 1,
      'Customer ID': activeCustomer.id,
      'Customer Name': activeCustomer.name,
      'Loan Name': activeLoan?.loanName || p.loanName,
      'Due Date': p.dueDate,
      'Paid Date': p.paidDate || '-',
      'EMI Amount (₹)': Number(p.amount),
      'Payment Method': p.paymentMethod || 'UPI',
      Status: p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Statement');
    XLSX.writeFile(workbook, `Loan_Statement_${activeCustomer.name || 'Customer'}.xlsx`);
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 print-hide">
        <div>
          <h4 className="fw-bold text-dark mb-1">Customer & Loan Account Statements</h4>
          <p className="text-muted small mb-0">Generate, print, and export itemized financial statements & loan balance summaries</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button
            className="btn btn-primary rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm"
            onClick={() => setCommModal({ open: true, customerId: activeCustomer.id || null, loanId: activeLoan?.id || null, templateKey: 'loan_statement' })}
            title="Send WhatsApp / Gmail Statement"
          >
            <MdSend size={18} /> Send
          </button>
          <button className="btn btn-outline-secondary rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={handlePrint}>
            <MdPrint size={18} /> Print
          </button>
          <button className="btn btn-outline-danger rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={handleExportPDF}>
            <MdPictureAsPdf size={18} /> PDF
          </button>
          <button className="btn btn-outline-success rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={handleExportExcel}>
            <MdFileUpload size={18} /> Excel
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4 print-hide">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Select Customer Profile *</label>
            <select className="form-select fw-bold" value={selectedCustomerId} onChange={(e) => setSelectedCustomerId(e.target.value)}>
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="col-12 col-md-4">
            <label className="form-label small fw-semibold text-muted">Filter by Loan Account</label>
            <select className="form-select fw-semibold" value={selectedLoanId} onChange={(e) => setSelectedLoanId(e.target.value)}>
              <option value="">-- All Customer Loans --</option>
              {customerLoans.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.loanName} (₹{Number(l.totalAmount).toLocaleString('en-IN')})
                </option>
              ))}
            </select>
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold text-muted">From Date</label>
            <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>

          <div className="col-6 col-md-2">
            <label className="form-label small fw-semibold text-muted">To Date</label>
            <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Professional Statement Letterhead Layout Document */}
      <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white" ref={statementPrintRef} id="printable-statement">
        
        {/* Letterhead Header */}
        <div className="d-flex justify-content-between align-items-start border-bottom pb-4 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              {settings.companyLogo ? (
                <img src={settings.companyLogo} alt="Logo" className="rounded-3 border p-1 shadow-2xs" style={{ width: 45, height: 45, objectFit: 'contain' }} />
              ) : (
                <div className="bg-primary text-white rounded-3 p-2 fw-bold" style={{ fontSize: '1.2rem' }}>
                  RA
                </div>
              )}
              <div>
                <h4 className="fw-bold text-primary mb-0">{settings.companyName || 'R Accountant'}</h4>
                <small className="text-dark fw-semibold">Managed by: {settings.ownerName || 'Rahul Chauhan'}</small>
              </div>
            </div>
            <small className="text-muted d-block">{settings.companyTagline || 'Smart Loan, EMI & Account Management'}</small>
            {settings.address && <small className="text-muted d-block">{settings.address}</small>}
            <small className="text-muted d-block">
              {settings.phone && `Phone: ${settings.phone} • `}
              {settings.email && `Email: ${settings.email} • `}
              {settings.gstNumber && `GST: ${settings.gstNumber}`}
            </small>
          </div>
          <div className="text-end">
            <h5 className="fw-bold text-dark mb-1">STATEMENT OF ACCOUNT</h5>
            <small className="text-muted d-block">Date: {getLocalDateString()}</small>
            <small className="text-primary font-monospace fw-bold">REF: STMT-{Math.floor(100000 + Math.random() * 900000)}</small>
          </div>
        </div>

        {/* Customer & Loan Profile Summary Cards */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6">
            <div className="p-3 bg-light rounded-3 border h-100">
              <h6 className="fw-bold text-primary border-bottom pb-2 mb-2">BORROWER DETAILS</h6>
              <div className="small text-dark">
                <div><strong>Customer Name:</strong> {activeCustomer.name || 'Select Customer'}</div>
                <div><strong>Customer ID:</strong> {activeCustomer.id || '-'}</div>
                <div><strong>Mobile Phone:</strong> {activeCustomer.phone || '-'}</div>
                <div><strong>PAN / Aadhaar:</strong> {activeCustomer.panAadhaar || '-'}</div>
                <div><strong>Address:</strong> {activeCustomer.address || '-'}</div>
              </div>
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="p-3 bg-light rounded-3 border h-100">
              <h6 className="fw-bold text-success border-bottom pb-2 mb-2">LOAN ACCOUNT SUMMARY</h6>
              <div className="small text-dark">
                <div><strong>Loan Title:</strong> {activeLoan?.loanName || 'General Account'}</div>
                <div><strong>Loan Type:</strong> {activeLoan?.type || '-'}</div>
                <div><strong>Tenure:</strong> {activeLoan?.tenureMonths || 12} Months</div>
                <div><strong>Monthly EMI:</strong> ₹{Number(activeLoan?.emiAmount || 0).toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Metrics Summary Banner */}
        <div className="row g-3 text-center mb-4">
          <div className="col-3">
            <div className="p-3 bg-primary bg-opacity-10 rounded-3 border border-primary border-opacity-20">
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Loan Amount</small>
              <h5 className="fw-bold text-primary mb-0">₹{totalLoanAmount.toLocaleString('en-IN')}</h5>
            </div>
          </div>
          <div className="col-3">
            <div className="p-3 bg-success bg-opacity-10 rounded-3 border border-success border-opacity-20">
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Total Paid Amount</small>
              <h5 className="fw-bold text-success mb-0">₹{totalPaidAmount.toLocaleString('en-IN')}</h5>
            </div>
          </div>
          <div className="col-3">
            <div className="p-3 bg-danger bg-opacity-10 rounded-3 border border-danger border-opacity-20">
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Outstanding Balance</small>
              <h5 className="fw-bold text-danger mb-0">₹{outstandingBalance.toLocaleString('en-IN')}</h5>
            </div>
          </div>
          <div className="col-3">
            <div className="p-3 bg-warning bg-opacity-10 rounded-3 border border-warning border-opacity-20">
              <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: '0.65rem' }}>Paid / Remaining EMIs</small>
              <h5 className="fw-bold text-dark mb-0">{totalPaidEmis} / {remainingEmis}</h5>
            </div>
          </div>
        </div>

        {/* Itemized Payment Schedule */}
        <h6 className="fw-bold text-dark mb-3">Itemized EMI Payment &amp; Collection Ledger</h6>
        <div className="table-responsive mb-4">
          <table className="table table-bordered align-middle mb-0 small">
            <thead className="bg-light text-muted">
              <tr>
                <th className="text-center" style={{ width: '40px' }}>#</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>EMI Amount</th>
                <th>Payment Method</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {statementPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No payment records match the selected statement filters.
                  </td>
                </tr>
              ) : (
                statementPayments.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="text-center fw-bold">{idx + 1}</td>
                    <td className="fw-semibold text-dark">{formatIndianDate(p.dueDate)}</td>
                    <td className="text-muted">{p.paidDate ? formatIndianDate(p.paidDate) : '-'}</td>

                    <td className="fw-bold text-dark">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td>{p.paymentMethod || 'UPI'}</td>
                    <td className="text-center">
                      <span className={`badge rounded-pill ${
                        p.status === 'Paid' ? 'bg-success text-white' :
                        p.status === 'Overdue' ? 'bg-danger text-white' :
                        'bg-warning text-dark'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Statement Footer */}
        <div className="border-top pt-3 text-muted small d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>{settings.invoiceFooterMessage || 'This is a computer-generated account statement and does not require a physical signature.'}</span>
          <span className="fw-bold text-dark">© 2026 {settings.companyName || 'R Accountant'}. Managed by {settings.ownerName || 'Rahul Chauhan'}.</span>
        </div>
      </div>

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
    </div>
  );
};

export default Statements;
