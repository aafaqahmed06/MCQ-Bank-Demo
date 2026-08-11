-- 011_grants.sql
-- Supabase's current cloud default does NOT auto-expose new entities to the
-- API roles (anon / authenticated / service_role). Explicit grants are required
-- for PostgREST to serve the tables behind the RLS policies defined in 009.

grant usage on schema public to anon, authenticated, service_role;

-- service_role: full access (bypasses RLS) for server-side/admin operations.
grant all on public.profiles to service_role;
grant all on public.colleges to service_role;
grant all on public.programs to service_role;
grant all on public.academic_years to service_role;
grant all on public.blocks to service_role;
grant all on public.modules to service_role;
grant all on public.topics to service_role;
grant all on public.mcqs to service_role;
grant all on public.exams to service_role;
grant all on public.exam_questions to service_role;
grant all on public.exam_answers to service_role;
grant all on public.bookmarks to service_role;
grant all on public.question_reports to service_role;
grant all on public.user_topic_progress to service_role;

-- anon: public curriculum + published MCQ read (RLS gates the rows).
grant select on public.colleges to anon;
grant select on public.programs to anon;
grant select on public.academic_years to anon;
grant select on public.blocks to anon;
grant select on public.modules to anon;
grant select on public.topics to anon;
grant select on public.mcqs to anon;

-- authenticated: read curriculum + published MCQs...
grant select on public.colleges to authenticated;
grant select on public.programs to authenticated;
grant select on public.academic_years to authenticated;
grant select on public.blocks to authenticated;
grant select on public.modules to authenticated;
grant select on public.topics to authenticated;
grant select on public.mcqs to authenticated;

-- ...own profile (update restricted to allowed columns in 009)...
grant select on public.profiles to authenticated;

-- ...own exams / exam questions / exam answers (read-only; writes via RPC)...
grant select on public.exams to authenticated;
grant select on public.exam_questions to authenticated;
grant select on public.exam_answers to authenticated;

-- ...own bookmarks / reports / progress...
grant select, insert, delete on public.bookmarks to authenticated;
grant select, insert, update on public.question_reports to authenticated;
grant select on public.user_topic_progress to authenticated;
