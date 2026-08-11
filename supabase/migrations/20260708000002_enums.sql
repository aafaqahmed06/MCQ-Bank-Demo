-- 002_enums.sql

create type public.user_role as enum (
  'student',
  'reviewer',
  'admin',
  'super_admin'
);

create type public.question_status as enum (
  'draft',
  'review',
  'published',
  'archived'
);

create type public.exam_status as enum (
  'in_progress',
  'submitted',
  'abandoned'
);

create type public.report_reason as enum (
  'incorrect_answer',
  'incorrect_explanation',
  'ambiguous',
  'typo',
  'outdated',
  'duplicate',
  'other'
);

create type public.report_status as enum (
  'open',
  'reviewing',
  'resolved',
  'dismissed'
);
