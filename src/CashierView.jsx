import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

// ====================================================================================
// CASHIER VIEW - Self-contained with inline styles for easy customization
// ====================================================================================

function CashierView({ onUnlock }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [activeView, setActiveView] = useState('pos'); // 'pos' or 'history'
  const [searchTerm, setSearchTerm] = useState('');
  const [todaysSales, setTodaysSales] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    loadProducts();
    getBusinessInfo();
  }, []);

  useEffect(() => {
    if (activeView === 'history') {
      loadTodaysHistory();
    }
  }, [activeView]);

  async function getBusinessInfo() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', user.id)
          .single();

        if (profile?.business_id) {
          const { data: business } = await supabase
            .from('businesses')
            .select('name')
            .eq('id', profile.business_id)
            .single();

          if (business) setBusinessName(business.name);
        }
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    }
  }

  async function loadProducts() {
    try {
      setLoading(true);
      // Fetch products with category information
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name)
        `)
        .gt('stock_quantity', 0)
        .order('name');

      if (productsError) throw productsError;
      if (productsData) setProducts(productsData);

      // Fetch all categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;
      if (categoriesData) {
        setCategories(categoriesData);
        // Initialize all categories as expanded
        const expanded = {};
        categoriesData.forEach(cat => expanded[cat.id] = true);
        expanded['uncategorized'] = true;
        setExpandedCategories(expanded);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadTodaysHistory() {
    try {
      setLoadingHistory(true);
      // Get the start of today in local timezone
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            products(name)
          )
        `)
        .gte('created_at', startOfToday.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodaysSales(data || []);
    } catch (error) {
      console.error('Error loading today\'s history:', error);
    } finally {
      setLoadingHistory(false);
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity < product.stock_quantity) {
        setCart(cart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ));
      }
      // Silent - no alert for better UX
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    const product = products.find(p => p.id === productId);
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else if (newQuantity > product.stock_quantity) {
      // Silent - no alert for better UX
      return;
    } else {
      setCart(cart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 0);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      // Silent - no alert for better UX
      return;
    }

    if (!confirm('Complete this sale?')) return;

    try {
      const total = calculateTotal();

      // Create the sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{ total_amount: total }])
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        product_id: item.id,
        quantity: item.quantity,
        price_at_sale: item.selling_price,
        buying_price_at_sale: item.buying_price || 0
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update stock quantities
      for (const item of cart) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq('id', item.id);

        if (stockError) throw stockError;
      }

      // Sale completed silently - no alert for faster checkout
      setCart([]);
      loadProducts(); // Reload to get updated stock
    } catch (error) {
      console.error('Checkout error:', error);
      // Error logged to console - no alert for better UX
    }
  };

  const clearCart = () => {
    if (cart.length > 0 && confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        // The app will redirect to login automatically via AuthProvider
      } catch (error) {
        console.error('Error logging out:', error);
        // Error logged to console - no alert for better UX
      }
    }
  };

  if (loading) {
    return <div className="cashier-loading">Loading products...</div>;
  }

  // Helper functions for V9.0 features
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const getFilteredProducts = () => {
    if (!searchTerm) return products;
    
    return products.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getGroupedProducts = () => {
    const filtered = getFilteredProducts();
    const grouped = {};
    
    // Group by category
    filtered.forEach(product => {
      const categoryId = product.category_id || 'uncategorized';
      const categoryName = product.categories?.name || 'Uncategorized';
      
      if (!grouped[categoryId]) {
        grouped[categoryId] = {
          id: categoryId,
          name: categoryName,
          products: []
        };
      }
      grouped[categoryId].products.push(product);
    });
    
    return Object.values(grouped);
  };

  // ====================================================================================
  // STYLES - All styling contained in this component for easy customization
  // ====================================================================================
  const inlineCSS = `
    .cashier-view {
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      flex-direction: column;
    }
    .cashier-loading {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      font-size: 1.5rem;
      color: white;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .cashier-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 1rem 2rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .cashier-header-content {
      max-width: 1400px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .cashier-header h1 {
      margin: 0;
      font-size: 1.8rem;
      color: #333;
      font-weight: 700;
    }
    .header-buttons { display: flex; gap: 1rem; }
    .admin-unlock-button, .logout-button {
      padding: 0.6rem 1.2rem;
      border: none;
      borderRadius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .admin-unlock-button {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    .admin-unlock-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4); }
    .logout-button { background: #ff6b6b; color: white; }
    .logout-button:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4); }
    .cashier-tabs { display: flex; gap: 0.5rem; padding: 1rem 2rem; background: rgba(255, 255, 255, 0.9); box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); }
    .tab-button { padding: 0.8rem 1.5rem; border: none; background: white; borderRadius: 8px; cursor: pointer; font-size: 1rem; font-weight: 600; transition: all 0.3s ease; }
    .tab-button.active { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
    .cashier-main { flex: 1; padding: 2rem; display: flex; gap: 2rem; max-width: 1400px; margin: 0 auto; width: 100%; }
    .products-section { flex: 1; display: flex; flex-direction: column; gap: 1rem; }
    .products-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .search-bar { flex: 1; padding: 0.8rem; border: 2px solid #e0e0e0; borderRadius: 8px; font-size: 1rem; }
    .search-bar:focus { outline: none; border-color: #667eea; }
    .categorized-products { display: flex; flex-direction: column; gap: 1.5rem; }
    .category-section { border: 1px solid #e0e0e0; borderRadius: 8px; overflow: hidden; }
    .category-header { display: flex; align-items: center; gap: 0.8rem; padding: 1rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; cursor: pointer; user-select: none; }
    .category-header h3 { margin: 0; font-size: 1.2rem; flex: 1; }
    .category-count { background: rgba(255, 255, 255, 0.2); padding: 0.3rem 0.8rem; borderRadius: 12px; font-size: 0.9rem; }
    .products-grid-cashier { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1rem; padding: 1rem; background: #f8f9fa; }
    .product-tile { background: white; borderRadius: 8px; padding: 1rem; cursor: pointer; transition: all 0.3s ease; border: 2px solid transparent; text-align: center; }
    .product-tile:hover { transform: translateY(-4px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15); border-color: #667eea; }
    .product-tile-image { width: 100%; height: 120px; overflow: hidden; borderRadius: 8px; margin-bottom: 0.8rem; background: #f0f0f0; }
    .product-tile-image img { width: 100%; height: 100%; object-fit: cover; }
    .product-tile-name { font-weight: 600; color: #333; margin-bottom: 0.5rem; font-size: 1rem; }
    .product-tile-price { font-size: 1.2rem; color: #667eea; font-weight: 700; margin-bottom: 0.3rem; }
    .product-tile-stock { font-size: 0.85rem; color: #999; }
    .empty-products { text-align: center; padding: 3rem; color: #999; font-size: 1.2rem; }
    .cart-section { width: 400px; background: white; borderRadius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); display: flex; flex-direction: column; max-height: calc(100vh - 250px); }
    .cart-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 2px solid #e0e0e0; }
    .cart-header h2 { margin: 0; color: #333; font-size: 1.4rem; }
    .clear-cart-button { padding: 0.5rem 1rem; border: none; background: #ff6b6b; color: white; borderRadius: 6px; font-weight: 600; cursor: pointer; }
    .clear-cart-button:hover { background: #ff5252; transform: translateY(-2px); }
    .cart-items { flex: 1; overflow-y: auto; margin-bottom: 1rem; }
    .empty-cart { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #999; gap: 0.5rem; }
    .cart-item { background: #f8f9fa; borderRadius: 8px; padding: 1rem; margin-bottom: 0.8rem; }
    .cart-item-info { display: flex; justify-content: space-between; align-items: center; }
    .cart-item-name { font-weight: 600; color: #333; font-size: 1rem; }
    .cart-item-price { color: #667eea; font-weight: 600; }
    .cart-item-controls { display: flex; align-items: center; gap: 0.8rem; }
    .qty-button { width: 32px; height: 32px; border: 2px solid #667eea; background: white; color: #667eea; borderRadius: 6px; font-size: 1.2rem; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; }
    .qty-button:hover { background: #667eea; color: white; }
    .cart-item-quantity { font-weight: 600; font-size: 1.1rem; min-width: 30px; text-align: center; }
    .remove-button { margin-left: auto; padding: 0.4rem 0.8rem; border: none; background: #ff6b6b; color: white; borderRadius: 6px; cursor: pointer; }
    .remove-button:hover { background: #ff5252; }
    .cart-item-total { font-size: 1.1rem; font-weight: 700; color: #333; text-align: right; }
    .cart-footer { border-top: 2px solid #e0e0e0; padding-top: 1rem; }
    .cart-total { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding: 1rem; background: #f8f9fa; borderRadius: 8px; }
    .total-label { font-size: 1.3rem; font-weight: 600; color: #333; }
    .total-amount { font-size: 1.8rem; font-weight: 700; color: #667eea; }
    .checkout-button { width: 100%; padding: 1rem; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; borderRadius: 8px; font-size: 1.2rem; font-weight: 700; cursor: pointer; }
    .checkout-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4); }
    .checkout-button:disabled { opacity: 0.5; cursor: not-allowed; }
    .history-section { flex: 1; background: white; borderRadius: 12px; padding: 1.5rem; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1); }
    .sales-list { display: flex; flex-direction: column; gap: 1rem; }
    .sale-card { background: #f8f9fa; padding: 1rem; borderRadius: 8px; border: 1px solid #e0e0e0; }
    .sale-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; font-weight: 600; }
    .sale-items { margin-top: 0.5rem; font-size: 0.9rem; color: #666; }
    .sale-item-row { display: flex; justify-content: space-between; padding: 0.25rem 0; }
    .history-summary { margin-top: 1.5rem; padding: 1rem; background: #f8f9fa; borderRadius: 8px; font-size: 1rem; }
    @media (max-width: 768px) {
      .cashier-header h1 { font-size: 1.3rem; }
      .admin-unlock-button, .logout-button { font-size: 0.85rem; padding: 0.5rem 1rem; }
      .category-header h3 { font-size: 1rem; }
      .product-tile-name { font-size: 0.85rem; }
      .product-tile-price { font-size: 1rem; }
      .cart-header h2 { font-size: 1.1rem; }
      .total-label { font-size: 1.1rem; }
      .total-amount { font-size: 1.4rem; }
      .checkout-button { font-size: 1rem; padding: 0.85rem; }
      .cashier-main { flex-direction: column; }
      .cart-section { width: 100%; }
    }
  `;

  return (
    <>
      <style>{inlineCSS}</style>
    <div className="cashier-view">
      <header className="cashier-header">
        <div className="cashier-header-content">
          <h1>🛒 {businessName || 'Cashier'}</h1>
          <div className="header-buttons">
            <button className="admin-unlock-button" onClick={onUnlock}>
              🔐 Admin
            </button>
            <button className="logout-button" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="cashier-tabs">
        <button
          className={`tab-button ${activeView === 'pos' ? 'active' : ''}`}
          onClick={() => setActiveView('pos')}
        >
          💵 POS
        </button>
        <button
          className={`tab-button ${activeView === 'history' ? 'active' : ''}`}
          onClick={() => setActiveView('history')}
        >
          📊 Today's History
        </button>
      </div>

      <div className="cashier-main">
        {activeView === 'pos' ? (
          <>
            <div className="products-section">
              {/* Search Bar */}
              <div className="products-header">
                <h2>Products</h2>
                <input
                  type="text"
                  className="search-bar"
                  placeholder="🔍 Search products or categories..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Categorized Product Grid */}
              <div className="categorized-products">
                {getGroupedProducts().length === 0 ? (
                  <div className="empty-products">
                    <p>No products found</p>
                  </div>
                ) : (
                  getGroupedProducts().map(group => (
                    <div key={group.id} className="category-section">
                      <div
                        className="category-header"
                        onClick={() => toggleCategory(group.id)}
                      >
                        <span className="category-toggle">
                          {expandedCategories[group.id] ? '▼' : '▶'}
                        </span>
                        <h3>{group.name}</h3>
                        <span className="category-count">({group.products.length})</span>
                      </div>
                      
                      {expandedCategories[group.id] && (
                        <div className="products-grid-cashier">
                          {group.products.map(product => (
                            <div
                              key={product.id}
                              className="product-tile"
                              onClick={() => addToCart(product)}
                            >
                              {product.image_url && (
                                <div className="product-tile-image">
                                  <img src={product.image_url} alt={product.name} />
                                </div>
                              )}
                              <div className="product-tile-name">{product.name}</div>
                              <div className="product-tile-price">
                                ${parseFloat(product.selling_price).toFixed(2)}
                                {product.price_type === 'per_weight' && product.unit ? `/${product.unit}` : ''}
                              </div>
                              <div className="product-tile-stock">{product.stock_quantity} in stock</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="cart-section">
              <div className="cart-header">
                <h2>Current Sale</h2>
                {cart.length > 0 && (
                  <button className="clear-cart-button" onClick={clearCart}>
                    Clear
                  </button>
                )}
              </div>

              <div className="cart-items">
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <p>🛒</p>
                    <p>Cart is empty</p>
                    <p className="empty-cart-hint">Click on a product to add it</p>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <div className="cart-item-name">{item.name}</div>
                        <div className="cart-item-price">{parseFloat(item.selling_price).toFixed(2)} TND</div>
                      </div>
                      <div className="cart-item-controls">
                        <button
                          className="qty-button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="cart-item-quantity">{item.quantity}</span>
                        <button
                          className="qty-button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className="remove-button"
                          onClick={() => removeFromCart(item.id)}
                        >
                          🗑️
                        </button>
                      </div>
                      <div className="cart-item-total">
                        {(parseFloat(item.selling_price) * item.quantity).toFixed(2)} TND
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">{calculateTotal().toFixed(2)} TND</span>
                </div>
                <button
                  className="checkout-button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0}
                >
                  Complete Sale
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="history-section">
            <h2>Today's Sales History</h2>
            {loadingHistory ? (
              <div className="loading-history">Loading...</div>
            ) : todaysSales.length === 0 ? (
              <div className="empty-history">
                <p>📊</p>
                <p>No sales today yet</p>
              </div>
            ) : (
              <div className="sales-list">
                {todaysSales.map(sale => (
                  <div key={sale.id} className="sale-card">
                    <div className="sale-header">
                      <span className="sale-time">
                        {new Date(sale.created_at).toLocaleTimeString()}
                      </span>
                      <span className="sale-total">{parseFloat(sale.total_amount).toFixed(2)} TND</span>
                    </div>
                    <div className="sale-items">
                      {sale.sale_items.map(item => (
                        <div key={item.id} className="sale-item-row">
                          <span>{item.products?.name || 'Unknown'}</span>
                          <span>x{item.quantity}</span>
                          <span>{parseFloat(item.price_at_sale).toFixed(2)} TND</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="history-summary">
                  <strong>Total Sales Today:</strong> {todaysSales.length}
                  <br />
                  <strong>Total Revenue:</strong> {todaysSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0).toFixed(2)} TND
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}

export default CashierView;
