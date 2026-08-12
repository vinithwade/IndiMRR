-- Public lookup of signup role by email (for login form badge).
-- Returns only account_role; does not expose other profile fields.

create or replace function public.lookup_account_role(p_email text)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select p.account_role
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_email))
  limit 1;
$$;

revoke all on function public.lookup_account_role(text) from public;
grant execute on function public.lookup_account_role(text) to anon, authenticated;
