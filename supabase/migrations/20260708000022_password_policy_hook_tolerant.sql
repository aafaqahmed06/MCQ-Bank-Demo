-- 023_password_policy_hook_tolerant.sql
-- Replace the diagnostic no-op with the real policy, made tolerant of the hook
-- payload shape. GoTrue runs its own checks (minimum_password_length +
-- password_requirements) before invoking this hook, so a plaintext password is
-- normally present under payload->>'password'. If for any reason it is absent
-- (e.g. a non-password signup path), we must NOT crash the request with a raised
-- exception wrapped as "Error running hook URI" — the platform's own rules still
-- apply. We therefore only enforce when we can actually read a plaintext
-- password, and reject otherwise-truthless weak values defensively.

create or replace function public.app_password_policy(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pw text := coalesce(payload->>'password', '');
begin
  if v_pw = '' then
    -- No plaintext password to inspect; do not block the request.
    return payload;
  end if;
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