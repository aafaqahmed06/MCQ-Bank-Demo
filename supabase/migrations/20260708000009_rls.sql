-- 009_rls.sql
-- Enable RLS everywhere and define all policies.

alter table public.profiles enable row level security;
alter table public.colleges enable row level security;
alter table public.programs enable row level security;
alter table public.academic_years enable row level security;
alter table public.blocks enable row level security;
alter table public.modules enable row level security;
alter table public.topics enable row level security;
alter table public.mcqs enable row level security;
alter table public.exams enable row level security;
alter table public.exam_questions enable row level security;
alter table public.exam_answers enable row level security;
alter table public.bookmarks enable row level security;
alter table public.question_reports enable row level security;
alter table public.user_topic_progress enable row level security;

-- ── Role helpers (needed by the policies below) ────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('admin', 'super_admin')
  );
$$;

create or replace function public.is_reviewer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
    and role in ('reviewer', 'admin', 'super_admin')
  );
$$;

-- ── Public curriculum read access ──────────────────────────────
create policy "public read colleges"
on public.colleges for select
using (true);

create policy "public read programs"
on public.programs for select
using (true);

create policy "public read academic years"
on public.academic_years for select
using (true);

create policy "public read blocks"
on public.blocks for select
using (true);

create policy "public read modules"
on public.modules for select
using (true);

create policy "public read topics"
on public.topics for select
using (true);

-- ── MCQs ───────────────────────────────────────────────────────
-- Students read published MCQs for revision/browsing.
-- Reviewers/admins may read all (including drafts).
create policy "students can read published mcqs"
on public.mcqs for select
using (status = 'published' or public.is_reviewer());

create policy "reviewers can update mcqs"
on public.mcqs for update
to authenticated
using (public.is_reviewer())
with check (public.is_reviewer());

create policy "admins can insert mcqs"
on public.mcqs for insert
to authenticated
with check (public.is_admin());

create policy "admins can delete mcqs"
on public.mcqs for delete
to authenticated
using (public.is_admin());

-- ── Profiles ───────────────────────────────────────────────────
create policy "users can read own profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

-- Row policy: users can only update their own row...
create policy "users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- ...and the column-level grant below limits WHICH columns.
-- Role changes can only happen through set_user_role() (admin, server-side).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, college_id, program_id, academic_year_id)
on public.profiles to authenticated;

-- ── Exams ──────────────────────────────────────────────────────
create policy "users can read own exams"
on public.exams for select
to authenticated
using (user_id = auth.uid());

create policy "users can read own exam questions"
on public.exam_questions for select
to authenticated
using (
  exists (
    select 1
    from public.exams
    where exams.id = exam_questions.exam_id
    and exams.user_id = auth.uid()
  )
);

create policy "users can read own exam answers"
on public.exam_answers for select
to authenticated
using (
  exists (
    select 1
    from public.exams
    where exams.id = exam_answers.exam_id
    and exams.user_id = auth.uid()
  )
);

-- ── Bookmarks ──────────────────────────────────────────────────
create policy "users can read own bookmarks"
on public.bookmarks for select
to authenticated
using (user_id = auth.uid());

create policy "users can create own bookmarks"
on public.bookmarks for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can delete own bookmarks"
on public.bookmarks for delete
to authenticated
using (user_id = auth.uid());

-- ── Question reports ───────────────────────────────────────────
create policy "users can create reports"
on public.question_reports for insert
to authenticated
with check (user_id = auth.uid());

create policy "users can read own reports"
on public.question_reports for select
to authenticated
using (user_id = auth.uid() or public.is_reviewer());

create policy "reviewers can update reports"
on public.question_reports for update
to authenticated
using (public.is_reviewer())
with check (public.is_reviewer());

-- ── Progress ───────────────────────────────────────────────────
-- No direct INSERT/UPDATE for students; submit_exam() updates it server-side.
create policy "users can read own progress"
on public.user_topic_progress for select
to authenticated
using (user_id = auth.uid());
