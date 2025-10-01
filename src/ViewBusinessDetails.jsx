import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import './ViewBusinessDetails.css';

function ViewBusinessDetails({ businessId, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDetails();
  }, [businessId]);

  async function fetchDetails() {
    try {
      setLoading(true);
      setError('');

      // Fetch business info
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single();

      if (businessError) throw businessError;

      // Fetch products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('business_id', businessId);

      if (productsError) throw productsError;

      // Fetch sales
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('business_id', businessId);

      if (salesError) throw salesError;

      // Fetch expenses
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', businessId);

      if (expensesError) throw expensesError;

      // Fetch users/profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('business_id', businessId);

      if (profilesError) throw profilesError;

      // Combine all data
      setDetails({
        business,
        products: products || [],
        sales: sales || [],
        expenses: expenses || [],
        profiles: profiles || []
      });
    } catch (error) {
      console.error('Error fetching business details:', error);
      setError('Failed to load business details: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const calculateTotalRevenue = () => {
    if (!details?.sales) return 0;
    return details.sales.reduce((sum, sale) => sum + parseFloat(sale.total_amount || 0), 0);
  };

  const calculateTotalExpenses = () => {
    if (!details?.expenses) return 0;
    return details.expenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  };

  const getTotalStock = () => {
    if (!details?.products) return 0;
    return details.products.reduce((sum, prod) => sum + (prod.stock_quantity || 0), 0);
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="view-details-modal">
          <div className="loading-state">Loading business details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="view-details-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Error</h2>
            <button className="modal-close" onClick={onClose}>×</button>
          </div>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="view-details-modal large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📊 {details?.business?.name || 'Business Details'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="details-nav">
          <button 
            className={`details-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`details-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products ({details?.products?.length || 0})
          </button>
          <button 
            className={`details-tab ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses ({details?.expenses?.length || 0})
          </button>
          <button 
            className={`details-tab ${activeTab === 'sales' ? 'active' : ''}`}
            onClick={() => setActiveTab('sales')}
          >
            Sales ({details?.sales?.length || 0})
          </button>
          <button 
            className={`details-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({details?.profiles?.length || 0})
          </button>
        </div>

        <div className="details-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <div className="stat-label">Total Revenue</div>
                    <div className="stat-value">{calculateTotalRevenue().toFixed(2)} TND</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💸</div>
                  <div className="stat-info">
                    <div className="stat-label">Total Expenses</div>
                    <div className="stat-value">{calculateTotalExpenses().toFixed(2)} TND</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📦</div>
                  <div className="stat-info">
                    <div className="stat-label">Total Products</div>
                    <div className="stat-value">{details?.products?.length || 0}</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-label">Total Stock</div>
                    <div className="stat-value">{getTotalStock()}</div>
                  </div>
                </div>
              </div>

              <div className="business-info-section">
                <h3>Business Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label">Business Name:</span>
                    <span className="info-value">{details?.business?.name}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Subscription Ends:</span>
                    <span className="info-value">{formatDate(details?.business?.subscription_end_date)}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Device Limit:</span>
                    <span className="info-value">{details?.business?.device_limit}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">PIN Code:</span>
                    <span className="info-value">{details?.business?.pin_code || 'Not Set'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Created:</span>
                    <span className="info-value">{formatDate(details?.business?.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="data-table">
              {!details?.products || details.products.length === 0 ? (
                <div className="empty-state">No products found</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Buying Price</th>
                      <th>Selling Price</th>
                      <th>Stock</th>
                      <th>Profit/Unit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.products.map(product => (
                      <tr key={product.id}>
                        <td>{product.name}</td>
                        <td>${parseFloat(product.buying_price).toFixed(2)}</td>
                        <td>${parseFloat(product.selling_price).toFixed(2)}</td>
                        <td>{product.stock_quantity}</td>
                        <td className="profit">
                          ${(parseFloat(product.selling_price) - parseFloat(product.buying_price)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="data-table">
              {!details?.expenses || details.expenses.length === 0 ? (
                <div className="empty-state">No expenses found</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Frequency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.expenses.map(expense => (
                      <tr key={expense.id}>
                        <td>{expense.name}</td>
                        <td>${parseFloat(expense.amount).toFixed(2)}</td>
                        <td>{formatDate(expense.expense_date)}</td>
                        <td><span className="frequency-badge">{expense.frequency}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'sales' && (
            <div className="data-table">
              {!details?.sales || details.sales.length === 0 ? (
                <div className="empty-state">No sales found</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.sales.map(sale => (
                      <tr key={sale.id}>
                        <td>{formatDate(sale.created_at)}</td>
                        <td className="amount">${parseFloat(sale.total_amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="data-table">
              {!details?.profiles || details.profiles.length === 0 ? (
                <div className="empty-state">No users found</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Role</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.profiles.map(profile => (
                      <tr key={profile.id}>
                        <td>{profile.id}</td>
                        <td><span className="role-badge">{profile.role}</span></td>
                        <td>{formatDate(profile.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewBusinessDetails;
