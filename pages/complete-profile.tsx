import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { supabase } from '@/lib/supabase'
import { useLoading } from '@/contexts/LoadingContext'
import { trackSignupSuccess } from '@/lib/analytics'
import { registerCurrentDevice } from '@/utils/deviceManager'

export default function CompleteProfile() {
  const router = useRouter()
  const { showLoading, hideLoading } = useLoading()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    pin: '',
    termsAccepted: false,
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      // Pre-fill name if available from Google
      if (session.user.user_metadata?.full_name) {
        setFormData(prev => ({
          ...prev,
          fullName: session.user.user_metadata.full_name
        }))
      }

      // Check if profile already exists and is complete
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile && profile.profile_completed) {
        // Profile is complete, redirect to dashboard
        console.log('Profile already completed, redirecting...')
        if (profile.role === 'super_admin') {
          window.location.href = '/super-admin'
        } else {
          window.location.href = '/pos'
        }
        return
      } else {
        console.log('Profile needs completion')
      }
    } catch (err) {
      console.error('Auth check error:', err)
      router.push('/login')
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    showLoading('جاري حفظ البيانات...')

    // Validation
    if (!formData.fullName || !formData.phoneNumber || !formData.password || !formData.confirmPassword || !formData.pin) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      setLoading(false)
      hideLoading()
      return
    }

    if (!formData.termsAccepted) {
      setError('يرجى الموافقة على شروط الاستخدام والأحكام')
      setLoading(false)
      hideLoading()
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      setLoading(false)
      hideLoading()
      return
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      hideLoading()
      return
    }

    if (!/^\d{4,6}$/.test(formData.pin)) {
      setError('رمز PIN يجب أن يكون من 4 إلى 6 أرقام')
      setLoading(false)
      hideLoading()
      return
    }

    try {
      if (!user) {
        throw new Error('لم يتم العثور على المستخدم')
      }

      // Set password for Google user
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.password
      })

      if (passwordError) {
        throw passwordError
      }

      // Calculate subscription end date (15 days from now)
      const now = new Date()
      const subscriptionEndsAt = new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)

      console.log('Setting up profile:', {
        userId: user.id,
        subscriptionEndsAt: subscriptionEndsAt.toISOString(),
        now: now.toISOString()
      })

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      // Determine role (keep existing if present, otherwise business_user)
      const userRole = existingProfile?.role || 'business_user'

      // Update or create profile with all required fields
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: formData.fullName.trim(),
          phone_number: formData.phoneNumber.trim(),
          pin_code: formData.pin,
          role: userRole,
          subscription_status: 'trial',
          subscription_ends_at: subscriptionEndsAt.toISOString(),
          is_suspended: false,
          profile_completed: true, // Mark as completed
          updated_at: now.toISOString(),
        }, {
          onConflict: 'id'
        })

      if (upsertError) {
        console.error('Profile upsert error:', upsertError)
        throw upsertError
      }

      console.log('Profile updated successfully')

      // Track successful signup
      trackSignupSuccess('google', user.id)

      // Register device for non-super-admin users
      if (userRole !== 'super_admin') {
        console.log('Registering device...')
        const deviceResult = await registerCurrentDevice()
        if (!deviceResult.success) {
          console.warn('Device registration failed:', deviceResult.error)
        } else {
          console.log('Device registered successfully')
        }
      }

      // Redirect based on role
      hideLoading()
      if (userRole === 'super_admin') {
        console.log('Redirecting super admin to /super-admin')
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/super-admin'
      } else {
        console.log('Redirecting user to /pos')
        await new Promise(resolve => setTimeout(resolve, 500))
        window.location.href = '/pos'
      }
    } catch (err: any) {
      console.error('Profile completion error:', err)
      setError(err.message || 'حدث خطأ أثناء حفظ البيانات')
      setLoading(false)
      hideLoading()
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
  }

  return (
    <>
      <Head>
        <title>إكمال الملف الشخصي - Kesti Pro</title>
        <meta name="description" content="أكمل بياناتك للبدء" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img src="/logo/KESTI.png" alt="Kesti Pro" className="h-12 w-auto" />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">أهلاً بك!</h1>
            <p className="text-gray-600">
              نحتاج بعض المعلومات الإضافية لإكمال حسابك
            </p>
            {user?.email && (
              <p className="text-sm text-gray-500 mt-2">
                <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                الاسم الكامل
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                placeholder="أدخل اسمك الكامل"
                disabled={loading}
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                رقم الهاتف
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                placeholder="12345678"
                dir="ltr"
                disabled={loading}
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمة المرور
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                placeholder="6 أحرف على الأقل"
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                اختر كلمة مرور قوية لحماية حسابك (6 أحرف على الأقل)
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                تأكيد كلمة المرور
              </label>
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition"
                placeholder="أعد إدخال كلمة المرور"
                disabled={loading}
                required
              />
            </div>

            {/* PIN */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                كود السر (PIN)
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{4,6}"
                value={formData.pin}
                onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-gray-900 text-center text-xl font-bold tracking-widest placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                placeholder="● ● ● ●"
                disabled={loading}
                required
              />
              <p className="text-xs text-amber-700 mt-2 text-center">
                كود سري 4-6 أرقام لتأكيد العمليات المهمة
              </p>
            </div>

            {/* Terms & Conditions Checkbox */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <input
                type="checkbox"
                id="terms"
                checked={formData.termsAccepted}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, termsAccepted: e.target.checked }))
                  if (error) setError(null)
                }}
                disabled={loading}
                className="mt-1 w-5 h-5 text-gray-900 border-gray-300 rounded focus:ring-2 focus:ring-gray-900 cursor-pointer"
                required
              />
              <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer select-none">
                <span className="font-medium">أوافق على </span>
                <a href="/terms" target="_blank" className="text-gray-900 underline hover:text-gray-700">
                  شروط الاستخدام
                </a>
                <span> و</span>
                <a href="/privacy" target="_blank" className="text-gray-900 underline hover:text-gray-700">
                  سياسة الخصوصية
                </a>
              </label>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-center text-sm">
                {error}
              </div>
            )}

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
                  جاري الحفظ...
                </span>
              ) : (
                'إكمال التسجيل'
              )}
            </button>
          </form>

          {/* Logout Option */}
          <div className="mt-6 text-center">
            <button
              onClick={async () => {
                await supabase.auth.signOut()
                router.push('/login')
              }}
              className="text-gray-600 hover:text-gray-900 text-sm transition-colors"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
