import React, { useState, useEffect } from 'react';
import { MdBarChart, MdPictureAsPdf, MdTableChart, MdWhatsapp, MdEmail, MdSms, MdShare, MdTrendingUp, MdTrendingDown, MdAccountBalanceWallet, MdArrowBack } from 'react-icons/md';
import { fetchTransactions } from '../api';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Link } from 'react-router-dom';
import AnimatedNumber from '../components/AnimatedNumber';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Reports = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    const load = async () => {
      try { const res = await fetchTransactions(); setTransactions(res.data); }
      catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const yearData = transactions.filter(t => new Date(t.date).getFullYear() === year);
  const totalCredit = yearData.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
  const totalDebit = yearData.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount), 0);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyCredit = months.map((_, i) => yearData.filter(t => t.type === 'Credit' && new Date(t.date).getMonth() === i).reduce((s, t) => s + Number(t.amount), 0));
  const monthlyDebit = months.map((_, i) => yearData.filter(t => (t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan') && new Date(t.date).getMonth() === i).reduce((s, t) => s + Number(t.amount), 0));

  const categories = [...new Set(yearData.map(t => t.category || 'General'))];
  const catAmounts = categories.map(c => yearData.filter(t => (t.category || 'General') === c).reduce((s, t) => s + Number(t.amount), 0));
  const catColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  const barData = {
    labels: months,
    datasets: [
      { label: 'Credit', data: monthlyCredit, backgroundColor: '#10b981', borderRadius: 8 },
      { label: 'Debit', data: monthlyDebit, backgroundColor: '#ef4444', borderRadius: 8 }
    ]
  };

  const doughnutData = {
    labels: categories,
    datasets: [{ data: catAmounts, backgroundColor: catColors.slice(0, categories.length), borderWidth: 0, hoverOffset: 10 }]
  };

  const buildSummary = () => {
    let text = `📊 *Financial Report ${year}*\n\nCredit: ₹${totalCredit.toLocaleString()}\nDebit: ₹${totalDebit.toLocaleString()}\nNet: ₹${(totalCredit - totalDebit).toLocaleString()}\n\n`;
    return text;
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Financial Report - ${year}`, 14, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Month', 'Credit', 'Debit', 'Net']],
      body: months.map((m, i) => [m, monthlyCredit[i], monthlyDebit[i], monthlyCredit[i] - monthlyDebit[i]]),
    });
    doc.save(`report-${year}.pdf`);
  };

  const exportExcel = () => {
    const data = months.map((m, i) => ({ Month: m, Credit: monthlyCredit[i], Debit: monthlyDebit[i], Net: monthlyCredit[i] - monthlyDebit[i] }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `report-${year}.xlsx`);
  };

  if (loading) return (
     <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generating insights...</p>
     </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-2">
              <MdArrowBack size={14} /> Dashboard
           </Link>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <MdBarChart className="text-primary" /> Reports
          </h2>
          <p className="text-sm font-medium text-gray-500">Yearly financial analytics & summaries</p>
        </div>
        
        <div className="flex items-center gap-3">
           <select 
             className="px-4 py-3 bg-white border border-gray-100 rounded-2xl font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-primary/20"
             value={year} 
             onChange={e => setYear(parseInt(e.target.value))}
           >
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
           </select>
           
           <div className="relative">
              <button 
                onClick={() => setShowShare(!showShare)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/25 hover:bg-primary-dark transition-all"
              >
                 <MdShare size={18} /> Export
              </button>
              {showShare && (
                 <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-2xl shadow-premium border border-gray-50 p-3 z-50 animate-in slide-in-from-top-2">
                    <button onClick={exportPDF} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors mb-1">
                       <MdPictureAsPdf size={18} /> Download PDF
                    </button>
                    <button onClick={exportExcel} className="w-full flex items-center gap-3 p-3 text-xs font-bold text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors mb-2">
                       <MdTableChart size={18} /> Download Excel
                    </button>
                    <div className="h-px bg-gray-50 my-2 mx-1"></div>
                    <div className="grid grid-cols-3 gap-1">
                       <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildSummary())}`)} className="p-3 bg-emerald-500 text-white rounded-xl flex justify-center"><MdWhatsapp size={16}/></button>
                       <button onClick={() => window.open(`mailto:?subject=Report&body=${encodeURIComponent(buildSummary())}`)} className="p-3 bg-blue-500 text-white rounded-xl flex justify-center"><MdEmail size={16}/></button>
                       <button onClick={() => window.open(`sms:?body=${encodeURIComponent(buildSummary())}`)} className="p-3 bg-gray-800 text-white rounded-xl flex justify-center"><MdSms size={16}/></button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-premium transition-all">
            <div className="w-16 h-16 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
               <MdTrendingUp size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yearly Credit</p>
               <h4 className="text-2xl font-black text-emerald-600 tracking-tight"><AnimatedNumber prefix="₹" value={totalCredit} isCurrency={true} /></h4>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-premium transition-all">
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
               <MdTrendingDown size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yearly Debit</p>
               <h4 className="text-2xl font-black text-rose-600 tracking-tight"><AnimatedNumber prefix="₹" value={totalDebit} isCurrency={true} /></h4>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-6 group hover:shadow-premium transition-all">
            <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
               <MdAccountBalanceWallet size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Balance</p>
               <h4 className="text-2xl font-black text-blue-600 tracking-tight"><AnimatedNumber prefix="₹" value={totalCredit - totalDebit} isCurrency={true} /></h4>
            </div>
         </div>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-8 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-lg font-black text-gray-900">Monthly Cashflow</h4>
               <span className="text-[10px] font-black bg-gray-50 text-gray-400 px-3 py-1 rounded-full uppercase tracking-widest">{year} Analytics</span>
            </div>
            <div className="h-[300px]">
               <Bar 
                 data={barData} 
                 options={{ 
                   responsive: true, 
                   maintainAspectRatio: false,
                   plugins: { legend: { display: false } },
                   scales: { 
                     x: { grid: { display: false }, ticks: { font: { size: 10, weight: 'bold' } } },
                     y: { border: { dash: [4, 4] }, ticks: { font: { size: 10, weight: 'bold' } } }
                   } 
                 }} 
               />
            </div>
         </div>
         <div className="lg:col-span-4 bg-white p-8 sm:p-10 rounded-[2.5rem] border border-gray-100 shadow-sm">
            <h4 className="text-lg font-black text-gray-900 mb-8">Expense Splits</h4>
            <div className="h-[250px] flex items-center justify-center">
               {categories.length > 0 ? (
                 <Doughnut 
                   data={doughnutData} 
                   options={{ 
                     responsive: true, 
                     maintainAspectRatio: false,
                     plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10, weight: 'bold' } } } } 
                   }} 
                 />
               ) : (
                 <div className="text-center text-gray-300 font-bold text-sm italic">No category data</div>
               )}
            </div>
         </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
         <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <h4 className="text-lg font-black text-gray-900">Monthly Breakdown</h4>
            <MdAccountBalanceWallet className="text-gray-200" size={24} />
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-gray-50/50">
                     <th className="py-4 px-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">Month</th>
                     <th className="py-4 px-8 text-[10px] font-black text-emerald-500 uppercase tracking-widest text-right">Credit (+)</th>
                     <th className="py-4 px-8 text-[10px] font-black text-rose-500 uppercase tracking-widest text-right">Debit (-)</th>
                     <th className="py-4 px-8 text-[10px] font-black text-gray-600 uppercase tracking-widest text-right">Net Profit/Loss</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-50">
                  {months.map((m, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                       <td className="py-4 px-8 text-sm font-black text-gray-700">{m}</td>
                       <td className="py-4 px-8 text-sm font-bold text-emerald-600 text-right">₹{monthlyCredit[i].toLocaleString()}</td>
                       <td className="py-4 px-8 text-sm font-bold text-rose-600 text-right">₹{monthlyDebit[i].toLocaleString()}</td>
                       <td className={`py-4 px-8 text-sm font-black text-right ${monthlyCredit[i] - monthlyDebit[i] >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          ₹{(monthlyCredit[i] - monthlyDebit[i]).toLocaleString()}
                       </td>
                    </tr>
                  ))}
               </tbody>
               <tfoot>
                  <tr className="bg-gray-900 text-white">
                     <td className="py-5 px-8 text-xs font-black uppercase tracking-widest">Total Yearly</td>
                     <td className="py-5 px-8 text-lg font-black text-emerald-400 text-right">₹{totalCredit.toLocaleString()}</td>
                     <td className="py-5 px-8 text-lg font-black text-rose-400 text-right">₹{totalDebit.toLocaleString()}</td>
                     <td className="py-5 px-8 text-xl font-black text-right">₹{(totalCredit - totalDebit).toLocaleString()}</td>
                  </tr>
               </tfoot>
            </table>
         </div>
      </div>
    </div>
  );
};

export default Reports;
