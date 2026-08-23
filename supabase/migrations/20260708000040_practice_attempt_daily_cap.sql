-- 040_practice_attempt_daily_cap.sql
-- Public-launch abuse guard: cap practice-mode attempts per user per UTC
-- day, mirroring start_exam's daily-cap pattern (20260708000017_ops_hardening.sql)
-- -- unlimited record_practice_attempt calls could otherwise be scripted to
-- fabricate topic-weakness/progress signal at no cost. Same architecture as
-- 20260708000029_practice_attempts.sql's function, just with a count check
-- added before the insert; signature and grants are unchanged.

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
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_selected_option_index is null or p_selected_option_index < 0 then
    raise exception 'Invalid selected option';
  end if;

  -- Daily cap: generous for real studying, not enough to meaningfully game
  -- topic-weakness/leaderboard-adjacent signal via scripted attempts.
  select count(*)
    into v_attempts_today
    from public.practice_attempts
   where user_id = v_user
     and attempted_at >= date_trunc('day', now());

  if v_attempts_today >= 200 then
    raise exception 'Daily practice attempt limit reached (200).';
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
