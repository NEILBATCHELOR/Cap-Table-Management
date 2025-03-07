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
import { AlertTriangle, Save, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Investor } from "@/types/investor";
import { getAllInvestorTypes } from "@/types/investorTypeCategory";
import { supabase } from "@/lib/supabase";
import { toast } from "./ui/use-toast";

interface EditInvestorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor;
  onUpdate: (updatedInvestor: Investor) => void;
  onRemoveFromCapTable: (investorId: string) => void;
}

const EditInvestorDialog = ({
  open,
  onOpenChange,
  investor,
  onUpdate,
  onRemoveFromCapTable,
}: EditInvestorDialogProps) => {
  const [name, setName] = useState(investor.name);
  const [email, setEmail] = useState(investor.email);
  const [type, setType] = useState(investor.type);
  const [wallet, setWallet] = useState(investor.wallet);
  const [kycStatus, setKycStatus] = useState(investor.kycStatus);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when investor changes
  useEffect(() => {
    if (open) {
      setName(investor.name);
      setEmail(investor.email);
      setType(investor.type);
      setWallet(investor.wallet);
      setKycStatus(investor.kycStatus);
      setError(null);
      setShowRemoveConfirm(false);
    }
  }, [investor, open]);

  const handleUpdate = async () => {
    // Validate inputs
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!wallet.trim()) {
      setError("Wallet address is required");
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      // Update investor in database
      const { error: updateError } = await supabase
        .from("investors")
        .update({
          name,
          email,
          type,
          wallet_address: wallet,
          kyc_status: kycStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("investor_id", investor.id);

      if (updateError) throw updateError;

      // Create updated investor object
      const updatedInvestor = {
        ...investor,
        name,
        email,
        type,
        wallet,
        kycStatus,
      };

      // Call onUpdate callback
      onUpdate(updatedInvestor);

      toast({
        title: "Investor Updated",
        description: `${name} has been updated successfully`,
      });

      onOpenChange(false);
    } catch (err: any) {
      console.error("Error updating investor:", err);
      setError(`Failed to update investor: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveFromCapTable = () => {
    onRemoveFromCapTable(investor.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] bg-background">
        <DialogHeader>
          <DialogTitle>Edit Investor</DialogTitle>
          <DialogDescription>
            Update investor details or remove from the current cap table
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {showRemoveConfirm ? (
          <div className="py-4 space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Confirm Removal</AlertTitle>
              <AlertDescription>
                Are you sure you want to remove {investor.name} from the current
                cap table? This will not delete the investor from the database,
                only remove the association with the current cap table.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowRemoveConfirm(false)}
              >
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRemoveFromCapTable}>
                Remove from Cap Table
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Investor name"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="investor@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="type">Investor Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select investor type" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {getAllInvestorTypes().map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="wallet">Wallet Address</Label>
              <Input
                id="wallet"
                value={wallet}
                onChange={(e) => setWallet(e.target.value)}
                placeholder="0x..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="kycStatus">KYC Status</Label>
              <Select value={kycStatus} onValueChange={setKycStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select KYC status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Verified">Verified</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                  <SelectItem value="Not Started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-2" />

            <DialogFooter className="flex justify-between px-0 pt-2">
              <Button
                variant="destructive"
                onClick={() => setShowRemoveConfirm(true)}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Remove from Cap Table
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isUpdating ? "Updating..." : "Update Investor"}
                </Button>
              </div>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditInvestorDialog;
