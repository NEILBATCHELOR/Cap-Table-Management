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
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Investor } from "@/types/investor";
import { TokenType, Currency } from "@/types/token";
import { SubscriptionStatus } from "@/types/subscription";
import { Trash2 } from "lucide-react";

interface SubscriptionFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investors: Investor[];
  selectedInvestor?: Investor | null;
  subscription?: any;
  onSubmit: (investorId: string, data: any) => void;
  onDelete?: () => void;
}

const SubscriptionForm = ({
  open,
  onOpenChange,
  investors,
  selectedInvestor,
  subscription,
  onSubmit,
  onDelete,
}: SubscriptionFormProps) => {
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(
    selectedInvestor?.id || investors[0]?.id || "",
  );

  const [formData, setFormData] = useState({
    subscriptionId: `SUB-${Date.now()}`,
    amount: "1000",
    currency: "USD" as Currency,
    status: "Pending" as SubscriptionStatus,
    subscriptionDate: new Date().toISOString().split("T")[0],
    notes: "",
    tokenType: "" as TokenType | "",
    tokenAllocation: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showTokenFields, setShowTokenFields] = useState(false);

  // Initialize form with subscription data when dialog opens
  useEffect(() => {
    if (open) {
      if (selectedInvestor) {
        setSelectedInvestorId(selectedInvestor.id);
      }

      if (subscription) {
        // Editing existing subscription
        setFormData({
          subscriptionId: subscription.subscriptionId || "",
          amount: subscription.amount.toString(),
          currency: subscription.currency,
          status: subscription.status,
          subscriptionDate:
            subscription.date || new Date().toISOString().split("T")[0],
          notes: subscription.notes || "",
          tokenType: subscription.tokenType || "",
          tokenAllocation: subscription.tokenAllocation
            ? subscription.tokenAllocation.toString()
            : "",
        });

        setShowTokenFields(
          subscription.status === "Allocated" ||
            subscription.status === "Distributed",
        );
      } else {
        // New subscription
        setFormData({
          subscriptionId: `SUB-${Date.now()}`,
          amount: "1000",
          currency: "USD" as Currency,
          status: "Pending" as SubscriptionStatus,
          subscriptionDate: new Date().toISOString().split("T")[0],
          notes: "",
          tokenType: "" as TokenType | "",
          tokenAllocation: "",
        });
        setShowTokenFields(false);
      }

      setErrors({});
    }
  }, [open, selectedInvestor, subscription]);

  // Update token fields visibility when status changes
  useEffect(() => {
    if (formData.status === "Allocated" || formData.status === "Distributed") {
      setShowTokenFields(true);
    } else {
      setShowTokenFields(false);
    }
  }, [formData.status]);

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

    if (!formData.subscriptionDate.trim()) {
      newErrors.subscriptionDate = "Subscription date is required";
    }

    if (showTokenFields) {
      if (!formData.tokenType) {
        newErrors.tokenType = "Token type is required for allocation";
      }

      if (!formData.tokenAllocation.trim()) {
        newErrors.tokenAllocation = "Token allocation is required";
      } else if (
        isNaN(parseFloat(formData.tokenAllocation)) ||
        parseFloat(formData.tokenAllocation) <= 0
      ) {
        newErrors.tokenAllocation =
          "Token allocation must be a positive number";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(selectedInvestorId, formData);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>
            {subscription ? "Edit Subscription" : "Add Subscription"}
          </DialogTitle>
          <DialogDescription>
            {subscription
              ? "Update subscription details"
              : "Create a new subscription for an investor"}
          </DialogDescription>
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
                  onValueChange={(value) =>
                    handleChange("currency", value as Currency)
                  }
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

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  handleChange("status", value as SubscriptionStatus)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Allocated">Allocated</SelectItem>
                  <SelectItem value="Distributed">Distributed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscriptionDate">Subscription Date</Label>
              <Input
                id="subscriptionDate"
                type="date"
                value={formData.subscriptionDate}
                onChange={(e) =>
                  handleChange("subscriptionDate", e.target.value)
                }
                className={errors.subscriptionDate ? "border-destructive" : ""}
              />
              {errors.subscriptionDate && (
                <p className="text-xs text-destructive">
                  {errors.subscriptionDate}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Enter notes (optional)"
              />
            </div>

            {showTokenFields && (
              <>
                <Separator />
                <h3 className="text-sm font-medium">Token Allocation</h3>

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
                    {errors.tokenType && (
                      <p className="text-xs text-destructive">
                        {errors.tokenType}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tokenAllocation">Token Amount</Label>
                    <Input
                      id="tokenAllocation"
                      value={formData.tokenAllocation}
                      onChange={(e) =>
                        handleChange("tokenAllocation", e.target.value)
                      }
                      placeholder="Enter token amount"
                      className={
                        errors.tokenAllocation ? "border-destructive" : ""
                      }
                    />
                    {errors.tokenAllocation && (
                      <p className="text-xs text-destructive">
                        {errors.tokenAllocation}
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between">
            <div>
              {onDelete && subscription && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={onDelete}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {subscription ? "Update" : "Add"} Subscription
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionForm;
