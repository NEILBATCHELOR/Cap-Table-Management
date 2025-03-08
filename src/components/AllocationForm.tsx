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
import { Investor } from "@/types/investor";
import { TokenType } from "@/types/token";

interface AllocationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor?: Investor | null;
  investors: Investor[];
  onSubmit: (investorId: string, data: any) => void;
}

const AllocationForm = ({
  open,
  onOpenChange,
  investor,
  investors,
  onSubmit,
}: AllocationFormProps) => {
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(
    investor?.id || investors[0]?.id || "",
  );

  const [formData, setFormData] = useState({
    subscriptionId: `SUB-${Date.now()}`,
    tokenType: "ERC-20" as TokenType,
    amount: "100",
    currency: "USD",
    tokenAmount: "100",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field is edited
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.subscriptionId.trim()) {
      newErrors.subscriptionId = "Subscription ID is required";
    }

    if (!formData.amount.trim()) {
      newErrors.amount = "Amount is required";
    } else if (
      isNaN(parseFloat(formData.amount)) ||
      parseFloat(formData.amount) <= 0
    ) {
      newErrors.amount = "Amount must be a positive number";
    }

    if (!formData.tokenAmount.trim()) {
      newErrors.tokenAmount = "Token amount is required";
    } else if (
      isNaN(parseFloat(formData.tokenAmount)) ||
      parseFloat(formData.tokenAmount) <= 0
    ) {
      newErrors.tokenAmount = "Token amount must be a positive number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(selectedInvestorId, {
        ...formData,
        amount: parseFloat(formData.amount),
        tokenAmount: parseFloat(formData.tokenAmount),
      });
      // Reset form
      setFormData({
        subscriptionId: `SUB-${Date.now()}`,
        tokenType: "ERC-20",
        amount: "100",
        currency: "USD",
        tokenAmount: "100",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Add Token Allocation</DialogTitle>
          <DialogDescription>Allocate tokens to an investor</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {investors.length > 1 && (
              <div className="space-y-2">
                <Label htmlFor="investor">Investor</Label>
                <Select
                  value={selectedInvestorId}
                  onValueChange={setSelectedInvestorId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select investor" />
                  </SelectTrigger>
                  <SelectContent>
                    {investors.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input
                id="subscriptionId"
                value={formData.subscriptionId}
                onChange={(e) => handleChange("subscriptionId", e.target.value)}
                placeholder="Enter subscription ID"
                className={errors.subscriptionId ? "border-destructive" : ""}
              />
              {errors.subscriptionId && (
                <p className="text-xs text-destructive">
                  {errors.subscriptionId}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  placeholder="Enter amount"
                  className={errors.amount ? "border-destructive" : ""}
                />
                {errors.amount && (
                  <p className="text-xs text-destructive">{errors.amount}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleChange("currency", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tokenType">Token Type</Label>
                <Select
                  value={formData.tokenType}
                  onValueChange={(value) =>
                    handleChange("tokenType", value as TokenType)
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
                <Label htmlFor="tokenAmount">Token Amount</Label>
                <Input
                  id="tokenAmount"
                  value={formData.tokenAmount}
                  onChange={(e) => handleChange("tokenAmount", e.target.value)}
                  placeholder="Enter token amount"
                  className={errors.tokenAmount ? "border-destructive" : ""}
                />
                {errors.tokenAmount && (
                  <p className="text-xs text-destructive">
                    {errors.tokenAmount}
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Allocation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AllocationForm;
