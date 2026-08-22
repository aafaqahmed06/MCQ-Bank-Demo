-- 025_mcq_tagging.sql
-- Generalized tagging layer (docs/MASTER_KB.md "Architecture/database-schema.md"
-- -> ## Tagging system, and "MCQ Pipeline/tagging-spec.md"). Additive only --
-- does not touch mcqs.topic_id or any retrieval/query logic.
--
-- Deviations from the literal spec, resolved against this repo's actual types:
--   - mcq_tags.mcq_id is `text` (not `uuid`) because public.mcqs.id is `text`
--     (20260708000004_mcqs.sql).
--   - assigned_by / namespace stay `text` per the spec, but assigned_by gets a
--     CHECK against the three documented values (rule/model/human).
--   - `question_style` is explicitly out of scope right now ("Do not enable a
--     style until the product actually supports it") -- see the CHECK
--     constraint on tags.namespace below.

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  namespace text not null,
  name text not null,
  slug text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (namespace, slug),

  -- Product gate: deny-list (not allow-list) so legitimate new namespaces
  -- never require a migration. Drop this in a follow-up once the product
  -- supports question-style tagging.
  constraint tags_question_style_not_enabled
    check (namespace <> 'question_style')
);

create trigger trg_tags_updated_at
before update on public.tags
for each row execute procedure public.set_updated_at();

create table public.mcq_tags (
  mcq_id text not null
    references public.mcqs(id)
    on delete cascade,

  tag_id uuid not null
    references public.tags(id)
    on delete cascade,

  confidence numeric,

  assigned_by text not null
    check (assigned_by in ('rule', 'model', 'human')),

  created_at timestamptz not null default now(),

  primary key (mcq_id, tag_id)
);

-- Spec-named indexing priority: reverse lookups ("all mcqs for a tag") need
-- this since the PK's leading column is mcq_id, not tag_id.
create index idx_mcq_tags_tag_mcq
on public.mcq_tags(tag_id, mcq_id);

-- ── RLS ──────────────────────────────────────────────────────────
alter table public.tags enable row level security;
alter table public.mcq_tags enable row level security;

-- Tag vocabulary itself isn't sensitive; readable by anyone, but only
-- active tags for non-reviewers (deprecated tags stay reviewer-only visible
-- -- otherwise the `active` column has no behavioral effect for students).
create policy "public can read active tags"
on public.tags for select
using (active = true or public.is_reviewer());

create policy "reviewers can insert tags"
on public.tags for insert
to authenticated
with check (public.is_reviewer());

create policy "reviewers can update tags"
on public.tags for update
to authenticated
using (public.is_reviewer())
with check (public.is_reviewer());

create policy "admins can delete tags"
on public.tags for delete
to authenticated
using (public.is_admin());

-- Students may read tags on published mcqs only (mirrors "students can read
-- published mcqs" in 009_rls.sql); reviewers/admins read everything.
create policy "students can read tags on published mcqs"
on public.mcq_tags for select
using (
  exists (
    select 1 from public.mcqs
    where mcqs.id = mcq_tags.mcq_id
    and mcqs.status = 'published'
  )
  or public.is_reviewer()
);

create policy "reviewers can insert mcq tags"
on public.mcq_tags for insert
to authenticated
with check (public.is_reviewer());

create policy "reviewers can update mcq tags"
on public.mcq_tags for update
to authenticated
using (public.is_reviewer())
with check (public.is_reviewer());

create policy "reviewers can delete mcq tags"
on public.mcq_tags for delete
to authenticated
using (public.is_reviewer());

-- ── Grants ───────────────────────────────────────────────────────
-- (schema usage already granted in 011_grants.sql)
grant all on public.tags to service_role;
grant all on public.mcq_tags to service_role;

grant select on public.tags to anon, authenticated;
grant select on public.mcq_tags to anon, authenticated;

-- Insert/update/delete are granted to authenticated so PostgREST will even
-- attempt the request; the RLS policies above (is_reviewer()/is_admin()) are
-- what actually gate who succeeds. anon gets no write grant at all -- no
-- tag column here is sensitive the way mcqs.correct_answer is, so there's
-- no need for the column-lock pattern from 20260708000016.
grant insert, update, delete on public.tags to authenticated;
grant insert, update, delete on public.mcq_tags to authenticated;
