import React, { useState, useEffect } from 'react';
import { MdPerson, MdLock, MdDeleteForever, MdSecurity, MdNotifications, MdLogout, MdCloud, MdCheckCircle, MdCameraAlt, MdDelete } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

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
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 400;
          const MAX_HEIGHT = 400;
          let width = img.width;
          let height = img.height;
          if (width > height) {
            if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
          } else {
            if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          if (target === 'profile') setUserForm({...userForm, profilePic: compressedDataUrl});
          if (target === 'app') setAppLogo(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignOut = async () => {
    try { await logout(); navigate('/login'); } catch (error) { console.error(error); }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Permanently delete account? This cannot be undone.")) {
       alert("In a real app, this would delete your data. Functionality restricted for demo.");
    }
  };

  const menuItems = [
    { id: 'profile', name: 'Profile & Branding', icon: <MdPerson /> },
    { id: 'security', name: 'Security', icon: <MdLock /> },
    { id: 'management', name: 'Account Status', icon: <MdSecurity /> },
    { id: 'sync', name: 'Cloud & Sync', icon: <MdCloud /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h2>
           <p className="text-sm font-medium text-gray-500">Manage your profile and account preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Nav */}
        <div className="lg:col-span-3 space-y-2">
           <div className="bg-white p-3 rounded-[2rem] shadow-premium border border-gray-100 flex lg:flex-col overflow-x-auto no-scrollbar gap-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all whitespace-nowrap lg:w-full ${activeTab === item.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}
                >
                   <span className="text-xl">{item.icon}</span>
                   <span className="text-sm">{item.name}</span>
                </button>
              ))}
              <div className="hidden lg:block my-2 h-px bg-gray-50 mx-4"></div>
              <button 
                onClick={handleSignOut}
                className="flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 transition-all lg:w-full"
              >
                 <MdLogout size={20} />
                 <span className="text-sm">Sign Out</span>
              </button>
           </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9">
           <div className="bg-white p-8 sm:p-12 rounded-[2.5rem] shadow-premium border border-gray-100 min-h-[500px]">
              
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-10 animate-in slide-in-from-right-4">
                   <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8">
                      <div className="relative group">
                         <div className="w-28 h-28 rounded-[2rem] bg-gray-100 overflow-hidden border-4 border-white shadow-premium">
                            {userForm.profilePic ? (
                               <img src={userForm.profilePic} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                               <div className="w-full h-full flex items-center justify-center text-3xl font-black text-primary">
                                  {userForm.firstName?.charAt(0) || 'U'}
                               </div>
                            )}
                         </div>
                         <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-white rounded-xl shadow-lg border-2 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                            <MdCameraAlt size={18} />
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'profile')} />
                         </label>
                      </div>
                      <div>
                         <h4 className="text-xl font-black text-gray-900">Profile Picture</h4>
                         <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Recommended size 400x400 JPG/PNG</p>
                         <button onClick={() => setUserForm({...userForm, profilePic: ''})} className="mt-3 text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Remove Photo</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                         <input type="text" name="firstName" value={userForm.firstName} onChange={handleUserChange} className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                         <input type="text" name="lastName" value={userForm.lastName} onChange={handleUserChange} className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                         <input type="text" name="phone" value={userForm.phone} onChange={handleUserChange} className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="space-y-2 opacity-60">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address (Read Only)</label>
                         <input type="text" value={currentUser?.email} disabled className="block w-full px-5 py-4 bg-gray-100 border-2 border-transparent rounded-2xl text-sm font-bold" />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                      <p className={`text-xs font-bold ${profileStatus.error ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {profileStatus.message || profileStatus.error}
                      </p>
                      <button onClick={saveProfile} disabled={profileStatus.loading} className="px-10 py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary-dark hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50">
                         {profileStatus.loading ? 'Saving...' : 'Save Profile Changes'}
                      </button>
                   </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-10 animate-in slide-in-from-right-4">
                   <div className="space-y-4">
                      <h4 className="text-xl font-black text-gray-900">Change Password</h4>
                      <p className="text-sm font-medium text-gray-500">Update your security credentials</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-8 rounded-[2.5rem]">
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                         <input type="password" name="newPassword" value={passwords.newPassword} onChange={handlePasswordChange} placeholder="••••••••" className="block w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all shadow-sm" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                         <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handlePasswordChange} placeholder="••••••••" className="block w-full px-5 py-4 bg-white border-2 border-transparent rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all shadow-sm" />
                      </div>
                   </div>

                   <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                      <p className={`text-xs font-bold ${passwordStatus.error ? 'text-rose-500' : 'text-emerald-500'}`}>
                         {passwordStatus.message || passwordStatus.error}
                      </p>
                      <button onClick={handleUpdatePassword} disabled={passwordStatus.loading} className="px-10 py-4 bg-gray-900 text-white rounded-2xl font-black shadow-xl shadow-gray-200 hover:bg-gray-800 transition-all disabled:opacity-50">
                         Update Security
                      </button>
                   </div>
                </div>
              )}

              {/* Account Management */}
              {activeTab === 'management' && (
                 <div className="space-y-10 animate-in slide-in-from-right-4">
                    <div className="bg-rose-50 border border-rose-100 rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-5">
                          <MdDelete size={120} className="text-rose-900" />
                       </div>
                       <div className="relative z-1 space-y-4">
                          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-rose-500 shadow-sm border border-rose-100">
                             <MdDeleteForever size={32} />
                          </div>
                          <h4 className="text-2xl font-black text-rose-900">Danger Zone</h4>
                          <p className="text-sm font-bold text-rose-700/70 max-w-md leading-relaxed">
                             Deleting your account will permanently wipe all your transactions, customers, and personal data. This action is irreversible.
                          </p>
                          <button onClick={handleDeleteAccount} className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-600 transition-all">
                             Delete My Account
                          </button>
                       </div>
                    </div>
                 </div>
              )}

              {/* Cloud Sync */}
              {activeTab === 'sync' && (
                 <div className="flex flex-col items-center justify-center h-[400px] space-y-6 animate-in slide-in-from-right-4">
                    <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center text-emerald-500 shadow-sm">
                       <MdCloud size={48} />
                    </div>
                    <div className="text-center">
                       <h4 className="text-xl font-black text-gray-900">Cloud Sync Active</h4>
                       <p className="text-sm font-medium text-gray-400 mt-1">Your data is secured in real-time</p>
                    </div>
                    <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                       <MdCheckCircle size={14} /> All data is synchronized
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
