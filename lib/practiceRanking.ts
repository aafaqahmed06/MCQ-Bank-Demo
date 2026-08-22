import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getPracticeQuestions } from "@/lib/curriculum";
import type { MCQ } from "@/types";

/**
 * Within-topic weakness ranking for practice mode (docs/MASTER_KB.md
 * "Weakness Detection" / "Adaptive Practice" sections): reweight question
 * order using this student's own attempt history on those specific
 * questions -- miss rate and recency -- instead of pure random order.
 *
 * Signal source: this user's `practice_attempts` rows AND their
 * `exam_answers` history for the same mcq_id (read-only join into exam
 * tables -- exam mode itself is never touched). Constants mirror the SQL
 * copy in supabase/migrations/20260708000030_smart_practice.sql
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
 * Reuses getPracticeQuestions() for the candidate pool unchanged, merges
 * this user's practice_attempts + exam_answers for those mcq ids into
 * AttemptStats, and returns a weighted-random order plus the full weight
 * breakdown (never opaque -- debuggable).
 */
export async function getWeightedPracticeQuestions(
  moduleId: string,
  topicNames?: string[],
): Promise<{ questions: MCQ[]; weights: QuestionWeight[] }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { questions: [], weights: [] };

  const questions = await getPracticeQuestions(moduleId, topicNames);
  if (questions.length === 0) return { questions: [], weights: [] };

  const mcqIds = questions.map((q) => q.id);

  const [{ data: practiceRows }, { data: examRows }] = await Promise.all([
    supabase
      .from("practice_attempts")
      .select("mcq_id, is_correct, attempted_at")
      .in("mcq_id", mcqIds),
    supabase
      .from("exam_answers")
      .select("mcq_id, is_correct, answered_at")
      .in("mcq_id", mcqIds)
      .not("is_correct", "is", null),
  ]);

  const statsByMcq = new Map<string, AttemptStats>();
  const fold = (mcqId: string, isCorrect: boolean, ts: string | null) => {
    const existing = statsByMcq.get(mcqId) ?? {
      mcqId,
      attempts: 0,
      misses: 0,
      lastAttemptedAt: null,
    };
    existing.attempts += 1;
    if (!isCorrect) existing.misses += 1;
    if (ts && (!existing.lastAttemptedAt || ts > existing.lastAttemptedAt)) {
      existing.lastAttemptedAt = ts;
    }
    statsByMcq.set(mcqId, existing);
  };

  for (const row of practiceRows ?? []) {
    fold(row.mcq_id as string, row.is_correct as boolean, row.attempted_at as string | null);
  }
  for (const row of examRows ?? []) {
    fold(row.mcq_id as string, row.is_correct as boolean, row.answered_at as string | null);
  }

  const weights = computeQuestionWeights(mcqIds, statsByMcq);
  const weightMap = new Map(weights.map((w) => [w.mcqId, w.finalWeight]));
  const orderedQuestions = weightedSampleOrder(questions, weightMap);

  return { questions: orderedQuestions, weights };
}
