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

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user

    if (!user) {
      throw new Error('User not authenticated')
    }

    const { plan_name } = await req.json()

    // Get subscription plan details
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('name', plan_name)
      .single()

    if (planError || !plan) {
      throw new Error('Invalid subscription plan')
    }

    // For free plan, directly update user profile
    if (plan.name === 'free') {
      const { error: updateError } = await supabaseService
        .from('profiles')
        .update({
          subscription_plan: 'free',
          active_subscription: false,
          subscription_start_date: null,
          subscription_end_date: null
        })
        .eq('user_id', user.id)

      if (updateError) {
        throw new Error('Failed to update subscription')
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Subscription updated to free plan'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Initialize Paystack for paid plans
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('Paystack secret key not found in environment variables');
      throw new Error('Payment processing not configured. Please contact support.');
    }

    // Create Paystack transaction for subscription
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: plan.price * 100, // Paystack expects amount in kobo
        currency: 'NGN',
        reference: `subscription_${Date.now()}_${user.id.slice(0, 8)}`,
        callback_url: `${req.headers.get('origin')}/payment-success`,
        metadata: {
          user_id: user.id,
          plan_name: plan.name,
          type: 'subscription'
        }
      })
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize subscription payment')
    }

    // Store pending subscription info (will be activated after payment)
    const { error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: user.id,
        amount: plan.price,
        payment_reference: paystackData.data.reference,
        payment_status: 'pending',
        admin_share: plan.price * 0.75, // 75% to admin
        referrer_commission: 0 // Will be calculated if user has referrer
      })

    if (orderError) {
      console.error('Subscription order creation error:', orderError)
      throw new Error('Failed to create subscription order')
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
    console.error('Subscription processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})