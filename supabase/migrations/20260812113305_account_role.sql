-- Primary account intent chosen at signup (buyer vs seller).
-- Soft preference for UX/onboarding — users can still do both later.

alter table public.profiles
  add column if not exists account_role text
    check (account_role is null or account_role in ('buyer', 'seller'));

comment on column public.profiles.account_role is
  'Signup intent: buyer or seller. Soft preference for UI, not a hard permission gate.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chosen_role text;
begin
  chosen_role := lower(coalesce(new.raw_user_meta_data->>'account_role', ''));
  if chosen_role not in ('buyer', 'seller') then
    chosen_role := null;
  end if;

  insert into public.profiles (id, full_name, avatar_url, account_role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    chosen_role
  );
  return new;
end;
$$;

-- Backfill known test accounts
update public.profiles
set account_role = 'buyer'
where id = 'ec85b71f-8549-408d-b241-aab2245fe79d'
  and account_role is null;

update public.profiles
set account_role = 'seller'
where id = '81a298a7-1053-4c32-813f-e05e6f9c8633'
  and account_role is null;

update public.profiles p
set account_role = 'seller'
where account_role is null
  and exists (select 1 from public.startups s where s.owner_id = p.id);

update public.profiles
set account_role = 'buyer'
where account_role is null;
