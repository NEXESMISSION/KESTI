import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Image from 'next/image'

export default function Navigation() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Check authentication on mount
  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(profile)
        }
      } catch (err) {
        console.error('Auth error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    checkAuth()
  }, [])

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-gray-400 border-t-blue-600 rounded-full mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="bg-white shadow-md rounded-lg p-6 mb-8">
          <div className="flex justify-between items-center">
            <div>
              <div className="mb-2">
                <Image src="/logo/KESTi.png" alt="KESTI" width={160} height={50} className="h-12 w-auto" priority />
              </div>
              <h1 className="text-3xl font-bold text-gray-900">نقطة البيع</h1>
              <p className="text-gray-600 mt-1">صفحة التنقل</p>
            </div>
            
            {user ? (
              <div className="text-right">
                <p className="font-medium">{user.full_name || 'User'}</p>
                <p className="text-sm text-gray-500">الدور: {user.role?.toString() || 'غير معروف'}</p>
                <button 
                  onClick={handleLogout}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  تسجيل الخروج
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                تسجيل الدخول
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">الصفحات المتاحة</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">المصادقة</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-green-50 border border-green-200" 
                     onClick={() => window.location.href = '/login-force-redirect'}>
                  <div className="font-medium text-green-800">✅ تسجيل الدخول مع إعادة التوجيه</div>
                  <div className="text-sm text-green-700">إعادة توجيه مضمونة بعد التسجيل</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/login'}>
                  <div className="font-medium">تسجيل دخول قياسي</div>
                  <div className="text-sm text-gray-500">صفحة تسجيل عادية</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/simple-login'}>
                  <div className="font-medium">تسجيل دخول بسيط</div>
                  <div className="text-sm text-gray-500">واجهة مبسطة</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/emergency-login'}>
                  <div className="font-medium">تسجيل دخول طارئ</div>
                  <div className="text-sm text-gray-500">طريقة وصول خاصة</div>
                </div>
              </div>
            </div>
            
            {/* Admin Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">المشرفين</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/super-admin'}>
                  <div className="font-medium">مشرف عام</div>
                  <div className="text-sm text-gray-500">لوحة تحكم كاملة</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/super-admin-basic'}>
                  <div className="font-medium">مشرف أساسي</div>
                  <div className="text-sm text-gray-500">لوحة تحكم مبسطة</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/simple-admin'}>
                  <div className="font-medium">مشرف بسيط</div>
                  <div className="text-sm text-gray-500">لوحة تحكم خاصة</div>
                </div>
              </div>
            </div>
            
            {/* POS Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">نقطة البيع</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/pos'}>
                  <div className="font-medium text-green-800">✅ نقطة بيع جديدة</div>
                  <div className="text-sm text-green-700">واجهة حديثة مع سلة تسوق</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/pos-simple'}>
                  <div className="font-medium">نقطة بيع بسيطة</div>
                  <div className="text-sm text-gray-500">واجهة مبسطة</div>
                </div>
              </div>
            </div>
            
            {/* Owner Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">مالك النشاط</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/owner/products'}>
                  <div className="font-medium">إدارة المنتجات</div>
                  <div className="text-sm text-gray-500">إدارة منتجات كاملة</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/owner/products-simple'}>
                  <div className="font-medium">إدارة بسيطة</div>
                  <div className="text-sm text-gray-500">إدارة منتجات أساسية</div>
                </div>
              </div>
            </div>
            
            {/* Utility Pages */}
            <div className="border rounded-lg p-4 md:col-span-2">
              <h3 className="text-lg font-bold mb-3">صفحات خاصة</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/direct-access'}>
                  <div className="font-medium">وصول مباشر</div>
                  <div className="text-sm text-gray-500">الوصول إلى المحتوى مباشرة</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-green-50 border border-green-200" 
                     onClick={() => window.location.href = '/create-business-consolidated'}>
                  <div className="font-medium text-green-800">✅ موصى به: إنشاء نشاط موحد</div>
                  <div className="text-sm text-green-700">حل جديد مع معالجة مناسبة</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-blue-50 border border-blue-200" 
                     onClick={() => window.location.href = '/direct-business'}>
                  <div className="font-medium text-blue-800">طريقة REST API مباشرة</div>
                  <div className="text-sm text-blue-700">يتجاوز مكتبات العميل</div>
                </div>

                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-yellow-50 border border-yellow-200" 
                     onClick={() => window.location.href = '/create-business-direct'}>
                  <div className="font-medium text-yellow-800">إنشاء نشاط مباشر</div>
                  <div className="text-sm text-yellow-700">إنشاء حسابات مباشرة</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-red-50 border border-red-200" 
                     onClick={() => window.location.href = '/create-business-emergency'}>
                  <div className="font-medium text-red-800">إنشاء نشاط طارئ</div>
                  <div className="text-sm text-red-700">طريقة الملاذ الأخير</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/suspended'}>
                  <div className="font-medium">معلق</div>
                  <div className="text-sm text-gray-500">صفحة إشعار التعليق</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>KESTI - نقطة البيع - المرحلة الأولى</p>
        </div>
      </div>
    </div>
  )
}
