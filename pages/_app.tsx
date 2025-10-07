import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { CartProvider } from '@/contexts/CartContext'
import { SuspensionProvider } from '@/contexts/SuspensionContext'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '@/lib/supabase'

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()

  // Add navigation handling
  useEffect(() => {
    const handleRouteChange = (url: string) => {
      console.log('App is changing routes to:', url)
    }

    // Subscribe to router events
    router.events.on('routeChangeStart', handleRouteChange)
    router.events.on('routeChangeComplete', () => console.log('Route change complete'))
    router.events.on('routeChangeError', (err) => console.error('Route change error:', err))

    // Check authentication
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Current session in _app.tsx:', session ? 'Authenticated' : 'Not authenticated')
    }

    checkAuth()

    return () => {
      // Clean up event listeners
      router.events.off('routeChangeStart', handleRouteChange)
      router.events.off('routeChangeComplete', () => console.log('Route change complete'))
      router.events.off('routeChangeError', (err) => console.error('Route change error:', err))
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
