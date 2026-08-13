-- 017_ops_hardening.sql
-- P2 ops hardening, all DB-layer:
--   1. Missing FK lookup indexes (profiles, bookmarks, exam_questions, question_reports).
--   2. Abuse guards: one open question_report per (user, mcq); daily exam-start cap;
--      leaderboard p_limit clamped.
--   3. Abandoned-exam hygiene: start_exam lazily abandons the caller's expired
--      in_progress exams; purge_stale_exams() (service-role only) prunes old rows.
--   4. Fix seed typo "Foundation University Medical Colleg" -> "... College" by
--      renaming the slug-derived college/program/year ids and repointing profiles.

-- ── 1. FK lookup indexes ─────────────────────────────────────────────
create index idx_profiles_college_id
on public.profiles(college_id);

create index idx_profiles_program_id
on public.profiles(program_id);

create index idx_profiles_academic_year_id
on public.profiles(academic_year_id);

create index idx_bookmarks_mcq_id
on public.bookmarks(mcq_id);

create index idx_exam_questions_mcq_id
on public.exam_questions(mcq_id);

create index idx_question_reports_user_id
on public.question_reports(user_id);

-- Purge scans benefit from created_at ordering.
create index idx_exams_created_at
on public.exams(created_at);

-- ── 2. Abuse guards ──────────────────────────────────────────────────
-- A user may only have one OPEN report for a given MCQ. Resolved/dismissed
-- reports don't block new ones.
create unique index idx_question_reports_one_open
on public.question_reports(user_id, mcq_id)
where status = 'open';

-- Redefine get_leaderboard to clamp the result limit (default stays 50).
create or replace function public.get_leaderboard(p_limit int default 50)
returns table (
  rank bigint,
  full_name text,
  college_short_name text,
  program_name text,
  exams_completed bigint,
  total_correct bigint,
  accuracy numeric(5,2)
)
language sql
security definer
set search_path = public
as $$
  select
    row_number() over (
      order by sum(e.correct_count) desc,
               round((coalesce(sum(e.correct_count),0)::numeric / nullif(sum(e.total_questions),0)) * 100, 2) desc
    )::bigint as rank,
    p.full_name,
    c.short_name as college_short_name,
    pr.name as program_name,
    count(e.id)::bigint as exams_completed,
    coalesce(sum(e.correct_count),0)::bigint as total_correct,
    round((coalesce(sum(e.correct_count),0)::numeric / nullif(sum(e.total_questions),0)) * 100, 2) as accuracy
  from public.profiles p
  join public.exams e on e.user_id = p.id and e.status = 'submitted'
  left join public.colleges c on c.id = p.college_id
  left join public.programs pr on pr.id = p.program_id
  where p.role = 'student'
  group by p.id, p.full_name, c.short_name, pr.name
  order by total_correct desc, accuracy desc
  limit least(greatest(p_limit, 1), 100);
$$;

