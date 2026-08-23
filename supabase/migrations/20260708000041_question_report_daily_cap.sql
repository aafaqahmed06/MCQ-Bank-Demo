-- 041_question_report_daily_cap.sql
-- Public-launch abuse guard: cap question_reports inserts per user per UTC
-- day, so the moderation queue (one admin, per docs/MASTER_KB.md "Feature:
-- Content Reporting") can't be flooded. Separate from the existing
-- one-open-report-per-MCQ guard (idx_question_reports_one_open,
-- 20260708000017_ops_hardening.sql), which is unchanged.
--
-- Unlike record_practice_attempt, question_reports inserts are not behind
-- an RPC -- ReportQuestionButton.tsx does a raw insert, governed by the
-- "users can create reports" RLS policy (20260708000009_rls.sql). That's a
-- deliberate existing pattern for plain user-owned inserts with no
-- server-computed columns (mirrors bookmarks), so a BEFORE INSERT trigger
-- is the right way to add a count-based guard here without converting the
-- insert path to an RPC and touching the client call site.

create or replace function public.enforce_question_report_daily_cap()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reports_today int;
begin
  select count(*)
    into v_reports_today
    from public.question_reports
   where user_id = new.user_id
     and created_at >= date_trunc('day', now());

  if v_reports_today >= 20 then
    raise exception 'Daily report limit reached (20).';
  end if;

  return new;
end;
$$;

create trigger trg_question_reports_daily_cap
before insert on public.question_reports
for each row
execute function public.enforce_question_report_daily_cap();
