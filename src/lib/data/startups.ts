import { isDemoMode } from "@/lib/supabase/config";
import {
  getDemoStartup,
  getDemoStartups,
  getDemoSnapshots,
} from "@/lib/demo/data";
import type { RevenueSnapshot, StartupWithMetrics } from "@/lib/types";

export async function listPublishedStartups(opts?: {
  forSaleOnly?: boolean;
  category?: string;
  sort?: "mrr" | "growth" | "recent";
}): Promise<StartupWithMetrics[]> {
  if (isDemoMode()) {
    let rows = getDemoStartups();
    if (opts?.forSaleOnly) rows = rows.filter((s) => s.for_sale);
    if (opts?.category && opts.category !== "all") {
      rows = rows.filter((s) => s.category === opts.category);
    }
    if (opts?.sort === "growth") {
      rows.sort(
        (a, b) => (b.metrics?.mom_growth ?? -999) - (a.metrics?.mom_growth ?? -999)
      );
    } else if (opts?.sort === "recent") {
      rows.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return rows;
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  let query = supabase
    .from("startups")
    .select("*")
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (opts?.forSaleOnly) query = query.eq("for_sale", true);
  if (opts?.category && opts.category !== "all") {
    query = query.eq("category", opts.category);
  }

  const { data: startups, error } = await query;
  if (error || !startups) return [];

  const ids = startups.map((s) => s.id);
  const [{ data: metrics }, { data: listings }, { data: profiles }] =
    await Promise.all([
      supabase.from("startup_latest_metrics").select("*").in("startup_id", ids),
      supabase.from("listings").select("*").in("startup_id", ids).eq("active", true),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in(
          "id",
          startups.map((s) => s.owner_id)
        ),
    ]);

  const metricsMap = new Map((metrics ?? []).map((m) => [m.startup_id, m]));
  const listingMap = new Map((listings ?? []).map((l) => [l.startup_id, l]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  let rows: StartupWithMetrics[] = startups.map((s) => ({
    ...s,
    metrics: metricsMap.get(s.id) ?? null,
    listing: listingMap.get(s.id) ?? null,
    owner: profileMap.get(s.owner_id) ?? null,
  }));

  if (opts?.sort === "growth") {
    rows.sort(
      (a, b) => (b.metrics?.mom_growth ?? -999) - (a.metrics?.mom_growth ?? -999)
    );
  } else if (opts?.sort === "mrr" || !opts?.sort) {
    rows.sort((a, b) => (b.metrics?.mrr_cents ?? 0) - (a.metrics?.mrr_cents ?? 0));
  }

  return rows;
}

export async function getStartupBySlug(
  slug: string
): Promise<StartupWithMetrics | null> {
  if (isDemoMode()) return getDemoStartup(slug);

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: startup } = await supabase
    .from("startups")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!startup) return null;

  const [{ data: metrics }, { data: listing }, { data: owner }] =
    await Promise.all([
      supabase
        .from("startup_latest_metrics")
        .select("*")
        .eq("startup_id", startup.id)
        .maybeSingle(),
      supabase
        .from("listings")
        .select("*")
        .eq("startup_id", startup.id)
        .eq("active", true)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", startup.owner_id)
        .maybeSingle(),
    ]);

  return {
    ...startup,
    metrics: metrics ?? null,
    listing: listing ?? null,
    owner: owner ?? null,
  };
}

export async function getStartupSnapshots(
  startupId: string
): Promise<RevenueSnapshot[]> {
  if (isDemoMode()) return getDemoSnapshots(startupId);

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("revenue_snapshots")
    .select("*")
    .eq("startup_id", startupId)
    .order("captured_at", { ascending: true })
    .limit(90);

  return data ?? [];
}
