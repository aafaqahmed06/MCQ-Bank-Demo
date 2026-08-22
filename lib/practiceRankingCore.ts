/**
 * Pure weakness-ranking math for practice mode (docs/MASTER_KB.md
 * "Weakness Detection" / "Adaptive Practice" sections) -- no I/O, no
 * `server-only` import, so it can be exercised directly by
 * scripts/verify-practice-ranking.ts (this project has no test framework;
 * that script runs standalone via `tsx`, which can't resolve the
 * `server-only` package `lib/practiceRanking.ts` requires). That file
 * re-exports everything here and adds the DB-touching orchestrator.
 *
 * Signal source (in the orchestrator): this user's `practice_attempts` rows
 * AND their `exam_answers` history for the same mcq_id (read-only join into
 * exam tables -- exam mode itself is never touched). Constants mirror the
 * SQL copy in supabase/migrations/20260708000030_smart_practice.sql
 * (_question_weakness_weight) -- one formula, two runtimes, kept in sync by
 * review discipline since the languages can't literally share code.
 *
 * Recency direction is "overdue" (a miss's weight grows the longer it's
 * been), not "reinforce-immediately" -- matches MASTER_KB's separate
 * "spacing weight" term and avoids re-drilling a fresh mistake before it's
 * had a chance to be forgotten.
 */
export const R_MAX = 2.0;
export const TAU_DAYS = 3.0;
export const BASE_WEIGHT = 0.2;
export const NOVELTY_BONUS = 1.0;

/**
 * Share of a pool's questions reserved for guaranteed, deterministic
 * worst-first placement (see splitReservedAndRemainder below) -- "up to
 * half," never more than the pool's actual missed-question count. Mirrors
 * the SQL copy in supabase/migrations/20260708000034_guaranteed_miss_slots.sql.
 */
export const RESERVED_MISS_SHARE = 0.5;

const MS_PER_DAY = 86_400_000;

export interface AttemptStats {
  mcqId: string;
  attempts: number;
  misses: number;
  /** ISO timestamp of the most recent attempt for this mcq, or null if attempts = 0. */
  lastAttemptedAt: string | null;
}

export interface QuestionWeight {
  mcqId: string;
  attempts: number;
  errorRate: number | null;
  daysSinceLastAttempt: number | null;
  recencyWeight: number;
  weaknessScore: number;
  noveltyScore: number;
  finalWeight: number;
}

/** Pure, unit-testable -- no I/O. */
export function computeQuestionWeights(
  mcqIds: string[],
  attemptStats: Map<string, AttemptStats>,
  now: Date = new Date(),
): QuestionWeight[] {
  return mcqIds.map((mcqId) => {
    const stats = attemptStats.get(mcqId);
    const attempts = stats?.attempts ?? 0;

    if (attempts === 0 || !stats) {
      return {
        mcqId,
        attempts: 0,
        errorRate: null,
        daysSinceLastAttempt: null,
        recencyWeight: 1.0,
        weaknessScore: 0,
        noveltyScore: NOVELTY_BONUS,
        finalWeight: BASE_WEIGHT + NOVELTY_BONUS,
      };
    }

    const errorRate = stats.misses / attempts;
    const daysSince = stats.lastAttemptedAt
      ? (now.getTime() - new Date(stats.lastAttemptedAt).getTime()) / MS_PER_DAY
      : 0;
    const recencyWeight = 1 + (R_MAX - 1) * (1 - Math.exp(-daysSince / TAU_DAYS));
    const weaknessScore = errorRate * recencyWeight;

    return {
      mcqId,
      attempts,
      errorRate,
      daysSinceLastAttempt: daysSince,
      recencyWeight,
      weaknessScore,
      noveltyScore: 0,
      finalWeight: BASE_WEIGHT + weaknessScore,
    };
  });
}

/**
 * Weighted random sampling without replacement (Efraimidis-Spirakis):
 * higher-weight items systematically sort earlier without ever being
 * deterministic -- satisfies "reweight instead of pure random order" while
 * keeping session-to-session variety.
 */
export function weightedSampleOrder<T extends { id: string }>(
  items: readonly T[],
  weights: Map<string, number>,
  rng: () => number = Math.random,
): T[] {
  return items
    .map((item) => {
      const weight = Math.max(weights.get(item.id) ?? BASE_WEIGHT, 0.0001);
      const u = Math.max(rng(), Number.EPSILON);
      return { item, key: -Math.log(u) / weight };
    })
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.item);
}

/**
 * Guarantees the pool's worst/most-overdue misses actually appear at the
 * front of the session order, rather than merely being likelier-but-not-
 * certain to surface early via weighted-random sampling alone. Regular
 * practice mode shows every question in the pool either way (no session
 * cap exists), so "guaranteed" here means guaranteed early placement, not
 * guaranteed inclusion -- every item in `pool` still appears exactly once.
 *
 * reservedCount = min(floor(pool.length * reservedShare), missed.length) --
 * "up to half," capped by however many questions actually have a miss, so
 * a topic with fewer misses than half its pool never runs out of misses to
 * reserve (the remainder step below absorbs the rest of the pool as usual).
 */
export function splitReservedAndRemainder<T extends { id: string }>(
  pool: readonly T[],
  weights: Map<string, number>,
  qWeights: readonly QuestionWeight[],
  reservedShare: number = RESERVED_MISS_SHARE,
  rng: () => number = Math.random,
): T[] {
  const missedIds = new Set(
    qWeights.filter((w) => w.weaknessScore > 0).map((w) => w.mcqId),
  );

  const reservedCount = Math.min(
    Math.floor(pool.length * reservedShare),
    missedIds.size,
  );

  const reserved = pool
    .filter((item) => missedIds.has(item.id))
    .sort((a, b) => (weights.get(b.id) ?? 0) - (weights.get(a.id) ?? 0))
    .slice(0, reservedCount);

  const reservedIds = new Set(reserved.map((item) => item.id));
  const remainderPool = pool.filter((item) => !reservedIds.has(item.id));
  const remainder = weightedSampleOrder(remainderPool, weights, rng);

  return [...reserved, ...remainder];
}
