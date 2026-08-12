export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      startups: {
        Row: {
          id: string;
          owner_id: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          category: string;
          tech_stack: string[];
          website: string | null;
          logo_url: string | null;
          status: "draft" | "published";
          for_sale: boolean;
          asking_price_cents: number | null;
          asking_currency: string;
          multiple: number | null;
          sale_notes: string | null;
          anonymous: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          slug: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          category?: string;
          tech_stack?: string[];
          website?: string | null;
          logo_url?: string | null;
          status?: "draft" | "published";
          for_sale?: boolean;
          asking_price_cents?: number | null;
          asking_currency?: string;
          multiple?: number | null;
          sale_notes?: string | null;
          anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["startups"]["Insert"]>;
      };
      revenue_connections: {
        Row: {
          id: string;
          startup_id: string;
          provider: "stripe";
          encrypted_api_key: string;
          status: "pending" | "active" | "error" | "revoked";
          last_synced_at: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          provider?: "stripe";
          encrypted_api_key: string;
          status?: "pending" | "active" | "error" | "revoked";
          last_synced_at?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["revenue_connections"]["Insert"]
        >;
      };
      revenue_snapshots: {
        Row: {
          id: string;
          startup_id: string;
          mrr_cents: number;
          arr_cents: number;
          customers: number;
          churn_rate: number;
          mom_growth: number | null;
          currency: string;
          captured_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          mrr_cents?: number;
          arr_cents?: number;
          customers?: number;
          churn_rate?: number;
          mom_growth?: number | null;
          currency?: string;
          captured_at?: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["revenue_snapshots"]["Insert"]
        >;
      };
      listings: {
        Row: {
          id: string;
          startup_id: string;
          tier: "free" | "starter";
          listed_at: string;
          featured_until: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          startup_id: string;
          tier?: "free" | "starter";
          listed_at?: string;
          featured_until?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["listings"]["Insert"]>;
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          amount_cents: number;
          currency: string;
          message: string | null;
          status:
            | "pending_deposit"
            | "deposited"
            | "accepted"
            | "rejected"
            | "withdrawn"
            | "expired";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          amount_cents: number;
          currency?: string;
          message?: string | null;
          status?:
            | "pending_deposit"
            | "deposited"
            | "accepted"
            | "rejected"
            | "withdrawn"
            | "expired";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
      };
      deposits: {
        Row: {
          id: string;
          offer_id: string;
          provider: "stripe" | "razorpay";
          amount_cents: number;
          currency: string;
          platform_fee_cents: number;
          provider_payment_id: string | null;
          provider_order_id: string | null;
          status: "pending" | "paid" | "failed" | "refunded";
          raw_payload: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          offer_id: string;
          provider: "stripe" | "razorpay";
          amount_cents: number;
          currency: string;
          platform_fee_cents?: number;
          provider_payment_id?: string | null;
          provider_order_id?: string | null;
          status?: "pending" | "paid" | "failed" | "refunded";
          raw_payload?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["deposits"]["Insert"]>;
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          startup_id: string | null;
          kind: "listing_fee" | "deposit_fee";
          provider: "stripe" | "razorpay";
          amount_cents: number;
          currency: string;
          provider_payment_id: string | null;
          status: "pending" | "paid" | "failed" | "refunded";
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          startup_id?: string | null;
          kind: "listing_fee" | "deposit_fee";
          provider: "stripe" | "razorpay";
          amount_cents: number;
          currency: string;
          provider_payment_id?: string | null;
          status?: "pending" | "paid" | "failed" | "refunded";
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["transactions"]["Insert"]>;
      };
    };
    Views: {
      startup_latest_metrics: {
        Row: {
          startup_id: string;
          mrr_cents: number;
          arr_cents: number;
          customers: number;
          churn_rate: number;
          mom_growth: number | null;
          currency: string;
          captured_at: string;
          verification_status: string | null;
          last_synced_at: string | null;
        };
      };
      revenue_connection_public: {
        Row: {
          id: string;
          startup_id: string;
          provider: string;
          status: string;
          last_synced_at: string | null;
          created_at: string;
        };
      };
    };
  };
};
