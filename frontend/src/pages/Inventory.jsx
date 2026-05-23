import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Package, TrendingUp, TrendingDown, RefreshCw,
  Edit3, ClipboardList, AlertTriangle, Search, X,
  ChevronLeft, ChevronRight, Warehouse, Hash,
  ArrowUpCircle, ArrowDownCircle, BarChart3,
  AlertCircle, CheckCircle, Clock, IndianRupee,
  Layers, Activity, User
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Stock level helpers
───────────────────────────────────────────────────────── */
const getStockLevel = (qty) => {
  if (qty === 0) return { label: 'Out of Stock', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', bar: 'bg-rose-500', dot: 'bg-rose-500' };
  if (qty < 5)  return { label: 'Critical',     color: 'text-rose-600', bg: 'bg-rose-50',   border: 'border-rose-200',  bar: 'bg-rose-500',   dot: 'bg-rose-500' };
  if (qty < 15) return { label: 'Low Stock',    color: 'text-amber-700',bg: 'bg-amber-50',  border: 'border-amber-200', bar: 'bg-amber-400',  dot: 'bg-amber-400' };
  return           { label: 'In Stock',     color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', bar: 'bg-emerald-500', dot: 'bg-emerald-500' };
};

/* ─────────────────────────────────────────────────────────
   Stock mini-bar component
───────────────────────────────────────────────────────── */
const StockBar = ({ qty, max = 100 }) => {
  const pct = Math.min((qty / max) * 100, 100);
  const lvl = getStockLevel(qty);
  return (
    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${lvl.bar}`}
        style={{ width: `${Math.max(pct, qty > 0 ? 3 : 0)}%` }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const Inventory = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // View
  const [activeTab, setActiveTab] = useState('balances');

  // Data
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  // Adjustment modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRef, setAdjustRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ── Fetchers ─────────────────────────────────────── */
  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/products', {
        params: { search: search || undefined, page, per_page: 10 },
      });
      if (res.success) {
        setProducts(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchLedger = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/inventory/transactions', {
        params: { page, per_page: 12 },
      });
      if (res.success) {
        setLedger(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { setPage(1); }, [activeTab, search]);

  useEffect(() => {
    if (activeTab === 'balances') fetchBalances();
    else fetchLedger();
  }, [activeTab, page, search]);

  /* ── Adjustment ───────────────────────────────────── */
  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustQty('');
    setAdjustRef('Physical Audit stock correction');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || !adjustRef) {
      dispatch(addToast({ type: 'warning', message: 'Adjustment offset and reference are required.' }));
      return;
    }
    try {
      setIsSubmitting(true);
      const res = await API.post(`/api/inventory/adjust/${selectedProduct.id}`, {
        quantity: parseInt(adjustQty),
        reference: adjustRef,
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Warehouse stock adjusted successfully.' }));
        setIsAdjustOpen(false);
        fetchBalances();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Stats ─────────────────────────────────────────── */
  const stats = useMemo(() => {
    const outOfStock = products.filter((p) => p.stock_quantity === 0).length;
    const critical   = products.filter((p) => p.stock_quantity > 0 && p.stock_quantity < 5).length;
    const low        = products.filter((p) => p.stock_quantity >= 5 && p.stock_quantity < 15).length;
    const healthy    = products.filter((p) => p.stock_quantity >= 15).length;
    const totalUnits = products.reduce((s, p) => s + (p.stock_quantity || 0), 0);
    const totalVal   = products.reduce((s, p) => s + (p.stock_quantity || 0) * parseFloat(p.price || 0), 0);
    return { outOfStock, critical, low, healthy, totalUnits, totalVal };
  }, [products]);

  /* ── Pagination numbers ────────────────────────────── */
  const pageNumbers = useMemo(() => {
    const arr = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) arr.push(i);
    return arr;
  }, [page, pages]);

  /* ── Preview of adjusted qty ─────────────────────── */
  const previewQty = selectedProduct
    ? Math.max(0, selectedProduct.stock_quantity + (parseInt(adjustQty) || 0))
    : 0;

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
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0a1628 100%)' }}
      >
        {/* Glow orbs */}
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #f59e0b 0%, transparent 70%)' }} />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Warehouse
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Stock Management</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Audit inventory levels, track adjustments &amp; monitor warehouse balances in real-time
            </p>

            {/* Stat chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="text-[10px] text-white font-bold">{totalItems} SKUs</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                <span className="text-[10px] text-white font-bold">{stats.totalUnits.toLocaleString('en-IN')} Units</span>
              </div>
              {(stats.outOfStock + stats.critical) > 0 && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0 animate-pulse" />
                  <span className="text-[10px] text-rose-300 font-bold">{stats.outOfStock + stats.critical} Critical</span>
                </div>
              )}
              {stats.low > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="text-[10px] text-amber-300 font-bold">{stats.low} Low Stock</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                <span className="text-[10px] text-white font-bold">
                  ₹{stats.totalVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })} Stock Value
                </span>
              </div>
            </div>
          </div>

          {/* Health summary card */}
          {activeTab === 'balances' && (
            <div className="flex-shrink-0 hidden sm:grid grid-cols-2 gap-2">
              {[
                { label: 'Healthy', count: stats.healthy, color: 'text-emerald-400', icon: CheckCircle },
                { label: 'Low',     count: stats.low,     color: 'text-amber-400',  icon: AlertCircle },
                { label: 'Critical',count: stats.critical,color: 'text-rose-400',   icon: AlertTriangle },
                { label: 'Zero',    count: stats.outOfStock, color: 'text-rose-500', icon: AlertTriangle },
              ].map(({ label, count, color, icon: Icon }) => (
                <div key={label} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${color}`} />
                  <div>
                    <p className={`text-sm font-black ${color}`}>{count}</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          TAB SWITCHER + SEARCH
      ════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        {/* Tab pills */}
        <div className="flex bg-slate-100/70 border border-slate-200 p-1 rounded-xl gap-1 flex-shrink-0">
          {[
            { key: 'balances', label: 'Stock Balances', icon: Package },
            { key: 'ledger',   label: 'Transaction Ledger', icon: ClipboardList },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === key
                  ? 'bg-white text-slate-900 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Search — balances tab only */}
        {activeTab === 'balances' && (
          <div className="relative flex-grow w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-xs"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════
          CONTENT AREA
      ════════════════════════════════════════════════ */}
      {isLoading ? (
        /* Skeleton */
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
              <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-2/5" />
                <div className="h-1.5 bg-slate-100 rounded-full w-1/3" />
              </div>
              <div className="h-5 bg-slate-100 rounded-full w-20" />
              <div className="h-3 bg-slate-200 rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : activeTab === 'balances' ? (

        /* ── STOCK BALANCES ── */
        <div className="space-y-4">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 70%)' }}>
                <Package className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Products Found</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                {search ? 'No products match your search.' : 'Add products from the Products page to track stock here.'}
              </p>
              {search && (
                <button onClick={() => setSearch('')}
                  className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all">
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              {/* Table header strip */}
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {totalItems} product{totalItems !== 1 ? 's' : ''} tracked
                </span>
                {(stats.outOfStock + stats.critical) > 0 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600">
                    <AlertTriangle className="w-3 h-3" />
                    {stats.outOfStock + stats.critical} need restocking
                  </span>
                )}
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                      <th className="px-5 py-3.5">Product / SKU</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5 text-center">Stock Level</th>
                      <th className="px-5 py-3.5 text-right">Unit Price</th>
                      <th className="px-5 py-3.5 text-right">Stock Value</th>
                      {canEdit && <th className="px-5 py-3.5 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {products.map((prod) => {
                      const lvl = getStockLevel(prod.stock_quantity);
                      const stockVal = prod.stock_quantity * parseFloat(prod.price || 0);
                      return (
                        <tr key={prod.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                          {/* Product */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${lvl.bg} ${lvl.border}`}>
                                <Package className={`w-3.5 h-3.5 ${lvl.color}`} />
                              </div>
                              <div>
                                <p className="text-xs font-extrabold text-slate-800 leading-tight">{prod.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono uppercase mt-0.5">{prod.sku}</p>
                              </div>
                            </div>
                          </td>
                          {/* Category */}
                          <td className="px-5 py-4">
                            <span className="text-xs text-slate-600 font-semibold">{prod.category_name || '—'}</span>
                          </td>
                          {/* Stock level */}
                          <td className="px-5 py-4">
                            <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                              <div className="flex items-center gap-2 w-full">
                                <StockBar qty={prod.stock_quantity} />
                                <span className={`text-[10px] font-black ${lvl.color} flex-shrink-0`}>
                                  {prod.stock_quantity}
                                </span>
                              </div>
                              <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${lvl.bg} ${lvl.color} ${lvl.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot} ${prod.stock_quantity < 5 ? 'animate-pulse' : ''}`} />
                                {lvl.label}
                              </span>
                            </div>
                          </td>
                          {/* Unit price */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-xs font-bold text-slate-700">
                              ₹{parseFloat(prod.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                          {/* Stock value */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-xs font-black text-slate-900">
                              ₹{stockVal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                            </span>
                          </td>
                          {/* Action */}
                          {canEdit && (
                            <td className="px-5 py-4">
                              <div className="flex justify-end opacity-60 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleOpenAdjust(prod)}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 text-[10px] font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
                                >
                                  <Edit3 className="w-3 h-3" /> Adjust
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {products.map((prod) => {
                  const lvl = getStockLevel(prod.stock_quantity);
                  const stockVal = prod.stock_quantity * parseFloat(prod.price || 0);
                  return (
                    <div key={prod.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border ${lvl.bg} ${lvl.border}`}>
                            <Package className={`w-3.5 h-3.5 ${lvl.color}`} />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800">{prod.name}</p>
                            <p className="text-[9px] text-slate-400 font-mono uppercase">{prod.sku}</p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex-shrink-0 ${lvl.bg} ${lvl.color} ${lvl.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${lvl.dot} ${prod.stock_quantity < 5 ? 'animate-pulse' : ''}`} />
                          {lvl.label}
                        </span>
                      </div>

                      {/* Stock bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[9px] font-bold">
                          <span className="text-slate-500">Stock</span>
                          <span className={lvl.color}>{prod.stock_quantity} units</span>
                        </div>
                        <StockBar qty={prod.stock_quantity} />
                      </div>

                      {/* Prices */}
                      <div className="flex justify-between text-[10px]">
                        <span className="text-slate-500 font-semibold">Unit · ₹{parseFloat(prod.price).toLocaleString('en-IN')}</span>
                        <span className="font-black text-slate-800">₹{stockVal.toLocaleString('en-IN')} total</span>
                      </div>

                      {canEdit && (
                        <button
                          onClick={() => handleOpenAdjust(prod)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 border border-amber-200 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-xl hover:bg-amber-100 transition-all"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Adjust Stock
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      ) : (

        /* ── TRANSACTION LEDGER ── */
        <div className="space-y-4">
          {ledger.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
              <div className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
                style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.10) 0%, transparent 70%)' }}>
                <ClipboardList className="w-12 h-12 text-slate-300" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Transactions Yet</h3>
              <p className="text-xs text-slate-400 max-w-xs">Stock adjustments and order fulfilments will appear here.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  {totalItems} transaction{totalItems !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Desktop ledger table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                      <th className="px-5 py-3.5">Reference / Reason</th>
                      <th className="px-5 py-3.5">Product</th>
                      <th className="px-5 py-3.5 text-center">Type</th>
                      <th className="px-5 py-3.5 text-center">Offset</th>
                      <th className="px-5 py-3.5">Operator</th>
                      <th className="px-5 py-3.5 text-right">Logged At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/80">
                    {ledger.map((txn, i) => {
                      const isOut = txn.transaction_type === 'OUT' || txn.quantity < 0;
                      return (
                        <tr key={txn.id || i} className="hover:bg-slate-50/60 transition-colors duration-150">
                          {/* Reference */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isOut ? 'bg-rose-50 border border-rose-200' : 'bg-emerald-50 border border-emerald-200'
                              }`}>
                                {isOut
                                  ? <ArrowDownCircle className="w-3.5 h-3.5 text-rose-500" />
                                  : <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
                                }
                              </div>
                              <p className="text-xs font-bold text-slate-800 leading-tight max-w-[200px] truncate">
                                {txn.reference || 'Stock Adjustment'}
                              </p>
                            </div>
                          </td>
                          {/* Product */}
                          <td className="px-5 py-4">
                            <p className="text-xs font-bold text-slate-800">{txn.product_name}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{txn.product_sku}</p>
                          </td>
                          {/* Type */}
                          <td className="px-5 py-4 text-center">
                            <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              isOut
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}>
                              {isOut ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              {txn.transaction_type}
                            </span>
                          </td>
                          {/* Offset */}
                          <td className="px-5 py-4 text-center">
                            <span className={`text-sm font-black ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                            </span>
                          </td>
                          {/* Operator */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                <User className="w-2.5 h-2.5 text-slate-500" />
                              </div>
                              <span className="text-[10px] font-bold text-slate-600">
                                {txn.creator_name || 'System'}
                              </span>
                            </div>
                          </td>
                          {/* Time */}
                          <td className="px-5 py-4 text-right">
                            <span className="text-[10px] text-slate-500 font-semibold">
                              {new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <br />
                            <span className="text-[9px] text-slate-400">
                              {new Date(txn.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile ledger cards */}
              <div className="divide-y divide-slate-100 md:hidden">
                {ledger.map((txn, i) => {
                  const isOut = txn.transaction_type === 'OUT' || txn.quantity < 0;
                  return (
                    <div key={txn.id || i} className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                        isOut ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        {isOut
                          ? <ArrowDownCircle className="w-4 h-4 text-rose-500" />
                          : <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                        }
                      </div>
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-start">
                          <p className="text-xs font-bold text-slate-800 truncate max-w-[60%]">
                            {txn.product_name}
                          </p>
                          <span className={`text-sm font-black flex-shrink-0 ${isOut ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {txn.quantity > 0 ? '+' : ''}{txn.quantity}
                          </span>
                        </div>
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">{txn.reference || 'Stock Adjustment'}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">
                          {txn.creator_name || 'System'} · {new Date(txn.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════
          SHARED PAGINATION
      ════════════════════════════════════════════════ */}
      {!isLoading && pages > 1 && (
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

      {/* ════════════════════════════════════════════════
          MODAL: STOCK ADJUSTMENT
      ════════════════════════════════════════════════ */}
      {selectedProduct && (
        <Modal
          isOpen={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          title={`Adjust Stock: ${selectedProduct.name}`}
          size="md"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-5">

            {/* Current stock snapshot */}
            <div className={`rounded-xl px-4 py-3 border ${getStockLevel(selectedProduct.stock_quantity).bg} ${getStockLevel(selectedProduct.stock_quantity).border}`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">SKU</p>
                  <p className="text-[10px] font-mono text-slate-700 font-bold">{selectedProduct.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Current Balance</p>
                  <p className={`text-xl font-black ${getStockLevel(selectedProduct.stock_quantity).color}`}>
                    {selectedProduct.stock_quantity} <span className="text-xs font-bold">units</span>
                  </p>
                </div>
              </div>
              <div className="mt-2">
                <StockBar qty={selectedProduct.stock_quantity} />
              </div>
            </div>

            {/* Adjustment section */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center">
                  <Edit3 className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Adjustment Details</span>
                <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Quantity Offset * <span className="normal-case font-normal text-slate-400">(use + to add, − to remove)</span>
                  </label>
                  <div className="flex gap-2">
                    {/* Quick presets */}
                    {[-10, -5, -1, 1, 5, 10].map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAdjustQty(String(v))}
                        className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                          adjustQty === String(v)
                            ? v < 0
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'bg-emerald-600 border-emerald-600 text-white'
                            : v < 0
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                              : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {v > 0 ? `+${v}` : v}
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 5 or -2 (custom)"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(e.target.value)}
                    className={`w-full mt-2 border rounded-xl px-3 py-2 text-sm font-bold text-center focus:outline-none transition-all ${
                      adjustQty
                        ? parseInt(adjustQty) < 0
                          ? 'border-rose-300 text-rose-600 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20'
                          : 'border-emerald-300 text-emerald-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                        : 'border-slate-200 text-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                  />
                </div>

                {/* Live preview */}
                {adjustQty !== '' && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="text-slate-500 font-semibold">Adjusted Balance Preview</span>
                      <span className={`font-black text-sm ${
                        parseInt(adjustQty) < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {selectedProduct.stock_quantity} → {previewQty} units
                      </span>
                    </div>
                    <StockBar qty={previewQty} />
                    <p className={`text-[9px] font-black mt-1 ${getStockLevel(previewQty).color}`}>
                      {getStockLevel(previewQty).label}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Reference / Reason *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Physical inventory audit, Damaged goods write-off"
                    value={adjustRef}
                    onChange={(e) => setAdjustRef(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
              >
                {isSubmitting ? (
                  <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><CheckCircle className="w-3.5 h-3.5" />Submit Adjustment</>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

// Fix: XOctagon isn't exported from lucide-react, use this alias
const XOctagon = AlertTriangle;

export default Inventory;
