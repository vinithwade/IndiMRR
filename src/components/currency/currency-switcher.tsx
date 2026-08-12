"use client";

import { useCurrency } from "@/components/currency/currency-provider";
import { DISPLAY_CURRENCIES } from "@/lib/currency/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CurrencySwitcher({ className }: { className?: string }) {
  const { currency, setCurrency, source } = useCurrency();

  return (
    <div className={className}>
      <Select
        value={currency}
        onValueChange={(value) => setCurrency(value as typeof currency)}
      >
        <SelectTrigger
          size="sm"
          className="h-8 min-w-[5.5rem] rounded-none border-border/80 bg-card/50"
          aria-label="Display currency"
        >
          <SelectValue placeholder="Currency" />
        </SelectTrigger>
        <SelectContent align="end" className="max-h-72">
          {DISPLAY_CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span className="metric-mono w-8">{c.code}</span>
                <span className="text-muted-foreground">{c.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="sr-only">
        Rates {source === "live" ? "live" : "approximate"}
      </span>
    </div>
  );
}
