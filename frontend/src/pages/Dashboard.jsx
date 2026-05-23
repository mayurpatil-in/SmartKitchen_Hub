import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import API from '../api';
import { CardSkeleton } from '../components/Skeleton';
import { 
  Utensils, Wrench, FileText, ShoppingCart, 
  DollarSign, TrendingUp, AlertTriangle, Clock 
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Legend, PieChart, Pie, Cell 
} from 'recharts';

const Dashboard = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/analytics/dashboard');
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 bg-white rounded-2xl border border-slate-100 p-6 animate-pulse" />
          <div className="h-72 bg-white rounded-2xl border border-slate-100 p-6 animate-pulse" />
        </div>
      </div>
    );
  }

  const { summary, low_stock_alerts, category_distribution, monthly_analytics, recent_activities } = data || {};

  // Pie chart accent colors for categories
  const COLORS = ['#0f766e', '#4f46e5', '#d97706', '#be185d'];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Welcome Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 leading-tight">Operational Command Center</h1>
          <p className="text-[11px] text-slate-500 font-semibold mt-0.5">Welcome back, {user?.first_name} | SmartKitchen Hub B2B Overview</p>
        </div>
        <span className="self-start sm:self-center text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider select-none">
          Live Telemetry Active
        </span>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-800 shadow-md text-white flex justify-between items-start transition-all hover:scale-[1.01]">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Sales Revenue</span>
            <h3 className="text-2xl font-black">${summary?.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            <span className="text-[9px] text-emerald-400 font-semibold flex items-center gap-1 leading-none">
              <TrendingUp className="w-3 h-3" /> Excludes cancellations
            </span>
          </div>
          <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
        </div>

        {/* Quotations Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start transition-all hover:scale-[1.01] hover:shadow-md">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Proposals Raised</span>
            <h3 className="text-2xl font-black text-slate-850">{summary?.total_quotations}</h3>
            <p className="text-[9px] text-slate-550 font-semibold">Active pricing estimates</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start transition-all hover:scale-[1.01] hover:shadow-md">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Orders</span>
            <h3 className="text-2xl font-black text-slate-850">{summary?.total_orders}</h3>
            <p className="text-[9px] text-slate-550 font-semibold">Logged transaction accounts</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
        </div>

        {/* Service Tickets Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start transition-all hover:scale-[1.01] hover:shadow-md">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Servicing Tickets</span>
            <h3 className="text-2xl font-black text-slate-850">{summary?.total_inquiries}</h3>
            <p className="text-[9px] text-slate-550 font-semibold">Active warranty & AMC repairs</p>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150">
            <Wrench className="w-5 h-5 text-amber-600" />
          </div>
        </div>
      </div>

      {/* Main Charts & Telemetry Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - TELEMETRY CHARTS */}
        <div className="lg:col-span-2 space-y-6">
          {/* Revenue Area Chart */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800">B2B Monthly Sales Progression</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Consolidated gross sales trends of past 6 months</p>
            </div>
            <div className="h-64 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly_analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickFormatter={(val) => `$${val/1000}k`} />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart comparing Quotations vs Inquiries */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Estimates vs Maintenance Tickets</h3>
              <p className="text-[10px] text-slate-400 font-semibold">Analyzes transaction draft conversions against ticket volumes</p>
            </div>
            <div className="h-64 text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly_analytics} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                  <YAxis stroke="#94a3b8" fontSize={9} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
                  <Bar dataKey="quotations" name="Quotes Drafted" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="inquiries" name="Repair Calls" fill="#d97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - ALERTS AND ACTION LOGS */}
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Critical Stock Audits</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Items under safety threshold (&lt; 5 units)</p>
              </div>
              <AlertTriangle className="w-4.5 h-4.5 text-rose-500" />
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {low_stock_alerts.length === 0 ? (
                <div className="p-6 text-center text-[10px] text-slate-450 border border-dashed border-slate-100 rounded-xl font-bold bg-slate-50/40">
                  All inventory balances safe.
                </div>
              ) : (
                low_stock_alerts.map((item) => (
                  <div key={item.id} className="p-3 border border-rose-100 bg-rose-50/20 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <p className="font-extrabold text-slate-800 text-[11px] leading-tight">{item.name}</p>
                      <p className="text-[9px] text-slate-500 font-semibold mt-0.5">SKU: {item.sku}</p>
                    </div>
                    <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-md border border-rose-200">
                      {item.stock_quantity} left
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Unified Action Feed */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800">Command Activity Log</h3>
                <p className="text-[10px] text-slate-400 font-semibold">Unified timeline of latest operations</p>
              </div>
              <Clock className="w-4.5 h-4.5 text-slate-400 animate-spin-slow" />
            </div>

            <div className="relative border-l-2 border-slate-100 space-y-4 pl-4 max-h-[350px] overflow-y-auto pr-1">
              {recent_activities.length === 0 ? (
                <div className="py-8 text-center text-[10px] text-slate-400">No recent logging logged.</div>
              ) : (
                recent_activities.map((act) => {
                  const isQuote = act.type === 'Quotation';
                  const isOrder = act.type === 'Order';
                  
                  const badgeStyle = isOrder 
                    ? 'bg-blue-50 border-blue-100 text-blue-700' 
                    : isQuote 
                      ? 'bg-indigo-50 border-indigo-100 text-indigo-700' 
                      : 'bg-amber-50 border-amber-100 text-amber-700';

                  return (
                    <div key={act.id} className="relative text-[11px]">
                      {/* Timeline dot */}
                      <span className={`absolute -left-[21.5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                        isOrder ? 'bg-blue-600' : isQuote ? 'bg-indigo-600' : 'bg-amber-600'
                      }`} />
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md border uppercase ${badgeStyle}`}>
                            {act.type}
                          </span>
                          <span className="text-[9px] text-slate-400 font-bold">
                            {new Date(act.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="font-bold text-slate-800 leading-tight">{act.title}</p>
                        <p className="text-slate-500 leading-normal font-semibold">{act.description}</p>
                        {act.amount > 0 && (
                          <p className="text-[10px] font-black text-slate-800 mt-0.5">Value: ${act.amount.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
