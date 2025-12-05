import { supabase, Profile } from './supabase'

/**
 * Checks if the current user is authenticated and returns their session
 */
export async function checkAuth() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * Gets the current user's profile
 */
export async function getUserProfile() {
  const session = await checkAuth()
  
  if (!session) {
    return null
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single()
    
  if (error || !data) {
    return null
  }
  
  return data as Profile
}

/**
 * Checks if the current user is a super admin
 */
export async function isSuperAdmin() {
  const profile = await getUserProfile()
  return profile?.role === 'super_admin'
}

/**
 * Checks if the current user is a business user
 */
export async function isBusinessUser() {
  const profile = await getUserProfile()
  return profile?.role === 'business_user'
}

/**
 * Checks if the account is suspended or subscription expired
 * Super admins always return true (bypass all checks)
 */
export async function isAccountActive() {
  const profile = await getUserProfile()
  
  if (!profile) {
    return false
  }
  
  // Super admins are always active (bypass suspension and expiration)
  if (profile.role === 'super_admin') {
    return true
  }
  
  // Check if manually suspended
  if (profile.is_suspended) {
    return false
  }
  
  // Check if subscription expired
  if (profile.subscription_ends_at) {
    const expiryDate = new Date(profile.subscription_ends_at)
    const now = new Date()
    if (expiryDate < now) {
      return false
    }
  }
  
  return true
}

/**
 * Gets the days remaining in the subscription
 */
export function getSubscriptionDaysLeft(profile: Profile) {
  if (!profile.subscription_ends_at) {
    return 0
  }
  
  const expiryDate = new Date(profile.subscription_ends_at)
  const now = new Date()
  const diffTime = expiryDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return diffDays < 0 ? 0 : diffDays
}

/**
 * Verifies a business PIN code
 */
export async function verifyBusinessPin(pin: string) {
  if (!pin) {
    return false
  }
  
  try {
    const { data, error } = await supabase.rpc('verify_business_pin', {
      input_pin: pin
    })
    
    if (error) {
      console.error('PIN verification error:', error)
      return false
    }
    
    return data === true
  } catch (err) {
    console.error('Unexpected PIN verification error:', err)
    return false
  }
}
