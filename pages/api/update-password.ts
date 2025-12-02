import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySuperAdmin, isValidUUID, safeErrorResponse, checkRateLimit, getClientIp } from '@/lib/api-security'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting: 5 requests per minute (password changes are sensitive)
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(`update-password:${ip}`, 5, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  try {
    // SECURITY: Only super admins can reset user passwords
    const auth = await verifySuperAdmin(req)
    if (!auth.authorized) {
      return safeErrorResponse(res, 403, 'Super admin access required')
    }

    const { userId, newPassword } = req.body

    // SECURITY: Validate UUID format
    if (!userId || !isValidUUID(userId)) {
      return safeErrorResponse(res, 400, 'Invalid user ID')
    }

    // Validate password
    if (!newPassword || typeof newPassword !== 'string') {
      return safeErrorResponse(res, 400, 'Password is required')
    }

    if (newPassword.length < 6) {
      return safeErrorResponse(res, 400, 'Password must be at least 6 characters')
    }

    if (newPassword.length > 72) {
      return safeErrorResponse(res, 400, 'Password too long')
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return safeErrorResponse(res, 500, 'Server configuration error')
    }

    // Update user password
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        password: newPassword
      })
    })

    if (!response.ok) {
      return safeErrorResponse(res, 500, 'Failed to update password')
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error) {
    return safeErrorResponse(res, 500, 'Internal server error')
  }
}
