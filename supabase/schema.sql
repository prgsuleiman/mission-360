-- Campus Missions shared board schema.
-- Run in the Supabase SQL Editor for a project dedicated to this application.

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 4 and 100),
  description text not null check (char_length(description) between 10 and 2000),
  deliverable text not null default '' check (char_length(deliverable) <= 500),
  category text not null check (category in ('Community', 'Design', 'Tech', 'Career', 'Research & enquiry', 'Campus & community', 'Creative & media', 'Technology & data', 'Events & logistics', 'Peer support')),
  scope text not null check (scope in ('campus', 'remote')),
  location text not null default '',
  reward_type text not null check (reward_type in ('paypal', 'local')),
  reward_amount numeric(12,2),
  reward_currency text not null default 'USD' check (reward_currency ~ '^[A-Z]{3}$'),
  reward_description text not null default '',
  skills text[] not null default '{}',
  creator_id uuid not null references auth.users(id) on delete cascade,
  creator_name text not null default 'Campus community',
  claimed_by uuid references auth.users(id) on delete set null,
  status text not null default 'open' check (status in ('draft', 'open', 'accepted', 'completed')),
  created_at timestamptz not null default now(),
  constraint reward_shape check (
    (reward_type = 'paypal' and reward_amount is not null and reward_amount > 0)
    or (reward_type = 'local' and char_length(reward_description) > 0)
  ),
  constraint claim_shape check (
    (status in ('draft', 'open') and claimed_by is null)
    or (status in ('accepted', 'completed') and claimed_by is not null)
  )
);

create index if not exists missions_open_created_idx on public.missions (created_at desc) where status = 'open';
create index if not exists missions_category_open_idx on public.missions (category, created_at desc) where status = 'open';
create index if not exists missions_creator_idx on public.missions (creator_id);
create index if not exists missions_claimed_by_idx on public.missions (claimed_by);

alter table public.missions enable row level security;
revoke all on public.missions from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.missions to anon, authenticated;
grant insert (title, description, deliverable, category, scope, location, reward_type, reward_amount, reward_currency, reward_description, skills, creator_id, creator_name, status) on public.missions to authenticated;
grant update (status, claimed_by) on public.missions to authenticated;

drop policy if exists "Anyone can view open missions" on public.missions;
create policy "Anyone can view open missions"
  on public.missions for select to anon, authenticated
  using ((status = 'open' and creator_id is not null) or creator_id = (select auth.uid()) or claimed_by = (select auth.uid()));

drop policy if exists "Signed-in students can post missions" on public.missions;
create policy "Signed-in students can post missions"
  on public.missions for insert to authenticated
  with check (creator_id = (select auth.uid()));

drop policy if exists "Students can accept an open mission" on public.missions;
create policy "Students can accept an open mission"
  on public.missions for update to authenticated
  using (status = 'open' and claimed_by is null)
  with check (status = 'accepted' and claimed_by = (select auth.uid()));

drop policy if exists "Organizers can publish their draft missions" on public.missions;
create policy "Organizers can publish their draft missions"
  on public.missions for update to authenticated
  using (status = 'draft' and creator_id = (select auth.uid()))
  with check (status = 'open' and creator_id = (select auth.uid()));

drop policy if exists "Claimants can complete their mission" on public.missions;
create policy "Claimants can complete their mission"
  on public.missions for update to authenticated
  using (status = 'accepted' and claimed_by = (select auth.uid()))
  with check (status = 'completed' and claimed_by = (select auth.uid()));
