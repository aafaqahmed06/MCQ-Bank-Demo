-- 032_fix_smart_practice_bulk_update.sql
-- Bugfix: this project's Postgres role has an UPDATE-requires-WHERE
-- safeguard enabled (caught live by scripts/verify-phase8.ts Section I:
-- "UPDATE requires a WHERE clause"). get_smart_practice_questions' initial
-- per-topic slot_count assignment intentionally touches every row of the
-- temporary tmp_topics table and had no WHERE clause. Same signature as
-- 030 (create or replace, no drop needed) -- only that one statement
-- changes, from `where true` added.

create or replace function public.get_smart_practice_questions(
  p_question_count int default 20,
  p_difficulty int[] default array[1,2,3],
  p_max_share_per_topic numeric default 0.30,
  p_min_topics int default 5,
  p_debug boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_now timestamptz := now();
  v_total_topics int;
  v_cap int;
  v_min_topics int;
  v_total_weight numeric;
  v_total_assigned int;
  v_shortfall int;
  v_pick_topic text;
  v_donor_topic text;
  v_positive_count int;
  v_questions jsonb;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_question_count is null or p_question_count <= 0 then
    raise exception 'Invalid question count';
  end if;

  create temporary table tmp_pool on commit drop as
  select m.id as mcq_id, m.topic_id, m.question, m.options, m.correct_answer,
         m.explanation, m.difficulty,
         public._question_weakness_weight(s.attempts, s.misses, s.last_ts, v_now) as weight
  from public.mcqs m
  left join (
    select mcq_id,
           count(*) as attempts,
           count(*) filter (where not is_correct) as misses,
           max(ts) as last_ts
    from (
      select pa.mcq_id, pa.is_correct, pa.attempted_at as ts
      from public.practice_attempts pa
      where pa.user_id = v_user
      union all
      select ea.mcq_id, ea.is_correct, ea.answered_at as ts
      from public.exam_answers ea
      join public.exams e on e.id = ea.exam_id
      where e.user_id = v_user
        and ea.is_correct is not null
    ) combined
    group by mcq_id
  ) s on s.mcq_id = m.id
  where m.status = 'published'
    and m.difficulty = any(p_difficulty);

  if not exists (select 1 from tmp_pool) then
    raise exception 'No published questions match the requested criteria';
  end if;

  create temporary table tmp_topics on commit drop as
  select distinct tp.topic_id,
         public._question_weakness_weight(ts.attempts, ts.misses, ts.last_ts, v_now) as weight,
         0 as slot_count
  from tmp_pool tp
  left join (
    select topic_id,
           count(*) as attempts,
           count(*) filter (where not is_correct) as misses,
           max(ts) as last_ts
    from (
      select pa.topic_id, pa.is_correct, pa.attempted_at as ts
      from public.practice_attempts pa
      where pa.user_id = v_user
      union all
      select m2.topic_id, ea.is_correct, ea.answered_at as ts
      from public.exam_answers ea
      join public.exams e on e.id = ea.exam_id
      join public.mcqs m2 on m2.id = ea.mcq_id
      where e.user_id = v_user
        and ea.is_correct is not null
    ) combined
    group by topic_id
  ) ts on ts.topic_id = tp.topic_id;

  select count(*) into v_total_topics from tmp_topics;

  v_cap := greatest(1, floor(p_max_share_per_topic * p_question_count)::int);
  v_min_topics := least(p_min_topics, v_total_topics);

  select sum(weight) into v_total_weight from tmp_topics;

  update tmp_topics
     set slot_count = least(v_cap, round(p_question_count * weight / v_total_weight)::int)
   where true; -- intentional full-table update: every row gets an initial allocation

  select coalesce(sum(slot_count), 0) into v_total_assigned from tmp_topics;
  v_shortfall := p_question_count - v_total_assigned;

  while v_shortfall > 0 loop
    select topic_id into v_pick_topic
      from tmp_topics
     where slot_count < v_cap
     order by weight desc
     limit 1;
    exit when v_pick_topic is null;
    update tmp_topics set slot_count = slot_count + 1 where topic_id = v_pick_topic;
    v_shortfall := v_shortfall - 1;
  end loop;

  loop
    select count(*) into v_positive_count from tmp_topics where slot_count > 0;
    exit when v_positive_count >= v_min_topics;

    select topic_id into v_pick_topic
      from tmp_topics
     where slot_count = 0
     order by weight desc
     limit 1;
    exit when v_pick_topic is null;

    select topic_id into v_donor_topic
      from tmp_topics
     where slot_count > 1
     order by slot_count desc
     limit 1;
    exit when v_donor_topic is null;

    update tmp_topics set slot_count = slot_count - 1 where topic_id = v_donor_topic;
    update tmp_topics set slot_count = 1 where topic_id = v_pick_topic;
  end loop;

  create temporary table tmp_ranked on commit drop as
  select
    tp.mcq_id, tp.topic_id, tt.weight as topic_weight, tt.slot_count, tp.weight as question_weight,
    row_number() over (
      partition by tp.topic_id
      order by power(random(), 1.0 / greatest(tp.weight, 0.0001)) desc
    ) as rank_within_topic
  from tmp_pool tp
  join tmp_topics tt on tt.topic_id = tp.topic_id
  where tt.slot_count > 0;

  select jsonb_agg(
    (jsonb_build_object(
      'mcq_id', tp.mcq_id,
      'topic_id', tp.topic_id,
      'topic', t.name,
      'question', tp.question,
      'options', tp.options,
      'correct_answer', tp.correct_answer,
      'explanation', tp.explanation,
      'difficulty', tp.difficulty
    ) || case when p_debug then jsonb_build_object(
      'topic_weight', tr.topic_weight,
      'question_weight', tr.question_weight
    ) else '{}'::jsonb end)
    order by tr.rank_within_topic asc, tr.topic_weight desc
  )
  into v_questions
  from tmp_ranked tr
  join tmp_pool tp on tp.mcq_id = tr.mcq_id
  join public.topics t on t.id = tr.topic_id
  where tr.rank_within_topic <= tr.slot_count;

  return jsonb_build_object(
    'questions', coalesce(v_questions, '[]'::jsonb),
    'topics_included', (
      select count(distinct topic_id) from tmp_ranked where rank_within_topic <= slot_count
    ),
    'generated_at', v_now
  );
end;
$$;
