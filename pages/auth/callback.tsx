import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { trackSignupSuccess, trackLoginSuccess } from '@/lib/analytics'
import { registerCurrentDevice } from '@/utils/deviceManager'

export default function AuthCallback() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loadingMessage, setLoadingMessage] = useState('جاري تسجيل الدخول...')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Wait a bit for Supabase to process the OAuth callback
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Exchange the code for a session
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        // If we have tokens in the URL, use them
        if (accessToken) {
          const { data, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || ''
          })
          
          if (setSessionError) {
            throw setSessionError
          }
        }
        
        // Get the session from the URL hash
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        if (!session) {
          throw new Error('No session found')
        }

        const user = session.user

        setLoadingMessage('جاري التحقق من الحساب...')

        // Check if this email already exists in profiles (could be from regular signup)
        const { data: existingProfiles, error: checkError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', user.email)

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError
        }

        // If there are multiple profiles with same email or a profile with different ID, it's a duplicate
        if (existingProfiles && existingProfiles.length > 0) {
          const existingProfile = existingProfiles.find((p: any) => p.id !== user.id)
          if (existingProfile) {
            // Email already exists with a different account!
            setError('هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من التسجيل.')
            // Sign out the Google session
            await supabase.auth.signOut()
            setTimeout(() => router.push('/login'), 3000)
            return
          }
        }

        // Check if this user already has a profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          // PGRST116 means no rows returned (new user)
          throw profileError
        }

        console.log('Profile check:', {
          exists: !!profile,
          completed: profile?.profile_completed,
          role: profile?.role
        })

        // Register the device (for users with complete profiles, not new signups)
        if (profile && profile.profile_completed && profile.role !== 'super_admin') {
          console.log('Registering device for existing user...')
          const deviceResult = await registerCurrentDevice()
          if (!deviceResult.success) {
            console.warn('Device registration failed:', deviceResult.error)
          } else {
            console.log('Device registered successfully')
          }
        }

        if (!profile || !profile.profile_completed) {
          // New user or incomplete profile - needs to complete profile
          setLoadingMessage('جاري التوجيه لإكمال البيانات...')
          console.log('Redirecting to complete-profile')
          if (!profile) {
            trackSignupSuccess('google', user.id)
          }
          await new Promise(resolve => setTimeout(resolve, 800))
          window.location.href = '/complete-profile'
        } else if (profile.role === 'super_admin') {
          // Super admin with complete profile
          setLoadingMessage('مرحباً! جاري التوجيه للوحة التحكم...')
          console.log('Redirecting super admin to /super-admin')
          trackLoginSuccess('google', user.id)
          await new Promise(resolve => setTimeout(resolve, 800))
          window.location.href = '/super-admin'
        } else {
          // Regular user with complete profile
          setLoadingMessage('مرحباً! جاري التوجيه لنقطة البيع...')
          console.log('Redirecting user to /pos')
          trackLoginSuccess('google', user.id)
          await new Promise(resolve => setTimeout(resolve, 800))
          window.location.href = '/pos'
        }
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'حدث خطأ أثناء تسجيل الدخول')
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    handleCallback()
  }, [router])

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">فشل تسجيل الدخول</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">جاري التحويل إلى صفحة تسجيل الدخول...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
          <svg className="w-8 h-8 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{loadingMessage}</h2>
        <p className="text-gray-600">يرجى الانتظار...</p>
        
        {/* Progress indicators */}
        <div className="mt-6 flex justify-center gap-2">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  )
}
