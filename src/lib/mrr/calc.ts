import {
  DEPOSIT_MAX_INR,
  DEPOSIT_MAX_USD,
  DEPOSIT_MIN_INR,
  DEPOSIT_MIN_USD,
  DEPOSIT_RATE,
  PLATFORM_FEE_RATE,
} from "@/lib/constants";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function calculateDepositCents(
  offerAmountCents: number,
  currency: string = "USD"
) {
  const raw = Math.round(offerAmountCents * DEPOSIT_RATE);
  if (currency.toUpperCase() === "INR") {
    return clamp(raw, DEPOSIT_MIN_INR * 100, DEPOSIT_MAX_INR * 100);
  }
  return clamp(raw, DEPOSIT_MIN_USD * 100, DEPOSIT_MAX_USD * 100);
}

export function calculatePlatformFeeCents(depositCents: number) {
  return Math.round(depositCents * PLATFORM_FEE_RATE);
}

export type StripeSubscriptionLike = {
  status: string;
  cancel_at_period_end?: boolean;
  items: {
    data: Array<{
      quantity?: number | null;
      price: {
        unit_amount: number | null;
        currency: string;
        recurring: { interval: string; interval_count: number } | null;
      };
    }>;
  };
};

export function normalizeToMonthlyCents(
  unitAmount: number,
  interval: string,
  intervalCount: number
) {
  const count = Math.max(1, intervalCount || 1);
  switch (interval) {
    case "day":
      return Math.round((unitAmount * 30) / count);
    case "week":
      return Math.round((unitAmount * (52 / 12)) / count);
    case "month":
      return Math.round(unitAmount / count);
    case "year":
      return Math.round(unitAmount / (12 * count));
    default:
      return unitAmount;
  }
}

export function computeMrrFromSubscriptions(
  subscriptions: StripeSubscriptionLike[]
) {
  let mrrCents = 0;
  let customers = 0;
  let currency = "usd";

  for (const sub of subscriptions) {
    if (sub.status !== "active" && sub.status !== "trialing") continue;
    customers += 1;
    for (const item of sub.items.data) {
      const price = item.price;
      if (!price.recurring || price.unit_amount == null) continue;
      currency = price.currency;
      const qty = item.quantity ?? 1;
      mrrCents +=
        normalizeToMonthlyCents(
          price.unit_amount,
          price.recurring.interval,
          price.recurring.interval_count
        ) * qty;
    }
  }

  return {
    mrrCents,
    arrCents: mrrCents * 12,
    customers,
    currency: currency.toUpperCase(),
  };
}

export function computeMomGrowth(
  currentMrr: number,
  previousMrr: number | null | undefined
) {
  if (previousMrr == null || previousMrr === 0) return null;
  return (currentMrr - previousMrr) / previousMrr;
}
