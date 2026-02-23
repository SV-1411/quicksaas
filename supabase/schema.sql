-- Gigzs production schema
create extension if not exists "pgcrypto";

create type public.user_role as enum ('client', 'freelancer', 'admin', 'system');
create type public.project_status as enum ('draft', 'intake', 'active', 'at_risk', 'completed', 'cancelled');
create type public.module_status as enum ('queued', 'assigned', 'in_progress', 'handoff', 'review', 'completed', 'blocked', 'reassigned');
create type public.session_status as enum ('pending', 'ready', 'deployed', 'failed', 'archived');

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  role public.user_role not null,
  full_name text not null,
  email text unique not null,
  specialty_tags text[] not null default '{}',
  skill_vector jsonb not null default '{}'::jsonb,
  reliability_score numeric(5,2) not null default 1.00,
  availability_score numeric(5,2) not null default 1.00,
  wallet_balance numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.users(id) on delete restrict,
  title text not null,
  raw_requirement text,
  structured_requirements jsonb not null default '{}'::jsonb,
  complexity_score integer not null default 0 check (complexity_score between 0 and 100),
  pricing_breakdown jsonb not null default '{}'::jsonb,
  urgency text,
  status public.project_status not null default 'intake',
  deadline_at timestamptz,
  total_price numeric(14,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.project_modules (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_key text not null,
  module_name text not null,
  module_status public.module_status not null default 'queued',
  assigned_freelancer_id uuid references public.users(id) on delete set null,
  module_vector jsonb not null default '{}'::jsonb,
  structured_progress jsonb not null default '{}'::jsonb,
  module_weight numeric(8,4) not null default 0.25,
  expected_progress_rate numeric(8,4) not null default 1,
  started_at timestamptz,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(project_id, module_key)
);

create table if not exists public.module_snapshots (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  version_no integer not null,
  work_summary text not null,
  structured_progress_json jsonb not null default '{}'::jsonb,
  file_references jsonb not null default '[]'::jsonb,
  ai_summary text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(module_id, version_no)
);

create table if not exists public.freelancer_task_logs (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  time_spent_minutes integer not null check (time_spent_minutes >= 0),
  completion_percentage numeric(6,3) not null check (completion_percentage >= 0 and completion_percentage <= 1),
  ai_quality_score numeric(6,3) not null check (ai_quality_score >= 0 and ai_quality_score <= 1.5),
  penalties numeric(14,2) not null default 0,
  log_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.revenue_distribution (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid not null references public.users(id) on delete cascade,
  task_log_id uuid not null references public.freelancer_task_logs(id) on delete cascade,
  gross_amount numeric(14,2) not null,
  payout_amount numeric(14,2) not null,
  payout_status text not null default 'pending',
  payout_meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  balance numeric(14,2) not null default 0,
  currency text not null default 'INR',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.risk_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  risk_score numeric(6,3) not null,
  trigger_type text not null,
  details jsonb not null default '{}'::jsonb,
  action_taken text,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.airobuilder_sessions (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.project_modules(id) on delete cascade,
  freelancer_id uuid references public.users(id) on delete set null,
  external_session_id text not null,
  build_url text,
  deployment_url text,
  session_status public.session_status not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists idx_projects_status on public.projects(status) where deleted_at is null;
create index if not exists idx_users_specialty_tags on public.users using gin (specialty_tags) where deleted_at is null;
create index if not exists idx_users_reliability_score on public.users(reliability_score) where deleted_at is null;
create index if not exists idx_modules_status on public.project_modules(module_status) where deleted_at is null;
create index if not exists idx_modules_project on public.project_modules(project_id) where deleted_at is null;
create index if not exists idx_snapshots_module_created_at on public.module_snapshots(module_id, created_at desc) where deleted_at is null;
create index if not exists idx_task_logs_module_freelancer on public.freelancer_task_logs(module_id, freelancer_id) where deleted_at is null;

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.project_modules enable row level security;
alter table public.module_snapshots enable row level security;
alter table public.freelancer_task_logs enable row level security;
alter table public.revenue_distribution enable row level security;
alter table public.wallets enable row level security;
alter table public.risk_logs enable row level security;
alter table public.airobuilder_sessions enable row level security;
