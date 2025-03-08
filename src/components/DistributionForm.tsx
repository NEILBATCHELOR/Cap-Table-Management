import React, { useState, useMemo } from "react";
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
import { Badge } from "./ui/badge";
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";
import { AlertTriangle, Coins } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface DistributionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: Investor[];
  onSubmit: (allocationIds: string[]) => void;
}

const DistributionForm = ({
  open,
  onOpenChange,
  investors,
  onSubmit,
}: DistributionFormProps) => {
  const [selectedAllocations, setSelectedAllocations] = useState<Set<string>>(
    new Set(),
  );

  // Get all allocations that can be distributed
  const allocations = useMemo(() => {
    return investors.flatMap((investor) =>
      investor.subscriptions
        .filter(
          (sub) => sub.allocated && !sub.distributed && sub.tokenAllocationId,
        )
        .map((sub) => ({
          id: sub.tokenAllocationId as string,
          investorId: investor.id,
          investorName: investor.name,
          tokenType: sub.tokenType as TokenType,
          amount: sub.tokenAllocation as number,
        })),
    );
  }, [investors]);

  // Calculate totals by token type
  const tokenTypeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const selectedTotals: Record<string, number> = {};

    allocations.forEach((allocation) => {
      const tokenType = allocation.tokenType || "Unknown";
      totals[tokenType] = (totals[tokenType] || 0) + allocation.amount;

      if (selectedAllocations.has(allocation.id)) {
        selectedTotals[tokenType] =
          (selectedTotals[tokenType] || 0) + allocation.amount;
      }
    });

    return { totals, selectedTotals };
  }, [allocations, selectedAllocations]);

  const handleToggleAllocation = (allocationId: string) => {
    const newSelected = new Set(selectedAllocations);
    if (newSelected.has(allocationId)) {
      newSelected.delete(allocationId);
    } else {
      newSelected.add(allocationId);
    }
    setSelectedAllocations(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAllocations.size === allocations.length) {
      setSelectedAllocations(new Set());
    } else {
      setSelectedAllocations(
        new Set(allocations.map((allocation) => allocation.id)),
      );
    }
  };

  const handleSubmit = () => {
    onSubmit(Array.from(selectedAllocations));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle>Distribute Tokens</DialogTitle>
          <DialogDescription>
            Select allocations to distribute tokens to investors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {allocations.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No allocations available</AlertTitle>
              <AlertDescription>
                There are no token allocations ready for distribution. Please
                allocate tokens to investors first.
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedAllocations.size === allocations.length &&
                      allocations.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedAllocations.size} of {allocations.length} selected
                </div>
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2">
                {allocations.map((allocation) => (
                  <div
                    key={allocation.id}
                    className="flex items-center space-x-3 p-3 border rounded-md"
                  >
                    <Checkbox
                      id={`allocation-${allocation.id}`}
                      checked={selectedAllocations.has(allocation.id)}
                      onCheckedChange={() =>
                        handleToggleAllocation(allocation.id)
                      }
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`allocation-${allocation.id}`}
                        className="font-medium"
                      >
                        {allocation.investorName}
                      </Label>
                      <div className="flex items-center mt-1 space-x-2">
                        <Badge variant="outline">{allocation.tokenType}</Badge>
                        <span className="text-sm">
                          {allocation.amount.toLocaleString()} tokens
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="p-3 bg-muted/30 rounded-md space-y-2">
                <h3 className="text-sm font-medium">Distribution Summary</h3>
                <div className="space-y-1">
                  {Object.entries(tokenTypeTotals.totals).map(
                    ([tokenType, total]) => (
                      <div
                        key={tokenType}
                        className="flex justify-between text-sm"
                      >
                        <span>{tokenType}:</span>
                        <span>
                          {(
                            tokenTypeTotals.selectedTotals[tokenType] || 0
                          ).toLocaleString()}
                          {" / "}
                          {total.toLocaleString()} tokens selected
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedAllocations.size === 0}
            className="gap-2"
          >
            <Coins className="h-4 w-4" />
            Distribute Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DistributionForm;
