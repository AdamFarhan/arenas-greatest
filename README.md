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
npm run dev-build:android
```

Copy `.env.example` to each app as needed and fill in Supabase and Clerk values.

## Supabase Setup

For a brand-new Supabase project, create the project in the Supabase Dashboard, then run the SQL in:

```txt
supabase/setup_fresh_project.sql
```

Configure Clerk's Supabase integration, then add Clerk as a third-party auth provider in Supabase. Supabase RLS policies use the Clerk session subject claim as the app user id.

Then copy `.env.example` into `apps/mobile/.env` and fill in:

```txt
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=
```

Use the Supabase project URL and a public client key, either the publishable key or legacy anon key. Do not use a service role or secret key in the mobile app.

## Mobile Native Auth

The mobile app uses Clerk's native auth UI, so auth must be tested in a development build or standalone build instead of Expo Go.

Set up Clerk Native API and an Android native application with package name:

```txt
com.arenasgreatest.app
```

For Google sign-in, use the local Android debug SHA-256 fingerprint in Google/Clerk setup:

```bash
keytool -list -v \
  -alias androiddebugkey \
  -keystore ~/.android/debug.keystore \
  -storepass android \
  -keypass android
```

Then install the Android development build:

```bash
npm run dev-build:android
```

After the dev build is installed, `npm run dev:mobile` starts the Metro server for normal JavaScript iteration. Rebuild the dev client after native dependency, plugin, or app config changes.
