import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'

export default function Testimonials() {
  const [showContact, setShowContact] = useState(false)

  const contactInfo = {
    phone: '+216 53518337',
    email: 'support@kestipro.com',
    whatsapp: '+216 53518337',
    facebook: 'https://www.facebook.com/profile.php?id=61581670844981',
    instagram: 'https://www.instagram.com/kesti_tn'
  }

  const allTestimonials = [
    {
      name: 'أحمد الزغلامي',
      business: 'صاحب سوبرماركت - تونس العاصمة',
      text: 'كنت أضيع 3 ساعات كل ليلة في الحسابات. الآن أعرف كل شيء في ثانية واحدة. Kesti Pro غيّر حياتي تماماً.',
      rating: 5
    },
    {
      name: 'فاطمة بن عمر',
      business: 'صاحبة محل ملابس - صفاقس',
      text: 'اكتشفت أن 15% من المبيعات كانت تضيع. الآن كل قرش تحت السيطرة. النظام سهل وفعّال جداً.',
      rating: 5
    },
    {
      name: 'محمد الناصري',
      business: 'صاحب صيدلية - سوسة',
      text: 'فتحت فرع ثاني بفضل Kesti Pro. أراقب الفرعين من بيتي وأنا مرتاح. الدعم الفني ممتاز.',
      rating: 5
    },
    {
      name: 'سامي التونسي',
      business: 'صاحب مطعم - بنزرت',
      text: 'النظام ساعدني على تنظيم المخزون وتقليل الهدر. الأرباح زادت 30% في 3 أشهر فقط.',
      rating: 5
    },
    {
      name: 'ليلى الساحلي',
      business: 'صاحبة صالون تجميل - المنستير',
      text: 'أصبحت أتابع مواعيد الزبائن والمنتجات بكل سهولة. وفرت الكثير من الوقت والمال.',
      rating: 5
    },
    {
      name: 'كمال الجبالي',
      business: 'صاحب محل عطور - القيروان',
      text: 'التقارير اليومية تساعدني في معرفة المنتجات الأكثر مبيعاً. قرارات أفضل وأرباح أعلى.',
      rating: 5
    },
    {
      name: 'نادية المرزوقي',
      business: 'صاحبة مكتبة - قابس',
      text: 'مع بداية السنة الدراسية كان النظام منقذي. تابعت آلاف المنتجات دون أي مشاكل.',
      rating: 5
    },
    {
      name: 'رضا الشابي',
      business: 'صاحب محل إلكترونيات - المهدية',
      text: 'الباركود والمسح السريع وفّر علي الكثير من الوقت. الزبائن راضون عن السرعة في الخدمة.',
      rating: 5
    },
    {
      name: 'هند الدريدي',
      business: 'صاحبة محل أحذية - قفصة',
      text: 'أعرف بالضبط أي مقاس وأي لون ناقص في المخزون. لا مزيد من الطلبات الخاطئة.',
      rating: 5
    },
    {
      name: 'عماد البوعزيزي',
      business: 'صاحب محل قطع غيار - باجة',
      text: 'النظام يتعامل مع آلاف القطع المختلفة بسهولة تامة. البحث سريع والنتائج دقيقة.',
      rating: 5
    },
    {
      name: 'سلمى القروي',
      business: 'صاحبة مخبزة - قبلي',
      text: 'أتابع المبيعات اليومية والمصروفات بدقة. أعرف بالضبط كم ربحت كل يوم.',
      rating: 5
    },
    {
      name: 'منير الهمامي',
      business: 'صاحب محل رياضة - مدنين',
      text: 'النظام يعمل على كل الأجهزة. أستخدمه على الهاتف والتابلت واللابتوب.',
      rating: 5
    },
    {
      name: 'إيمان الزواري',
      business: 'صاحبة محل ألعاب أطفال - تطاوين',
      text: 'موسم الأعياد كان سهلاً جداً مع Kesti Pro. سرعة وتنظيم ولا أخطاء.',
      rating: 5
    },
    {
      name: 'طارق المثلوثي',
      business: 'صاحب محل أدوات منزلية - زغوان',
      text: 'التحكم في الموظفين والصلاحيات ممتاز. كل واحد يعرف مهامه بالضبط.',
      rating: 5
    },
    {
      name: 'وفاء الكافي',
      business: 'صاحبة مكتبة ومطبعة - سليانة',
      text: 'خدمة العملاء سريعة جداً. أي مشكلة يحلوها في نفس اليوم.',
      rating: 5
    },
    {
      name: 'بلال التليلي',
      business: 'صاحب محل موبايل - جندوبة',
      text: 'أتابع الضمانات والصيانة لكل جهاز. كل شيء مسجل ومنظم.',
      rating: 5
    },
    {
      name: 'ريم العياري',
      business: 'صاحبة محل حلويات - الكاف',
      text: 'المخزون والتواريخ الصلاحية تحت السيطرة. لا مزيد من البضائع الفاسدة.',
      rating: 5
    },
    {
      name: 'ياسين الناجي',
      business: 'صاحب محل نظارات - توزر',
      text: 'النظام يحفظ معلومات كل زبون. الخدمة الشخصية أصبحت أسهل بكثير.',
      rating: 5
    },
    {
      name: 'آمال السلامي',
      business: 'صاحبة محل خياطة - أريانة',
      text: 'أتابع الطلبات الخاصة والمواعيد بسهولة. لا أنسى أي زبون.',
      rating: 5
    },
    {
      name: 'حسام الدين المرسني',
      business: 'صاحب محل زينة السيارات - منوبة',
      text: 'التقارير الشهرية تساعدني في التخطيط للشهر القادم. النمو واضح وملموس.',
      rating: 5
    },
    {
      name: 'دلال الشريف',
      business: 'صاحبة محل هدايا - بن عروس',
      text: 'النظام سهل التعلم. لم أحتج لأكثر من يوم واحد لأتقنه تماماً.',
      rating: 5
    },
    {
      name: 'فوزي الحمروني',
      business: 'صاحب محل كهربائيات - نابل',
      text: 'السعر ممتاز مقابل الخدمة. وفّرت أكثر من تكلفة الاشتراك في الشهر الأول.',
      rating: 5
    },
    {
      name: 'سنية البكوش',
      business: 'صاحبة محل عطارة - باردو',
      text: 'آلاف الأصناف والأعشاب منظمة بالكامل. البحث عن أي منتج يأخذ ثواني.',
      rating: 5
    },
    {
      name: 'عادل المكني',
      business: 'صاحب محل دراجات - قرمبالية',
      text: 'أدير فرعين دون أي صعوبة. أتابع كل شيء من مكان واحد.',
      rating: 5
    }
  ]

  return (
    <>
      <Head>
        <title>آراء العملاء - Kesti Pro</title>
        <meta name="description" content="اقرأ قصص نجاح عملائنا السعداء مع Kesti Pro" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100" dir="rtl">
        {/* Header */}
        <header className="bg-gradient-to-r from-primary to-secondary text-white py-6 shadow-xl sticky top-0 z-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo/KESTi.png" alt="Kesti Pro" width={50} height={50} className="rounded-lg" />
                <h1 className="text-2xl md:text-3xl font-black">Kesti Pro</h1>
              </Link>
              <div className="flex gap-4">
                <Link href="/" className="bg-white/20 hover:bg-white/30 px-6 py-2 rounded-lg font-bold transition">
                  الرئيسية
                </Link>
                <button
                  onClick={() => setShowContact(true)}
                  className="bg-white text-primary px-6 py-2 rounded-lg font-bold hover:shadow-lg transition"
                >
                  تواصل معنا
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-block bg-gradient-to-r from-primary to-secondary px-8 py-3 rounded-full mb-8">
              <p className="text-lg font-black text-white">⭐ قصص النجاح</p>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6">
              آراء عملائنا السعداء
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 max-w-3xl mx-auto mb-8">
              أكثر من 500 تاجر يثقون في Kesti Pro لإدارة أعمالهم
            </p>
            <div className="flex justify-center gap-2 mb-4">
              {[1,2,3,4,5].map(i => (
                <span key={i} className="text-5xl text-yellow-400">⭐</span>
              ))}
            </div>
            <p className="text-2xl font-bold text-gray-800">تقييم 5/5 من 500+ عميل</p>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {allTestimonials.map((testimonial, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-primary">
                  {/* Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-xl flex-shrink-0">
                      👤
                    </div>
                    <div className="text-right flex-1">
                      <p className="font-black text-base text-gray-900">{testimonial.name}</p>
                      <p className="text-xs text-gray-600 font-semibold">{testimonial.business}</p>
                    </div>
                  </div>
                  
                  {/* Review */}
                  <p className="text-sm text-gray-700 leading-relaxed mb-4 italic">
                    "{testimonial.text}"
                  </p>
                  
                  {/* Rating */}
                  <div className="flex gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">⭐</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-6">
              كن واحداً من عملائنا السعداء
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              جرب Kesti Pro مجاناً لمدة 15 يوم وشاهد الفرق بنفسك
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowContact(true)}
                className="bg-white text-primary px-10 py-5 rounded-xl text-lg font-black hover:bg-gray-100 transition shadow-2xl transform hover:scale-105"
              >
                ابدأ الآن 🚀
              </button>
              <Link
                href="/"
                className="bg-white/20 border-2 border-white text-white px-10 py-5 rounded-xl text-lg font-bold hover:bg-white/30 transition"
              >
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </section>

        {/* Contact Modal */}
        {showContact && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setShowContact(false)}>
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-3xl font-black text-gray-900">تواصل معنا 📞</h3>
                <button onClick={() => setShowContact(false)} className="text-4xl hover:text-red-500 transition w-10 h-10 flex items-center justify-center">×</button>
              </div>
              
              <div className="space-y-4">
                {/* Phone */}
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl hover:scale-105 transition-transform group">
                  <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📞
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-gray-600">اتصل بنا</p>
                    <p className="text-xl font-black text-gray-900" dir="ltr">{contactInfo.phone}</p>
                  </div>
                </a>

                {/* WhatsApp */}
                <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 p-5 bg-gradient-to-r from-green-50 to-green-100 rounded-2xl hover:scale-105 transition-transform group">
                  <div className="w-14 h-14 bg-secondary rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    💬
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-gray-600">واتساب</p>
                    <p className="text-xl font-black text-gray-900" dir="ltr">{contactInfo.whatsapp}</p>
                  </div>
                </a>

                {/* Email */}
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-4 p-5 bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl hover:scale-105 transition-transform group">
                  <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    📧
                  </div>
                  <div className="flex-1 text-right">
                    <p className="text-sm font-semibold text-gray-600">البريد الإلكتروني</p>
                    <p className="text-lg font-black text-gray-900 break-all">{contactInfo.email}</p>
                  </div>
                </a>

                {/* Social Media */}
                <div className="flex gap-4 pt-4">
                  <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl transition flex items-center justify-center gap-2 font-bold">
                    <span className="text-2xl">👍</span>
                    <span>Facebook</span>
                  </a>
                  <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white p-4 rounded-xl transition flex items-center justify-center gap-2 font-bold">
                    <span className="text-2xl">📷</span>
                    <span>Instagram</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div className="text-center md:text-right">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-3">
                  <Image src="/logo/KESTi.png" alt="Kesti Pro" width={40} height={40} className="rounded-lg" />
                  <h3 className="text-2xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Kesti Pro</h3>
                </div>
                <p className="text-gray-400 text-sm mb-3">نظام احترافي لإدارة المبيعات والمخزون</p>
              </div>

              {/* Quick Links */}
              <div className="text-center">
                <h4 className="text-lg font-bold mb-4 text-white">روابط سريعة</h4>
                <div className="flex flex-col gap-2 text-sm">
                  <Link href="/" className="text-gray-400 hover:text-secondary transition">الرئيسية</Link>
                  <Link href="/testimonials" className="text-gray-400 hover:text-secondary transition">آراء العملاء</Link>
                  <Link href="/login" className="text-gray-400 hover:text-secondary transition">تسجيل الدخول</Link>
                </div>
              </div>

              {/* Contact Info */}
              <div className="text-center md:text-left">
                <h4 className="text-lg font-bold mb-4 text-white">تواصل معنا</h4>
                <div className="space-y-3 text-sm">
                  <a href={`tel:${contactInfo.phone}`} className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-secondary transition">
                    <span>📞</span>
                    <span dir="ltr">{contactInfo.phone}</span>
                  </a>
                  <a href={`mailto:${contactInfo.email}`} className="flex items-center justify-center md:justify-start gap-2 text-gray-400 hover:text-secondary transition break-all">
                    <span>📧</span>
                    <span>{contactInfo.email}</span>
                  </a>
                  <div className="flex gap-3 justify-center md:justify-start pt-3">
                    <a href={contactInfo.facebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center justify-center transition">
                      <span>👍</span>
                    </a>
                    <a href={contactInfo.instagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg flex items-center justify-center transition">
                      <span>📷</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6 text-center">
              <p className="text-gray-500 text-sm">© 2024 Kesti Pro. جميع الحقوق محفوظة.</p>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
