import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Eye, Edit2, ShoppingBag, Truck, MapPin, Package,
  ChevronLeft, ChevronRight, Search, X, Clock,
  CheckCircle, XCircle, ArrowRight, Hash, Building2,
  IndianRupee, Calendar, Zap, TrendingUp, AlertTriangle,
  Box, RefreshCw
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Status configuration maps
───────────────────────────────────────────────────────── */
const ORDER_STATUS = {
  Pending:    { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',   icon: Clock },
  Processing: { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',    dot: 'bg-blue-500',    icon: RefreshCw },
  Shipped:    { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500',  icon: Truck },
  Delivered:  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
  Cancelled:  { bg: 'bg-rose-50',    text: 'text-rose-700',    border: 'border-rose-200',    dot: 'bg-rose-500',    icon: XCircle },
};

const DELIVERY_STATUS = {
  Pending:     { bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200',   dot: 'bg-slate-400',   icon: Package },
  'In Transit':{ bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200',  dot: 'bg-indigo-500',  icon: Truck },
  Delivered:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle },
};

const OrderBadge = ({ status, map }) => {
  const cfg = map[status] || { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Fulfilment pipeline timeline component
───────────────────────────────────────────────────────── */
const PIPELINE = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const FulfilmentTimeline = ({ status }) => {
  const activeIdx = PIPELINE.indexOf(status);
  const isCancelled = status === 'Cancelled';
  return (
    <div className="relative flex items-center justify-between px-2 py-3">
      {/* connector line */}
      <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
      {PIPELINE.map((step, i) => {
        const done = !isCancelled && i <= activeIdx;
        const active = !isCancelled && i === activeIdx;
        const Icon = ORDER_STATUS[step]?.icon || Clock;
        return (
          <div key={step} className="relative flex flex-col items-center gap-1 z-10">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
              active
                ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-200'
                : done
                  ? 'bg-slate-800 border-slate-800'
                  : 'bg-white border-slate-200'
            }`}>
              <Icon className={`w-3.5 h-3.5 ${active || done ? 'text-white' : 'text-slate-400'}`} />
            </div>
            <span className={`text-[8px] font-black uppercase tracking-wide ${
              active ? 'text-emerald-600' : done ? 'text-slate-700' : 'text-slate-400'
            }`}>{step}</span>
          </div>
        );
      })}
      {isCancelled && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
            Order Cancelled
          </span>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const Orders = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // Data
  const [orders, setOrders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Edit form
  const [orderStatus, setOrderStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  /* ── Fetch ─────────────────────────────────────────── */
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/orders', {
        params: { status: statusFilter || undefined, page, per_page: 10 },
      });
      if (res.success) {
        setOrders(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [page, statusFilter]);

  /* ── Edit handler ─────────────────────────────────── */
  const handleOpenEdit = (ord) => {
    setSelectedOrder(ord);
    setOrderStatus(ord.status);
    setDeliveryStatus(ord.delivery_status);
    setIsEditOpen(true);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsUpdating(true);
      const res = await API.put(`/api/orders/${selectedOrder.id}/status`, {
        status: orderStatus,
        delivery_status: deliveryStatus,
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Order status updated successfully.' }));
        setIsEditOpen(false);
        fetchOrders();
        if (isDetailOpen) {
          setSelectedOrder((prev) => ({ ...prev, status: orderStatus, delivery_status: deliveryStatus }));
        }
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsUpdating(false);
    }
  };

  /* ── Stats ───────────────────────────────────────── */
  const stats = useMemo(() => {
    const pending    = orders.filter((o) => o.status === 'Pending').length;
    const processing = orders.filter((o) => o.status === 'Processing').length;
    const shipped    = orders.filter((o) => o.status === 'Shipped').length;
    const delivered  = orders.filter((o) => o.status === 'Delivered').length;
    const totalVal   = orders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    return { pending, processing, shipped, delivered, totalVal };
  }, [orders]);

  /* ── Filtered display ─────────────────────────────── */
  const displayed = useMemo(() => {
    if (!searchQuery) return orders;
    const q = searchQuery.toLowerCase();
    return orders.filter(
      (o) =>
        o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q)
    );
  }, [orders, searchQuery]);

  /* ── Pagination numbers ──────────────────────────── */
  const pageNumbers = useMemo(() => {
    const arr = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) arr.push(i);
    return arr;
  }, [page, pages]);

  /* ──────────────────────────────────────────────────
     RENDER
  ────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ════════════════════════════════════════════════
          HERO HEADER BANNER
      ════════════════════════════════════════════════ */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d1127 100%)' }}
      >
        {/* Decorative glow orbs */}
        <div
          className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />
        <div
          className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-8 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Operations
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Order Processing</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Track B2B kitchen equipment purchase orders, fulfilment stages &amp; shipping logistics
            </p>
            {/* Stat chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <ShoppingBag className="w-3 h-3 text-indigo-400" />
                <span className="text-[10px] text-white font-bold">{totalItems} Orders</span>
              </div>
              {stats.pending > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-300 font-bold">{stats.pending} Pending</span>
                </div>
              )}
              {stats.processing > 0 && (
                <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1">
                  <RefreshCw className="w-3 h-3 text-blue-400" />
                  <span className="text-[10px] text-blue-300 font-bold">{stats.processing} Processing</span>
                </div>
              )}
              {stats.shipped > 0 && (
                <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1">
                  <Truck className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] text-indigo-300 font-bold">{stats.shipped} Shipped</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <IndianRupee className="w-3 h-3 text-sky-400" />
                <span className="text-[10px] text-white font-bold">
                  ₹{stats.totalVal.toLocaleString('en-IN', { minimumFractionDigits: 0 })} Pipeline
                </span>
              </div>
            </div>
          </div>

          {/* Quick delivered stat card */}
          <div className="flex-shrink-0 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-center hidden sm:block">
            <p className="text-2xl font-black text-emerald-400">{stats.delivered}</p>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Delivered</p>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          FILTER RIBBON + SEARCH
      ════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by order number or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 flex-nowrap sm:flex-wrap flex-shrink-0">
          {['', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 flex-shrink-0 ${
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
          ORDERS TABLE / CARD LIST
      ════════════════════════════════════════════════ */}
      {isLoading ? (
        /* Skeleton loader */
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-1/4" />
                <div className="h-2 bg-slate-100 rounded-full w-1/3" />
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full w-20" />
              <div className="h-5 bg-slate-100 rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
          >
            <ShoppingBag className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Orders Found</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {statusFilter || searchQuery
              ? 'No orders match your current filters.'
              : 'Orders created from approved quotations will appear here.'}
          </p>
          {(statusFilter || searchQuery) && (
            <button
              onClick={() => { setStatusFilter(''); setSearchQuery(''); }}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Table header strip */}
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {totalItems} order{totalItems !== 1 ? 's' : ''}
              </span>
              {statusFilter && <OrderBadge status={statusFilter} map={ORDER_STATUS} />}
            </div>

            {/* ── Desktop table ── */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                    <th className="px-5 py-3.5">Order No.</th>
                    <th className="px-5 py-3.5">B2B Client</th>
                    <th className="px-5 py-3.5">Placed On</th>
                    <th className="px-5 py-3.5 text-right">Amount</th>
                    <th className="px-5 py-3.5 text-center">Order Status</th>
                    <th className="px-5 py-3.5 text-center">Delivery</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {displayed.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                      {/* Order number */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <Hash className="w-3.5 h-3.5 text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 font-mono">{ord.order_number}</p>
                            <p className="text-[9px] text-slate-400 font-bold">
                              {ord.quotation_id ? `Ref: QTN-${ord.quotation_id}` : 'Direct'}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                          <p className="text-xs font-bold text-slate-800 leading-tight">{ord.customer_name}</p>
                        </div>
                      </td>
                      {/* Date */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600 font-semibold">
                            {new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>
                      {/* Amount */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-black text-slate-900">
                          ₹{parseFloat(ord.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      {/* Order status */}
                      <td className="px-5 py-4 text-center">
                        <OrderBadge status={ord.status} map={ORDER_STATUS} />
                      </td>
                      {/* Delivery status */}
                      <td className="px-5 py-4 text-center">
                        <OrderBadge status={ord.delivery_status} map={DELIVERY_STATUS} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setSelectedOrder(ord); setIsDetailOpen(true); }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95"
                            title="View order details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => handleOpenEdit(ord)}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95"
                              title="Update logistics status"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile cards ── */}
            <div className="divide-y divide-slate-100 md:hidden">
              {displayed.map((ord) => (
                <div key={ord.id} className="p-4 space-y-3">
                  {/* Card header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                        <Hash className="w-3.5 h-3.5 text-indigo-400" />
                      </div>
                      <div>
                        <p className="text-xs font-extrabold text-slate-800 font-mono">{ord.order_number}</p>
                        <p className="text-[9px] text-slate-500 font-semibold mt-0.5">{ord.customer_name}</p>
                      </div>
                    </div>
                    <span className="text-sm font-black text-slate-900">
                      ₹{parseFloat(ord.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                    </span>
                  </div>

                  {/* Status row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <OrderBadge status={ord.status} map={ORDER_STATUS} />
                    <OrderBadge status={ord.delivery_status} map={DELIVERY_STATUS} />
                    <span className="text-[9px] text-slate-400 font-semibold ml-auto">
                      {new Date(ord.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  {/* Card actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => { setSelectedOrder(ord); setIsDetailOpen(true); }}
                      className="flex-grow flex items-center justify-center gap-1.5 py-1.5 border border-slate-200 bg-white text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Details
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(ord)}
                        className="flex-grow flex items-center justify-center gap-1.5 py-1.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-xl hover:bg-emerald-100 transition-all"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Update Status
                      </button>
                    )}
                  </div>
                </div>
              ))}
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
          MODAL: ORDER DETAIL VIEW
      ════════════════════════════════════════════════ */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order: ${selectedOrder.order_number}`}
          size="lg"
        >
          <div className="space-y-5">

            {/* Header band */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-slate-900 rounded-xl px-4 py-3 gap-3">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">B2B Client</p>
                <h3 className="text-sm font-extrabold text-white mt-0.5">{selectedOrder.customer_name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-indigo-400" />
                  {selectedOrder.shipping_address}
                </p>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 border-t border-slate-800 pt-2 sm:border-t-0 sm:pt-0">
                <OrderBadge status={selectedOrder.status} map={ORDER_STATUS} />
                <OrderBadge status={selectedOrder.delivery_status} map={DELIVERY_STATUS} />
              </div>
            </div>

            {/* Fulfilment timeline */}
            <div>
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-3">Fulfilment Pipeline</h4>
              <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2">
                <FulfilmentTimeline status={selectedOrder.status} />
              </div>
            </div>

            {/* Line items — desktop table */}
            <div>
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Fulfilment Items</h4>

              {/* Desktop */}
              <div className="hidden sm:block border border-slate-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  <span className="col-span-5">Equipment</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit Price</span>
                  <span className="col-span-3 text-right">Line Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedOrder.items?.map((item, i) => (
                    <div
                      key={i}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 text-xs items-center ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                    >
                      <div className="col-span-5">
                        <p className="font-bold text-slate-800 leading-tight">{item.product_name}</p>
                        <p className="text-[9px] text-slate-400 font-mono">{item.product_sku}</p>
                      </div>
                      <span className="col-span-2 text-center font-semibold text-slate-600">{item.quantity}</span>
                      <span className="col-span-2 text-right font-semibold text-slate-600">
                        ₹{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="col-span-3 text-right font-extrabold text-slate-800">
                        ₹{parseFloat(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mobile cards */}
              <div className="space-y-2 sm:hidden">
                {selectedOrder.items?.map((item, i) => (
                  <div key={i} className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 leading-tight text-xs">{item.product_name}</p>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{item.product_sku}</p>
                      </div>
                      <span className="bg-white border border-slate-200 text-slate-600 px-2.5 py-0.5 rounded-lg text-[10px] font-bold">
                        Qty: {item.quantity}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/50 text-[11px]">
                      <span className="text-slate-500">Unit Price</span>
                      <span className="font-medium text-slate-700">₹{parseFloat(item.unit_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-500 font-semibold">Line Total</span>
                      <span className="font-extrabold text-slate-900">₹{parseFloat(item.total_price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grand total strip */}
            <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Consolidated Billing Value</span>
              <span className="text-lg font-black text-white">
                ₹{parseFloat(selectedOrder.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <div className="w-full sm:w-auto">
                {canEdit && (
                  <button
                    onClick={() => { setIsDetailOpen(false); handleOpenEdit(selectedOrder); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl hover:bg-emerald-100 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Update Logistics Status
                  </button>
                )}
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all text-center"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ════════════════════════════════════════════════
          MODAL: EDIT ORDER LOGISTICS
      ════════════════════════════════════════════════ */}
      {selectedOrder && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Update Logistics: ${selectedOrder.order_number}`}
          size="md"
        >
          <form onSubmit={handleUpdateStatusSubmit} className="space-y-5">

            {/* Order Status picker — visual cards */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                  <ShoppingBag className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Fulfilment Order Status</span>
                <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(ORDER_STATUS).map(([s, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = orderStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOrderStatus(s)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        isActive
                          ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm`
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? cfg.text : 'text-slate-400'}`} />
                      <span className="text-[9px] font-black uppercase tracking-wider">{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Delivery Status picker — visual cards */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center">
                  <Truck className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Logistics / Delivery Status</span>
                <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(DELIVERY_STATUS).map(([s, cfg]) => {
                  const Icon = cfg.icon;
                  const isActive = deliveryStatus === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setDeliveryStatus(s)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${
                        isActive
                          ? `${cfg.bg} ${cfg.border} ${cfg.text} shadow-sm`
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? cfg.text : 'text-slate-400'}`} />
                      <span className="text-[9px] font-black uppercase tracking-wider leading-tight">{s}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Preview — current selection summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap gap-3 items-center">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Preview:</span>
              <OrderBadge status={orderStatus} map={ORDER_STATUS} />
              <span className="text-slate-300 text-xs">·</span>
              <OrderBadge status={deliveryStatus} map={DELIVERY_STATUS} />
            </div>

            {/* Footer actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isUpdating ? (
                  <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle className="w-3.5 h-3.5" />Update Logistics</>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
