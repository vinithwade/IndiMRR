/** Locale used for grouping separators (lakhs/crores for INR, Western otherwise). */
export const CURRENCY_LOCALES: Record<string, string> = {
  USD: "en-US",
  INR: "en-IN",
  EUR: "en-IE",
  GBP: "en-GB",
  AED: "en-AE",
  AUD: "en-AU",
  CAD: "en-CA",
  SGD: "en-SG",
  JPY: "ja-JP",
  CHF: "de-CH",
};

export function localeForCurrency(currency: string) {
  return CURRENCY_LOCALES[currency.toUpperCase()] ?? "en-US";
}

/** Digits only → locale-grouped string (e.g. INR 11455706 → 1,14,55,706). */
export function formatGroupedAmount(
  amount: number | string | null | undefined,
  currency: string
) {
  if (amount == null || amount === "") return "";
  const n =
    typeof amount === "number"
      ? amount
      : Number(String(amount).replace(/[^\d]/g, ""));
  if (!Number.isFinite(n) || n < 0) return "";
  return new Intl.NumberFormat(localeForCurrency(currency), {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Math.round(n));
}

/** Strip grouping chars from a formatted amount input. */
export function parseGroupedAmount(value: string) {
  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Number(digits);
}

/** Friendly INR scale label: Lakh / Crore */
export function inrScaleLabel(amount: number): string | null {
  if (!amount || amount < 100_000) return null;
  if (amount >= 10_000_000) {
    const cr = amount / 10_000_000;
    return `${trimScale(cr)} Crore`;
  }
  const lakh = amount / 100_000;
  return `${trimScale(lakh)} Lakh`;
}

function trimScale(n: number) {
  return n
    .toFixed(2)
    .replace(/\.00$/, "")
    .replace(/(\.\d)0$/, "$1");
}
