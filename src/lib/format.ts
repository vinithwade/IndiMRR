export function formatMoney(
  cents: number | null | undefined,
  currency: string = "USD",
  opts?: { compact?: boolean }
) {
  if (cents == null) return "—";
  const amount = cents / 100;
  if (opts?.compact && Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  const pct = value * 100;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(0)}%`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function isVerified(
  status: string | null | undefined,
  lastSyncedAt: string | null | undefined
) {
  if (status !== "active") return false;
  if (!lastSyncedAt) return false;
  const age = Date.now() - new Date(lastSyncedAt).getTime();
  return age < 1000 * 60 * 60 * 24;
}
