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
    // Public pages that don't need authentication
    const publicPages = ['/', '/landing', '/login', '/login-emergency', '/simple-login', '/suspended', '/subscription-expired']
    
    const isPublicPage = (path: string) => {
      return publicPages.some(page => path === page || path.startsWith(page))
    }

    const handleRouteChange = (url: string) => {
      console.log('App is changing routes to:', url)
      // Enforce device limit on every route change (except public pages)
      if (!isPublicPage(url)) {
        enforceDeviceLimit()
      }
    }

    // Subscribe to router events
    router.events.on('routeChangeStart', handleRouteChange)
    router.events.on('routeChangeComplete', () => console.log('Route change complete'))
    router.events.on('routeChangeError', (err) => console.error('Route change error:', err))

    // Check authentication and device limit
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session in _app.tsx:', session ? 'Authenticated' : 'Not authenticated')
      
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
      router.events.off('routeChangeComplete', () => console.log('Route change complete'))
      router.events.off('routeChangeError', (err) => console.error('Route change error:', err))
      clearInterval(deviceCheckInterval)
    }
  }, [router])

  return (
    <SuspensionProvider>
      <CartProvider>
        <Component {...pageProps} />
      </CartProvider>
    </SuspensionProvider>
  )
}
