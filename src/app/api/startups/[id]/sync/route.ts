import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret } from "@/lib/crypto";
import { syncStripeRevenue, withMomGrowth } from "@/lib/stripe/sync";

export async function POST(
  _request: Request,
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

  const { data: startup } = await supabase
    .from("startups")
    .select("id")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!startup) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: connection } = await supabase
    .from("revenue_connections")
    .select("*")
    .eq("startup_id", id)
    .eq("provider", "stripe")
    .maybeSingle();

  if (!connection) {
    return NextResponse.json(
      { error: "No Stripe connection. Add a restricted API key first." },
      { status: 400 }
    );
  }

  try {
    const apiKey = decryptSecret(connection.encrypted_api_key);
    const metrics = await syncStripeRevenue(apiKey);
    const { data: prev } = await supabase
      .from("revenue_snapshots")
      .select("mrr_cents")
      .eq("startup_id", id)
      .order("captured_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    await supabase.from("revenue_snapshots").insert({
      startup_id: id,
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
      .eq("id", connection.id);

    return NextResponse.json({ mrrCents: metrics.mrrCents, metrics });
  } catch (err) {
    await supabase
      .from("revenue_connections")
      .update({
        status: "error",
        last_error: err instanceof Error ? err.message : "Sync failed",
      })
      .eq("id", connection.id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Sync failed" },
      { status: 400 }
    );
  }
}
