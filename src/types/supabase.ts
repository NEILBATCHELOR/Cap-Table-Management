export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      investors: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          email: string;
          type: string;
          kyc_status: string;
          wallet: string;
          country: string | null;
          investor_id: string | null;
          kyc_expiry_date: string | null;
          accreditation_status: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          email: string;
          type: string;
          kyc_status?: string;
          wallet: string;
          country?: string | null;
          investor_id?: string | null;
          kyc_expiry_date?: string | null;
          accreditation_status?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          email?: string;
          type?: string;
          kyc_status?: string;
          wallet?: string;
          country?: string | null;
          investor_id?: string | null;
          kyc_expiry_date?: string | null;
          accreditation_status?: string | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          created_at: string;
          investor_id: string;
          subscription_id: string;
          fiat_amount: number;
          currency: string;
          confirmed: boolean;
          allocated: boolean;
          distributed: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          investor_id: string;
          subscription_id: string;
          fiat_amount: number;
          currency: string;
          confirmed?: boolean;
          allocated?: boolean;
          distributed?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          investor_id?: string;
          subscription_id?: string;
          fiat_amount?: number;
          currency?: string;
          confirmed?: boolean;
          allocated?: boolean;
          distributed?: boolean;
        };
      };
      token_allocations: {
        Row: {
          id: string;
          created_at: string;
          subscription_id: string;
          token_type: string;
          token_amount: number;
          distributed: boolean;
          distribution_date: string | null;
          distribution_tx_hash: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          subscription_id: string;
          token_type: string;
          token_amount: number;
          distributed?: boolean;
          distribution_date?: string | null;
          distribution_tx_hash?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          subscription_id?: string;
          token_type?: string;
          token_amount?: number;
          distributed?: boolean;
          distribution_date?: string | null;
          distribution_tx_hash?: string | null;
        };
      };
      token_designs: {
        Row: {
          id: string;
          created_at: string;
          name: string;
          type: string;
          status: string;
          total_supply: number;
          contract_address: string | null;
          deployment_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          name: string;
          type: string;
          status?: string;
          total_supply: number;
          contract_address?: string | null;
          deployment_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          name?: string;
          type?: string;
          status?: string;
          total_supply?: number;
          contract_address?: string | null;
          deployment_date?: string | null;
        };
      };
    };
    Views: {
      investor_subscriptions_view: {
        Row: {
          investor_id: string | null;
          investor_name: string | null;
          investor_email: string | null;
          investor_type: string | null;
          kyc_status: string | null;
          wallet: string | null;
          subscription_id: string | null;
          fiat_amount: number | null;
          currency: string | null;
          confirmed: boolean | null;
          allocated: boolean | null;
          distributed: boolean | null;
          token_type: string | null;
          token_amount: number | null;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
