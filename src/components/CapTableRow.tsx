import React from "react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { TokenType } from "@/types/token";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Check,
  Coins,
  Edit,
  Eye,
  MoreHorizontal,
  SendHorizonal,
  X,
} from "lucide-react";

interface CapTableRowProps {
  row: {
    investorId: string;
    investorName: string;
    tokenType: TokenType;
    subscribedAmount: number;
    confirmed: boolean;
    allocatedAmount: number;
    allocationConfirmed: boolean;
    distributed: boolean;
    selected: boolean;
  };
  onSelect: () => void;
  onAction: (action: string) => void;
}

const CapTableRow = ({ row, onSelect, onAction }: CapTableRowProps) => {
  return (
    <div className="grid grid-cols-[48px_2fr_1.5fr_1.5fr_1fr_1.5fr_1fr_1fr_80px] gap-4 items-center p-4 hover:bg-gray-50 bg-background">
      <div className="flex items-center justify-center">
        <Checkbox checked={row.selected} onCheckedChange={() => onSelect()} />
      </div>

      <div className="truncate">{row.investorName}</div>

      <div>
        <Badge variant="secondary">{row.tokenType}</Badge>
      </div>

      <div className="text-right">{row.subscribedAmount.toLocaleString()}</div>

      <div className="text-center">
        {row.confirmed ? (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Yes
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            No
          </Badge>
        )}
      </div>

      <div className="text-right">{row.allocatedAmount.toLocaleString()}</div>

      <div className="text-center">
        {row.allocationConfirmed ? (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Yes
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            No
          </Badge>
        )}
      </div>

      <div className="text-center">
        {row.distributed ? (
          <Badge
            variant="outline"
            className="bg-green-100 text-green-800 border-green-200"
          >
            Yes
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-gray-100 text-gray-800 border-gray-200"
          >
            No
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onAction("view")}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAction("edit")}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Subscription
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {!row.confirmed && (
              <DropdownMenuItem onClick={() => onAction("confirm")}>
                <Check className="mr-2 h-4 w-4" />
                Confirm Subscription
              </DropdownMenuItem>
            )}
            {row.confirmed && !row.allocationConfirmed && (
              <DropdownMenuItem onClick={() => onAction("allocate")}>
                <Coins className="mr-2 h-4 w-4" />
                Allocate Tokens
              </DropdownMenuItem>
            )}
            {row.allocationConfirmed && !row.distributed && (
              <DropdownMenuItem onClick={() => onAction("distribute")}>
                <SendHorizonal className="mr-2 h-4 w-4" />
                Distribute Tokens
              </DropdownMenuItem>
            )}
            {row.allocationConfirmed && !row.distributed && (
              <DropdownMenuItem onClick={() => onAction("remove_allocation")}>
                <X className="mr-2 h-4 w-4" />
                Remove Allocation
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default CapTableRow;
