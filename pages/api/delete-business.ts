import type { NextApiRequest, NextApiResponse } from 'next'

// Get Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kmkscflwnuubnbzddnvy.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtta3NjZmx3bnV1Ym5iemRkbnZ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTc2MDA4NiwiZXhwIjoyMDc1MzM2MDg2fQ.oQuoyZ40WwGIt-QKA9a5qWT_2gVvI8648K-yD0Ru9OU'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' })
    }

    console.log(`Deleting user from Supabase Auth: ${userId}`)

    // Delete user from Supabase Auth using admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('Error deleting user from auth:', errorData)
      return res.status(response.status).json({
        error: 'Failed to delete user from authentication',
        details: errorData
      })
    }

    console.log('User deleted successfully from Supabase Auth')

    return res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    })

  } catch (error: any) {
    console.error('Unexpected error deleting user:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
