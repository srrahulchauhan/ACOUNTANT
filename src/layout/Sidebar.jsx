import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
    MdDashboard, MdPeople, MdAddCircle, MdListAlt, MdBarChart, 
    MdEvent, MdSettings, MdLogout, MdPayment, MdClose
} from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Sidebar = ({ closeMobileSidebar }) => {
  const { currentUser, userData, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
    }
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <MdDashboard size={22} /> },
    { name: 'Customers', path: '/customers', icon: <MdPeople size={22} /> },
    { name: 'EMI Dashboard', path: '/emi-dashboard', icon: <MdPayment size={22} /> },
    { name: 'New Entry', path: '/new-entry', icon: <MdAddCircle size={22} /> },
    { name: 'Statements', path: '/statements', icon: <MdListAlt size={22} /> },
    { name: 'Reports', path: '/reports', icon: <MdBarChart size={22} /> },
    { name: 'Calendar', path: '/calendar', icon: <MdEvent size={22} /> },
    { name: 'Settings', path: '/settings', icon: <MdSettings size={22} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100 shadow-sm w-[var(--sidebar-width)]">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-6 h-[var(--navbar-height)] border-b border-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center p-1.5 shadow-sm">
            <img src={logo} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Account <span className="text-primary">M.</span></h2>
        </div>
        <button 
          onClick={closeMobileSidebar}
          className="p-1.5 text-gray-400 hover:text-gray-600 lg:hidden rounded-lg hover:bg-gray-100 transition-colors"
        >
          <MdClose size={20} />
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-grow overflow-y-auto py-6 px-4">
        <p className="px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Main Menu</p>
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink 
              key={item.name}
              to={item.path} 
              onClick={closeMobileSidebar}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                ${isActive 
                  ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-primary'}
              `}
            >
              <span className={`transition-transform duration-300 group-hover:scale-110`}>
                {item.icon}
              </span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer - User Profile */}
      <div className="p-4 border-t border-gray-50 mt-auto bg-gray-50/50">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="relative">
            <img 
              src={userData?.profilePic || currentUser?.photoURL || `https://ui-avatars.com/api/?name=${userData?.firstName || 'User'}&background=0d6efd&color=fff`} 
              alt="User" 
              className="w-10 h-10 rounded-xl object-cover border-2 border-white shadow-sm"
            />
            <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>
          <div className="flex-grow min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{userData?.firstName || 'Accountant'}</p>
            <p className="text-[11px] text-gray-500 truncate">{currentUser?.email}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors group"
        >
          <MdLogout size={18} className="group-hover:-translate-x-1 transition-transform" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
