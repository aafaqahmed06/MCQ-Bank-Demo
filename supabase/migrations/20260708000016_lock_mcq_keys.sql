-- 016_lock_mcq_keys.sql
-- Stop exposing the answer key (correct_answer, explanation) over REST.
--
-- Previously anyone with the anon key could download correct_answer +
-- explanation for the entire published bank in one request, and the same
-- exposure defeated the exam engine (start_exam returns mcq_ids, which a
-- client could look up mid-exam). Column-level grants now hide the key
-- columns from both anon and authenticated. Keys reach the app only via
-- server-side code (getPracticeQuestions uses the service role) and the
-- security-definer exam RPCs.

revoke select on public.mcqs from anon, authenticated;

grant select (
  id,
  topic_id,
  question,
  options,
  difficulty,
  status,
  source,
  created_at,
  updated_at
) on public.mcqs to anon, authenticated;