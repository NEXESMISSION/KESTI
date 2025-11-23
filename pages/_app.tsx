import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { CartProvider } from '@/contexts/CartContext'
import { SuspensionProvider } from '@/contexts/SuspensionContext'
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
        enforceDeviceLimit()
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
      const { data: { session } } = await supabase.auth.getSession()
      
      // Enforce device limit if user is logged in (skip on public pages)
      if (session && !isPublicPage(router.pathname)) {
        await enforceDeviceLimit()
      }
    }

    // Only check auth if not on public page
    if (!isPublicPage(router.pathname)) {
      checkAuth()
    }

    // Periodic device limit check (every 30 seconds)
    const deviceCheckInterval = setInterval(() => {
      if (!isPublicPage(router.pathname)) {
        enforceDeviceLimit()
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
    <>
      {/* Global loading bar for route transitions */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse">
          <div className="h-full bg-white opacity-50 animate-[shimmer_1s_infinite]"></div>
        </div>
      )}
      
      <SuspensionProvider>
        <CartProvider>
          <Component {...pageProps} />
        </CartProvider>
      </SuspensionProvider>
    </>
  )
}
