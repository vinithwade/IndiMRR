-- Structured chat offer messages (accept / reject in thread)

alter table public.messages
  add column if not exists kind text not null default 'text'
    check (kind in ('text', 'offer', 'offer_update'));

alter table public.messages
  add column if not exists meta jsonb not null default '{}'::jsonb;
