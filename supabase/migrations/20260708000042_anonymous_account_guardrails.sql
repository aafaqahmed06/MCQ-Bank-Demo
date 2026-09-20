-- 042_anonymous_account_guardrails.sql
-- Supabase's anonymous-auth docs warn that anonymous sessions get the
-- `authenticated` Postgres role, so every existing "to authenticated" policy
-- and RPC grant now also covers guest accounts (signInAnonymously(), added
-- for "Continue as guest"). Unlike a real signup, a guest account costs
-- nothing (no email, no confirmation wait) and can be recreated instantly.
--
-- This migration:
--   1. Adds is_anonymous_user(), mirroring is_admin()/is_reviewer(), backed
--      by the real auth.users.is_anonymous column (not a denormalized copy,
--      so it can never drift out of sync).
--   2. Excludes guest accounts from get_leaderboard() -- the Privacy Policy
--      promises leaderboard identities are real, signed-in users.
--   3. Gives guest accounts materially lower daily caps than permanent
--      accounts on start_exam / record_practice_attempt / question_reports,
--      since signInAnonymously() makes minting a fresh account (and thus a
--      fresh cap) free and instant -- something the existing caps assumed
--      required at least an email + CAPTCHA per account.
--   4. Hardens set_user_role() so an anonymous target can never be elevated
--      above 'student' (defense in depth against promoting a disposable,
--      unverifiable identity to reviewer/admin).

-- ── 1. Anonymity helper ─────────────────────────────────────────────
create or replace function public.is_anonymous_user(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select u.is_anonymous from auth.users u where u.id = p_user_id),
    false
  );
$$;

revoke execute on function public.is_anonymous_user(uuid) from public, anon;
grant execute on function public.is_anonymous_user(uuid) to authenticated;

-- ── 2. Leaderboard: exclude guests ──────────────────────────────────
create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  rank bigint,
  full_name text,
  college_short_name text,
  program_name text,
  exams_completed bigint,
  total_correct bigint,
  accuracy numeric(5,2)
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (
      order by sum(e.correct_count) desc,
               round((coalesce(sum(e.correct_count),0)::numeric / nullif(sum(e.total_questions),0)) * 100, 2) desc
    )::bigint as rank,
    p.full_name,
    c.short_name as college_short_name,
    pr.name as program_name,
    count(e.id)::bigint as exams_completed,
    coalesce(sum(e.correct_count),0)::bigint as total_correct,
    round((coalesce(sum(e.correct_count),0)::numeric / nullif(sum(e.total_questions),0)) * 100, 2) as accuracy
  from public.profiles p
  join public.exams e on e.user_id = p.id and e.status = 'submitted'
  left join public.colleges c on c.id = p.college_id
  left join public.programs pr on pr.id = p.program_id
  where p.role = 'student'
    and not public.is_anonymous_user(p.id)
  group by p.id, p.full_name, c.short_name, pr.name
  order by total_correct desc, accuracy desc
  limit least(greatest(p_limit, 1), 100);
$$;

