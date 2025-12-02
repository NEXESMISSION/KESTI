import { useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'

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
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!agreedToTerms) {
      setError('يجب الموافقة على الشروط والأحكام للمتابعة')
      setLoading(false)
      return
    }

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
      const subscriptionEndsAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        setTimeout(() => router.push('/login'), 2000)
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
    if (error) setError(null)
  }

  return (
    <>
      <Head>
        <title>إنشاء حساب - Kesti Pro</title>
        <meta name="description" content="أنشئ حسابك واحصل على 15 يوم مجاناً" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex" dir="rtl">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-md">
            {/* Logo */}
            <Link href="/" className="flex justify-center mb-8">
              <img src="/logo/logo no bg low qulity.png" alt="Kesti Pro" className="h-12" />
            </Link>

            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">إنشاء حساب جديد</h1>
              <p className="text-gray-500 text-lg">احصل على 15 يوم تجريبي مجاناً</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                  placeholder="أدخل اسمك الكامل"
                  disabled={loading || success}
                  required
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                  placeholder="example@email.com"
                  dir="ltr"
                  disabled={loading || success}
                  required
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                  placeholder="12345678"
                  dir="ltr"
                  disabled={loading || success}
                  required
                />
              </div>

              {/* Password Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                    placeholder="6 أحرف+"
                    disabled={loading || success}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">تأكيد كلمة المرور</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition shadow-sm"
                    placeholder="أعد الإدخال"
                    disabled={loading || success}
                    required
                  />
                </div>
              </div>

              {/* PIN */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <label className="block text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  كود العرف (PIN)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d{4,6}"
                  value={formData.pin}
                  onChange={(e) => handleInputChange('pin', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-3 bg-white border border-amber-200 rounded-xl text-gray-900 text-center text-xl font-bold tracking-widest placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition"
                  placeholder="● ● ● ●"
                  disabled={loading || success}
                  required
                />
                <p className="text-xs text-amber-700 mt-2 text-center">كود سري 4-6 أرقام لتأكيد العمليات المهمة</p>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                  disabled={loading || success}
                />
                <label htmlFor="terms" className="text-sm text-gray-600 leading-relaxed">
                  أوافق على{' '}
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-gray-900 hover:text-gray-700 underline font-medium"
                  >
                    شروط الاستخدام والأحكام
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || success || !agreedToTerms}
                className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold text-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
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
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    تم بنجاح!
                  </span>
                ) : 'إنشاء الحساب'}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-gray-500 mt-6">
              لديك حساب؟{' '}
              <Link href="/login" className="text-gray-900 font-semibold hover:underline">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side - Features (Hidden on Mobile) */}
        <div className="hidden lg:flex flex-1 bg-gray-900 items-center justify-center p-12">
          <div className="max-w-md text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-4">ابدأ رحلتك معنا</h2>
              <p className="text-gray-400 text-lg">انضم لمئات التجار الذين يديرون أعمالهم بذكاء</p>
            </div>

            <div className="space-y-4 text-right">
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">15 يوم مجاناً</h3>
                  <p className="text-gray-400 text-sm">جرب كل المميزات بدون قيود</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">يعمل على كل الأجهزة</h3>
                  <p className="text-gray-400 text-sm">تليفون، تابلت، أو كمبيوتر</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">دعم فوري</h3>
                  <p className="text-gray-400 text-sm">فريق الدعم متاح للمساعدة</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Success Modal */}
        {success && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">تم إنشاء الحساب!</h3>
              <p className="text-gray-500">جاري تحويلك لتسجيل الدخول...</p>
            </div>
          </div>
        )}

        {/* Error Modal */}
        {error && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border-2 border-red-100">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">خطأ</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button
                onClick={() => setError(null)}
                className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition"
              >
                حسناً
              </button>
            </div>
          </div>
        )}

        {/* Terms Modal */}
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowTermsModal(false)}>
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="bg-gray-50 p-6 border-b flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">شروط استخدام خدمة Kesti Pro</h2>
                <button onClick={() => setShowTermsModal(false)} className="w-10 h-10 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)] text-gray-600 space-y-4 text-sm leading-relaxed">
                <p>بتسجيلك أو استخدامك لخدمة Kesti Pro، فإنك تقر بأنك قرأت وفهمت ووافقت على الشروط التالية كاملةً وبدون تحفظ:</p>

                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2">1. الاستخدام المشروع والقانوني</h3>
                    <p className="text-gray-500">يُحظر استخدام الخدمة في أي نشاط غير قانوني. أنت المسؤول عن جميع عمليات البيع والإقرارات الضريبية.</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2">2. دقة البيانات</h3>
                    <p className="text-gray-500">أنت مسؤول عن صحة البيانات التي تدخلها. Kesti Pro أداة مساعدة ولا تُعتبر بديلاً عن محاسب قانوني.</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2">3. حماية البيانات</h3>
                    <p className="text-gray-500">نطبّق معايير تشفير عالية المستوى. لا نبيع بياناتك الشخصية لأي طرف ثالث.</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2">4. الاشتراك والدفع</h3>
                    <p className="text-gray-500">الاشتراك يجدد تلقائياً. يمكنك الإلغاء في أي وقت بدون رسوم.</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4">
                    <h3 className="font-bold text-gray-900 mb-2">5. فترة التجربة</h3>
                    <p className="text-gray-500">15 يوماً مجاناً. لا يتم خصم أي مبلغ إلا بموافقتك.</p>
                  </div>

                  <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                    <h3 className="font-bold text-red-800 mb-2">6. حدود المسؤولية</h3>
                    <p className="text-red-700">تُقدَّم الخدمة «كما هي». الحد الأقصى لمسؤوليتنا لن يتجاوز المبلغ المدفوع خلال 3 أشهر.</p>
                  </div>
                </div>

                <p className="text-center text-gray-400 text-xs pt-4">آخر تحديث: 2 ديسمبر 2025</p>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 p-6 border-t flex gap-4">
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition"
                >
                  إغلاق
                </button>
                <button
                  onClick={() => { setAgreedToTerms(true); setShowTermsModal(false); }}
                  className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition"
                >
                  موافق على الشروط
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
