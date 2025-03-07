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
import EditInvestorDialog from "./EditInvestorDialog";
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
import { supabase } from "@/lib/supabase";
import { toast } from "./ui/use-toast";
import { useCapTable } from "./CapTableContext";
import { v4 as uuidv4 } from "uuid";

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

import { CapTable } from "./CapTableSelector";
import { Project } from "./ProjectSelector";

const HomePage = () => {
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
  const [showEditInvestorDialog, setShowEditInvestorDialog] = useState(false);
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

  const [csvValidationErrors, setCSVValidationErrors] = useState<string[]>([]);
  const [csvValidationWarnings, setCSVValidationWarnings] = useState<string[]>(
    [],
  );
  const [isValidatingCSV, setIsValidatingCSV] = useState(false);

  const [subValidationErrors, setSubValidationErrors] = useState<string[]>([]);
  const [subValidationWarnings, setSubValidationWarnings] = useState<string[]>(
    [],
  );
  const [isValidatingSub, setIsValidatingSub] = useState(false);

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);
        const fetchedInvestors = await getInvestors();
        console.log("Fetched investors from Supabase:", fetchedInvestors);
        setInvestors(fetchedInvestors);
        setLoading(false);

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
      const selectedInvestors = investors.filter(
        (investor) =>
          investor.selected || investor.id === selectedInvestorForAllocation,
      );
      const updatedInvestors = [...investors];

      for (const investor of selectedInvestors) {
        const updatedInvestor = updatedInvestors.find(
          (i) => i.id === investor.id,
        );
        if (!updatedInvestor) continue;

        for (let i = 0; i < updatedInvestor.subscriptions.length; i++) {
          const subscription = updatedInvestor.subscriptions[i];
          if (!subscription.allocated && subscription.confirmed) {
            const allocation = allocations[i % allocations.length];
            if (allocation) {
              try {
                const allocationId = await createTokenAllocation(
                  subscription.id || "",
                  allocation.tokenType,
                  allocation.amount,
                );

                subscription.allocated = true;
                subscription.tokenType = allocation.tokenType;
                subscription.tokenAllocation = allocation.amount;
                subscription.tokenAllocationId = allocationId;
              } catch (allocError) {
                console.error(
                  "Error creating allocation in database:",
                  allocError,
                );
              }
            }
          }
        }
      }

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
      const updatedInvestors = [...investors];

      for (const allocation of bespokeAllocations) {
        const investorIndex = updatedInvestors.findIndex(
          (i) => i.id === allocation.investorId,
        );
        if (investorIndex === -1) continue;

        const investor = updatedInvestors[investorIndex];
        const unallocatedSubscriptions = investor.subscriptions.filter(
          (sub) => !sub.allocated && sub.confirmed,
        );

        if (unallocatedSubscriptions.length > 0) {
          const subscription = unallocatedSubscriptions[0];
          try {
            const allocationId = await createTokenAllocation(
              subscription.id || "",
              allocation.tokenType,
              allocation.amount,
            );

            subscription.allocated = true;
            subscription.tokenType = allocation.tokenType;
            subscription.tokenAllocation = allocation.amount;
            subscription.tokenAllocationId = allocationId;
          } catch (allocError) {
            console.error(
              "Error creating bespoke allocation in database:",
              allocError,
            );
          }
        }
      }

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
      try {
        const updatedInvestors = [...investors];
        let removedCount = 0;

        for (const investor of selectedInvestors) {
          const investorIndex = updatedInvestors.findIndex(
            (i) => i.id === investor.id,
          );
          if (investorIndex === -1) continue;

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
        const updatedInvestors = [...investors];
        let confirmedCount = 0;

        for (const investor of selectedInvestors) {
          const investorIndex = updatedInvestors.findIndex(
            (i) => i.id === investor.id,
          );
          if (investorIndex === -1) continue;

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
        const updatedInvestors = [...investors];

        for (const investor of selectedInvestors) {
          const index = updatedInvestors.findIndex((i) => i.id === investor.id);
          if (index !== -1) {
            updatedInvestors[index].kycStatus = "Verified";
            updatedInvestors[index].kycExpiryDate = new Date(
              Date.now() + 180 * 24 * 60 * 60 * 1000,
            );
          }
        }

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
        const updatedInvestors = [...investors];
        let expiredCount = 0;

        for (const investor of updatedInvestors) {
          if (investor.kycStatus === "Verified" && investor.kycExpiryDate) {
            if (investor.kycExpiryDate.getTime() < Date.now()) {
              investor.kycStatus = "Expired";
              expiredCount++;
            }
          }
        }

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
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          for (const sub of updatedInvestors[investorIndex].subscriptions) {
            if (!sub.confirmed && sub.id) {
              try {
                await confirmSubscription(sub.id);
                sub.confirmed = true;
              } catch (confirmError) {
                console.error(
                  "Error confirming subscription in database:",
                  confirmError,
                );
              }
            }
          }

          setInvestors(updatedInvestors);

          toast({
            title: "Success",
            description: "Subscription confirmed",
          });
        }
      } else if (action === "distribute") {
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          for (const sub of updatedInvestors[investorIndex].subscriptions) {
            if (sub.allocated && !sub.distributed && sub.tokenAllocationId) {
              try {
                const txHash = `0x${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
                await distributeTokens(sub.tokenAllocationId, txHash);
                sub.distributed = true;
              } catch (distributeError) {
                console.error(
                  "Error distributing tokens in database:",
                  distributeError,
                );
              }
            }
          }

          setInvestors(updatedInvestors);

          toast({
            title: "Success",
            description: "Tokens distributed",
          });
        }
      } else if (action === "screen") {
        const updatedInvestors = [...investors];
        const investorIndex = updatedInvestors.findIndex((i) => i.id === id);

        if (investorIndex !== -1) {
          const expiryDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

          try {
            await updateInvestorKYC(id, "Verified", expiryDate.toISOString());
            updatedInvestors[investorIndex].kycStatus = "Verified";
            updatedInvestors[investorIndex].kycExpiryDate = expiryDate;
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
      } else if (action === "edit") {
        const investor = investors.find((i) => i.id === id);
        if (investor) {
          setSelectedInvestor(investor);
          setShowEditInvestorDialog(true);
        }
      } else if (action === "remove_from_cap_table") {
        if (!selectedCapTable) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No cap table selected",
          });
          return;
        }

        try {
          // Remove investor from cap table in database
          const { error } = await supabase
            .from("cap_table_investors")
            .delete()
            .eq("cap_table_id", selectedCapTable.id)
            .eq("investor_id", id);

          if (error) throw error;

          // Remove investor from local state
          setInvestors((prev) => prev.filter((investor) => investor.id !== id));

          toast({
            title: "Success",
            description: "Investor removed from cap table",
          });
        } catch (removeError) {
          console.error("Error removing investor from cap table:", removeError);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to remove investor from cap table",
          });
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
          console.log("Search query:", query);
        }}
        onFilter={() => {
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
          if (!selectedProject || !selectedCapTable) {
            toast({
              variant: "destructive",
              title: "Selection Required",
              description:
                "Please select a project and cap table before uploading investors",
            });
            setShowCSVDialog(false);
            return;
          }
          try {
            setIsValidatingCSV(true);
            setCSVValidationErrors([]);
            setCSVValidationWarnings([]);

            console.log("Starting CSV upload process for file:", file.name);

            const {
              getOrCreateInvestorGroup,
              associateInvestorWithGroup,
              associateInvestorWithCapTable,
            } = await import("@/lib/investorGroupUtils");
            console.log(
              "Getting or creating investor group for project:",
              selectedProject.id,
            );
            const groupId = await getOrCreateInvestorGroup(selectedProject.id);
            console.log("Investor group ID:", groupId);

            const csvParser = await import("@/lib/csvParser");
            const { data, errors, warnings } =
              await csvParser.parseCSVFile(file);
            console.log("Raw parsed CSV data:", JSON.stringify(data, null, 2));
            console.log("CSV parsing errors:", errors);
            console.log("CSV parsing warnings:", warnings);

            // Verify we have actual data to process
            if (!data || data.length === 0) {
              setCSVValidationErrors(["No valid data found in CSV file"]);
              setIsValidatingCSV(false);
              toast({
                variant: "destructive",
                title: "CSV Error",
                description: "No valid data found in the uploaded file.",
              });
              return;
            }

            // Check the first row to see if we have the expected fields
            const firstRow = data[0];
            console.log("First row keys:", Object.keys(firstRow));
            if (!firstRow.name && !firstRow.email && !firstRow.wallet) {
              setCSVValidationErrors([
                "CSV headers not recognized. Make sure your CSV has headers: Name, Email, Type, Wallet, KYC Status, Last Updated",
              ]);
              setIsValidatingCSV(false);
              toast({
                variant: "destructive",
                title: "CSV Format Error",
                description: "Headers not recognized. Check the CSV format.",
              });
              return;
            }

            if (errors.length > 0) {
              setCSVValidationErrors(errors);
              toast({
                variant: "destructive",
                title: "CSV Validation Errors",
                description: `${errors.length} errors found in CSV file.`,
              });
              setIsValidatingCSV(false);
              return;
            }

            if (warnings.length > 0) {
              setCSVValidationWarnings(warnings);
              console.log("Warnings set:", warnings);
            }

            if (!data || data.length === 0) {
              throw new Error("No data parsed from CSV file");
            }

            const newInvestors: Investor[] = [];
            const processingErrors: string[] = [];

            console.log("Processing", data.length, "rows from CSV");
            for (let i = 0; i < data.length; i++) {
              const row = data[i];
              console.log(
                `Processing row ${i + 1}:`,
                JSON.stringify(row, null, 2),
              );

              try {
                // Generate a unique investor_id first
                const investor_id = uuidv4();
                console.log(`Generated investor_id: ${investor_id}`);

                // Log the exact row data to debug field access
                console.log("Row data for investor creation:", row);
                console.log("Row name field:", row.name);
                console.log("Row email field:", row.email);
                console.log("Row type field:", row.type);
                console.log("Row kyc status field:", row["kyc status"]);
                console.log("Row wallet field:", row.wallet);

                // Make sure we have actual values and not empty strings
                const name =
                  row.name && row.name.trim() !== ""
                    ? row.name
                    : "Unknown Investor";
                const email =
                  row.email && row.email.trim() !== ""
                    ? row.email
                    : "unknown@example.com";
                const type =
                  row.type && row.type.trim() !== "" ? row.type : "Individual";
                const kycStatus =
                  row["kyc status"] && row["kyc status"].trim() !== ""
                    ? row["kyc status"]
                    : "Pending";
                const wallet =
                  row.wallet && row.wallet.trim() !== ""
                    ? row.wallet
                    : "0x0000000000000000000000000000000000000000";

                const investorDataPayload = {
                  name: name,
                  email: email,
                  type: type,
                  kyc_status: kycStatus,
                  wallet_address: wallet,
                  kyc_expiry_date:
                    kycStatus === "Verified"
                      ? new Date(
                          Date.now() + 180 * 24 * 60 * 60 * 1000,
                        ).toISOString()
                      : null,
                  investor_id: investor_id,
                };
                console.log(
                  "Inserting investor into Supabase:",
                  JSON.stringify(investorDataPayload, null, 2),
                );

                const { data: investorData, error: investorError } =
                  await supabase
                    .from("investors")
                    .insert(investorDataPayload)
                    .select()
                    .single();

                if (investorError) {
                  console.error(`Row ${i + 1} insert error:`, investorError);
                  console.log(
                    "Full error details:",
                    JSON.stringify(investorError, null, 2),
                  );
                  throw new Error(investorError.message);
                }
                console.log(`Investor inserted with ID: ${investorData.id}`);

                console.log(
                  `Associating investor ${investorData.id} with group ${groupId}, investor_id: ${investorData.investor_id}`,
                );
                await associateInvestorWithGroup(investorData.id, groupId);

                console.log(
                  `Associating investor ${investorData.id} with cap table ${selectedCapTable.id}`,
                );
                await associateInvestorWithCapTable(
                  investorData.id,
                  selectedCapTable.id,
                );

                const newInvestor = {
                  id: investorData.investor_id,
                  name: investorData.name,
                  email: investorData.email,
                  type: investorData.type,
                  kycStatus: investorData.kyc_status,
                  wallet: investorData.wallet_address,
                  kycExpiryDate: investorData.kyc_expiry_date
                    ? new Date(investorData.kyc_expiry_date)
                    : undefined,
                  selected: false,
                  subscriptions: [],
                };
                console.log("Adding new investor to state:", newInvestor);
                newInvestors.push(newInvestor);
              } catch (err: any) {
                const errorMsg = `Row ${i + 1}: ${err.message}`;
                console.error(errorMsg);
                processingErrors.push(errorMsg);
              }
            }

            setIsValidatingCSV(false);

            if (processingErrors.length > 0) {
              setCSVValidationErrors(processingErrors);
              toast({
                variant: "warning",
                title: "Partial Import Success",
                description: `Imported ${newInvestors.length} investors with ${processingErrors.length} errors.`,
              });
            } else if (newInvestors.length > 0) {
              toast({
                title: "Success",
                description: `${newInvestors.length} investors imported successfully to ${selectedCapTable?.name}`,
              });
            } else {
              toast({
                variant: "warning",
                title: "No Data Imported",
                description: "No valid investor data was found in the CSV.",
              });
            }

            if (newInvestors.length > 0) {
              console.log(
                "Updating investors state with",
                newInvestors.length,
                "new investors",
              );
              setInvestors((prev) => {
                const updated = [...prev, ...newInvestors];
                console.log("New investors state:", updated);
                return updated;
              });
            } else {
              console.log("No new investors to add to state");
            }

            setShowCSVDialog(false);
          } catch (error: any) {
            console.error("Fatal error during upload:", error);
            setIsValidatingCSV(false);
            setCSVValidationErrors([`Fatal error: ${error.message}`]);
            toast({
              variant: "destructive",
              title: "Error",
              description: `Failed to import investors: ${error.message}`,
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

            const { data, errors, warnings } = await parseCSV(
              file,
              "subscription",
            );

            setSubValidationErrors(errors);
            setSubValidationWarnings(warnings);

            if (errors.length > 0) {
              setIsValidatingSub(false);
              return;
            }

            setIsValidatingSub(false);
            setShowSubscriptionUploadDialog(false);

            const updatedInvestors = [...investors];
            const successCount =
              data.length || Math.floor(Math.random() * 5) + 3;
            const currencies = ["USD", "EUR", "GBP"];
            let addedCount = 0;

            if (data.length > 0) {
              for (const row of data) {
                const investorIndex = updatedInvestors.findIndex(
                  (inv) =>
                    inv.name.toLowerCase() ===
                    row["investor name"]?.toLowerCase(),
                );

                if (investorIndex !== -1) {
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

            if (addedCount === 0) {
              for (let i = 0; i < successCount; i++) {
                const randomIndex = Math.floor(
                  Math.random() * updatedInvestors.length,
                );
                const investor = updatedInvestors[randomIndex];

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

            for (const investor of selectedInvestors) {
              const updatedInvestor = updatedInvestors.find(
                (i) => i.id === investor.id,
              );
              if (!updatedInvestor) continue;

              const subscriptionId =
                subscriptionData.subscriptionId ||
                `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

              try {
                const newSubId = await createSubscription(
                  investor.id,
                  subscriptionId,
                  subscriptionData.fiatAmount.amount,
                  subscriptionData.fiatAmount.currency,
                  false,
                  subscriptionData.notes,
                  new Date().toISOString(),
                );

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
              }
            }

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
        <>
          <InvestorDetailsDialog
            open={showInvestorDialog}
            onOpenChange={(open) => {
              setShowInvestorDialog(open);
              if (!open) setSelectedInvestor(null);
            }}
            investor={selectedInvestor}
          />

          <EditInvestorDialog
            open={showEditInvestorDialog}
            onOpenChange={(open) => {
              setShowEditInvestorDialog(open);
              if (!open) setSelectedInvestor(null);
            }}
            investor={selectedInvestor}
            onUpdate={(updatedInvestor) => {
              // Update investor in local state
              setInvestors((prev) =>
                prev.map((inv) =>
                  inv.id === updatedInvestor.id ? updatedInvestor : inv,
                ),
              );
            }}
            onRemoveFromCapTable={(investorId) => {
              if (!selectedCapTable) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "No cap table selected",
                });
                return;
              }

              // Remove investor from cap table in database
              supabase
                .from("cap_table_investors")
                .delete()
                .eq("cap_table_id", selectedCapTable.id)
                .eq("investor_id", investorId)
                .then(({ error }) => {
                  if (error) {
                    console.error(
                      "Error removing investor from cap table:",
                      error,
                    );
                    toast({
                      variant: "destructive",
                      title: "Error",
                      description: "Failed to remove investor from cap table",
                    });
                    return;
                  }

                  // Remove investor from local state
                  setInvestors((prev) =>
                    prev.filter((investor) => investor.id !== investorId),
                  );

                  toast({
                    title: "Success",
                    description: "Investor removed from cap table",
                  });
                });
            }}
          />
        </>
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
          const selectedInvestors = investors.filter((i) =>
            investorIds.includes(i.id),
          );
          const tokenTypes = new Set<string>();
          let totalTokens = 0;

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

          setPendingDistributionData({
            investorIds,
            totalTokens,
            tokenTypes: Array.from(tokenTypes),
          });

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

            for (const investorId of selectedInvestorIds) {
              const investorIndex = updatedInvestors.findIndex(
                (i) => i.id === investorId,
              );
              if (investorIndex === -1) continue;

              const distributionsToProcess = updatedInvestors[
                investorIndex
              ].subscriptions.filter(
                (sub) =>
                  sub.allocated && !sub.distributed && sub.tokenAllocationId,
              ).length;

              if (distributionsToProcess > 0) {
                await new Promise((resolve) =>
                  setTimeout(resolve, 100 * distributionsToProcess),
                );
              }

              updatedInvestors[investorIndex].subscriptions = updatedInvestors[
                investorIndex
              ].subscriptions.map((sub) => {
                if (
                  sub.allocated &&
                  !sub.distributed &&
                  sub.tokenAllocationId
                ) {
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

            setInvestors(updatedInvestors);

            toast({
              title: "Distribution Complete",
              description: `${totalDistributed.toLocaleString()} tokens distributed to ${selectedInvestorIds.length} investors in ${transactionCount} transactions`,
            });

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
            const selectedInvestors = investors.filter(
              (investor) => investor.selected,
            );
            const updatedInvestors = [...investors];

            for (const investor of selectedInvestors) {
              const updatedInvestor = updatedInvestors.find(
                (i) => i.id === investor.id,
              );
              if (!updatedInvestor) continue;

              let allocationIndex = 0;
              for (let i = 0; i < updatedInvestor.subscriptions.length; i++) {
                const subscription = updatedInvestor.subscriptions[i];
                if (!subscription.allocated && subscription.confirmed) {
                  const allocation =
                    allocations[allocationIndex % allocations.length];
                  allocationIndex++;

                  if (allocation) {
                    subscription.allocated = true;
                    subscription.tokenType = allocation.tokenType;
                    subscription.tokenAllocation = allocation.amount;
                    subscription.tokenAllocationId = `alloc-${Date.now()}-${i}`;
                  }
                }
              }
            }

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
            const updatedInvestors = [...investors];
            const selectedInvestorIds = investors
              .filter((i) => i.selected)
              .map((i) => i.id);
            let removedCount = 0;

            for (const investorId of selectedInvestorIds) {
              const investorIndex = updatedInvestors.findIndex(
                (i) => i.id === investorId,
              );
              if (investorIndex === -1) continue;

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
            const updatedInvestors = [...investors];

            for (const investor of updatedInvestors) {
              investor.subscriptions = investor.subscriptions.map((sub) => {
                if (sub.id && subscriptionIds.includes(sub.id)) {
                  return { ...sub, confirmed: true };
                }
                return sub;
              });
            }

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
            const updatedInvestors = [...investors];

            for (const investor of updatedInvestors) {
              investor.subscriptions = investor.subscriptions.filter(
                (sub) => !sub.id || !subscriptionIds.includes(sub.id),
              );
            }

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
            const updatedInvestors = [...investors];

            const investorIndex = updatedInvestors.findIndex(
              (i) => i.id === selectedSubscriptionInvestorId,
            );
            if (investorIndex !== -1) {
              const subscriptionIndex = updatedInvestors[
                investorIndex
              ].subscriptions.findIndex((s) => s.id === updatedSubscription.id);

              if (subscriptionIndex !== -1) {
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
            const updatedInvestors = [...investors];

            const investorIndex = updatedInvestors.findIndex(
              (i) => i.id === selectedSubscriptionInvestorId,
            );
            if (investorIndex !== -1) {
              updatedInvestors[investorIndex].subscriptions = updatedInvestors[
                investorIndex
              ].subscriptions.filter((s) => s.id !== subscriptionId);
            }

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
            const csv = generateCSVFromInvestors(
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
