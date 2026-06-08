create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table public.legends (
  id text primary key,
  name text not null,
  set_name text not null
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  player_legend_id text not null references public.legends(id),
  opponent_legend_id text not null references public.legends(id),
  notes text,
  winner text not null check (winner in ('player', 'opponent', 'tie')),
  player_game_wins integer not null check (player_game_wins between 0 and 2),
  opponent_game_wins integer not null check (opponent_game_wins between 0 and 2),
  duration_seconds integer check (duration_seconds >= 0),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  game_number integer not null check (game_number between 1 and 3),
  starting_player text not null check (starting_player in ('player', 'opponent')),
  winning_point integer not null check (winning_point in (8, 9, 10)),
  winner text not null check (winner in ('player', 'opponent')),
  player_score integer not null default 0,
  opponent_score integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, game_number)
);

create table public.score_events (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  player_side text not null check (player_side in ('player', 'opponent')),
  event_type text not null check (event_type in ('holding', 'conquering', 'ability', 'manual_adjustment')),
  points_delta integer not null,
  resulting_player_score integer not null,
  resulting_opponent_score integer not null,
  previous_score integer,
  adjusted_score integer,
  created_at timestamptz not null default now()
);

create index matches_user_played_at_idx
  on public.matches (user_id, played_at desc);

create index games_match_number_idx
  on public.games (match_id, game_number);

create index score_events_game_created_at_idx
  on public.score_events (game_id, created_at);

alter table public.profiles enable row level security;
alter table public.matches enable row level security;
alter table public.games enable row level security;
alter table public.score_events enable row level security;
alter table public.legends enable row level security;

create policy "Users can read their profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update their profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can read legends"
  on public.legends for select using (true);

create policy "Users can read own matches"
  on public.matches for select using (auth.uid() = user_id);

create policy "Users can insert own matches"
  on public.matches for insert with check (auth.uid() = user_id);

create policy "Users can read own games"
  on public.games for select using (
    exists (
      select 1 from public.matches
      where matches.id = games.match_id
      and matches.user_id = auth.uid()
    )
  );

create policy "Users can insert own games"
  on public.games for insert with check (
    exists (
      select 1 from public.matches
      where matches.id = games.match_id
      and matches.user_id = auth.uid()
    )
  );

create policy "Users can read own score events"
  on public.score_events for select using (
    exists (
      select 1 from public.games
      join public.matches on matches.id = games.match_id
      where games.id = score_events.game_id
      and matches.user_id = auth.uid()
    )
  );

create policy "Users can insert own score events"
  on public.score_events for insert with check (
    exists (
      select 1 from public.games
      join public.matches on matches.id = games.match_id
      where games.id = score_events.game_id
      and matches.user_id = auth.uid()
    )
  );

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into public.legends (id, name, set_name) values
  ('ahri', 'Ahri', 'Origins'),
  ('darius', 'Darius', 'Origins'),
  ('garen', 'Garen', 'Origins'),
  ('jinx', 'Jinx', 'Origins'),
  ('lux', 'Lux', 'Origins'),
  ('master-yi', 'Master Yi', 'Origins'),
  ('yasuo', 'Yasuo', 'Origins'),
  ('vi', 'Vi', 'Origins')
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
