import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const event = req.body

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', event.event_name, event.metadata)
    }

    // Initialize Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      // Don't fail if Supabase not configured, just log
      console.warn('Supabase not configured for analytics')
      return res.status(200).json({ success: true })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insert into analytics_events table
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_name: event.event_name,
        user_id: event.user_id || null,
        session_id: event.session_id,
        page_url: event.page_url,
        referrer: event.referrer || null,
        utm_source: event.utm_source || null,
        utm_medium: event.utm_medium || null,
        utm_campaign: event.utm_campaign || null,
        utm_content: event.utm_content || null,
        utm_term: event.utm_term || null,
        device_type: event.device_type,
        browser: event.browser,
        os: event.os,
        country: event.country || null,
        metadata: event.metadata || null,
        created_at: event.timestamp,
      })

    if (error) {
      console.error('Failed to insert analytics event:', error)
      // Don't fail the request, just log
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    // Return success anyway to not affect user experience
    return res.status(200).json({ success: true })
  }
}
