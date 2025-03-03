import { supabase } from "./supabase";
import { Database } from "@/types/supabase";
import { Investor, InvestorCSV } from "@/types/investor";
import { TokenSubscription, TokenType, Currency } from "@/types/token";

// Investors
export const getInvestors = async (): Promise<Investor[]> => {
  const { data, error } = await supabase.from("investors").select(`
      id,
      name,
      email,
      type,
      kyc_status,
      wallet,
      country,
      investor_id,
      kyc_expiry_date,
      accreditation_status,
      subscriptions(id, subscription_id, fiat_amount, currency, confirmed, allocated, distributed, token_allocations(id, token_type, token_amount, distributed))
    `);

  if (error) throw error;

  return data.map((investor) => ({
    id: investor.id,
    name: investor.name,
    email: investor.email,
    type: investor.type as "Individual" | "Institution",
    kycStatus: investor.kyc_status as "Verified" | "Expired" | "Pending",
    wallet: investor.wallet,
    country: investor.country || undefined,
    investorId: investor.investor_id || undefined,
    kycExpiryDate: investor.kyc_expiry_date
      ? new Date(investor.kyc_expiry_date)
      : undefined,
    accreditationStatus: investor.accreditation_status as
      | "Accredited"
      | "Non-Accredited"
      | "Pending"
      | undefined,
    subscriptions: investor.subscriptions.map((sub) => ({
      id: sub.id,
      subscriptionId: sub.subscription_id,
      fiatSubscription: {
        amount: sub.fiat_amount,
        currency: sub.currency as Currency,
      },
      tokenType: sub.token_allocations?.[0]?.token_type as
        | TokenType
        | undefined,
      tokenAllocation: sub.token_allocations?.[0]?.token_amount,
      tokenAllocationId: sub.token_allocations?.[0]?.id,
      confirmed: sub.confirmed,
      allocated: sub.allocated,
      distributed: sub.distributed,
    })),
  }));
};

export const createInvestor = async (
  investor: InvestorCSV,
): Promise<string> => {
  const { data, error } = await supabase
    .from("investors")
    .insert({
      name: investor.name,
      email: investor.email,
      type: investor.type,
      wallet: investor.wallet,
      country: investor.country,
      investor_id: investor.investorId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const updateInvestorKYC = async (
  id: string,
  kycStatus: string,
): Promise<void> => {
  const { error } = await supabase
    .from("investors")
    .update({
      kyc_status: kycStatus,
      kyc_expiry_date:
        kycStatus === "Verified"
          ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
          : null,
    })
    .eq("id", id);

  if (error) throw error;
};

export const checkKYCExpirations = async (): Promise<number> => {
  const today = new Date();

  // Get all investors with Verified KYC status and expiry date in the past
  const { data, error } = await supabase
    .from("investors")
    .select("id")
    .eq("kyc_status", "Verified")
    .lt("kyc_expiry_date", today.toISOString());

  if (error) throw error;

  if (!data || data.length === 0) return 0;

  // Update all expired KYC statuses to "Expired"
  const { error: updateError } = await supabase
    .from("investors")
    .update({ kyc_status: "Expired" })
    .in(
      "id",
      data.map((investor) => investor.id),
    );

  if (updateError) throw updateError;

  return data.length;
};

// Subscriptions
export const createSubscription = async (
  investorId: string,
  subscriptionId: string,
  fiatAmount: number,
  currency: Currency,
  confirmed: boolean,
): Promise<string> => {
  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      investor_id: investorId,
      subscription_id: subscriptionId,
      fiat_amount: fiatAmount,
      currency,
      confirmed,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const confirmSubscription = async (
  subscriptionId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("subscriptions")
    .update({ confirmed: true })
    .eq("subscription_id", subscriptionId);

  if (error) throw error;
};

// Token Allocations
export const createTokenAllocation = async (
  subscriptionId: string,
  tokenType: TokenType,
  tokenAmount: number,
): Promise<string> => {
  // First, update the subscription to mark it as allocated
  const { error: subError } = await supabase
    .from("subscriptions")
    .update({ allocated: true })
    .eq("id", subscriptionId);

  if (subError) throw subError;

  // Then create the token allocation
  const { data, error } = await supabase
    .from("token_allocations")
    .insert({
      subscription_id: subscriptionId,
      token_type: tokenType,
      token_amount: tokenAmount,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const distributeTokens = async (
  allocationId: string,
  txHash: string,
): Promise<void> => {
  // Add a small delay to simulate network latency for demo purposes
  await new Promise((resolve) => setTimeout(resolve, 500));

  const { error } = await supabase
    .from("token_allocations")
    .update({
      distributed: true,
      distribution_date: new Date().toISOString(),
      distribution_tx_hash: txHash,
    })
    .eq("id", allocationId);

  if (error) throw error;

  // Also update the subscription
  const { data } = await supabase
    .from("token_allocations")
    .select("subscription_id")
    .eq("id", allocationId)
    .single();

  if (data) {
    await supabase
      .from("subscriptions")
      .update({ distributed: true })
      .eq("id", data.subscription_id);
  }
};

// Batch distribute tokens
export const batchDistributeTokens = async (
  allocationIds: string[],
  progressCallback?: (progress: number) => void,
): Promise<void> => {
  let processed = 0;

  for (const allocationId of allocationIds) {
    // Generate a mock transaction hash
    const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

    await distributeTokens(allocationId, txHash);

    processed++;
    if (progressCallback) {
      progressCallback(Math.floor((processed / allocationIds.length) * 100));
    }
  }
};

// Token Designs
export const getTokenDesigns = async () => {
  const { data, error } = await supabase.from("token_designs").select("*");

  if (error) throw error;
  return data;
};

export const createTokenDesign = async (
  name: string,
  type: TokenType,
  totalSupply: number,
) => {
  const { data, error } = await supabase
    .from("token_designs")
    .insert({
      name,
      type,
      total_supply: totalSupply,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};
