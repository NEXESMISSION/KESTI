/**
 * Device Manager Utility
 * Handles device identification, registration, and session enforcement
 */

import { supabase } from '@/lib/supabase'

const STORAGE_KEY = 'kesti_device_id'

/**
 * Generate a UUID compatible with all browsers (including older mobile browsers)
 * Falls back to a custom implementation if crypto.randomUUID is not available
 */
function generateUUID(): string {
  // Try modern API first (secure contexts in modern browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID()
    } catch (e) {
      // Fall through to fallback
    }
  }
  
  // Fallback: Use crypto.getRandomValues if available (works in most browsers)
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    try {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      // Set version (4) and variant bits
      bytes[6] = (bytes[6] & 0x0f) | 0x40
      bytes[8] = (bytes[8] & 0x3f) | 0x80
      // Convert to hex string
      const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    } catch (e) {
      // Fall through to final fallback
    }
  }
  
  // Final fallback: Math.random based (works everywhere, less secure but sufficient for device IDs)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Get or create a persistent device identifier
 * This ID persists across sessions and logins
 */
export function getLocalDeviceId(): string {
  if (typeof window === 'undefined') {
    return '' // Server-side, return empty
  }

  try {
    let deviceId = localStorage.getItem(STORAGE_KEY)
    
    if (!deviceId) {
      // Generate a random UUID if one doesn't exist
      deviceId = generateUUID()
      localStorage.setItem(STORAGE_KEY, deviceId)
    }
    
    return deviceId
  } catch (e) {
    // localStorage might be unavailable (private browsing, etc.)
    console.warn('Unable to access localStorage for device ID:', e)
    return generateUUID() // Return a temporary ID
  }
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

  try {
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
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
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) deviceName += ' on iOS'
    
    return {
      name: deviceName,
      userAgent: ua,
    }
  } catch (e) {
    console.warn('Unable to get device info:', e)
    return {
      name: 'Unknown Device',
      userAgent: '',
    }
  }
}

/**
 * Register the current device with the backend
 * Call this immediately after successful login
 * Super admins and admin see-through sessions skip device registration (no device limits)
 */
export async function registerCurrentDevice(): Promise<{
  success: boolean
  message?: string
  error?: string
  kicked?: boolean
  kickedDevice?: string
}> {
  try {
    // Check if this is an admin see-through session
    if (typeof window !== 'undefined') {
      const isSeeThroughSession = localStorage.getItem('admin_see_through') === 'true'
      if (isSeeThroughSession) {
        console.log('👁️ Admin see-through session - skipping device registration')
        return {
          success: true,
          message: 'Admin see-through - no device limits',
        }
      }
    }

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
 * Super admins and admin see-through sessions are always authorized (no device limits)
 */
export async function isDeviceAuthorized(): Promise<boolean> {
  try {
    // Check if this is an admin see-through session
    if (typeof window !== 'undefined') {
      const isSeeThroughSession = localStorage.getItem('admin_see_through') === 'true'
      if (isSeeThroughSession) {
        console.log('👁️ Admin see-through session - bypassing device authorization check')
        return true
      }
    }

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
 * Super admins and admin see-through sessions skip this since they don't have tracked devices
 */
export async function updateDeviceActivity(): Promise<void> {
  try {
    // Check if this is an admin see-through session
    if (typeof window !== 'undefined') {
      const isSeeThroughSession = localStorage.getItem('admin_see_through') === 'true'
      if (isSeeThroughSession) {
        return // Don't track activity for see-through sessions
      }
    }

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
 * Super admins and admin see-through sessions are exempt from device limits
 */
export async function enforceDeviceLimit(): Promise<void> {
  try {
    // Check if this is an admin see-through session - skip enforcement
    if (typeof window !== 'undefined') {
      const isSeeThroughSession = localStorage.getItem('admin_see_through') === 'true'
      if (isSeeThroughSession) {
        console.log('👁️ Admin see-through session - skipping device limit enforcement')
        return
      }
    }

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

    const { data, error } = await supabase
      .from('active_devices')
      .select('*')
      .eq('user_id', user.id)
      .order('last_active_at', { ascending: false })

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
    const { error } = await supabase
      .from('active_devices')
      .delete()
      .eq('id', deviceId)

    if (error) {
      console.error('Error removing device:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in removeDevice:', error)
    return false
  }
}
