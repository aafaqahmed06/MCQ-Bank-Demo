-- 001_extensions.sql
-- Enable extensions and shared utilities.

create extension if not exists pgcrypto;

-- Reusable updated_at trigger function (attached to profiles, mcqs, user_topic_progress).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
