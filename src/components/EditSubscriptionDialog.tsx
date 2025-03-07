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
import { Separator } from "./ui/separator";
import { TokenType, Currency, TokenSubscription } from "@/types/token";
import { Badge } from "./ui/badge";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Checkbox } from "./ui/checkbox";

interface EditSubscriptionDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSave?: (subscriptionData: {
    id: string;
    fiatAmount: { amount: number; currency: Currency };
    subscriptionId?: string;
    notes?: string;
    confirmed?: boolean;
  }) => void;
  onDelete?: (id: string) => void;
  subscription?: TokenSubscription;
  investorName?: string;
}

const EditSubscriptionDialog = ({
  open = false,
  onOpenChange = () => {},
  onSave = () => {},
  onDelete = () => {},
  subscription,
  investorName = "Investor",
}: EditSubscriptionDialogProps) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("USD");
  const [subscriptionId, setSubscriptionId] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with subscription data when dialog opens
  useEffect(() => {
    if (subscription && open) {
      setAmount(subscription.fiatSubscription.amount.toString());
      setCurrency(subscription.fiatSubscription.currency);
      setSubscriptionId(subscription.subscriptionId || "");
      setNotes(subscription.notes || "");
      setConfirmed(subscription.confirmed);
      setError(null);
    }
  }, [subscription, open]);

  const handleSave = () => {
    // Validate amount
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount greater than zero");
      return;
    }

    // Clear any previous errors
    setError(null);

    // Call the onSave callback with the subscription data
    if (subscription) {
      onSave({
        id: subscription.id || "",
        fiatAmount: { amount: Number(amount), currency },
        subscriptionId: subscriptionId || undefined,
        notes: notes || undefined,
        confirmed,
      });
    }

    // Close the dialog
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (subscription && subscription.id) {
      onDelete(subscription.id);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-background">
        <DialogHeader>
          <DialogTitle>Edit Subscription</DialogTitle>
          <DialogDescription>
            Edit subscription details for {investorName}
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
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input
                id="subscriptionId"
                value={subscriptionId}
                onChange={(e) => setSubscriptionId(e.target.value)}
                placeholder="Subscription identifier"
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

            <div className="flex items-center space-x-2">
              <Checkbox
                id="confirmed"
                checked={confirmed}
                onCheckedChange={(checked) => setConfirmed(!!checked)}
              />
              <Label htmlFor="confirmed">Confirmed</Label>
            </div>
          </div>

          {subscription && subscription.allocated && (
            <div className="mt-2">
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">
                  Token Allocation
                </AlertTitle>
                <AlertDescription className="text-blue-700">
                  This subscription has tokens allocated to it. Editing may
                  affect the allocation.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between">
          <Button
            variant="destructive"
            onClick={handleDelete}
            className="gap-2"
            disabled={subscription?.distributed}
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSubscriptionDialog;
