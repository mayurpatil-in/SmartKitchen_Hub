import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Plus, Trash2, Download, CheckCircle, XCircle, Eye, Edit,
  FileText, ShoppingCart, ChevronLeft, ChevronRight, X,
  Building2, Calendar, Tag, Receipt, Percent, CreditCard,
  ClipboardList, ArrowRight, Send, Search, Filter, Zap,
  TrendingUp, Clock, AlertTriangle, IndianRupee, Hash
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Status config helper
───────────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  Draft:    { bg: 'bg-slate-100',    text: 'text-slate-600',   border: 'border-slate-200',  dot: 'bg-slate-400',   icon: Clock },
  Sent:     { bg: 'bg-blue-50',      text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-500',    icon: ArrowRight },
  Approved: { bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-500', icon: CheckCircle },
  Rejected: { bg: 'bg-rose-50',      text: 'text-rose-700',    border: 'border-rose-200',   dot: 'bg-rose-500',    icon: XCircle },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
    </span>
  );
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const Quotations = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const isCustomer = user?.role === 'Customer';
  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // ── Data
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ── Vendor Settings (Dynamic Profile)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSettingsSubmitting, setIsSettingsSubmitting] = useState(false);
  const [vendorData, setVendorData] = useState({
    company_name: '',
    company_tagline: '',
    address: '',
    gstin: '',
    pan: '',
    email: '',
    bank_account_name: '',
    bank_name: '',
    bank_account_no: '',
    bank_ifsc: '',
    bank_branch: ''
  });

  // ── Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ── Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editQuotationId, setEditQuotationId] = useState(null);
  const [discountType, setDiscountType] = useState('flat');
  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const [searchQueries, setSearchQueries] = useState({});
  const [isTaxOverridden, setIsTaxOverridden] = useState(false);

  // ── Builder Form
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  // ── Totals
  const [subtotal, setSubtotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  /* ── Fetchers ──────────────────────────────────────────── */
  const fetchDependencies = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        API.get('/api/customers'),
        API.get('/api/products', { params: { per_page: 100 } }),
      ]);
      if (custRes.success) setCustomers(custRes.data.items);
      if (prodRes.success) setProducts(prodRes.data.items);
    } catch (err) { console.error(err); }
  };

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/quotations', {
        params: { status: statusFilter || undefined, page, per_page: 10 },
      });
      if (res.success) {
        setQuotations(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const fetchVendorSettings = async () => {
    try {
      const res = await API.get('/api/quotations/vendor-settings');
      if (res.success) {
        setVendorData(res.data);
      }
    } catch (err) {
      console.error(err);
      dispatch(addToast({ type: 'error', message: 'Failed to fetch vendor settings.' }));
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    if (!vendorData.company_name) {
      dispatch(addToast({ type: 'warning', message: 'Company Name is required.' }));
      return;
    }
    try {
      setIsSettingsSubmitting(true);
      const res = await API.post('/api/quotations/vendor-settings', vendorData);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Vendor details updated successfully.' }));
        setIsSettingsOpen(false);
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message || 'Failed to update vendor settings.' }));
    } finally {
      setIsSettingsSubmitting(false);
    }
  };

  useEffect(() => { fetchDependencies(); }, []);
  useEffect(() => { fetchQuotations(); }, [page, statusFilter]);

  // Recalculate subtotal and automatically pre-fill 18% GST tax if not manually overridden
  useEffect(() => {
    let sub = 0;
    items.forEach((item) => {
      sub += (parseInt(item.quantity) || 0) * (parseFloat(item.unit_price) || 0);
    });
    setSubtotal(sub);
    
    if (!isTaxOverridden) {
      const calculatedTax = (sub * 18) / 100;
      setTax(calculatedTax.toFixed(2));
    }
  }, [items, isTaxOverridden]);

  // Recalculate grand total when subtotal, tax, discount or discountType changes
  useEffect(() => {
    const taxVal = parseFloat(tax) || 0;
    let discVal = parseFloat(discount) || 0;
    if (discountType === 'percent') {
      discVal = (subtotal * discVal) / 100;
    }
    setGrandTotal(Math.max(subtotal + taxVal - discVal, 0));
  }, [subtotal, tax, discount, discountType]);

  /* ── Builder helpers ────────────────────────────────────── */
  const handleOpenBuilder = () => {
    setEditQuotationId(null);
    setDiscountType('flat');
    setActiveDropdownIndex(null);
    setSearchQueries({});
    setIsTaxOverridden(false);
    setCustomerId(customers[0]?.id || '');
    const d = new Date(); d.setDate(d.getDate() + 15);
    setValidUntil(d.toISOString().split('T')[0]);
    setTax('0'); setDiscount('0'); setNotes('');
    setItems([{ product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.price || 0 }]);
    setIsBuilderOpen(true);
  };

  const handleOpenEditBuilder = (quote) => {
    setEditQuotationId(quote.id);
    setDiscountType('flat');
    setActiveDropdownIndex(null);
    setSearchQueries({});
    setIsTaxOverridden(true);
    setCustomerId(quote.customer_id || '');
    setValidUntil(quote.valid_until || '');
    setTax(quote.tax?.toString() || '0');
    setDiscount(quote.discount?.toString() || '0');
    setNotes(quote.notes || '');
    setItems(quote.items?.map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    })) || []);
    setIsBuilderOpen(true);
  };

  const handleAddLineItem = () => {
    const p = products[0];
    setItems([...items, { product_id: p?.id || '', quantity: 1, unit_price: p?.price || 0 }]);
  };

  const handleRemoveLineItem = (idx) => setItems(items.filter((_, i) => i !== idx));

  const handleLineChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;
    if (field === 'product_id') {
      const match = products.find((p) => p.id === parseInt(val));
      if (match) updated[idx].unit_price = match.price;
    }
    setItems(updated);
  };

  const handleBuilderSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || !validUntil || items.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'Select a client, expiry date, and at least one product line.' }));
      return;
    }
    if (items.some((i) => !i.product_id || parseInt(i.quantity) <= 0)) {
      dispatch(addToast({ type: 'warning', message: 'All lines must have a product and quantity > 0.' }));
      return;
    }
    let finalDiscount = parseFloat(discount) || 0;
    if (discountType === 'percent') {
      finalDiscount = (subtotal * finalDiscount) / 100;
    }

    const payload = {
      customer_id: parseInt(customerId),
      valid_until: validUntil,
      tax: parseFloat(tax) || 0,
      discount: finalDiscount,
      notes,
      items: items.map((i) => ({
        product_id: parseInt(i.product_id),
        quantity: parseInt(i.quantity),
        unit_price: parseFloat(i.unit_price),
      })),
    };
    try {
      setIsSubmitting(true);
      const res = editQuotationId
        ? await API.put(`/api/quotations/${editQuotationId}`, payload)
        : await API.post('/api/quotations', payload);
      if (res.success) {
        dispatch(addToast({
          type: 'success',
          message: editQuotationId ? 'Quotation updated successfully.' : 'Quotation generated successfully.'
        }));
        setIsBuilderOpen(false);
        fetchQuotations();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Status / actions ────────────────────────────────────── */
  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await API.put(`/api/quotations/${id}/status`, { status });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: `Quote marked as ${status}.` }));
        fetchQuotations();
        if (selectedQuote?.id === id) setSelectedQuote((prev) => ({ ...prev, status }));
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
  };

  const handleDeleteQuotation = async (id) => {
    if (!window.confirm('Are you sure you want to delete this Draft quotation? This action is permanent.')) return;
    try {
      const res = await API.delete(`/api/quotations/${id}`);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Quotation deleted successfully.' }));
        fetchQuotations();
        if (selectedQuote?.id === id) setIsDetailOpen(false);
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
  };

  const handleDownloadPdf = (id) => {
    dispatch(addToast({ type: 'info', message: 'Generating invoice PDF…' }));
    const token = localStorage.getItem('token');
    window.open(`http://localhost:5000/api/quotations/${id}/pdf?token=${token}`, '_blank');
  };

  const handleConvertToOrder = async (quote) => {
    const address = prompt('Enter shipping address for this order:', quote.customer?.address || '');
    if (!address) return;
    try {
      dispatch(addToast({ type: 'info', message: 'Converting proposal to active order…' }));
      const res = await API.post('/api/orders/convert', { quotation_id: quote.id, shipping_address: address });
      if (res.success) {
        import('canvas-confetti').then((m) => m.default());
        dispatch(addToast({ type: 'success', message: 'Quotation converted to Order!' }));
        fetchQuotations();
      }
    } catch (err) { dispatch(addToast({ type: 'error', message: err.message })); }
  };

  /* ── Pagination ────────────────────────────────────────── */
  const pageNumbers = useMemo(() => {
    const arr = [];
    for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) arr.push(i);
    return arr;
  }, [page, pages]);

  /* ── Filtered display ──────────────────────────────────── */
  const displayedQuotes = useMemo(() => {
    if (!searchQuery) return quotations;
    const q = searchQuery.toLowerCase();
    return quotations.filter(
      (qt) =>
        qt.quotation_number?.toLowerCase().includes(q) ||
        qt.customer_name?.toLowerCase().includes(q)
    );
  }, [quotations, searchQuery]);

  /* ── Summary stats ─────────────────────────────────────── */
  const stats = useMemo(() => {
    const approved = quotations.filter((q) => q.status === 'Approved').length;
    const pending  = quotations.filter((q) => q.status === 'Draft' || q.status === 'Sent').length;
    const totalVal = quotations.reduce((sum, q) => sum + parseFloat(q.total || 0), 0);
    return { approved, pending, totalVal };
  }, [quotations]);

  /* ────────────────────────────────────────────────────────
     RENDER
  ──────────────────────────────────────────────────────── */
  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════════════
          HERO HEADER BANNER
      ═══════════════════════════════════════════════════ */}
      <div
        className="relative rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0d1f12 100%)' }}
      >
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }}
        />
        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                Quotations
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Quotation Builder</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Build B2B proposals, manage pricing negotiations &amp; export PDF invoices
            </p>
            {/* Stats chips */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <FileText className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-white font-bold">{totalItems} Quotes</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-white font-bold">{stats.approved} Approved</span>
              </div>
              {stats.pending > 0 && (
                <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] text-amber-300 font-bold">{stats.pending} Pending</span>
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

          <div className="flex items-center gap-2 flex-shrink-0">
            {user?.role === 'Admin' && (
              <button
                onClick={() => {
                  fetchVendorSettings();
                  setIsSettingsOpen(true);
                }}
                className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5 text-emerald-400" />
                Edit Profile
              </button>
            )}
            {canEdit && (
              <button
                onClick={handleOpenBuilder}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                New Quotation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          STATUS FILTER RIBBON + SEARCH BAR
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by quote number or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0 flex-nowrap sm:flex-wrap flex-shrink-0">
          {['', 'Draft', 'Sent', 'Approved', 'Rejected'].map((s) => (
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

      {/* ═══════════════════════════════════════════════════
          QUOTATIONS TABLE
      ═══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-slate-200 flex-shrink-0" />
              <div className="flex-grow space-y-2">
                <div className="h-3 bg-slate-200 rounded-full w-1/4" />
                <div className="h-2 bg-slate-100 rounded-full w-1/3" />
              </div>
              <div className="h-2.5 bg-slate-200 rounded-full w-20" />
              <div className="h-5 bg-slate-100 rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : displayedQuotes.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
          >
            <FileText className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Quotations Found</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {statusFilter || searchQuery
              ? 'No quotes match your current filters.'
              : 'Create your first B2B proposal using the builder above.'}
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
        <div className="space-y-5">
          <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
            {/* Table header strip */}
            <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                {totalItems} quotation{totalItems !== 1 ? 's' : ''}
              </span>
              {statusFilter && (
                <StatusBadge status={statusFilter} />
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                    <th className="px-5 py-3.5">Proposal No.</th>
                    <th className="px-5 py-3.5">Client</th>
                    <th className="px-5 py-3.5">Validity</th>
                    <th className="px-5 py-3.5 text-right">Subtotal</th>
                    <th className="px-5 py-3.5 text-right">Grand Total</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {displayedQuotes.map((qt) => (
                    <tr key={qt.id} className="hover:bg-slate-50/60 transition-colors duration-150 group">
                      {/* Quote number */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center flex-shrink-0">
                            <Hash className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 font-mono">{qt.quotation_number}</p>
                            <p className="text-[9px] text-slate-400 font-bold">by {qt.creator_name}</p>
                          </div>
                        </div>
                      </td>
                      {/* Client */}
                      <td className="px-5 py-4">
                        <p className="text-xs font-bold text-slate-800">{qt.customer_name}</p>
                      </td>
                      {/* Validity */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span className="text-xs text-slate-600 font-semibold">{qt.valid_until}</span>
                        </div>
                      </td>
                      {/* Subtotal */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-semibold text-slate-500">
                          ₹{parseFloat(qt.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      {/* Grand total */}
                      <td className="px-5 py-4 text-right">
                        <span className="text-xs font-black text-slate-900">
                          ₹{parseFloat(qt.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      {/* Status */}
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={qt.status} />
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          {/* View */}
                          <button
                            onClick={() => { setSelectedQuote(qt); setIsDetailOpen(true); }}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95"
                            title="View details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* PDF */}
                          <button
                            onClick={() => handleDownloadPdf(qt.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all hover:scale-110 active:scale-95"
                            title="Download PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {/* Send (Draft quotes) */}
                          {canEdit && qt.status === 'Draft' && (
                            <>
                              <button
                                onClick={() => handleOpenEditBuilder(qt)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all hover:scale-110 active:scale-95"
                                title="Edit Draft"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteQuotation(qt.id)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(qt.id, 'Sent')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all hover:scale-110 active:scale-95"
                                title="Send to Client"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {/* Approve / Reject (Sent quotes) */}
                          {((canEdit && qt.status === 'Sent') || (isCustomer && qt.status === 'Sent')) && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(qt.id, 'Approved')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95"
                                title="Approve"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(qt.id, 'Rejected')}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95"
                                title="Reject"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {/* Reset to Sent (Approved / Rejected quotes) */}
                          {canEdit && (qt.status === 'Approved' || qt.status === 'Rejected') && (
                            <button
                              onClick={() => handleUpdateStatus(qt.id, 'Sent')}
                              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all hover:scale-110 active:scale-95"
                              title="Reset to Sent"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Convert to order */}
                          {canEdit && (qt.status === 'Approved' || qt.status === 'Sent') && (
                            <button
                              onClick={() => handleConvertToOrder(qt)}
                              className="p-1.5 rounded-lg bg-emerald-600 border border-emerald-600 text-white hover:bg-emerald-700 transition-all hover:scale-110 active:scale-95"
                              title="Convert to Order"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {/* ═══════════════════════════════════════════════════
          MODAL: QUOTATION BUILDER
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title={editQuotationId ? "Edit B2B Quotation Draft" : "Interactive B2B Quotation Builder"}
        size="2xl"
      >
        <form onSubmit={handleBuilderSubmit} className="space-y-5">

          {/* ── Section 1: Client & Date ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Client &amp; Validity</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">B2B Client *</label>
                <select
                  required value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-all"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name} — {c.contact_person}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Valid Until *</label>
                <input
                  type="date" required value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* ── Section 2: Line Items ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center">
                <ClipboardList className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Equipment Line Items</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
              <button
                type="button" onClick={handleAddLineItem}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 hover:underline flex-shrink-0"
              >
                <Plus className="w-3 h-3" /> Add Line
              </button>
            </div>

            {/* Column headers */}
            <div className="hidden md:grid grid-cols-12 gap-2 mb-1.5 text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
              <span className="col-span-5">Product</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-3 text-right">Unit Price (₹)</span>
              <span className="col-span-1 text-right">Line Total</span>
              <span className="col-span-1" />
            </div>

            <div className="space-y-3 pr-1">
              {items.map((row, idx) => {
                const lineTotal = (parseInt(row.quantity) || 0) * (parseFloat(row.unit_price) || 0);
                return (
                  <React.Fragment key={idx}>
                    {/* Desktop layout */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center bg-slate-50/60 border border-slate-100 rounded-xl p-2">
                      <div className="relative col-span-5">
                        {/* Selected Product Input / Search Trigger */}
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to search product or SKU..."
                            value={
                              searchQueries[idx] !== undefined
                                ? searchQueries[idx]
                                : products.find((p) => p.id === parseInt(row.product_id))?.name || ''
                            }
                            onChange={(e) => {
                              const q = e.target.value;
                              setSearchQueries({ ...searchQueries, [idx]: q });
                              setActiveDropdownIndex(idx);
                            }}
                            onFocus={() => {
                              setActiveDropdownIndex(idx);
                              if (searchQueries[idx] === undefined) {
                                setSearchQueries({ ...searchQueries, [idx]: '' });
                              }
                            }}
                            className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 bg-white font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setActiveDropdownIndex(activeDropdownIndex === idx ? null : idx)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Search Suggestion Dropdown Panel */}
                        {activeDropdownIndex === idx && (
                          <>
                            <div className="fixed inset-0 z-45" onClick={() => {
                              setActiveDropdownIndex(null);
                              const updated = { ...searchQueries };
                              delete updated[idx];
                              setSearchQueries(updated);
                            }} />
                            <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-slate-50">
                              {(() => {
                                const q = (searchQueries[idx] || '').toLowerCase();
                                const filtered = products.filter(
                                  (p) =>
                                    p.name.toLowerCase().includes(q) ||
                                    p.sku.toLowerCase().includes(q)
                                );
                                if (filtered.length === 0) {
                                  return (
                                    <div className="px-3.5 py-3 text-center text-xs text-slate-400 font-medium">
                                      No products found
                                    </div>
                                  );
                                }
                                return filtered.map((p) => {
                                  const isSelected = parseInt(row.product_id) === p.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        handleLineChange(idx, 'product_id', p.id);
                                        setActiveDropdownIndex(null);
                                        const updated = { ...searchQueries };
                                        delete updated[idx];
                                        setSearchQueries(updated);
                                      }}
                                      className={`w-full text-left px-3.5 py-2 flex items-center justify-between text-xs transition-colors ${
                                        isSelected
                                          ? 'bg-emerald-50 text-emerald-800 font-bold'
                                          : 'hover:bg-slate-50 text-slate-700 font-medium'
                                      }`}
                                    >
                                      <div className="space-y-0.5 pr-2">
                                        <p className="line-clamp-1">{p.name}</p>
                                        <p className={`text-[9px] font-mono uppercase tracking-wider ${
                                          isSelected ? 'text-emerald-600' : 'text-slate-400'
                                        }`}>{p.sku}</p>
                                      </div>
                                      <div className="text-right flex-shrink-0">
                                        <p className="font-extrabold font-mono">₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
                                        <p className={`text-[9px] ${
                                          p.stock_quantity > 5 ? 'text-emerald-500 font-semibold' : 'text-amber-500 font-semibold'
                                        }`}>{p.stock_quantity} in stock</p>
                                      </div>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </>
                        )}

                        {/* Stock indicator & stock limit alerts */}
                        {(() => {
                          const selectedProduct = products.find((p) => p.id === parseInt(row.product_id));
                          if (!selectedProduct) return null;
                          const stock = selectedProduct.stock_quantity || 0;
                          const exceeds = (parseInt(row.quantity) || 0) > stock;
                          return (
                            <div className="mt-1 flex items-center justify-between px-1">
                              <span className={`inline-flex items-center text-[9px] font-bold ${
                                stock > 5 ? 'text-emerald-600' : stock > 0 ? 'text-amber-600' : 'text-rose-600'
                              }`}>
                                {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                              </span>
                              {exceeds && (
                                <span className="text-[9px] text-rose-600 font-bold animate-pulse flex items-center gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Exceeds stock!
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                      <div className="col-span-2">
                        {(() => {
                          const selectedProduct = products.find((p) => p.id === parseInt(row.product_id));
                          const stock = selectedProduct?.stock_quantity || 0;
                          const exceeds = (parseInt(row.quantity) || 0) > stock;
                          return (
                            <input
                              type="number" required min="1" value={row.quantity}
                              onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                              className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-center focus:outline-none bg-white font-semibold transition-all ${
                                exceeds
                                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-600'
                                  : 'border-slate-200 focus:border-emerald-500'
                              }`}
                            />
                          );
                        })()}
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number" step="0.01" required value={row.unit_price}
                          onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                        />
                      </div>
                      <div className="col-span-1 text-right">
                        <span className="text-[10px] font-black text-slate-700">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        {items.length > 1 && (
                          <button
                            type="button" onClick={() => handleRemoveLineItem(idx)}
                            className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Mobile layout */}
                    <div className="bg-slate-50/60 border border-slate-100 rounded-xl p-3 space-y-2 md:hidden">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Item #{idx + 1}</span>
                        {items.length > 1 && (
                          <button
                            type="button" onClick={() => handleRemoveLineItem(idx)}
                            className="p-1 rounded-lg bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      
                      <div className="relative">
                        <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Product</label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Type to search product..."
                            value={
                              searchQueries[idx] !== undefined
                                ? searchQueries[idx]
                                : products.find((p) => p.id === parseInt(row.product_id))?.name || ''
                            }
                            onChange={(e) => {
                              const q = e.target.value;
                              setSearchQueries({ ...searchQueries, [idx]: q });
                              setActiveDropdownIndex(idx);
                            }}
                            onFocus={() => {
                              setActiveDropdownIndex(idx);
                              if (searchQueries[idx] === undefined) {
                                setSearchQueries({ ...searchQueries, [idx]: '' });
                              }
                            }}
                            className="w-full border border-slate-200 rounded-lg pl-3 pr-8 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 bg-white font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => setActiveDropdownIndex(activeDropdownIndex === idx ? null : idx)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            <Filter className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {activeDropdownIndex === idx && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => {
                              setActiveDropdownIndex(null);
                              const updated = { ...searchQueries };
                              delete updated[idx];
                              setSearchQueries(updated);
                            }} />
                            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 divide-y divide-slate-50">
                              {(() => {
                                const q = (searchQueries[idx] || '').toLowerCase();
                                const filtered = products.filter(
                                  (p) =>
                                    p.name.toLowerCase().includes(q) ||
                                    p.sku.toLowerCase().includes(q)
                                );
                                if (filtered.length === 0) {
                                  return (
                                    <div className="px-3.5 py-3 text-center text-xs text-slate-400 font-medium">
                                      No products found
                                    </div>
                                  );
                                }
                                return filtered.map((p) => {
                                  const isSelected = parseInt(row.product_id) === p.id;
                                  return (
                                    <button
                                      key={p.id}
                                      type="button"
                                      onClick={() => {
                                        handleLineChange(idx, 'product_id', p.id);
                                        setActiveDropdownIndex(null);
                                        const updated = { ...searchQueries };
                                        delete updated[idx];
                                        setSearchQueries(updated);
                                      }}
                                      className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs ${
                                        isSelected ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                      }`}
                                    >
                                      <div>
                                        <p className="line-clamp-1">{p.name}</p>
                                        <p className="text-[9px] text-slate-400 font-mono">{p.sku}</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="font-extrabold font-mono">₹{parseFloat(p.price).toLocaleString('en-IN')}</p>
                                        <p className="text-[9px] text-slate-500 font-semibold">{p.stock_quantity} in stock</p>
                                      </div>
                                    </button>
                                  );
                                });
                              })()}
                            </div>
                          </>
                        )}
                        {(() => {
                          const selectedProduct = products.find((p) => p.id === parseInt(row.product_id));
                          if (!selectedProduct) return null;
                          const stock = selectedProduct.stock_quantity || 0;
                          return (
                            <div className="mt-0.5 px-1 text-[9px] font-bold text-slate-500">
                              Available stock: <span className={stock > 5 ? 'text-emerald-600' : 'text-amber-600'}>{stock} units</span>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Quantity</label>
                          {(() => {
                            const selectedProduct = products.find((p) => p.id === parseInt(row.product_id));
                            const stock = selectedProduct?.stock_quantity || 0;
                            const exceeds = (parseInt(row.quantity) || 0) > stock;
                            return (
                              <input
                                type="number" required min="1" value={row.quantity}
                                onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                className={`w-full border rounded-lg px-2.5 py-1.5 text-xs text-center focus:outline-none bg-white font-semibold transition-all ${
                                  exceeds
                                    ? 'border-rose-400 focus:border-rose-500 text-rose-600'
                                    : 'border-slate-200 focus:border-emerald-500'
                                }`}
                              />
                            );
                          })()}
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Unit Price (₹)</label>
                          <input
                            type="number" step="0.01" required value={row.unit_price}
                            onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-right focus:outline-none focus:border-emerald-500 bg-white font-semibold"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-100/50">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Line Total</span>
                        <span className="text-xs font-black text-slate-700">
                          ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* ── Section 3: Notes + Financial Summary ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center">
                  <FileText className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Notes &amp; Terms</span>
              </div>
              <textarea
                placeholder="Custom delivery terms, AMC coverage, payment schedule..."
                rows={5} value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all"
              />
            </div>

            {/* Financial summary panel */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
                  <Receipt className="w-3 h-3 text-white" />
                </div>
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Financial Summary</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">Subtotal</span>
                  <span className="font-bold text-slate-700">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <div className="flex flex-col flex-grow">
                    <div className="flex items-center gap-1 text-slate-500 font-semibold">
                      <Percent className="w-3.5 h-3.5 text-slate-400" /> GST Tax (18% split) (+)
                    </div>
                    {parseFloat(tax) > 0 && (
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold ml-5">
                        <span>CGST (9%): ₹{(parseFloat(tax) / 2).toFixed(2)}</span>
                        <span>·</span>
                        <span>SGST (9%): ₹{(parseFloat(tax) / 2).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    value={tax}
                    onChange={(e) => {
                      setIsTaxOverridden(true);
                      setTax(e.target.value);
                    }}
                    className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                  />
                </div>
                <div className="flex justify-between items-center text-xs gap-3">
                  <div className="flex items-center gap-1.5 text-slate-500 font-semibold flex-grow">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Discount (-)</span>
                    
                    {/* Toggle button group for Flat vs Percentage discount */}
                    <div className="flex items-center bg-slate-200/60 rounded-lg p-0.5 ml-2 border border-slate-200/80">
                      <button
                        type="button"
                        onClick={() => setDiscountType('flat')}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                          discountType === 'flat'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        ₹
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percent')}
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded-md transition-all ${
                          discountType === 'percent'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        %
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <input
                      type="number"
                      step="any"
                      value={discount}
                      onChange={(e) => setDiscount(e.target.value)}
                      className="w-20 border border-slate-200 rounded-lg px-2 py-1 text-right text-xs bg-white focus:outline-none focus:border-emerald-500 font-bold text-slate-700"
                    />
                    {discountType === 'percent' && (
                      <span className="text-[9px] text-slate-400 font-bold mt-0.5 mr-1">
                        (₹{((subtotal * (parseFloat(discount) || 0)) / 100).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="bg-slate-900 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Grand Total</span>
                  <span className="text-lg font-black text-white">₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button" onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating…</>
              ) : (
                <><FileText className="w-3.5 h-3.5" />Generate Proposal</>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: QUOTE DETAIL VIEW
      ═══════════════════════════════════════════════════ */}
      {selectedQuote && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Proposal: ${selectedQuote.quotation_number}`}
          size="lg"
        >
          <div className="space-y-4">
            {/* Header bar */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between bg-slate-900 rounded-xl px-4 py-3 gap-3">
              <div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Client</p>
                <h3 className="text-sm font-extrabold text-white mt-0.5">{selectedQuote.customer_name}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" /> Valid until: {selectedQuote.valid_until}
                </p>
              </div>
              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 border-t border-slate-800 pt-2 sm:border-t-0 sm:pt-0">
                <StatusBadge status={selectedQuote.status} />
                <span className="text-[9px] text-slate-400 font-medium">by {selectedQuote.creator_name}</span>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Equipment Lines</h4>
              
              {/* Desktop view */}
              <div className="hidden md:block border border-slate-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-12 gap-2 bg-slate-50 px-4 py-2.5 text-[9px] text-slate-400 font-black uppercase tracking-widest">
                  <span className="col-span-5">Product</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-right">Unit Price</span>
                  <span className="col-span-3 text-right">Line Total</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {selectedQuote.items?.map((item, i) => (
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

              {/* Mobile list view */}
              <div className="space-y-2 md:hidden">
                {selectedQuote.items?.map((item, i) => (
                  <div key={i} className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{item.product_name}</p>
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

            {/* Notes + Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3">
                <p className="text-[9px] font-black text-amber-700 uppercase tracking-wider mb-1">Notes &amp; Terms</p>
                <p className="text-[10px] text-slate-600 leading-relaxed italic">
                  {selectedQuote.notes || 'No custom terms recorded.'}
                </p>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal</span>
                  <span>₹{parseFloat(selectedQuote.subtotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>CGST (9.0%)</span>
                  <span>+₹{(parseFloat(selectedQuote.tax) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>SGST (9.0%)</span>
                  <span>+₹{(parseFloat(selectedQuote.tax) / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Discount</span>
                  <span>-₹{parseFloat(selectedQuote.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between bg-slate-900 text-white font-black text-sm rounded-xl px-3 py-2.5 mt-2">
                  <span>Grand Total</span>
                  <span>₹{parseFloat(selectedQuote.total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            {/* Detail actions */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-t border-slate-100 pt-4">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {canEdit && selectedQuote.status === 'Draft' && (
                  <>
                    <button
                      onClick={() => { setIsDetailOpen(false); handleOpenEditBuilder(selectedQuote); }}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-xl hover:bg-amber-100 transition-all"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit Draft
                    </button>
                    <button
                      onClick={() => handleDeleteQuotation(selectedQuote.id)}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-xl hover:bg-rose-100 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Draft
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedQuote.id, 'Sent')}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <Send className="w-3.5 h-3.5" /> Send to Client
                    </button>
                  </>
                )}
                {((canEdit && selectedQuote.status === 'Sent') || (isCustomer && selectedQuote.status === 'Sent')) && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedQuote.id, 'Approved')}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl hover:bg-emerald-100 transition-all"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedQuote.id, 'Rejected')}
                      className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold rounded-xl hover:bg-rose-100 transition-all"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                )}
                {canEdit && (selectedQuote.status === 'Approved' || selectedQuote.status === 'Rejected') && (
                  <button
                    onClick={() => handleUpdateStatus(selectedQuote.id, 'Sent')}
                    className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold rounded-xl hover:bg-amber-100 transition-all"
                  >
                    <Clock className="w-3.5 h-3.5" /> Reset to Sent
                  </button>
                )}
                {canEdit && (selectedQuote.status === 'Approved' || selectedQuote.status === 'Sent') && (
                  <button
                    onClick={() => { setIsDetailOpen(false); handleConvertToOrder(selectedQuote); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-[10px] font-bold rounded-xl hover:bg-slate-800 transition-all"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" /> Convert to Order
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 justify-end w-full sm:w-auto">
                <button
                  onClick={() => handleDownloadPdf(selectedQuote.id)}
                  className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 text-[10px] font-bold rounded-xl hover:bg-slate-50 transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="flex-grow sm:flex-grow-0 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold rounded-xl transition-all text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: VENDOR PROFILE SETTINGS
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Vendor Profile Settings (B2B PDF Configuration)"
        size="2xl"
      >
        <form onSubmit={handleSettingsSubmit} className="space-y-5">
          {/* Section 1: Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Company Identity</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name *</label>
                <input
                  type="text" required
                  value={vendorData.company_name}
                  onChange={(e) => setVendorData({ ...vendorData, company_name: e.target.value })}
                  placeholder="e.g. SmartKitchen Hub Solutions Ltd."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={vendorData.company_tagline}
                  onChange={(e) => setVendorData({ ...vendorData, company_tagline: e.target.value })}
                  placeholder="e.g. Enterprise Commercial Kitchen Solutions"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contact Email for Billing *</label>
                <input
                  type="email" required
                  value={vendorData.email}
                  onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                  placeholder="e.g. billing@smartkitchen.com"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Regulatory details & Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Regulatory Details &amp; Address</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={vendorData.gstin}
                  onChange={(e) => setVendorData({ ...vendorData, gstin: e.target.value })}
                  placeholder="e.g. 27AAACS1234A1Z1"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">PAN Number</label>
                <input
                  type="text"
                  value={vendorData.pan}
                  onChange={(e) => setVendorData({ ...vendorData, pan: e.target.value })}
                  placeholder="e.g. AAACS1234A"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-mono uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Physical Address *</label>
                <textarea
                  required rows={3}
                  value={vendorData.address}
                  onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                  placeholder="Street name, suite, city, state, postal code"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none transition-all bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Bank Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-amber-500 flex items-center justify-center">
                <CreditCard className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">RTGS / NEFT Bank Details</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Beneficiary Name *</label>
                <input
                  type="text" required
                  value={vendorData.bank_account_name}
                  onChange={(e) => setVendorData({ ...vendorData, bank_account_name: e.target.value })}
                  placeholder="e.g. SmartKitchen Hub Solutions Pvt. Ltd."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Bank Name *</label>
                <input
                  type="text" required
                  value={vendorData.bank_name}
                  onChange={(e) => setVendorData({ ...vendorData, bank_name: e.target.value })}
                  placeholder="e.g. HDFC Bank Limited"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Account Number *</label>
                <input
                  type="text" required
                  value={vendorData.bank_account_no}
                  onChange={(e) => setVendorData({ ...vendorData, bank_account_no: e.target.value })}
                  placeholder="e.g. 50200012345678 (Current Account)"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-mono font-medium"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">IFSC Code *</label>
                <input
                  type="text" required
                  value={vendorData.bank_ifsc}
                  onChange={(e) => setVendorData({ ...vendorData, bank_ifsc: e.target.value })}
                  placeholder="e.g. HDFC0000060"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-mono uppercase"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Branch Name *</label>
                <input
                  type="text" required
                  value={vendorData.bank_branch}
                  onChange={(e) => setVendorData({ ...vendorData, bank_branch: e.target.value })}
                  placeholder="e.g. Bandra Kurla Complex, Mumbai"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-white font-medium"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button" onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSettingsSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSettingsSubmitting ? (
                <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
              ) : (
                <><CheckCircle className="w-3.5 h-3.5" />Save Details</>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Quotations;
