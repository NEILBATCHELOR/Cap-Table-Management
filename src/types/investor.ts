import { TokenSubscription } from "./token";

// Import all investor type names from the categories
import { getAllInvestorTypes } from "./investorTypeCategory";

// Create a union type from all the investor type names
type InvestorTypeNames = typeof getAllInvestorTypes extends () => Array<infer T>
  ? T
  : never;

// For backward compatibility
export type InvestorType = InvestorTypeNames | "Individual" | "Institution";

export interface Investor {
  id: string;
  name: string;
  email: string;
  type: InvestorType;
  kycStatus: "Verified" | "Expired" | "Pending";
  wallet: string;
  selected?: boolean;
  kycExpiryDate?: Date;
  country?: string;
  accreditationStatus?: "Accredited" | "Non-Accredited" | "Pending";
  investorId?: string;
  subscriptions: TokenSubscription[];
}

export interface InvestorCSV {
  name: string;
  email: string;
  type: string;
  wallet: string;
  country?: string;
  investorId?: string;
}
