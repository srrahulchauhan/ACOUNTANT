import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './layout/Layout';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Customers = lazy(() => import('./pages/Customers'));
const NewEntry = lazy(() => import('./pages/NewEntry'));
const Statements = lazy(() => import('./pages/Statements'));
const Reports = lazy(() => import('./pages/Reports'));
const CalendarView = lazy(() => import('./pages/CalendarView'));
const Settings = lazy(() => import('./pages/Settings'));
const EmiDashboard = lazy(() => import('./pages/EmiDashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));

// Loading component
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-screen bg-white">
    <div className="relative">
       <div className="w-16 h-16 border-4 border-primary/10 border-t-primary rounded-full animate-spin"></div>
       <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-primary rounded-lg animate-pulse"></div>
       </div>
    </div>
    <div className="mt-6 flex flex-col items-center gap-1">
       <h2 className="text-sm font-black text-gray-900 uppercase tracking-[0.3em] ml-1">Accountant</h2>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Optimizing Ledger...</p>
    </div>
  </div>
);




import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { currentUser } = useAuth();

  return (
    <>
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={!currentUser ? <Login /> : <Navigate to="/" replace />} />
        <Route path="/register" element={!currentUser ? <Register /> : <Navigate to="/" replace />} />
        <Route path="/forgot-password" element={!currentUser ? <ForgotPassword /> : <Navigate to="/" replace />} />

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="new-entry" element={<NewEntry />} />
          <Route path="statements" element={<Statements />} />
          <Route path="reports" element={<Reports />} />
          <Route path="calendar" element={<CalendarView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="emi-dashboard" element={<EmiDashboard />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>

    </>
  );
}

export default App;
