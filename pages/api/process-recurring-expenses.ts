import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const today = new Date().toISOString().split('T')[0]
    
    // Get all active recurring expenses that are due today or earlier
    const { data: dueExpenses, error: fetchError } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_type', 'recurring')
      .eq('is_active', true)
      .lte('next_occurrence_date', today)

    if (fetchError) throw fetchError

    let processedCount = 0
    let errors = []

    for (const expense of dueExpenses || []) {
      try {
        // Calculate next occurrence date based on frequency
        const currentDate = new Date(expense.next_occurrence_date)
        let nextDate = new Date(currentDate)

        switch (expense.recurring_frequency) {
          case 'daily':
            nextDate.setDate(currentDate.getDate() + 1)
            break
          case 'weekly':
            nextDate.setDate(currentDate.getDate() + 7)
            break
          case 'monthly':
            nextDate.setMonth(currentDate.getMonth() + 1)
            break
          case 'yearly':
            nextDate.setFullYear(currentDate.getFullYear() + 1)
            break
          case 'custom':
            // Handle custom intervals
            const amount = expense.custom_interval_amount || 1
            const unit = expense.custom_interval_unit || 'days'
            
            if (unit === 'minutes') {
              nextDate.setMinutes(currentDate.getMinutes() + amount)
            } else if (unit === 'hours') {
              nextDate.setHours(currentDate.getHours() + amount)
            } else if (unit === 'days') {
              nextDate.setDate(currentDate.getDate() + amount)
            } else if (unit === 'weeks') {
              nextDate.setDate(currentDate.getDate() + (amount * 7))
            } else if (unit === 'months') {
              nextDate.setMonth(currentDate.getMonth() + amount)
            } else if (unit === 'years') {
              nextDate.setFullYear(currentDate.getFullYear() + amount)
            }
            break
        }

        // Update the recurring expense with next occurrence date
        const { error: updateError } = await supabase
          .from('expenses')
          .update({ 
            next_occurrence_date: nextDate.toISOString().split('T')[0]
          })
          .eq('id', expense.id)

        if (updateError) throw updateError

        processedCount++
      } catch (err: any) {
        errors.push({ expenseId: expense.id, error: err.message })
      }
    }

    return res.status(200).json({
      success: true,
      message: `Processed ${processedCount} recurring expenses`,
      processedCount,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error: any) {
    console.error('Error processing recurring expenses:', error)
    return res.status(500).json({ error: error.message })
  }
}
