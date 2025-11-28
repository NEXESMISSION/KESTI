import { useState, useEffect } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import ImageSlider from '@/components/ImageSlider'
import Link from 'next/link'
import { useRouter } from 'next/router'
import SEO from '@/components/SEO'

export default function Home() {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Handle password reset redirect
  useEffect(() => {
    // Check if URL has password reset tokens in hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1) // Remove #
      const params = new URLSearchParams(hash)
      
      // Check if this is a password recovery link
      if (params.get('type') === 'recovery' && params.get('access_token')) {
        // Redirect to reset-password page with the full hash
        router.replace('/reset-password' + window.location.hash)
      }
    }
  }, [])

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // Use router for client-side navigation
    router.push('/login')
  }

  const contactInfo = {
    phone: '+216 53518337',
    email: 'support@kestipro.com',
    whatsapp: '+216 53518337',
    facebook: 'https://www.facebook.com/profile.php?id=61581670844981',
    instagram: 'https://www.instagram.com/kesti_tn'
  }

  const problems = [
    {
      title: 'تسجيل المبيعات يدوياً في الدفاتر',
      description: 'تضييع 2-4 ساعات كل ليلة في الحسابات اليدوية',
      icon: '📝'
    },
    {
      title: 'مخزون ضائع ولا تعرف أين ذهب',
      description: 'خسارة عشرات الآلاف سنوياً في بضائع ناقصة أو منتهية الصلاحية',
      icon: '📦'
    },
    {
      title: 'لا تعرف الربح الحقيقي',
      description: 'ترى المبيعات مرتفعة ولكن بعد المصروفات والسرقة لا يبقى شيء',
      icon: '💰'
    },
    {
      title: 'سرقة الموظفين أو الأخطاء اليومية',
      description: '10-20% من المبيعات تختفي دون أن تلاحظ',
      icon: '⚠️'
    },
    {
      title: 'يجب أن تكون في المحل 12-14 ساعة يومياً',
      description: 'لا عطلة ولا حياة عائلية ولا فرع ثانٍ ممكن',
      icon: '🔒'
    },
    {
      title: 'صعوبة معرفة المنتجات الأكثر مبيعاً',
      description: 'تطلب بضائع لا تباع وتنسى البضائع المطلوبة',
      icon: '📊'
    }
  ]

  const monthlyPrice = 30
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.85) // 15% discount
  const yearlyMonthlyEquivalent = Math.round(yearlyPrice / 12)

  const features = [
    'تسجيل المبيعات بسرعة البرق (ضغطتان فقط)',
    'متابعة المخزون لحظياً مع تنبيهات النقص والانتهاء',
    'حساب الربح الصافي تلقائياً بعد خصم جميع المصروفات (إيجار، كهرباء، بنزين…)',
    'إدارة الموظفين والصلاحيات بكل سهولة',
    'تقارير ذكية تُظهر المنتجات الأكثر مبيعاً والأقل طلباً',
    'نساعدك في إضافة منتجاتك مع أول اشتراك'
  ]

  const devices = [
    {
      name: 'هاتفك العادي',
      desc: 'أندرويد أو آيفون - استخدمه ككاشير كامل',
      icon: '📱'
    },
    {
      name: 'التابلت الذي لديك',
      desc: 'شاشة أكبر للراحة',
      icon: '📲'
    },
    {
      name: 'الحاسوب المكتبي أو اللابتوب',
      desc: 'للتقارير والإدارة الكاملة',
      icon: '💻'
    }
  ]

  const testimonials = [
    {
      name: 'أحمد الزغلامي',
      business: 'صاحب سوبرماركت',
      text: 'كنت أضيع 3 ساعات كل ليلة في الحسابات. الآن أعرف كل شيء في ثانية واحدة.'
    },
    {
      name: 'فاطمة بن عمر',
      business: 'صاحبة محل ملابس',
      text: 'اكتشفت أن 15% من المبيعات كانت تضيع. الآن كل قرش تحت السيطرة.'
    },
    {
      name: 'محمد الناصري',
      business: 'صاحب صيدلية',
      text: 'فتحت فرع ثاني بفضل Kesti Pro. أراقب الفرعين من بيتي وأنا مرتاح.'
    },
    {
      name: 'سامي التونسي',
      business: 'صاحب مطعم',
      text: 'النظام ساعدني على تنظيم المخزون وتقليل الهدر. الأرباح زادت 30% في 3 أشهر.'
    }
  ]

  const faqs = [
    {
      q: 'هل يعمل على الحاسوب والتابلت أيضاً؟',
      a: 'نعم، يعمل على كل الأجهزة بنفس الحساب وفي نفس الوقت.'
    },
    {
      q: 'هل أحتاج إلى إنترنت؟',
      a: 'نعم، تحتاج اتصال إنترنت بسيط. يعمل حتى مع أبطأ سرعة.'
    },
    {
      q: 'ماذا يحدث بعد انتهاء فترة التجربة؟',
      a: 'إذا لم تشترك، يتوقف النظام لكن بياناتك تبقى آمنة. يمكنك العودة في أي وقت.'
    },
    {
      q: 'هل تساعدوني في إضافة المنتجات؟',
      a: 'نعم! نضيف كل منتجاتك مجاناً. أرسل ملف إكسل أو صور الباركود ونحن نقوم بالباقي.'
    },
    {
      q: 'هل يمكن استخدامه لأكثر من محل؟',
      a: 'نعم، يمكنك إدارة عدة فروع من نفس الحساب.'
    },
    {
      q: 'كيف أدفع؟',
      a: 'الدفع شهرياً عن طريق التحويل البنكي أو d17 أو غيرها من وسائل الدفع المحلية.'
    }
  ]

  return (
    <>
      <SEO 
        title="Kesti Pro - نظام نقاط البيع الأول في تونس | POS System Tunisia"
        description="نظام Kesti Pro الاحترافي لإدارة المبيعات والمخزون في تونس. POS System متكامل للمحلات التجارية، المطاعم، والصيدليات. نظام كاشير ذكي، تقارير مفصلة، إدارة المخزون التلقائية. جرّب مجاناً 15 يوم!"
        keywords="kesti, KESTI, KestiPro, Kesti Pro, kestipro, kestipro.com, kesti tunisia, kesti tn, kesti تونس, نظام نقاط البيع تونس, POS System Tunisia, Kesti TN, نظام كاشير تونس, برنامج محاسبة تونس, إدارة المبيعات تونس, نظام المخزون تونس, Point of Sale Tunisia, Caisse Enregistreuse Tunisie, logiciel de gestion Tunisie, système de caisse Tunisie, gestion stock Tunisie, pos tunisia, cashier system tunisia, retail management tunisia, kesti pos, kesti system, كيستي, كيستي برو"
        canonicalUrl="/"
        ogType="website"
      />

      <div className="min-h-screen bg-white" dir="rtl">
        {/* Navigation Header - Redesigned */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md border-b border-gray-100">
          <div className="container mx-auto px-3 md:px-4">
            <div className="flex items-center justify-between h-14 md:h-16">
              {/* Logo */}
              <div className="flex items-center">
                <img src="/logo/KESTi.png" alt="Kesti Pro" className="h-7 md:h-9 w-auto" />
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                <Link
                  href="#features"
                  className="text-gray-700 hover:text-primary transition px-2 lg:px-3 py-2 font-medium text-sm"
                >
                  المميزات
                </Link>
                <Link
                  href="#pricing"
                  className="text-gray-700 hover:text-primary transition px-2 lg:px-3 py-2 font-medium text-sm"
                >
                  الأسعار
                </Link>
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-blue-600 to-primary text-white px-4 lg:px-6 py-2 font-bold text-sm border-2 border-blue-400 rounded-lg hover:scale-105 hover:shadow-lg transition-all"
                >
                  🔐 دخول
                </Link>
                <Link
                  href="/signup"
                  className="relative bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 lg:px-6 py-2 rounded-lg font-black text-sm hover:scale-105 transition-all shadow-lg hover:shadow-green-500/50 border-2 border-green-400 animate-pulse hover:animate-none"
                >
                  🚀 تجربة مجانية
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">50 فقط!</span>
                </Link>
              </div>
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-gray-700 hover:text-primary transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
            
            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
              <div className="md:hidden py-3 border-t border-gray-100 space-y-2">
                <Link
                  href="#features"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-primary hover:bg-gray-50 transition px-3 py-2 rounded-lg text-sm font-medium"
                >
                  المميزات
                </Link>
                <Link
                  href="#pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-primary hover:bg-gray-50 transition px-3 py-2 rounded-lg text-sm font-medium"
                >
                  الأسعار
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative block w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-3 rounded-lg font-black text-base text-center border-2 border-green-400 shadow-lg"
                >
                  🚀 تجربة مجانية
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">50 فقط!</span>
                </Link>
                <a
                  href="/login"
                  onClick={(e) => { handleLoginClick(e); setMobileMenuOpen(false); }}
                  className="block w-full bg-gradient-to-r from-blue-600 to-primary text-white px-4 py-2.5 rounded-lg font-bold text-sm text-center border-2 border-blue-400 cursor-pointer"
                >
                  🔐 تسجيل الدخول
                </a>
                <button
                  onClick={() => { setShowContact(true); setMobileMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2.5 rounded-lg font-bold text-sm shadow-md"
                >
                  📞 تواصل معنا
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section - Ultra Modern Design */}
        <section className="relative bg-white overflow-hidden min-h-screen flex items-center pt-20">
          {/* Advanced Background with Multiple Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
          
          {/* Animated Background Shapes - Enhanced */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-[500px] h-[500px] bg-gradient-to-br from-secondary/20 to-green-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/3 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
          
          {/* Gradient Grid Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
          
          <div className="container mx-auto px-4 py-12 md:py-16 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left side - Enhanced Content */}
                <div className="text-center lg:text-right order-2 lg:order-1 space-y-6 md:space-y-8">
                  {/* Animated Badge */}
                  <div className="inline-block animate-bounce">
                    <div className="bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 px-5 py-2.5 rounded-full shadow-lg">
                      <p className="text-sm md:text-base font-black text-white flex items-center gap-2 justify-center">
                        <span className="animate-pulse">🔥</span>
                        <span>النظام الأكثر شعبية في تونس</span>
                      </p>
                    </div>
                  </div>
                  
                  {/* Main Heading - Enhanced */}
                  <div className="space-y-3">
                    <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-2 leading-[1.05]">
                      <span className="block text-gray-900 drop-shadow-sm">نظام</span>
                      <span className="block bg-gradient-to-l from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient">
                        Kesti Pro
                      </span>
                    </h1>
                    <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-gray-700 leading-relaxed">
                      🚀 إدارة المبيعات والمخزون بذكاء
                    </h2>
                  </div>
                  
                  {/* Value Proposition Box - Enhanced */}
                  <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-gray-700 transform hover:scale-[1.02] transition-all">
                    <div className="space-y-5">
                      <div className="flex items-center gap-4 text-right">
                        <div className="flex-1">
                          <p className="text-lg md:text-2xl font-bold text-white leading-relaxed">
                            <span className="text-red-400">🚫</span> وداعاً للدفاتر والحسابات اليدوية
                          </p>
                        </div>
                      </div>
                      <div className="h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent"></div>
                      <div className="flex items-center gap-4 text-right">
                        <div className="flex-1">
                          <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent leading-relaxed">
                            <span className="text-green-400">✅</span> مرحباً بالتحكم الكامل والربح الواضح
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Primary CTA Buttons - Ultra Highlighted */}
                  <div className="space-y-4 pt-2">
                    {/* Sign Up Button - Most Prominent */}
                    <Link
                      href="/signup"
                      className="group relative bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 text-white px-10 md:px-16 py-5 md:py-7 rounded-2xl text-xl md:text-3xl font-black transition-all shadow-2xl hover:shadow-green-500/50 hover:scale-105 w-full flex items-center justify-center gap-3 md:gap-4 overflow-hidden border-4 border-green-400 animate-pulse hover:animate-none"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <span className="relative z-10 flex items-center gap-3">
                        <span className="text-4xl">🚀</span>
                        <span>ابدأ الآن مجاناً - 15 يوم</span>
                        <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full animate-pulse">للأول 50 فقط</span>
                      </span>
                      <div className="absolute -right-12 top-0 w-24 h-full bg-white/20 transform rotate-12 group-hover:right-full transition-all duration-700"></div>
                    </Link>

                    {/* Sign In Button - Highlighted */}
                    <Link
                      href="/login"
                      className="group relative bg-gradient-to-r from-blue-600 to-primary text-white px-10 md:px-16 py-4 md:py-6 rounded-2xl text-lg md:text-2xl font-black transition-all shadow-xl hover:shadow-blue-500/50 hover:scale-105 w-full flex items-center justify-center gap-3 border-2 border-blue-400"
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        <span className="text-3xl">🔐</span>
                        <span>تسجيل الدخول</span>
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
                    </Link>
                  </div>

                  {/* Secondary CTA Buttons */}
                  <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2">
                    <button
                      onClick={() => setShowContact(true)}
                      className="group bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-lg font-bold hover:scale-105 transition-all shadow-lg hover:shadow-orange-500/50 flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl group-hover:rotate-12 transition-transform">📞</span>
                      <span>تواصل معنا</span>
                    </button>
                    <button
                      onClick={() => setShowVideo(true)}
                      className="group bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 md:px-6 py-3 md:py-4 rounded-xl text-sm md:text-lg font-bold hover:scale-105 transition-all shadow-lg hover:shadow-purple-500/50 flex items-center justify-center gap-2"
                    >
                      <span className="text-2xl group-hover:scale-110 transition-transform">▶️</span>
                      <span>شاهد الفيديو</span>
                    </button>
                  </div>

                  {/* Trust Badges - Enhanced */}
                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
                    <div className="bg-gradient-to-r from-green-100 to-emerald-100 px-4 py-2.5 rounded-full border-2 border-green-300 shadow-md">
                      <p className="text-sm md:text-base font-black text-green-800 flex items-center gap-2">
                        <span className="animate-spin">✨</span>
                        <span>15 يوم مجاني</span>
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">50 فقط</span>
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-100 to-sky-100 px-4 py-2.5 rounded-full border-2 border-blue-300 shadow-md">
                      <p className="text-sm md:text-base font-black text-blue-800 flex items-center gap-2">
                        <span className="animate-pulse">⚡</span>
                        <span>تفعيل فوري</span>
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-yellow-100 to-orange-100 px-4 py-2.5 rounded-full border-2 border-yellow-300 shadow-md">
                      <p className="text-sm md:text-base font-black text-orange-800 flex items-center gap-2">
                        <span>🎁</span>
                        <span>دعم مجاني</span>
                      </p>
                    </div>
                  </div>

                  {/* Social Proof */}
                  <div className="flex items-center justify-center lg:justify-start gap-3 pt-2">
                    <div className="flex -space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center text-white font-bold">👤</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 border-2 border-white flex items-center justify-center text-white font-bold">👤</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 border-2 border-white flex items-center justify-center text-white font-bold">👤</div>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border-2 border-white flex items-center justify-center text-white font-bold">+50</div>
                    </div>
                    <p className="text-sm md:text-base font-bold text-gray-700">
                      <span className="text-green-600">+50</span> تاجر ينضم كل شهر
                    </p>
                  </div>
                </div>

                {/* Right side - Enhanced Image Slider */}
                <div className="order-1 lg:order-2">
                  <div className="relative">
                    {/* Enhanced Glow Effects */}
                    <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 via-purple-500/20 to-secondary/30 blur-3xl rounded-full animate-pulse"></div>
                    <div className="absolute -inset-8 bg-gradient-to-tr from-blue-500/10 to-green-500/10 blur-3xl rounded-full"></div>
                    
                    {/* Floating Elements */}
                    <div className="absolute -top-8 -right-8 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full blur-xl animate-bounce"></div>
                    <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full blur-xl animate-bounce" style={{animationDelay: '0.5s'}}></div>
                    
                    <div className="relative z-10 transform hover:scale-105 transition-transform duration-500">
                      <ImageSlider 
                        images={['dashboard', 'pos', 'reports', 'inventory', 'analytics']}
                        autoPlayInterval={3500}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Enhanced Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-8 h-12 border-3 border-primary rounded-full flex justify-center p-2 bg-white/50 backdrop-blur-sm shadow-lg">
              <div className="w-2 h-4 bg-gradient-to-b from-primary to-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
        </section>

        {/* Our Clients Section */}
        <section className="py-12 md:py-16 bg-white border-y border-gray-200">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 mb-2">🤝 عملاؤنا</h3>
              <p className="text-sm md:text-base text-gray-600">ينضمون إلينا كل يوم</p>
            </div>
            
            {/* Clients Grid - Static */}
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border-2 border-gray-200 hover:border-primary transition-all h-32 hover:shadow-lg">
                  <span className="text-5xl">🏪</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border-2 border-gray-200 hover:border-primary transition-all h-32 hover:shadow-lg">
                  <span className="text-5xl">🏬</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border-2 border-gray-200 hover:border-primary transition-all h-32 hover:shadow-lg">
                  <span className="text-5xl">🛒</span>
                </div>
                <div className="bg-gray-50 rounded-2xl p-8 flex items-center justify-center border-2 border-gray-200 hover:border-primary transition-all h-32 hover:shadow-lg">
                  <span className="text-5xl">🏭</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Modal */}
        {showVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">فيديو تعريفي</h3>
                <button onClick={() => setShowVideo(false)} className="text-3xl hover:text-red-500 transition">×</button>
              </div>
              <div className="bg-gray-200 rounded-lg h-64 md:h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-5xl md:text-6xl mb-3">🎥</div>
                  <p className="text-lg md:text-xl font-bold text-gray-700">جاري العمل عليه</p>
                  <p className="text-sm text-gray-500">قريباً سيكون الفيديو التعريفي متاحاً</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-4" onClick={() => setShowContact(false)}>
            <div className="bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 max-w-md w-full shadow-2xl animate-[slideUp_0.3s_ease-out]" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg md:text-xl font-bold text-gray-900">تواصل معنا</h3>
                <button 
                  onClick={() => setShowContact(false)} 
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-2.5">
                {/* Phone */}
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <p className="text-xs text-gray-500 font-medium">اتصل الآن</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 truncate" dir="ltr">{contactInfo.phone}</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-green-50 rounded-xl hover:bg-green-100 transition-colors group">
                  <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <p className="text-xs text-gray-500 font-medium">واتساب</p>
                    <p className="text-sm md:text-base font-bold text-gray-900 truncate" dir="ltr">{contactInfo.whatsapp}</p>
                  </div>
                </a>

                {/* Email */}
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors group">
                  <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-right min-w-0">
                    <p className="text-xs text-gray-500 font-medium">البريد الإلكتروني</p>
                    <p className="text-xs md:text-sm font-bold text-gray-900 truncate">{contactInfo.email}</p>
                  </div>
                </a>
              </div>

              {/* Social Media */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-gray-500 font-medium">تابعنا</span>
                  <div className="flex gap-2">
                    <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition-colors">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </a>
                    <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 hover:opacity-90 rounded-lg flex items-center justify-center transition-opacity">
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 text-center">
                <p className="text-sm md:text-base font-bold text-white">
                  🎉 ابدأ تجربتك المجانية 15 يوم
                </p>
                <p className="text-xs font-black text-yellow-300 mt-1">
                  ⚡ عرض حصري للأول 50 مستخدم فقط!
                </p>
                <p className="text-xs text-white/90 mt-1">
                  تواصل الآن • تفعيل فوري
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Problems Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(0,99,189,0.1),transparent_40%),radial-gradient(circle_at_80%_70%,rgba(111,198,5,0.1),transparent_40%)]"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12 max-w-4xl mx-auto">
              <div className="inline-block bg-red-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-red-500/30">
                <p className="text-sm md:text-base font-bold text-red-300">⚠️ مشاكل تسرق أموالك</p>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 text-white drop-shadow-lg">
                هل تعاني يومياً من هذه المشاكل؟
              </h2>
              <p className="text-lg md:text-xl text-gray-300">
                مشاكل تضيّع وقتك وأموالك كل يوم
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {problems.map((problem, idx) => (
                <div 
                  key={idx} 
                  className="group relative bg-gradient-to-br from-red-900/40 to-red-800/40 backdrop-blur-sm rounded-3xl p-8 border-2 border-red-500/30 hover:border-red-400 transition-all duration-300 hover:shadow-2xl hover:shadow-red-500/30 hover:-translate-y-2 overflow-hidden"
                >
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <span className="text-4xl">{problem.icon}</span>
                    </div>
                    <h3 className="text-xl font-black mb-4 text-white group-hover:text-red-300 transition-colors leading-snug">{problem.title}</h3>
                    <p className="text-base text-gray-200 leading-relaxed font-medium">{problem.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 max-w-3xl mx-auto">
                <p className="text-xl md:text-2xl font-bold text-white mb-2">
                  🔥 لا تدع هذه المشاكل تسرق أرباحك!
                </p>
                <p className="text-lg text-gray-300">
                  Kesti Pro يحل كل هذه المشاكل في ثوانٍ
                </p>
              </div>
            </div>
          </div>
        </section>


        {/* Solution Section - Redesigned */}
        <section id="features" className="py-20 md:py-28 relative bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Header - Modern Design */}
            <div className="text-center mb-20 max-w-5xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full mb-8 shadow-lg border-2 border-primary/20">
                <span className="text-2xl">✨</span>
                <p className="text-sm md:text-base font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">الحل الشامل لكل احتياجاتك</p>
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                <span className="text-gray-900">حوّل تجارتك مع</span>
                <span className="block bg-gradient-to-r from-primary via-blue-600 to-secondary bg-clip-text text-transparent mt-2">
                  Kesti Pro الذكي
                </span>
              </h2>
              
              <p className="text-lg md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                نظام متكامل وذكي يوفر وقتك، يحمي أموالك، ويسهل حياتك
              </p>
              
              {/* Quick benefits */}
              <div className="flex flex-wrap justify-center gap-4 mt-10">
                <div className="bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
                  <span className="text-primary font-bold">⚡ سريع وسهل</span>
                </div>
                <div className="bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
                  <span className="text-secondary font-bold">🎯 دقيق 100%</span>
                </div>
                <div className="bg-white px-6 py-3 rounded-full shadow-md border border-gray-200">
                  <span className="text-primary font-bold">🔒 آمن تماماً</span>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto mb-16">
              {features.map((feature, idx) => (
                <div 
                  key={idx} 
                  className="group bg-white hover:bg-gradient-to-br hover:from-primary hover:to-secondary p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-transparent hover:scale-105"
                >
                  <div className="flex items-start gap-4 text-right">
                    <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-secondary to-green-400 rounded-xl flex items-center justify-center group-hover:bg-white transition-all">
                      <span className="text-2xl group-hover:scale-110 transition-transform">⭐</span>
                    </div>
                    <p className="text-base md:text-lg text-gray-800 group-hover:text-white font-semibold leading-relaxed transition-colors">
                      {feature}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Demo Showcase - Modern Design */}
            <div className="max-w-7xl mx-auto">
              {/* Section Header */}
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full mb-6 shadow-lg border-2 border-primary/20">
                  <span className="text-2xl">🎬</span>
                  <p className="text-sm md:text-base font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">شاهد النظام بالعمل</p>
                </div>
                <h3 className="text-2xl md:text-4xl font-black text-gray-900 mb-4">
                  واجهة احترافية • سهلة الاستخدام
                </h3>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  تصميم عصري يجعل إدارة تجارتك أسهل من أي وقت مضى
                </p>
              </div>

              {/* Main Showcase Card */}
              <div className="relative bg-gradient-to-br from-white to-gray-50 rounded-3xl p-6 md:p-10 shadow-2xl border-4 border-primary/10">
                {/* Decorative corner badges */}
                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-xs md:text-sm font-black shadow-lg z-10">
                  ✨ جديد
                </div>
                
                {/* Screenshots Container */}
                <div className="relative">
                  {/* Mobile Version */}
                  <div className="md:hidden">
                    <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-4 border-2 border-primary/20">
                      <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                        <img 
                          src="/test 2.png" 
                          alt="واجهة النظام على الموبايل" 
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop/Tablet Version */}
                  <div className="hidden md:block">
                    <div className="relative bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl p-6 border-2 border-primary/20 group hover:border-primary/40 transition-all">
                      <div className="bg-white rounded-xl overflow-hidden shadow-2xl border-4 border-white">
                        <img 
                          src="/test1.png" 
                          alt="لوحة التحكم الاحترافية" 
                          className="w-full h-auto transform group-hover:scale-[1.02] transition-transform duration-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature Pills - Modern Style */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="group bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl p-6 border-2 border-green-200 hover:border-green-300 transition-all hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                        ⚡
                      </div>
                      <p className="text-xl font-black text-gray-900">سرعة فائقة</p>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">استجابة فورية وأداء ممتاز</p>
                  </div>

                  <div className="group bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl p-6 border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                        🎯
                      </div>
                      <p className="text-xl font-black text-gray-900">سهل جداً</p>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">لا تحتاج خبرة تقنية</p>
                  </div>

                  <div className="group bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl p-6 border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform">
                        🔒
                      </div>
                      <p className="text-xl font-black text-gray-900">آمن 100%</p>
                    </div>
                    <p className="text-sm text-gray-600 font-medium">حماية كاملة لبياناتك</p>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="text-center mt-10">
                  <Link
                    href="/signup"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-secondary text-white px-10 py-5 rounded-2xl text-lg font-black hover:shadow-2xl transition-all transform hover:scale-105"
                  >
                    <span>🚀</span>
                    <span>جرب النظام مجاناً الآن</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section - Modern Redesign */}
        <section id="pricing" className="py-20 md:py-28 bg-gradient-to-br from-white via-blue-50 to-primary/5 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full mb-8 shadow-lg border-2 border-primary/20">
                <span className="text-2xl">💎</span>
                <p className="text-sm md:text-base font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">سعر عادل للجميع</p>
              </div>
              
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6">
                <span className="text-gray-900">استثمار بسيط</span>
                <span className="block bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mt-2">
                  عائد كبير
                </span>
              </h2>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                وفّر آلاف الدنانير سنوياً مع نظام احترافي بسعر في متناول الجميع
              </p>
            </div>
            
            {/* Toggle */}
            <div className="flex items-center justify-center gap-6 mb-8">
              <span className={`text-base md:text-lg font-bold transition ${!isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
                شهري
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className="relative inline-flex h-10 w-20 items-center rounded-full bg-gray-300 transition-colors"
                style={{ direction: 'ltr' }}
              >
                <span className={`inline-block h-8 w-8 transform rounded-full bg-gradient-to-r from-primary to-secondary shadow-lg transition-transform duration-300 ${isYearly ? 'translate-x-1' : 'translate-x-10'}`} />
              </button>
              <div className="flex items-center gap-2">
                <span className={`text-base md:text-lg font-bold transition ${isYearly ? 'text-gray-900' : 'text-gray-400'}`}>
                  سنوي
                </span>
                <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  وفر 15%
                </span>
              </div>
            </div>

            <div className="max-w-5xl mx-auto">
              <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-primary/20 hover:border-primary/40 transition-all">
                {/* Popular badge */}
                <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-black shadow-lg z-10">
                  ⭐ الأكثر طلباً
                </div>
                
                {/* Header - Modern gradient */}
                <div className="bg-gradient-to-r from-primary via-blue-600 to-secondary text-white text-center py-8 md:py-10 relative">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                  <div className="relative z-10">
                    <h3 className="text-4xl md:text-5xl font-black mb-3">Kesti Pro</h3>
                    <p className="text-lg md:text-2xl font-bold opacity-90">الباقة الاحترافية الشاملة</p>
                  </div>
                </div>
                
                {/* Content - responsive layout */}
                <div className="p-6 md:p-10">
                  <div className="md:grid md:grid-cols-[1fr,1.5fr] md:gap-12 md:items-start">
                    {/* Left Column - Price */}
                    <div className="mb-8 md:mb-0">
                      <div className="text-center md:text-right mb-6">
                        {isYearly ? (
                          <>
                            <div className="text-5xl md:text-6xl font-black text-primary mb-2">
                              {yearlyPrice}
                              <span className="text-2xl md:text-3xl"> دينار</span>
                            </div>
                            <p className="text-xl text-gray-600 font-bold">سنوياً</p>
                            <p className="text-base text-secondary font-semibold mt-2">
                              ({yearlyMonthlyEquivalent} دينار شهرياً - وفر 15%)
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="text-5xl md:text-6xl font-black text-primary mb-2">
                              {monthlyPrice}
                              <span className="text-2xl md:text-3xl"> دينار</span>
                            </div>
                            <p className="text-xl text-gray-600 font-bold">شهرياً فقط</p>
                            <p className="text-sm text-gray-500 mt-2">(أقل من سعر قهوتك اليومية)</p>
                          </>
                        )}
                      </div>

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200 relative overflow-hidden">
                        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-black animate-pulse">
                          للأول 50 فقط!
                        </div>
                        <p className="text-xl font-black text-green-700 mb-2 text-center md:text-right">🎁 جرب مجاناً 15 يوم</p>
                        <p className="text-base text-gray-700 text-center md:text-right">لا حاجة لبطاقة بنكية</p>
                      </div>
                    </div>

                    {/* Right Column - Features */}
                    <div>
                      <ul className="text-right space-y-4 mb-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">جميع المميزات الاحترافية</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">3 أجهزة كحد أقصى</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">مبيعات ومنتجات غير محدودة</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">دعم فني سريع</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">إضافة المنتجات مجاناً</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">تحديثات مستمرة</span>
                    </li>
                      </ul>

                      <div className="mt-8 space-y-4">
                      <Link
                        href="/signup"
                        className="group w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-lg md:text-xl font-black py-5 px-10 rounded-2xl hover:shadow-2xl hover:shadow-green-500/50 transition-all transform hover:scale-105 flex items-center justify-center gap-3 border-2 border-green-400"
                      >
                        <span>🚀 ابدأ تجربتك المجانية الآن</span>
                      </Link>
                      
                      <Link
                        href="/login"
                        className="w-full bg-gradient-to-r from-blue-600 to-primary text-white text-base md:text-lg font-bold py-4 px-8 rounded-xl hover:shadow-xl transition-all transform hover:scale-105 flex items-center justify-center gap-2 border-2 border-blue-400"
                      >
                        <span>🔐 لديك حساب؟ سجل دخول</span>
                      </Link>
                      
                      <button
                        onClick={() => setShowContact(true)}
                        className="w-full bg-white border-2 border-gray-300 text-gray-700 text-base md:text-lg font-bold py-4 px-8 rounded-xl hover:shadow-xl hover:border-primary transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                      >
                        <span>📞 تواصل للاستفسار</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>


        {/* FAQ Section - Modern Redesign */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-white px-6 py-3 rounded-full mb-8 shadow-lg border-2 border-primary/20">
                <span className="text-2xl">💬</span>
                <p className="text-sm md:text-base font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">أسئلة شائعة</p>
              </div>
              
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
                لديك أسئلة؟ لدينا الأجوبة
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                كل ما تحتاج معرفته عن Kesti Pro
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="group bg-white rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-2xl border-2 border-gray-100 hover:border-primary/30 transition-all">
                  <h3 className="text-lg md:text-xl font-black text-gray-900 mb-4 flex items-start gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">❓</span>
                    <span>{faq.q}</span>
                  </h3>
                  <p className="text-base md:text-lg text-gray-700 leading-relaxed pr-10">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Contact for more questions */}
            <div className="text-center mt-12">
              <p className="text-lg text-gray-600 mb-6">لم تجد إجابة لسؤالك؟</p>
              <button
                onClick={() => setShowContact(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <span>📞</span>
                <span>تواصل معنا مباشرة</span>
              </button>
            </div>
          </div>
        </section>

        {/* Final CTA Section - Modern Redesign */}
        <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-blue-700 to-secondary text-white relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%),radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-6 py-3 rounded-full mb-8 border border-white/30">
                <span className="text-2xl">🎯</span>
                <p className="text-sm md:text-base font-bold">ابدأ رحلتك نحو النجاح</p>
              </div>
              
              {/* Main heading */}
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight">
                حوّل تجارتك اليوم
                <span className="block mt-2">واربح أكثر غداً</span>
              </h2>
              
              <p className="text-lg md:text-2xl mb-12 max-w-3xl mx-auto opacity-95 leading-relaxed">
                انضم لأكثر من 500 تاجر ناجح يستخدمون Kesti Pro لتنمية أعمالهم
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link
                  href="/signup"
                  className="group bg-white text-primary px-10 py-6 rounded-2xl text-lg md:text-xl font-black hover:bg-gray-100 transition-all shadow-2xl transform hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-3 hover:shadow-white/50"
                >
                  <span>🚀 ابدأ تجربتك المجانية</span>
                </Link>
                
                <Link
                  href="/login"
                  className="bg-blue-600 border-2 border-white/50 text-white px-10 py-6 rounded-2xl text-lg md:text-xl font-bold hover:bg-blue-700 transition-all shadow-xl transform hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-3"
                >
                  <span>🔐 تسجيل الدخول</span>
                </Link>
              </div>
              
              <button
                onClick={() => setShowContact(true)}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white px-8 py-4 rounded-xl text-base md:text-lg font-bold hover:bg-white/20 transition-all"
              >
                <span>📞</span>
                <span>هل لديك أسئلة؟ تواصل معنا</span>
              </button>

              {/* Trust indicators */}
              <div className="mt-16 pt-12 border-t border-white/20">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black mb-2">15 يوم</div>
                    <p className="text-base opacity-90">تجربة مجانية كاملة</p>
                    <p className="text-sm font-black text-yellow-300 mt-2">⚡ للأول 50 فقط</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black mb-2">⚡</div>
                    <p className="text-base opacity-90">تفعيل فوري • بدون تعقيد</p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="text-5xl font-black mb-2">24/7</div>
                    <p className="text-base opacity-90">دعم فني متواصل</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Modern & Simple */}
        <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12 md:py-16 relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* Main Content */}
            <div className="max-w-5xl mx-auto">
              {/* Top Section - Logo & Description */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-3 mb-4">
                  <Image src="/logo/KESTi.png" alt="Kesti Pro" width={60} height={60} className="rounded-xl" />
                  <div className="text-right">
                    <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kesti Pro</h3>
                    <p className="text-sm text-gray-400">نظام احترافي لإدارة المبيعات</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions - Centered */}
              <div className="flex flex-wrap justify-center gap-4 mb-10">
                <a href="#features" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-primary/50">
                  المميزات
                </a>
                <a href="#pricing" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-primary/50">
                  الأسعار
                </a>
                <Link href="/login" className="px-6 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-semibold transition-all border border-white/10 hover:border-primary/50">
                  تسجيل الدخول
                </Link>
                <Link href="/signup" className="px-6 py-2.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 rounded-xl text-sm font-black transition-all shadow-lg">
                  ابدأ الآن
                </Link>
              </div>

              {/* Contact Info - Compact */}
              <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm">
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 text-gray-400 hover:text-primary transition">
                  <span>📞</span>
                  <span dir="ltr">{contactInfo.phone}</span>
                </a>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2 text-gray-400 hover:text-primary transition">
                  <span>📧</span>
                  <span>{contactInfo.email}</span>
                </a>
                <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-gray-400 hover:text-primary transition">
                  <span>💬</span>
                  <span>واتساب</span>
                </a>
              </div>

              {/* Social Media - Modern Icons */}
              <div className="flex justify-center gap-4 mb-10">
                <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all text-xl hover:scale-110 border border-white/10 hover:border-blue-500">
                  👍
                </a>
                <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center transition-all text-xl hover:scale-110 border border-white/10 hover:border-pink-500">
                  📷
                </a>
                <button onClick={() => setShowContact(true)} className="w-12 h-12 bg-white/5 hover:bg-green-600 rounded-xl flex items-center justify-center transition-all text-xl hover:scale-110 border border-white/10 hover:border-green-500">
                  ✉️
                </button>
              </div>

              {/* Bottom - Copyright */}
              <div className="border-t border-white/10 pt-6 text-center">
                <p className="text-gray-500 text-sm">
                  © 2024 <span className="text-primary font-bold">Kesti Pro</span> • جميع الحقوق محفوظة
                </p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
