-- 027_verification_runs.sql
-- Append-only verification audit log (docs/MASTER_KB.md
-- "Architecture/database-schema.md" -> ## verification_runs). Records
-- each individual verification pass against an mcq (human review or
-- automated pipeline run) without ever overwriting prior history --
-- mcqs.verification_status (20260708000024) remains the single "current
-- status" field; this table is the full history behind it.
--
-- Deviations from the literal spec, resolved against this repo's actual
-- types/conventions:
--   - mcq_id is `text` (not `uuid`) because public.mcqs.id is `text`.
--   - mcq_id is NULLABLE with ON DELETE SET NULL (spec doesn't say NOT
--     NULL). mcqs can only be hard-deleted by is_admin() (20260708000009),
--     and this table's entire reason to exist is "never overwrite
--     verification history" -- cascading the delete would destroy the
--     audit trail for exactly the MCQs most likely to have been deleted
--     (rejected content), and RESTRICT would block legitimate admin
--     cleanup of bad content. SET NULL keeps the verdict/confidence/
--     findings/rubric row intact and just severs the dangling reference.
--     record_verification_run() below still requires p_mcq_id at insert
--     time -- the column is nullable only so history can survive a later
--     admin delete of the mcq, not so callers can insert orphan rows.
--   - verdict is a native enum (public.verification_verdict), matching
--     this repo's closed-vocabulary convention.
--   - verifier_type stays `text` per spec, but gets a CHECK against the
--     three documented values (human/model/rule), mirroring
--     mcq_tags.assigned_by (20260708000025). record_verification_run() is
--     reviewer-only (human path); the generation pipeline is expected to
--     insert 'model'/'rule' rows directly via service_role, bypassing the
--     RPC and RLS entirely (grant all ... to service_role below).
--   - rubric_version/confidence/findings are left nullable: the literal
--     spec omits an explicit "nullable" marker for these (unlike
--     verifier_model), but a human reviewer recording a quick verdict may
--     not always have a rubric version or full structured findings on
--     hand, so these stay optional rather than blocking the RPC.
--   - No `updated_at` column and no set_updated_at trigger -- this table
--     is insert-only by design.

create type public.verification_verdict as enum (
  'pass',
  'revise',
  'reject',
  'uncertain'
);

create table public.verification_runs (
  id uuid primary key default gen_random_uuid(),

  mcq_id text
    references public.mcqs(id)
    on delete set null,

  verifier_type text not null default 'human'
    check (verifier_type in ('human', 'model', 'rule')),

  verifier_model text,

  rubric_version text,

  verdict public.verification_verdict not null,

  confidence numeric,

  findings jsonb,

  created_at timestamptz not null default now()
);

-- Spec-named indexing priority: "verification history for this mcq, most
-- recent first" is the dominant read pattern (reviewer UI timeline, any
-- future audit tooling).
create index idx_verification_runs_mcq_created
on public.verification_runs(mcq_id, created_at desc);

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.verification_runs enable row level security;

-- Reviewer/admin-only read. Unlike mcq_tags (public tag vocabulary),
-- verification findings/confidence/verifier notes are internal QA
-- content -- same sensitivity class as mcqs.verification_metadata, which
-- is already excluded from the anon/authenticated column-select grant on
-- mcqs (20260708000024). No policy exists for plain students at all;
-- only is_reviewer() (reviewer/admin/super_admin) may read.
create policy "reviewers can read verification runs"
on public.verification_runs for select
to authenticated
using (public.is_reviewer());

-- No insert/update/delete policies for anon/authenticated: all
-- reviewer-initiated writes go through record_verification_run()
-- (SECURITY DEFINER, bypasses RLS) below -- there is deliberately no raw
-- INSERT grant that would let a reviewer skip the verdict->status
-- mapping, or let a non-reviewer author fabricated history. Automated
-- pipeline writes use service_role directly (bypasses RLS entirely).

-- ── Grants ───────────────────────────────────────────────────────
-- (schema usage already granted in 011_grants.sql)
grant all on public.verification_runs to service_role;

-- authenticated gets a SELECT grant so PostgREST attempts the request at
-- all; the RLS policy above is what actually limits rows to reviewers/
-- admins. anon gets NO grant -- mirrors profiles/exams/exam_questions/
-- exam_answers/user_topic_progress (20260708000011_grants.sql), which
-- also withhold anon read entirely for self-or-role-scoped content.
grant select on public.verification_runs to authenticated;

-- ── RPC: record a verification run + apply the confirmed verdict->status
-- mapping to mcqs.verification_status, in one transaction ─────────────
-- Mapping (confirmed): pass -> verified, revise -> needs_review,
-- uncertain -> needs_review, reject -> rejected.
create or replace function public.record_verification_run(
  p_mcq_id text,
  p_verdict public.verification_verdict,
  p_verifier_type text default 'human',
  p_verifier_model text default null,
  p_rubric_version text default null,
  p_confidence numeric default null,
  p_findings jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_run_id uuid;
  v_status public.mcq_verification_status;
begin
  if not public.is_reviewer() then
    raise exception 'Forbidden: reviewer role required';
  end if;

  if p_mcq_id is null then
    raise exception 'p_mcq_id is required';
  end if;

  insert into public.verification_runs (
    mcq_id, verifier_type, verifier_model, rubric_version,
    verdict, confidence, findings
  )
  values (
    p_mcq_id, p_verifier_type, p_verifier_model, p_rubric_version,
    p_verdict, p_confidence, p_findings
  )
  returning id into v_run_id;

  v_status := case p_verdict
    when 'pass' then 'verified'
    when 'revise' then 'needs_review'
    when 'uncertain' then 'needs_review'
    when 'reject' then 'rejected'
  end;

  update public.mcqs
     set verification_status = v_status,
         updated_at = now()
   where id = p_mcq_id;

  if not found then
    raise exception 'MCQ not found';
  end if;

  return v_run_id;
end;
$$;

revoke execute on function public.record_verification_run(
  text, public.verification_verdict, text, text, text, numeric, jsonb
) from public, anon;

grant execute on function public.record_verification_run(
  text, public.verification_verdict, text, text, text, numeric, jsonb
) to authenticated;
