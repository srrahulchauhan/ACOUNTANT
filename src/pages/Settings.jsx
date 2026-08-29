import React, { useState, useEffect } from 'react';
import { 
  MdSettings, MdBusiness, MdSave, MdDownload, 
  MdUploadFile, MdRefresh, MdFileUpload, MdSecurity
} from 'react-icons/md';
import { loanStore } from '../utils/loanStore';

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
    alert('✓ App & Company Settings saved successfully!');
  };

  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const success = loanStore.importBackup(event.target.result);
        if (success) {
          alert('✓ Data backup restored successfully!');
          window.location.reload();
        } else {
          alert('❌ Failed to restore data backup file. Invalid format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all data to default demo datasets? This will overwrite your current entries.')) {
      loanStore.resetToDefaults();
      alert('✓ Data reset to default demo dataset.');
      window.location.reload();
    }
  };

  return (
    <div className="container-fluid py-4 px-3 px-md-4 bg-light page-transition" style={{ minHeight: '100vh' }}>
      
      {/* Header */}
      <div className="d-flex align-items-center justify-content-between mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">System & Company Settings</h4>
          <p className="text-muted small mb-0">Customize letterhead details, late fee rules, and manage JSON data backup & restore</p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="row g-4 mb-4">
          
          {/* Company Profile Settings */}
          <div className="col-12 col-lg-8">
            <div className="card border-0 shadow-sm rounded-4 p-4 bg-white">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 border-bottom pb-2">
                <MdBusiness className="text-primary" /> Company Branding & Letterhead Setup
              </h5>

              <div className="row g-3">
                <div className="col-12 text-center mb-3">
                  <div className="d-inline-block position-relative">
                    {settings.companyLogo ? (
                      <img src={settings.companyLogo} alt="Logo" className="rounded-3 border p-1 shadow-2xs" style={{ width: 80, height: 80, objectFit: 'contain' }} />
                    ) : (
                      <div className="rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 d-flex align-items-center justify-content-center mx-auto text-primary fw-bold" style={{ width: 80, height: 80, fontSize: '1.8rem' }}>
                        EL
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

              <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-bold shadow-sm d-flex align-items-center gap-1.5">
                  <MdSave size={18} /> Save Settings
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
                All customer files, loan contracts, and EMI payment ledgers are saved locally in your browser's <strong className="text-dark">localStorage</strong>.
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
    </div>
  );
};

export default Settings;
