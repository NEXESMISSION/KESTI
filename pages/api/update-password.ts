import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, newPassword } = req.body

    if (!userId || !newPassword) {
      return res.status(400).json({ error: 'userId and newPassword are required' })
    }

    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' })
    }

    // Get credentials from environment variables (NEVER hardcode!)
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!SUPABASE_URL || !SERVICE_KEY) {
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Update user password in Supabase Auth using admin API
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`
      },
      body: JSON.stringify({
        password: newPassword
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
      console.error('Error updating password:', errorData)
      return res.status(response.status).json({
        error: 'Failed to update password',
        details: errorData
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    })

  } catch (error: any) {
    console.error('Unexpected error updating password:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
