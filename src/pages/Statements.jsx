import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  MdDelete, MdEdit, MdSearch, MdFilterList, MdSave, MdClose, MdShare, 
  MdPictureAsPdf, MdTableChart, MdWhatsapp, MdEmail, MdSms, MdArrowBack,
  MdCheckCircle, MdTrendingUp, MdTrendingDown
} from 'react-icons/md';
import { fetchTransactions, deleteTransaction, updateTransaction } from '../api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getLocalDateString } from '../utils/dateUtils';
import { getAppDetails } from '../utils/paymentApps';
import AnimatedNumber from '../components/AnimatedNumber';
import { useAuth } from '../context/AuthContext';

const Statements = () => {
  const { customPaymentApps } = useAuth();
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');
  const [editId, setEditId] = useState(null);
  const [editData, setEditData] = useState({});
  const [selected, setSelected] = useState([]);
  const [showShare, setShowShare] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const s = searchParams.get('search');
    if (s) setSearch(s);
  }, [searchParams]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchTransactions();
      setAllTransactions(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    let data = allTransactions;
    if (filterMonth && filterYear) {
      data = data.filter(t => { const d = new Date(t.date); return d.getMonth() + 1 === parseInt(filterMonth) && d.getFullYear() === parseInt(filterYear); });
    } else if (filterYear) {
      data = data.filter(t => new Date(t.date).getFullYear() === parseInt(filterYear));
    }
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(t => t.name?.toLowerCase().includes(s) || (t.lastName && t.lastName.toLowerCase().includes(s)) || (t.description && t.description.toLowerCase().includes(s)));
    }
    setTransactions(data);
  }, [allTransactions, search, filterMonth, filterYear]);

  const handleDelete = async (id) => { if (!window.confirm('Delete this entry?')) return; await deleteTransaction(id); setAllTransactions(p => p.filter(t => t._id !== id)); };
  const handleDeleteSelected = async () => { if (!window.confirm(`Delete ${selected.length} entries?`)) return; for (const id of selected) await deleteTransaction(id); setAllTransactions(p => p.filter(t => !selected.includes(t._id))); setSelected([]); };
  
  const startEdit = (t) => {
    setEditId(t._id);
    setEditData({
      name: t.name,
      lastName: t.lastName || '',
      amount: t.amount,
      type: t.type,
      description: t.description || '',
      date: t.date ? getLocalDateString(t.date) : '',
      dueDate: t.dueDate ? getLocalDateString(t.dueDate) : (t.date ? getLocalDateString(t.date) : '')
    });
  };
  const saveEdit = async () => { await updateTransaction(editId, editData); setAllTransactions(p => p.map(t => t._id === editId ? { ...t, ...editData } : t)); setEditId(null); };
  
  const toggleSelect = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleAll = () => setSelected(selected.length === transactions.length && transactions.length > 0 ? [] : transactions.map(t => t._id));

  const totalCredit = transactions.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = transactions.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount), 0);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Statement Report', 14, 20);
    autoTable(doc, {
      startY: 35,
      head: [['#', 'Name', 'Date', 'Type', 'Amount', 'Description']],
      body: transactions.map((t, i) => [i + 1, `${t.name} ${t.lastName || ''}`, new Date(t.date).toLocaleDateString('en-IN'), t.type, `₹${Number(t.amount).toLocaleString('en-IN')}`, t.description || '-']),
    });
    doc.save('statement-report.pdf');
  };

  const exportExcel = () => {
    const data = transactions.map((t, i) => ({ 'S.No': i + 1, Name: `${t.name} ${t.lastName || ''}`, Date: new Date(t.date).toLocaleDateString('en-IN'), Type: t.type, Amount: Number(t.amount), Category: t.category || 'General', Description: t.description || '' }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Statements');
    XLSX.writeFile(wb, 'statement-report.xlsx');
  };

  const buildSummary = () => {
    let text = `📊 *Statement Report*\n\nCredit: ₹${totalCredit.toLocaleString()}\nDebit: ₹${totalDebit.toLocaleString()}\nNet: ₹${(totalCredit - totalDebit).toLocaleString()}\n\n`;
    transactions.slice(0, 10).forEach((t, i) => {
      text += `${i + 1}. ${t.name} | ${t.type} | ₹${Number(t.amount).toLocaleString()} | ${new Date(t.date).toLocaleDateString()}\n`;
    });
    if (transactions.length > 10) text += `... and ${transactions.length - 10} more entries.`;
    return text;
  };

  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(buildSummary())}`, '_blank'); };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-2">
              <MdArrowBack size={14} /> Back to Dashboard
           </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Statements</h2>
          <p className="text-sm font-medium text-gray-500">Detailed transaction ledger and history</p>
        </div>
        
        <div className="flex items-center gap-2">
           <button 
             onClick={() => setShowShare(!showShare)}
             className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm relative"
           >
              <MdShare size={18} className="text-primary" /> Export / Share
              {showShare && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-premium border border-gray-50 p-4 z-50 animate-in slide-in-from-top-2">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Download Files</p>
                   <div className="grid grid-cols-2 gap-2 mb-4">
                      <button onClick={exportPDF} className="flex flex-col items-center gap-1 p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                         <MdPictureAsPdf size={20} /> <span className="text-[9px] font-black uppercase">PDF</span>
                      </button>
                      <button onClick={exportExcel} className="flex flex-col items-center gap-1 p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                         <MdTableChart size={20} /> <span className="text-[9px] font-black uppercase">Excel</span>
                      </button>
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Share Report</p>
                   <div className="grid grid-cols-3 gap-2">
                      <button onClick={shareWhatsApp} className="p-2 bg-emerald-500 text-white rounded-xl flex justify-center hover:bg-emerald-600 transition-colors"><MdWhatsapp size={18}/></button>
                      <button onClick={() => window.open(`mailto:?subject=Report&body=${encodeURIComponent(buildSummary())}`)} className="p-2 bg-blue-500 text-white rounded-xl flex justify-center hover:bg-blue-600 transition-colors"><MdEmail size={18}/></button>
                      <button onClick={() => window.open(`sms:?body=${encodeURIComponent(buildSummary())}`)} className="p-2 bg-gray-700 text-white rounded-xl flex justify-center hover:bg-gray-800 transition-colors"><MdSms size={18}/></button>
                   </div>
                </div>
              )}
           </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Entries</p>
               <h4 className="text-2xl font-black text-gray-900"><AnimatedNumber value={transactions.length} /></h4>
            </div>
            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400"><MdSearch size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Credit</p>
               <h4 className="text-2xl font-black text-emerald-600"><AnimatedNumber prefix="₹" value={totalCredit} isCurrency={true} /></h4>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500"><MdTrendingUp size={24}/></div>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Debit</p>
               <h4 className="text-2xl font-black text-rose-600"><AnimatedNumber prefix="₹" value={totalDebit} isCurrency={true} /></h4>
            </div>
            <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500"><MdTrendingDown size={24}/></div>
         </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
         <div className="relative flex-grow w-full">
            <MdSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
            <input 
              type="text" 
              placeholder="Search name, category, notes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold focus:bg-white focus:border-primary transition-all outline-none"
            />
         </div>
         <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="flex-1 md:w-32">
               <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-primary outline-none">
                  <option value="">All Months</option>
                  {[...Array(12)].map((_, i) => <option key={i} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'short' })}</option>)}
               </select>
            </div>
            <div className="flex-1 md:w-32">
               <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent rounded-xl text-xs font-bold focus:bg-white focus:border-primary outline-none">
                  <option value="">All Years</option>
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
               </select>
            </div>
         </div>
         {selected.length > 0 && (
           <button onClick={handleDeleteSelected} className="flex items-center gap-2 px-4 py-3 bg-rose-500 text-white rounded-xl text-sm font-black shadow-lg shadow-rose-100 animate-in slide-in-from-right-4">
              <MdDelete size={18} /> Delete {selected.length}
           </button>
         )}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
         {loading ? (
           <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Compiling history...</p>
           </div>
         ) : transactions.length === 0 ? (
           <div className="text-center py-20 text-gray-400">
              <MdSearch size={48} className="mx-auto mb-4 opacity-20" />
              <p className="font-bold">No transactions found matching your criteria</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-gray-50 bg-gray-50/50">
                       <th className="py-5 px-6">
                          <input type="checkbox" checked={selected.length === transactions.length && transactions.length > 0} onChange={toggleAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                       </th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category / Mode</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                       <th className="py-5 px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                    {(() => {
                      let lastMonth = null;
                      return transactions.map((t) => {
                        const date = new Date(t.date);
                        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
                        const isNewMonth = monthYear !== lastMonth;
                        lastMonth = monthYear;
                        const isEditing = editId === t._id;
                        
                        return (
                          <React.Fragment key={t._id}>
                            {isNewMonth && (
                               <tr className="bg-gray-50/30">
                                  <td colSpan="6" className="py-3 px-6">
                                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">{monthYear}</span>
                                  </td>
                               </tr>
                            )}
                            <tr className={`hover:bg-gray-50/80 transition-colors ${selected.includes(t._id) ? 'bg-primary/5' : ''}`}>
                               <td className="py-4 px-6">
                                  <input type="checkbox" checked={selected.includes(t._id)} onChange={() => toggleSelect(t._id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                               </td>
                               <td className="py-4 px-4 min-w-[200px]">
                                  {isEditing ? (
                                    <div className="flex gap-1 mb-1">
                                       <input className="px-2 py-1 bg-gray-50 border rounded text-xs font-bold" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                                       <input className="px-2 py-1 bg-gray-50 border rounded text-xs font-bold" value={editData.lastName} onChange={e => setEditData({...editData, lastName: e.target.value})} />
                                    </div>
                                  ) : (
                                    <p className="text-sm font-black text-gray-900 mb-0.5">{t.name} {t.lastName || ''}</p>
                                  )}
                                  <div className="flex items-center gap-2">
                                     <span className="text-[10px] font-bold text-gray-400">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                     {t.description && <span className="text-[10px] text-gray-300 italic truncate max-w-[150px]">" {t.description} "</span>}
                                  </div>
                               </td>
                               <td className="py-4 px-4">
                                  <div className="flex items-center gap-2">
                                     <div className="scale-75 -ml-2">{getAppDetails(t.paymentApp || t.paymentMethod || 'Cash', customPaymentApps).logo}</div>
                                     <div>
                                        <p className="text-[10px] font-black text-gray-700 uppercase tracking-tighter leading-none mb-1">{t.category || 'General'}</p>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.paymentApp || t.paymentMethod || 'Cash'}</p>
                                     </div>
                                  </div>
                               </td>
                               <td className="py-4 px-4">
                                  <span className={`text-[9px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${
                                    t.type === 'Credit' ? 'bg-emerald-100 text-emerald-700' : 
                                    t.type === 'Debit' ? 'bg-rose-100 text-rose-700' : 
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                     {t.type}
                                  </span>
                               </td>
                               <td className="py-4 px-4 text-right">
                                  <p className={`text-sm font-black ${
                                    t.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'
                                  }`}>
                                     {t.type === 'Credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString()}
                                  </p>
                               </td>
                               <td className="py-4 px-4">
                                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                     {isEditing ? (
                                        <div className="flex gap-1">
                                           <button onClick={saveEdit} className="p-2 bg-emerald-500 text-white rounded-lg"><MdSave size={14}/></button>
                                           <button onClick={() => setEditId(null)} className="p-2 bg-gray-200 text-gray-500 rounded-lg"><MdClose size={14}/></button>
                                        </div>
                                     ) : (
                                        <div className="flex gap-1">
                                           <button onClick={() => startEdit(t)} className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-all"><MdEdit size={16}/></button>
                                           <button onClick={() => handleDelete(t._id)} className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><MdDelete size={16}/></button>
                                        </div>
                                     )}
                                  </div>
                               </td>
                            </tr>
                          </React.Fragment>
                        );
                      });
                    })()}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
};

export default Statements;
