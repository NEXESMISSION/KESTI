import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Log environment variables (just for debugging, don't include in production)
  console.log('API URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('API Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  console.log('API Service Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate the supabase URL and keys
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || 
      !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ 
      error: 'Server configuration error - missing Supabase credentials. Please run setup-env.bat' 
    })
  }

  // Create the admin client
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    const { email, password, fullName, pin, subscriptionEndsAt } = req.body

    // Validate inputs
    if (!email || !password || !fullName || !pin) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Skip checking for existing profiles directly - the auth API will handle this
    // Instead, create the auth user directly and catch any duplicates there

    // Create the auth user with admin API
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
        role: 'business_user', // Will be cast to ENUM
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
