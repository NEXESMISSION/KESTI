import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

interface WelcomeModalProps {
  show: boolean
  onClose: () => void
  businessName: string
  daysRemaining: number
  onContactClick?: () => void
}

export default function WelcomeModal({ show, onClose, businessName, daysRemaining, onContactClick }: WelcomeModalProps) {
  const router = useRouter()
  const [showVideo, setShowVideo] = useState(false)

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-3 md:p-4 z-50 animate-fadeIn overflow-y-auto">
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 max-w-lg md:max-w-2xl w-full shadow-2xl transform animate-slideUp my-4 md:my-8 max-h-[95vh] overflow-y-auto">
        {/* Celebration Icon */}
        <div className="text-center mb-3 md:mb-4">
          <div className="text-4xl md:text-5xl mb-2 animate-bounce">🎉</div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 mb-1">
            مرحباً بك في Kesti Pro!
          </h2>
          <p className="text-sm md:text-base font-semibold text-primary">
            {businessName}
          </p>
        </div>

        {/* Free Trial Info - HIGHLIGHTED */}
        <div className="bg-gradient-to-br from-green-500 via-emerald-500 to-green-600 rounded-xl p-3 md:p-4 mb-3 border-2 border-green-400 shadow-xl animate-pulse">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2 md:p-3 mb-2">
            <div className="flex items-center justify-center gap-2">
              <span className="text-3xl md:text-4xl">🎁</span>
              <div className="text-center">
                <h3 className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">{daysRemaining} يوم</h3>
                <p className="text-sm md:text-base font-bold text-white">تجربة مجانية</p>
              </div>
            </div>
          </div>
          
          <div className="space-y-1 text-xs md:text-sm text-white font-semibold">
            <div className="flex items-start gap-1.5">
              <span className="text-yellow-300">✓</span>
              <p>كل ميزات النظام</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-yellow-300">✓</span>
              <p>مبيعات غير محدودة</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-yellow-300">✓</span>
              <p>إدارة المخزون والموظفين</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-yellow-300">✓</span>
              <p>تقارير تفصيلية</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-yellow-300">✓</span>
              <p>دعم فني مجاني</p>
            </div>
          </div>
        </div>

        {/* How to Use Section with Video */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 mb-3 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl md:text-2xl">📚</span>
            <h3 className="text-sm md:text-base font-black text-blue-900">كيفية الاستخدام</h3>
          </div>
          
          <div className="space-y-1 text-xs md:text-sm text-gray-700 mb-2">
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">1.</span>
              <p><strong>أضف المنتجات</strong> من قائمة المنتجات</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">2.</span>
              <p><strong>سجّل المبيعات</strong> بنظام POS</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">3.</span>
              <p><strong>راقب المخزون</strong> تلقائياً</p>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">4.</span>
              <p><strong>راجع التقارير</strong> يومياً</p>
            </div>
          </div>

          <button
            onClick={() => setShowVideo(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 px-4 rounded-lg hover:scale-105 transition-all shadow-md flex items-center justify-center gap-2 text-xs md:text-sm"
          >
            <span className="text-lg">▶️</span>
            <span>فيديو تعليمي (قريباً)</span>
          </button>
        </div>

        {/* Subscription Pricing - HIGHLIGHTED */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-lg p-3 mb-3 border-2 border-orange-400 shadow-lg">
          <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2.5 text-center">
            <p className="text-white font-bold text-xs mb-1">بعد انتهاء التجربة</p>
            <div className="flex items-center justify-center gap-1.5">
              <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">30</span>
              <div className="text-right">
                <p className="text-lg md:text-xl font-black text-white">دينار</p>
                <p className="text-sm font-semibold text-white/90">شهرياً</p>
              </div>
            </div>
            <p className="text-white/90 text-xs mt-1.5 font-semibold">✨ بدون رسوم خفية</p>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 mb-3">
          <div className="flex gap-1.5">
            <span className="text-yellow-600 text-lg">⚠️</span>
            <div>
              <h4 className="font-black text-yellow-900 mb-1.5 text-xs md:text-sm">تنبيهات هامة:</h4>
              <ul className="text-xs md:text-sm text-yellow-900 space-y-1 font-semibold">
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>لا رسوم خلال التجربة</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>بعد {daysRemaining} يوم تحتاج تجديد</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>بياناتك آمنة دائماً</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>تذكير قبل 3 أيام</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Device Limitation Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 mb-3">
          <div className="flex gap-1.5">
            <span className="text-blue-600 text-lg">📱</span>
            <div>
              <h4 className="font-black text-blue-900 mb-1.5 text-xs md:text-sm">حد الأجهزة:</h4>
              <ul className="text-xs md:text-sm text-blue-900 space-y-1 font-semibold">
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>يمكن استخدام 3 أجهزة فقط في نفس الوقت</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>عند تسجيل دخول جهاز رابع، سيتم إخراج الأقدم</span>
                </li>
                <li className="flex items-start gap-1">
                  <span>•</span>
                  <span>يمكنك التبديل بين الأجهزة في أي وقت</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-2">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:shadow-lg text-white font-black py-3 px-4 rounded-lg transition-all transform hover:scale-105 text-sm md:text-base border-2 border-green-400"
          >
            ابدأ الآن 🚀
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            {onContactClick && (
              <button
                onClick={() => {
                  onClose()
                  onContactClick()
                }}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:shadow-md text-white font-bold py-2 px-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-1 text-xs md:text-sm"
              >
                <span className="text-base md:text-lg">📞</span>
                <span>تواصل</span>
              </button>
            )}
            <button
              onClick={() => {
                onClose()
                router.push('/#pricing')
              }}
              className="bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold py-2 px-3 rounded-lg transition-all hover:scale-105 flex items-center justify-center gap-1 text-xs md:text-sm"
            >
              <span className="text-base md:text-lg">💰</span>
              <span>الأسعار</span>
            </button>
          </div>
        </div>

        {/* Contact Support - Enhanced */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-2.5 text-center">
            <p className="text-xs md:text-sm font-bold text-gray-700 mb-2">
              💬 تحتاج مساعدة؟
            </p>
            <a 
              href="https://wa.me/21653518337" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all hover:scale-105 shadow-md text-xs md:text-sm"
            >
              <span className="text-base md:text-lg">📱</span>
              <span>واتساب</span>
            </a>
          </div>
        </div>

        {/* Video Modal */}
        {showVideo && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" 
            onClick={() => setShowVideo(false)}
          >
            <div className="bg-white rounded-xl p-6 max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900">فيديو تعليمي - كيفية استخدام Kesti Pro</h3>
                <button 
                  onClick={() => setShowVideo(false)} 
                  className="text-3xl hover:text-red-500 transition"
                >
                  ×
                </button>
              </div>
              <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-64 md:h-96 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-6xl mb-4 animate-pulse">🎬</div>
                  <p className="text-2xl font-bold text-gray-800 mb-2">قريباً جداً!</p>
                  <p className="text-base text-gray-600">جاري العمل على إنتاج فيديو تعليمي شامل</p>
                  <p className="text-sm text-gray-500 mt-4">في الوقت الحالي، يمكنك استكشاف النظام بنفسك أو التواصل معنا للحصول على مساعدة مباشرة</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
    </div>
  )
}
