import { NextApiRequest, NextApiResponse } from 'next'
import { checkRateLimit, getClientIp as getIp, safeErrorResponse } from '@/lib/api-security'

/**
 * API endpoint to get the client's IP address
 * Supports various proxy configurations and hosting environments
 * SECURITY: Rate limited to prevent abuse
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting: 20 requests per minute (generous for device registration)
  const clientIp = getIp(req)
  const rateLimit = checkRateLimit(`get-client-ip:${clientIp}`, 20, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  try {
    // Try to get IP from various headers (common in proxied environments)
    const forwarded = req.headers['x-forwarded-for']
    const realIp = req.headers['x-real-ip']
    const cfConnectingIp = req.headers['cf-connecting-ip'] // Cloudflare
    
    let ip = req.socket.remoteAddress || ''
    
    // Check proxy headers in order of preference
    if (cfConnectingIp && typeof cfConnectingIp === 'string') {
      ip = cfConnectingIp
    } else if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      ip = typeof forwarded === 'string' 
        ? forwarded.split(',')[0].trim() 
        : forwarded[0]
    } else if (realIp && typeof realIp === 'string') {
      ip = realIp
    }
    
    // Clean up IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      ip = '127.0.0.1'
    }
    
    // Remove IPv6 prefix if present
    if (ip.startsWith('::ffff:')) {
      ip = ip.substring(7)
    }
    
    return res.status(200).json({ 
      ip,
      success: true 
    })
  } catch (error: any) {
    console.error('Error getting client IP:', error)
    return res.status(500).json({ 
      error: 'Failed to get IP address',
      ip: null 
    })
  }
}
