import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './CashierView.css';

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
      } else {
        alert('Not enough stock available');
      }
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
      alert('Not enough stock available');
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
      alert('Cart is empty');
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

      alert(`Sale completed! Total: ${total.toFixed(2)} TND`);
      setCart([]);
      loadProducts(); // Reload to get updated stock
    } catch (error) {
      alert('Error completing sale: ' + error.message);
      console.error('Checkout error:', error);
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
        alert('Error logging out: ' + error.message);
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

  return (
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
                        <div className="cart-item-price">${parseFloat(item.selling_price).toFixed(2)}</div>
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
                        ${(parseFloat(item.selling_price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="cart-footer">
                <div className="cart-total">
                  <span className="total-label">Total:</span>
                  <span className="total-amount">${calculateTotal().toFixed(2)}</span>
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
                      <span className="sale-total">${parseFloat(sale.total_amount).toFixed(2)}</span>
                    </div>
                    <div className="sale-items">
                      {sale.sale_items.map(item => (
                        <div key={item.id} className="sale-item-row">
                          <span>{item.products?.name || 'Unknown'}</span>
                          <span>x{item.quantity}</span>
                          <span>${parseFloat(item.price_at_sale).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="history-summary">
                  <strong>Total Sales Today:</strong> {todaysSales.length}
                  <br />
                  <strong>Total Revenue:</strong> ${todaysSales.reduce((sum, s) => sum + parseFloat(s.total_amount), 0).toFixed(2)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CashierView;
