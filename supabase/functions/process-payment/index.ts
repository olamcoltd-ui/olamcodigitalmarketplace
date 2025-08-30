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

    // Get the authenticated user (optional for guest purchases)
    let user = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      user = data.user;
    }

    const { product_id, amount, referrer_code, guest_email } = await req.json()

    // Handle free products - process directly without calling another function
    if (amount === 0) {
      const supabaseService = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      // Determine email for order (user email or guest email)
      const orderEmail = user?.email || guest_email || 'guest@example.com';
      const userId = user?.id || null;

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
          payment_status: 'completed',
          referrer_id: referrerId,
          seller_commission: 0,
          admin_share: 0,
          referrer_commission: 0,
          commission_rate: 0,
          guest_email: !userId ? orderEmail : null,
          download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
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

      return new Response(
        JSON.stringify({
          is_free: true,
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
    }

    // Initialize Paystack for paid products
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Determine email for payment (user email or guest email)
    const paymentEmail = user?.email || guest_email || 'guest@example.com';
    const userId = user?.id || null;
    const userIdForRef = userId || 'guest';

    // Create Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: paymentEmail,
        amount: amount * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        reference: `order_${Date.now()}_${userIdForRef.toString().slice(0, 8)}`,
        callback_url: `${req.headers.get('origin')}/payment-success`,
        metadata: {
          user_id: userId,
          product_id,
          referrer_code,
          is_guest: !user,
          guest_email: !user ? paymentEmail : null
        }
      })
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment')
    }

    // Create order record
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

    // Get user's commission rate (default for guests)
    let commissionRate = 0.20; // Default commission rate
    
    if (userId) {
      const { data: userProfile } = await supabaseService
        .from('profiles')
        .select('subscription_plan')
        .eq('user_id', userId)
        .single()

      if (userProfile) {
        const { data: subscriptionPlan } = await supabaseService
          .from('subscription_plans')
          .select('commission_rate')
          .eq('name', userProfile.subscription_plan || 'free')
          .single()

        commissionRate = subscriptionPlan?.commission_rate || 0.20;
      }
    }

    // Calculate commissions
    const sellerCommission = amount * commissionRate
    const adminShare = amount - sellerCommission
    const referrerCommission = referrerId ? amount * 0.15 : 0

    // Create order
    const { error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: userId,
        product_id,
        amount,
        payment_reference: paystackData.data.reference,
        payment_status: 'pending',
        referrer_id: referrerId,
        seller_commission: sellerCommission,
        admin_share: adminShare - referrerCommission,
        referrer_commission: referrerCommission,
        commission_rate: commissionRate,
        guest_email: !userId ? paymentEmail : null
      })

    if (orderError) {
      console.error('Order creation error:', orderError)
      throw new Error('Failed to create order')
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Payment processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})