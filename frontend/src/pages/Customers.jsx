import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addToast } from '../redux/slices/notificationSlice';
import API from '../api';
import DataTable from '../components/DataTables';
import Modal from '../components/Modal';
import { Plus, Edit, Trash2, Users, MapPin, Phone, User } from 'lucide-react';

const Customers = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  // Role permissions
  const canEdit = user?.role === 'Admin' || user?.role === 'Sales Manager';

  // API datasets
  const [customers, setCustomers] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal controls
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Form states
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [linkedUserId, setLinkedUserId] = useState('');
  const [usersList, setUsersList] = useState([]);

  const fetchUsers = async () => {
    try {
      // In B2B setups we can link customer profiles to login users
      const res = await API.get('/auth/me'); // Simple placeholder or we can link users manually
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const res = await API.get('/api/customers', {
        params: {
          search: search || undefined,
          page,
          per_page: 10
        }
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

  useEffect(() => {
    fetchCustomers();
  }, [page, search]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setCompanyName('');
    setContactPerson('');
    setPhone('');
    setAddress('');
    setLinkedUserId('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setCompanyName(cust.company_name);
    setContactPerson(cust.contact_person);
    setPhone(cust.phone);
    setAddress(cust.address);
    setLinkedUserId(cust.user_id || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !phone || !address) {
      dispatch(addToast({ type: 'warning', message: 'Please complete all required fields.' }));
      return;
    }

    const payload = {
      company_name: companyName,
      contact_person: contactPerson,
      phone,
      address,
      user_id: linkedUserId ? parseInt(linkedUserId) : null
    };

    try {
      if (selectedCustomer) {
        const res = await API.put(`/api/customers/${selectedCustomer.id}`, payload);
        if (res.success) {
          dispatch(addToast({ type: 'success', message: 'Customer profile updated successfully.' }));
        }
      } else {
        const res = await API.post('/api/customers', payload);
        if (res.success) {
          dispatch(addToast({ type: 'success', message: 'B2B customer profile created.' }));
        }
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer account profile? All quotations and orders for this customer will also be deleted.")) return;
    try {
      const res = await API.delete(`/api/customers/${id}`);
      if (res.success) {
        dispatch(addToast({ type: 'success', message: 'Customer account deleted.' }));
        fetchCustomers();
      }
    } catch (err) {
      dispatch(addToast({ type: 'error', message: err.message }));
    }
  };

  // Reusable Table Headers mapping
  const headers = [
    { 
      label: "B2B Company / Organization", 
      key: "company_name",
      render: (item) => (
        <div className="space-y-0.5">
          <p className="font-extrabold text-slate-800 text-xs">{item.company_name}</p>
          <p className="text-[9px] text-slate-450 font-bold uppercase tracking-wider flex items-center gap-0.5">
            ID: SK-CUST-{item.id}
          </p>
        </div>
      )
    },
    { 
      label: "Contact Person", 
      key: "contact_person",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-650">
          <User className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.contact_person}</span>
        </div>
      )
    },
    { 
      label: "Phone Contact", 
      key: "phone",
      render: (item) => (
        <div className="flex items-center gap-1.5 font-semibold text-slate-650">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{item.phone}</span>
        </div>
      )
    },
    { 
      label: "Postal Address", 
      key: "address",
      render: (item) => (
        <div className="flex items-start gap-1.5 font-semibold text-slate-500 max-w-xs truncate leading-normal" title={item.address}>
          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
          <span>{item.address}</span>
        </div>
      )
    },
    ...(canEdit ? [{
      label: "Action Controls",
      align: "right",
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-brand-600 rounded-lg transition-colors scale-100 active:scale-95"
            title="Edit details"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
          {user?.role === 'Admin' && (
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-655 hover:text-rose-600 rounded-lg transition-colors scale-100 active:scale-95"
              title="Delete account"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800">Customers CRM</h1>
          <p className="text-[11px] text-slate-550 font-semibold mt-0.5">Manage B2B commercial kitchen accounts and delivery indices</p>
        </div>

        {canEdit && (
          <button
            onClick={handleOpenCreate}
            className="bg-emerald-650 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-1.8 rounded-xl flex items-center gap-1.5 transition-all scale-100 active:scale-95 shadow-md shadow-emerald-950/10 hover-scale"
          >
            <Plus className="w-4 h-4" /> Add B2B Account
          </button>
        )}
      </div>

      {/* Tables rendering */}
      <DataTable
        headers={headers}
        items={customers}
        isLoading={isLoading}
        totalItems={totalItems}
        page={page}
        pages={pages}
        onPageChange={setPage}
        searchQuery={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search customer accounts by company name or phone..."
      />

      {/* MODAL: ADD / EDIT CUSTOMER */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedCustomer ? "Edit Customer CRM Details" : "Register New B2B Customer Account"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Royal Bistro Foods Ltd."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Contact Phone Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. +91 99988 77766"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Postal Delivery Address *</label>
            <textarea
              required
              placeholder="Enter comprehensive street address, warehouse gateways, or billing indices..."
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-1.8 text-xs text-slate-700 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-650 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/10 hover-scale"
            >
              {selectedCustomer ? "Save Profile" : "Register B2B Account"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Customers;
