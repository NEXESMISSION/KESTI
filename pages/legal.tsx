import Head from 'next/head'
import Link from 'next/link'

export default function Legal() {
  return (
    <>
      <Head>
        <title>الشروط والأحكام - Kesti Pro</title>
        <meta name="description" content="شروط استخدام خدمة Kesti Pro" />
      </Head>

      <div className="min-h-screen bg-gray-900" dir="rtl">
        {/* Header */}
        <nav className="bg-gray-900 border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <img src="/logo/logo no bg low qulity.png" alt="Kesti Pro" className="h-8 brightness-0 invert" />
              </Link>
              <Link href="/" className="text-gray-400 hover:text-white transition text-sm">
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-3xl p-8 md:p-12 border border-gray-700">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">شروط استخدام خدمة Kesti Pro</h1>
              <p className="text-gray-400 mb-8">آخر تحديث: 2 ديسمبر 2025</p>

              <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
                <p className="text-lg leading-relaxed">
                  بتسجيلك أو استخدامك لخدمة Kesti Pro، فإنك تقر بأنك قرأت وفهمت ووافقت على الشروط التالية كاملةً وبدون تحفظ:
                </p>

                {/* Section 1 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">1</span>
                    الاستخدام المشروع والقانوني
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>يُحظر تماماً استخدام الخدمة في أي نشاط غير قانوني أو يخالف التشريعات التونسية السارية.</li>
                    <li>أنت وحدك المسؤول قانونياً ومالياً مسؤولية كاملة عن جميع عمليات البيع والفواتير والإقرارات الضريبية والجمركية الناتجة عن نشاطك التجاري.</li>
                  </ul>
                </div>

                {/* Section 2 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">2</span>
                    دقة البيانات والمحاسبة
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>أنت مسؤول مسؤولية كاملة عن صحة ودقة الأسعار والكميات والمصروفات وجميع البيانات التي تدخلها.</li>
                    <li>Kesti Pro أداة مساعدة تقنية فقط، ولا تُعتبر بأي حال بديلاً عن محاسب قانوني أو خبير ضرائب معتمد.</li>
                  </ul>
                </div>

                {/* Section 3 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">3</span>
                    حماية البيانات والأمان
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>نحن نطبّق معايير تشفير عالية المستوى (TLS 1.3 وتشفير قواعد البيانات) لحماية بياناتك.</li>
                    <li>لا نبيع بياناتك الشخصية ولا نشاركها مع أي طرف ثالث إلا بأمر قضائي ساري أو بموافقتك الصريحة.</li>
                    <li>في حال وقوع أي هجوم إلكتروني أو اختراق أو تسرب بيانات ناتج عن ظروف قاهرة أو قوة قاهرة أو هجوم خارجي، فإننا غير مسؤولين عن أي أضرار مباشرة أو غير مباشرة تنجم عن ذلك إلى أقصى حد يسمح به القانون التونسي.</li>
                  </ul>
                </div>

                {/* Section 4 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">4</span>
                    الاشتراك والتسعير والدفع
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>الاشتراك شهري أو سنوي ويجدد تلقائياً ما لم تقم بإلغائه قبل موعد التجديد.</li>
                    <li>يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم بدون أي رسوم إلغاء أو التزامات مستقبلية.</li>
                    <li>لا يتم استرجاع المبالغ المدفوعة عن الفترة التي تم استخدام الخدمة فيها فعلياً.</li>
                  </ul>
                </div>

                {/* Section 5 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">5</span>
                    فترة التجربة المجانية
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>15 يوماً مجاناً من تاريخ إنشاء الحساب.</li>
                    <li>لا يتم خصم أي مبلغ إلا بعد انتهاء الفترة المجانية وبموافقتك الصريحة على الاشتراك المدفوع.</li>
                  </ul>
                </div>

                {/* Section 6 - Important */}
                <div className="bg-red-900/30 border border-red-700 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">6</span>
                    حدود المسؤولية (مهم جداً)
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>تُقدَّم الخدمة «كما هي» و«حسب التوفر» بدون أي ضمان ضمني أو صريح باستمراريتها 100% أو خلوها من الأخطاء.</li>
                    <li>لا نتحمل بأي حال من الأحوال مسؤولية أي أضرار مباشرة أو غير مباشرة أو تبعية أو عرضية أو خسائر في الأرباح أو البيانات أو السمعة التجارية تنجم عن:</li>
                  </ul>
                  <ul className="mt-3 mr-6 space-y-2 text-gray-400">
                    <li>• سوء استخدام الخدمة من طرفك أو من طرف أي شخص تمنحه صلاحية الوصول.</li>
                    <li>• انقطاع الخدمة المؤقت أو مشاكل تقنية أو صيانة دورية.</li>
                    <li>• هجمات إلكترونية، اختراق، فيروسات، أو أي حدث قوة قاهرة أو ظروف خارجة عن سيطرتنا المعقولة.</li>
                  </ul>
                  <p className="mt-4 text-yellow-400 font-medium">
                    الحد الأقصى لمسؤوليتنا المالية تجاهك (في حال ثبتت مسؤوليتنا قضائياً) لن يتجاوز في أي حال المبلغ الذي دفعته لنا فعلياً خلال الثلاثة أشهر السابقة للحادثة.
                  </p>
                </div>

                {/* Section 7 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">7</span>
                    تعديل الشروط
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسنُعلمك بالتغييرات عبر إشعار داخل التطبيق أو بريد إلكتروني.</li>
                    <li>استمرار استخدامك للخدمة بعد 7 أيام من الإشعار يُعتبر موافقة صريحة على الشروط المعدّلة.</li>
                  </ul>
                </div>

                {/* Section 8 */}
                <div className="bg-gray-700/50 rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                    <span className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center text-sm">8</span>
                    القانون الواجب التطبيق والاختصاص القضائي
                  </h2>
                  <ul className="space-y-3 list-disc list-inside">
                    <li>تخضع هذه الشروط وتفسر وفقاً لقوانين الجمهورية التونسية.</li>
                    <li>أي نزاع ينشأ عنها يكون من اختصاص المحاكم التونسية المختصة مكانياً في تونس العاصمة حصرياً.</li>
                  </ul>
                </div>

                {/* Agreement Notice */}
                <div className="bg-white/10 rounded-2xl p-6 text-center">
                  <p className="text-white text-lg leading-relaxed">
                    بضغطك على زر «إنشاء حساب» أو «موافق» أو باستمرارك في استخدام الخدمة، فإنك تؤكد أنك بالغ قانونياً (18 سنة فأكثر)، وقد قرأت وفهمت ووافقت على كل ما ورد أعلاه دون أي تحفظ.
                  </p>
                </div>

                {/* Contact */}
                <div className="text-center pt-6 border-t border-gray-700">
                  <p className="text-gray-400 mb-2">Kesti Pro – فريق الدعم</p>
                  <a href="mailto:support@kestipro.com" className="text-red-400 hover:text-red-300 transition">
                    support@kestipro.com
                  </a>
                </div>
              </div>
            </div>

            {/* Back Button */}
            <div className="text-center mt-8">
              <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للصفحة الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
