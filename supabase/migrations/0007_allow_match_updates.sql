create policy "Users can update own matches"
  on public.matches for update
  using ((auth.jwt()->>'sub') = user_id)
  with check ((auth.jwt()->>'sub') = user_id);
