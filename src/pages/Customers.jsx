import React, { useState, useEffect } from 'react';
import { MdAdd, MdDelete, MdEdit, MdSave, MdPhone, MdEmail, MdPerson, MdAccountBalance, MdClose, MdInfoOutline } from 'react-icons/md';
import { fetchCustomers, createCustomer, deleteCustomer, updateCustomer, fetchTransactions } from '../api';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [custRes, transRes] = await Promise.all([fetchCustomers(), fetchTransactions()]);
        setCustomers(custRes.data);
        setTransactions(transRes.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const res = await createCustomer(formData);
      setCustomers(prev => [...prev, res.data]);
      setFormData({ name: '', email: '', phone: '' });
      setShowForm(false);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    await deleteCustomer(id);
    setCustomers(prev => prev.filter(c => c._id !== id));
  };

  const saveEdit = async () => {
    try {
      await updateCustomer(editId, editData);
      setCustomers(prev => prev.map(c => c._id === editId ? { ...c, ...editData } : c));
      setEditId(null);
    } catch (err) { alert('Error: ' + err.message); }
  };

  const getCustomerStats = (customerName) => {
    const cName = customerName?.trim().toLowerCase() || '';
    const custTrans = transactions.filter(t => {
      const tFullName = `${t.name || ''} ${t.lastName || ''}`.trim().toLowerCase();
      const tFirstName = (t.name || '').trim().toLowerCase();
      return tFullName === cName || tFirstName === cName || tFullName.includes(cName) || cName.includes(tFirstName);
    });
    
    const credit = custTrans.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
    const debit = custTrans.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount || t.debit || 0), 0);
    
    const hasActiveEMI = custTrans.some(t => t.type === 'EMI' && t.status === 'Pending');
    const hasActiveLoan = custTrans.some(t => t.type === 'Loan' && t.status === 'Pending');

    const lastEntryDate = custTrans.length > 0 
      ? custTrans.reduce((prev, curr) => new Date(curr.date) > new Date(prev.date) ? curr : prev).date
      : null;
    
    return { credit, debit, balance: credit - debit, count: custTrans.length, lastEntryDate, hasActiveEMI, hasActiveLoan };
  };

  const colorClasses = [
    'bg-blue-50 text-blue-600',
    'bg-emerald-50 text-emerald-600',
    'bg-rose-50 text-rose-600',
    'bg-amber-50 text-amber-600',
    'bg-indigo-50 text-indigo-600',
    'bg-purple-50 text-purple-600'
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Customers</h2>
          <p className="text-sm font-medium text-gray-500">{customers.length} business partners registered</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-2xl font-bold shadow-lg transition-all ${showForm ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary text-white shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5'}`}
        >
          {showForm ? <MdClose size={20} /> : <MdAdd size={20} />}
          {showForm ? "Cancel" : "Add Customer"}
        </button>
      </div>

      {/* Add Customer Form Card */}
      {showForm && (
        <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-gray-100 animate-in slide-in-from-top-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Create New Customer Profile</h4>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary transition-colors">
                   <MdPerson size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="e.g. John Doe" 
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all"
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  required 
                />
              </div>
            </div>
            <div className="md:col-span-4 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary transition-colors">
                   <MdEmail size={20} />
                </div>
                <input 
                  type="email" 
                  placeholder="john@example.com" 
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all"
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>
            <div className="md:col-span-3 space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-300 group-focus-within:text-primary transition-colors">
                   <MdPhone size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="98765 43210" 
                  className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:bg-white focus:border-primary outline-none transition-all"
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>
            </div>
            <div className="md:col-span-1">
              <button type="submit" className="w-full h-[54px] bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all active:scale-95">
                 <MdAdd size={24} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Customers */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
           <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
           <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Loading partners...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white p-20 rounded-[3rem] border border-dashed border-gray-200 text-center space-y-4">
           <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
              <MdPerson size={40} />
           </div>
           <h3 className="text-xl font-bold text-gray-900">No customers yet</h3>
           <p className="text-sm text-gray-500">Your customer network will appear here once added.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {customers.map((c, i) => {
              const stats = getCustomerStats(c.name);
              const colorClass = colorClasses[i % colorClasses.length];
              const isEditing = editId === c._id;

              return (
                <div key={c._id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-premium transition-all duration-300 group relative overflow-hidden">
                   {/* Card Header */}
                   <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-4">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-sm transition-transform group-hover:rotate-3 ${colorClass}`}>
                            {c.name?.charAt(0)?.toUpperCase()}
                         </div>
                         <div className="min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                 <input className="block w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-sm font-bold outline-none focus:border-primary" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} placeholder="Name" />
                                 <input className="block w-full px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-xs font-bold outline-none focus:border-primary" value={editData.phone} onChange={e => setEditData({...editData, phone: e.target.value})} placeholder="Phone" />
                              </div>
                            ) : (
                              <>
                                 <h4 className="font-black text-gray-900 truncate group-hover:text-primary transition-colors">{c.name}</h4>
                                 <div className="flex gap-1.5 mt-1">
                                    {stats.hasActiveEMI && <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">EMI Active</span>}
                                    {stats.hasActiveLoan && <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase tracking-tighter">Loan Active</span>}
                                 </div>
                                 <p className="text-xs font-medium text-gray-400 mt-1 truncate">{c.phone || 'No phone'}</p>
                              </>
                            )}
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1">
                         {isEditing ? (
                            <>
                               <button onClick={saveEdit} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><MdSave size={18} /></button>
                               <button onClick={() => setEditId(null)} className="p-2 text-gray-400 hover:bg-gray-50 rounded-xl transition-colors"><MdClose size={18} /></button>
                            </>
                         ) : (
                            <>
                               <button onClick={() => { setEditId(c._id); setEditData({ name: c.name, phone: c.phone || '', email: c.email || '' }); }} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-xl transition-colors"><MdEdit size={18} /></button>
                               <button onClick={() => handleDelete(c._id)} className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"><MdDelete size={18} /></button>
                            </>
                         )}
                      </div>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50/50 rounded-2xl mb-6">
                      <div className="text-center border-r border-gray-100">
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Balance</p>
                         <p className={`text-xs font-black ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>₹{stats.balance.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-center border-r border-gray-100">
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Credit</p>
                         <p className="text-xs font-black text-emerald-600">₹{stats.credit.toLocaleString('en-IN')}</p>
                      </div>
                      <div className="text-center">
                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Debit</p>
                         <p className="text-xs font-black text-rose-600">₹{stats.debit.toLocaleString('en-IN')}</p>
                      </div>
                   </div>

                   {/* Footer Info & Actions */}
                   <div className="space-y-4">
                      {stats.lastEntryDate && (
                         <p className="text-[10px] text-center font-bold text-gray-400">
                            Last active: <span className="text-primary">{new Date(stats.lastEntryDate).toLocaleDateString('en-IN')}</span>
                         </p>
                      )}
                      <div className="flex gap-3">
                         <button 
                            onClick={() => navigate('/new-entry')}
                            className="flex-grow py-3 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                         >
                            <MdAdd size={16} /> New Entry
                         </button>
                         <button 
                            onClick={() => navigate(`/statements?search=${encodeURIComponent(c.name)}`)}
                            className="flex-grow py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                         >
                            <MdAccountBalance size={16} /> View ({stats.count})
                         </button>
                      </div>
                   </div>
                </div>
              );
           })}
        </div>
      )}
    </div>
  );
};

export default Customers;
