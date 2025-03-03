import React from "react";
import { getInvestorTypeCategory } from "@/lib/investorUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { Investor } from "@/types/investor";

interface InvestorDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  investor: Investor;
}

const InvestorDetailsDialog = ({
  open,
  onOpenChange,
  investor,
}: InvestorDetailsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background">
        <DialogHeader>
          <DialogTitle>Investor Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{investor.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium">{investor.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Type</p>
                <div className="flex flex-col gap-1">
                  <Badge variant="secondary">{investor.type}</Badge>
                  <span className="text-xs text-gray-500">
                    Category: {getInvestorTypeCategory(investor.type)}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">KYC Status</p>
                <div className="flex flex-col gap-1">
                  <Badge
                    className={
                      investor.kycStatus === "Verified"
                        ? "bg-green-100 text-green-800"
                        : investor.kycStatus === "Expired"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {investor.kycStatus}
                  </Badge>
                  {investor.kycExpiryDate && (
                    <span className="text-xs text-gray-500">
                      {investor.kycStatus === "Verified"
                        ? "Expires"
                        : "Expired"}
                      : {new Date(investor.kycExpiryDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Wallet Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Wallet Information</h3>
            <div>
              <p className="text-sm text-gray-500">Wallet Address</p>
              <p className="font-mono bg-gray-50 p-2 rounded mt-1">
                {investor.wallet}
              </p>
            </div>
          </div>

          <Separator />

          {/* Token Subscriptions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Token Subscriptions</h3>
            {investor.subscriptions.length > 0 ? (
              <div className="space-y-4">
                {investor.subscriptions.map((sub, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-4 rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{sub.tokenType}</span>
                      <span className="text-lg font-semibold">
                        {sub.fiatSubscription.amount}{" "}
                        {sub.fiatSubscription.currency}
                        {sub.tokenAllocation && (
                          <span className="text-sm text-gray-500 ml-2">
                            ({sub.tokenAllocation} tokens)
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={sub.confirmed ? "default" : "secondary"}>
                        {sub.confirmed ? "Confirmed" : "Pending Confirmation"}
                      </Badge>
                      <Badge variant={sub.allocated ? "default" : "secondary"}>
                        {sub.allocated ? "Allocated" : "Pending Allocation"}
                      </Badge>
                      <Badge
                        variant={sub.distributed ? "default" : "secondary"}
                      >
                        {sub.distributed
                          ? "Distributed"
                          : "Pending Distribution"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No token subscriptions yet</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvestorDetailsDialog;
