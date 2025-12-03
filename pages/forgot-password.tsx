import { useState, FormEvent } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSuccess(true)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'فشل إرسال رسالة إعادة تعيين كلمة المرور')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-700 to-secondary p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(111,198,5,0.15),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(0,99,189,0.15),transparent_50%)]"></div>
      
      {/* Back to login link */}
      <Link 
        href="/login"
        className="absolute top-4 md:top-6 right-4 md:right-6 bg-white hover:bg-gray-100 text-primary hover:text-secondary transition-all flex items-center gap-2 font-bold px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 border-2 border-white z-50"
      >
        <span className="text-xl">→</span>
        <span className="text-sm md:text-base">الرجوع لتسجيل الدخول</span>
      </Link>
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <Image src="/logo/logo no bg low qulity.png" alt="KESTI" width={200} height={80} className="h-16 w-auto" priority />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            نسيت كلمة المرور؟
          </h2>
          <p className="text-gray-600 text-lg">سنرسل لك رابطاً لإعادة تعيين كلمة المرور</p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
              <p className="font-semibold mb-2">✅ تم إرسال الرابط بنجاح!</p>
              <p className="text-sm">
                تفقد بريدك الإلكتروني واتبع التعليمات لإعادة تعيين كلمة المرور.
              </p>
              <p className="text-sm mt-2 text-green-600">
                إذا لم تجد الرسالة، تفقد مجلد الرسائل غير المرغوب فيها (Spam).
              </p>
            </div>

            <Link 
              href="/login"
              className="block w-full text-center bg-gradient-to-r from-primary to-secondary text-white font-bold py-3 px-4 rounded-lg hover:shadow-lg transition-all"
            >
              العودة لتسجيل الدخول
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                البريد الإلكتروني
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition"
                placeholder="بريدك@مثال.com"
              />
              <p className="text-sm text-gray-500 mt-2">
                أدخل البريد الإلكتروني المسجل في حسابك
              </p>
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
                  جاري الإرسال...
                </span>
              ) : (
                'إرسال رابط إعادة التعيين'
              )}
            </button>

            <div className="text-center">
              <Link 
                href="/login"
                className="text-sm text-primary hover:text-secondary transition-colors font-medium"
              >
                تذكرت كلمة المرور؟ تسجيل الدخول
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

