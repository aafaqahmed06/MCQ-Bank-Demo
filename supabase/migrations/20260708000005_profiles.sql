-- 005_profiles.sql

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  full_name text,

  college_id text references public.colleges(id) on delete set null,

  program_id text references public.programs(id) on delete set null,

  academic_year_id text references public.academic_years(id) on delete set null,

  role public.user_role not null default 'student',

  avatar_url text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()
);

create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

-- Automatically create a profile when a new Supabase Auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
