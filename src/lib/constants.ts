export const BRAND = {
  name: "VerifiedMRR",
  tagline: "The database of verified startup revenues",
  description:
    "Showcase verified MRR, list your startup for sale, and connect with serious buyers.",
} as const;

export const LISTING_FEE_USD = 29;
export const LISTING_FEE_INR = 2499;

/** Deposit is 5% of offer, clamped */
export const DEPOSIT_RATE = 0.05;
export const DEPOSIT_MIN_USD = 250;
export const DEPOSIT_MAX_USD = 2500;
export const DEPOSIT_MIN_INR = 20000;
export const DEPOSIT_MAX_INR = 200000;
export const PLATFORM_FEE_RATE = 0.1;

export const CATEGORIES = [
  "SaaS",
  "AI",
  "Mobile",
  "E-commerce",
  "DevTools",
  "Marketing",
  "Fintech",
  "Education",
  "Health",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
