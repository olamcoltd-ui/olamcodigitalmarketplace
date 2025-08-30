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

    // Initialize Paystack for ALL products (including free ones for consistency)
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Determine email for payment (user email or guest email)
    const paymentEmail = user?.email || guest_email || 'guest@example.com';
    const userId = user?.id || null;
    const userIdForRef = userId || 'guest';

    // Create Paystack transaction (even for free products)
    console.log(`Processing ${amount === 0 ? 'free' : 'paid'} product payment for amount: ₦${amount}`)
    
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: paymentEmail,
        amount: amount * 100, // Paystack expects amount in kobo (will be 0 for free products)
        currency: 'NGN',
        reference: `order_${Date.now()}_${userIdForRef.toString().slice(0, 8)}`,
        callback_url: `${req.headers.get('origin')}/payment-success`,
        metadata: {
          user_id: userId,
          product_id,
          referrer_code,
          is_guest: !user,
          guest_email: !user ? paymentEmail : null,
          is_free: amount === 0
        }
      })
    })

    const paystackData = await paystackResponse.json()
    console.log('Paystack initialization response:', paystackData)

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

    // Calculate commissions (will be 0 for free products)
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

    console.log(`Order created successfully for ${amount === 0 ? 'free' : 'paid'} product`)

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        is_free: amount === 0
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