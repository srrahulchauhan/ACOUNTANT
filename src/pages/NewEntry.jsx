import React, { useState, useEffect } from 'react';
import { MdPerson, MdDateRange, MdAttachMoney, MdDescription, MdSave, MdPayment, MdAdd, MdClose, MdArrowBack } from 'react-icons/md';
import { createTransaction, fetchTransactions } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_APPS, CUSTOM_COLORS } from '../utils/paymentApps';

const DEFAULT_CATEGORIES = ['General', 'Sales', 'Services', 'Rent', 'Utilities', 'Salary', 'Other'];

const NewEntry = () => {
  const navigate = useNavigate();
  const { updateUserData, customCategories, customPaymentApps } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    amount: '',
    type: 'Credit',
    category: 'General',
    description: '',
    date: getLocalDateString(),
    loanDate: getLocalDateString(),
    dueDate: getLocalDateString(new Date().setMonth(new Date().getMonth() + 1)),
    interestRate: '',
    loanDuration: '',
    paymentMethod: 'Cash',
    paymentApp: ''
  });
  const [loading, setLoading] = useState(false);
  const [showAddMode, setShowAddMode] = useState(false);
  const [newModeName, setNewModeName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [lastEntry, setLastEntry] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchTransactions();
        setTransactions(res.data);
      } catch (err) { console.error(err); }
    };
    load();
  }, []);

  useEffect(() => {
    if (!formData.name.trim()) {
      setLastEntry(null);
      return;
    }
    const name = formData.name.trim().toLowerCase();
    const lastName = formData.lastName.trim().toLowerCase();
    
    const matches = transactions.filter(t => {
      const tName = (t.name || '').trim().toLowerCase();
      const tLastName = (t.lastName || '').trim().toLowerCase();
      if (lastName) {
        return tName === name && tLastName === lastName;
      }
      return tName === name;
    });

    if (matches.length > 0) {
      const latest = matches.reduce((prev, curr) => {
        return new Date(curr.date) > new Date(prev.date) ? curr : prev;
      });
      setLastEntry(latest);
    } else {
      setLastEntry(null);
    }
  }, [formData.name, formData.lastName, transactions]);

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const allApps = [
    ...DEFAULT_APPS,
    ...customPaymentApps.map((app, i) => ({
      id: app.name,
      label: app.name,
      color: app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length],
      logo: (
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-sm" style={{ backgroundColor: app.color || CUSTOM_COLORS[i % CUSTOM_COLORS.length] }}>
          {app.name.charAt(0).toUpperCase()}
        </div>
      )
    }))
  ];

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleAddCustomMode = async () => {
    const trimmed = newModeName.trim();
    if (!trimmed) return;
    if (allApps.some(a => a.id.toLowerCase() === trimmed.toLowerCase())) {
      alert('This payment mode already exists!');
      return;
    }
    const color = CUSTOM_COLORS[customPaymentApps.length % CUSTOM_COLORS.length];
    const updated = [...customPaymentApps, { name: trimmed, color }];
    
    try {
      await updateUserData({ customPaymentApps: updated });
      setFormData({ ...formData, paymentApp: trimmed });
      setNewModeName('');
      setShowAddMode(false);
    } catch (err) {
      alert('Failed to save payment mode');
    }
  };

  const handleRemoveCustomMode = async (name) => {
    const updated = customPaymentApps.filter(a => a.name !== name);
    try {
      await updateUserData({ customPaymentApps: updated });
      if (formData.paymentApp === name) {
        setFormData({ ...formData, paymentApp: '' });
      }
    } catch (err) {
      alert('Failed to remove payment mode');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const submitData = { ...formData };
      if (submitData.paymentMethod === 'Cash') {
        submitData.paymentApp = '';
      }
      if (submitData.type === 'EMI' || submitData.type === 'Loan' || submitData.type === 'Advance Payment') {
        submitData.status = 'Pending';
      } else {
        delete submitData.loanDate;
        delete submitData.dueDate;
        delete submitData.status;
        delete submitData.interestRate;
        delete submitData.loanDuration;
      }

      await createTransaction(submitData);
      navigate('/', { state: { msg: 'Entry saved!' } });
    } catch (err) {
      alert('❌ Error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (allCategories.some(c => c.toLowerCase() === trimmed.toLowerCase())) {
      alert('This category already exists!');
      return;
    }
    const updated = [...customCategories, trimmed];
    try {
      await updateUserData({ customCategories: updated });
      setFormData({ ...formData, category: trimmed });
      setNewCategoryName('');
      setShowAddCategory(false);
    } catch (err) {
      alert('Failed to save category');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500 max-w-4xl mx-auto px-2 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
           <Link to="/" className="inline-flex items-center gap-2 text-[9px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-1">
              <MdArrowBack size={12} /> Back to Home
           </Link>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">New Entry</h2>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-premium border border-gray-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8">
          
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  <MdPerson size={14} className="text-primary" /> First Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul"
                  required
                  className="block w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                />
                {lastEntry && (
                  <p className="text-[9px] font-bold text-primary flex items-center gap-1 mt-0.5 animate-in slide-in-from-top-1">
                     <MdDateRange size={10} /> Last: {new Date(lastEntry.date).toLocaleDateString()} (₹{Number(lastEntry.amount).toLocaleString()})
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Chauhan"
                  className="block w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  <MdDateRange size={14} className="text-primary" /> Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="block w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">
                  <MdAttachMoney size={14} className="text-primary" /> Amount
                </label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-sm font-black text-gray-400 group-focus-within:text-primary">₹</span>
                   </div>
                   <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    placeholder="0.00"
                    className="block w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Type & Payment */}
          <div className="space-y-6 pt-6 border-t border-gray-50">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Type Select */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Type</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1 bg-gray-100 rounded-2xl border border-gray-200">
                      {['Credit', 'Debit', 'EMI', 'Loan', 'Advance Payment'].map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setFormData({...formData, type})}
                            className={`py-1.5 text-[9px] font-black rounded-xl transition-all ${formData.type === type ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                            {type === 'Advance Payment' ? 'Advance' : type}
                          </button>
                      ))}
                    </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                   {!showAddCategory ? (
                     <div className="relative group">
                        <select
                          name="category"
                          value={formData.category}
                          onChange={(e) => e.target.value === '__ADD_NEW__' ? setShowAddCategory(true) : handleChange(e)}
                          className="block w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold appearance-none outline-none focus:bg-white focus:border-primary transition-all cursor-pointer"
                        >
                          {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                          <option value="__ADD_NEW__">➕ Add New Category...</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-gray-400">
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                     </div>
                   ) : (
                     <div className="flex gap-2 animate-in slide-in-from-right-2">
                        <input
                          type="text"
                          autoFocus
                          placeholder="Category name..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-grow px-4 py-3 bg-white border-2 border-primary rounded-xl text-sm font-bold outline-none shadow-sm shadow-primary/10"
                        />
                        <button type="button" onClick={handleAddCategory} className="p-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20"><MdAdd size={20}/></button>
                        <button type="button" onClick={() => setShowAddCategory(false)} className="p-3 bg-gray-100 text-gray-500 rounded-xl"><MdClose size={20}/></button>
                     </div>
                   )}
                </div>
             </div>

             {/* Conditional Fields */}
             {(formData.type === 'EMI' || formData.type === 'Loan' || formData.type === 'Advance Payment') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl animate-in zoom-in-95">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        {formData.type === 'Loan' ? 'Start Date' : 'Ref Date'}
                      </label>
                      <input type="date" name="loanDate" value={formData.loanDate} onChange={handleChange} required className="block w-full px-4 py-2 bg-white border-2 border-transparent rounded-lg text-sm font-bold outline-none focus:border-primary transition-all" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                        Due Date
                      </label>
                      <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="block w-full px-4 py-2 bg-white border-2 border-transparent rounded-lg text-sm font-bold outline-none focus:border-primary transition-all" />
                   </div>
                </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Payment Method */}
                <div className="space-y-3">
                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Payment Method</label>
                   <div className="flex gap-3">
                      {/* Cash */}
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'Cash', paymentApp: ''})}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 transition-all group ${formData.paymentMethod === 'Cash' ? 'border-emerald-500 bg-emerald-50 shadow-sm shadow-emerald-100' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                      >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 ${formData.paymentMethod === 'Cash' ? 'bg-emerald-500 shadow-sm' : 'bg-gray-300'}`}>
                            <MdAttachMoney size={18} />
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${formData.paymentMethod === 'Cash' ? 'text-emerald-700' : 'text-gray-400'}`}>Cash</span>
                      </button>
                      
                      {/* Online */}
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, paymentMethod: 'Online'})}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 px-4 rounded-2xl border-2 transition-all group ${formData.paymentMethod === 'Online' ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-gray-50 bg-gray-50 hover:border-gray-200'}`}
                      >
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-transform group-hover:scale-110 ${formData.paymentMethod === 'Online' ? 'bg-primary shadow-sm' : 'bg-gray-300'}`}>
                            <MdPayment size={18} />
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${formData.paymentMethod === 'Online' ? 'text-primary' : 'text-gray-400'}`}>Online</span>
                      </button>
                   </div>
                </div>

                {/* Notes Selector */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="1"
                      placeholder="Add a quick note..."
                      className="block w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-medium placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none resize-none"
                    ></textarea>
                </div>
             </div>

             {/* Online App Selector */}
             {formData.paymentMethod === 'Online' && (
                <div className="p-4 bg-gray-50 rounded-[1.5rem] space-y-3 animate-in slide-in-from-top-2">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Choose Platform</p>
                   <div className="flex flex-wrap gap-2">
                      {allApps.map(app => (
                        <button
                          key={app.id}
                          type="button"
                          onClick={() => setFormData({...formData, paymentApp: app.id})}
                          className={`relative flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border ${formData.paymentApp === app.id ? 'bg-white border-primary shadow-sm ring-1 ring-primary/20' : 'border-transparent opacity-60 hover:opacity-100 hover:bg-white/50'}`}
                        >
                           <div className="scale-75 -ml-1.5">{app.logo}</div>
                           <span className="text-[10px] font-bold text-gray-600 truncate">{app.label}</span>
                        </button>
                      ))}
                      {!showAddMode ? (
                        <button onClick={() => setShowAddMode(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-dashed border-gray-300 hover:border-primary hover:bg-white transition-all text-gray-400 hover:text-primary">
                           <MdAdd size={14}/>
                           <span className="text-[10px] font-bold">New</span>
                        </button>
                      ) : (
                        <div className="flex gap-1 animate-in slide-in-from-left-2">
                           <input 
                              type="text" 
                              autoFocus
                              placeholder="Name" 
                              value={newModeName} 
                              onChange={(e) => setNewModeName(e.target.value)}
                              className="px-2 py-1 bg-white border border-primary rounded-lg text-[10px] font-bold outline-none w-20"
                           />
                           <button type="button" onClick={handleAddCustomMode} className="p-1 bg-primary text-white rounded-lg"><MdAdd size={14}/></button>
                           <button type="button" onClick={() => setShowAddMode(false)} className="p-1 bg-gray-200 text-gray-500 rounded-lg"><MdClose size={14}/></button>
                        </div>
                      )}
                   </div>
                </div>
             )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-50">
             <button
               type="button"
               onClick={() => navigate('/')}
               className="px-6 py-2 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors"
             >
               Discard
             </button>
             <button
               type="submit"
               disabled={loading}
               className="px-8 py-3 bg-primary text-white rounded-xl font-black shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
             >
               {loading ? "Saving..." : "Save Transaction"}
             </button>
          </div>
        </form>
      </div>
    </div>

  );
};

export default NewEntry;
