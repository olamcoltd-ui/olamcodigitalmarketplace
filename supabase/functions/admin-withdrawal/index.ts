import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AdminWithdrawalRequest {
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

    // Check if user is admin
    const { data: profile } = await supabaseService
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!profile || !profile.is_admin) {
      throw new Error("Access denied. Admin privileges required.");
    }

    const { amount, bankName, accountNumber, accountName }: AdminWithdrawalRequest = await req.json();

    // Validate withdrawal amount
    if (amount < 1000) {
      throw new Error("Minimum withdrawal amount is ₦1,000");
    }

    // Get admin wallet balance
    const { data: adminWallet } = await supabaseService
      .from("admin_wallet")
      .select("balance")
      .single();

    if (!adminWallet || adminWallet.balance < amount) {
      throw new Error("Insufficient admin wallet balance");
    }

    const withdrawalFee = 100; // Fixed fee of ₦100 for admin withdrawals
    const totalAmount = amount + withdrawalFee;

    if (adminWallet.balance < totalAmount) {
      throw new Error("Insufficient balance to cover withdrawal fee");
    }

    // Create admin withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabaseService
      .from("admin_withdrawals")
      .insert({
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

    // Deduct amount from admin wallet balance
    await supabaseService
      .from("admin_wallet")
      .update({
        balance: adminWallet.balance - totalAmount,
        total_withdrawn: adminWallet.total_withdrawn + totalAmount,
        updated_at: new Date().toISOString()
      })
      .eq("id", (await supabaseService.from("admin_wallet").select("id").single()).data.id);

    // Simulate processing delay and update status
    setTimeout(async () => {
      try {
        // Update withdrawal status to completed
        await supabaseService
          .from("admin_withdrawals")
          .update({ 
            status: "completed",
            paystack_reference: `admin_ref_${Date.now()}_${Math.random().toString(36).substring(7)}`
          })
          .eq("id", withdrawal.id);

      } catch (error) {
        console.error("Error updating admin withdrawal status:", error);
      }
    }, 3000); // 3 second delay to simulate processing

    return new Response(JSON.stringify({
      success: true,
      withdrawal: {
        id: withdrawal.id,
        amount: amount,
        fee: withdrawalFee,
        total: totalAmount,
        status: "pending",
        message: "Admin withdrawal request submitted successfully. Processing time: 3-5 minutes."
      }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Admin withdrawal processing error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to process admin withdrawal" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});