export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
};

export type Startup = {
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

export type RevenueSnapshot = {
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

export type StartupMetrics = {
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

export type Listing = {
  id: string;
  startup_id: string;
  tier: "free" | "starter";
  listed_at: string;
  featured_until: string | null;
  active: boolean;
  created_at: string;
};

export type Offer = {
  id: string;
  listing_id: string;
  buyer_id: string;
  amount_cents: number;
  currency: string;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired";
  created_at: string;
  updated_at: string;
};

export type Deposit = {
  id: string;
  offer_id: string;
  provider: "stripe" | "razorpay";
  amount_cents: number;
  currency: string;
  platform_fee_cents: number;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
};

export type StartupWithMetrics = Startup & {
  metrics?: StartupMetrics | null;
  listing?: Listing | null;
  owner?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};
