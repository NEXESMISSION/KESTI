import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase, Profile } from '@/lib/supabase'
import { getErrorMessage } from '@/lib/utils'

/**
 * Hook for authentication-related functionality
 */
export default function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load user on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (profileError) {
            throw profileError
          }
          
          setUser(profile)
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }
    
    fetchUser()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        // When session exists, fetch profile data
        const fetchProfile = async () => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (profileError) {
            console.error('Error fetching profile:', profileError)
            setUser(null)
          } else {
            setUser(profile)
          }
        }
        fetchProfile()
      } else {
        setUser(null)
      }
    })
    
    // Clean up subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) throw signInError
      
      if (data.session) {
        // Store tokens in cookies
        document.cookie = `sb-access-token=${data.session.access_token}; path=/; max-age=3600`
        document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/; max-age=3600`
        
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
          
        if (profileError) throw profileError
        
        setUser(profile)
        
        // Redirect based on role using Next.js router for proper client-side navigation
        if (profile.role === 'super_admin') {
          router.push('/super-admin')
        } else if (profile.role === 'business_user') {
          router.push('/pos')
        }
        
        return { success: true }
      }
      
      return { success: false, error: 'Authentication failed' }
    } catch (err) {
      console.error('Sign in error:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Sign out
  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      
      // Clear cookies
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      
      // Use router.replace for logout to prevent back button navigation
      router.replace('/login')
      return { success: true }
    } catch (err) {
      console.error('Sign out error:', err)
      setError(getErrorMessage(err))
      return { success: false, error: getErrorMessage(err) }
    }
  }
  
  // Verify business owner PIN
  const verifyPin = async (pin: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error } = await supabase.rpc('verify_business_pin', {
        input_pin: pin,
      })
      
      if (error) throw error
      
      return { success: data === true, verified: data === true }
    } catch (err) {
      console.error('PIN verification error:', err)
      setError(getErrorMessage(err))
      return { success: false, verified: false, error: getErrorMessage(err) }
    } finally {
      setLoading(false)
    }
  }
  
  // Check if subscription is active
  const isSubscriptionActive = () => {
    if (!user) return false
    if (user.is_suspended) return false
    
    if (user.subscription_ends_at) {
      const expiryDate = new Date(user.subscription_ends_at)
      const now = new Date()
      return expiryDate > now
    }
    
    return false
  }
  
  // Check if user is super admin
  const isSuperAdmin = () => {
    if (!user?.role) return false
    return user.role.toString() === 'super_admin'
  }
  
  // Check if user is business user
  const isBusinessUser = () => {
    if (!user?.role) return false
    return user.role.toString() === 'business_user'
  }
  
  return {
    user,
    loading,
    error,
    signIn,
    signOut,
    verifyPin,
    isSubscriptionActive,
    isSuperAdmin,
    isBusinessUser,
    setError,
  }
}
