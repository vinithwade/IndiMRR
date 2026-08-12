export const DISPLAY_CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "AED", label: "UAE Dirham", symbol: "د.إ" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { code: "SGD", label: "Singapore Dollar", symbol: "S$" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "CHF", label: "Swiss Franc", symbol: "CHF" },
] as const;

export type DisplayCurrency = (typeof DISPLAY_CURRENCIES)[number]["code"];

export const CURRENCY_STORAGE_KEY = "verifiedmrr.displayCurrency";

/** Fallback rates vs USD if live FX is unavailable */
export const FALLBACK_RATES_USD: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.67,
  AUD: 1.53,
  CAD: 1.36,
  SGD: 1.34,
  JPY: 149,
  CHF: 0.88,
};
