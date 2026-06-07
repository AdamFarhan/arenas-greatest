alter table public.matches
  drop constraint if exists matches_winner_check;

alter table public.matches
  add constraint matches_winner_check
  check (winner in ('player', 'opponent', 'tie'));
