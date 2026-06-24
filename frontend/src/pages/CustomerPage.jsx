import { useState, useEffect, useRef } from 'react';
import {
  Search, ShoppingCart, Plus, Minus, Trash2,
  X, Check, Clock, Package, ChevronRight, ClipboardList
} from 'lucide-react';
import api from '../api';

const ORDER_STEPS = ['Placed', 'Confirmed', 'Preparing', 'Ready', 'Picked Up'];
const STATUS_COLORS = {
  Placed: 'bg-blue-50 text-blue-700 border-blue-200',
  Confirmed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Preparing: 'bg-orange-50 text-orange-700 border-orange-200',
  Ready: 'bg-green-50 text-green-700 border-green-200',
  'Picked Up': 'bg-gray-100 text-gray-500 border-gray-200',
};

export default function CustomerPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [customerTab, setCustomerTab] = useState('menu');

  // Order tracking
  const [activeOrder, setActiveOrder] = useState(null);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const pollRef = useRef(null);

  // Fetch menu on mount
  useEffect(() => {
    api.get('/menu')
      .then(res => {
        const grouped = res.data;
        const flat = Object.values(grouped).flat();
        setMenu(flat);
      })
      .catch(err => console.error('Failed to fetch menu:', err))
      .finally(() => setLoadingMenu(false));

    // Also load any existing orders on mount
    fetchMyOrders();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  // Fetch all my orders from localStorage IDs
  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      // Gather IDs from both keys (backwards compat with old activeOrderId)
      const ids = new Set(JSON.parse(localStorage.getItem('myOrderIds') || '[]'));
      const oldActiveId = localStorage.getItem('activeOrderId');
      if (oldActiveId) ids.add(oldActiveId);
      localStorage.setItem('myOrderIds', JSON.stringify([...ids]));

      if (ids.size === 0) {
        setMyOrders([]);
        setLoadingOrders(false);
        return;
      }

      const orders = await Promise.all(
        [...ids].map(id => api.get(`/orders/${id}`).then(r => r.data).catch(() => null))
      );
      const valid = orders.filter(Boolean).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setMyOrders(valid);

      // Update active order from the list (latest non-picked-up order)
      const active = valid.find(o => o.status !== 'Picked Up');
      if (active) {
        setActiveOrder(active);
        localStorage.setItem('activeOrderId', active.id);
      } else {
        setActiveOrder(null);
        localStorage.removeItem('activeOrderId');
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Poll active order status
  useEffect(() => {
    if (activeOrder && activeOrder.status !== 'Picked Up') {
      const fetchOrder = () => {
        api.get(`/orders/${activeOrder.id}`)
          .then(res => {
            setActiveOrder(res.data);
            setMyOrders(prev => prev.map(o => o.id === res.data.id ? res.data : o));
          })
          .catch(err => {
            // Order may have been cancelled by admin
            console.error('Failed to poll order:', err);
            setActiveOrder(null);
            localStorage.removeItem('activeOrderId');
            fetchMyOrders();
          });
      };
      fetchOrder();
      pollRef.current = setInterval(fetchOrder, 5000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeOrder?.id, activeOrder?.status]);

  // Fetch orders when tab changes
  useEffect(() => {
    if (customerTab === 'orders') fetchMyOrders();
  }, [customerTab]);

  // Search
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await api.post('/search', { query: searchQuery });
      setSearchResults(res.data);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Cart operations
  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart(prev =>
      prev
        .map(c => c.id === id ? { ...c, qty: c.qty + delta } : c)
        .filter(c => c.qty > 0)
    );
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(c => c.id !== id));
  };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const getItemQty = (id) => {
    const item = cart.find(c => c.id === id);
    return item ? item.qty : 0;
  };

  // Place order
  const placeOrder = async () => {
    if (cart.length === 0) return;
    setPlacingOrder(true);
    try {
      const res = await api.post('/orders', {
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty }))
      });
      // Store order ID in localStorage
      const ids = JSON.parse(localStorage.getItem('myOrderIds') || '[]');
      ids.push(res.data.id);
      localStorage.setItem('myOrderIds', JSON.stringify(ids));
      localStorage.setItem('activeOrderId', res.data.id);

      setActiveOrder(res.data);
      setCart([]);
      setCartOpen(false);

      // Show success alert
      alert(`Order placed successfully! Order #${res.data.id.slice(-6)}`);

      // Refresh orders list
      fetchMyOrders();
    } catch (err) {
      console.error('Failed to place order:', err);
      alert('Failed to place order. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };

  // Group menu by category
  const grouped = {};
  const itemsToShow = searchResults !== null ? searchResults : menu;
  itemsToShow.forEach(item => {
    const cat = item.category || 'Other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(item);
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* AI Search Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="text-center text-3xl font-bold text-gray-900 mb-2">
            What are you craving?
          </h1>
          <p className="text-center text-gray-500 mb-6 text-sm">
            Search with AI try "something spicy" or "healthy lunch"
          </p>
          <form onSubmit={handleSearch} className="relative">
            <div className="flex items-center bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden transition-all duration-300 focus-within:shadow-[0_4px_30px_rgba(0,0,0,0.15)] focus-within:border-[#DCFCE7]">
              <Search className="ml-5 text-gray-400" size={22} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for dishes, cuisines, or ingredients..."
                className="flex-1 px-4 py-4 text-base text-gray-900 placeholder-gray-400 outline-none bg-transparent"
              />
              <button
                type="submit"
                disabled={searching}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 m-2 rounded-xl font-medium text-sm transition-all duration-300 disabled:opacity-50 cursor-pointer"
              >
                {searching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
          {searchResults !== null && (
            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
              </p>
              <button
                onClick={() => { setSearchResults(null); setSearchQuery(''); }}
                className="text-sm text-green-600 hover:text-green-700 font-medium cursor-pointer"
              >
                Clear search
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex gap-1 bg-white rounded-xl p-1.5 shadow-[0_2px_10px_rgba(0,0,0,0.06)] w-fit border border-gray-100">
          <button
            onClick={() => setCustomerTab('menu')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-2 ${
              customerTab === 'menu'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Search size={16} /> Menu
          </button>
          <button
            onClick={() => setCustomerTab('orders')}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer flex items-center gap-2 relative ${
              customerTab === 'orders'
                ? 'bg-green-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <ClipboardList size={16} /> My Orders
          </button>
        </div>
      </div>

      {/* Menu Tab */}
      {customerTab === 'menu' && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loadingMenu ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(grouped).length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No items found</p>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-10">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-green-500 rounded-full" />
                {category}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map(item => {
                  const qty = getItemQty(item.id);
                  const inCart = qty > 0;
                  return (
                    <div
                      key={item.id}
                      className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] flex flex-col overflow-hidden transition-all duration-300 hover:shadow-[0_4px_25px_rgba(0,0,0,0.12)] hover:-translate-y-1 border-2 ${
                        inCart ? 'border-green-300' : 'border-transparent'
                      }`}
                    >
                      {/* Image header with dietary icon overlays */}
                      <div className="h-48 w-full bg-gray-100 overflow-hidden relative">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80'}
                          alt={item.name} 
                          className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                        />
                        {item.dietary_tags?.includes('vegetarian') && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm flex items-center">
                           <div className="w-3 h-3 border border-green-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div></div>
                          </div>
                        )}
                        {item.dietary_tags?.includes('non-vegetarian') && (
                          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded shadow-sm flex items-center">
                           <div className="w-3 h-3 border border-red-600 flex items-center justify-center"><div className="w-1.5 h-1.5 bg-red-600 rounded-full"></div></div>
                          </div>
                        )}
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-gray-900 text-lg leading-tight">{item.name}</h3>
                            <p className="text-sm text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                          </div>
                          <span className="text-lg font-bold text-green-700 ml-3 whitespace-nowrap bg-green-50 px-2.5 py-1 rounded-lg">
                            ₹{item.price}
                          </span>
                        </div>

                        {/* Tags */}
                        {item.dietary_tags && item.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-4">
                            {item.dietary_tags.map(tag => (
                              <span
                                key={tag}
                                className="text-xs px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 font-medium border border-gray-100"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="mt-auto pt-2"></div>
                        {/* Add / Qty controls */}
                        {!inCart ? (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
                          >
                            <Plus size={16} /> Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2 border border-green-200 shadow-inner">
                            <button
                              onClick={() => updateQty(item.id, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-green-700 hover:bg-green-100 transition-all duration-200 shadow-sm cursor-pointer border border-green-100"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-bold text-green-800 text-sm">{qty} in cart</span>
                            <button
                              onClick={() => updateQty(item.id, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-green-700 hover:bg-green-100 transition-all duration-200 shadow-sm cursor-pointer border border-green-100"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>      )}

      {/* My Orders Tab */}
      {customerTab === 'orders' && (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {loadingOrders ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : myOrders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <ClipboardList size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No orders yet</p>
            <p className="text-sm mt-2">Place your first order from the Menu tab!</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Your Orders</h2>
            {myOrders.map(order => {
              const currentIdx = ORDER_STEPS.indexOf(order.status);
              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.06)] p-5 border transition-all duration-300 ${
                    order.status === 'Picked Up' ? 'border-gray-100 opacity-70' : 'border-green-100 shadow-[0_4px_20px_rgba(34,197,94,0.1)]'
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Package size={18} className="text-green-600" />
                      <span className="font-bold text-gray-900">Order #{order.id.slice(-6)}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Status Progress */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    {ORDER_STEPS.map((step, i) => {
                      const done = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium transition-all duration-300 ${
                                done ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-400'
                              } ${isCurrent ? 'ring-3 ring-green-100' : ''}`}
                            >
                              {done ? <Check size={12} /> : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1 font-medium hidden sm:block ${done ? 'text-green-700' : 'text-gray-400'}`}>
                              {step}
                            </span>
                          </div>
                          {i < ORDER_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-1.5 ${i < currentIdx ? 'bg-green-500' : 'bg-gray-100'}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Items */}
                  <div className="space-y-1 mb-3">
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

                  {/* Total + Time */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">
                      {'\u20B9'}{order.total_price?.toFixed(2) || '\u2014'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {order.created_at
                        ? new Date(order.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}
      {/* Floating Cart Button */}
      {cartCount > 0 && !cartOpen && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-2xl px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.2)] flex items-center gap-3 transition-all duration-300 hover:scale-105 z-40 cursor-pointer"
        >
          <ShoppingCart size={22} />
          <span className="font-semibold">{cartCount} item{cartCount !== 1 ? 's' : ''}</span>
          <span className="text-green-200">|</span>
          <span className="font-bold">₹{cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Cart Slide-out Panel */}
      {cartOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40 transition-opacity duration-300"
            onClick={() => setCartOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="text-green-600" />
                Your Cart
                <span className="text-sm font-normal text-gray-400">({cartCount} items)</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 transition-all duration-200 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    className="bg-gray-50 rounded-xl p-4 flex items-center gap-4 border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 text-sm truncate">{item.name}</h4>
                      <p className="text-sm text-green-700 font-semibold mt-0.5">
                        ₹{(item.price * item.qty).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all duration-200 cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-all duration-200 cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-gray-100 px-6 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">Total</span>
                  <span className="text-xl font-bold text-gray-900">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={placingOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white rounded-xl px-4 py-3.5 font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {placingOrder ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Placing Order...
                    </>
                  ) : (
                    <>
                      Place Order <ChevronRight size={16} />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* Slide-in animation style */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
