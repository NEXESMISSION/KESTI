/**
 * Analytics & Conversion Tracking System
 * Tracks user interactions, conversions, and marketing campaign performance
 */

export interface AnalyticsEvent {
  event_name: string
  user_id?: string
  session_id: string
  page_url: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  device_type: 'mobile' | 'tablet' | 'desktop'
  browser: string
  os: string
  country?: string
  metadata?: Record<string, any>
  timestamp: string
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  
  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

/**
 * Detect device type
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  if (width < 768) return 'mobile'
  if (width < 1024) return 'tablet'
  return 'desktop'
}

/**
 * Get browser and OS info
 */
function getBrowserInfo(): { browser: string; os: string } {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { browser: 'unknown', os: 'unknown' }
  }

  const ua = navigator.userAgent
  let browser = 'unknown'
  let os = 'unknown'

  // Detect browser
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('MSIE') || ua.includes('Trident')) browser = 'IE'

  // Detect OS
  if (ua.includes('Windows')) os = 'Windows'
  else if (ua.includes('Mac')) os = 'macOS'
  else if (ua.includes('Linux')) os = 'Linux'
  else if (ua.includes('Android')) os = 'Android'
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS'

  return { browser, os }
}

/**
 * Extract UTM parameters from URL
 */
function getUTMParameters(): {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
} {
  if (typeof window === 'undefined') return {}

  const params = new URLSearchParams(window.location.search)
  return {
    utm_source: params.get('utm_source') || undefined,
    utm_medium: params.get('utm_medium') || undefined,
    utm_campaign: params.get('utm_campaign') || undefined,
    utm_content: params.get('utm_content') || undefined,
    utm_term: params.get('utm_term') || undefined,
  }
}

/**
 * Save UTM parameters to sessionStorage (persist across pages)
 */
export function saveUTMParameters(): void {
  if (typeof window === 'undefined') return

  const utmParams = getUTMParameters()
  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem('utm_params', JSON.stringify(utmParams))
  }
}

/**
 * Get saved UTM parameters
 */
function getSavedUTMParameters(): ReturnType<typeof getUTMParameters> {
  if (typeof window === 'undefined') return {}

  const saved = sessionStorage.getItem('utm_params')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      return {}
    }
  }
  return {}
}

/**
 * Track analytics event
 */
export async function trackEvent(
  eventName: string,
  metadata?: Record<string, any>,
  userId?: string
): Promise<void> {
  if (typeof window === 'undefined') return

  const { browser, os } = getBrowserInfo()
  const utmParams = { ...getSavedUTMParameters(), ...getUTMParameters() }

  const event: AnalyticsEvent = {
    event_name: eventName,
    user_id: userId,
    session_id: getSessionId(),
    page_url: window.location.href,
    referrer: document.referrer || undefined,
    ...utmParams,
    device_type: getDeviceType(),
    browser,
    os,
    metadata,
    timestamp: new Date().toISOString(),
  }

  try {
    // Send to API endpoint
    await fetch('/api/track-analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    })

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, metadata)
    }
  } catch (error) {
    console.error('Failed to track event:', error)
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName?: string): void {
  trackEvent('page_view', {
    page_name: pageName || document.title,
    page_path: window.location.pathname,
  })
}

/**
 * Track button click
 */
export function trackButtonClick(buttonName: string, location: string): void {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
  })
}

/**
 * Track signup attempt
 */
export function trackSignupAttempt(method: 'email' | 'google'): void {
  trackEvent('signup_attempt', {
    method,
  })
}

/**
 * Track successful signup
 */
export function trackSignupSuccess(method: 'email' | 'google', userId: string): void {
  trackEvent('signup_success', {
    method,
  }, userId)
}

/**
 * Track login attempt
 */
export function trackLoginAttempt(method: 'email' | 'google'): void {
  trackEvent('login_attempt', {
    method,
  })
}

/**
 * Track successful login
 */
export function trackLoginSuccess(method: 'email' | 'google', userId: string): void {
  trackEvent('login_success', {
    method,
  }, userId)
}

/**
 * Track CTA (Call to Action) clicks
 */
export function trackCTAClick(ctaName: string, location: string): void {
  trackEvent('cta_click', {
    cta_name: ctaName,
    location,
  })
}

/**
 * Track form interactions
 */
export function trackFormStart(formName: string): void {
  trackEvent('form_start', {
    form_name: formName,
  })
}

export function trackFormComplete(formName: string): void {
  trackEvent('form_complete', {
    form_name: formName,
  })
}

export function trackFormError(formName: string, error: string): void {
  trackEvent('form_error', {
    form_name: formName,
    error,
  })
}

/**
 * Track scroll depth
 */
export function setupScrollTracking(): void {
  if (typeof window === 'undefined') return

  let tracked = {
    '25': false,
    '50': false,
    '75': false,
    '100': false,
  }

  const trackScroll = () => {
    const scrollPercentage = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    )

    Object.keys(tracked).forEach((threshold) => {
      const thresholdNum = parseInt(threshold)
      if (scrollPercentage >= thresholdNum && !tracked[threshold as keyof typeof tracked]) {
        tracked[threshold as keyof typeof tracked] = true
        trackEvent('scroll_depth', {
          depth: thresholdNum,
          page: window.location.pathname,
        })
      }
    })
  }

  window.addEventListener('scroll', trackScroll, { passive: true })
}

/**
 * Track time on page
 */
export function trackTimeOnPage(): (() => void) | void {
  if (typeof window === 'undefined') return

  const startTime = Date.now()

  const sendTimeOnPage = () => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000) // seconds
    trackEvent('time_on_page', {
      seconds: timeSpent,
      page: window.location.pathname,
    })
  }

  // Track when user leaves
  window.addEventListener('beforeunload', sendTimeOnPage)
  
  // Also track every 30 seconds for active users
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendTimeOnPage()
    }
  }, 30000)

  // Cleanup
  return () => {
    clearInterval(interval)
    window.removeEventListener('beforeunload', sendTimeOnPage)
  }
}

// ⚠️ REMOVED: Facebook Pixel and Google Analytics
// We only use our own custom analytics system that stores data in Supabase
// This gives us full control and privacy compliance
