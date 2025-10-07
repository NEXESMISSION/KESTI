import type { NextApiRequest, NextApiResponse } from 'next'

/**
 * Consolidated Business Creation API
 * 
 * This implementation combines the best practices from all previous versions:
 * 1. Uses direct REST API calls to avoid client library issues
 * 2. Properly handles environment variables with fallbacks
 * 3. Includes comprehensive error handling and cleanup
 * 4. Implements proper validation
 */

// Get values from environment variables with hardcoded fallbacks for reliability
// Note: In production, these should ONLY come from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cljatviscofdlfdqokme.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsamF0dmlzY29mZGxmZHFva21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTgwMDMzOCwiZXhwIjoyMDc1Mzc2MzM4fQ.2we1yh0Jk_6L3Da94LeaQnQVsqAldkQnVhU29Wgs1k0'

// Log which key source is being used (for debugging)
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('Using hardcoded SERVICE_ROLE_KEY fallback')
} else {
  console.log('Using SERVICE_ROLE_KEY from environment variables')
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password, fullName, pin, subscriptionDays = 30 } = req.body
    
    // Log request (for debugging)
    console.log('Creating business account:', { email, fullName })

    // Validate inputs
    if (!email || !password || !fullName || !pin) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['email', 'password', 'fullName', 'pin'],
        received: Object.keys(req.body)
      })
    }

    // Validate pin format (4-6 digits)
    if (!/^\d{4,6}$/.test(pin)) {
      return res.status(400).json({
        error: 'Invalid PIN format',
        message: 'PIN must be 4-6 digits'
      })
    }

    console.log(`Creating business account for: ${email} (${fullName})`)
    console.log('Using SUPABASE_URL:', SUPABASE_URL)
    console.log('SERVICE_KEY length:', SERVICE_KEY.length)
    console.log('SERVICE_KEY starts with:', SERVICE_KEY.substring(0, 20) + '...')
    
    // Calculate subscription end date
    const subscriptionEndsAt = new Date()
    subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + Number(subscriptionDays))
    
    // Step 1: Try to create user in Supabase Auth, or get existing user
    let userId: string | undefined;
    let isExistingUser = false;
    
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

    // Handle non-JSON responses
    let authData
    try {
      authData = await authResponse.json()
    } catch (error) {
      return res.status(500).json({
        error: 'Failed to parse auth response',
        status: authResponse.status,
        statusText: authResponse.statusText
      })
    }
    
    if (!authResponse.ok) {
      console.error("Auth API error:", authData)
      console.error("Response status:", authResponse.status)
      console.error("Response status text:", authResponse.statusText)
      console.error("Full error details:", JSON.stringify(authData, null, 2))
      
      // Handle user already exists - get existing user instead of failing
      if (authData.msg?.includes('already exists') || authData.message?.includes('already been registered')) {
        console.log('User already exists, fetching existing user...')
        
        // Get existing user by email
        const getUserResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SERVICE_KEY,
            'Authorization': `Bearer ${SERVICE_KEY}`
          }
        })
        
        const usersData = await getUserResponse.json()
        const existingUser = usersData.users?.find((u: any) => u.email === email)
        
        if (existingUser) {
          userId = existingUser.id
          isExistingUser = true
          console.log(`Found existing user with ID: ${userId}`)
        } else {
          return res.status(400).json({ 
            error: 'User exists but could not be found',
            message: 'Please try a different email or contact support'
          })
        }
      }
      
      // Handle weak password error
      else if (authData.msg?.includes('password') || authData.message?.includes('password')) {
        return res.status(400).json({ 
          error: 'Password does not meet requirements',
          message: authData.message || authData.msg || 'Password must be at least 6 characters',
          details: authData
        })
      }
      // Handle validation errors
      else if (authResponse.status === 422) {
        return res.status(422).json({ 
          error: 'Validation error',
          message: authData.message || authData.msg || authData.error_description || 'Invalid data provided',
          details: authData,
          hint: 'Check if email is valid and password meets requirements (min 6 characters)'
        })
      }
      // Other errors
      else {
        return res.status(authResponse.status).json({ 
          error: 'Error creating user in Supabase Auth', 
          details: authData,
          status: authResponse.status,
          statusText: authResponse.statusText,
          message: authData.message || authData.msg || authData.error_description || 'Unknown error'
        })
      }
    }
    
    // If we got here without userId being set, it means auth user was created successfully
    if (!userId) {
      if (!authData.id) {
        return res.status(500).json({ 
          error: 'User created but no ID returned', 
          response: authData 
        })
      }
      userId = authData.id
      console.log(`New user created with ID: ${userId}`)
    }
    
    // Final check to ensure userId is set
    if (!userId) {
      return res.status(500).json({ error: 'Failed to get user ID' })
    }
    
    // Step 2: Create/Update profile using direct REST API call with upsert
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify({
        id: userId,
        full_name: fullName,
        email: email,
        role: 'business_user',
        subscription_ends_at: subscriptionEndsAt.toISOString(),
        is_suspended: false,
        pin_code: pin
      })
    })
    
    if (!profileResponse.ok) {
      // Only try to delete auth user if it was newly created (not existing)
      if (!isExistingUser) {
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
          console.log('Auth user cleaned up successfully')
        } catch (cleanupError) {
          console.error('Failed to clean up auth user:', cleanupError)
        }
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
    
    const actionMessage = isExistingUser 
      ? 'Business account updated successfully!' 
      : 'Business account created successfully!'
    
    console.log(actionMessage)
    
    // Success!
    return res.status(200).json({ 
      success: true, 
      userId,
      isExistingUser,
      message: actionMessage,
      subscriptionEndDate: subscriptionEndsAt.toISOString()
    })
    
  } catch (error: any) {
    console.error('Unexpected error in API:', error)
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message || 'An unexpected error occurred'
    })
  }
}
