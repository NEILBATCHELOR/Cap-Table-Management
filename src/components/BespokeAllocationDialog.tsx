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
import { TokenType } from "@/types/token";
import { Investor } from "@/types/investor";

interface BespokeAllocationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  investors?: Investor[];
  onConfirm?: (
    allocations: Array<{
      investorId: string;
      tokenType: TokenType;
      amount: number;
    }>,
  ) => void;
}

const BespokeAllocationDialog = ({
  open = false,
  onOpenChange = () => {},
  investors = [],
  onConfirm = () => {},
}: BespokeAllocationDialogProps) => {
  const [allocations, setAllocations] = useState<
    Record<
      string,
      {
        tokenType: TokenType;
        amount: string;
      }
    >
  >({});

  // Initialize allocations when dialog opens
  React.useEffect(() => {
    if (open) {
      const initialAllocations: Record<
        string,
        { tokenType: TokenType; amount: string }
      > = {};
      investors.forEach((investor) => {
        initialAllocations[investor.id] = {
          tokenType: "ERC-20",
          amount: "100",
        };
      });
      setAllocations(initialAllocations);
    }
  }, [open, investors]);

  const updateAllocation = (
    investorId: string,
    field: "tokenType" | "amount",
    value: string,
  ) => {
    setAllocations((prev) => ({
      ...prev,
      [investorId]: {
        ...prev[investorId],
        [field]: field === "tokenType" ? value : value,
      },
    }));
  };

  const handleConfirm = () => {
    const allocationArray = Object.entries(allocations).map(
      ([investorId, allocation]) => ({
        investorId,
        tokenType: allocation.tokenType,
        amount: parseInt(allocation.amount) || 0,
      }),
    );

    onConfirm(allocationArray);
    onOpenChange(false);
  };

  // Calculate total tokens
  const totalTokens = Object.values(allocations).reduce(
    (sum, allocation) => sum + (parseInt(allocation.amount) || 0),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background">
        <DialogHeader>
          <DialogTitle>Bespoke Token Allocation</DialogTitle>
          <DialogDescription>
            Set custom token allocations for each investor
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {investors.map((investor) => (
            <div key={investor.id} className="p-4 border rounded-md space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{investor.name}</h3>
                <span className="text-sm text-gray-500">{investor.type}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Token Type</Label>
                  <Select
                    value={allocations[investor.id]?.tokenType || "ERC-20"}
                    onValueChange={(value) =>
                      updateAllocation(investor.id, "tokenType", value)
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

                <div className="space-y-2">
                  <Label>Token Amount</Label>
                  <Input
                    type="number"
                    value={allocations[investor.id]?.amount || "0"}
                    onChange={(e) =>
                      updateAllocation(investor.id, "amount", e.target.value)
                    }
                    placeholder="Enter token amount"
                  />
                </div>
              </div>

              <div className="text-sm text-gray-500">
                {investor.subscriptions.length > 0 ? (
                  <div className="space-y-1">
                    <p>Subscriptions:</p>
                    {investor.subscriptions.map((sub, idx) => (
                      <div
                        key={idx}
                        className="pl-2 border-l-2 border-gray-200"
                      >
                        {sub.fiatSubscription.amount}{" "}
                        {sub.fiatSubscription.currency}
                        {sub.confirmed ? " (Confirmed)" : " (Unconfirmed)"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No subscriptions</p>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Allocation:</span>
            <span className="font-bold">{totalTokens} tokens</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Allocations</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BespokeAllocationDialog;
