import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CommissionRequest {
  orderId: string;
  buyerId: string;
  productId: string;
  amount: number;
  referrerId?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId, buyerId, productId, amount, referrerId }: CommissionRequest = await req.json();

    // Get buyer's subscription plan to determine commission rate
    const { data: buyerProfile } = await supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("user_id", buyerId)
      .single();

    // Get commission rate based on subscription plan
    const { data: subscriptionPlan } = await supabase
      .from("subscription_plans")
      .select("commission_rate")
      .eq("name", buyerProfile?.subscription_plan || "free")
      .single();

    const commissionRate = subscriptionPlan?.commission_rate || 0.20; // Default 20%
    const commission = amount * commissionRate;
    const adminShare = amount - commission;
    let referrerCommission = 0;

    // If there's a referrer, calculate referrer commission (15% of total)
    if (referrerId) {
      referrerCommission = amount * 0.15;
      
      // Update referrer's wallet
      await supabase.rpc('update_wallet_balance', {
        user_uuid: referrerId,
        amount_change: referrerCommission
      });

      // Create referrer transaction
      await supabase.from("transactions").insert({
        user_id: referrerId,
        type: "referral_commission",
        amount: referrerCommission,
        description: `Referral commission from order ${orderId}`,
        reference: orderId,
        status: "completed"
      });
    }

    // Update seller's wallet (buyer gets commission for selling)
    const sellerCommission = commission - referrerCommission;
    await supabase.rpc('update_wallet_balance', {
      user_uuid: buyerId,
      amount_change: sellerCommission
    });

    // Create seller transaction
    await supabase.from("transactions").insert({
      user_id: buyerId,
      type: "sales_commission",
      amount: sellerCommission,
      description: `Sales commission from order ${orderId}`,
      reference: orderId,
      status: "completed"
    });

    // Update admin wallet
    const { data: adminWallet } = await supabase
      .from("admin_wallet")
      .select("balance")
      .limit(1)
      .single();

    if (adminWallet) {
      await supabase
        .from("admin_wallet")
        .update({ 
          balance: adminWallet.balance + adminShare,
          total_earned: adminWallet.balance + adminShare
        })
        .eq("id", adminWallet.id);
    } else {
      await supabase
        .from("admin_wallet")
        .insert({
          balance: adminShare,
          total_earned: adminShare
        });
    }

    // Update order with commission details
    await supabase
      .from("orders")
      .update({
        commission_rate: commissionRate,
        seller_commission: sellerCommission,
        referrer_commission: referrerCommission,
        admin_share: adminShare
      })
      .eq("id", orderId);

    return new Response(JSON.stringify({
      success: true,
      commission: {
        total: commission,
        seller: sellerCommission,
        referrer: referrerCommission,
        admin: adminShare,
        rate: commissionRate
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Commission processing error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process commission" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});