-- ── 3. Abandoned-exam hygiene ────────────────────────────────────────
-- start_exam: cap starts per user per UTC day AND lazily abandon this user's
-- expired in_progress exams (no cron needed for the common case).
create or replace function public.start_exam(
  p_topic_ids text[] default null,
  p_difficulty int[] default array[1,2,3],
  p_question_count int default 20,
  p_time_limit_seconds int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_exam_id uuid;
  v_count int;
  v_row record;
  v_question public.mcqs%rowtype;
  v_topic_name text;
  v_opts_orig text[];
  v_indices int[];
  v_opt text[];
  v_k int;
  v_j int;
  v_tmp int;
  v_order int := 0;
  v_payload jsonb := '[]'::jsonb;
  v_started_today int;
begin
  if v_user is null then
    raise exception 'Not authenticated';
  end if;

  if p_question_count is null or p_question_count <= 0 then
    raise exception 'Invalid question count';
  end if;

  -- Abandon any of this user's in_progress exams that have already timed out.
  update public.exams
     set status = 'abandoned'
   where user_id = v_user
     and status = 'in_progress'
     and time_limit_seconds is not null
     and started_at + make_interval(secs => time_limit_seconds) < now();

  -- Daily cap: prevent leaderboard flooding via unlimited exam starts.
  select count(*)
    into v_started_today
    from public.exams
   where user_id = v_user
     and created_at >= date_trunc('day', now());

  if v_started_today >= 30 then
    raise exception 'Daily exam start limit reached (30).';
  end if;

  select count(*)
    into v_count
    from public.mcqs q
   where q.status = 'published'
     and q.difficulty = any(p_difficulty)
     and (p_topic_ids is null or cardinality(p_topic_ids) = 0 or q.topic_id = any(p_topic_ids));

  if v_count = 0 then
    raise exception 'No published questions match the requested criteria';
  end if;

  v_count := least(v_count, p_question_count);

  insert into public.exams (user_id, title, status, total_questions, time_limit_seconds)
  values (v_user, 'Exam Simulation', 'in_progress', v_count, p_time_limit_seconds)
  returning id into v_exam_id;

  for v_row in
    select q.id, q.topic_id
      from public.mcqs q
     where q.status = 'published'
       and q.difficulty = any(p_difficulty)
       and (p_topic_ids is null or cardinality(p_topic_ids) = 0 or q.topic_id = any(p_topic_ids))
     order by random()
     limit v_count
  loop
    select * into v_question from public.mcqs where id = v_row.id;

    select t.name into v_topic_name
      from public.topics t
     where t.id = v_row.topic_id;

    v_opts_orig := array(
      select vv from jsonb_array_elements_text(v_question.options) vv
    );

    v_indices := array(select generate_subscripts(v_opts_orig, 1));

    -- Fisher-Yates over 1-based positions
    for v_k in reverse array_length(v_indices, 1) .. 2 loop
      v_j := 1 + floor(random() * v_k)::int;
      v_tmp := v_indices[v_k];
      v_indices[v_k] := v_indices[v_j];
      v_indices[v_j] := v_tmp;
    end loop;

    v_opt := array[]::text[];
    for v_k in 1..array_length(v_indices, 1) loop
      v_opt := v_opt || v_opts_orig[v_indices[v_k]];
    end loop;

    insert into public.exam_questions
      (exam_id, mcq_id, question_order, options_order, correct_answer_in_order)
    values (
      v_exam_id,
      v_question.id,
      v_order,
      to_jsonb(v_indices),
      array_position(v_indices, v_question.correct_answer + 1) - 1
    );

    v_payload := v_payload || jsonb_build_object(
      'mcq_id', v_question.id,
      'question', v_question.question,
      'options', to_jsonb(v_opt),
      'topic', v_topic_name,
      'question_order', v_order
    );
    v_order := v_order + 1;
  end loop;

  return jsonb_build_object('exam_id', v_exam_id, 'questions', v_payload);
end;
$$;

-- Ops tool: prune abandoned (and optionally old) exams. Service role only.
create or replace function public.purge_stale_exams(p_days int default 90)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  if auth.uid() is not null and not public.is_admin() then
    raise exception 'Not authorized';
  end if;

  delete from public.exams
   where status = 'abandoned'
     and created_at < now() - make_interval(days => p_days);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke execute on function public.purge_stale_exams(int) from public, anon;
grant execute on function public.purge_stale_exams(int) to service_role;

-- ── 4. Seed typo fix (idempotent; no-op on fresh DBs) ─────────────────
do $$
declare
  v_old_college text := 'foundation-university-medical-colleg';
  v_new_college text := 'foundation-university-medical-college';
  v_old_program text := v_old_college || '-mbbs';
  v_new_program text := v_new_college || '-mbbs';
  v_has_old boolean;
begin
  select exists (select 1 from public.colleges where id = v_old_college)
    into v_has_old;

  if v_has_old then
    insert into public.colleges (id, name, short_name, created_at)
    select v_new_college, 'Foundation University Medical College', short_name, created_at
      from public.colleges where id = v_old_college;

    insert into public.programs (id, college_id, name, created_at)
    select v_new_program, v_new_college, name, created_at
      from public.programs where id = v_old_program;

    insert into public.academic_years (id, program_id, year_number, name, created_at)
    select v_new_program || '-year-' || year_number, v_new_program, year_number, name, created_at
      from public.academic_years where program_id = v_old_program;

    update public.profiles
       set college_id = v_new_college
     where college_id = v_old_college;

    update public.profiles
       set program_id = v_new_program
     where program_id = v_old_program;

    update public.profiles
       set academic_year_id = replace(academic_year_id, v_old_program || '-year-', v_new_program || '-year-')
     where academic_year_id like v_old_program || '-year-%';

    -- Cascade removes the old program + years (programs->academic_years).
    delete from public.colleges where id = v_old_college;
  end if;
end $$;
