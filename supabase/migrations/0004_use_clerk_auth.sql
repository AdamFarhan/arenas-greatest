drop policy if exists "Users can read their profile" on public.profiles;
drop policy if exists "Users can update their profile" on public.profiles;
drop policy if exists "Users can insert their profile" on public.profiles;
drop policy if exists "Users can read own matches" on public.matches;
drop policy if exists "Users can insert own matches" on public.matches;
drop policy if exists "Users can read own games" on public.games;
drop policy if exists "Users can insert own games" on public.games;
drop policy if exists "Users can read own score events" on public.score_events;
drop policy if exists "Users can insert own score events" on public.score_events;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

alter table public.profiles
  drop constraint if exists profiles_id_fkey;

alter table public.matches
  drop constraint if exists matches_user_id_fkey;

alter table public.profiles
  alter column id type text using id::text;

alter table public.matches
  alter column user_id type text using user_id::text;

create policy "Users can read their profile"
  on public.profiles for select using ((auth.jwt()->>'sub') = id);

create policy "Users can update their profile"
  on public.profiles for update using ((auth.jwt()->>'sub') = id);

create policy "Users can insert their profile"
  on public.profiles for insert with check ((auth.jwt()->>'sub') = id);

create policy "Users can read own matches"
  on public.matches for select using ((auth.jwt()->>'sub') = user_id);

create policy "Users can insert own matches"
  on public.matches for insert with check ((auth.jwt()->>'sub') = user_id);

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
