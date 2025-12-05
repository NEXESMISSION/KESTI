import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

interface SuspensionContextType {
  isSuspended: boolean
  isSubscriptionExpired: boolean
  suspensionMessage: string | null
  checkSuspension: () => Promise<{suspended: boolean, subscriptionExpired: boolean}>
}

// Create the context
const SuspensionContext = createContext<SuspensionContextType>({
  isSuspended: false,
  isSubscriptionExpired: false,
  suspensionMessage: null,
  checkSuspension: async () => ({ suspended: false, subscriptionExpired: false }),
})

// Public paths that don't need suspension or subscription checks
const PUBLIC_PATHS = [
  '/login',
  '/login-emergency',
  '/simple-login',
  '/emergency-login',
  '/login-force-redirect',
  '/force-login',
  '/suspended',
  '/subscription-expired',
  '/super-admin' // Super admins don't need these checks
]

export const SuspensionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isSuspended, setIsSuspended] = useState(false)
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false)
  const [suspensionMessage, setSuspensionMessage] = useState<string | null>(null)
  const [errorCount, setErrorCount] = useState(0)
  const router = useRouter()

  // Function to check if current user is suspended or has expired subscription
  const checkSuspension = async (): Promise<{ suspended: boolean; subscriptionExpired: boolean }> => {
    // If too many errors, stop trying (prevents infinite 500 error loops)
    if (errorCount >= 3) {
      return { suspended: false, subscriptionExpired: false }
    }
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // If no session, not suspended (not logged in)
      if (!session) {
        setIsSuspended(false)
        setIsSubscriptionExpired(false)
        setSuspensionMessage(null)
        setErrorCount(0)
        return { suspended: false, subscriptionExpired: false }
      }

      // Get user profile to check suspension status and subscription
      const { data, error } = await supabase
        .from('profiles')
        .select('is_suspended, suspension_message, subscription_ends_at, role')
        .eq('id', session.user.id)
        .single()

      if (error || !data) {
        console.error('Error checking user status:', error)
        // Increment error count to prevent infinite retries on 500 errors
        setErrorCount(prev => prev + 1)
        return { suspended: false, subscriptionExpired: false }
      }
      
      // Reset error count on success
      setErrorCount(0)

      // SUPER ADMINS BYPASS ALL CHECKS
      if (data.role === 'super_admin') {
        setIsSuspended(false)
        setIsSubscriptionExpired(false)
        setSuspensionMessage(null)
        return { suspended: false, subscriptionExpired: false }
      }

      // Check if suspended
      const suspended = !!data.is_suspended
      setIsSuspended(suspended)
      setSuspensionMessage(data.suspension_message)
      
      // Check if subscription is expired
      let subscriptionExpired = false
      if (data.subscription_ends_at) {
        const now = new Date()
        const expiryDate = new Date(data.subscription_ends_at)
        subscriptionExpired = expiryDate < now
      } else {
        // If subscription_ends_at is null, treat as NOT expired (valid)
        subscriptionExpired = false
      }
      
      setIsSubscriptionExpired(subscriptionExpired)
      
      return { suspended, subscriptionExpired }
    } catch (err) {
      console.error('Error in user status check:', err)
      return { suspended: false, subscriptionExpired: false }
    }
  }

  // Check suspension status when route changes or component mounts
  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return

    // CRITICAL: Don't check on public paths (including super-admin) - EARLY EXIT
    const isPublicPath = PUBLIC_PATHS.some(path => router.pathname.startsWith(path))
    if (isPublicPath) {
      console.log(`[SuspensionContext] Skipping checks for public path: ${router.pathname}`)
      return
    }

    let isNavigating = false
    let lastCheckTime = 0
    const CHECK_DEBOUNCE = 1000 // 1 second debounce

    // Check suspension and subscription status
    const handleStatusCheck = async () => {
      // Double-check: Don't run on public paths
      if (PUBLIC_PATHS.some(path => router.pathname.startsWith(path))) {
        console.log(`[SuspensionContext] Interval skipped for: ${router.pathname}`)
        return
      }
      
      // Prevent duplicate navigation attempts
      if (isNavigating) return
      
      // Debounce checks to prevent rapid fire
      const now = Date.now()
      if (now - lastCheckTime < CHECK_DEBOUNCE) return
      lastCheckTime = now

      const { suspended, subscriptionExpired } = await checkSuspension()
      
      // Check suspension status first (higher priority)
      if (suspended && router.pathname !== '/suspended') {
        isNavigating = true
        // Use replace to prevent back button navigation to restricted pages
        await router.replace('/suspended')
        return
      }
      
      // Then check subscription status
      if (subscriptionExpired && router.pathname !== '/subscription-expired' && !suspended) {
        isNavigating = true
        await router.replace('/subscription-expired')
        return
      }
    }

    // Check on mount and route change
    handleStatusCheck()

    // Set up interval to periodically check user status
    const intervalId = setInterval(handleStatusCheck, 30000)
    
    // Clean up interval on unmount
    return () => {
      clearInterval(intervalId)
      isNavigating = false
    }
  }, [router.isReady, router.pathname])

  return (
    <SuspensionContext.Provider value={{
      isSuspended,
      isSubscriptionExpired,
      suspensionMessage,
      checkSuspension
    }}>
      {children}
    </SuspensionContext.Provider>
  )
}

export const useSuspension = () => useContext(SuspensionContext)

export default SuspensionContext
