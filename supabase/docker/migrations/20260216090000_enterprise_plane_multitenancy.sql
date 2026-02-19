begin;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

insert into public.organizations (id, name)
select oc.org_id, ('Org ' || left(oc.org_id::text, 8))
from public.organization_credits oc
where not exists (
  select 1 from public.organizations o where o.id = oc.org_id
);

do $$
declare
  default_org uuid;
begin
  select id into default_org from public.organizations order by created_at asc limit 1;
  if default_org is null then
    insert into public.organizations (name) values ('Default Organization') returning id into default_org;
  end if;
end $$;

alter table public.organization_members
  add column if not exists user_id uuid references auth.users(id),
  add column if not exists org_id uuid references public.organizations(id);

alter table public.organization_members
  drop constraint if exists organization_members_role_check;

alter table public.organization_members
  add constraint organization_members_role_check
  check (
    role in (
      'system_admin',
      'infra_manager',
      'enterprise_admin',
      'enterprise_user',
      'owner',
      'admin',
      'manager',
      'developer',
      'analyst',
      'viewer'
    )
  );

update public.organization_members
set org_id = (select id from public.organizations order by created_at asc limit 1)
where org_id is null;

update public.organization_members m
set user_id = u.id
from auth.users u
where m.user_id is null
  and m.email = u.email;

alter table public.services
  add column if not exists org_id uuid references public.organizations(id);

update public.services
set org_id = (select id from public.organizations order by created_at asc limit 1)
where org_id is null;

alter table public.services
  alter column org_id set not null;

create index if not exists idx_services_org_id on public.services(org_id);

alter table public.deployed_instances
  add column if not exists org_id uuid references public.organizations(id);

update public.deployed_instances di
set org_id = coalesce(
  (
    select m.org_id
    from public.organization_members m
    where m.user_id = di.owner_id
    limit 1
  ),
  (select id from public.organizations order by created_at asc limit 1)
)
where di.org_id is null;

alter table public.deployed_instances
  alter column org_id set not null;

create index if not exists idx_deployed_instances_org_id on public.deployed_instances(org_id);

drop policy if exists "Allow read for all authenticated" on public.services;
drop policy if exists "Allow insert/update for devs and above" on public.services;
drop policy if exists "Allow update for devs and above" on public.services;
drop policy if exists "Allow delete for admins and above" on public.services;

create policy "Org members can view services"
on public.services
for select
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = services.org_id
  )
);

create policy "Org admins can insert services"
on public.services
for insert
to authenticated
with check (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = services.org_id
      and m.role in ('enterprise_admin', 'owner', 'admin', 'manager', 'developer')
  )
);

create policy "Org admins can update services"
on public.services
for update
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = services.org_id
      and m.role in ('enterprise_admin', 'owner', 'admin', 'manager', 'developer')
  )
)
with check (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = services.org_id
      and m.role in ('enterprise_admin', 'owner', 'admin', 'manager', 'developer')
  )
);

create policy "Org admins can delete services"
on public.services
for delete
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = services.org_id
      and m.role in ('enterprise_admin', 'owner', 'admin')
  )
);

drop policy if exists "Allow read for owner and admins" on public.deployed_instances;
drop policy if exists "Allow insert for authenticated users" on public.deployed_instances;

create policy "Org members can view routers"
on public.deployed_instances
for select
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = deployed_instances.org_id
  )
);

create policy "Org admins can insert routers"
on public.deployed_instances
for insert
to authenticated
with check (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members m
    where m.user_id = auth.uid()
      and m.org_id = deployed_instances.org_id
      and m.role in ('enterprise_admin', 'owner', 'admin', 'manager', 'developer')
  )
);

create policy "Org members can view usage events"
on public.instance_usage_events
for select
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.deployed_instances di
    join public.organization_members m on m.org_id = di.org_id
    where di.id = instance_usage_events.instance_id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "Allow read for all authenticated" on public.organization_members;
drop policy if exists "Allow full access for system admin" on public.organization_members;
drop policy if exists "Allow management for owner" on public.organization_members;
drop policy if exists "Allow management for admin" on public.organization_members;

create policy "Org members can view members"
on public.organization_members
for select
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members self
    where self.user_id = auth.uid()
      and self.org_id = organization_members.org_id
  )
);

create policy "Org admins can manage members"
on public.organization_members
for all
to authenticated
using (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members self
    where self.user_id = auth.uid()
      and self.org_id = organization_members.org_id
      and self.role in ('enterprise_admin', 'owner', 'admin')
  )
)
with check (
  public.get_current_user_role() = 'system_admin'
  or exists (
    select 1
    from public.organization_members self
    where self.user_id = auth.uid()
      and self.org_id = organization_members.org_id
      and self.role in ('enterprise_admin', 'owner', 'admin')
  )
);

drop policy if exists "Allow write for devs and above" on public.logs;
create policy "Allow write for org admins and devs"
on public.logs
for insert
to authenticated
with check (
  public.get_current_user_role() in (
    'system_admin',
    'infra_manager',
    'enterprise_admin',
    'owner',
    'admin',
    'manager',
    'developer'
  )
);

drop policy if exists "Allow read for managers and above" on public.hosting_providers;
drop policy if exists "Allow write for system admin" on public.hosting_providers;
create policy "Allow read for infra roles" on public.hosting_providers
for select
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'));
create policy "Allow write for infra roles" on public.hosting_providers
for all
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'))
with check (public.get_current_user_role() in ('system_admin', 'infra_manager'));

drop policy if exists "Allow read for managers and above" on public.provider_credentials;
drop policy if exists "Allow write for system admin" on public.provider_credentials;
create policy "Allow read for infra roles" on public.provider_credentials
for select
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'));
create policy "Allow write for infra roles" on public.provider_credentials
for all
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'))
with check (public.get_current_user_role() in ('system_admin', 'infra_manager'));

drop policy if exists "Allow read for managers and above" on public.compute_nodes;
drop policy if exists "Allow write for system admin" on public.compute_nodes;
create policy "Allow read for infra roles" on public.compute_nodes
for select
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'));
create policy "Allow write for infra roles" on public.compute_nodes
for all
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'))
with check (public.get_current_user_role() in ('system_admin', 'infra_manager'));

drop policy if exists "Allow read for all authenticated" on public.health_checks;
drop policy if exists "Allow write for system admin" on public.health_checks;
create policy "Allow read for infra roles" on public.health_checks
for select
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'));
create policy "Allow write for infra roles" on public.health_checks
for all
to authenticated
using (public.get_current_user_role() in ('system_admin', 'infra_manager'))
with check (public.get_current_user_role() in ('system_admin', 'infra_manager'));

commit;
