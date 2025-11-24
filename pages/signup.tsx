import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import Link from 'next/link'
import Alert from '@/components/ui/Alert'
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
      <Card className="w-full max-w-md lg:max-w-3xl p-6 md:p-8 lg:p-10 shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
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

        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-6">
            <p className="text-center font-semibold">{error}</p>
          </Alert>
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
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center">
            🎉 احصل على 15 يوم تجريبي مجاناً عند التسجيل
          </p>
        </div>
      </Card>
    </div>
  )
}
