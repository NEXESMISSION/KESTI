import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Allow both POST and GET (for cron jobs)
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    console.log(`🔍 Auto-clear check started at ${new Date().toISOString()}`)

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
  } catch (error: any) {
    console.error('Error in check-and-auto-clear API:', error)
    return res.status(500).json({
      error: error.message || 'Failed to check auto-clear',
      details: error
    })
  }
}
