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
import { Separator } from "./ui/separator";
import { Investor } from "@/types/investor";
import { TokenSubscription } from "@/types/token";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { AlertTriangle, Check, Edit, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface SubscriptionManagementDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  selectedInvestors?: Investor[];
  onAddSubscription?: () => void;
  onEditSubscription?: (
    investorId: string,
    subscription: TokenSubscription,
  ) => void;
  onConfirmSubscriptions?: (subscriptionIds: string[]) => void;
  onRemoveSubscriptions?: (subscriptionIds: string[]) => void;
}

const SubscriptionManagementDialog = ({
  open = false,
  onOpenChange = () => {},
  selectedInvestors = [],
  onAddSubscription = () => {},
  onEditSubscription = () => {},
  onConfirmSubscriptions = () => {},
  onRemoveSubscriptions = () => {},
}: SubscriptionManagementDialogProps) => {
  const [selectedSubscriptions, setSelectedSubscriptions] = useState<string[]>(
    [],
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleToggleSubscription = (id: string) => {
    setSelectedSubscriptions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    const allSubscriptionIds = selectedInvestors
      .flatMap((investor) => investor.subscriptions)
      .map((sub) => sub.id)
      .filter((id): id is string => id !== undefined);

    if (selectedSubscriptions.length === allSubscriptionIds.length) {
      setSelectedSubscriptions([]);
    } else {
      setSelectedSubscriptions(allSubscriptionIds);
    }
  };

  const handleConfirmSelected = () => {
    onConfirmSubscriptions(selectedSubscriptions);
    setSelectedSubscriptions([]);
    onOpenChange(false);
  };

  const handleRemoveSelected = () => {
    onRemoveSubscriptions(selectedSubscriptions);
    setShowDeleteConfirm(false);
    setSelectedSubscriptions([]);
    onOpenChange(false);
  };

  // Count unconfirmed subscriptions that are selected
  const selectedUnconfirmedCount = selectedInvestors
    .flatMap((investor) => investor.subscriptions)
    .filter(
      (sub) =>
        !sub.confirmed && sub.id && selectedSubscriptions.includes(sub.id),
    ).length;

  // Count total subscriptions
  const totalSubscriptions = selectedInvestors.reduce(
    (sum, investor) => sum + investor.subscriptions.length,
    0,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] bg-background max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscription Management</DialogTitle>
          <DialogDescription>
            Manage subscriptions for {selectedInvestors.length} selected
            investor(s)
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="py-4 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You are about to remove {selectedSubscriptions.length}{" "}
                subscription(s). This action cannot be undone. Are you sure you
                want to continue?
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveSelected}>
                Remove Subscriptions
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="py-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={
                      selectedSubscriptions.length === totalSubscriptions &&
                      totalSubscriptions > 0
                    }
                    onCheckedChange={handleSelectAll}
                    disabled={totalSubscriptions === 0}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>

                <div className="text-sm text-muted-foreground">
                  {selectedSubscriptions.length} of {totalSubscriptions}{" "}
                  selected
                </div>
              </div>

              <Separator />

              {selectedInvestors.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No investors selected
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedInvestors.map((investor) => (
                    <div key={investor.id} className="space-y-2">
                      <h3 className="font-medium">{investor.name}</h3>

                      {investor.subscriptions.length === 0 ? (
                        <div className="text-sm text-gray-500 py-2">
                          No subscriptions
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {investor.subscriptions.map((subscription) => (
                            <div
                              key={subscription.id}
                              className="flex items-center justify-between p-3 border rounded-md hover:bg-gray-50"
                            >
                              <div className="flex items-start space-x-3">
                                {subscription.id && (
                                  <Checkbox
                                    id={`sub-${subscription.id}`}
                                    checked={selectedSubscriptions.includes(
                                      subscription.id,
                                    )}
                                    onCheckedChange={() =>
                                      handleToggleSubscription(
                                        subscription.id || "",
                                      )
                                    }
                                  />
                                )}
                                <div>
                                  <div className="font-medium">
                                    {subscription.fiatSubscription.amount}{" "}
                                    {subscription.fiatSubscription.currency}
                                    {subscription.subscriptionId && (
                                      <span className="ml-2 text-sm text-gray-500">
                                        ({subscription.subscriptionId})
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex gap-1 mt-1">
                                    <Badge
                                      variant={
                                        subscription.confirmed
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {subscription.confirmed
                                        ? "Confirmed"
                                        : "Unconfirmed"}
                                    </Badge>
                                    <Badge
                                      variant={
                                        subscription.allocated
                                          ? "default"
                                          : "secondary"
                                      }
                                    >
                                      {subscription.allocated
                                        ? "Allocated"
                                        : "Unallocated"}
                                    </Badge>
                                    {subscription.distributed && (
                                      <Badge variant="default">
                                        Distributed
                                      </Badge>
                                    )}
                                  </div>
                                  {subscription.notes && (
                                    <div className="text-sm text-gray-500 mt-1">
                                      {subscription.notes}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2"
                                onClick={() =>
                                  onEditSubscription(investor.id, subscription)
                                }
                                disabled={subscription.distributed}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          onAddSubscription();
                          onOpenChange(false);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Subscription
                      </Button>

                      <Separator className="my-4" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex justify-between">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedSubscriptions.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove Selected
              </Button>
              <div>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSelected}
                  disabled={selectedUnconfirmedCount === 0}
                  className="gap-2"
                >
                  <Check className="h-4 w-4" />
                  Confirm Selected
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionManagementDialog;
