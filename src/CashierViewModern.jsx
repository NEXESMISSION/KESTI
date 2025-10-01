import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { formatCurrency } from './utils';
import './CashierViewNew.css';

// --- Helper Components ---

const Icon = ({ name, className = 'w-6 h-6' }) => {
  // Simple icon placeholder - you can replace with lucide-react or heroicons
  const icons = {
    'search': '🔍',
    'shopping-cart': '🛒',
    'x': '❌',
    'minus': '➖',
    'plus': '➕',
    'log-out': '🚪',
    'lock': '🔒',
  };
  return <span className={className}>{icons[name] || '📦'}</span>;
};

const Toast = ({ message, type, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(onRemove, 3000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  return (
    <div className={`toast text-white px-6 py-3 rounded-full shadow-lg ${bgColor}`}>
      {message}
    </div>
  );
};

// --- Main CashierView Component ---

const CashierViewModern = ({ onUnlock, onLogout }) => {
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const { data: profile } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', user.id)
        .single();
      if (!profile || !profile.business_id) throw new Error("Business not found for user");
      
      const { data: businessData, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single();
      if (businessError) throw businessError;
      setBusiness(businessData);

      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('business_id', profile.business_id);
      if (productsError) throw productsError;

      const productsWithCategoryNames = productsData.map(p => ({
          ...p,
          categoryName: p.categories?.name || 'Uncategorized'
      }));
      setProducts(productsWithCategoryNames);

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load store data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Business Logic ---
  const handleAddToCart = (product, weight = 1) => {
      if (product.stock_quantity <= 0) {
          showToast('Product is out of stock', 'error');
          return;
      }
      
      const itemPrice = product.price_type === 'per_weight' ? product.selling_price * weight : product.selling_price;
      const existingItem = cartItems.find(item => item.id === product.id && product.price_type === 'fixed');

      if (existingItem) {
          setCartItems(cartItems.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          ));
      } else {
          const newItem = {
              id: product.id,
              cart_id: product.price_type === 'per_weight' ? `${product.id}-${Date.now()}` : product.id,
              name: product.name,
              price: itemPrice,
              quantity: 1,
              image_url: product.image_url,
              weight: product.price_type === 'per_weight' ? weight : undefined,
              original_price: product.selling_price,
              buying_price: product.buying_price,
              price_type: product.price_type,
              unit: product.unit
          };
          setCartItems([...cartItems, newItem]);
      }
      showToast(`${product.name} added to cart`);
  };

  const handleUpdateQuantity = (cart_id, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.cart_id !== cart_id));
    } else {
      setCartItems(cartItems.map(item =>
        item.cart_id === cart_id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const handleConfirmSale = async () => {
    const total_amount = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Step 1: Create Sale Record
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({ total_amount })
      .select()
      .single();

    if (saleError) {
      console.error('Error creating sale:', saleError);
      showToast('Failed to complete sale', 'error');
      return;
    }

    // Step 2: Create Sale Items
    const saleItemsToInsert = cartItems.map(item => ({
      sale_id: saleData.id,
      product_id: item.id,
      quantity: item.price_type === 'per_weight' ? item.weight : item.quantity,
      price_at_sale: item.original_price,
      buying_price_at_sale: item.buying_price,
    }));

    const { error: itemsError } = await supabase.from('sale_items').insert(saleItemsToInsert);
    if (itemsError) {
      console.error('Error creating sale items:', itemsError);
      showToast('Error recording sale items', 'error');
      return;
    }
    
    // Step 3: Decrement Stock
    for (const item of cartItems) {
      const qtyToDecrement = item.price_type === 'per_weight' ? item.weight : item.quantity;
      const { error } = await supabase
        .from('products')
        .update({ stock_quantity: supabase.raw(`stock_quantity - ${qtyToDecrement}`) })
        .eq('id', item.id);
      if (error) console.error('Stock update error:', error);
    }

    setCartItems([]);
    setIsCartOpen(false);
    showToast(`Sale completed! Total: ${formatCurrency(total_amount, business?.currency)}`);
    fetchData(); // Refresh products to show updated stock
  };

  // --- Rendering ---
  const renderProductGrid = () => {
    const filteredProducts = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const productsByCategory = filteredProducts.reduce((acc, product) => {
      const category = product.categoryName || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    return (
      <div className="p-4 space-y-6">
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([category, prods]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">{category}</h2>
              <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
                {prods.map(p => {
                  const isOutOfStock = p.stock_quantity <= 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => !isOutOfStock && (p.price_type === 'per_weight' ? (setSelectedProductForWeight(p), setShowWeightDialog(true)) : handleAddToCart(p))}
                      className={`product-card flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <div className="relative">
                        <img src={p.image_url || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-32 object-cover rounded-t-lg" />
                        {isOutOfStock && <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Out of Stock</span>}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{p.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{formatCurrency(p.selling_price, business?.currency)}{p.price_type === 'per_weight' ? `/${p.unit}` : ''}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">Stock: {p.stock_quantity}</span>
                            {p.price_type === 'per_weight' && <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">By {p.unit}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  const renderCart = () => {
      const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

      if (!isCartOpen) {
          return (
              <button onClick={() => setIsCartOpen(true)} className="fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110">
                  <Icon name="shopping-cart" className="text-2xl" />
                  {itemCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">{itemCount}</span>}
              </button>
          );
      }

      return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={() => setIsCartOpen(false)}>
              <div className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl flex flex-col" onClick={e => e.stopPropagation()}>
                  <div className="p-4 border-b flex items-center justify-between bg-white">
                      <h2 className="text-lg font-semibold">Cart ({itemCount} items)</h2>
                      <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-gray-100 rounded-md"><Icon name="x" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {cartItems.length === 0 ? (
                           <div className="text-center text-gray-500 mt-8 flex flex-col items-center">
                              <Icon name="shopping-cart" className="text-4xl mb-3 text-gray-300" />
                              <p>Your cart is empty</p>
                          </div>
                      ) : cartItems.map(item => (
                          <div key={item.cart_id} className="bg-white p-3 rounded-lg border">
                               <div className="flex items-center gap-3">
                                  <img src={item.image_url || 'https://via.placeholder.com/150'} alt={item.name} className="w-12 h-12 object-cover rounded" />
                                  <div className="flex-1">
                                      <h3 className="font-medium text-sm">{item.name} {item.weight ? `(${item.weight}${item.unit})` : ''}</h3>
                                      <p className="text-xs text-gray-500">{formatCurrency(item.original_price, business?.currency)} {item.price_type === 'per_weight' ? `/${item.unit}` : ''}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleUpdateQuantity(item.cart_id, item.quantity - 1)} className="w-7 h-7 border rounded-md hover:bg-gray-100 flex items-center justify-center"><Icon name="minus" className="text-xs" /></button>
                                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                                      <button onClick={() => handleUpdateQuantity(item.cart_id, item.quantity + 1)} className="w-7 h-7 border rounded-md hover:bg-gray-100 flex items-center justify-center"><Icon name="plus" className="text-xs" /></button>
                                  </div>
                                  <p className="font-semibold w-24 text-right">{formatCurrency(item.price * item.quantity, business?.currency)}</p>
                                  <button onClick={() => handleUpdateQuantity(item.cart_id, 0)} className="text-red-500 hover:text-red-700"><Icon name="x" /></button>
                              </div>
                          </div>
                      ))}
                  </div>
                  {cartItems.length > 0 && (
                      <div className="p-4 border-t bg-white space-y-3">
                          <div className="flex justify-between items-center text-lg font-semibold">
                              <span>Total:</span>
                              <span className="text-xl font-bold text-blue-600">{formatCurrency(total, business?.currency)}</span>
                          </div>
                          <button onClick={handleConfirmSale} className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Confirm Sale</button>
                      </div>
                  )}
              </div>
          </div>
      );
  };
  
  const renderWeightDialog = () => {
    if (!showWeightDialog || !selectedProductForWeight) return null;
    
    const product = selectedProductForWeight;
    
    const handleSubmit = (e) => {
        e.preventDefault();
        const weight = parseFloat(e.target.elements.weight.value);
        if (weight > 0 && weight <= product.stock_quantity) {
            handleAddToCart(product, weight);
            setShowWeightDialog(false);
        } else {
            showToast('Invalid weight or not enough stock.', 'error');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
                <form onSubmit={handleSubmit}>
                    <h2 className="text-lg font-semibold">Select Weight - {product.name}</h2>
                     <div className="text-center mt-4">
                        <img src={product.image_url || 'https://via.placeholder.com/150'} alt={product.name} className="w-24 h-24 object-cover rounded-lg mx-auto mb-2" />
                        <p className="text-sm text-gray-600">{formatCurrency(product.selling_price, business?.currency)} per {product.unit}</p>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="weight" className="text-sm font-medium">Weight ({product.unit})</label>
                        <input name="weight" type="number" step="0.01" min="0.01" max={product.stock_quantity} defaultValue="1" className="w-full mt-1 p-2 border rounded-md" required />
                        <p className="text-xs text-gray-500 mt-1">Available stock: {product.stock_quantity} {product.unit}</p>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button type="button" onClick={() => setShowWeightDialog(false)} className="flex-1 py-2 border rounded-md hover:bg-gray-100">Cancel</button>
                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add to Cart</button>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-lg">Loading Cashier...</div>;
  }
  
  return (
    <div className="relative bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-gray-800">{business?.name || 'Cashier'}</h1>
                <div className="flex items-center gap-2">
                    <button onClick={onLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-md">
                        <Icon name="log-out" />
                    </button>
                    <button onClick={onUnlock} className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-50">
                        <Icon name="lock" />
                        Admin
                    </button>
                </div>
            </div>
        </header>

        <main>
          {renderProductGrid()}
        </main>
        
        {renderCart()}
        {renderWeightDialog()}

        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] space-y-2">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onRemove={() => removeToast(toast.id)} />
            ))}
        </div>
    </div>
  );
};

export default CashierViewModern;
