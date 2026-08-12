"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Money } from "@/components/currency/money";
import { useAuthGate } from "@/components/auth/auth-gate";
import { formatPercent, isVerified } from "@/lib/format";
import type { StartupWithMetrics } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export function StartupCard({
  startup,
  index = 0,
}: {
  startup: StartupWithMetrics;
  index?: number;
}) {
  const { isAuthenticated, requireAuth } = useAuthGate();
  const href = `/startup/${startup.slug}`;
  const verified = isVerified(
    startup.metrics?.verification_status,
    startup.metrics?.last_synced_at
  );
  const delayClass =
    index % 3 === 0
      ? "animate-fade-up"
      : index % 3 === 1
        ? "animate-fade-up-delay-1"
        : "animate-fade-up-delay-2";

  const className = `group block border border-border/80 bg-card/60 p-5 transition-all duration-300 hover:border-primary/40 hover:bg-card ${delayClass}`;

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold tracking-tight group-hover:text-primary">
              {startup.anonymous ? "Confidential Startup" : startup.name}
            </h3>
            {startup.for_sale && (
              <Badge className="bg-primary text-primary-foreground">For sale</Badge>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {startup.tagline || startup.description}
          </p>
        </div>
        {verified && (
          <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
            <ShieldCheck className="size-3" />
            Verified
          </span>
        )}
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-border/60 pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            MRR
          </p>
          <p className="mt-1 text-sm font-medium">
            <Money
              cents={startup.metrics?.mrr_cents}
              from={startup.metrics?.currency}
              compact
            />
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            MoM
          </p>
          <p className="metric-mono mt-1 text-sm font-medium">
            {formatPercent(startup.metrics?.mom_growth)}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {startup.for_sale ? "Ask" : "Category"}
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            {startup.for_sale ? (
              <Money
                cents={startup.asking_price_cents}
                from={startup.asking_currency}
                compact
              />
            ) : (
              startup.category
            )}
          </p>
        </div>
      </div>
    </>
  );

  if (isAuthenticated) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${className} w-full cursor-pointer text-left`}
      onClick={() => requireAuth(href)}
    >
      {content}
    </button>
  );
}
