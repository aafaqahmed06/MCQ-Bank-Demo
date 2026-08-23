-- Presence signal for the admin user directory. Deliberately separate from
-- profiles.updated_at, which is bumped by ANY row update (avatar change,
-- admin role edit, etc.) and so isn't a clean "used the app recently" signal.
--
-- last_active_at is NOT added to the column-level UPDATE grant on profiles
-- (20260708000009_rls.sql grants authenticated UPDATE only on full_name,
-- avatar_url, college_id, program_id, academic_year_id) -- a client can never
-- set it directly, only via this security definer RPC, so the value is
-- always server-controlled (now()), never client-reported.
alter table public.profiles
  add column last_active_at timestamptz;

-- Throttled server-side: a no-op UPDATE whenever called inside the window,
-- regardless of how often a client calls it. This is the authoritative
-- throttle -- the client-side gate (lib/activity.ts) only exists to avoid
-- the network round trip, not to enforce the limit.
create or replace function public.touch_last_active()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set last_active_at = now()
  where id = auth.uid()
    and (last_active_at is null or last_active_at < now() - interval '5 minutes');
end;
$$;

grant execute on function public.touch_last_active() to authenticated;
