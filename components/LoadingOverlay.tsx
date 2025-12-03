import { useLoading } from '@/contexts/LoadingContext'

export default function LoadingOverlay() {
  const { isLoading, loadingMessage } = useLoading()

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4">
        {/* Spinner */}
        <div className="relative w-16 h-16">
          {/* Outer ring */}
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
          {/* Animated ring */}
          <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          {/* Inner pulse */}
          <div className="absolute inset-2 bg-blue-100 rounded-full animate-pulse"></div>
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {loadingMessage || 'جاري التحميل...'}
          </h3>
          <p className="text-sm text-gray-500">الرجاء الانتظار</p>
        </div>

        {/* Animated dots */}
        <div className="flex gap-1.5">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
