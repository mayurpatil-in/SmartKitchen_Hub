import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import Modal from '../components/Modal';
import { 
  Plus, Edit, Trash2, Search, Filter, 
  Settings, ShoppingCart, Info, Wrench, Eye, Utensils
} from 'lucide-react';

const Products = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Role check flags
  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal controls
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Product Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [specs, setSpecs] = useState([{ key: '', value: '' }]);

  // Category Form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await API.get('/api/products/categories');
      if (res.success) {
        setCategories(res.data);
      }
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
          per_page: 8
        }
      });
      if (res.success) {
        setProducts(res.data.items);
        setTotalItems(res.data.total);
        setPages(res.data.pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter]);

  // Open Modal to Create
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setSku('');
    setName('');
    setPrice('');
    setStock('');
    setCategoryId(categories[0]?.id || '');
    setDescription('');
    setSpecs([{ key: 'Power', value: '' }, { key: 'Dimensions', value: '' }]);
    setIsProductModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setSku(prod.sku);
    setName(prod.name);
    setPrice(prod.price);
    setStock(prod.stock_quantity);
    setCategoryId(prod.category_id);
    setDescription(prod.description || '');
    
    // Parse specs dictionary to key-value rows
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

    // Convert spec array to key-value JSON
    const parsedSpecs = {};
    specs.forEach((row) => {
      if (row.key.trim()) {
        parsedSpecs[row.key.trim()] = row.value.trim();
      }
    });

    const payload = {
      sku,
      name,
      price: parseFloat(price),
      stock_quantity: parseInt(stock) || 0,
      category_id: parseInt(categoryId),
      description,
      specifications: parsedSpecs,
      images: selectedProduct?.images || ["/uploads/placeholder.jpg"]
    };

    try {
      if (selectedProduct) {
        // Edit API
        const res = await API.put(`/api/products/${selectedProduct.id}`, payload);
        if (res.success) {
          dispatch(addToast({ type: 'success', message: 'Product updated successfully.' }));
        }
      } else {
        // Create API
        const res = await API.post('/api/products', payload);
        if (res.success) {
          dispatch(addToast({ type: 'success', message: 'Product added to catalog.' }));
        }
      }
      setIsProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleProductDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this kitchen equipment product profile?")) return;
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

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName) {
      dispatch(addToast({ type: 'warning', message: 'Category name is required.' }));
      return;
    }
    try {
      const res = await API.post('/api/products/categories', {
        name: newCatName,
        description: newCatDesc
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: `Category '${newCatName}' created.` }));
        setNewCatName('');
        setNewCatDesc('');
        setIsCategoryModalOpen(false);
        fetchCategories();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: '', value: '' }]);
  };

  const handleRemoveSpecRow = (idx) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx, field, val) => {
    const updated = [...specs];
    updated[idx][field] = val;
    setSpecs(updated);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Commercial Catalog</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Manage heavy-duty equipment lines and categories</p>
        </div>
        
        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="bg-slate-800 hover:bg-slate-900 border border-slate-700 text-white text-xs font-bold px-3 py-1.8 rounded-xl flex items-center gap-1.5 transition-all scale-100 active:scale-95 hover-glow"
            >
              <Plus className="w-4 h-4" /> Category
            </button>
            <button
              onClick={handleOpenCreate}
              className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 transition-all scale-100 active:scale-95 shadow-md shadow-emerald-950/10 hover-scale"
            >
              <Plus className="w-4 h-4" /> Add Equipment
            </button>
          </div>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="bg-white border border-slate-100 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="relative w-full md:max-w-sm">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search equipment by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.8 w-full border border-slate-200 rounded-xl text-xs placeholder-slate-400 text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider hidden sm:inline flex-shrink-0">Filter:</span>
          <div className="relative w-full md:w-48">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="pl-8 pr-4 py-1.8 w-full border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none bg-white"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid Table of Products */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-100 font-semibold">
          No matching commercial products found.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const isLowStock = p.stock_quantity < 5;
              return (
                <div key={p.id} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col justify-between">
                  <div className="p-4 space-y-3">
                    {/* Placeholder image grid container */}
                    <div className="h-36 bg-slate-900/5 rounded-xl flex items-center justify-center relative overflow-hidden select-none border border-slate-50">
                      <Utensils className="w-10 h-10 text-slate-300" />
                      
                      {isLowStock && (
                        <span className="absolute top-2 right-2 bg-rose-600 border border-rose-500 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md select-none tracking-wider animate-pulse">
                          Low Stock
                        </span>
                      )}
                      
                      <span className="absolute bottom-2 left-2 bg-slate-800/80 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-md select-none tracking-wider">
                        {p.category_name}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">SKU: {p.sku}</span>
                      <h4 className="text-xs font-bold text-slate-850 line-clamp-1 leading-tight" title={p.name}>{p.name}</h4>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed font-semibold">{p.description || "No description provided."}</p>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold leading-none">B2B Base Price</p>
                      <p className="text-sm font-black text-slate-800 mt-1">${parseFloat(p.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setIsDetailModalOpen(true);
                        }}
                        className="p-1.5 bg-white border border-slate-200 text-slate-655 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-colors scale-100 active:scale-95"
                        title="View specifications"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {canEdit && (
                        <>
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-655 hover:text-brand-600 rounded-lg hover:bg-slate-50 transition-colors scale-100 active:scale-95"
                            title="Edit details"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleProductDelete(p.id)}
                            className="p-1.5 bg-white border border-slate-200 text-slate-655 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors scale-100 active:scale-95"
                            title="Delete equipment"
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

          {/* Pagination bar */}
          {pages > 1 && (
            <div className="flex justify-between items-center bg-white border border-slate-100 px-6 py-3 rounded-2xl text-xs select-none">
              <span className="text-[10px] text-slate-500 font-bold">Page {page} of {pages} | Total: {totalItems}</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-[10px] font-bold text-slate-650 transition-all scale-100 active:scale-95"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, pages))}
                  disabled={page === pages}
                  className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none rounded-xl text-[10px] font-bold text-slate-650 transition-all scale-100 active:scale-95"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={selectedProduct ? "Edit Commercial Equipment" : "Add New Commercial Equipment"}
        size="lg"
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Equipment Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Convection Oven"
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Unique SKU Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. OVR-G60-CON"
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Base Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Initial Stock Count *</label>
              <input
                type="number"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Category Category *</label>
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe commercial limits, heating types, power loads..."
              rows={2}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* DYNAMIC SPECS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Technical Specifications</span>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="text-[9px] font-bold text-emerald-650 hover:text-emerald-700 flex items-center gap-0.5 hover:underline"
              >
                + Add Spec
              </button>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {specs.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="e.g. Dimensions"
                    value={row.key}
                    onChange={(e) => handleSpecChange(idx, 'key', e.target.value)}
                    className="w-1/2 border border-slate-200 rounded-xl px-3 py-1.2 text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="e.g. 500x400x300mm"
                    value={row.value}
                    onChange={(e) => handleSpecChange(idx, 'value', e.target.value)}
                    className="w-1/2 border border-slate-200 rounded-xl px-3 py-1.2 text-xs focus:outline-none"
                  />
                  {specs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecRow(idx)}
                      className="p-1 rounded bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 hover-scale"
            >
              {selectedProduct ? "Save Changes" : "Create Product"}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ADD CATEGORY */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Product Category"
        size="md"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Category Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Dishwashing Equipment"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Description</label>
            <textarea
              placeholder="Describe what class of commercial items belong here..."
              rows={2}
              value={newCatDesc}
              onChange={(e) => setNewCatDesc(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
            >
              Add Category
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: VIEW SPECIFICATIONS DETAIL */}
      {selectedProduct && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Kitchen Equipment Specifications"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Product SKU: {selectedProduct.sku}</span>
              <h2 className="text-sm font-extrabold text-slate-800 leading-tight mt-0.5">{selectedProduct.name}</h2>
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold mt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {selectedProduct.description || "No description provided."}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
                Technical Data Sheet
              </h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                {selectedProduct.specifications && Object.keys(selectedProduct.specifications).length > 0 ? (
                  Object.entries(selectedProduct.specifications).map(([key, value]) => (
                    <div key={key} className="flex p-2.5 text-xs">
                      <span className="w-1/3 text-slate-450 font-bold uppercase text-[9px] tracking-wider mt-0.5">{key}</span>
                      <span className="w-2/3 text-slate-800 font-semibold">{value}</span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-[10px] text-slate-400 font-medium bg-white">
                    No specifications recorded.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="px-4 py-1.8 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Products;
