import { NextApiRequest, NextApiResponse } from 'next'

interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

// In-memory store for rate limiting
// For production, consider using Redis or a database
const rateLimitStore: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  Object.keys(rateLimitStore).forEach(key => {
    if (rateLimitStore[key].resetTime < now) {
      delete rateLimitStore[key]
    }
  })
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

/**
 * Rate limiting middleware to prevent spam and DDoS attacks
 * @param config Rate limit configuration
 */
export function rateLimit(config: RateLimitConfig) {
  const { windowMs, maxRequests } = config

  return function rateLimitMiddleware(
    req: NextApiRequest,
    res: NextApiResponse,
    next: () => void
  ): boolean {
    // Get client identifier (IP address or user ID)
    const identifier = getClientIdentifier(req)
    const now = Date.now()

    // Initialize or get existing rate limit data
    if (!rateLimitStore[identifier] || rateLimitStore[identifier].resetTime < now) {
      rateLimitStore[identifier] = {
        count: 0,
        resetTime: now + windowMs
      }
    }

    // Increment request count
    rateLimitStore[identifier].count++

    // Check if limit exceeded
    if (rateLimitStore[identifier].count > maxRequests) {
      const resetIn = Math.ceil((rateLimitStore[identifier].resetTime - now) / 1000)
      
      res.status(429).json({
        error: 'تم تجاوز حد الطلبات. يرجى المحاولة لاحقاً.',
        message: `Too many requests. Please try again in ${resetIn} seconds.`,
        retryAfter: resetIn
      })
      return false
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString())
    res.setHeader('X-RateLimit-Remaining', (maxRequests - rateLimitStore[identifier].count).toString())
    res.setHeader('X-RateLimit-Reset', rateLimitStore[identifier].resetTime.toString())

    next()
    return true
  }
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextApiRequest): string {
  // Try to get IP from headers (for proxies/load balancers)
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string'
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress || 'unknown'

  return `ip:${ip}`
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitPresets = {
  // Strict: For sensitive endpoints like login/signup
  strict: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 requests per 15 minutes
  },
  // Moderate: For API endpoints
  moderate: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 20 // 20 requests per minute
  },
  // Lenient: For public pages
  lenient: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  }
}
