interface WelcomeModalProps {
  show: boolean
  onClose: () => void
  businessName: string
  daysRemaining: number
  onContactClick?: () => void
}

export default function WelcomeModal({ show, onClose, businessName, daysRemaining, onContactClick }: WelcomeModalProps) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">
            مرحباً {businessName}!
          </h2>
          <p className="text-gray-500">حسابك جاهز للاستخدام</p>
        </div>

        {/* Trial Badge */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl p-4 mb-6 text-white text-center">
          <p className="text-sm opacity-90 mb-1">تجربة مجانية</p>
          <p className="text-3xl font-bold">{daysRemaining} يوم</p>
          <p className="text-xs opacity-80 mt-1">جميع الميزات متاحة</p>
        </div>

        {/* Quick Info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600 text-center leading-relaxed">
            أضف منتجاتك وابدأ تسجيل المبيعات فوراً.
            <br />
            <span className="text-gray-400">السعر بعد التجربة: 30 دينار/شهر</span>
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={onClose}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-3.5 px-6 rounded-xl transition-all text-lg shadow-lg shadow-emerald-200"
        >
          ابدأ الآن
        </button>

        {/* Help Link */}
        <div className="mt-4 text-center">
          <a 
            href="https://wa.me/21653518337" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-gray-500 hover:text-emerald-600 transition-colors"
          >
            تحتاج مساعدة؟ تواصل معنا
          </a>
        </div>
      </div>
    </div>
  )
}
