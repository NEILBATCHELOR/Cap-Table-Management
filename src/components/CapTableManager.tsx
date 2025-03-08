import React, { useState, useEffect } from "react";
import { useCapTable } from "./CapTableContext";
import { InvestorDataService } from "@/lib/investorDataService";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Plus, Upload, Download, Filter, RefreshCw } from "lucide-react";
import CapTableDataGrid from "./CapTableDataGrid";
import InvestorForm from "./InvestorForm";
import AllocationForm from "./AllocationForm";
import DistributionForm from "./DistributionForm";
import DashboardSummary from "./DashboardSummary";
import { useToast } from "./ui/use-toast";
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";
import { CSVImportService } from "@/lib/csvImportService";
import { downloadCSV } from "@/lib/csv";

const CapTableManager = () => {
  const { toast } = useToast();
  const {
    projects,
    selectedProject,
    capTables,
    selectedCapTable,
    setSelectedProject,
    setSelectedCapTable,
    loading: contextLoading,
  } = useCapTable();

  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("investors");
  const [showAddInvestor, setShowAddInvestor] = useState(false);
  const [showAddAllocation, setShowAddAllocation] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(
    null,
  );
  const [selectedInvestors, setSelectedInvestors] = useState<Investor[]>([]);

  // Fetch investors when the selected cap table changes
  useEffect(() => {
    if (selectedCapTable) {
      fetchInvestors();
    }
  }, [selectedCapTable]);

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

  const handleAddInvestor = async (investorData: any) => {
    try {
      if (!selectedCapTable) {
        toast({
          variant: "destructive",
          title: "No Cap Table Selected",
          description: "Please select a cap table before adding an investor",
        });
        return;
      }

      const investorId = await InvestorDataService.createInvestor({
        name: investorData.name,
        email: investorData.email,
        type: investorData.type || "Individual",
        kyc_status: investorData.kycStatus || "Pending",
        wallet_address:
          investorData.wallet || "0x0000000000000000000000000000000000000000",
        kyc_expiry_date: investorData.kycExpiryDate,
      });

      // Associate the investor with the selected cap table
      await InvestorDataService.addInvestorToCapTable(
        investorId,
        selectedCapTable.id,
      );

      // Refresh the investors list
      await fetchInvestors();

      toast({
        title: "Success",
        description: `Investor ${investorData.name} added successfully`,
      });

      setShowAddInvestor(false);
    } catch (error) {
      console.error("Error adding investor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add investor",
      });
    }
  };

  const handleUpdateInvestor = async (investorId: string, updates: any) => {
    try {
      await InvestorDataService.updateInvestor(investorId, updates);

      // Update the investor in the local state
      setInvestors((prev) =>
        prev.map((investor) =>
          investor.id === investorId ? { ...investor, ...updates } : investor,
        ),
      );

      toast({
        title: "Success",
        description: "Investor updated successfully",
      });
    } catch (error) {
      console.error("Error updating investor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update investor",
      });
    }
  };

  const handleRemoveInvestor = async (investorId: string) => {
    try {
      if (!selectedCapTable) {
        toast({
          variant: "destructive",
          title: "No Cap Table Selected",
          description: "Please select a cap table",
        });
        return;
      }

      await InvestorDataService.removeInvestorFromCapTable(
        investorId,
        selectedCapTable.id,
      );

      // Remove the investor from the local state
      setInvestors((prev) =>
        prev.filter((investor) => investor.id !== investorId),
      );

      toast({
        title: "Success",
        description: "Investor removed successfully",
      });
    } catch (error) {
      console.error("Error removing investor:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to remove investor",
      });
    }
  };

  const handleAddAllocation = async (
    investorId: string,
    allocationData: any,
  ) => {
    try {
      const subscriptionId = await InvestorDataService.createSubscription({
        investor_id: investorId,
        subscription_id: allocationData.subscriptionId || `SUB-${Date.now()}`,
        fiat_amount: allocationData.amount,
        currency: allocationData.currency,
        confirmed: true,
        project_id: selectedProject?.id,
      });

      const allocationId = await InvestorDataService.createTokenAllocation({
        subscription_id: subscriptionId,
        token_type: allocationData.tokenType,
        token_amount: allocationData.tokenAmount,
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
                  subscriptionId:
                    allocationData.subscriptionId || `SUB-${Date.now()}`,
                  fiatSubscription: {
                    amount: allocationData.amount,
                    currency: allocationData.currency,
                  },
                  tokenType: allocationData.tokenType,
                  tokenAllocation: allocationData.tokenAmount,
                  tokenAllocationId: allocationId,
                  confirmed: true,
                  allocated: true,
                  distributed: false,
                },
              ],
            };
          }
          return investor;
        }),
      );

      toast({
        title: "Success",
        description: "Allocation added successfully",
      });

      setShowAddAllocation(false);
    } catch (error) {
      console.error("Error adding allocation:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to add allocation",
      });
    }
  };

  const handleDistributeTokens = async (allocationIds: string[]) => {
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

      toast({
        title: "Success",
        description: `Distributed tokens to ${result.distributed} allocations`,
      });

      setShowDistribution(false);
    } catch (error) {
      console.error("Error distributing tokens:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to distribute tokens",
      });
    }
  };

  const handleExportData = () => {
    try {
      const exportData = investors.map((investor) => ({
        Name: investor.name,
        Email: investor.email,
        Type: investor.type,
        KYC_Status: investor.kycStatus,
        Wallet: investor.wallet,
        Subscriptions: investor.subscriptions.length,
        Allocated_Tokens: investor.subscriptions.reduce(
          (sum, sub) => sum + (sub.tokenAllocation || 0),
          0,
        ),
        Distributed_Tokens: investor.subscriptions.reduce(
          (sum, sub) =>
            sum +
            (sub.distributed && sub.tokenAllocation ? sub.tokenAllocation : 0),
          0,
        ),
      }));

      const csvContent = [
        Object.keys(exportData[0] || {}),
        ...exportData.map((row) => Object.values(row)),
      ];

      downloadCSV(
        csvContent,
        `cap-table-export-${new Date().toISOString().split("T")[0]}.csv`,
      );

      toast({
        title: "Export Complete",
        description: `Exported data for ${exportData.length} investors`,
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data",
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      if (!selectedCapTable) {
        toast({
          variant: "destructive",
          title: "No Cap Table Selected",
          description: "Please select a cap table before importing data",
        });
        return;
      }

      const { data, errors, warnings } =
        await CSVImportService.parseInvestorCSV(file);

      if (errors.length > 0) {
        toast({
          variant: "destructive",
          title: "Import Errors",
          description: `${errors.length} errors found in the import file`,
        });
        return;
      }

      // Process the imported data
      for (const investorData of data) {
        const investorId = await InvestorDataService.createInvestor({
          name: investorData.name,
          email: investorData.email,
          type: investorData.type || "Individual",
          kyc_status: "Pending",
          wallet_address:
            investorData.wallet || "0x0000000000000000000000000000000000000000",
        });

        await InvestorDataService.addInvestorToCapTable(
          investorId,
          selectedCapTable.id,
        );
      }

      // Refresh the investors list
      await fetchInvestors();

      toast({
        title: "Import Complete",
        description: `Imported ${data.length} investors successfully`,
      });
    } catch (error) {
      console.error("Error importing data:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import data",
      });
    }
  };

  const handleRowSelectionChange = (selectedRows: Investor[]) => {
    setSelectedInvestors(selectedRows);
  };

  const handleRowClick = (investor: Investor) => {
    setSelectedInvestor(investor);
  };

  return (
    <div className="w-full space-y-6">
      <DashboardSummary investors={investors} />

      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddInvestor(true)}
            disabled={!selectedCapTable}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Investor
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddAllocation(true)}
            disabled={!selectedInvestor && selectedInvestors.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Allocation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDistribution(true)}
            disabled={selectedInvestors.length === 0}
          >
            <Plus className="h-4 w-4 mr-1" />
            Distribute
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportData}
            disabled={investors.length === 0}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("import-file")?.click()}
            disabled={!selectedCapTable}
          >
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <input
            id="import-file"
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleImportData(e.target.files[0]);
                e.target.value = ""; // Reset the input
              }
            }}
          />
          <Button variant="outline" size="sm" onClick={fetchInvestors}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="investors">Investors</TabsTrigger>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="distributions">Distributions</TabsTrigger>
        </TabsList>

        <TabsContent value="investors" className="mt-0">
          <CapTableDataGrid
            investors={investors}
            loading={loading || contextLoading}
            view="investors"
            onRowSelectionChange={handleRowSelectionChange}
            onRowClick={handleRowClick}
            onUpdateInvestor={handleUpdateInvestor}
            onRemoveInvestor={handleRemoveInvestor}
          />
        </TabsContent>

        <TabsContent value="allocations" className="mt-0">
          <CapTableDataGrid
            investors={investors}
            loading={loading || contextLoading}
            view="allocations"
            onRowSelectionChange={handleRowSelectionChange}
            onRowClick={handleRowClick}
            onUpdateInvestor={handleUpdateInvestor}
            onRemoveInvestor={handleRemoveInvestor}
          />
        </TabsContent>

        <TabsContent value="distributions" className="mt-0">
          <CapTableDataGrid
            investors={investors}
            loading={loading || contextLoading}
            view="distributions"
            onRowSelectionChange={handleRowSelectionChange}
            onRowClick={handleRowClick}
            onUpdateInvestor={handleUpdateInvestor}
            onRemoveInvestor={handleRemoveInvestor}
          />
        </TabsContent>
      </Tabs>

      {/* Forms and Dialogs */}
      <InvestorForm
        open={showAddInvestor}
        onOpenChange={setShowAddInvestor}
        onSubmit={handleAddInvestor}
      />

      <AllocationForm
        open={showAddAllocation}
        onOpenChange={setShowAddAllocation}
        investor={selectedInvestor}
        investors={
          selectedInvestors.length > 0
            ? selectedInvestors
            : selectedInvestor
              ? [selectedInvestor]
              : []
        }
        onSubmit={handleAddAllocation}
      />

      <DistributionForm
        open={showDistribution}
        onOpenChange={setShowDistribution}
        investors={
          selectedInvestors.length > 0
            ? selectedInvestors
            : selectedInvestor
              ? [selectedInvestor]
              : []
        }
        onSubmit={handleDistributeTokens}
      />
    </div>
  );
};

export default CapTableManager;
