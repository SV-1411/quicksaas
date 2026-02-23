# Gigzs Monorepo

Production-grade backend-first SaaS scaffold for Gigzs with Supabase + Next.js App Router.

## Folder structure

```text
/apps
  /web                     # Next.js frontend + App Router APIs + auth + middleware
  /backend                 # Node service entrypoint
/services                  # matching, pricing, risk, contribution, snapshot, airobuilder engines
/supabase
  schema.sql               # PostgreSQL schema
  policies.sql             # explicit RLS policies
/scripts
  seed.ts                  # local seed (auth users + profiles + sample project)
/types
/utils
```

## Environment variables

Create `apps/web/.env.local` (and export same vars in your shell for seed script):

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<local-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key>
AIROBUILDER_API_URL=https://api.airobuilder.example.com
AIROBUILDER_API_KEY=dev-key
```

## Local development: exact commands

1. Install dependencies:

```bash
npm install
```

2. Start Supabase locally:

```bash
supabase start
```

3. Apply database schema + policies:

```bash
supabase db reset --local
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/schema.sql
psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f supabase/policies.sql
```

4. Seed users/projects/modules:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321 \
SUPABASE_SERVICE_ROLE_KEY=<local-service-role-key> \
npm run seed
```

5. Start web app:

```bash
npm run dev:web
```

6. Open app:

```text
http://localhost:3000
```

## Seeded credentials

- Client: `client@gigzs.local` / `Password123!`
- Freelancer 1: `frontend@gigzs.local` / `Password123!`
- Freelancer 2: `backend@gigzs.local` / `Password123!`
- Freelancer 3: `integrations@gigzs.local` / `Password123!`
- Admin: `admin@gigzs.local` / `Password123!`

## Happy path test walkthrough

1. Login as **client**.
2. Create a project from `/client` (watch dynamic price preview update live).
3. Submit project and verify redirect to `/projects/{id}`.
4. Confirm modules auto-created and statuses update in realtime.
5. Login as **freelancer** and open `/freelancer`.
6. Open assigned module and submit snapshot on `/modules/{id}`.
7. Confirm snapshot history updates immediately and module status changes.
8. Login as **admin** and open `/admin`.
9. Verify project list, risk alerts, reliability table.
10. Click manual reassignment from risk alert and verify module updates.

## Security guarantees enforced in this scaffold

- RLS enabled on all core tables.
- API role validation on auth-protected routes.
- Middleware-protected role routes (`/client`, `/freelancer`, `/admin`).
- Client project detail API intentionally omits freelancer identity fields.

## Deployment (Vercel + Supabase)

1. Create Supabase staging/prod projects.
2. Execute `supabase/schema.sql` and `supabase/policies.sql` on each DB.
3. Deploy `apps/web` to Vercel (project root: `apps/web`).
4. Set all env vars in Vercel.
5. Run `scripts/seed.ts` only in non-production environments.
6. Use `apps/backend` worker host for long-running orchestration/risk scans.
