-- 010_functions.sql
-- Trusted server-side helpers and RPCs.
-- (is_admin / is_reviewer live in 009_rls.sql, where the policies need them.)

-- ── Admin: change a user's role (never client-editable) ───────
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

  update public.profiles
     set role = p_role,
         updated_at = now()
   where id = p_target;

  if not found then
    raise exception 'Profile not found';
  end if;
end;
$$;

-- ── Secure exam generation ─────────────────────────────────────
-- Selects ONLY published questions, shuffles their options, stores the
-- permutation server-side, and returns only id/question/options/order.
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
  v_opts_orig text[];
  v_indices int[];
  v_opt text[];
  v_k int;
  v_j int;
  v_tmp int;
  v_order int := 0;
  v_payload jsonb := '[]'::jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_question_count is null or p_question_count <= 0 then
    raise exception 'Invalid question count';
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
      'question_order', v_order
    );
    v_order := v_order + 1;
  end loop;

  return jsonb_build_object('exam_id', v_exam_id, 'questions', v_payload);
end;
$$;

-- ── Secure exam submission & grading (single atomic transaction) ──
create or replace function public.submit_exam(p_exam_id uuid, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_ans jsonb;
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

  for v_ans in select value from jsonb_array_elements(p_answers) loop
    v_mcq_id := v_ans.value->>'mcq_id';
    if v_mcq_id is null then
      raise exception 'Answer missing mcq_id';
    end if;

    if v_ans.value->>'selected_answer' is null then
      v_selected := null;
    else
      v_selected := (v_ans.value->>'selected_answer')::int;
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

  -- Update progress per topic (server-side only).
  for v_pr in
    select distinct m.topic_id, ea.is_correct
      from public.exam_answers ea
      join public.mcqs m on m.id = ea.mcq_id
     where ea.exam_id = p_exam_id
  loop
    insert into public.user_topic_progress
      (user_id, topic_id, questions_attempted, questions_correct, accuracy, last_attempted_at, updated_at)
    values (
      v_user, v_pr.topic_id,
      1,
      case when v_pr.is_correct then 1 else 0 end,
      case when v_pr.is_correct then 100 else 0 end,
      v_now, v_now
    )
    on conflict (user_id, topic_id) do update
      set questions_attempted = user_topic_progress.questions_attempted + 1,
          questions_correct = user_topic_progress.questions_correct + excluded.questions_correct,
          accuracy = round((
            (user_topic_progress.questions_correct + excluded.questions_correct)::numeric
            / nullif(user_topic_progress.questions_attempted + 1, 0)
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

-- ── Exam review (answer keys only AFTER submission) ────────────
create or replace function public.get_exam_review(p_exam_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam public.exams%rowtype;
  v_review jsonb := '[]'::jsonb;
  v_row record;
  v_ord int[];
  v_opts text[];
  v_tmp_opts text[];
  v_i int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_exam from public.exams where id = p_exam_id and user_id = v_user;
  if not found then
    raise exception 'Exam not found or access denied';
  end if;

  if v_exam.status <> 'submitted' then
    raise exception 'Exam has not been submitted';
  end if;

  for v_row in
    select q.id as mcq_id, q.question, q.options, q.explanation,
           eq.options_order, eq.correct_answer_in_order, eq.question_order,
           ea.selected_answer, ea.is_correct
      from public.exam_questions eq
      join public.mcqs q on q.id = eq.mcq_id
      left join public.exam_answers ea
        on ea.exam_id = eq.exam_id and ea.mcq_id = eq.mcq_id
     where eq.exam_id = p_exam_id
     order by eq.question_order
  loop
    v_opts := array(select vv from jsonb_array_elements_text(v_row.options) vv);

    if v_row.options_order is not null then
      v_ord := (select array(
        select (ee.value)::int from jsonb_array_elements(v_row.options_order) ee
      ));
      v_tmp_opts := array[]::text[];
      for v_i in 1..cardinality(v_ord) loop
        v_tmp_opts := v_tmp_opts || v_opts[v_ord[v_i]];
      end loop;
      v_opts := v_tmp_opts;
    end if;

    v_review := v_review || jsonb_build_object(
      'mcq_id', v_row.mcq_id,
      'question', v_row.question,
      'options', to_jsonb(v_opts),
      'selected_answer', v_row.selected_answer,
      'correct_answer', v_row.correct_answer_in_order,
      'is_correct', v_row.is_correct,
      'explanation', v_row.explanation,
      'question_order', v_row.question_order
    );
  end loop;

  return v_review;
end;
$$;

-- ── Leaderboard (aggregates only; no user_id, email, or answer rows) ──
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
  group by p.id, p.full_name, c.short_name, pr.name
  order by total_correct desc, accuracy desc
  limit p_limit;
$$;

-- ── Function privileges ────────────────────────────────────────
revoke execute on function public.start_exam(text[], int[], int, int) from public, anon;
revoke execute on function public.submit_exam(uuid, jsonb) from public, anon;
revoke execute on function public.get_exam_review(uuid) from public, anon;
revoke execute on function public.set_user_role(uuid, public.user_role) from public, anon;

grant execute on function public.start_exam(text[], int[], int, int) to authenticated;
grant execute on function public.submit_exam(uuid, jsonb) to authenticated;
grant execute on function public.get_exam_review(uuid) to authenticated;
grant execute on function public.set_user_role(uuid, public.user_role) to authenticated;
grant execute on function public.get_leaderboard(int) to authenticated;
