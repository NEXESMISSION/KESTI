import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Profile } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface PageHeaderProps {
  showBackButton?: boolean
  backHref?: string
  backTitle?: string
}

export default function PageHeader({ showBackButton = true, backHref = '/pos', backTitle = 'العودة إلى نقطة البيع' }: PageHeaderProps) {
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string, period: string } | null>(null)
  
  // Payment information
  const paymentInfo = {
    d17: '58518337',
    d17Logo: 'https://play-lh.googleusercontent.com/YGHZQP3dRMET7lNA3fQXzN5tarjx0AeVDifKP_efMHhPTmf-P56aNmYcOo8P8MlVJwA',
    flouci: '58518337',
    flouciLogo: 'https://flouci.com/assets/img/favicon.png',
    bankName: 'Banque de Tunisie (BT)',
    rib: '04 000 0003308031839 74',
    whatsapp: '21653518337',
    instagram: 'https://www.instagram.com/kesti_tn'
  }
  
  const openPaymentModal = (name: string, price: string, period: string) => {
    setSelectedPlan({ name, price, period })
    // Scroll to payment methods section after a small delay
    setTimeout(() => {
      const element = document.getElementById('payment-methods')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }, 100)
  }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!error && data) {
        setProfile(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setLoading(false)
    }
  }

  const getSubscriptionDaysLeft = (profile: Profile | null): number => {
    if (!profile?.subscription_ends_at) return 0
    const now = new Date()
    const endDate = new Date(profile.subscription_ends_at)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const getSubscriptionStatus = (profile: Profile | null) => {
    if (!profile?.subscription_ends_at) return { text: 'لا يوجد اشتراك', color: 'text-gray-500', bgColor: 'bg-gray-100' }
    const daysLeft = getSubscriptionDaysLeft(profile)
    if (daysLeft === 0) return { text: 'منتهي', color: 'text-red-600', bgColor: 'bg-red-100' }
    if (daysLeft <= 7) return { text: `${daysLeft} أيام متبقية`, color: 'text-orange-600', bgColor: 'bg-orange-100' }
    return { text: `${daysLeft} يوم متبقي`, color: 'text-green-600', bgColor: 'bg-green-100' }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-TN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const daysLeft = getSubscriptionDaysLeft(profile)
  const subStatus = getSubscriptionStatus(profile)

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto py-3 sm:py-4 px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Image src="/logo/KESTI.png" alt="KESTI" width={120} height={40} className="h-8 sm:h-10 w-auto" priority />
            
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Profile Button */}
              {profile && (
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="relative bg-indigo-600 hover:bg-indigo-700 text-white p-2 sm:p-2.5 rounded-lg transition group"
                  title="الملف الشخصي"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {/* Notification Badge */}
                  {profile.role === 'business_user' && daysLeft <= 7 && daysLeft > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {daysLeft}
                    </span>
                  )}
                  {profile.role === 'business_user' && daysLeft === 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      !
                    </span>
                  )}
                </button>
              )}
              
              {/* Back Button */}
              {showBackButton && (
                <button
                  onClick={() => window.location.href = backHref}
                  className="bg-gray-600 hover:bg-gray-700 text-white p-2 sm:p-2.5 rounded-lg transition"
                  title={backTitle}
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal - Landing Page Style */}
      {showProfileModal && profile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowProfileModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            {/* Close Button */}
            <button
              onClick={() => setShowProfileModal(false)}
              className="absolute top-3 left-3 z-10 w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* User Information */}
            <div className="p-6 bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                معلومات المستخدم
              </h3>
              <div className="space-y-3">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">الاسم الكامل</div>
                  <div className="font-semibold text-gray-900">{profile.full_name || 'غير محدد'}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">البريد الإلكتروني</div>
                  <div className="font-semibold text-gray-900 text-sm break-all">{profile.email}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">رقم الهاتف</div>
                  <div className="font-semibold text-gray-900">{(profile as any).phone_number || 'غير محدد'}</div>
                </div>
              </div>
            </div>

            {/* Subscription Info - Exact Landing Page Style */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-6 text-center">
              <h3 className="text-2xl font-bold mb-2">معلومات الاشتراك</h3>
              <div className="text-5xl font-black my-4">{daysLeft}</div>
              <p className="text-indigo-100 text-lg">يوم متبقي في اشتراكك</p>
              {profile.subscription_ends_at && (
                <p className="text-indigo-200 text-sm mt-2">
                  ينتهي في: {new Date(profile.subscription_ends_at).toLocaleDateString('ar-TN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              )}
            </div>
            
            {/* Renew Button */}
            <div className="p-6">
              <button
                onClick={() => {
                  setShowProfileModal(false)
                  setShowPaymentModal(true)
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition"
              >
                تجديد الاشتراك
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Pricing Plans */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()} dir="rtl">
            <button 
              onClick={() => setShowPaymentModal(false)} 
              className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center transition"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Pricing Plans */}
            <div className="p-6">
              <h2 className="text-3xl font-bold text-center mb-2">اختر خطتك</h2>
              <p className="text-center text-gray-600 mb-6">جميع الباقات تشمل كل المميزات</p>
              
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {/* Monthly */}
                <div className={`bg-white border-2 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer ${selectedPlan?.name === 'شهري' ? 'border-indigo-600 shadow-lg' : 'border-gray-200'}`} onClick={() => openPaymentModal('شهري', '19', 'شهر')}>
                  <h3 className="text-xl font-bold mb-1">شهري</h3>
                  <p className="text-gray-500 text-sm mb-4">مرونة كاملة</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">19</span>
                    <span className="text-gray-500 mr-1">د.ت/شهر</span>
                  </div>
                  <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                    اشترك الآن
                  </button>
                </div>

                {/* 3 Months - Popular */}
                <div className={`bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-2xl p-6 relative hover:scale-105 transition shadow-xl ${selectedPlan?.name === '3 أشهر' ? 'ring-4 ring-indigo-400' : ''}`} onClick={() => openPaymentModal('3 أشهر', '51', '3 أشهر')}>
                  <div className="absolute -top-3 right-4 bg-red-500 text-white text-xs px-4 py-1 rounded-full font-bold">الأكثر طلبا</div>
                  <h3 className="text-xl font-bold mb-1">3 أشهر</h3>
                  <p className="text-gray-400 text-sm mb-4">وفر 10%</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">17</span>
                    <span className="text-gray-400 mr-1">د.ت/شهر</span>
                    <p className="text-sm text-gray-400 mt-1">51 د.ت اجمالي</p>
                  </div>
                  <button className="w-full bg-white text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-100 transition">
                    اشترك الآن
                  </button>
                </div>

                {/* Yearly */}
                <div className={`bg-white border-2 rounded-2xl p-6 hover:border-indigo-500 hover:shadow-lg transition cursor-pointer ${selectedPlan?.name === 'سنوي' ? 'border-indigo-600 shadow-lg' : 'border-gray-200'}`} onClick={() => openPaymentModal('سنوي', '180', 'سنة')}>
                  <h3 className="text-xl font-bold mb-1">سنوي</h3>
                  <p className="text-gray-500 text-sm mb-4">وفر 21%</p>
                  <div className="mb-4">
                    <span className="text-4xl font-black">15</span>
                    <span className="text-gray-500 mr-1">د.ت/شهر</span>
                    <p className="text-sm text-gray-500 mt-1">180 د.ت اجمالي</p>
                  </div>
                  <button className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
                    اشترك الآن
                  </button>
                </div>
              </div>

              {/* Payment Methods */}
              {selectedPlan && (
                <div className="border-t pt-6" id="payment-methods">
                  <h3 className="text-xl font-bold text-center mb-4">طرق الدفع</h3>
                  <div className="bg-gray-900 text-white p-4 rounded-xl mb-4 text-center">
                    <p className="text-gray-400 text-sm mb-1">باقة {selectedPlan.name}</p>
                    <div className="text-3xl font-bold">{selectedPlan.price} <span className="text-lg">د.ت</span></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <img src={paymentInfo.d17Logo} alt="D17" className="w-10 h-10 rounded-lg" />
                      <span className="font-medium flex-1">D17</span>
                      <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.d17}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <img src={paymentInfo.flouciLogo} alt="Flouci" className="w-10 h-10 rounded-lg" />
                      <span className="font-medium flex-1">Flouci</span>
                      <span className="font-mono font-bold bg-gray-200 px-3 py-1 rounded-lg">{paymentInfo.flouci}</span>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3">
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

                    <div className="border-t pt-4 mt-4">
                      <p className="text-sm font-medium text-center mb-3">بعد الدفع، أرسل صورة الوصل مع إيميل حسابك:</p>
                      <div className="flex gap-3 justify-center">
                        <a href={`https://wa.me/${paymentInfo.whatsapp}?text=اشتراك%20باقة%20${selectedPlan.name}%20بمبلغ%20${selectedPlan.price}%20دينار`} target="_blank" className="flex items-center gap-2 bg-[#25D366] text-white py-2.5 px-4 rounded-lg font-medium">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          واتساب
                        </a>
                        <a href={paymentInfo.instagram} target="_blank" className="flex items-center gap-2 bg-gray-900 text-white py-2.5 px-4 rounded-lg font-medium">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          انستغرام
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
