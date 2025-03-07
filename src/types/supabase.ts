export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cap_table_investors: {
        Row: {
          cap_table_id: string | null
          created_at: string | null
          id: string
          investor_id: string | null
        }
        Insert: {
          cap_table_id?: string | null
          created_at?: string | null
          id?: string
          investor_id?: string | null
        }
        Update: {
          cap_table_id?: string | null
          created_at?: string | null
          id?: string
          investor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cap_table_investors_cap_table_id_fkey"
            columns: ["cap_table_id"]
            isOneToOne: false
            referencedRelation: "cap_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cap_table_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      cap_tables: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cap_tables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_groups: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      investor_groups_investors: {
        Row: {
          created_at: string | null
          group_id: string
          id: string
          investor_id: string
        }
        Insert: {
          created_at?: string | null
          group_id: string
          id?: string
          investor_id: string
        }
        Update: {
          created_at?: string | null
          group_id?: string
          id?: string
          investor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "investor_groups_investors_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "investor_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_groups_investors_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      investors: {
        Row: {
          created_at: string | null
          email: string
          investor_id: string
          kyc_status: string
          lastUpdated: string | null
          name: string
          type: string
          updated_at: string | null
          verification_details: Json | null
          wallet_address: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          investor_id?: string
          kyc_status: string
          lastUpdated?: string | null
          name: string
          type: string
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          investor_id?: string
          kyc_status?: string
          lastUpdated?: string | null
          name?: string
          type?: string
          updated_at?: string | null
          verification_details?: Json | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          allocated: boolean
          confirmed: boolean
          created_at: string | null
          currency: string
          distributed: boolean
          fiat_amount: number
          id: string
          investor_id: string
          notes: string | null
          subscription_date: string | null
          subscription_id: string
          updated_at: string | null
        }
        Insert: {
          allocated?: boolean
          confirmed?: boolean
          created_at?: string | null
          currency: string
          distributed?: boolean
          fiat_amount: number
          id?: string
          investor_id: string
          notes?: string | null
          subscription_date?: string | null
          subscription_id: string
          updated_at?: string | null
        }
        Update: {
          allocated?: boolean
          confirmed?: boolean
          created_at?: string | null
          currency?: string
          distributed?: boolean
          fiat_amount?: number
          id?: string
          investor_id?: string
          notes?: string | null
          subscription_date?: string | null
          subscription_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_investor_id_fkey"
            columns: ["investor_id"]
            isOneToOne: false
            referencedRelation: "investors"
            referencedColumns: ["investor_id"]
          },
        ]
      }
      token_allocations: {
        Row: {
          created_at: string | null
          distributed: boolean
          distribution_date: string | null
          distribution_tx_hash: string | null
          id: string
          subscription_id: string
          token_amount: number
          token_type: string
        }
        Insert: {
          created_at?: string | null
          distributed?: boolean
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: string
          subscription_id: string
          token_amount: number
          token_type: string
        }
        Update: {
          created_at?: string | null
          distributed?: boolean
          distribution_date?: string | null
          distribution_tx_hash?: string | null
          id?: string
          subscription_id?: string
          token_amount?: number
          token_type?: string
        }
        Relationships: []
      }
      token_comments: {
        Row: {
          comment: string
          created_at: string | null
          id: string
          token_id: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string | null
          id?: string
          token_id: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string | null
          id?: string
          token_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_comments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_deployments: {
        Row: {
          contract_address: string
          deployed_at: string | null
          deployed_by: string
          deployment_data: Json | null
          id: string
          network: string
          status: string
          token_id: string
          transaction_hash: string
        }
        Insert: {
          contract_address: string
          deployed_at?: string | null
          deployed_by: string
          deployment_data?: Json | null
          id?: string
          network: string
          status?: string
          token_id: string
          transaction_hash: string
        }
        Update: {
          contract_address?: string
          deployed_at?: string | null
          deployed_by?: string
          deployment_data?: Json | null
          id?: string
          network?: string
          status?: string
          token_id?: string
          transaction_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_deployments_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_designs: {
        Row: {
          contract_address: string | null
          created_at: string | null
          deployment_date: string | null
          id: string
          name: string
          status: string
          total_supply: number
          type: string
        }
        Insert: {
          contract_address?: string | null
          created_at?: string | null
          deployment_date?: string | null
          id?: string
          name: string
          status?: string
          total_supply: number
          type: string
        }
        Update: {
          contract_address?: string | null
          created_at?: string | null
          deployment_date?: string | null
          id?: string
          name?: string
          status?: string
          total_supply?: number
          type?: string
        }
        Relationships: []
      }
      token_versions: {
        Row: {
          created_at: string | null
          created_by: string | null
          data: Json
          id: string
          token_id: string
          version: number
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          data: Json
          id?: string
          token_id: string
          version: number
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          data?: Json
          id?: string
          token_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_versions_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      tokens: {
        Row: {
          approvals: string[] | null
          blocks: Json
          contract_preview: string | null
          created_at: string | null
          decimals: number
          id: string
          metadata: Json | null
          name: string
          project_id: string
          reviewers: string[] | null
          standard: string
          status: string
          symbol: string
          updated_at: string | null
        }
        Insert: {
          approvals?: string[] | null
          blocks: Json
          contract_preview?: string | null
          created_at?: string | null
          decimals?: number
          id?: string
          metadata?: Json | null
          name: string
          project_id: string
          reviewers?: string[] | null
          standard: string
          status?: string
          symbol: string
          updated_at?: string | null
        }
        Update: {
          approvals?: string[] | null
          blocks?: Json
          contract_preview?: string | null
          created_at?: string | null
          decimals?: number
          id?: string
          metadata?: Json | null
          name?: string
          project_id?: string
          reviewers?: string[] | null
          standard?: string
          status?: string
          symbol?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tokens_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      kyc_status: "approved" | "pending" | "failed" | "not_started" | "expired"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
