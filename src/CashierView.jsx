import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import { formatCurrency } from './utils';
import { Search, ShoppingCart, Lock, X, Plus, Minus, History } from 'lucide-react';
import './CashierView.css';

const CashierView = ({ onUnlock, onLogout }) => {
  // State Management
  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWeightDialog, setShowWeightDialog] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [selectedProductForWeight, setSelectedProductForWeight] = useState(null);
  const [weightInput, setWeightInput] = useState(1);
  const [toasts, setToasts] = useState([]);

  // Toast Function
  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 3000);
  }, []);

  // Fetch Data
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
      
      if (!profile?.business_id) throw new Error("Business not found");
      
      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile.business_id)
        .single();
      
      setBusiness(businessData);

      const { data: productsData } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('business_id', profile.business_id);
      
      const productsWithCategory = (productsData || []).map(p => ({
        ...p,
        categoryName: p.categories?.name || 'Uncategorized'
      }));
      
      setProducts(productsWithCategory);

      // Fetch recent sales
      const { data: salesData } = await supabase
        .from('sales')
        .select('*, sale_items(*, products(name))')
        .eq('business_id', profile.business_id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      setSalesHistory(salesData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load store data', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Cart Functions
  const addToCart = (product, weight = 1) => {
    if (product.stock_quantity <= 0) {
      showToast('Product is out of stock', 'error');
      return;
    }
    
    const itemPrice = product.price_type === 'per_weight' 
      ? product.selling_price * weight 
      : product.selling_price;
    
    const existingItem = cartItems.find(item => 
      item.id === product.id && product.price_type === 'fixed'
    );

    if (existingItem && product.price_type === 'fixed') {
      setCartItems(cartItems.map(item =>
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      ));
    } else {
      const newItem = {
        id: product.id,
        cart_id: product.price_type === 'per_weight' 
          ? `${product.id}-${Date.now()}` 
          : product.id,
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

  const updateCartQuantity = (cart_id, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(cartItems.filter(item => item.cart_id !== cart_id));
    } else {
      setCartItems(cartItems.map(item =>
        item.cart_id === cart_id ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const confirmSale = async () => {
    if (cartItems.length === 0) return;
    
    const total_amount = cartItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({ total_amount })
      .select()
      .single();

    if (saleError) {
      showToast('Failed to complete sale', 'error');
      return;
    }

    const saleItemsToInsert = cartItems.map(item => ({
      sale_id: saleData.id,
      product_id: item.id,
      quantity: item.price_type === 'per_weight' ? item.weight : item.quantity,
      price_at_sale: item.original_price,
      buying_price_at_sale: item.buying_price,
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsToInsert);
    
    if (itemsError) {
      showToast('Error recording sale items', 'error');
      return;
    }

    // Update stock
    for (const item of cartItems) {
      const qtyToDecrement = item.price_type === 'per_weight' 
        ? item.weight 
        : item.quantity;
      
      await supabase
        .from('products')
        .update({ 
          stock_quantity: supabase.raw(`stock_quantity - ${qtyToDecrement}`) 
        })
        .eq('id', item.id);
    }

    setCartItems([]);
    setIsCartOpen(false);
    showToast(`Sale completed! Total: ${formatCurrency(total_amount, business?.currency)}`);
    fetchData();
  };

  // Product Grid Render
  const renderProductGrid = () => {
    const filteredProducts = products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const productsByCategory = filteredProducts.reduce((acc, product) => {
      const category = product.categoryName;
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});

    return (
      <div className="p-4 space-y-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Products by Category */}
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([category, prods]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-gray-800">{category}</h2>
              <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-hide">
                {prods.map(p => {
                  const isOutOfStock = p.stock_quantity === 0;
                  return (
                    <div
                      key={p.id}
                      onClick={() => {
                        if (isOutOfStock) return;
                        if (p.price_type === 'per_weight') {
                          setSelectedProductForWeight(p);
                          setShowWeightDialog(true);
                          setWeightInput(1);
                        } else {
                          addToCart(p);
                        }
                      }}
                      className={`product-card flex-shrink-0 w-48 bg-white rounded-lg shadow-sm border transition-all duration-200 hover:shadow-md hover:-translate-y-1 ${
                        isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                      }`}
                    >
                      <div className="relative">
                        <img 
                          src={p.image_url || 'https://placehold.co/300x200'} 
                          alt={p.name} 
                          className="w-full h-32 object-cover rounded-t-lg" 
                        />
                        {isOutOfStock && (
                          <span className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{p.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">
                          {formatCurrency(p.selling_price, business?.currency)}
                          {p.price_type === 'per_weight' ? `/${p.unit}` : ''}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Stock: {p.stock_quantity}</span>
                          {p.price_type === 'per_weight' && (
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                              By {p.unit}
                            </span>
                          )}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-lg">
        Loading Cashier...
      </div>
    );
  }

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="relative bg-gray-50 min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSalesHistory(true)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <History className="w-5 h-5" />
            </button>
            <button
              onClick={onUnlock}
              className="flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm font-medium hover:bg-gray-50"
            >
              <Lock className="w-4 h-4" />
              Admin
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{renderProductGrid()}</main>

      {/* Floating Cart Button */}
      {!isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-4 right-4 w-16 h-16 rounded-full shadow-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 transition-transform hover:scale-110"
        >
          <ShoppingCart className="w-7 h-7" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {itemCount}
            </span>
          )}
        </button>
      )}

      {/* Cart Panel */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setIsCartOpen(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <h2 className="text-lg font-semibold">Cart ({itemCount} items)</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cartItems.length === 0 ? (
                <div className="text-center text-gray-500 mt-8 flex flex-col items-center">
                  <ShoppingCart className="w-12 h-12 mb-3 text-gray-300" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                cartItems.map(item => (
                  <div key={item.cart_id} className="bg-white p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <img 
                        src={item.image_url || 'https://placehold.co/150'} 
                        alt={item.name} 
                        className="w-12 h-12 object-cover rounded" 
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">
                          {item.name} {item.weight && `(${item.weight}${item.unit})`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(item.original_price, business?.currency)}
                          {item.price_type === 'per_weight' ? `/${item.unit}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.cart_id, item.quantity - 1)}
                          className="w-7 h-7 border rounded-md hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.cart_id, item.quantity + 1)}
                          className="w-7 h-7 border rounded-md hover:bg-gray-100 flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-semibold w-16 text-right">
                        {formatCurrency(item.price * item.quantity, business?.currency)}
                      </p>
                      <button
                        onClick={() => updateCartQuantity(item.cart_id, 0)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {cartItems.length > 0 && (
              <div className="p-4 border-t bg-white space-y-3">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(total, business?.currency)}
                  </span>
                </div>
                <button
                  onClick={confirmSale}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                >
                  Confirm Sale
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Weight Dialog */}
      {showWeightDialog && selectedProductForWeight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-4">
            <h2 className="text-lg font-semibold">
              Select Weight - {selectedProductForWeight.name}
            </h2>
            <div className="text-center mt-4">
              <img
                src={selectedProductForWeight.image_url || 'https://placehold.co/150'}
                alt={selectedProductForWeight.name}
                className="w-24 h-24 object-cover rounded-lg mx-auto mb-2"
              />
              <p className="text-sm text-gray-600">
                {formatCurrency(selectedProductForWeight.selling_price, business?.currency)} per{' '}
                {selectedProductForWeight.unit}
              </p>
            </div>
            <div className="mt-4">
              <label className="text-sm font-medium">
                Weight ({selectedProductForWeight.unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max={selectedProductForWeight.stock_quantity}
                value={weightInput}
                onChange={(e) => setWeightInput(parseFloat(e.target.value) || 0)}
                className="w-full mt-1 p-2 border rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Available stock: {selectedProductForWeight.stock_quantity}{' '}
                {selectedProductForWeight.unit}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg mt-4">
              <div className="flex justify-between items-center font-bold">
                <span>Total Price:</span>
                <span>
                  {formatCurrency(
                    selectedProductForWeight.selling_price * weightInput,
                    business?.currency
                  )}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => {
                  setShowWeightDialog(false);
                  setSelectedProductForWeight(null);
                }}
                className="flex-1 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (
                    weightInput > 0 &&
                    weightInput <= selectedProductForWeight.stock_quantity
                  ) {
                    addToCart(selectedProductForWeight, weightInput);
                    setShowWeightDialog(false);
                    setSelectedProductForWeight(null);
                  } else {
                    showToast('Invalid weight or not enough stock.', 'error');
                  }
                }}
                className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales History */}
      {showSalesHistory && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowSalesHistory(false)}
        >
          <div 
            className="absolute right-0 top-0 h-full w-full max-w-md bg-gray-50 shadow-xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between bg-white">
              <h2 className="text-lg font-semibold">Sales History</h2>
              <button
                onClick={() => setShowSalesHistory(false)}
                className="p-1 hover:bg-gray-100 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {salesHistory.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  No sales for this period.
                </div>
              ) : (
                salesHistory.map(sale => (
                  <div key={sale.id} className="bg-white p-3 rounded-lg border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm">
                        <div className="font-medium">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500">
                          {new Date(sale.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                      <span className="font-bold text-blue-600">
                        {formatCurrency(sale.total_amount, business?.currency)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {sale.sale_items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs text-gray-600">
                          <span>{item.products?.name || 'Unknown Product'}</span>
                          <span>
                            {item.quantity}x {formatCurrency(item.price_at_sale, business?.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[100] space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`toast text-white px-6 py-3 rounded-full shadow-lg ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CashierView;
