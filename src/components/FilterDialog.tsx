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
      <DialogContent className="sm:max-w-[500px] bg-background">
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
              <h4 className="text-xs font-medium mb-2">
                Institutional Investors
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-pension-fund"
                    checked={localFilters.types.includes("Pension Fund")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Pension Fund")
                    }
                  />
                  <Label htmlFor="type-pension-fund" className="text-xs">
                    Pension Funds
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-swf"
                    checked={localFilters.types.includes(
                      "Sovereign Wealth Fund",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Sovereign Wealth Fund")
                    }
                  />
                  <Label htmlFor="type-swf" className="text-xs">
                    SWFs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-insurance"
                    checked={localFilters.types.includes("Insurance Company")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Insurance Company")
                    }
                  />
                  <Label htmlFor="type-insurance" className="text-xs">
                    Insurance Companies
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-endowment"
                    checked={localFilters.types.includes(
                      "Endowment & Foundation",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Endowment & Foundation")
                    }
                  />
                  <Label htmlFor="type-endowment" className="text-xs">
                    Endowments & Foundations
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-asset-manager"
                    checked={localFilters.types.includes(
                      "Asset Manager & Mutual Fund",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Asset Manager & Mutual Fund")
                    }
                  />
                  <Label htmlFor="type-asset-manager" className="text-xs">
                    Asset Managers
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-hedge-fund"
                    checked={localFilters.types.includes("Hedge Fund")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Hedge Fund")
                    }
                  />
                  <Label htmlFor="type-hedge-fund" className="text-xs">
                    Hedge Funds
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-pe-vc"
                    checked={localFilters.types.includes(
                      "Private Equity & Venture Capital",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter(
                        "types",
                        "Private Equity & Venture Capital",
                      )
                    }
                  />
                  <Label htmlFor="type-pe-vc" className="text-xs">
                    PE & VC Firms
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-family-office"
                    checked={localFilters.types.includes("Family Office")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Family Office")
                    }
                  />
                  <Label htmlFor="type-family-office" className="text-xs">
                    Family Offices
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-bank"
                    checked={localFilters.types.includes(
                      "Bank & Investment Firm",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Bank & Investment Firm")
                    }
                  />
                  <Label htmlFor="type-bank" className="text-xs">
                    Banks & Investment Firms
                  </Label>
                </div>
              </div>

              <h4 className="text-xs font-medium mt-4 mb-2">
                Retail Investors
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-hnwi"
                    checked={localFilters.types.includes(
                      "High-Net-Worth Individual",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "High-Net-Worth Individual")
                    }
                  />
                  <Label htmlFor="type-hnwi" className="text-xs">
                    HNWIs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-mass-affluent"
                    checked={localFilters.types.includes(
                      "Mass Affluent Investor",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Mass Affluent Investor")
                    }
                  />
                  <Label htmlFor="type-mass-affluent" className="text-xs">
                    Mass Affluent
                  </Label>
                </div>
              </div>

              <h4 className="text-xs font-medium mt-4 mb-2">
                Corporate & Strategic
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-corporate"
                    checked={localFilters.types.includes(
                      "Corporate & Conglomerate",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Corporate & Conglomerate")
                    }
                  />
                  <Label htmlFor="type-corporate" className="text-xs">
                    Corporates
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-private-company"
                    checked={localFilters.types.includes(
                      "Private Company & Holding",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Private Company & Holding")
                    }
                  />
                  <Label htmlFor="type-private-company" className="text-xs">
                    Private Companies
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-strategic"
                    checked={localFilters.types.includes("Strategic Investor")}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Strategic Investor")
                    }
                  />
                  <Label htmlFor="type-strategic" className="text-xs">
                    Strategic Investors
                  </Label>
                </div>
              </div>

              <h4 className="text-xs font-medium mt-4 mb-2">
                Alternative & Thematic
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-reit"
                    checked={localFilters.types.includes(
                      "Real Estate Investment Trust",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter(
                        "types",
                        "Real Estate Investment Trust",
                      )
                    }
                  />
                  <Label htmlFor="type-reit" className="text-xs">
                    REITs
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-infrastructure"
                    checked={localFilters.types.includes(
                      "Infrastructure Investor",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter("types", "Infrastructure Investor")
                    }
                  />
                  <Label htmlFor="type-infrastructure" className="text-xs">
                    Infrastructure
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-commodities"
                    checked={localFilters.types.includes(
                      "Commodities & Natural Resources Fund",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter(
                        "types",
                        "Commodities & Natural Resources Fund",
                      )
                    }
                  />
                  <Label htmlFor="type-commodities" className="text-xs">
                    Commodities
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="type-crypto"
                    checked={localFilters.types.includes(
                      "Institutional Crypto Investor",
                    )}
                    onCheckedChange={() =>
                      handleToggleFilter(
                        "types",
                        "Institutional Crypto Investor",
                      )
                    }
                  />
                  <Label htmlFor="type-crypto" className="text-xs">
                    Crypto Investors
                  </Label>
                </div>
              </div>

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
