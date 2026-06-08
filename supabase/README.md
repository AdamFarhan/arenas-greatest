# Supabase Setup

This folder contains the SQL needed to create the Riftbound Tracker database.

## Fresh hosted project

If you are setting up Supabase for the first time, open the Supabase Dashboard SQL Editor and run:

```txt
supabase/setup_fresh_project.sql
```

That single file creates the tables, RLS policies, trigger, indexes, and seeded legend rows.

## Existing project

If the project already has the earlier migrations applied, run only the new migration files that have not been applied yet:

```txt
supabase/migrations/0003_match_duration_indexes.sql
```

## Auth redirects

Configure these redirect URLs in Supabase Auth:

```txt
riftboundtracker://
http://localhost:3000/dashboard
```

The mobile app uses the Expo scheme from `apps/mobile/app.json`.
Custom schemes require a development build or standalone app; Expo Go has limited incoming link support.
