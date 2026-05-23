import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { logout, updateUser } from '../redux/slices/authSlice';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import { 
  LayoutDashboard, Utensils, Users, FileText, Package, 
  ShoppingCart, Wrench, Bell, LogOut, Menu, X, 
  Send, MessageSquare, Check, UserCircle, AlertCircle, RefreshCw
} from 'lucide-react';

const MainLayout = ({ children }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Responsive state controls
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Profile settings state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);

  const handleOpenProfile = () => {
    setProfileFirstName(user?.first_name || '');
    setProfileLastName(user?.last_name || '');
    setProfileEmail(user?.email || '');
    setProfilePassword('');
    setProfileConfirmPassword('');
    setIsProfileOpen(true);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileFirstName.trim() || !profileLastName.trim() || !profileEmail.trim()) {
      dispatch(addToast({ type: 'warning', message: 'First name, last name, and email are required.' }));
      return;
    }
    if (profilePassword) {
      if (profilePassword.length < 6) {
        dispatch(addToast({ type: 'warning', message: 'Password must be at least 6 characters.' }));
        return;
      }
      if (profilePassword !== profileConfirmPassword) {
        dispatch(addToast({ type: 'warning', message: 'Passwords do not match.' }));
        return;
      }
    }

    try {
      setIsProfileSubmitting(true);
      const payload = {
        first_name: profileFirstName.trim(),
        last_name: profileLastName.trim(),
        email: profileEmail.trim()
      };
      if (profilePassword) {
        payload.password = profilePassword;
      }

      const res = await API.put('/auth/profile', payload);
      if (res.success) {
        dispatch(updateUser(res.data.user));
        dispatch(addToast({ type: 'success', message: 'Your profile has been updated successfully.' }));
        setIsProfileOpen(false);
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsProfileSubmitting(false);
    }
  };
  
  // AI chatbot state
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState([
    { 
      sender: 'bot', 
      text: `Hello ${user?.first_name || 'there'}! I am your SmartKitchen Hub AI Assistant. How can I help you optimize your kitchen operations today? You can ask me for equipment recommendations, check warehouse stock levels, or draft a service call request.`
    }
  ]);
  const [aiInput, setAiInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  // Fetch Notifications
  const fetchNotifications = async () => {
    try {
      if (user) {
        const res = await API.get('/api/notifications');
        if (res.success) {
          setNotifications(res.data);
          setUnreadCount(res.data.filter(n => !n.is_read).length);
        }
      }
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); // refresh notifications every 20s
    return () => clearInterval(interval);
  }, [user]);

  // Scroll chatbot to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiTyping]);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(addToast({ type: 'info', message: 'Logged out successfully.' }));
    navigate('/login');
  };

  const markNotificationRead = async (id) => {
    try {
      const res = await API.put(`/api/notifications/${id}/read`);
      if (res.success) {
        fetchNotifications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      const res = await API.put('/api/notifications/read-all');
      if (res.success) {
        fetchNotifications();
        dispatch(addToast({ type: 'success', message: 'All alerts cleared.' }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chatbot logic
  const handleSendAiMessage = (e) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    const userQuery = aiInput;
    setAiMessages(prev => [...prev, { sender: 'user', text: userQuery }]);
    setAiInput('');
    setIsAiTyping(true);

    // Mock contextual B2B responses matching SmartKitchen Hub products
    setTimeout(() => {
      let reply = "I'm processing that request. For deep telemetry data or purchase inquiries, please check the relative tab on the sidebar. How else can I assist you?";
      const q = userQuery.toLowerCase();

      if (q.includes('oven') || q.includes('convection') || q.includes('cook')) {
        reply = "Our ChefMaster 6-Burner Gas Convection Range (SKU: OVR-G60-CON) is highly recommended for commercial setups. It fires at 180,000 BTU/hr and is perfect for fast baking and frying. Currently, we have 3 units remaining in the Goregaon warehouse.";
      } else if (q.includes('fridge') || q.includes('refrigerator') || q.includes('cool')) {
        reply = "For heavy-duty refrigeration, the SuperCool Double Door Upright Refrigerator (SKU: REF-O50-COL) features digital temperature logs and a spacious 1000L layout. Perfect for holding inventory prep items at 2°C.";
      } else if (q.includes('mixer') || q.includes('prep') || q.includes('food')) {
        reply = "The PowerMix 20-Quart Planetary Mixer (SKU: MIX-P20-HEA) is an excellent addition. It runs on a 1.5 HP motor, includes bowl attachments, and is perfect for high-viscosity dough mixing.";
      } else if (q.includes('service') || q.includes('repair') || q.includes('amc') || q.includes('maintenance')) {
        reply = "To schedule a service call, map an AMC, or file a warranty request, navigate to the 'Service & Maintenance' tab. Admins and Sales managers can schedule Robert Miller or other certified technicians to resolve tickets.";
      } else if (q.includes('quotation') || q.includes('invoice') || q.includes('quote')) {
        reply = "Our Quotation Builder under 'Quotations' lets you compile equipment items with precise tax and discount rates, print professional invoices, and download ReportLab generated PDFs in one click.";
      } else if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
        reply = `Hi there! I can help you with: \n1. Refrigerator recommendations \n2. Oven specs (SKU OVR-G60-CON) \n3. Repair ticket scheduling \n4. Quotation PDF logs. What can I look up?`;
      }

      setIsAiTyping(false);
      setAiMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 1200);
  };

  // Define sidebar navigation items based on User Role
  const navigationConfig = {
    Admin: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/products', label: 'Products & Categories', icon: Utensils },
      { path: '/customers', label: 'B2B Customers', icon: Users },
      { path: '/quotations', label: 'Quotation Builder', icon: FileText },
      { path: '/orders', label: 'Order Processing', icon: ShoppingCart },
      { path: '/inventory', label: 'Warehouse Stock', icon: Package },
      { path: '/services', label: 'Service & Maintenance', icon: Wrench },
    ],
    "Sales Manager": [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard },
      { path: '/products', label: 'Products Catalog', icon: Utensils },
      { path: '/customers', label: 'Customers CRM', icon: Users },
      { path: '/quotations', label: 'Quotations', icon: FileText },
      { path: '/orders', label: 'Orders Management', icon: ShoppingCart },
      { path: '/inventory', label: 'Inventory Audit', icon: Package },
    ],
    Technician: [
      { path: '/services', label: 'My Service Requests', icon: Wrench },
    ],
    Customer: [
      { path: '/products', label: 'Products Catalog', icon: Utensils },
      { path: '/quotations', label: 'My Quotations', icon: FileText },
      { path: '/orders', label: 'My Purchase Orders', icon: ShoppingCart },
      { path: '/services', label: 'Service Requests', icon: Wrench },
    ]
  };

  const navLinks = navigationConfig[user?.role || 'Customer'] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 lg:hidden focus:outline-none transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-300" />
          </button>
          <Link to="/" className="flex items-center gap-2">
            <span className="bg-emerald-600 text-white text-xs font-black p-1.5 rounded-lg tracking-wider">SKH</span>
            <span className="font-bold text-sm tracking-tight hidden sm:inline-block">SmartKitchen <span className="text-emerald-500">Hub</span></span>
          </Link>
        </div>

        {/* Action Center (Alerts, Profile, LogOut) */}
        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          {user?.role !== "Customer" && user?.role !== "Technician" && (
            <div className="relative">
              <button 
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center justify-center relative hover:scale-105"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-slate-100 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-in">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">System Alerts</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllNotificationsRead}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold hover:underline"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-[11px] text-slate-400">No active alerts.</div>
                    ) : (
                      notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`p-3 text-[11px] flex gap-2.5 transition-colors duration-150 ${n.is_read ? 'bg-white' : 'bg-slate-50/70'}`}
                        >
                          <div className="mt-0.5 text-emerald-600">
                            <AlertCircle className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-grow space-y-0.5">
                            <p className="font-bold text-slate-800">{n.title}</p>
                            <p className="text-slate-500 leading-normal">{n.message}</p>
                          </div>
                          {!n.is_read && (
                            <button 
                              onClick={() => markNotificationRead(n.id)}
                              className="text-[10px] self-start text-slate-400 hover:text-slate-700 p-0.5"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Quick Tag */}
          <button 
            onClick={handleOpenProfile}
            title="Edit My Profile"
            className="flex items-center gap-2 bg-slate-800/60 hover:bg-slate-750 active:scale-95 pl-2 pr-3 py-1 rounded-full border border-slate-800 focus:outline-none transition-all cursor-pointer select-none text-left"
          >
            <UserCircle className="w-5 h-5 text-emerald-500" />
            <div className="text-left hidden md:block">
              <p className="text-[10px] font-bold leading-tight">{user?.first_name} {user?.last_name}</p>
              <p className="text-[8px] text-slate-400 font-semibold uppercase tracking-wider">{user?.role}</p>
            </div>
          </button>

          {/* Logout Button */}
          <button 
            onClick={handleLogout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors flex items-center justify-center"
            title="Log Out"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div className="flex-grow flex relative">
        {/* Desktop Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 hidden lg:flex flex-col flex-shrink-0">
          <nav className="flex-grow p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 scale-[1.02]' 
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 font-bold text-center">
            SmartKitchen Hub v1.0.0
          </div>
        </aside>

        {/* Mobile Sidebar Overlay Drawer */}
        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200">
            <div className="absolute inset-0" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative w-64 max-w-xs bg-slate-900 text-white flex flex-col h-full shadow-2xl animate-slide-in">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
                <span className="font-bold text-xs tracking-tight">Navigation Menu</span>
                <button 
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-850"
                >
                  <X className="w-4.5 h-4.5 text-slate-400" />
                </button>
              </div>
              <nav className="flex-grow p-4 space-y-1 overflow-y-auto">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive 
                          ? 'bg-emerald-600 text-white shadow-lg' 
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

        {/* Central Router Output View */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full">
          {children}
        </main>
      </div>

      {/* FLOATING AI ASSISTANT WIDGET */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3 pointer-events-none">
        {/* Floating Chat Bubble */}
        <button
          onClick={() => setIsAiOpen(!isAiOpen)}
          className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl border-2 border-white hover:bg-emerald-700 hover:scale-110 active:scale-95 transition-all duration-200 pointer-events-auto hover:rotate-12"
          title="Ask AI Assistant"
        >
          <MessageSquare className="w-5 h-5 animate-pulse" />
        </button>

        {/* sliding AI side drawer */}
        {isAiOpen && (
          <div className="w-80 sm:w-96 h-[500px] max-h-[80vh] bg-white border border-slate-100 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto animate-slide-in">
            {/* AI Drawer Header */}
            <div className="px-4 py-3 bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-white/20 p-1 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-white animate-spin-slow" />
                </span>
                <div>
                  <h4 className="text-xs font-bold leading-none">SmartKitchen AI Planner</h4>
                  <span className="text-[9px] text-emerald-200 font-semibold">Ready to recommend specs & scheduling</span>
                </div>
              </div>
              <button 
                onClick={() => setIsAiOpen(false)}
                className="p-1 rounded-lg hover:bg-emerald-850"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* AI Messages Body */}
            <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-50/50">
              {aiMessages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[11px] leading-relaxed ${
                    m.sender === 'user' 
                      ? 'bg-slate-800 text-white rounded-tr-none' 
                      : 'bg-white text-slate-700 border border-slate-150 rounded-tl-none shadow-xs'
                  }`}>
                    {m.text.split('\n').map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? 'mt-1' : ''}>{line}</p>
                    ))}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-slate-150 rounded-2xl rounded-tl-none px-3.5 py-2 text-[11px] text-slate-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* AI Input Form */}
            <form onSubmit={handleSendAiMessage} className="p-3 border-t border-slate-100 bg-white flex gap-2">
              <input
                type="text"
                placeholder="Ask about ovens, refrigerators, AMCs..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="flex-grow border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-slate-400"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-3 py-1.5 flex items-center justify-center transition-colors scale-100 active:scale-95 duration-150"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* PERSONAL PROFILE MODAL */}
      <Modal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        title="Personal Profile Settings"
        size="md"
      >
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
              <UserCircle className="w-3 h-3 text-white" />
            </div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Account Details</span>
            <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text" required
                value={profileFirstName}
                onChange={(e) => setProfileFirstName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text" required
                value={profileLastName}
                onChange={(e) => setProfileLastName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email" required
              value={profileEmail}
              onChange={(e) => setProfileEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
            />
          </div>

          <div className="flex items-center gap-2 mt-4 mb-3">
            <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-black text-white">**</span>
            </div>
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Change Password</span>
            <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="••••••"
                value={profileConfirmPassword}
                onChange={(e) => setProfileConfirmPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
              />
            </div>
          </div>

          <p className="text-[10px] text-slate-400 font-semibold italic">
            * Leave password fields blank if you do not wish to change your current password.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 mt-2">
            <button
              type="button" onClick={() => setIsProfileOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isProfileSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-70"
            >
              {isProfileSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default MainLayout;
