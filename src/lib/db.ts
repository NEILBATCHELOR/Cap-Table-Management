import { supabase } from "./supabase";
import { Database } from "@/types/supabase";
import { Investor, InvestorCSV } from "@/types/investor";
import { TokenSubscription, TokenType, Currency } from "@/types/token";
import { CapTable } from "@/types/capTable";
import { Project } from "@/components/ProjectSelector";

// Investors
export const getInvestors = async (): Promise<Investor[]> => {
  // First get all investors
  const { data: investorsData, error: investorsError } = await supabase.from(
    "investors",
  ).select(`
      id,
      name,
      email,
      type,
      kyc_status,
      wallet_address,
      country,
      investor_id,
      kyc_expiry_date,
      accreditation_status
    `);

  if (investorsError) throw investorsError;
  if (!investorsData) return [];

  // For each investor, get their subscriptions and token allocations
  const investors: Investor[] = [];

  for (const investor of investorsData) {
    // Get subscriptions for this investor
    const { data: subscriptionsData, error: subscriptionsError } =
      await supabase
        .from("subscriptions")
        .select(
          `
        id,
        subscription_id,
        fiat_amount,
        currency,
        confirmed,
        allocated,
        distributed,
        notes,
        subscription_date
      `,
        )
        .eq("investor_id", investor.id);

    if (subscriptionsError) throw subscriptionsError;

    // For each subscription, get token allocations
    const subscriptions = [];

    for (const subscription of subscriptionsData || []) {
      const { data: allocationsData, error: allocationsError } = await supabase
        .from("token_allocations")
        .select(
          `
          id,
          token_type,
          token_amount,
          distributed,
          distribution_date,
          distribution_tx_hash
        `,
        )
        .eq("subscription_id", subscription.id);

      if (allocationsError) throw allocationsError;

      subscriptions.push({
        id: subscription.id,
        subscriptionId: subscription.subscription_id,
        fiatSubscription: {
          amount: subscription.fiat_amount,
          currency: subscription.currency as Currency,
        },
        tokenType: allocationsData?.[0]?.token_type as TokenType | undefined,
        tokenAllocation: allocationsData?.[0]?.token_amount,
        tokenAllocationId: allocationsData?.[0]?.id,
        confirmed: subscription.confirmed,
        allocated: subscription.allocated,
        distributed: subscription.distributed,
        notes: subscription.notes,
        subscriptionDate: subscription.subscription_date,
      });
    }

    investors.push({
      id: investor.investor_id || investor.id, // Use investor_id as the primary identifier if available
      name: investor.name,
      email: investor.email,
      type: investor.type as "Individual" | "Institution",
      kycStatus: investor.kyc_status as "Verified" | "Expired" | "Pending",
      wallet: investor.wallet_address,
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
      subscriptions,
      selected: false,
    });
  }

  return investors;
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
  notes?: string,
  subscriptionDate?: string,
): Promise<string> => {
  // First, get the investor's UUID from the investor_id field
  const { data: investorData, error: investorError } = await supabase
    .from("investors")
    .select("id")
    .eq("investor_id", investorId)
    .single();

  if (investorError) throw investorError;
  if (!investorData)
    throw new Error(`Investor with ID ${investorId} not found`);

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      investor_id: investorData.id, // Use the UUID, not the investor_id string
      subscription_id: subscriptionId,
      fiat_amount: fiatAmount,
      currency,
      confirmed,
      notes,
      subscription_date: subscriptionDate || new Date().toISOString(),
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
    .eq("id", subscriptionId);

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

// Projects
export const getProjects = async (): Promise<Project[]> => {
  const { data, error } = await supabase.from("projects").select("*");

  if (error) throw error;

  return (
    data?.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      createdAt: new Date(project.created_at),
      updatedAt: new Date(project.updated_at),
    })) || []
  );
};

export const createProject = async (
  project: Omit<Project, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      name: project.name,
      description: project.description,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const updateProject = async (project: Project): Promise<void> => {
  const { error } = await supabase
    .from("projects")
    .update({
      name: project.name,
      description: project.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", project.id);

  if (error) throw error;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  // First delete all cap tables associated with this project
  const { error: capTableError } = await supabase
    .from("cap_tables")
    .delete()
    .eq("project_id", projectId);

  if (capTableError) throw capTableError;

  // Then delete the project
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) throw error;
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

// Cap Tables
export const getCapTables = async (projectId?: string): Promise<CapTable[]> => {
  const query = supabase.from("cap_tables").select("*");

  if (projectId) {
    query.eq("project_id", projectId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((table) => ({
    id: table.id,
    name: table.name,
    description: table.description,
    projectId: table.project_id,
    createdAt: new Date(table.created_at),
    updatedAt: new Date(table.updated_at),
  }));
};

export const createCapTable = async (
  capTable: Omit<CapTable, "id" | "createdAt" | "updatedAt">,
): Promise<string> => {
  const { data, error } = await supabase
    .from("cap_tables")
    .insert({
      name: capTable.name,
      description: capTable.description,
      project_id: capTable.projectId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
};

export const updateCapTable = async (capTable: CapTable): Promise<void> => {
  const { error } = await supabase
    .from("cap_tables")
    .update({
      name: capTable.name,
      description: capTable.description,
      updated_at: new Date().toISOString(),
    })
    .eq("id", capTable.id);

  if (error) throw error;
};

export const deleteCapTable = async (capTableId: string): Promise<void> => {
  const { error } = await supabase
    .from("cap_tables")
    .delete()
    .eq("id", capTableId);

  if (error) throw error;
};

export const getCapTableInvestors = async (
  capTableId: string,
): Promise<Investor[]> => {
  const { data, error } = await supabase
    .from("cap_table_investors")
    .select(
      `
      investor_id,
      investors!inner(id, name, email, type, kyc_status, wallet, country, investor_id, kyc_expiry_date, accreditation_status, subscriptions(id, subscription_id, fiat_amount, currency, confirmed, allocated, distributed, token_allocations(id, token_type, token_amount, distributed)))
    `,
    )
    .eq("cap_table_id", capTableId);

  if (error) throw error;

  return data.map((item) => ({
    id: item.investors.investor_id,
    name: item.investors.name,
    email: item.investors.email,
    type: item.investors.type as "Individual" | "Institution",
    kycStatus: item.investors.kyc_status as "Verified" | "Expired" | "Pending",
    wallet: item.investors.wallet,
    country: item.investors.country || undefined,
    investorId: item.investors.investor_id || undefined,
    kycExpiryDate: item.investors.kyc_expiry_date
      ? new Date(item.investors.kyc_expiry_date)
      : undefined,
    accreditationStatus: item.investors.accreditation_status as
      | "Accredited"
      | "Non-Accredited"
      | "Pending"
      | undefined,
    subscriptions: item.investors.subscriptions.map((sub) => ({
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

export const addInvestorToCapTable = async (
  capTableId: string,
  investorId: string,
): Promise<void> => {
  const { error } = await supabase.from("cap_table_investors").insert({
    cap_table_id: capTableId,
    investor_id: investorId,
  });

  if (error) throw error;
};

export const removeInvestorFromCapTable = async (
  capTableId: string,
  investorId: string,
): Promise<void> => {
  const { error } = await supabase
    .from("cap_table_investors")
    .delete()
    .eq("cap_table_id", capTableId)
    .eq("investor_id", investorId);

  if (error) throw error;
};
