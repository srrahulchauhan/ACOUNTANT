import React, { useState, useEffect } from 'react';
import { 
  MdBarChart, MdPrint, MdPictureAsPdf, MdFileUpload, 
  MdSearch, MdAttachMoney, MdAccountBalance, MdPeople, MdWarning, MdShowChart,
  MdViewList, MdViewModule
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const LOAN_TYPES = ['Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card'];

const Reports = () => {
  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState({});

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadData = () => {
    setCustomers(loanStore.getCustomers());
    setLoans(loanStore.getLoans());
    setPayments(loanStore.getPayments());
    setSettings(loanStore.getSettings());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  // Filtered Payments List
  const filteredPayments = payments.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      p.customerName.toLowerCase().includes(q) ||
      p.loanName.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q);

    const matchesCustomer = !customerFilter || p.customerId === customerFilter;
    const matchesStatus = !statusFilter || p.status === statusFilter;
    const matchesDate = (!startDate || (p.dueDate && p.dueDate >= startDate)) && (!endDate || (p.dueDate && p.dueDate <= endDate));

    return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
  });

  // KPI Analytics Metrics
  const totalLoanCapital = loans.reduce((s, l) => s + Number(l.totalAmount || 0), 0);
  const totalPaidCollection = payments.filter((p) => p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalOutstandingBalance = Math.max(0, totalLoanCapital - totalPaidCollection);

  // Top Customers by Outstanding Balance
  const topBorrowers = customers
    .map((c) => {
      const custLoans = loans.filter((l) => l.customerId === c.id);
      const totalLoan = custLoans.reduce((s, l) => s + Number(l.totalAmount || 0), 0);
      const custPaid = payments.filter((p) => p.customerId === c.id && p.status === 'Paid').reduce((s, p) => s + Number(p.amount || 0), 0);
      const outstanding = Math.max(0, totalLoan - custPaid);
      return { customerName: c.name, customerId: c.id, totalLoan, outstanding, loanCount: custLoans.length };
    })
    .sort((a, b) => b.outstanding - a.outstanding)
    .slice(0, 5);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Payment ID,Customer Name,Loan Title,Due Date,Paid Date,EMI Amount,Status\n'];
    const rows = filteredPayments.map(
      (p) => `${p.id},"${p.customerName}","${p.loanName}",${p.dueDate || ''},${p.paidDate || ''},${p.amount},${p.status}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + headers.concat(rows).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EMI_Loan_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel
  const handleExportExcel = () => {
    const data = filteredPayments.map((p, idx) => ({
      '#': idx + 1,
      'Payment ID': p.id,
      'Customer Name': p.customerName,
      'Loan Account': p.loanName,
      'Due Date': p.dueDate,
      'Paid Date': p.paidDate || '-',
      'EMI Amount (₹)': Number(p.amount),
      Status: p.status,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial Report');
    XLSX.writeFile(wb, `Financial_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FINANCIAL & EMI COLLECTION REPORT', 14, 20);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 26);
    doc.text(`Total Portfolio Capital: Rs. ${totalLoanCapital.toLocaleString('en-IN')}`, 14, 31);
    doc.text(`Total Collections: Rs. ${totalPaidCollection.toLocaleString('en-IN')}`, 14, 36);

    const rows = filteredPayments.map((p, i) => [
      i + 1,
      p.customerName,
      p.loanName,
      p.dueDate || '-',
      `Rs. ${Number(p.amount).toLocaleString('en-IN')}`,
      p.status,
    ]);

    doc.autoTable({
      startY: 42,
      head: [['#', 'Customer', 'Loan Account', 'Due Date', 'Amount', 'Status']],
      body: rows,
      theme: 'striped',
      headStyles: { fillColor: [13, 110, 253] },
    });

    doc.save(`EMI_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Financial &amp; Loan Analytics Reports</h4>
          <p className="text-muted small mb-0">Generate summary reports, collection metrics, and export data in PDF, Excel, and CSV formats</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          <button className="btn btn-outline-secondary rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={() => window.print()}>
            <MdPrint size={18} /> Print
          </button>
          <button className="btn btn-outline-danger rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={handleExportPDF}>
            <MdPictureAsPdf size={18} /> PDF
          </button>
          <button className="btn btn-outline-success rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5" onClick={handleExportExcel}>
            <MdFileUpload size={18} /> Excel
          </button>
          <button className="btn btn-primary rounded-3 px-3 py-2 fw-bold d-flex align-items-center gap-1.5 shadow-sm" onClick={handleExportCSV}>
            <MdFileUpload size={18} /> CSV
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Total Capital Disbursed</small>
                <h4 className="fw-bold text-dark my-1">₹{totalLoanCapital.toLocaleString('en-IN')}</h4>
                <small className="text-primary fw-semibold">{loans.length} Total Loans</small>
              </div>
              <div className="bg-primary bg-opacity-10 text-primary rounded-3 p-2.5">
                <MdAccountBalance size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>EMI Collection Earned</small>
                <h4 className="fw-bold text-success my-1">₹{totalPaidCollection.toLocaleString('en-IN')}</h4>
                <small className="text-success fw-semibold">Total Amount Collected</small>
              </div>
              <div className="bg-success bg-opacity-10 text-success rounded-3 p-2.5">
                <MdAttachMoney size={22} />
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white h-100">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <small className="text-muted text-uppercase fw-semibold" style={{ fontSize: '0.68rem' }}>Total Outstanding Balance</small>
                <h4 className="fw-bold text-danger my-1">₹{totalOutstandingBalance.toLocaleString('en-IN')}</h4>
                <small className="text-danger fw-semibold">Remaining Portfolio Due</small>
              </div>
              <div className="bg-danger bg-opacity-10 text-danger rounded-3 p-2.5">
                <MdWarning size={22} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-3">
          <div className="col-12 col-md-4">
            <input
              type="text"
              className="form-control bg-light border"
              placeholder="Search by Customer, Loan Title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select bg-light border" value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
              <option value="">-- Filter by Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select bg-light border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">-- Payment Status --</option>
              <option value="Paid">Paid</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>
          <div className="col-12 col-md-2">
            <button className="btn btn-outline-secondary w-100 rounded-3" onClick={() => { setSearchQuery(''); setCustomerFilter(''); setStatusFilter(''); setStartDate(''); setEndDate(''); }}>
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Top Borrowers Row */}
      <div className="row g-4 mb-4">
        {/* Top Customers by Outstanding Balance */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h6 className="fw-bold text-dark mb-1">Top Borrowers by Outstanding Balance</h6>
            <p className="text-muted small mb-3">Customers with highest remaining loan balances</p>

            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="bg-light text-muted">
                  <tr>
                    <th>Customer Name</th>
                    <th>Loans</th>
                    <th>Total Capital</th>
                    <th className="text-end">Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {topBorrowers.map((b, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold text-dark">{b.customerName}</td>
                      <td><span className="badge bg-light text-dark border">{b.loanCount} Loans</span></td>
                      <td>₹{b.totalLoan.toLocaleString('en-IN')}</td>
                      <td className="text-end fw-bold text-danger">₹{b.outstanding.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="col-12 col-lg-6">
          <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
            <h6 className="fw-bold text-dark mb-1">Loan Category Distribution & Revenue</h6>
            <p className="text-muted small mb-3">Loan capital breakdown by loan type</p>

            <div className="d-flex flex-column gap-3">
              {LOAN_TYPES.map((type, idx) => {
                const list = loans.filter((l) => l.type === type);
                const amount = list.reduce((s, l) => s + Number(l.totalAmount || 0), 0);
                const percent = totalLoanCapital > 0 ? Math.round((amount / totalLoanCapital) * 100) : 0;
                return (
                  <div key={idx}>
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="fw-semibold text-dark small">{type} ({list.length} accounts)</span>
                      <span className="fw-bold small text-secondary">₹{amount.toLocaleString('en-IN')} ({percent}%)</span>
                    </div>
                    <div className="progress rounded-pill" style={{ height: '7px' }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Comprehensive Report: Table or Cards View */}
      <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold text-dark mb-0">Detailed EMI Collection &amp; Payment Ledger</h5>
          <small className="text-muted">{filteredPayments.length} Report Entries</small>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 small">
            <thead className="bg-light text-muted">
              <tr>
                <th>#</th>
                <th>Payment ID</th>
                <th>Customer Name</th>
                <th>Loan Account</th>
                <th>Due Date</th>
                <th>Paid Date</th>
                <th>Amount</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4 text-muted">No report entries found matching filters.</td>
                </tr>
              ) : (
                filteredPayments.map((p, idx) => (
                  <tr key={p.id}>
                    <td className="fw-bold">{idx + 1}</td>
                    <td className="font-monospace text-primary">{p.id}</td>
                    <td className="fw-bold text-dark">{p.customerName}</td>
                    <td className="text-secondary">{p.loanName}</td>
                    <td className="fw-semibold">{p.dueDate}</td>
                    <td className="text-muted">{p.paidDate || '-'}</td>
                    <td className="fw-bold text-success">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                    <td className="text-center">
                      <span className={`badge rounded-pill ${
                        p.status === 'Paid' ? 'bg-success bg-opacity-10 text-success' :
                        p.status === 'Overdue' ? 'bg-danger bg-opacity-10 text-danger' :
                        'bg-warning bg-opacity-10 text-dark'
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
      </div>
    </div>
  );
};

export default Reports;
