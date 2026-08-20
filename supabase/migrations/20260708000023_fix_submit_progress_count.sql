-- 023_fix_submit_progress_count.sql
-- Fix submit_exam: the progress loop ran
--   select distinct m.topic_id, ea.is_correct ... and upserted +1 per row.
-- `distinct (topic_id, is_correct)` collapses all-correct (or all-wrong)
-- questions under one topic, so a 20-question exam could record e.g. 19
-- questions_attempted when two questions shared a topic with one correctness.
-- Aggregate per topic_id with real question counts instead.

create or replace function public.submit_exam(p_exam_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_row record;
  v_mcq_id text;
  v_selected int;
  v_correct int;
  v_is_correct boolean;
  v_correct_count int := 0;
  v_total int;
  v_score numeric(5,2);
  v_accuracy numeric(5,2);
  v_now timestamptz := now();
  v_pr record;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_exam from public.exams where id = p_exam_id and user_id = v_user;
  if not found then
    raise exception 'Exam not found or access denied';
  end if;

  if v_exam.status <> 'in_progress' then
    raise exception 'Exam is not in progress';
  end if;

  if v_exam.time_limit_seconds is not null
     and v_exam.started_at + make_interval(secs => v_exam.time_limit_seconds) < v_now then
    update public.exams set status = 'abandoned', submitted_at = v_now where id = p_exam_id;
    raise exception 'Exam time limit exceeded';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'array' then
    raise exception 'Invalid answers payload';
  end if;

  for v_row in
    select (ans.value->>'mcq_id')::text as mcq_id,
           (ans.value->>'selected_answer')::text as selected_answer
      from jsonb_array_elements(p_answers) as ans(value)
  loop
    v_mcq_id := v_row.mcq_id;
    if v_mcq_id is null or v_mcq_id = '' then
      raise exception 'Answer missing mcq_id';
    end if;

    if v_row.selected_answer is null then
      v_selected := null;
    else
      v_selected := v_row.selected_answer::int;
    end if;

    if v_selected is not null and (v_selected < 0 or v_selected > 4) then
      raise exception 'Invalid selected_answer for %', v_mcq_id;
    end if;

    select eq.correct_answer_in_order
      into v_correct
      from public.exam_questions eq
     where eq.exam_id = p_exam_id and eq.mcq_id = v_mcq_id;
    if not found then
      raise exception 'MCQ % is not part of this exam', v_mcq_id;
    end if;

    v_is_correct := (v_selected is not null and v_selected = v_correct);
    if v_is_correct then
      v_correct_count := v_correct_count + 1;
    end if;

    insert into public.exam_answers (exam_id, mcq_id, selected_answer, is_correct, answered_at)
    values (p_exam_id, v_mcq_id, v_selected, v_is_correct, v_now)
    on conflict (exam_id, mcq_id) do update
      set selected_answer = excluded.selected_answer,
          is_correct = excluded.is_correct,
          answered_at = excluded.answered_at;
  end loop;

  v_total := v_exam.total_questions;
  v_accuracy := round((v_correct_count::numeric / nullif(v_total, 0)) * 100, 2);
  v_score := v_accuracy;

  update public.exams
     set status = 'submitted',
         correct_count = v_correct_count,
         score = v_score,
         submitted_at = v_now
   where id = p_exam_id;

  -- Update progress per topic (server-side only). Counts are per-question,
  -- aggregated by topic, so questions_attempted always matches the number of
  -- answered questions regardless of correct/incorrect distribution.
  for v_pr in
    select m.topic_id,
           count(*) as attempted,
           count(*) filter (where ea.is_correct) as correct
      from public.exam_answers ea
      join public.mcqs m on m.id = ea.mcq_id
     where ea.exam_id = p_exam_id
     group by m.topic_id
  loop
    insert into public.user_topic_progress
      (user_id, topic_id, questions_attempted, questions_correct, accuracy, last_attempted_at, updated_at)
    values (
      v_user, v_pr.topic_id,
      v_pr.attempted,
      v_pr.correct,
      case when v_pr.attempted > 0
           then round((v_pr.correct::numeric / v_pr.attempted) * 100, 2)
           else 0 end,
      v_now, v_now
    )
    on conflict (user_id, topic_id) do update
      set questions_attempted = user_topic_progress.questions_attempted + excluded.questions_attempted,
          questions_correct = user_topic_progress.questions_correct + excluded.questions_correct,
          accuracy = round((
            (user_topic_progress.questions_correct + excluded.questions_correct)::numeric
            / nullif(user_topic_progress.questions_attempted + excluded.questions_attempted, 0)
          ) * 100, 2),
          last_attempted_at = excluded.last_attempted_at,
          updated_at = now();
  end loop;

  return jsonb_build_object(
    'exam_id', p_exam_id,
    'total_questions', v_total,
    'correct_count', v_correct_count,
    'score', v_score,
    'accuracy', v_accuracy
  );
end;
$$;