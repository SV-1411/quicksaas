-- Helper functions (Optimized to prevent recursion)
create or replace function public.current_user_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where auth_user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.users where auth_user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_freelancer()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'freelancer', false);
$$;

create or replace function public.is_client()
returns boolean
language sql
stable
as $$
  select coalesce(public.current_user_role() = 'client', false);
$$;

-- users (profiles)
drop policy if exists "admin_all_users" on public.users;
create policy "admin_all_users" on public.users
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users_read_own_profile" on public.users;
create policy "users_read_own_profile" on public.users
for select using (auth_user_id = auth.uid() and deleted_at is null);

drop policy if exists "users_update_own_profile" on public.users;
create policy "users_update_own_profile" on public.users
for update using (auth_user_id = auth.uid() and deleted_at is null)
with check (auth_user_id = auth.uid());

-- projects
drop policy if exists "admin_all_projects" on public.projects;
create policy "admin_all_projects" on public.projects
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_own_projects" on public.projects;
create policy "clients_read_own_projects" on public.projects
for select using (client_id = public.current_user_id() and deleted_at is null);

drop policy if exists "clients_insert_own_projects" on public.projects;
create policy "clients_insert_own_projects" on public.projects
for insert with check (client_id = public.current_user_id());

drop policy if exists "clients_update_own_projects" on public.projects;
create policy "clients_update_own_projects" on public.projects
for update using (client_id = public.current_user_id()) with check (client_id = public.current_user_id());

