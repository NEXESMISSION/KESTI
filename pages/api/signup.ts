import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Types
interface SignupRequestBody {
  email: string
  password: string
  fullName: string
  phoneNumber: string
  pin: string
  subscriptionEndsAt?: string
}

interface SignupResponse {
  success: boolean
  userId?: string
  email?: string
  message?: string
  error?: string
  errorCode?: string
}

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Helper: Validate PIN format (4-6 digits)
function isValidPin(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}

// Helper: Clean up auth user (used when profile creation fails)
async function cleanupAuthUser(userId: string): Promise<void> {
  try {
    console.log(`🧹 Cleaning up auth user: ${userId}`)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)
    if (error) {
      console.error('❌ Failed to cleanup auth user:', error)
      throw error
    }
    console.log('✅ Auth user cleaned up successfully')
  } catch (error) {
    console.error('❌ Cleanup error:', error)
    throw error
  }
}

// Helper: Delete orphaned profile by ID
async function deleteOrphanedProfile(profileId: string): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting orphaned profile: ${profileId}`)
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', profileId)
    
    if (error) {
      console.error('❌ Failed to delete orphaned profile:', error)
      return false
    }
    
    console.log('✅ Orphaned profile deleted successfully')
    return true
  } catch (error) {
    console.error('❌ Error deleting orphaned profile:', error)
    return false
  }
}

// Helper: Check if email exists in auth or profiles
async function checkEmailExists(email: string): Promise<{ exists: boolean; location?: 'auth' | 'profile' | 'both' }> {
  try {
    // Check auth users
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUserExists = users?.some(u => u.email?.toLowerCase() === email.toLowerCase())
    
    // Check profiles table
    const { data: profileData } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle()
    
    const profileExists = !!profileData
    
    if (authUserExists && profileExists) {
      return { exists: true, location: 'both' }
    } else if (authUserExists) {
      return { exists: true, location: 'auth' }
    } else if (profileExists) {
      return { exists: true, location: 'profile' }
    }
    
    return { exists: false }
  } catch (error) {
    console.error('❌ Error checking email existence:', error)
    throw error
  }
}

// Helper: Cleanup orphaned data
async function cleanupOrphanedData(email: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking for orphaned data for: ${email}`)
    
    // Get all auth users
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
    
    // Get profile with this email
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle()
    
    // Case 1: Auth user exists but no profile (orphaned auth user)
    if (authUser && !profile) {
      console.log('🧹 Found orphaned auth user without profile')
      await cleanupAuthUser(authUser.id)
      await new Promise(resolve => setTimeout(resolve, 1000))
      return true
    }
    
    // Case 2: Profile exists but no auth user (orphaned profile)
    if (profile && !authUser) {
      console.log('🧹 Found orphaned profile without auth user')
      const deleted = await deleteOrphanedProfile(profile.id)
      if (deleted) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return true
      }
      return false
    }
    
    // Case 3: Both exist (user should login)
    if (authUser && profile) {
      console.log('✅ Complete user account exists - user should login')
      return false
    }
    
    console.log('✅ No orphaned data found')
    return true
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
    return false
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed' 
    })
  }

  console.log('\n' + '='.repeat(50))
  console.log('🚀 SIGNUP REQUEST STARTED')
  console.log('='.repeat(50))

  let createdAuthUserId: string | null = null

  try {
    const { email, password, fullName, phoneNumber, pin, subscriptionEndsAt }: SignupRequestBody = req.body

    // ==========================================
    // STEP 1: INPUT VALIDATION
    // ==========================================
    console.log('\n📋 STEP 1: Input Validation')
    console.log(`📧 Email: ${email}`)
    console.log(`👤 Name: ${fullName}`)
    console.log(`📱 Phone: ${phoneNumber}`)

    if (!email || !password || !fullName || !phoneNumber || !pin) {
      console.log('❌ Missing required fields')
      return res.status(400).json({
        success: false,
        error: 'يرجى ملء جميع الحقول المطلوبة',
        errorCode: 'MISSING_FIELDS'
      })
    }

    if (!isValidEmail(email)) {
      console.log('❌ Invalid email format')
      return res.status(400).json({
        success: false,
        error: 'البريد الإلكتروني غير صالح',
        errorCode: 'INVALID_EMAIL'
      })
    }

    if (password.length < 6) {
      console.log('❌ Password too short')
      return res.status(400).json({
        success: false,
        error: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
        errorCode: 'PASSWORD_TOO_SHORT'
      })
    }

    if (!isValidPin(pin)) {
      console.log('❌ Invalid PIN format')
      return res.status(400).json({
        success: false,
        error: 'رمز PIN يجب أن يكون من 4 إلى 6 أرقام',
        errorCode: 'INVALID_PIN'
      })
    }

    console.log('✅ All inputs valid')

    // ==========================================
    // STEP 2: CHECK FOR EXISTING USERS
    // ==========================================
    console.log('\n📋 STEP 2: Checking for existing users')
    
    const emailCheck = await checkEmailExists(email)
    
    if (emailCheck.exists) {
      console.log(`⚠️ Email exists in: ${emailCheck.location}`)
      
      // Try to cleanup orphaned data
      const cleanedUp = await cleanupOrphanedData(email)
      
      if (!cleanedUp) {
        // Complete account exists or cleanup failed
        console.log('❌ User already exists')
        return res.status(400).json({
          success: false,
          error: 'هذا البريد الإلكتروني مستخدم بالفعل. يرجى تسجيل الدخول.',
          errorCode: 'EMAIL_EXISTS'
        })
      }
      
      console.log('✅ Orphaned data cleaned up successfully')
    } else {
      console.log('✅ Email available for signup')
    }

    // ==========================================
    // STEP 3: CREATE AUTH USER
    // ==========================================
    console.log('\n📋 STEP 3: Creating auth user')
    
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })

    if (authError || !authData.user) {
      console.error('❌ Auth user creation failed:', authError)
      
      if (authError?.message?.includes('already registered') || 
          authError?.message?.includes('duplicate')) {
        return res.status(400).json({
          success: false,
          error: 'هذا البريد الإلكتروني مستخدم بالفعل',
          errorCode: 'EMAIL_EXISTS'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'فشل في إنشاء حساب المصادقة',
        errorCode: 'AUTH_CREATION_FAILED'
      })
    }

    createdAuthUserId = authData.user.id
    console.log(`✅ Auth user created: ${authData.user.id}`)

    // ==========================================
    // STEP 4: CHECK FOR ID CONFLICTS
    // ==========================================
    console.log('\n📋 STEP 4: Checking for profile ID conflicts')
    
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('id', authData.user.id)
      .maybeSingle()
    
    if (existingProfile) {
      console.log(`⚠️ Found existing profile with same ID but different email: ${existingProfile.email}`)
      
      // Delete the orphaned profile
      const deleted = await deleteOrphanedProfile(authData.user.id)
      
      if (!deleted) {
        console.error('❌ Failed to delete conflicting profile')
        await cleanupAuthUser(authData.user.id)
        return res.status(500).json({
          success: false,
          error: 'فشل في تنظيف البيانات القديمة. يرجى المحاولة مرة أخرى.',
          errorCode: 'CLEANUP_FAILED'
        })
      }
      
      console.log('✅ Conflicting profile removed')
      await new Promise(resolve => setTimeout(resolve, 1000))
    } else {
      console.log('✅ No profile ID conflicts')
    }

    // ==========================================
    // STEP 5: CREATE PROFILE
    // ==========================================
    console.log('\n📋 STEP 5: Creating user profile')
    
    // Calculate subscription end date (15 days from now if not provided)
    const subscriptionEndDate = subscriptionEndsAt || 
      new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name: fullName.trim(),
        phone_number: phoneNumber.trim(),
        role: 'business_user',
        pin_code: pin,
        subscription_status: 'trial',
        subscription_ends_at: subscriptionEndDate,
        is_suspended: false,
        profile_completed: true,
        created_at: new Date().toISOString()
      })

    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
      
      // CRITICAL: Cleanup auth user since profile creation failed
      await cleanupAuthUser(authData.user.id)
      
      if (profileError.code === '23505') {
        return res.status(400).json({
          success: false,
          error: 'حدث تضارب في البيانات. يرجى المحاولة مرة أخرى.',
          errorCode: 'DUPLICATE_PROFILE'
        })
      }
      
      return res.status(500).json({
        success: false,
        error: 'فشل في إنشاء الملف الشخصي',
        errorCode: 'PROFILE_CREATION_FAILED'
      })
    }

    console.log('✅ Profile created successfully')

    // ==========================================
    // SUCCESS
    // ==========================================
    console.log('\n' + '='.repeat(50))
    console.log('✅ SIGNUP COMPLETED SUCCESSFULLY')
    console.log('='.repeat(50))
    console.log(`👤 User: ${email}`)
    console.log(`🆔 ID: ${authData.user.id}`)
    console.log(`📅 Subscription until: ${subscriptionEndDate}`)
    console.log('='.repeat(50) + '\n')

    return res.status(200).json({
      success: true,
      userId: authData.user.id,
      email: email,
      message: 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.'
    })

  } catch (error: any) {
    console.error('\n' + '❌'.repeat(25))
    console.error('💥 UNEXPECTED ERROR')
    console.error('❌'.repeat(25))
    console.error('Type:', error.constructor?.name)
    console.error('Message:', error.message)
    console.error('Stack:', error.stack)
    console.error('='.repeat(50) + '\n')

    // Cleanup if we created an auth user
    if (createdAuthUserId) {
      try {
        await cleanupAuthUser(createdAuthUserId)
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup after unexpected error:', cleanupError)
      }
    }

    return res.status(500).json({
      success: false,
      error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
      errorCode: 'UNEXPECTED_ERROR'
    })
  }
}
