-- Fix numeric overflow: ARR multiples like 12.5 need room; previous numeric(6,2) maxed at 9999.99
alter table public.startups
  alter column multiple type numeric(12, 2);
