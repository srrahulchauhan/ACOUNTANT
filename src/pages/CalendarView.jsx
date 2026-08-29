import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MdChevronLeft, MdChevronRight, MdToday, MdWarning, MdCheckCircle, 
  MdSchedule, MdSearch, MdFilterList, MdPerson, MdPayment, MdSend, 
  MdVisibility, MdClose, MdEvent, MdViewModule, MdViewWeek, MdViewDay,
  MdPhone, MdEmail, MdHome, MdWork
} from 'react-icons/md';
import { fetchTransactions, fetchCustomers } from '../api';
import { getLocalDateString, addMonthsToDate } from '../utils/dateUtils';
import AnimatedSection from '../components/AnimatedSection';

const LOCAL_STORAGE_LOANS_KEY = 'emi_loan_management_data';

const LOAN_TYPES = [
  'All', 'Home Loan', 'Car Loan', 'Personal Loan', 'Education Loan', 'Credit Card', 'Other Loan'
];

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('Month'); // 'Month', 'Week', 'Day'
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Paid', 'Upcoming', 'Overdue', 'Reminder'
  const [typeFilter, setTypeFilter] = useState('All');

  // Data
  const [loans, setLoans] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Selected Date Event Modal / Drawer
  const [selectedDayEvents, setSelectedDayEvents] = useState(null); // { dateStr, events: [] }
  const [viewCustomer, setViewCustomer] = useState(null); // Customer profile view

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Load Data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transRes, custRes] = await Promise.all([fetchTransactions(), fetchCustomers()]);
      setTransactions(transRes.data || []);
      
      let custData = custRes.data || [];
      const savedCusts = localStorage.getItem('customers_extended_profiles');
      if (savedCusts) {
        const parsed = JSON.parse(savedCusts);
        custData = custData.map(c => {
          const extra = parsed.find(x => x._id === c._id || x.customerId === c.customerId);
          return extra ? { ...c, ...extra } : c;
        });
      }
      setCustomers(custData);

      const savedLoans = localStorage.getItem(LOCAL_STORAGE_LOANS_KEY);
      if (savedLoans) {
        setLoans(JSON.parse(savedLoans));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Calendar Date Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    if (viewMode === 'Month') setCurrentDate(new Date(year, month - 1, 1));
    else if (viewMode === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const nextPeriod = () => {
    if (viewMode === 'Month') setCurrentDate(new Date(year, month + 1, 1));
    else if (viewMode === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const goToToday = () => setCurrentDate(new Date());

  const todayStr = getLocalDateString();

  // Combine all calendar events (Paid EMIs, Upcoming Dues, Overdue EMIs, Follow-up Reminders)
  const allEvents = useMemo(() => {
    const list = [];

    loans.forEach(loan => {
      // 1. Paid EMI History Entries (Green)
      if (loan.history && loan.history.length > 0) {
        loan.history.forEach(h => {
          list.push({
            id: `paid_${loan.id}_${h.installment}`,
            loanId: loan.id,
            loanName: loan.loanName,
            customerName: loan.borrowerName || 'Customer',
            loanType: loan.type,
            amount: h.amount,
            date: h.paidDate,
            status: 'Paid',
            statusLabel: 'Paid EMI',
            color: '#10b981', // Green
            bg: 'rgba(16, 185, 129, 0.15)',
            icon: <MdCheckCircle size={14} />,
            installment: h.installment,
            totalTenure: loan.tenureMonths
          });
        });
      }

      // 2. Upcoming & Overdue Due Dates (Yellow or Red)
      if (loan.status === 'Active' && loan.dueDate) {
        const isOverdue = loan.dueDate < todayStr;
        const statusType = isOverdue ? 'Overdue' : 'Upcoming';
        
        list.push({
          id: `due_${loan.id}`,
          loanId: loan.id,
          loanName: loan.loanName,
          customerName: loan.borrowerName || 'Customer',
          loanType: loan.type,
          amount: loan.emiAmount,
          date: loan.dueDate,
          status: statusType,
          statusLabel: isOverdue ? 'Overdue EMI' : 'Upcoming EMI Due',
          color: isOverdue ? '#ef4444' : '#f59e0b', // Red or Yellow
          bg: isOverdue ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          icon: isOverdue ? <MdWarning size={14} /> : <MdSchedule size={14} />,
          installment: loan.paidEmis + 1,
          totalTenure: loan.tenureMonths
        });

        // 3. Customer Reminder / Follow-up (Blue) - 3 days before due date
        const reminderDateObj = new Date(loan.dueDate);
        reminderDateObj.setDate(reminderDateObj.getDate() - 3);
        const reminderDateStr = getLocalDateString(reminderDateObj);

        if (!isOverdue) {
          list.push({
            id: `rem_${loan.id}`,
            loanId: loan.id,
            loanName: loan.loanName,
            customerName: loan.borrowerName || 'Customer',
            loanType: loan.type,
            amount: loan.emiAmount,
            date: reminderDateStr,
            status: 'Reminder',
            statusLabel: 'Customer Follow-up Reminder',
            color: '#0ea5e9', // Blue
            bg: 'rgba(14, 165, 233, 0.15)',
            icon: <MdSend size={14} />,
            installment: loan.paidEmis + 1,
            totalTenure: loan.tenureMonths
          });
        }
      }
    });

    return list;
  }, [loans, todayStr]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter(ev => {
      // Search
      const s = searchTerm.toLowerCase();
      const matchesSearch = !s || 
        ev.customerName.toLowerCase().includes(s) || 
        ev.loanName.toLowerCase().includes(s) || 
        ev.loanType.toLowerCase().includes(s);

      // Status Filter
      const matchesStatus = statusFilter === 'All' || ev.status === statusFilter;

      // Type Filter
      const matchesType = typeFilter === 'All' || ev.loanType === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [allEvents, searchTerm, statusFilter, typeFilter]);

  // Map events to date strings (yyyy-mm-dd)
  const eventsByDateMap = useMemo(() => {
    const map = {};
    filteredEvents.forEach(ev => {
      if (!map[ev.date]) map[ev.date] = [];
      map[ev.date].push(ev);
    });
    return map;
  }, [filteredEvents]);

  // Month View Days
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthPaddedDays = useMemo(() => {
    const days = [
      ...Array(firstDayOfMonth).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
    ];
    const totalCells = days.length > 35 ? 42 : 35;
    while (days.length < totalCells) days.push(null);
    return days;
  }, [firstDayOfMonth, daysInMonth]);

  // Week View Days (Sunday to Saturday around currentDate)
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr.setDate(first + i));
      list.push(d);
    }
    return list;
  }, [currentDate]);

  // Date Header String
  const periodHeaderStr = useMemo(() => {
    if (viewMode === 'Month') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (viewMode === 'Week') {
      const start = weekDays[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
      const end = weekDays[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${start} - ${end}`;
    } else {
      return currentDate.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    }
  }, [currentDate, viewMode, weekDays]);

  // Mark EMI Paid Handler from Side Drawer
  const handleMarkPaid = (loanId) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return;

    if (window.confirm(`Mark EMI of ₹${loan.emiAmount.toLocaleString('en-IN')} for "${loan.loanName}" as PAID?`)) {
      const updatedPaidEmis = loan.paidEmis + 1;
      const isCompleted = updatedPaidEmis >= loan.tenureMonths;
      const nextDue = addMonthsToDate(loan.dueDate || getLocalDateString(), 1);

      const historyItem = {
        installment: updatedPaidEmis,
        paidDate: getLocalDateString(),
        amount: loan.emiAmount
      };

      const updated = loans.map(l => {
        if (l.id === loanId) {
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

      setLoans(updated);
      localStorage.setItem(LOCAL_STORAGE_LOANS_KEY, JSON.stringify(updated));
      setSelectedDayEvents(null);
      alert(`✓ EMI for "${loan.loanName}" marked as Paid!`);
    }
  };

  // Send Reminder Handler
  const handleSendReminder = (ev) => {
    const text = `Hello ${ev.customerName}, this is a reminder that your EMI payment of ₹${ev.amount.toLocaleString('en-IN')} for ${ev.loanName} is due on ${ev.date}. Please pay at your earliest convenience. Thank you!`;
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  // View Customer Profile Handler
  const handleViewCustomerProfile = (custName) => {
    const found = customers.find(c => c.name?.toLowerCase() === custName?.toLowerCase() || (c.name && custName && c.name.toLowerCase().includes(custName.toLowerCase())));
    if (found) {
      setViewCustomer(found);
    } else {
      alert(`Customer profile for "${custName}" not found in registry.`);
    }
  };

  return (
    <AnimatedSection delay={100}>
      <div className="container-fluid py-4 px-3 px-md-4" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        
        {/* Top Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <h3 className="fw-bold mb-0 d-flex align-items-center gap-2" style={{ color: '#0284c7' }}>
              <MdEvent size={30} style={{ color: '#0284c7' }} /> 
              Smart EMI Calendar Schedule
            </h3>
            <p className="text-muted small mb-0">Track EMI due dates, paid installments, overdue alerts & customer reminders</p>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* View Modes */}
            <div className="btn-group bg-light p-1 rounded-pill shadow-sm" style={{ border: '1px solid var(--border-color)' }}>
              <button 
                className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'Month' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`}
                onClick={() => setViewMode('Month')}
              >
                <MdViewModule size={16} className="me-1" /> Month
              </button>
              <button 
                className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'Week' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`}
                onClick={() => setViewMode('Week')}
              >
                <MdViewWeek size={16} className="me-1" /> Week
              </button>
              <button 
                className={`btn btn-sm rounded-pill px-3 py-1 ${viewMode === 'Day' ? 'btn-primary text-white shadow-sm' : 'text-muted fw-semibold'}`}
                onClick={() => setViewMode('Day')}
              >
                <MdViewDay size={16} className="me-1" /> Day
              </button>
            </div>

            {/* Search */}
            <div className="input-group input-group-sm shadow-sm" style={{ width: '180px' }}>
              <span className="input-group-text bg-white border-end-0"><MdSearch size={16} /></span>
              <input 
                type="text" 
                className="form-control border-start-0 ps-0" 
                placeholder="Search customer..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Color Legend Bar & Filters */}
        <div className="card modern-card p-3 mb-4 border-0 shadow-sm">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            
            {/* Color Labels */}
            <div className="d-flex align-items-center gap-3 flex-wrap small fw-bold">
              <span className="d-flex align-items-center gap-1 text-dark">
                <div style={{ width: 12, height: 12, background: '#10b981', borderRadius: '50%' }}></div> Green: Paid EMI
              </span>
              <span className="d-flex align-items-center gap-1 text-dark">
                <div style={{ width: 12, height: 12, background: '#f59e0b', borderRadius: '50%' }}></div> Yellow: Upcoming Due
              </span>
              <span className="d-flex align-items-center gap-1 text-dark">
                <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: '50%' }}></div> Red: Overdue EMI
              </span>
              <span className="d-flex align-items-center gap-1 text-dark">
                <div style={{ width: 12, height: 12, background: '#0ea5e9', borderRadius: '50%' }}></div> Blue: Customer Reminder
              </span>
            </div>

            {/* Filter Dropdowns */}
            <div className="d-flex align-items-center gap-2">
              <select 
                className="form-select form-select-sm"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid EMI</option>
                <option value="Upcoming">Upcoming Due</option>
                <option value="Overdue">Overdue EMI</option>
                <option value="Reminder">Customer Reminder</option>
              </select>

              <select 
                className="form-select form-select-sm"
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                style={{ width: 'auto' }}
              >
                {LOAN_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Main Calendar Card */}
        <div className="card modern-card overflow-hidden shadow-sm border-0">
          
          {/* Period Header & Controls */}
          <div className="card-header bg-white p-3 p-md-4 d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 border-bottom">
            <button 
              className="btn btn-sm btn-outline-primary fw-bold text-uppercase d-flex align-items-center px-3 rounded-pill shadow-sm"
              onClick={goToToday}
            >
              <MdToday size={18} className="me-2" /> Today
            </button>
            
            <div className="d-flex align-items-center gap-3">
              <button className="btn btn-light rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" onClick={prevPeriod}>
                <MdChevronLeft size={24} />
              </button>
              <h4 className="mb-0 fw-bold text-dark text-center" style={{ minWidth: '220px' }}>
                {periodHeaderStr}
              </h4>
              <button className="btn btn-light rounded-circle p-2 shadow-sm d-flex align-items-center justify-content-center" onClick={nextPeriod}>
                <MdChevronRight size={24} />
              </button>
            </div>

            <span className="badge bg-primary bg-opacity-10 text-primary font-monospace fw-bold px-3 py-2">
              {filteredEvents.length} Schedule Events
            </span>
          </div>

          {/* MONTH VIEW */}
          {viewMode === 'Month' && (
            <div className="p-0 bg-light bg-opacity-10">
              {/* Days Header */}
              <div className="row g-0 border-bottom text-center fw-bold text-muted py-2 text-uppercase mb-0" style={{ fontSize: '0.8rem', letterSpacing: 1 }}>
                {daysOfWeek.map(day => (
                  <div className="col" key={day} style={{ color: day === 'Sun' ? '#ef4444' : '' }}>{day}</div>
                ))}
              </div>

              {/* Days Grid */}
              <div className="d-flex flex-wrap">
                {monthPaddedDays.map((day, index) => {
                  const isToday = today.getFullYear() === year && today.getMonth() === month && day === today.getDate();
                  
                  const cellDateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                  const dayEvents = day ? eventsByDateMap[cellDateStr] || [] : [];

                  return (
                    <div 
                      key={index}
                      className="p-1 p-md-2 position-relative d-flex flex-column"
                      style={{ 
                        width: '14.28%', 
                        height: window.innerWidth > 768 ? '135px' : '95px', 
                        borderRight: '1px solid var(--border-color)', 
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: isToday ? 'rgba(13, 110, 253, 0.05)' : day ? '#ffffff' : '#f8f9fa',
                        transition: 'all 0.2s',
                        cursor: day ? 'pointer' : 'default'
                      }}
                      onClick={() => {
                        if (day && dayEvents.length > 0) {
                          setSelectedDayEvents({ dateStr: cellDateStr, events: dayEvents });
                        }
                      }}
                      onMouseEnter={(e) => { if(day) e.currentTarget.style.backgroundColor = 'rgba(13, 110, 253, 0.03)'; }}
                      onMouseLeave={(e) => { if(day) e.currentTarget.style.backgroundColor = isToday ? 'rgba(13, 110, 253, 0.05)' : '#ffffff'; }}
                    >
                      {day && (
                        <>
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div 
                              className={`d-flex justify-content-center align-items-center rounded-circle 
                              ${isToday ? 'bg-primary text-white fw-bold shadow-sm' : 'bg-light text-dark fw-semibold'}`} 
                              style={{ width: '26px', height: '26px', fontSize: '12px' }}
                            >
                              {day}
                            </div>

                            {dayEvents.length > 0 && (
                              <span className="badge bg-secondary bg-opacity-25 text-dark font-monospace" style={{ fontSize: '0.65rem' }}>
                                {dayEvents.length}
                              </span>
                            )}
                          </div>

                          {/* Desktop Event Badges */}
                          <div className="d-none d-md-flex flex-column gap-1 overflow-auto custom-scrollbar" style={{ flex: 1 }}>
                            {dayEvents.map((ev) => (
                              <div 
                                key={ev.id}
                                className="rounded px-2 py-1 text-truncate border-start border-3 small shadow-sm text-dark"
                                style={{ 
                                  fontSize: '11px', 
                                  backgroundColor: ev.bg,
                                  borderLeftColor: ev.color,
                                  fontWeight: 500
                                }}
                                title={`${ev.statusLabel}: ${ev.customerName} - ₹${ev.amount.toLocaleString('en-IN')}`}
                              >
                                <span className="fw-bold" style={{ color: ev.color }}>₹{Number(ev.amount).toLocaleString('en-IN')}</span> {ev.customerName}
                              </div>
                            ))}
                          </div>

                          {/* Mobile Event Dots */}
                          <div className="d-md-none d-flex gap-1 justify-content-center mt-auto pb-1">
                            {dayEvents.map((ev, i) => (
                              <div key={i} style={{ width: 6, height: 6, background: ev.color, borderRadius: '50%' }}></div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'Week' && (
            <div className="p-3">
              <div className="row g-2">
                {weekDays.map((dateObj, idx) => {
                  const dateStr = getLocalDateString(dateObj);
                  const isToday = dateStr === todayStr;
                  const dayEvents = eventsByDateMap[dateStr] || [];

                  return (
                    <div key={idx} className="col-12 col-md">
                      <div 
                        className={`card h-100 border p-3 rounded-4 ${isToday ? 'border-primary bg-primary bg-opacity-10 shadow-sm' : 'bg-white'}`}
                        style={{ minHeight: '300px' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                          <div>
                            <span className="small text-muted fw-bold d-block text-uppercase">{daysOfWeek[idx]}</span>
                            <span className="fw-bold fs-5 text-dark">{dateObj.getDate()}</span>
                          </div>
                          <span className="badge bg-secondary bg-opacity-10 text-secondary">{dayEvents.length} Events</span>
                        </div>

                        <div className="d-flex flex-column gap-2 overflow-auto" style={{ maxHeight: '350px' }}>
                          {dayEvents.length === 0 ? (
                            <small className="text-muted text-center py-4">No events scheduled</small>
                          ) : (
                            dayEvents.map(ev => (
                              <div 
                                key={ev.id} 
                                className="p-2 rounded-3 border-start border-4 shadow-sm bg-white cursor-pointer"
                                style={{ borderLeftColor: ev.color }}
                                onClick={() => setSelectedDayEvents({ dateStr, events: dayEvents })}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span className="badge px-2 py-1 text-white" style={{ background: ev.color, fontSize: '0.65rem' }}>{ev.status}</span>
                                  <span className="fw-bold text-dark small">₹{Number(ev.amount).toLocaleString('en-IN')}</span>
                                </div>
                                <span className="fw-bold d-block mt-1 text-dark small">{ev.customerName}</span>
                                <small className="text-muted d-block" style={{ fontSize: '0.7rem' }}>{ev.loanName}</small>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* DAY VIEW */}
          {viewMode === 'Day' && (
            <div className="p-4">
              <div className="card modern-card p-4 border shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="fw-bold mb-0 text-dark">
                    Scheduled Events for {currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </h5>
                  <span className="badge bg-primary rounded-pill px-3 py-2">
                    {(eventsByDateMap[getLocalDateString(currentDate)] || []).length} Items Scheduled
                  </span>
                </div>

                <div className="row g-3">
                  {(eventsByDateMap[getLocalDateString(currentDate)] || []).length === 0 ? (
                    <div className="text-center py-5 text-muted">
                      <MdEvent size={48} className="opacity-25 mb-2" />
                      <p className="mb-0">No EMI dues or follow-ups scheduled for this day.</p>
                    </div>
                  ) : (
                    (eventsByDateMap[getLocalDateString(currentDate)] || []).map(ev => (
                      <div key={ev.id} className="col-12 col-md-6">
                        <div className="card p-3 border-0 shadow-sm rounded-4" style={{ background: ev.bg, borderLeft: `5px solid ${ev.color}` }}>
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="d-flex align-items-center gap-2">
                              <div className="p-2 rounded-circle text-white" style={{ background: ev.color }}>
                                {ev.icon}
                              </div>
                              <div>
                                <h6 className="fw-bold mb-0 text-dark">{ev.customerName}</h6>
                                <small className="text-muted">{ev.loanName} ({ev.loanType})</small>
                              </div>
                            </div>
                            <span className="fw-bold text-dark fs-5">₹{Number(ev.amount).toLocaleString('en-IN')}</span>
                          </div>

                          <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top">
                            <span className="badge px-3 py-1 rounded-pill" style={{ background: ev.color, color: '#fff' }}>{ev.statusLabel}</span>
                            
                            <div className="d-flex gap-2">
                              {ev.status !== 'Paid' && (
                                <button className="btn btn-success btn-sm rounded-pill px-3 fw-bold" onClick={() => handleMarkPaid(ev.loanId)}>
                                  ✓ Mark Paid
                                </button>
                              )}
                              <button className="btn btn-outline-primary btn-sm rounded-circle p-1" onClick={() => handleSendReminder(ev)} title="Send Reminder">
                                <MdSend size={16} />
                              </button>
                              <button className="btn btn-outline-secondary btn-sm rounded-circle p-1" onClick={() => handleViewCustomerProfile(ev.customerName)} title="View Customer">
                                <MdVisibility size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Side Panel / Popup Modal for Clicked Date Events */}
        {selectedDayEvents && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header border-0 bg-dark text-white p-4">
                  <div>
                    <h5 className="modal-title fw-bold text-white d-flex align-items-center gap-2">
                      <MdEvent className="text-primary" /> 
                      Events for {new Date(selectedDayEvents.dateStr).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h5>
                    <small className="text-white-50">{selectedDayEvents.events.length} Schedule Items Found</small>
                  </div>
                  <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedDayEvents(null)}></button>
                </div>

                <div className="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div className="row g-3">
                    {selectedDayEvents.events.map(ev => (
                      <div key={ev.id} className="col-12">
                        <div className="card p-3 border-0 shadow-sm rounded-4" style={{ background: ev.bg, borderLeft: `5px solid ${ev.color}` }}>
                          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2">
                            <div className="d-flex align-items-center gap-3">
                              <div className="p-3 rounded-circle text-white d-flex align-items-center justify-content-center" style={{ width: 44, height: 44, background: ev.color }}>
                                {ev.icon}
                              </div>
                              <div>
                                <h6 className="fw-bold mb-0 text-dark">{ev.customerName}</h6>
                                <small className="text-muted d-block">{ev.loanName} • <span className="badge bg-secondary bg-opacity-20 text-dark">{ev.loanType}</span></small>
                                {ev.installment && <small className="text-muted d-block">Installment {ev.installment} of {ev.totalTenure}</small>}
                              </div>
                            </div>

                            <div className="text-sm-end">
                              <div className="fw-bold text-dark fs-4">₹{Number(ev.amount).toLocaleString('en-IN')}</div>
                              <span className="badge px-3 py-1 rounded-pill" style={{ background: ev.color, color: '#fff' }}>{ev.statusLabel}</span>
                            </div>
                          </div>

                          {/* Quick Actions Bar */}
                          <div className="d-flex flex-wrap gap-2 justify-content-end mt-3 pt-2 border-top">
                            {ev.status !== 'Paid' && (
                              <button className="btn btn-success btn-sm rounded-pill px-3 fw-bold shadow-sm" onClick={() => handleMarkPaid(ev.loanId)}>
                                ✓ Mark as Paid
                              </button>
                            )}
                            <button className="btn btn-outline-primary btn-sm rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1" onClick={() => handleSendReminder(ev)}>
                              <MdSend size={14} /> Send WhatsApp Reminder
                            </button>
                            <button className="btn btn-outline-secondary btn-sm rounded-pill px-3 fw-semibold shadow-sm d-flex align-items-center gap-1" onClick={() => handleViewCustomerProfile(ev.customerName)}>
                              <MdVisibility size={14} /> View Customer Profile
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setSelectedDayEvents(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customer Profile View Modal */}
        {viewCustomer && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 1080 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header border-0 bg-primary text-white p-4">
                  <div className="d-flex align-items-center gap-3">
                    {viewCustomer.profilePhoto ? (
                      <img src={viewCustomer.profilePhoto} alt={viewCustomer.name} className="rounded-circle border border-2 border-white shadow-sm" style={{ width: 56, height: 56, objectFit: 'cover' }} />
                    ) : (
                      <div className="rounded-circle bg-white text-primary fw-bold d-flex align-items-center justify-content-center" style={{ width: 56, height: 56, fontSize: '1.4rem' }}>
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
                  <div className="row g-3">
                    <div className="col-6 col-md-3"><small className="text-muted d-block">Phone</small><span className="fw-bold">{viewCustomer.phone || 'N/A'}</span></div>
                    <div className="col-6 col-md-3"><small className="text-muted d-block">Email</small><span className="fw-bold text-truncate d-block">{viewCustomer.email || 'N/A'}</span></div>
                    <div className="col-6 col-md-3"><small className="text-muted d-block">PAN/Aadhaar</small><span className="fw-bold font-monospace">{viewCustomer.panAadhaar || 'N/A'}</span></div>
                    <div className="col-6 col-md-3"><small className="text-muted d-block">Monthly Income</small><span className="fw-bold text-success">₹{Number(viewCustomer.monthlyIncome || 0).toLocaleString('en-IN')}/mo</span></div>
                    <div className="col-12 col-md-6"><small className="text-muted d-block">Employment</small><span className="fw-semibold">{viewCustomer.employment || 'N/A'}</span></div>
                    <div className="col-12 col-md-6"><small className="text-muted d-block">Address</small><span className="fw-semibold">{viewCustomer.address || 'N/A'}</span></div>
                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={() => setViewCustomer(null)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AnimatedSection>
  );
};

export default CalendarView;
