-- Sets up a brand-new Supabase project for Andrew Inbox.
-- Run once: Supabase dashboard -> SQL Editor -> New query -> paste all of this -> Run.
--
-- Who can see what:
--   * People sign in with Supabase Auth (Andrew ID + password).
--   * Each person can only read and change their own assignments and announcements.
--   * Canvas tokens are write-only from the extension: a user can save theirs,
--     but nobody can read tokens back except the backend (which uses the secret key).

-- Every table below grants its own permissions, so this works whether or not
-- "Automatically expose new tables" was ticked when the project was created.
grant usage on schema public to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Profiles: one row per user, created automatically when they sign up
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  canvas_token text,
  has_canvas_token boolean generated always as (canvas_token is not null) stored,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;

create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "update own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Column-level permissions: users can see whether a token is saved, and set it,
-- but can never read the token itself.
revoke all on public.profiles from anon, authenticated;
grant select (id, username, has_canvas_token, created_at) on public.profiles to authenticated;
grant update (canvas_token) on public.profiles to authenticated;
grant all on public.profiles to service_role;

-- ---------------------------------------------------------------------------
-- Assignments (Canvas, Gradescope, and ones added by hand)
-- ---------------------------------------------------------------------------
create table public.assignments_duplicate (
  assignment_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  assignment_name text,
  course_name text,
  due_date timestamptz,
  points_possible numeric,
  retrieved_at timestamptz,
  status boolean not null default false,
  platform text
);
create index on public.assignments_duplicate (user_id);

alter table public.assignments_duplicate enable row level security;

create policy "own assignments" on public.assignments_duplicate
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.assignments_duplicate from anon;
grant select, insert, update, delete on public.assignments_duplicate to authenticated;
grant all on public.assignments_duplicate to service_role;

-- ---------------------------------------------------------------------------
-- Announcements (Piazza, ...)
-- ---------------------------------------------------------------------------
create table public.announcements (
  announcement_id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  course text,
  title text,
  description text,
  link text,
  date timestamptz,
  platform text,
  is_read boolean not null default false
);
create index on public.announcements (user_id);

alter table public.announcements enable row level security;

create policy "read own announcements" on public.announcements
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "mark own announcements read" on public.announcements
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.announcements from anon;
grant select, update on public.announcements to authenticated;
grant all on public.announcements to service_role;
