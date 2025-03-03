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
import {
  parseCSV,
  generateCSVTemplate,
  downloadCSV,
  generateCSVFromInvestors,
} from "@/lib/csv";
// In a real app, we would import these from @/lib/db
// For demo purposes with sample data, we'll mock these functions
const mockDbFunctions = {
  getInvestors: async () => [],
  createInvestor: async () => "",
  updateInvestorKYC: async () => {},
  createSubscription: async () => "",
  confirmSubscription: async () => {},
  createTokenAllocation: async () => "",
  distributeTokens: async () => {},
  checkKYCExpirations: async () => 0,
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
} = mockDbFunctions;

const HomePage = () => {
  const { toast } = useToast();
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

        // In a real app, we would fetch from the database
        // For demo purposes, we'll use sample data
        import("@/lib/sampleData").then(({ sampleInvestors }) => {
          setInvestors(
            sampleInvestors.map((investor) => ({
              ...investor,
              selected: false,
            })),
          );
          setLoading(false);

          // Show toast about sample data
          toast({
            title: "Sample Data Loaded",
            description: `Loaded ${sampleInvestors.length} sample investors for demonstration`,
          });

          // Check for expired KYC
          const expiredCount = sampleInvestors.filter(
            (inv) => inv.kycStatus === "Expired",
          ).length;
          if (expiredCount > 0) {
            toast({
              title: "KYC Expiration Alert",
              description: `${expiredCount} investor(s) have expired KYC verification`,
              variant: "warning",
            });
          }
        });
      } catch (error) {
        console.error("Error loading sample investors:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load sample investors",
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
          subscription.allocated = true;
          subscription.tokenType = allocation.tokenType;
          subscription.tokenAllocation = allocation.amount;
          subscription.tokenAllocationId = `alloc-${Date.now()}-${allocation.investorId}`;
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
    if (selectedInvestors.length === 0) {
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
          updatedInvestors[investorIndex].subscriptions = updatedInvestors[
            investorIndex
          ].subscriptions.map((sub) => {
            if (!sub.confirmed) {
              return { ...sub, confirmed: true };
            }
            return sub;
          });

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
          updatedInvestors[investorIndex].subscriptions = updatedInvestors[
            investorIndex
          ].subscriptions.map((sub) => {
            if (sub.allocated && !sub.distributed && sub.tokenAllocationId) {
              return { ...sub, distributed: true };
            }
            return sub;
          });

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
          // Update KYC status
          updatedInvestors[investorIndex].kycStatus = "Verified";
          updatedInvestors[investorIndex].kycExpiryDate = new Date(
            Date.now() + 180 * 24 * 60 * 60 * 1000,
          );

          // Update state
          setInvestors(updatedInvestors);

          toast({
            title: "Success",
            description: "KYC status updated",
          });
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
      />

      <DashboardSummary investors={investors} />

      {loading ? (
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

            // Import more sample data
            import("@/lib/sampleData").then(({ generateSampleInvestors }) => {
              const newInvestors = generateSampleInvestors(data.length || 5);

              // Add to existing investors
              setInvestors((prev) => [
                ...prev,
                ...newInvestors.map((investor) => ({
                  ...investor,
                  selected: false,
                })),
              ]);

              toast({
                title: "Success",
                description: `${newInvestors.length} investors imported successfully`,
              });
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

              // Add the new subscription
              updatedInvestor.subscriptions.push({
                id: `sub-new-${Date.now()}-${investor.id}`,
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
