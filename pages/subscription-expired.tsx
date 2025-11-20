import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'

// This page is for users with expired subscriptions only
export default function SubscriptionExpired() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    expiryDate: '',
    fullName: '',
    email: '',
  })

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If not logged in, redirect to login
        if (!session) {
          console.log('No session - redirecting to login')
          window.location.href = '/login'
          return
        }

        // Get the user's profile with subscription info
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_ends_at, is_suspended, role, full_name, email')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          throw error
        }

        // Format the expiry date for display
        const expiryDate = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null
        const formattedDate = expiryDate ? expiryDate.toLocaleDateString() : 'Not set'
        
        setSubscriptionInfo({
          expiryDate: formattedDate,
          fullName: data.full_name || '',
          email: data.email || '',
        })

        console.log('Checking subscription status:', data.subscription_ends_at)
        
        // If suspended, redirect to suspended page
        if (data.is_suspended === true) {
          console.log('User is suspended - redirecting to suspended page')
          window.location.href = '/suspended'
          return
        }
        
        // Check if subscription is expired or not set (null is valid)
        let subscriptionExpired = false
        if (data.subscription_ends_at) {
          const now = new Date()
          const expiryDate = new Date(data.subscription_ends_at)
          subscriptionExpired = expiryDate < now
        } else {
          // If subscription_ends_at is null, treat as NOT expired (valid)
          subscriptionExpired = false
        }
        
        // If subscription is not expired, redirect to appropriate page
        if (!subscriptionExpired) {
          console.log('Subscription is still active or null (valid) - redirecting')
          
          // Get user role and redirect appropriately
          const userRole = typeof data.role === 'object' ? 
            data.role.toString() : String(data.role)
          
          if (userRole === 'super_admin') {
            window.location.href = '/super-admin'
          } else {
            window.location.href = '/pos'
          }
          return
        }

        console.log('Subscription is expired - showing renewal message')
      } catch (err) {
        console.error('Error checking subscription:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkSubscription()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 to-yellow-500 p-4">
      <Head>
        <title>Subscription Expired - Kesti POS</title>
      </Head>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        {loading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-orange-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Subscription Expired</h1>
            
            {/* Subscription Information */}
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
              <p className="text-orange-700 mb-2">
                Your subscription for <strong>{subscriptionInfo.fullName}</strong> has expired on <strong>{subscriptionInfo.expiryDate}</strong>.
              </p>
              <p className="text-orange-700">
                Please renew your subscription to continue using the system.
              </p>
            </div>
            
            <p className="text-gray-600 mb-6">
              Contact your administrator to renew your subscription.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <h3 className="font-bold text-blue-800 text-lg mb-2">Need Help?</h3>
              <p className="text-blue-700 mb-2">
                Contact support at: <a href="mailto:support@kesti.com" className="underline">support@kesti.com</a>
              </p>
              <p className="text-blue-700 mb-0">
                Or call: <span className="font-semibold">+1 (123) 456-7890</span>
              </p>
            </div>
          </>
        )}

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Need help?</strong> Contact support to renew your subscription.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
