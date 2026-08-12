import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { syncStripeRevenue, withMomGrowth } from "@/lib/stripe/sync";

const schema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string().optional(),
  tech_stack: z.array(z.string()).optional(),
  website: z.string().optional(),
  for_sale: z.boolean().optional(),
  asking_price_cents: z.number().nullable().optional(),
  asking_currency: z.string().optional(),
  multiple: z.number().nullable().optional(),
  sale_notes: z.string().optional(),
  anonymous: z.boolean().optional(),
  status: z.enum(["draft", "published"]).optional(),
  stripe_restricted_key: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const { stripe_restricted_key, ...fields } = body;

  const { data: startup, error } = await supabase
    .from("startups")
    .update(fields)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("*")
    .single();

  if (error || !startup) {
    return NextResponse.json(
      { error: error?.message || "Update failed" },
      { status: 400 }
    );
  }

  if (body.for_sale) {
    await supabase.from("listings").upsert({
      startup_id: startup.id,
      active: true,
    });
  }

  if (stripe_restricted_key) {
    const encrypted = encryptSecret(stripe_restricted_key);
    await supabase.from("revenue_connections").upsert({
      startup_id: startup.id,
      provider: "stripe",
      encrypted_api_key: encrypted,
      status: "pending",
    });
    try {
      const metrics = await syncStripeRevenue(stripe_restricted_key);
      const { data: prev } = await supabase
        .from("revenue_snapshots")
        .select("mrr_cents")
        .eq("startup_id", startup.id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      await supabase.from("revenue_snapshots").insert({
        startup_id: startup.id,
        mrr_cents: metrics.mrrCents,
        arr_cents: metrics.arrCents,
        customers: metrics.customers,
        churn_rate: metrics.churnRate,
        mom_growth: withMomGrowth(metrics.mrrCents, prev?.mrr_cents),
        currency: metrics.currency,
      });
      await supabase
        .from("revenue_connections")
        .update({
          status: "active",
          last_synced_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("startup_id", startup.id)
        .eq("provider", "stripe");
    } catch (err) {
      await supabase
        .from("revenue_connections")
        .update({
          status: "error",
          last_error: err instanceof Error ? err.message : "Sync failed",
        })
        .eq("startup_id", startup.id)
        .eq("provider", "stripe");
    }
  }

  return NextResponse.json({ id: startup.id });
}
