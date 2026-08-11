-- 003_curriculum.sql
-- College -> Program -> Academic Year -> Block -> Module -> Topic

create table public.colleges (
  id text primary key,
  name text not null unique,
  short_name text,
  created_at timestamptz not null default now()
);

create table public.programs (
  id text primary key,
  college_id text not null references public.colleges(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (college_id, name)
);

create table public.academic_years (
  id text primary key,
  program_id text not null references public.programs(id) on delete cascade,
  year_number smallint not null check (year_number >= 1),
  name text not null,
  created_at timestamptz not null default now(),
  unique (program_id, year_number)
);

create table public.blocks (
  id text primary key,
  academic_year_id text not null references public.academic_years(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (academic_year_id, name)
);

create table public.modules (
  id text primary key,
  block_id text not null references public.blocks(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (block_id, name)
);

create table public.topics (
  id text primary key,
  module_id text not null references public.modules(id) on delete cascade,
  name text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (module_id, name)
);
