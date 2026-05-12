import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MdPerson, 
  MdEmail, 
  MdPhone, 
  MdLock, 
  MdCheckCircle, 
  MdShield,
  MdArrowBack
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Register = () => {
  const [formData, setFormData] = useState({ 
    firstName: '', 
    lastName: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    setLoading(true);
    setError('');
    try {
      await register(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName, 
        formData.phone
      );
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-xl relative z-10">
        {/* Logo and Welcome Section */}
        <div className="text-center mb-8">
           <Link to="/login" className="inline-flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-primary transition-colors mb-4">
              <MdArrowBack size={14} /> Back to Login
           </Link>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-premium p-2.5">
              <img src={logo} alt="Account Manager" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Account</h1>
          <p className="text-gray-500 font-medium mt-1">Join the ultimate finance suite today</p>
        </div>

        {/* Register Card */}
        <div className="bg-white p-8 sm:p-10 rounded-[2.5rem] shadow-premium border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold">
              <MdShield size={20} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl text-sm font-bold">
              <MdCheckCircle size={20} className="flex-shrink-0" />
              Registration successful! Redirecting...
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98]"
          >
            <FcGoogle size={24} />
            Sign up with Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-grow bg-gray-100"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">or create manually</span>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">First Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdPerson size={20} className="text-gray-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    placeholder="John"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  placeholder="Doe"
                  className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdEmail size={20} className="text-gray-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdPhone size={20} className="text-gray-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="+91 00000 00000"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MdLock size={20} className="text-gray-300 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  placeholder="••••••••"
                  className="block w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? "Creating Account..." : "Create Free Account"}
            </button>
          </form>

          <p className="text-center mt-8 text-sm font-bold text-gray-500">
            Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in instead</Link>
          </p>
        </div>

        <div className="text-center mt-10">
          <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.2em]">© 2026 Account Manager Inc. • Secure Platform</p>
        </div>
      </div>
    </div>
  );
};

export default Register;
