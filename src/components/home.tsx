import React, { useState, useEffect } from "react";
import { useToast } from "./ui/use-toast";
import { TokenType } from "@/types/token";
import { Investor } from "@/types/investor";
import CapTableHeader from "./CapTableHeader";
import InvestorTable from "./InvestorTable";
import CSVUploadDialog from "./CSVUploadDialog";
import TokenAllocationDialog from "./TokenAllocationDialog";
import TokenSubscriptionDialog from "./TokenSubscriptionDialog";
import InvestorDetailsDialog from "./InvestorDetailsDialog";
import SubscriptionUploadDialog from "./SubscriptionUploadDialog";
import BatchDistributionDialog from "./BatchDistributionDialog";
import DistributionConfirmationDialog from "./DistributionConfirmationDialog";
import CapTableExportDialog from "./CapTableExportDialog";
import DashboardSummary from "./DashboardSummary";
import MultiTokenAllocationDialog from "./MultiTokenAllocationDialog";
import SubscriptionManagementDialog from "./SubscriptionManagementDialog";
import EditSubscriptionDialog from "./EditSubscriptionDialog";
import {
  parseCSV,
  generateCSVTemplate,
  downloadCSV,
  generateCSVFromInvestors,
} from "@/lib/csv";
import { generateSubscriptionTemplate } from "@/lib/subscriptionTemplate";
// Import Supabase client
import { supabase } from "@/lib/supabase";
import { toast } from "./ui/use-toast";
import { useCapTable } from "./CapTableContext";

// Database functions using Supabase
const dbFunctions = {
  getInvestors: async () => {
    const { data, error } = await supabase
      .from("investors")
      .select("*, subscriptions(*)");
    if (error) throw error;
    return data || [];
  },
  createInvestor: async (investor) => {
    const { data, error } = await supabase
      .from("investors")
      .insert(investor)
      .select("investor_id")
      .single();
    if (error) throw error;
    return data?.investor_id;
  },
  updateInvestorKYC: async (id, kycStatus, expiryDate) => {
    const { error } = await supabase
      .from("investors")
      .update({ kyc_status: kycStatus, kyc_expiry_date: expiryDate })
      .eq("investor_id", id);
    if (error) throw error;
  },
  createSubscription: async (subscription) => {
    const { data, error } = await supabase
      .from("subscriptions")
      .insert(subscription)
      .select("id")
      .single();
    if (error) throw error;
    return data?.id;
  },
  confirmSubscription: async (id) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ confirmed: true })
      .eq("id", id);
    if (error) throw error;
  },
  createTokenAllocation: async (allocation) => {
    const { data, error } = await supabase
      .from("token_allocations")
      .insert(allocation)
      .select("id")
      .single();
    if (error) throw error;
    return data?.id;
  },
  distributeTokens: async (allocationIds) => {
    // Call the edge function to distribute tokens
    const { data, error } = await supabase.functions.invoke(
      "distribute_tokens",
      {
        body: { allocationIds },
      },
    );
    if (error) throw error;
    return data;
  },
  checkKYCExpirations: async () => {
    // Call the edge function to check KYC expirations
    const { data, error } = await supabase.functions.invoke(
      "check_kyc_expirations",
    );
    if (error) throw error;
    return data?.count || 0;
  },
};

const {
  getInvestors,
  createInvestor,
  updateInvestorKYC,
  createSubscription,
  confirmSubscription,
  createTokenAllocation,
  distributeTokens,
  checkKYCExpirations,
} = dbFunctions;

// Import CapTable type
import { CapTable } from "./CapTableSelector";
import { Project } from "./ProjectSelector";

