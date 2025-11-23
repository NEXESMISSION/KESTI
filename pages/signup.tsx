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
      <Card className="w-full max-w-md p-8 shadow-xl">
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

        {/* Success Message */}
        {success && (
          <Alert variant="success" className="mb-6">
            <div className="text-center">
              <p className="font-semibold mb-1">تم إنشاء الحساب بنجاح! ✅</p>
              <p className="text-sm">جاري تحويلك لصفحة تسجيل الدخول...</p>
            </div>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-6">
            <p className="text-center font-semibold">{error}</p>
          </Alert>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* PIN */}
          <div>
            <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-2">
              رمز PIN (4-6 أرقام) *
            </label>
            <input
              id="pin"
              type="text"
              inputMode="numeric"
              pattern="\d{4,6}"
              value={formData.pin}
              onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              placeholder="أدخل رمز PIN"
              disabled={loading || success}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              سيستخدم هذا الرمز لتأكيد العمليات المهمة
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3 text-lg font-semibold"
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
