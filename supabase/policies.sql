-- Helper functions
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
as $$
  select role from public.users where auth_user_id = auth.uid() and deleted_at is null limit 1;
$$;

create or replace function public.current_user_id()
returns uuid
language sql
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

-- projects
create policy "admin_all_projects" on public.projects
for all using (public.is_admin()) with check (public.is_admin());

create policy "clients_read_own_projects" on public.projects
for select using (client_id = public.current_user_id() and deleted_at is null);

create policy "clients_insert_own_projects" on public.projects
for insert with check (client_id = public.current_user_id());

create policy "clients_update_own_projects" on public.projects
for update using (client_id = public.current_user_id()) with check (client_id = public.current_user_id());

-- project_modules
create policy "admin_all_modules" on public.project_modules
for all using (public.is_admin()) with check (public.is_admin());

create policy "clients_read_modules_of_own_projects" on public.project_modules
for select using (
  exists (
    select 1 from public.projects p
    where p.id = project_modules.project_id
      and p.client_id = public.current_user_id()
      and p.deleted_at is null
  ) and deleted_at is null
);

create policy "freelancers_read_assigned_modules" on public.project_modules
for select using (assigned_freelancer_id = public.current_user_id() and deleted_at is null);

create policy "system_update_modules" on public.project_modules
for update using (
  public.current_user_role() in ('system','admin')
) with check (public.current_user_role() in ('system','admin'));

-- module_snapshots
create policy "admin_all_snapshots" on public.module_snapshots
for all using (public.is_admin()) with check (public.is_admin());

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

create policy "freelancers_read_own_module_snapshots" on public.module_snapshots
for select using (
  exists (
    select 1 from public.project_modules pm
    where pm.id = module_snapshots.module_id
      and pm.assigned_freelancer_id = public.current_user_id()
      and pm.deleted_at is null
  ) and deleted_at is null
);

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

-- freelancer_task_logs
create policy "admin_all_task_logs" on public.freelancer_task_logs
for all using (public.is_admin()) with check (public.is_admin());

create policy "freelancers_manage_own_logs" on public.freelancer_task_logs
for all using (freelancer_id = public.current_user_id() and deleted_at is null)
with check (freelancer_id = public.current_user_id());

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
create policy "admin_all_revenue_distribution" on public.revenue_distribution
for all using (public.is_admin()) with check (public.is_admin());

create policy "freelancers_read_own_distribution" on public.revenue_distribution
for select using (freelancer_id = public.current_user_id() and deleted_at is null);

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
create policy "admin_all_wallets" on public.wallets
for all using (public.is_admin()) with check (public.is_admin());

create policy "users_read_own_wallet" on public.wallets
for select using (user_id = public.current_user_id() and deleted_at is null);

create policy "system_update_wallets" on public.wallets
for update using (public.current_user_role() in ('system', 'admin'))
with check (public.current_user_role() in ('system', 'admin'));

-- risk_logs
create policy "admin_all_risk_logs" on public.risk_logs
for all using (public.is_admin()) with check (public.is_admin());

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
create policy "admin_all_airobuilder_sessions" on public.airobuilder_sessions
for all using (public.is_admin()) with check (public.is_admin());

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

create policy "freelancers_read_own_sessions" on public.airobuilder_sessions
for select using (freelancer_id = public.current_user_id() and deleted_at is null);

create policy "system_manage_sessions" on public.airobuilder_sessions
for all using (public.current_user_role() in ('system','admin'))
with check (public.current_user_role() in ('system','admin'));
