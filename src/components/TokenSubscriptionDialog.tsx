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
import { Separator } from "./ui/separator";
import { TokenType, Currency } from "@/types/token";
import { Badge } from "./ui/badge";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface TokenSubscriptionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: (subscriptionData: {
    fiatAmount: { amount: number; currency: Currency };
    subscriptionId?: string;
    notes?: string;
  }) => void;
  selectedInvestors?: Array<{
    id: string;
    name: string;
  }>;
}

const TokenSubscriptionDialog = ({
  open = false,
  onOpenChange = () => {},
  onConfirm = () => {},
  selectedInvestors = [],
}: TokenSubscriptionDialogProps) => {
  const [amount, setAmount] = useState("1000");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Call the onConfirm callback with the subscription data
    onConfirm({
      fiatAmount: { amount: Number(amount), currency },
      subscriptionId: subscriptionId || undefined,
      notes: notes || undefined,
    });

    // Close the dialog
    onOpenChange(false);
  };

  // Generate a random subscription ID if not provided
  const generateSubscriptionId = () => {
    const randomId = `SUB-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    setSubscriptionId(randomId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>New Token Subscription</DialogTitle>
          <DialogDescription>
            Create a new token subscription for {selectedInvestors.length}{" "}
            selected investor(s).
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="amount">Subscription Amount</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={currency}
                  onValueChange={(value) => setCurrency(value as Currency)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="subscriptionId">Subscription ID</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateSubscriptionId}
                  className="text-xs h-7"
                >
                  Generate
                </Button>
              </div>
              <Input
                id="subscriptionId"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Optional - Auto-generated if left blank"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes about this subscription"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          {selectedInvestors.length > 0 && (
            <div className="mt-4">
              <Separator className="my-4" />
              <Label>Selected Investors</Label>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                {selectedInvestors.map((investor) => (
                  <div key={investor.id} className="flex items-center gap-2">
                    <Badge variant="outline">{investor.name}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Create Subscription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TokenSubscriptionDialog;
