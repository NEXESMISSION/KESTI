import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import { registerCurrentDevice } from '@/utils/deviceManager'

// Function to translate error messages to Arabic
function translateErrorToArabic(error: string): string {
  const errorMap: { [key: string]: string } = {
    'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة',
    'Email not confirmed': 'البريد الإلكتروني غير مؤكد',
    'Invalid email': 'البريد الإلكتروني غير صحيح',
    'Invalid password': 'كلمة المرور غير صحيحة',
    'User not found': 'المستخدم غير موجود',
    'Invalid credentials': 'بيانات تسجيل الدخول غير صحيحة',
    'Email or password is incorrect': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'Too many requests': 'محاولات كثيرة جداً، الرجاء المحاولة لاحقاً',
    'Network error': 'خطأ في الاتصال بالشبكة',
    'No session returned from authentication': 'فشل إنشاء الجلسة',
    'No profile found for user': 'لم يتم العثور على ملف تعريف المستخدم',
    'Failed to login': 'فشل تسجيل الدخول',
    'Please check your credentials': 'الرجاء التحقق من بياناتك',
  }

  // Check if error contains known patterns
  for (const [englishError, arabicError] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(englishError.toLowerCase())) {
      return arabicError
    }
  }

  // Default Arabic error message for unknown errors
  return 'حدث خطأ في تسجيل الدخول. الرجاء التحقق من بياناتك والمحاولة مرة أخرى.'
}

export default function Login() {
  // State variables
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kickedDeviceMessage, setKickedDeviceMessage] = useState<string | null>(null)
  const router = useRouter()
  
  // Check if user is already logged in and handle device limit messages
  useEffect(() => {
    // Check for device limit exceeded reason
    if (router.query.reason === 'device_limit_exceeded') {
      setError('تم تسجيل الخروج: تم تجاوز حد الأجهزة. تم تسجيل دخول جهاز آخر.')
      // Clear any lingering session data to prevent auto-redirect loop
      // But preserve device ID to maintain device identity
      const deviceId = localStorage.getItem('kesti_device_id')
      localStorage.clear()
      sessionStorage.clear()
      if (deviceId) {
        localStorage.setItem('kesti_device_id', deviceId)
      }
      return // Don't auto-redirect when kicked out due to device limit
    }
    
    // If user just logged out, don't auto-redirect
    if (router.query.logout === 'true') {
      return
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
          
          // Use router.push for client-side navigation
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
  }, [router])



  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      // Step 1: Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        setError(translateErrorToArabic(signInError.message))
        setLoading(false)
        return
      }
      
      if (!data.session) {
        setError(translateErrorToArabic('No session returned from authentication'))
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
        setError(`خطأ في الملف الشخصي: ${translateErrorToArabic(profileError.message)}`)
        setLoading(false)
        return
      }
      
      if (!profile) {
        setError(translateErrorToArabic('No profile found for user'))
        setLoading(false)
        return
      }
      
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
      
      // Use router.push for client-side navigation
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
          setError(`دور غير معروف: ${userRole}`)
          setLoading(false)
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(translateErrorToArabic(err.message || 'Failed to login. Please check your credentials.'))
      setLoading(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-secondary p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(111,198,5,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(0,99,189,0.15),transparent_50%)]"></div>
      
      {/* Back to home link - Enhanced Visibility */}
      <Link 
        href="/"
        className="absolute top-4 md:top-6 right-4 md:right-6 bg-white hover:bg-gray-100 text-primary hover:text-secondary transition-all flex items-center gap-2 font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-white z-50"
      >
        <span className="text-xl">→</span>
        <span className="text-sm md:text-base">الرجوع للرئيسية</span>
      </Link>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo/KESTi.png" alt="KESTI" width={200} height={80} className="h-16 w-auto" priority />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            مرحباً بك
          </h2>
          <p className="text-gray-600 text-lg">سجل الدخول إلى Kesti Pro</p>
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="أدخل كلمة المرور"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
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

        <div className="mt-4 text-center">
          <Link 
            href="/forgot-password"
            className="text-sm text-primary hover:text-secondary transition-colors font-medium"
          >
            نسيت كلمة المرور؟
          </Link>
        </div>

        <div className="mt-6 text-center">
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-600 mb-3">ليس لديك حساب؟</p>
            <Link 
              href="/signup"
              className="inline-block bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-6 rounded-lg hover:shadow-lg transition-all"
            >
              إنشاء حساب - تجربة مجانية 15 يوم 🚀
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
