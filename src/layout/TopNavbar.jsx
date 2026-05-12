import React, { useState, useEffect, useRef } from 'react';
import { MdMenu, MdSearch, MdCloudDone, MdDownload } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import { fetchTransactions } from '../api';
import { useAuth } from '../context/AuthContext';


const TopNavbar = ({ toggleSidebar }) => {
  const { currentUser, userData, logout } = useAuth();
  const user = userData || {};
  const navigate = useNavigate();

  // Smart Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch all transactions once for smart search
    const getTxns = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data || []);
      } catch (err) { console.error('Search fetch error:', err); }
    };
    getTxns();
  }, []);

  useEffect(() => {
    // Click outside to close search dropdown
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.trim().length > 0) {
      const lowerQuery = query.toLowerCase();
      const results = transactions.filter(t => 
        (t.name && t.name.toLowerCase().includes(lowerQuery)) ||
        (t.lastName && t.lastName.toLowerCase().includes(lowerQuery)) ||
        (t.description && t.description.toLowerCase().includes(lowerQuery)) ||
        (t.amount && t.amount.toString().includes(lowerQuery))
      ).slice(0, 6); // Keep top 6 results
      setSearchResults(results);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      setShowDropdown(false);
      navigate(`/statements?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleResultClick = (item) => {
    setShowDropdown(false);
    navigate(`/statements?search=${encodeURIComponent(item.name)}`);
    setSearchQuery('');
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
    <nav 
      className="navbar navbar-expand bg-card sticky-top px-4 align-items-center justify-content-between"
      style={{ height: 'var(--navbar-height)', borderBottom: '1px solid var(--border-color)', zIndex: 1030 }}
    >
      <div className="d-flex align-items-center">
        <button className="btn btn-link text-main p-0 me-3" onClick={toggleSidebar} style={{ color: 'var(--text-main)' }}>
          <MdMenu size={28} />
        </button>
        <div className="d-none d-lg-flex align-items-center gap-2">
          <img src="/src/assets/logo.png" alt="R Logo" style={{ height: '32px', width: '32px', objectFit: 'contain' }} />
          <h4 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>
            Account <span className="text-secondary" style={{ fontWeight: 500 }}>Manager</span>
          </h4>
        </div>
      </div>

      <div className="d-flex flex-grow-1 justify-content-center px-4">
        <div className="input-group position-relative shadow-sm" style={{ maxWidth: '400px', borderRadius: '24px', background: '#f8f9fa' }} ref={searchRef}>
          <span className="input-group-text bg-transparent border-0 pe-2">
            <MdSearch size={20} className="text-primary" />
          </span>
          <input 
            type="text" 
            className="form-control bg-transparent border-0 ps-1 box-shadow-none" 
            placeholder="Search by name, ₹ amount..." 
            style={{ boxShadow: 'none', fontSize: '0.9rem' }}
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchSubmit}
          />
        </div>
      </div>

      <div className="d-flex align-items-center gap-3">
        {/* Screenshot Style LIVE Badge */}
        <div className="d-flex align-items-center gap-2 px-2 py-1 rounded-pill" style={{ backgroundColor: '#f0fdf4', border: '1px solid #dcfce7' }}>
          <div style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%' }}></div>
          <span className="fw-bold text-success" style={{ fontSize: '0.65rem' }}>LIVE</span>
        </div>

        {/* Screenshot Style Download Icon */}
        <button 
          className="btn btn-link p-0 text-success border-0 box-shadow-none d-flex align-items-center justify-content-center" 
          title="Download Backup"
          style={{ width: '32px', height: '32px', backgroundColor: '#f0fdf4', borderRadius: '8px' }}
        >
          <MdDownload size={18} />
        </button>

        <NotificationBell transactions={transactions} />
        
        <div className="dropdown">
          <button 
            className="btn btn-link p-0 dropdown-toggle text-decoration-none d-flex align-items-center" 
            type="button" id="profileDropdown" data-bs-toggle="dropdown" aria-expanded="false"
            style={{ color: 'var(--text-main)' }}
          >
            <img 
              src={user.profilePic || `https://ui-avatars.com/api/?name=${user.firstName ? encodeURIComponent(user.firstName + ' ' + (user.lastName || '')) : 'User'}&background=0d6efd&color=fff`} 
              alt="Profile" className="rounded-circle border border-2 border-primary" width="35" height="35" style={{objectFit: 'cover'}}
            />
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow border-0" aria-labelledby="profileDropdown">
            <li><button className="dropdown-item">Profile</button></li>
            <li><button className="dropdown-item">Settings</button></li>
            <li><hr className="dropdown-divider" /></li>
            <li><button className="dropdown-item text-danger" onClick={handleLogout}>Logout</button></li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default TopNavbar;
