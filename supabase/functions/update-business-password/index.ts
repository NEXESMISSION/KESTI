// supabase/functions/update-business-password/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200 
    })
  }

  try {
    const { businessId, newPassword } = await req.json()

    if (!businessId || !newPassword) {
      throw new Error('businessId and newPassword are required')
    }

    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters long')
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Find the admin user for this business
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('business_id', businessId)
      .eq('role', 'business_admin')
      .single()

    if (profileError || !profile) {
      throw new Error('Could not find business admin user')
    }

    // Step 2: Update the user's password using admin API
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      profile.id,
      { password: newPassword }
    )

    if (updateError) throw updateError

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Password updated successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error updating password:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to update password' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
