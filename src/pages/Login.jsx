import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MdEmail, 
  MdLock, 
  MdLogin, 
  MdArrowForward,
  MdInfo,
  MdShield
} from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.png';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err) {
      console.error(err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (err) {
      setError('Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo and Welcome Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-3xl shadow-premium p-3 mb-6 animate-in zoom-in duration-500">
            <img src={logo} alt="Account Manager" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Welcome Back</h1>
          <p className="text-gray-500 font-medium">Sign in to manage your finance suite</p>
        </div>

        {/* Login Card */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-premium border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold">
              <MdShield size={20} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Social Login */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-4 bg-white border-2 border-gray-100 rounded-2xl font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-200 transition-all active:scale-[0.98]"
          >
            <FcGoogle size={24} />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-8">
            <div className="h-px flex-grow bg-gray-100"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">or use email</span>
            <div className="h-px flex-grow bg-gray-100"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  placeholder="name@example.com"
                  className="block w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold placeholder-gray-300 focus:bg-white focus:border-primary transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <Link to="/forgot-password" size="sm" className="text-[10px] font-bold text-primary hover:underline">Forgot Password?</Link>
              </div>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/25 hover:bg-primary-dark hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   Signing in...
                </div>
              ) : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-8 text-sm font-bold text-gray-500">
            New here? <Link to="/register" className="text-primary hover:underline">Create an account</Link>
          </p>
        </div>

        {/* Footer info */}
        <div className="text-center mt-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm rounded-full border border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest shadow-sm">
            <MdInfo size={14} className="text-primary" />
            Secure SSL Encrypted Connection
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
