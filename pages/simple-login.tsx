import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

export default function SimpleLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debug, setDebug] = useState<any>(null)
  const router = useRouter()
  
  // Check if user is already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // User is already logged in, get their profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          // Check if there's a redirectUrl in the query parameters
          const redirectUrl = router.query.redirectUrl as string
          
          if (redirectUrl && !redirectUrl.includes('/login')) {
            // Redirect to the original URL the user was trying to access
            router.push(redirectUrl)
          } else {
            // Default redirect based on user role
            const userRole = typeof profile.role === 'object' ? 
              profile.role.toString() : String(profile.role)
            
            if (userRole === 'super_admin') {
              router.push('/super-admin')
            } else if (userRole === 'business_user') {
              router.push('/pos')
            }
          }
        }
      }
    }
    
    checkSession()
  }, [router.isReady, router.query, router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    setDebug(null)

    try {
      // Step 1: Sign in
      setDebug('Signing in...')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(`Auth error: ${authError.message}`)
        setDebug(authError)
        return
      }

      if (!data.session) {
        setError('No session returned')
        return
      }

      setSuccess(`Logged in as ${data.user?.email}`)
      setDebug(data)

      // Step 2: Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        setError(`Profile error: ${profileError.message}`)
        setDebug({...debug, profileError})
        return
      }

      setSuccess((prev: string | null) => prev ? `${prev}, Role: ${profile?.role?.toString() || 'unknown'}` : `Role: ${profile?.role?.toString() || 'unknown'}`)
      setDebug((prev: any) => ({...prev, profile}))

      // Step 3: Navigation based on role
      const userRole = profile?.role?.toString() || ''
      
      // Check if there's a redirectUrl in the query parameters
      const redirectUrl = router.query.redirectUrl as string
      
      if (redirectUrl && !redirectUrl.includes('/login')) {
        // Redirect to the original URL the user was trying to access
        router.push(redirectUrl)
      } else {
        // Default navigation based on role
        if (userRole === 'super_admin') {
          router.push('/super-admin')
        } else if (userRole === 'business_user') {
          router.push('/pos')
        } else {
          setError(`Unknown role: ${userRole}`)
        }
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err.message || 'Unknown error'}`)
      setDebug(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">Simple Login Test</h1>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded">
            <strong>Success:</strong> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username email"
              className="w-full p-2 border rounded"
              placeholder="Email address"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full p-2 border rounded"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Debug info */}
        {debug && (
          <div className="mt-8 p-4 bg-gray-50 rounded overflow-auto max-h-60">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre className="text-xs">{JSON.stringify(debug, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  )
}
