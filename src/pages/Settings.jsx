import React, { useState, useEffect } from 'react';
import { 
  MdSettings, MdBusiness, MdSave, MdDownload, 
  MdUploadFile, MdRefresh, MdFileUpload, MdSecurity,
  MdCloudDone, MdSync, MdCode, MdContentCopy, MdOpenInNew, MdCheckCircle
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';
import { googleSheetsSync } from '../utils/googleSheetsSync';

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
    defaultLateFee: 350,
    autoSendReminders: true,
  });

  const [webAppUrl, setWebAppUrl] = useState(googleSheetsSync.getWebAppUrl());
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  useEffect(() => {
    setSettings(loanStore.getSettings());
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
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
    googleSheetsSync.setWebAppUrl(webAppUrl);
    alert('✓ App & Google Sheets Settings saved successfully!');
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
      loanStore.resetDefaults();
      alert('✓ Reset to default demo data.');
    }
  };

  const appsScriptCodeSnippet = `/**
 * Google Apps Script for RC Accountant (Spreadsheet ID: 1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM)
 */
const SPREADSHEET_ID = "1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM";

function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  if (action === "FETCH_ALL") {
    var result = {
      customers: getSheetRows(ss, "Customers"),
      loans: getSheetRows(ss, "Loans"),
      payments: getSheetRows(ss, "EMI Payments"),
      reminders: getSheetRows(ss, "Reminders")
    };
    return ContentService.createTextOutput(JSON.stringify({ status: "success", data: result })).setMimeType(ContentService.MimeType.JSON);
  }
  return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "RC Accountant Script Active" })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var tabName = payload.tab;
    var data = payload.data;
    processAction(ss, action, tabName, data);
    return ContentService.createTextOutput(JSON.stringify({ status: "success" })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

function processAction(ss, action, tabName, data) {
  var sheet = ss.getSheetByName(tabName) || ss.insertSheet(tabName);
  if (action === "CREATE") sheet.appendRow(Object.values(data));
}`;

  const copyAppsScript = () => {
    navigator.clipboard.writeText(appsScriptCodeSnippet);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1 d-flex align-items-center gap-2">
            <MdSettings className="text-primary" /> System Settings & Configuration
          </h4>
          <p className="text-muted small mb-0">Manage company details, late fee rules, and Google Sheets cloud integration</p>
        </div>
      </div>

      {/* Google Sheets Integration Top Banner */}
      <div className="card border-0 shadow-sm rounded-4 p-3 bg-white mb-4" style={{ borderLeft: '5px solid #10b981' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="bg-success bg-opacity-10 text-success p-2.5 rounded-3">
              <MdCloudDone size={28} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-0">Google Sheets Database Integration</h6>
              <small className="text-muted">Target Sheet ID: <span className="font-monospace text-primary">1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM</span></small>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <a 
              href="https://docs.google.com/spreadsheets/d/1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM/edit?usp=sharing" 
              target="_blank" 
              rel="noreferrer"
              className="btn btn-outline-success btn-sm rounded-3 fw-bold d-flex align-items-center gap-1"
            >
              <MdOpenInNew size={16} /> Open Google Sheet
            </a>
            <button 
              type="button" 
              className="btn btn-primary btn-sm rounded-3 fw-bold d-flex align-items-center gap-1"
              onClick={() => setShowCodeModal(true)}
            >
              <MdCode size={16} /> View Apps Script Code
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="row g-4">
          {/* Main Settings Form */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
              <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Company Branding & Letterhead Setup</h5>

              <div className="row g-3">
                <div className="col-12 text-center mb-3">
                  <div className="position-relative d-inline-block">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="rounded-3 border p-1 shadow-2xs" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    ) : (
                      <div className="rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center mx-auto text-primary fw-bold" style={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                        RC
                      </div>
                    )}
                    <label htmlFor="companyLogoUpload" className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-1 shadow" style={{ width: 28, height: 28, cursor: 'pointer' }} title="Upload Logo">
                      <MdFileUpload size={16} />
                    </label>
                    <input id="companyLogoUpload" type="file" accept="image/*" className="d-none" onChange={handleLogoUpload} />
                  </div>
                  <small className="d-block text-muted mt-1">Statement & Letterhead Brand Logo</small>
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Company Name *</label>
                  <input type="text" className="form-control fw-bold" name="companyName" value={settings.companyName} onChange={handleChange} required />
                </div>

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Tagline / Slogan</label>
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

                <div className="col-12 col-md-6">
                  <label className="form-label small fw-semibold text-muted">Default Late Fee Penalty (₹)</label>
                  <input type="number" className="form-control fw-bold text-danger" name="defaultLateFee" value={settings.defaultLateFee} onChange={handleChange} />
                </div>

                <div className="col-12">
                  <label className="form-label small fw-semibold text-muted">Company Full Address</label>
                  <textarea className="form-control" rows="2" name="address" value={settings.address} onChange={handleChange}></textarea>
                </div>
              </div>
            </div>

            {/* Google Apps Script Web App Integration Config Card */}
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2 border-bottom pb-2">
                <MdSync className="text-primary" /> Google Apps Script Web App URL
              </h5>
              <p className="small text-muted mb-3">
                Paste your deployed Google Apps Script Web App Endpoint URL below to synchronize all Customer, Loan, and EMI data with your Google Sheet.
              </p>

              <div className="mb-3">
                <label className="form-label small fw-semibold text-muted">Google Apps Script Web App Endpoint URL</label>
                <input 
                  type="url" 
                  className="form-control font-monospace" 
                  placeholder="https://script.google.com/macros/s/.../exec" 
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                />
                <small className="text-muted" style={{ fontSize: '0.7rem' }}>Will send live POST updates to tabs: Customers, Loans, EMI Payments, Reminders, Settings</small>
              </div>

              <div className="d-flex justify-content-end">
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5">
                  <MdSave size={18} /> Save Settings & Web App URL
                </button>
              </div>
            </div>
          </div>

          {/* Backup & Data Management Side Card */}
          <div className="col-12 col-lg-4">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <MdSecurity className="text-success" /> Data Persistence & Backup
              </h5>

              <p className="small text-muted mb-4">
                All customer files, loan contracts, and EMI payment ledgers are saved locally in your browser's <strong className="text-dark">localStorage</strong> and synced to Google Sheets.
              </p>

              <div className="d-flex flex-column gap-3">
                {/* Export Backup */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-dark small mb-1">Export Complete JSON Backup</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Download a complete offline JSON file of all data</p>
                  <button type="button" className="btn btn-outline-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5" onClick={() => loanStore.exportBackup()}>
                    <MdDownload size={18} /> Download Backup (.json)
                  </button>
                </div>

                {/* Import Backup */}
                <div className="p-3 bg-light rounded-3 border">
                  <h6 className="fw-bold text-dark small mb-1">Restore from JSON File</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Restore database records from a saved backup file</p>
                  <label htmlFor="importBackupInput" className="btn btn-outline-primary btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5 cursor-pointer">
                    <MdUploadFile size={18} /> Choose File & Restore
                  </label>
                  <input id="importBackupInput" type="file" accept=".json" className="d-none" onChange={handleImportFile} />
                </div>

                {/* Reset to Demo Seed */}
                <div className="p-3 bg-danger bg-opacity-10 border border-danger border-opacity-20 rounded-3 mt-2">
                  <h6 className="fw-bold text-danger small mb-1">Reset to Default Demo Data</h6>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>Re-populate database with default sample loan records</p>
                  <button type="button" className="btn btn-danger btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-1.5" onClick={handleResetDefaults}>
                    <MdRefresh size={18} /> Reset Demo Dataset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Google Apps Script Code Viewer Modal */}
      {showCodeModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg rounded-4">
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                  <MdCode className="text-primary" size={24} /> Google Apps Script Deployment Code
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowCodeModal(false)}></button>
              </div>
              <div className="modal-body py-3">
                <ol className="small text-muted mb-3">
                  <li>Open your Google Sheet: <a href="https://docs.google.com/spreadsheets/d/1sPsulYHlyYIh1J7SljlhAp5cm29MR0cwHOGSoFVyCMM/edit" target="_blank" rel="noreferrer">Open Sheet</a></li>
                  <li>Click <strong>Extensions &gt; Apps Script</strong>.</li>
                  <li>Copy and paste the code below into <strong>Code.gs</strong>.</li>
                  <li>Click <strong>Deploy &gt; New deployment &gt; Type: Web app &gt; Access: Anyone</strong>.</li>
                  <li>Copy the Web App URL and paste it in Settings.</li>
                </ol>

                <div className="position-relative bg-dark text-light p-3 rounded-3 font-monospace small" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  <button 
                    type="button" 
                    className="btn btn-light btn-sm position-absolute top-0 end-0 m-2 fw-bold d-flex align-items-center gap-1"
                    onClick={copyAppsScript}
                  >
                    {copiedCode ? <MdCheckCircle className="text-success" /> : <MdContentCopy />}
                    {copiedCode ? 'Copied!' : 'Copy Code'}
                  </button>
                  <pre className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>{appsScriptCodeSnippet}</pre>
                </div>
              </div>
              <div className="modal-footer border-0 pt-0">
                <button type="button" className="btn btn-light rounded-pill px-4" onClick={() => setShowCodeModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
