-- 006_exams.sql

create table public.exams (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  title text,

  status public.exam_status not null
    default 'in_progress',

  total_questions integer not null
    check (total_questions > 0),

  correct_count integer
    check (correct_count >= 0),

  score numeric(5,2)
    check (score >= 0 and score <= 100),

  started_at timestamptz not null default now(),

  submitted_at timestamptz,

  time_limit_seconds integer
    check (time_limit_seconds is null or time_limit_seconds > 0),

  created_at timestamptz not null default now()
);

-- The exact questions (with their option permutation) in an exam.
-- options_order / correct_answer_in_order keep the option-shuffle server-side
-- so the correct key never reaches the client during an active exam.
create table public.exam_questions (
  id uuid primary key default gen_random_uuid(),

  exam_id uuid not null
    references public.exams(id)
    on delete cascade,

  mcq_id text not null
    references public.mcqs(id)
    on delete restrict,

  question_order integer not null
    check (question_order >= 0),

  options_order jsonb,

  correct_answer_in_order smallint
    check (correct_answer_in_order is null or correct_answer_in_order between 0 and 4),

  created_at timestamptz not null default now(),

  unique (exam_id, mcq_id),

  unique (exam_id, question_order)
);

create table public.exam_answers (
  id uuid primary key default gen_random_uuid(),

  exam_id uuid not null
    references public.exams(id)
    on delete cascade,

  mcq_id text not null
    references public.mcqs(id)
    on delete restrict,

  selected_answer smallint
    check (
      selected_answer is null
      or selected_answer between 0 and 4
    ),

  is_correct boolean,

  answered_at timestamptz,

  created_at timestamptz not null default now(),

  unique (exam_id, mcq_id)
);

create index idx_exams_user_id
on public.exams(user_id);

create index idx_exams_user_status
on public.exams(user_id, status);

create index idx_exam_questions_exam_id
on public.exam_questions(exam_id);

create index idx_exam_answers_exam_id
on public.exam_answers(exam_id);

create index idx_exam_answers_mcq_id
on public.exam_answers(mcq_id);
