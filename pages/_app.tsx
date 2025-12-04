import '@/styles/globals.css'
import '@/lib/disable-console' // Disable console logs in production
import type { AppProps } from 'next/app'
import { CartProvider } from '@/contexts/CartContext'
import { SuspensionProvider } from '@/contexts/SuspensionContext'
import { LoadingProvider } from '@/contexts/LoadingContext'
import ErrorBoundary from '@/components/ErrorBoundary'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { enforceDeviceLimit } from '@/utils/deviceManager'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isNavigating, setIsNavigating] = useState(false)

  // Add navigation handling and device limit enforcement
  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return

    // Public pages that don't need authentication
    const publicPages = ['/', '/landing', '/login', '/login-emergency', '/simple-login', '/suspended', '/subscription-expired']
    
    const isPublicPage = (path: string) => {
      return publicPages.some(page => path === page || path.startsWith(page))
    }

    const handleRouteChangeStart = () => {
      setIsNavigating(true)
    }

    const handleRouteChangeComplete = (url: string) => {
      setIsNavigating(false)
      // Enforce device limit AFTER route change completes (except public pages)
      // This prevents interrupting navigation
      if (!isPublicPage(url)) {
        try {
          enforceDeviceLimit().catch(err => {
            console.warn('Device limit enforcement failed:', err)
          })
        } catch (err) {
          console.warn('Device limit enforcement error:', err)
        }
      }
    }

    const handleRouteError = (err: Error) => {
      setIsNavigating(false)
      // Ignore route cancellation errors (they're expected when navigating quickly)
      if (err.message !== 'Route Cancelled') {
        console.error('Route change error:', err)
      }
    }

    // Subscribe to router events for loading state and device enforcement
    router.events.on('routeChangeStart', handleRouteChangeStart)
    router.events.on('routeChangeComplete', handleRouteChangeComplete)
    router.events.on('routeChangeError', handleRouteError)

    // Check authentication and device limit
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        // Enforce device limit if user is logged in (skip on public pages)
        if (session && !isPublicPage(router.pathname)) {
          await enforceDeviceLimit()
        }
      } catch (err) {
        console.warn('Auth check failed:', err)
      }
    }

    // Only check auth if not on public page
    if (!isPublicPage(router.pathname)) {
      checkAuth()
    }

    // Periodic device limit check (every 30 seconds)
    const deviceCheckInterval = setInterval(() => {
      if (!isPublicPage(router.pathname)) {
        try {
          enforceDeviceLimit().catch(err => {
            console.warn('Periodic device check failed:', err)
          })
        } catch (err) {
          console.warn('Periodic device check error:', err)
        }
      }
    }, 30000) // 30 seconds

    return () => {
      // Clean up event listeners
      router.events.off('routeChangeStart', handleRouteChangeStart)
      router.events.off('routeChangeComplete', handleRouteChangeComplete)
      router.events.off('routeChangeError', handleRouteError)
      clearInterval(deviceCheckInterval)
    }
  }, [router.isReady, router.pathname])

  return (
    <ErrorBoundary>
      {/* Global loading bar for route transitions */}
      {isNavigating && (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
            <div className="h-full bg-white opacity-50 animate-[shimmer_1s_infinite]"></div>
          </div>
          {/* Simple Loading Icon Overlay */}
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col items-center gap-3">
              {/* Simple Spinner */}
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              {/* Loading Text */}
              <p className="text-sm font-medium text-gray-700">جاري التحميل...</p>
            </div>
          </div>
        </>
      )}
      
      <LoadingProvider>
        <SuspensionProvider>
          <CartProvider>
            <Component {...pageProps} />
            {/* Global loading overlay */}
            <LoadingOverlay />
          </CartProvider>
        </SuspensionProvider>
      </LoadingProvider>
    </ErrorBoundary>
  )
}
