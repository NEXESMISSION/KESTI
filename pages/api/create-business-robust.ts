import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Basic validation
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Validate required body parameters
  const { email, password, fullName, pin } = req.body
  
  if (!email || !password || !fullName || !pin) {
    return res.status(400).json({ 
      error: 'Missing required fields', 
      required: ['email', 'password', 'fullName', 'pin'],
      received: Object.keys(req.body)
    })
  }

  // Get subscription date from body or default to 30 days
  const subscriptionEndsAt = req.body.subscriptionEndsAt || 
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  // Log the operation (for development only)
  console.log(`Creating business: ${email} (${fullName})`)
  
  try {
    // Validate environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL')
      return res.status(500).json({ error: 'Server configuration error - missing Supabase URL' })
    }
    
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
      return res.status(500).json({ error: 'Server configuration error - missing Supabase service role key' })
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Step 1: Create the user in Auth
    let authResponse
    try {
      authResponse = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })
    } catch (authError: any) {
      console.error('Auth error:', authError)
      return res.status(400).json({ 
        error: 'Auth error', 
        message: authError.message || 'Failed to create user'
      })
    }

    // Check for errors
    if (authResponse.error) {
      console.error('Auth response error:', authResponse.error)
      
      // Handle duplicate email case specifically
      if (authResponse.error.message.includes('already exists')) {
        return res.status(400).json({ error: 'A user with this email already exists' })
      }
      
      return res.status(400).json({ error: authResponse.error.message })
    }

    // Check if user was created
    if (!authResponse.data?.user) {
      console.error('No user returned from auth')
      return res.status(500).json({ error: 'Failed to create user account' })
    }

    const userId = authResponse.data.user.id

    // Step 2: Create the profile
    let profileResponse
    try {
      profileResponse = await supabaseAdmin
        .from('profiles')
        .insert({
          id: userId,
          full_name: fullName,
          email: email,
          role: 'business_user', // Will be cast to ENUM
          subscription_ends_at: subscriptionEndsAt,
          is_suspended: false,
          pin_code: pin,
        })
    } catch (profileError: any) {
      // Cleanup: delete the auth user since profile creation failed
      console.error('Profile error:', profileError)
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      return res.status(500).json({ 
        error: 'Profile error', 
        message: profileError.message || 'Failed to create user profile'
      })
    }

    // Check for profile errors
    if (profileResponse.error) {
      // Cleanup: delete the auth user since profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(userId)
      
      console.error('Profile response error:', profileResponse.error)
      return res.status(500).json({ error: profileResponse.error.message })
    }

    // Success!
    return res.status(200).json({ 
      success: true, 
      message: 'Business account created successfully',
      userId: userId
    })

  } catch (error: any) {
    console.error('Unexpected error in create-business-robust:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message || 'An unexpected error occurred'
    })
  }
}
