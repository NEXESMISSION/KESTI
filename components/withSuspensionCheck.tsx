import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { ComponentType } from 'react'

// Higher Order Component that checks if user is suspended or subscription expired
export function withSuspensionCheck<P extends object>(
  Component: ComponentType<P>
) {
  return function WithSuspensionCheck(props: P) {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [isSuspended, setIsSuspended] = useState(false)
    const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false)
    const errorCountRef = useRef(0)

    useEffect(() => {
      // Wait for router to be ready
      if (!router.isReady) return

      let isNavigating = false
      let lastCheckTime = 0
      const CHECK_DEBOUNCE = 1000 // 1 second debounce
      const MAX_ERRORS = 3 // Stop retrying after 3 errors

      const checkUserStatus = async () => {
        // Prevent duplicate navigation attempts
        if (isNavigating) return
        
        // Stop retrying if too many errors (prevents 500 error flood)
        if (errorCountRef.current >= MAX_ERRORS) {
          setLoading(false)
          return
        }
        
        // Debounce checks to prevent rapid fire
        const now = Date.now()
        if (now - lastCheckTime < CHECK_DEBOUNCE) return
        lastCheckTime = now

        try {
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            setLoading(false)
            errorCountRef.current = 0
            return
          }
          
          // Check user status (suspension and subscription)
          const { data, error } = await supabase
            .from('profiles')
            .select('is_suspended, subscription_ends_at')
            .eq('id', session.user.id)
            .single()
            
          if (error) {
            console.error('Error checking user status:', error)
            errorCountRef.current += 1
            setLoading(false)
            return
          }
          
          // Reset error count on success
          errorCountRef.current = 0
          
          // Check suspension status
          if (data?.is_suspended === true) {
            setIsSuspended(true)
            // Only redirect if not already on the suspended page
            if (router.pathname !== '/suspended') {
              isNavigating = true
              await router.replace('/suspended')
            }
            return
          }
          
          // Check subscription status
          let subscriptionExpired = false
          if (data.subscription_ends_at) {
            const now = new Date()
            const expiryDate = new Date(data.subscription_ends_at)
            subscriptionExpired = expiryDate < now
          } else {
            // If subscription_ends_at is null, treat as NOT expired (valid)
            subscriptionExpired = false
          }
          
          if (subscriptionExpired) {
            setIsSubscriptionExpired(true)
            // Only redirect if not already on the subscription-expired page
            if (router.pathname !== '/subscription-expired') {
              isNavigating = true
              await router.replace('/subscription-expired')
            }
            return
          }
          
          setLoading(false)
        } catch (err) {
          console.error('Error in user status check:', err)
          setLoading(false)
        }
      }
      
      // Check user status immediately when component mounts
      checkUserStatus()
      
      // Set up interval to check user status every 30 seconds
      const intervalId = setInterval(checkUserStatus, 30000)
      
      return () => {
        clearInterval(intervalId)
        isNavigating = false
      }
    }, [router.isReady, router.pathname])
    
    // If checking suspension status, show nothing
    if (loading) {
      return null
    }
    
    // If suspended or subscription expired, don't render the component at all
    if (isSuspended || isSubscriptionExpired) {
      return null
    }
    
    // Not suspended, render the original component
    return <Component {...props} />
  }
}

export default withSuspensionCheck
