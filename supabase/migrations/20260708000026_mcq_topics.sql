-- 026_mcq_topics.sql
-- Many-to-many mcq<->topic relationship layer (docs/MASTER_KB.md
-- "Architecture/database-schema.md" -> ## mcq_topics). Additive only --
-- does not touch mcqs.topic_id (the existing primary-topic FK) or any
-- retrieval/query logic in start_exam/getPracticeQuestions, which keep
-- filtering on mcqs.topic_id directly and are unchanged.
--
-- Deviations from the literal spec, resolved against this repo's actual
-- types:
--   - mcq_id/topic_id are `text` (not `uuid`) because public.mcqs.id and
--     public.topics.id are both `text` (same deviation 025_mcq_tagging.sql
--     already made for mcq_tags.mcq_id).
--   - relationship_type is a native enum (public.mcq_relationship_type),
--     matching this repo's closed-vocabulary convention (mcq_source_type,
--     mcq_verification_status, etc.) instead of a text+check column.
--   - Composite PK (mcq_id, topic_id, relationship_type): the same
--     mcq+topic pair can carry multiple relationship rows (e.g. a topic
--     can be both "primary" and "clinical_correlation" for one MCQ).

create type public.mcq_relationship_type as enum (
  'primary',
  'secondary',
  'prerequisite',
  'clinical_correlation'
);

create table public.mcq_topics (
  mcq_id text not null
    references public.mcqs(id)
    on delete cascade,

  topic_id text not null
    references public.topics(id)
    on delete restrict,

  relationship_type public.mcq_relationship_type not null,

  weight numeric,

  created_at timestamptz not null default now(),

  primary key (mcq_id, topic_id, relationship_type)
);

-- Spec-named indexing priority: reverse lookups ("all mcqs for a topic,
-- across primary/secondary/prerequisite/clinical_correlation links") need
-- this since the PK's leading column is mcq_id, not topic_id.
create index idx_mcq_topics_topic_mcq
on public.mcq_topics(topic_id, mcq_id);

-- Backfill: mcqs.topic_id is NOT NULL already (20260708000004_mcqs.sql),
-- so no null-filter is needed here -- every existing mcq gets exactly one
-- 'primary' relationship row mirroring its current topic_id. Idempotent
-- via ON CONFLICT against the 3-column PK; safe to re-run.
insert into public.mcq_topics (mcq_id, topic_id, relationship_type)
select id, topic_id, 'primary'
from public.mcqs
on conflict (mcq_id, topic_id, relationship_type) do nothing;

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.mcq_topics enable row level security;

-- Mirrors "students can read tags on published mcqs" (20260708000025):
-- students may see topic links for published mcqs only; reviewers/admins
-- see everything (including draft/review-stage mcqs).
create policy "students can read topics on published mcqs"
on public.mcq_topics for select
using (
  exists (
    select 1 from public.mcqs
    where mcqs.id = mcq_topics.mcq_id
    and mcqs.status = 'published'
  )
  or public.is_reviewer()
);

create policy "reviewers can insert mcq topics"
on public.mcq_topics for insert
to authenticated
with check (public.is_reviewer());

create policy "reviewers can update mcq topics"
on public.mcq_topics for update
to authenticated
using (public.is_reviewer())
with check (public.is_reviewer());

create policy "reviewers can delete mcq topics"
on public.mcq_topics for delete
to authenticated
using (public.is_reviewer());

-- ── Grants ───────────────────────────────────────────────────────
-- (schema usage already granted in 011_grants.sql)
grant all on public.mcq_topics to service_role;

grant select on public.mcq_topics to anon, authenticated;

-- Insert/update/delete granted to authenticated so PostgREST attempts the
-- request at all; is_reviewer() in the policies above is what actually
-- gates success. anon gets no write grant -- no column here is sensitive
-- the way mcqs.correct_answer is.
grant insert, update, delete on public.mcq_topics to authenticated;
