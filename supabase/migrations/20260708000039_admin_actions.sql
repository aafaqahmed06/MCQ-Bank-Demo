-- 039_admin_actions.sql
-- Immutable audit trail for irreversible admin actions on user accounts.
-- Starting with account deletion; `action` is free text so future admin
-- actions (e.g. role changes, suspensions) can reuse this table.

create table public.admin_actions (
  id uuid primary key default gen_random_uuid(),
  -- No FK to auth.users on admin_id/target_user_id, deliberately: this row
  -- must survive the very deletion it records, and must not vanish if the
  -- acting admin's account is later deleted. target_email is captured here
  -- because target_user_id becomes an orphaned id once the auth row is gone.
  admin_id uuid not null,
  action text not null,
  target_user_id uuid not null,
  target_email text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index admin_actions_created_at_idx on public.admin_actions (created_at desc);

alter table public.admin_actions enable row level security;

-- Read-only for admins (directory browsing / future audit-log UI). All
-- writes go through the service-role client from the delete-account server
-- action -- service_role bypasses RLS entirely, so no insert/update/delete
-- policy is granted to authenticated/anon here.
create policy "admins can read admin actions" on public.admin_actions
  for select to authenticated using (public.is_admin());

grant all on public.admin_actions to service_role;
grant select on public.admin_actions to authenticated;

-- ── Delete-account authorization guard ─────────────────────────
-- Cannot itself call auth.admin.deleteUser() (Postgres has no access to the
-- Auth Admin API) -- exists so the authorization decision (admin check,
-- self-deletion block, admin/super_admin role-tier rule) is re-validated in
-- the same trusted layer as every other write path in this app (mirrors
-- set_user_role's role-tier check in 010_functions.sql), independent of the
-- deleting Server Action's TypeScript. Raises on any violation; the Server
-- Action must call this via the CALLER's session client (not service-role)
-- before it ever touches the service-role client's deleteUser().
create or replace function public.assert_can_delete_user(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_caller_role public.user_role;
  v_target_role public.user_role;
begin
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  if p_target = v_caller then
    raise exception 'Cannot delete your own account';
  end if;

  select role into v_caller_role from public.profiles where id = v_caller;
  select role into v_target_role from public.profiles where id = p_target;
  if not found then
    raise exception 'Target profile not found';
  end if;

  if v_target_role in ('admin', 'super_admin') and v_caller_role <> 'super_admin' then
    raise exception 'Only super admins may delete admin or super_admin accounts';
  end if;
end;
$$;

revoke execute on function public.assert_can_delete_user(uuid) from public, anon;
grant execute on function public.assert_can_delete_user(uuid) to authenticated;
