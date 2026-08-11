-- 007_bookmarks_reports.sql

create table public.bookmarks (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  mcq_id text not null
    references public.mcqs(id)
    on delete cascade,

  created_at timestamptz not null default now(),

  primary key (user_id, mcq_id)
);

create table public.question_reports (
  id uuid primary key default gen_random_uuid(),

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  mcq_id text not null
    references public.mcqs(id)
    on delete cascade,

  reason public.report_reason not null,

  description text,

  status public.report_status not null
    default 'open',

  created_at timestamptz not null default now(),

  resolved_at timestamptz
);

create index idx_question_reports_mcq
on public.question_reports(mcq_id);

create index idx_question_reports_status
on public.question_reports(status);
