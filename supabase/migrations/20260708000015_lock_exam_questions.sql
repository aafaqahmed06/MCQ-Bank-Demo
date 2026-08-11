-- 015_lock_exam_questions.sql
-- Harden the "no correct keys during an active exam" guarantee.
--
-- exam_questions rows hold the graded key (options_order +
-- correct_answer_in_order) for every question in an exam. grant select from
-- 011 exposed that via REST to any authenticated user mid-exam, defeating the
-- secure-exam design. Students should only ever receive questions through
-- start_exam (key-free payload) and the keyed review through get_exam_review()
-- AFTER the exam is submitted. exam_answers is already empty until submit.
--
-- service_role keeps its `grant all` for server-side administration via 011.

revoke select on public.exam_questions from anon, authenticated;