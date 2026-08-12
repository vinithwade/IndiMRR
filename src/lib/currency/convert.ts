import { FALLBACK_RATES_USD } from "./constants";

export type FxPayload = {
  base: "USD";
  rates: Record<string, number>;
  fetchedAt: string;
  source: "live" | "fallback";
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
  JPY: "¥",
  CHF: "CHF",
};

export function convertCents(
  cents: number,
  fromCurrency: string,
  toCurrency: string,
  ratesUsd: Record<string, number>
) {
  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();
  if (from === to) return cents;

  const fromRate = ratesUsd[from] ?? FALLBACK_RATES_USD[from];
  const toRate = ratesUsd[to] ?? FALLBACK_RATES_USD[to];
  if (!fromRate || !toRate) return cents;

  const usd = cents / 100 / fromRate;
  return Math.round(usd * toRate * 100);
}

/** Deterministic compact formatter — identical on Node and browsers */
function formatCompactAmount(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `${sign}${Math.round(abs)}`;
}

function formatFullAmount(amount: number, currency: string) {
  const zeroDecimal = currency === "JPY";
  const fractionDigits = zeroDecimal ? 0 : absLessThan(amount, 1000) ? 2 : 0;
  // Always en-US for hydration-stable output; symbol from our map
  const body = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: 0,
  }).format(amount);
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  if (currency === "CHF") return `${symbol} ${body}`;
  return `${symbol}${body}`;
}

function absLessThan(n: number, limit: number) {
  return Math.abs(n) < limit;
}

export function formatConvertedMoney(
  cents: number | null | undefined,
  sourceCurrency: string,
  displayCurrency: string,
  ratesUsd: Record<string, number>,
  opts?: { compact?: boolean }
) {
  if (cents == null) return "—";
  const converted = convertCents(
    cents,
    sourceCurrency || "USD",
    displayCurrency,
    ratesUsd
  );
  const amount = converted / 100;
  const currency = displayCurrency.toUpperCase();
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;

  if (opts?.compact && Math.abs(amount) >= 1000) {
    if (currency === "CHF") {
      return `${symbol} ${formatCompactAmount(amount)}`;
    }
    return `${symbol}${formatCompactAmount(amount)}`;
  }

  return formatFullAmount(amount, currency);
}
