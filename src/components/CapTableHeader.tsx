import React from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Coins,
  Download,
  Filter,
  MoreVertical,
  Plus,
  RefreshCw,
  Upload,
  SendHorizonal,
  FileSpreadsheet,
} from "lucide-react";

interface CapTableHeaderProps {
  onUploadCSV?: () => void;
  onUploadSubscriptions?: () => void;
  onDownloadTemplate?: () => void;
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onBulkAction?: (action: string) => void;
}

const CapTableHeader = ({
  onUploadCSV = () => {},
  onUploadSubscriptions = () => {},
  onDownloadTemplate = () => {},
  onSearch = () => {},
  onFilter = () => {},
  onBulkAction = () => {},
}: CapTableHeaderProps) => {
  return (
    <div className="w-full bg-background border-b border-gray-200 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cap Table Management</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download Template
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={onUploadCSV}>
                Upload Investors
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onUploadSubscriptions}>
                Upload Subscriptions
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-md"></div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onFilter}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <MoreVertical className="h-4 w-4" />
                Bulk Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onBulkAction("subscribe")}>
                <Plus className="mr-2 h-4 w-4" />
                Add Subscription
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("screen")}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Screen KYC/AML
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction("check_expirations")}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Check KYC Expirations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("allocate")}>
                <Coins className="mr-2 h-4 w-4" />
                Allocate Tokens
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("distribute")}>
                <SendHorizonal className="mr-2 h-4 w-4" />
                Distribute Tokens
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBulkAction("export")}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBulkAction("generate_cap_table")}
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Generate Cap Table
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export default CapTableHeader;
