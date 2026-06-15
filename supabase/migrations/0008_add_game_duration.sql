alter table public.games
  add column if not exists duration_seconds integer check (duration_seconds >= 0);
