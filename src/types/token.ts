export type TokenType =
  | "ERC-20"
  | "ERC-721"
  | "ERC-1155"
  | "ERC-1400"
  | "ERC-3525";
export type Currency = "USD" | "EUR" | "GBP";

export interface FiatAmount {
  amount: number;
  currency: Currency;
}

export interface TokenSubscription {
  id?: string;
  subscriptionId?: string;
  tokenType?: TokenType;
  fiatSubscription: FiatAmount;
  tokenAllocation?: number;
  tokenAllocationId?: string;
  confirmed: boolean;
  allocated: boolean;
  distributed: boolean;
  notes?: string;
  subscriptionDate?: string;
}

export interface TokenDesign {
  id: string;
  name: string;
  type: TokenType;
  status: "draft" | "ready" | "minted";
  totalSupply: number;
}
