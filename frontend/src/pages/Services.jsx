import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Wrench, CheckCircle, Clock, Calendar, Plus,
  ClipboardList, UserCircle, Search, X, ChevronLeft,
  ChevronRight, Package, Building2, AlertTriangle,
  User, Tag, FileText, BarChart3, Activity,
  XCircle, RefreshCw, Zap, ShieldCheck
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Status config
───────────────────────────────────────────────────────── */
const STATUS_CFG = {
  Pending:      { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   pulse: true,  icon: Clock },
  Assigned:     { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500',  pulse: false, icon: User },
  'In Progress':{ bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    pulse: false, icon: RefreshCw },
  Completed:    { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', pulse: false, icon: CheckCircle },
  Cancelled:    { bg: 'bg-slate-100',  text: 'text-slate-500',   border: 'border-slate-200',   dot: 'bg-slate-400',   pulse: false, icon: XCircle },
};

const SERVICE_TYPE_CFG = {
  Repair:      { icon: Wrench,       color: 'text-rose-500',   bg: 'bg-rose-50',   border: 'border-rose-200'   },
  Maintenance: { icon: ShieldCheck,  color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200'   },
  Warranty:    { icon: Tag,          color: 'text-violet-500', bg: 'bg-violet-50', border: 'border-violet-200' },
  General:     { icon: ClipboardList,color: 'text-slate-500',  bg: 'bg-slate-50',  border: 'border-slate-200'  },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CFG[status] || STATUS_CFG['Cancelled'];
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Form field wrapper
───────────────────────────────────────────────────────── */
const Field = ({ label, children }) => (
  <div>
    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-all';

/* ─────────────────────────────────────────────────────────
   Section divider used inside modals
───────────────────────────────────────────────────────── */
const SectionHead = ({ icon: Icon, label, color = 'bg-emerald-600' }) => (
  <div className="flex items-center gap-2 mb-3">
    <div className={`w-5 h-5 rounded-md ${color} flex items-center justify-center`}>
      <Icon className="w-3 h-3 text-white" />
    </div>
    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{label}</span>
    <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
const Services = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const isCustomer  = user?.role === 'Customer';
  const isTechnician = user?.role === 'Technician';
  const canEdit     = user?.role === 'Admin' || user?.role === 'Sales Manager';

  /* ── Data ─────────────────────────────────────────── */
  const [tickets, setTickets]         = useState([]);
  const [customers, setCustomers]     = useState([]);
  const [products, setProducts]       = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [totalItems, setTotalItems]   = useState(0);
  const [page, setPage]               = useState(1);
  const [pages, setPages]             = useState(1);
  const [isLoading, setIsLoading]     = useState(true);

  /* ── Filters ──────────────────────────────────────── */
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery]   = useState('');

  /* ── Modals ───────────────────────────────────────── */
  const [selectedTicket, setSelectedTicket]   = useState(null);
  const [isCreateOpen, setIsCreateOpen]       = useState(false);
  const [isAssignOpen, setIsAssignOpen]       = useState(false);
  const [isResolveOpen, setIsResolveOpen]     = useState(false);
  const [isDetailOpen, setIsDetailOpen]       = useState(false);
  const [isSubmitting, setIsSubmitting]       = useState(false);

  /* ── Create form ──────────────────────────────────── */
  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('Repair');
  const [customerId, setCustomerId]   = useState('');
  const [productId, setProductId]     = useState('');

  /* ── Assign form ──────────────────────────────────── */
  const [techId, setTechId]           = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  /* ── Resolve form ─────────────────────────────────── */
  const [resStatus, setResStatus] = useState('Completed');
  const [resNotes, setResNotes]   = useState('');

  /* ── Fetchers ─────────────────────────────────────── */
  const fetchDependencies = async () => {
    try {
      if (canEdit) {
        const custRes = await API.get('/api/customers');
        if (custRes.success) setCustomers(custRes.data.items);
        const prodRes = await API.get('/api/products', { params: { per_page: 100 } });
        if (prodRes.success) setProducts(prodRes.data.items);
        setTechnicians([{ id: 3, first_name: 'Robert', last_name: 'Miller' }]);
      }
    } catch (err) { console.error(err); }
  };

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/services', {
        params: { status: statusFilter || undefined, page, per_page: 10 },
      });
      if (res.success) {
        setTickets(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchDependencies(); }, []);
  useEffect(() => { fetchTickets(); }, [page, statusFilter]);

  /* ── Handlers ─────────────────────────────────────── */
  const handleOpenCreate = () => {
    setTitle(''); setDescription(''); setServiceType('Repair');
    setCustomerId(customers[0]?.id || '');
    setProductId(products[0]?.id || '');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await API.post('/api/services', {
        title, description, service_type: serviceType,
        customer_id: isCustomer ? null : parseInt(customerId),
        product_id: productId ? parseInt(productId) : null,
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Service ticket logged successfully.' }));
        setIsCreateOpen(false);
        fetchTickets();
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenAssign = (ticket) => {
    setSelectedTicket(ticket);
    setTechId(technicians[0]?.id || '3');
    const tmr = new Date(); tmr.setDate(tmr.getDate() + 1); tmr.setHours(14, 0, 0, 0);
    setScheduleDate(tmr.toISOString().slice(0, 16));
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await API.post(`/api/services/${selectedTicket.id}/assign`, {
        technician_id: parseInt(techId),
        scheduled_date: `${scheduleDate}:00`,
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Technician assigned successfully.' }));
        setIsAssignOpen(false);
        fetchTickets();
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
    finally { setIsSubmitting(false); }
  };

  const handleOpenResolve = (ticket) => {
    setSelectedTicket(ticket);
    setResStatus('Completed');
    setResNotes('');
    setIsResolveOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await API.put(`/api/services/${selectedTicket.id}/resolution`, {
        status: resStatus,
        resolution_notes: resNotes,
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Service ticket resolved.' }));
        setIsResolveOpen(false);
        fetchTickets();
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
    finally { setIsSubmitting(false); }
  };

  /* ── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => ({
    pending:    tickets.filter((t) => t.status === 'Pending').length,
    assigned:   tickets.filter((t) => t.status === 'Assigned').length,
    inProgress: tickets.filter((t) => t.status === 'In Progress').length,
    completed:  tickets.filter((t) => t.status === 'Completed').length,
  }), [tickets]);

  /* ── Filtered list ─────────────────────────────────── */
  const displayed = useMemo(() => {
    if (!searchQuery) return tickets;
    const q = searchQuery.toLowerCase();
    return tickets.filter(
      (t) => t.title?.toLowerCase().includes(q) || t.customer_name?.toLowerCase().includes(q)
    );
  }, [tickets, searchQuery]);

  /* ── Pagination numbers ──────────────────────────── */
  const pageNumbers = useMemo(() => {
    const arr = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) arr.push(i);
    return arr;
  }, [page, pages]);

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════════════ */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1a1f35 50%, #0c1220 100%)' }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }} />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-500/20 border border-violet-500/30 text-violet-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Field Service
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Service &amp; Maintenance</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Manage AMC contracts, warranty servicing &amp; technician dispatches for kitchen equipment
            </p>

            {/* Stat chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 flex-shrink-0" />
                <span className="text-[10px] text-white font-bold">{totalItems} Tickets</span>
              </div>
              {stats.pending > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 animate-pulse" />
                  <span className="text-[10px] text-amber-300 font-bold">{stats.pending} Pending</span>
                </div>
              )}
              {stats.assigned > 0 && (
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-[10px] text-indigo-300 font-bold">{stats.assigned} Assigned</span>
                </div>
              )}
              {stats.inProgress > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                  <span className="text-[10px] text-blue-300 font-bold">{stats.inProgress} In Progress</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-[10px] text-white font-bold">{stats.completed} Resolved</span>
              </div>
            </div>
          </div>

          {/* CTA button */}
          {(isCustomer || canEdit) && (
            <button
              onClick={handleOpenCreate}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-violet-900/40 transition-all hover:scale-105 active:scale-95 self-start sm:self-center"
            >
              <Plus className="w-4 h-4" /> Open Repair Ticket
            </button>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          SEARCH + STATUS FILTER RIBBON
      ════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by ticket title or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 flex-nowrap flex-shrink-0">
          {['', 'Pending', 'Assigned', 'In Progress', 'Completed', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 flex-shrink-0 whitespace-nowrap ${
                statusFilter === s
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
              }`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TICKETS TABLE / CARD LIST
      ════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-2/5" />
                <div className="h-2 bg-slate-100 rounded-full w-1/3" />
              </div>
              <div className="h-5 bg-slate-100 rounded-full w-20" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}>
            <Wrench className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Service Tickets Found</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {statusFilter || searchQuery ? 'No tickets match your current filters.' : 'Open a ticket to log a repair, AMC or warranty call.'}
          </p>
          {(statusFilter || searchQuery) && (
            <button onClick={() => { setStatusFilter(''); setSearchQuery(''); }}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Strip */}
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {totalItems} ticket{totalItems !== 1 ? 's' : ''}
              </span>
              {statusFilter && <StatusBadge status={statusFilter} />}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                    <th className="px-5 py-3.5">Ticket</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Schedule</th>
                    <th className="px-5 py-3.5">Technician</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {displayed.map((ticket) => {
                    const typeCfg = SERVICE_TYPE_CFG[ticket.service_type] || SERVICE_TYPE_CFG.General;
                    const TypeIcon = typeCfg.icon;
                    return (
                      <tr key={ticket.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                        {/* Ticket */}
                        <td className="px-5 py-4 max-w-[220px]">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeCfg.bg} ${typeCfg.border}`}>
                              <TypeIcon className={`w-3.5 h-3.5 ${typeCfg.color}`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold text-slate-800 leading-tight truncate">{ticket.title}</p>
                              <span className={`text-[8px] font-black uppercase tracking-wider ${typeCfg.color}`}>{ticket.service_type}</span>
                            </div>
                          </div>
                        </td>
                        {/* Client */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3 h-3 text-slate-300 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{ticket.customer_name}</p>
                              {ticket.product_name && (
                                <p className="text-[9px] text-slate-400 truncate max-w-[120px]">{ticket.product_name}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        {/* Schedule */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="text-xs text-slate-600 font-semibold">
                              {ticket.scheduled_date
                                ? new Date(ticket.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                : <span className="text-slate-400 font-normal italic">Not scheduled</span>
                              }
                            </span>
                          </div>
                        </td>
                        {/* Technician */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center flex-shrink-0">
                              <User className="w-2.5 h-2.5 text-slate-500" />
                            </div>
                            <span className={`text-xs font-semibold ${ticket.technician_name ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                              {ticket.technician_name || 'Unassigned'}
                            </span>
                          </div>
                        </td>
                        {/* Status */}
                        <td className="px-5 py-4 text-center">
                          <StatusBadge status={ticket.status} />
                        </td>
                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            {/* View */}
                            <button
                              onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all hover:scale-110 active:scale-95"
                              title="View ticket details"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            {/* Assign */}
                            {canEdit && ticket.status === 'Pending' && (
                              <button
                                onClick={() => handleOpenAssign(ticket)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm"
                              >
                                <Calendar className="w-3 h-3" /> Assign
                              </button>
                            )}
                            {/* Resolve */}
                            {(isTechnician || canEdit) && (ticket.status === 'Assigned' || ticket.status === 'In Progress') && (
                              <button
                                onClick={() => handleOpenResolve(ticket)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all hover:scale-105 active:scale-95 shadow-sm"
                              >
                                <Wrench className="w-3 h-3" /> Resolve
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="divide-y divide-slate-100 md:hidden">
              {displayed.map((ticket) => {
                const typeCfg = SERVICE_TYPE_CFG[ticket.service_type] || SERVICE_TYPE_CFG.General;
                const TypeIcon = typeCfg.icon;
                return (
                  <div key={ticket.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${typeCfg.bg} ${typeCfg.border}`}>
                          <TypeIcon className={`w-3.5 h-3.5 ${typeCfg.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-800 leading-tight">{ticket.title}</p>
                          <span className={`text-[8px] font-black uppercase ${typeCfg.color}`}>{ticket.service_type}</span>
                        </div>
                      </div>
                      <StatusBadge status={ticket.status} />
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-slate-500 font-semibold">
                      <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{ticket.customer_name}</span>
                      {ticket.scheduled_date && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                          {new Date(ticket.scheduled_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => { setSelectedTicket(ticket); setIsDetailOpen(true); }}
                        className="flex-grow flex items-center justify-center gap-1.5 py-1.5 border border-slate-200 bg-white text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                      >
                        <FileText className="w-3.5 h-3.5" /> View
                      </button>
                      {canEdit && ticket.status === 'Pending' && (
                        <button
                          onClick={() => handleOpenAssign(ticket)}
                          className="flex-grow flex items-center justify-center gap-1.5 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-xl hover:bg-indigo-700 transition-all"
                        >
                          <Calendar className="w-3.5 h-3.5" /> Assign
                        </button>
                      )}
                      {(isTechnician || canEdit) && (ticket.status === 'Assigned' || ticket.status === 'In Progress') && (
                        <button
                          onClick={() => handleOpenResolve(ticket)}
                          className="flex-grow flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white text-[10px] font-bold rounded-xl hover:bg-emerald-700 transition-all"
                        >
                          <Wrench className="w-3.5 h-3.5" /> Resolve
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold">
                Page <span className="text-slate-700">{page}</span> of <span className="text-slate-700">{pages}</span>
                <span className="text-slate-400 ml-2">· {totalItems} total</span>
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pageNumbers.map((n) => (
                  <button key={n} onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${n === page ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage((p) => Math.min(p + 1, pages))} disabled={page === pages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: TICKET DETAIL VIEW
      ════════════════════════════════════════════════ */}
      {selectedTicket && (
        <Modal isOpen={isDetailOpen} onClose={() => setIsDetailOpen(false)}
          title={`Ticket: ${selectedTicket.title}`} size="md">
          <div className="space-y-4">
            {/* Header band */}
            <div className="bg-slate-900 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                {(() => {
                  const typeCfg = SERVICE_TYPE_CFG[selectedTicket.service_type] || SERVICE_TYPE_CFG.General;
                  const TypeIcon = typeCfg.icon;
                  return (
                    <div className="flex items-center gap-2 mb-1">
                      <TypeIcon className={`w-3.5 h-3.5 ${typeCfg.color}`} />
                      <span className={`text-[9px] font-black uppercase tracking-widest ${typeCfg.color}`}>
                        {selectedTicket.service_type}
                      </span>
                    </div>
                  );
                })()}
                <h3 className="text-sm font-extrabold text-white leading-tight">{selectedTicket.title}</h3>
              </div>
              <StatusBadge status={selectedTicket.status} />
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Client', value: selectedTicket.customer_name, icon: Building2 },
                { label: 'Equipment', value: selectedTicket.product_name || 'N/A', icon: Package },
                {
                  label: 'Scheduled', icon: Calendar,
                  value: selectedTicket.scheduled_date
                    ? new Date(selectedTicket.scheduled_date).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                    : 'Not scheduled',
                },
                { label: 'Technician', value: selectedTicket.technician_name || 'Unassigned', icon: User },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className="w-3 h-3 text-slate-400" />
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {selectedTicket.description && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Problem Description</p>
                <p className="text-xs text-slate-700 leading-relaxed">{selectedTicket.description}</p>
              </div>
            )}

            {/* Resolution notes */}
            {selectedTicket.resolution_notes && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1.5">Resolution Notes</p>
                <p className="text-xs text-emerald-800 leading-relaxed">{selectedTicket.resolution_notes}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 border-t border-slate-100 pt-4">
              {canEdit && selectedTicket.status === 'Pending' && (
                <button
                  onClick={() => { setIsDetailOpen(false); handleOpenAssign(selectedTicket); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-xl transition-all"
                >
                  <Calendar className="w-3.5 h-3.5" /> Assign Technician
                </button>
              )}
              {(isTechnician || canEdit) && (selectedTicket.status === 'Assigned' || selectedTicket.status === 'In Progress') && (
                <button
                  onClick={() => { setIsDetailOpen(false); handleOpenResolve(selectedTicket); }}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-xl transition-all"
                >
                  <Wrench className="w-3.5 h-3.5" /> Resolve Ticket
                </button>
              )}
              <button
                onClick={() => setIsDetailOpen(false)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all text-center"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: CREATE TICKET
      ════════════════════════════════════════════════ */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}
        title="Open Maintenance & Repair Ticket" size="md">
        <form onSubmit={handleCreateSubmit} className="space-y-5">

          <SectionHead icon={Tag} label="Ticket Classification" color="bg-violet-600" />

          {/* Service type cards */}
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(SERVICE_TYPE_CFG).map(([type, cfg]) => {
              const Icon = cfg.icon;
              const active = serviceType === type;
              return (
                <button
                  key={type} type="button" onClick={() => setServiceType(type)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all text-left ${
                    active
                      ? `${cfg.bg} ${cfg.border} shadow-sm`
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${active ? cfg.color : 'text-slate-400'}`} />
                  <span className={`text-[10px] font-black uppercase tracking-wider ${active ? cfg.color : 'text-slate-500'}`}>{type}</span>
                </button>
              );
            })}
          </div>

          {/* Client + Product */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {!isCustomer && (
              <Field label="B2B Client *">
                <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputCls}>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Equipment (Product)">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputCls}>
                <option value="">None / General Inquiry</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </Field>
          </div>

          <SectionHead icon={FileText} label="Ticket Details" color="bg-slate-800" />

          <Field label="Ticket Title *">
            <input type="text" required placeholder="e.g. Upright refrigerator compressor not kicking in"
              value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>

          <Field label="Problem Description *">
            <textarea required placeholder="Describe temperature anomalies, heating indicators, physical leaks, or installation requirements..." rows={3}
              value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </Field>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70">
              {isSubmitting
                ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Logging…</>
                : <><Plus className="w-3.5 h-3.5" />Log Service Call</>
              }
            </button>
          </div>
        </form>
      </Modal>

      {/* ════════════════════════════════════════════════
          MODAL: ASSIGN TECHNICIAN
      ════════════════════════════════════════════════ */}
      {selectedTicket && (
        <Modal isOpen={isAssignOpen} onClose={() => setIsAssignOpen(false)}
          title={`Assign Technician: ${selectedTicket?.title}`} size="sm">
          <form onSubmit={handleAssignSubmit} className="space-y-5">

            {/* Ticket preview */}
            <div className="bg-slate-900 rounded-xl px-4 py-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Ticket</p>
              <p className="text-sm font-extrabold text-white mt-0.5">{selectedTicket.title}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{selectedTicket.customer_name}</p>
            </div>

            <SectionHead icon={User} label="Technician Assignment" color="bg-indigo-600" />

            <Field label="Select Technician *">
              <select required value={techId} onChange={(e) => setTechId(e.target.value)} className={inputCls}>
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name} (Senior Tech)</option>
                ))}
              </select>
            </Field>

            <Field label="Dispatch Date & Time *">
              <input type="datetime-local" required value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)} className={inputCls} />
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsAssignOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all hover:scale-105 active:scale-95 disabled:opacity-70">
                {isSubmitting
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Scheduling…</>
                  : <><Calendar className="w-3.5 h-3.5" />Schedule Dispatch</>
                }
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: RESOLVE TICKET
      ════════════════════════════════════════════════ */}
      {selectedTicket && (
        <Modal isOpen={isResolveOpen} onClose={() => setIsResolveOpen(false)}
          title={`Resolve Ticket: ${selectedTicket?.title}`} size="md">
          <form onSubmit={handleResolveSubmit} className="space-y-5">

            {/* Ticket preview */}
            <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-start">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Open Ticket</p>
                <p className="text-sm font-extrabold text-white mt-0.5">{selectedTicket.title}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{selectedTicket.customer_name}</p>
              </div>
              <StatusBadge status={selectedTicket.status} />
            </div>

            <SectionHead icon={CheckCircle} label="Resolution Status" color="bg-emerald-600" />

            {/* Resolution status cards */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'In Progress', label: 'In Progress', icon: RefreshCw,    cls: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
                { value: 'Completed',  label: 'Completed',   icon: CheckCircle,  cls: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                { value: 'Cancelled',  label: 'Cancelled',   icon: XCircle,      cls: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
              ].map(({ value, label, icon: Icon, cls, bg, border }) => {
                const active = resStatus === value;
                return (
                  <button key={value} type="button" onClick={() => setResStatus(value)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${active ? `${bg} ${border} shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                    <Icon className={`w-4 h-4 ${active ? cls : 'text-slate-400'}`} />
                    <span className={`text-[9px] font-black uppercase tracking-wider ${active ? cls : 'text-slate-500'}`}>{label}</span>
                  </button>
                );
              })}
            </div>

            <Field label="Technical Resolution Notes *">
              <textarea required rows={4}
                placeholder="Log parts replaced, calibration results, burner nozzle pressure settings, door gasket changes..."
                value={resNotes} onChange={(e) => setResNotes(e.target.value)} className={inputCls} />
            </Field>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setIsResolveOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70">
                {isSubmitting
                  ? <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                  : <><CheckCircle className="w-3.5 h-3.5" />Finalize Closure</>
                }
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Services;
