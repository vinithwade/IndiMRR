import Link from "next/link";
import { Building2, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/currency/money";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { formatPercent, isVerified } from "@/lib/format";
import { getDemoStartups } from "@/lib/demo/data";
import type { StartupWithMetrics } from "@/lib/types";

export const metadata = { title: "Your startups" };

export default async function YourStartupsPage() {
  let startups: StartupWithMetrics[] = [];

  if (isDemoMode()) {
    startups = getDemoStartups().slice(0, 3);
  } else {
    const supabase = await createClient();
    const user = await getAuthUser();
    if (!user || user.id === "demo") return null;

    const { data } = await supabase
      .from("startups")
      .select("*")
      .eq("owner_id", user.id)
      .order("updated_at", { ascending: false });

    const ids = (data ?? []).map((s) => s.id);
    const { data: metrics } = ids.length
      ? await supabase
          .from("startup_latest_metrics")
          .select("*")
          .in("startup_id", ids)
      : { data: [] };
    const map = new Map((metrics ?? []).map((m) => [m.startup_id, m]));
    startups = (data ?? []).map((s) => ({
      ...s,
      metrics: map.get(s.id) ?? null,
    }));
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Your startups</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage profiles, Stripe verification, and sale listings
            {startups.length ? ` · ${startups.length} total` : ""}.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/startups/new">
            <Plus className="size-4" />
            Add startup
          </Link>
        </Button>
      </div>

      {startups.length === 0 ? (
        <div className="border border-dashed border-border/80 bg-card/20 p-10">
          <div className="mx-auto max-w-md text-center">
            <div className="mx-auto flex size-12 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">No startups yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create a profile, connect Stripe, and publish verified revenue.
              Buyers trust API-backed MRR — not screenshots.
            </p>
            <Button asChild className="mt-6">
              <Link href="/dashboard/startups/new">Create your first startup</Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden border border-border/80">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Startup</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">MRR</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">
                  Status
                </th>
                <th className="hidden px-4 py-3 font-medium lg:table-cell">
                  Sale
                </th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {startups.map((s) => {
                const verified = isVerified(
                  s.metrics?.verification_status,
                  s.metrics?.last_synced_at
                );
                return (
                  <tr
                    key={s.id}
                    className="border-b border-border/50 last:border-0 hover:bg-primary/5"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/startups/${s.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {s.name}
                        </Link>
                        {verified && (
                          <ShieldCheck className="size-3.5 text-primary" />
                        )}
                        {s.for_sale && (
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                            For sale
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.category}
                        <span className="sm:hidden">
                          {" "}
                          ·{" "}
                          <Money
                            cents={s.metrics?.mrr_cents}
                            from={s.metrics?.currency}
                            compact
                          />
                        </span>
                      </p>
                    </td>
                    <td className="hidden px-4 py-3 sm:table-cell">
                      <Money
                        cents={s.metrics?.mrr_cents}
                        from={s.metrics?.currency}
                      />
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {formatPercent(s.metrics?.mom_growth)} MoM
                      </span>
                    </td>
                    <td className="hidden px-4 py-3 capitalize text-muted-foreground md:table-cell">
                      {s.status}
                    </td>
                    <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                      {s.for_sale ? (
                        <Money
                          cents={s.asking_price_cents}
                          from={s.asking_currency}
                        />
                      ) : (
                        "Not listed"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/dashboard/startups/${s.id}`}>Manage</Link>
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/startup/${s.slug}`}>View</Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
