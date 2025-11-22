import { useState } from 'react'
import Head from 'next/head'

export default function Landing() {
  const [showVideo, setShowVideo] = useState(false)

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
                  <span>لا حدود لعدد الأجهزة – نفس الحساب يعمل على الجميع في نفس اللحظة</span>
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
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800">
              السعر البسيط الذي يوفر لك آلاف الدنانير
            </h2>
            
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-orange-500">
                <div className="bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-center py-8">
                  <h3 className="text-3xl font-bold mb-2">Kesti Pro</h3>
                  <p className="text-xl opacity-90">الباقة الكاملة</p>
                </div>
                
                <div className="p-12 text-center">
                  <div className="mb-8">
                    <div className="text-6xl md:text-7xl font-bold text-orange-600 mb-2">
                      30 دينار
                    </div>
                    <p className="text-2xl text-gray-600">شهرياً فقط</p>
                    <p className="text-lg text-gray-500 mt-2">(أقل من سعر قهوتك اليومية)</p>
                  </div>

                  <div className="bg-green-50 rounded-2xl p-6 mb-8">
                    <p className="text-2xl font-bold text-green-700 mb-2">🎁 جرب مجاناً 15 يوم</p>
                    <p className="text-gray-700">لا حاجة لبطاقة بنكية</p>
                  </div>

                  <ul className="text-right space-y-4 mb-10">
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">جميع المميزات بدون حدود</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">أجهزة غير محدودة</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">مبيعات ومنتجات غير محدودة</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">دعم فني سريع</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">إضافة المنتجات مجاناً</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-2xl text-green-500">✓</span>
                      <span className="text-lg">تحديثات مستمرة</span>
                    </li>
                  </ul>

                  <a
                    href="/signup"
                    className="block bg-gradient-to-r from-orange-500 to-yellow-500 text-white text-2xl font-bold py-6 px-12 rounded-xl hover:shadow-2xl transition transform hover:scale-105"
                  >
                    ابدأ الآن مجاناً 🚀
                  </a>
                </div>
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
              <a
                href="/signup"
                className="bg-white text-orange-600 px-12 py-6 rounded-xl text-2xl font-bold hover:bg-gray-100 transition shadow-2xl transform hover:scale-105 w-full sm:w-auto"
              >
                ابدأ التجربة المجانية الآن 🎁
              </a>
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
              <a href="/login" className="text-gray-400 hover:text-white transition">تسجيل الدخول</a>
              <a href="/signup" className="text-gray-400 hover:text-white transition">إنشاء حساب</a>
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
      </div>
    </>
  )
}
