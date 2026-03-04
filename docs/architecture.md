# Architecture Overview — Gigzs Platform

## Layer Map

```
┌─────────────────────────────────────────────────────────┐
│  BROWSER                                                 │
│  Next.js App Router (apps/web/app/)                      │
│  React Components  (apps/web/components/)                │
│  Tailwind CSS · Geist Font · Framer Motion               │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP
┌───────────────────────▼─────────────────────────────────┐
│  API LAYER (apps/web/app/api/)                           │
│  Next.js Route Handlers — runs on Edge/Node              │
│  auth/ · projects/ · freelancer/ · admin/ · system/      │
└───────────────────────┬─────────────────────────────────┘
                        │ TypeScript imports
┌───────────────────────▼─────────────────────────────────┐
│  SERVICE ENGINES (services/)                             │
│  Pure TypeScript · No framework dependency               │
│                                                          │
│  intake-mapper     → requirements → structured specs      │
│  module-planner    → specs → execution modules            │
│  pricing-engine    → dynamic pricing                      │
│  matching-engine   → freelancer ↔ module matching         │
│  assignment-engine → daily shift assignment               │
│  shift-engine      → shift scheduling                     │
│  risk-engine       → project risk score                   │
│  penalty-engine    → reliability penalties                │
│  snapshot-engine   → progress snapshots                   │
│  contribution-engine → contribution tracking              │
│  airobuilder-service → AI code generation                 │
└───────────────────────┬─────────────────────────────────┘
                        │ Supabase JS client
┌───────────────────────▼─────────────────────────────────┐
│  DATABASE (supabase/)                                    │
│  PostgreSQL via Supabase                                 │
│                                                          │
│  schema.sql        → all tables, enums, RLS              │
│  policies.sql      → row-level security rules            │
│  sync_users.sql    → auth trigger → users table          │
└─────────────────────────────────────────────────────────┘
```

## Key Data Flow

### Client submits a project brief
```
signup/login → POST /api/projects/create
  → intake-mapper (requirements → specs)
  → module-planner (specs → modules)
  → pricing-engine (dynamic quote)
  → Supabase: projects + project_modules inserted
```

### Freelancer gets assigned to a shift
```
Admin/system → POST /api/admin/assign (or cron)
  → matching-engine (find best freelancer)
  → assignment-engine (create daily_shift record)
  → Supabase: daily_shifts inserted
  → Freelancer dashboard updates via Realtime
```

### Client receives progress update
```
Supabase Realtime triggers → client_update_feed table
  → snapshot-engine (milestone snapshot)
  → Client dashboard: live ticker updates
  → Freelancer identity: never exposed
```

## Directory Conventions

| Directory | What goes here |
|-----------|---------------|
| `apps/web/app/` | Next.js pages and API routes only |
| `apps/web/components/` | Reusable React components |
| `apps/web/lib/` | Frontend-specific utilities and hooks |
| `services/` | Framework-agnostic business logic |
| `supabase/` | Database schema and SQL migrations |
| `types/` | Shared TypeScript interfaces |
| `utils/` | Pure utility functions usable anywhere |
| `scripts/` | One-off admin/migration scripts |
| `docs/` | Architecture and developer documentation |
