import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Edit,
  Eye,
  MoreHorizontal,
  Search,
  Trash2,
  Filter,
} from "lucide-react";
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";

interface CapTableDataGridProps {
  investors: Investor[];
  loading: boolean;
  view: "investors" | "allocations" | "distributions";
  onRowSelectionChange: (selectedRows: Investor[]) => void;
  onRowClick: (investor: Investor) => void;
  onUpdateInvestor: (investorId: string, updates: any) => void;
  onRemoveInvestor: (investorId: string) => void;
}

const CapTableDataGrid = ({
  investors,
  loading,
  view,
  onRowSelectionChange,
  onRowClick,
  onUpdateInvestor,
  onRemoveInvestor,
}: CapTableDataGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter and sort the data
  const filteredData = useMemo(() => {
    let result = [...investors];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (investor) =>
          investor.name.toLowerCase().includes(lowerSearchTerm) ||
          investor.email.toLowerCase().includes(lowerSearchTerm) ||
          investor.type.toLowerCase().includes(lowerSearchTerm) ||
          investor.wallet.toLowerCase().includes(lowerSearchTerm),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof Investor];
      let bValue: any = b[sortField as keyof Investor];

      // Handle special cases
      if (sortField === "totalAllocated") {
        aValue = a.subscriptions.reduce(
          (sum, sub) => sum + (sub.tokenAllocation || 0),
          0,
        );
        bValue = b.subscriptions.reduce(
          (sum, sub) => sum + (sub.tokenAllocation || 0),
          0,
        );
      } else if (sortField === "totalDistributed") {
        aValue = a.subscriptions.reduce(
          (sum, sub) =>
            sum +
            (sub.distributed && sub.tokenAllocation ? sub.tokenAllocation : 0),
          0,
        );
        bValue = b.subscriptions.reduce(
          (sum, sub) =>
            sum +
            (sub.distributed && sub.tokenAllocation ? sub.tokenAllocation : 0),
          0,
        );
      }

      // Compare values
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [investors, searchTerm, sortField, sortDirection]);

  // Handle row selection
  const handleSelectRow = (investorId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(investorId)) {
      newSelectedRows.delete(investorId);
    } else {
      newSelectedRows.add(investorId);
    }
    setSelectedRows(newSelectedRows);
    onRowSelectionChange(
      filteredData.filter((investor) => newSelectedRows.has(investor.id)),
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      // Deselect all
      setSelectedRows(new Set());
      onRowSelectionChange([]);
    } else {
      // Select all
      const newSelectedRows = new Set(
        filteredData.map((investor) => investor.id),
      );
      setSelectedRows(newSelectedRows);
      onRowSelectionChange(filteredData);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle row expansion
  const toggleRowExpansion = (investorId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(investorId)) {
      newExpandedRows.delete(investorId);
    } else {
      newExpandedRows.add(investorId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Render table columns based on view
  const renderColumns = () => {
    switch (view) {
      case "investors":
        return (
          <>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedRows.size === filteredData.length &&
                  filteredData.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="flex items-center"
              >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("email")}
                className="flex items-center"
              >
                Email
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("type")}
                className="flex items-center"
              >
                Type
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("kycStatus")}
                className="flex items-center"
              >
                KYC Status
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("totalAllocated")}
                className="flex items-center"
              >
                Total Allocated
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </>
        );
      case "allocations":
        return (
          <>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedRows.size === filteredData.length &&
                  filteredData.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="flex items-center"
              >
                Investor
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Token Type</TableHead>
            <TableHead>Subscription ID</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </>
        );
      case "distributions":
        return (
          <>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  selectedRows.size === filteredData.length &&
                  filteredData.length > 0
                }
                onCheckedChange={handleSelectAll}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("name")}
                className="flex items-center"
              >
                Investor
                <ArrowUpDown className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>Token Type</TableHead>
            <TableHead>Allocated</TableHead>
            <TableHead>Distributed</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </>
        );
      default:
        return null;
    }
  };

  // Render table rows based on view
  const renderRows = () => {
    if (view === "investors") {
      return filteredData.map((investor) => (
        <React.Fragment key={investor.id}>
          <TableRow
            className={selectedRows.has(investor.id) ? "bg-muted/50" : ""}
            onClick={() => onRowClick(investor)}
          >
            <TableCell>
              <Checkbox
                checked={selectedRows.has(investor.id)}
                onCheckedChange={() => handleSelectRow(investor.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Select ${investor.name}`}
              />
            </TableCell>
            <TableCell className="font-medium flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRowExpansion(investor.id);
                }}
              >
                {expandedRows.has(investor.id) ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
              {investor.name}
            </TableCell>
            <TableCell>{investor.email}</TableCell>
            <TableCell>{investor.type}</TableCell>
            <TableCell>
              <Badge
                variant={
                  investor.kycStatus === "Verified"
                    ? "success"
                    : investor.kycStatus === "Expired"
                      ? "destructive"
                      : "outline"
                }
              >
                {investor.kycStatus}
              </Badge>
            </TableCell>
            <TableCell>
              {investor.subscriptions
                .reduce((sum, sub) => sum + (sub.tokenAllocation || 0), 0)
                .toLocaleString()}
            </TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(investor);
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open edit dialog
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveInvestor(investor.id);
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>

          {/* Expanded row content */}
          {expandedRows.has(investor.id) && (
            <TableRow className="bg-muted/20">
              <TableCell colSpan={7} className="p-0">
                <div className="p-4">
                  <h4 className="font-medium mb-2">Subscriptions</h4>
                  {investor.subscriptions.length > 0 ? (
                    <div className="space-y-2">
                      {investor.subscriptions.map((subscription, index) => (
                        <div
                          key={subscription.id || index}
                          className="grid grid-cols-4 gap-4 p-2 border rounded-md"
                        >
                          <div>
                            <span className="text-sm font-medium">ID:</span>
                            <span className="text-sm ml-2">
                              {subscription.subscriptionId}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Amount:</span>
                            <span className="text-sm ml-2">
                              {subscription.fiatSubscription.amount.toLocaleString()}{" "}
                              {subscription.fiatSubscription.currency}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Token:</span>
                            <span className="text-sm ml-2">
                              {subscription.tokenType || "Not allocated"}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium">Status:</span>
                            <span className="text-sm ml-2">
                              {subscription.distributed
                                ? "Distributed"
                                : subscription.allocated
                                  ? "Allocated"
                                  : subscription.confirmed
                                    ? "Confirmed"
                                    : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No subscriptions found
                    </p>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
        </React.Fragment>
      ));
    } else if (view === "allocations") {
      // Flatten investors and their allocations
      const allocations = filteredData.flatMap((investor) =>
        investor.subscriptions
          .filter((sub) => sub.allocated)
          .map((sub) => ({
            investorId: investor.id,
            investorName: investor.name,
            subscription: sub,
          })),
      );

      return allocations.map((allocation, index) => (
        <TableRow
          key={`${allocation.investorId}-${allocation.subscription.id || index}`}
          className={
            selectedRows.has(allocation.investorId) ? "bg-muted/50" : ""
          }
        >
          <TableCell>
            <Checkbox
              checked={selectedRows.has(allocation.investorId)}
              onCheckedChange={() => handleSelectRow(allocation.investorId)}
              aria-label={`Select ${allocation.investorName}`}
            />
          </TableCell>
          <TableCell className="font-medium">
            {allocation.investorName}
          </TableCell>
          <TableCell>
            <Badge variant="outline">{allocation.subscription.tokenType}</Badge>
          </TableCell>
          <TableCell>{allocation.subscription.subscriptionId}</TableCell>
          <TableCell>
            {allocation.subscription.tokenAllocation?.toLocaleString()}
          </TableCell>
          <TableCell>
            <Badge
              variant={
                allocation.subscription.distributed ? "success" : "outline"
              }
            >
              {allocation.subscription.distributed
                ? "Distributed"
                : "Allocated"}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    const investor = investors.find(
                      (inv) => inv.id === allocation.investorId,
                    );
                    if (investor) {
                      onRowClick(investor);
                    }
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Investor
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    // Edit allocation
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Allocation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
    } else if (view === "distributions") {
      // Flatten investors and their distributions
      const distributions = filteredData.flatMap((investor) =>
        investor.subscriptions
          .filter((sub) => sub.allocated)
          .map((sub) => ({
            investorId: investor.id,
            investorName: investor.name,
            subscription: sub,
          })),
      );

      return distributions.map((distribution, index) => (
        <TableRow
          key={`${distribution.investorId}-${distribution.subscription.id || index}`}
          className={
            selectedRows.has(distribution.investorId) ? "bg-muted/50" : ""
          }
        >
          <TableCell>
            <Checkbox
              checked={selectedRows.has(distribution.investorId)}
              onCheckedChange={() => handleSelectRow(distribution.investorId)}
              aria-label={`Select ${distribution.investorName}`}
            />
          </TableCell>
          <TableCell className="font-medium">
            {distribution.investorName}
          </TableCell>
          <TableCell>
            <Badge variant="outline">
              {distribution.subscription.tokenType}
            </Badge>
          </TableCell>
          <TableCell>
            {distribution.subscription.tokenAllocation?.toLocaleString()}
          </TableCell>
          <TableCell>
            {distribution.subscription.distributed
              ? distribution.subscription.tokenAllocation?.toLocaleString()
              : "0"}
          </TableCell>
          <TableCell>
            <Badge
              variant={
                distribution.subscription.distributed ? "success" : "outline"
              }
            >
              {distribution.subscription.distributed
                ? "Distributed"
                : "Pending"}
            </Badge>
          </TableCell>
          <TableCell>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => {
                    const investor = investors.find(
                      (inv) => inv.id === distribution.investorId,
                    );
                    if (investor) {
                      onRowClick(investor);
                    }
                  }}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Investor
                </DropdownMenuItem>
                {!distribution.subscription.distributed && (
                  <DropdownMenuItem
                    onClick={() => {
                      // Distribute tokens
                    }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Distribute
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ));
    }

    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button variant="outline" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>{renderColumns()}</TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              renderRows()
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CapTableDataGrid;
