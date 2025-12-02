import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/**
 * API Security Utilities
 * Provides authentication, authorization, and rate limiting for API routes
 */

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Get client IP from request
 */
export function getClientIp(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

/**
 * Simple rate limiter
 * @param identifier - Unique identifier (IP or user ID)
 * @param maxRequests - Maximum requests allowed
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (record.count >= maxRequests) {
    return { 
      allowed: false, 
      remaining: 0, 
      resetIn: record.resetTime - now 
    }
  }

  record.count++
  return { 
    allowed: true, 
    remaining: maxRequests - record.count, 
    resetIn: record.resetTime - now 
  }
}

/**
 * Verify user authentication from request
 * Returns the authenticated user or null
 */
export async function verifyAuth(req: NextApiRequest): Promise<{
  authenticated: boolean
  userId?: string
  role?: string
  error?: string
}> {
  try {
    // Get auth token from cookie or Authorization header
    const authHeader = req.headers.authorization
    let accessToken: string | undefined

    if (authHeader?.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7)
    } else {
      // Try to get from cookies
      const cookies = req.headers.cookie?.split(';')
      const tokenCookie = cookies?.find(c => c.trim().startsWith('sb-access-token='))
      accessToken = tokenCookie?.split('=')[1]
    }

    if (!accessToken) {
      return { authenticated: false, error: 'No authentication token provided' }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      return { authenticated: false, error: 'Server configuration error' }
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    })

    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      return { authenticated: false, error: 'Invalid or expired token' }
    }

    // Get user role from profiles
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return {
      authenticated: true,
      userId: user.id,
      role: profile?.role || 'business_user'
    }
  } catch (error) {
    return { authenticated: false, error: 'Authentication verification failed' }
  }
}

/**
 * Verify super admin access
 */
export async function verifySuperAdmin(req: NextApiRequest): Promise<{
  authorized: boolean
  userId?: string
  error?: string
}> {
  const auth = await verifyAuth(req)
  
  if (!auth.authenticated) {
    return { authorized: false, error: auth.error }
  }

  if (auth.role !== 'super_admin') {
    return { authorized: false, error: 'Super admin access required' }
  }

  return { authorized: true, userId: auth.userId }
}

/**
 * Sanitize user input to prevent injection attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000) // Limit length
}

/**
 * Validate UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Create a safe error response (no internal details)
 */
export function safeErrorResponse(
  res: NextApiResponse,
  statusCode: number,
  message: string
) {
  return res.status(statusCode).json({
    success: false,
    error: message
  })
}

/**
 * Middleware wrapper for authenticated routes
 */
export function withAuth(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await verifyAuth(req)
    
    if (!auth.authenticated) {
      return safeErrorResponse(res, 401, 'Authentication required')
    }

    return handler(req, res, auth.userId!)
  }
}

/**
 * Middleware wrapper for super admin routes
 */
export function withSuperAdmin(
  handler: (req: NextApiRequest, res: NextApiResponse, userId: string) => Promise<void>
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const auth = await verifySuperAdmin(req)
    
    if (!auth.authorized) {
      return safeErrorResponse(res, 403, 'Access denied')
    }

    return handler(req, res, auth.userId!)
  }
}

/**
 * Middleware wrapper with rate limiting
 */
export function withRateLimit(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  maxRequests: number = 10,
  windowMs: number = 60000
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getClientIp(req)
    const { allowed, remaining, resetIn } = checkRateLimit(ip, maxRequests, windowMs)

    res.setHeader('X-RateLimit-Remaining', remaining.toString())
    res.setHeader('X-RateLimit-Reset', Math.ceil(resetIn / 1000).toString())

    if (!allowed) {
      return safeErrorResponse(res, 429, 'Too many requests. Please try again later.')
    }

    return handler(req, res)
  }
}
