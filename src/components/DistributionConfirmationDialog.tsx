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
import { AlertTriangle, CheckCircle2, SendHorizonal } from "lucide-react";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Badge } from "./ui/badge";

interface DistributionConfirmationDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  distributionData?: {
    investors: number;
    totalTokens: number;
    tokenTypes: string[];
    estimatedGasFee?: string;
  };
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
}

const DistributionConfirmationDialog = ({
  open = false,
  onOpenChange = () => {},
  distributionData = {
    investors: 0,
    totalTokens: 0,
    tokenTypes: [],
    estimatedGasFee: "0.005 ETH",
  },
  onConfirm = async () => {},
  onCancel = () => {},
}: DistributionConfirmationDialogProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    if (!confirmed) return;

    try {
      setIsProcessing(true);
      setError(null);
      setProgress(0);

      // Create a more realistic progress simulation with random increments
      // and occasional pauses to simulate blockchain transactions
      let currentProgress = 0;
      const updateInterval = setInterval(() => {
        // Random increment between 1-5%
        const increment = Math.floor(Math.random() * 5) + 1;
        currentProgress += increment;

        // Add occasional pauses at specific thresholds to simulate blockchain confirmations
        if (currentProgress >= 30 && currentProgress < 35) {
          // Pause at ~30% (simulating initial transaction submission)
          return;
        } else if (currentProgress >= 60 && currentProgress < 65) {
          // Pause at ~60% (simulating waiting for confirmations)
          return;
        } else if (currentProgress >= 90) {
          // Slow down near the end
          currentProgress += 0.5;
        }

        if (currentProgress >= 100) {
          clearInterval(updateInterval);
          currentProgress = 100;
        }

        setProgress(currentProgress);
      }, 200);

      // Call the actual confirmation function
      await onConfirm();

      // Ensure we reach 100%
      clearInterval(updateInterval);
      setProgress(100);
      setSuccess(true);

      // Auto-close after success
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setConfirmed(false);
        setProgress(0);
        setIsProcessing(false);
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to distribute tokens",
      );
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => !isProcessing && onOpenChange(open)}
    >
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Confirm Token Distribution</DialogTitle>
          <DialogDescription>
            Please review and confirm the token distribution details
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">
              Tokens have been successfully distributed
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {isProcessing ? (
            <div className="space-y-4">
              <p className="text-center">Processing token distribution...</p>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-center text-gray-500">
                {progress < 30
                  ? "Preparing transactions..."
                  : progress < 60
                    ? "Submitting transactions to the blockchain..."
                    : progress < 90
                      ? "Waiting for blockchain confirmations..."
                      : progress < 100
                        ? "Finalizing distribution..."
                        : "Distribution complete!"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md bg-gray-50 p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Investors:</span>
                  <span className="font-medium">
                    {distributionData.investors}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Total Tokens:</span>
                  <span className="font-medium">
                    {distributionData.totalTokens}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Token Types:</span>
                  <div className="flex gap-1">
                    {distributionData.tokenTypes.map((type, index) => (
                      <Badge key={index} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                {distributionData.estimatedGasFee && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">
                      Estimated Gas Fee:
                    </span>
                    <span className="font-medium">
                      {distributionData.estimatedGasFee}
                    </span>
                  </div>
                )}
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Important</AlertTitle>
                <AlertDescription className="text-blue-700">
                  This action will distribute tokens to investor wallets and
                  cannot be undone. Please ensure all details are correct before
                  proceeding.
                </AlertDescription>
              </Alert>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={(checked) =>
                    setConfirmed(checked as boolean)
                  }
                />
                <Label htmlFor="confirm" className="text-sm">
                  I confirm that I want to distribute these tokens to the
                  selected investors
                </Label>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing || !confirmed || success}
            className="gap-2"
          >
            <SendHorizonal className="h-4 w-4" />
            Distribute Tokens
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DistributionConfirmationDialog;
