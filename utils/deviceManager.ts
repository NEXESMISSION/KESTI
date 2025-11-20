/**
 * Device Manager Utility
 * Handles device identification, registration, and session enforcement
 */

import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'kesti_device_id'

/**
 * Get or create a persistent device identifier
 * This ID persists across sessions and logins
 */
export function getLocalDeviceId(): string {
  if (typeof window === 'undefined') {
    return '' // Server-side, return empty
  }

  let deviceId = localStorage.getItem(STORAGE_KEY)
  
  if (!deviceId) {
    // Generate a random UUID if one doesn't exist
    deviceId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, deviceId)
  }
  
  return deviceId
}

/**
 * Get device information for better tracking
 */
export function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return {
      name: 'Server',
      userAgent: '',
    }
  }

  const ua = navigator.userAgent
  let deviceName = 'Unknown Device'
  
  // Detect browser
  if (ua.includes('Chrome')) deviceName = 'Chrome'
  else if (ua.includes('Safari')) deviceName = 'Safari'
  else if (ua.includes('Firefox')) deviceName = 'Firefox'
  else if (ua.includes('Edge')) deviceName = 'Edge'
  
  // Detect OS
  if (ua.includes('Windows')) deviceName += ' on Windows'
  else if (ua.includes('Mac')) deviceName += ' on macOS'
  else if (ua.includes('Linux')) deviceName += ' on Linux'
  else if (ua.includes('Android')) deviceName += ' on Android'
  else if (ua.includes('iOS')) deviceName += ' on iOS'
  
  return {
    name: deviceName,
    userAgent: ua,
  }
}

/**
 * Register the current device with the backend
 * Call this immediately after successful login
 * Super admins skip device registration (no device limits)
 */
export async function registerCurrentDevice(): Promise<{
  success: boolean
  message?: string
  error?: string
  kicked?: boolean
  kickedDevice?: string
}> {
  try {
    // Check if user is a super admin
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      // Super admins don't need device registration
      if (profile && profile.role === 'super_admin') {
        console.log('🔑 Super admin - skipping device registration')
        return {
          success: true,
          message: 'Super admin - no device limits',
        }
      }
    }

    const deviceId = getLocalDeviceId()
    const deviceInfo = getDeviceInfo()

    // Call the RPC function to register the device
    const { data, error } = await supabase.rpc('register_device_session', {
      p_device_identifier: deviceId,
      p_device_name: deviceInfo.name,
      p_user_agent: deviceInfo.userAgent,
      p_ip_address: null, // IP detection would need a backend service
    })

    if (error) {
      console.error('Error registering device:', error)
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('Device registration response:', data)
    
    return {
      success: data?.success || true,
      message: data?.message,
      kicked: data?.action === 'kicked_and_registered',
      kickedDevice: data?.kicked_device,
    }
  } catch (error: any) {
    console.error('Error in registerCurrentDevice:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Check if the current device is still authorized
 * Returns true if authorized, false if kicked out
 * Super admins are always authorized (no device limits)
 */
export async function isDeviceAuthorized(): Promise<boolean> {
  try {
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return true // Not logged in, nothing to check
    }

    // Check if user is a super admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    // Super admins bypass device limits
    if (profile && profile.role === 'super_admin') {
      console.log('🔑 Super admin detected - bypassing device limit check')
      return true
    }

    const deviceId = getLocalDeviceId()
    
    // Check if this device exists in the database
    const { data, error } = await supabase
      .from('active_devices')
      .select('id')
      .eq('device_identifier', deviceId)
      .maybeSingle()

    if (error) {
      console.error('Error checking device authorization:', error)
      return true // Don't kick out on error
    }

    // If data is null, device was removed (kicked out)
    return data !== null
  } catch (error) {
    console.error('Error in isDeviceAuthorized:', error)
    return true // Don't kick out on error
  }
}

/**
 * Update the last active timestamp for this device
 * Call this periodically to keep the device "fresh"
 * Super admins skip this since they don't have tracked devices
 */
export async function updateDeviceActivity(): Promise<void> {
  try {
    // Check if user is a super admin
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle()

      // Super admins don't have tracked devices
      if (profile && profile.role === 'super_admin') {
        return
      }
    }

    const deviceId = getLocalDeviceId()
    
    await supabase
      .from('active_devices')
      .update({ last_active_at: new Date().toISOString() })
      .eq('device_identifier', deviceId)
  } catch (error) {
    console.error('Error updating device activity:', error)
  }
}

/**
 * Enforce device limit - checks if current device is still authorized
 * If not authorized, logs out the user
 * Super admins are exempt from device limits
 */
export async function enforceDeviceLimit(): Promise<void> {
  try {
    // Prevent multiple simultaneous enforcement checks (loop prevention)
    if (typeof window !== 'undefined' && (window as any).__enforcingDeviceLimit) {
      return
    }

    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return // Not logged in, nothing to enforce
    }

    // Check if user is a super admin - they bypass device limits
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle()

    if (profile && profile.role === 'super_admin') {
      // Super admins have no device limits
      console.log('🔑 Super admin - skipping device limit enforcement')
      return
    }

    // For business users, check if device is authorized
    const isAuthorized = await isDeviceAuthorized()
    
    if (!isAuthorized) {
      console.warn('🚫 Device session revoked. Logging out...')
      
      // Set flag to prevent multiple enforcement loops
      if (typeof window !== 'undefined') {
        (window as any).__enforcingDeviceLimit = true
      }
      
      // Fully clear the session (same as logout)
      try {
        await supabase.auth.signOut({ scope: 'local' })
      } catch (e) {
        console.error('Error signing out:', e)
      }
      
      // Clear all storage and cookies
      if (typeof window !== 'undefined') {
        // Save device ID before clearing (to maintain device identity)
        const deviceId = localStorage.getItem(STORAGE_KEY)
        
        // Clear cookies
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
        document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        
        // Clear storage
        localStorage.clear()
        sessionStorage.clear()
        
        // Restore device ID (preserve device identity)
        if (deviceId) {
          localStorage.setItem(STORAGE_KEY, deviceId)
        }
        
        // Small delay to ensure cleanup completes
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Redirect to login with device limit message
        window.location.replace('/login?reason=device_limit_exceeded')
      }
    } else {
      // Update activity timestamp to keep this device fresh
      await updateDeviceActivity()
    }
  } catch (error) {
    console.error('Error in enforceDeviceLimit:', error)
  }
}

/**
 * Get all devices for the current user
 */
export async function getUserDevices() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return { data: null, error: 'Not authenticated' }
    }

    const { data, error } = await supabase.rpc('get_user_devices', {
      p_user_id: user.id,
    })

    return { data, error }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

/**
 * Remove a specific device (self-service device management)
 */
export async function removeDevice(deviceId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('remove_device', {
      p_device_id: deviceId,
    })

    if (error) {
      console.error('Error removing device:', error)
      return false
    }

    return data || false
  } catch (error) {
    console.error('Error in removeDevice:', error)
    return false
  }
}
