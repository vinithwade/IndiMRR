-- Track which conversation a user is actively viewing (WhatsApp-style suppress).
create table if not exists public.user_presence (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_conversation_id uuid references public.conversations (id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_presence enable row level security;

create policy "user_presence_select_own"
  on public.user_presence for select
  to authenticated
  using (auth.uid() = user_id);

create policy "user_presence_upsert_own"
  on public.user_presence for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_presence_update_own"
  on public.user_presence for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
