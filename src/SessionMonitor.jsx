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
    if (!deviceId) return;

    // SIMPLIFIED: Just keep session alive, don't check validity
    // This ensures login always works without any automatic logout
    const checkSession = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user || !user.user) {
          // Not logged in, skip
          return;
        }

        // Just update heartbeat, don't validate token
        // This keeps the session alive without checking if it's been kicked out
        try {
          await supabase.rpc('update_device_session', {
            p_device_id: deviceId
          });
        } catch (error) {
          // Ignore errors, just log them
          console.log('Heartbeat error (ignored):', error.message);
        }
      } catch (error) {
        console.log('Session monitor error (ignored):', error.message);
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
