-- In-app notifications (offers, messages, platform updates)

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null
    check (kind in ('message', 'offer', 'offer_update', 'platform')),
  title text not null,
  body text not null,
  href text,
  meta jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id)
  where read_at is null;

alter table public.notifications enable row level security;

create policy "Users read own notifications"
  on public.notifications for select
  using (user_id = auth.uid());

create policy "Users update own notifications"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Inserts go through service role / server helper (no direct client insert)
