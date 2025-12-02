import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    pin: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Client-side validation
    if (!formData.fullName || !formData.email || !formData.phoneNumber || !formData.password || !formData.pin) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      setLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      setLoading(false)
      return
    }

    if (!/^\d{4,6}$/.test(formData.pin)) {
      setError('رمز PIN يجب أن يكون من 4 إلى 6 أرقام')
      setLoading(false)
      return
    }

    try {
      // Calculate subscription end date (15 days from now)
      const subscriptionEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase().trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          pin: formData.pin,
          subscriptionEndsAt: subscriptionEndsAt,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'فشل في إنشاء الحساب')
      }

      if (data.success) {
        setSuccess(true)
        setError(null)
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/login')
        }, 2000)
      } else {
        throw new Error(data.error || 'فشل في إنشاء الحساب')
      }
    } catch (err: any) {
      console.error('Signup error:', err)
      setError(err.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
      setSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (error) setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md lg:max-w-3xl p-6 md:p-8 lg:p-10 shadow-2xl relative">
        {/* Back Button */}
        <Link href="/" className="absolute top-4 right-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">رجوع</span>
        </Link>
        
        {/* Logo */}
        <div className="flex justify-center mb-6 mt-6">
          <div className="relative w-24 h-24">
            <Image
              src="/logo/KESTi.png"
              alt="KESTi Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            إنشاء حساب جديد
          </h1>
          <p className="text-gray-600">
            احصل على 15 يوم تجريبي مجاناً
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full animate-pulse">
            <span className="text-xl">⚡</span>
            <span className="font-black text-sm">عرض حصري للأول 50 مستخدم فقط!</span>
          </div>
        </div>

        {/* Success Popup Modal - Prominent Center Screen */}
        {success && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 md:p-10 max-w-sm md:max-w-md w-full shadow-2xl transform animate-scaleIn">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-xl">
                  <svg className="w-12 h-12 md:w-14 md:h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              {/* Success Text */}
              <div className="text-center space-y-4">
                <h3 className="text-2xl md:text-3xl font-black text-gray-900">
                  تم إنشاء الحساب بنجاح!
                </h3>
                <p className="text-lg md:text-xl text-gray-600 font-semibold">
                  جاري تحويلك لصفحة تسجيل الدخول...
                </p>
                
                {/* Loading Spinner */}
                <div className="flex justify-center pt-4">
                  <svg className="animate-spin h-8 w-8 text-green-500" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Popup Modal - Centered on Screen */}
        {error && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm md:max-w-md w-full shadow-2xl transform animate-scaleIn border-4 border-red-500">
              {/* Error Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-xl animate-pulse">
                  <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
              
              {/* Error Text */}
              <div className="text-center space-y-3">
                <h3 className="text-xl md:text-2xl font-black text-red-600">
                  خطأ!
                </h3>
                <p className="text-base md:text-lg text-gray-700 font-semibold leading-relaxed">
                  {error}
                </p>
              </div>
              
              {/* Close Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setError(null)}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 transition-all transform hover:scale-105 shadow-lg"
                >
                  حسناً
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-5 lg:space-y-0">
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
              الاسم الكامل *
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="أدخل اسمك الكامل"
              disabled={loading || success}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              البريد الإلكتروني *
            </label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="example@email.com"
              disabled={loading || success}
              required
            />
          </div>

          {/* Phone Number */}
          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
              رقم الهاتف *
            </label>
            <input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="+216 12 345 678"
              disabled={loading || success}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              كلمة المرور *
            </label>
            <input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="6 أحرف على الأقل"
              disabled={loading || success}
              required
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              تأكيد كلمة المرور *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="أعد إدخال كلمة المرور"
              disabled={loading || success}
              required
            />
          </div>

          {/* PIN - CUSTOM CODE HIGHLIGHTED */}
          <div className="lg:col-span-2 bg-gradient-to-br from-yellow-50 to-orange-50 border-4 border-orange-400 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🔑</span>
              <label htmlFor="pin" className="block text-base md:text-lg font-black text-orange-900">
                كود العرف (Custom Code) *
              </label>
            </div>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="\d{4,6}"
              value={formData.pin}
              onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 md:py-4 border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition bg-white text-lg md:text-xl font-bold text-center tracking-widest"
              placeholder="● ● ● ●"
              disabled={loading || success}
              required
            />
            <div className="mt-3 bg-orange-100 rounded-lg p-3">
              <p className="text-xs md:text-sm text-orange-900 font-semibold text-center">
                ⚠️ كود سري من 4-6 أرقام لتأكيد العمليات المهمة
              </p>
              <p className="text-xs text-orange-800 mt-1 text-center">
                احفظه بشكل آمن - لا تشاركه مع أحد!
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="lg:col-span-2">
            <Button
              type="submit"
              variant="primary"
              className="w-full py-3 md:py-4 text-lg md:text-xl font-semibold"
              disabled={loading || success}
            >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                جاري الإنشاء...
              </span>
            ) : success ? (
              '✅ تم بنجاح'
            ) : (
              'إنشاء الحساب'
            )}
            </Button>
          </div>
        </form>

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            لديك حساب بالفعل؟{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
              تسجيل الدخول
            </Link>
          </p>
        </div>

        {/* Trial Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300 relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-3 py-1 font-black">
            للأول 50 فقط
          </div>
          <p className="text-sm text-green-800 text-center font-bold">
            🎉 احصل على 15 يوم تجريبي مجاناً عند التسجيل
          </p>
          <p className="text-xs text-green-700 text-center mt-1 font-semibold">
            ⚡ عرض حصري محدود • سارع بالتسجيل!
          </p>
        </div>
      </Card>
    </div>
  )
}
