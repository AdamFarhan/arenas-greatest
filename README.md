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
