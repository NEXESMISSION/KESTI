import type { NextApiRequest, NextApiResponse } from 'next'

// Test if the service key works
const SUPABASE_URL = 'https://kmkscflwnuubnbzddnvy.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.jU1mv1xIk35bB2nBcoWKGWO6QKO4UAsKqJ1HfrcDWNM'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    console.log('Testing SERVICE_KEY...')
    console.log('SUPABASE_URL:', SUPABASE_URL)
    console.log('SERVICE_KEY length:', SERVICE_KEY.length)
    console.log('SERVICE_KEY:', SERVICE_KEY.substring(0, 50) + '...')

    // Try to list users (this requires service_role permission)
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    })

    const data = await response.json()

    console.log('Response status:', response.status)
    console.log('Response:', data)

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: 'SERVICE_KEY test failed',
        status: response.status,
        statusText: response.statusText,
        details: data,
        message: 'The SERVICE_KEY is not working. It may be expired, invalid, or lack permissions.'
      })
    }

    return res.status(200).json({
      success: true,
      message: 'SERVICE_KEY is working correctly!',
      userCount: data.users?.length || 0,
      details: 'The key has proper admin permissions'
    })

  } catch (error: any) {
    console.error('Error testing key:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to test key',
      message: error.message
    })
  }
}
