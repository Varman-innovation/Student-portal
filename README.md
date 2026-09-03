# Student Webinar MVP

Mobile-first student onboarding, webinar registration, recorded join clicks, and an admin conversion dashboard. The visual system follows Varman Innovation Labs' warm cream, deep navy, amber, pill-shaped design language.

## What is included

- Development-only mobile verification using `0000`
- Two-step database-shaped onboarding:
  1. Full name, region, language, phone
  2. Degree, branch, year of study
- Resumable profile state
- Next eligible webinar, duplicate-safe registration, recorded join click
- Admin funnel, student table, webinar creation
- Protected admin-user registration with scrypt password hashing
- Default local admin login `admin / admin123`
- Supabase schema with RLS and transaction-safe registration/join functions
- Netlify Next.js configuration

## Run locally

```bash
copy .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`. In demo mode data is held by the running process and resets on restart.

## Connect Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in its SQL editor.
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to `.env.local`.
4. Set `DEMO_MODE=false`.

The service-role key is server-only. Never expose it under a `NEXT_PUBLIC_` variable or commit `.env.local`.

Signed-in administrators can create additional admin accounts at `/admin/register`. The API is available at `POST /api/admin/users` and requires an active admin session.

## Netlify deployment

Import this folder as a Netlify site and add the environment variables in Netlify. For a real deployment:

- Use a 32+ character `SESSION_SECRET`.
- Override `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Connect Supabase before accepting real student data.
- Keep `ALLOW_DEMO_OTP=false` unless this is explicitly a private demo.
- Replace the demo OTP adapter with the planned WhatsApp OTP provider.

The included `netlify.toml` uses Node 22 and the Netlify Next.js adapter.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```
