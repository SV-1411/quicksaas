# Gigzs — Managed Digital Factory

> Submit your brief. We deploy specialists. You track progress — never the people.

## Project Structure

```
quicksaas/
│
├── apps/
│   └── web/                        ← FRONTEND (Next.js 14, React, Tailwind, Geist)
│       ├── app/                    ← Pages & routing (Next.js App Router)
│       │   ├── page.tsx            ← Public landing page
│       │   ├── login/              ← Auth: sign in
│       │   ├── signup/             ← Auth: create account
│       │   ├── client/             ← Client dashboard
│       │   ├── freelancer/         ← Freelancer workspace
│       │   ├── admin/              ← Admin control centre
│       │   ├── projects/           ← Project detail & list
│       │   ├── modules/            ← Module detail view
│       │   ├── settings/           ← User settings
│       │   ├── history/            ← Work history
│       │   ├── security/           ← Security page
│       │   ├── tools/              ← Tools hub + AiroBuilder
│       │   └── api/                ← BACKEND API ROUTES (Next.js route handlers)
│       │       ├── auth/           ← login, logout, signup, session
│       │       ├── projects/       ← create, list, modules
│       │       ├── freelancer/     ← modules, profile, onboarding
│       │       ├── admin/          ← dashboard, risk
│       │       ├── modules/        ← module updates
│       │       ├── airobuilder/    ← AI generation endpoint
│       │       └── system/         ← health check
│       │
│       ├── components/             ← React UI components
│       │   ├── ui/                 ← Primitives (Button, Card, Badge, Modal…)
│       │   ├── layout/             ← AppShell, CustomCursor, UiPrefsBootstrap
│       │   ├── project/            ← Intake form
│       │   └── freelancer/         ← Onboarding form
│       │
│       ├── lib/                    ← Frontend utilities
│       │   ├── supabase/           ← Browser & server Supabase clients
│       │   ├── auth/               ← Auth helpers
│       │   ├── hooks/              ← Custom React hooks (useToast)
│       │   ├── env.ts              ← Environment variable validation
│       │   ├── ui-prefs.ts         ← Theme persistence
│       │   └── utils.ts            ← cn() and helpers
│       │
│       ├── public/                 ← Static assets (fonts, images)
│       │   └── fonts/              ← Geist variable fonts
│       └── middleware.ts           ← Auth middleware (route protection)
│
├── services/                       ← BUSINESS LOGIC ENGINES (pure TypeScript)
│   ├── pricing-engine.ts           ← Dynamic pricing calculation
│   ├── matching-engine.ts          ← Freelancer ↔ module matching
│   ├── assignment-engine.ts        ← Shift assignment logic
│   ├── shift-engine.ts             ← Daily shift management
│   ├── shift-windows.ts            ← Shift time window rules
│   ├── module-planner.ts           ← Project → module decomposition
│   ├── intake-mapper.ts            ← Requirements → structured specs
│   ├── risk-engine.ts              ← Project risk scoring
│   ├── penalty-engine.ts           ← Reliability penalty calculation
│   ├── contribution-engine.ts      ← Contribution tracking
│   ├── snapshot-engine.ts          ← Project snapshot creation
│   └── airobuilder-service.ts      ← AI code generation service
│
├── supabase/                       ← DATABASE (PostgreSQL via Supabase)
│   ├── schema.sql                  ← Full database schema (tables, types, RLS)
│   ├── policies.sql                ← Row Level Security policies
│   ├── open_access.sql             ← Public access grants
│   ├── profile_storage.sql         ← Avatar/storage setup
│   └── sync_users.sql              ← Auth → users table trigger
│
├── types/                          ← SHARED TypeScript type definitions
├── utils/                          ← SHARED utility functions
├── scripts/                        ← One-off / migration scripts
└── docs/                           ← Architecture documentation
    └── architecture.md
```

## Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Frontend    | Next.js 14, React 18, Tailwind CSS  |
| Font        | Geist Sans + Geist Mono (variable)  |
| Animation   | Framer Motion                       |
| Backend API | Next.js Route Handlers (Edge-ready) |
| Database    | Supabase (PostgreSQL + RLS)         |
| Auth        | Supabase Auth + SSR cookies         |
| Services    | Pure TypeScript engines             |

## Getting Started

```bash
# Install dependencies
npm install

# Run the frontend dev server
cd apps/web
npm run dev
# → http://localhost:3000
```

## Environment Variables

Copy `apps/web/.env.local.example` → `apps/web/.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
