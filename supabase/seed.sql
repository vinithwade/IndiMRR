-- Optional seed for local/staging after creating a real auth user.
-- Replace OWNER_UUID with auth.users.id from Supabase Auth.

-- Example:
-- insert into public.profiles (id, full_name) values ('OWNER_UUID', 'Demo Founder')
-- on conflict (id) do nothing;

-- insert into public.startups (
--   id, owner_id, slug, name, tagline, description, category, tech_stack,
--   status, for_sale, asking_price_cents, asking_currency, multiple, sale_notes
-- ) values (
--   '11111111-1111-1111-1111-111111111111',
--   'OWNER_UUID',
--   'inboxpilot',
--   'InboxPilot',
--   'AI email triage for indie founders',
--   'InboxPilot sorts, drafts, and prioritizes founder inboxes.',
--   'AI',
--   array['Next.js','OpenAI','Stripe'],
--   'published',
--   true,
--   18000000,
--   'USD',
--   3.2,
--   'Includes domain, codebase, and Stripe customers.'
-- );

-- insert into public.listings (startup_id, tier, active)
-- values ('11111111-1111-1111-1111-111111111111', 'starter', true);

-- insert into public.revenue_connections (startup_id, provider, encrypted_api_key, status, last_synced_at)
-- values (
--   '11111111-1111-1111-1111-111111111111',
--   'stripe',
--   'demo-placeholder',
--   'active',
--   now()
-- );

-- insert into public.revenue_snapshots (
--   startup_id, mrr_cents, arr_cents, customers, churn_rate, mom_growth, currency
-- ) values (
--   '11111111-1111-1111-1111-111111111111',
--   468000, 5616000, 312, 0.028, 0.11, 'USD'
-- );

select 'Use NEXT_PUBLIC_DEMO_MODE=true for built-in demo startups without a database.' as note;
