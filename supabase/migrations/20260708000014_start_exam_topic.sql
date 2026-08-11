-- 014_start_exam_topic.sql
-- Include the (non-sensitive) topic name in start_exam's question payload so
-- the exam UI can keep showing the topic badge without exposing any key data.

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