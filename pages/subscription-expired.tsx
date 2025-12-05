import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import Head from 'next/head'
import Link from 'next/link'

// This page is for users with expired subscriptions only
export default function SubscriptionExpired() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string, period: string} | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    expiryDate: '',
    fullName: '',
    email: '',
  })

  const paymentInfo = {
    rib: '24031168005251110132',
    bankName: 'BTE Bank',
    d17: '58415520',
    flouci: '58415520',
    phone: '+21653518337',
    email: 'support@kestipro.com',
    whatsapp: '21653518337',
    d17Logo: 'https://play-lh.googleusercontent.com/lOgvUGpz6YUSXJG48kbzGrTEohIC8FDr_WkP6rwgaELR0g5o6OQu5-VPGexKoB8F0C-_',
    flouciLogo: 'https://play-lh.googleusercontent.com/CK9-8mnJO0rlqQf8-D44yX_J1iEXqZ7RqpXJnTkIlrpqBgiBIT5TQXtORU55vDG-vXU'
  }

  const openPaymentModal = (planName: string, price: string, period: string) => {
    setSelectedPlan({ name: planName, price, period })
    setShowPaymentModal(true)
  }

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // Get the current session
        const { data: { session } } = await supabase.auth.getSession()
        
        // If not logged in, redirect to login
        if (!session) {
          console.log('No session - redirecting to login')
          router.push('/login')
          return
        }

        // Get the user's profile with subscription info
        const { data, error } = await supabase
          .from('profiles')
          .select('subscription_ends_at, is_suspended, role, full_name, email')
          .eq('id', session.user.id)
          .single()

        if (error) {
          console.error('Error fetching profile:', error)
          throw error
        }

        // Format the expiry date for display
        const expiryDate = data.subscription_ends_at ? new Date(data.subscription_ends_at) : null
        const formattedDate = expiryDate ? expiryDate.toLocaleDateString() : 'Not set'
        
        setSubscriptionInfo({
          expiryDate: formattedDate,
          fullName: data.full_name || '',
          email: data.email || '',
        })

        console.log('Checking subscription status:', data.subscription_ends_at)
        
        // Super admins should never be here - redirect to super admin page IMMEDIATELY
        if (data.role === 'super_admin') {
          console.log('Super admin detected - forcing redirect to super-admin page')
          window.location.href = '/super-admin'
          return
        }
        
        // If suspended, redirect to suspended page
        if (data.is_suspended === true) {
          console.log('User is suspended - redirecting to suspended page')
          router.push('/suspended')
          return
        }
        
        // Check if subscription is expired or not set (null is valid)
        let subscriptionExpired = false
        if (data.subscription_ends_at) {
          const now = new Date()
          const expiryDate = new Date(data.subscription_ends_at)
          subscriptionExpired = expiryDate < now
        } else {
          // If subscription_ends_at is null, treat as NOT expired (valid)
          subscriptionExpired = false
        }
        
        // If subscription is not expired, redirect to appropriate page
        if (!subscriptionExpired) {
          console.log('Subscription is still active or null (valid) - redirecting')
          
          // Get user role and redirect appropriately
          const userRole = typeof data.role === 'object' ? 
            data.role.toString() : String(data.role)
          
          if (userRole === 'super_admin') {
            router.push('/super-admin')
          } else {
            router.push('/pos')
          }
          return
        }

        console.log('Subscription is expired - showing renewal message')
      } catch (err) {
        console.error('Error checking subscription:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkSubscription()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' })
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=' + window.location.hostname
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      document.cookie = 'sb-refresh-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      localStorage.clear()
      sessionStorage.clear()
      await new Promise(resolve => setTimeout(resolve, 100))
      window.location.replace('/login?logout=true')
    } catch (error) {
      localStorage.clear()
      sessionStorage.clear()
      window.location.replace('/login?logout=true')
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100 p-4" dir="rtl">
        <Head>
          <title>الاشتراك منتهي - Kesti Pro</title>
        </Head>

        {/* Logo at top */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2">
          <Link href="/">
            <img src="/logo/KESTI.png" alt="Kesti Pro" className="h-10 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-lg relative z-10">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-orange-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">جاري التحميل...</p>
            </div>
          ) : (
            <>
              {/* Clock Icon */}
              <div className="mb-6 text-center">
                <div className="mx-auto h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-12 w-12 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-4 text-center">
                الاشتراك منتهي
              </h1>
              
              {/* Subscription Information */}
              <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4 mb-6">
                <p className="text-orange-800 font-medium text-center leading-relaxed mb-2">
                  انتهى اشتراكك في <strong>{subscriptionInfo.expiryDate}</strong>
                </p>
                <p className="text-orange-700 text-center">
                  يرجى تجديد الاشتراك لمواصلة استخدام النظام.
                </p>
              </div>

              {/* Pricing Options */}
              <div className="mb-6">
                <h3 className="text-center text-lg font-bold text-gray-900 mb-4">جدد اشتراكك الآن</h3>
                <div className="space-y-3">
                  {/* Monthly */}
                  <button
                    onClick={() => openPaymentModal('شهري', '19', 'شهر')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 rounded-xl transition-all hover:shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <div className="font-bold text-lg">اشتراك شهري</div>
                        <div className="text-sm text-blue-100">19 دينار / شهر</div>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* 3 Months */}
                  <button
                    onClick={() => openPaymentModal('3 أشهر', '51', '3 أشهر')}
                    className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white p-4 rounded-xl transition-all hover:shadow-lg relative"
                  >
                    <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                      وفّر 10%
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <div className="font-bold text-lg">اشتراك 3 أشهر</div>
                        <div className="text-sm text-green-100">17 دينار / شهر (51 د.ت كل 3 أشهر)</div>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>

                  {/* Yearly */}
                  <button
                    onClick={() => openPaymentModal('سنوي', '180', 'سنة')}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white p-4 rounded-xl transition-all hover:shadow-lg relative"
                  >
                    <div className="absolute top-2 left-2 bg-yellow-400 text-gray-900 text-xs font-bold px-2 py-1 rounded-full">
                      وفّر 20%
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <div className="font-bold text-lg">اشتراك سنوي</div>
                        <div className="text-sm text-purple-100">15 دينار / شهر (180 د.ت / سنة)</div>
                      </div>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                </div>
              </div>
              
              {/* Contact Support Card */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 text-lg mb-4 text-center flex items-center justify-center gap-2">
                  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  تحتاج مساعدة؟
                </h3>
                
                {/* WhatsApp - Primary */}
                <a 
                  href="https://wa.me/21653518337?text=مرحبا، اشتراكي انتهى وأريد تجديده"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-lg p-4 flex items-center gap-3 transition-all hover:shadow-lg mb-3"
                >
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-right">
                    <div className="font-bold">تواصل عبر واتساب</div>
                    <div className="text-sm text-white/90">رد فوري خلال دقائق</div>
                  </div>
                </a>

                {/* Email */}
                <div className="bg-white rounded-lg p-3 mb-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:support@kestipro.com" className="text-gray-700 hover:text-blue-600 font-medium">
                      support@kestipro.com
                    </a>
                  </div>
                </div>

                {/* Phone */}
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+21653518337" className="text-gray-700 hover:text-blue-600 font-medium" dir="ltr">
                      +216 53 518 337
                    </a>
                  </div>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                تسجيل الخروج
              </button>
            </>
          )}
        </div>

        {/* Background decoration */}
        <div className="fixed top-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full blur-3xl -z-10"></div>
        <div className="fixed bottom-0 left-0 w-96 h-96 bg-yellow-100/30 rounded-full blur-3xl -z-10"></div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowPaymentModal(false)} dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowPaymentModal(false)} className="absolute top-4 left-4 text-gray-400 hover:text-gray-600 transition">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2 text-center">طرق الدفع</h2>
            <p className="text-gray-600 text-center mb-6">
              الباقة: <span className="font-bold text-gray-900">{selectedPlan.name}</span> - <span className="font-bold text-blue-600">{selectedPlan.price} دينار</span>
            </p>

            <p className="text-sm text-gray-600 text-center mb-4">حوّل المبلغ عبر:</p>
            
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-3">
              <img src={paymentInfo.d17Logo} alt="D17" className="w-10 h-10 rounded-lg" />
              <span className="font-medium flex-1">D17</span>
              <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.d17}</span>
            </div>

            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-3">
              <img src={paymentInfo.flouciLogo} alt="Flouci" className="w-10 h-10 rounded-lg" />
              <span className="font-medium flex-1">Flouci</span>
              <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.flouci}</span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <span className="font-medium">{paymentInfo.bankName}</span>
              </div>
              <div className="bg-white rounded-lg p-2 border">
                <p className="font-mono text-sm text-center">{paymentInfo.rib}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium text-center mb-3">بعد الدفع، أرسل صورة الوصل مع إيميل حسابك:</p>
              <a href={`https://wa.me/${paymentInfo.whatsapp}?text=اشتراك%20باقة%20${selectedPlan.name}%20بمبلغ%20${selectedPlan.price}%20دينار`} target="_blank" className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20BA5A] text-white py-3 px-4 rounded-lg font-bold transition-all">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                إرسال الوصل عبر واتساب
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
