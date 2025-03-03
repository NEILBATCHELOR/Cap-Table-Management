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
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import { Download, FileSpreadsheet } from "lucide-react";
import { Investor } from "@/types/investor";
import { downloadCSV } from "@/lib/csv";

interface CapTableExportDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  investors?: Investor[];
  onExport?: (options: {
    includeKYC: boolean;
    includeWallets: boolean;
    includeTransactions: boolean;
    format: "csv" | "excel";
  }) => void;
}

const CapTableExportDialog = ({
  open = false,
  onOpenChange = () => {},
  investors = [],
  onExport = () => {},
}: CapTableExportDialogProps) => {
  const [includeKYC, setIncludeKYC] = useState(true);
  const [includeWallets, setIncludeWallets] = useState(true);
  const [includeTransactions, setIncludeTransactions] = useState(true);
  const [format, setFormat] = useState<"csv" | "excel">("csv");

  const handleExport = () => {
    onExport({
      includeKYC,
      includeWallets,
      includeTransactions,
      format,
    });
    onOpenChange(false);
  };

  // Calculate summary statistics
  const totalInvestors = investors.length;
  const totalSubscriptions = investors.reduce(
    (sum, inv) => sum + inv.subscriptions.length,
    0,
  );
  const totalTokens = investors.reduce(
    (sum, inv) =>
      sum +
      inv.subscriptions.reduce(
        (subSum, sub) => subSum + (sub.tokenAllocation || 0),
        0,
      ),
    0,
  );
  const distributedTokens = investors.reduce(
    (sum, inv) =>
      sum +
      inv.subscriptions.reduce(
        (subSum, sub) =>
          subSum +
          (sub.distributed && sub.tokenAllocation ? sub.tokenAllocation : 0),
        0,
      ),
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background">
        <DialogHeader>
          <DialogTitle>Export Cap Table</DialogTitle>
          <DialogDescription>
            Generate a comprehensive cap table report with detailed investor and
            token information
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="bg-gray-50 p-4 rounded-md space-y-3">
            <h3 className="text-sm font-medium">Cap Table Summary</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Total Investors:</span>
                <span className="ml-2 font-medium">{totalInvestors}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Subscriptions:</span>
                <span className="ml-2 font-medium">{totalSubscriptions}</span>
              </div>
              <div>
                <span className="text-gray-500">Total Tokens:</span>
                <span className="ml-2 font-medium">{totalTokens}</span>
              </div>
              <div>
                <span className="text-gray-500">Distributed Tokens:</span>
                <span className="ml-2 font-medium">{distributedTokens}</span>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Export Options</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-kyc"
                  checked={includeKYC}
                  onCheckedChange={(checked) => setIncludeKYC(!!checked)}
                />
                <Label htmlFor="include-kyc">Include KYC/AML Information</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-wallets"
                  checked={includeWallets}
                  onCheckedChange={(checked) => setIncludeWallets(!!checked)}
                />
                <Label htmlFor="include-wallets">
                  Include Wallet Addresses
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-transactions"
                  checked={includeTransactions}
                  onCheckedChange={(checked) =>
                    setIncludeTransactions(!!checked)
                  }
                />
                <Label htmlFor="include-transactions">
                  Include Transaction Details
                </Label>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Export Format</h3>
            <div className="flex gap-4">
              <Button
                variant={format === "csv" ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setFormat("csv")}
              >
                <FileSpreadsheet className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant={format === "excel" ? "default" : "outline"}
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() => setFormat("excel")}
                disabled={true} // Excel export not implemented yet
              >
                <FileSpreadsheet className="h-4 w-4" />
                Excel (Coming Soon)
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export Cap Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CapTableExportDialog;
