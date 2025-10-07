import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'

export default function LoginEmergency() {
  // State variables
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [sessionChecked, setSessionChecked] = useState(false)
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // User is already logged in, get their profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          if (profile) {
            setSuccess("You're already logged in! Redirecting...")
            
            // Default redirect based on user role
            const userRole = typeof profile.role === 'object' ? 
              profile.role.toString() : String(profile.role)
            
            // Immediate hard redirect
            setTimeout(() => {
              if (userRole === 'super_admin') {
                document.location.href = '/super-admin'
              } else if (userRole === 'business_user') {
                document.location.href = '/pos'
              }
            }, 1000)
          }
        }
      } catch (err) {
        console.error("Error checking session:", err)
      } finally {
        setSessionChecked(true)
      }
    }
    
    checkSession()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Capture the exact time to show in log
      const loginTime = new Date().toISOString()
      console.log(`Login attempt at ${loginTime} for ${email}`)
      
      // Step 1: Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        setError(signInError.message)
        setLoading(false)
        return
      }
      
      if (!data.session) {
        setError('No session returned from authentication')
        setLoading(false)
        return
      }
      
      // Step 2: Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        setError(`Profile error: ${profileError.message}`)
        setLoading(false)
        return
      }
      
      if (!profile) {
        setError('No profile found for user')
        setLoading(false)
        return
      }
      
      // Get the role
      const userRole = typeof profile.role === 'object' ? 
        profile.role.toString() : String(profile.role)
      
      // Show success message
      setSuccess(`Login successful! Redirecting as ${userRole}...`)
      
      // Emergency mode: Set cookies manually
      document.cookie = `sb-access-token=${data.session.access_token}; path=/`
      document.cookie = `sb-refresh-token=${data.session.refresh_token}; path=/`
      
      // Hard redirect after delay to ensure cookies are set
      setTimeout(() => {
        if (userRole === 'super_admin') {
          document.location.href = '/super-admin'
        } else if (userRole === 'business_user') {
          document.location.href = '/pos'
        } else {
          setError(`Unknown role: ${userRole}`)
          setLoading(false)
        }
      }, 1000)
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to login. Please check your credentials.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-500 to-orange-500 p-4">
      <Head>
        <title>Emergency Login - Kesti POS</title>
      </Head>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Emergency Login</h1>
          <p className="text-gray-600">Direct access mode with hard navigation</p>
        </div>

        {!sessionChecked ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="mt-4 text-gray-600">Checking session...</p>
          </div>
        ) : (
          <>
            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                {success}
                <div className="mt-4">
                  <div className="animate-pulse flex space-x-4">
                    <div className="flex-1 space-y-2">
                      <div className="h-2 bg-green-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition
                    ${loading ? 'bg-gray-400' : 'bg-primary hover:bg-primary-dark'}
                  `}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <span className="mr-2">Logging in...</span>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    </span>
                  ) : (
                    'Sign In - Emergency Mode'
                  )}
                </button>

                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Use this login if the normal login page is having issues.
                  </p>
                  <p className="text-gray-600 mt-2">
                    This uses direct browser navigation to prevent redirect loops.
                  </p>
                </div>
              </form>
            )}
          </>
        )}
        
        <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-lg text-sm">
          <p className="font-bold">⚠️ Emergency Mode</p>
          <p className="mt-1">
            This login page uses direct browser navigation with manual cookie handling.
          </p>
        </div>
      </div>
    </div>
  )
}
