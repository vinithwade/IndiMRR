-- Free offers (no deposit) + buyer/seller messaging

-- Offer statuses: pending → accepted | rejected | withdrawn | expired
alter table public.offers drop constraint if exists offers_status_check;

update public.offers
set status = 'pending'
where status in ('pending_deposit', 'deposited');

alter table public.offers
  alter column status set default 'pending';

alter table public.offers
  add constraint offers_status_check
  check (status in ('pending', 'accepted', 'rejected', 'withdrawn', 'expired'));

-- Conversations (one per offer)
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null unique references public.offers (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  startup_id uuid not null references public.startups (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  last_message_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index conversations_buyer_idx on public.conversations (buyer_id);
create index conversations_seller_idx on public.conversations (seller_id);
create index conversations_last_message_idx on public.conversations (last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index messages_conversation_idx on public.messages (conversation_id, created_at);

create trigger conversations_updated_at before update on public.conversations
  for each row execute function public.set_updated_at();

create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set last_message_at = new.created_at,
      updated_at = now()
  where id = new.conversation_id;
  return new;
end;
$$;

create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Participants read conversations"
  on public.conversations for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Buyers create conversations"
  on public.conversations for insert
  with check (buyer_id = auth.uid());

create policy "Participants update conversations"
  on public.conversations for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "Participants read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

create policy "Participants send messages"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );
