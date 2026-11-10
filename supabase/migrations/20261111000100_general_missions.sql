-- Broaden the board from campus-only to local and remote missions.
alter table public.missions drop constraint if exists missions_scope_check;
alter table public.missions add constraint missions_scope_check
  check (scope in ('local', 'remote'));

alter table public.missions drop constraint if exists missions_category_check;
alter table public.missions add constraint missions_category_check
  check (category in (
    'Community', 'Design', 'Tech', 'Career', 'Research & enquiry',
    'Community & local', 'Creative & media', 'Technology & data',
    'Events & logistics', 'Peer support', 'Public information'
  ));

alter table public.missions alter column creator_name set default 'Community member';
