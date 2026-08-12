"use client";

import { useEffect, useState } from "react";
import { useCurrency } from "@/components/currency/currency-provider";
import { cn } from "@/lib/utils";

export function Money({
  cents,
  from = "USD",
  compact,
  className,
  showCode,
}: {
  cents: number | null | undefined;
  from?: string | null;
  compact?: boolean;
  className?: string;
  showCode?: boolean;
}) {
  const { format, currency } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const source = (from || "USD").toUpperCase();

  useEffect(() => {
    setMounted(true);
  }, []);

  // First paint uses the same formatting path as SSR (USD preference until
  // CurrencyProvider applies localStorage after mount).
  const text = format(cents, source, { compact });

  return (
    <span className={cn("metric-mono", className)} suppressHydrationWarning>
      {text}
      {mounted && showCode && cents != null && source !== currency && (
        <span className="ml-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          ≈{currency}
        </span>
      )}
    </span>
  );
}
