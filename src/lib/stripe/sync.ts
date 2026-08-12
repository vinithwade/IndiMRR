import {
  computeMomGrowth,
  computeMrrFromSubscriptions,
  type StripeSubscriptionLike,
} from "@/lib/mrr/calc";
import { getStripeForRestrictedKey } from "@/lib/stripe/client";

export async function syncStripeRevenue(apiKey: string) {
  const stripe = getStripeForRestrictedKey(apiKey);
  const subscriptions: StripeSubscriptionLike[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < 20; page++) {
    const batch = await stripe.subscriptions.list({
      status: "all",
      limit: 100,
      starting_after: startingAfter,
      expand: ["data.items.data.price"],
    });
    for (const sub of batch.data) {
      subscriptions.push(sub as unknown as StripeSubscriptionLike);
    }
    if (!batch.has_more) break;
    startingAfter = batch.data[batch.data.length - 1]?.id;
  }

  const activeCanceled = subscriptions.filter(
    (s) => s.status === "canceled" || s.cancel_at_period_end
  ).length;
  const active = subscriptions.filter(
    (s) => s.status === "active" || s.status === "trialing"
  ).length;
  const metrics = computeMrrFromSubscriptions(subscriptions);
  const churnRate = active + activeCanceled === 0 ? 0 : activeCanceled / (active + activeCanceled);

  return { ...metrics, churnRate };
}

export function withMomGrowth(
  currentMrr: number,
  previousMrr: number | null | undefined
) {
  return computeMomGrowth(currentMrr, previousMrr);
}
