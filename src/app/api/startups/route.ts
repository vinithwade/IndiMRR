import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { encryptSecret } from "@/lib/crypto";
import { slugify } from "@/lib/format";
import { syncStripeRevenue } from "@/lib/stripe/sync";

const schema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  category: z.string(),
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

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = schema.parse(await request.json());
  const slug = body.slug || slugify(body.name);

  const { data: startup, error } = await supabase
    .from("startups")
    .insert({
      owner_id: user.id,
      name: body.name,
      slug,
      tagline: body.tagline ?? null,
      description: body.description ?? null,
      category: body.category,
      tech_stack: body.tech_stack ?? [],
      website: body.website ?? null,
      for_sale: body.for_sale ?? false,
      asking_price_cents: body.asking_price_cents ?? null,
      asking_currency: body.asking_currency ?? "USD",
      multiple: body.multiple ?? null,
      sale_notes: body.sale_notes ?? null,
      anonymous: body.anonymous ?? false,
      status: body.status ?? "draft",
    })
    .select("*")
    .single();

  if (error || !startup) {
    return NextResponse.json(
      { error: error?.message || "Failed to create startup" },
      { status: 400 }
    );
  }

  if (body.for_sale) {
    await supabase.from("listings").upsert({
      startup_id: startup.id,
      tier: "free",
      active: true,
    });
  }

  if (body.stripe_restricted_key) {
    const encrypted = encryptSecret(body.stripe_restricted_key);
    await supabase.from("revenue_connections").upsert({
      startup_id: startup.id,
      provider: "stripe",
      encrypted_api_key: encrypted,
      status: "pending",
    });

    try {
      const metrics = await syncStripeRevenue(body.stripe_restricted_key);
      await supabase.from("revenue_snapshots").insert({
        startup_id: startup.id,
        mrr_cents: metrics.mrrCents,
        arr_cents: metrics.arrCents,
        customers: metrics.customers,
        churn_rate: metrics.churnRate,
        mom_growth: null,
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

  return NextResponse.json({ id: startup.id, slug: startup.slug });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data } = await supabase
    .from("startups")
    .select("*")
    .eq("owner_id", user.id)
    .order("updated_at", { ascending: false });
  return NextResponse.json({ startups: data ?? [] });
}
