alter table public.games
  add column if not exists end_reason text not null default 'points'
  check (end_reason in ('points', 'concession'));
