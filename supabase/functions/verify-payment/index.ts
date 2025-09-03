import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep('Function started');
    
    const { reference } = await req.json()
    logStep('Payment verification requested', { reference });

    // Test secret access immediately
    const paystackSecretTest = Deno.env.get('PAYSTACK_SECRET_KEY');
    logStep('Secret access test', { 
      hasSecret: !!paystackSecretTest, 
      secretLength: paystackSecretTest?.length || 0,
      secretPrefix: paystackSecretTest?.substring(0, 7) + '...' || 'none'
    });

    // Initialize Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      logStep('CRITICAL ERROR: Paystack secret key not found');
      const allEnvVars = Object.keys(Deno.env.toObject());
      logStep('Available environment variables', { count: allEnvVars.length, vars: allEnvVars });
      throw new Error('Payment verification not configured. Please contact support.');
    }
    
    logStep('Paystack secret key found', { keyLength: paystackSecretKey.length });

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      }
    })

    const paystackData = await paystackResponse.json()
    console.log('Paystack verification response:', paystackData)

    if (!paystackData.status) {
      throw new Error('Payment verification failed: ' + paystackData.message)
    }

    const transaction = paystackData.data

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle successful transactions
    if (transaction.status === 'success') {
      console.log('Processing successful payment verification');
      
      // Handle subscription payments
      if (transaction.metadata?.type === 'subscription') {
        const planName = transaction.metadata.plan_name
        const userId = transaction.metadata.user_id

        if (userId && planName) {
          // Get subscription plan details
          const { data: plan } = await supabaseService
            .from('subscription_plans')
            .select('*')
            .eq('name', planName)
            .single()

          if (plan) {
            // Calculate subscription end date
            const startDate = new Date()
            const endDate = new Date(startDate)
            
            // Parse duration from plan
            const durationStr = plan.duration?.toString() || '1 month'
            if (durationStr.includes('month')) {
              const months = parseInt(durationStr.match(/\d+/)?.[0] || '1')
              endDate.setMonth(endDate.getMonth() + months)
            } else if (durationStr.includes('year')) {
              const years = parseInt(durationStr.match(/\d+/)?.[0] || '1')
              endDate.setFullYear(endDate.getFullYear() + years)
            } else {
              endDate.setMonth(endDate.getMonth() + 1) // Default to 1 month
            }

            // Update user profile with subscription
            const { error: profileError } = await supabaseService
              .from('profiles')
              .update({
                subscription_plan: planName,
                active_subscription: true,
                subscription_start_date: startDate.toISOString(),
                subscription_end_date: endDate.toISOString()
              })
              .eq('user_id', userId)

            if (profileError) {
              console.error('Error updating subscription:', profileError)
              throw new Error('Failed to update subscription')
            }
          }

          // Update subscription order
          await supabaseService
            .from('orders')
            .update({ payment_status: 'completed' })
            .eq('payment_reference', reference)

          return new Response(
            JSON.stringify({
              success: true,
              type: 'subscription',
              message: 'Subscription activated successfully'
            }),
            {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200,
            }
          )
        }
      }

      // Handle regular product purchases
      const { data: order, error: orderError } = await supabaseService
        .from('orders')
        .update({ 
          payment_status: 'completed',
          download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        })
        .eq('payment_reference', reference)
        .select('*')
        .single()

      if (orderError || !order) {
        console.error('Order update error:', orderError)
        throw new Error('Failed to update order')
      }

      // Process commission using the new edge function
      try {
        await supabaseService.functions.invoke('process-commission', {
          body: {
            orderId: order.id,
            buyerId: order.user_id,
            productId: order.product_id,
            amount: order.amount,
            referrerId: order.referrer_id
          }
        });
      } catch (commissionError) {
        console.error("Commission processing error:", commissionError);
        // Don't fail the payment verification if commission processing fails
      }

      // Generate download URL
      await supabaseService.rpc('generate_download_url', {
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
          success: true,
          order: order,
          message: 'Payment verified and processed successfully'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      // Payment failed, update order status
      await supabaseService
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('payment_reference', reference)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment was not successful'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

  } catch (error) {
    console.error('Payment verification error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})