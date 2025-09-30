import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './SettingsPage.css';

function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState('');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadBusinessData();
  }, []);

  async function loadBusinessData() {
    try {
      setLoading(true);
      // Get the business ID using the helper function
      const { data: businessIdData } = await supabase.rpc('get_my_business_id');
      
      if (businessIdData) {
        const { data: business, error } = await supabase
          .from('businesses')
          .select('name, pin_code')
          .eq('id', businessIdData)
          .single();
        
        if (business) {
          setBusinessName(business.name || '');
          setPin(business.pin_code || '');
        }
        if (error) {
          console.error('Error loading business:', error);
        }
      }
    } catch (error) {
      console.error('Error loading business data:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleInfoUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      // Get business ID using RPC
      const { data: businessIdData } = await supabase.rpc('get_my_business_id');
      
      if (!businessIdData) {
        throw new Error('Could not get business ID');
      }

      // Use the RPC function to update business settings
      const { data, error } = await supabase.rpc('update_business_settings', {
        target_business_id: businessIdData,
        new_name: businessName,
        new_pin: pin
      });

      if (error) throw error;
      showMessage('success', data.message || 'Business information updated successfully!');
    } catch (error) {
      console.error('Error updating business:', error);
      showMessage('error', 'Failed to update settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordUpdate(e) {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    if (password.length < 6) {
      showMessage('error', 'Password must be at least 6 characters long.');
      setSaving(false);
      return;
    }

    if (password !== confirmPassword) {
      showMessage('error', 'Passwords do not match.');
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: password 
      });

      if (error) throw error;
      
      showMessage('success', 'Password updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      showMessage('error', 'Failed to update password: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  function showMessage(type, text) {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  }

  if (loading) {
    return <div className="settings-loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <h2>⚙️ Settings</h2>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-sections">
        {/* Business Information Section */}
        <div className="settings-section">
          <h3>Business Information</h3>
          <form onSubmit={handleInfoUpdate}>
            <div className="form-group">
              <label htmlFor="businessName">Business Name *</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                placeholder="Enter business name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="pin">Admin PIN (4-6 digits) *</label>
              <input
                id="pin"
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
                minLength="4"
                maxLength="6"
                placeholder="Enter 4-6 digit PIN"
              />
              <p className="field-hint">4-6 digits to unlock the admin dashboard</p>
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Update Business Info'}
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="settings-section">
          <h3>Security</h3>
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label htmlFor="password">New Password *</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength="6"
                placeholder="Enter new password"
              />
              <p className="field-hint">Minimum 6 characters</p>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password *</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength="6"
                placeholder="Confirm new password"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Account Section */}
        <div className="settings-section">
          <h3>Account</h3>
          <button onClick={handleSignOut} className="btn-logout">
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
