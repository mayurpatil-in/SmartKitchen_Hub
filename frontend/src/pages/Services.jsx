import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import DataTable from '../components/DataTables';
import Modal from '../components/Modal';
import { 
  Wrench, ShieldAlert, CheckCircle, Clock, 
  Calendar, Plus, Clipboard, UserCircle 
} from 'lucide-react';

const Services = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const isCustomer = user?.role === 'Customer';
  const isTechnician = user?.role === 'Technician';
  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [tickets, setTickets] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');

  // Modal controls
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isResolveOpen, setIsResolveOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('Repair');
  const [customerId, setCustomerId] = useState('');
  const [productId, setProductId] = useState('');

  // Assign form states
  const [techId, setTechId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');

  // Resolve form states
  const [resStatus, setResStatus] = useState('Completed');
  const [resNotes, setResNotes] = useState('');

  const fetchDependencies = async () => {
    try {
      if (canEdit) {
        // Fetch CRM list
        const custRes = await API.get('/api/customers');
        if (custRes.success) setCustomers(custRes.data.items);
        
        // Fetch baseline products catalog
        const prodRes = await API.get('/api/products', { params: { per_page: 100 } });
        if (prodRes.success) setProducts(prodRes.data.items);

        // Fetch Technicians list (In this mockup, we look up tech@smartkitchen.com user ID 3 or mock it)
        // Hardcode a basic selection for seeder tech profile
        setTechnicians([
          { id: 3, first_name: "Robert", last_name: "Miller" }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTickets = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/services', {
        params: {
          status: statusFilter || undefined,
          page,
          per_page: 10
        }
      });
      if (res.success) {
        setTickets(res.data.items);
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
    fetchTickets();
  }, [page, statusFilter]);

  const handleOpenCreate = () => {
    setTitle('');
    setDescription('');
    setServiceType('Repair');
    setCustomerId(customers[0]?.id || '');
    setProductId(products[0]?.id || '');
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!title || !description || !serviceType) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }

    const payload = {
      title,
      description,
      service_type: serviceType,
      customer_id: isCustomer ? null : parseInt(customerId), // customer linked automatically in backend if Customer role
      product_id: productId ? parseInt(productId) : null
    };

    try {
      const res = await API.post('/api/services', payload);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Servicing ticket successfully logged.' }));
        setIsCreateOpen(false);
        fetchTickets();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleOpenAssign = (ticket) => {
    setSelectedTicket(ticket);
    setTechId(technicians[0]?.id || '3'); // default Robert ID
    // Default schedule: tomorrow afternoon
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    tmr.setHours(14, 0, 0, 0);
    setScheduleDate(tmr.toISOString().slice(0, 16));
    setIsAssignOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(`/api/services/${selectedTicket.id}/assign`, {
        technician_id: parseInt(techId),
        scheduled_date: `${scheduleDate}:00`
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Technician assigned successfully.' }));
        setIsAssignOpen(false);
        fetchTickets();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
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
      const res = await API.put(`/api/services/${selectedTicket.id}/resolution`, {
        status: resStatus,
        resolution_notes: resNotes
      });
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Service call updated successfully.' }));
        setIsResolveOpen(false);
        fetchTickets();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      Pending: 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse',
      Assigned: 'bg-indigo-50 text-indigo-750 border-indigo-150',
      'In Progress': 'bg-blue-50 text-blue-700 border-blue-200',
      Completed: 'bg-emerald-50 text-emerald-700 border-emerald-250',
      Cancelled: 'bg-slate-100 text-slate-500 border-slate-200'
    };
    return configs[status] || 'bg-slate-100 text-slate-700';
  };

  const headers = [
    { 
      label: "Servicing Ticket Summary", 
      key: "title",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.title}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider">
            Call Type: {item.service_type}
          </p>
        </div>
      )
    },
    { 
      label: "Customer Client", 
      key: "customer_name",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-bold text-slate-800 text-xs leading-none">{item.customer_name}</p>
          <p className="text-[9px] text-slate-400 font-bold leading-normal mt-0.5 max-w-[150px] truncate" title={item.product_name}>
            Item: {item.product_name || 'N/A'}
          </p>
        </div>
      )
    },
    { 
      label: "Scheduled Dispatch", 
      key: "scheduled_date",
      render: (item) => (
        <div className="flex items-center gap-1 text-[10px] text-slate-655 font-bold">
          <Calendar className="w-3.5 h-3.5 text-slate-450" />
          <span>{item.scheduled_date ? new Date(item.scheduled_date).toLocaleString() : 'Not Scheduled'}</span>
        </div>
      )
    },
    { 
      label: "Technician assigned", 
      key: "technician_name",
      render: (item) => (
        <div className="flex items-center gap-1 text-[10px] text-slate-655 font-bold">
          <UserCircle className="w-3.5 h-3.5 text-slate-450" />
          <span>{item.technician_name || 'Unassigned'}</span>
        </div>
      )
    },
    { 
      label: "Ticket Status", 
      key: "status",
      align: "center",
      render: (item) => (
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border select-none tracking-wider ${getStatusBadge(item.status)}`}>
          {item.status}
        </span>
      )
    },
    { 
      label: "Operations", 
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          {/* Admin schedule/technician mapping action */}
          {canEdit && item.status === 'Pending' && (
            <button
              onClick={() => handleOpenAssign(item)}
              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition-all scale-100 active:scale-95 flex items-center gap-0.5"
            >
              <Calendar className="w-3.5 h-3.5" /> Assign Tech
            </button>
          )}

          {/* Technician resolution closure actions */}
          {(isTechnician || canEdit) && (item.status === 'Assigned' || item.status === 'In Progress') && (
            <button
              onClick={() => handleOpenResolve(item)}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition-all scale-100 active:scale-95 flex items-center gap-0.5 shadow-sm"
            >
              <Wrench className="w-3.5 h-3.5" /> Resolve Ticket
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Service & Maintenance</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Manage annual maintenance contracts (AMC), warranties, and technician dispatches</p>
        </div>

        {/* Customers can log tickets directly */}
        {(isCustomer || canEdit) && (
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-655 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 transition-all scale-100 active:scale-95 shadow-md shadow-emerald-950/10 hover-scale"
          >
            <Plus className="w-4 h-4" /> Open Repair Ticket
          </button>
        )}
      </div>

      {/* Grid Table list */}
      <DataTable
        headers={headers}
        items={tickets}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pages={pages}
        onPageChange={setPage}
        searchQuery={statusFilter}
        onSearchChange={setStatusFilter}
        searchPlaceholder="Filter ticketing by status (Pending, Assigned, In Progress, Completed)..."
      />

      {/* MODAL: SUBMIT REPAIR TICKET */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Open Maintenance & Repair Ticket"
        size="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {!isCustomer && (
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Select B2B Client *</label>
                <select
                  required
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-707 focus:outline-none bg-white"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>{c.company_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Assigned Equipment (Product)</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-707 focus:outline-none bg-white"
              >
                <option value="">None / General Inquiry</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Servicing Type *</label>
              <select
                required
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-707 focus:outline-none bg-white"
              >
                <option value="Repair">Emergency Breakdown / Repair</option>
                <option value="Maintenance">Annual Maintenance Contract (AMC)</option>
                <option value="Warranty">Warranty Servicing</option>
                <option value="General">General Technical Help</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Ticket Summary Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Upright Refrigerator compressor not kicking in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Problem Description / Telemetry *</label>
            <textarea
              required
              placeholder="Describe temperature read anomalies, heating indicators, physical leaks, or installation requirements..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 hover-scale"
            >
              Log Servicing Call
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: ASSIGN TECHNICIAN SCHEDULE */}
      {selectedTicket && (
        <Modal
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
          title={`Schedule tech dispatch: ${selectedTicket.title}`}
          size="sm"
        >
          <form onSubmit={handleAssignSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Select Technician Operator *</label>
              <select
                required
                value={techId}
                onChange={(e) => setTechId(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-707 focus:outline-none bg-white"
              >
                {technicians.map((t) => (
                  <option key={t.id} value={t.id}>{t.first_name} {t.last_name} (Senior Tech)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Dispatch Datetime *</label>
              <input
                type="datetime-local"
                required
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsAssignOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Schedule Dispatch
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: RESOLVE SERVICE CALL */}
      {selectedTicket && (
        <Modal
          isOpen={isResolveOpen}
          onClose={() => setIsResolveOpen(false)}
          title={`Log maintenance closure: ${selectedTicket.title}`}
          size="sm"
        >
          <form onSubmit={handleResolveSubmit} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Servicing Resolution Status</label>
              <select
                required
                value={resStatus}
                onChange={(e) => setResStatus(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-707 focus:outline-none bg-white"
              >
                <option value="In Progress">Move to: In Progress</option>
                <option value="Completed">Completed & Calibrated Successfully</option>
                <option value="Cancelled">Cancelled / Voided</option>
              </select>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Technical Resolution Summary *</label>
              <textarea
                required
                placeholder="Log dimensions changes, burner nozzle pressure calibration results, parts replaced (e.g. door gaskets)..."
                rows={4}
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setIsResolveOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-655 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                Finalize Closure
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default Services;
