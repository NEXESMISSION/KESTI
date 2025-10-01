import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CashierPage from './pages/CashierPage';
import BusinessAdminDashboard from './BusinessAdminDashboard';
import PinModal from './PinModal';

function ClientApp({ onLogout }) {
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [businessStatus, setBusinessStatus] = useState(null);
  const [businessName, setBusinessName] = useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkBusinessStatus();
  }, []);

  async function checkBusinessStatus() {
    try {
      setLoading(true);
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
            .select('name, status, subscription_end_date')
            .eq('id', profile.business_id)
            .single();

          if (business) {
            setBusinessName(business.name);
            setSubscriptionEndDate(business.subscription_end_date);
            
            // ROBUST DATE COMPARISON - Normalize to midnight to avoid timezone issues
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Normalize today to midnight

            const expiryDate = new Date(business.subscription_end_date);
            expiryDate.setUTCHours(0, 0, 0, 0); // Normalize expiry date to UTC midnight

            // Determine actual status based on subscription date
            if (business.status === 'suspended') {
              setBusinessStatus('suspended');
            } else if (expiryDate < today) {
              // Subscription has expired
              setBusinessStatus('expired');
            } else {
              // Active and not expired
              setBusinessStatus('active');
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking business status:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleUnlock = () => {
    setShowPinModal(true);
  };

  const handlePinSuccess = () => {
    setIsAdminUnlocked(true);
  };

  const handleLock = () => {
    setIsAdminUnlocked(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

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

  // Check if business is suspended or expired
  if (businessStatus === 'suspended' || businessStatus === 'expired') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>
            {businessStatus === 'suspended' ? '⏸️' : '❌'}
          </div>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 'bold', 
            color: '#1a202c',
            marginBottom: '16px'
          }}>
            Account {businessStatus === 'suspended' ? 'Suspended' : 'Expired'}
          </h1>
          <p style={{ 
            fontSize: '1.1rem', 
            color: '#4a5568',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            {businessStatus === 'suspended' 
              ? `Your account "${businessName}" has been temporarily suspended. Please contact your administrator for assistance.`
              : `Your subscription for "${businessName}" has expired. Please contact your administrator to renew your subscription.`
            }
          </p>
          {subscriptionEndDate && (
            <p style={{ 
              fontSize: '0.95rem', 
              color: '#718096',
              marginBottom: '24px'
            }}>
              Subscription ended: {new Date(subscriptionEndDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
          <button
            onClick={handleSignOut}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              padding: '12px 32px',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s'
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.9'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (isAdminUnlocked) {
    return <BusinessAdminDashboard onLogout={onLogout} onLock={handleLock} />;
  }

  return (
    <>
      <CashierPage onUnlock={handleUnlock} />
      {showPinModal && (
        <PinModal
          onClose={() => setShowPinModal(false)}
          onSuccess={handlePinSuccess}
        />
      )}
    </>
  );
}

export default ClientApp;
