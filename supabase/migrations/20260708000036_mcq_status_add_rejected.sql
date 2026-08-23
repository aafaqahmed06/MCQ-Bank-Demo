-- 036_mcq_status_add_rejected.sql
-- Adds 'rejected' to question_status so the admin review queue
-- (app/admin/review, docs/MASTER_KB.md "Feature: Content Reporting") can
-- distinguish "never made it past review" from 'archived' ("was published,
-- later retired"). Additive only -- existing rows/values are untouched.
--
-- Split into its own migration file (rather than combined with the RPC that
-- uses the new value) because ALTER TYPE ... ADD VALUE cannot be used in the
-- same transaction that also references the new value.

alter type public.question_status add value 'rejected';
