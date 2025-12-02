import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import ImageSlider from '@/components/ImageSlider'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SEO from '@/components/SEO'
import ContactForm from '@/components/ContactForm'

export default function Home() {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string, period: string} | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0) // 0 is لوحة التحكم (default)

  const slides = [
    { img: '/test1.png', title: 'لوحة التحكم' },
    { img: '/test2.png', title: 'نقطة البيع' },
    { img: '/test3.png', title: 'التقارير' },
    { img: '/test4.png', title: 'المخزون' },
  ]

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  const problems = [
    { title: 'تسجيل المبيعات يدويا', desc: 'تضييع الوقت كل ليلة في الحسابات والتصحيح', icon: '📝' },
    { title: 'مخزون غير واضح', desc: 'لا تعرف بالضبط ما تبقى من كل صنف ومتى ينفد', icon: '📦' },
    { title: 'مبيعات كثيرة لكن الربح مجهول', desc: 'بعد خصم الايجار والكهرباء والمصروفات لا تعرف كم بقي', icon: '💸' },
    { title: 'لا تستطيع ترك المحل', desc: 'يجب ان تكون موجودا دائما لرؤية ما يحدث', icon: '🔒' },
    { title: 'كاشير تقليدي غالي جدا', desc: 'تكلفة كبيرة مقدما + صيانة سنوية + جهاز خاص', icon: '🚫' },
  ]

  const paymentInfo = {
    rib: '24031168005251110132',
    bankName: 'BTE Bank',
    d17: '58415520',
    flouci: '58415520',
    phone: '+21653518337',
    email: 'support@kestipro.com',
    whatsapp: '21653518337',
    instagram: 'https://www.instagram.com/kesti_tn',
    d17Logo: 'https://play-lh.googleusercontent.com/lOgvUGpz6YUSXJG48kbzGrTEohIC8FDr_WkP6rwgaELR0g5o6OQu5-VPGexKoB8F0C-_',
    flouciLogo: 'https://play-lh.googleusercontent.com/CK9-8mnJO0rlqQf8-D44yX_J1iEXqZ7RqpXJnTkIlrpqBgiBIT5TQXtORU55vDG-vXU'
  }

  const openPaymentModal = (planName: string, price: string, period: string) => {
    setSelectedPlan({ name: planName, price, period })
    setShowPaymentModal(true)
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1)
      const params = new URLSearchParams(hash)
      if (params.get('type') === 'recovery' && params.get('access_token')) {
        router.replace('/reset-password' + window.location.hash)
      }
    }
  }, [router])

  const contactInfo = {
    phone: '+21653518337',
    email: 'support@kestipro.com',
    whatsapp: '21653518337',
    facebook: 'https://www.facebook.com/profile.php?id=61581670844981',
    instagram: 'https://www.instagram.com/kesti_tn'
  }

  const features = [
    { title: 'بيع في ثانيتين', desc: 'ضغطتين والمبيع يحفظ تلقائيا', icon: '⚡' },
    { title: 'مخزونك دائما تحت عينيك', desc: 'تعرف كم بقى من كل صنف مع تنبيه قبل النفاد', icon: '📦' },
    { title: 'ربحك الصافي كل يوم', desc: 'بعد الايجار والكهرباء والمصاريف كلها', icon: '📊' },
    { title: 'حسابات تلقائية', desc: 'لا تقعد تحسب للفجر، النظام يحسب لك كل شيء', icon: '💰' },
    { title: 'تحكم من اي مكان', desc: 'من البيت او القهوة، من اي تليفون او كمبيوتر', icon: '🌍' },
    { title: 'يعمل على تليفونك', desc: 'لا تشتري جهاز كاشير غالي', icon: '📱' },
    { title: 'دعم واتساب فوري', desc: 'سؤال؟ نرد عليك في دقائق', icon: '🎧' },
  ]

  const monthlyPrice = 19
  const threeMonthPrice = 17
  const yearlyPrice = 15

  const faqs = [
    { q: 'هل يعمل على الحاسوب والتابلت؟', a: 'نعم، يعمل على كل الأجهزة بنفس الحساب.' },
    { q: 'هل أحتاج إنترنت؟', a: 'نعم، اتصال إنترنت بسيط يكفي.' },
    { q: 'كيف أدفع؟', a: 'عبر D17 أو Flouci أو تحويل بنكي.' },
  ]

  return (
    <>
      <SEO 
        title="Kesti Pro - نظام نقاط البيع الأول في تونس"
        description="نظام احترافي لإدارة المبيعات والمخزون. جرّب مجاناً 15 يوم!"
        canonicalUrl="/"
        ogType="website"
      />

      <div className="min-h-screen bg-white" dir="rtl">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <img src="/logo/logo no bg low qulity.png" alt="Kesti Pro" className="h-8 w-auto" />
              
              <div className="hidden md:flex items-center gap-6">
                <a href="#features" className="text-gray-600 hover:text-gray-900 font-medium">المميزات</a>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900 font-medium">الأسعار</a>
                <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">دخول</Link>
                <Link href="/signup" className="bg-gray-900 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-800 transition">
                  ابدأ مجاناً
                </Link>
              </div>

              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> 
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                </svg>
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t space-y-3">
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">المميزات</a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">الأسعار</a>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-gray-600">دخول</Link>
                <Link href="/signup" className="block bg-gray-900 text-white px-5 py-3 rounded-lg font-semibold text-center">ابدأ مجاناً</Link>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section - Full Height */}
        <section className="min-h-screen flex items-center pt-20 pb-10">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                
                {/* Left Content */}
                <div className="text-center lg:text-right animate-fadeIn">
                  
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-full text-[14px] sm:text-[15px] font-medium mb-6 animate-pulse">
                    <span>🚀</span>
                    <span>ادارة المبيعات والمخزون بذكاء</span>
                  </div>
                  
                  {/* Main Headline - 36-40px mobile, 48-60px desktop */}
                  <h1 className="text-[36px] sm:text-[42px] md:text-[50px] lg:text-[58px] font-black text-gray-900 mb-6 leading-[1.2]">
                    <span className="text-red-600">وداعا</span> للدفاتر
                    <br />
                    والحسابات اليدوية
                  </h1>
                  
                  {/* Subtitle - 18-22px mobile, 24-28px desktop */}
                  <p className="text-[18px] sm:text-[20px] md:text-[24px] text-gray-600 mb-8 leading-[1.7]">
                    <span className="text-green-600 font-bold">✓</span> مرحبا بالتحكم الكامل والربح الواضح
                  </p>

                  {/* UVP Pills - 15-16px */}
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-8">
                    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full text-[15px] sm:text-[16px] hover:bg-gray-200 transition-all duration-300">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>تليفونك يكفي</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full text-[15px] sm:text-[16px] hover:bg-gray-200 transition-all duration-300">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>19 دينار فقط</span>
                    </div>
                    <div className="flex items-center gap-2 bg-gray-100 text-gray-700 px-5 py-2.5 rounded-full text-[15px] sm:text-[16px] hover:bg-gray-200 transition-all duration-300">
                      <span className="text-green-500 font-bold">✓</span>
                      <span>دعم فوري</span>
                    </div>
                  </div>

                  {/* CTA Buttons - 17-19px mobile, 19-21px desktop */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
                    <Link href="/signup" className="bg-gray-900 text-white px-8 py-4 rounded-xl font-bold text-[17px] sm:text-[19px] hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-lg">
                      جرب 15 يوم مجانا
                    </Link>
                    <a href="https://wa.me/21653518337?text=اريد%20تجربة%20Kesti%20Pro" target="_blank" className="border-2 border-green-500 text-green-600 px-8 py-4 rounded-xl font-bold text-[17px] sm:text-[19px] hover:bg-green-50 hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                      تواصل واتساب
                    </a>
                  </div>

                  {/* Trust Line - 14-16px */}
                  <p className="text-[14px] sm:text-[16px] text-gray-500 leading-[1.7]">
                    جرب مجانا 15 يوم، لو ما اعجبك ما تخسر شيء
                  </p>

                  {/* Image Slider - MOBILE ONLY (after buttons) */}
                  <div className="lg:hidden mt-8">
                    <div className="bg-gray-100 rounded-2xl p-3 relative overflow-hidden shadow-lg">
                      <div className="relative aspect-video">
                        <img 
                          src={slides[currentSlide].img} 
                          alt={slides[currentSlide].title}
                          className="w-full h-full object-cover rounded-xl"
                        />
                        <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-[14px] font-medium">
                          {slides[currentSlide].title}
                        </div>
                      </div>
                      
                      <button onClick={prevSlide} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                      </button>
                      <button onClick={nextSlide} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                      </button>
                      
                      <div className="flex justify-center gap-2 mt-3">
                        {slides.map((_, idx) => (
                          <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-gray-900 w-6' : 'bg-gray-300 w-2'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right - Image Slider - DESKTOP ONLY */}
                <div className="relative hidden lg:block">
                  <div className="bg-gray-100 rounded-2xl p-3 relative overflow-hidden shadow-2xl">
                    <div className="relative aspect-[4/3]">
                      <img 
                        src={slides[currentSlide].img} 
                        alt={slides[currentSlide].title}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium">
                        {slides[currentSlide].title}
                      </div>
                    </div>
                    
                    <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center hover:bg-white transition">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center hover:bg-white transition">
                      <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                    
                    <div className="flex justify-center gap-2 mt-3">
                      {slides.map((_, idx) => (
                        <button key={idx} onClick={() => setCurrentSlide(idx)} className={`h-2 rounded-full transition-all ${idx === currentSlide ? 'bg-gray-900 w-6' : 'bg-gray-300 w-2'}`} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Scroll Indicator */}
              <div className="hidden lg:flex justify-center mt-8">
                <a href="#problems" className="flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition">
                  <span className="text-sm">اكتشف المزيد</span>
                  <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Problems Section - Dark */}
        <section id="problems" className="py-20 md:py-28 bg-gray-900">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-[24px] sm:text-[28px] md:text-[36px] lg:text-[42px] font-bold text-white mb-3 leading-[1.3]">هل تعاني من هذه المشاكل؟</h2>
              <div className="w-20 h-1 bg-red-500 mx-auto rounded"></div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
              {problems.map((problem, idx) => (
                <div key={idx} className="bg-gray-800 rounded-2xl p-5 md:p-6 border border-gray-700 hover:border-red-500 hover:bg-gray-700 hover:-translate-y-2 transition-all duration-500 group cursor-pointer">
                  <div className="text-[36px] md:text-[42px] mb-4 group-hover:scale-110 transition-transform duration-300">{problem.icon}</div>
                  <h3 className="font-bold text-white text-[16px] md:text-[18px] lg:text-[20px] mb-2 leading-[1.4]">{problem.title}</h3>
                  <p className="text-[14px] md:text-[15px] lg:text-[16px] text-gray-400 leading-[1.6]">{problem.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-10">
              <p className="text-[16px] sm:text-[18px] text-gray-400 mb-4">Kesti Pro يحل كل هذه المشاكل</p>
              <Link href="/signup" className="inline-flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-[16px] sm:text-[18px] hover:bg-red-700 hover:gap-3 transition-all duration-300">
                ابدا الان
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-[24px] sm:text-[28px] md:text-[36px] lg:text-[42px] font-bold text-gray-900 mb-3 leading-[1.3]">كل ما تحتاجه لادارة محلك</h2>
              <p className="text-[16px] sm:text-[18px] md:text-[20px] text-gray-600 leading-[1.7]">نظام متكامل يوفر وقتك ويزيد ارباحك</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 max-w-6xl mx-auto">
              {features.map((feature, idx) => (
                <div key={idx} className="bg-gray-50 rounded-2xl p-5 md:p-6 border border-gray-200 hover:border-gray-400 hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer">
                  <div className="text-[36px] md:text-[42px] mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
                  <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold text-gray-900 mb-2 leading-[1.4]">{feature.title}</h3>
                  <p className="text-[14px] md:text-[15px] lg:text-[16px] text-gray-600 leading-[1.6]">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-[24px] sm:text-[28px] md:text-[36px] lg:text-[42px] font-bold text-gray-900 mb-3 leading-[1.3]">اسعار بسيطة وواضحة</h2>
              <p className="text-[16px] sm:text-[18px] md:text-[20px] text-gray-600 leading-[1.7]">جميع الباقات تشمل كل المميزات</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Monthly */}
              <div className="bg-white rounded-3xl p-7 md:p-9 border-2 border-gray-100 hover:border-gray-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer">
                <h3 className="text-[20px] md:text-[22px] lg:text-[24px] font-bold text-gray-900 mb-2">شهري</h3>
                <p className="text-gray-500 text-[16px] md:text-[17px] mb-5">مرونة كاملة</p>
                <div className="mb-7">
                  <span className="text-[48px] md:text-[56px] lg:text-[64px] font-black text-gray-900">{monthlyPrice}</span>
                  <span className="text-gray-500 text-[18px] md:text-[20px] mr-1">د.ت/شهر</span>
                </div>
                <button onClick={() => openPaymentModal('شهري', '19', 'شهر')} className="w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-bold text-[17px] md:text-[18px] lg:text-[19px] hover:bg-gray-200 hover:scale-105 transition-all duration-300">
                  اشترك الآن
                </button>
              </div>

              {/* 3 Months - Popular */}
              <div className="bg-gray-900 rounded-3xl p-7 md:p-9 text-white relative hover:scale-105 transition-all duration-500 shadow-2xl">
                <div className="absolute -top-4 right-6 bg-red-500 text-white text-[14px] md:text-[15px] px-5 py-2 rounded-full font-bold shadow-lg">الأكثر طلبا</div>
                <h3 className="text-[20px] md:text-[22px] lg:text-[24px] font-bold mb-2">3 أشهر</h3>
                <p className="text-gray-400 text-[16px] md:text-[17px] mb-5">وفر 10%</p>
                <div className="mb-7">
                  <span className="text-[48px] md:text-[56px] lg:text-[64px] font-black">{threeMonthPrice}</span>
                  <span className="text-gray-400 text-[18px] md:text-[20px] mr-1">د.ت/شهر</span>
                  <p className="text-[15px] md:text-[16px] text-gray-400 mt-2">51 د.ت اجمالي</p>
                </div>
                <button onClick={() => openPaymentModal('3 أشهر', '51', '3 أشهر')} className="w-full bg-white text-gray-900 py-4 rounded-xl font-bold text-[17px] md:text-[18px] lg:text-[19px] hover:bg-gray-100 transition-all duration-300">
                  اشترك الآن
                </button>
              </div>

              {/* Yearly */}
              <div className="bg-white rounded-3xl p-7 md:p-9 border-2 border-gray-100 hover:border-gray-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer">
                <h3 className="text-[20px] md:text-[22px] lg:text-[24px] font-bold text-gray-900 mb-2">سنوي</h3>
                <p className="text-gray-500 text-[16px] md:text-[17px] mb-5">وفر 21%</p>
                <div className="mb-7">
                  <span className="text-[48px] md:text-[56px] lg:text-[64px] font-black text-gray-900">{yearlyPrice}</span>
                  <span className="text-gray-500 text-[18px] md:text-[20px] mr-1">د.ت/شهر</span>
                  <p className="text-[15px] md:text-[16px] text-gray-400 mt-2">180 د.ت اجمالي</p>
                </div>
                <button onClick={() => openPaymentModal('سنوي', '180', 'سنة')} className="w-full bg-gray-100 text-gray-900 py-4 rounded-xl font-bold text-[17px] md:text-[18px] lg:text-[19px] hover:bg-gray-200 hover:scale-105 transition-all duration-300">
                  اشترك الآن
                </button>
              </div>
            </div>

            <div className="text-center mt-10">
              <Link href="/signup" className="inline-block bg-gray-900 text-white px-10 py-4 rounded-xl font-bold text-[17px] md:text-[19px] hover:bg-gray-800 hover:scale-105 transition-all duration-300 shadow-lg">
                ابدا تجربتك المجانية - 15 يوم
              </Link>
              <p className="text-[14px] sm:text-[16px] text-gray-500 mt-4 leading-[1.6]">بدون بطاقة بنكية • الغاء في أي وقت</p>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 md:py-28 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-[24px] sm:text-[28px] md:text-[36px] lg:text-[42px] font-bold text-gray-900 mb-3 leading-[1.3]">أسئلة شائعة</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div key={idx} className="bg-gray-900 text-white rounded-2xl p-6 md:p-8 hover:bg-gray-800 transition-all duration-300 cursor-pointer">
                    <h3 className="font-bold text-[18px] md:text-[20px] lg:text-[22px] mb-3 leading-[1.4]">{faq.q}</h3>
                    <p className="text-gray-300 text-[16px] md:text-[17px] lg:text-[18px] leading-[1.7]">{faq.a}</p>
                  </div>
                ))}
              </div>
              
              <ContactForm className="animate-fadeIn" />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="text-[28px] sm:text-[36px] md:text-[48px] lg:text-[56px] font-black mb-6 leading-[1.2] animate-fadeIn">جاهز لتطوير تجارتك؟</h2>
            <p className="text-gray-300 text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] mb-10 max-w-2xl mx-auto leading-[1.7]">انضم لمئات التجار الذين يديرون أعمالهم بذكاء مع Kesti Pro</p>
            <Link href="/signup" className="inline-block bg-white text-gray-900 px-12 py-5 rounded-2xl font-black text-[18px] md:text-[20px] lg:text-[22px] hover:bg-gray-100 hover:scale-110 transition-all duration-500 shadow-2xl hover:shadow-white/20">
              ابدا مجانا الآن
            </Link>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 bg-gray-50 border-t border-gray-200">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <img src="/logo/logo no bg low qulity.png" alt="Kesti Pro" className="h-7" />
                <span className="font-bold text-gray-900">Kesti Pro</span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <a href={`mailto:${contactInfo.email}`}>{contactInfo.email}</a>
                <a href={`tel:${contactInfo.phone}`}>{contactInfo.phone}</a>
              </div>

              <div className="flex items-center gap-4">
                <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition">
                  <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                </a>
              </div>
            </div>
            
            <div className="text-center text-gray-500 text-sm mt-8">
              © 2024 Kesti Pro. جميع الحقوق محفوظة.
            </div>
          </div>
        </footer>

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-bold mb-4">تواصل معنا</h3>
              <div className="space-y-3">
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                  <span>📞</span>
                  <span>{contactInfo.phone}</span>
                </a>
                <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                  <span>💬</span>
                  <span>واتساب</span>
                </a>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100">
                  <span>📧</span>
                  <span>{contactInfo.email}</span>
                </a>
              </div>
              <button onClick={() => setShowContact(false)} className="w-full mt-4 py-3 bg-gray-100 rounded-xl font-semibold">إغلاق</button>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative" onClick={e => e.stopPropagation()}>
              {/* Close Button - Very Visible */}
              <button 
                onClick={() => setShowPaymentModal(false)} 
                className="absolute top-3 left-3 z-10 w-8 h-8 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center transition"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="bg-gray-900 text-white p-6 text-center">
                <p className="text-gray-400 text-sm mb-1">باقة {selectedPlan.name}</p>
                <div className="text-5xl font-bold">{selectedPlan.price} <span className="text-xl">د.ت</span></div>
              </div>
              
              <div className="p-5 space-y-3">
                <p className="text-sm text-gray-600 text-center mb-4">حوّل المبلغ عبر:</p>
                
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
          </div>
        )}
      </div>
    </>
  )
}
