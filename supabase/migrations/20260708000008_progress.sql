-- 008_progress.sql

create table public.user_topic_progress (
  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  topic_id text not null
    references public.topics(id)
    on delete cascade,

  questions_attempted integer not null default 0,

  questions_correct integer not null default 0,

  accuracy numeric(5,2) not null default 0,

  last_attempted_at timestamptz,

  updated_at timestamptz not null default now(),

  primary key (user_id, topic_id)
);

create trigger trg_user_topic_progress_updated_at
before update on public.user_topic_progress
for each row execute procedure public.set_updated_at();
