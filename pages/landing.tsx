import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'

export default function Landing() {
  const [showVideo, setShowVideo] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{name: string, price: string, period: string} | null>(null)

  const paymentInfo = {
    rib: 'TN59 1234 5678 9012 3456 7890',
    bankName: 'البنك الوطني الفلاحي',
    d17: '53 518 337',
    flouci: '53 518 337',
    phone: '+216 53 518 337',
    email: 'support@kestipro.com',
    whatsapp: '21653518337'
  }

  const openPaymentModal = (planName: string, price: string, period: string) => {
    setSelectedPlan({ name: planName, price, period })
    setShowPaymentModal(true)
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
      title: 'طوابير طويلة وخدمة بطيئة',
      description: 'الزبائن يغضبون ولا يعودون مرة أخرى',
      icon: '⏰'
    },
    {
      title: 'يجب أن تكون في المحل 12-14 ساعة يومياً',
      description: 'لا عطلة ولا حياة عائلية ولا فرع ثانٍ ممكن',
      icon: '🔒'
    }
  ]

  const features = [
    'تسجيل المبيعات بسرعة البرق (ضغطتان أو مسح باركود بالكاميرا)',
    'متابعة المخزون لحظياً مع تنبيهات النقص والانتهاء',
    'حساب الربح الصافي تلقائياً بعد خصم جميع المصروفات (إيجار، كهرباء، بنزين…)',
    'التحكم الكامل في الموظفين ومنع السرقة',
    'تقارير ذكية تُظهر المنتجات الأكثر مبيعاً والأقل طلباً',
    'إرسال الفواتير عبر واتساب أو SMS (الطباعة قريباً)',
    'نضيف لك كل منتجاتك مجاناً خلال فترة التجربة (إكسل أو مسح باركود)'
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
    }
  ]

  const faqs = [
    {
      q: 'هل يعمل على الحاسوب والتابلت أيضاً؟',
      a: 'نعم، يعمل على حتى 3 أجهزة بنفس الحساب وفي نفس الوقت. إذا كنت تحتاج أكثر، تواصل معنا لباقة المؤسسات.'
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
      a: 'نعم! نضيف كل منتجاتك مجاناً مع باقة 3 أشهر أو السنوية. أرسل ملف إكسل أو صور الباركود ونحن نقوم بالباقي.'
    },
    {
      q: 'هل يمكن استخدامه لأكثر من محل؟',
      a: 'نعم، يمكنك إدارة عدة فروع. للمؤسسات الكبيرة، لدينا باقة خاصة بأجهزة غير محدودة.'
    },
    {
      q: 'كيف أدفع؟',
      a: 'الدفع عن طريق التحويل البنكي أو d17 أو غيرها من وسائل الدفع المحلية. يمكنك اختيار الباقة الشهرية (19 دينار) أو 3 أشهر (51 دينار) أو السنوية (180 دينار).'
    }
  ]

  return (
    <>
      <Head>
        <title>Kesti Pro - نظام احترافي لإدارة المبيعات والمخزون</title>
        <meta name="description" content="اكتشف Kesti Pro - النظام الاحترافي لإدارة المبيعات والمخزون" />
      </Head>

      <div className="min-h-screen bg-white" dir="rtl">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
            <div className="max-w-5xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
                اكتشف Kesti Pro
              </h1>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold mb-8 leading-relaxed">
                النظام الاحترافي لإدارة المبيعات والمخزون الذي يعمل على هاتفك أو حاسوبك أو تابلت
              </h2>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-10">
                <p className="text-xl md:text-2xl font-medium mb-4">
                  وداعاً للدفاتر والحسابات اليدوية والخسائر اليومية
                </p>
                <p className="text-xl md:text-2xl font-bold">
                  مرحباً بالتحكم الكامل والربح الصافي الواضح كل يوم
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
                <a
                  href="#pricing"
                  className="bg-white text-orange-600 px-10 py-5 rounded-xl text-xl md:text-2xl font-bold hover:bg-gray-100 transition shadow-2xl w-full sm:w-auto"
                >
                  جرب مجاناً 15 يوم 🚀
                </a>
                <button
                  onClick={() => setShowVideo(true)}
                  className="bg-transparent border-4 border-white text-white px-10 py-5 rounded-xl text-xl md:text-2xl font-bold hover:bg-white/10 transition w-full sm:w-auto"
                >
                  شاهد الفيديو (1 دقيقة) ▶️
                </button>
              </div>

              {/* Placeholder Hero Image */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-8xl mb-4">🖼️</div>
                  <p className="text-xl">Hero Image Placeholder</p>
                  <p className="text-sm opacity-75">(صورة الداشبورد أو النظام)</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Video Modal */}
        {showVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowVideo(false)}>
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold">فيديو تعريفي</h3>
                <button onClick={() => setShowVideo(false)} className="text-4xl hover:text-red-500">×</button>
              </div>
              <div className="bg-gray-200 rounded-xl h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎥</div>
                  <p className="text-xl text-gray-700">Video Placeholder</p>
                  <p className="text-sm text-gray-500">(ضع رابط الفيديو هنا)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Problems Section */}
        <section className="py-20 bg-red-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-red-700">
              هل تعاني يومياً من هذه المشاكل المؤلمة التي تسرق وقتك وأموالك؟
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto mt-12">
              {problems.map((problem, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition border-2 border-red-200">
                  <div className="text-6xl mb-4">{problem.icon}</div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-800">{problem.title}</h3>
                  <p className="text-lg text-gray-600 leading-relaxed">{problem.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Multi-Device Section */}
        <section className="py-20 bg-gradient-to-br from-green-500 to-teal-500 text-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
              يعمل على جميع أجهزتك دون أي قيود – من أي مكان وفي أي وقت
            </h2>

            {/* Placeholder for devices image */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-12 h-96 flex items-center justify-center max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-8xl mb-4">📱💻📲</div>
                <p className="text-2xl">صورة الأجهزة المتعددة</p>
                <p className="opacity-75">(هاتف + تابلت + لابتوب على نفس الداشبورد)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {devices.map((device, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-center">
                  <div className="text-7xl mb-4">{device.icon}</div>
                  <h3 className="text-2xl font-bold mb-3">{device.name}</h3>
                  <p className="text-lg">{device.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-white/20 backdrop-blur-sm rounded-2xl p-8 max-w-4xl mx-auto">
              <ul className="space-y-4 text-lg md:text-xl">
                <li className="flex items-start gap-4">
                  <span className="text-3xl">✅</span>
                  <span>حتى 3 أجهزة بنفس الحساب في نفس اللحظة (المؤسسات: أجهزة غير محدودة)</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-3xl">✅</span>
                  <span>تحكم في المحل من المنزل أو وأنت في الطريق أو في العطلة</span>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-3xl">✅</span>
                  <span>لا حاجة لشراء أي جهاز جديد أو كاشير باهظ الثمن</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Solution Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">
              Kesti Pro هو الحل الاحترافي الذي ينهي كل هذه المشاكل نهائياً
            </h2>
            <p className="text-center text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
              نظام متكامل يعمل بذكاء لتوفير وقتك ومالك وأعصابك
            </p>

            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 bg-gradient-to-br from-orange-50 to-yellow-50 p-6 rounded-xl shadow-md">
                  <span className="text-4xl flex-shrink-0">⭐</span>
                  <p className="text-xl text-gray-700 leading-relaxed">{feature}</p>
                </div>
              ))}
            </div>

            {/* Features Image Placeholder */}
            <div className="mt-16 bg-gray-100 rounded-2xl p-8 h-96 flex items-center justify-center max-w-5xl mx-auto">
              <div className="text-center">
                <div className="text-8xl mb-4">📊</div>
                <p className="text-2xl text-gray-700">صورة المميزات</p>
                <p className="text-gray-500">(لقطات من النظام والتقارير)</p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20 bg-gradient-to-br from-orange-100 to-yellow-100">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-800">
              السعر البسيط الذي يوفر لك آلاف الدنانير
            </h2>
            <p className="text-xl text-center text-gray-600 mb-12 max-w-2xl mx-auto">
              اختر الباقة المناسبة لك • 3 أجهزة لكل حساب • جرب مجاناً 15 يوم
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
              
              {/* FREE Trial Box */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-blue-400 hover:border-blue-500 transition-all hover:shadow-2xl">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-6">
                  <h3 className="text-2xl font-bold mb-1">🎁 مجاني</h3>
                  <p className="text-blue-200">تجربة 15 يوم</p>
                </div>
                
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-blue-600 mb-1">
                      0 <span className="text-2xl">دينار</span>
                    </div>
                    <p className="text-gray-500">لمدة 15 يوم</p>
                  </div>

                  <ul className="text-right space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>جميع المميزات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>حتى 3 أجهزة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>دعم فني كامل</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>لا حاجة لبطاقة بنكية</span>
                    </li>
                  </ul>

                  <Link
                    href="/signup"
                    className="block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-base font-bold py-4 px-6 rounded-xl transition shadow-lg transform hover:scale-105"
                  >
                    🚀 ابدأ تجربتك المجانية الآن
                  </Link>
                </div>
              </div>

              {/* Monthly Plan */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-gray-200 hover:border-gray-400 transition-all hover:shadow-2xl">
                <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white text-center py-6">
                  <h3 className="text-2xl font-bold mb-1">شهري</h3>
                  <p className="text-gray-300">مرونة تامة</p>
                </div>
                
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-gray-800 mb-1">
                      19 <span className="text-2xl">دينار</span>
                    </div>
                    <p className="text-gray-500">شهرياً</p>
                  </div>

                  <ul className="text-right space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>جميع المميزات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>حتى 3 أجهزة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>دعم فني سريع</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>تحديثات مستمرة</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => openPaymentModal('شهري', '19', 'شهر واحد')}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white text-base font-bold py-4 px-6 rounded-xl transition transform hover:scale-105"
                  >
                    💳 اشترك الآن
                  </button>
                </div>
              </div>

              {/* 3-Month Plan - POPULAR */}
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-500 transform lg:scale-105 relative">
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-center py-1 text-sm font-bold">
                  ⭐ الأكثر شعبية
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-center py-6 pt-8">
                  <h3 className="text-2xl font-bold mb-1">3 أشهر</h3>
                  <p className="text-orange-200">وفر 10%</p>
                </div>
                
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-orange-600 mb-1">
                      17 <span className="text-2xl">دينار</span>
                    </div>
                    <p className="text-gray-500">شهرياً</p>
                    <p className="text-sm text-gray-400 mt-1">(51 دينار للـ 3 أشهر)</p>
                  </div>

                  <ul className="text-right space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>جميع المميزات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>حتى 3 أجهزة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>دعم فني أولوية</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-orange-500 text-lg">🎁</span>
                      <span className="font-semibold">إضافة المنتجات مجاناً</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => openPaymentModal('3 أشهر', '51', '3 أشهر')}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base font-bold py-4 px-6 rounded-xl transition shadow-lg transform hover:scale-105"
                  >
                    🔥 احصل على العرض
                  </button>
                </div>
              </div>

              {/* Yearly Plan */}
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-2 border-green-400 hover:border-green-500 transition-all hover:shadow-2xl">
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-center py-6">
                  <h3 className="text-2xl font-bold mb-1">سنوي</h3>
                  <p className="text-green-200">أفضل قيمة - وفر 21%</p>
                </div>
                
                <div className="p-6 text-center">
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-green-600 mb-1">
                      15 <span className="text-2xl">دينار</span>
                    </div>
                    <p className="text-gray-500">شهرياً</p>
                    <p className="text-sm text-gray-400 mt-1">(180 دينار للسنة)</p>
                  </div>

                  <ul className="text-right space-y-3 mb-6 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>جميع المميزات</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>حتى 3 أجهزة</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">✓</span>
                      <span>دعم فني VIP</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500 text-lg">🎁</span>
                      <span className="font-semibold">إضافة المنتجات مجاناً</span>
                    </li>
                  </ul>

                  <button
                    onClick={() => openPaymentModal('سنوي', '180', 'سنة كاملة')}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-base font-bold py-4 px-6 rounded-xl transition transform hover:scale-105"
                  >
                    💰 وفر الآن
                  </button>
                </div>
              </div>
            </div>

            {/* Enterprise Box */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-3xl p-8 md:p-10 text-white shadow-2xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-right">
                    <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                      <span className="text-4xl">🏢</span>
                      <h3 className="text-3xl font-bold">باقة المؤسسات</h3>
                    </div>
                    <p className="text-purple-200 text-lg mb-4">
                      تحتاج أكثر من 3 أجهزة؟ لديك عدة فروع؟
                    </p>
                    <ul className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>أجهزة غير محدودة</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>دعم فني مخصص</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span>
                        <span>تدريب مجاني</span>
                      </li>
                    </ul>
                  </div>
                  <div className="flex-shrink-0">
                    <a
                      href={`https://wa.me/${paymentInfo.whatsapp}?text=أريد%20معرفة%20المزيد%20عن%20باقة%20المؤسسات`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-3 bg-white text-purple-900 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-100 transition shadow-lg"
                    >
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      تواصل معنا
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Free Trial Badge */}
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 bg-green-100 text-green-800 px-6 py-3 rounded-full text-lg font-semibold">
                <span className="text-2xl">🎁</span>
                <span>جميع الباقات تبدأ بـ 15 يوم تجربة مجانية</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
              ماذا يقول عملاؤنا؟
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl p-8 shadow-lg">
                  {/* Avatar Placeholder */}
                  <div className="w-20 h-20 bg-orange-300 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl">
                    👤
                  </div>
                  <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                  <div className="text-center">
                    <p className="font-bold text-xl text-gray-800">{testimonial.name}</p>
                    <p className="text-gray-600">{testimonial.business}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-gray-800">
              الأسئلة الشائعة
            </h2>
            
            <div className="max-w-4xl mx-auto space-y-6">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-white rounded-xl p-8 shadow-md">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4 flex items-start gap-3">
                    <span className="text-orange-500">❓</span>
                    {faq.q}
                  </h3>
                  <p className="text-xl text-gray-700 leading-relaxed pr-10">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 bg-gradient-to-br from-orange-500 via-orange-600 to-yellow-500 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-6xl font-bold mb-8">
              لا تضيع يوماً آخر في الحسابات اليدوية والخسائر
            </h2>
            <p className="text-2xl md:text-3xl mb-12 max-w-3xl mx-auto">
              جرب Kesti Pro الآن مجاناً لمدة 15 يوم وشاهد الفرق بنفسك
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link
                href="/signup"
                className="bg-white text-orange-600 px-12 py-6 rounded-xl text-2xl font-bold hover:bg-gray-100 transition shadow-2xl transform hover:scale-105 w-full sm:w-auto"
              >
                ابدأ التجربة المجانية الآن 🎁
              </Link>
            </div>

            <p className="text-xl opacity-90">
              لا حاجة لبطاقة بنكية • إلغاء في أي وقت • دعم فني مجاني
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <img src="/logo/KESTi.png" alt="Kesti Pro" className="w-12 h-12 rounded-lg" />
              <h3 className="text-3xl font-bold">Kesti Pro</h3>
            </div>
            <p className="text-gray-400 mb-6">نظام احترافي لإدارة المبيعات والمخزون</p>
            
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              <a href="#" className="text-gray-400 hover:text-white transition">الرئيسية</a>
              <a href="#pricing" className="text-gray-400 hover:text-white transition">الأسعار</a>
              <Link href="/login" className="text-gray-400 hover:text-white transition">تسجيل الدخول</Link>
              <Link href="/signup" className="text-gray-400 hover:text-white transition">إنشاء حساب</Link>
              <a href="#" className="text-gray-400 hover:text-white transition">الدعم الفني</a>
            </div>

            {/* Contact */}
            <div className="mb-8">
              <p className="text-gray-400 mb-2">📧 support@kestipro.com</p>
              <p className="text-gray-400">📱 +216 53518337</p>
              <p className="text-gray-400 mt-2">💬 واتساب: +216 53518337</p>
            </div>

            {/* Social Media */}
            <div className="flex gap-4 justify-center mb-8">
              <a href="https://www.facebook.com/profile.php?id=61581670844981" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition text-xl">
                <span>👍</span>
              </a>
              <a href="https://www.instagram.com/kesti_tn" target="_blank" rel="noopener noreferrer" className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg flex items-center justify-center transition text-xl">
                <span>📷</span>
              </a>
            </div>

            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500">© 2024 Kesti Pro. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </footer>

        {/* Payment Modal */}
        {showPaymentModal && selectedPlan && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPaymentModal(false)}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold mb-1">إتمام الاشتراك</h3>
                    <p className="text-orange-200">باقة {selectedPlan.name} - {selectedPlan.price} دينار / {selectedPlan.period}</p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-white/80 hover:text-white transition p-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Bank Transfer */}
                <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">🏦</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">تحويل بنكي</h4>
                      <p className="text-sm text-gray-500">التحويل عبر RIB</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">البنك:</span>
                      <span className="font-semibold text-gray-900">{paymentInfo.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">RIB:</span>
                      <span className="font-mono font-semibold text-blue-600 text-sm">{paymentInfo.rib}</span>
                    </div>
                  </div>
                </div>

                {/* D17 */}
                <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">📱</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">D17</h4>
                      <p className="text-sm text-gray-500">الدفع عبر تطبيق D17</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-purple-600 text-lg">{paymentInfo.d17}</span>
                    </div>
                  </div>
                </div>

                {/* Flouci */}
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💛</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Flouci</h4>
                      <p className="text-sm text-gray-500">الدفع عبر تطبيق فلوسي</p>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 text-sm">رقم الهاتف:</span>
                      <span className="font-mono font-bold text-yellow-600 text-lg">{paymentInfo.flouci}</span>
                    </div>
                  </div>
                </div>

                {/* Visa/Mastercard */}
                <div className="bg-gradient-to-r from-blue-50 to-red-50 border-2 border-gray-200 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-red-500 rounded-xl flex items-center justify-center">
                      <span className="text-2xl">💳</span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">Visa / Mastercard</h4>
                      <p className="text-sm text-gray-500">البطاقات البنكية الدولية</p>
                    </div>
                  </div>
                  <a
                    href={`https://wa.me/${paymentInfo.whatsapp}?text=أريد%20الاشتراك%20في%20باقة%20${selectedPlan.name}%20(${selectedPlan.price}%20دينار)%20والدفع%20بالبطاقة%20البنكية`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full bg-gradient-to-r from-blue-600 to-red-500 hover:from-blue-700 hover:to-red-600 text-white font-bold py-3 px-6 rounded-xl text-center transition"
                  >
                    تواصل معنا للدفع بالبطاقة
                  </a>
                </div>

                {/* Contact Options */}
                <div className="bg-gray-50 border-2 border-gray-200 rounded-2xl p-5">
                  <h4 className="text-lg font-bold text-gray-900 mb-4 text-center">🤝 تحتاج مساعدة؟ تواصل معنا</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`https://wa.me/${paymentInfo.whatsapp}?text=أريد%20الاشتراك%20في%20باقة%20${selectedPlan.name}%20(${selectedPlan.price}%20دينار)`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                      واتساب
                    </a>
                    <a
                      href={`tel:${paymentInfo.phone}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                      اتصل بنا
                    </a>
                    <a
                      href={`mailto:${paymentInfo.email}?subject=اشتراك%20في%20باقة%20${selectedPlan.name}&body=أريد%20الاشتراك%20في%20باقة%20${selectedPlan.name}%20(${selectedPlan.price}%20دينار)`}
                      className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition col-span-2"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                      البريد الإلكتروني: {paymentInfo.email}
                    </a>
                  </div>
                </div>

                {/* Important Note */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <p className="text-sm text-orange-800 text-center">
                    <strong>⚠️ ملاحظة مهمة:</strong> بعد إتمام الدفع، أرسل لنا إثبات التحويل عبر واتساب أو البريد الإلكتروني مع بريدك الإلكتروني المسجل في الحساب لتفعيل اشتراكك خلال 24 ساعة.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 rounded-b-3xl">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
