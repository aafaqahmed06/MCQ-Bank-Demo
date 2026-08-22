-- 030_smart_practice.sql
-- Cross-topic "Smart Practice" retrieval (docs/MASTER_KB.md "Question
-- retrieval engine" + "Weakness Detection" + "Adaptive Practice" sections).
-- Entirely new and separate from start_exam()/submit_exam() -- exam mode is
-- not touched by this migration in any way.
--
-- Topic-level weakness is computed by aggregating this user's raw
-- practice_attempts (029) AND exam_answers history directly, NOT by reading
-- user_topic_progress (neither its original exam-sourced columns nor the
-- practice_* display-cache columns added in 029). This keeps a student who
-- mainly takes exams and rarely practices correctly weighted toward their
-- real weak topics, and keeps one source of truth for ranking instead of
-- two aggregates that can drift out of sync.
--
-- One weighting formula (error_rate x recency_weight, "start simple" per
-- MASTER_KB's Weakness Detection section) is shared across both the
-- per-topic allocation and the per-question pick within each chosen topic,
-- via the private _question_weakness_weight() helper below -- one legible
-- model, two aggregation levels, matching MASTER_KB's Adaptive Practice
-- requirement to "never make the adaptive algorithm opaque to the point
-- that it becomes impossible to debug" (p_debug surfaces the raw weights).
--
-- Constants (documented here; the TS mirror for within-topic reweighting
-- lives in lib/practiceRanking.ts -- the two runtimes can't literally share
-- code, so keep them in sync by review discipline):
--   R_MAX = 2.0        -- max recency multiplier once a miss is "overdue"
--   TAU_DAYS = 3.0      -- ramp time constant, in days
--   BASE_WEIGHT = 0.2   -- floor weight so a mastered question/topic is
--                          never fully excluded from the weighted draw
--   NOVELTY_BONUS = 1.0 -- fixed inclusion signal for zero-history items
--
-- Recency direction is deliberately "overdue" (weight grows the longer
-- it's been since a miss), not "reinforce-immediately" -- matches
-- MASTER_KB's separate "spacing weight" term and avoids re-drilling a
-- fresh mistake before it's had a chance to be forgotten.

create or replace function public._question_weakness_weight(
  p_attempts int,
  p_misses int,
  p_last_ts timestamptz,
  p_now timestamptz
)
returns numeric
language sql
stable
as $$
  select case
    when p_attempts is null or p_attempts = 0 then 0.2 + 1.0 -- BASE_WEIGHT + NOVELTY_BONUS
    else 0.2 + (
      (greatest(p_misses, 0)::numeric / p_attempts) *
      (1 + (2.0 - 1) * (1 - exp(
        - (extract(epoch from (p_now - p_last_ts)) / 86400.0) / 3.0
      )))
    )
  end;
$$;

-- Internal helper only -- called from get_smart_practice_questions
-- (SECURITY DEFINER, same owning role), never invoked directly by a client.
revoke execute on function public._question_weakness_weight(int, int, timestamptz, timestamptz) from public, anon, authenticated;

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

  -- Candidate pool: published mcqs in the requested difficulty range, each
  -- carrying this user's combined practice_attempts + exam_answers weight
  -- (read-only join into exam tables -- no exam schema/RPC changes).
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

  -- Per-topic weakness, from the SAME two raw attempt sources, grouped by
  -- topic instead of mcq -- one source of truth for both granularities.
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

  -- Spread guardrail: no topic may supply more than p_max_share_per_topic of
  -- the returned set, and at least p_min_topics distinct topics (or all
  -- available, if fewer) are always represented.
  v_cap := greatest(1, floor(p_max_share_per_topic * p_question_count)::int);
  v_min_topics := least(p_min_topics, v_total_topics);

  select sum(weight) into v_total_weight from tmp_topics;

  update tmp_topics
     set slot_count = least(v_cap, round(p_question_count * weight / v_total_weight)::int);

  select coalesce(sum(slot_count), 0) into v_total_assigned from tmp_topics;
  v_shortfall := p_question_count - v_total_assigned;

  -- Distribute any rounding/capping shortfall, highest-weight-under-cap
  -- first, until the requested count is reached or every topic is capped
  -- (a thin curriculum with very few topics may legitimately return fewer
  -- than p_question_count -- accepted rather than violating the cap).
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

  -- Enforce the minimum-distinct-topics floor by pulling one slot at a time
  -- from the topic currently holding the most, into the highest-weight
  -- zero-count topic, until the floor is met or no further topics exist.
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

  -- Within each topic, weighted-random pick of its allotted slot_count
  -- questions (Efraimidis-Spirakis idiom: order by power(random(), 1/weight)
  -- desc), reusing the exact per-question weights computed in tmp_pool --
  -- same engine Feature 1 (within-topic reweighting) uses in TypeScript.
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

  -- Final assembly: interleaved round-robin across topics (rank 1 from every
  -- topic first, weight-descending, then rank 2, ...) rather than emitting
  -- one topic's block at a time.
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

-- Answer keys (correct_answer/explanation) are returned directly, same
-- established practice-mode behavior as getPracticeQuestions (immediate
-- feedback) -- safe here because a SECURITY DEFINER function's table access
-- is governed by the function owner's privileges, not the caller's column
-- grants, the same mechanism start_exam() already relies on internally.
revoke execute on function public.get_smart_practice_questions(int, int[], numeric, int, boolean) from public, anon;
grant execute on function public.get_smart_practice_questions(int, int[], numeric, int, boolean) to authenticated;
