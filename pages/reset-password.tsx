import { useState, FormEvent, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPassword() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    // Check if we have a valid session (user clicked the magic link)
    const checkSession = async () => {
      try {
        // First, check if we have tokens in the URL hash
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1) // Remove #
          const params = new URLSearchParams(hash)
          
          const accessToken = params.get('access_token')
          const refreshToken = params.get('refresh_token')
          const type = params.get('type')
          
          // If we have recovery tokens, set the session
          if (type === 'recovery' && accessToken) {
            console.log('Setting session from URL hash tokens...')
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || accessToken,
            })
            
            if (sessionError) {
              console.error('Session error:', sessionError)
              setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية')
              setValidating(false)
              return
            }
            
            // Clear the hash from URL for security
            window.history.replaceState(null, '', window.location.pathname)
            
            setValidating(false)
            return
          }
        }

        // If no hash tokens, check existing session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية')
          setValidating(false)
          return
        }

        if (!session) {
          setError('رابط إعادة التعيين غير صالح أو منتهي الصلاحية')
          setValidating(false)
          return
        }

        // Valid session, user can now reset password
        setValidating(false)
      } catch (err) {
        console.error('Validation error:', err)
        setError('حدث خطأ في التحقق من الرابط')
        setValidating(false)
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validation
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      console.error('Password update error:', err)
      setError(err.message || 'فشل تحديث كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-secondary p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">جاري التحقق من الرابط...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-secondary p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(111,198,5,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(0,99,189,0.15),transparent_50%)]"></div>
        
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Image src="/logo/KESTI.png" alt="KESTI" width={200} height={80} className="h-16 w-auto" priority />
            </div>
            
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <p className="font-semibold mb-2">❌ {error}</p>
              <p className="text-sm">
                الرجاء طلب رابط جديد لإعادة تعيين كلمة المرور
              </p>
            </div>

            <Link 
              href="/forgot-password"
              className="block w-full text-center bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all mb-3"
            >
              طلب رابط جديد
            </Link>

            <Link 
              href="/login"
              className="block w-full text-center text-primary hover:text-secondary transition-colors font-medium"
            >
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-secondary p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(111,198,5,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(0,99,189,0.15),transparent_50%)]"></div>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo/logo no bg low qulity.png" alt="KESTI" width={200} height={80} className="h-16 w-auto" priority />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            إعادة تعيين كلمة المرور
          </h2>
          <p className="text-gray-600 text-lg">أدخل كلمة المرور الجديدة</p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-2">✅ تم تحديث كلمة المرور بنجاح!</p>
              <p className="text-sm">
                سيتم توجيهك إلى صفحة تسجيل الدخول...
              </p>
            </div>

            <Link 
              href="/login"
              className="block w-full text-center bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              تسجيل الدخول الآن
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور الجديدة
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                  placeholder="أدخل كلمة المرور الجديدة"
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
              <p className="text-sm text-gray-500 mt-1">
                يجب أن تكون كلمة المرور 6 أحرف على الأقل
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <input
                type={showPassword ? "text" : "password"}
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="أعد إدخال كلمة المرور"
              />
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
                  جاري التحديث...
                </span>
              ) : (
                'تحديث كلمة المرور'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

