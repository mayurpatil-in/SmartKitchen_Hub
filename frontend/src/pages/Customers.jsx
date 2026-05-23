import React, { useState, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Plus, Edit, Trash2, Search, Users, MapPin, Phone, User,
  Building2, ChevronLeft, ChevronRight, X, TrendingUp,
  Mail, Globe, Star, Shield, MoreVertical, Eye, Filter,
  CheckCircle, Clock, AlertCircle, Briefcase
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Avatar helpers — generate initials + deterministic color
───────────────────────────────────────────────────────── */
const AVATAR_PALETTES = [
  { bg: 'from-emerald-500 to-teal-600', ring: 'ring-emerald-200' },
  { bg: 'from-violet-500 to-purple-600', ring: 'ring-violet-200' },
  { bg: 'from-orange-400 to-amber-500', ring: 'ring-orange-200' },
  { bg: 'from-sky-500 to-blue-600', ring: 'ring-sky-200' },
  { bg: 'from-rose-500 to-pink-600', ring: 'ring-rose-200' },
  { bg: 'from-cyan-500 to-teal-500', ring: 'ring-cyan-200' },
  { bg: 'from-indigo-500 to-violet-600', ring: 'ring-indigo-200' },
];

const getAvatarPalette = (id) => AVATAR_PALETTES[(id || 0) % AVATAR_PALETTES.length];

const getInitials = (name = '') => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const Customers = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // ── Data
  const [customers, setCustomers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // ── Detail drawer
  const [drawerCustomer, setDrawerCustomer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // ── Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Form states
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  /* ── Fetchers ──────────────────────────────────────────── */
  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/customers', {
        params: { search: search || undefined, page, per_page: 10 },
      });
      if (res.success) {
        setCustomers(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { fetchCustomers(); }, [page, search]);

  /* ── CRUD ──────────────────────────────────────────────── */
  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setCompanyName(''); setContactPerson(''); setPhone(''); setAddress('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setCompanyName(cust.company_name);
    setContactPerson(cust.contact_person);
    setPhone(cust.phone);
    setAddress(cust.address);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone || !address) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }
    const payload = { company_name: companyName, contact_person: contactPerson, phone, address };
    try {
      setIsSubmitting(true);
      if (selectedCustomer) {
        const res = await API.put(`/api/customers/${selectedCustomer.id}`, payload);
        if (res.success) dispatch(addToast({ type: 'success', message: 'Customer profile updated.' }));
      } else {
        const res = await API.post('/api/customers', payload);
        if (res.success) dispatch(addToast({ type: 'success', message: 'B2B customer account registered.' }));
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this customer? All associated quotations and orders will also be deleted.')) return;
    try {
      const res = await API.delete(`/api/customers/${id}`);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Customer account removed.' }));
        if (isDrawerOpen && drawerCustomer?.id === id) setIsDrawerOpen(false);
        fetchCustomers();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const openDrawer = (cust) => {
    setDrawerCustomer(cust);
    setIsDrawerOpen(true);
  };

  /* ── Pagination numbers ────────────────────────────────── */
  const pageNumbers = useMemo(() => {
    const arr = [];
    const start = Math.max(1, page - 2);
    const end = Math.min(pages, page + 2);
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [page, pages]);

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
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #1a1030 100%)' }}
      >
        {/* Decorative glow orbs */}
        <div
          className="absolute -top-10 -right-10 w-52 h-52 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />


        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-500/20 border border-violet-500/30 text-violet-300 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                CRM
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">B2B Customer Accounts</h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Manage commercial kitchen accounts, contacts &amp; delivery profiles
            </p>

            {/* ── Stats chips ── */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Briefcase className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-white font-bold">{totalItems} Accounts</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-white font-bold">Active CRM</span>
              </div>
              {canEdit && (
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                  <Shield className="w-3 h-3 text-sky-400" />
                  <span className="text-[10px] text-white font-bold">{user?.role} Access</span>
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-violet-900/40 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Register Account
            </button>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          FILTER + VIEW TOGGLE BAR
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by company name, contact person, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 flex-shrink-0 shadow-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Cards
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CONTENT — TABLE OR GRID
      ═══════════════════════════════════════════════════ */}
      {isLoading ? (
        /* ── Loading skeleton ── */
        viewMode === 'table' ? (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="h-3 bg-slate-200 rounded-full w-1/4 animate-pulse" />
            </div>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="px-6 py-4 border-b border-slate-100 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-slate-200 flex-shrink-0" />
                <div className="flex-grow space-y-2">
                  <div className="h-3 bg-slate-200 rounded-full w-1/3" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-1/4" />
                </div>
                <div className="h-2.5 bg-slate-200 rounded-full w-24" />
                <div className="h-2.5 bg-slate-200 rounded-full w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4 animate-pulse shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-200 flex-shrink-0" />
                  <div className="space-y-2 flex-grow">
                    <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-slate-100 rounded-full w-full" />
                  <div className="h-2.5 bg-slate-100 rounded-full w-5/6" />
                </div>
              </div>
            ))}
          </div>
        )
      ) : customers.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5"
            style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)' }}
          >
            <Users className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Customers Found</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {search
              ? 'No accounts match your search query. Try different keywords.'
              : 'Start by registering your first B2B customer account.'}
          </p>
          {search ? (
            <button
              onClick={() => setSearch('')}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Clear Search
            </button>
          ) : canEdit && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Register First Account
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* ════════════════════════════════════
           TABLE VIEW
        ════════════════════════════════════ */
        <div className="bg-white border border-slate-100 rounded-2xl shadow-xs overflow-hidden">
          {/* Table summary strip */}
          <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
              {totalItems} client {totalItems === 1 ? 'account' : 'accounts'}
            </span>
            {search && (
              <span className="text-[10px] bg-violet-50 text-violet-700 border border-violet-100 px-2 py-0.5 rounded-full font-bold">
                Filtered: "{search}"
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-400 font-black uppercase tracking-widest select-none">
                  <th className="px-5 py-3.5">Company / Account</th>
                  <th className="px-5 py-3.5">Contact Person</th>
                  <th className="px-5 py-3.5">Phone</th>
                  <th className="px-5 py-3.5 max-w-xs">Address</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {customers.map((cust) => {
                  const palette = getAvatarPalette(cust.id);
                  const initials = getInitials(cust.company_name);
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-slate-50/60 transition-colors duration-150 group"
                    >
                      {/* Company */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl bg-gradient-to-br ${palette.bg} flex items-center justify-center flex-shrink-0 text-white text-xs font-black shadow-sm`}
                          >
                            {initials}
                          </div>
                          <div>
                            <p className="text-xs font-extrabold text-slate-800 leading-tight">{cust.company_name}</p>
                            <p className="text-[9px] text-slate-400 font-bold mt-0.5 font-mono">
                              SK-CUST-{String(cust.id).padStart(4, '0')}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-700">{cust.contact_person}</span>
                        </div>
                      </td>
                      {/* Phone */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400 flex-shrink-0" />
                          <span className="text-xs font-semibold text-slate-700 font-mono">{cust.phone}</span>
                        </div>
                      </td>
                      {/* Address */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-start gap-1.5" title={cust.address}>
                          <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-slate-500 font-medium truncate max-w-[180px]">{cust.address}</span>
                        </div>
                      </td>
                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openDrawer(cust)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-violet-600 hover:border-violet-200 hover:bg-violet-50 transition-all hover:scale-110 active:scale-95"
                            title="View profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {canEdit && (
                            <>
                              <button
                                onClick={() => handleOpenEdit(cust)}
                                className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all hover:scale-110 active:scale-95"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {user?.role === 'Admin' && (
                                <button
                                  onClick={() => handleDelete(cust.id)}
                                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* ════════════════════════════════════
           CARD GRID VIEW
        ════════════════════════════════════ */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {customers.map((cust) => {
            const palette = getAvatarPalette(cust.id);
            const initials = getInitials(cust.company_name);
            return (
              <div
                key={cust.id}
                className="group bg-white border border-slate-100 rounded-2xl shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden flex flex-col"
              >
                {/* Card top gradient bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${palette.bg}`} />

                <div className="p-5 flex flex-col flex-grow gap-4">
                  {/* Company header */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${palette.bg} flex items-center justify-center flex-shrink-0 text-white text-sm font-black shadow-md`}
                    >
                      {initials}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-sm font-extrabold text-slate-800 leading-tight truncate group-hover:text-violet-700 transition-colors">
                        {cust.company_name}
                      </h3>
                      <span className="text-[9px] text-slate-400 font-mono font-bold">
                        SK-CUST-{String(cust.id).padStart(4, '0')}
                      </span>
                    </div>
                    <button
                      onClick={() => openDrawer(cust)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-2.5 flex-grow">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="font-semibold truncate">{cust.contact_person}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="font-mono font-semibold">{cust.phone}</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-500">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-500" />
                      </div>
                      <span className="leading-relaxed line-clamp-2">{cust.address}</span>
                    </div>
                  </div>

                  {/* Card footer actions */}
                  {canEdit && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-[10px] font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                      >
                        <Edit className="w-3 h-3" /> Edit
                      </button>
                      {user?.role === 'Admin' && (
                        <button
                          onClick={() => handleDelete(cust.id)}
                          className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100 transition-all hover:scale-[1.02] active:scale-95"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Pagination ────────────────────────────────────── */}
      {!isLoading && pages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-xs">
          <span className="text-[10px] text-slate-500 font-bold">
            Page <span className="text-slate-700">{page}</span> of <span className="text-slate-700">{pages}</span>
            <span className="text-slate-400 ml-2">· {totalItems} accounts</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {pageNumbers.map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${
                  n === page
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(p + 1, pages))}
              disabled={page === pages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          CUSTOMER DETAIL DRAWER
      ═══════════════════════════════════════════════════ */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {drawerCustomer && (() => {
          const palette = getAvatarPalette(drawerCustomer.id);
          const initials = getInitials(drawerCustomer.company_name);
          return (
            <>
              {/* Drawer Header */}
              <div className={`relative bg-gradient-to-br ${palette.bg} px-5 pt-5 pb-8 flex-shrink-0`}>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/20 text-white/80 hover:bg-black/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                <div
                  className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-black mb-3 border border-white/30"
                >
                  {initials}
                </div>
                <h2 className="text-base font-extrabold text-white leading-tight">{drawerCustomer.company_name}</h2>
                <p className="text-[9px] text-white/70 font-mono font-bold mt-0.5">
                  SK-CUST-{String(drawerCustomer.id).padStart(4, '0')}
                </p>
              </div>

              {/* Drawer Body */}
              <div className="flex-grow overflow-y-auto">
                {/* Contact Info Section */}
                <div className="p-5 space-y-4">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contact Details</span>

                  <div className="space-y-3">
                    {[
                      { icon: User, label: 'Contact Person', value: drawerCustomer.contact_person },
                      { icon: Phone, label: 'Phone Number', value: drawerCustomer.phone, mono: true },
                      { icon: MapPin, label: 'Postal Address', value: drawerCustomer.address, wrap: true },
                    ].map(({ icon: Icon, label, value, mono, wrap }) => (
                      <div key={label} className="flex items-start gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                          <Icon className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                          <p className={`text-xs font-semibold text-slate-800 mt-0.5 leading-relaxed ${mono ? 'font-mono' : ''} ${!wrap ? 'truncate max-w-[220px]' : ''}`}>
                            {value || '—'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Account meta */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Account Meta</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Account ID</p>
                        <p className="text-xs font-black text-slate-700 mt-0.5 font-mono">
                          #{String(drawerCustomer.id).padStart(4, '0')}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-2.5 border border-slate-100 text-center">
                        <p className="text-[9px] text-slate-400 font-bold uppercase">Status</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <p className="text-[10px] font-bold text-emerald-600">Active</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              {canEdit && (
                <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50 flex gap-2">
                  <button
                    onClick={() => { setIsDrawerOpen(false); handleOpenEdit(drawerCustomer); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                  >
                    <Edit className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(drawerCustomer.id)}
                      className="px-4 py-2 flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </div>

      {/* ═══════════════════════════════════════════════════
          MODAL: ADD / EDIT CUSTOMER
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? 'Edit Customer Profile' : 'Register B2B Customer Account'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Section: Company */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                <Building2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Company Details</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Company / Organization Name *
              </label>
              <input
                type="text" required
                placeholder="e.g. Royal Bistro Foods Ltd."
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
              />
            </div>
          </div>

          {/* Section: Contact */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-slate-800 flex items-center justify-center">
                <User className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Point of Contact</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Contact Person *
                </label>
                <input
                  type="text" required
                  placeholder="e.g. John Doe"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number *
                </label>
                <input
                  type="text" required
                  placeholder="e.g. +91 99988 77766"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Address */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
                <MapPin className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Delivery Address</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Postal / Delivery Address *
              </label>
              <textarea
                required rows={3}
                placeholder="Street address, warehouse gateway, billing index..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl shadow-md shadow-violet-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                selectedCustomer ? 'Save Changes' : 'Register Account'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
