// supabase/functions/create-business-account/index.ts

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
    const { businessName, adminEmail, adminPassword, subscriptionEndDate, deviceLimit, pinCode } = await req.json()

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Step 1: Create the Auth User
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Or false for local dev
    })
    if (userError) throw new Error(`User creation failed: ${userError.message}`);
    const userId = userData.user.id;

    // Step 2: Create the Business
    const { data: businessData, error: businessError } = await supabaseAdmin
      .from('businesses')
      .insert({ name: businessName, subscription_end_date: subscriptionEndDate, device_limit: deviceLimit, pin_code: pinCode, status: 'active' })
      .select()
      .single();
    if (businessError) {
      // Cleanup: delete the user if business creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(`Business creation failed: ${businessError.message}`);
    }
    const businessId = businessData.id;

    // Step 3: Create the Profile and LINK User and Business
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        business_id: businessId, // <<< THE CRITICAL LINK
        role: 'business_admin'
      });
    if (profileError) {
      // Cleanup: delete user and business if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await supabaseAdmin.from('businesses').delete().eq('id', businessId);
      throw new Error(`Profile creation failed: ${profileError.message}`);
    }

    return new Response(JSON.stringify({ success: true, businessId, userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Overall error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
