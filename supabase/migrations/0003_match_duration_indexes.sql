alter table public.matches
  add column if not exists duration_seconds integer check (duration_seconds >= 0);

create index if not exists matches_user_played_at_idx
  on public.matches (user_id, played_at desc);

create index if not exists games_match_number_idx
  on public.games (match_id, game_number);

create index if not exists score_events_game_created_at_idx
  on public.score_events (game_id, created_at);
