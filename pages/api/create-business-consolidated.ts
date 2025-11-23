import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// This should use the service role key in production (keep it secret!)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, fullName, phoneNumber, pin, subscriptionEndsAt } = req.body

    // Validate inputs
    if (!email || !password || !fullName || !phoneNumber || !pin) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      console.error('Auth error:', authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      return res.status(400).json({ error: 'Failed to create user' })
    }

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        phone_number: phoneNumber,
        role: 'business_user',  // This will be cast to the ENUM type by PostgreSQL
        subscription_ends_at: subscriptionEndsAt,
        is_suspended: false,
        pin_code: pin,
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // Cleanup: delete the auth user if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(400).json({ error: profileError.message })
    }

    return res.status(200).json({ 
      success: true, 
      userId: authData.user.id 
    })
  } catch (error: any) {
    console.error('Unexpected error:', error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
