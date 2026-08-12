"use client";

import Link from "next/link";
import { Money } from "@/components/currency/money";
import { useAuthGate } from "@/components/auth/auth-gate";
import { formatPercent, isVerified } from "@/lib/format";
import type { StartupWithMetrics } from "@/lib/types";
import { ShieldCheck } from "lucide-react";

export function LeaderboardTable({ startups }: { startups: StartupWithMetrics[] }) {
  const { isAuthenticated, requireAuth } = useAuthGate();

  return (
    <div className="overflow-x-auto border border-border/80">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border/80 bg-muted/40 text-[11px] uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Startup</th>
            <th className="px-4 py-3 font-medium">Founder</th>
            <th className="px-4 py-3 font-medium">MRR</th>
            <th className="px-4 py-3 font-medium">MoM</th>
            <th className="px-4 py-3 font-medium">Customers</th>
          </tr>
        </thead>
        <tbody>
          {startups.map((s, i) => {
            const verified = isVerified(
              s.metrics?.verification_status,
              s.metrics?.last_synced_at
            );
            const href = `/startup/${s.slug}`;
            return (
              <tr
                key={s.id}
                className="border-b border-border/50 transition-colors hover:bg-primary/5"
              >
                <td className="metric-mono px-4 py-3 text-muted-foreground">
                  {i + 1}
                </td>
                <td className="px-4 py-3">
                  {isAuthenticated ? (
                    <Link
                      href={href}
                      className="inline-flex items-center gap-2 font-medium hover:text-primary"
                    >
                      {s.anonymous ? "Confidential Startup" : s.name}
                      {s.for_sale && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          Sale
                        </span>
                      )}
                      {verified && (
                        <ShieldCheck className="size-3.5 text-primary" />
                      )}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => requireAuth(href)}
                      className="inline-flex items-center gap-2 font-medium hover:text-primary"
                    >
                      {s.anonymous ? "Confidential Startup" : s.name}
                      {s.for_sale && (
                        <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-primary">
                          Sale
                        </span>
                      )}
                      {verified && (
                        <ShieldCheck className="size-3.5 text-primary" />
                      )}
                    </button>
                  )}
                  <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                    {s.tagline}
                  </p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.anonymous ? "—" : s.owner?.full_name || "—"}
                </td>
                <td className="px-4 py-3 font-medium">
                  <Money cents={s.metrics?.mrr_cents} from={s.metrics?.currency} />
                </td>
                <td className="metric-mono px-4 py-3">
                  {formatPercent(s.metrics?.mom_growth)}
                </td>
                <td className="metric-mono px-4 py-3 text-muted-foreground">
                  {s.metrics?.customers ?? "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
