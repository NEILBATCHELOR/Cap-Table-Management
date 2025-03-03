import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Coins, AlertTriangle, Search, Filter } from "lucide-react";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Investor } from "@/types/investor";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { TokenType } from "@/types/token";

interface BatchDistributionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedInvestors?: Array<{
    id: string;
    name: string;
    subscriptions: Array<{
      id?: string;
      tokenAllocationId?: string;
      tokenType?: string;
      tokenAllocation?: number;
      allocated: boolean;
      distributed: boolean;
    }>;
  }>;
  onConfirm?: (investorIds: string[]) => Promise<void>;
}

const BatchDistributionDialog = ({
  open = false,
  onOpenChange = () => {},
  selectedInvestors = [],
  onConfirm = async () => {},
}: BatchDistributionDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterByTokenType, setFilterByTokenType] = useState<TokenType | "">(
    "",
  );

  // Reset selected IDs when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedIds([]);
      setSearchTerm("");
      setFilterByTokenType("");
      setError(null);
    }
  }, [open]);

  // Filter investors that have allocations but not distributions
  const eligibleInvestors = selectedInvestors
    .filter((investor) =>
      investor.subscriptions.some(
        (sub) => sub.allocated && !sub.distributed && sub.tokenAllocationId,
      ),
    )
    .filter((investor) => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          investor.name.toLowerCase().includes(searchLower) ||
          investor.subscriptions.some((sub) =>
            sub.tokenType?.toLowerCase().includes(searchLower),
          )
        );
      }
      return true;
    })
    .filter((investor) => {
      // Apply token type filter
      if (filterByTokenType) {
        return investor.subscriptions.some(
          (sub) =>
            sub.tokenType === filterByTokenType &&
            sub.allocated &&
            !sub.distributed,
        );
      }
      return true;
    });

  const handleToggleInvestor = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === eligibleInvestors.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(eligibleInvestors.map((i) => i.id));
    }
  };

  const handleDistribute = async () => {
    if (selectedIds.length === 0) return;

    // Instead of distributing directly, we'll pass the selected IDs to the parent
    // which will show the confirmation dialog
    onConfirm(selectedIds);
    onOpenChange(false);
  };

  // Calculate distribution statistics
  const filteredSelectedInvestors = eligibleInvestors.filter((i) =>
    selectedIds.includes(i.id),
  );
  const totalTokens = filteredSelectedInvestors
    .flatMap((i) => i.subscriptions)
    .filter((s) => s.allocated && !s.distributed)
    .reduce((sum, s) => sum + (s.tokenAllocation || 0), 0);

  // Count token types for distribution
  const tokenTypeCounts = filteredSelectedInvestors
    .flatMap((i) => i.subscriptions)
    .filter((s) => s.allocated && !s.distributed && s.tokenType)
    .reduce(
      (counts, sub) => {
        const tokenType = sub.tokenType as string;
        counts[tokenType] = (counts[tokenType] || 0) + 1;
        return counts;
      },
      {} as Record<string, number>,
    );

  // Get unique token types for filtering
  const availableTokenTypes = Array.from(
    new Set(
      eligibleInvestors
        .flatMap((i) => i.subscriptions)
        .filter((s) => s.allocated && !s.distributed && s.tokenType)
        .map((s) => s.tokenType),
    ),
  ) as TokenType[];

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => !isProcessing && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle>Batch Token Distribution</DialogTitle>
          <DialogDescription>
            Distribute tokens to multiple investors at once
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {isProcessing ? (
            <div className="space-y-4">
              <p className="text-center">Processing token distribution...</p>
              <Progress value={progress} className="w-full" />
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={
                        selectedIds.length === eligibleInvestors.length &&
                        eligibleInvestors.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                      disabled={eligibleInvestors.length === 0}
                    />
                    <Label htmlFor="select-all">Select All</Label>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    {selectedIds.length} of {eligibleInvestors.length} selected
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search investors..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="w-[180px]">
                    <select
                      className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      value={filterByTokenType}
                      onChange={(e) =>
                        setFilterByTokenType(e.target.value as TokenType | "")
                      }
                    >
                      <option value="">All Token Types</option>
                      {availableTokenTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {eligibleInvestors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No investors with pending token distributions found
                </div>
              ) : (
                <div className="max-h-[300px] overflow-y-auto space-y-2">
                  {eligibleInvestors.map((investor) => {
                    const pendingDistributions = investor.subscriptions.filter(
                      (s) => s.allocated && !s.distributed,
                    );
                    const totalPendingTokens = pendingDistributions.reduce(
                      (sum, s) => sum + (s.tokenAllocation || 0),
                      0,
                    );

                    return (
                      <div
                        key={investor.id}
                        className="flex items-start space-x-3 p-3 border rounded-md"
                      >
                        <Checkbox
                          id={`investor-${investor.id}`}
                          checked={selectedIds.includes(investor.id)}
                          onCheckedChange={() =>
                            handleToggleInvestor(investor.id)
                          }
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`investor-${investor.id}`}
                            className="font-medium"
                          >
                            {investor.name}
                          </Label>
                          <div className="text-sm text-gray-500 mt-1">
                            {pendingDistributions.length} pending
                            distribution(s): {totalPendingTokens} tokens
                          </div>
                          <div className="mt-2 space-y-1">
                            {pendingDistributions.map((sub, idx) => (
                              <div
                                key={idx}
                                className="text-xs bg-gray-50 p-1 rounded flex justify-between"
                              >
                                <span>{sub.tokenType}</span>
                                <span className="font-medium">
                                  {sub.tokenAllocation} tokens
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedIds.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Selected {selectedIds.length} investor(s)
                    </span>
                    <span className="text-sm font-bold">
                      {totalTokens.toLocaleString()} tokens total
                    </span>
                  </div>

                  {Object.keys(tokenTypeCounts).length > 0 && (
                    <div className="flex flex-col space-y-1">
                      <span className="text-xs text-gray-500">
                        Token types to distribute:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(tokenTypeCounts).map(
                          ([type, count]) => (
                            <Badge
                              key={type}
                              variant="outline"
                              className="text-xs"
                            >
                              {type}: {count}
                            </Badge>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDistribute}
            disabled={isProcessing || selectedIds.length === 0}
            className="gap-2"
          >
            <Coins className="h-4 w-4" />
            Distribute {totalTokens > 0
              ? totalTokens.toLocaleString()
              : ""}{" "}
            Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BatchDistributionDialog;
