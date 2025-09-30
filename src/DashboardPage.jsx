import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import ViewBusinessDetails from './ViewBusinessDetails';
import './DashboardPage.css';

function DashboardPage({ onLogout }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    subscriptionEndDate: '',
    deviceLimit: 5,
    pinCode: ''
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [editingBusiness, setEditingBusiness] = useState(null);
  const [viewingBusinessId, setViewingBusinessId] = useState(null);

  useEffect(() => {
    getBusinesses();
  }, []);

  async function getBusinesses() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('businesses')
        .select('id, name, subscription_end_date, device_limit, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBusinesses(data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      setError('Failed to load businesses: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateBusiness(e) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-business-account', {
        body: {
          businessName: formData.name,
          adminEmail: formData.email,
          adminPassword: formData.password,
          subscriptionEndDate: formData.subscriptionEndDate,
          deviceLimit: parseInt(formData.deviceLimit),
          pinCode: formData.pinCode
        }
      });

      if (error) throw error;
      
      alert('Business created successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        password: '',
        subscriptionEndDate: '',
        deviceLimit: 5,
        pinCode: ''
      });
      getBusinesses(); // Refresh the list
    } catch (error) {
      setError('Error creating business: ' + error.message);
    } finally {
      setCreating(false);
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  function openEditModal(business) {
    setEditingBusiness(business);
    setFormData({
      name: business.name,
      email: '', // Not needed for edit
      password: '', // Not needed for edit
      subscriptionEndDate: business.subscription_end_date || '',
      deviceLimit: business.device_limit || 5,
      pinCode: business.pin_code || ''
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingBusiness(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      subscriptionEndDate: '',
      deviceLimit: 5,
      pinCode: ''
    });
    setError('');
  }

  async function handleUpdateBusiness(e) {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const updateData = {
        name: formData.name,
        subscription_end_date: formData.subscriptionEndDate,
        device_limit: parseInt(formData.deviceLimit)
      };

      // Only update PIN if it's provided
      if (formData.pinCode) {
        updateData.pin_code = formData.pinCode;
      }

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', editingBusiness.id);

      if (error) throw error;
      
      alert('Business updated successfully!');
      closeModal();
      getBusinesses();
    } catch (error) {
      setError('Error updating business: ' + error.message);
    } finally {
      setCreating(false);
    }
  }

  async function extendSubscription(businessId, days) {
    try {
      const today = new Date();
      const newEndDate = new Date(today);
      newEndDate.setDate(newEndDate.getDate() + days);

      const { error } = await supabase
        .from('businesses')
        .update({ 
          subscription_end_date: newEndDate.toISOString().split('T')[0],
          status: 'active'
        })
        .eq('id', businessId);

      if (error) throw error;
      alert(`Subscription extended by ${days} days!`);
      getBusinesses();
    } catch (error) {
      alert('Error extending subscription: ' + error.message);
    }
  }

  async function toggleBusinessStatus(business) {
    const newStatus = business.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'suspended' ? 'suspend' : 'reactivate';
    
    if (!confirm(`Are you sure you want to ${action} "${business.name}"?`)) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update({ status: newStatus })
        .eq('id', business.id);

      if (error) throw error;
      alert(`Business ${action}d successfully!`);
      getBusinesses();
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  async function handleChangePassword(business) {
    const newPassword = prompt(`Enter new password for "${business.name}" admin:`);
    if (!newPassword) return;
    
    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    try {
      // First, get the admin user ID for this business
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('business_id', business.id)
        .eq('role', 'business_admin')
        .single();

      if (profileError || !profile) {
        throw new Error('Could not find business admin user');
      }

      // Update password using Supabase admin API
      const { error } = await supabase.auth.admin.updateUserById(
        profile.id,
        { password: newPassword }
      );

      if (error) throw error;
      alert('Password changed successfully!');
    } catch (error) {
      alert('Error changing password: ' + error.message);
    }
  }

  async function handleDeleteBusiness(business) {
    const confirmation = prompt(
      `⚠️ DANGER ZONE ⚠️\n\nThis will PERMANENTLY DELETE "${business.name}" and ALL associated data (products, sales, expenses, users).\n\nType the business name to confirm:`
    );
    
    if (confirmation !== business.name) {
      if (confirmation) alert('Business name did not match. Deletion cancelled.');
      return;
    }

    try {
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', business.id);

      if (error) throw error;
      alert('Business deleted successfully.');
      getBusinesses();
    } catch (error) {
      alert('Error deleting business: ' + error.message);
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Super Admin Dashboard</h1>
            <p>Manage all client businesses</p>
          </div>
          <button onClick={handleSignOut} className="btn-secondary">
            Sign Out
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-actions">
          <h2>Businesses ({businesses.length})</h2>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Add New Business
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading businesses...</div>
        ) : businesses.length === 0 ? (
          <div className="empty-state">
            <p>No businesses yet. Click "Add New Business" to create one.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="businesses-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Status</th>
                  <th>Subscription End</th>
                  <th>Days Remaining</th>
                  <th>Device Limit</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((business) => (
                  <tr key={business.id}>
                    <td className="business-name">{business.name}</td>
                    <td>
                      <span className={`status-badge status-${business.status}`}>
                        {business.status === 'active' ? '✓ Active' : 
                         business.status === 'suspended' ? '⏸ Suspended' : 
                         '❌ Expired'}
                      </span>
                    </td>
                    <td>{formatDate(business.subscription_end_date)}</td>
                    <td className="days-remaining">
                      {(() => {
                        const today = new Date();
                        const endDate = new Date(business.subscription_end_date);
                        const diffTime = endDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return (
                          <span className={diffDays < 0 ? 'expired' : diffDays < 30 ? 'warning' : 'good'}>
                            {diffDays < 0 ? `Expired ${Math.abs(diffDays)} days ago` : `${diffDays} days`}
                          </span>
                        );
                      })()}
                    </td>
                    <td>{business.device_limit}</td>
                    <td className="actions-cell">
                      <div className="action-group">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => openEditModal(business)}
                          title="Edit Details"
                        >
                          ✏️ Edit
                        </button>
                        <button 
                          className="btn-action btn-view"
                          onClick={() => setViewingBusinessId(business.id)}
                          title="View Details"
                        >
                          👁️ View
                        </button>
                      </div>
                      
                      <div className="action-group subscription-actions">
                        <button
                          className="btn-action btn-extend"
                          onClick={() => extendSubscription(business.id, 15)}
                          title="Add 15 Days"
                        >
                          +15d
                        </button>
                        <button
                          className="btn-action btn-extend"
                          onClick={() => extendSubscription(business.id, 30)}
                          title="Add 30 Days"
                        >
                          +30d
                        </button>
                        <button
                          className="btn-action btn-extend"
                          onClick={() => extendSubscription(business.id, 365)}
                          title="Add 1 Year"
                        >
                          +1yr
                        </button>
                      </div>
                      
                      <div className="action-group danger-actions">
                        <button
                          className={`btn-action ${business.status === 'active' ? 'btn-suspend' : 'btn-activate'}`}
                          onClick={() => toggleBusinessStatus(business)}
                          title={business.status === 'active' ? 'Suspend Account' : 'Reactivate Account'}
                        >
                          {business.status === 'active' ? '⏸ Suspend' : '▶️ Activate'}
                        </button>
                        <button
                          className="btn-action btn-password"
                          onClick={() => handleChangePassword(business)}
                          title="Change Admin Password"
                        >
                          🔑 Password
                        </button>
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDeleteBusiness(business)}
                          title="Delete Business"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingBusiness ? 'Edit Business' : 'Create New Business'}</h2>
              <button 
                className="modal-close" 
                onClick={closeModal}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={editingBusiness ? handleUpdateBusiness : handleCreateBusiness} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">Business Name *</label>
                <input
                  id="name"
                  type="text"
                  placeholder="e.g., Acme Corporation"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  disabled={creating}
                />
              </div>

              {!editingBusiness && (
                <>
                  <div className="form-group">
                    <label htmlFor="email">Admin Email *</label>
                    <input
                      id="email"
                      type="email"
                      placeholder="admin@business.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      autoComplete="email"
                      required
                      disabled={creating}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="password">Admin Password *</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      autoComplete="new-password"
                      required
                      minLength={6}
                      disabled={creating}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label htmlFor="endDate">Subscription End Date *</label>
                <input
                  id="endDate"
                  type="date"
                  value={formData.subscriptionEndDate}
                  onChange={(e) => setFormData({...formData, subscriptionEndDate: e.target.value})}
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="deviceLimit">Device Limit *</label>
                <input
                  id="deviceLimit"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.deviceLimit}
                  onChange={(e) => setFormData({...formData, deviceLimit: e.target.value})}
                  required
                  disabled={creating}
                />
              </div>

              <div className="form-group">
                <label htmlFor="pinCode">PIN Code {editingBusiness ? '(leave blank to keep current)' : '(4-6 digits)'}</label>
                <input
                  id="pinCode"
                  type="text"
                  pattern="[0-9]{4,6}"
                  placeholder="e.g., 1234"
                  value={formData.pinCode}
                  onChange={(e) => setFormData({...formData, pinCode: e.target.value})}
                  required={!editingBusiness}
                  disabled={creating}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn-secondary"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? (editingBusiness ? 'Updating...' : 'Creating...') : (editingBusiness ? 'Update Business' : 'Create Business')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {viewingBusinessId && (
        <ViewBusinessDetails 
          businessId={viewingBusinessId}
          onClose={() => setViewingBusinessId(null)}
        />
      )}
    </div>
  );
}

export default DashboardPage;
