-- 019_scope_practice_completion.sql
-- Narrow record_practice_completion so a student can only mark topics as
-- completed for the module they were actually practicing. Previously the RPC
-- accepted an arbitrary list of existing topic ids, letting a client mark any
-- topic across the curriculum complete.
--
-- The function now requires the originating module and rejects any topic id
-- that does not belong to it. (Within a module, completion of a topic a user
-- did not practice is still possible by replaying the RPC — this is a
-- self-service cosmetic flag on the user's own dashboard — but the cross-module
-- "mark anything" path is closed.)

-- Remove the old single-argument variant so the permissive signature cannot be
-- replayed to bypass the new module scoping.
drop function if exists public.record_practice_completion(text[]);

create or replace function public.record_practice_completion(
  p_module_id text,
  p_topic_ids text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_id text;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_module_id is null or p_module_id = '' then
    raise exception 'Module required';
  end if;

  if p_topic_ids is null or cardinality(p_topic_ids) = 0 then
    return;
  end if;

  foreach v_id in array p_topic_ids loop
    if v_id is null or v_id = '' then
      continue;
    end if;

    if not exists (
      select 1 from public.topics t
       where t.id = v_id and t.module_id = p_module_id
    ) then
      raise exception 'Topic % is not part of module %', v_id, p_module_id;
    end if;

    insert into public.user_topic_progress
      (user_id, topic_id, completed, completed_at, updated_at)
    values
      (v_user, v_id, true, now(), now())
    on conflict (user_id, topic_id) do update
      set completed = true,
          completed_at = excluded.completed_at,
          updated_at = now();
  end loop;
end;
$$;

revoke execute on function public.record_practice_completion(text, text[]) from public, anon;
grant execute on function public.record_practice_completion(text, text[]) to authenticated;