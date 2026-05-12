import React, { useState, useEffect, useCallback } from 'react';
import { 
    MdAccountBalanceWallet, MdTrendingUp, MdTrendingDown, 
    MdReceipt, MdArrowForward, MdPayment, MdNotificationsActive
} from 'react-icons/md';
import { fetchTransactions, updateTransaction, fetchCustomers } from '../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { IncomeVsExpenseChart, WeeklyExpenseChart, MonthlyExpenseChart } from '../components/charts/DashboardCharts';
import { getLocalDateString } from '../utils/dateUtils';
import { getAppDetails } from '../utils/paymentApps';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, prefix, suffix, icon, colorClass, description, trend }) => (
  <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-premium transition-all duration-300 group">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-1">
          <h3 className="text-2xl font-black text-gray-900">{prefix}{value}{suffix}</h3>
        </div>
        <p className="text-[11px] font-medium text-gray-500 mt-1 flex items-center gap-1">
          {description}
          {trend && <span className={`text-[10px] ${trend > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%</span>}
        </p>
      </div>
      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${colorClass}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, customPaymentApps } = useAuth();
  const user = userData || {};

  const getColor = (name) => getAppDetails(name, customPaymentApps).color;
  const [transactions, setTransactions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ totalBalance: 0, totalCredit: 0, totalDebit: 0, count: 0 });
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [viewMode, setViewMode] = useState('Lifetime'); // 'Month' or 'Lifetime'

  const playRingAlert = useCallback(() => {
    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtxClass) return;
      const audioCtx = new AudioCtxClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch(e) { console.error(e); }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [transRes, custRes] = await Promise.all([fetchTransactions(), fetchCustomers()]);
      const data = transRes.data;
      setTransactions(data);
      setCustomers(custRes.data);

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const filtered = viewMode === 'Month' 
        ? data.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
        : data;

      const totalCredit = filtered.filter(t => t.type === 'Credit').reduce((s, t) => s + Number(t.amount), 0);
      const totalDebit = filtered.filter(t => t.type === 'Debit' || t.type === 'EMI' || t.type === 'Loan').reduce((s, t) => s + Number(t.amount || t.debit || 0), 0);
      setStats({ totalBalance: totalCredit - totalDebit, totalCredit, totalDebit, count: filtered.length });

      // EMI Alerts
      const today = new Date();
      const thresholdDate = new Date(today);
      thresholdDate.setDate(today.getDate() + 2);
      const thresholdStr = getLocalDateString(thresholdDate);

      const pendingEMIs = data.filter(t => t.type === 'EMI' && t.status === 'Pending' && (!t.dueDate || t.dueDate <= thresholdStr));
      if (pendingEMIs.length > 0) {
        setAlerts(pendingEMIs);
        if (!sessionStorage.getItem('emi_ring_played')) {
          playRingAlert();
          sessionStorage.setItem('emi_ring_played', 'true');
        }
      } else {
        setAlerts([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [viewMode, playRingAlert]);

  useEffect(() => { loadData(); }, [location.key, viewMode, loadData]);

  useEffect(() => {
    const interval = setInterval(() => { loadData(); }, 10000); // 10s is better for performance than 3s
    return () => clearInterval(interval);
  }, [loadData]);

  const handleMarkPaid = async (id) => {
    try {
      await updateTransaction(id, { status: 'Success' });
      loadData();
    } catch (err) { console.error(err); }
  };

  const paymentMethodStats = React.useMemo(() => {
    const cashCount = transactions.filter(t => !t.paymentMethod || t.paymentMethod === 'Cash').length;
    const cashAmount = transactions.filter(t => !t.paymentMethod || t.paymentMethod === 'Cash').reduce((s, t) => s + Number(t.amount), 0);
    const onlineCount = transactions.filter(t => t.paymentMethod === 'Online').length;
    const onlineAmount = transactions.filter(t => t.paymentMethod === 'Online').reduce((s, t) => s + Number(t.amount), 0);
    return { cashCount, cashAmount, onlineCount, onlineAmount };
  }, [transactions]);

  const appBreakdown = React.useMemo(() => {
    const appMap = {};
    transactions.forEach(t => {
      if (t.paymentMethod === 'Online' && t.paymentApp) {
        if (!appMap[t.paymentApp]) appMap[t.paymentApp] = { count: 0, amount: 0 };
        appMap[t.paymentApp].count++;
        appMap[t.paymentApp].amount += Number(t.amount);
      }
    });
    return Object.entries(appMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  const topPayers = React.useMemo(() => {
    const payerMap = {};
    transactions.forEach(t => {
      const key = `${t.name} ${t.lastName || ''}`.trim();
      if (!payerMap[key]) payerMap[key] = { name: key, total: 0, method: t.paymentMethod || 'Cash', app: t.paymentApp || '' };
      payerMap[key].total += Number(t.amount);
      payerMap[key].method = t.paymentMethod || 'Cash';
      payerMap[key].app = t.paymentApp || '';
    });
    return Object.values(payerMap).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [transactions]);

  const maxPayerAmount = topPayers.length > 0 ? topPayers[0].total : 1;
  const totalTxns = transactions.length || 1;
  const recent = transactions.slice(0, 8);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* EMI Floating Alerts */}
      <div className="fixed top-24 right-6 z-[60] flex flex-col gap-4 w-full max-w-sm">
        {alerts.map((alert) => (
          <div key={alert._id} className="bg-white/90 backdrop-blur-md border-l-4 border-rose-500 rounded-2xl shadow-premium p-4 flex items-start gap-4 animate-in slide-in-from-right-full">
            <div className="p-2.5 bg-rose-50 text-rose-500 rounded-full flex-shrink-0">
               <MdNotificationsActive size={20} />
            </div>
            <div className="flex-grow">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-gray-900">EMI Reminder</p>
                <button onClick={() => setAlerts(alerts.filter(a => a._id !== alert._id))} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-bold text-gray-900">{alert.name}</span>'s EMI of <span className="text-rose-600 font-bold">₹{Number(alert.amount).toLocaleString('en-IN')}</span> is due soon.
              </p>
              <button 
                onClick={() => handleMarkPaid(alert._id)}
                className="mt-3 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors uppercase tracking-wider"
              >
                Mark as Success
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
          <div className="mt-3 flex p-1 bg-gray-100 rounded-2xl w-fit border border-gray-200">
            <button 
              onClick={() => setViewMode('Lifetime')}
              className={`px-5 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'Lifetime' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Lifetime
            </button>
            <button 
              onClick={() => setViewMode('Month')}
              className={`px-5 py-1.5 text-xs font-bold rounded-xl transition-all ${viewMode === 'Month' ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              This Month
            </button>
          </div>
        </div>
        <button 
          onClick={() => navigate('/new-entry')}
          className="flex items-center justify-center gap-2 px-6 py-3.5 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all group"
        >
          <span className="text-xl leading-none group-hover:rotate-90 transition-transform">+</span>
          New Entry
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard 
          title="Total Balance" 
          value={stats.totalBalance.toLocaleString('en-IN')} 
          prefix="₹" 
          icon={<MdAccountBalanceWallet size={24} />} 
          colorClass="bg-blue-50 text-blue-600" 
          description="Net current balance"
        />
        <StatCard 
          title="Total Credit" 
          value={stats.totalCredit.toLocaleString('en-IN')} 
          prefix="₹" 
          icon={<MdTrendingUp size={24} />} 
          colorClass="bg-emerald-50 text-emerald-600" 
          description="Total cash inflow"
        />
        <StatCard 
          title="Total Debit" 
          value={stats.totalDebit.toLocaleString('en-IN')} 
          prefix="₹" 
          icon={<MdTrendingDown size={24} />} 
          colorClass="bg-rose-50 text-rose-600" 
          description="Total cash outflow"
        />
        <StatCard 
          title="Entries" 
          value={stats.count.toString()} 
          icon={<MdReceipt size={24} />} 
          colorClass="bg-amber-50 text-amber-600" 
          description="Total transactions"
        />
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Payment Methods */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
               <MdPayment size={20} />
            </div>
            <h4 className="font-bold text-gray-900">Payment Methods</h4>
          </div>

          <div className="space-y-6">
            {/* Cash Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Cash Payments</span>
                <span className="text-sm font-black text-emerald-600">₹{paymentMethodStats.cashAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-1000" 
                  style={{ width: `${(paymentMethodStats.cashCount / totalTxns) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">{paymentMethodStats.cashCount} transactions</p>
            </div>

            {/* Online Breakdown */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-bold text-gray-700">Online Payments</span>
                <span className="text-sm font-black text-primary">₹{paymentMethodStats.onlineAmount.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-1000" 
                  style={{ width: `${(paymentMethodStats.onlineCount / totalTxns) * 100}%` }}
                ></div>
              </div>
              <p className="text-[10px] font-medium text-gray-400 mt-1.5 uppercase tracking-wider">{paymentMethodStats.onlineCount} transactions</p>
            </div>

            {/* App Breakdown */}
            <div className="pt-6 border-t border-gray-50 space-y-4">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Online App Usage</p>
              {appBreakdown.map(app => (
                <div key={app.name} className="flex items-center gap-3 group">
                   <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                      {getAppDetails(app.name, customPaymentApps).logo}
                   </div>
                   <div className="flex-grow">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-gray-800">{app.name}</span>
                        <span className="text-xs font-black" style={{ color: getColor(app.name) }}>₹{app.amount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="w-full h-1 bg-gray-50 rounded-full overflow-hidden">
                         <div className="h-full rounded-full" style={{ width: `${(app.count / totalTxns) * 100}%`, backgroundColor: getColor(app.name) }}></div>
                      </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="lg:col-span-8 space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-full">
              <div className="flex items-center justify-between mb-6">
                <h4 className="font-bold text-gray-900">Income vs Expense</h4>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary"></span> Credit</span>
                   <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> Debit</span>
                </div>
              </div>
              <div className="h-[300px]">
                <IncomeVsExpenseChart transactions={transactions} />
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Transactions Table */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <div className="flex items-center justify-between mb-6 px-2">
                <h4 className="font-bold text-gray-900">Recent Activity</h4>
                <button 
                  onClick={() => navigate('/statements')}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  View All <MdArrowForward />
                </button>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full text-left">
                   <thead>
                      <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-gray-50">
                         <th className="pb-4 px-2">Customer</th>
                         <th className="pb-4 px-2 text-center">Date</th>
                         <th className="pb-4 px-2">Method</th>
                         <th className="pb-4 px-2 text-right">Amount</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {recent.map(t => (
                        <tr key={t._id} className="group hover:bg-gray-50/50 transition-colors">
                           <td className="py-4 px-2">
                              <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors">{t.name} {t.lastName || ''}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${t.type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                 {t.type}
                              </span>
                           </td>
                           <td className="py-4 px-2 text-center">
                              <span className="text-xs font-medium text-gray-500">{new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                           </td>
                           <td className="py-4 px-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 scale-75">
                                    {getAppDetails(t.paymentApp || t.paymentMethod || 'Cash', customPaymentApps).logo}
                                 </div>
                                 <span className="text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                    {t.paymentApp || t.paymentMethod || 'Cash'}
                                 </span>
                              </div>
                           </td>
                           <td className="py-4 px-2 text-right">
                              <span className={`text-sm font-black ${t.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                 {t.type === 'Credit' ? '+' : '-'}₹{Number(t.amount).toLocaleString('en-IN')}
                              </span>
                           </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Revenue Trend Chart */}
          <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h4 className="font-bold text-gray-900 mb-6">Revenue Trend</h4>
             <div className="h-[350px]">
                <MonthlyExpenseChart transactions={transactions} />
             </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
