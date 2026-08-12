import Stripe from "stripe";

let stripe: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function getStripeForRestrictedKey(restrictedKey: string) {
  return new Stripe(restrictedKey);
}
