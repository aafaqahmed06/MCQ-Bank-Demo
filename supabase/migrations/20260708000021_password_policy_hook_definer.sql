-- 021_password_policy_hook_definer.sql
-- The before_user_created hook was failing for every valid signup with
-- "Error running hook URI: pg-functions://postgres/public/app_password_policy".
-- Supabase auth hooks execute the function through GoTrue; the canonical hook
-- pattern requires SECURITY DEFINER so the function runs as its owner (postgres)
-- regardless of the transaction's active role. Recreate as SECURITY DEFINER.

create or replace function public.app_password_policy(payload jsonb)
returns jsonb
language plpgsql
security definer
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