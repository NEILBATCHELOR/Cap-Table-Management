import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Separator } from "./ui/separator";
import { Plus, X, Info, AlertTriangle } from "lucide-react";
import { TokenType } from "@/types/token";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";

interface MultiTokenAllocationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedInvestors?: Array<{
    id: string;
    name: string;
    currentAllocation: number;
  }>;
  onConfirm?: (
    allocations: Array<{ tokenType: TokenType; amount: number }>,
  ) => void;
  onRemoveAllocations?: () => void;
}

const MultiTokenAllocationDialog = ({
  open = true,
  onOpenChange = () => {},
  selectedInvestors = [],
  onConfirm = () => {},
  onRemoveAllocations = () => {},
}: MultiTokenAllocationDialogProps) => {
  const [allocations, setAllocations] = useState<
    Array<{ tokenType: TokenType; amount: string }>
  >([
    {
      tokenType: "ERC-20",
      amount: "100",
    },
  ]);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

  const addAllocation = () => {
    setAllocations((prev) => [...prev, { tokenType: "ERC-20", amount: "100" }]);
  };

  const removeAllocation = (index: number) => {
    setAllocations((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAllocation = (
    index: number,
    field: "tokenType" | "amount",
    value: string,
  ) => {
    setAllocations((prev) =>
      prev.map((allocation, i) => {
        if (i !== index) return allocation;
        return {
          ...allocation,
          [field]: field === "tokenType" ? value : value,
        };
      }),
    );
  };

  const handleConfirm = () => {
    onConfirm(
      allocations.map((a) => ({
        tokenType: a.tokenType as TokenType,
        amount: parseInt(a.amount) || 0,
      })),
    );
    onOpenChange(false);
  };

  const handleRemoveAllocations = () => {
    onRemoveAllocations();
    setShowRemoveConfirm(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] bg-background"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Multi-Token Allocation</DialogTitle>
          <DialogDescription>
            Set multiple token allocations for {selectedInvestors.length}{" "}
            selected investor(s)
          </DialogDescription>
        </DialogHeader>

        {showRemoveConfirm ? (
          <div className="py-6 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                This will remove all token allocations for the selected
                investors. This action cannot be undone. Are you sure you want
                to continue?
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveAllocations}>
                Remove All Allocations
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-6 space-y-6">
              <div className="space-y-4">
                {allocations.map((allocation, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="flex-1 space-y-4">
                      <div className="grid gap-2">
                        <Label>Token Type</Label>
                        <Select
                          value={allocation.tokenType}
                          onValueChange={(value) =>
                            updateAllocation(index, "tokenType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select token type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ERC-20">ERC-20</SelectItem>
                            <SelectItem value="ERC-721">ERC-721</SelectItem>
                            <SelectItem value="ERC-1155">ERC-1155</SelectItem>
                            <SelectItem value="ERC-1400">ERC-1400</SelectItem>
                            <SelectItem value="ERC-3525">ERC-3525</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid gap-2">
                        <Label>Token Amount</Label>
                        <Input
                          type="number"
                          value={allocation.amount}
                          onChange={(e) =>
                            updateAllocation(index, "amount", e.target.value)
                          }
                          placeholder="Enter token amount"
                        />
                      </div>
                    </div>
                    {allocations.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAllocation(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={addAllocation}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Token Allocation
                </Button>
              </div>

              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-medium">Preview</h4>
                <div className="rounded-md bg-gray-50 p-4 space-y-2">
                  {selectedInvestors.map((investor) => (
                    <div
                      key={investor.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-gray-600">{investor.name}</span>
                      <div className="flex flex-col items-end">
                        {allocations.map((a, idx) => (
                          <span key={idx} className="font-medium">
                            {parseInt(a.amount) || 0} {a.tokenType}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => setShowRemoveConfirm(true)}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Remove Allocations
              </Button>
              <div>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button onClick={handleConfirm}>Confirm Allocation</Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default MultiTokenAllocationDialog;
