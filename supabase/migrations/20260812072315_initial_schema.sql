-- VerifiedMRR initial schema

create extension if not exists "pgcrypto";

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  bio text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Startups
create table public.startups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null unique,
  name text not null,
  tagline text,
  description text,
  category text not null default 'SaaS',
  tech_stack text[] not null default '{}',
  website text,
  logo_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  for_sale boolean not null default false,
  asking_price_cents bigint,
  asking_currency text not null default 'USD',
  multiple numeric(12,2),
  sale_notes text,
  anonymous boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index startups_owner_idx on public.startups (owner_id);
create index startups_status_idx on public.startups (status);
create index startups_for_sale_idx on public.startups (for_sale) where for_sale = true;
create index startups_category_idx on public.startups (category);

-- Revenue connections (credentials encrypted at app layer; store ciphertext)
create table public.revenue_connections (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  provider text not null default 'stripe' check (provider in ('stripe')),
  encrypted_api_key text not null,
  status text not null default 'pending' check (status in ('pending', 'active', 'error', 'revoked')),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (startup_id, provider)
);

-- Revenue snapshots
create table public.revenue_snapshots (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade,
  mrr_cents bigint not null default 0,
  arr_cents bigint not null default 0,
  customers integer not null default 0,
  churn_rate numeric(8,4) not null default 0,
  mom_growth numeric(8,4),
  currency text not null default 'USD',
  captured_at timestamptz not null default now()
);

create index revenue_snapshots_startup_captured_idx
  on public.revenue_snapshots (startup_id, captured_at desc);

-- Listings
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups (id) on delete cascade unique,
  tier text not null default 'free' check (tier in ('free', 'starter')),
  listed_at timestamptz not null default now(),
  featured_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Offers
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  amount_cents bigint not null,
  currency text not null default 'USD',
  message text,
  status text not null default 'pending_deposit'
    check (status in ('pending_deposit', 'deposited', 'accepted', 'rejected', 'withdrawn', 'expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index offers_buyer_idx on public.offers (buyer_id);
create index offers_listing_idx on public.offers (listing_id);

-- Deposits
create table public.deposits (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.offers (id) on delete cascade,
  provider text not null check (provider in ('stripe', 'razorpay')),
  amount_cents bigint not null,
  currency text not null,
  platform_fee_cents bigint not null default 0,
  provider_payment_id text,
  provider_order_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index deposits_offer_idx on public.deposits (offer_id);

-- Platform transactions (listing fees, etc.)
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  startup_id uuid references public.startups (id) on delete set null,
  kind text not null check (kind in ('listing_fee', 'deposit_fee')),
  provider text not null check (provider in ('stripe', 'razorpay')),
  amount_cents bigint not null,
  currency text not null,
  provider_payment_id text,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'refunded')),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger startups_updated_at before update on public.startups
  for each row execute function public.set_updated_at();
create trigger revenue_connections_updated_at before update on public.revenue_connections
  for each row execute function public.set_updated_at();
create trigger offers_updated_at before update on public.offers
  for each row execute function public.set_updated_at();
create trigger deposits_updated_at before update on public.deposits
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Latest snapshot view (security_invoker so RLS applies)
create or replace view public.startup_latest_metrics
with (security_invoker = true)
as
select distinct on (rs.startup_id)
  rs.startup_id,
  rs.mrr_cents,
  rs.arr_cents,
  rs.customers,
  rs.churn_rate,
  rs.mom_growth,
  rs.currency,
  rs.captured_at,
  rc.status as verification_status,
  rc.last_synced_at
from public.revenue_snapshots rs
left join public.revenue_connections rc on rc.startup_id = rs.startup_id and rc.provider = 'stripe'
order by rs.startup_id, rs.captured_at desc;

-- RLS
alter table public.profiles enable row level security;
alter table public.startups enable row level security;
alter table public.revenue_connections enable row level security;
alter table public.revenue_snapshots enable row level security;
alter table public.listings enable row level security;
alter table public.offers enable row level security;
alter table public.deposits enable row level security;
alter table public.transactions enable row level security;

-- Profiles policies
create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Startups policies
create policy "Published startups are public"
  on public.startups for select
  using (status = 'published' or owner_id = auth.uid());

create policy "Owners insert startups"
  on public.startups for insert
  with check (auth.uid() = owner_id);

create policy "Owners update startups"
  on public.startups for update
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "Owners delete startups"
  on public.startups for delete
  using (auth.uid() = owner_id);

-- Revenue connections: owner only (never expose keys publicly via select of encrypted field to others)
create policy "Owners manage revenue connections"
  on public.revenue_connections for all
  using (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  );

-- Public can see verification status via a restricted select of non-secret columns:
-- We allow public select but the encrypted_api_key should never be queried from client.
-- Create a column-level revoke approach via view for public; for simplicity allow select
-- only of active connections' metadata through a policy that still exposes encrypted key.
-- Mitigate: use a public view without the key.

create or replace view public.revenue_connection_public
with (security_invoker = true)
as
select id, startup_id, provider, status, last_synced_at, created_at
from public.revenue_connections;

-- Snapshots: public for published startups
create policy "Snapshots readable for published startups"
  on public.revenue_snapshots for select
  using (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and (s.status = 'published' or s.owner_id = auth.uid())
    )
  );

create policy "Owners insert snapshots"
  on public.revenue_snapshots for insert
  with check (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  );

-- Listings
create policy "Active listings public"
  on public.listings for select
  using (
    active = true
    or exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  );

create policy "Owners manage listings"
  on public.listings for insert
  with check (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  );

create policy "Owners update listings"
  on public.listings for update
  using (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.startups s
      where s.id = startup_id and s.owner_id = auth.uid()
    )
  );

-- Offers
create policy "Buyers and sellers read offers"
  on public.offers for select
  using (
    buyer_id = auth.uid()
    or exists (
      select 1
      from public.listings l
      join public.startups s on s.id = l.startup_id
      where l.id = listing_id and s.owner_id = auth.uid()
    )
  );

create policy "Buyers create offers"
  on public.offers for insert
  with check (auth.uid() = buyer_id);

create policy "Buyers update own pending offers"
  on public.offers for update
  using (
    buyer_id = auth.uid()
    or exists (
      select 1
      from public.listings l
      join public.startups s on s.id = l.startup_id
      where l.id = listing_id and s.owner_id = auth.uid()
    )
  );

-- Deposits: buyer + seller can read; inserts via service role / authenticated buyer
create policy "Buyers and sellers read deposits"
  on public.deposits for select
  using (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and (
        o.buyer_id = auth.uid()
        or exists (
          select 1 from public.listings l
          join public.startups s on s.id = l.startup_id
          where l.id = o.listing_id and s.owner_id = auth.uid()
        )
      )
    )
  );

create policy "Buyers create deposits"
  on public.deposits for insert
  with check (
    exists (
      select 1 from public.offers o
      where o.id = offer_id and o.buyer_id = auth.uid()
    )
  );

-- Transactions
create policy "Users read own transactions"
  on public.transactions for select
  using (user_id = auth.uid());

create policy "Users create own transactions"
  on public.transactions for insert
  with check (user_id = auth.uid());

grant select on public.startup_latest_metrics to anon, authenticated;
grant select on public.revenue_connection_public to anon, authenticated;