-- ── 3a. start_exam: lower daily cap for guests ──────────────────────
create or replace function public.start_exam(
  p_topic_ids text[] default null,
  p_difficulty int[] default array[1,2,3],
  p_question_count int default 20,
  p_time_limit_seconds int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam_id uuid;
  v_count int;
  v_row record;
  v_question public.mcqs%rowtype;
  v_topic_name text;
  v_opts_orig text[];
  v_indices int[];
  v_opt text[];
  v_k int;
  v_j int;
  v_tmp int;
  v_order int := 0;
  v_payload jsonb := '[]'::jsonb;
  v_started_today int;
  v_daily_cap int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_question_count is null or p_question_count <= 0 then
    raise exception 'Invalid question count';
  end if;

  -- Abandon any of this user's in_progress exams that have already timed out.
  update public.exams
     set status = 'abandoned'
   where user_id = v_user
     and status = 'in_progress'
     and time_limit_seconds is not null
     and started_at + make_interval(secs => time_limit_seconds) < now();

  -- Daily cap: prevent leaderboard flooding via unlimited exam starts.
  -- Guests get a lower cap since signInAnonymously() makes a fresh account
  -- (and thus a fresh cap) free and instant.
  v_daily_cap := case when public.is_anonymous_user(v_user) then 5 else 30 end;

  select count(*)
    into v_started_today
    from public.exams
   where user_id = v_user
     and created_at >= date_trunc('day', now());

  if v_started_today >= v_daily_cap then
    raise exception 'Daily exam start limit reached (%).', v_daily_cap;
  end if;

  select count(*)
    into v_count
    from public.mcqs q
   where q.status = 'published'
     and q.difficulty = any(p_difficulty)
     and (p_topic_ids is null or cardinality(p_topic_ids) = 0 or q.topic_id = any(p_topic_ids));

  if v_count = 0 then
    raise exception 'No published questions match the requested criteria';
  end if;

  v_count := least(v_count, p_question_count);

  insert into public.exams (user_id, title, status, total_questions, time_limit_seconds)
  values (v_user, 'Exam Simulation', 'in_progress', v_count, p_time_limit_seconds)
  returning id into v_exam_id;

  for v_row in
    select q.id, q.topic_id
      from public.mcqs q
     where q.status = 'published'
       and q.difficulty = any(p_difficulty)
       and (p_topic_ids is null or cardinality(p_topic_ids) = 0 or q.topic_id = any(p_topic_ids))
     order by random()
     limit v_count
  loop
    select * into v_question from public.mcqs where id = v_row.id;

    select t.name into v_topic_name
      from public.topics t
     where t.id = v_row.topic_id;

    v_opts_orig := array(
      select vv from jsonb_array_elements_text(v_question.options) vv
    );

    v_indices := array(select generate_subscripts(v_opts_orig, 1));

    -- Fisher-Yates over 1-based positions
    for v_k in reverse array_length(v_indices, 1) .. 2 loop
      v_j := 1 + floor(random() * v_k)::int;
      v_tmp := v_indices[v_k];
      v_indices[v_k] := v_indices[v_j];
      v_indices[v_j] := v_tmp;
    end loop;

    v_opt := array[]::text[];
    for v_k in 1..array_length(v_indices, 1) loop
      v_opt := v_opt || v_opts_orig[v_indices[v_k]];
    end loop;

    insert into public.exam_questions
      (exam_id, mcq_id, question_order, options_order, correct_answer_in_order)
    values (
      v_exam_id,
      v_question.id,
      v_order,
      to_jsonb(v_indices),
      array_position(v_indices, v_question.correct_answer + 1) - 1
    );

    v_payload := v_payload || jsonb_build_object(
      'mcq_id', v_question.id,
      'question', v_question.question,
      'options', to_jsonb(v_opt),
      'topic', v_topic_name,
      'question_order', v_order
    );
    v_order := v_order + 1;
  end loop;

  return jsonb_build_object('exam_id', v_exam_id, 'questions', v_payload);
end;
$$;

-- ── 3b. record_practice_attempt: lower daily cap for guests ─────────
create or replace function public.record_practice_attempt(
  p_mcq_id text,
  p_selected_option_index smallint,
  p_response_time_ms integer default null,
  p_session_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_topic_id text;
  v_correct_answer smallint;
  v_is_correct boolean;
  v_attempt_id uuid;
  v_attempts_today int;
  v_daily_cap int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_selected_option_index is null or p_selected_option_index < 0 then
    raise exception 'Invalid selected option';
  end if;

  -- Daily cap: generous for real studying, not enough to meaningfully game
  -- topic-weakness/leaderboard-adjacent signal via scripted attempts. Guests
  -- get a lower cap for the same reason as start_exam above.
  v_daily_cap := case when public.is_anonymous_user(v_user) then 40 else 200 end;

  select count(*)
    into v_attempts_today
    from public.practice_attempts
   where user_id = v_user
     and attempted_at >= date_trunc('day', now());

  if v_attempts_today >= v_daily_cap then
    raise exception 'Daily practice attempt limit reached (%).', v_daily_cap;
  end if;

  select topic_id, correct_answer
    into v_topic_id, v_correct_answer
    from public.mcqs
   where id = p_mcq_id
     and status = 'published';

  if not found then
    raise exception 'MCQ not found or not published';
  end if;

  -- is_correct is always derived here, server-side, from mcqs.correct_answer
  -- -- the client only ever supplies which option it picked.
  v_is_correct := (p_selected_option_index = v_correct_answer);

  insert into public.practice_attempts
    (user_id, mcq_id, topic_id, selected_option_index, is_correct, response_time_ms, session_id)
  values
    (v_user, p_mcq_id, v_topic_id, p_selected_option_index, v_is_correct, p_response_time_ms, p_session_id)
  returning id into v_attempt_id;

  insert into public.user_topic_progress
    (user_id, topic_id, practice_questions_attempted, practice_questions_correct, practice_accuracy, practice_last_attempted_at, updated_at)
  values (
    v_user, v_topic_id, 1, case when v_is_correct then 1 else 0 end,
    case when v_is_correct then 100 else 0 end,
    now(), now()
  )
  on conflict (user_id, topic_id) do update
    set practice_questions_attempted = user_topic_progress.practice_questions_attempted + 1,
        practice_questions_correct   = user_topic_progress.practice_questions_correct
          + (case when v_is_correct then 1 else 0 end),
        practice_accuracy = round((
          (user_topic_progress.practice_questions_correct + (case when v_is_correct then 1 else 0 end))::numeric
          / nullif(user_topic_progress.practice_questions_attempted + 1, 0)
        ) * 100, 2),
        practice_last_attempted_at = now(),
        updated_at = now();

  return jsonb_build_object('attempt_id', v_attempt_id, 'is_correct', v_is_correct);
end;
$$;

-- ── 3c. question_reports daily cap: lower cap for guests ────────────
-- Trigger `trg_question_reports_daily_cap` (20260708000041) already points
-- at this function by name; CREATE OR REPLACE is enough, no re-create needed.
create or replace function public.enforce_question_report_daily_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reports_today int;
  v_daily_cap int;
begin
  v_daily_cap := case when public.is_anonymous_user(new.user_id) then 3 else 20 end;

  select count(*)
    into v_reports_today
    from public.question_reports
   where user_id = new.user_id
     and created_at >= date_trunc('day', now());

  if v_reports_today >= v_daily_cap then
    raise exception 'Daily report limit reached (%).', v_daily_cap;
  end if;

  return new;
end;
$$;

-- ── 4. Harden set_user_role against elevating guest accounts ────────
create or replace function public.set_user_role(p_target uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  if p_role = 'super_admin'
     and not (select role = 'super_admin' from public.profiles where id = auth.uid()) then
    raise exception 'Only super admins may grant super_admin';
  end if;

  if p_role <> 'student' and public.is_anonymous_user(p_target) then
    raise exception 'Cannot grant an elevated role to a guest (anonymous) account.';
  end if;

  update public.profiles
     set role = p_role,
         updated_at = now()
   where id = p_target;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;
