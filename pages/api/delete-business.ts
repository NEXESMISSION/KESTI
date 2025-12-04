import type { NextApiRequest, NextApiResponse } from 'next'
import { verifySuperAdmin, isValidUUID, safeErrorResponse, checkRateLimit, getClientIp } from '@/lib/api-security'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting: 10 requests per minute for admin actions
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(`delete-business:${ip}`, 10, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  try {
    // SECURITY: Only super admins can delete users
    const auth = await verifySuperAdmin(req)
    if (!auth.authorized) {
      return safeErrorResponse(res, 403, 'Super admin access required')
    }

    const { userId } = req.body

    // SECURITY: Validate UUID format
    if (!userId || !isValidUUID(userId)) {
      return safeErrorResponse(res, 400, 'Invalid user ID')
    }

    // SECURITY: Prevent self-deletion
    if (userId === auth.userId) {
      return safeErrorResponse(res, 400, 'Cannot delete your own account')
    }

    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return safeErrorResponse(res, 500, 'Server configuration error')
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // First, delete from profiles table to avoid foreign key constraints
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return safeErrorResponse(res, 500, 'Failed to delete user profile')
    }

    // Then delete user from Supabase Auth
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    })

    if (!response.ok) {
      return safeErrorResponse(res, 500, 'Failed to delete user from authentication')
    }

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error) {
    return safeErrorResponse(res, 500, 'Internal server error')
  }
}
