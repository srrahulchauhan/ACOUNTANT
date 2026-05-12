import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdSearch, MdCloudDone, MdDownload, MdPerson, MdSettings, MdLogout } from 'react-icons/md';
import { useNavigate, Link } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { fetchTransactions } from '../api';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const TopNavbar = ({ toggleSidebar }) => {
  const { currentUser, userData, logout } = useAuth();
  const user = userData || {};
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const getTxns = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data || []);
      } catch (err) { console.error('Search fetch error:', err); }
    };
    getTxns();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/statements?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 bg-white border-b border-gray-100 shadow-sm h-[var(--navbar-height)]">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleSidebar}
          className="p-2 text-gray-500 transition-colors rounded-lg hover:bg-gray-100 hover:text-primary lg:hidden"
        >
          <MdMenu size={24} />
        </button>
        
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 p-1.5 bg-blue-50 rounded-xl">
            <img src={logo} alt="Account Manager" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">Account <span className="text-primary font-semibold">Manager</span></h1>
            <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mt-0.5">Finance Suite</p>
          </div>
        </div>
      </div>

      {/* Middle Section - Search */}
      <div className="flex-grow max-w-xl px-4">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MdSearch size={20} className="text-gray-400 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-transparent rounded-2xl text-sm placeholder-gray-400 focus:bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all outline-none"
            placeholder="Search transactions, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-emerald-700 tracking-wider">LIVE</span>
        </div>

        {/* Action Icons */}
        <button className="p-2.5 text-gray-500 bg-gray-50 rounded-xl hover:bg-gray-100 hover:text-primary transition-all relative">
           <MdDownload size={20} />
        </button>

        <NotificationBell transactions={transactions} />

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full border border-gray-100 hover:border-primary/30 transition-all focus:ring-4 focus:ring-primary/10"
          >
            <img 
              src={user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName ? encodeURIComponent(user.firstName) : 'User'}&background=0d6efd&color=fff`} 
              alt="Profile" 
              className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-premium border border-gray-100 py-2 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
              </div>
              
              <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                <MdPerson size={18} />
                Profile
              </Link>
              <Link to="/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-primary transition-colors">
                <MdSettings size={18} />
                Settings
              </Link>
              <hr className="my-1 border-gray-50" />
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <MdLogout size={18} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
