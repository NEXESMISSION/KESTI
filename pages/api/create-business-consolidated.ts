import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { verifySuperAdmin, safeErrorResponse, sanitizeInput, checkRateLimit, getClientIp } from '@/lib/api-security'
import { validatePassword } from '@/lib/password-validator'
import { logSecurityEvent } from '@/lib/security-logger'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return safeErrorResponse(res, 405, 'Method not allowed')
  }

  // Rate limiting
  const ip = getClientIp(req)
  const rateLimit = checkRateLimit(`create-business-consolidated:${ip}`, 10, 60000)
  if (!rateLimit.allowed) {
    return safeErrorResponse(res, 429, 'Too many requests')
  }

  try {
    // SECURITY: Only super admins can create business accounts
    const auth = await verifySuperAdmin(req)
    if (!auth.authorized) {
      return safeErrorResponse(res, 403, 'Super admin access required')
    }

    const { email, password, fullName, phoneNumber, pin, subscriptionEndsAt } = req.body

    // Validate inputs
    if (!email || !password || !fullName || !phoneNumber || !pin) {
      return safeErrorResponse(res, 400, 'Missing required fields')
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Weak password',
        details: passwordValidation.errors
      })
    }

    // Sanitize inputs
    const cleanEmail = sanitizeInput(email).toLowerCase()
    const cleanFullName = sanitizeInput(fullName)
    const cleanPhoneNumber = sanitizeInput(phoneNumber)
    const cleanPin = sanitizeInput(pin)

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return safeErrorResponse(res, 500, 'Server configuration error')
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
    })

    if (authError || !authData.user) {
      // Return more specific error message
      const errorMsg = authError?.message || 'Failed to create user'
      return res.status(400).json({
        success: false,
        error: errorMsg
      })
    }

    // Create the profile
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name: cleanFullName,
        email: cleanEmail,
        phone_number: cleanPhoneNumber,
        role: 'business_user',
        subscription_ends_at: subscriptionEndsAt,
        is_suspended: false,
        pin_code: cleanPin,
      })

    if (profileError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      const errorMsg = profileError?.message || 'Failed to create profile'
      return res.status(400).json({
        success: false,
        error: errorMsg
      })
    }

    // Log security event
    await logSecurityEvent('ACCOUNT_CREATED', {
      userId: authData.user.id,
      ipAddress: getClientIp(req),
      details: { 
        email: cleanEmail,
        createdBy: auth.userId 
      },
      severity: 'low'
    })

    return res.status(200).json({ 
      success: true, 
      userId: authData.user.id 
    })
  } catch (error) {
    return safeErrorResponse(res, 500, 'Internal server error')
  }
}
