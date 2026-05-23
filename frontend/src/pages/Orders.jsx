import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import DataTable from '../components/DataTables';
import Modal from '../components/Modal';
import { Eye, Edit2, ShieldAlert, ShoppingBag, Truck, MapPin, Clipboard } from 'lucide-react';

const Orders = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [orders, setOrders] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal controls
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [orderStatus, setOrderStatus] = useState('');
  const [deliveryStatus, setDeliveryStatus] = useState('');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/orders', {
        params: {
          status: statusFilter || undefined,
          page,
          per_page: 10
        }
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

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleOpenEdit = (ord) => {
    setSelectedOrder(ord);
    setOrderStatus(ord.status);
    setDeliveryStatus(ord.delivery_status);
    setIsEditOpen(true);
  };

  const handleUpdateStatusSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.put(`/api/orders/${selectedOrder.id}/status`, {
        status: orderStatus,
        delivery_status: deliveryStatus
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Order status updated successfully.' }));
        setIsEditOpen(false);
        fetchOrders();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // Status color helpers
  const getStatusBadge = (status) => {
    const configs = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200',
      Processing: 'bg-blue-50 text-blue-700 border-blue-200',
      Shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Cancelled: 'bg-rose-50 text-rose-700 border-rose-200'
    };
    return configs[status] || 'bg-slate-100 text-slate-700';
  };

  const getDeliveryBadge = (delStatus) => {
    const configs = {
      Pending: 'bg-slate-100 text-slate-650 border-slate-200',
      'In Transit': 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    };
    return configs[delStatus] || 'bg-slate-100 text-slate-700';
  };

  const headers = [
    { 
      label: "Order Number", 
      key: "order_number",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.order_number}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
            Placed: {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>
      )
    },
    { 
      label: "B2B Client Organization", 
      key: "customer_name",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-xs">{item.customer_name}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
            Ref Quote: {item.quotation_id ? `SK-QTN-${item.quotation_id}` : 'Direct checkout'}
          </p>
        </div>
      )
    },
    { 
      label: "Grand Total Value", 
      key: "total_amount",
      align: "right",
      render: (item) => (
        <div className="text-right font-black text-slate-800 text-xs">
          ${parseFloat(item.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </div>
      )
    },
    { 
      label: "Order Status", 
      key: "status",
      align: "center",
      render: (item) => (
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border select-none tracking-wider ${getStatusBadge(item.status)}`}>
          {item.status}
        </span>
      )
    },
    { 
      label: "Delivery Logistics", 
      key: "delivery_status",
      align: "center",
      render: (item) => (
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border select-none tracking-wider ${getDeliveryBadge(item.delivery_status)}`}>
          {item.delivery_status}
        </span>
      )
    },
    { 
      label: "Operations Control", 
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setSelectedOrder(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-emerald-600 rounded-lg scale-100 active:scale-95 transition-all"
            title="Inspect checkout items"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          
          {canEdit && (
            <button
              onClick={() => handleOpenEdit(item)}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-indigo-650 rounded-lg scale-100 active:scale-95 transition-all"
              title="Modify logistics status"
            >
              <Edit2 className="w-3.5 h-3.5" />
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
          <h1 className="text-xl font-extrabold text-slate-800">Order Processing</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Track commercial kitchen equipment purchase orders and shipping updates</p>
        </div>
      </div>

      {/* Filter and Table */}
      <DataTable
        headers={headers}
        items={orders}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pages={pages}
        onPageChange={setPage}
        searchQuery={statusFilter}
        onSearchChange={setStatusFilter}
        searchPlaceholder="Filter purchase orders by status (Pending, Shipped, Delivered, Cancelled)..."
      />

      {/* MODAL: INSPECT ORDER DETAILS */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Order Logs: ${selectedOrder.order_number}`}
          size="lg"
        >
          <div className="space-y-5 animate-slide-in">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">Customer Client</p>
                <h3 className="font-extrabold text-slate-800 text-xs mt-0.5">{selectedOrder.customer_name}</h3>
                <p className="text-[10px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Shipping: {selectedOrder.shipping_address}
                </p>
              </div>

              <div className="flex flex-col items-end gap-1 select-none">
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${getStatusBadge(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border tracking-wider ${getDeliveryBadge(selectedOrder.delivery_status)}`}>
                  Courier: {selectedOrder.delivery_status}
                </span>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-wider">Fulfillment Items</h4>
              <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 bg-slate-50/20">
                <div className="flex bg-slate-50 p-2.5 text-[9px] text-slate-500 font-bold uppercase tracking-wider select-none">
                  <span className="w-1/2">Equipment Name</span>
                  <span className="w-1/6 text-right">Qty</span>
                  <span className="w-1/6 text-right">Unit Price</span>
                  <span className="w-1/6 text-right">Total</span>
                </div>

                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex p-2.5 text-[11px] items-center bg-white">
                    <span className="w-1/2 font-bold text-slate-850">{item.product_name} <span className="text-[9px] text-slate-400 font-normal">({item.product_sku})</span></span>
                    <span className="w-1/6 text-right font-semibold text-slate-650">{item.quantity}</span>
                    <span className="w-1/6 text-right font-semibold text-slate-650">${parseFloat(item.unit_price).toLocaleString()}</span>
                    <span className="w-1/6 text-right font-extrabold text-slate-800">${parseFloat(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total value */}
            <div className="flex justify-between items-center bg-slate-50 border border-slate-100 p-4 rounded-xl">
              <span className="text-xs font-bold text-slate-650">Consolidated Billing Value:</span>
              <span className="text-base font-black text-slate-900">
                ${parseFloat(selectedOrder.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsDetailOpen(false)}
                className="px-4 py-1.8 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Close Logs
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: EDIT ORDER LOGISTICS */}
      {selectedOrder && (
        <Modal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          title={`Modify logistics status: ${selectedOrder.order_number}`}
          size="sm"
        >
          <form onSubmit={handleUpdateStatusSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Fulfillment Order Status</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-705 focus:outline-none bg-white"
              >
                <option value="Pending">Pending Approval</option>
                <option value="Processing">Processing / Manufacturing</option>
                <option value="Shipped">Shipped / In Transit</option>
                <option value="Delivered">Delivered successfully</option>
                <option value="Cancelled">Cancelled / Voided</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Logistics / Delivery Status</label>
              <select
                value={deliveryStatus}
                onChange={(e) => setDeliveryStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-705 focus:outline-none bg-white"
              >
                <option value="Pending">Pending Dispatch</option>
                <option value="In Transit">In Transit with Courier</option>
                <option value="Delivered">Delivered to Location</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Update Logistics
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
