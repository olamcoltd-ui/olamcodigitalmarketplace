import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    // Test secret access immediately
    const paystackSecretTest = Deno.env.get('PAYSTACK_SECRET_KEY');
    logStep('Secret access test', { 
      hasSecret: !!paystackSecretTest, 
      secretLength: paystackSecretTest?.length || 0,
      secretPrefix: paystackSecretTest?.substring(0, 7) + '...' || 'none'
    });

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    logStep('Supabase client created');

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    logStep('Authenticating user');
    
    const { data } = await supabaseClient.auth.getUser(token)
    const user = data.user

    if (!user) {
      logStep('User authentication failed');
      throw new Error('User not authenticated')
    }
    
    logStep('User authenticated', { userId: user.id, email: user.email });

    const { plan_name } = await req.json()
    logStep('Request data received', { plan_name });

    // Get subscription plan details
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )
    logStep('Service client created');

    const { data: plan, error: planError } = await supabaseService
      .from('subscription_plans')
      .select('*')
      .eq('name', plan_name)
      .single()

    logStep('Subscription plan lookup', { planFound: !!plan, error: planError?.message });

    if (planError || !plan) {
      logStep('Plan lookup failed', { planError, plan_name });
      throw new Error(`Invalid subscription plan: ${plan_name}`)
    }
    
    logStep('Plan details', { name: plan.name, price: plan.price });

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
    logStep('Initializing Paystack for paid plan');
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    
    if (!paystackSecretKey) {
      logStep('CRITICAL ERROR: Paystack secret key not found');
      const allEnvVars = Object.keys(Deno.env.toObject());
      logStep('Available environment variables', { count: allEnvVars.length, vars: allEnvVars });
      throw new Error('Payment processing not configured. Paystack secret key missing.');
    }
    
    logStep('Paystack secret key found', { keyLength: paystackSecretKey.length });

    // Create Paystack transaction for subscription
    logStep('Creating Paystack transaction', { 
      email: user.email, 
      amount: plan.price * 100,
      planName: plan.name 
    });
    
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
    logStep('Paystack response received', { 
      status: paystackData.status, 
      hasData: !!paystackData.data,
      message: paystackData.message 
    });

    if (!paystackData.status) {
      logStep('Paystack initialization failed', { response: paystackData });
      throw new Error(`Paystack error: ${paystackData.message || 'Failed to initialize subscription payment'}`)
    }
    
    logStep('Paystack transaction created successfully', { 
      reference: paystackData.data.reference,
      authUrl: !!paystackData.data.authorization_url 
    });

    // Store pending subscription info (will be activated after payment)
    const { error: orderError } = await supabaseService
      .from('orders')
      .insert({
        user_id: user.id,
        amount: plan.price,
        payment_reference: paystackData.data.reference,
        payment_status: 'pending',
        admin_share: plan.price * 0.75, // 75% to admin
        referrer_commission: 0, // Will be calculated if user has referrer
        seller_commission: 0,
        commission_rate: 0
      })

    if (orderError) {
      logStep('Order creation failed', { error: orderError });
      throw new Error('Failed to create subscription order')
    }
    
    logStep('Order created successfully');

    const response = {
      authorization_url: paystackData.data.authorization_url,
      reference: paystackData.data.reference
    };
    
    logStep('Function completed successfully', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep('ERROR in process-subscription', { message: errorMessage, stack: error instanceof Error ? error.stack : undefined });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})