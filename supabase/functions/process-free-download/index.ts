import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get the authenticated user (optional for guest downloads)
    let user = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const { product_id, referrer_code, guest_email } = await req.json()

    // Determine email for order (user email or guest email)
    const orderEmail = user?.email || guest_email || 'guest@example.com';
    const userId = user?.id || null;

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get referrer info if referrer_code is provided
    let referrerId = null
    if (referrer_code) {
      const { data: referrerData } = await supabaseService
        .from('profiles')
        .select('user_id')
        .eq('referral_code', referrer_code)
        .single()
      
      if (referrerData) {
        referrerId = referrerData.user_id
      }
    }

    // Generate a unique reference for free download
    const reference = `free_${Date.now()}_${userId || 'guest'}`

    // Create order for free product
    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: userId,
        product_id,
        amount: 0,
        payment_reference: reference,
        payment_status: 'completed', // Free downloads are immediately completed
        referrer_id: referrerId,
        seller_commission: 0,
        admin_share: 0,
        referrer_commission: 0,
        commission_rate: 0,
        guest_email: !userId ? orderEmail : null,
        download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      })
      .select('*')
      .single()

    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      throw new Error('Failed to create free download order')
    }

    // Generate download URL
    const { data: downloadUrl, error: downloadError } = await supabaseService.rpc('generate_download_url', {
      p_user_id: order.user_id,
      p_order_id: order.id,
      p_product_id: order.product_id
    })

    if (downloadError) {
      console.error('Download URL generation error:', downloadError)
      // Don't fail the process if download URL generation fails
    }

    // Update product download count
    const { data: currentProduct } = await supabaseService
      .from('products')
      .select('download_count')
      .eq('id', order.product_id)
      .single()

    if (currentProduct) {
      await supabaseService
        .from('products')
        .update({
          download_count: (currentProduct.download_count || 0) + 1
        })
        .eq('id', order.product_id)
    }

    // Track analytics for free download
    if (userId) {
      await supabaseService
        .from('analytics')
        .insert({
          user_id: userId,
          event_type: 'free_download',
          product_id: product_id,
          metadata: {
            referrer_code: referrer_code,
            order_id: order.id
          }
        })
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: order,
        download_url: downloadUrl,
        reference: reference,
        message: 'Free download processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Free download processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})