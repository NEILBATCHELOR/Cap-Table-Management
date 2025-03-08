import React, { useState, useEffect } from "react";
import { useCapTable } from "./CapTableContext";
import { InvestorDataService } from "@/lib/investorDataService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Plus, Upload, Download, Filter, RefreshCw } from "lucide-react";
import SubscriptionDataGrid from "./SubscriptionDataGrid";
import SubscriptionForm from "./SubscriptionForm";
import { useToast } from "./ui/use-toast";
import { Investor } from "@/types/investor";
import { Subscription } from "@/types/subscription";
import { CSVImportService } from "@/lib/csvImportService";
import { downloadCSV } from "@/lib/csv";
import { supabase } from "@/lib/supabase";

interface SubscriptionManagerProps {
  investors: Investor[];
  onInvestorsChange: (investors: Investor[]) => void;
}

const SubscriptionManager = ({
  investors,
  onInvestorsChange,
}: SubscriptionManagerProps) => {
  const { toast } = useToast();
  const { selectedProject, selectedCapTable } = useCapTable();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null,
  );
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [filteredInvestors, setFilteredInvestors] =
    useState<Investor[]>(investors);

  // Update filtered investors when tab changes
  useEffect(() => {
    filterInvestorsByTab(activeTab);
  }, [activeTab, investors]);

  const filterInvestorsByTab = (tab: string) => {
    switch (tab) {
      case "pending":
        setFilteredInvestors(
          investors.filter((investor) =>
            investor.subscriptions.some((sub) => !sub.confirmed),
          ),
        );
        break;
      case "confirmed":
        setFilteredInvestors(
          investors.filter((investor) =>
            investor.subscriptions.some(
              (sub) => sub.confirmed && !sub.allocated,
            ),
          ),
        );
        break;
      case "allocated":
        setFilteredInvestors(
          investors.filter((investor) =>
            investor.subscriptions.some(
              (sub) => sub.allocated && !sub.distributed,
            ),
          ),
        );
        break;
      case "distributed":
        setFilteredInvestors(
          investors.filter((investor) =>
            investor.subscriptions.some((sub) => sub.distributed),
          ),
        );
        break;
      default:
        setFilteredInvestors(investors);
        break;
    }
  };

  const handleAddSubscription = async (
    investorId: string,
    subscriptionData: any,
  ) => {
    try {
      setLoading(true);

      const subscriptionId = await InvestorDataService.createSubscription({
        investor_id: investorId,
        subscription_id: subscriptionData.subscriptionId,
        fiat_amount: parseFloat(subscriptionData.amount),
        currency: subscriptionData.currency,
        confirmed: subscriptionData.status === "Confirmed",
        notes: subscriptionData.notes,
        subscription_date: subscriptionData.subscriptionDate,
        project_id: selectedProject?.id,
      });

      // If status is Allocated, also create token allocation
      if (
        subscriptionData.status === "Allocated" &&
        subscriptionData.tokenType &&
        subscriptionData.tokenAllocation
      ) {
        const allocationId = await InvestorDataService.createTokenAllocation({
          subscription_id: subscriptionId,
          token_type: subscriptionData.tokenType,
          token_amount: parseFloat(subscriptionData.tokenAllocation),
        });

        // Update the subscription to mark it as allocated
        await InvestorDataService.updateSubscription(subscriptionId, {
          allocated: true,
        });
      }

      // Update the investors state
      const updatedInvestors = investors.map((investor) => {
        if (investor.id === investorId) {
          const newSubscription = {
            id: subscriptionId,
            subscriptionId: subscriptionData.subscriptionId,
            fiatSubscription: {
              amount: parseFloat(subscriptionData.amount),
              currency: subscriptionData.currency,
            },
            confirmed:
              subscriptionData.status === "Confirmed" ||
              subscriptionData.status === "Allocated",
            allocated: subscriptionData.status === "Allocated",
            distributed: false,
            notes: subscriptionData.notes,
            subscriptionDate: subscriptionData.subscriptionDate,
            tokenType: subscriptionData.tokenType,
            tokenAllocation: subscriptionData.tokenAllocation
              ? parseFloat(subscriptionData.tokenAllocation)
              : undefined,
          };

          return {
            ...investor,
            subscriptions: [...investor.subscriptions, newSubscription],
          };
        }
        return investor;
      });

      onInvestorsChange(updatedInvestors);
      setShowAddSubscription(false);

      toast({
        title: "Success",
        description: "Subscription added successfully",
      });
    } catch (error) {
      console.error("Error adding subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add subscription",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (
    subscriptionId: string,
    investorId: string,
    updates: any,
  ) => {
    try {
      setLoading(true);

      // Update subscription in database
      await InvestorDataService.updateSubscription(subscriptionId, {
        fiat_amount: parseFloat(updates.amount),
        currency: updates.currency,
        confirmed:
          updates.status === "Confirmed" || updates.status === "Allocated",
        allocated: updates.status === "Allocated",
        notes: updates.notes,
      });

      // If status is Allocated and there's no token allocation yet, create one
      if (
        updates.status === "Allocated" &&
        updates.tokenType &&
        updates.tokenAllocation
      ) {
        const investor = investors.find((inv) => inv.id === investorId);
        const subscription = investor?.subscriptions.find(
          (sub) => sub.id === subscriptionId,
        );

        if (subscription && !subscription.tokenAllocationId) {
          const allocationId = await InvestorDataService.createTokenAllocation({
            subscription_id: subscriptionId,
            token_type: updates.tokenType,
            token_amount: parseFloat(updates.tokenAllocation),
          });

          // Update the tokenAllocationId in the updates
          updates.tokenAllocationId = allocationId;
        }
      }

      // Update the investors state
      const updatedInvestors = investors.map((investor) => {
        if (investor.id === investorId) {
          return {
            ...investor,
            subscriptions: investor.subscriptions.map((sub) => {
              if (sub.id === subscriptionId) {
                return {
                  ...sub,
                  fiatSubscription: {
                    amount: parseFloat(updates.amount),
                    currency: updates.currency,
                  },
                  confirmed:
                    updates.status === "Confirmed" ||
                    updates.status === "Allocated",
                  allocated: updates.status === "Allocated",
                  notes: updates.notes,
                  tokenType: updates.tokenType,
                  tokenAllocation: updates.tokenAllocation
                    ? parseFloat(updates.tokenAllocation)
                    : sub.tokenAllocation,
                  tokenAllocationId:
                    updates.tokenAllocationId || sub.tokenAllocationId,
                };
              }
              return sub;
            }),
          };
        }
        return investor;
      });

      onInvestorsChange(updatedInvestors);
      setSelectedSubscription(null);

      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    } catch (error) {
      console.error("Error updating subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update subscription",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubscription = async (
    subscriptionId: string,
    investorId: string,
  ) => {
    try {
      setLoading(true);

      // Delete subscription using InvestorDataService
      await InvestorDataService.deleteSubscription(subscriptionId);

      // Update the investors state
      const updatedInvestors = investors.map((investor) => {
        if (investor.id === investorId) {
          return {
            ...investor,
            subscriptions: investor.subscriptions.filter(
              (sub) => sub.id !== subscriptionId,
            ),
          };
        }
        return investor;
      });

      onInvestorsChange(updatedInvestors);
      setSelectedSubscription(null);

      toast({
        title: "Success",
        description: "Subscription deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete subscription",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBulkConfirm = async (subscriptionIds: string[]) => {
    try {
      setLoading(true);

      // Update each subscription in database
      for (const id of subscriptionIds) {
        await InvestorDataService.updateSubscription(id, {
          confirmed: true,
        });
      }

      // Update the investors state
      const updatedInvestors = investors.map((investor) => ({
        ...investor,
        subscriptions: investor.subscriptions.map((sub) => {
          if (subscriptionIds.includes(sub.id || "")) {
            return { ...sub, confirmed: true };
          }
          return sub;
        }),
      }));

      onInvestorsChange(updatedInvestors);

      toast({
        title: "Success",
        description: `${subscriptionIds.length} subscriptions confirmed successfully`,
      });
    } catch (error) {
      console.error("Error confirming subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to confirm subscriptions",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportSubscriptions = () => {
    try {
      // Flatten all subscriptions with investor info
      const subscriptionsData = investors.flatMap((investor) =>
        investor.subscriptions.map((sub) => ({
          "Investor Name": investor.name,
          "Investor Email": investor.email,
          "Subscription ID": sub.subscriptionId,
          Amount: sub.fiatSubscription.amount,
          Currency: sub.fiatSubscription.currency,
          Status: sub.distributed
            ? "Distributed"
            : sub.allocated
              ? "Allocated"
              : sub.confirmed
                ? "Confirmed"
                : "Pending",
          "Subscription Date": sub.subscriptionDate || "",
          "Token Type": sub.tokenType || "",
          "Token Allocation": sub.tokenAllocation || "",
          Notes: sub.notes || "",
        })),
      );

      if (subscriptionsData.length === 0) {
        toast({
          variant: "destructive",
          title: "No Data",
          description: "No subscription data to export",
        });
        return;
      }

      const csvContent = [
        Object.keys(subscriptionsData[0]),
        ...subscriptionsData.map((row) => Object.values(row)),
      ];

      downloadCSV(
        csvContent,
        `subscriptions-export-${new Date().toISOString().split("T")[0]}.csv`,
      );

      toast({
        title: "Export Complete",
        description: `Exported ${subscriptionsData.length} subscriptions`,
      });
    } catch (error) {
      console.error("Error exporting subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export subscriptions",
      });
    }
  };

  const handleImportSubscriptions = async (file: File) => {
    try {
      if (!selectedCapTable) {
        toast({
          variant: "destructive",
          title: "No Cap Table Selected",
          description: "Please select a cap table before importing data",
        });
        return;
      }

      setLoading(true);
      const { data, errors, warnings } =
        await CSVImportService.parseSubscriptionCSV(file);

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Import Errors",
          description: `${errors.length} errors found in the import file`,
        });
        return;
      }

      // Process each subscription
      let successCount = 0;
      for (const row of data) {
        // Find the investor by name
        const investor = investors.find(
          (inv) =>
            inv.name.toLowerCase() === row["investor name"].toLowerCase(),
        );

        if (!investor) {
          console.warn(`Investor not found: ${row["investor name"]}`);
          continue;
        }

        // Create the subscription
        const subscriptionId = await InvestorDataService.createSubscription({
          investor_id: investor.id,
          subscription_id:
            row["subscription id"] || `SUB-${Date.now()}-${successCount}`,
          fiat_amount: row["fiat amount"],
          currency: row.currency,
          confirmed: row.status?.toLowerCase() === "confirmed",
          notes: row.notes,
          subscription_date:
            row["subscription date"] || new Date().toISOString().split("T")[0],
          project_id: selectedProject?.id,
        });

        successCount++;
      }

      // Refresh the investors list
      const updatedInvestors =
        await InvestorDataService.getInvestorsForCapTable(selectedCapTable.id);
      onInvestorsChange(
        InvestorDataService.transformInvestorData(updatedInvestors),
      );

      toast({
        title: "Import Complete",
        description: `Imported ${successCount} subscriptions successfully`,
      });
    } catch (error) {
      console.error("Error importing subscriptions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import subscriptions",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddSubscription(true)}
            disabled={investors.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Subscription
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportSubscriptions}
            disabled={investors.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              document.getElementById("import-subscription-file")?.click()
            }
            disabled={!selectedCapTable || investors.length === 0}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <input
            id="import-subscription-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImportSubscriptions(e.target.files[0]);
                e.target.value = ""; // Reset the input
              }
            }}
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Subscriptions</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="allocated">Allocated</TabsTrigger>
          <TabsTrigger value="distributed">Distributed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <SubscriptionDataGrid
            investors={filteredInvestors}
            loading={loading}
            onEditSubscription={(subscription, investorId) => {
              setSelectedSubscription(subscription);
              setSelectedInvestor(
                investors.find((inv) => inv.id === investorId) || null,
              );
              setShowAddSubscription(true);
            }}
            onDeleteSubscription={handleDeleteSubscription}
            onBulkConfirm={handleBulkConfirm}
          />
        </TabsContent>

        <TabsContent value="pending" className="mt-0">
          <SubscriptionDataGrid
            investors={filteredInvestors}
            loading={loading}
            filterStatus="Pending"
            onEditSubscription={(subscription, investorId) => {
              setSelectedSubscription(subscription);
              setSelectedInvestor(
                investors.find((inv) => inv.id === investorId) || null,
              );
              setShowAddSubscription(true);
            }}
            onDeleteSubscription={handleDeleteSubscription}
            onBulkConfirm={handleBulkConfirm}
          />
        </TabsContent>

        <TabsContent value="confirmed" className="mt-0">
          <SubscriptionDataGrid
            investors={filteredInvestors}
            loading={loading}
            filterStatus="Confirmed"
            onEditSubscription={(subscription, investorId) => {
              setSelectedSubscription(subscription);
              setSelectedInvestor(
                investors.find((inv) => inv.id === investorId) || null,
              );
              setShowAddSubscription(true);
            }}
            onDeleteSubscription={handleDeleteSubscription}
            onBulkConfirm={handleBulkConfirm}
          />
        </TabsContent>

        <TabsContent value="allocated" className="mt-0">
          <SubscriptionDataGrid
            investors={filteredInvestors}
            loading={loading}
            filterStatus="Allocated"
            onEditSubscription={(subscription, investorId) => {
              setSelectedSubscription(subscription);
              setSelectedInvestor(
                investors.find((inv) => inv.id === investorId) || null,
              );
              setShowAddSubscription(true);
            }}
            onDeleteSubscription={handleDeleteSubscription}
            onBulkConfirm={handleBulkConfirm}
          />
        </TabsContent>

        <TabsContent value="distributed" className="mt-0">
          <SubscriptionDataGrid
            investors={filteredInvestors}
            loading={loading}
            filterStatus="Distributed"
            onEditSubscription={(subscription, investorId) => {
              setSelectedSubscription(subscription);
              setSelectedInvestor(
                investors.find((inv) => inv.id === investorId) || null,
              );
              setShowAddSubscription(true);
            }}
            onDeleteSubscription={handleDeleteSubscription}
            onBulkConfirm={handleBulkConfirm}
          />
        </TabsContent>
      </Tabs>

      <SubscriptionForm
        open={showAddSubscription}
        onOpenChange={setShowAddSubscription}
        investors={investors}
        selectedInvestor={selectedInvestor}
        subscription={selectedSubscription}
        onSubmit={(investorId, data) => {
          if (selectedSubscription) {
            handleUpdateSubscription(selectedSubscription.id, investorId, data);
          } else {
            handleAddSubscription(investorId, data);
          }
        }}
        onDelete={
          selectedSubscription
            ? () =>
                handleDeleteSubscription(
                  selectedSubscription.id,
                  selectedInvestor?.id || "",
                )
            : undefined
        }
      />
    </div>
  );
};

export default SubscriptionManager;
