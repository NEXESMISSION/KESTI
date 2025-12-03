import { Profile } from '@/lib/supabase'
import { getSubscriptionDaysLeft } from '@/lib/auth'

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  profile: Profile
  onRenew?: () => void
}

export default function SubscriptionModal({ isOpen, onClose, profile, onRenew }: SubscriptionModalProps) {
  if (!isOpen) return null

  const daysLeft = getSubscriptionDaysLeft(profile)

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scaleIn relative"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Close Button - Fixed positioning at top right */}
        <button 
          onClick={onClose} 
          className="absolute top-4 left-4 z-10 w-10 h-10 bg-white shadow-lg hover:shadow-xl rounded-full flex items-center justify-center transition-all hover:scale-110 border-2 border-gray-200 hover:border-red-500 group"
          aria-label="إغلاق"
        >
          <svg className="w-5 h-5 text-gray-600 group-hover:text-red-600 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-8 text-center relative">
          <div className="mb-2">
            <svg className="w-16 h-16 mx-auto text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold mb-4">معلومات الاشتراك</h3>
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 inline-block">
            <div className="text-6xl font-black mb-2">{daysLeft}</div>
            <p className="text-indigo-100 text-lg font-semibold">يوم متبقي</p>
          </div>
          {profile.subscription_ends_at && (
            <p className="text-indigo-200 text-sm mt-4 bg-black/20 rounded-full px-4 py-2 inline-block">
              📅 ينتهي في: {new Date(profile.subscription_ends_at).toLocaleDateString('ar-TN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
        
        {/* Body */}
        <div className="p-6">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <span className="text-xl">✨</span>
              <span>اشتراكك الحالي يشمل:</span>
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>نقطة بيع احترافية كاملة</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>إدارة المخزون والمنتجات</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>تقارير مالية تفصيلية</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>إدارة الديون والمصروفات</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>دعم فني مجاني</span>
              </li>
            </ul>
          </div>

          {onRenew && (
            <button
              onClick={() => {
                onClose()
                onRenew()
              }}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>تجديد الاشتراك الآن</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
