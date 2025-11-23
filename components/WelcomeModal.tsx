import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

interface WelcomeModalProps {
  show: boolean
  onClose: () => void
  businessName: string
  daysRemaining: number
}

export default function WelcomeModal({ show, onClose, businessName, daysRemaining }: WelcomeModalProps) {
  const router = useRouter()

  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl transform animate-slideUp">
        {/* Celebration Icon */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-4 animate-bounce">🎉</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً بك في Kesti Pro!
          </h2>
          <p className="text-lg text-gray-600">
            {businessName}
          </p>
        </div>

        {/* Free Trial Info */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6 border-2 border-blue-200">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-4xl">🎁</span>
            <div className="text-center">
              <h3 className="text-2xl font-bold text-blue-900">{daysRemaining} يوم</h3>
              <p className="text-sm text-blue-700">تجربة مجانية</p>
            </div>
          </div>
          
          <div className="space-y-3 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>استخدام كامل لجميع ميزات النظام</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>تسجيل مبيعات غير محدود</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>إدارة المخزون والموظفين</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>تقارير مالية تفصيلية</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p>دعم فني مجاني طوال فترة التجربة</p>
            </div>
          </div>
        </div>

        {/* Important Notes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex gap-2">
            <span className="text-yellow-600 text-xl">💡</span>
            <div>
              <h4 className="font-semibold text-yellow-900 mb-1">ملاحظات هامة:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• لا توجد رسوم أو بطاقة ائتمان مطلوبة خلال التجربة</li>
                <li>• يمكنك إلغاء الخدمة في أي وقت</li>
                <li>• سيتم تذكيرك قبل انتهاء الفترة التجريبية</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-xl text-white font-bold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            ابدأ الآن 🚀
          </button>
          
          <button
            onClick={() => {
              onClose()
              router.push('/#pricing')
            }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-all"
          >
            عرض باقات الاشتراك
          </button>
        </div>

        {/* Contact Support */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            هل تحتاج مساعدة؟{' '}
            <a 
              href="https://wa.me/21653518337" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-secondary font-semibold"
            >
              تواصل معنا عبر واتساب
            </a>
          </p>
        </div>
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
