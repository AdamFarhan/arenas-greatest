# Supabase Setup

This folder contains the SQL needed to create the Riftbound Tracker database.

## Fresh hosted project

If you are setting up Supabase for the first time, open the Supabase Dashboard SQL Editor and run:

```txt
supabase/setup_fresh_project.sql
```

That single file creates the tables, Clerk-compatible RLS policies, indexes, and seeded legend rows.

## Existing project

If the project already has the earlier migrations applied, run only the new migration files that have not been applied yet:

```txt
supabase/migrations/0003_match_duration_indexes.sql
supabase/migrations/0004_use_clerk_auth.sql
```

## Clerk auth

Clerk is the source of truth for app users. Configure Clerk's Supabase integration, then add Clerk as a third-party auth provider in Supabase. The RLS policies compare `auth.jwt()->>'sub'` with app-owned `user_id` values.
