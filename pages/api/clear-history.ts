import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Delete sales and sale_items for this user
    // This will automatically delete sale_items due to CASCADE
    const { error: salesError } = await supabase
      .from('sales')
      .delete()
      .eq('owner_id', userId)

    if (salesError) {
      console.error('Error deleting sales:', salesError)
      throw salesError
    }

    // Delete expenses (saved templates are in localStorage, so they're safe)
    const { error: expensesError } = await supabase
      .from('expenses')
      .delete()
      .eq('owner_id', userId)

    if (expensesError) {
      console.error('Error deleting expenses:', expensesError)
      throw expensesError
    }

    return res.status(200).json({ 
      success: true, 
      message: 'History cleared successfully. Products and saved expense templates retained.' 
    })
  } catch (error: any) {
    console.error('Error in clear-history API:', error)
    return res.status(500).json({ 
      error: error.message || 'Failed to clear history',
      details: error
    })
  }
}