-- project_intake
drop policy if exists "admin_all_project_intake" on public.project_intake;
create policy "admin_all_project_intake" on public.project_intake
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_own_project_intake" on public.project_intake;
create policy "clients_read_own_project_intake" on public.project_intake
for select using (
  exists (
    select 1 from public.projects p
    where p.id = project_intake.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

-- project_modules
drop policy if exists "admin_all_modules" on public.project_modules;
create policy "admin_all_modules" on public.project_modules
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_modules_of_own_projects" on public.project_modules;
create policy "clients_read_modules_of_own_projects" on public.project_modules
for select using (
  exists (
    select 1 from public.projects p
    where p.id = project_modules.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_read_assigned_modules" on public.project_modules;
create policy "freelancers_read_assigned_modules" on public.project_modules
for select using (assigned_freelancer_id = public.current_user_id() and deleted_at is null);

drop policy if exists "system_update_modules" on public.project_modules;
create policy "system_update_modules" on public.project_modules
for update using (
  public.current_user_role() in ('system','admin')
) with check (public.current_user_role() in ('system','admin'));

-- project_module_assignments
drop policy if exists "admin_all_module_assignments" on public.project_module_assignments;
create policy "admin_all_module_assignments" on public.project_module_assignments
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "freelancers_read_own_assignments" on public.project_module_assignments;
create policy "freelancers_read_own_assignments" on public.project_module_assignments
for select using (freelancer_id = public.current_user_id() and deleted_at is null);

-- freelancer_profiles
drop policy if exists "admin_all_freelancer_profiles" on public.freelancer_profiles;
create policy "admin_all_freelancer_profiles" on public.freelancer_profiles
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "freelancers_read_own_profile" on public.freelancer_profiles;
create policy "freelancers_read_own_profile" on public.freelancer_profiles
for select using (user_id = public.current_user_id() and deleted_at is null);

drop policy if exists "freelancers_upsert_own_profile" on public.freelancer_profiles;
create policy "freelancers_upsert_own_profile" on public.freelancer_profiles
for insert with check (user_id = public.current_user_id());

drop policy if exists "freelancers_update_own_profile" on public.freelancer_profiles;
create policy "freelancers_update_own_profile" on public.freelancer_profiles
for update using (user_id = public.current_user_id()) with check (user_id = public.current_user_id());

-- module_snapshots
drop policy if exists "admin_all_snapshots" on public.module_snapshots;
create policy "admin_all_snapshots" on public.module_snapshots
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_snapshots_without_freelancer_identity" on public.module_snapshots;
create policy "clients_read_snapshots_without_freelancer_identity" on public.module_snapshots
for select using (
  exists (
    select 1
    from public.project_modules pm
    join public.projects p on p.id = pm.project_id
    where pm.id = module_snapshots.module_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_read_own_module_snapshots" on public.module_snapshots;
create policy "freelancers_read_own_module_snapshots" on public.module_snapshots
for select using (
  exists (
    select 1 from public.project_modules pm
    where pm.id = module_snapshots.module_id
      and pm.assigned_freelancer_id = public.current_user_id()
      and pm.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_insert_own_module_snapshots" on public.module_snapshots;
create policy "freelancers_insert_own_module_snapshots" on public.module_snapshots
for insert with check (
  freelancer_id = public.current_user_id() and
  exists (
    select 1 from public.project_modules pm
    where pm.id = module_snapshots.module_id
      and pm.assigned_freelancer_id = public.current_user_id()
      and pm.deleted_at is null
  )
);

-- work_snapshots (shift check-in/out)
drop policy if exists "admin_all_work_snapshots" on public.work_snapshots;
create policy "admin_all_work_snapshots" on public.work_snapshots
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_work_snapshots_for_own_projects" on public.work_snapshots;
create policy "clients_read_work_snapshots_for_own_projects" on public.work_snapshots
for select using (
  exists (
    select 1
    from public.project_modules pm
    join public.projects p on p.id = pm.project_id
    where pm.id = work_snapshots.module_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_read_snapshots_for_assigned_modules" on public.work_snapshots;
create policy "freelancers_read_snapshots_for_assigned_modules" on public.work_snapshots
for select using (
  exists (
    select 1
    from public.project_module_assignments a
    where a.module_id = work_snapshots.module_id
      and a.freelancer_id = public.current_user_id()
      and a.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_insert_snapshots_for_assigned_modules" on public.work_snapshots;
create policy "freelancers_insert_snapshots_for_assigned_modules" on public.work_snapshots
for insert with check (
  exists (
    select 1
    from public.project_module_assignments a
    where a.module_id = work_snapshots.module_id
      and a.freelancer_id = public.current_user_id()
      and a.deleted_at is null
  )
);

-- progress_logs (client timeline)
drop policy if exists "admin_all_progress_logs" on public.progress_logs;
create policy "admin_all_progress_logs" on public.progress_logs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_progress_logs_for_own_projects" on public.progress_logs;
create policy "clients_read_progress_logs_for_own_projects" on public.progress_logs
for select using (
  exists (
    select 1 from public.projects p
    where p.id = progress_logs.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_insert_progress_logs_for_assigned_modules" on public.progress_logs;
create policy "freelancers_insert_progress_logs_for_assigned_modules" on public.progress_logs
for insert with check (
  exists (
    select 1
    from public.project_module_assignments a
    where a.module_id = progress_logs.module_id
      and a.freelancer_id = public.current_user_id()
      and a.deleted_at is null
  )
);

-- reassignment_events and payout_ledger are system/admin managed only
drop policy if exists "admin_all_reassignment_events" on public.reassignment_events;
create policy "admin_all_reassignment_events" on public.reassignment_events
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin_all_payout_ledger" on public.payout_ledger;
create policy "admin_all_payout_ledger" on public.payout_ledger
for all using (public.is_admin()) with check (public.is_admin());

-- freelancer_task_logs
drop policy if exists "admin_all_task_logs" on public.freelancer_task_logs;
create policy "admin_all_task_logs" on public.freelancer_task_logs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "freelancers_manage_own_logs" on public.freelancer_task_logs;
create policy "freelancers_manage_own_logs" on public.freelancer_task_logs
for all using (freelancer_id = public.current_user_id() and deleted_at is null)
with check (freelancer_id = public.current_user_id());

drop policy if exists "clients_read_project_logs_no_cross_freelancer" on public.freelancer_task_logs;
create policy "clients_read_project_logs_no_cross_freelancer" on public.freelancer_task_logs
for select using (
  exists (
    select 1
    from public.project_modules pm
    join public.projects p on p.id = pm.project_id
    where pm.id = freelancer_task_logs.module_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

-- revenue_distribution
drop policy if exists "admin_all_revenue_distribution" on public.revenue_distribution;
create policy "admin_all_revenue_distribution" on public.revenue_distribution
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "freelancers_read_own_distribution" on public.revenue_distribution;
create policy "freelancers_read_own_distribution" on public.revenue_distribution
for select using (freelancer_id = public.current_user_id() and deleted_at is null);

drop policy if exists "clients_read_distribution_for_own_projects" on public.revenue_distribution;
create policy "clients_read_distribution_for_own_projects" on public.revenue_distribution
for select using (
  exists (
    select 1 from public.projects p
    where p.id = revenue_distribution.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

-- wallets
drop policy if exists "admin_all_wallets" on public.wallets;
create policy "admin_all_wallets" on public.wallets
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "users_read_own_wallet" on public.wallets;
create policy "users_read_own_wallet" on public.wallets
for select using (user_id = public.current_user_id() and deleted_at is null);

drop policy if exists "system_update_wallets" on public.wallets;
create policy "system_update_wallets" on public.wallets
for update using (public.current_user_role() in ('system', 'admin'))
with check (public.current_user_role() in ('system', 'admin'));

-- risk_logs
drop policy if exists "admin_all_risk_logs" on public.risk_logs;
create policy "admin_all_risk_logs" on public.risk_logs
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_own_project_risk_logs" on public.risk_logs;
create policy "clients_read_own_project_risk_logs" on public.risk_logs
for select using (
  exists (
    select 1 from public.projects p
    where p.id = risk_logs.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

-- airobuilder_sessions
drop policy if exists "admin_all_airobuilder_sessions" on public.airobuilder_sessions;
create policy "admin_all_airobuilder_sessions" on public.airobuilder_sessions
for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "clients_read_session_for_own_projects" on public.airobuilder_sessions;
create policy "clients_read_session_for_own_projects" on public.airobuilder_sessions
for select using (
  exists (
    select 1
    from public.project_modules pm
    join public.projects p on p.id = pm.project_id
    where pm.id = airobuilder_sessions.module_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

drop policy if exists "freelancers_read_own_sessions" on public.airobuilder_sessions;
create policy "freelancers_read_own_sessions" on public.airobuilder_sessions
for select using (freelancer_id = public.current_user_id() and deleted_at is null);

drop policy if exists "system_manage_sessions" on public.airobuilder_sessions;
create policy "system_manage_sessions" on public.airobuilder_sessions
for all using (public.current_user_role() in ('system','admin'))
with check (public.current_user_role() in ('system','admin'));
