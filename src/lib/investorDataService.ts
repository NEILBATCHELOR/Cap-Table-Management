import { supabase } from "./supabase";
import { Investor } from "@/types/investor";
import { TokenSubscription } from "@/types/token";
import { v4 as uuidv4 } from "uuid";

/**
 * Service for handling investor data operations
 * This centralizes all investor-related data operations for consistency
 */
export const InvestorDataService = {
  /**
   * Fetch all investors with their subscriptions
   */
  getInvestors: async (): Promise<Investor[]> => {
    const { data, error } = await supabase
      .from("investors")
      .select("*, subscriptions(*)");

    if (error) throw error;
    return data || [];
  },

  /**
   * Get investors for a specific cap table
   */
  getInvestorsForCapTable: async (capTableId: string): Promise<Investor[]> => {
    // First get the investor IDs in this cap table
    const { data: capTableInvestors, error: capTableError } = await supabase
      .from("cap_table_investors")
      .select("investor_id")
      .eq("cap_table_id", capTableId);

    if (capTableError) throw capTableError;
    if (!capTableInvestors || capTableInvestors.length === 0) return [];

    // Then get the actual investor data
    const investorIds = capTableInvestors.map((record) => record.investor_id);
    const { data, error } = await supabase
      .from("investors")
      .select("*, subscriptions(*)")
      .in("investor_id", investorIds);

    if (error) throw error;
    return data || [];
  },

  /**
   * Create a new investor
   */
  createInvestor: async (investor: {
    name: string;
    email: string;
    type: string;
    kyc_status: string;
    wallet_address: string;
    kyc_expiry_date?: string | null;
  }): Promise<string> => {
    const investorId = uuidv4();
    const { data, error } = await supabase
      .from("investors")
      .insert({
        ...investor,
        investor_id: investorId,
      })
      .select("investor_id")
      .single();

    if (error) throw error;
    return data?.investor_id;
  },

  /**
   * Update an investor's details
   */
  updateInvestor: async (
    id: string,
    updates: {
      name?: string;
      email?: string;
      type?: string;
      kyc_status?: string;
      wallet_address?: string;
      kyc_expiry_date?: string | null;
    },
  ): Promise<void> => {
    const { error } = await supabase
      .from("investors")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("investor_id", id);

    if (error) throw error;
  },

  /**
   * Associate an investor with a cap table
   */
  addInvestorToCapTable: async (
    investorId: string,
    capTableId: string,
  ): Promise<void> => {
    const { error } = await supabase.from("cap_table_investors").insert({
      investor_id: investorId,
      cap_table_id: capTableId,
    });

    if (error) throw error;
  },

  /**
   * Remove an investor from a cap table
   */
  removeInvestorFromCapTable: async (
    investorId: string,
    capTableId: string,
  ): Promise<void> => {
    const { error } = await supabase
      .from("cap_table_investors")
      .delete()
      .eq("investor_id", investorId)
      .eq("cap_table_id", capTableId);

    if (error) throw error;
  },

  /**
   * Create a new subscription for an investor
   */
  createSubscription: async (subscription: {
    investor_id: string;
    subscription_id: string;
    fiat_amount: number;
    currency: string;
    confirmed?: boolean;
    notes?: string;
    subscription_date?: string;
    project_id?: string;
  }): Promise<string> => {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert({
        ...subscription,
        allocated: false,
        distributed: false,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data?.id;
  },

  /**
   * Update a subscription's status
   */
  updateSubscription: async (
    id: string,
    updates: {
      confirmed?: boolean;
      allocated?: boolean;
      distributed?: boolean;
      fiat_amount?: number;
      currency?: string;
      notes?: string;
    },
  ): Promise<void> => {
    const { error } = await supabase
      .from("subscriptions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Delete a subscription
   */
  deleteSubscription: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Create a token allocation for a subscription
   */
  createTokenAllocation: async (allocation: {
    subscription_id: string;
    token_type: string;
    token_amount: number;
  }): Promise<string> => {
    const { data, error } = await supabase
      .from("token_allocations")
      .insert({
        ...allocation,
        distributed: false,
      })
      .select("id")
      .single();

    if (error) throw error;
    return data?.id;
  },

  /**
   * Distribute tokens for a given allocation
   */
  distributeTokens: async (allocationIds: string[]): Promise<any> => {
    const { data, error } = await supabase.functions.invoke(
      "distribute_tokens",
      {
        body: { allocationIds },
      },
    );

    if (error) throw error;
    return data;
  },

  /**
   * Check for expired KYC verifications
   */
  checkKYCExpirations: async (): Promise<number> => {
    const { data, error } = await supabase.functions.invoke(
      "check_kyc_expirations",
    );

    if (error) throw error;
    return data?.count || 0;
  },

  /**
   * Transform database investor records to application Investor type
   */
  transformInvestorData: (dbInvestors: any[]): Investor[] => {
    return dbInvestors.map((investor) => ({
      id: investor.investor_id,
      name: investor.name,
      email: investor.email,
      type: investor.type,
      kycStatus: investor.kyc_status,
      wallet: investor.wallet_address,
      kycExpiryDate: investor.kyc_expiry_date
        ? new Date(investor.kyc_expiry_date)
        : undefined,
      selected: false,
      subscriptions: (investor.subscriptions || []).map((sub: any) => ({
        id: sub.id,
        subscriptionId: sub.subscription_id,
        fiatSubscription: {
          amount: sub.fiat_amount,
          currency: sub.currency,
        },
        tokenAllocation: sub.token_allocation,
        tokenAllocationId: sub.token_allocation_id,
        tokenType: sub.token_type,
        confirmed: sub.confirmed,
        allocated: sub.allocated,
        distributed: sub.distributed,
        notes: sub.notes,
        subscriptionDate: sub.subscription_date,
      })),
    }));
  },
};
