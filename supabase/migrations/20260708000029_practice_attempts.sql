-- 029_practice_attempts.sql
-- Practice-mode per-question attempt history (docs/MASTER_KB.md "Student
-- attempts" section) + additive practice-only progress columns on
-- user_topic_progress. Prerequisite for weighted practice retrieval
-- (within-topic reweighting) and Smart Practice (cross-topic retrieval) --
-- neither has any real signal to rank by without this: PracticeSession.tsx
-- has never persisted a per-question answer, only a session-end
-- record_practice_completion() boolean flag.
--
-- Exam mode (start_exam/submit_exam/exam_questions/exam_answers/
-- get_exam_review) is not touched by this migration in any way.
--
-- Deviations from the literal "attempts" spec, resolved against this repo's
-- actual types/conventions and explicit product scoping decisions:
--   - Table is named `practice_attempts`, not the spec's generic `attempts`,
--     and scoped to practice mode only. Exam-mode's `exam_answers` already
--     records per-question attempts for exams; unifying the two into one
--     table would mean touching exam-mode schema, which this feature must
--     not do.
--   - mcq_id/topic_id are `text` (not `uuid`) to match public.mcqs.id/
--     public.topics.id (same deviation every prior mcq-linked table has
--     made: mcq_tags, mcq_topics, verification_runs, mcq_sources).
--   - `topic_id` is denormalized off `mcqs.topic_id` at insert time (set by
--     record_practice_attempt() below, never supplied by the client) rather
--     than joined at read time -- topic-grouped weakness ranking is the
--     dominant read pattern for this table.
--   - No `updated_at`/update trigger -- append-only by design ("Keep
--     attempts append-oriented. Do not mutate historical answers" --
--     MASTER_KB).
--   - The new `practice_*` columns on user_topic_progress are a DISPLAY
--     CACHE ONLY (for a future practice-mode dashboard view), populated
--     exclusively by record_practice_attempt() below. They are never read
--     by any ranking/weighting logic -- Smart Practice's per-topic
--     weakness (a later migration) aggregates practice_attempts +
--     exam_answers directly instead, so a student who mostly takes exams
--     and rarely practices still gets accurate topic weighting. The
--     original exam-sourced columns (questions_attempted, questions_correct,
--     accuracy, last_attempted_at) are completely untouched by this
--     migration -- submit_exam() remains their only writer.

create table public.practice_attempts (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  mcq_id text not null
    references public.mcqs(id)
    on delete restrict,

  topic_id text not null
    references public.topics(id)
    on delete cascade,

  selected_option_index smallint not null
    check (selected_option_index >= 0),

  is_correct boolean not null,

  response_time_ms integer
    check (response_time_ms is null or response_time_ms >= 0),

  session_id uuid,

  attempted_at timestamptz not null default now()
);

-- MASTER_KB "Indexing priorities": attempts(user_id, attempted_at desc),
-- attempts(user_id, mcq_id). Plus a topic-scoped index for the Smart
-- Practice per-topic aggregation (next migration).
create index idx_practice_attempts_user_attempted
on public.practice_attempts(user_id, attempted_at desc);

create index idx_practice_attempts_user_mcq
on public.practice_attempts(user_id, mcq_id);

create index idx_practice_attempts_user_topic
on public.practice_attempts(user_id, topic_id, attempted_at desc);

alter table public.user_topic_progress
  add column practice_questions_attempted integer not null default 0,
  add column practice_questions_correct integer not null default 0,
  add column practice_accuracy numeric(5,2) not null default 0,
  add column practice_last_attempted_at timestamptz;

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.practice_attempts enable row level security;

-- Owner-only read -- personal attempt history, not shared content (unlike
-- mcq_tags/mcq_topics' public-read shape).
create policy "users can read own practice attempts"
on public.practice_attempts for select
to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policy for anon/authenticated at all: every write
-- goes through record_practice_attempt() below (SECURITY DEFINER, bypasses
-- RLS). is_correct must never be client-writable -- a client-supplied
-- is_correct would let a student fabricate topic weakness data that Smart
-- Practice's weighting reads directly.

-- ── Grants ───────────────────────────────────────────────────────
-- (schema usage already granted in 011_grants.sql)
grant all on public.practice_attempts to service_role;

-- authenticated gets a SELECT grant so PostgREST attempts the request at
-- all; the RLS policy above is what actually limits rows to their owner.
-- anon gets no grant -- mirrors verification_runs/user_topic_progress.
grant select on public.practice_attempts to authenticated;

-- ── RPC: record one practice attempt + update the practice-only progress
-- cache, in one transaction ─────────────────────────────────────────────
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
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_selected_option_index is null or p_selected_option_index < 0 then
    raise exception 'Invalid selected option';
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

revoke execute on function public.record_practice_attempt(text, smallint, integer, uuid) from public, anon;
grant execute on function public.record_practice_attempt(text, smallint, integer, uuid) to authenticated;
