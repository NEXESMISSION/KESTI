import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'

serve(async (req) => {
  try {
    const { cartItems } = await req.json();
    
    // Validate input
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid cart items' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create a Supabase client with the Auth context of the user who called the function
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // 1. Get user and business ID from the user's session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('business_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.business_id) {
      return new Response(
        JSON.stringify({ error: 'Could not find user profile or business' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const businessId = profile.business_id;

    // 2. Calculate total amount
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + (parseFloat(item.selling_price) * item.quantity), 
      0
    );

    // 3. Create the main sale record
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        business_id: businessId,
        sold_by_user_id: user.id,
        total_amount: totalAmount,
      })
      .select('id')
      .single();

    if (saleError || !saleData) {
      return new Response(
        JSON.stringify({ error: `Failed to create sale: ${saleError?.message}` }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const saleId = saleData.id;

    // 4. Prepare sale_items records
    const saleItemsToInsert = cartItems.map(item => ({
      sale_id: saleId,
      product_id: item.id,
      quantity: item.quantity,
      price_at_sale: parseFloat(item.selling_price),
      buying_price_at_sale: parseFloat(item.buying_price || 0),
    }));

    const { error: itemsError } = await supabase
      .from('sale_items')
      .insert(saleItemsToInsert);

    if (itemsError) {
      // Note: In a production system, you'd want to rollback the sale
      // This would require using a database transaction via RPC
      console.error('Failed to insert sale items:', itemsError);
      return new Response(
        JSON.stringify({ error: `Failed to insert sale items: ${itemsError.message}` }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // 5. Decrement stock for each product atomically
    const stockUpdatePromises = cartItems.map(item =>
      supabase.rpc('decrement_stock', {
        product_id_to_update: item.id,
        quantity_to_decrement: item.quantity
      })
    );
    
    const stockUpdateResults = await Promise.all(stockUpdatePromises);
    
    // Check if any stock updates failed
    const stockUpdateErrors = stockUpdateResults.filter(result => result.error);
    if (stockUpdateErrors.length > 0) {
      console.error('Stock update errors:', stockUpdateErrors);
      return new Response(
        JSON.stringify({ error: 'Failed to update stock for some items' }), 
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        message: 'Sale recorded successfully!', 
        saleId,
        totalAmount 
      }), 
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
})
