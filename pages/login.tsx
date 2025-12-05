import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { registerCurrentDevice } from '@/utils/deviceManager'
import { useLoading } from '@/contexts/LoadingContext'
import { trackLoginAttempt, trackLoginSuccess } from '@/lib/analytics'

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

  for (const [englishError, arabicError] of Object.entries(errorMap)) {
    if (error.toLowerCase().includes(englishError.toLowerCase())) {
      return arabicError
    }
  }

  return 'حدث خطأ في تسجيل الدخول. الرجاء التحقق من بياناتك والمحاولة مرة أخرى.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [kickedDeviceMessage, setKickedDeviceMessage] = useState<string | null>(null)
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  
  useEffect(() => {
    if (router.query.reason === 'device_limit_exceeded') {
      setError('تم تسجيل الخروج: تم تجاوز حد الأجهزة. تم تسجيل دخول جهاز آخر.')
      const deviceId = localStorage.getItem('kesti_device_id')
      localStorage.clear()
      sessionStorage.clear()
      if (deviceId) {
        localStorage.setItem('kesti_device_id', deviceId)
      }
      return
    }
    
    if (router.query.logout === 'true') {
      return
    }
    
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          const redirectUrl = router.query.redirectUrl as string
          
          if (redirectUrl && !redirectUrl.includes('/login')) {
            router.push(redirectUrl)
          } else {
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

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      setError(null)
      
      trackLoginAttempt('google')
      
      const { data, error: signInError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }
      })

      if (signInError) {
        throw signInError
      }
    } catch (err: any) {
      console.error('Google login error:', err)
      setError(translateErrorToArabic(err.message || 'فشل تسجيل الدخول بواسطة Google'))
      setLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    showLoading('جاري تسجيل الدخول...')
    
    trackLoginAttempt('email')
    
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (signInError) {
        setError(translateErrorToArabic(signInError.message))
        setLoading(false)
        hideLoading()
        return
      }
      
      if (!data.session) {
        setError(translateErrorToArabic('No session returned from authentication'))
        setLoading(false)
        hideLoading()
        return
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()
      
      if (profileError) {
        setError(`خطأ في الملف الشخصي: ${translateErrorToArabic(profileError.message)}`)
        setLoading(false)
        hideLoading()
        return
      }
      
      if (!profile) {
        setError(translateErrorToArabic('No profile found for user'))
        setLoading(false)
        hideLoading()
        return
      }
      
      const deviceResult = await registerCurrentDevice()
      
      if (deviceResult.kicked && deviceResult.kickedDevice) {
        setKickedDeviceMessage(
          `تم تسجيل دخول جهاز جديد. تم إخراج: ${deviceResult.kickedDevice}`
        )
      }
      
      if (!deviceResult.success) {
        console.warn('Device registration failed:', deviceResult.error)
      }
      
      const userRole = typeof profile.role === 'object' ? 
        profile.role.toString() : String(profile.role)
      
      // Track successful login
      trackLoginSuccess('email', data.user.id)
      
      const redirectUrl = router.query.redirectUrl as string
      
      if (redirectUrl && !redirectUrl.includes('/login')) {
        router.push(redirectUrl)
      } else {
        if (userRole === 'super_admin') {
          router.push('/super-admin')
        } else if (userRole === 'business_user') {
          router.push('/pos')
        } else {
          setError(`دور غير معروف: ${userRole}`)
          setLoading(false)
          hideLoading()
        }
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(translateErrorToArabic(err.message || 'Failed to login. Please check your credentials.'))
      setLoading(false)
      hideLoading()
    } finally {
      setLoading(false)
      hideLoading()
    }
  }

  return (
    <>
      <Head>
        <title>تسجيل الدخول - Kesti Pro</title>
        <meta name="description" content="سجل دخولك إلى Kesti Pro" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
        {/* Header Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img src="/logo/KESTI.png" alt="Kesti Pro" className="h-8 w-auto" />
              </Link>
              
              <div className="flex items-center gap-3">
                <Link 
                  href="/" 
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm transition-colors"
                >
                  العودة للرئيسية
                </Link>
                <Link 
                  href="/signup" 
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all"
                >
                  إنشاء حساب
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="flex pt-16">
          {/* Left Side - Features (Hidden on Mobile) */}
          <div className="hidden lg:flex flex-1 bg-gray-900 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">مرحباً بعودتك!</h2>
              <p className="text-gray-400 text-lg">سجل دخولك لإدارة عملك بكل سهولة</p>
            </div>

            <div className="space-y-4 text-right">
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">تقارير فورية</h3>
                  <p className="text-gray-400 text-sm">راقب مبيعاتك وأرباحك لحظة بلحظة</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">بياناتك آمنة</h3>
                  <p className="text-gray-400 text-sm">تشفير عالي المستوى لحماية معلوماتك</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">سريع وسهل</h3>
                  <p className="text-gray-400 text-sm">واجهة بسيطة تناسب الجميع</p>
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Right Side - Form */}
          <div className="flex-1 flex items-center justify-center p-6 md:p-12">
            <div className="w-full max-w-md">
              {/* Welcome Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  مرحباً بك مجدداً
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">تسجيل الدخول</h1>
                <p className="text-gray-600 text-base">أدخل بياناتك للوصول إلى حسابك</p>
              </div>

              {/* Google Login Button - At Top */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-base hover:bg-gray-50 hover:border-gray-400 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-3 shadow-sm mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                متابعة مع Google
              </button>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">أو تسجيل الدخول بالبريد الإلكتروني</span>
                </div>
              </div>

              {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Kicked Device Message */}
            {kickedDeviceMessage && (
              <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-center flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {kickedDeviceMessage}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                  placeholder="example@email.com"
                  dir="ltr"
                  required
                  autoComplete="username email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pl-12 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                    placeholder="أدخل كلمة المرور"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="text-left">
                <Link href="/forgot-password" className="text-sm text-gray-500 hover:text-gray-900 transition">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري تسجيل الدخول...
                  </span>
                ) : 'تسجيل الدخول'}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-8 text-center">
              <div className="border-t border-gray-200 pt-6">
                <p className="text-gray-500 mb-4">ليس لديك حساب؟</p>
                <Link 
                  href="/signup"
                  className="inline-block w-full py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition border border-gray-200"
                >
                  إنشاء حساب جديد - 15 يوم مجاناً
                </Link>
              </div>
            </div>

            {/* Back to Home */}
            <div className="mt-6 text-center">
              <Link href="/" className="text-gray-400 hover:text-gray-600 text-sm transition flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
