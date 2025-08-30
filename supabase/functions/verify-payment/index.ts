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
    const { reference } = await req.json()

    // Initialize Paystack
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY')
    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured')
    }

    // Verify payment with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      }
    })

    const paystackData = await paystackResponse.json()

    if (!paystackData.status) {
      throw new Error('Payment verification failed')
    }

    const transaction = paystackData.data

    // Create Supabase service client
    const supabaseService = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (transaction.status === 'success') {
      // Update order status
      const { data: order, error: orderError } = await supabaseService
        .from('orders')
        .update({ 
          payment_status: 'completed',
          download_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
        })
        .eq('payment_reference', reference)
        .select('*')
        .single()

      if (orderError || !order) {
        throw new Error('Failed to update order')
      }

      // Process commissions
      await Promise.all([
        // Update seller wallet
        supabaseService.rpc('update_wallet_balance', {
          user_uuid: order.user_id,
          amount_change: order.seller_commission
        }),

        // Update referrer wallet if applicable
        order.referrer_id ? supabaseService.rpc('update_wallet_balance', {
          user_uuid: order.referrer_id,
          amount_change: order.referrer_commission
        }) : Promise.resolve(),

        // Update admin wallet
        supabaseService
          .from('admin_wallet')
          .update({
            balance: supabaseService.raw('balance + ?', [order.admin_share]),
            total_earned: supabaseService.raw('total_earned + ?', [order.admin_share])
          })
          .eq('id', supabaseService.raw('(SELECT id FROM admin_wallet LIMIT 1)')),

        // Create transaction records
        supabaseService
          .from('transactions')
          .insert([
            {
              user_id: order.user_id,
              type: 'commission',
              amount: order.seller_commission,
              description: 'Product sale commission',
              reference: reference,
              metadata: { product_id: order.product_id, order_id: order.id }
            },
            ...(order.referrer_id ? [{
              user_id: order.referrer_id,
              type: 'referral_commission',
              amount: order.referrer_commission,
              description: 'Referral commission',
              reference: reference,
              metadata: { product_id: order.product_id, order_id: order.id, referred_user: order.user_id }
            }] : [])
          ]),

        // Generate download URL
        supabaseService.rpc('generate_download_url', {
          p_user_id: order.user_id,
          p_order_id: order.id,
          p_product_id: order.product_id
        })
      ])

      // Update product download count
      await supabaseService
        .from('products')
        .update({
          download_count: supabaseService.raw('download_count + 1')
        })
        .eq('id', order.product_id)

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