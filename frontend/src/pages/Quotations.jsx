import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import DataTable from '../components/DataTables';
import Modal from '../components/Modal';
import { 
  Plus, Edit, Trash2, Download, CheckCircle, 
  XCircle, ShoppingBag, Eye, Calendar, User, FileText, ShoppingCart
} from 'lucide-react';

const Quotations = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const isCustomer = user?.role === 'Customer';
  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal controls
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Builder Form states
  const [customerId, setCustomerId] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [tax, setTax] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: 0 }]);

  // Calculated values
  const [subtotal, setSubtotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);

  const fetchDependencies = async () => {
    try {
      const custRes = await API.get('/api/customers');
      if (custRes.success) setCustomers(custRes.data.items);

      const prodRes = await API.get('/api/products', { params: { per_page: 100 } });
      if (prodRes.success) setProducts(prodRes.data.items);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuotations = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/quotations', {
        params: {
          status: statusFilter || undefined,
          page,
          per_page: 10
        }
      });
      if (res.success) {
        setQuotations(res.data.items);
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
    fetchDependencies();
  }, []);

  useEffect(() => {
    fetchQuotations();
  }, [page, statusFilter]);

  // Recalculate totals on line modifications
  useEffect(() => {
    let sub = 0;
    items.forEach((item) => {
      const qty = parseInt(item.quantity) || 0;
      const price = parseFloat(item.unit_price) || 0;
      sub += qty * price;
    });
    
    const taxVal = parseFloat(tax) || 0;
    const discVal = parseFloat(discount) || 0;
    
    setSubtotal(sub);
    setGrandTotal(Math.max(sub + taxVal - discVal, 0));
  }, [items, tax, discount]);

  const handleOpenBuilder = () => {
    setCustomerId(customers[0]?.id || '');
    // Default valid date: 15 days from today
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 15);
    setValidUntil(defaultDate.toISOString().split('T')[0]);
    
    setTax('0');
    setDiscount('0');
    setNotes('');
    setItems([{ product_id: products[0]?.id || '', quantity: 1, unit_price: products[0]?.price || 0 }]);
    setIsBuilderOpen(true);
  };

  const handleAddLineItem = () => {
    const defaultProd = products[0];
    setItems([...items, { product_id: defaultProd?.id || '', quantity: 1, unit_price: defaultProd?.price || 0 }]);
  };

  const handleRemoveLineItem = (idx) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx, field, val) => {
    const updated = [...items];
    updated[idx][field] = val;

    // If changing product_id, lookup baseline price
    if (field === 'product_id') {
      const match = products.find(p => p.id === parseInt(val));
      if (match) {
        updated[idx].unit_price = match.price;
      }
    }
    setItems(updated);
  };

  const handleBuilderSubmit = async (e) => {
    e.preventDefault();
    if (!customerId || !validUntil || items.length === 0) {
      dispatch(addToast({ type: 'warning', message: 'Please select customers, dates, and products lines.' }));
      return;
    }

    // Verify all lines have active product mappings
    const isInvalid = items.some(item => !item.product_id || parseInt(item.quantity) <= 0);
    if (isInvalid) {
      dispatch(addToast({ type: 'warning', message: 'All lines must map products and have quantities > 0.' }));
      return;
    }

    const payload = {
      customer_id: parseInt(customerId),
      valid_until: validUntil,
      tax: parseFloat(tax) || 0,
      discount: parseFloat(discount) || 0,
      notes,
      items: items.map(i => ({
        product_id: parseInt(i.product_id),
        quantity: parseInt(i.quantity),
        unit_price: parseFloat(i.unit_price)
      }))
    };

    try {
      const res = await API.post('/api/quotations', payload);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Quotation generated.' }));
        setIsBuilderOpen(false);
        fetchQuotations();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await API.put(`/api/quotations/${id}/status`, { status });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: `Quote status updated: ${status}` }));
        fetchQuotations();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleDownloadPdf = (id, qNum) => {
    dispatch(addToast({ type: 'info', message: 'Generating invoice PDF. Please wait...' }));
    // Open standard native attachment download frame
    const token = localStorage.getItem('token');
    window.open(`http://localhost:5000/api/quotations/${id}/pdf?token=${token}`, '_blank');
  };

  const handleConvertToOrder = async (quote) => {
    const address = prompt("Enter shipping address for this order:", quote.customer.address);
    if (!address) return;

    try {
      dispatch(addToast({ type: 'info', message: 'Converting proposal to active order...' }));
      const res = await API.post('/api/orders/convert', {
        quotation_id: quote.id,
        shipping_address: address
      });
      if (res.success) {
        // Play sound or confetti
        import('canvas-confetti').then((confetti) => confetti.default());
        dispatch(addToast({ type: 'success', message: 'Quotation converted successfully to Order!' }));
        fetchQuotations();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // DataTable columns
  const headers = [
    { 
      label: "Proposal Number", 
      key: "quotation_number",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.quotation_number}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
            Expires: {item.valid_until}
          </p>
        </div>
      )
    },
    { 
      label: "B2B Client Organization", 
      key: "customer_name",
      render: (item) => (
        <div className="space-y-0.5 font-semibold text-slate-650">
          <p className="text-xs text-slate-800 font-bold">{item.customer_name}</p>
          <p className="text-[9px] text-slate-450 font-bold leading-none">Rep: {item.creator_name}</p>
        </div>
      )
    },
    { 
      label: "Subtotal Value", 
      key: "subtotal",
      align: "right",
      render: (item) => (
        <div className="text-right font-bold text-slate-800 text-xs">
          ${parseFloat(item.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    { 
      label: "Grand Total ($)", 
      key: "total",
      align: "right",
      render: (item) => (
        <div className="text-right font-black text-slate-900 text-xs">
          ${parseFloat(item.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    { 
      label: "Status State", 
      key: "status",
      align: "center",
      render: (item) => {
        const styles = {
          Draft: 'bg-slate-100 text-slate-700 border-slate-200',
          Sent: 'bg-blue-50 text-blue-700 border-blue-155',
          Approved: 'bg-emerald-50 text-emerald-700 border-emerald-155',
          Rejected: 'bg-rose-50 text-rose-700 border-rose-155'
        }[item.status] || 'bg-slate-100 text-slate-700';

        return (
          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border select-none tracking-wider ${styles}`}>
            {item.status}
          </span>
        );
      }
    },
    { 
      label: "Operations & Downloads", 
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedQuote(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-emerald-600 rounded-lg scale-100 active:scale-95 transition-all"
            title="Inspect proposal details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => handleDownloadPdf(item.id, item.quotation_number)}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-indigo-600 rounded-lg scale-100 active:scale-95 transition-all"
            title="Download ReportLab PDF"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {canEdit && item.status === 'Sent' && (
            <>
              <button
                onClick={() => handleUpdateStatus(item.id, 'Approved')}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-emerald-600 rounded-lg scale-100 active:scale-95 transition-all"
                title="Approve estimate"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleUpdateStatus(item.id, 'Rejected')}
                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-rose-600 rounded-lg scale-100 active:scale-95 transition-all"
                title="Reject estimate"
              >
                <XCircle className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {canEdit && (item.status === 'Approved' || item.status === 'Sent') && (
            <button
              onClick={() => handleConvertToOrder(item)}
              className="p-1.5 bg-emerald-600 border border-emerald-600 text-white rounded-lg hover:bg-emerald-700 scale-100 active:scale-95 transition-all"
              title="Convert to Order"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Quotations Manager</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Manage B2B commercial estimates, pricing negotiations, and PDF downloads</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenBuilder}
            className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 transition-all scale-100 active:scale-95 shadow-md shadow-emerald-950/10 hover-scale animate-pulse"
          >
            <Plus className="w-4 h-4" /> Open Proposal Builder
          </button>
        )}
      </div>

      {/* Filter and Table */}
      <DataTable
        headers={headers}
        items={quotations}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pages={pages}
        onPageChange={setPage}
        searchQuery={statusFilter}
        onSearchChange={setStatusFilter}
        searchPlaceholder="Filter quotes by status (Draft, Sent, Approved, Rejected)..."
      />

      {/* MODAL: INTERACTIVE QUOTATION BUILDER */}
      <Modal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title="Interactive B2B Quotation Builder"
        size="2xl"
      >
        <form onSubmit={handleBuilderSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Select B2B Client *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name} (Attn: {c.contact_person})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Estimate Expiry Date *</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* DYNAMIC LINE ITEMS MATRIX */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-1">
              <span className="text-[9px] font-black text-slate-700 uppercase tracking-wider">Equipment Item Lines</span>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-[9px] font-bold text-emerald-650 hover:text-emerald-700 flex items-center gap-0.5 hover:underline"
              >
                + Add Line
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {items.map((row, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <div className="w-[50%]">
                    <select
                      required
                      value={row.product_id}
                      onChange={(e) => handleLineChange(idx, 'product_id', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 focus:outline-none bg-white"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} (${p.price} | Stock: {p.stock_quantity})</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-[15%]">
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="Qty"
                      value={row.quantity}
                      onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-[25%]">
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="Price"
                      value={row.unit_price}
                      onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div className="w-[10%] text-center">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLineItem(idx)}
                        className="p-1 rounded bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Internal Notes & Terms</label>
              <textarea
                placeholder="Include custom delivery bounds, AMC coverage, or payment terms..."
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* LIVE FINANCIAL CALCS */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col justify-between">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold text-slate-500">
                  <span>Subtotal Value:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Tax / VAT Offset (+):</span>
                  <input
                    type="number"
                    value={tax}
                    onChange={(e) => setTax(e.target.value)}
                    className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[10px]"
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Discount Deduct (-):</span>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    className="w-16 border border-slate-200 rounded px-1.5 py-0.5 text-right text-[10px]"
                  />
                </div>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 mt-2 font-black text-slate-900 text-sm">
                <span>Grand Total:</span>
                <span>${grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 hover-scale"
            >
              Generate B2B Proposal
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: PROPOSAL DETAILS INSPECTION VIEW */}
      {selectedQuote && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Proposals Summary: ${selectedQuote.quotation_number}`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Customer Client</p>
                <h3 className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedQuote.customer_name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5">Validity Date: {selectedQuote.valid_until}</p>
              </div>

              <span className="bg-slate-800 text-slate-200 text-[10px] font-black px-2.5 py-0.8 rounded-lg uppercase">
                Creator: {selectedQuote.creator_name}
              </span>
            </div>

            {/* Line Items Grid */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Line Items</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100">
                <div className="flex bg-slate-50 p-2.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">
                  <span className="w-1/2">Equipment Name</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/6 text-right">Unit Price</span>
                  <span className="w-1/6 text-right">Total</span>
                </div>

                {selectedQuote.items.map((item, idx) => (
                  <div key={idx} className="flex p-2.5 text-[11px] items-center">
                    <span className="w-1/2 font-bold text-slate-850">{item.product_name} <span className="text-[9px] text-slate-400 font-normal">({item.product_sku})</span></span>
                    <span className="w-1/6 text-right font-semibold text-slate-650">{item.quantity}</span>
                    <span className="w-1/6 text-right font-semibold text-slate-650">${parseFloat(item.unit_price).toLocaleString()}</span>
                    <span className="w-1/6 text-right font-extrabold text-slate-800">${parseFloat(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-[10px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <p className="font-extrabold text-slate-700 uppercase tracking-wider text-[9px]">Internal Notes:</p>
                <p className="mt-1 leading-relaxed font-semibold italic">{selectedQuote.notes || "No custom terms recorded."}</p>
              </div>

              <div className="flex flex-col justify-end space-y-1.5 text-xs text-right pr-2">
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Subtotal:</span>
                  <span>${parseFloat(selectedQuote.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Taxes / VAT (+):</span>
                  <span>+${parseFloat(selectedQuote.tax).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-500 font-semibold">
                  <span>Discounts (-):</span>
                  <span>-${parseFloat(selectedQuote.discount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-200 pt-1.5 mt-1.5">
                  <span>Grand Total:</span>
                  <span>${parseFloat(selectedQuote.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-1.8 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Summary
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Quotations;
