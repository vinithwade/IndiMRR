# VerifiedMRR

Verified revenue marketplace inspired by [TrustMRR](https://trustmrr.com/). Founders connect Stripe for automatic MRR verification, publish public profiles, list startups for sale, and collect earnest deposits from buyers via **Stripe** or **Razorpay**. Full acquisition closing stays off-platform.

## Stack

- Next.js App Router + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Stripe (revenue sync + Checkout deposits/listing fees)
- Razorpay (India deposits + listing fees)
- Recharts for MRR history

## Quick start (demo UI)

```bash
cp .env.example .env.local
# Keep NEXT_PUBLIC_DEMO_MODE=true
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode serves curated startups without Supabase.

## Full setup

1. Create a Supabase project and run migrations:

```bash
npx supabase db push
# or paste supabase/migrations/*.sql in the SQL editor
```

2. Fill `.env.local` from `.env.example`, set `NEXT_PUBLIC_DEMO_MODE=false`.

3. Configure Stripe webhook → `POST /api/webhooks/stripe` for `checkout.session.completed`.

4. Configure Razorpay webhook → `POST /api/webhooks/razorpay` for `payment.captured`.

5. Schedule hourly sync (Vercel Cron already in `vercel.json`, or call):

```bash
curl -X POST "$APP_URL/api/cron/sync-revenue" \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Product flows

### Sellers
1. Sign up → **Add startup**
2. Paste a Stripe **restricted read-only** API key
3. Publish profile (leaderboard + public page)
4. List for sale; optionally pay **Starter** listing fee (Stripe/Razorpay)
5. Review deposited offers → accept/reject → close off-platform

### Buyers
1. Browse `/marketplace`
2. Submit offer + pay earnest deposit (5% of offer, clamped $250–$2,500)
3. Wait for seller acceptance
4. Complete asset transfer offline / via escrow

## Key routes

| Path | Purpose |
|------|---------|
| `/` | Home, recently listed, best deals, leaderboard teaser |
| `/marketplace` | For-sale filter/sort |
| `/leaderboard` | Verified MRR ranking |
| `/startup/[slug]` | Profile + offer form |
| `/dashboard` | Seller startups |
| `/dashboard/offers` | Buyer offer history |
| `/api/cron/sync-revenue` | Hourly Stripe MRR sync |
| `/api/webhooks/stripe` | Deposit + listing fee confirmation |
| `/api/webhooks/razorpay` | Deposit + listing fee confirmation |

## Security notes

- Stripe restricted keys are AES-GCM encrypted with `CREDENTIALS_ENCRYPTION_KEY`
- RLS enabled on all public tables
- Service role used only in webhooks/cron
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or secret payment keys to the client

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```
