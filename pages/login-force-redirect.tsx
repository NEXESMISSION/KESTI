import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'
import { useRouter } from 'next/router'

export default function LoginForceRedirect() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const router = useRouter()

  // Check if already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Get session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          setDebugInfo((prev: any) => ({ ...prev, session }))
          
          // Get profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (profileError) {
            setError(`Profile error: ${profileError.message}`)
            return
          }
          
          if (!profile) {
            setError('Profile not found')
            return
          }
          
          setDebugInfo((prev: any) => ({ ...prev, profile }))
          
          // Force navigation based on role
          const userRole = typeof profile.role === 'object' ? 
            profile.role.toString() : String(profile.role)
          
          if (userRole === 'super_admin') {
            window.location.href = '/super-admin' // Force hard navigation
          } else if (userRole === 'business_user') {
            window.location.href = '/pos' // Force hard navigation
          } else {
            setError(`Unknown role: ${userRole}`)
          }
        }
      } catch (err: any) {
        console.error('Auth check error:', err)
        setError(`Auth check error: ${err.message}`)
      }
    }
    
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setLoading(true)
      setError(null)
      setDebugInfo(null)
      
      // Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (signInError) {
        setError(`Login error: ${signInError.message}`)
        setDebugInfo({ signInError })
        return
      }
      
      if (!data || !data.session) {
        setError('No session returned')
        setDebugInfo({ data })
        return
      }
      
      setDebugInfo({ session: data.session })
      
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        setError(`Profile error: ${profileError.message}`)
        setDebugInfo((prev: any) => ({ ...prev, profileError }))
        return
      }
      
      if (!profile) {
        setError('Profile not found')
        return
      }
      
      setDebugInfo((prev: any) => ({ ...prev, profile }))
      
      // Determine role and navigate
      const userRole = typeof profile.role === 'object' ? 
        profile.role.toString() : String(profile.role)
      
      // Force hard navigation (more reliable than router.push)
      if (userRole === 'super_admin') {
        window.location.href = '/super-admin'
      } else if (userRole === 'business_user') {
        window.location.href = '/pos'
      } else {
        setError(`Unknown role: ${userRole}`)
      }
      
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`)
      setDebugInfo({ error: err })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head>
        <title>Login - Force Redirect</title>
        <meta name="description" content="Login with force redirect" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-500 to-blue-600 p-6">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-2xl font-bold text-blue-600 mb-6">Kesti POS Login</h1>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="email@example.com"
                required
                autoComplete="username email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded-lg"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          
          {debugInfo && (
            <div className="mt-8">
              <h2 className="font-bold mb-2">Debug Info:</h2>
              <div className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-60">
                <pre className="text-xs">{JSON.stringify(debugInfo, null, 2)}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
