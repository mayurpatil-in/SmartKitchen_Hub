import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import {
  Plus, Edit, Trash2, Search, Filter, ChevronLeft, ChevronRight,
  Eye, Utensils, X, Package, Tag, ArrowUpDown, TrendingUp,
  TrendingDown, AlertTriangle, CheckCircle, Layers, Zap,
  ChefHat, Flame, Thermometer, Wind, Droplets, Settings2
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────
   Category icon mapping (Lucide icons for kitchen context)
───────────────────────────────────────────────────────── */
const CATEGORY_ICONS = {
  default: Utensils,
  cooking: Flame,
  refrigeration: Thermometer,
  ventilation: Wind,
  dishwashing: Droplets,
  prep: ChefHat,
  equipment: Settings2,
};

const getCategoryIcon = (name = '') => {
  const n = name.toLowerCase();
  if (n.includes('cook') || n.includes('oven') || n.includes('grill') || n.includes('fry')) return CATEGORY_ICONS.cooking;
  if (n.includes('refrig') || n.includes('chill') || n.includes('cold') || n.includes('freez')) return CATEGORY_ICONS.refrigeration;
  if (n.includes('vent') || n.includes('exhaust') || n.includes('hood')) return CATEGORY_ICONS.ventilation;
  if (n.includes('dish') || n.includes('wash')) return CATEGORY_ICONS.dishwashing;
  if (n.includes('prep') || n.includes('mix') || n.includes('cut') || n.includes('slice')) return CATEGORY_ICONS.prep;
  if (n.includes('equip') || n.includes('unit') || n.includes('machine')) return CATEGORY_ICONS.equipment;
  return CATEGORY_ICONS.default;
};

const CATEGORY_GRADIENTS = [
  'from-emerald-600 to-teal-700',
  'from-violet-600 to-purple-700',
  'from-orange-500 to-amber-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
  'from-cyan-500 to-teal-600',
  'from-indigo-500 to-violet-600',
];
const getCategoryGradient = (index) => CATEGORY_GRADIENTS[index % CATEGORY_GRADIENTS.length];

/* ─────────────────────────────────────────────────────────
   Stock status helper
───────────────────────────────────────────────────────── */
const getStockStatus = (qty) => {
  if (qty === 0) return { label: 'Out of Stock', color: 'text-rose-600', dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (qty < 5) return { label: 'Low Stock', color: 'text-amber-600', dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' };
  return { label: 'In Stock', color: 'text-emerald-600', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
};

/* ─────────────────────────────────────────────────────────
   Main Component
───────────────────────────────────────────────────────── */
const Products = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const categoryStripRef = useRef(null);

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // ── Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // ── Filters & Sort
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('');

  // ── Modals
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Product Form
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);

  // ── Category Form
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [isCatSubmitting, setIsCatSubmitting] = useState(false);

  // ── Computed stats
  const lowStockCount = useMemo(() => products.filter(p => p.stock_quantity < 5).length, [products]);

  /* ── Fetchers ──────────────────────────────────────────── */
  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/products/categories');
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/products', {
        params: {
          search: search || undefined,
          category_id: categoryFilter || undefined,
          page,
          per_page: 8,
        },
      });
      if (res.success) {
        setProducts(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);

        // Build category counts map
        const counts = {};
        res.data.items.forEach((p) => {
          if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1;
        });
        setCategoryCounts(prev => ({ ...prev, ...counts }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { setPage(1); }, [search, categoryFilter]);
  useEffect(() => { fetchProducts(); }, [page, search, categoryFilter]);

  // ── Client-side sort
  const sortedProducts = useMemo(() => {
    if (!sortBy) return products;
    return [...products].sort((a, b) => {
      if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
      if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
      if (sortBy === 'stock_asc') return a.stock_quantity - b.stock_quantity;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [products, sortBy]);

  /* ── Product CRUD ──────────────────────────────────────── */
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setSku(''); setName(''); setPrice(''); setStock('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setSpecs([{ key: 'Power', value: '' }, { key: 'Dimensions', value: '' }]);
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setSku(prod.sku); setName(prod.name);
    setPrice(prod.price); setStock(prod.stock_quantity);
    setCategoryId(prod.category_id); setDescription(prod.description || '');
    const specRows = prod.specifications
      ? Object.entries(prod.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: '', value: '' }];
    setSpecs(specRows);
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    if (!sku || !name || !price || !categoryId) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }
    const parsedSpecs = {};
    specs.forEach((row) => { if (row.key.trim()) parsedSpecs[row.key.trim()] = row.value.trim(); });
    const payload = {
      sku, name,
      price: parseFloat(price),
      stock_quantity: parseInt(stock) || 0,
      category_id: parseInt(categoryId),
      description,
      specifications: parsedSpecs,
      images: selectedProduct?.images || ['/uploads/placeholder.jpg'],
    };
    try {
      setIsSubmitting(true);
      if (selectedProduct) {
        const res = await API.put(`/api/products/${selectedProduct.id}`, payload);
        if (res.success) dispatch(addToast({ type: 'success', message: 'Product updated successfully.' }));
      } else {
        const res = await API.post('/api/products', payload);
        if (res.success) dispatch(addToast({ type: 'success', message: 'Product added to catalog.' }));
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this product from the catalog?')) return;
    try {
      const res = await API.delete(`/api/products/${id}`);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Product removed successfully.' }));
        fetchProducts();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  /* ── Category CRUD ─────────────────────────────────────── */
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName) {
      dispatch(addToast({ type: 'warning', message: 'Category name is required.' }));
      return;
    }
    try {
      setIsCatSubmitting(true);
      const res = await API.post('/api/products/categories', { name: newCatName, description: newCatDesc });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: `Category '${newCatName}' created.` }));
        setNewCatName(''); setNewCatDesc('');
        fetchCategories();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    } finally {
      setIsCatSubmitting(false);
    }
  };

  /* ── Specs row helpers ─────────────────────────────────── */
  const handleAddSpecRow = () => setSpecs([...specs, { key: '', value: '' }]);
  const handleRemoveSpecRow = (idx) => setSpecs(specs.filter((_, i) => i !== idx));
  const handleSpecChange = (idx, field, val) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  /* ── Category strip scroll helpers ────────────────────── */
  const scrollStrip = (dir) => {
    if (categoryStripRef.current) {
      categoryStripRef.current.scrollBy({ left: dir * 180, behavior: 'smooth' });
    }
  };

  /* ── Pagination helpers ────────────────────────────────── */
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
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f2d1a 100%)',
        }}
      >
        {/* Decorative shimmer orb */}
        <div
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-0 left-24 w-32 h-32 rounded-full opacity-5 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        />

        <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
                B2B Catalog
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">
              Commercial Equipment Catalog
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Manage heavy-duty kitchen equipment lines &amp; categories
            </p>

            {/* ── Stats chips ── */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Package className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-white font-bold">{totalItems} SKUs</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                <Layers className="w-3 h-3 text-violet-400" />
                <span className="text-[10px] text-white font-bold">{categories.length} Categories</span>
              </div>
              {lowStockCount > 0 && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full px-3 py-1 animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] text-rose-300 font-bold">{lowStockCount} Low Stock</span>
                </div>
              )}
            </div>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setIsCategoryDrawerOpen(true)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                <Tag className="w-3.5 h-3.5" />
                Categories
              </button>
              <button
                onClick={handleOpenCreate}
                className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Equipment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          CATEGORY CHIP RIBBON
      ═══════════════════════════════════════════════════ */}
      <div className="relative">
        {/* Scroll Left Arrow */}
        <button
          onClick={() => scrollStrip(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow-lg transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>

        <div
          ref={categoryStripRef}
          className="overflow-x-auto scrollbar-hide mx-8 flex items-center gap-2 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* All chip */}
          <button
            onClick={() => setCategoryFilter('')}
            className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
              categoryFilter === ''
                ? 'bg-slate-900 text-white border-slate-900 shadow-md shadow-slate-900/20'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Zap className="w-3 h-3" />
            All Equipment
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
              categoryFilter === '' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            }`}>
              {totalItems}
            </span>
          </button>

          {categories.map((cat, idx) => {
            const CatIcon = getCategoryIcon(cat.name);
            const gradient = getCategoryGradient(idx);
            const isActive = String(categoryFilter) === String(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(String(cat.id))}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${
                  isActive
                    ? `bg-gradient-to-r ${gradient} text-white border-transparent shadow-md`
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CatIcon className="w-3 h-3" />
                {cat.name}
                {categoryCounts[cat.id] !== undefined && (
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {categoryCounts[cat.id] || 0}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Scroll Right Arrow */}
        <button
          onClick={() => scrollStrip(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-slate-200 shadow-md rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow-lg transition-all"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════
          FILTER & SORT BAR
      ═══════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row gap-3 items-center">
        {/* Search */}
        <div className="relative flex-grow w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by equipment name or SKU code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
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

        {/* Sort */}
        <div className="relative flex-shrink-0 w-full sm:w-52">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-emerald-500 appearance-none shadow-xs"
          >
            <option value="">Sort: Default</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
            <option value="stock_asc">Stock: Low → High</option>
            <option value="name_asc">Name: A → Z</option>
          </select>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
          PRODUCT GRID
      ═══════════════════════════════════════════════════ */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs animate-pulse"
            >
              <div className="h-44 bg-slate-200" />
              <div className="p-4 space-y-3">
                <div className="h-2.5 bg-slate-200 rounded-full w-1/3" />
                <div className="h-3 bg-slate-200 rounded-full w-3/4" />
                <div className="h-2.5 bg-slate-200 rounded-full w-full" />
                <div className="h-2.5 bg-slate-200 rounded-full w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        /* ── Empty State ── */
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-100 rounded-2xl text-center">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mb-5 relative"
            style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 70%)' }}
          >
            <Utensils className="w-12 h-12 text-slate-300" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-700 mb-1">No Products Found</h3>
          <p className="text-xs text-slate-400 max-w-xs">
            {search || categoryFilter
              ? 'No matching equipment for the current filters. Try clearing them.'
              : 'Start building your commercial catalog by adding equipment products.'}
          </p>
          {(search || categoryFilter) && (
            <button
              onClick={() => { setSearch(''); setCategoryFilter(''); }}
              className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
            >
              Clear Filters
            </button>
          )}
          {canEdit && !search && !categoryFilter && (
            <button
              onClick={handleOpenCreate}
              className="mt-4 flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add First Product
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {sortedProducts.map((p, idx) => {
              const stock = getStockStatus(p.stock_quantity);
              const catIdx = categories.findIndex(c => c.id === p.category_id);
              const gradient = getCategoryGradient(catIdx >= 0 ? catIdx : idx);
              const CatIcon = getCategoryIcon(p.category_name || '');

              return (
                <div
                  key={p.id}
                  className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col"
                  style={{ '--tw-shadow': '0 20px 40px -10px rgba(0,0,0,0.12)' }}
                >
                  {/* ── Image Zone ── */}
                  <div
                    className={`relative h-44 bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden`}
                  >
                    {/* Subtle grid pattern overlay */}
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px),repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(255,255,255,0.3) 24px,rgba(255,255,255,0.3) 25px)',
                      }}
                    />
                    {/* Shimmer on hover */}
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-5 transition-opacity duration-500" />

                    {/* Center Icon */}
                    <CatIcon className="w-14 h-14 text-white/50 group-hover:text-white/70 group-hover:scale-110 transition-all duration-300" />

                    {/* SKU pill — top left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="bg-black/30 backdrop-blur-sm text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded-md tracking-wider border border-white/10">
                        {p.sku}
                      </span>
                    </div>

                    {/* Low Stock ribbon — top right */}
                    {p.stock_quantity === 0 ? (
                      <div className="absolute top-0 right-0">
                        <div className="bg-rose-600 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-widest">
                          Out of Stock
                        </div>
                      </div>
                    ) : p.stock_quantity < 5 ? (
                      <div className="absolute top-0 right-0">
                        <div className="bg-amber-500 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-widest animate-pulse">
                          Low Stock
                        </div>
                      </div>
                    ) : null}

                    {/* Category badge — bottom left */}
                    <div className="absolute bottom-2.5 left-2.5">
                      <span className="bg-black/30 backdrop-blur-sm text-white text-[8px] font-bold px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-wider">
                        {p.category_name || 'Uncategorized'}
                      </span>
                    </div>
                  </div>

                  {/* ── Card Body ── */}
                  <div className="flex flex-col flex-grow p-4 space-y-2">
                    <h4
                      className="text-[13px] font-extrabold text-slate-800 line-clamp-1 leading-tight group-hover:text-emerald-700 transition-colors"
                      title={p.name}
                    >
                      {p.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {p.description || 'No description available.'}
                    </p>

                    {/* Stock indicator */}
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${stock.dot} ${p.stock_quantity < 5 && p.stock_quantity > 0 ? 'animate-pulse' : ''}`} />
                      <span className={`text-[9px] font-bold ${stock.color}`}>
                        {stock.label}
                      </span>
                      <span className="text-[9px] text-slate-400">· {p.stock_quantity} units</span>
                    </div>
                  </div>

                  {/* ── Card Footer ── */}
                  <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider leading-none">B2B Unit Price</p>
                      <p className="text-sm font-black text-slate-800 mt-0.5">
                        ${parseFloat(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setSelectedProduct(p); setIsDetailModalOpen(true); }}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-200 hover:bg-emerald-50 transition-all hover:scale-110 active:scale-95"
                        title="View specifications"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all hover:scale-110 active:scale-95"
                            title="Edit product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleProductDelete(p.id)}
                            className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all hover:scale-110 active:scale-95"
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Pagination ── */}
          {pages > 1 && (
            <div className="flex items-center justify-between bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-xs">
              <span className="text-[10px] text-slate-500 font-bold">
                Page <span className="text-slate-700">{page}</span> of <span className="text-slate-700">{pages}</span>
                <span className="text-slate-400 ml-2">· {totalItems} total items</span>
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-105"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all hover:scale-105 ${
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
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all hover:scale-105"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          MODAL: ADD / EDIT PRODUCT
      ═══════════════════════════════════════════════════ */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? 'Edit Commercial Equipment' : 'Add New Commercial Equipment'}
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-5">

          {/* ── Section 1: Basic Info ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-slate-900 flex items-center justify-center">
                <Utensils className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Basic Information</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Equipment Name *</label>
                <input
                  type="text" required value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Convection Oven Pro"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">SKU Code *</label>
                <input
                  type="text" required value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. OVR-G60-CON"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the commercial capacity, heating type, power load, certifications..."
                rows={2}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              />
            </div>
          </div>

          {/* ── Section 2: Pricing & Stock ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Pricing &amp; Stock</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Base Price ($) *</label>
                <input
                  type="number" step="0.01" required value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Stock Count *</label>
                <input
                  type="number" required value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                <select
                  required value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none bg-white focus:border-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Section 3: Technical Specs ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md bg-violet-600 flex items-center justify-center">
                <Settings2 className="w-3 h-3 text-white" />
              </div>
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Technical Specifications</span>
              <div className="flex-grow h-px bg-gradient-to-r from-slate-200 to-transparent" />
              <button
                type="button" onClick={handleAddSpecRow}
                className="text-[9px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 hover:underline flex-shrink-0"
              >
                <Plus className="w-3 h-3" /> Add Row
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {specs.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text" placeholder="Parameter (e.g. Power)"
                    value={row.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="w-2/5 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-400 bg-slate-50"
                  />
                  <input
                    type="text" placeholder="Value (e.g. 5.5 kW)"
                    value={row.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="flex-grow border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none focus:border-emerald-400"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button" onClick={() => handleRemoveSpecRow(idx)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 border border-slate-200 hover:border-rose-200 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Actions ── */}
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button" onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>{selectedProduct ? 'Save Changes' : 'Create Product'}</>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* ═══════════════════════════════════════════════════
          MODAL: SPEC DETAIL SHEET
      ═══════════════════════════════════════════════════ */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Equipment Specification Sheet"
          size="md"
        >
          <div className="space-y-4">
            {/* Product header */}
            {(() => {
              const catIdx = categories.findIndex(c => c.id === selectedProduct.category_id);
              const gradient = getCategoryGradient(catIdx >= 0 ? catIdx : 0);
              const CatIcon = getCategoryIcon(selectedProduct.category_name || '');
              const stockStat = getStockStatus(selectedProduct.stock_quantity);
              const stockPct = Math.min(100, (selectedProduct.stock_quantity / 20) * 100);
              return (
                <>
                  <div className={`relative -mx-5 -mt-1 px-5 py-4 bg-gradient-to-br ${gradient} rounded-t-xl`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="bg-black/20 text-white text-[8px] font-mono font-bold px-2 py-0.5 rounded border border-white/10">
                          {selectedProduct.sku}
                        </span>
                        <h2 className="text-sm font-extrabold text-white mt-1.5 leading-tight">
                          {selectedProduct.name}
                        </h2>
                        <span className="text-[9px] text-white/70 font-semibold uppercase tracking-wider">
                          {selectedProduct.category_name}
                        </span>
                      </div>
                      <CatIcon className="w-10 h-10 text-white/30" />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedProduct.description || 'No description provided.'}
                  </p>

                  {/* Stock level bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Stock Level</span>
                      <span className={`text-[9px] font-bold ${stockStat.color}`}>
                        {selectedProduct.stock_quantity} units · {stockStat.label}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          selectedProduct.stock_quantity === 0 ? 'bg-rose-500' :
                          selectedProduct.stock_quantity < 5 ? 'bg-amber-400' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${stockPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between bg-slate-900 rounded-xl px-4 py-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">B2B Base Price</span>
                    <span className="text-lg font-black text-white">
                      ${parseFloat(selectedProduct.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              );
            })()}

            {/* Specs table */}
            <div>
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest mb-2">Technical Data Sheet</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                  Object.entries(selectedProduct.specifications).map(([key, value], i) => (
                    <div
                      key={key}
                      className={`flex items-center px-3 py-2.5 text-xs ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                    >
                      <span className="w-2/5 text-slate-400 font-bold uppercase text-[9px] tracking-wider">{key}</span>
                      <span className="w-3/5 text-slate-800 font-semibold">{value}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-[10px] text-slate-400">
                    No technical specifications recorded.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all hover:scale-105 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ═══════════════════════════════════════════════════
          SLIDE-IN CATEGORY DRAWER
      ═══════════════════════════════════════════════════ */}
      {/* Backdrop */}
      {isCategoryDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setIsCategoryDrawerOpen(false)}
        />
      )}
      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full sm:w-96 z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          isCategoryDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Tag className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold">Category Manager</h3>
              <p className="text-[9px] text-slate-400">{categories.length} categories configured</p>
            </div>
          </div>
          <button
            onClick={() => setIsCategoryDrawerOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-grow overflow-y-auto p-5 space-y-6">

          {/* ── Add New Category Form ── */}
          {canEdit && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">Add New Category</span>
              </div>
              <form onSubmit={handleCategorySubmit} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category Name *</label>
                  <input
                    type="text" required
                    placeholder="e.g. Dishwashing Equipment"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                  <textarea
                    placeholder="Describe what equipment belongs in this category..."
                    rows={2}
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 bg-white resize-none transition-all"
                  />
                </div>
                <button
                  type="submit" disabled={isCatSubmitting}
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-900/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:pointer-events-none"
                >
                  {isCatSubmitting ? (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  {isCatSubmitting ? 'Creating...' : 'Create Category'}
                </button>
              </form>
            </div>
          )}

          {/* ── Existing Categories List ── */}
          <div className="space-y-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Existing Categories</span>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">No categories yet.</div>
            ) : (
              categories.map((cat, idx) => {
                const CatIcon = getCategoryIcon(cat.name);
                const gradient = getCategoryGradient(idx);
                return (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-3 hover:border-slate-300 hover:shadow-xs transition-all group"
                  >
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0`}>
                      <CatIcon className="w-4.5 h-4.5 text-white" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-xs font-bold text-slate-800 leading-tight truncate">{cat.name}</p>
                      {cat.description && (
                        <p className="text-[9px] text-slate-400 truncate mt-0.5">{cat.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => { setCategoryFilter(String(cat.id)); setIsCategoryDrawerOpen(false); }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all opacity-0 group-hover:opacity-100"
                      title="Filter by this category"
                    >
                      <Filter className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setIsCategoryDrawerOpen(false)}
            className="w-full py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-white transition-all"
          >
            Close Manager
          </button>
        </div>
      </div>

    </div>
  );
};

export default Products;
