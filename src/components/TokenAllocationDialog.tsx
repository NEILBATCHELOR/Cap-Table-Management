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
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Separator } from "./ui/separator";
import { Plus, X, Info } from "lucide-react";
import { TokenType } from "@/types/token";
import BespokeAllocationDialog from "./BespokeAllocationDialog";
import { Investor } from "@/types/investor";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface TokenAllocationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedInvestors?: Array<{
    id: string;
    name: string;
    currentAllocation: number;
  }>;
  onConfirm?: (
    allocationType: string,
    allocations: Array<{ tokenType: TokenType; amount: number }>,
  ) => void;
  investors?: Investor[];
  onBespokeConfirm?: (
    allocations: Array<{
      investorId: string;
      tokenType: TokenType;
      amount: number;
    }>,
  ) => void;
}

const TokenAllocationDialog = ({
  open = true,
  onOpenChange = () => {},
  selectedInvestors = [
    { id: "1", name: "John Doe", currentAllocation: 0 },
    { id: "2", name: "Jane Smith", currentAllocation: 0 },
  ],
  onConfirm = () => {},
  investors = [],
  onBespokeConfirm = () => {},
}: TokenAllocationDialogProps) => {
  const [allocationType, setAllocationType] = useState("standard");
  const [allocations, setAllocations] = useState<
    Array<{ tokenType: TokenType; amount: string }>
  >([
    {
      tokenType: "ERC-20",
      amount: "100",
    },
  ]);
  const [showBespokeDialog, setShowBespokeDialog] = useState(false);

  // Filter investors to only include those that are selected
  const selectedInvestorIds = selectedInvestors.map((inv) => inv.id);
  const filteredInvestors = investors.filter((inv) =>
    selectedInvestorIds.includes(inv.id),
  );

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-[600px] bg-background"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Token Allocation</DialogTitle>
            <DialogDescription>
              Set token allocation for {selectedInvestors.length} selected
              investor(s)
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            <RadioGroup
              value={allocationType}
              onValueChange={setAllocationType}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="standard" id="standard" />
                <Label htmlFor="standard">Standard Allocation</Label>
                <Info
                  className="h-4 w-4 text-gray-400 ml-1"
                  title="Apply the same token allocation to all selected investors"
                />
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bespoke" id="bespoke" />
                <Label htmlFor="bespoke">Bespoke Allocation</Label>
                <Info
                  className="h-4 w-4 text-gray-400 ml-1"
                  title="Set different token allocations for each investor"
                />
              </div>
            </RadioGroup>

            <Separator className="my-6" />

            {allocationType === "standard" ? (
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
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">
                  Bespoke allocation allows you to set different token amounts
                  for each investor based on their individual subscriptions and
                  requirements.
                </p>
                <Button
                  className="w-full"
                  onClick={() => setShowBespokeDialog(true)}
                >
                  Configure Bespoke Allocations
                </Button>
              </div>
            )}

            <div className="mt-6 space-y-2">
              <h4 className="text-sm font-medium">Preview</h4>
              <div className="rounded-md bg-gray-50 p-4 space-y-2">
                {selectedInvestors.map((investor) => (
                  <div
                    key={investor.id}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-gray-600">{investor.name}</span>
                    <span className="font-medium">
                      {allocations.reduce(
                        (sum, a) => sum + (parseInt(a.amount) || 0),
                        0,
                      )}{" "}
                      tokens
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {allocationType === "standard" ? (
              <Button
                onClick={() => {
                  onConfirm(
                    allocationType,
                    allocations.map((a) => ({
                      tokenType: a.tokenType as TokenType,
                      amount: parseInt(a.amount),
                    })),
                  );
                  onOpenChange(false);
                }}
              >
                Confirm Allocation
              </Button>
            ) : (
              <Button onClick={() => setShowBespokeDialog(true)}>
                Configure Bespoke Allocations
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BespokeAllocationDialog
        open={showBespokeDialog}
        onOpenChange={setShowBespokeDialog}
        investors={filteredInvestors}
        onConfirm={(bespokeAllocations) => {
          onBespokeConfirm(bespokeAllocations);
          setShowBespokeDialog(false);
          onOpenChange(false);
        }}
      />
    </>
  );
};

export default TokenAllocationDialog;
