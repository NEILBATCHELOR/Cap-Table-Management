import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { investorTypeCategories } from "@/types/investorTypeCategory";

interface FilterDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  filters?: {
    types: string[];
    kycStatuses: string[];
    subscriptionStatuses: string[];
    tokenStatuses: string[];
  };
  onApplyFilters?: (filters: {
    types: string[];
    kycStatuses: string[];
    subscriptionStatuses: string[];
    tokenStatuses: string[];
  }) => void;
  onResetFilters?: () => void;
}

const FilterDialog = ({
  open = false,
  onOpenChange = () => {},
  filters = {
    types: [],
    kycStatuses: [],
    subscriptionStatuses: [],
    tokenStatuses: [],
  },
  onApplyFilters = () => {},
  onResetFilters = () => {},
}: FilterDialogProps) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleToggleFilter = (
    category:
      | "types"
      | "kycStatuses"
      | "subscriptionStatuses"
      | "tokenStatuses",
    value: string,
  ) => {
    setLocalFilters((prev) => {
      const currentValues = prev[category];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      return {
        ...prev,
        [category]: newValues,
      };
    });
  };

  const handleReset = () => {
    setLocalFilters({
      types: [],
      kycStatuses: [],
      subscriptionStatuses: [],
      tokenStatuses: [],
    });
    onResetFilters();
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onOpenChange(false);
  };

  const activeFilterCount =
    localFilters.types.length +
    localFilters.kycStatuses.length +
    localFilters.subscriptionStatuses.length +
    localFilters.tokenStatuses.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Filter Investors</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary">{activeFilterCount} active</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Investor Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {investorTypeCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <h4 className="text-xs font-medium mt-4 mb-2">
                    {category.name}
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {category.types.map((type) => (
                      <div
                        key={type.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`type-${type.id}`}
                          checked={localFilters.types.includes(type.name)}
                          onCheckedChange={() =>
                            handleToggleFilter("types", type.name)
                          }
                        />
                        <Label htmlFor={`type-${type.id}`} className="text-xs">
                          {type.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </React.Fragment>
              ))}

              <h4 className="text-xs font-medium mt-4 mb-2">Legacy Types</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-individual"
                    checked={localFilters.types.includes("Individual")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Individual")
                    }
                  />
                  <Label htmlFor="type-individual" className="text-xs">
                    Individual (Legacy)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-institution"
                    checked={localFilters.types.includes("Institution")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Institution")
                    }
                  />
                  <Label htmlFor="type-institution" className="text-xs">
                    Institution (Legacy)
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">KYC Status</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kyc-verified"
                  checked={localFilters.kycStatuses.includes("Verified")}
                  onCheckedChange={() =>
                    handleToggleFilter("kycStatuses", "Verified")
                  }
                />
                <Label htmlFor="kyc-verified">Verified</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kyc-pending"
                  checked={localFilters.kycStatuses.includes("Pending")}
                  onCheckedChange={() =>
                    handleToggleFilter("kycStatuses", "Pending")
                  }
                />
                <Label htmlFor="kyc-pending">Pending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="kyc-expired"
                  checked={localFilters.kycStatuses.includes("Expired")}
                  onCheckedChange={() =>
                    handleToggleFilter("kycStatuses", "Expired")
                  }
                />
                <Label htmlFor="kyc-expired">Expired</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Subscription Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sub-confirmed"
                  checked={localFilters.subscriptionStatuses.includes(
                    "Confirmed",
                  )}
                  onCheckedChange={() =>
                    handleToggleFilter("subscriptionStatuses", "Confirmed")
                  }
                />
                <Label htmlFor="sub-confirmed">Confirmed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sub-unconfirmed"
                  checked={localFilters.subscriptionStatuses.includes(
                    "Unconfirmed",
                  )}
                  onCheckedChange={() =>
                    handleToggleFilter("subscriptionStatuses", "Unconfirmed")
                  }
                />
                <Label htmlFor="sub-unconfirmed">Unconfirmed</Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Token Status</h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="token-allocated"
                  checked={localFilters.tokenStatuses.includes("Allocated")}
                  onCheckedChange={() =>
                    handleToggleFilter("tokenStatuses", "Allocated")
                  }
                />
                <Label htmlFor="token-allocated">Allocated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="token-unallocated"
                  checked={localFilters.tokenStatuses.includes("Unallocated")}
                  onCheckedChange={() =>
                    handleToggleFilter("tokenStatuses", "Unallocated")
                  }
                />
                <Label htmlFor="token-unallocated">Unallocated</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="token-distributed"
                  checked={localFilters.tokenStatuses.includes("Distributed")}
                  onCheckedChange={() =>
                    handleToggleFilter("tokenStatuses", "Distributed")
                  }
                />
                <Label htmlFor="token-distributed">Distributed</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="token-undistributed"
                  checked={localFilters.tokenStatuses.includes("Undistributed")}
                  onCheckedChange={() =>
                    handleToggleFilter("tokenStatuses", "Undistributed")
                  }
                />
                <Label htmlFor="token-undistributed">Undistributed</Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
          <Button onClick={handleApply}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterDialog;
