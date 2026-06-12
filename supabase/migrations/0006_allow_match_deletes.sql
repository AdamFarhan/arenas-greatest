create policy "Users can delete own matches"
  on public.matches for delete using ((auth.jwt()->>'sub') = user_id);
