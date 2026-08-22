-- 028_mcq_sources_and_generation_jobs.sql
-- Provenance + import-audit tables (docs/MASTER_KB.md "Architecture/
-- database-schema.md" -> ## Provenance, ## Generation jobs). Additive only --
-- does not touch mcqs.source or any retrieval/query logic.
--
-- Deviations from the literal spec, resolved against this repo's actual
-- types/conventions and explicit product scoping decisions:
--   - mcq_sources.mcq_id is `text` (not `uuid`) because public.mcqs.id is
--     `text` (same deviation 025_mcq_tagging.sql/026_mcq_topics.sql already
--     made).
--   - mcq_sources omits `source_document_id` from the literal spec: no
--     `source_documents` table exists anywhere in this schema. Adding a
--     dangling nullable uuid column with nothing to reference it would be
--     dead weight; re-add it in a follow-up migration if/when a source
--     document registry is actually built.
--   - mcq_sources.mcq_id uses `on delete cascade` (not verification_runs'
--     `on delete set null`): a source-locator row is metadata *about* a
--     specific mcq, not independent audit history -- if the mcq is gone the
--     record has no remaining purpose. Matches mcq_tags/mcq_topics' cascade
--     pattern on mcq_id.
--   - Both new tables get `created_at timestamptz not null default now()`,
--     which the literal spec doesn't list, matching every other table in
--     this repo (mcq_tags, mcq_topics, verification_runs, ...).
--   - generation_jobs is deliberately scoped NARROWER than the literal spec:
--     this repo's scripts/seed-mcqs.ts is a *data import* script, not the AI
--     generation pipeline (that pipeline runs entirely outside this app, in
--     a separate process, and is not implemented here). The literal spec's
--     `model`, `prompt_version`, `input_manifest`, and `output_manifest`
--     columns describe that external pipeline's own tracking and are
--     intentionally omitted -- adding them here would imply this app
--     owns/observes a process it doesn't. In their place, generation_jobs
--     carries a single `manifest jsonb` column recording which mcqs were
--     imported/upserted in that run (count + ids) -- an import log, not a
--     generation-process record.
--   - generation_jobs.status is a native enum (public.generation_job_status),
--     matching this repo's closed-vocabulary convention (mcq_source_type,
--     mcq_verification_status, mcq_relationship_type, verification_verdict)
--     instead of a bare text column. Only running/succeeded/failed exist --
--     the script runs synchronously with no queue, so no pending/cancelled.
--   - Both tables follow the verification_runs (027) RLS/grant shape
--     exactly: reviewer/admin-only SELECT, no anon grant at all, no
--     INSERT/UPDATE/DELETE policies for anon/authenticated. All writes are
--     service_role-only -- scripts/seed-mcqs.ts already uses a service_role
--     client, so no RPC is needed or added for either table; service_role
--     bypasses RLS entirely.

create type public.generation_job_status as enum (
  'running',
  'succeeded',
  'failed'
);

create table public.generation_jobs (
  id uuid primary key default gen_random_uuid(),

  status public.generation_job_status not null default 'running',

  manifest jsonb,

  started_at timestamptz not null default now(),

  completed_at timestamptz,

  error jsonb,

  created_at timestamptz not null default now()
);

-- No extra index beyond the PK: a small, low-cardinality operational log
-- (one row per seed invocation) with no documented "recent jobs" or "jobs
-- by status" read pattern yet. Add one later if an admin dashboard needs it.

create table public.mcq_sources (
  id uuid primary key default gen_random_uuid(),

  mcq_id text not null
    references public.mcqs(id)
    on delete cascade,

  source_locator text,

  supporting_excerpt text,

  source_confidence numeric,

  created_at timestamptz not null default now()
);

-- Spec-named indexing priority: "all sources for this mcq" is the dominant
-- read pattern (mcq detail/admin view listing provenance records).
create index idx_mcq_sources_mcq_id
on public.mcq_sources(mcq_id);

-- Backfill: carry forward the one real historical value (mcqs.source) into
-- the new provenance table as source_locator. Do NOT populate
-- supporting_excerpt or source_confidence -- no historical data exists for
-- either field, and inventing values would fabricate an audit trail. Only
-- non-null, non-empty-string source values produce a row; guarded by
-- `where not exists` so this is idempotent/safe to re-run. No `on conflict`
-- clause -- there's no unique constraint on mcq_id alone (a question can
-- legitimately gain more than one source row later via multiple citations),
-- so `on conflict do nothing` would have no target.
insert into public.mcq_sources (mcq_id, source_locator)
select id, source
from public.mcqs
where source is not null
  and source <> ''
  and not exists (
    select 1 from public.mcq_sources
    where mcq_sources.mcq_id = mcqs.id
  );

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.generation_jobs enable row level security;
alter table public.mcq_sources enable row level security;

-- Reviewer/admin-only read on both -- mirrors verification_runs (027):
-- import-run internals and source provenance are internal QA/ops content,
-- not student-facing. No policy exists for plain students at all.
create policy "reviewers can read generation jobs"
on public.generation_jobs for select
to authenticated
using (public.is_reviewer());

create policy "reviewers can read mcq sources"
on public.mcq_sources for select
to authenticated
using (public.is_reviewer());

-- No insert/update/delete policies for anon/authenticated on either table:
-- scripts/seed-mcqs.ts already writes via a service_role client (bypasses
-- RLS entirely), and no product surface needs a reviewer/authenticated
-- write path today -- unlike verification_runs, there is no RPC here
-- because there is no confirm/verdict-mapping business logic to enforce; a
-- raw service_role insert is already the correct and only write path.

-- ── Grants ───────────────────────────────────────────────────────
-- (schema usage already granted in 011_grants.sql)
grant all on public.generation_jobs to service_role;
grant all on public.mcq_sources to service_role;

-- authenticated gets a SELECT grant so PostgREST attempts the request at
-- all; the RLS policies above are what actually limit rows to
-- reviewers/admins. anon gets NO grant on either table -- mirrors
-- verification_runs (20260708000027) and profiles/exams/exam_questions/
-- exam_answers/user_topic_progress (20260708000011_grants.sql).
grant select on public.generation_jobs to authenticated;
grant select on public.mcq_sources to authenticated;
