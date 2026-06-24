import { useState, useEffect } from 'react';
import {
  Plus, Pencil, Trash2, DollarSign, TrendingUp,
  Package, Clock, ChevronRight, Loader, Check, X,
  Star, Image as ImageIcon
} from 'lucide-react';
import api from '../api';

const TABS = ['Dashboard', 'Menu', 'Orders'];
const ORDER_STEPS = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Picked Up'];
const CATEGORIES = ['Starters', 'Main Course', 'Breads', 'Desserts', 'Beverages', 'Snacks'];
const ALL_TAGS = ['vegetarian', 'non-vegetarian', 'spicy', 'mild', 'vegan', 'gluten-free', 'dairy-free'];
const STATUS_COLORS = {
  Placed: 'bg-blue-50 text-blue-700 border-blue-200',
  Confirmed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Preparing: 'bg-orange-50 text-orange-700 border-orange-200',
  Ready: 'bg-green-50 text-green-700 border-green-200',
  'Picked Up': 'bg-gray-50 text-gray-500 border-gray-200',
};

export default function AdminPage() {
  const [tab, setTab] = useState('Dashboard');

  // Dashboard state
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Menu state
  const [menuItems, setMenuItems] = useState([]);
  const [loadingMenuItems, setLoadingMenuItems] = useState(false);
  const [addingItem, setAddingItem] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Main Course',
    price: '',
    dietary_tags: [],
    image_url: '',
    use_ai: true,
  });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Fetch data when tab changes
  useEffect(() => {
    if (tab === 'Dashboard') fetchDashboard();
    if (tab === 'Menu') fetchMenu();
    if (tab === 'Orders') fetchOrders();
  }, [tab]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await api.get('/admin/dashboard');
      setDashboard(res.data);
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  };

  const fetchMenu = async () => {
    setLoadingMenuItems(true);
    try {
      const res = await api.get('/admin/menu');
      // Sort: available items first, then unavailable
      const sorted = res.data.sort((a, b) => {
        if (a.is_available === b.is_available) return 0;
        return a.is_available ? -1 : 1;
      });
      setMenuItems(sorted);
    } catch (err) {
      console.error('Failed to fetch menu:', err);
    } finally {
      setLoadingMenuItems(false);
    }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Add menu item
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;
    setAddingItem(true);
    try {
      const payload = {
        name: formData.name,
        price: parseFloat(formData.price),
      };
      if (!formData.use_ai) {
        payload.description = formData.description;
        payload.category = formData.category;
        payload.dietary_tags = formData.dietary_tags;
        if (formData.image_url) payload.image_url = formData.image_url;
      } else {
        if (formData.image_url) payload.image_url = formData.image_url;
      }
      await api.post('/admin/menu', payload);
      setFormData({ name: '', description: '', category: 'Main Course', price: '', dietary_tags: [], image_url: '', use_ai: true });
      setShowModal(false);
      fetchMenu();
    } catch (err) {
      console.error('Failed to add item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag],
    }));
  };

  const resetModal = () => {
    setFormData({ name: '', description: '', category: 'Main Course', price: '', dietary_tags: [], image_url: '', use_ai: true });
    setEditingItem(null);
    setShowModal(false);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      category: item.category || 'Main Course',
      price: String(item.price),
      dietary_tags: item.dietary_tags || [],
      image_url: item.image_url || '',
      use_ai: false,
    });
    setShowModal(true);
  };

  const handleEditItem = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price) return;
    setAddingItem(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        dietary_tags: formData.dietary_tags,
      };
      if (formData.image_url) payload.image_url = formData.image_url;
      await api.put(`/admin/menu/${editingItem.id}`, payload);
      resetModal();
      fetchMenu();
    } catch (err) {
      console.error('Failed to edit item:', err);
    } finally {
      setAddingItem(false);
    }
  };

  // Delete menu item
  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/admin/menu/${id}`);
      fetchMenu();
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  // Toggle availability
  const toggleAvailability = async (item) => {
    try {
      await api.put(`/admin/menu/${item.id}`, { is_available: !item.is_available });
      fetchMenu();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  // Advance order status
  const advanceStatus = async (order) => {
    const idx = ORDER_STEPS.indexOf(order.status);
    if (idx >= ORDER_STEPS.length - 1) return;
    const nextStatus = ORDER_STEPS[idx + 1];
    try {
      await api.patch(`/admin/orders/${order.id}/status`, { status: nextStatus });
      fetchOrders();
    } catch (err) {
      console.error('Failed to advance status:', err);
    }
  };

  // Cancel order
  const cancelOrder = async (order) => {
    if (!confirm(`Cancel order #${order.id.slice(-6)}?`)) return;
    try {
      await api.delete(`/admin/orders/${order.id}`);
      fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
    }
  };

  // Group orders by status
  const ordersByStatus = {};
  ORDER_STEPS.forEach(s => { ordersByStatus[s] = []; });
  orders.forEach(o => {
    if (ordersByStatus[o.status]) ordersByStatus[o.status].push(o);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your restaurant</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] mb-8 w-fit border border-gray-100">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer ${tab === t
                  ? 'bg-green-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Dashboard Tab */}
        {tab === 'Dashboard' && (
          <div>
            {loadingDashboard ? (
              <Spinner />
            ) : dashboard ? (
              <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <StatCard
                    icon={<DollarSign size={24} />}
                    label="Revenue Today"
                    value={`₹${dashboard.todays_revenue?.toFixed(2) || '0.00'}`}
                    color="green"
                  />
                  <StatCard
                    icon={<Package size={24} />}
                    label="Total Orders"
                    value={dashboard.orders_by_status
                      ? Object.values(dashboard.orders_by_status).reduce((a, b) => a + b, 0)
                      : 0}
                    color="blue"
                  />
                  <StatCard
                    icon={<TrendingUp size={24} />}
                    label="Active Orders"
                    value={dashboard.orders_by_status
                      ? (dashboard.orders_by_status['Placed'] || 0) +
                      (dashboard.orders_by_status['Confirmed'] || 0) +
                      (dashboard.orders_by_status['Preparing'] || 0)
                      : 0}
                    color="orange"
                  />
                </div>

                {/* Orders by Status */}
                {dashboard.orders_by_status && (
                  <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4">Orders by Status</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      {ORDER_STEPS.map(status => (
                        <div
                          key={status}
                          className={`rounded-xl px-4 py-3 text-center border ${STATUS_COLORS[status]}`}
                        >
                          <div className="text-2xl font-bold">{dashboard.orders_by_status[status] || 0}</div>
                          <div className="text-xs font-medium mt-1">{status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Items */}
                {dashboard.top_items && dashboard.top_items.length > 0 && (
                  <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 border border-gray-100">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="text-yellow-500" /> Top Popular Items
                    </h3>
                    <div className="space-y-3">
                      {dashboard.top_items.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-sm font-bold">
                              {i + 1}
                            </span>
                            <span className="font-medium text-gray-900">{item.name}</span>
                          </div>
                          <span className="text-sm text-gray-500">{item.total_qty} orders</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Failed to load dashboard data" />
            )}
          </div>
        )}

        {/* Menu Tab */}
        {tab === 'Menu' && (
          <div className="space-y-6">
            {/* Header + Add Button */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Menu Items</h2>
                <p className="text-sm text-gray-500 mt-0.5">{menuItems.length} item{menuItems.length !== 1 ? 's' : ''} total</p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
              >
                <Plus size={18} /> Add New Item
              </button>
            </div>

            {/* Menu Items Grid */}
            {loadingMenuItems ? (
              <Spinner />
            ) : menuItems.length === 0 ? (
              <EmptyState message="No menu items yet. Add your first item above!" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {menuItems.map(item => (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 border-2 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(0,0,0,0.15)] ${item.is_available ? 'border-transparent' : 'border-red-100 opacity-60'
                      }`}
                  >
                    {/* Image */}
                    <div className="h-40 w-full bg-gray-100 overflow-hidden rounded-lg mb-3">
                      <img
                        src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'; }}
                      />
                    </div>

                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm truncate">{item.name}</h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                      </div>
                      <span className="text-base font-bold text-green-700 ml-3">₹{item.price}</span>
                    </div>

                    {/* Category */}
                    {item.category && (
                      <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mb-2">
                        {item.category}
                      </span>
                    )}

                    {/* Tags */}
                    {item.dietary_tags && item.dietary_tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.dietary_tags.map(tag => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      {/* Availability Toggle */}
                      <div className="flex items-center gap-2.5">
                        <button
                          onClick={() => toggleAvailability(item)}
                          className={`relative w-9 h-5 rounded-full transition-colors duration-200 cursor-pointer ${item.is_available ? 'bg-green-500' : 'bg-gray-300'
                            }`}
                        >
                          <div
                            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${item.is_available ? 'translate-x-4' : ''
                              }`}
                          />
                        </button>
                        <span className={`text-xs font-medium ${item.is_available ? 'text-green-700' : 'text-gray-400'}`}>
                          {item.is_available ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all duration-200 cursor-pointer"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deleteItem(item.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {tab === 'Orders' && (
          <div>
            {loadingOrders ? (
              <Spinner />
            ) : orders.length === 0 ? (
              <EmptyState message="No orders yet" />
            ) : (
              <div className="space-y-8">
                {ORDER_STEPS.map(status => {
                  const statusOrders = ordersByStatus[status] || [];
                  if (statusOrders.length === 0) return null;
                  return (
                    <div key={status}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg border ${STATUS_COLORS[status]}`}>
                          {status}
                        </span>
                        <span className="text-sm text-gray-400">
                          {statusOrders.length} order{statusOrders.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {statusOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-5 border border-gray-100 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(0,0,0,0.15)]"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-gray-900 text-sm">
                                Order #{order.id.slice(-6)}
                              </span>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock size={10} />
                                {order.created_at
                                  ? new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : '\u2014'}
                              </span>
                            </div>

                            <div className="space-y-1.5 mb-3">
                              {order.items && order.items.map((item, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {item.quantity}x {item.name || `Item`}
                                  </span>
                                  <span className="text-gray-500 text-xs">
                                    {item.price ? `\u20B9${(item.price * item.quantity).toFixed(2)}` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                              <span className="font-bold text-gray-900">
                                {'\u20B9'}{order.total_price?.toFixed(2) || '\u2014'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => cancelOrder(order)}
                                  className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 flex items-center gap-1 cursor-pointer border border-red-100"
                                >
                                  <X size={12} /> Cancel
                                </button>
                                {status !== 'Picked Up' && (
                                  <button
                                    onClick={() => advanceStatus(order)}
                                    className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    {ORDER_STEPS[ORDER_STEPS.indexOf(status) + 1]}
                                    <ChevronRight size={12} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Add Item Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetModal} />
            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  {editingItem ? <><Pencil className="text-blue-600" size={20} /> Edit Menu Item</> : <><Plus className="text-green-600" size={20} /> Add New Menu Item</>}
                </h3>
                <button onClick={resetModal} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <form onSubmit={editingItem ? handleEditItem : handleAddItem} className="p-6 space-y-5">
                {/* AI Toggle - only for new items */}
                {!editingItem && (
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">Let AI generate details</p>
                      <p className="text-xs text-gray-500">Description, category & tags auto-filled</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, use_ai: !prev.use_ai }))}
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 cursor-pointer ${formData.use_ai ? 'bg-green-500' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${formData.use_ai ? 'translate-x-5' : ''}`} />
                    </button>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Item Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Paneer Butter Masala"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                    required
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">Rs.</span>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Manual fields — shown when AI is off OR when editing */}
                {(!formData.use_ai || editingItem) && (
                  <>
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Describe the dish..."
                        rows={3}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                        required={!formData.use_ai}
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all bg-white"
                        required={!formData.use_ai}
                      >
                        {CATEGORIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>

                    {/* Dietary Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Dietary Tags</label>
                      <div className="flex flex-wrap gap-2">
                        {ALL_TAGS.map(tag => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 cursor-pointer ${formData.dietary_tags.includes(tag)
                                ? 'bg-green-600 text-white border-green-600'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-green-300'
                              }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Image URL — always shown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
                  <div className="relative">
                    <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="url"
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      placeholder="https://example.com/image.jpg"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 transition-all"
                    />
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 h-32 bg-gray-50">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button type="button" onClick={resetModal} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all cursor-pointer">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem || !formData.name.trim() || !formData.price}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {addingItem ? (
                      <><Loader size={16} className="animate-spin" /> {editingItem ? 'Saving...' : (formData.use_ai ? 'AI Generating...' : 'Adding...')}</>
                    ) : (
                      <>{editingItem ? <><Check size={16} /> Save Changes</> : <><Plus size={16} /> Add Item</>}</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Helper Components (kept in same file for simplicity) --

function StatCard({ icon, label, value, color }) {
  const colorMap = {
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-6 border border-gray-100 transition-all duration-300 hover:shadow-[0_4px_25px_rgba(0,0,0,0.15)]">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center py-16 text-gray-400">
      <Package size={48} className="mx-auto mb-3 opacity-40" />
      <p className="text-base">{message}</p>
    </div>
  );
}
