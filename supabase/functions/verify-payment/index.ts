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

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Handle free products (references starting with "free_")
    if (reference.startsWith('free_')) {
      logStep('Processing free product verification', { reference });
      
      // Find the order by payment reference
      const { data: order, error: orderError } = await supabaseService
        .from('orders')
        .select('*, products(*)')
        .eq('payment_reference', reference)
        .single()

      if (orderError || !order) {
        logStep('Free order not found', { error: orderError });
        throw new Error('Order not found')
      }

      // Update order status to completed first
      const { error: updateError } = await supabaseService
        .from('orders')
        .update({ 
          payment_status: 'completed',
          download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('payment_reference', reference)

      if (updateError) {
        logStep('Failed to update order status', { error: updateError });
        throw new Error('Failed to update order')
      }

      // Generate download URL
      const { data: downloadToken, error: downloadError } = await supabaseService.rpc('generate_download_url', {
        p_user_id: order.user_id,
        p_order_id: order.id,
        p_product_id: order.product_id
      })

      if (downloadError) {
        logStep('Failed to generate download token', { error: downloadError });
        throw new Error('Failed to generate download link')
      }

      // Update product download count
      await supabaseService
        .from('products')
        .update({
          download_count: (order.products.download_count || 0) + 1
        })
        .eq('id', order.product_id)

      logStep('Free product verification completed successfully');
      return new Response(
        JSON.stringify({
          success: true,
          order: { ...order, payment_status: 'completed' },
          download_token: downloadToken,
          message: 'Free product download ready'
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Handle paid products with Paystack verification
    logStep('Processing paid product verification', { reference });

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
      const { data: orderData, error: orderError } = await supabaseService
        .from('orders')
        .select('*, products(*)')
        .eq('payment_reference', reference)
        .single()

      if (orderError || !orderData) {
        console.error('Order not found:', orderError)
        throw new Error('Order not found')
      }

      // Calculate commissions based on new sharing rules
      const totalAmount = orderData.amount
      let sellerCommission = 0
      let referrerCommission = 0
      let adminShare = totalAmount

      // For product sales through shared links: Referrer gets 15%, Admin gets 85%
      if (orderData.referrer_id) {
        referrerCommission = totalAmount * 0.15 // 15% to referrer
        adminShare = totalAmount * 0.85 // 85% to admin
      }

      // Update order with commission breakdown and completion status
      const { data: order, error: updateError } = await supabaseService
        .from('orders')
        .update({ 
          payment_status: 'completed',
          download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          seller_commission: sellerCommission,
          referrer_commission: referrerCommission,
          admin_share: adminShare
        })
        .eq('payment_reference', reference)
        .select('*')
        .single()

      if (updateError || !order) {
        console.error('Order update error:', updateError)
        throw new Error('Failed to update order')
      }

      // Update user wallets for commissions
      if (orderData.referrer_id && referrerCommission > 0) {
        await supabaseService.rpc('update_wallet_balance', {
          user_uuid: orderData.referrer_id,
          amount_change: referrerCommission
        })

        // Create transaction record for referrer
        await supabaseService
          .from('transactions')
          .insert({
            user_id: orderData.referrer_id,
            type: 'referral_commission',
            amount: referrerCommission,
            description: `Commission from product sale: ${orderData.products?.title}`,
            reference: `ref_${reference}`,
            status: 'completed'
          })
      }

      // Update admin wallet
      if (adminShare > 0) {
        await supabaseService.rpc('update_admin_wallet_balance', {
          amount: adminShare
        })

        // Create admin revenue record
        await supabaseService
          .from('admin_revenue')
          .insert({
            user_id: orderData.user_id,
            order_id: orderData.id,
            source: 'product_sale',
            description: `Revenue from ${orderData.products?.title}`,
            amount: adminShare
          })
      }

      // Generate download URL
      const { data: downloadToken } = await supabaseService.rpc('generate_download_url', {
        p_user_id: order.user_id,
        p_order_id: order.id,
        p_product_id: order.product_id
      })

      // Update product download count
      await supabaseService
        .from('products')
        .update({
          download_count: (orderData.products?.download_count || 0) + 1
        })
        .eq('id', order.product_id)

      return new Response(
        JSON.stringify({
          success: true,
          order: order,
          download_token: downloadToken,
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