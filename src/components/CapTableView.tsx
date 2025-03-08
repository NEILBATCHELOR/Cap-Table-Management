import React, { useState, useMemo } from "react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import { ArrowUpDown, Download, Filter, Search } from "lucide-react";
import { Input } from "./ui/input";
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";
import CapTableRow from "./CapTableRow";
import FilterDialog from "./FilterDialog";

interface CapTableViewProps {
  investors: Investor[];
  onSelectAll?: (selected: boolean) => void;
  onSelectRow?: (investorId: string, tokenType?: TokenType) => void;
  onAction?: (investorId: string, tokenType: TokenType, action: string) => void;
  onExport?: (data: any[]) => void;
}

const CapTableView = ({
  investors = [],
  onSelectAll = () => {},
  onSelectRow = () => {},
  onAction = () => {},
  onExport = () => {},
}: CapTableViewProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filters, setFilters] = useState({
    types: [],
    kycStatuses: [],
    subscriptionStatuses: [],
    tokenStatuses: [],
  });
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);

  // Transform investors data to show each investor-token pair as a row
  const tableRows = useMemo(() => {
    const rows: Array<{
      investorId: string;
      investorName: string;
      tokenType: TokenType;
      subscribedAmount: number;
      confirmed: boolean;
      allocatedAmount: number;
      allocationConfirmed: boolean;
      distributed: boolean;
      selected: boolean;
      kycStatus: string;
      email: string;
      wallet: string;
    }> = [];

    investors.forEach((investor) => {
      // Group subscriptions by token type
      const tokenTypeMap = new Map<TokenType, any>();

      investor.subscriptions.forEach((subscription) => {
        if (subscription.tokenType) {
          const tokenType = subscription.tokenType;

          if (!tokenTypeMap.has(tokenType)) {
            tokenTypeMap.set(tokenType, {
              subscribedAmount: 0,
              confirmed: false,
              allocatedAmount: 0,
              allocationConfirmed: false,
              distributed: false,
            });
          }

          const tokenData = tokenTypeMap.get(tokenType);
          tokenData.subscribedAmount += subscription.fiatSubscription.amount;
          tokenData.confirmed = tokenData.confirmed || subscription.confirmed;
          tokenData.allocatedAmount += subscription.tokenAllocation || 0;
          tokenData.allocationConfirmed =
            tokenData.allocationConfirmed || subscription.allocated;
          tokenData.distributed =
            tokenData.distributed || subscription.distributed;
          tokenTypeMap.set(tokenType, tokenData);
        }
      });

      // If no subscriptions with token types, add a default row
      if (tokenTypeMap.size === 0 && investor.subscriptions.length > 0) {
        rows.push({
          investorId: investor.id,
          investorName: investor.name,
          tokenType: "ERC-20" as TokenType,
          subscribedAmount: investor.subscriptions.reduce(
            (sum, sub) => sum + sub.fiatSubscription.amount,
            0,
          ),
          confirmed: investor.subscriptions.some((sub) => sub.confirmed),
          allocatedAmount: 0,
          allocationConfirmed: false,
          distributed: false,
          selected: investor.selected || false,
          kycStatus: investor.kycStatus,
          email: investor.email,
          wallet: investor.wallet,
        });
      } else {
        // Add a row for each token type
        tokenTypeMap.forEach((tokenData, tokenType) => {
          rows.push({
            investorId: investor.id,
            investorName: investor.name,
            tokenType,
            subscribedAmount: tokenData.subscribedAmount,
            confirmed: tokenData.confirmed,
            allocatedAmount: tokenData.allocatedAmount,
            allocationConfirmed: tokenData.allocationConfirmed,
            distributed: tokenData.distributed,
            selected: investor.selected || false,
            kycStatus: investor.kycStatus,
            email: investor.email,
            wallet: investor.wallet,
          });
        });
      }

      // If no subscriptions at all, add an empty row
      if (investor.subscriptions.length === 0) {
        rows.push({
          investorId: investor.id,
          investorName: investor.name,
          tokenType: "ERC-20" as TokenType,
          subscribedAmount: 0,
          confirmed: false,
          allocatedAmount: 0,
          allocationConfirmed: false,
          distributed: false,
          selected: investor.selected || false,
          kycStatus: investor.kycStatus,
          email: investor.email,
          wallet: investor.wallet,
        });
      }
    });

    return rows;
  }, [investors]);

  // Apply filters and search
  const filteredRows = useMemo(() => {
    return tableRows.filter((row) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        row.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.wallet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.tokenType.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Apply other filters as needed
      // KYC Status filter
      const matchesKYC =
        filters.kycStatuses.length === 0 ||
        filters.kycStatuses.includes(row.kycStatus);
      if (!matchesKYC) return false;

      // Subscription Status filter
      if (filters.subscriptionStatuses.length > 0) {
        const matchesSubscription =
          (filters.subscriptionStatuses.includes("Confirmed") &&
            row.confirmed) ||
          (filters.subscriptionStatuses.includes("Unconfirmed") &&
            !row.confirmed);

        if (!matchesSubscription) return false;
      }

      // Token Status filter
      if (filters.tokenStatuses.length > 0) {
        const matchesTokenStatus =
          (filters.tokenStatuses.includes("Allocated") &&
            row.allocationConfirmed) ||
          (filters.tokenStatuses.includes("Unallocated") &&
            !row.allocationConfirmed) ||
          (filters.tokenStatuses.includes("Distributed") && row.distributed) ||
          (filters.tokenStatuses.includes("Undistributed") && !row.distributed);

        if (!matchesTokenStatus) return false;
      }

      return true;
    });
  }, [tableRows, searchTerm, filters]);

  // Apply sorting
  const sortedRows = useMemo(() => {
    if (!sortConfig) return filteredRows;

    return [...filteredRows].sort((a, b) => {
      if (sortConfig.key === "investorName") {
        return sortConfig.direction === "ascending"
          ? a.investorName.localeCompare(b.investorName)
          : b.investorName.localeCompare(a.investorName);
      }
      if (sortConfig.key === "tokenType") {
        return sortConfig.direction === "ascending"
          ? a.tokenType.localeCompare(b.tokenType)
          : b.tokenType.localeCompare(a.tokenType);
      }
      if (sortConfig.key === "subscribedAmount") {
        return sortConfig.direction === "ascending"
          ? a.subscribedAmount - b.subscribedAmount
          : b.subscribedAmount - a.subscribedAmount;
      }
      if (sortConfig.key === "allocatedAmount") {
        return sortConfig.direction === "ascending"
          ? a.allocatedAmount - b.allocatedAmount
          : b.allocatedAmount - a.allocatedAmount;
      }
      return 0;
    });
  }, [filteredRows, sortConfig]);

  const handleSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const allSelected =
    sortedRows.length > 0 && sortedRows.every((row) => row.selected);

  const activeFilterCount =
    filters.types.length +
    filters.kycStatuses.length +
    filters.subscriptionStatuses.length +
    filters.tokenStatuses.length;

  // Calculate summary statistics
  const tokenSummary = useMemo(() => {
    const summary: Record<string, { toMint: number; minted: boolean }> = {};

    sortedRows.forEach((row) => {
      if (!summary[row.tokenType]) {
        summary[row.tokenType] = { toMint: 0, minted: false };
      }

      if (row.confirmed) {
        summary[row.tokenType].toMint += row.subscribedAmount;
      }

      // Assuming a token is minted if it's allocated
      if (row.allocationConfirmed) {
        summary[row.tokenType].minted = true;
      }
    });

    return summary;
  }, [sortedRows]);

  return (
    <div className="w-full bg-background border rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search investors or tokens..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowFilterDialog(true)}
            >
              <Filter className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onExport(sortedRows.filter((row) => row.selected))}
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[48px_2fr_1.5fr_1.5fr_1fr_1.5fr_1fr_1fr_80px] gap-4 items-center p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(checked as boolean)}
          />
        </div>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("investorName")}
        >
          Investor Name
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("tokenType")}
        >
          Token Type
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("subscribedAmount")}
        >
          Subscribed Amount
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <div className="font-medium">Confirmed</div>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("allocatedAmount")}
        >
          Allocated Amount
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <div className="font-medium">Allocation Confirmed</div>
        <div className="font-medium">Distributed</div>
        <div className="font-medium">Actions</div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedRows.map((row, index) => (
          <CapTableRow
            key={`${row.investorId}-${row.tokenType}-${index}`}
            row={row}
            onSelect={() => onSelectRow(row.investorId, row.tokenType)}
            onAction={(action) =>
              onAction(row.investorId, row.tokenType, action)
            }
          />
        ))}
      </div>

      {sortedRows.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No data found. Add investors or adjust your search filters.
        </div>
      )}

      {/* Summary Section */}
      {Object.keys(tokenSummary).length > 0 && (
        <div className="p-4 mt-4 bg-gray-50 rounded-md border border-gray-200">
          <h3 className="text-sm font-medium mb-2">Token Summary</h3>
          <div className="space-y-2">
            {Object.entries(tokenSummary).map(([tokenType, data]) => (
              <div key={tokenType} className="flex justify-between text-sm">
                <span>
                  {tokenType}: {data.toMint.toLocaleString()} to mint
                </span>
                <span>Minted: {data.minted ? "Yes" : "No"}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <FilterDialog
        open={showFilterDialog}
        onOpenChange={setShowFilterDialog}
        filters={filters}
        onApplyFilters={setFilters}
        onResetFilters={() =>
          setFilters({
            types: [],
            kycStatuses: [],
            subscriptionStatuses: [],
            tokenStatuses: [],
          })
        }
      />
    </div>
  );
};

export default CapTableView;
