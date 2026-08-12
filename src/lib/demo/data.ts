import type { StartupWithMetrics } from "@/lib/types";

const now = Date.now();
const hoursAgo = (h: number) => new Date(now - h * 3600_000).toISOString();
const daysAgo = (d: number) => new Date(now - d * 86400_000).toISOString();

function startup(
  partial: Partial<StartupWithMetrics> &
    Pick<StartupWithMetrics, "id" | "slug" | "name" | "category">
): StartupWithMetrics {
  return {
    owner_id: "demo-owner",
    status: "published",
    tech_stack: ["Next.js", "Postgres"],
    asking_currency: "USD",
    anonymous: false,
    created_at: daysAgo(14),
    updated_at: hoursAgo(2),
    logo_url: null,
    website: null,
    tagline: null,
    description: null,
    multiple: null,
    sale_notes: null,
    asking_price_cents: null,
    for_sale: false,
    ...partial,
  };
}

export const DEMO_STARTUPS: StartupWithMetrics[] = [
  startup({
    id: "s1",
    slug: "inboxpilot",
    name: "InboxPilot",
    tagline: "AI email triage for indie founders",
    description:
      "InboxPilot sorts, drafts, and prioritizes founder inboxes with a daily digest. Recurring SaaS with strong retention.",
    category: "AI",
    tech_stack: ["Next.js", "OpenAI", "Stripe"],
    website: "https://example.com",
    for_sale: true,
    asking_price_cents: 18000000,
    multiple: 3.2,
    sale_notes:
      "Includes domain, codebase, and Stripe customers. 30-day transition support.",
    listing: {
      id: "l1",
      startup_id: "s1",
      tier: "starter",
      listed_at: daysAgo(3),
      featured_until: daysAgo(-10),
      active: true,
      created_at: daysAgo(3),
    },
    metrics: {
      startup_id: "s1",
      mrr_cents: 468000,
      arr_cents: 5616000,
      customers: 312,
      churn_rate: 0.028,
      mom_growth: 0.11,
      currency: "USD",
      captured_at: hoursAgo(1),
      verification_status: "active",
      last_synced_at: hoursAgo(1),
    },
    owner: { id: "demo-owner", full_name: "Asha Mehta", avatar_url: null },
  }),
  startup({
    id: "s2",
    slug: "shipboard",
    name: "Shipboard",
    tagline: "Changelog + roadmap for SaaS teams",
    description:
      "Beautiful public changelogs and private roadmaps. Used by 400+ product teams.",
    category: "SaaS",
    tech_stack: ["Remix", "Postgres", "Stripe"],
    for_sale: true,
    asking_price_cents: 9500000,
    multiple: 2.8,
    listing: {
      id: "l2",
      startup_id: "s2",
      tier: "starter",
      listed_at: daysAgo(5),
      featured_until: null,
      active: true,
      created_at: daysAgo(5),
    },
    metrics: {
      startup_id: "s2",
      mrr_cents: 282000,
      arr_cents: 3384000,
      customers: 198,
      churn_rate: 0.035,
      mom_growth: 0.06,
      currency: "USD",
      captured_at: hoursAgo(2),
      verification_status: "active",
      last_synced_at: hoursAgo(2),
    },
    owner: { id: "demo-owner", full_name: "Jon Park", avatar_url: null },
  }),
  startup({
    id: "s3",
    slug: "pixelstack",
    name: "PixelStack",
    tagline: "UGC ad creative generator",
    description:
      "Generate scroll-stopping UGC creatives for Meta and TikTok ads in minutes.",
    category: "Marketing",
    tech_stack: ["Next.js", "FFmpeg", "Stripe"],
    for_sale: true,
    asking_price_cents: 42000000,
    multiple: 4.0,
    listing: {
      id: "l3",
      startup_id: "s3",
      tier: "starter",
      listed_at: daysAgo(1),
      featured_until: daysAgo(-20),
      active: true,
      created_at: daysAgo(1),
    },
    metrics: {
      startup_id: "s3",
      mrr_cents: 875000,
      arr_cents: 10500000,
      customers: 540,
      churn_rate: 0.041,
      mom_growth: 0.18,
      currency: "USD",
      captured_at: hoursAgo(1),
      verification_status: "active",
      last_synced_at: hoursAgo(1),
    },
    owner: { id: "demo-owner", full_name: "Maya Ortiz", avatar_url: null },
  }),
  startup({
    id: "s4",
    slug: "devrelay",
    name: "DevRelay",
    tagline: "Status pages that actually look good",
    description:
      "Incident communication + uptime monitoring for developer tools companies.",
    category: "DevTools",
    tech_stack: ["Go", "React", "Stripe"],
    for_sale: false,
    metrics: {
      startup_id: "s4",
      mrr_cents: 1245000,
      arr_cents: 14940000,
      customers: 820,
      churn_rate: 0.015,
      mom_growth: 0.04,
      currency: "USD",
      captured_at: hoursAgo(3),
      verification_status: "active",
      last_synced_at: hoursAgo(3),
    },
    owner: { id: "demo-owner", full_name: "Chris Nguyen", avatar_url: null },
  }),
  startup({
    id: "s5",
    slug: "ledgerly",
    name: "Ledgerly",
    tagline: "Simple books for bootstrapped founders",
    description:
      "Bank sync, tax-ready exports, and runway forecasts for solo founders.",
    category: "Fintech",
    tech_stack: ["Next.js", "Plaid", "Stripe"],
    for_sale: true,
    asking_price_cents: 12500000,
    multiple: 3.5,
    anonymous: true,
    listing: {
      id: "l5",
      startup_id: "s5",
      tier: "free",
      listed_at: daysAgo(8),
      featured_until: null,
      active: true,
      created_at: daysAgo(8),
    },
    metrics: {
      startup_id: "s5",
      mrr_cents: 298000,
      arr_cents: 3576000,
      customers: 410,
      churn_rate: 0.022,
      mom_growth: 0.09,
      currency: "USD",
      captured_at: hoursAgo(4),
      verification_status: "active",
      last_synced_at: hoursAgo(4),
    },
    owner: { id: "demo-owner", full_name: "Hidden Founder", avatar_url: null },
  }),
  startup({
    id: "s6",
    slug: "classloop",
    name: "ClassLoop",
    tagline: "Cohort courses without the chaos",
    description:
      "Run live cohort courses with payments, attendance, and alumni community.",
    category: "Education",
    tech_stack: ["Rails", "React", "Stripe"],
    for_sale: false,
    metrics: {
      startup_id: "s6",
      mrr_cents: 156000,
      arr_cents: 1872000,
      customers: 88,
      churn_rate: 0.05,
      mom_growth: 0.22,
      currency: "USD",
      captured_at: hoursAgo(2),
      verification_status: "active",
      last_synced_at: hoursAgo(2),
    },
    owner: { id: "demo-owner", full_name: "Priya Shah", avatar_url: null },
  }),
  startup({
    id: "s7",
    slug: "formcraft",
    name: "FormCraft",
    tagline: "Typeform alternative for agencies",
    description: "White-label forms, logic jumps, and client workspaces.",
    category: "SaaS",
    for_sale: true,
    asking_price_cents: 5600000,
    multiple: 2.5,
    listing: {
      id: "l7",
      startup_id: "s7",
      tier: "starter",
      listed_at: daysAgo(2),
      featured_until: null,
      active: true,
      created_at: daysAgo(2),
    },
    metrics: {
      startup_id: "s7",
      mrr_cents: 187000,
      arr_cents: 2244000,
      customers: 265,
      churn_rate: 0.033,
      mom_growth: -0.02,
      currency: "USD",
      captured_at: hoursAgo(1),
      verification_status: "active",
      last_synced_at: hoursAgo(1),
    },
    owner: { id: "demo-owner", full_name: "Eli Brooks", avatar_url: null },
  }),
  startup({
    id: "s8",
    slug: "vitapulse",
    name: "VitaPulse",
    tagline: "Wearable insights for clinics",
    description: "HIPAA-ready patient wearable dashboards for small clinics.",
    category: "Health",
    tech_stack: ["Flutter", "Firebase", "Stripe"],
    for_sale: false,
    metrics: {
      startup_id: "s8",
      mrr_cents: 642000,
      arr_cents: 7704000,
      customers: 74,
      churn_rate: 0.012,
      mom_growth: 0.07,
      currency: "USD",
      captured_at: hoursAgo(5),
      verification_status: "active",
      last_synced_at: hoursAgo(5),
    },
    owner: { id: "demo-owner", full_name: "Dr. Lena Cho", avatar_url: null },
  }),
];

export function getDemoStartups() {
  return [...DEMO_STARTUPS].sort(
    (a, b) => (b.metrics?.mrr_cents ?? 0) - (a.metrics?.mrr_cents ?? 0)
  );
}

export function getDemoStartup(slug: string) {
  return DEMO_STARTUPS.find((s) => s.slug === slug) ?? null;
}

export function getDemoSnapshots(startupId: string) {
  const s = DEMO_STARTUPS.find((x) => x.id === startupId);
  if (!s?.metrics) return [];
  const base = s.metrics.mrr_cents;
  return Array.from({ length: 12 }).map((_, i) => {
    const growth = 1 - (11 - i) * 0.03 + (s.metrics!.mom_growth ?? 0) * 0.2;
    const mrr = Math.round(base * growth);
    return {
      id: `${startupId}-snap-${i}`,
      startup_id: startupId,
      mrr_cents: mrr,
      arr_cents: mrr * 12,
      customers: Math.round((s.metrics!.customers ?? 0) * growth),
      churn_rate: s.metrics!.churn_rate,
      mom_growth: s.metrics!.mom_growth,
      currency: s.metrics!.currency,
      captured_at: new Date(now - (11 - i) * 7 * 86400_000).toISOString(),
    };
  });
}
