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
  Check,
  Edit,
  MoreHorizontal,
  Search,
  Trash2,
  Filter,
} from "lucide-react";
import { Investor } from "@/types/investor";
import { TokenSubscription } from "@/types/token";
import { SubscriptionStatus } from "@/types/subscription";

interface SubscriptionDataGridProps {
  investors: Investor[];
  loading: boolean;
  filterStatus?: SubscriptionStatus;
  onEditSubscription: (subscription: any, investorId: string) => void;
  onDeleteSubscription: (subscriptionId: string, investorId: string) => void;
  onBulkConfirm: (subscriptionIds: string[]) => void;
}

const SubscriptionDataGrid = ({
  investors,
  loading,
  filterStatus,
  onEditSubscription,
  onDeleteSubscription,
  onBulkConfirm,
}: SubscriptionDataGridProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<string>("investorName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Flatten subscriptions with investor info
  const subscriptions = useMemo(() => {
    return investors.flatMap((investor) =>
      investor.subscriptions
        .filter((sub) => {
          // Apply status filter if provided
          if (filterStatus === "Pending") return !sub.confirmed;
          if (filterStatus === "Confirmed")
            return sub.confirmed && !sub.allocated;
          if (filterStatus === "Allocated")
            return sub.allocated && !sub.distributed;
          if (filterStatus === "Distributed") return sub.distributed;
          return true; // No filter
        })
        .map((sub) => ({
          id: sub.id || "",
          investorId: investor.id,
          investorName: investor.name,
          investorEmail: investor.email,
          subscriptionId: sub.subscriptionId || "",
          amount: sub.fiatSubscription.amount,
          currency: sub.fiatSubscription.currency,
          status: sub.distributed
            ? "Distributed"
            : sub.allocated
              ? "Allocated"
              : sub.confirmed
                ? "Confirmed"
                : ("Pending" as SubscriptionStatus),
          date: sub.subscriptionDate || "",
          tokenType: sub.tokenType || "",
          tokenAllocation: sub.tokenAllocation || 0,
          notes: sub.notes || "",
          confirmed: sub.confirmed,
          allocated: sub.allocated,
          distributed: sub.distributed,
        })),
    );
  }, [investors, filterStatus]);

  // Apply search and sorting
  const filteredData = useMemo(() => {
    let result = [...subscriptions];

    // Apply search filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(
        (sub) =>
          sub.investorName.toLowerCase().includes(lowerSearchTerm) ||
          sub.investorEmail.toLowerCase().includes(lowerSearchTerm) ||
          sub.subscriptionId.toLowerCase().includes(lowerSearchTerm) ||
          sub.tokenType.toLowerCase().includes(lowerSearchTerm) ||
          sub.notes.toLowerCase().includes(lowerSearchTerm),
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a];
      let bValue: any = b[sortField as keyof typeof b];

      // Compare values
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [subscriptions, searchTerm, sortField, sortDirection]);

  // Handle row selection
  const handleSelectRow = (subscriptionId: string) => {
    const newSelectedRows = new Set(selectedRows);
    if (newSelectedRows.has(subscriptionId)) {
      newSelectedRows.delete(subscriptionId);
    } else {
      newSelectedRows.add(subscriptionId);
    }
    setSelectedRows(newSelectedRows);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedRows.size === filteredData.length) {
      // Deselect all
      setSelectedRows(new Set());
    } else {
      // Select all
      const newSelectedRows = new Set(filteredData.map((sub) => sub.id));
      setSelectedRows(newSelectedRows);
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

  // Handle bulk confirm
  const handleBulkConfirm = () => {
    const selectedIds = Array.from(selectedRows);
    if (selectedIds.length > 0) {
      onBulkConfirm(selectedIds);
      setSelectedRows(new Set());
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <div className="relative w-[300px]">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="flex gap-2">
          {selectedRows.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkConfirm}
              disabled={Array.from(selectedRows).some((id) => {
                const sub = subscriptions.find((s) => s.id === id);
                return sub?.confirmed || sub?.allocated || sub?.distributed;
              })}
            >
              <Check className="mr-2 h-4 w-4" />
              Confirm Selected ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
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
                  onClick={() => handleSort("investorName")}
                  className="flex items-center"
                >
                  Investor
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("subscriptionId")}
                  className="flex items-center"
                >
                  Subscription ID
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("amount")}
                  className="flex items-center"
                >
                  Amount
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="flex items-center"
                >
                  Status
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center"
                >
                  Date
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tokenType")}
                  className="flex items-center"
                >
                  Token Type
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("tokenAllocation")}
                  className="flex items-center"
                >
                  Token Allocation
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((subscription) => (
                <TableRow
                  key={subscription.id}
                  className={
                    selectedRows.has(subscription.id) ? "bg-muted/50" : ""
                  }
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedRows.has(subscription.id)}
                      onCheckedChange={() => handleSelectRow(subscription.id)}
                      disabled={
                        subscription.confirmed ||
                        subscription.allocated ||
                        subscription.distributed
                      }
                      aria-label={`Select subscription ${subscription.subscriptionId}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    {subscription.investorName}
                  </TableCell>
                  <TableCell>{subscription.subscriptionId}</TableCell>
                  <TableCell>
                    {subscription.amount.toLocaleString()}{" "}
                    {subscription.currency}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        subscription.status === "Distributed"
                          ? "success"
                          : subscription.status === "Allocated"
                            ? "secondary"
                            : subscription.status === "Confirmed"
                              ? "outline"
                              : "default"
                      }
                    >
                      {subscription.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{subscription.date}</TableCell>
                  <TableCell>
                    {subscription.tokenType ? (
                      <Badge variant="outline">{subscription.tokenType}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>
                    {subscription.tokenAllocation
                      ? subscription.tokenAllocation.toLocaleString()
                      : "-"}
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
                          onClick={() =>
                            onEditSubscription(
                              subscription,
                              subscription.investorId,
                            )
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {!subscription.distributed && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() =>
                                onDeleteSubscription(
                                  subscription.id,
                                  subscription.investorId,
                                )
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SubscriptionDataGrid;
