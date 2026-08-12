"use client";

import { Money } from "@/components/currency/money";
import {
  BadgeCheck,
  Building2,
  CircleDollarSign,
  Handshake,
} from "lucide-react";

const ICONS = {
  dollar: CircleDollarSign,
  building: Building2,
  handshake: Handshake,
  badge: BadgeCheck,
} as const;

export type StatCardIcon = keyof typeof ICONS;

export function StatCard({
  label,
  cents,
  from = "USD",
  value,
  hint,
  icon,
  compact,
}: {
  label: string;
  cents?: number | null;
  from?: string;
  value?: string;
  hint: string;
  icon: StatCardIcon;
  compact?: boolean;
}) {
  const Icon = ICONS[icon];

  return (
    <div className="border border-border/80 bg-card/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <Icon className="size-4 text-primary/80" />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {cents != null ? (
          <Money cents={cents} from={from} compact={compact} />
        ) : (
          <span className="metric-mono">{value}</span>
        )}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
