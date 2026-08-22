-- 031_fix_smart_practice_weight_types.sql
-- Bugfix: _question_weakness_weight(int, int, timestamptz, timestamptz)
-- (030) never matched a real call site. count(*) / count(*) filter(...)
-- in Postgres always produces bigint, and Postgres does not implicitly
-- narrow bigint -> int across a function call boundary, so every call from
-- get_smart_practice_questions's tmp_pool/tmp_topics construction failed
-- with "function ... does not exist" -- caught by scripts/verify-phase8.ts
-- Section I against the live database.
--
-- get_smart_practice_questions itself does not need to change: its body
-- resolves the helper call by argument types at each execution (plpgsql
-- does not pre-validate embedded SQL against callee signatures at CREATE
-- FUNCTION time), so redefining the helper alone is sufficient.

drop function if exists public._question_weakness_weight(int, int, timestamptz, timestamptz);

create or replace function public._question_weakness_weight(
  p_attempts bigint,
  p_misses bigint,
  p_last_ts timestamptz,
  p_now timestamptz
)
returns numeric
language sql
stable
as $$
  select case
    when p_attempts is null or p_attempts = 0 then 0.2 + 1.0 -- BASE_WEIGHT + NOVELTY_BONUS
    else 0.2 + (
      (greatest(p_misses, 0)::numeric / p_attempts) *
      (1 + (2.0 - 1) * (1 - exp(
        - (extract(epoch from (p_now - p_last_ts)) / 86400.0) / 3.0
      )))
    )
  end;
$$;

revoke execute on function public._question_weakness_weight(bigint, bigint, timestamptz, timestamptz) from public, anon, authenticated;
