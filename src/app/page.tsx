import Link from "next/link";
import { Button } from "@/components/ui/button";
import { StartupCard } from "@/components/marketplace/startup-card";
import { LeaderboardTable } from "@/components/marketplace/leaderboard-table";
import { CountUpMoney } from "@/components/marketplace/count-up-money";
import { listPublishedStartups } from "@/lib/data/startups";
import { BRAND } from "@/lib/constants";

export default async function HomePage() {
  const all = await listPublishedStartups({ sort: "mrr" });
  const forSale = all.filter((s) => s.for_sale);
  const recentlyListed = [...forSale].sort(
    (a, b) =>
      new Date(b.listing?.listed_at ?? b.created_at).getTime() -
      new Date(a.listing?.listed_at ?? a.created_at).getTime()
  );
  const bestDeals = [...forSale].sort((a, b) => {
    const aScore =
      (a.metrics?.mom_growth ?? 0) * 10 -
      ((a.asking_price_cents ?? 0) / Math.max(a.metrics?.mrr_cents ?? 1, 1));
    const bScore =
      (b.metrics?.mom_growth ?? 0) * 10 -
      ((b.asking_price_cents ?? 0) / Math.max(b.metrics?.mrr_cents ?? 1, 1));
    return bScore - aScore;
  });
  const totalMrr = all.reduce((sum, s) => sum + (s.metrics?.mrr_cents ?? 0), 0);

  return (
    <div>
      <section className="relative overflow-hidden border-b border-border/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end lg:py-28">
          <div className="animate-fade-up">
            <p className="text-sm uppercase tracking-[0.25em] text-primary">
              {BRAND.name}
            </p>
            <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              {BRAND.tagline}
            </h1>
            <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
              Connect Stripe, publish verified MRR, and list for sale. Buyers
              send free offers and chat with founders — full closing stays
              off-platform.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/marketplace">Explore marketplace</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard/startups/new">Add startup</Link>
              </Button>
            </div>
          </div>
          <div className="animate-fade-up-delay-2 border border-border/80 bg-card/50 p-6">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Verified network MRR
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">
              <CountUpMoney cents={totalMrr} />
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border/60 pt-4 text-sm">
              <div>
                <p className="text-muted-foreground">Startups</p>
                <p className="metric-mono mt-1 text-lg">{all.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">For sale</p>
                <p className="metric-mono mt-1 text-lg">{forSale.length}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Recently listed</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Fresh acquisition opportunities with verified revenue.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/marketplace">Browse all</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentlyListed.slice(0, 6).map((s, i) => (
            <StartupCard key={s.id} startup={s} index={i} />
          ))}
        </div>
      </section>

      <section className="border-y border-border/80 bg-card/30">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">Best deals</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Ranked by growth and asking multiple.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bestDeals.slice(0, 6).map((s, i) => (
              <StartupCard key={s.id} startup={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Leaderboard</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Hourly-synced Stripe revenue. No screenshots.
            </p>
          </div>
          <Button asChild variant="ghost">
            <Link href="/leaderboard">Full leaderboard</Link>
          </Button>
        </div>
        <LeaderboardTable startups={all.slice(0, 10)} />
      </section>
    </div>
  );
}
