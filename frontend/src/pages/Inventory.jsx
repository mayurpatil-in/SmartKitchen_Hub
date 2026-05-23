import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import DataTable from '../components/DataTables';
import Modal from '../components/Modal';
import { 
  Package, TrendingUp, TrendingDown, RefreshCw, 
  Plus, Edit3, ClipboardList, AlertCircle 
} from 'lucide-react';

const Inventory = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [activeTab, setActiveTab] = useState('balances'); // 'balances' | 'ledger'
  const [products, setProducts] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');

  // Modal states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustRef, setAdjustRef] = useState('');

  const fetchBalances = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/products', {
        params: {
          search: search || undefined,
          page,
          per_page: 10
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

  const fetchLedger = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/inventory/transactions', {
        params: {
          page,
          per_page: 12
        }
      });
      if (res.success) {
        setLedger(res.data.items);
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
    setPage(1);
  }, [activeTab, search]);

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchBalances();
    } else {
      fetchLedger();
    }
  }, [activeTab, page, search]);

  const handleOpenAdjust = (prod) => {
    setSelectedProduct(prod);
    setAdjustQty('');
    setAdjustRef('Physical Audit stock correction');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!adjustQty || !adjustRef) {
      dispatch(addToast({ type: 'warning', message: 'Adjustment offset and reference text are required.' }));
      return;
    }

    try {
      const res = await API.post(`/api/inventory/adjust/${selectedProduct.id}`, {
        quantity: parseInt(adjustQty),
        reference: adjustRef
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Warehouse stock adjusted successfully.' }));
        setIsAdjustOpen(false);
        fetchBalances();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // Balances table headers
  const balanceHeaders = [
    { 
      label: "Commercial Product / Sku", 
      key: "name",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.name}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">SKU: {item.sku}</p>
        </div>
      )
    },
    { label: "Category", key: "category_name" },
    { 
      label: "Stock Balances", 
      key: "stock_quantity",
      align: "center",
      render: (item) => {
        const isLow = item.stock_quantity < 5;
        const styles = isLow 
          ? 'bg-rose-50 border-rose-200 text-rose-700 font-black animate-pulse' 
          : 'bg-emerald-50 border-emerald-150 text-emerald-700 font-bold';
        
        return (
          <span className={`text-[10px] uppercase px-3 py-1 rounded-full border select-none tracking-wider ${styles}`}>
            {item.stock_quantity} units
          </span>
        );
      }
    },
    { 
      label: "Unit Price", 
      key: "price",
      align: "right",
      render: (item) => (
        <span className="font-extrabold text-slate-850 text-xs">
          ${parseFloat(item.price).toLocaleString()}
        </span>
      )
    },
    ...(canEdit ? [{
      label: "Warehouse Action",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => handleOpenAdjust(item)}
            className="px-2.5 py-1 bg-white border border-slate-200 text-slate-655 hover:text-emerald-600 rounded-lg hover:bg-slate-50 transition-all scale-100 active:scale-95 text-[10px] font-bold flex items-center gap-1"
          >
            <Edit3 className="w-3.5 h-3.5" /> Adjust Stock
          </button>
        </div>
      )
    }] : [])
  ];

  // Ledger table headers
  const ledgerHeaders = [
    { 
      label: "Transaction Reference", 
      key: "reference",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.reference || 'Stock Adjust'}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
            Logged: {new Date(item.created_at).toLocaleString()}
          </p>
        </div>
      )
    },
    { 
      label: "Kitchen Product SKU", 
      key: "product_sku",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-xs">{item.product_name}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">{item.product_sku}</p>
        </div>
      )
    },
    { 
      label: "Audit Type", 
      key: "transaction_type",
      align: "center",
      render: (item) => {
        const isOut = item.transaction_type === 'OUT';
        const styles = isOut 
          ? 'bg-rose-50 border-rose-150 text-rose-700' 
          : 'bg-emerald-50 border-emerald-150 text-emerald-700';
        
        return (
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border select-none tracking-wider ${styles}`}>
            {item.transaction_type}
          </span>
        );
      }
    },
    { 
      label: "Quantity Offset", 
      key: "quantity",
      align: "right",
      render: (item) => {
        const isNeg = item.quantity < 0;
        return (
          <span className={`font-black text-xs ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
            {isNeg ? '' : '+'}{item.quantity}
          </span>
        );
      }
    },
    { 
      label: "Warehouse Operator", 
      key: "creator_name",
      render: (item) => (
        <span className="font-bold text-slate-650 text-[10px]">
          {item.creator_name || 'System Auto'}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Warehouse Stock</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Audit inventory levels, track adjustments, and manage balances</p>
        </div>
      </div>

      {/* Dynamic Tab Switchers */}
      <div className="flex border-b border-slate-150 bg-slate-100/40 p-1 rounded-xl self-start w-fit select-none">
        <button
          onClick={() => setActiveTab('balances')}
          className={`flex items-center gap-1.5 px-4 py-1.8 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'balances' 
              ? 'bg-white text-slate-850 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Package className="w-4 h-4" /> Stock Balances
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={`flex items-center gap-1.5 px-4 py-1.8 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'ledger' 
              ? 'bg-white text-slate-850 shadow-sm border border-slate-100' 
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <ClipboardList className="w-4 h-4" /> Transaction Ledger
        </button>
      </div>

      {/* Main Datatable */}
      {activeTab === 'balances' ? (
        <DataTable
          headers={balanceHeaders}
          items={products}
          isLoading={isLoading}
          totalItems={totalItems}
          page={page}
          pages={pages}
          onPageChange={setPage}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search current stock balances by name or SKU..."
        />
      ) : (
        <DataTable
          headers={ledgerHeaders}
          items={ledger}
          isLoading={isLoading}
          totalItems={totalItems}
          page={page}
          pages={pages}
          onPageChange={setPage}
          searchQuery={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search transaction ledger logs..."
        />
      )}

      {/* MODAL: MANUAL STOCK ADJUSTMENT */}
      {selectedProduct && (
        <Modal
          isOpen={isAdjustOpen}
          onClose={() => setIsAdjustOpen(false)}
          title={`Adjust Inventory: ${selectedProduct.name}`}
          size="sm"
        >
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Product SKU: {selectedProduct.sku}</span>
              <p className="text-[11px] text-slate-550 font-semibold mt-0.5">
                Current Warehouse Balance: <strong className="text-slate-800">{selectedProduct.stock_quantity} units</strong>
              </p>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">
                Adjustment Offset * (Use positive to add, negative to subtract)
              </label>
              <input
                type="number"
                required
                placeholder="e.g. 5 or -2"
                value={adjustQty}
                onChange={(e) => setAdjustQty(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Adjustment Reference / Reason *</label>
              <input
                type="text"
                required
                placeholder="e.g. Physical inventory audit"
                value={adjustRef}
                onChange={(e) => setAdjustRef(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-705 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsAdjustOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 hover-scale"
              >
                Submit Adjustment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Inventory;
