import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    const today = new Date();

    // Get all investors with Verified KYC status and expiry date in the past
    const { data, error } = await supabaseClient
      .from("investors")
      .select("id")
      .eq("kyc_status", "Verified")
      .lt("kyc_expiry_date", today.toISOString());

    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          count: 0,
          message: "No expired KYC verifications found",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Update all expired KYC statuses to "Expired"
    const { error: updateError } = await supabaseClient
      .from("investors")
      .update({ kyc_status: "Expired" })
      .in(
        "id",
        data.map((investor) => investor.id),
      );

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        count: data.length,
        message: `${data.length} investor(s) KYC status updated to Expired`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
