import { useState } from 'react'
import Head from 'next/head'
import Image from 'next/image'
import ImageSlider from '@/components/ImageSlider'
import Link from 'next/link'

export default function Home() {
  const [showVideo, setShowVideo] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
      a: 'نعم، يعمل على كل الأجهزة بنفس الحساب وفي نفس الوقت دون حدود.'
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
      <Head>
        <title>Kesti Pro - نظام احترافي لإدارة المبيعات والمخزون</title>
        <meta name="description" content="اكتشف Kesti Pro - النظام الاحترافي لإدارة المبيعات والمخزون" />
      </Head>

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
              <div className="hidden md:flex items-center gap-2 lg:gap-4">
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
                  className="text-gray-700 hover:text-primary transition px-3 py-1.5 font-medium text-sm border border-gray-300 rounded-lg"
                >
                  دخول
                </Link>
                <button
                  onClick={() => setShowContact(true)}
                  className="bg-gradient-to-r from-secondary to-green-400 text-gray-900 px-4 lg:px-5 py-1.5 rounded-lg font-bold text-sm hover:scale-105 transition-transform"
                >
                  تواصل معنا
                </button>
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
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-gray-700 hover:text-primary hover:bg-gray-50 transition px-3 py-2 rounded-lg text-sm font-medium"
                >
                  تسجيل الدخول
                </Link>
                <button
                  onClick={() => { setShowContact(true); setMobileMenuOpen(false); }}
                  className="w-full bg-gradient-to-r from-secondary to-green-400 text-gray-900 px-4 py-2.5 rounded-lg font-bold text-sm"
                >
                  تواصل معنا 📞
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Hero Section - Completely Redesigned */}
        <section className="relative bg-white overflow-hidden min-h-screen flex items-center pt-20">
          {/* Modern Background with Geometric Shapes */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-blue-50 to-green-50"></div>
          
          {/* Animated Background Shapes */}
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                {/* Left side - Content with solid backgrounds */}
                <div className="text-center lg:text-right order-2 lg:order-1 space-y-8">
                  {/* Badge */}
                  <div className="inline-block">
                    <div className="bg-gradient-to-r from-secondary to-green-400 px-6 py-3 rounded-full">
                      <p className="text-sm md:text-base font-black text-white">✨ نظام احترافي متكامل</p>
                    </div>
                  </div>
                  
                  {/* Main Heading */}
                  <div>
                    <h1 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-black mb-3 md:mb-4 leading-[1.1]">
                      <span className="block text-gray-900">نظام</span>
                      <span className="block bg-gradient-to-r from-primary via-blue-600 to-secondary bg-clip-text text-transparent">
                        Kesti Pro
                      </span>
                    </h1>
                    <h2 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-700 leading-relaxed">
                      إدارة المبيعات والمخزون بذكاء
                    </h2>
                  </div>
                  
                  {/* Value Proposition Box */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl md:rounded-3xl p-5 md:p-8 shadow-2xl border border-gray-700">
                    <div className="space-y-4">
                      <div className="flex items-start gap-4 text-right">
                        <div className="flex-1">
                          <p className="text-base md:text-xl lg:text-2xl font-bold text-white leading-relaxed">
                            🚫 وداعاً للدفاتر والحسابات اليدوية
                          </p>
                        </div>
                      </div>
                      <div className="h-px bg-gradient-to-r from-transparent via-gray-600 to-transparent"></div>
                      <div className="flex items-start gap-4 text-right">
                        <div className="flex-1">
                          <p className="text-base md:text-xl lg:text-2xl font-bold text-secondary leading-relaxed">
                            ✅ مرحباً بالتحكم الكامل والربح الواضح
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
                    <button
                      onClick={() => setShowContact(true)}
                      className="group relative bg-gradient-to-r from-secondary via-green-500 to-green-400 text-gray-900 px-8 md:px-12 py-4 md:py-5 rounded-xl md:rounded-2xl text-base md:text-xl lg:text-2xl font-black transition-all shadow-2xl hover:shadow-secondary/50 hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 overflow-hidden"
                    >
                      <span className="relative z-10">تواصل معنا الآن</span>
                      <span className="text-3xl group-hover:translate-x-2 transition-transform relative z-10">�</span>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                    <button
                      onClick={() => setShowVideo(true)}
                      className="bg-white border-2 md:border-3 border-gray-900 text-gray-900 px-8 md:px-10 py-4 md:py-5 rounded-xl md:rounded-2xl text-base md:text-xl lg:text-2xl font-bold hover:bg-gray-900 hover:text-white transition-all w-full sm:w-auto flex items-center justify-center gap-2 md:gap-3 shadow-xl"
                    >
                      <span>شاهد الفيديو</span>
                      <span>▶️</span>
                    </button>
                  </div>

                  {/* Trust Badge */}
                  <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                    <div className="bg-green-100 px-4 py-2 rounded-full">
                      <p className="text-base md:text-lg font-bold text-green-800">
                        ✨ 15 يوم تجربة مجانية
                      </p>
                    </div>
                    <div className="bg-blue-100 px-4 py-2 rounded-full">
                      <p className="text-base md:text-lg font-bold text-blue-800">
                        � تفعيل فوري بعد التواصل
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right side - Image Slider with better container */}
                <div className="order-1 lg:order-2">
                  <div className="relative">
                    {/* Glow effect behind slider */}
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 blur-3xl rounded-full"></div>
                    <ImageSlider 
                      images={['dashboard', 'pos', 'reports', 'inventory', 'analytics']}
                      autoPlayInterval={3500}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
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
                  <p className="text-lg text-gray-700">Video Placeholder</p>
                  <p className="text-sm text-gray-500">(ضع رابط الفيديو هنا)</p>
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
            {/* Header */}
            <div className="text-center mb-16 max-w-4xl mx-auto">
              <div className="inline-block bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-full mb-6">
                <p className="text-sm md:text-base font-black text-white">✨ الحل الشامل</p>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 leading-tight">
                Kesti Pro ينهي كل مشاكلك
              </h2>
              <p className="text-xl md:text-2xl text-gray-700 font-semibold">
                ننظام متكامل يعمل بذكاء لتوفير وقتك ومالك وأعصابك
              </p>
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

            {/* Showcase Box */}
            <div className="max-w-6xl mx-auto">
              <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-12 shadow-2xl border border-gray-700 relative overflow-hidden">
                {/* Glow effects */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  {/* Screenshots - Responsive */}
                  
                  {/* Mobile Version - Only visible on mobile screens */}
                  <div className="md:hidden bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-4 border-2 border-gray-600">
                    <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                      <img 
                        src="/test 2.png" 
                        alt="Mobile Dashboard" 
                        className="w-full h-auto"
                      />
                    </div>
                    <p className="text-center text-sm font-bold text-gray-300 mt-3">📱 لوحة التحكم</p>
                  </div>
                  
                  {/* Desktop/Tablet Version - Only visible on tablet and desktop */}
                  <div className="hidden md:block bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 border-2 border-gray-600 group hover:border-secondary transition-all">
                    <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                      <img 
                        src="/test1.png" 
                        alt="Desktop/Tablet Dashboard" 
                        className="w-full h-auto transform group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <p className="text-center text-base font-bold text-gray-300 mt-4">💻 لوحة التحكم</p>
                  </div>
                  
                  {/* Feature highlights */}
                  <div className="grid md:grid-cols-3 gap-4 mt-8">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-lg font-bold text-secondary mb-1">🚀 سريع</p>
                      <p className="text-sm text-gray-300">استجابة فورية</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-lg font-bold text-secondary mb-1">🎯 بسيط</p>
                      <p className="text-sm text-gray-300">سهل الاستخدام</p>
                    </div>
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <p className="text-lg font-bold text-secondary mb-1">🔒 آمن</p>
                      <p className="text-sm text-gray-300">حماية كاملة</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-full mb-6">
                <p className="text-sm md:text-base font-black text-white">💰 سعر مناسب للجميع</p>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                السعر البسيط الذي يوفر لك آلاف الدنانير
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                استثمار صغير يحمي أرباحك ويوفر وقتك
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
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-2 border-gray-200">
                {/* Header - visible on all screens */}
                <div className="bg-gradient-to-r from-primary via-blue-600 to-secondary text-white text-center py-6 md:py-8">
                  <h3 className="text-3xl md:text-4xl font-black mb-2">Kesti Pro</h3>
                  <p className="text-lg md:text-xl font-semibold">الباقة الكاملة - كل المميزات</p>
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

                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border-2 border-green-200">
                        <p className="text-xl font-black text-green-700 mb-2 text-center md:text-right">🎁 جرب مجاناً 15 يوم</p>
                        <p className="text-base text-gray-700 text-center md:text-right">لا حاجة لبطاقة بنكية</p>
                      </div>
                    </div>

                    {/* Right Column - Features */}
                    <div>
                      <ul className="text-right space-y-4 mb-8">
                    <li className="flex items-start gap-2">
                      <span className="text-lg text-secondary flex-shrink-0">✓</span>
                      <span className="text-sm md:text-base">جميع المميزات بدون حدود</span>
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

                      <button
                        onClick={() => setShowContact(true)}
                        className="w-full bg-gradient-to-r from-primary to-secondary text-white text-lg md:text-xl font-black py-5 px-10 rounded-2xl hover:shadow-2xl transition transform hover:scale-105"
                      >
                        تواصل معنا للبدء 📞
                      </button>
                      <Link
                        href="/login"
                        className="block mt-4 text-center text-gray-600 hover:text-primary text-sm font-medium transition"
                      >
                        لديك حساب بالفعل؟ سجل الدخول
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-20 right-10 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-12">
              <div className="inline-block bg-gradient-to-r from-primary to-secondary px-6 py-3 rounded-full mb-6">
                <p className="text-sm md:text-base font-black text-white">⭐ قصص نجاح</p>
              </div>
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-4">
                ماذا يقول عملاؤنا؟
              </h2>
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
                آلاف التجار يوفرون وقتهم وأموالهم مع Kesti Pro
              </p>
            </div>
            
            {/* Testimonials Grid */}
            <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto mb-10">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-white rounded-3xl p-6 md:p-8 shadow-2xl border-2 border-gray-100 hover:border-primary transition-all">
                  {/* Content */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                      👤
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-black text-lg text-gray-900 mb-1">{testimonial.name}</p>
                      <p className="text-sm text-gray-600 font-semibold">{testimonial.business}</p>
                    </div>
                  </div>
                  
                  <p className="text-base text-gray-700 leading-relaxed italic mb-4">
                    "{testimonial.text}"
                  </p>
                  
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className="text-yellow-400 text-xl">⭐</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Know More Button */}
            <div className="text-center">
              <Link
                href="/testimonials"
                className="inline-block bg-gradient-to-r from-primary to-secondary text-white px-10 py-4 rounded-xl text-lg font-bold hover:shadow-2xl transition transform hover:scale-105"
              >
                اعرف المزيد من القصص 📖
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-primary mb-2">500+</div>
                <p className="text-sm md:text-base text-gray-600 font-semibold">تاجر سعيد</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-secondary mb-2">99%</div>
                <p className="text-sm md:text-base text-gray-600 font-semibold">رضا العملاء</p>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-primary mb-2">24/7</div>
                <p className="text-sm md:text-base text-gray-600 font-semibold">دعم فني</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center mb-10 text-gray-800">
              الأسئلة الشائعة
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-5">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-lg p-6 shadow-sm border border-primary/10">
                  <h3 className="text-base md:text-lg font-bold text-gray-800 mb-3 flex items-start gap-2">
                    <span className="text-primary text-xl flex-shrink-0">❓</span>
                    {faq.q}
                  </h3>
                  <p className="text-sm md:text-base text-gray-700 leading-relaxed pr-7">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-12 md:py-16 bg-gradient-to-br from-primary via-blue-700 to-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              لا تضيع يوماً آخر في الحسابات اليدوية والخسائر
            </h2>
            <p className="text-base md:text-lg lg:text-xl mb-8 max-w-3xl mx-auto">
              جرب Kesti Pro الآن مجاناً لمدة 15 يوم وشاهد الفرق بنفسك
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6">
              <button
                onClick={() => setShowContact(true)}
                className="bg-white text-primary px-10 py-5 rounded-xl text-base md:text-lg font-black hover:bg-gray-100 transition shadow-xl transform hover:scale-105 w-full sm:w-auto flex items-center justify-center gap-3"
              >
                <span>تواصل معنا للبدء</span>
                <span className="text-2xl">📞</span>
              </button>
              <Link
                href="/login"
                className="bg-white/80 text-gray-700 px-8 py-5 rounded-xl text-base md:text-lg font-bold hover:bg-white transition shadow-lg transform hover:scale-105 w-full sm:w-auto border-2 border-white"
              >
                تسجيل دخول للعملاء
              </Link>
            </div>

            <p className="text-sm md:text-base opacity-90">
              ✨ 15 يوم تجربة مجانية • تفعيل فوري • دعم فني مجاني
            </p>
          </div>
        </section>

        {/* Footer - Redesigned Responsive */}
        <footer className="bg-gray-900 text-white py-8 md:py-12">
          <div className="container mx-auto px-3 md:px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-6 md:mb-8">
              {/* Brand */}
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-start mb-2 md:mb-3">
                  <Image src="/logo/KESTi.png" alt="Kesti Pro" width={50} height={50} className="rounded-lg" />
                </div>
                <p className="text-gray-400 text-xs md:text-sm mb-2 md:mb-3">نظام احترافي لإدارة المبيعات والمخزون</p>
                <p className="text-gray-500 text-xs hidden md:block">حل شامل لتحويل تجارتك إلى رقمية بكل سهولة</p>
              </div>

              {/* Quick Links */}
              <div className="text-center">
                <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white">روابط سريعة</h4>
                <div className="flex flex-col gap-2 text-xs md:text-sm">
                  <a href="#features" className="text-gray-400 hover:text-secondary transition py-1">المميزات</a>
                  <a href="#pricing" className="text-gray-400 hover:text-secondary transition py-1">الأسعار</a>
                  <Link href="/login" className="text-gray-400 hover:text-secondary transition py-1">تسجيل الدخول</Link>
                  <button onClick={() => setShowContact(true)} className="text-gray-400 hover:text-secondary transition py-1">تواصل معنا</button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-center md:text-left">
                <h4 className="text-base md:text-lg font-bold mb-3 md:mb-4 text-white">تواصل معنا</h4>
                <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                  <a href={`tel:${contactInfo.phone}`} className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-secondary transition">
                    <span className="text-sm">📞</span>
                    <span dir="ltr">{contactInfo.phone}</span>
                  </a>
                  <a href={`mailto:${contactInfo.email}`} className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-secondary transition break-all">
                    <span className="text-sm">📧</span>
                    <span>{contactInfo.email}</span>
                  </a>
                  <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-secondary transition">
                    <span className="text-sm">💬</span>
                    <span>واتساب</span>
                  </a>
                  
                  {/* Social Media */}
                  <div className="flex gap-2 md:gap-3 justify-center md:justify-start pt-2 md:pt-3">
                    <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-10 md:h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition text-sm md:text-base">
                      <span>👍</span>
                    </a>
                    <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg flex items-center justify-center transition text-sm md:text-base">
                      <span>📷</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-4 md:pt-6 text-center">
              <p className="text-gray-500 text-xs md:text-sm">© 2024 Kesti Pro. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
