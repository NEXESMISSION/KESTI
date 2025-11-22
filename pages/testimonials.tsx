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
        <meta name="description" content="اقرأ قصص نجاح عملائنا مع Kesti Pro" />
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
              آراء عملائنا
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
              كن واحداً من عملائنا
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
