import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { decryptSecret } from "@/lib/crypto";
import { syncStripeRevenue, withMomGrowth } from "@/lib/stripe/sync";

/**
 * Hourly cron endpoint. Protect with CRON_SECRET.
 * Vercel cron or external scheduler: GET/POST /api/cron/sync-revenue
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  const { data: connections } = await admin
    .from("revenue_connections")
    .select("*")
    .eq("provider", "stripe")
    .in("status", ["active", "pending", "error"]);

  const results: Array<{ startupId: string; ok: boolean; error?: string }> = [];

  for (const conn of connections ?? []) {
    try {
      const apiKey = decryptSecret(conn.encrypted_api_key);
      const metrics = await syncStripeRevenue(apiKey);
      const { data: prev } = await admin
        .from("revenue_snapshots")
        .select("mrr_cents")
        .eq("startup_id", conn.startup_id)
        .order("captured_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      await admin.from("revenue_snapshots").insert({
        startup_id: conn.startup_id,
        mrr_cents: metrics.mrrCents,
        arr_cents: metrics.arrCents,
        customers: metrics.customers,
        churn_rate: metrics.churnRate,
        mom_growth: withMomGrowth(metrics.mrrCents, prev?.mrr_cents),
        currency: metrics.currency,
      });

      await admin
        .from("revenue_connections")
        .update({
          status: "active",
          last_synced_at: new Date().toISOString(),
          last_error: null,
        })
        .eq("id", conn.id);

      results.push({ startupId: conn.startup_id, ok: true });
    } catch (err) {
      await admin
        .from("revenue_connections")
        .update({
          status: "error",
          last_error: err instanceof Error ? err.message : "Sync failed",
        })
        .eq("id", conn.id);
      results.push({
        startupId: conn.startup_id,
        ok: false,
        error: err instanceof Error ? err.message : "Sync failed",
      });
    }
  }

  return NextResponse.json({ synced: results.length, results });
}

export async function GET(request: Request) {
  return POST(request);
}
