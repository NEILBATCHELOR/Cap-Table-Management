import React from "react";
import { getInvestorTypeCategory } from "@/lib/investorUtils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import KycStatusBadge from "./KycStatusBadge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "./ui/tooltip";
import {
  Eye,
  MoreHorizontal,
  Shield,
  Check,
  Ban,
  Coins,
  RefreshCw,
  SendHorizonal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Investor } from "@/types/investor";

interface InvestorTableRowProps {
  investor?: Investor;
  onSelect?: (id: string) => void;
  onView?: (id: string) => void;
  onAction?: (
    id: string,
    action:
      | "confirm"
      | "reject"
      | "distribute"
      | "screen"
      | "allocate"
      | "remove_allocation"
      | "remove_subscription",
  ) => void;
}

const InvestorTableRow = ({
  investor = {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    type: "Individual",
    kycStatus: "Verified",
    wallet: "0x1234...5678",
    subscriptions: [],
    selected: false,
  },
  onSelect = () => {},
  onView = () => {},
  onAction = () => {},
}: InvestorTableRowProps) => {
  const getCategoryForType = (type: string) => {
    return getInvestorTypeCategory(type);
  };

  const getKycStatusColor = (status: string, expiryDate?: Date) => {
    // Check if verification is about to expire (within 30 days)
    const isNearExpiry =
      expiryDate &&
      status === "Verified" &&
      expiryDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

    switch (status) {
      case "Verified":
      case "Approved":
        return isNearExpiry
          ? "bg-orange-100 text-orange-800 border-orange-200"
          : "bg-green-100 text-green-800 border-green-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      case "Failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Not Started":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="grid grid-cols-[48px_2fr_2fr_1.5fr_1fr_2fr_1fr_1fr_80px] gap-4 items-center p-4 border-b border-gray-200 hover:bg-gray-50 bg-background">
      <div className="flex items-center justify-center">
        <Checkbox
          checked={investor.selected}
          onCheckedChange={() => onSelect(investor.id)}
        />
      </div>

      <div className="truncate">{investor.name}</div>

      <div className="truncate text-gray-600">{investor.email}</div>

      <div className="text-left">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="cursor-help">
                {investor.type}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Category: {getCategoryForType(investor.type)}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <KycStatusBadge
                  status={investor.kycStatus}
                  expiryDate={investor.kycExpiryDate}
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {investor.kycExpiryDate ? (
                <p>
                  Expires:{" "}
                  {new Date(investor.kycExpiryDate).toLocaleDateString()}
                </p>
              ) : (
                <p>No expiration date</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="truncate text-gray-600 text-left" title={investor.wallet}>
        {investor.wallet}
      </div>

      <div className="text-right">
        {investor.subscriptions.map((sub, index) => (
          <div
            key={index}
            className={`text-sm ${sub.confirmed ? "text-green-600 font-medium" : "text-gray-600"}`}
          >
            {sub.fiatSubscription
              ? `${sub.fiatSubscription.amount.toLocaleString()} ${sub.fiatSubscription.currency}`
              : "-"}
            {sub.subscriptionId && (
              <div className="text-xs text-gray-500">{sub.subscriptionId}</div>
            )}
          </div>
        ))}
      </div>
      <div className="text-right space-y-1">
        {investor.subscriptions.map((sub, index) => (
          <div key={index} className="text-sm">
            {sub.tokenAllocation
              ? `${sub.tokenAllocation} ${sub.tokenType}`
              : "-"}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" onClick={() => onView(investor.id)}>
          <Eye className="h-4 w-4" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            {investor.subscriptions.some((sub) => !sub.confirmed) && (
              <DropdownMenuItem
                onClick={() => onAction(investor.id, "confirm")}
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Subscription
              </DropdownMenuItem>
            )}
            {investor.subscriptions.some((sub) => !sub.allocated) ? (
              <DropdownMenuItem
                onClick={() => onAction(investor.id, "allocate")}
              >
                <Coins className="mr-2 h-4 w-4" />
                Allocate Tokens
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem
                  onClick={() => onAction(investor.id, "distribute")}
                >
                  <SendHorizonal className="mr-2 h-4 w-4" />
                  Distribute Tokens
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onAction(investor.id, "remove_allocation")}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Remove Allocation
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onAction(investor.id, "remove_subscription")}
              className="text-red-600 hover:text-red-700"
            >
              <Ban className="mr-2 h-4 w-4" />
              Remove Subscription
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => onAction(investor.id, "screen")}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Screen KYC/AML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default InvestorTableRow;
