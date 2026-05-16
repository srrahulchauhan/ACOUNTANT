import React, { useState, useEffect } from 'react';
import { MdPerson, MdLock, MdDeleteForever, MdSecurity, MdNotifications, MdLogout, MdCloud, MdCheckCircle, MdAddAPhoto, MdBusiness } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const DEFAULT_CATEGORIES = ['General', 'Sales', 'Services', 'Rent', 'Utilities', 'Salary', 'Other'];

const Settings = () => {
  const { currentUser, userData, updateUserData, updatePassword, logout } = useAuth();
  const navigate = useNavigate();

  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    profilePic: ''
  });
  const [appLogo, setAppLogo] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profileStatus, setProfileStatus] = useState({ loading: false, message: '', error: '' });
  const [passwordStatus, setPasswordStatus] = useState({ loading: false, message: '', error: '' });

  useEffect(() => {
    if (userData) {
      setUserForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        profilePic: userData.profilePic || currentUser?.photoURL || ''
      });
      setAppLogo(userData.appLogo || '');
    }
  }, [userData, currentUser]);

  const handleUserChange = (e) => setUserForm({ ...userForm, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswords({ ...passwords, [e.target.name]: e.target.value });

  const saveProfile = async () => {
    setProfileStatus({ loading: true, message: '', error: '' });
    try {
      await updateUserData({
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        phone: userForm.phone,
        profilePic: userForm.profilePic,
        appLogo: appLogo
      });
      setProfileStatus({ loading: false, message: 'Profile updated successfully!', error: '' });
      setTimeout(() => setProfileStatus({ loading: false, message: '', error: '' }), 3000);
    } catch (err) {
      setProfileStatus({ loading: false, message: '', error: 'Failed to update profile.' });
    }
  };

  const handleUpdatePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordStatus({ loading: false, message: '', error: 'Passwords do not match.' });
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordStatus({ loading: false, message: '', error: 'Password must be at least 6 characters.' });
      return;
    }

    setPasswordStatus({ loading: true, message: '', error: '' });
    try {
      await updatePassword(passwords.newPassword);
      setPasswordStatus({ loading: false, message: 'Password updated successfully!', error: '' });
      setPasswords({ newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordStatus({ loading: false, message: '', error: '' }), 3000);
    } catch (err) {
      setPasswordStatus({ loading: false, message: '', error: err.message || 'Failed to update password.' });
    }
  };

  const handleImageUpload = (e, target) => {
    const file = e.target.files[0];
    if (file) {
      const maxSizeBytes = 20 * 1024 * 1024;
      if (file.size > maxSizeBytes) { 
        alert(`File too large (Max 20MB)`); 
        return; 
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; }
          } else {
            if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          if (target === 'profile') setUserForm({...userForm, profilePic: compressedDataUrl});
          if (target === 'app') setAppLogo(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) { console.error(error); }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Permanently delete account? This cannot be undone.")) {
      localStorage.removeItem('account_transactions');
      localStorage.removeItem('account_customers');
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { id: 'profile', name: 'Profile', icon: <MdPerson /> },
    { id: 'security', name: 'Security', icon: <MdLock /> },
    { id: 'management', name: 'Account', icon: <MdSecurity /> },
    { id: 'sync', name: 'Data', icon: <MdCloud /> },
  ];

  return (
    <div className="container-fluid py-3 px-3 px-md-4">
      <div className="d-flex align-items-center justify-content-between mb-4">
        <h4 className="fw-bold mb-0">Settings & Profile</h4>
        <div className="d-flex gap-2">
           <button className="btn btn-light btn-sm px-3 rounded-pill" onClick={() => navigate('/')}>Dashboard</button>
           <button className="btn btn-outline-danger btn-sm px-3 rounded-pill" onClick={handleSignOut}>Sign Out</button>
        </div>
      </div>

      <div className="row g-3">
        {/* Sidebar Navigation */}
        <div className="col-12 col-md-3">
          <div className="card modern-card p-2 shadow-sm border-0">
            <div className="nav flex-column gap-1">
              {menuItems.map(item => (
                <button 
                  key={item.id} 
                  className={`nav-link text-start d-flex align-items-center gap-3 px-3 py-2 rounded-3 border-0 transition-all ${activeTab === item.id ? 'btn-primary text-white shadow-sm' : 'bg-transparent text-muted fw-semibold'}`}
                  style={{fontSize: '0.9rem'}}
                  onClick={() => setActiveTab(item.id)}
                >
                  <span className="fs-5">{item.icon}</span>
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="col-12 col-md-9">
          <div className="card modern-card p-3 p-md-4 shadow-sm border-0 min-vh-50">
            
            {activeTab === 'profile' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-primary bg-opacity-10 text-primary p-2 rounded-3">
                    <MdPerson size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Profile & Branding</h5>
                    <p className="text-muted small mb-0">Update your identity and business appearance</p>
                  </div>
                </div>

                {profileStatus.message && (
                  <div className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3 border-0 bg-success bg-opacity-10 text-success">
                    <MdCheckCircle /> {profileStatus.message}
                  </div>
                )}

                <div className="row g-3">
                  {/* Photo Uploads */}
                  <div className="col-12 col-lg-6">
                    <div className="p-3 rounded-4 bg-light border border-dashed text-center">
                      <div className="position-relative d-inline-block mb-2">
                        {userForm.profilePic ? (
                          <img src={userForm.profilePic} alt="P" className="rounded-circle shadow-sm" style={{ width: 80, height: 80, objectFit: 'cover', border: '3px solid #fff' }} />
                        ) : (
                          <div className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm fw-bold" style={{ width: 80, height: 80, fontSize: '1.5rem', border: '3px solid #fff' }}>
                            {userForm.firstName?.charAt(0) || 'U'}
                          </div>
                        )}
                        <label className="position-absolute bottom-0 end-0 bg-white shadow-sm rounded-circle p-1 cursor-pointer" style={{transform: 'translate(5px, 5px)'}}>
                          <MdAddAPhoto className="text-primary" size={16} />
                          <input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, 'profile')} />
                        </label>
                      </div>
                      <h6 className="small fw-bold mb-1">Profile Photo</h6>
                      <p className="text-muted x-small mb-0">Personalize your account</p>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6">
                    <div className="p-3 rounded-4 bg-light border border-dashed text-center">
                      <div className="position-relative d-inline-block mb-2">
                        {appLogo ? (
                          <img src={appLogo} alt="L" className="rounded-3 shadow-sm bg-white" style={{ width: 80, height: 80, objectFit: 'contain', padding: '10px' }} />
                        ) : (
                          <div className="rounded-3 bg-white text-primary d-flex align-items-center justify-content-center shadow-sm fw-bold border" style={{ width: 80, height: 80, fontSize: '1.5rem' }}>
                            <MdBusiness />
                          </div>
                        )}
                        <label className="position-absolute bottom-0 end-0 bg-white shadow-sm rounded-circle p-1 cursor-pointer" style={{transform: 'translate(5px, 5px)'}}>
                          <MdAddAPhoto className="text-primary" size={16} />
                          <input type="file" className="d-none" accept="image/*" onChange={(e) => handleImageUpload(e, 'app')} />
                        </label>
                      </div>
                      <h6 className="small fw-bold mb-1">Business Logo</h6>
                      <p className="text-muted x-small mb-0">Appears on your navbar</p>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">First Name</label>
                    <input type="text" className="form-control form-control-custom py-2" name="firstName" value={userForm.firstName} onChange={handleUserChange} style={{fontSize: '0.9rem'}} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Last Name</label>
                    <input type="text" className="form-control form-control-custom py-2" name="lastName" value={userForm.lastName} onChange={handleUserChange} style={{fontSize: '0.9rem'}} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Phone Number</label>
                    <input type="text" className="form-control form-control-custom py-2" name="phone" value={userForm.phone} onChange={handleUserChange} style={{fontSize: '0.9rem'}} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-bold text-muted">Email Address</label>
                    <input type="email" className="form-control form-control-custom py-2 bg-light text-muted" value={currentUser?.email || ''} disabled readOnly style={{fontSize: '0.9rem'}} />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-top text-end">
                  <button className="btn btn-primary px-4 py-2 rounded-pill fw-bold shadow-sm" onClick={saveProfile} disabled={profileStatus.loading}>
                    {profileStatus.loading ? 'Saving...' : 'Update Profile'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-danger bg-opacity-10 text-danger p-2 rounded-3">
                    <MdLock size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Security Settings</h5>
                    <p className="text-muted small mb-0">Keep your account safe and secure</p>
                  </div>
                </div>

                {passwordStatus.message && (
                  <div className="alert alert-success py-2 px-3 small mb-3 border-0 bg-success bg-opacity-10 text-success">
                    <MdCheckCircle /> {passwordStatus.message}
                  </div>
                )}
                {passwordStatus.error && (
                  <div className="alert alert-danger py-2 px-3 small mb-3 border-0 bg-danger bg-opacity-10 text-danger">
                    {passwordStatus.error}
                  </div>
                )}

                <div className="p-3 p-md-4 rounded-4 bg-light">
                  <h6 className="fw-bold mb-3">Change Password</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">New Password</label>
                      <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} className="form-control form-control-custom bg-white py-2" placeholder="••••••••" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-bold text-muted">Confirm Password</label>
                      <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} className="form-control form-control-custom bg-white py-2" placeholder="••••••••" />
                    </div>
                  </div>
                  <button className="btn btn-dark mt-3 px-4 rounded-pill fw-bold btn-sm" onClick={handleUpdatePassword} disabled={passwordStatus.loading}>
                    {passwordStatus.loading ? 'Updating...' : 'Save New Password'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'management' && (
              <div className="animate-fade-in">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-warning bg-opacity-10 text-warning p-2 rounded-3">
                    <MdSecurity size={24} />
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0">Account Management</h5>
                    <p className="text-muted small mb-0">Data control and account actions</p>
                  </div>
                </div>

                <div className="p-3 p-md-4 rounded-4 border border-danger border-opacity-25 bg-danger bg-opacity-5">
                   <div className="d-flex align-items-start gap-3">
                      <div className="bg-white p-2 rounded-circle shadow-sm text-danger">
                        <MdDeleteForever size={24} />
                      </div>
                      <div>
                        <h6 className="fw-bold text-danger mb-1">Permanently Delete Account</h6>
                        <p className="text-muted small mb-3">This will wipe all your transactions, customers, and personal data from this browser. This action is irreversible.</p>
                        <button className="btn btn-danger btn-sm px-4 rounded-pill fw-bold" onClick={handleDeleteAccount}>Wipe All Data & Delete</button>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'sync' && (
              <div className="animate-fade-in text-center py-5">
                <div className="d-inline-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary rounded-circle mb-3" style={{ width: 64, height: 64 }}>
                  <MdCloud size={32} />
                </div>
                <h5 className="fw-bold">Local Data Storage</h5>
                <p className="text-muted small mx-auto" style={{maxWidth: '300px'}}>Your data is currently stored locally in this browser. We are working on cloud backup features for future releases.</p>
                <div className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill mt-2">
                  <MdCheckCircle className="me-1" /> Data Saved Locally
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <style>{`
        .x-small { font-size: 0.65rem; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.2s ease; }
        .min-vh-50 { min-height: 50vh; }
        .border-dashed { border-style: dashed !important; border-width: 2px !important; border-color: var(--border-color) !important; }
      `}</style>
    </div>
  );
};

export default Settings;
