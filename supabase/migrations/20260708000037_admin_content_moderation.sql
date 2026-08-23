-- 037_admin_content_moderation.sql
-- Backs the server-gated /admin route (docs/MASTER_KB.md "Feature: Content
-- Reporting"): publish/reject mcqs sitting in status='review', and
-- resolve/dismiss question_reports. Both write paths are admin-only
-- SECURITY DEFINER RPCs, following the set_mcq_verification / set_user_role
-- pattern (20260708000010, 20260708000024) -- never a raw client update.

create or replace function public.set_mcq_status(
  p_mcq_id text,
  p_status public.question_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current public.question_status;
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  if p_status not in ('published', 'rejected') then
    raise exception 'set_mcq_status only accepts published or rejected';
  end if;

  select status into v_current from public.mcqs where id = p_mcq_id;
  if not found then
    raise exception 'MCQ not found';
  end if;
  if v_current <> 'review' then
    raise exception 'MCQ is not in review (current status: %)', v_current;
  end if;

  update public.mcqs
     set status = p_status,
         updated_at = now()
   where id = p_mcq_id;
end;
$$;

revoke execute on function public.set_mcq_status(text, public.question_status) from public, anon;
grant execute on function public.set_mcq_status(text, public.question_status) to authenticated;

-- Close the raw-UPDATE bypass on question_reports. Unlike mcqs (no UPDATE
-- grant to authenticated at all -- see 20260708000024's comment), this table
-- currently grants update to authenticated (20260708000011) and has a live
-- is_reviewer() policy (20260708000009), so any reviewer-role account could
-- update report status directly, sidestepping set_question_report_status
-- below. Match the mcqs pattern: no raw grant, RPC is the only write path.
revoke update on public.question_reports from authenticated;
drop policy "reviewers can update reports" on public.question_reports;

create or replace function public.set_question_report_status(
  p_report_id uuid,
  p_status public.report_status
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Forbidden: admin role required';
  end if;

  if p_status not in ('resolved', 'dismissed') then
    raise exception 'set_question_report_status only accepts resolved or dismissed';
  end if;

  update public.question_reports
     set status = p_status,
         resolved_at = now()
   where id = p_report_id;

  if not found then
    raise exception 'Report not found';
  end if;
end;
$$;

revoke execute on function public.set_question_report_status(uuid, public.report_status) from public, anon;
grant execute on function public.set_question_report_status(uuid, public.report_status) to authenticated;
