import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'

export default function EmergencyLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const router = useRouter()

  // Check current session on load
  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setMessage('You already have a session')
        setSessionInfo(data.session)
        
        // Try to get profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.session.user.id)
          .single()
        
        setProfileInfo(profile)
      }
    }
    
    checkSession()
  }, [])

  // Handle login
  const handleLogin = async () => {
    try {
      setStatus('loading')
      setMessage('Logging in...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setStatus('error')
        setMessage(`Login error: ${error.message}`)
        return
      }
      
      setStatus('success')
      setMessage('Login successful!')
      setSessionInfo(data.session)
      
      // Get profile after login
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        setMessage((prev: string) => `${prev}\nProfile error: ${profileError.message}`)
        return
      }
      
      setProfileInfo(profile)
      setMessage((prev: string) => `${prev}\nProfile loaded: Role = ${profile?.role?.toString() || 'unknown'}`)
    } catch (err: any) {
      setStatus('error')
      setMessage(`Unexpected error: ${err.message}`)
    }
  }

  // Navigation functions
  const goToSuperAdmin = () => {
    window.location.href = '/super-admin'
  }
  
  const goToPos = () => {
    window.location.href = '/pos'
  }
  
  const goToLogin = () => {
    window.location.href = '/login'
  }
  
  const goToSimpleLogin = () => {
    window.location.href = '/simple-login'
  }
  
  const signOut = async () => {
    await supabase.auth.signOut()
    setMessage('Signed out')
    setSessionInfo(null)
    setProfileInfo(null)
    setStatus('idle')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Emergency Login Page</h1>
      
      <div className="mb-8 p-4 bg-yellow-50 border border-yellow-300 rounded">
        <p className="font-medium">This is a special emergency login page to diagnose issues</p>
      </div>
      
      {/* Status/message display */}
      {message && (
        <div className={`mb-8 p-4 rounded ${
          status === 'error' ? 'bg-red-50 border border-red-300' :
          status === 'success' ? 'bg-green-50 border border-green-300' :
          'bg-blue-50 border border-blue-300'
        }`}>
          <pre className="whitespace-pre-wrap">{message}</pre>
        </div>
      )}
      
      {/* Login form */}
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Login</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="username email"
            />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              autoComplete="current-password"
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={status === 'loading'}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {status === 'loading' ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
      
      {/* Navigation buttons */}
      <div className="mb-8 p-4 bg-white rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Navigation</h2>
        <div className="flex flex-wrap gap-4">
          <button onClick={goToSuperAdmin} className="px-4 py-2 bg-purple-500 text-white rounded">
            Go to Super Admin
          </button>
          <button onClick={goToPos} className="px-4 py-2 bg-green-500 text-white rounded">
            Go to POS
          </button>
          <button onClick={goToLogin} className="px-4 py-2 bg-gray-500 text-white rounded">
            Go to Normal Login
          </button>
          <button onClick={goToSimpleLogin} className="px-4 py-2 bg-gray-500 text-white rounded">
            Go to Simple Login
          </button>
          <button onClick={signOut} className="px-4 py-2 bg-red-500 text-white rounded">
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Debug information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Session info */}
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Session Info</h2>
          <div className="max-h-60 overflow-auto">
            <pre className="text-xs">{JSON.stringify(sessionInfo, null, 2)}</pre>
          </div>
        </div>
        
        {/* Profile info */}
        <div className="p-4 bg-white rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Profile Info</h2>
          <div className="max-h-60 overflow-auto">
            <pre className="text-xs">{JSON.stringify(profileInfo, null, 2)}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
