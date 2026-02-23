# Gigzs Monorepo

Production-oriented backend-first SaaS foundation for Gigzs.

## Folder structure

```text
/apps
  /web                     # Next.js App Router frontend + API routes
  /backend                 # Node.js orchestration/service host
/supabase
  schema.sql               # PostgreSQL schema
  policies.sql             # RLS policies
/services                  # domain engines
/types                     # shared types
/utils                     # utility functions
```

## Local development

1. Install dependencies per app (`apps/web`, `apps/backend`) with your package manager.
2. Start Supabase locally:
   - `supabase start`
   - Apply SQL: `supabase db reset --local` (or execute `schema.sql` then `policies.sql`).
3. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `AIROBUILDER_API_URL`
   - `AIROBUILDER_API_KEY`
4. Run web app (`next dev`) and backend service (`node --watch src/index.ts` or tsx).
5. Validate API routes:
   - `POST /api/projects/create`
   - `POST /api/modules/{id}/snapshot`
   - `POST /api/airobuilder/create-session`

## Deployment (Vercel + Supabase)

1. Create Supabase project (prod + staging), run `schema.sql` then `policies.sql`.
2. Deploy `apps/web` to Vercel with project root set to `apps/web`.
3. Set Vercel env vars for Supabase + AiroBuilder.
4. Deploy `apps/backend` to your Node runtime (Fly.io/Render/ECS) for background jobs and heavy orchestration.
5. Configure cron/queue workers for risk scans and contribution settlement.
6. Enable observability:
   - Vercel Analytics + Logs
   - Supabase Logs + Postgres metrics
   - Alerting on risk threshold breaches and failed AiroBuilder sessions.

## Security notes

- RLS is mandatory and enabled for all core tables.
- API routes must enforce authenticated role checks before mutation.
- Clients never receive freelancer identity in API response payloads.
- Critical actions should be audit logged (assignment, re-assignment, payouts, penalties).
