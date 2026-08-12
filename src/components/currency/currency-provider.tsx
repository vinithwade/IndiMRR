"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CURRENCY_STORAGE_KEY,
  DISPLAY_CURRENCIES,
  FALLBACK_RATES_USD,
  type DisplayCurrency,
} from "@/lib/currency/constants";
import {
  convertCents,
  formatConvertedMoney,
  type FxPayload,
} from "@/lib/currency/convert";

type CurrencyContextValue = {
  currency: DisplayCurrency;
  setCurrency: (code: DisplayCurrency) => void;
  rates: Record<string, number>;
  source: "live" | "fallback" | "loading";
  fetchedAt: string | null;
  format: (
    cents: number | null | undefined,
    sourceCurrency?: string,
    opts?: { compact?: boolean }
  ) => string;
  convert: (
    cents: number,
    sourceCurrency?: string
  ) => number;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

function isDisplayCurrency(value: string): value is DisplayCurrency {
  return DISPLAY_CURRENCIES.some((c) => c.code === value);
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>("USD");
  const [rates, setRates] = useState<Record<string, number>>(FALLBACK_RATES_USD);
  const [source, setSource] = useState<"live" | "fallback" | "loading">("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && isDisplayCurrency(saved)) setCurrencyState(saved);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/fx");
        const data = (await res.json()) as FxPayload;
        if (cancelled) return;
        setRates(data.rates ?? FALLBACK_RATES_USD);
        setSource(data.source);
        setFetchedAt(data.fetchedAt);
      } catch {
        if (cancelled) return;
        setRates(FALLBACK_RATES_USD);
        setSource("fallback");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setCurrency = useCallback((code: DisplayCurrency) => {
    setCurrencyState(code);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
    } catch {
      // ignore
    }
  }, []);

  const format = useCallback(
    (
      cents: number | null | undefined,
      sourceCurrency: string = "USD",
      opts?: { compact?: boolean }
    ) => formatConvertedMoney(cents, sourceCurrency, currency, rates, opts),
    [currency, rates]
  );

  const convert = useCallback(
    (cents: number, sourceCurrency: string = "USD") =>
      convertCents(cents, sourceCurrency, currency, rates),
    [currency, rates]
  );

  const value = useMemo(
    () => ({
      currency,
      setCurrency,
      rates,
      source,
      fetchedAt,
      format,
      convert,
    }),
    [currency, setCurrency, rates, source, fetchedAt, format, convert]
  );

  return (
    <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) {
    throw new Error("useCurrency must be used within CurrencyProvider");
  }
  return ctx;
}
