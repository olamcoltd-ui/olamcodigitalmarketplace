import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BankVerificationRequest {
  account_number: string;
  bank_code: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { account_number, bank_code }: BankVerificationRequest = await req.json();

    if (!account_number || !bank_code) {
      throw new Error("Account number and bank code are required");
    }

    // Validate account number format
    if (account_number.length !== 10 || !/^\d+$/.test(account_number)) {
      throw new Error("Invalid account number format");
    }

    const paystackSecretKey = Deno.env.get("PAYSTACK_SECRET_KEY");
    if (!paystackSecretKey) {
      throw new Error("Paystack secret key not configured");
    }

    // Verify account with Paystack
    const response = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${account_number}&bank_code=${bank_code}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to verify account");
    }

    if (!data.status) {
      throw new Error("Invalid account details");
    }

    return new Response(JSON.stringify({
      success: true,
      account_name: data.data.account_name,
      account_number: data.data.account_number,
      bank_code: bank_code
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Bank verification error:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to verify bank account" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});