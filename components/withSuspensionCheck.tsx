import { useEffect, useState } from 'react'
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

    useEffect(() => {
      const checkUserStatus = async () => {
        try {
          console.log('Checking user status...')
          const { data: { session } } = await supabase.auth.getSession()
          
          if (!session) {
            console.log('No session found, not checking user status')
            setLoading(false)
            return
          }
          
          // Check user status (suspension and subscription)
          console.log('Session found, checking user status...')
          const { data, error } = await supabase
            .from('profiles')
            .select('is_suspended, subscription_ends_at')
            .eq('id', session.user.id)
            .single()
            
          if (error) {
            console.error('Error checking user status:', error)
            setLoading(false)
            return
          }
          
          // Check suspension status
          console.log('User suspension status:', data?.is_suspended)
          if (data?.is_suspended === true) {
            console.log('User is suspended, redirecting to /suspended')
            setIsSuspended(true)
            // Only redirect if not already on the suspended page
            if (router.pathname !== '/suspended') {
              router.push('/suspended')
            }
            return
          }
          
          // Check subscription status
          let subscriptionExpired = false
          if (data.subscription_ends_at) {
            const now = new Date()
            const expiryDate = new Date(data.subscription_ends_at)
            subscriptionExpired = expiryDate < now
            console.log('Subscription expires:', expiryDate, 'Is expired:', subscriptionExpired)
          } else {
            // If subscription_ends_at is null, treat as NOT expired (valid)
            subscriptionExpired = false
            console.log('Subscription date is null, treating as valid (not expired)')
          }
          
          if (subscriptionExpired) {
            console.log('Subscription expired, redirecting to /subscription-expired')
            setIsSubscriptionExpired(true)
            // Only redirect if not already on the subscription-expired page
            if (router.pathname !== '/subscription-expired') {
              router.push('/subscription-expired')
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
      
      return () => clearInterval(intervalId)
    }, [router])
    
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
