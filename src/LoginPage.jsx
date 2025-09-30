import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './LoginPage.css';

// Generate or retrieve device ID
function getDeviceId() {
  let deviceId = localStorage.getItem('device_id');
  if (!deviceId) {
    deviceId = 'device_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('device_id', deviceId);
  }
  return deviceId;
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      if (data.user) {
        // Register device session
        const deviceId = getDeviceId();
        const deviceName = navigator.userAgent.substring(0, 100); // Browser info
        
        const { data: sessionData, error: sessionError } = await supabase
          .rpc('register_device_session', {
            p_device_id: deviceId,
            p_device_name: deviceName
          });

        if (sessionError) {
          console.error('Session registration error:', sessionError);
        }

        // If session was kicked out, show message
        if (sessionData && !sessionData.success) {
          setError(sessionData.message);
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        onLogin();
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Super Admin Dashboard</h1>
          <p>Sign in to manage your business accounts</p>
        </div>
        
        <form onSubmit={handleSignIn} className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
