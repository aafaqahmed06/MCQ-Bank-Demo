-- 004_mcqs.sql

create table public.mcqs (
  id text primary key,

  topic_id text not null
    references public.topics(id)
    on delete restrict,

  question text not null,

  options jsonb not null,

  correct_answer smallint not null
    check (correct_answer between 0 and 4),

  explanation text not null,

  difficulty smallint not null
    check (difficulty between 1 and 3),

  status public.question_status not null
    default 'published',

  source text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  constraint options_must_be_array
    check (jsonb_typeof(options) = 'array')
);

create index idx_mcqs_topic_id
on public.mcqs(topic_id);

create index idx_mcqs_status
on public.mcqs(status);

create index idx_mcqs_difficulty
on public.mcqs(difficulty);

create index idx_mcqs_topic_difficulty
on public.mcqs(topic_id, difficulty);

create index idx_mcqs_published
on public.mcqs(topic_id, difficulty)
where status = 'published';

create trigger trg_mcqs_updated_at
before update on public.mcqs
for each row execute procedure public.set_updated_at();
