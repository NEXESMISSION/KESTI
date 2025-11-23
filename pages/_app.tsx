import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { CartProvider } from '@/contexts/CartContext'
import { SuspensionProvider } from '@/contexts/SuspensionContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'
import { enforceDeviceLimit } from '@/utils/deviceManager'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Add navigation handling and device limit enforcement
  useEffect(() => {
    // Wait for router to be ready
    if (!router.isReady) return

    // Public pages that don't need authentication
    const publicPages = ['/', '/landing', '/login', '/login-emergency', '/simple-login', '/suspended', '/subscription-expired']
    
    const isPublicPage = (path: string) => {
      return publicPages.some(page => path === page || path.startsWith(page))
    }

    const handleRouteChange = (url: string) => {
      // Enforce device limit on every route change (except public pages)
      if (!isPublicPage(url)) {
        enforceDeviceLimit()
      }
    }

    const handleRouteError = (err: Error) => {
      // Ignore route cancellation errors (they're expected when navigating quickly)
      if (err.message !== 'Route Cancelled') {
        console.error('Route change error:', err)
      }
    }

    // Subscribe to router events
    router.events.on('routeChangeStart', handleRouteChange)
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
      router.events.off('routeChangeStart', handleRouteChange)
      router.events.off('routeChangeError', handleRouteError)
      clearInterval(deviceCheckInterval)
    }
  }, [router.isReady, router.pathname])

  return (
    <SuspensionProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </SuspensionProvider>
  )
}
