import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifySuperAdmin, isValidUUID, safeErrorResponse, checkRateLimit, getClientIp } from '@/lib/api-security'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting: 5 requests per minute
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(`clear-history:${ip}`, 5, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  try {
    // SECURITY: Only super admins can clear history
    const auth = await verifySuperAdmin(req)
    if (!auth.authorized) {
      return safeErrorResponse(res, 403, 'Super admin access required')
    }

    const { userId } = req.body

    // SECURITY: Validate UUID format
    if (!userId || !isValidUUID(userId)) {
      return safeErrorResponse(res, 400, 'Invalid user ID')
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return safeErrorResponse(res, 500, 'Server configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete sales and sale_items for this user
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .eq('owner_id', userId)

    if (salesError) {
      return safeErrorResponse(res, 500, 'Failed to clear sales history')
    }

    // Delete expenses
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('owner_id', userId)

    if (expensesError) {
      return safeErrorResponse(res, 500, 'Failed to clear expenses history')
    }

    return res.status(200).json({ 
      success: true, 
      message: 'History cleared successfully' 
    })
  } catch (error) {
    return safeErrorResponse(res, 500, 'Failed to clear history')
  }
}
