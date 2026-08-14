-- 020_password_policy_hook.sql
-- Enforce a stronger password policy at the source (GoTrue), not just the UI.
--
-- This creates a `before_user_created` auth-hook function. Signups hit GoTrue
-- directly (not this repo's UI), so front-end checks can be bypassed. The hook
-- rejects weak passwords before a user is created.
--
-- ENABLING (one-time, in the Supabase dashboard, not possible via a migration):
--   Authentication -> Hooks -> before_user_created -> enable
--   URI: pg-functions://postgres/public/app_password_policy
-- (Or, if you later manage the project via `supabase config push`, mirror this
-- under [auth.hook.before_user_created] in config.toml. Do NOT push the current
-- config.toml to production — its site_url points at localhost.)
--
-- The hook payload for `before_user_created` includes the plaintext password
-- under the `password` key. We reject it here before hashing.
create or replace function public.app_password_policy(payload jsonb)
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  v_pw text := coalesce(payload->>'password', '');
begin
  if length(v_pw) < 10 then
    raise exception 'Password must be at least 10 characters long';
  end if;
  if v_pw !~ '[A-Za-z]' or v_pw !~ '[0-9]' then
    raise exception 'Password must include both letters and numbers';
  end if;
  return payload;
end;
$$;

revoke execute on function public.app_password_policy(jsonb) from public, anon;
grant execute on function public.app_password_policy(jsonb) to supabase_auth_admin;
