import { useState, useEffect } from "react";
import { Investor } from "@/types/investor";
import { InvestorDataService } from "@/lib/investorDataService";
import { useToast } from "@/components/ui/use-toast";
import { useCapTable } from "@/components/CapTableContext";

/**
 * Custom hook for managing investors data
 */
export function useInvestors() {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { selectedCapTable } = useCapTable();

  // Fetch investors when the selected cap table changes
  useEffect(() => {
    if (selectedCapTable) {
      fetchInvestors();
    }
  }, [selectedCapTable]);

  // Fetch all investors or investors for the selected cap table
  const fetchInvestors = async () => {
    try {
      setLoading(true);
      let fetchedInvestors;

      if (selectedCapTable) {
        fetchedInvestors = await InvestorDataService.getInvestorsForCapTable(
          selectedCapTable.id,
        );
      } else {
        fetchedInvestors = await InvestorDataService.getInvestors();
      }

      // Transform the data to match the application's Investor type
      const transformedInvestors =
        InvestorDataService.transformInvestorData(fetchedInvestors);
      setInvestors(transformedInvestors);

      // Check for expired KYC
      const expiredCount = transformedInvestors.filter(
        (inv) => inv.kycStatus === "Expired",
      ).length;
      if (expiredCount > 0) {
        toast({
          title: "KYC Expiration Alert",
          description: `${expiredCount} investor(s) have expired KYC verification`,
          variant: "warning",
        });
      }
    } catch (error) {
      console.error("Error loading investors:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load investors",
      });
    } finally {
      setLoading(false);
    }
  };

  // Select/deselect all investors
  const handleSelectAll = (selected: boolean) => {
    setInvestors((prev) => prev.map((investor) => ({ ...investor, selected })));
  };

  // Select/deselect a single investor
  const handleSelectInvestor = (id: string) => {
    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === id
          ? { ...investor, selected: !investor.selected }
          : investor,
      ),
    );
  };

  // Add a new investor
  const addInvestor = async (investorData: any, capTableId?: string) => {
    try {
      const investorId = await InvestorDataService.createInvestor({
        name: investorData.name,
        email: investorData.email,
        type: investorData.type || "Individual",
        kyc_status: investorData.kycStatus || "Pending",
        wallet_address:
          investorData.wallet || "0x0000000000000000000000000000000000000000",
        kyc_expiry_date: investorData.kycExpiryDate,
      });

      // If a cap table ID is provided, associate the investor with it
      if (capTableId) {
        await InvestorDataService.addInvestorToCapTable(investorId, capTableId);
      }

      // Refresh the investors list
      await fetchInvestors();

      return investorId;
    } catch (error) {
      console.error("Error adding investor:", error);
      throw error;
    }
  };

  // Update an investor
  const updateInvestor = async (id: string, updates: any) => {
    try {
      await InvestorDataService.updateInvestor(id, updates);

      // Update the investor in the local state
      setInvestors((prev) =>
        prev.map((investor) =>
          investor.id === id ? { ...investor, ...updates } : investor,
        ),
      );

      return true;
    } catch (error) {
      console.error("Error updating investor:", error);
      throw error;
    }
  };

  // Remove an investor from a cap table
  const removeInvestorFromCapTable = async (
    investorId: string,
    capTableId: string,
  ) => {
    try {
      await InvestorDataService.removeInvestorFromCapTable(
        investorId,
        capTableId,
      );

      // Remove the investor from the local state
      setInvestors((prev) =>
        prev.filter((investor) => investor.id !== investorId),
      );

      return true;
    } catch (error) {
      console.error("Error removing investor from cap table:", error);
      throw error;
    }
  };

  // Add a subscription to an investor
  const addSubscription = async (investorId: string, subscriptionData: any) => {
    try {
      const subscriptionId = await InvestorDataService.createSubscription({
        investor_id: investorId,
        subscription_id: subscriptionData.subscriptionId,
        fiat_amount: subscriptionData.fiatAmount.amount,
        currency: subscriptionData.fiatAmount.currency,
        confirmed: subscriptionData.confirmed || false,
        notes: subscriptionData.notes,
        subscription_date:
          subscriptionData.subscriptionDate || new Date().toISOString(),
      });

      // Update the investor in the local state
      setInvestors((prev) =>
        prev.map((investor) => {
          if (investor.id === investorId) {
            return {
              ...investor,
              subscriptions: [
                ...investor.subscriptions,
                {
                  id: subscriptionId,
                  subscriptionId: subscriptionData.subscriptionId,
                  fiatSubscription: subscriptionData.fiatAmount,
                  confirmed: subscriptionData.confirmed || false,
                  allocated: false,
                  distributed: false,
                  notes: subscriptionData.notes,
                },
              ],
            };
          }
          return investor;
        }),
      );

      return subscriptionId;
    } catch (error) {
      console.error("Error adding subscription:", error);
      throw error;
    }
  };

  // Confirm a subscription
  const confirmSubscription = async (subscriptionId: string) => {
    try {
      await InvestorDataService.updateSubscription(subscriptionId, {
        confirmed: true,
      });

      // Update the subscription in the local state
      setInvestors((prev) =>
        prev.map((investor) => ({
          ...investor,
          subscriptions: investor.subscriptions.map((sub) =>
            sub.id === subscriptionId ? { ...sub, confirmed: true } : sub,
          ),
        })),
      );

      return true;
    } catch (error) {
      console.error("Error confirming subscription:", error);
      throw error;
    }
  };

  // Allocate tokens to a subscription
  const allocateTokens = async (
    subscriptionId: string,
    tokenType: string,
    amount: number,
  ) => {
    try {
      const allocationId = await InvestorDataService.createTokenAllocation({
        subscription_id: subscriptionId,
        token_type: tokenType,
        token_amount: amount,
      });

      // Update the subscription in the local state
      setInvestors((prev) =>
        prev.map((investor) => ({
          ...investor,
          subscriptions: investor.subscriptions.map((sub) =>
            sub.id === subscriptionId
              ? {
                  ...sub,
                  allocated: true,
                  tokenType,
                  tokenAllocation: amount,
                  tokenAllocationId: allocationId,
                }
              : sub,
          ),
        })),
      );

      return allocationId;
    } catch (error) {
      console.error("Error allocating tokens:", error);
      throw error;
    }
  };

  // Distribute tokens
  const distributeTokens = async (allocationIds: string[]) => {
    try {
      const result = await InvestorDataService.distributeTokens(allocationIds);

      // Update the subscriptions in the local state
      setInvestors((prev) =>
        prev.map((investor) => ({
          ...investor,
          subscriptions: investor.subscriptions.map((sub) =>
            sub.tokenAllocationId &&
            allocationIds.includes(sub.tokenAllocationId)
              ? { ...sub, distributed: true }
              : sub,
          ),
        })),
      );

      return result;
    } catch (error) {
      console.error("Error distributing tokens:", error);
      throw error;
    }
  };

  return {
    investors,
    loading,
    fetchInvestors,
    handleSelectAll,
    handleSelectInvestor,
    addInvestor,
    updateInvestor,
    removeInvestorFromCapTable,
    addSubscription,
    confirmSubscription,
    allocateTokens,
    distributeTokens,
  };
}
