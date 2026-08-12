import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isDemoMode } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { isVerified } from "@/lib/format";
import { getDemoStartups } from "@/lib/demo/data";
import type { StartupWithMetrics } from "@/lib/types";
import { Money } from "@/components/currency/money";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata = { title: "Dashboard" };

type IncomingOffer = {
  id: string;
  amount_cents: number;
  currency: string;
  status: string;
  message: string | null;
  created_at: string;
  startup_name?: string;
  buyer_name?: string;
};

export default async function DashboardPage() {
  let startups: StartupWithMetrics[] = [];
  let displayName = "there";
  let userEmail = "demo@verifiedmrr.com";
  let incomingOffers: IncomingOffer[] = [];
  let myOffersCount = 0;

  if (isDemoMode()) {
    startups = getDemoStartups().slice(0, 3);
    displayName = "Demo Founder";
    incomingOffers = [
      {
        id: "1",
        amount_cents: 15000000,
        currency: "USD",
        status: "pending",
        message: "Ready to close in 2 weeks.",
        created_at: new Date().toISOString(),
        startup_name: startups[0]?.name,
        buyer_name: "Alex Buyer",
      },
    ];
    myOffersCount = 1;
  } else {
    const supabase = await createClient();
    const user = await getAuthUser();
    if (!user || user.id === "demo") return null;

    userEmail = user.email ?? user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName =
      profile?.full_name ||
      (typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null) ||
      userEmail.split("@")[0];

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

    const { data: listings } = ids.length
      ? await supabase.from("listings").select("id, startup_id").in("startup_id", ids)
      : { data: [] };
    const listingIds = (listings ?? []).map((l) => l.id);
    const listingToStartup = new Map(
      (listings ?? []).map((l) => [
        l.id,
        startups.find((s) => s.id === l.startup_id)?.name ?? "Startup",
      ])
    );

    if (listingIds.length) {
      const { data: offers } = await supabase
        .from("offers")
        .select("id, amount_cents, currency, status, message, created_at, listing_id, buyer_id")
        .in("listing_id", listingIds)
        .order("created_at", { ascending: false })
        .limit(5);

      const buyerIds = [...new Set((offers ?? []).map((o) => o.buyer_id))];
      const { data: buyers } = buyerIds.length
        ? await supabase
            .from("profiles")
            .select("id, full_name")
            .in("id", buyerIds)
        : { data: [] };
      const buyerMap = new Map((buyers ?? []).map((b) => [b.id, b.full_name]));

      incomingOffers = (offers ?? []).map((o) => ({
        id: o.id,
        amount_cents: o.amount_cents,
        currency: o.currency,
        status: o.status,
        message: o.message,
        created_at: o.created_at,
        startup_name: listingToStartup.get(o.listing_id),
        buyer_name: buyerMap.get(o.buyer_id) ?? "Buyer",
      }));
    }

    const { count } = await supabase
      .from("offers")
      .select("*", { count: "exact", head: true })
      .eq("buyer_id", user.id);
    myOffersCount = count ?? 0;
  }

  const totalMrr = startups.reduce(
    (sum, s) => sum + (s.metrics?.mrr_cents ?? 0),
    0
  );
  const forSaleCount = startups.filter((s) => s.for_sale).length;
  const verifiedCount = startups.filter((s) =>
    isVerified(s.metrics?.verification_status, s.metrics?.last_synced_at)
  ).length;
  const pendingIncoming = incomingOffers.filter(
    (o) => o.status === "pending"
  ).length;

  const steps = [
    {
      done: startups.length > 0,
      title: "Create a startup profile",
      href: "/dashboard/startups/new",
      desc: "Name, category, and public page",
    },
    {
      done: verifiedCount > 0,
      title: "Connect Stripe for verified MRR",
      href: startups[0]
        ? `/dashboard/startups/${startups[0].id}`
        : "/dashboard/startups/new",
      desc: "Restricted read-only API key",
    },
    {
      done: forSaleCount > 0,
      title: "List for sale on the marketplace",
      href: startups[0]
        ? `/dashboard/startups/${startups[0].id}`
        : "/dashboard/startups",
      desc: "Set asking price and go live",
    },
    {
      done: pendingIncoming > 0 || myOffersCount > 0,
      title: "Receive or make an offer",
      href: "/marketplace",
      desc: "Free offers open a chat with the other side",
    },
  ];
  const completedSteps = steps.filter((s) => s.done).length;

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            {displayName}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/marketplace">
              Browse marketplace
              <ArrowUpRight className="size-4" />
            </Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/startups/new">
              <Plus className="size-4" />
              Add startup
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Verified MRR"
          cents={totalMrr}
          from="USD"
          compact
          hint={`${verifiedCount} verified`}
          icon="dollar"
        />
        <StatCard
          label="Startups"
          value={String(startups.length)}
          hint={`${forSaleCount} for sale`}
          icon="building"
        />
        <StatCard
          label="Incoming offers"
          value={String(incomingOffers.length)}
          hint={`${pendingIncoming} need attention`}
          icon="handshake"
        />
        <StatCard
          label="Offers you made"
          value={String(myOffersCount)}
          hint="As a buyer"
          icon="badge"
        />
      </div>

      {completedSteps < steps.length && (
        <section className="border border-border/80 bg-card/40 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="font-semibold tracking-tight">Getting started</h2>
            </div>
            <p className="metric-mono text-xs text-muted-foreground">
              {completedSteps}/{steps.length} complete
            </p>
          </div>
          <div className="mt-4 h-1.5 overflow-hidden bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {steps.map((step, i) => (
              <Link
                key={step.title}
                href={step.href}
                className="flex gap-3 border border-border/60 bg-background/40 p-3 transition-colors hover:border-primary/40"
              >
                <span
                  className={`mt-0.5 flex size-6 shrink-0 items-center justify-center text-xs font-medium ${
                    step.done
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-muted-foreground"
                  }`}
                >
                  {step.done ? "✓" : i + 1}
                </span>
                <span>
                  <span className="block text-sm font-medium">{step.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {step.desc}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <section>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight">Your startups</h2>
            <Button asChild size="sm" variant="ghost">
              <Link href="/dashboard/startups">View all</Link>
            </Button>
          </div>

          {startups.length === 0 ? (
            <div className="border border-dashed border-border/80 bg-card/20 p-8">
              <div className="mx-auto max-w-md text-center">
                <div className="mx-auto flex size-12 items-center justify-center border border-primary/30 bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">No startups yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create a profile, connect Stripe, and publish verified revenue.
                </p>
                <Button asChild className="mt-6">
                  <Link href="/dashboard/startups/new">Create your first startup</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {startups.slice(0, 3).map((s) => {
                const verified = isVerified(
                  s.metrics?.verification_status,
                  s.metrics?.last_synced_at
                );
                return (
                  <Link
                    key={s.id}
                    href={`/dashboard/startups/${s.id}`}
                    className="flex items-center justify-between gap-3 border border-border/80 bg-card/40 px-4 py-3 transition-colors hover:border-primary/40"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{s.name}</p>
                        {verified && (
                          <ShieldCheck className="size-3.5 shrink-0 text-primary" />
                        )}
                        {s.for_sale && (
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/15">
                            For sale
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {s.category} ·{" "}
                        <Money
                          cents={s.metrics?.mrr_cents}
                          from={s.metrics?.currency}
                          compact
                        />
                      </p>
                    </div>
                    <span className="shrink-0 text-xs capitalize text-muted-foreground">
                      {s.status}
                    </span>
                  </Link>
                );
              })}
              {startups.length > 3 && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/dashboard/startups">
                    View all {startups.length} startups
                  </Link>
                </Button>
              )}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight">
                Incoming offers
              </h2>
              {startups[0] && (
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/dashboard/startups/${startups[0].id}`}>
                    Manage
                  </Link>
                </Button>
              )}
            </div>
            {incomingOffers.length === 0 ? (
              <div className="border border-border/80 bg-card/30 p-5 text-sm text-muted-foreground">
                No offers on your listings yet. Publish for sale to start
                receiving offers and chats.
              </div>
            ) : (
              <div className="space-y-3">
                {incomingOffers.map((o) => (
                  <div
                    key={o.id}
                    className="border border-border/80 bg-card/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {o.startup_name ?? "Startup"}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {o.buyer_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {o.status.replace("_", " ")}
                      </Badge>
                    </div>
                    <p className="mt-3 text-base font-medium">
                      <Money cents={o.amount_cents} from={o.currency} />
                    </p>
                    {o.message && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {o.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border border-border/80 bg-card/30 p-5">
            <h3 className="font-medium">Buying?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse verified listings, send a free offer, and chat with the
              seller.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/marketplace">Open marketplace</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/messages">Messages</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard/offers">My offers ({myOffersCount})</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
