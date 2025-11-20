import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'

// This page is for suspended users only
export default function Suspended() {
  const router = useRouter()
  const [suspensionMessage, setSuspensionMessage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSuspensionMessage = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If not logged in, redirect to login
        if (!session) {
          console.log('No session - redirecting to login')
          window.location.href = '/login'
          return
        }

        // Get the user's profile with suspension message
        const { data, error } = await supabase
          .from('profiles')
          .select('suspension_message, is_suspended, role')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          throw error
        }

        console.log('Checking suspension status:', data.is_suspended)
        
        // If not suspended, redirect to appropriate page
        if (data.is_suspended !== true) {
          console.log('User is not suspended - redirecting')
          
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

        console.log('User is suspended - showing message')
        // Use the custom message or default
        setSuspensionMessage(data.suspension_message || 'Your account has been suspended by the administrator.')
      } catch (err) {
        console.error('Error fetching suspension message:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSuspensionMessage()
  }, [])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      localStorage.clear()
      sessionStorage.clear()
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.replace('/login?logout=true')
    } catch (error) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login?logout=true')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500 p-4">
      <Head>
        <title>Account Suspended - Kesti POS</title>
      </Head>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center">
        {loading ? (
          <div className="py-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <svg
                className="mx-auto h-24 w-24 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            <h1 className="text-3xl font-bold text-gray-800 mb-4">Account Suspended</h1>
            
            {/* Custom Suspension Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700">
                {suspensionMessage}
              </p>
            </div>
            
            <p className="text-gray-600 mb-6">
              Please contact your administrator to restore your account access.
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
              <strong>Need help?</strong> Contact support to restore your account access.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}