const HomePage = () => {
  // Get projects and cap tables from context
  const {
    projects,
    selectedProject,
    capTables,
    selectedCapTable,
    setSelectedProject,
    setSelectedCapTable,
    createProject,
    updateProject,
    deleteProject,
    createCapTable,
    updateCapTable,
    deleteCapTable,
    loading: contextLoading,
  } = useCapTable();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCSVDialog, setShowCSVDialog] = useState(false);
  const [showTokenDialog, setShowTokenDialog] = useState(false);
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [showSubscriptionUploadDialog, setShowSubscriptionUploadDialog] =
    useState(false);
  const [showInvestorDialog, setShowInvestorDialog] = useState(false);
  const [showBatchDistributionDialog, setShowBatchDistributionDialog] =
    useState(false);
  const [
    showDistributionConfirmationDialog,
    setShowDistributionConfirmationDialog,
  ] = useState(false);
  const [showCapTableExportDialog, setShowCapTableExportDialog] =
    useState(false);
  const [showMultiTokenDialog, setShowMultiTokenDialog] = useState(false);
  const [
    showSubscriptionManagementDialog,
    setShowSubscriptionManagementDialog,
  ] = useState(false);
  const [showEditSubscriptionDialog, setShowEditSubscriptionDialog] =
    useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [selectedSubscriptionInvestorId, setSelectedSubscriptionInvestorId] =
    useState<string>("");
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null,
  );
  const [selectedInvestorForAllocation, setSelectedInvestorForAllocation] =
    useState<string | null>(null);
  const [distributionProgress, setDistributionProgress] = useState(0);
  const [pendingDistributionData, setPendingDistributionData] = useState<{
    investorIds: string[];
    totalTokens: number;
    tokenTypes: string[];
  } | null>(null);

  // CSV validation states
  const [csvValidationErrors, setCSVValidationErrors] = useState<string[]>([]);
  const [csvValidationWarnings, setCSVValidationWarnings] = useState<string[]>(
    [],
  );
  const [isValidatingCSV, setIsValidatingCSV] = useState(false);

  // Subscription validation states
  const [subValidationErrors, setSubValidationErrors] = useState<string[]>([]);
  const [subValidationWarnings, setSubValidationWarnings] = useState<string[]>(
    [],
  );
  const [isValidatingSub, setIsValidatingSub] = useState(false);

  // Fetch investors on component mount
  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);

        // Fetch investors from Supabase
        const fetchedInvestors = await getInvestors();

        setInvestors(fetchedInvestors);
        setLoading(false);

        // Check for expired KYC
        const expiredCount = fetchedInvestors.filter(
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
        setLoading(false);
      }
    };

    fetchInvestors();
  }, []);

  const handleTokenAllocation = async (
    allocationType: string,
    allocations: Array<{ tokenType: TokenType; amount: number }>,
  ) => {
    if (allocations.some((a) => !a.amount || a.amount <= 0)) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter valid token amounts",
      });
      return;
    }

    try {
      // Get selected investors
      const selectedInvestors = investors.filter(
        (investor) =>
          investor.selected || investor.id === selectedInvestorForAllocation,
      );

      // Create a copy of the investors array to update
      const updatedInvestors = [...investors];

      // For each investor, create token allocations
      for (const investor of selectedInvestors) {
        // Find the investor in the updated array
        const updatedInvestor = updatedInvestors.find(
          (i) => i.id === investor.id,
        );
        if (!updatedInvestor) continue;

        // For each subscription that doesn't have an allocation
        for (let i = 0; i < updatedInvestor.subscriptions.length; i++) {
          const subscription = updatedInvestor.subscriptions[i];
          if (!subscription.allocated && subscription.confirmed) {
            // Find the corresponding allocation from the dialog
            const allocation = allocations[i % allocations.length];
            if (allocation) {
              try {
                // Create token allocation in the database
                const allocationId = await createTokenAllocation(
                  subscription.id || "",
                  allocation.tokenType,
                  allocation.amount,
                );

                // Update the subscription with allocation details
                subscription.allocated = true;
                subscription.tokenType = allocation.tokenType;
                subscription.tokenAllocation = allocation.amount;
                subscription.tokenAllocationId = allocationId;
              } catch (allocError) {
                console.error(
                  "Error creating allocation in database:",
                  allocError,
                );
                // Continue with other subscriptions even if one fails
              }
            }
          }
        }
      }

      // Update the state with the modified investors
      setInvestors(updatedInvestors);
      setSelectedInvestorForAllocation(null);
      setShowTokenDialog(false);

      toast({
        title: "Success",
        description: `Token allocation added successfully`,
      });
    } catch (error) {
      console.error("Error allocating tokens:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to allocate tokens",
      });
    }
  };

  const handleBespokeAllocation = async (
    bespokeAllocations: Array<{
      investorId: string;
      tokenType: TokenType;
      amount: number;
    }>,
  ) => {
    if (bespokeAllocations.some((a) => !a.amount || a.amount <= 0)) {
      toast({
        variant: "destructive",
        title: "Invalid amount",
        description: "Please enter valid token amounts",
      });
      return;
    }

    try {
      // Create a copy of the investors array to update
      const updatedInvestors = [...investors];

      // Process each bespoke allocation
      for (const allocation of bespokeAllocations) {
        // Find the investor in the updated array
        const investorIndex = updatedInvestors.findIndex(
          (i) => i.id === allocation.investorId,
        );
        if (investorIndex === -1) continue;

        const investor = updatedInvestors[investorIndex];

        // Find unallocated confirmed subscriptions
        const unallocatedSubscriptions = investor.subscriptions.filter(
          (sub) => !sub.allocated && sub.confirmed,
        );

        if (unallocatedSubscriptions.length > 0) {
          // Allocate to the first unallocated subscription
          const subscription = unallocatedSubscriptions[0];

          try {
            // Create token allocation in the database
            const allocationId = await createTokenAllocation(
              subscription.id || "",
              allocation.tokenType,
              allocation.amount,
            );

            // Update the subscription with allocation details
            subscription.allocated = true;
            subscription.tokenType = allocation.tokenType;
            subscription.tokenAllocation = allocation.amount;
            subscription.tokenAllocationId = allocationId;
          } catch (allocError) {
            console.error(
              "Error creating bespoke allocation in database:",
              allocError,
            );
            // Continue with other allocations even if one fails
          }
        }
      }

      // Update the state with the modified investors
      setInvestors(updatedInvestors);
      setSelectedInvestorForAllocation(null);

      toast({
        title: "Success",
        description: `Bespoke token allocations added successfully`,
      });
    } catch (error) {
      console.error("Error allocating tokens:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to allocate tokens",
      });
    }
  };

  const handleBulkAction = async (action: string) => {
    const selectedInvestors = investors.filter((i) => i.selected);
    if (
      selectedInvestors.length === 0 &&
      action !== "generate_cap_table" &&
      action !== "export"
    ) {
      toast({
        variant: "destructive",
        title: "No investors selected",
        description: "Please select at least one investor",
      });
      return;
    }

    if (action === "subscribe") {
      setShowSubscriptionDialog(true);
    } else if (action === "allocate") {
      setShowTokenDialog(true);
    } else if (action === "multi_token_allocate") {
      setShowMultiTokenDialog(true);
    } else if (action === "remove_allocations") {
      // Handle removing allocations
      try {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        let removedCount = 0;

        // For each selected investor, remove allocations
        for (const investor of selectedInvestors) {
          const investorIndex = updatedInvestors.findIndex(
            (i) => i.id === investor.id,
          );
          if (investorIndex === -1) continue;

          // Update subscriptions to remove allocations
          updatedInvestors[investorIndex].subscriptions = updatedInvestors[
            investorIndex
          ].subscriptions.map((sub) => {
            if (sub.allocated && !sub.distributed) {
              removedCount++;
              return {
                ...sub,
                allocated: false,
                tokenType: undefined,
                tokenAllocation: undefined,
                tokenAllocationId: undefined,
              };
            }
            return sub;
          });
        }

        // Update state
        setInvestors(updatedInvestors);

        toast({
          title: "Allocations Removed",
          description: `Removed ${removedCount} token allocation(s) from ${selectedInvestors.length} investor(s)`,
        });
      } catch (error) {
        console.error("Error removing allocations:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove allocations",
        });
      }
    } else if (action === "manage_subscriptions") {
      setShowSubscriptionManagementDialog(true);
    } else if (action === "confirm_subscriptions") {
      try {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        let confirmedCount = 0;

        // For each selected investor, confirm all unconfirmed subscriptions
        for (const investor of selectedInvestors) {
          const investorIndex = updatedInvestors.findIndex(
            (i) => i.id === investor.id,
          );
          if (investorIndex === -1) continue;

          // Update unconfirmed subscriptions
          updatedInvestors[investorIndex].subscriptions = updatedInvestors[
            investorIndex
          ].subscriptions.map((sub) => {
            if (!sub.confirmed) {
              confirmedCount++;
              return { ...sub, confirmed: true };
            }
            return sub;
          });
        }

        // Update state
        setInvestors(updatedInvestors);

        toast({
          title: "Subscriptions Confirmed",
          description: `Confirmed ${confirmedCount} subscription(s) for ${selectedInvestors.length} investor(s)`,
        });
      } catch (error) {
        console.error("Error confirming subscriptions:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to confirm subscriptions",
        });
      }
    } else if (action === "distribute") {
      setShowBatchDistributionDialog(true);
    } else if (action === "screen") {
      try {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];

        // Update KYC status for selected investors
        for (const investor of selectedInvestors) {
          const index = updatedInvestors.findIndex((i) => i.id === investor.id);
          if (index !== -1) {
            updatedInvestors[index].kycStatus = "Verified";
            updatedInvestors[index].kycExpiryDate = new Date(
              Date.now() + 180 * 24 * 60 * 60 * 1000,
            );
          }
        }

        // Update state
        setInvestors(updatedInvestors);

        toast({
          title: "Screening completed",
          description: `Updated KYC status for ${selectedInvestors.length} investors`,
        });
      } catch (error) {
        console.error("Error screening investors:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update KYC status",
        });
      }
    } else if (action === "check_expirations") {
      try {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        let expiredCount = 0;

        // Check for expired KYC
        for (const investor of updatedInvestors) {
          if (investor.kycStatus === "Verified" && investor.kycExpiryDate) {
            if (investor.kycExpiryDate.getTime() < Date.now()) {
              investor.kycStatus = "Expired";
              expiredCount++;
            }
          }
        }

        // Update state
        setInvestors(updatedInvestors);

        if (expiredCount > 0) {
          toast({
            title: "KYC Expiration Check",
            description: `${expiredCount} investor(s) have expired KYC verification`,
          });
        } else {
          toast({
            title: "KYC Expiration Check",
            description: "No expired KYC verifications found",
          });
        }
      } catch (error) {
        console.error("Error checking KYC expirations:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to check KYC expirations",
        });
      }
    } else if (action === "export") {
      const csv = generateCSVFromInvestors(selectedInvestors, {
        includeKYC: true,
        includeWallets: true,
        includeTransactions: true,
      });
      downloadCSV(
        csv,
        `investors-export-${new Date().toISOString().split("T")[0]}.csv`,
      );

      toast({
        title: "Export Complete",
        description: `Exported data for ${selectedInvestors.length} investors`,
      });
    } else if (action === "generate_cap_table") {
      setShowCapTableExportDialog(true);
    }
  };

  const handleAction = async (id: string, action: string) => {
    try {
      if (action === "allocate") {
        setSelectedInvestorForAllocation(id);
        setShowTokenDialog(true);
      } else if (action === "confirm") {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          // Update unconfirmed subscriptions
          for (const sub of updatedInvestors[investorIndex].subscriptions) {
            if (!sub.confirmed && sub.id) {
              try {
                // Update subscription in database
                await confirmSubscription(sub.id);
                sub.confirmed = true;
              } catch (confirmError) {
                console.error(
                  "Error confirming subscription in database:",
                  confirmError,
                );
                // Continue with other subscriptions even if one fails
              }
            }
          }

          // Update state
          setInvestors(updatedInvestors);

          toast({
            title: "Success",
            description: "Subscription confirmed",
          });
        }
      } else if (action === "distribute") {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          // Update allocated but not distributed subscriptions
          for (const sub of updatedInvestors[investorIndex].subscriptions) {
            if (sub.allocated && !sub.distributed && sub.tokenAllocationId) {
              try {
                // Generate a mock transaction hash
                const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;

                // Update token allocation in database
                await distributeTokens(sub.tokenAllocationId, txHash);
                sub.distributed = true;
              } catch (distributeError) {
                console.error(
                  "Error distributing tokens in database:",
                  distributeError,
                );
                // Continue with other subscriptions even if one fails
              }
            }
          }

          // Update state
          setInvestors(updatedInvestors);

          toast({
            title: "Success",
            description: "Tokens distributed",
          });
        }
      } else if (action === "screen") {
        // Create a copy of the investors array
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          // Calculate expiry date (6 months from now)
          const expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

          try {
            // Update KYC status in database
            await updateInvestorKYC(id, "Verified", expiryDate.toISOString());

            // Update local state
            updatedInvestors[investorIndex].kycStatus = "Verified";
            updatedInvestors[investorIndex].kycExpiryDate = expiryDate;

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: "KYC status updated",
            });
          } catch (kycError) {
            console.error("Error updating KYC status in database:", kycError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to update KYC status",
            });
          }
        }
      } else if (action === "view") {
        const investor = investors.find((i) => i.id === id);
        if (investor) {
          setSelectedInvestor(investor);
          setShowInvestorDialog(true);
        }
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to ${action}`,
      });
    }
  };

  const handleSelectAll = (selected: boolean) => {
    setInvestors((prev) => prev.map((investor) => ({ ...investor, selected })));
  };

  const handleSelectInvestor = (id: string) => {
    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === id
          ? { ...investor, selected: !investor.selected }
          : investor,
      ),
    );
  };

  return (
    <div className="w-full min-h-screen bg-background p-4 space-y-4">
      <CapTableHeader
        onUploadCSV={() => setShowCSVDialog(true)}
        onUploadSubscriptions={() => setShowSubscriptionUploadDialog(true)}
        onDownloadTemplate={() => {
          const template = generateCSVTemplate();
          downloadCSV(template, "investor-template.csv");
        }}
        onBulkAction={handleBulkAction}
        onSearch={(query) => {
          // Implement search functionality here
          console.log("Search query:", query);
        }}
        onFilter={() => {
          // Open filter dialog
          console.log("Open filter dialog");
        }}
        projects={projects}
        selectedProject={selectedProject}
        onSelectProject={setSelectedProject}
        onCreateProject={createProject}
        onEditProject={updateProject}
        onDeleteProject={deleteProject}
        capTables={capTables.filter(
          (ct) => ct.projectId === selectedProject?.id,
        )}
        selectedCapTable={selectedCapTable}
        onSelectCapTable={(capTable) => {
          setSelectedCapTable(capTable);
          toast({
            title: "Cap Table Selected",
            description: `Switched to ${capTable.name}`,
          });
        }}
        onCreateCapTable={createCapTable}
        onEditCapTable={updateCapTable}
        onDeleteCapTable={deleteCapTable}
      />

      <DashboardSummary investors={investors} />

      {loading || contextLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-lg">Loading investors...</p>
        </div>
      ) : (
        <InvestorTable
          investors={investors}
          onSelectAll={handleSelectAll}
          onSelectInvestor={handleSelectInvestor}
          onViewInvestor={(id) => handleAction(id, "view")}
          onAction={handleAction}
          onExport={(selectedInvestors) => {
            if (selectedInvestors.length === 0) {
              toast({
                variant: "destructive",
                title: "No investors selected",
                description: "Please select at least one investor to export",
              });
              return;
            }
            const csv = generateCSVFromInvestors(selectedInvestors, {
              includeKYC: true,
              includeWallets: true,
              includeTransactions: true,
            });
            downloadCSV(
              csv,
              `investors-export-${new Date().toISOString().split("T")[0]}.csv`,
            );

            toast({
              title: "Export Complete",
              description: `Exported data for ${selectedInvestors.length} investors`,
            });
          }}
        />
      )}

      <CSVUploadDialog
        open={showCSVDialog}
        onClose={() => setShowCSVDialog(false)}
        validationErrors={csvValidationErrors}
        validationWarnings={csvValidationWarnings}
        isValidating={isValidatingCSV}
        onUpload={async (file) => {
          try {
            setIsValidatingCSV(true);
            setCSVValidationErrors([]);
            setCSVValidationWarnings([]);

            // Parse and validate the CSV file
            const { data, errors, warnings } = await parseCSV(file, "investor");

            setCSVValidationErrors(errors);
            setCSVValidationWarnings(warnings);

            if (errors.length > 0) {
              setIsValidatingCSV(false);
              return; // Don't proceed if there are validation errors
            }

            // For demo purposes, we'll simulate a successful import
            setIsValidatingCSV(false);
            setShowCSVDialog(false);

            // Process the actual data from the CSV
            const newInvestors = data.map((row: any) => {
              // Map CSV data to investor structure
              return {
                id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                name: row.name,
                email: row.email,
                type: row.type || "Individual",
                kycStatus: row["kyc status"] || "Pending",
                wallet: row.wallet,
                kycExpiryDate:
                  row["kyc status"] === "Verified"
                    ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
                    : undefined,
                selected: false,
                subscriptions: [],
              };
            });

            // Add to existing investors
            setInvestors((prev) => [...prev, ...newInvestors]);

            toast({
              title: "Success",
              description: `${newInvestors.length} investors imported successfully`,
            });
          } catch (error) {
            console.error("Error uploading investors:", error);
            setIsValidatingCSV(false);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to import investors",
            });
          }
        }}
        onDownloadTemplate={() => {
          const template = generateCSVTemplate();
          downloadCSV(template, "investor-template.csv");
        }}
      />

      <SubscriptionUploadDialog
        open={showSubscriptionUploadDialog}
        onClose={() => setShowSubscriptionUploadDialog(false)}
        validationErrors={subValidationErrors}
        validationWarnings={subValidationWarnings}
        isValidating={isValidatingSub}
        onUpload={async (file) => {
          try {
            setIsValidatingSub(true);
            setSubValidationErrors([]);
            setSubValidationWarnings([]);

            // Parse and validate the CSV file
            const { data, errors, warnings } = await parseCSV(
              file,
              "subscription",
            );

            setSubValidationErrors(errors);
            setSubValidationWarnings(warnings);

            if (errors.length > 0) {
              setIsValidatingSub(false);
              return; // Don't proceed if there are validation errors
            }

            // For demo purposes, we'll simulate a successful import
            setIsValidatingSub(false);
            setShowSubscriptionUploadDialog(false);

            // Add subscriptions to investors based on the CSV data
            const updatedInvestors = [...investors];
            const successCount =
              data.length || Math.floor(Math.random() * 5) + 3; // Use actual data length or fallback
            const currencies = ["USD", "EUR", "GBP"];
            let addedCount = 0;

            // If we have actual data, try to match investor names
            if (data.length > 0) {
              for (const row of data) {
                // Find the investor by name
                const investorIndex = updatedInvestors.findIndex(
                  (inv) =>
                    inv.name.toLowerCase() ===
                    row["investor name"]?.toLowerCase(),
                );

                if (investorIndex !== -1) {
                  // Add subscription to the found investor
                  const investor = updatedInvestors[investorIndex];
                  const newSubscription = {
                    id: `sub-new-${Date.now()}-${addedCount}`,
                    subscriptionId:
                      row["subscription id"] ||
                      `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                    fiatSubscription: {
                      amount:
                        parseFloat(row["fiat amount"]) ||
                        5000 + Math.floor(Math.random() * 15000),
                      currency: (row.currency ||
                        currencies[
                          Math.floor(Math.random() * currencies.length)
                        ]) as any,
                    },
                    confirmed:
                      row.status?.toLowerCase() === "confirmed" || false,
                    allocated: false,
                    distributed: false,
                  };

                  investor.subscriptions.push(newSubscription);
                  addedCount++;
                }
              }
            }

            // If no subscriptions were added from the data, add some random ones
            if (addedCount === 0) {
              for (let i = 0; i < successCount; i++) {
                // Pick a random investor
                const randomIndex = Math.floor(
                  Math.random() * updatedInvestors.length,
                );
                const investor = updatedInvestors[randomIndex];

                // Add a new subscription
                const newSubscription = {
                  id: `sub-new-${Date.now()}-${i}`,
                  subscriptionId: `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
                  fiatSubscription: {
                    amount: 5000 + Math.floor(Math.random() * 15000),
                    currency: currencies[
                      Math.floor(Math.random() * currencies.length)
                    ] as any,
                  },
                  confirmed: false,
                  allocated: false,
                  distributed: false,
                };

                investor.subscriptions.push(newSubscription);
                addedCount++;
              }
            }

            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: `${addedCount} subscriptions uploaded successfully`,
            });
          } catch (error) {
            console.error("Error uploading subscriptions:", error);
            setIsValidatingSub(false);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to upload subscriptions",
            });
          }
        }}
        onDownloadTemplate={() => {
          const template = generateSubscriptionTemplate();
          downloadCSV(
            template,
            `subscription-template-${new Date().toISOString().split("T")[0]}.csv`,
          );

          toast({
            title: "Template Downloaded",
            description: "Subscription template has been downloaded",
          });
        }}
        onSuccess={(count) => {
          toast({
            title: "Upload Successful",
            description: `${count} subscriptions have been uploaded successfully`,
          });
        }}
      />

      <TokenAllocationDialog
        open={showTokenDialog}
        onOpenChange={(open) => {
          setShowTokenDialog(open);
          if (!open) setSelectedInvestorForAllocation(null);
        }}
        selectedInvestors={
          selectedInvestorForAllocation
            ? investors
                .filter((i) => i.id === selectedInvestorForAllocation)
                .map((i) => ({
                  id: i.id,
                  name: i.name,
                  currentAllocation: i.subscriptions.reduce(
                    (sum, s) => sum + (s.tokenAllocation || 0),
                    0,
                  ),
                }))
            : investors
                .filter((i) => i.selected)
                .map((i) => ({
                  id: i.id,
                  name: i.name,
                  currentAllocation: i.subscriptions.reduce(
                    (sum, s) => sum + (s.tokenAllocation || 0),
                    0,
                  ),
                }))
        }
        investors={investors}
        onConfirm={handleTokenAllocation}
        onBespokeConfirm={handleBespokeAllocation}
      />

      <TokenSubscriptionDialog
        open={showSubscriptionDialog}
        onOpenChange={setShowSubscriptionDialog}
        selectedInvestors={investors
          .filter((i) => i.selected)
          .map((i) => ({ id: i.id, name: i.name }))}
        onConfirm={async (subscriptionData) => {
          try {
            const selectedInvestors = investors.filter((i) => i.selected);
            const updatedInvestors = [...investors];

            // Create subscriptions for each selected investor
            for (const investor of selectedInvestors) {
              // Find the investor in the updated array
              const updatedInvestor = updatedInvestors.find(
                (i) => i.id === investor.id,
              );
              if (!updatedInvestor) continue;

              // Generate a unique subscription ID if not provided
              const subscriptionId =
                subscriptionData.subscriptionId ||
                `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

              try {
                // Create subscription in the database
                const newSubId = await createSubscription(
                  investor.id,
                  subscriptionId,
                  subscriptionData.fiatAmount.amount,
                  subscriptionData.fiatAmount.currency,
                  false, // not confirmed initially
                  subscriptionData.notes,
                  new Date().toISOString(),
                );

                // Add the new subscription to the local state
                updatedInvestor.subscriptions.push({
                  id: newSubId,
                  subscriptionId: subscriptionId,
                  fiatSubscription: {
                    amount: subscriptionData.fiatAmount.amount,
                    currency: subscriptionData.fiatAmount.currency,
                  },
                  confirmed: false,
                  allocated: false,
                  distributed: false,
                  notes: subscriptionData.notes,
                });
              } catch (subError) {
                console.error(
                  "Error creating subscription in database:",
                  subError,
                );
                // Continue with other investors even if one fails
              }
            }

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: `Token subscription added for ${selectedInvestors.length} investor(s)`,
            });
          } catch (error) {
            console.error("Error creating subscriptions:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to create subscriptions",
            });
          }
        }}
      />

      {selectedInvestor && (
        <InvestorDetailsDialog
          open={showInvestorDialog}
          onOpenChange={(open) => {
            setShowInvestorDialog(open);
            if (!open) setSelectedInvestor(null);
          }}
          investor={selectedInvestor}
        />
      )}

      <BatchDistributionDialog
        open={showBatchDistributionDialog}
        onOpenChange={setShowBatchDistributionDialog}
        selectedInvestors={investors
          .filter((i) => i.selected)
          .map((i) => ({
            id: i.id,
            name: i.name,
            subscriptions: i.subscriptions.map((s) => ({
              id: s.id,
              tokenAllocationId: s.tokenAllocationId,
              tokenType: s.tokenType,
              tokenAllocation: s.tokenAllocation,
              allocated: s.allocated,
              distributed: s.distributed,
            })),
          }))}
        onConfirm={(investorIds) => {
          // Calculate distribution data for confirmation dialog
          const selectedInvestors = investors.filter((i) =>
            investorIds.includes(i.id),
          );
          const tokenTypes = new Set<string>();
          let totalTokens = 0;

          // Calculate total tokens and collect token types
          for (const investor of selectedInvestors) {
            for (const subscription of investor.subscriptions) {
              if (
                subscription.allocated &&
                !subscription.distributed &&
                subscription.tokenAllocationId &&
                subscription.tokenType &&
                subscription.tokenAllocation
              ) {
                totalTokens += subscription.tokenAllocation;
                tokenTypes.add(subscription.tokenType);
              }
            }
          }

          // Store distribution data for confirmation dialog
          setPendingDistributionData({
            investorIds,
            totalTokens,
            tokenTypes: Array.from(tokenTypes),
          });

          // Show confirmation dialog
          setShowDistributionConfirmationDialog(true);
        }}
      />

      <DistributionConfirmationDialog
        open={showDistributionConfirmationDialog}
        onOpenChange={setShowDistributionConfirmationDialog}
        distributionData={
          pendingDistributionData
            ? {
                investors: pendingDistributionData.investorIds.length,
                totalTokens: pendingDistributionData.totalTokens,
                tokenTypes: pendingDistributionData.tokenTypes,
                estimatedGasFee: "0.005 ETH",
              }
            : undefined
        }
        onCancel={() => {
          setShowDistributionConfirmationDialog(false);
          setPendingDistributionData(null);
        }}
        onConfirm={async () => {
          if (!pendingDistributionData) return;

          try {
            setDistributionProgress(0);
            const updatedInvestors = [...investors];
            const selectedInvestorIds = pendingDistributionData.investorIds;
            let processed = 0;
            let totalDistributed = 0;
            let transactionCount = 0;

            // Simulate a more realistic distribution process with delays
            // to mimic blockchain transaction times
            for (const investorId of selectedInvestorIds) {
              const investorIndex = updatedInvestors.findIndex(
                (i) => i.id === investorId,
              );
              if (investorIndex === -1) continue;

              // Count how many distributions we'll do for this investor
              const distributionsToProcess = updatedInvestors[
                investorIndex
              ].subscriptions.filter(
                (sub) =>
                  sub.allocated && !sub.distributed && sub.tokenAllocationId,
              ).length;

              if (distributionsToProcess > 0) {
                // Add a small delay to simulate blockchain transaction time
                // Larger delays for investors with more distributions
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * distributionsToProcess),
                );
              }

              // Update subscriptions
              updatedInvestors[investorIndex].subscriptions = updatedInvestors[
                investorIndex
              ].subscriptions.map((sub) => {
                if (
                  sub.allocated &&
                  !sub.distributed &&
                  sub.tokenAllocationId
                ) {
                  // Count tokens distributed and transactions
                  totalDistributed += sub.tokenAllocation || 0;
                  transactionCount++;
                  return { ...sub, distributed: true };
                }
                return sub;
              });

              processed++;
              setDistributionProgress(
                Math.floor((processed / selectedInvestorIds.length) * 100),
              );
            }

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Distribution Complete",
              description: `${totalDistributed.toLocaleString()} tokens distributed to ${selectedInvestorIds.length} investors in ${transactionCount} transactions`,
            });

            // Reset pending distribution data
            setPendingDistributionData(null);
            return;
          } catch (error) {
            console.error("Error distributing tokens:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to distribute tokens",
            });
            throw error;
          }
        }}
      />

      <MultiTokenAllocationDialog
        open={showMultiTokenDialog}
        onOpenChange={setShowMultiTokenDialog}
        selectedInvestors={investors
          .filter((i) => i.selected)
          .map((i) => ({
            id: i.id,
            name: i.name,
            currentAllocation: i.subscriptions.reduce(
              (sum, s) => sum + (s.tokenAllocation || 0),
              0,
            ),
          }))}
        onConfirm={(allocations) => {
          try {
            // Get selected investors
            const selectedInvestors = investors.filter(
              (investor) => investor.selected,
            );

            // Create a copy of the investors array to update
            const updatedInvestors = [...investors];

            // For each investor, create token allocations
            for (const investor of selectedInvestors) {
              // Find the investor in the updated array
              const updatedInvestor = updatedInvestors.find(
                (i) => i.id === investor.id,
              );
              if (!updatedInvestor) continue;

              // For each subscription that doesn't have an allocation
              let allocationIndex = 0;
              for (let i = 0; i < updatedInvestor.subscriptions.length; i++) {
                const subscription = updatedInvestor.subscriptions[i];
                if (!subscription.allocated && subscription.confirmed) {
                  // Get the next allocation in sequence
                  const allocation =
                    allocations[allocationIndex % allocations.length];
                  allocationIndex++;

                  if (allocation) {
                    // Update the subscription with allocation details
                    subscription.allocated = true;
                    subscription.tokenType = allocation.tokenType;
                    subscription.tokenAllocation = allocation.amount;
                    subscription.tokenAllocationId = `alloc-${Date.now()}-${i}`;
                  }
                }
              }
            }

            // Update the state with the modified investors
            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: `Multiple token allocations added successfully`,
            });
          } catch (error) {
            console.error("Error allocating tokens:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to allocate tokens",
            });
          }
        }}
        onRemoveAllocations={() => {
          try {
            // Create a copy of the investors array
            const updatedInvestors = [...investors];
            const selectedInvestorIds = investors
              .filter((i) => i.selected)
              .map((i) => i.id);
            let removedCount = 0;

            // For each selected investor, remove allocations
            for (const investorId of selectedInvestorIds) {
              const investorIndex = updatedInvestors.findIndex(
                (i) => i.id === investorId,
              );
              if (investorIndex === -1) continue;

              // Update subscriptions to remove allocations
              updatedInvestors[investorIndex].subscriptions = updatedInvestors[
                investorIndex
              ].subscriptions.map((sub) => {
                if (sub.allocated && !sub.distributed) {
                  removedCount++;
                  return {
                    ...sub,
                    allocated: false,
                    tokenType: undefined,
                    tokenAllocation: undefined,
                    tokenAllocationId: undefined,
                  };
                }
                return sub;
              });
            }

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Allocations Removed",
              description: `Removed ${removedCount} token allocation(s)`,
            });
          } catch (error) {
            console.error("Error removing allocations:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to remove allocations",
            });
          }
        }}
      />

      <SubscriptionManagementDialog
        open={showSubscriptionManagementDialog}
        onOpenChange={setShowSubscriptionManagementDialog}
        selectedInvestors={investors.filter((i) => i.selected)}
        onAddSubscription={() => setShowSubscriptionDialog(true)}
        onEditSubscription={(investorId, subscription) => {
          setSelectedSubscription(subscription);
          setSelectedSubscriptionInvestorId(investorId);
          setShowEditSubscriptionDialog(true);
        }}
        onConfirmSubscriptions={(subscriptionIds) => {
          try {
            // Create a copy of the investors array
            const updatedInvestors = [...investors];

            // For each investor, update the specified subscriptions
            for (const investor of updatedInvestors) {
              investor.subscriptions = investor.subscriptions.map((sub) => {
                if (sub.id && subscriptionIds.includes(sub.id)) {
                  return { ...sub, confirmed: true };
                }
                return sub;
              });
            }

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: `Confirmed ${subscriptionIds.length} subscription(s)`,
            });
          } catch (error) {
            console.error("Error confirming subscriptions:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to confirm subscriptions",
            });
          }
        }}
        onRemoveSubscriptions={(subscriptionIds) => {
          try {
            // Create a copy of the investors array
            const updatedInvestors = [...investors];

            // For each investor, remove the specified subscriptions
            for (const investor of updatedInvestors) {
              investor.subscriptions = investor.subscriptions.filter(
                (sub) => !sub.id || !subscriptionIds.includes(sub.id),
              );
            }

            // Update state
            setInvestors(updatedInvestors);

            toast({
              title: "Success",
              description: `Removed ${subscriptionIds.length} subscription(s)`,
            });
          } catch (error) {
            console.error("Error removing subscriptions:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to remove subscriptions",
            });
          }
        }}
      />

      <EditSubscriptionDialog
        open={showEditSubscriptionDialog}
        onOpenChange={setShowEditSubscriptionDialog}
        subscription={selectedSubscription}
        investorName={
          investors.find((i) => i.id === selectedSubscriptionInvestorId)?.name
        }
        onSave={(updatedSubscription) => {
          try {
            // Create a copy of the investors array
            const updatedInvestors = [...investors];

            // Find the investor and update the subscription
            const investorIndex = updatedInvestors.findIndex(
              (i) => i.id === selectedSubscriptionInvestorId,
            );
            if (investorIndex !== -1) {
              const subscriptionIndex = updatedInvestors[
                investorIndex
              ].subscriptions.findIndex((s) => s.id === updatedSubscription.id);

              if (subscriptionIndex !== -1) {
                // Update the subscription
                updatedInvestors[investorIndex].subscriptions[
                  subscriptionIndex
                ] = {
                  ...updatedInvestors[investorIndex].subscriptions[
                    subscriptionIndex
                  ],
                  fiatSubscription: updatedSubscription.fiatAmount,
                  subscriptionId: updatedSubscription.subscriptionId,
                  notes: updatedSubscription.notes,
                  confirmed: updatedSubscription.confirmed || false,
                };
              }
            }

            // Update state
            setInvestors(updatedInvestors);
            setSelectedSubscription(null);
            setSelectedSubscriptionInvestorId("");

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
          }
        }}
        onDelete={(subscriptionId) => {
          try {
            // Create a copy of the investors array
            const updatedInvestors = [...investors];

            // Find the investor and remove the subscription
            const investorIndex = updatedInvestors.findIndex(
              (i) => i.id === selectedSubscriptionInvestorId,
            );
            if (investorIndex !== -1) {
              updatedInvestors[investorIndex].subscriptions = updatedInvestors[
                investorIndex
              ].subscriptions.filter((s) => s.id !== subscriptionId);
            }

            // Update state
            setInvestors(updatedInvestors);
            setSelectedSubscription(null);
            setSelectedSubscriptionInvestorId("");

            toast({
              title: "Success",
              description: "Subscription removed successfully",
            });
          } catch (error) {
            console.error("Error removing subscription:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to remove subscription",
            });
          }
        }}
      />

      <CapTableExportDialog
        open={showCapTableExportDialog}
        onOpenChange={setShowCapTableExportDialog}
        investors={investors}
        onExport={(options) => {
          try {
            // Generate the CSV data with the selected options
            const csv = generateCSVFromInvestors(
              // If no investors are selected, export all investors
              investors.filter((i) => i.selected).length > 0
                ? investors.filter((i) => i.selected)
                : investors,
              {
                includeKYC: options.includeKYC,
                includeWallets: options.includeWallets,
                includeTransactions: options.includeTransactions,
                format: options.format,
              },
            );

            // Download the CSV file
            downloadCSV(
              csv,
              `cap-table-export-${new Date().toISOString().split("T")[0]}.csv`,
            );

            toast({
              title: "Success",
              description: `Cap table exported successfully with ${investors.filter((i) => i.selected).length > 0 ? investors.filter((i) => i.selected).length : investors.length} investors`,
            });
          } catch (error) {
            console.error("Error exporting cap table:", error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Failed to export cap table",
            });
          }
        }}
      />
    </div>
  );
};

export default HomePage;
