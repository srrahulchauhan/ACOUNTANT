import React, { useState, useEffect } from 'react';
import { 
  MdSettings, MdSave, MdDownload, 
  MdUploadFile, MdRefresh, MdFileUpload, MdSecurity,
  MdNotifications, MdEmail, MdSend, MdMessage, MdEdit,
  MdRestore, MdAccessTime
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';

const TEMPLATE_KEYS = [
  { key: 'monthly_reminder', label: 'Monthly EMI Reminder', icon: '📅' },
  { key: 'due_today', label: 'EMI Due Today', icon: '⏰' },
  { key: 'upcoming_reminder', label: 'Upcoming EMI Reminder', icon: '🔔' },
  { key: 'overdue_reminder', label: 'Overdue EMI Alert', icon: '🚨' },
  { key: 'payment_received', label: 'Payment Received Confirmation', icon: '💳' },
  { key: 'loan_statement', label: 'Loan Account Statement', icon: '📄' },
  { key: 'loan_closure', label: 'Loan Closure Confirmation', icon: '🏆' },
];

const Settings = () => {
  const [settings, setSettings] = useState({
    companyName: '',
    companyTagline: '',
    companyLogo: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    currencySymbol: '₹',
    autoSendReminders: true,
    whatsappSenderName: 'RC Accountant Accounts',
    emailSenderName: 'RC Accountant Billing',
    reminderDaysBefore: '3',
    quietHoursStart: '21:00',
    quietHoursEnd: '09:00',
    enableEmailReminders: true,
    enableWhatsappReminders: true,
    enableSmsReminders: false,
  });

  const [templates, setTemplates] = useState({});
  const [activeTmplKey, setActiveTmplKey] = useState('monthly_reminder');
  const [tmplSubject, setTmplSubject] = useState('');
  const [tmplBody, setTmplBody] = useState('');

  useEffect(() => {
    setSettings(loanStore.getSettings());
    const t = loanStore.getCommunicationTemplates();
    setTemplates(t);
    if (t.monthly_reminder) {
      setTmplSubject(t.monthly_reminder.subject);
      setTmplBody(t.monthly_reminder.body);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSelectTemplate = (key) => {
    setActiveTmplKey(key);
    const tmpl = templates[key];
    if (tmpl) {
      setTmplSubject(tmpl.subject || '');
      setTmplBody(tmpl.body || '');
    }
  };

  const handleSaveTemplate = () => {
    const updated = {
      ...templates,
      [activeTmplKey]: {
        ...templates[activeTmplKey],
        subject: tmplSubject,
        body: tmplBody,
      },
    };
    setTemplates(updated);
    loanStore.saveCommunicationTemplates(updated);
    alert(`✓ Template "${templates[activeTmplKey]?.name || activeTmplKey}" saved successfully!`);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings((prev) => ({ ...prev, companyLogo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    loanStore.saveSettings(settings);
    alert('✓ Settings saved successfully!');
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const json = JSON.parse(evt.target.result);
          loanStore.importBackup(json);
          alert('✓ Database restored successfully from JSON backup!');
        } catch (err) {
          alert('❌ Invalid JSON backup file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('⚠️ Are you sure you want to reset all data to default demo seed records?')) {
      loanStore.resetToDefaults();
      alert('✓ Reset to default demo data.');
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <MdSettings className="text-primary" /> System Settings &amp; Configuration
          </h4>
          <p className="text-muted small mb-0">Manage company branding, Gmail &amp; WhatsApp communication gateways, and notification preferences</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="row g-4">
          
          {/* Left Column: Branding & Communication Gateways */}
          <div className="col-12 col-lg-8">
            
            {/* Company Branding */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Company Branding &amp; Letterhead Setup</h5>

              <div className="row g-3">
                <div className="col-12 text-center mb-3">
                  <div className="position-relative d-inline-block">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="rounded-3 border p-1 shadow-2xs" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    ) : (
                      <div className="rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center mx-auto text-primary fw-bold" style={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                        🏦
                      </div>
                    )}
                    <label htmlFor="logoInput" className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1 shadow" style={{ width: 28, height: 28, cursor: 'pointer' }} title="Change Logo">
                      <MdFileUpload size={16} />
                    </label>
                    <input id="logoInput" type="file" accept="image/*" className="d-none" onChange={handleLogoUpload} />
                  </div>
                  <div className="text-muted small mt-1" style={{ fontSize: '0.7rem' }}>Company Logo for PDF Statements</div>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Company / Brand Name</label>
                  <input type="text" className="form-control" name="companyName" value={settings.companyName} onChange={handleChange} required />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Tagline</label>
                  <input type="text" className="form-control" name="companyTagline" value={settings.companyTagline} onChange={handleChange} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Official Email Address</label>
                  <input type="email" className="form-control" name="email" value={settings.email} onChange={handleChange} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Customer Helpline Phone</label>
                  <input type="text" className="form-control" name="phone" value={settings.phone} onChange={handleChange} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">GST / Tax Registration Number</label>
                  <input type="text" className="form-control font-monospace text-uppercase" name="gstNumber" value={settings.gstNumber} onChange={handleChange} />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold text-muted">Company Full Address</label>
                  <textarea className="form-control" rows="2" name="address" value={settings.address} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Notification & Communication Gateway Preferences */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-2 d-flex align-items-center gap-2">
                <MdNotifications className="text-primary" /> Smart Notification &amp; Communication Preferences
              </h5>

              <div className="row g-3">
                
                {/* Active Channels */}
                <div className="col-12">
                  <label className="form-label small fw-bold text-dark d-block mb-2">Enabled Reminder Channels</label>
                  <div className="d-flex flex-wrap gap-4">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="swWhatsapp" name="enableWhatsappReminders" checked={settings.enableWhatsappReminders} onChange={handleChange} />
                      <label className="form-check-label small fw-semibold text-dark" htmlFor="swWhatsapp">💬 WhatsApp Instant Messages</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="swEmail" name="enableEmailReminders" checked={settings.enableEmailReminders} onChange={handleChange} />
                      <label className="form-check-label small fw-semibold text-dark" htmlFor="swEmail">✉️ Gmail / Email Statements</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="swSms" name="enableSmsReminders" checked={settings.enableSmsReminders} onChange={handleChange} />
                      <label className="form-check-label small fw-semibold text-muted" htmlFor="swSms">📱 SMS Gateway (Placeholder)</label>
                    </div>
                  </div>
                </div>

                {/* Sender Identity */}
                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">WhatsApp Sender Name / Signature</label>
                  <input type="text" className="form-control" name="whatsappSenderName" value={settings.whatsappSenderName || ''} onChange={handleChange} />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Email Sender Name</label>
                  <input type="text" className="form-control" name="emailSenderName" value={settings.emailSenderName || ''} onChange={handleChange} />
                </div>

                {/* Reminder Schedule & Quiet Hours */}
                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted">Send Reminders In Advance</label>
                  <select className="form-select" name="reminderDaysBefore" value={settings.reminderDaysBefore || '3'} onChange={handleChange}>
                    <option value="1">1 Day Before Due Date</option>
                    <option value="3">3 Days Before Due Date</option>
                    <option value="7">7 Days Before Due Date</option>
                  </select>
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted">Quiet Hours Start</label>
                  <input type="time" className="form-control" name="quietHoursStart" value={settings.quietHoursStart || '21:00'} onChange={handleChange} />
                </div>

                <div className="col-12 col-md-4">
                  <label className="form-label small fw-semibold text-muted">Quiet Hours End</label>
                  <input type="time" className="form-control" name="quietHoursEnd" value={settings.quietHoursEnd || '09:00'} onChange={handleChange} />
                </div>

              </div>
            </div>

            {/* Communication Message Templates Manager */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-3 border-bottom pb-2 d-flex align-items-center gap-2">
                <MdMessage className="text-success" /> Editable Message Templates
              </h5>

              <p className="text-muted small mb-3">
                Customize predefined message templates for Gmail &amp; WhatsApp communications. Available tags: <code>{'{customerName}'}</code>, <code>{'{loanName}'}</code>, <code>{'{amount}'}</code>, <code>{'{dueDate}'}</code>, <code>{'{paidDate}'}</code>, <code>{'{balance}'}</code>, <code>{'{companyName}'}</code>.
              </p>

              {/* Template Tabs */}
              <div className="d-flex overflow-auto gap-2 mb-3 pb-1" style={{ scrollbarWidth: 'none' }}>
                {TEMPLATE_KEYS.map(t => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => handleSelectTemplate(t.key)}
                    className={`btn btn-sm rounded-pill px-3 py-1.5 fw-bold text-nowrap ${activeTmplKey === t.key ? 'btn-primary' : 'btn-outline-secondary'}`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>

              {/* Template Editor */}
              <div className="p-3 bg-light rounded-3 border">
                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Subject Line (For Email / Gmail)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tmplSubject}
                    onChange={e => setTmplSubject(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-bold text-dark">Message Body Template</label>
                  <textarea
                    className="form-control font-monospace"
                    rows="6"
                    style={{ fontSize: '0.85rem' }}
                    value={tmplBody}
                    onChange={e => setTmplBody(e.target.value)}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSaveTemplate}
                  className="btn btn-success btn-sm rounded-3 fw-bold px-3 py-2 d-flex align-items-center gap-1.5"
                >
                  <MdSave size={16} /> Save Template
                </button>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <button type="submit" className="btn btn-primary rounded-3 px-4 py-2.5 fw-bold shadow-sm d-flex align-items-center gap-1.5">
                <MdSave size={18} /> Save All Settings
              </button>
            </div>
          </div>

          {/* Right Column: Backup & Data Management */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <MdSecurity className="text-success" /> Data Persistence &amp; Backup
              </h5>

              <p className="small text-muted mb-4">
                All customer files, loan contracts, communication logs, and template settings are saved locally in your browser's <strong className="text-dark">localStorage</strong>.
              </p>

              <div className="d-flex flex-column gap-3">
                {/* Export Backup */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-dark small mb-1">Export Complete JSON Backup</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Download a complete offline JSON file including communication logs and templates</p>
                  <button type="button" className="btn btn-outline-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5" onClick={() => loanStore.exportBackup()}>
                    <MdDownload size={18} /> Download Backup (.json)
                  </button>
                </div>

                {/* Import Backup */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-dark small mb-1">Restore from JSON File</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Restore database records from a saved backup file</p>
                  <label htmlFor="importBackupInput" className="btn btn-outline-primary btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 cursor-pointer">
                    <MdUploadFile size={18} /> Choose File &amp; Restore
                  </label>
                  <input id="importBackupInput" type="file" accept=".json" className="d-none" onChange={handleImportFile} />
                </div>

                {/* Reset to Demo Seed */}
                <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-3 mt-2">
                  <h6 className="fw-bold text-danger small mb-1">Reset to Default Demo Data</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Re-populate database with default sample loan and communication records</p>
                  <button type="button" className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5" onClick={handleResetDefaults}>
                    <MdRefresh size={18} /> Reset Demo Dataset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

    </div>
  );
};

export default Settings;
