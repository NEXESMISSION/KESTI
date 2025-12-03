import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { safeErrorResponse, checkRateLimit, getClientIp, verifyAuth } from '@/lib/api-security'

// Secret key for cron job authentication (set in environment)
const CRON_SECRET = process.env.CRON_SECRET

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow both POST and GET (for cron jobs)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting: 60 requests per minute (for cron jobs)
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(`auto-clear:${ip}`, 60, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  // SECURITY: Verify authentication - either cron secret OR valid Supabase session
  const authHeader = req.headers.authorization
  let isAuthorized = false

  // Check for cron secret first
  if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) {
    isAuthorized = true
  }

  // If no cron secret auth, check for valid Supabase session
  if (!isAuthorized) {
    const auth = await verifyAuth(req)
    if (auth.authenticated) {
      isAuthorized = true
    }
  }

  if (!isAuthorized) {
    return safeErrorResponse(res, 401, 'Unauthorized')
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return safeErrorResponse(res, 500, 'Server configuration error')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get all business users with auto-clear enabled
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'business_user')
      .or('history_auto_clear_days.not.is.null,history_auto_clear_minutes.not.is.null')

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return res.status(500).json({ error: 'Failed to fetch profiles' })
    }

    const clearedUsers: string[] = []

    // Check each profile and auto-clear if needed
    for (const profile of profiles || []) {
      try {
        const useMinutes = profile.history_auto_clear_minutes && profile.history_auto_clear_minutes > 0
        const useDays = profile.history_auto_clear_days && profile.history_auto_clear_days > 0

        if (!useMinutes && !useDays) continue

        // Validate profile data
        if (!profile.id || !profile.email) {
          console.error('Invalid profile data, skipping:', profile)
          continue
        }

        const lastClear = profile.last_history_clear ? new Date(profile.last_history_clear) : new Date()
        const now = new Date()

        // Validate dates
        if (isNaN(lastClear.getTime())) {
          console.error(`Invalid last_history_clear date for ${profile.email}, using current time`)
          lastClear.setTime(now.getTime())
        }

        let nextClear: Date
        let shouldClear = false

        if (useMinutes) {
          nextClear = new Date(lastClear.getTime() + profile.history_auto_clear_minutes * 60 * 1000)
          const timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60))
          shouldClear = timeLeft <= 0
        } else {
          nextClear = new Date(lastClear.getTime() + profile.history_auto_clear_days * 24 * 60 * 60 * 1000)
          const timeLeft = Math.ceil((nextClear.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
          shouldClear = timeLeft <= 0
        }

        if (shouldClear) {
          console.log(`🗑️ AUTO-CLEARING history for ${profile.full_name} (${profile.email})`)

          // Delete sales and sale_items
          const { error: salesError } = await supabase
            .from('sales')
            .delete()
            .eq('owner_id', profile.id)

          if (salesError) {
            console.error(`Error deleting sales for ${profile.email}:`, salesError)
            continue
          }

          // Delete expenses
          const { error: expensesError } = await supabase
            .from('expenses')
            .delete()
            .eq('owner_id', profile.id)

          if (expensesError) {
            console.error(`Error deleting expenses for ${profile.email}:`, expensesError)
            continue
          }

          // Update last_history_clear timestamp
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ last_history_clear: new Date().toISOString() })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`Error updating last_history_clear for ${profile.email}:`, updateError)
          } else {
            console.log(`✅ Auto-cleared successfully for ${profile.full_name}`)
            clearedUsers.push(profile.email || profile.full_name || profile.id)
          }
        }
      } catch (profileError: any) {
        console.error(`Error processing profile ${profile.email}:`, profileError)
        // Continue with next profile instead of failing entire operation
        continue
      }
    }

    console.log(`✅ Auto-clear check completed. Cleared ${clearedUsers.length} user(s).`)

    return res.status(200).json({
      success: true,
      message: 'Auto-clear check completed',
      clearedUsers,
      checkedProfiles: profiles?.length || 0
    })
  } catch (error) {
    return safeErrorResponse(res, 500, 'Auto-clear check failed')
  }
}
