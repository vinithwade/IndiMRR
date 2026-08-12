import { StartupCard } from "@/components/marketplace/startup-card";
import { listPublishedStartups } from "@/lib/data/startups";
import { CATEGORIES } from "@/lib/constants";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "Marketplace" };

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const category = params.category ?? "all";
  const sort = (params.sort as "mrr" | "growth" | "recent") || "mrr";

  const startups = await listPublishedStartups({
    forSaleOnly: true,
    category,
    sort,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Browse startups for sale with Stripe-verified MRR. Send a free offer
          and message the seller to negotiate.
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-4 border border-border/80 bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <FilterChip href="/marketplace" active={category === "all"}>
            All
          </FilterChip>
          {CATEGORIES.map((c) => (
            <FilterChip
              key={c}
              href={`/marketplace?category=${encodeURIComponent(c)}&sort=${sort}`}
              active={category === c}
            >
              {c}
            </FilterChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["mrr", "MRR"],
              ["growth", "Growth"],
              ["recent", "Recent"],
            ] as const
          ).map(([value, label]) => (
            <FilterChip
              key={value}
              href={`/marketplace?category=${encodeURIComponent(category)}&sort=${value}`}
              active={sort === value}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {startups.map((s, i) => (
          <StartupCard key={s.id} startup={s} index={i} />
        ))}
      </div>
      {startups.length === 0 && (
        <p className="mt-12 text-center text-muted-foreground">
          No listings match these filters yet.
        </p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: active ? "default" : "outline", size: "sm" }),
        "rounded-none"
      )}
    >
      {children}
    </Link>
  );
}
