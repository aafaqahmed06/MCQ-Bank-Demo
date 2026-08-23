# DiagKnow

DiagKnow is a curriculum-aware MCQ practice and exam bank for medical students, built initially
for MBBS students in Pakistan. Live at
[mcq-bank-demo.vercel.app](https://mcq-bank-demo.vercel.app).

## Features

- College / program / academic-year onboarding, with a block → module → topic curriculum
  hierarchy
- Practice sessions with instant correct/incorrect feedback and explanations
- Timed exams
- Bookmarks and per-question reporting (incorrect, ambiguous, typo, outdated)
- Per-topic progress tracking and a leaderboard
- Admin content-moderation and review pipeline, with an audit log of admin actions

## Tech stack

- [Next.js](https://nextjs.org) (App Router) with React 19 and TypeScript
- [Tailwind CSS](https://tailwindcss.com) v4
- [Supabase](https://supabase.com) — Postgres, Auth, and Row Level Security
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) — CAPTCHA on sign-up,
  sign-in, and password recovery
- Deployed on [Vercel](https://vercel.com)

## Getting started

1. Copy `.env.example` to `.env.local` and fill in real values:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from your Supabase project
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to the client
   - `NEXT_PUBLIC_CAPTCHA_PROVIDER=turnstile`, `NEXT_PUBLIC_CAPTCHA_SITE_KEY`, `TURNSTILE_SECRET`
     — the Turnstile secret must also be set in the Supabase Dashboard under
     Authentication → Attack Protection, since Supabase's own auth server calls Turnstile's
     verification endpoint, not this app's server.
2. Install dependencies and start the dev server:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command             | Description                                  |
| -------------------- | --------------------------------------------- |
| `npm run dev`         | Start the dev server                          |
| `npm run build`       | Production build                              |
| `npm run start`       | Run the production build                      |
| `npm run lint`        | Lint the codebase                             |
| `npm run typecheck`   | Type-check with `tsc --noEmit`                |
| `npm run test`        | Run the test suite (Vitest)                   |
| `npm run db:seed`     | Seed the database with MCQs                   |
| `npm run db:verify`   | Verify database/content integrity             |
| `npm run db:coverage` | Report topic coverage for the question bank   |

`db:seed` and `db:verify` must stay green before any commit that touches content or schema.

## Architecture

`docs/MASTER_KB.md` is the source of truth for schema, pipeline, and architecture decisions —
read it before making changes in those areas. This is production software: RLS is enforced on
every table, no mock data or placeholder behavior ships to the live app, and secrets stay out of
the repo (env vars live in `.env.local`, which is gitignored, and in Vercel project settings).

## License

All rights reserved. This repository is proprietary; no open-source license is granted.
