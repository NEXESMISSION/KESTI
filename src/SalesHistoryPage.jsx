import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './SalesHistoryPage.css';

function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // 'day', 'week', 'month'
  const [expandedSale, setExpandedSale] = useState(null);

  useEffect(() => {
    loadSales();
  }, [filter]);

  const getStartDate = (filterType) => {
    const now = new Date();
    
    if (filterType === 'day') {
      now.setHours(0, 0, 0, 0);
      return now;
    }
    
    if (filterType === 'week') {
      const dayOfWeek = now.getDay(); // 0 = Sunday
      now.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // Start of week (Monday)
      now.setHours(0, 0, 0, 0);
      return now;
    }
    
    if (filterType === 'month') {
      return new Date(now.getFullYear(), now.getMonth(), 1);
    }
    
    return null;
  };

  async function loadSales() {
    try {
      setLoading(true);
      const startDate = getStartDate(filter);
      
      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items(
            *,
            products(name)
          ),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false });

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }

  const toggleSaleDetails = (saleId) => {
    setExpandedSale(expandedSale === saleId ? null : saleId);
  };

  const calculateTotals = () => {
    const totalRevenue = sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount), 0);
    const totalSales = sales.length;
    const avgSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return { totalRevenue, totalSales, avgSale };
  };

  const getFilterLabel = () => {
    switch (filter) {
      case 'day':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'All Time';
    }
  };

  const totals = calculateTotals();

  if (loading) {
    return <div className="sales-history-loading">Loading sales history...</div>;
  }

  return (
    <div className="sales-history-page">
      <div className="history-header">
        <h2>📊 Sales History</h2>
        
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'day' ? 'active' : ''}`}
            onClick={() => setFilter('day')}
          >
            Today
          </button>
          <button
            className={`filter-btn ${filter === 'week' ? 'active' : ''}`}
            onClick={() => setFilter('week')}
          >
            This Week
          </button>
          <button
            className={`filter-btn ${filter === 'month' ? 'active' : ''}`}
            onClick={() => setFilter('month')}
          >
            This Month
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-info">
            <div className="summary-label">Total Revenue</div>
            <div className="summary-value">{totals.totalRevenue.toFixed(2)} TND</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-info">
            <div className="summary-label">Total Sales</div>
            <div className="summary-value">{totals.totalSales}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💵</div>
          <div className="summary-info">
            <div className="summary-label">Average Sale</div>
            <div className="summary-value">{totals.avgSale.toFixed(2)} TND</div>
          </div>
        </div>
      </div>

      {/* Sales List */}
      <div className="sales-section">
        <h3>{getFilterLabel()} - {sales.length} Sales</h3>

        {sales.length === 0 ? (
          <div className="empty-sales">
            <p>📊</p>
            <p>No sales found for {getFilterLabel().toLowerCase()}</p>
          </div>
        ) : (
          <div className="sales-table">
            {sales.map(sale => (
              <div key={sale.id} className="sale-row">
                <div
                  className="sale-summary"
                  onClick={() => toggleSaleDetails(sale.id)}
                >
                  <div className="sale-info">
                    <span className="sale-date">
                      {new Date(sale.created_at).toLocaleDateString()} at{' '}
                      {new Date(sale.created_at).toLocaleTimeString()}
                    </span>
                    <span className="sale-items-count">
                      {sale.sale_items.length} item{sale.sale_items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="sale-amount">
                    {parseFloat(sale.total_amount).toFixed(2)} TND
                  </div>
                  <button className="expand-button">
                    {expandedSale === sale.id ? '▲' : '▼'}
                  </button>
                </div>

                {expandedSale === sale.id && (
                  <div className="sale-details">
                    <table className="items-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                          <th>Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sale.sale_items.map(item => (
                          <tr key={item.id}>
                            <td>{item.products?.name || 'Unknown Product'}</td>
                            <td>{item.quantity}</td>
                            <td>{parseFloat(item.price_at_sale).toFixed(2)} TND</td>
                            <td>{(parseFloat(item.price_at_sale) * item.quantity).toFixed(2)} TND</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SalesHistoryPage;
