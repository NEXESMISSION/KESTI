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

    // Check session validity every 30 seconds
    const checkSession = async () => {
      try {
        const { data: user } = await supabase.auth.getUser();
        
        if (!user || !user.user) {
          // Not logged in, skip check
          return;
        }

        const sessionToken = getSessionToken();
        if (!sessionToken) {
          // No session token, can't validate
          return;
        }

        // Check if our session token is still valid
        const { data, error } = await supabase.rpc('check_device_session', {
          p_device_id: deviceId,
          p_session_token: sessionToken
        });

        if (error) {
          console.error('Session check error:', error);
          return;
        }

        // If token doesn't match (someone else logged in), log out
        if (data && !data.valid) {
          console.log('Session invalidated:', data.message);
          localStorage.removeItem('session_token'); // Clear invalid token
          await supabase.auth.signOut();
          if (onSessionInvalid) {
            onSessionInvalid(data.message);
          }
          return;
        }

        // Update session activity (heartbeat)
        await supabase.rpc('update_device_session', {
          p_device_id: deviceId
        });
      } catch (error) {
        console.error('Session monitor error:', error);
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
