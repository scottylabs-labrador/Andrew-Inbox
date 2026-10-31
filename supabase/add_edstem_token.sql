-- Adds the optional Ed (edstem.org) token to an existing Andrew Inbox project.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste -> Run.
-- (New projects get this from schema.sql already.)

alter table public.profiles
  add column if not exists edstem_token text,
  add column if not exists has_edstem_token boolean
    generated always as (edstem_token is not null) stored;

grant select (has_edstem_token) on public.profiles to authenticated;
grant update (edstem_token) on public.profiles to authenticated;
