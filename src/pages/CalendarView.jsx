import React, { useState, useEffect } from 'react';
import { 
  MdChevronLeft, MdChevronRight, MdToday, MdSearch, 
  MdCheckCircle, MdSend, MdPerson, MdAddCircle, MdClose, MdEvent,
  MdViewList, MdViewModule
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { getLocalDateString, formatIndianDate } from '../utils/dateUtils';

import { useNavigate } from 'react-router-dom';

const CalendarView = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date(2026, 7, 1)); // August 2026
  const [viewMode, setViewMode] = useState('Month'); // 'Month', 'Week', 'Day'
  const [displayMode, setDisplayMode] = useState(() => {
    return localStorage.getItem('rc_view_calendar') || (window.innerWidth >= 768 ? 'table' : 'cards');
  });

  const handleSetDisplayMode = (mode) => {
    setDisplayMode(mode);
    localStorage.setItem('rc_view_calendar', mode);
  };

  const [customers, setCustomers] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loanTypeFilter, setLoanTypeFilter] = useState('');

  // Date detail drawer/popup
  const [selectedDate, setSelectedDate] = useState(null);

  const loadData = () => {
    setCustomers(loanStore.getCustomers());
    setLoans(loanStore.getLoans());
    setPayments(loanStore.getPayments());
    setReminders(loanStore.getReminders());
  };

  useEffect(() => {
    loadData();
    window.addEventListener('loanStoreUpdated', loadData);
    return () => window.removeEventListener('loanStoreUpdated', loadData);
  }, []);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else if (viewMode === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
    }
  };

  const handleNext = () => {
    if (viewMode === 'Month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else if (viewMode === 'Week') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to compile events for a date string (YYYY-MM-DD)
  const getEventsForDate = (dateStr) => {
    const todayStr = getLocalDateString();
    let events = [];

    // Payments
    payments.forEach((p) => {
      const targetDate = p.paidDate || p.dueDate;
      if (targetDate === dateStr) {
        let isPaid = p.status === 'Paid';
        let isOverdue = p.status === 'Overdue' || (!isPaid && p.dueDate && p.dueDate < todayStr);
        let colorClass = isPaid ? 'bg-success text-white' : isOverdue ? 'bg-danger text-white' : 'bg-warning text-dark';
        let typeLabel = isPaid ? 'Paid EMI' : isOverdue ? 'Overdue EMI' : 'Upcoming EMI';

        events.push({
          id: p.id,
          title: `${p.customerName} - ₹${Number(p.amount).toLocaleString('en-IN')}`,
          customerName: p.customerName,
          loanName: p.loanName,
          amount: p.amount,
          status: p.status,
          type: typeLabel,
          badgeColor: colorClass,
          rawPayment: p,
        });
      }
    });

    // Reminders
    reminders.forEach((r) => {
      if (r.date === dateStr) {
        events.push({
          id: r.id,
          title: `Reminder: ${r.title} (${r.type || 'General'})`,
          customerName: r.title,
          loanName: r.notes || 'Reminder Event',
          amount: 0,
          status: 'Reminder',
          type: 'Reminder',
          badgeColor: 'bg-primary text-white',
          rawReminder: r,
        });
      }
    });

    // Filter events based on active controls
    return events.filter((ev) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q || ev.customerName.toLowerCase().includes(q) || ev.title.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || ev.status === statusFilter || (statusFilter === 'Paid' && ev.type === 'Paid EMI') || (statusFilter === 'Overdue' && ev.type === 'Overdue EMI');
      return matchesSearch && matchesStatus;
    });
  };

  const handleMarkPaidFromCalendar = (payId) => {
    loanStore.markPaymentAsPaid(payId);
    alert('✓ EMI marked as PAID!');
  };

  const handleSendReminderFromCalendar = (custName, amt) => {
    alert(`📱 WhatsApp / SMS Reminder dispatched to ${custName} for ₹${Number(amt).toLocaleString('en-IN')}`);
  };

  // Generate Month Grid Days
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const gridDays = [];
  // Padding previous month days
  for (let i = 0; i < firstDay; i++) {
    gridDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridDays.push(d);
  }

  // Month Schedule Payments for Table View
  const mStrPadded = (month + 1).toString().padStart(2, '0');
  const monthPrefix = `${year}-${mStrPadded}`;
  const monthPayments = payments.filter((p) => {
    const target = p.paidDate || p.dueDate;
    return target && target.startsWith(monthPrefix);
  }).filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (p.customerName || '').toLowerCase().includes(q) || (p.loanName || '').toLowerCase().includes(q);
    const matchesStatus = !statusFilter || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Calendar Header & View Selectors */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Interactive EMI &amp; Reminder Calendar</h4>
          <p className="text-muted small mb-0">Track upcoming due dates, paid installments, and overdue customer reminders</p>
        </div>

        <div className="d-flex align-items-center gap-2 flex-wrap">
          {/* Table / Cards Mode Switcher */}
          <div className="btn-group bg-white rounded-3 border p-0.5 shadow-2xs">
            <button
              type="button"
              className={`btn btn-sm px-2.5 py-1.5 fw-bold ${displayMode === 'table' ? 'btn-primary' : 'btn-light text-muted'}`}
              onClick={() => handleSetDisplayMode('table')}
              title="Schedule Table View"
            >
              <MdViewList size={18} /> Table
            </button>
            <button
              type="button"
              className={`btn btn-sm px-2.5 py-1.5 fw-bold ${displayMode === 'cards' ? 'btn-primary' : 'btn-light text-muted'}`}
              onClick={() => handleSetDisplayMode('cards')}
              title="Calendar Grid & Cards View"
            >
              <MdViewModule size={18} /> Cards
            </button>
          </div>

          {/* Navigation Controls */}
          <div className="btn-group bg-white shadow-sm rounded-3 border p-1">
            <button className="btn btn-sm btn-light border-0" onClick={handlePrev}>
              <MdChevronLeft size={22} />
            </button>
            <button className="btn btn-sm btn-light border-0 fw-bold px-3" onClick={handleToday}>
              <MdToday className="me-1" /> Today
            </button>
            <button className="btn btn-sm btn-light border-0" onClick={handleNext}>
              <MdChevronRight size={22} />
            </button>
          </div>

          <h5 className="fw-bold text-dark mb-0 mx-2">{monthNames[month]} {year}</h5>

          {/* View Mode Switcher (When in Cards/Calendar mode) */}
          {displayMode === 'cards' && (
            <div className="btn-group bg-white shadow-sm rounded-3 border p-1">
              {['Month', 'Week', 'Day'].map((m) => (
                <button
                  key={m}
                  className={`btn btn-sm rounded-2 fw-bold px-3 py-1 ${viewMode === m ? 'btn-primary text-white shadow-2xs' : 'btn-light text-secondary'}`}
                  onClick={() => setViewMode(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar & Color Code Legend */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-5">
            <div className="input-group bg-light rounded-3 border">
              <span className="input-group-text bg-transparent border-0 pe-1">
                <MdSearch size={20} className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control bg-transparent border-0 box-shadow-none"
                placeholder="Search events by customer or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-6 col-md-3">
            <select className="form-select bg-light border" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">-- All Payment Statuses --</option>
              <option value="Paid">Green: Paid EMI</option>
              <option value="Upcoming">Yellow: Upcoming EMI</option>
              <option value="Overdue">Red: Overdue EMI</option>
              <option value="Reminder">Blue: Reminder Event</option>
            </select>
          </div>

          {/* Color Legend */}
          <div className="col-12 col-md-4">
            <div className="d-flex align-items-center justify-content-end gap-2.5 flex-wrap small fw-semibold">
              <span className="badge bg-success text-white px-2 py-1">Green = Paid</span>
              <span className="badge bg-warning text-dark px-2 py-1">Yellow = Upcoming</span>
              <span className="badge bg-danger text-white px-2 py-1">Red = Overdue</span>
              <span className="badge bg-primary text-white px-2 py-1">Blue = Reminder</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Calendar Content: Table or Cards View */}
      {displayMode === 'table' ? (
        /* TABLE VIEW */
        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white mb-4">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light text-muted font-monospace small">
                <tr>
                  <th className="ps-4">DATE</th>
                  <th>BORROWER / CUSTOMER</th>
                  <th>LOAN ACCOUNT</th>
                  <th>EMI AMOUNT</th>
                  <th>EVENT TYPE</th>
                  <th>STATUS</th>
                  <th className="text-end pe-4">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {monthPayments.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      <p className="mb-0 fw-semibold">No scheduled installments found for {monthNames[month]} {year}.</p>
                    </td>
                  </tr>
                ) : (
                  monthPayments.map((p) => {
                    const isPaid = p.status === 'Paid';
                    const targetDate = p.paidDate || p.dueDate;
                    const isOverdue = p.status === 'Overdue' || (!isPaid && targetDate && targetDate < getLocalDateString());

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td className="ps-4">
                          <span className="badge bg-light text-dark border px-2.5 py-1.5 rounded-2 font-monospace fw-bold">
                            {formatIndianDate(targetDate)}
                          </span>
                        </td>

                        <td>
                          <div className="fw-bold text-dark">{p.customerName}</div>
                          <small className="text-muted font-monospace">{p.customerId}</small>
                        </td>

                        <td>
                          <div className="text-dark fw-semibold">{p.loanName}</div>
                          <small className="text-muted font-monospace">{p.loanId}</small>
                        </td>

                        <td>
                          <div className="fw-bold text-success">₹{Number(p.amount).toLocaleString('en-IN')}</div>
                        </td>

                        <td>
                          <span className={`badge rounded-pill px-2.5 py-1 ${isPaid ? 'bg-success text-white' : isOverdue ? 'bg-danger text-white' : 'bg-warning text-dark'}`}>
                            {isPaid ? 'Paid EMI' : isOverdue ? 'Overdue EMI' : 'Upcoming EMI'}
                          </span>
                        </td>

                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1 rounded-2">
                            {p.status}
                          </span>
                        </td>

                        <td className="text-end pe-4">
                          <div className="d-flex align-items-center justify-content-end gap-1.5">
                            {!isPaid && (
                              <button
                                type="button"
                                className="btn btn-outline-success btn-sm rounded-3 px-2 py-1 fw-bold"
                                onClick={() => handleMarkPaidFromCalendar(p.id)}
                                title="Mark EMI as Paid"
                              >
                                ✓ Paid
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm rounded-3 px-2 py-1 fw-semibold"
                              onClick={() => handleSendReminderFromCalendar(p.customerName, p.amount)}
                              title="Send Reminder"
                            >
                              <MdSend size={14} /> Send
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
        /* CARDS / CALENDAR GRID VIEW */
        <>
          {viewMode === 'Month' && (
            <div className="card border-0 shadow-sm rounded-4 bg-white overflow-hidden mb-4">
              <div className="grid text-center bg-light border-bottom fw-bold text-muted py-2.5" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', autoRows: 'minmax(120px, auto)' }}>
                {gridDays.map((day, idx) => {
                  if (day === null) {
                    return <div key={`pad-${idx}`} className="bg-light bg-opacity-40 border-end border-bottom"></div>;
                  }

                  const mStr = (month + 1).toString().padStart(2, '0');
                  const dStr = day.toString().padStart(2, '0');
                  const dateStr = `${year}-${mStr}-${dStr}`;
                  const dayEvents = getEventsForDate(dateStr);
                  const isToday = dateStr === getLocalDateString();

                  return (
                    <div
                      key={`day-${day}`}
                      className={`border-end border-bottom p-2 position-relative cursor-pointer transition-all hover-light ${isToday ? 'bg-primary bg-opacity-10' : ''}`}
                      onClick={() => setSelectedDate({ dateStr, day, events: dayEvents })}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className={`fw-bold small rounded-circle px-2 py-0.5 ${isToday ? 'bg-primary text-white' : 'text-dark'}`}>
                          {day}
                        </span>
                        {dayEvents.length > 0 && (
                          <span className="badge bg-dark bg-opacity-75 rounded-pill" style={{ fontSize: '0.62rem' }}>
                            {dayEvents.length}
                          </span>
                        )}
                      </div>

                      {/* Day Events Badges */}
                      <div className="d-flex flex-column gap-1 overflow-hidden" style={{ maxHeight: '85px' }}>
                        {dayEvents.slice(0, 3).map((ev, eIdx) => (
                          <div
                            key={eIdx}
                            className={`badge text-truncate text-start font-sans p-1.5 rounded-2 ${ev.badgeColor}`}
                            style={{ fontSize: '0.68rem', fontWeight: 600 }}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <small className="text-primary fw-bold" style={{ fontSize: '0.65rem' }}>
                            +{dayEvents.length - 3} more...
                          </small>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode !== 'Month' && (
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h6 className="fw-bold text-dark mb-3">{viewMode} View Agenda for {monthNames[month]} {year}</h6>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="bg-light small text-muted">
                    <tr>
                      <th>Event Title / Customer</th>
                      <th>Type</th>
                      <th>Loan Name</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.slice(0, 6).map((p) => (
                      <tr key={p.id}>
                        <td className="fw-bold text-dark">{p.customerName}</td>
                        <td><span className="badge bg-warning text-dark">{p.status}</span></td>
                        <td className="text-secondary">{p.loanName}</td>
                        <td className="fw-bold text-success">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary rounded-3" onClick={() => handleMarkPaidFromCalendar(p.id)}>
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Date Event Details Popup / Drawer */}
      {selectedDate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1070 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header border-0 bg-primary text-white py-3 px-4">
                <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
                  <MdEvent /> Schedule Details for {formatIndianDate(selectedDate.dateStr)}
                </h5>

                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedDate(null)}></button>
              </div>

              <div className="modal-body p-4 bg-light">
                {selectedDate.events.length === 0 ? (
                  <div className="text-center py-4 text-muted">
                    <p className="mb-0">No EMI payments or follow-up events scheduled for this date.</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {selectedDate.events.map((ev, idx) => (
                      <div key={idx} className="card border-0 shadow-2xs rounded-3 p-3 bg-white">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
                          <span className={`badge rounded-pill px-3 py-1 ${ev.badgeColor}`}>
                            {ev.type}
                          </span>
                          {ev.amount > 0 && (
                            <h5 className="fw-bold text-success mb-0">₹{Number(ev.amount).toLocaleString('en-IN')}</h5>
                          )}
                        </div>

                        <h6 className="fw-bold text-dark mb-1">{ev.customerName}</h6>
                        <p className="text-muted small mb-2">{ev.loanName}</p>

                        <div className="d-flex gap-2 mt-2">
                          {ev.rawPayment && ev.rawPayment.status !== 'Paid' && (
                            <button
                              className="btn btn-success btn-sm rounded-3 fw-bold px-3"
                              onClick={() => {
                                handleMarkPaidFromCalendar(ev.rawPayment.id);
                                setSelectedDate(null);
                              }}
                            >
                              ✓ Mark as Paid
                            </button>
                          )}
                          <button
                            className="btn btn-outline-danger btn-sm rounded-3 fw-bold px-3 d-flex align-items-center gap-1"
                            onClick={() => handleSendReminderFromCalendar(ev.customerName, ev.amount)}
                          >
                            <MdSend size={14} /> Send Reminder
                          </button>
                          <button
                            className="btn btn-light border btn-sm rounded-3 fw-semibold px-3 ms-auto"
                            onClick={() => {
                              setSelectedDate(null);
                              navigate('/customers');
                            }}
                          >
                            <MdPerson size={16} /> View Customer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 bg-light py-3 px-4">
                <button type="button" className="btn btn-secondary rounded-3 px-4 fw-semibold" onClick={() => setSelectedDate(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
