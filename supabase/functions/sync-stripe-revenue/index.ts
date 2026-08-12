import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@17?target=deno";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function decryptSecret(payload: string, secret: string) {
  // Edge function expects CREDENTIALS already decrypted via service path
  // or plain rk_ keys for local demos. Prefer calling Next.js cron instead.
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  const cronSecret = Deno.env.get("CRON_SECRET");
  const auth = req.headers.get("authorization");
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: connections } = await supabase
    .from("revenue_connections")
    .select("*")
    .eq("provider", "stripe");

  const results = [];
  for (const conn of connections ?? []) {
    try {
      // Prefer Next.js /api/cron/sync-revenue which decrypts AES keys.
      // This edge function supports plaintext keys for simple deployments.
      const key = decryptSecret(
        conn.encrypted_api_key,
        Deno.env.get("CREDENTIALS_ENCRYPTION_KEY") || ""
      );
      if (!key.startsWith("rk_") && !key.startsWith("sk_")) {
        results.push({
          startupId: conn.startup_id,
          ok: false,
          error: "Use Next.js cron for encrypted keys",
        });
        continue;
      }
      const stripe = new Stripe(key, { apiVersion: "2024-11-20.acacia" });
      const subs = await stripe.subscriptions.list({
        status: "active",
        limit: 100,
        expand: ["data.items.data.price"],
      });
      let mrr = 0;
      for (const sub of subs.data) {
        for (const item of sub.items.data) {
          const amount = item.price.unit_amount ?? 0;
          const interval = item.price.recurring?.interval;
          const qty = item.quantity ?? 1;
          if (interval === "year") mrr += Math.round(amount / 12) * qty;
          else if (interval === "month") mrr += amount * qty;
        }
      }
      await supabase.from("revenue_snapshots").insert({
        startup_id: conn.startup_id,
        mrr_cents: mrr,
        arr_cents: mrr * 12,
        customers: subs.data.length,
        churn_rate: 0,
        currency: "USD",
      });
      await supabase
        .from("revenue_connections")
        .update({
          status: "active",
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", conn.id);
      results.push({ startupId: conn.startup_id, ok: true, mrr });
    } catch (e) {
      results.push({
        startupId: conn.startup_id,
        ok: false,
        error: e instanceof Error ? e.message : "failed",
      });
    }
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
});
