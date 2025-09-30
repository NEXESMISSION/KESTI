import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import ProductManager from './ProductManager';
import ExpenseTracker from './ExpenseTracker';
import FinancialSummary from './FinancialSummary';
import SalesHistoryPage from './SalesHistoryPage';
import SettingsPage from './SettingsPage';
import './BusinessAdminDashboard.css';

function BusinessAdminDashboard({ onLogout, onLock }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [businessInfo, setBusinessInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBusinessInfo();
  }, []);

  async function getBusinessInfo() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Get the user's profile to find their business_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        // Get business details
        if (profile?.business_id) {
          const { data: business, error: businessError } = await supabase
            .from('businesses')
            .select('name, subscription_end_date, device_limit')
            .eq('id', profile.business_id)
            .single();

          if (businessError) throw businessError;
          setBusinessInfo(business);
        }
      }
    } catch (error) {
      console.error('Error fetching business info:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysRemaining = (endDate) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const daysRemaining = businessInfo?.subscription_end_date ? getDaysRemaining(businessInfo.subscription_end_date) : null;
  const isExpiringSoon = daysRemaining !== null && daysRemaining <= 30;
  const isExpired = daysRemaining !== null && daysRemaining < 0;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontSize: '1.5rem',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="business-admin-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="business-info-header">
            <h1>{businessInfo?.name || 'Business Dashboard'}</h1>
            {businessInfo && (
              <div className="subscription-badge-container">
                {isExpired ? (
                  <div className="subscription-badge expired">
                    ⚠️ Subscription Expired
                  </div>
                ) : isExpiringSoon ? (
                  <div className="subscription-badge expiring">
                    ⏰ {daysRemaining} days remaining
                  </div>
                ) : (
                  <div className="subscription-badge active">
                    ✓ Active Subscription
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="header-buttons">
            {onLock && (
              <button className="btn-lock" onClick={onLock}>
                🔒 Back to Cashier
              </button>
            )}
            <button className="btn-logout" onClick={handleSignOut}>
              🚪 Sign Out
            </button>
          </div>
        </div>
        
        {businessInfo && (
          <div className="business-details">
            <div className="detail-item">
              <span className="detail-label">Subscription Ends:</span>
              <span className="detail-value">{formatDate(businessInfo.subscription_end_date)}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Device Limit:</span>
              <span className="detail-value">{businessInfo.device_limit} devices</span>
            </div>
          </div>
        )}
      </header>

      <nav className="dashboard-nav">
        <button 
          className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <span className="tab-icon">📊</span>
          Financial Summary
        </button>
        <button 
          className={`nav-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <span className="tab-icon">📦</span>
          Products
        </button>
        <button 
          className={`nav-tab ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <span className="tab-icon">💸</span>
          Expenses
        </button>
        <button 
          className={`nav-tab ${activeTab === 'sales' ? 'active' : ''}`}
          onClick={() => setActiveTab('sales')}
        >
          <span className="tab-icon">📈</span>
          Sales History
        </button>
        <button 
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          Settings
        </button>
      </nav>

      <main className="dashboard-content">
        {activeTab === 'summary' && <FinancialSummary />}
        {activeTab === 'products' && <ProductManager />}
        {activeTab === 'expenses' && <ExpenseTracker />}
        {activeTab === 'sales' && <SalesHistoryPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>

      <footer className="dashboard-footer">
        <p>© 2025 Cashier SaaS - Business Admin Panel</p>
      </footer>
    </div>
  );
}

export default BusinessAdminDashboard;
