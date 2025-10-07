import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
          <p className="text-gray-600">Loading...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Kesti POS</h1>
              <p className="text-gray-600 mt-1">Navigation Page</p>
            </div>
            
            {user ? (
              <div className="text-right">
                <p className="font-medium">{user.full_name || 'User'}</p>
                <p className="text-sm text-gray-500">Role: {user.role?.toString() || 'Unknown'}</p>
                <button 
                  onClick={handleLogout}
                  className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/login'}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Pages</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Login Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Authentication</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-green-50 border border-green-200" 
                     onClick={() => window.location.href = '/login-force-redirect'}>
                  <div className="font-medium text-green-800">✅ Force Redirect Login</div>
                  <div className="text-sm text-green-700">Guaranteed redirect after login</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/login'}>
                  <div className="font-medium">Standard Login</div>
                  <div className="text-sm text-gray-500">Regular login page</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/simple-login'}>
                  <div className="font-medium">Simple Login</div>
                  <div className="text-sm text-gray-500">Simplified login page</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/emergency-login'}>
                  <div className="font-medium">Emergency Login</div>
                  <div className="text-sm text-gray-500">Diagnostic login page</div>
                </div>
              </div>
            </div>
            
            {/* Admin Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Super Admin</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/super-admin'}>
                  <div className="font-medium">Regular Admin</div>
                  <div className="text-sm text-gray-500">Full admin dashboard</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/super-admin-basic'}>
                  <div className="font-medium">Basic Admin</div>
                  <div className="text-sm text-gray-500">Simplified admin dashboard</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/simple-admin'}>
                  <div className="font-medium">Simple Admin</div>
                  <div className="text-sm text-gray-500">Diagnostic admin dashboard</div>
                </div>
              </div>
            </div>
            
            {/* POS Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Business POS</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/pos'}>
                  <div className="font-medium">Regular POS</div>
                  <div className="text-sm text-gray-500">Full POS interface</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/pos-simple'}>
                  <div className="font-medium">Simple POS</div>
                  <div className="text-sm text-gray-500">Simplified POS interface</div>
                </div>
              </div>
            </div>
            
            {/* Owner Pages */}
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-bold mb-3">Business Owner</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/owner/products'}>
                  <div className="font-medium">Regular Products</div>
                  <div className="text-sm text-gray-500">Full product management</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/owner/products-simple'}>
                  <div className="font-medium">Simple Products</div>
                  <div className="text-sm text-gray-500">Basic product management</div>
                </div>
              </div>
            </div>
            
            {/* Utility Pages */}
            <div className="border rounded-lg p-4 md:col-span-2">
              <h3 className="text-lg font-bold mb-3">Special Pages</h3>
              <div className="space-y-2">
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/direct-access'}>
                  <div className="font-medium">Direct Access</div>
                  <div className="text-sm text-gray-500">Access content directly without navigation</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-green-50 border border-green-200" 
                     onClick={() => window.location.href = '/create-business-consolidated'}>
                  <div className="font-medium text-green-800">✅ RECOMMENDED: Consolidated Business Creation</div>
                  <div className="text-sm text-green-700">New solution with proper environment variable handling</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-blue-50 border border-blue-200" 
                     onClick={() => window.location.href = '/direct-business'}>
                  <div className="font-medium text-blue-800">Direct REST API Method</div>
                  <div className="text-sm text-blue-700">Completely bypasses client libraries</div>
                </div>

                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-yellow-50 border border-yellow-200" 
                     onClick={() => window.location.href = '/create-business-direct'}>
                  <div className="font-medium text-yellow-800">Direct Business Creation</div>
                  <div className="text-sm text-yellow-700">Create business accounts directly</div>
                </div>
                
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer bg-red-50 border border-red-200" 
                     onClick={() => window.location.href = '/create-business-emergency'}>
                  <div className="font-medium text-red-800">Emergency Business Creation</div>
                  <div className="text-sm text-red-700">Last resort method with hardcoded credentials</div>
                </div>
                <div className="p-3 hover:bg-gray-50 rounded cursor-pointer" 
                     onClick={() => window.location.href = '/suspended'}>
                  <div className="font-medium">Suspended</div>
                  <div className="text-sm text-gray-500">Suspension notification page</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Kesti POS - Phase 1 MVP</p>
        </div>
      </div>
    </div>
  )
}
