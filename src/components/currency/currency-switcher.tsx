"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useCurrency } from "@/components/currency/currency-provider";
import {
  DISPLAY_CURRENCIES,
  type DisplayCurrency,
} from "@/lib/currency/constants";
import { selectionHaptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const QUICK = ["USD", "INR", "EUR", "GBP"] as const;

export function CurrencySwitcher({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { currency, setCurrency, source } = useCurrency();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const closeTimer = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const labelId = useId();

  const current =
    DISPLAY_CURRENCIES.find((c) => c.code === currency) ?? DISPLAY_CURRENCIES[0]!;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...DISPLAY_CURRENCIES];
    return DISPLAY_CURRENCIES.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.label.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [query]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function cancelClose() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openMenu() {
    cancelClose();
    setOpen(true);
  }

  function scheduleClose() {
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      // Still over chip or popup — stay open
      if (rootRef.current?.matches(":hover")) return;
      setOpen(false);
      setQuery("");
      if (rootRef.current?.contains(document.activeElement)) {
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    }, 180);
  }

  function pick(code: DisplayCurrency) {
    cancelClose();
    setCurrency(code);
    selectionHaptic();
    setQuery("");
    setOpen(false);
    searchRef.current?.blur();
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", compact ? "shrink-0" : "w-full", className)}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        id={labelId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`Display currency ${current.code}`}
        onFocus={openMenu}
        onBlur={scheduleClose}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            cancelClose();
            setOpen(false);
            setQuery("");
            (e.currentTarget as HTMLElement).blur();
          }
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openMenu();
          }
        }}
        className={cn(
          "flex items-center gap-2 border border-border/80 bg-card/50 text-left outline-none transition-[border-color,background-color,box-shadow]",
          compact
            ? "h-8 min-w-[5.75rem] px-2.5"
            : "h-9 w-full justify-between px-2.5",
          open &&
            "border-primary/50 bg-primary/[0.06] shadow-[0_0_0_1px_rgba(190,242,100,0.12)]"
        )}
      >
        <span className="metric-mono text-xs font-semibold text-primary">
          {current.symbol} {current.code}
        </span>
        {!compact && (
          <span className="truncate text-[10px] text-muted-foreground">
            {current.label}
          </span>
        )}
      </button>

      {/* Outer wrapper padding = hover bridge so the menu doesn’t close while moving into it */}
      <div
        className={cn(
          "absolute z-50 transition-[opacity,transform,visibility]",
          compact ? "right-0 top-full origin-top-right pt-2" : "bottom-full left-0 origin-bottom pb-2",
          open
            ? "visible translate-y-0 scale-100 opacity-100"
            : cn(
                "invisible scale-95 opacity-0 pointer-events-none",
                compact ? "-translate-y-1" : "translate-y-1"
              )
        )}
      >
        <div
          role="listbox"
          aria-labelledby={labelId}
          className="w-72 overflow-hidden border border-primary/40 bg-[#101610] shadow-xl shadow-black/50"
          onMouseEnter={openMenu}
        >
          <div className="space-y-2.5 border-b border-border/60 px-3 py-3">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              Display currency
            </p>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={openMenu}
                onBlur={scheduleClose}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    e.stopPropagation();
                    cancelClose();
                    setOpen(false);
                    setQuery("");
                  }
                  if (e.key === "Enter" && filtered[0]) {
                    e.preventDefault();
                    pick(filtered[0].code as DisplayCurrency);
                  }
                }}
                placeholder="Search INR, dollar, euro…"
                className="h-9 w-full border border-border/70 bg-card/60 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/50"
                aria-label="Search currencies"
              />
            </div>
            {!query && (
              <div className="grid grid-cols-4 gap-1.5">
                {QUICK.map((code) => {
                  const item = DISPLAY_CURRENCIES.find((c) => c.code === code)!;
                  const active = currency === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => pick(code)}
                      className={cn(
                        "border px-1.5 py-1.5 text-center text-[11px] transition-colors",
                        active
                          ? "border-primary/50 bg-primary/15 text-primary"
                          : "border-border/70 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      <span className="metric-mono block font-medium">
                        {item.symbol} {code}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <ul className="max-h-64 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-muted-foreground">
                No match for “{query}”
              </li>
            )}
            {filtered.map((c) => {
              const active = c.code === currency;
              return (
                <li key={c.code}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(c.code as DisplayCurrency)}
                    className={cn(
                      "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-primary/15 text-foreground"
                        : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "metric-mono w-16 shrink-0 text-sm tabular-nums",
                        active && "font-semibold text-primary"
                      )}
                    >
                      {c.symbol} {c.code}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {c.label}
                    </span>
                    {active && (
                      <span className="shrink-0 text-[10px] uppercase tracking-wider text-primary">
                        On
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-border/60 px-3 py-2 text-[10px] text-muted-foreground">
            {filtered.length} of {DISPLAY_CURRENCIES.length} currencies
            <span className="sr-only">
              . Rates {source === "live" ? "live" : "approximate"}.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
