import { TokenSubscription } from "./token";

export type InvestorType =
  | "Pension Fund"
  | "Sovereign Wealth Fund"
  | "Insurance Company"
  | "Endowment & Foundation"
  | "Asset Manager & Mutual Fund"
  | "Hedge Fund"
  | "Private Equity & Venture Capital"
  | "Family Office"
  | "Bank & Investment Firm"
  | "High-Net-Worth Individual"
  | "Mass Affluent Investor"
  | "Corporate & Conglomerate"
  | "Private Company & Holding"
  | "Strategic Investor"
  | "Development Finance Institution"
  | "Government Investment Vehicle"
  | "Multilateral Institution"
  | "Real Estate Investment Trust"
  | "Infrastructure Investor"
  | "Commodities & Natural Resources Fund"
  | "Distressed & Special Situations Investor"
  | "Quantitative & Algorithmic Investor"
  | "Institutional Crypto Investor"
  | "Individual"
  | "Institution";

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
