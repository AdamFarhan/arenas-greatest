create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id text primary key,
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
  user_id text not null,
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
  on public.profiles for select using ((auth.jwt()->>'sub') = id);

create policy "Users can update their profile"
  on public.profiles for update using ((auth.jwt()->>'sub') = id);

create policy "Users can insert their profile"
  on public.profiles for insert with check ((auth.jwt()->>'sub') = id);

create policy "Users can read legends"
  on public.legends for select using (true);

create policy "Users can read own matches"
  on public.matches for select using ((auth.jwt()->>'sub') = user_id);

create policy "Users can insert own matches"
  on public.matches for insert with check ((auth.jwt()->>'sub') = user_id);

create policy "Users can delete own matches"
  on public.matches for delete using ((auth.jwt()->>'sub') = user_id);

create policy "Users can read own games"
  on public.games for select using (
    exists (
      select 1 from public.matches
      where matches.id = games.match_id
      and matches.user_id = (auth.jwt()->>'sub')
    )
  );

create policy "Users can insert own games"
  on public.games for insert with check (
    exists (
      select 1 from public.matches
      where matches.id = games.match_id
      and matches.user_id = (auth.jwt()->>'sub')
    )
  );

create policy "Users can read own score events"
  on public.score_events for select using (
    exists (
      select 1 from public.games
      join public.matches on matches.id = games.match_id
      where games.id = score_events.game_id
      and matches.user_id = (auth.jwt()->>'sub')
    )
  );

create policy "Users can insert own score events"
  on public.score_events for insert with check (
    exists (
      select 1 from public.games
      join public.matches on matches.id = games.match_id
      where games.id = score_events.game_id
      and matches.user_id = (auth.jwt()->>'sub')
    )
  );

insert into public.legends (id, name, set_name) values
  ('ahri-nine-tailed-fox', 'Ahri, Nine-Tailed Fox', 'Origins'),
  ('annie-dark-child', 'Annie, Dark Child', 'Origins'),
  ('azir-emperor-of-the-sands', 'Azir, Emperor of the Sands', 'Spiritforged'),
  ('darius-hand-of-noxus', 'Darius, Hand of Noxus', 'Origins'),
  ('diana-scorn-of-the-moon', 'Diana, Scorn of the Moon', 'Unleashed'),
  ('draven-glorious-executioner', 'Draven, Glorious Executioner', 'Spiritforged'),
  ('ezreal-prodigal-explorer', 'Ezreal, Prodigal Explorer', 'Spiritforged'),
  ('fiora-grand-duelist', 'Fiora, Grand Duelist', 'Spiritforged'),
  ('garen-might-of-demacia', 'Garen, Might of Demacia', 'Origins'),
  ('irelia-blade-dancer', 'Irelia, Blade Dancer', 'Spiritforged'),
  ('ivern-green-father', 'Ivern, Green Father', 'Spiritforged'),
  ('jax-grandmaster-at-arms', 'Jax, Grandmaster at Arms', 'Spiritforged'),
  ('jhin-virtuoso', 'Jhin, Virtuoso', 'Spiritforged'),
  ('jinx-loose-cannon', 'Jinx, Loose Cannon', 'Origins'),
  ('kaisa-daughter-of-the-void', 'Kai''Sa, Daughter of the Void', 'Origins'),
  ('khazix-voidreaver', 'Kha''Zix, Voidreaver', 'Unleashed'),
  ('leblanc-deceiver', 'LeBlanc, Deceiver', 'Spiritforged'),
  ('lee-sin-blind-monk', 'Lee Sin, Blind Monk', 'Origins'),
  ('leona-radiant-dawn', 'Leona, Radiant Dawn', 'Origins'),
  ('lillia-bashful-bloom', 'Lillia, Bashful Bloom', 'Unleashed'),
  ('lucian-purifier', 'Lucian, Purifier', 'Unleashed'),
  ('lux-lady-of-luminosity', 'Lux, Lady of Luminosity', 'Origins'),
  ('master-yi-wuju-bladesman', 'Master Yi, Wuju Bladesman', 'Unleashed'),
  ('master-yi-wuju-master', 'Master Yi, Wuju Master', 'Origins'),
  ('miss-fortune-bounty-hunter', 'Miss Fortune, Bounty Hunter', 'Origins'),
  ('ornn-fire-below-the-mountain', 'Ornn, Fire Below the Mountain', 'Spiritforged'),
  ('poppy-keeper-of-the-hammer', 'Poppy, Keeper of the Hammer', 'Spiritforged'),
  ('pyke-bloodharbor-ripper', 'Pyke, Bloodharbor Ripper', 'Unleashed'),
  ('reksai-void-burrower', 'Rek''Sai, Void Burrower', 'Unleashed'),
  ('renata-glasc-chem-baroness', 'Renata Glasc, Chem-Baroness', 'Unleashed'),
  ('rengar-pridestalker', 'Rengar, Pridestalker', 'Unleashed'),
  ('rumble-mechanized-menace', 'Rumble, Mechanized Menace', 'Spiritforged'),
  ('sett-the-boss', 'Sett, The Boss', 'Origins'),
  ('sivir-battle-mistress', 'Sivir, Battle Mistress', 'Unleashed'),
  ('teemo-swift-scout', 'Teemo, Swift Scout', 'Origins'),
  ('vex-gloomist', 'Vex, Gloomist', 'Unleashed'),
  ('vi-piltover-enforcer', 'Vi, Piltover Enforcer', 'Unleashed'),
  ('viktor-herald-of-the-arcane', 'Viktor, Herald of the Arcane', 'Origins'),
  ('volibear-relentless-storm', 'Volibear, Relentless Storm', 'Origins'),
  ('yasuo-unforgiven', 'Yasuo, Unforgiven', 'Origins')
on conflict (id) do update set
  name = excluded.name,
  set_name = excluded.set_name;
