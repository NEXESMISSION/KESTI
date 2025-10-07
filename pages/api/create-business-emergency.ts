import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Define hardcoded credentials - in a real app, these should NEVER be hardcoded
// but this is an emergency fallback for when environment variables aren't working
const HARDCODED_SUPABASE_URL = 'https://kmkscflwnuubnbzddnvy.supabase.co'
const HARDCODED_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.jU1mv1xIk35bB2nBcoWKGWO6QKO4UAsKqJ1HfrcDWNM'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  console.log("Emergency business creation API called")

  try {
    // Get parameters from request body
    const { email, password, fullName, pin, subscriptionEndsAt } = req.body

    // Validate inputs
    if (!email || !password || !fullName || !pin) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log(`Creating business account for ${email}`)
    
    // Create Supabase client with HARDCODED credentials
    // Note: This is only for emergency use when env vars aren't working
    const supabaseAdmin = createClient(
      HARDCODED_SUPABASE_URL,
      HARDCODED_SERVICE_KEY
    )
    
    console.log("Supabase admin client created")

    // Create auth user
    console.log("Creating auth user...")
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })
    
    if (authError) {
      console.error("Auth error:", authError)
      return res.status(400).json({ error: authError.message })
    }

    if (!authData.user) {
      console.error("No user returned")
      return res.status(400).json({ error: 'Failed to create user' })
    }
    
    console.log(`Auth user created with ID: ${authData.user.id}`)

    // Create profile
    console.log("Creating profile...")
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        email: email,
        role: 'business_user',  // Will be cast to ENUM
        subscription_ends_at: subscriptionEndsAt || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        is_suspended: false,
        pin_code: pin,
      })

    if (profileError) {
      console.error("Profile error:", profileError)
      
      // Try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        .catch(err => console.error("Cleanup error:", err))
        
      return res.status(400).json({ error: profileError.message })
    }
    
    console.log("Business account created successfully!")

    return res.status(200).json({ 
      success: true, 
      message: 'Business account created successfully!',
      userId: authData.user.id
    })
    
  } catch (error: any) {
    console.error("Unexpected error:", error)
    return res.status(500).json({ error: error.message || 'Internal server error' })
  }
}
