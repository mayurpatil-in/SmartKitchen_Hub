import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginStart, loginSuccess, loginFailure } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import { Shield, Mail, Lock, LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Route back to original target path or home dashboard
  const from = location.state?.from?.pathname || '/';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      dispatch(addToast({ type: 'warning', message: 'Email and password are required fields.' }));
      return;
    }

    dispatch(loginStart());
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.success) {
        dispatch(loginSuccess(res.data));
        dispatch(addToast({ type: 'success', message: `Welcome back, ${res.data.user.first_name}!` }));
        navigate(from, { replace: true });
      }
    } catch (err) {
      dispatch(loginFailure(err.message));
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // WOW Factor: One-Click preset credential triggers
  const handleQuickLogin = (roleEmail, rolePw) => {
    setEmail(roleEmail);
    setPassword(rolePw);
    dispatch(addToast({ type: 'info', message: 'Credentials loaded! Click Login.' }));
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row relative overflow-hidden font-sans">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-950/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-950/20 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Left Column */}
      <div className="w-full md:w-[45%] bg-slate-900/60 p-8 sm:p-12 lg:p-16 flex flex-col justify-between relative border-b md:border-b-0 md:border-r border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="bg-emerald-600 text-white text-xs font-black p-2 rounded-xl">SKH</span>
          <span className="font-extrabold text-sm text-white uppercase tracking-wider">SmartKitchen <span className="text-emerald-500">Hub</span></span>
        </div>

        <div className="space-y-6 my-12 md:my-0">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Enterprise Commercial Platform
          </span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight">
            Commercial Kitchen <br />
            <span className="text-emerald-500">Equipment Management</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
            Access real-time sales telemetry, customize bulk quotations with custom ReportLab PDFs, audit warehouses, and schedule AMC servicing.
          </p>
        </div>

        <div className="text-[10px] text-slate-500 font-bold select-none">
          © 2026 SmartKitchen Hub Solutions Ltd.
        </div>
      </div>

      {/* Login Form Right Column */}
      <div className="flex-grow p-6 sm:p-12 lg:p-16 flex flex-col justify-center items-center relative">
        <div className="w-full max-w-md space-y-8 bg-slate-900/40 p-6 sm:p-10 rounded-3xl border border-slate-800/50 backdrop-blur-md">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-black text-white">Login Account</h2>
            <p className="text-xs text-slate-450 mt-1 font-semibold">Enter credentials to unlock administrative actions.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Registered Email</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="e.g. admin@smartkitchen.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1.5">Secure Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-4 py-2.5 w-full bg-slate-950/60 border border-slate-800 text-white rounded-xl text-xs placeholder-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:bg-slate-950 transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl transition-all duration-150 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-6 hover:shadow-lg hover:shadow-emerald-950/20"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Login Profiles Divider */}
          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-800/80"></div>
            <span className="flex-shrink mx-4 text-[9px] text-slate-500 font-bold uppercase tracking-wider">Demo Access Profiles</span>
            <div className="flex-grow border-t border-slate-800/80"></div>
          </div>

          {/* One-Click preset buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('admin@smartkitchen.com', 'Admin@123')}
              className="px-3 py-2 bg-slate-900 border border-slate-800/60 text-slate-350 rounded-xl text-[9px] font-bold hover:bg-slate-800 hover:text-white transition-all text-left flex flex-col justify-between"
            >
              <span className="text-white font-extrabold text-[10px]">Marcus (Admin)</span>
              <span className="text-slate-500 mt-1 uppercase tracking-wider text-[8px] font-black">All access</span>
            </button>
            <button
              onClick={() => handleQuickLogin('sales@smartkitchen.com', 'Sales@123')}
              className="px-3 py-2 bg-slate-900 border border-slate-800/60 text-slate-350 rounded-xl text-[9px] font-bold hover:bg-slate-800 hover:text-white transition-all text-left flex flex-col justify-between"
            >
              <span className="text-white font-extrabold text-[10px]">Sarah (Sales)</span>
              <span className="text-slate-500 mt-1 uppercase tracking-wider text-[8px] font-black">Quotes & Orders</span>
            </button>
            <button
              onClick={() => handleQuickLogin('tech@smartkitchen.com', 'Tech@123')}
              className="px-3 py-2 bg-slate-900 border border-slate-800/60 text-slate-350 rounded-xl text-[9px] font-bold hover:bg-slate-800 hover:text-white transition-all text-left flex flex-col justify-between"
            >
              <span className="text-white font-extrabold text-[10px]">Robert (Technician)</span>
              <span className="text-slate-500 mt-1 uppercase tracking-wider text-[8px] font-black">Repairs AMC</span>
            </button>
            <button
              onClick={() => handleQuickLogin('customer@smartkitchen.com', 'Customer@123')}
              className="px-3 py-2 bg-slate-900 border border-slate-800/60 text-slate-350 rounded-xl text-[9px] font-bold hover:bg-slate-800 hover:text-white transition-all text-left flex flex-col justify-between"
            >
              <span className="text-white font-extrabold text-[10px]">John (Customer)</span>
              <span className="text-slate-500 mt-1 uppercase tracking-wider text-[8px] font-black">B2B client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
