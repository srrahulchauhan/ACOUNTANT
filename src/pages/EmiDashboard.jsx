import React, { useState, useEffect, useCallback } from 'react';
import { MdPayment, MdCheckCircle, MdSchedule, MdWarning, MdArrowBack, MdFilterList, MdEdit, MdSave, MdClose } from 'react-icons/md';
import { fetchTransactions, updateTransaction } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { getLocalDateString } from '../utils/dateUtils';
import AnimatedNumber from '../components/AnimatedNumber';

const StatCard = ({ title, value, prefix = '', suffix = '', icon, colorClass, description, isCurrency = false, decimals = 0 }) => (
  <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-premium transition-all">
    <div className="space-y-1">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-900 tracking-tight">
        <AnimatedNumber value={value} prefix={prefix} suffix={suffix} isCurrency={isCurrency} decimals={decimals} />
      </h3>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{description}</p>
    </div>
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
      colorClass === 'emerald' ? 'bg-emerald-50 text-emerald-500' :
      colorClass === 'rose' ? 'bg-rose-50 text-rose-500' :
      colorClass === 'blue' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'
    }`}>
      {icon}
    </div>
  </div>
);

const EmiDashboard = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingCount: 0, successCount: 0, pendingAmount: 0, successAmount: 0 });
  const [alerts, setAlerts] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [filterStatus, setFilterStatus] = useState('All');

  const loadData = useCallback(async () => {
    try {
      const res = await fetchTransactions();
      const data = res.data;
      const financialEntries = data.filter(t => t.type === 'EMI' || t.type === 'Loan');
      
      const sortedEntries = [...financialEntries].sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return new Date(a.dueDate || a.date) - new Date(b.dueDate || b.date);
      });

      setEntries(sortedEntries);

      let pCount = 0, sCount = 0, pAmt = 0, sAmt = 0;
      financialEntries.forEach(t => {
        if (['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status)) {
          sCount++;
          sAmt += Number(t.amount);
        } else {
          pCount++;
          pAmt += Number(t.amount);
        }
      });
      setStats({ pendingCount: pCount, successCount: sCount, pendingAmount: pAmt, successAmount: sAmt });

      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() + 2);
      const thresholdStr = getLocalDateString(thresholdDate);
      const pendingAlerts = financialEntries.filter(t => (t.status === 'Pending' || !t.status) && (!t.dueDate || t.dueDate <= thresholdStr));
      setAlerts(pendingAlerts);

    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleQuickPay = async (id, amount, name, itemType) => {
    if (!window.confirm(`Mark payment of ₹${amount} for ${name} as Paid?`)) return;
    try {
      const newStatus = itemType === 'Loan' ? 'Advance Paid' : 'EMI Paid';
      await updateTransaction(id, { status: newStatus, emiPaidDate: getLocalDateString() });
      loadData();
    } catch (err) { console.error(err); }
  };

  const handleSave = async () => {
    try {
      await updateTransaction(editId, { ...editData, amount: Number(editData.amount) });
      setEditId(null);
      loadData();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Alert Notification */}
      {alerts.length > 0 && (
         <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-rose-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-rose-200">
                  <MdWarning size={20} />
               </div>
               <div>
                  <h4 className="text-sm font-black text-rose-900">Payment Overdue Alert</h4>
                  <p className="text-[10px] font-bold text-rose-700 uppercase tracking-widest">{alerts.length} accounts require immediate attention</p>
               </div>
            </div>
            <Link to="/statements?search=Pending" className="px-4 py-2 bg-rose-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md">Review Now</Link>
         </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-2">
              <MdArrowBack size={14} /> Back
           </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Finance Registry</h2>
          <p className="text-sm font-medium text-gray-500">Consolidated tracking for Loans & EMIs</p>
        </div>
        <button onClick={() => navigate('/new-entry')} className="px-8 py-3 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all">
           + New Finance Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatCard title="Total Records" value={entries.length} icon={<MdSchedule size={20}/>} colorClass="blue" description="EMI / Loan Profiles" />
         <StatCard title="To Recover" value={stats.pendingAmount} isCurrency={true} prefix="₹" icon={<MdWarning size={20}/>} colorClass="rose" description="Pending Collections" />
         <StatCard title="Recovered" value={stats.successAmount} isCurrency={true} prefix="₹" icon={<MdCheckCircle size={20}/>} colorClass="emerald" description="Successful Collection" />
         <StatCard title="Paid Entries" value={stats.successCount} icon={<MdPayment size={20}/>} colorClass="gray" description="Cleared History" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
         <h4 className="text-lg font-black text-gray-900 flex items-center gap-2">
            <MdFilterList className="text-primary" /> Active Statements
         </h4>
         <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-1">
            {['All', 'Pending', 'EMI Paid', 'Advance Paid', 'Success'].map(status => {
               const count = entries.filter(t => status === 'All' ? true : (status === 'Pending' ? (!t.status || t.status === 'Pending') : t.status === status)).length;
               if (status !== 'All' && count === 0) return null;
               return (
                  <button 
                    key={status} 
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${filterStatus === status ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                  >
                     {status} <span className="ml-1 opacity-50">{count}</span>
                  </button>
               );
            })}
         </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
         {loading ? (
           <div className="py-20 text-center"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div></div>
         ) : entries.length === 0 ? (
           <div className="py-20 text-center text-gray-400 font-bold">No records found.</div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-gray-50/50">
                       <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrower</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Due Date</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                       <th className="py-5 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {entries.filter(t => filterStatus === 'All' ? true : (filterStatus === 'Pending' ? (!t.status || t.status === 'Pending') : t.status === filterStatus)).map(t => {
                       const isPaid = ['Paid', 'Success', 'Advance Paid', 'EMI Paid'].includes(t.status);
                       const isEditing = editId === t._id;
                       return (
                          <tr key={t._id} className={`hover:bg-gray-50/50 transition-colors ${isPaid ? 'opacity-70 bg-emerald-50/10' : ''}`}>
                             <td className="py-4 px-8">
                                {isEditing ? (
                                   <div className="flex gap-2">
                                      <input className="px-3 py-1 bg-gray-50 border rounded-lg text-xs font-bold w-24" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                                      <input className="px-3 py-1 bg-gray-50 border rounded-lg text-xs font-bold w-24" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                                   </div>
                                ) : (
                                   <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${t.type === 'Loan' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'}`}>
                                         {t.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="text-sm font-black text-gray-900">{t.name} {t.lastName || ''}</p>
                                         <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.category || 'Personal'}</p>
                                      </div>
                                   </div>
                                )}
                             </td>
                             <td className="py-4 px-4">
                                <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-tighter ${t.type === 'Loan' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                                   {t.type}
                                </span>
                             </td>
                             <td className="py-4 px-4">
                                {isEditing ? (
                                   <input type="date" className="px-2 py-1 bg-gray-50 border rounded-lg text-xs font-bold" value={editData.dueDate?.split('T')[0]} onChange={e => setEditData({...editData, dueDate: e.target.value})} />
                                ) : (
                                   <p className="text-xs font-bold text-gray-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN') : '---'}</p>
                                )}
                             </td>
                             <td className="py-4 px-4 text-sm font-black text-rose-600">
                                {isEditing ? (
                                   <input type="number" className="px-2 py-1 bg-gray-50 border rounded-lg text-xs font-bold w-24" value={editData.amount} onChange={e => setEditData({...editData, amount: e.target.value})} />
                                ) : `₹${Number(t.amount).toLocaleString()}`}
                             </td>
                             <td className="py-4 px-4">
                                {isEditing ? (
                                   <select className="px-2 py-1 bg-gray-50 border rounded-lg text-xs font-bold" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                                      <option>Pending</option>
                                      <option>Success</option>
                                      <option>EMI Paid</option>
                                      <option>Advance Paid</option>
                                   </select>
                                ) : (
                                   <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {t.status || 'Pending'}
                                   </span>
                                )}
                             </td>
                             <td className="py-4 px-8">
                                <div className="flex items-center justify-center gap-2">
                                   {isEditing ? (
                                      <>
                                         <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded-lg"><MdSave size={14}/></button>
                                         <button onClick={() => setEditId(null)} className="p-2 bg-gray-200 text-gray-500 rounded-lg"><MdClose size={14}/></button>
                                      </>
                                   ) : (
                                      <>
                                         {!isPaid && (
                                            <button onClick={() => handleQuickPay(t._id, t.amount, t.name, t.type)} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all">
                                               Quick Pay
                                            </button>
                                         )}
                                         <button onClick={() => { setEditId(t._id); setEditData(t); }} className="p-2 text-gray-300 hover:text-primary hover:bg-blue-50 rounded-lg transition-all">
                                            <MdEdit size={16} />
                                         </button>
                                      </>
                                   )}
                                </div>
                             </td>
                          </tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
};

export default EmiDashboard;
