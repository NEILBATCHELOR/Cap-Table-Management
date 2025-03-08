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
import { getAllInvestorTypes } from "@/types/investorTypeCategory";

interface InvestorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor?: {
    id: string;
    name: string;
    email: string;
    type: string;
    kycStatus: string;
    wallet: string;
  };
  onSubmit: (data: any) => void;
}

const InvestorForm = ({
  open,
  onOpenChange,
  investor,
  onSubmit,
}: InvestorFormProps) => {
  const [formData, setFormData] = useState({
    name: investor?.name || "",
    email: investor?.email || "",
    type: investor?.type || "Individual",
    kycStatus: investor?.kycStatus || "Not Started",
    wallet: investor?.wallet || "",
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

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (
      formData.wallet.trim() &&
      !/^0x[a-fA-F0-9]{40}$/.test(formData.wallet)
    ) {
      newErrors.wallet = "Invalid Ethereum wallet address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
      // Reset form
      setFormData({
        name: "",
        email: "",
        type: "Individual",
        kycStatus: "Not Started",
        wallet: "",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>
            {investor ? "Edit Investor" : "Add New Investor"}
          </DialogTitle>
          <DialogDescription>
            {investor
              ? "Update the investor's information"
              : "Enter the details for the new investor"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter investor name"
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email address"
                className={errors.email ? "border-destructive" : ""}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Investor Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select investor type" />
                </SelectTrigger>
                <SelectContent>
                  {getAllInvestorTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kycStatus">KYC Status</Label>
              <Select
                value={formData.kycStatus}
                onValueChange={(value) => handleChange("kycStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select KYC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <div className="flex gap-2">
                <Input
                  id="wallet"
                  value={formData.wallet}
                  onChange={(e) => handleChange("wallet", e.target.value)}
                  placeholder="0x..."
                  className={errors.wallet ? "border-destructive" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    // Generate random ETH address
                    const randomHex = Array.from({ length: 40 }, () =>
                      Math.floor(Math.random() * 16).toString(16),
                    ).join("");
                    handleChange("wallet", `0x${randomHex}`);
                  }}
                >
                  Generate
                </Button>
              </div>
              {errors.wallet && (
                <p className="text-xs text-destructive">{errors.wallet}</p>
              )}
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
            <Button type="submit">
              {investor ? "Update Investor" : "Add Investor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorForm;
