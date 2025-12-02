import Head from 'next/head'
import Link from 'next/link'

export default function Legal() {
  return (
    <>
      <Head>
        <title>الشروط والأحكام - Kesti Pro</title>
        <meta name="description" content="شروط استخدام خدمة Kesti Pro" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir="rtl">
        {/* Header */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/">
                <img src="/logo/logo no bg low qulity.png" alt="Kesti Pro" className="h-8" />
              </Link>
              <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 rounded-2xl mb-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">شروط استخدام خدمة Kesti Pro</h1>
              <p className="text-gray-500">آخر تحديث: 2 ديسمبر 2025</p>
            </div>

            {/* Intro */}
            <div className="bg-white rounded-2xl p-6 mb-6 border border-gray-200 shadow-sm">
              <p className="text-gray-600 leading-relaxed">
                بتسجيلك أو استخدامك لخدمة Kesti Pro، فإنك تقر بأنك قرأت وفهمت ووافقت على الشروط التالية كاملةً وبدون تحفظ.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-4">
              {/* Section 1 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">1</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">الاستخدام المشروع والقانوني</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        يُحظر تماماً استخدام الخدمة في أي نشاط غير قانوني أو يخالف التشريعات التونسية السارية.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        أنت وحدك المسؤول قانونياً ومالياً مسؤولية كاملة عن جميع عمليات البيع والفواتير والإقرارات الضريبية والجمركية الناتجة عن نشاطك التجاري.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">2</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">دقة البيانات والمحاسبة</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        أنت مسؤول مسؤولية كاملة عن صحة ودقة الأسعار والكميات والمصروفات وجميع البيانات التي تدخلها.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Kesti Pro أداة مساعدة تقنية فقط، ولا تُعتبر بأي حال بديلاً عن محاسب قانوني أو خبير ضرائب معتمد.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 3 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">3</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">حماية البيانات والأمان</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        نحن نطبّق معايير تشفير عالية المستوى (TLS 1.3 وتشفير قواعد البيانات) لحماية بياناتك.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        لا نبيع بياناتك الشخصية ولا نشاركها مع أي طرف ثالث إلا بأمر قضائي ساري أو بموافقتك الصريحة.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        في حال وقوع أي هجوم إلكتروني أو اختراق أو تسرب بيانات ناتج عن ظروف قاهرة، فإننا غير مسؤولين عن أي أضرار تنجم عن ذلك إلى أقصى حد يسمح به القانون التونسي.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 4 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">4</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">الاشتراك والتسعير والدفع</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        الاشتراك شهري أو سنوي ويجدد تلقائياً ما لم تقم بإلغائه قبل موعد التجديد.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        يمكنك إلغاء الاشتراك في أي وقت من لوحة التحكم بدون أي رسوم إلغاء أو التزامات مستقبلية.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        لا يتم استرجاع المبالغ المدفوعة عن الفترة التي تم استخدام الخدمة فيها فعلياً.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 5 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">5</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">فترة التجربة المجانية</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        15 يوماً مجاناً من تاريخ إنشاء الحساب.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        لا يتم خصم أي مبلغ إلا بعد انتهاء الفترة المجانية وبموافقتك الصريحة على الاشتراك المدفوع.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 6 - Important */}
              <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">6</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-red-900 mb-3">حدود المسؤولية (مهم جداً)</h2>
                    <ul className="space-y-2 text-red-800">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        تُقدَّم الخدمة «كما هي» و«حسب التوفر» بدون أي ضمان ضمني أو صريح باستمراريتها 100% أو خلوها من الأخطاء.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        لا نتحمل مسؤولية أي أضرار مباشرة أو غير مباشرة أو خسائر في الأرباح أو البيانات تنجم عن سوء الاستخدام أو انقطاع الخدمة أو هجمات إلكترونية.
                      </li>
                    </ul>
                    <div className="mt-4 p-3 bg-red-100 rounded-xl">
                      <p className="text-red-900 font-medium text-sm">
                        الحد الأقصى لمسؤوليتنا المالية تجاهك لن يتجاوز المبلغ الذي دفعته لنا فعلياً خلال الثلاثة أشهر السابقة للحادثة.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 7 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">7</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">تعديل الشروط</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        نحتفظ بالحق في تعديل هذه الشروط في أي وقت، وسنُعلمك بالتغييرات عبر إشعار داخل التطبيق أو بريد إلكتروني.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        استمرار استخدامك للخدمة بعد 7 أيام من الإشعار يُعتبر موافقة صريحة على الشروط المعدّلة.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 8 */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">8</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">القانون الواجب التطبيق</h2>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        تخضع هذه الشروط وتفسر وفقاً لقوانين الجمهورية التونسية.
                      </li>
                      <li className="flex items-start gap-2">
                        <svg className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        أي نزاع ينشأ عنها يكون من اختصاص المحاكم التونسية المختصة مكانياً في تونس العاصمة حصرياً.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Agreement Notice */}
            <div className="bg-gray-900 rounded-2xl p-6 mt-6 text-center">
              <p className="text-white leading-relaxed">
                بضغطك على زر «إنشاء حساب» أو «موافق» أو باستمرارك في استخدام الخدمة، فإنك تؤكد أنك بالغ قانونياً (18 سنة فأكثر)، وقد قرأت وفهمت ووافقت على كل ما ورد أعلاه دون أي تحفظ.
              </p>
            </div>

            {/* Contact */}
            <div className="text-center mt-8 pt-8 border-t border-gray-200">
              <p className="text-gray-500 mb-2">Kesti Pro – فريق الدعم</p>
              <a href="mailto:support@kestipro.com" className="text-gray-900 hover:underline font-medium">
                support@kestipro.com
              </a>
            </div>

            {/* Back Button */}
            <div className="text-center mt-8">
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium">
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
