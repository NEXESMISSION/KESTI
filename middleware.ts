import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Public paths that don't require authentication checks
const PUBLIC_PATHS = [
  '/',
  '/landing',
  '/login',
  '/login-emergency',
  '/simple-login',
  '/emergency-login',
  '/login-force-redirect',
  '/force-login',
  '/suspended',
  '/subscription-expired',
  '/api/',
  '/_next/',
  '/favicon.ico'
]

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()
  const { pathname } = url
  
  // Always allow access to public paths
  if (PUBLIC_PATHS.some(publicPath => pathname.startsWith(publicPath))) {
    return NextResponse.next()
  }

  // SUSPENSION CHECK ONLY - no authentication check
  // This allows users to log in normally but redirects suspended users
  
  // Check for auth token cookie
  const accessToken = request.cookies.get('sb-access-token')?.value
  
  // If no token, allow through (authentication will be handled at page level)
  if (!accessToken) {
    return NextResponse.next()
  }

  // Check if user is suspended
  try {
    // Create a Supabase client for middleware
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase environment variables')
      return NextResponse.next()
    }
    
    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      })

      // Check user status (suspension and subscription)
      const { data: { user } } = await supabase.auth.getUser(accessToken)
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('is_suspended, subscription_ends_at, role')
          .eq('id', user.id)
          .single()

        // Super admins bypass all checks
        if (data?.role === 'super_admin') {
          return NextResponse.next()
        }

        // Check suspension first (higher priority)
        if (data?.is_suspended === true && pathname !== '/suspended') {
          const response = NextResponse.redirect(new URL('/suspended', request.url))
          // Add header to prevent caching of redirect
          response.headers.set('Cache-Control', 'no-store, must-revalidate')
          return response
        }
        
        // Then check subscription status (only for business users)
        let subscriptionExpired = false
        if (data?.subscription_ends_at) {
          const now = new Date()
          const expiryDate = new Date(data.subscription_ends_at)
          subscriptionExpired = expiryDate < now
        } else {
          // If subscription_ends_at is null, treat as NOT expired (valid)
          subscriptionExpired = false
        }
        
        if (subscriptionExpired && pathname !== '/subscription-expired' && pathname !== '/suspended') {
          const response = NextResponse.redirect(new URL('/subscription-expired', request.url))
          // Add header to prevent caching of redirect
          response.headers.set('Cache-Control', 'no-store, must-revalidate')
          return response
        }
      }
    }
  } catch (error) {
    console.error('Middleware error checking suspension status:', error)
    // On error, allow request through
  }
  
  // Allow request
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
