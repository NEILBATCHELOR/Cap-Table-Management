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
    const { allocationIds } = await req.json();

    if (
      !allocationIds ||
      !Array.isArray(allocationIds) ||
      allocationIds.length === 0
    ) {
      throw new Error("Invalid or missing allocationIds parameter");
    }

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

    const results = [];
    const now = new Date().toISOString();

    // Process each allocation ID
    for (const allocationId of allocationIds) {
      // Generate a mock transaction hash
      const txHash = `0x${Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16),
      ).join("")}`;

      // Update the token allocation
      const { data, error } = await supabaseClient
        .from("token_allocations")
        .update({
          distributed: true,
          distribution_date: now,
          distribution_tx_hash: txHash,
        })
        .eq("id", allocationId)
        .select("subscription_id");

      if (error) throw error;

      if (data && data.length > 0) {
        // Also update the subscription
        const { error: subError } = await supabaseClient
          .from("subscriptions")
          .update({ distributed: true })
          .eq("id", data[0].subscription_id);

        if (subError) throw subError;

        results.push({
          allocationId,
          txHash,
          success: true,
        });
      }

      // Add a small delay to simulate blockchain transaction time
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return new Response(
      JSON.stringify({
        success: true,
        distributed: results.length,
        results,
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
