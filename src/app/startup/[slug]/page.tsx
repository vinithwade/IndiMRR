import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MrrChart } from "@/components/marketplace/mrr-chart";
import { OfferForm } from "@/components/offers/offer-form";
import {
  getStartupBySlug,
  getStartupSnapshots,
} from "@/lib/data/startups";
import { Money } from "@/components/currency/money";
import { formatPercent, isVerified } from "@/lib/format";
import { StartupAuthGate } from "@/components/auth/startup-auth-gate";
import { ShieldCheck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);
  return {
    title: startup?.name ?? "Startup",
    description: startup?.tagline ?? undefined,
  };
}

export default async function StartupPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const startup = await getStartupBySlug(slug);
  if (!startup) notFound();

  const snapshots = await getStartupSnapshots(startup.id);
  const verified = isVerified(
    startup.metrics?.verification_status,
    startup.metrics?.last_synced_at
  );
  const displayName = startup.anonymous ? "Confidential Startup" : startup.name;

  return (
    <StartupAuthGate slug={slug}>
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="animate-fade-up">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{startup.category}</Badge>
            {startup.for_sale && (
              <Badge className="bg-primary text-primary-foreground">For sale</Badge>
            )}
            {verified && (
              <span className="inline-flex items-center gap-1 text-xs text-primary">
                <ShieldCheck className="size-3.5" /> Verified Stripe revenue
              </span>
            )}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">
            {displayName}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{startup.tagline}</p>
          <p className="mt-6 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {startup.description}
          </p>

          <div className="mt-8 grid grid-cols-2 gap-4 border border-border/80 bg-card/50 p-5 sm:grid-cols-4">
            <Metric
              label="MRR"
              value={
                <Money
                  cents={startup.metrics?.mrr_cents}
                  from={startup.metrics?.currency}
                />
              }
            />
            <Metric
              label="ARR"
              value={
                <Money
                  cents={startup.metrics?.arr_cents}
                  from={startup.metrics?.currency}
                  compact
                />
              }
            />
            <Metric
              label="MoM growth"
              value={formatPercent(startup.metrics?.mom_growth)}
            />
            <Metric
              label="Customers"
              value={String(startup.metrics?.customers ?? "—")}
            />
          </div>

          <div className="mt-8 border border-border/80 bg-card/40 p-5">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Revenue history
            </h2>
            <div className="mt-4">
              <MrrChart
                snapshots={snapshots}
                currency={startup.metrics?.currency ?? "USD"}
              />
            </div>
          </div>

          {startup.tech_stack?.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                Tech stack
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {startup.tech_stack.map((t) => (
                  <span
                    key={t}
                    className="border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="animate-fade-up-delay-2 space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="border border-border/80 bg-card/60 p-5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Founder
            </p>
            <p className="mt-2 font-medium">
              {startup.anonymous ? "Anonymous" : startup.owner?.full_name || "—"}
            </p>
            {startup.website && !startup.anonymous && (
              <a
                href={startup.website}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-primary hover:underline"
              >
                Visit website
              </a>
            )}
          </div>

          {startup.for_sale && startup.listing ? (
            <div className="border border-primary/30 bg-card/80 p-5">
              <p className="text-[11px] uppercase tracking-wider text-primary">
                Acquisition
              </p>
              <p className="mt-3 text-3xl font-semibold">
                <Money
                  cents={startup.asking_price_cents}
                  from={startup.asking_currency}
                />
              </p>
              {startup.multiple != null && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {startup.multiple}x ARR multiple
                </p>
              )}
              {startup.sale_notes && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {startup.sale_notes}
                </p>
              )}
              <div className="mt-6">
                <OfferForm
                  listingId={startup.listing.id}
                  askingPriceCents={startup.asking_price_cents ?? 0}
                  currency={startup.asking_currency}
                  startupName={displayName}
                />
              </div>
            </div>
          ) : (
            <div className="border border-border/80 bg-card/60 p-5 text-sm text-muted-foreground">
              This startup is not currently listed for sale.
              <div className="mt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/marketplace">Browse marketplace</Link>
                </Button>
              </div>
            </div>
          )}

          <div className="border border-border/60 p-4 text-xs leading-relaxed text-muted-foreground">
            Earnest deposits prove buyer intent. After the seller accepts, asset
            transfer (code, domain, Stripe, customers) is completed off-platform
            with your preferred escrow counsel.
          </div>
        </aside>
      </div>
    </div>
    </StartupAuthGate>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="metric-mono mt-1 text-lg font-medium">{value}</div>
    </div>
  );
}
