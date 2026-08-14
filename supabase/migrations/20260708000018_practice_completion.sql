-- 018_practice_completion.sql
-- Track when a student finishes a topic-group practice session.
--
-- Adds a boolean `completed` flag (and timestamp) to user_topic_progress,
-- independent of the exam-derived accuracy stats already written by
-- submit_exam(). Writes go through a server-side (SECURITY DEFINER) function so
-- a student can only flag their OWN rows and never forge another user's
-- progress. There is still NO direct INSERT/UPDATE policy for students on
-- this table (see 009).

alter table public.user_topic_progress
  add column if not exists completed boolean not null default false,
  add column if not exists completed_at timestamptz;

create or replace function public.record_practice_completion(p_topic_ids text[])
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

  if p_topic_ids is null or cardinality(p_topic_ids) = 0 then
    return;
  end if;

  foreach v_id in array p_topic_ids loop
    if v_id is null or v_id = '' then
      continue;
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

-- Only authenticated users may invoke the function; never anon / public.
revoke execute on function public.record_practice_completion(text[]) from public, anon;
grant execute on function public.record_practice_completion(text[]) to authenticated;
