import React, { useState, useMemo } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Search, Filter, Download, ArrowUpDown } from "lucide-react";
import InvestorTableRow from "./InvestorTableRow";
import FilterDialog from "./FilterDialog";
import { Badge } from "./ui/badge";

import { Investor } from "@/types/investor";

interface InvestorTableProps {
  investors?: Array<Investor>;
  onSelectAll?: (selected: boolean) => void;
  onSelectInvestor?: (id: string) => void;
  onViewInvestor?: (id: string) => void;
  onAction?: (
    id: string,
    action:
      | "confirm"
      | "reject"
      | "distribute"
      | "screen"
      | "allocate"
      | "remove_allocation",
  ) => void;
  onExport?: (investors: Investor[]) => void;
}

const InvestorTable = ({
  investors = [],
  onSelectAll = () => {},
  onSelectInvestor = () => {},
  onViewInvestor = () => {},
  onAction = () => {},
  onExport = () => {},
}: InvestorTableProps) => {
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

  // Apply filters and search
  const filteredInvestors = useMemo(() => {
    return investors.filter((investor) => {
      // Search filter
      const matchesSearch =
        searchTerm === "" ||
        investor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        investor.wallet.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Type filter
      const matchesType =
        filters.types.length === 0 || filters.types.includes(investor.type);
      if (!matchesType) return false;

      // KYC Status filter
      const matchesKYC =
        filters.kycStatuses.length === 0 ||
        filters.kycStatuses.includes(investor.kycStatus);
      if (!matchesKYC) return false;

      // Subscription Status filter
      if (filters.subscriptionStatuses.length > 0) {
        const hasConfirmed = investor.subscriptions.some(
          (sub) => sub.confirmed,
        );
        const hasUnconfirmed = investor.subscriptions.some(
          (sub) => !sub.confirmed,
        );

        const matchesSubscription =
          (filters.subscriptionStatuses.includes("Confirmed") &&
            hasConfirmed) ||
          (filters.subscriptionStatuses.includes("Unconfirmed") &&
            hasUnconfirmed);

        if (!matchesSubscription) return false;
      }

      // Token Status filter
      if (filters.tokenStatuses.length > 0) {
        const hasAllocated = investor.subscriptions.some(
          (sub) => sub.allocated,
        );
        const hasUnallocated = investor.subscriptions.some(
          (sub) => !sub.allocated,
        );
        const hasDistributed = investor.subscriptions.some(
          (sub) => sub.distributed,
        );
        const hasUndistributed = investor.subscriptions.some(
          (sub) => sub.allocated && !sub.distributed,
        );

        const matchesTokenStatus =
          (filters.tokenStatuses.includes("Allocated") && hasAllocated) ||
          (filters.tokenStatuses.includes("Unallocated") && hasUnallocated) ||
          (filters.tokenStatuses.includes("Distributed") && hasDistributed) ||
          (filters.tokenStatuses.includes("Undistributed") && hasUndistributed);

        if (!matchesTokenStatus) return false;
      }

      return true;
    });
  }, [investors, searchTerm, filters]);

  // Apply sorting
  const sortedInvestors = useMemo(() => {
    if (!sortConfig) return filteredInvestors;

    return [...filteredInvestors].sort((a, b) => {
      if (sortConfig.key === "name") {
        return sortConfig.direction === "ascending"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === "email") {
        return sortConfig.direction === "ascending"
          ? a.email.localeCompare(b.email)
          : b.email.localeCompare(a.email);
      }
      if (sortConfig.key === "type") {
        return sortConfig.direction === "ascending"
          ? a.type.localeCompare(b.type)
          : b.type.localeCompare(a.type);
      }
      if (sortConfig.key === "kycStatus") {
        return sortConfig.direction === "ascending"
          ? a.kycStatus.localeCompare(b.kycStatus)
          : b.kycStatus.localeCompare(a.kycStatus);
      }
      if (sortConfig.key === "subscription") {
        const aTotal = a.subscriptions.reduce(
          (sum, sub) => sum + sub.fiatSubscription.amount,
          0,
        );
        const bTotal = b.subscriptions.reduce(
          (sum, sub) => sum + sub.fiatSubscription.amount,
          0,
        );
        return sortConfig.direction === "ascending"
          ? aTotal - bTotal
          : bTotal - aTotal;
      }
      if (sortConfig.key === "tokens") {
        const aTotal = a.subscriptions.reduce(
          (sum, sub) => sum + (sub.tokenAllocation || 0),
          0,
        );
        const bTotal = b.subscriptions.reduce(
          (sum, sub) => sum + (sub.tokenAllocation || 0),
          0,
        );
        return sortConfig.direction === "ascending"
          ? aTotal - bTotal
          : bTotal - aTotal;
      }
      return 0;
    });
  }, [filteredInvestors, sortConfig]);

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
    sortedInvestors.length > 0 && sortedInvestors.every((i) => i.selected);

  const activeFilterCount =
    filters.types.length +
    filters.kycStatuses.length +
    filters.subscriptionStatuses.length +
    filters.tokenStatuses.length;

  return (
    <div className="w-full bg-background border rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search investors..."
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
              onClick={() =>
                onExport(sortedInvestors.filter((i) => i.selected))
              }
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[48px_2fr_2fr_1fr_1fr_2fr_1fr_1fr_80px] gap-4 items-center p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-center">
          <Checkbox
            checked={allSelected}
            onCheckedChange={(checked) => onSelectAll(checked as boolean)}
          />
        </div>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("name")}
        >
          Name
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("email")}
        >
          Email
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("type")}
        >
          Type
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors"
          onClick={() => handleSort("kycStatus")}
        >
          KYC Status
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <div className="font-medium">Wallet</div>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors justify-end"
          onClick={() => handleSort("subscription")}
        >
          Subscription
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <button
          className="font-medium flex items-center hover:text-primary transition-colors justify-end"
          onClick={() => handleSort("tokens")}
        >
          Tokens
          <ArrowUpDown className="ml-1 h-4 w-4" />
        </button>
        <div className="font-medium">Actions</div>
      </div>

      <div className="divide-y divide-gray-200">
        {sortedInvestors.map((investor) => (
          <InvestorTableRow
            key={investor.id}
            investor={investor}
            onSelect={onSelectInvestor}
            onView={onViewInvestor}
            onAction={onAction}
          />
        ))}
      </div>

      {sortedInvestors.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No investors found. Add investors or adjust your search filters.
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

export default InvestorTable;
