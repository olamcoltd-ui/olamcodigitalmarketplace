import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WithdrawalRequest {
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const { amount, bankName, accountNumber, accountName }: WithdrawalRequest = await req.json();

    // Validate withdrawal amount
    if (amount < 1000) {
      throw new Error("Minimum withdrawal amount is ₦1,000");
    }

    // Get user's current wallet balance
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (!profile || profile.wallet_balance < amount) {
      throw new Error("Insufficient wallet balance");
    }

    const withdrawalFee = 50; // Fixed fee of ₦50
    const totalAmount = amount + withdrawalFee;

    if (profile.wallet_balance < totalAmount) {
      throw new Error("Insufficient balance to cover withdrawal fee");
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseService
      .from("withdrawals")
      .insert({
        user_id: user.id,
        amount: amount,
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        fee: withdrawalFee,
        status: "pending"
      })
      .select()
      .single();

    if (withdrawalError) throw withdrawalError;

    // Deduct amount from wallet balance
    await supabaseService.rpc('update_wallet_balance', {
      user_uuid: user.id,
      amount_change: -totalAmount
    });

    // Create transaction record
    await supabaseService.from("transactions").insert({
      user_id: user.id,
      type: "withdrawal",
      amount: -totalAmount,
      description: `Withdrawal to ${bankName} - ${accountNumber}`,
      reference: withdrawal.id,
      status: "pending"
    });

    // In a real implementation, you would integrate with Paystack or another payment provider
    // For now, we'll simulate the withdrawal processing
    
    // Simulate processing delay and update status
    setTimeout(async () => {
      try {
        // Update withdrawal status to completed (in real implementation, this would be done by webhook)
        await supabaseService
          .from("withdrawals")
          .update({ 
            status: "completed",
            paystack_reference: `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`
          })
          .eq("id", withdrawal.id);

        // Update transaction status
        await supabaseService
          .from("transactions")
          .update({ status: "completed" })
          .eq("reference", withdrawal.id);

      } catch (error) {
        console.error("Error updating withdrawal status:", error);
      }
    }, 5000); // 5 second delay to simulate processing

    return new Response(JSON.stringify({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: amount,
        fee: withdrawalFee,
        total: totalAmount,
        status: "pending",
        message: "Withdrawal request submitted successfully. Processing time: 5-10 minutes."
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Withdrawal processing error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process withdrawal" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});