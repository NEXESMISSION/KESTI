import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'
import { registerCurrentDevice } from '@/utils/deviceManager'

export default function Login() {
  // State variables
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionInfo, setSessionInfo] = useState<any>(null)
  const [profileInfo, setProfileInfo] = useState<any>(null)
  const [kickedDeviceMessage, setKickedDeviceMessage] = useState<string | null>(null)
  const router = useRouter()
  
  // Check if user is already logged in and handle device limit messages
  useEffect(() => {
    // Check for device limit exceeded reason
    if (router.query.reason === 'device_limit_exceeded') {
      setError('تم تسجيل الخروج: تم تجاوز حد الأجهزة. تم تسجيل دخول جهاز آخر.')
    }
    
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
          
          // Use hard navigation with window.location.href instead of router.push
          // This ensures the browser fully reloads the page and middleware works correctly
          if (redirectUrl && !redirectUrl.includes('/login')) {
            // Redirect to the original URL the user was trying to access
            window.location.href = redirectUrl
          } else {
            // Default redirect based on user role
            const userRole = typeof profile.role === 'object' ? 
              profile.role.toString() : String(profile.role)
            
            if (userRole === 'super_admin') {
              window.location.href = '/super-admin'
            } else if (userRole === 'business_user') {
              window.location.href = '/pos'
            }
          }
        }
      }
    }
    
    checkSession()
  }, [router.isReady, router.query])



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSessionInfo(null)
    setProfileInfo(null)
    
    try {
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
      
      // Save session info
      setSessionInfo(data.session)
      
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
      
      // Save profile info
      setProfileInfo(profile)
      
      // Step 3: Register device session
      const deviceResult = await registerCurrentDevice()
      
      if (deviceResult.kicked && deviceResult.kickedDevice) {
        setKickedDeviceMessage(
          `⚠️ تم تسجيل دخول جهاز جديد. تم إخراج: ${deviceResult.kickedDevice}`
        )
      }
      
      if (!deviceResult.success) {
        console.warn('Device registration failed:', deviceResult.error)
        // Continue login even if device registration fails
      }
      
      // Get the role
      const userRole = typeof profile.role === 'object' ? 
        profile.role.toString() : String(profile.role)
      
      // Check if there's a redirectUrl in the query parameters
      const redirectUrl = router.query.redirectUrl as string
      
      // Use hard navigation with window.location.href instead of router.push
      // This ensures the browser fully reloads the page and middleware works correctly
      if (redirectUrl && !redirectUrl.includes('/login')) {
        // Redirect to the original URL the user was trying to access
        window.location.href = redirectUrl
      } else {
        // Default navigation based on role
        if (userRole === 'super_admin') {
          window.location.href = '/super-admin'
        } else if (userRole === 'business_user') {
          window.location.href = '/pos'
        } else {
          setError(`Unknown role: ${userRole}`)
          setLoading(false)
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Failed to login. Please check your credentials.')
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary to-secondary p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image src="/logo/KESTi.png" alt="KESTI" width={180} height={60} className="h-14 w-auto" priority />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">نقطة البيع</h2>
          <p className="text-gray-600">سجل الدخول إلى حسابك</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {kickedDeviceMessage && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg">
              {kickedDeviceMessage}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="بريدك@مثال.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
              placeholder="أدخل كلمة المرور"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري تسجيل الدخول...
              </span>
            ) : (
              'تسجيل الدخول'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>KESTI - نقطة البيع - المرحلة الأولى</p>
        </div>
      </div>
    </div>
  )
}
