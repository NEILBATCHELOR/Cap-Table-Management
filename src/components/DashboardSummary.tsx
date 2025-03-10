import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { Investor } from "@/types/investor";
import {
  Users,
  Coins,
  CheckCircle2,
  AlertTriangle,
  Shield,
} from "lucide-react";

interface DashboardSummaryProps {
  investors: Investor[];
}

const DashboardSummary = ({ investors = [] }: DashboardSummaryProps) => {
  // Calculate metrics
  const totalInvestors = investors.length;
  const totalTokensAllocated = investors.reduce(
    (sum, inv) =>
      sum +
      inv.subscriptions.reduce(
        (subSum, sub) => subSum + (sub.tokenAllocation || 0),
        0,
      ),
    0,
  );
  const totalTokensDistributed = investors.reduce(
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

  const distributionProgress =
    totalTokensAllocated > 0
      ? Math.round((totalTokensDistributed / totalTokensAllocated) * 100)
      : 0;

  // KYC status counts
  const kycVerified = investors.filter(
    (inv) => inv.kycStatus === "Verified" || inv.kycStatus === "Approved",
  ).length;
  const kycExpired = investors.filter(
    (inv) => inv.kycStatus === "Expired" || inv.kycStatus === "Failed",
  ).length;
  const kycPending = investors.filter(
    (inv) => inv.kycStatus === "Pending",
  ).length;
  const kycNotStarted = investors.filter(
    (inv) => inv.kycStatus === "Not Started",
  ).length;

  // Investor types by category
  const institutionalTypes = [
    "Pension Fund",
    "Sovereign Wealth Fund",
    "Insurance Company",
    "Endowment & Foundation",
    "Asset Manager & Mutual Fund",
    "Hedge Fund",
    "Private Equity & Venture Capital",
    "Family Office",
    "Bank & Investment Firm",
    "Institution",
  ];

  const retailTypes = [
    "High-Net-Worth Individual",
    "Mass Affluent Investor",
    "Individual",
  ];

  const corporateTypes = [
    "Corporate & Conglomerate",
    "Private Company & Holding",
    "Strategic Investor",
  ];

  const alternativeTypes = [
    "Real Estate Investment Trust",
    "Infrastructure Investor",
    "Commodities & Natural Resources Fund",
    "Distressed & Special Situations Investor",
    "Quantitative & Algorithmic Investor",
    "Institutional Crypto Investor",
  ];

  const governmentTypes = [
    "Development Finance Institution",
    "Government Investment Vehicle",
    "Multilateral Institution",
  ];

  // Count investors by category using case-insensitive comparison
  const institutionalInvestors = investors.filter((inv) =>
    institutionalTypes.some(
      (t) => t.toLowerCase() === (inv.type || "").toLowerCase(),
    ),
  ).length;
  const retailInvestors = investors.filter((inv) =>
    retailTypes.some((t) => t.toLowerCase() === (inv.type || "").toLowerCase()),
  ).length;
  const corporateInvestors = investors.filter((inv) =>
    corporateTypes.some(
      (t) => t.toLowerCase() === (inv.type || "").toLowerCase(),
    ),
  ).length;
  const alternativeInvestors = investors.filter((inv) =>
    alternativeTypes.some(
      (t) => t.toLowerCase() === (inv.type || "").toLowerCase(),
    ),
  ).length;
  const governmentInvestors = investors.filter((inv) =>
    governmentTypes.some(
      (t) => t.toLowerCase() === (inv.type || "").toLowerCase(),
    ),
  ).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInvestors}</div>
          <div className="text-xs text-muted-foreground mt-1">
            <div className="flex flex-wrap gap-x-2">
              <span>{institutionalInvestors} Institutional</span>
              <span>{retailInvestors} Retail</span>
              <span>{corporateInvestors} Corporate</span>
              <span>{alternativeInvestors} Alternative</span>
              <span>{governmentInvestors} Government</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Token Allocation
          </CardTitle>
          <Coins className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalTokensAllocated.toLocaleString()}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {totalTokensDistributed.toLocaleString()} distributed
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">
            Distribution Progress
          </CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{distributionProgress}%</div>
          <Progress value={distributionProgress} className="h-2 mt-2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">KYC Status</CardTitle>
          <Shield className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {kycVerified > 0 && (
              <Badge
                variant="outline"
                className="bg-green-100 text-green-800 border-green-200"
              >
                {kycVerified} Approved
              </Badge>
            )}
            {kycPending > 0 && (
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200"
              >
                {kycPending} Pending
              </Badge>
            )}
            {kycExpired > 0 && (
              <Badge
                variant="outline"
                className="bg-red-100 text-red-800 border-red-200"
              >
                {kycExpired} Failed/Expired
              </Badge>
            )}
            {kycNotStarted > 0 && (
              <Badge
                variant="outline"
                className="bg-gray-100 text-gray-800 border-gray-200"
              >
                {kycNotStarted} Not Started
              </Badge>
            )}
            {kycVerified === 0 &&
              kycPending === 0 &&
              kycExpired === 0 &&
              kycNotStarted === 0 && (
                <Badge
                  variant="outline"
                  className="bg-gray-100 text-gray-800 border-gray-200"
                >
                  0 Investors
                </Badge>
              )}
          </div>
          {kycExpired > 0 && (
            <div className="flex items-center mt-2 text-xs text-red-600">
              <AlertTriangle className="h-3 w-3 mr-1" />
              {kycExpired} investor(s) need KYC renewal
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSummary;
