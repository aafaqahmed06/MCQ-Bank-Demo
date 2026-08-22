-- 033_smart_practice_eligibility.sql
-- Eligibility gate for Smart Practice. A student with zero recorded
-- attempts has error_rate = null for every topic and every question, so
-- _question_weakness_weight() falls back to the same flat
-- BASE_WEIGHT + NOVELTY_BONUS (1.2) for every candidate -- with every
-- topic tied, get_smart_practice_questions' spread/allocation logic
-- produces a near-uniform mix that looks personalized but isn't. This
-- migration requires SMART_PRACTICE_MIN_ATTEMPTS (default 25) combined
-- practice_attempts + exam_answers before Smart Practice is served,
-- enforced inside get_smart_practice_questions itself -- not just the UI --
-- with a structured {eligible, attempts, min_attempts} response instead of
-- a thrown error or a silent uniform fallback.

-- Shared combined-attempt count, factored out so
-- get_smart_practice_eligibility and get_smart_practice_questions don't
-- duplicate the same UNION -- same two sources the weighting formula
-- already reads (practice_attempts + exam_answers joined through exams for
-- ownership, is_correct is not null).
create or replace function public._user_combined_attempt_count(p_user uuid)
returns int
language sql
stable
as $$
  select count(*)::int
  from (
    select 1
    from public.practice_attempts pa
    where pa.user_id = p_user
    union all
    select 1
    from public.exam_answers ea
    join public.exams e on e.id = ea.exam_id
    where e.user_id = p_user
      and ea.is_correct is not null
  ) combined;
$$;

-- Internal helper only, same shape as _question_weakness_weight.
revoke execute on function public._user_combined_attempt_count(uuid) from public, anon, authenticated;

-- Lightweight eligibility check the UI calls up front (dashboard card,
-- Smart Practice select screen) to show a progress indicator without
-- paying for get_smart_practice_questions' candidate-pool construction.
create or replace function public.get_smart_practice_eligibility(
  p_min_attempts int default 25
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_attempts int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  v_attempts := public._user_combined_attempt_count(v_user);

  return jsonb_build_object(
    'eligible', v_attempts >= p_min_attempts,
    'attempts', v_attempts,
    'min_attempts', p_min_attempts
  );
end;
$$;

revoke execute on function public.get_smart_practice_eligibility(int) from public, anon;
grant execute on function public.get_smart_practice_eligibility(int) to authenticated;

-- get_smart_practice_questions gains p_min_attempts -- a new parameter, so
-- Postgres treats this as a different signature (functions are identified
-- by ordered parameter types); drop the old 5-arg version first, same
-- pattern 031_fix_smart_practice_weight_types.sql already used.
drop function if exists public.get_smart_practice_questions(int, int[], numeric, int, boolean);

create or replace function public.get_smart_practice_questions(
  p_question_count int default 20,
  p_difficulty int[] default array[1,2,3],
  p_max_share_per_topic numeric default 0.30,
  p_min_topics int default 5,
  p_min_attempts int default 25,
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
  v_total_attempts int;
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

  -- Eligibility gate: cheap short-circuit before any temp table is built.
  -- Returns a structured ineligible response, never a raw error and never
  -- a silent fallback to (uninformative, near-uniform) questions.
  v_total_attempts := public._user_combined_attempt_count(v_user);

  if v_total_attempts < p_min_attempts then
    return jsonb_build_object(
      'eligible', false,
      'attempts', v_total_attempts,
      'min_attempts', p_min_attempts,
      'questions', '[]'::jsonb,
      'topics_included', 0,
      'generated_at', v_now
    );
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
    'eligible', true,
    'attempts', v_total_attempts,
    'min_attempts', p_min_attempts,
    'questions', coalesce(v_questions, '[]'::jsonb),
    'topics_included', (
      select count(distinct topic_id) from tmp_ranked where rank_within_topic <= slot_count
    ),
    'generated_at', v_now
  );
end;
$$;

revoke execute on function public.get_smart_practice_questions(int, int[], numeric, int, int, boolean) from public, anon;
grant execute on function public.get_smart_practice_questions(int, int[], numeric, int, int, boolean) to authenticated;
