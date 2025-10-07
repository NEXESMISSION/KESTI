import type { NextApiRequest, NextApiResponse } from 'next'

// Hardcoded credentials for direct API access
// These should never be exposed in production code
const SUPABASE_URL = 'https://kmkscflwnuubnbzddnvy.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.oQuoyZ40WwGIt-QKA9a5qWT_2gVvI8648K-yD0Ru9OU'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, fullName, pin, subscriptionEndsAt } = req.body

    // Validate inputs
    if (!email || !password || !fullName || !pin) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'fullName', 'pin'],
        received: Object.keys(req.body)
      })
    }

    console.log(`Creating business account for: ${email} (${fullName})`)
    
    // Step 1: Create user in Supabase Auth using direct REST API
    // https://supabase.com/docs/reference/api/auth-api
    console.log("Making direct REST call to create user...")
    
    // First, try direct API call to Supabase Auth
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true
      })
    })

    // Parse response
    const authData = await authResponse.json()
    
    if (!authResponse.ok) {
      console.error("Auth API error:", authData)
      
      if (authData.msg?.includes('already exists')) {
        return res.status(400).json({ error: 'User with this email already exists' })
      }
      
      return res.status(authResponse.status).json({ 
        error: 'Error creating user in Supabase Auth', 
        details: authData
      })
    }
    
    if (!authData.id) {
      return res.status(500).json({ 
        error: 'User created but no ID returned', 
        response: authData 
      })
    }
    
    const userId = authData.id
    console.log(`User created with ID: ${userId}`)
    
    // Step 2: Create profile using direct REST API call
    // https://supabase.com/docs/reference/api/database-api
    console.log("Making direct REST call to create profile...")
    
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        id: userId,
        full_name: fullName,
        email: email,
        role: 'business_user',
        subscription_ends_at: subscriptionEndsAt || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        is_suspended: false,
        pin_code: pin
      })
    })
    
    if (!profileResponse.ok) {
      // Attempt to delete the auth user since profile creation failed
      console.error('Profile creation failed, attempting to clean up auth user...')
      
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        })
      } catch (cleanupError) {
        console.error('Failed to clean up auth user:', cleanupError)
      }
      
      try {
        const profileErrorData = await profileResponse.json()
        return res.status(profileResponse.status).json({ 
          error: 'Error creating user profile', 
          details: profileErrorData
        })
      } catch (parseError) {
        return res.status(profileResponse.status).json({ 
          error: 'Error creating user profile', 
          status: profileResponse.status,
          statusText: profileResponse.statusText
        })
      }
    }
    
    console.log('Business account created successfully!')
    
    // Success!
    return res.status(200).json({ 
      success: true, 
      userId,
      message: 'Business account created successfully!'
    })
    
  } catch (error: any) {
    console.error('Unexpected error in API:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message || 'An unexpected error occurred'
    })
  }
}
