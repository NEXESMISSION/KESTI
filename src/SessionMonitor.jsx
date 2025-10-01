// Session Monitor Component
// Checks device session validity and automatically logs out if session was removed
import { useEffect } from 'react';
import { supabase } from './supabaseClient';

// Get device ID from localStorage
function getDeviceId() {
  return localStorage.getItem('device_id') || '';
}

// Get session token from localStorage
function getSessionToken() {
  return localStorage.getItem('session_token') || '';
}

function SessionMonitor({ onSessionInvalid }) {
  useEffect(() => {
    const deviceId = getDeviceId();
    const sessionToken = getSessionToken();
    if (!deviceId || !sessionToken) return;

    // Grace period: Don't check for 90 seconds after mount
    // This allows NEW logins to establish themselves in the database
    const mountTime = Date.now();
    const GRACE_PERIOD_MS = 90 * 1000; // 90 seconds

    // Check if THIS session is still valid (if another device logged in and kicked us out)
    const checkSession = async () => {
      // Skip validation during grace period
      const elapsed = Date.now() - mountTime;
      if (elapsed < GRACE_PERIOD_MS) {
        console.log(`Grace period: ${Math.floor((GRACE_PERIOD_MS - elapsed) / 1000)}s remaining`);
        return; // Don't check yet, new login is establishing
      }
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user || !user.user) {
          // Not logged in, skip
          return;
        }

        // Check if OUR token is still valid in database
        // If another device logged in, our token was invalidated
        const { data, error } = await supabase.rpc('check_device_session', {
          p_device_id: deviceId,
          p_session_token: sessionToken
        });

        if (error) {
          console.log('Session check error:', error.message);
          return;
        }

        // If our token is invalid, we were kicked out by another device
        if (data && !data.valid) {
          console.log('You were logged out because another device logged in with your account');
          localStorage.removeItem('session_token');
          await supabase.auth.signOut();
          if (onSessionInvalid) {
            onSessionInvalid('Your session was ended because another device logged in');
          }
          return;
        }

        // Session is valid, update heartbeat
        await supabase.rpc('update_device_session', {
          p_device_id: deviceId
        });
      } catch (error) {
        console.log('Session monitor error:', error.message);
      }
    };

    // Check immediately on mount
    checkSession();

    // Then check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [onSessionInvalid]);

  return null; // This component doesn't render anything
}

export default SessionMonitor;
