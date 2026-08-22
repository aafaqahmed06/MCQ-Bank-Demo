-- 024_mcq_generation_verification_fields.sql
-- Add provenance/verification metadata columns to mcqs (docs/MASTER_KB.md
-- "Architecture/database-schema.md" -> ## MCQ table). Columns are additive
-- and nullable so existing reads/writes are unaffected; historical rows are
-- backfilled to the minimum honest values (no fabricated generation/
-- verification history).

create type public.mcq_source_type as enum (
  'legacy',
  'textbook',
  'faculty',
  'curated',
  'generated'
);

create type public.mcq_verification_status as enum (
  'unverified',
  'verified',
  'needs_review',
  'rejected'
);

alter table public.mcqs
  add column source_type public.mcq_source_type,
  add column generation_metadata jsonb,
  add column verification_status public.mcq_verification_status,
  add column verification_metadata jsonb;

-- Backfill: existing rows predate this pipeline. Do not invent generation
-- or verification history for them -- only the two status columns get a
-- known-true value. Guarded by "where source_type is null" so this is safe
-- to re-run and never overwrites rows a later migration/RPC has touched.
update public.mcqs
   set source_type = 'legacy',
       verification_status = 'unverified'
 where source_type is null;

-- Client (anon/authenticated) may read the new columns EXCEPT
-- verification_metadata, which can carry internal reviewer notes/findings
-- and follows the same column-grant pattern as correct_answer/explanation
-- (20260708000016_lock_mcq_keys.sql).
revoke select on public.mcqs from anon, authenticated;

grant select (
  id,
  topic_id,
  question,
  options,
  difficulty,
  status,
  source,
  source_type,
  generation_metadata,
  verification_status,
  created_at,
  updated_at
) on public.mcqs to anon, authenticated;

-- Reviewer/admin-only write path for verification fields. No UPDATE grant on
-- mcqs is given to anon/authenticated (none exists today either), so this
-- RPC is the only way to change verification_status/verification_metadata --
-- adding a raw UPDATE grant would also activate the otherwise-inert
-- "reviewers can update mcqs" RLS policy for every column, bypassing this.
create or replace function public.set_mcq_verification(
  p_mcq_id text,
  p_status public.mcq_verification_status,
  p_metadata jsonb default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_reviewer() then
    raise exception 'Forbidden: reviewer role required';
  end if;

  update public.mcqs
     set verification_status = p_status,
         verification_metadata = p_metadata,
         updated_at = now()
   where id = p_mcq_id;

  if not found then
    raise exception 'MCQ not found';
  end if;
end;
$$;

revoke execute on function public.set_mcq_verification(text, public.mcq_verification_status, jsonb) from public, anon;
grant execute on function public.set_mcq_verification(text, public.mcq_verification_status, jsonb) to authenticated;
