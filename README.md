# Riftbound Tracker

A greenfield Riftbound score tracker with an Expo mobile app, a Next.js web dashboard, shared TypeScript match logic, seeded legend data, and Supabase persistence.

## Structure

```txt
apps/mobile       Expo app for table-side scoring
apps/web          Next.js dashboard for match history and details
packages/core     React-free match logic and shared types
packages/db       Supabase helpers and generated database types
packages/legends  Versioned official legend seed data
supabase          Migrations and seed SQL
```

## Getting Started

```bash
npm install
npm run dev:web
npm run dev:mobile
```

Copy `.env.example` to each app as needed and fill in Supabase values.

## Supabase Setup

For a brand-new Supabase project, create the project in the Supabase Dashboard, then run the SQL in:

```txt
supabase/setup_fresh_project.sql
```

Add the Expo mobile redirect URL in Supabase Auth:

```txt
riftboundtracker://
```

Custom schemes require a development build or standalone app. Expo Go has limited incoming link support, so auth redirect testing is more reliable in a development build.

Then copy `.env.example` into `apps/mobile/.env` and fill in:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_AUTH_REDIRECT_URL=riftboundtracker://
```

Use the Supabase project URL and a public client key, either the publishable key or legacy anon key. Do not use a service role or secret key in the mobile app.
